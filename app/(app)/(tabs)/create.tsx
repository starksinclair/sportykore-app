import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { useAuthGate } from "@/auth";
import { Button } from "@/components/ui/Button";
import { CountryLabel } from "@/components/ui/CountryFlag";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { CountryPicker } from "@/components/ui/country-picker";
import { Logo } from "@/components/ui/logo";
import { LogoImageUpload } from "@/components/ui/logo-image-upload";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { colors, scoreboardPattern } from "@/constants";
import { useCreateLeague } from "@/league/hooks";
import {
  DIVISION_OPTIONS,
  type CountryOption,
} from "@/league/league-create-constants";
import type { PickedImageFile } from "@/lib/picked-image";
import { fonts } from "@/theme/fonts";

const TOTAL_STEPS = 3;

type TeamRow = {
  id: string;
  name: string;
  logo: PickedImageFile | null;
};

function newTeamRow(): TeamRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", logo: null };
}

export default function CreateScreen() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [description, setDescription] = useState("");
  const [leagueLogo, setLeagueLogo] = useState<PickedImageFile | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [city, setCity] = useState("");
  const [divisionId, setDivisionId] = useState<(typeof DIVISION_OPTIONS)[number]["id"]>("open");

  const [teams, setTeams] = useState<TeamRow[]>(() => [
    { id: "t1", name: "", logo: null },
    { id: "t2", name: "", logo: null },
  ]);

  const [stepError, setStepError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const createLeagueMutation = useCreateLeague();
  const { requireAuth } = useAuthGate();

  const step1Valid =
    name.trim().length > 0 && season.trim().length > 0 && selectedCountry !== null;

  const namedTeams = teams.filter((t) => t.name.trim().length > 0);
  const step2Valid = namedTeams.length >= 2;

  const goNext = () => {
    setStepError(null);
    if (step === 1) {
      if (!step1Valid) {
        setStepError("Add a league name, season, and country to continue.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!step2Valid) {
        setStepError("Add at least two teams with names.");
        return;
      }
      setStep(3);
    }
  };

  const handleCreate = async () => {
    setStepError(null);
    if (!requireAuth({ action: "create a league" })) {
      return;
    }
    try {
      await createLeagueMutation.mutateAsync({
        name: name.trim(),
        seasonName: season.trim(),
        countryId: selectedCountry!.id,
        description: description.trim() || undefined,
        gender: divisionId !== "open" ? divisionId : undefined,
        logo: leagueLogo ?? undefined,
        teams: namedTeams.map((team) => ({
          name: team.name.trim(),
          logo: team.logo ?? undefined,
        })),
      });
      setCreated(true);
    } catch (err) {
      console.error("Failed to create league", err);
      if (err instanceof ApiError && err.status === 401) {
        setStepError("Please create an account first to create a league.");
      } else {
        setStepError(err instanceof Error ? err.message : "Failed to create league. Try again.");
      }
    }
  };

  const goBack = () => {
    setStepError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  const addTeam = () => {
    setTeams((t) => [...t, newTeamRow()]);
  };

  const removeTeam = (id: string) => {
    setTeams((t) => (t.length <= 2 ? t : t.filter((row) => row.id !== id)));
  };

  const updateTeamName = (id: string, text: string) => {
    setTeams((rows) =>
      rows.map((row) => (row.id === id ? { ...row, name: text } : row)),
    );
  };

  const updateTeamLogo = (id: string, logo: PickedImageFile | null) => {
    setTeams((rows) =>
      rows.map((row) => (row.id === id ? { ...row, logo } : row)),
    );
  };

  const resetWizard = () => {
    setStep(1);
    setName("");
    setSeason("");
    setDescription("");
    setLeagueLogo(null);
    setSelectedCountry(null);
    setCity("");
    setDivisionId("open");
    setTeams([
      { id: "t1", name: "", logo: null },
      { id: "t2", name: "", logo: null },
    ]);
    setStepError(null);
    setCreated(false);
    createLeagueMutation.reset();
  };

  const progress = step / TOTAL_STEPS;

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
      <OfflineBanner />
      <BlackPatternBackground
        baseColor={scoreboardPattern().baseColor}
        stripeColor={scoreboardPattern().stripeColor}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-6">
            <View className="gap-2">
              <Logo variant="full" color={colors.accent} fontSize={28} lineHeight={38} />
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[26px] leading-8 text-white"
              >
                Create a league
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-sm leading-6 text-white/70"
              >
                Three quick steps — you can adjust details later from Manage once the league
                goes live.
              </Text>
            </View>

            <View className="gap-2">
              <View className="h-2 overflow-hidden rounded-full bg-white/15">
                <View
                  className="h-2 rounded-full"
                  style={{ width: `${progress * 100}%`, backgroundColor: colors.accent }}
                />
              </View>
              <View className="flex-row justify-between">
                {["Basics", "Teams", "Review"].map((label, i) => (
                  <Text
                    key={label}
                    style={{
                      fontFamily: i + 1 === step ? fonts.bodyBold : fonts.bodySemibold,
                    }}
                    className={
                      i + 1 === step ? "text-xs text-[#E6A817]" : "text-xs text-white/45"
                    }
                  >
                    {i + 1}. {label}
                  </Text>
                ))}
              </View>
            </View>

            {stepError ? (
              <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <Text style={{ fontFamily: fonts.bodySemibold }} className="text-sm text-red-900">
                  {stepError}
                </Text>
              </View>
            ) : null}

            <View className="rounded-[28px] bg-white px-5 py-6">
              {step === 1 ? (
                <StepBasics
                  name={name}
                  setName={setName}
                  season={season}
                  setSeason={setSeason}
                  description={description}
                  setDescription={setDescription}
                  leagueLogo={leagueLogo}
                  onLeagueLogoChange={setLeagueLogo}
                  city={city}
                  setCity={setCity}
                  divisionId={divisionId}
                  setDivisionId={setDivisionId}
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                />
              ) : null}

              {step === 2 ? (
                <StepTeams
                  teams={teams}
                  onChangeName={updateTeamName}
                  onChangeLogo={updateTeamLogo}
                  onAdd={addTeam}
                  onRemove={removeTeam}
                />
              ) : null}

              {step === 3 ? (
                <StepReview
                  name={name}
                  season={season}
                  description={description}
                  leagueLogo={leagueLogo}
                  country={selectedCountry ?? undefined}
                  city={city}
                  divisionId={divisionId}
                  teams={namedTeams}
                  created={created}
                />
              ) : null}
            </View>

            <View className="gap-3">
              {step < 3 || !created ? (
                <View className="flex-row gap-3">
                  {step > 1 ? (
                    <Button
                      variant="secondary"
                      label="Back"
                      className="flex-1"
                      onPress={goBack}
                      disabled={createLeagueMutation.isPending}
                    />
                  ) : null}
                  <Button
                    variant="primary"
                    label={step === 3 ? "Create League" : "Continue"}
                    className="flex-1"
                    onPress={step === 3 ? handleCreate : goNext}
                    loading={createLeagueMutation.isPending}
                  />
                </View>
              ) : (
                <Button variant="signInYellow" label="Done" onPress={resetWizard} />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function StepBasics({
  name,
  setName,
  season,
  setSeason,
  description,
  setDescription,
  leagueLogo,
  onLeagueLogoChange,
  city,
  setCity,
  divisionId,
  setDivisionId,
  selectedCountry,
  onSelectCountry,
}: {
  name: string;
  setName: (v: string) => void;
  season: string;
  setSeason: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  leagueLogo: PickedImageFile | null;
  onLeagueLogoChange: (file: PickedImageFile | null) => void;
  city: string;
  setCity: (v: string) => void;
  divisionId: (typeof DIVISION_OPTIONS)[number]["id"];
  setDivisionId: (v: (typeof DIVISION_OPTIONS)[number]["id"]) => void;
  selectedCountry: CountryOption | null;
  onSelectCountry: (country: CountryOption) => void;
}) {
  return (
    <View className="gap-4">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        Step 1 — League basics
      </Text>

      <LogoImageUpload
        label="League logo (optional)"
        value={leagueLogo}
        onChange={onLeagueLogoChange}
        size="lg"
        accessibilityLabel="League logo"
      />

      <AuthTextField
        label="League name"
        placeholder="e.g. Surulere Sunday League"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <AuthTextField
        label="Season"
        placeholder="e.g. 2025/26"
        value={season}
        onChangeText={setSeason}
        autoCapitalize="none"
      />

      <CountryPicker value={selectedCountry} onChange={onSelectCountry} />

      <AuthTextField
        label="City / area (optional)"
        placeholder="e.g. Lagos Mainland"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
      />

      <LabelBlock label="Division / band (optional)">
        <View className="flex-row flex-wrap gap-2">
          {DIVISION_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              selected={divisionId === opt.id}
              label={opt.label}
              onPress={() => setDivisionId(opt.id)}
            />
          ))}
        </View>
      </LabelBlock>

      <View className="gap-1.5">
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className="text-[11px] uppercase tracking-wider text-slate-500"
        >
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Rules, venues, contacts…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{
            fontFamily: fonts.body,
            minHeight: 100,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: "#F5F5F5",
          }}
          className="border border-transparent text-base text-neutral-950"
        />
      </View>
    </View>
  );
}

function LabelBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-wider text-slate-500"
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        "rounded-full border px-3 py-2",
        selected ? "border-[#4A148C] bg-[#F3E8FF]" : "border-neutral-200 bg-neutral-50",
      ].join(" ")}
    >
      <Text
        style={{ fontFamily: selected ? fonts.bodyBold : fonts.bodySemibold }}
        className={selected ? "text-xs text-[#4A148C]" : "text-xs text-neutral-800"}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StepTeams({
  teams,
  onChangeName,
  onChangeLogo,
  onAdd,
  onRemove,
}: {
  teams: TeamRow[];
  onChangeName: (id: string, name: string) => void;
  onChangeLogo: (id: string, logo: PickedImageFile | null) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View className="gap-4">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        Step 2 — Teams
      </Text>
      <Text style={{ fontFamily: fonts.body }} className="text-sm leading-6 text-slate-600">
        Add at least two teams. You can add logos now or update them later from Manage.
      </Text>

      <View className="gap-3">
        {teams.map((row, index) => (
          <View key={row.id} className="flex-row items-center gap-2">
            <View className="mt-7">
              <LogoImageUpload
                value={row.logo}
                onChange={(logo) => onChangeLogo(row.id, logo)}
                size="sm"
                compact
                accessibilityLabel={`Team ${index + 1} logo`}
              />
            </View>
            <View className="flex-1">
              <AuthTextField
                label={`Team ${index + 1}`}
                placeholder="Team name"
                value={row.name}
                onChangeText={(t) => onChangeName(row.id, t)}
                autoCapitalize="words"
              />
            </View>
            {teams.length > 2 ? (
              <Pressable
                accessibilityLabel={`Remove team ${index + 1}`}
                onPress={() => onRemove(row.id)}
                className="mt-8 h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 active:bg-neutral-200"
              >
                <Ionicons name="trash-outline" size={20} color="#6B7280" />
              </Pressable>
            ) : (
              <View className="mt-8 w-11" />
            )}
          </View>
        ))}
      </View>

      <Pressable
        onPress={onAdd}
        className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-[#4A148C] bg-[#FAF5FF] py-3 active:opacity-80"
      >
        <Ionicons name="add-circle-outline" size={22} color={colors.brand} />
        <Text style={{ fontFamily: fonts.bodyBold }} className="text-sm text-[#4A148C]">
          Add another team
        </Text>
      </Pressable>
    </View>
  );
}

function StepReview({
  name,
  season,
  description,
  leagueLogo,
  country,
  city,
  divisionId,
  teams,
  created,
}: {
  name: string;
  season: string;
  description: string;
  leagueLogo: PickedImageFile | null;
  country: CountryOption | undefined;
  city: string;
  divisionId: string;
  teams: TeamRow[];
  created: boolean;
}) {
  const divisionLabel =
    DIVISION_OPTIONS.find((d) => d.id === divisionId)?.label ?? divisionId;


  return (
    <View className="gap-5">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        Step 3 — Review
      </Text>

      <View className="gap-3 rounded-2xl bg-neutral-50 px-4 py-4">
        <SummaryLine label="League">
          <View className="flex-row items-center gap-3">
            {leagueLogo ? (
              <Image
                source={{ uri: leagueLogo.uri }}
                style={{ width: 40, height: 40, borderRadius: 12 }}
                contentFit="cover"
              />
            ) : null}
            <Text style={{ fontFamily: fonts.bodySemibold }} className="text-base text-neutral-950">
              {name}
            </Text>
          </View>
        </SummaryLine>
        <SummaryLine label="Season" value={season} />
        {country ? (
          <SummaryLine label="Country">
            <CountryLabel
              code={country.code}
              name={country.name}
              flagWidth={18}
              textClassName="text-base text-neutral-950"
              textStyle={{ fontFamily: fonts.bodySemibold }}
            />
          </SummaryLine>
        ) : null}
        {city.trim() ? <SummaryLine label="City / area" value={city.trim()} /> : null}
        <SummaryLine label="Division" value={divisionLabel} />
        {description.trim() ? (
          <View className="gap-1 pt-1">
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Description
            </Text>
            <Text style={{ fontFamily: fonts.body }} className="text-sm text-neutral-800">
              {description.trim()}
            </Text>
          </View>
        ) : null}
        <View className="mt-1 border-t border-neutral-200 pt-3">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="mb-2 text-xs uppercase tracking-wide text-slate-500"
          >
            Teams ({teams.length})
          </Text>
          {teams.map((team) => (
            <View key={team.id} className="flex-row items-center gap-2 py-0.5">
              {team.logo ? (
                <Image
                  source={{ uri: team.logo.uri }}
                  style={{ width: 24, height: 24, borderRadius: 8 }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-6 w-6 rounded-lg bg-neutral-200" />
              )}
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className="text-sm text-neutral-900"
              >
                {team.name.trim()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {created ? (
        <View className="flex-row gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <Ionicons name="checkmark-circle-outline" size={22} color="#15803d" style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm leading-5 text-green-950">
            Your league is live. Head to the Manage tab to schedule games, invite players, and
            generate team invite links.
          </Text>
        </View>
      ) : (
        <View className="flex-row gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Ionicons name="information-circle-outline" size={22} color={colors.brand} style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm leading-5 text-amber-950">
            After creating your league, open Manage to generate invite links per team and add
            players to the roster.
          </Text>
        </View>
      )}
    </View>
  );
}

function SummaryLine({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <View className="gap-0.5">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-xs uppercase tracking-wide text-slate-500"
      >
        {label}
      </Text>
      {children ?? (
        <Text style={{ fontFamily: fonts.bodySemibold }} className="text-base text-neutral-950">
          {value}
        </Text>
      )}
    </View>
  );
}



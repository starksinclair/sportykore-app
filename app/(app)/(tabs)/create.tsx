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

import type { CompetitionFormat } from "@/api/entities";
import { ApiError } from "@/api/errors";
import { useAuthGate } from "@/auth";
import { Button } from "@/components/ui/Button";
import { CountryLabel } from "@/components/ui/CountryFlag";
import { AuthTextField } from "@/components/ui/auth-text-field";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { CountryPicker } from "@/components/ui/country-picker";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { LogoImageUpload } from "@/components/ui/logo-image-upload";
import { NativeDatePickerField } from "@/components/ui/native-date-picker-field";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { colors, scoreboardPattern } from "@/constants";
import {
  GroupFormatConfigControl,
  buildDefaultGroupConfig,
  type GroupFormatFormState,
} from "@/groups";
import {
  KnockoutTieFormatControl,
  buildKnockoutConfig,
  type TieFormatSelection,
} from "@/knockout";
import { CompetitionFormatPicker } from "@/league/components/CompetitionFormatPicker";
import { TiebreakerPicker } from "@/league/components/TiebreakerPicker";
import { useCreateLeague } from "@/league/hooks";
import {
  DIVISION_OPTIONS,
  type CountryOption,
} from "@/league/league-create-constants";
import {
  DEFAULT_TIEBREAKER,
  tiebreakerLabel,
  type TiebreakerRule,
} from "@/league/tiebreaker-options";
import { parseCalendarDate } from "@/lib/datetime";
import { pickCompetitionLogo } from "@/lib/pick-competition-logo";
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
  const season = String(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [leagueLogo, setLeagueLogo] = useState<PickedImageFile | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [city, setCity] = useState("");
  const [divisionId, setDivisionId] = useState<(typeof DIVISION_OPTIONS)[number]["id"]>("open");
  const [tiebreakerId, setTiebreakerId] = useState<TiebreakerRule>(DEFAULT_TIEBREAKER);
  const [format, setFormat] = useState<CompetitionFormat>("league");
  const [knockoutName, setKnockoutName] = useState("Cup");
  const [tieFormat, setTieFormat] = useState<TieFormatSelection>({ kind: "single" });
  const [hasThirdPlace, setHasThirdPlace] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupFormatFormState>({
    groupCount: 2,
    doubleRoundRobin: false,
    perGroup: 2,
  });

  const [teams, setTeams] = useState<TeamRow[]>(() => [
    { id: "t1", name: "", logo: null },
    { id: "t2", name: "", logo: null },
  ]);

  const [stepError, setStepError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const createLeagueMutation = useCreateLeague();
  const { requireAuth } = useAuthGate();

  const durationError = validateLeagueDuration(startDate, endDate);
  const step1Valid =
    name.trim().length > 0 &&
    selectedCountry !== null &&
    Boolean(format) &&
    startDate.trim().length > 0 &&
    endDate.trim().length > 0 &&
    durationError === null;

  const namedTeams = teams.filter((t) => t.name.trim().length > 0);
  const step2Valid = namedTeams.length >= 2;

  const goNext = () => {
    setStepError(null);
    if (step === 1) {
      if (!step1Valid) {
        setStepError(
          durationError ??
            "Add competition name, country, format, and start/end dates to continue.",
        );
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
    if (!requireAuth({ action: "create a competition" })) {
      return;
    }
    const createDurationError = validateLeagueDuration(startDate, endDate);
    if (createDurationError) {
      setStepError(createDurationError);
      return;
    }
    try {
      await createLeagueMutation.mutateAsync({
        name: name.trim(),
        seasonName: season.trim(),
        countryId: selectedCountry!.id,
        description: description.trim() || undefined,
        gender: divisionId !== "open" ? divisionId : undefined,
        tiebreaker: format === "league" ? tiebreakerId : undefined,
        logo: leagueLogo ?? undefined,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        format,
        knockout:
          format === "knockout"
            ? {
                name: knockoutName.trim() || "Cup",
                seed: true,
                config: buildKnockoutConfig(tieFormat, hasThirdPlace),
              }
            : undefined,
        group:
          format === "group"
            ? {
                name: "Group Stage",
                config: buildDefaultGroupConfig({
                  groupCount: groupForm.groupCount,
                  doubleRoundRobin: groupForm.doubleRoundRobin,
                  perGroup: groupForm.perGroup,
                }),
              }
            : undefined,
        teams: namedTeams.map((team) => ({
          name: team.name.trim(),
          logo: team.logo ?? undefined,
        })),
      });
      setCreated(true);
    } catch (err) {
      console.error("Failed to create competition", err);
      if (err instanceof ApiError && err.status === 401) {
        setStepError("Please create an account first to create a competition.");
      } else {
        setStepError(err instanceof Error ? err.message : "Failed to create competition. Try again.");
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
    setStartDate("");
    setEndDate("");
    setDescription("");
    setLeagueLogo(null);
    setSelectedCountry(null);
    setCity("");
    setDivisionId("open");
    setTiebreakerId(DEFAULT_TIEBREAKER);
    setFormat("league");
    setKnockoutName("Cup");
    setTieFormat({ kind: "single" });
    setHasThirdPlace(false);
    setGroupForm({
      groupCount: 2,
      doubleRoundRobin: false,
      perGroup: 2,
    });
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
              {/* <Logo variant="full" color={colors.accent} fontSize={28} lineHeight={38} /> */}
              <Text
                style={{ fontFamily: fonts.bodyBold }}
                className="text-[26px] leading-8 text-white"
              >
                Create a competition
              </Text>
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-sm leading-6 text-white/70"
              >
                Three quick steps - pick a league, groups, or knockout cup, then manage it live.
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
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  description={description}
                  setDescription={setDescription}
                  leagueLogo={leagueLogo}
                  onLeagueLogoChange={setLeagueLogo}
                  city={city}
                  setCity={setCity}
                  divisionId={divisionId}
                  setDivisionId={setDivisionId}
                  tiebreakerId={tiebreakerId}
                  setTiebreakerId={setTiebreakerId}
                  format={format}
                  setFormat={setFormat}
                  knockoutName={knockoutName}
                  setKnockoutName={setKnockoutName}
                  tieFormat={tieFormat}
                  setTieFormat={setTieFormat}
                  hasThirdPlace={hasThirdPlace}
                  setHasThirdPlace={setHasThirdPlace}
                  groupForm={groupForm}
                  setGroupForm={setGroupForm}
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                />
              ) : null}

              {step === 2 ? (
                <StepTeams
                  teams={teams}
                  format={format}
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
                  startDate={startDate}
                  endDate={endDate}
                  description={description}
                  leagueLogo={leagueLogo}
                  country={selectedCountry ?? undefined}
                  city={city}
                  divisionId={divisionId}
                  tiebreakerId={tiebreakerId}
                  format={format}
                  knockoutName={knockoutName}
                  tieFormat={tieFormat}
                  hasThirdPlace={hasThirdPlace}
                  groupForm={groupForm}
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
                    label={step === 3 ? "Create" : "Continue"}
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
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  description,
  setDescription,
  leagueLogo,
  onLeagueLogoChange,
  city,
  setCity,
  divisionId,
  setDivisionId,
  tiebreakerId,
  setTiebreakerId,
  format,
  setFormat,
  knockoutName,
  setKnockoutName,
  tieFormat,
  setTieFormat,
  hasThirdPlace,
  setHasThirdPlace,
  groupForm,
  setGroupForm,
  selectedCountry,
  onSelectCountry,
}: {
  name: string;
  setName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  leagueLogo: PickedImageFile | null;
  onLeagueLogoChange: (file: PickedImageFile | null) => void;
  city: string;
  setCity: (v: string) => void;
  divisionId: (typeof DIVISION_OPTIONS)[number]["id"];
  setDivisionId: (v: (typeof DIVISION_OPTIONS)[number]["id"]) => void;
  tiebreakerId: TiebreakerRule;
  setTiebreakerId: (v: TiebreakerRule) => void;
  format: CompetitionFormat;
  setFormat: (v: CompetitionFormat) => void;
  knockoutName: string;
  setKnockoutName: (v: string) => void;
  tieFormat: TieFormatSelection;
  setTieFormat: (v: TieFormatSelection) => void;
  hasThirdPlace: boolean;
  setHasThirdPlace: (v: boolean) => void;
  groupForm: GroupFormatFormState;
  setGroupForm: (v: GroupFormatFormState) => void;
  selectedCountry: CountryOption | null;
  onSelectCountry: (country: CountryOption) => void;
}) {
  return (
    <View className="gap-4">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        Step 1 - Competition basics
      </Text>

      <CompetitionFormatPicker
        value={format}
        onChange={setFormat}
        required
      />

      <AuthTextField
        label="Competition name"
        required
        placeholder="e.g. Surulere Sunday League"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <View className="gap-2">
        <FormFieldLabel label="Competition duration" required />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <NativeDatePickerField
              label="Start date"
              placeholder="Pick start date"
              value={startDate}
              onChange={(value) => setStartDate(value ?? "")}
              maximumDate={parseCalendarDate(endDate) ?? undefined}
            />
          </View>
          <View className="flex-1">
            <NativeDatePickerField
              label="End date"
              placeholder="Pick end date"
              value={endDate}
              onChange={(value) => setEndDate(value ?? "")}
              minimumDate={parseCalendarDate(startDate) ?? undefined}
            />
          </View>
        </View>
      </View>

      <CountryPicker
        value={selectedCountry}
        onChange={onSelectCountry}
        required
      />

      <AuthTextField
        label="City / area"
        placeholder="e.g. Lagos Mainland"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
      />

      <LabelBlock label="Division / band">
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

      {format === "league" ? (
        <TiebreakerPicker
          value={tiebreakerId}
          onChange={setTiebreakerId}
          variant="light"
        />
      ) : format === "knockout" ? (
        <View className="gap-3">
          <AuthTextField
            label="Knockout stage name"
            value={knockoutName}
            onChangeText={setKnockoutName}
            placeholder="Cup"
          />
          <KnockoutTieFormatControl
            value={tieFormat}
            onChange={setTieFormat}
            hasThirdPlace={hasThirdPlace}
            onHasThirdPlaceChange={setHasThirdPlace}
            tone="light"
          />
        </View>
      ) : (
        <GroupFormatConfigControl value={groupForm} onChange={setGroupForm} />
      )}

      <View className="gap-1.5">
        <FormFieldLabel label="Description" />
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

      <LogoImageUpload
        label="Logo"
        value={leagueLogo}
        onChange={onLeagueLogoChange}
        size="lg"
        layout="centered"
        onPick={pickCompetitionLogo}
        hint="Recommend image: 150x150 px, png only, max 5mb, keep logo centered, clear background"
        accessibilityLabel="Competition logo"
      />
    </View>
  );
}

function LabelBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <FormFieldLabel label={label} />
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
  format,
  onChangeName,
  onChangeLogo,
  onAdd,
  onRemove,
}: {
  teams: TeamRow[];
  format: CompetitionFormat;
  onChangeName: (id: string, name: string) => void;
  onChangeLogo: (id: string, logo: PickedImageFile | null) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View className="gap-4">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        Step 2 - Teams
      </Text>
      <Text style={{ fontFamily: fonts.body }} className="text-sm leading-6 text-slate-600">
        {format === "knockout"
          ? "Add at least two teams. List order is seeding (first listed = seed 1)."
          : format === "group"
            ? "Add enrolled teams. You’ll assign them to groups from Manage → Groups."
            : "Add at least two teams. You can add logos now or update them later from Manage."}
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
  startDate,
  endDate,
  description,
  leagueLogo,
  country,
  city,
  divisionId,
  tiebreakerId,
  format,
  knockoutName,
  tieFormat,
  hasThirdPlace,
  groupForm,
  teams,
  created,
}: {
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  description: string;
  leagueLogo: PickedImageFile | null;
  country: CountryOption | undefined;
  city: string;
  divisionId: string;
  tiebreakerId: TiebreakerRule;
  format: CompetitionFormat;
  knockoutName: string;
  tieFormat: TieFormatSelection;
  hasThirdPlace: boolean;
  groupForm: GroupFormatFormState;
  teams: TeamRow[];
  created: boolean;
}) {
  const divisionLabel =
    DIVISION_OPTIONS.find((d) => d.id === divisionId)?.label ?? divisionId;

  const durationLabel = formatDurationSummary(startDate, endDate);
  const formatLabel =
    format === "knockout"
      ? "Knockouts"
      : format === "group"
        ? "Groups"
        : "League (round-robin)";
  const tieFormatLabel =
    tieFormat.kind === "single"
      ? "Single match"
      : tieFormat.kind === "two_legged"
        ? "Home & away"
        : `Best of ${tieFormat.bestOf}`;

  return (
    <View className="gap-5">
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-neutral-950">
        Step 3 - Review
      </Text>

      <View className="gap-3 rounded-2xl bg-neutral-50 px-4 py-4">
        <SummaryLine label="Competition">
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
        <SummaryLine label="Format" value={formatLabel} />
        {format === "knockout" ? (
          <>
            <SummaryLine label="Knockout stage" value={knockoutName.trim() || "Cup"} />
            <SummaryLine label="Tie format" value={tieFormatLabel} />
            <SummaryLine
              label="Third place"
              value={hasThirdPlace ? "Yes" : "No"}
            />
          </>
        ) : format === "group" ? (
          <>
            <SummaryLine label="Groups" value={String(groupForm.groupCount)} />
            <SummaryLine
              label="Round robin"
              value={groupForm.doubleRoundRobin ? "Home & away" : "Single"}
            />
            <SummaryLine
              label="Advance per group"
              value={String(groupForm.perGroup)}
            />
          </>
        ) : (
          <SummaryLine label="Tiebreaker" value={tiebreakerLabel(tiebreakerId)} />
        )}
        <SummaryLine label="Duration" value={durationLabel} />
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
            Your competition is live. Open Manage to schedule games, seed a cup bracket, or
            invite players.
          </Text>
        </View>
      ) : (
        <View className="flex-row gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Ionicons name="information-circle-outline" size={22} color={colors.brand} style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: fonts.body }} className="flex-1 text-sm leading-5 text-amber-950">
            After creating, open Manage to invite players or finish knockout seeding if needed.
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

function validateLeagueDuration(startDate: string, endDate: string): string | null {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start || !end) {
    return "Enter start and end dates for the competition.";
  }
  if (!parseCalendarDate(start)) {
    return "Start date must be YYYY-MM-DD.";
  }
  if (!parseCalendarDate(end)) {
    return "End date must be YYYY-MM-DD.";
  }
  const startParsed = parseCalendarDate(start)!;
  const endParsed = parseCalendarDate(end)!;
  if (endParsed.getTime() < startParsed.getTime()) {
    return "End date must be on or after the start date.";
  }
  return null;
}

function formatDurationSummary(startDate: string, endDate: string): string {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) return "-";
  if (start && end) return `${start} → ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

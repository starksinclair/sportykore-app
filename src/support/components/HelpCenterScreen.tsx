import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors, scoreboardPattern } from "@/constants";
import { posthog } from "@/lib/posthog";
import {
  showErrorToast,
  showSuccessToast,
  showThrownAsToast,
} from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";
import {
  HELP_CENTER_ARTICLES,
  HELP_CENTER_CATEGORIES,
  type HelpCenterArticle,
  type HelpCenterCategoryId
} from "../faq-data";
import { useHelpCenterFaqs, useSubmitBugReport } from "../hooks";
import type {
  BugReportInput,
  BugReportType,
  HelpCenterArticleDto,
} from "../types";

type CategoryFilter = "all" | HelpCenterCategoryId;

const allCategory = {
  id: "all" as const,
  title: "All",
  icon: "apps-outline" as const,
};

const reportTypes: { id: BugReportType; label: string }[] = [
  { id: "bug", label: "Bug" },
  { id: "confusing_flow", label: "Confusing flow" },
  { id: "feature_request", label: "Feature request" },
  { id: "account_access", label: "Account/access" },
  { id: "other", label: "Other" },
];

export function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const faqsQuery = useHelpCenterFaqs();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(
    HELP_CENTER_ARTICLES[0]?.id ?? null,
  );
  const articles = useMemo(
    () => normalizeArticles(faqsQuery.data?.articles) ?? HELP_CENTER_ARTICLES,
    [faqsQuery.data?.articles],
  );

  useEffect(() => {
    if (!expandedId && articles[0]) {
      setExpandedId(articles[0].id);
    }
  }, [articles, expandedId]);

  const trimmedQuery = query.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        category === "all" || article.categoryId === category;

      if (!matchesCategory) return false;
      if (!trimmedQuery) return true;

      const haystack = [
        article.question,
        article.answer,
        ...article.tags,
        categoryLabel(article.categoryId),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(trimmedQuery);
    });
  }, [articles, category, trimmedQuery]);

  const selectedCategory =
    category === "all"
      ? null
      : HELP_CENTER_CATEGORIES.find((item) => item.id === category);

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar style="light" />
      <BlackPatternBackground
        baseColor={scoreboardPattern().baseColor}
        stripeColor={scoreboardPattern().stripeColor}
      />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-5 pb-3 pt-1">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
            <Text
              className="text-center text-base uppercase tracking-[2px] text-white/85"
              style={styles.headerText}
            >
              Help center
            </Text>
            <View className="h-11 w-11" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pb-10 pt-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] px-4 py-5">
            <View className="flex-row items-start gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-[18px] bg-accent-500">
                <Ionicons
                  name="help-buoy-outline"
                  size={23}
                  color={colors.darkLabel}
                />
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <Text
                  className="text-2xl leading-8 text-white"
                  style={[styles.heroTitleText, { fontFamily: fonts.displayBold }]}
                >
                  Get unstuck fast
                </Text>
                <Text
                  className="text-sm leading-6 text-white/60"
                  style={styles.secondaryText}
                >
                  Short answers for players, Team managers, and League admins.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
              <Ionicons name="search-outline" size={18} color={colors.accent} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search invites, standings, lineups"
                placeholderTextColor="rgba(255,255,255,0.42)"
                autoCapitalize="none"
                autoCorrect={false}
                className="min-w-0 flex-1 p-0 text-sm text-white"
                selectionColor={colors.accent}
                style={[styles.searchInputText, { fontFamily: fonts.body }]}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery("")}
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-5"
          >
            <CategoryChip
              label={allCategory.title}
              icon={allCategory.icon}
              selected={category === "all"}
              onPress={() => setCategory("all")}
            />
            {HELP_CENTER_CATEGORIES.map((item) => (
              <CategoryChip
                key={item.id}
                label={item.title}
                icon={item.icon}
                selected={category === item.id}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </ScrollView>

          {selectedCategory ? (
            <View className="rounded-[22px] border border-accent-400/20 bg-accent-500/10 px-4 py-4">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/20">
                  <Ionicons
                    name={selectedCategory.icon}
                    size={19}
                    color={colors.accent}
                  />
                </View>
                <View className="min-w-0 flex-1 gap-1">
                  <Text
                    className="text-base text-accent-100"
                    style={styles.accentText}
                  >
                    {selectedCategory.title}
                  </Text>
                  <Text
                    className="text-xs leading-5 text-accent-100/70"
                    style={styles.accentMutedText}
                  >
                    {selectedCategory.description}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-xs uppercase tracking-[2px] text-white/45"
                  style={styles.eyebrowText}
                >
                  Questions
                </Text>
                {faqsQuery.isFetching ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : null}
              </View>
              <Text className="text-xs text-white/40" style={styles.countText}>
                {filteredArticles.length} found
              </Text>
            </View>

            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <FaqArticleCard
                  key={article.id}
                  article={article}
                  expanded={expandedId === article.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === article.id ? null : article.id,
                    )
                  }
                />
              ))
            ) : (
              <EmptyFaqState onClear={() => {
                setQuery("");
                setCategory("all");
              }} />
            )}
          </View>

          <View className="gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color={colors.accent}
                />
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-base text-white" style={styles.primaryText}>
                  Still need help?
                </Text>
                <Text
                  className="text-xs leading-5 text-white/55"
                  style={styles.mutedText}
                >
                  Send a report and we will use it to improve the next build.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setReportOpen(true)}
              accessibilityRole="button"
              className="h-11 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-4 active:opacity-90"
            >
              <Ionicons
                name="bug-outline"
                size={17}
                color={colors.darkLabel}
              />
              <Text className="text-sm text-neutral-950" style={styles.darkText}>
                Report a problem
              </Text>
            </Pressable>
          </View>

          <Text
            className="px-1 text-center text-[11px] text-white/30"
            style={styles.footerText}
          >
            Help content {faqsQuery.data?.articles?.length ? "live" : "local"}
          </Text>
        </ScrollView>

        <BugReportSheet
          visible={reportOpen}
          email={user?.email}
          onClose={() => setReportOpen(false)}
        />
      </SafeAreaView>
    </View>
  );
}

function CategoryChip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={[
        "h-10 flex-row items-center gap-2 rounded-full border px-3 active:opacity-85",
        selected
          ? "border-accent-400 bg-accent-500"
          : "border-white/10 bg-white/[0.06]",
      ].join(" ")}
    >
      <Ionicons
        name={icon}
        size={15}
        color={selected ? colors.darkLabel : colors.accent}
      />
      <Text
        className={selected ? "text-xs text-neutral-950" : "text-xs text-white/75"}
        style={selected ? styles.darkText : styles.chipText}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FaqArticleCard({
  article,
  expanded,
  onToggle,
}: {
  article: HelpCenterArticle;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();

  return (
    <View className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04]">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={article.question}
        className="flex-row items-start gap-3 px-4 py-4 active:bg-white/5"
      >
        <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
          <Ionicons
            name={categoryIcon(article.categoryId)}
            size={17}
            color={colors.accent}
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base leading-6 text-white" style={styles.primaryText}>
            {article.question}
          </Text>
          <Text
            className="text-xs uppercase tracking-[1.5px] text-white/35"
            style={styles.metaText}
          >
            {categoryLabel(article.categoryId)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="rgba(255,255,255,0.6)"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-4 border-t border-white/10 px-4 pb-4 pt-3">
          <Text className="text-sm leading-6 text-white/68" style={styles.bodyText}>
            {article.answer}
          </Text>
          {article.relatedAction ? (
            <Pressable
              onPress={() => router.push(article.relatedAction?.route ?? "/profile")}
              accessibilityRole="button"
              className="self-start flex-row items-center gap-2 rounded-full border border-accent-400/40 bg-accent-500/10 px-3 py-2 active:bg-accent-500/15"
            >
              <Text className="text-xs text-accent-100" style={styles.accentText}>
                {article.relatedAction.label}
              </Text>
              <Ionicons
                name="arrow-forward-outline"
                size={14}
                color={colors.accent}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function EmptyFaqState({ onClear }: { onClear: () => void }) {
  return (
    <View className="items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-8">
      <View className="h-12 w-12 items-center justify-center rounded-[20px] bg-white/10">
        <Ionicons name="search-outline" size={23} color={colors.accent} />
      </View>
      <View className="gap-1">
        <Text className="text-center text-base text-white" style={styles.primaryText}>
          No matching questions
        </Text>
        <Text
          className="text-center text-sm leading-6 text-white/55"
          style={styles.mutedText}
        >
          Try another word or clear the filters.
        </Text>
      </View>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 active:bg-white/15"
      >
        <Text className="text-xs text-white" style={styles.primaryText}>
          Clear filters
        </Text>
      </Pressable>
    </View>
  );
}

function BugReportSheet({
  visible,
  email,
  onClose,
}: {
  visible: boolean;
  email?: string;
  onClose: () => void;
}) {
  const submitMutation = useSubmitBugReport();
  const [type, setType] = useState<BugReportType>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");

  useEffect(() => {
    if (!visible) return;
    setType("bug");
    setTitle("");
    setDescription("");
    setExpected("");
  }, [visible]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3 || trimmedDescription.length < 10) {
      showErrorToast("Report needs more detail", "Add a short title and describe what happened.");
      return;
    }

    const input: BugReportInput = {
      type,
      title: trimmedTitle,
      description: trimmedDescription,
      expected: expected.trim() || undefined,
      email,
      route: "/help-center",
      appVersion: Constants.expoConfig?.version,
      platform: Platform.OS,
      osVersion: String(Platform.Version),
    };

    try {
      await submitMutation.mutateAsync(input);
      posthog?.capture("support_report_submitted", {
        report_type: type,
        has_expected_outcome: Boolean(expected.trim()),
      });
      onClose();
      showSuccessToast("Report sent", "Thanks for helping improve SportyKore.");
    } catch (error) {
      showThrownAsToast(error, "Could not send report");
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Report a problem"
      subtitle="Tell us what happened. We will include basic app context automatically."
      variant="dark"
    >
      <View className="gap-4">
        <View className="gap-2">
          <Text
            className="text-xs uppercase tracking-[1.5px] text-white/45"
            style={styles.eyebrowText}
          >
            Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {reportTypes.map((item) => {
              const selected = type === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setType(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={[
                    "rounded-full border px-3 py-2 active:opacity-85",
                    selected
                      ? "border-accent-400 bg-accent-500"
                      : "border-white/10 bg-white/[0.06]",
                  ].join(" ")}
                >
                  <Text
                    className={
                      selected ? "text-xs text-neutral-950" : "text-xs text-white/75"
                    }
                    style={selected ? styles.darkText : styles.chipText}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ReportField
          label="Short title"
          value={title}
          onChangeText={setTitle}
          placeholder="Score button did not update"
          maxLength={140}
        />
        <ReportField
          label="What happened?"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell us the screen, action, and result."
          multiline
          minHeight={110}
          maxLength={4000}
        />
        <ReportField
          label="What did you expect?"
          value={expected}
          onChangeText={setExpected}
          placeholder="Optional"
          multiline
          minHeight={86}
          maxLength={2000}
        />

        <Pressable
          onPress={() => void handleSubmit()}
          disabled={submitMutation.isPending}
          accessibilityRole="button"
          className={[
            "h-12 flex-row items-center justify-center gap-2 rounded-full border border-accent-400 bg-accent-500 px-4 active:opacity-90",
            submitMutation.isPending ? "opacity-55" : "",
          ].join(" ")}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color={colors.darkLabel} />
          ) : (
            <Ionicons name="send-outline" size={17} color={colors.darkLabel} />
          )}
          <Text className="text-sm text-neutral-950">
            {submitMutation.isPending ? "Sending..." : "Send report"}
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function ReportField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  minHeight?: number;
  maxLength?: number;
}) {
  return (
    <View className="gap-1.5">
      <Text
        className="text-xs uppercase tracking-[1.5px] text-white/45"
        style={styles.eyebrowText}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.42)"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        maxLength={maxLength}
        className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-base text-white"
        selectionColor={colors.accent}
        style={[styles.reportInputText, { minHeight }]}
      />
    </View>
  );
}

function normalizeArticles(
  articles: HelpCenterArticleDto[] | undefined,
): HelpCenterArticle[] | null {
  if (!articles?.length) return null;

  const normalized = articles
    .filter(
      (article) =>
        isCategoryId(article.categoryId) &&
        article.question.trim().length > 0 &&
        article.answer.trim().length > 0,
    )
    .map((article) => ({
      id: article.id,
      categoryId: article.categoryId as HelpCenterCategoryId,
      question: article.question,
      answer: article.answer,
      tags: article.tags,
      relatedAction: article.relatedAction
        ? {
            label: article.relatedAction.label,
            route: article.relatedAction.route as Href,
          }
        : undefined,
    }));

  return normalized.length ? normalized : null;
}

function categoryLabel(categoryId: HelpCenterCategoryId) {
  return (
    HELP_CENTER_CATEGORIES.find((category) => category.id === categoryId)
      ?.title ?? "Help"
  );
}

function isCategoryId(value: string): value is HelpCenterCategoryId {
  return HELP_CENTER_CATEGORIES.some((category) => category.id === value);
}

function categoryIcon(categoryId: HelpCenterCategoryId) {
  return (
    HELP_CENTER_CATEGORIES.find((category) => category.id === categoryId)
      ?.icon ?? "help-circle-outline"
  );
}

const styles = StyleSheet.create({
  accentMutedText: {
    color: "rgba(254, 243, 199, 0.72)",
  },
  accentText: {
    color: "#FEF3C7",
  },
  bodyText: {
    color: "rgba(255, 255, 255, 0.72)",
  },
  chipText: {
    color: "rgba(255, 255, 255, 0.78)",
  },
  countText: {
    color: "rgba(255, 255, 255, 0.45)",
  },
  darkText: {
    color: colors.darkLabel,
  },
  eyebrowText: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.34)",
  },
  headerText: {
    color: "rgba(255, 255, 255, 0.88)",
  },
  heroTitleText: {
    color: colors.white,
  },
  metaText: {
    color: "rgba(255, 255, 255, 0.42)",
  },
  mutedText: {
    color: "rgba(255, 255, 255, 0.58)",
  },
  primaryText: {
    color: colors.white,
  },
  reportInputText: {
    color: colors.white,
  },
  searchInputText: {
    color: colors.white,
  },
  secondaryText: {
    color: "rgba(255, 255, 255, 0.64)",
  },
});

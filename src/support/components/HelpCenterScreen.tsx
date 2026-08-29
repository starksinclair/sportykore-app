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
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { colors } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
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
  const { isDark } = useAppearance();
  const theme = useTheme();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const tabletMaxWidth = isWideTablet ? 1080 : 860;
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;
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
  const handleClearFilters = () => {
    setQuery("");
    setCategory("all");
  };
  const questionsPanel = (
    <QuestionsPanel
      articles={filteredArticles}
      expandedId={expandedId}
      isFetching={faqsQuery.isFetching}
      onClear={handleClearFilters}
      onToggle={(articleId) =>
        setExpandedId((current) =>
          current === articleId ? null : articleId,
        )
      }
    />
  );
  const supportCard = (
    <SupportPromptCard onReport={() => setReportOpen(true)} />
  );
  const footer = (
    <Text
      className="px-1 text-center text-[11px]"
      style={[styles.footerText, { color: theme.textSubtle }]}
    >
      Help content {faqsQuery.data?.articles?.length ? "live" : "local"}
    </Text>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* <BlackPatternBackground
        baseColor={isDark ? scoreboardPattern().baseColor : theme.patternBase}
        stripeColor={isDark ? scoreboardPattern().stripeColor : theme.patternStripe}
      /> */}
      <View
        className="absolute inset-0"
        pointerEvents="none"
        style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.74)" }}
      />

      <SafeAreaView className="relative flex-1" edges={["top"]}>
        <View className="px-5 pb-3 pt-1">
          <View
            className="flex-row items-center justify-between"
            style={tabletFrameStyle}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.brandMuted }}
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <Text
              className="text-center text-base uppercase tracking-[2px]"
              style={[styles.headerText, { color: theme.text }]}
            >
              Help center
            </Text>
            <View className="h-11 w-11" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pb-10 pt-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            ...(isTablet ? { alignItems: "center" as const } : null),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full gap-5" style={tabletFrameStyle}>
            <View
              className="gap-4 rounded-[26px] border px-4 py-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
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
                    className="text-2xl leading-8"
                    style={[
                      styles.heroTitleText,
                      { color: theme.text, fontFamily: fonts.displayBold },
                    ]}
                  >
                    Get unstuck fast
                  </Text>
                  <Text
                    className="text-sm leading-6"
                    style={[styles.secondaryText, { color: theme.textMuted }]}
                  >
                    Short answers for players, Team managers, and League admins.
                  </Text>
                </View>
              </View>

              <View
                className="flex-row items-center gap-2 rounded-[18px] border px-4 py-3"
                style={{
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                }}
              >
                <Ionicons name="search-outline" size={18} color={theme.accent} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search invites, standings, lineups"
                  placeholderTextColor={theme.textSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="min-w-0 flex-1 p-0 text-sm"
                  selectionColor={theme.accent}
                  style={[
                    styles.searchInputText,
                    { color: theme.text, fontFamily: fonts.body },
                  ]}
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
                      color={theme.textSubtle}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {isTablet ? (
              <View className="flex-row items-start gap-5">
                <View
                  className="gap-5"
                  style={{ width: isWideTablet ? 320 : 288 }}
                >
                  <CategoryFilters
                    category={category}
                    onSelect={setCategory}
                    stacked
                  />
                  <SelectedCategoryCard category={selectedCategory} />
                  {supportCard}
                  {footer}
                </View>
                <View className="min-w-0 flex-1">
                  {questionsPanel}
                </View>
              </View>
            ) : (
              <>
                <CategoryFilters
                  category={category}
                  onSelect={setCategory}
                />
                <SelectedCategoryCard category={selectedCategory} />
                {questionsPanel}
                {supportCard}
                {footer}
              </>
            )}
          </View>
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

function CategoryFilters({
  category,
  onSelect,
  stacked = false,
}: {
  category: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
  stacked?: boolean;
}) {
  const theme = useTheme();
  const chips = (
    <>
      <CategoryChip
        label={allCategory.title}
        icon={allCategory.icon}
        selected={category === "all"}
        onPress={() => onSelect("all")}
        stacked={stacked}
      />
      {HELP_CENTER_CATEGORIES.map((item) => (
        <CategoryChip
          key={item.id}
          label={item.title}
          icon={item.icon}
          selected={category === item.id}
          onPress={() => onSelect(item.id)}
          stacked={stacked}
        />
      ))}
    </>
  );

  if (stacked) {
    return (
      <View
        className="gap-3 rounded-[24px] border px-4 py-4"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <Text
          className="text-xs uppercase tracking-[2px]"
          style={[styles.eyebrowText, { color: theme.textSubtle }]}
        >
          Browse by topic
        </Text>
        <View className="gap-2">
          {chips}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-5"
    >
      {chips}
    </ScrollView>
  );
}

function SelectedCategoryCard({
  category,
}: {
  category: (typeof HELP_CENTER_CATEGORIES)[number] | undefined | null;
}) {
  const theme = useTheme();

  if (!category) return null;

  return (
    <View
      className="rounded-[22px] border px-4 py-4"
      style={{
        backgroundColor: theme.accentMuted,
        borderColor: theme.accent,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.card }}
        >
          <Ionicons
            name={category.icon}
            size={19}
            color={theme.accent}
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="text-base"
            style={[styles.accentText, { color: theme.text }]}
          >
            {category.title}
          </Text>
          <Text
            className="text-xs leading-5"
            style={[styles.accentMutedText, { color: theme.textMuted }]}
          >
            {category.description}
          </Text>
        </View>
      </View>
    </View>
  );
}

function QuestionsPanel({
  articles,
  expandedId,
  isFetching,
  onClear,
  onToggle,
}: {
  articles: HelpCenterArticle[];
  expandedId: string | null;
  isFetching: boolean;
  onClear: () => void;
  onToggle: (articleId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-xs uppercase tracking-[2px]"
            style={[styles.eyebrowText, { color: theme.textSubtle }]}
          >
            Questions
          </Text>
          {isFetching ? (
            <ActivityIndicator color={theme.accent} size="small" />
          ) : null}
        </View>
        <Text
          className="text-xs"
          style={[styles.countText, { color: theme.textSubtle }]}
        >
          {articles.length} found
        </Text>
      </View>

      {articles.length > 0 ? (
        articles.map((article) => (
          <FaqArticleCard
            key={article.id}
            article={article}
            expanded={expandedId === article.id}
            onToggle={() => onToggle(article.id)}
          />
        ))
      ) : (
        <EmptyFaqState onClear={onClear} />
      )}
    </View>
  );
}

function SupportPromptCard({ onReport }: { onReport: () => void }) {
  const theme = useTheme();

  return (
    <View
      className="gap-3 rounded-[24px] border px-4 py-4"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={19}
            color={theme.accent}
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="text-base"
            style={[styles.primaryText, { color: theme.text }]}
          >
            Still need help?
          </Text>
          <Text
            className="text-xs leading-5"
            style={[styles.mutedText, { color: theme.textSubtle }]}
          >
            Send a report and we will use it to improve the next build.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onReport}
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
  );
}

function CategoryChip({
  label,
  icon,
  selected,
  onPress,
  stacked = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  stacked?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={[
        "h-10 flex-row items-center gap-2 rounded-full border px-3 active:opacity-85",
        stacked ? "justify-start" : "",
      ].join(" ")}
      style={{
        backgroundColor: selected ? theme.accent : theme.card,
        borderColor: selected ? theme.accent : theme.cardBorder,
      }}
    >
      <Ionicons
        name={icon}
        size={15}
        color={selected ? colors.darkLabel : theme.accent}
      />
      <Text
        className="text-xs"
        style={[
          selected ? styles.darkText : styles.chipText,
          { color: selected ? colors.darkLabel : theme.textMuted },
        ]}
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
  const theme = useTheme();

  return (
    <View
      className="overflow-hidden rounded-[22px] border"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={article.question}
        className="flex-row items-start gap-3 px-4 py-4 active:opacity-80"
      >
        <View
          className="mt-0.5 h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.accentMuted }}
        >
          <Ionicons
            name={categoryIcon(article.categoryId)}
            size={17}
            color={theme.accent}
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="text-base leading-6"
            style={[styles.primaryText, { color: theme.text }]}
          >
            {article.question}
          </Text>
          <Text
            className="text-xs uppercase tracking-[1.5px]"
            style={[styles.metaText, { color: theme.textSubtle }]}
          >
            {categoryLabel(article.categoryId)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSubtle}
        />
      </Pressable>

      {expanded ? (
        <View
          className="gap-4 border-t px-4 pb-4 pt-3"
          style={{ borderColor: theme.cardBorder }}
        >
          <Text
            className="text-sm leading-6"
            style={[styles.bodyText, { color: theme.textMuted }]}
          >
            {article.answer}
          </Text>
          {article.relatedAction ? (
            <Pressable
              onPress={() => router.push(article.relatedAction?.route ?? "/profile")}
              accessibilityRole="button"
              className="self-start flex-row items-center gap-2 rounded-full border px-3 py-2 active:opacity-85"
              style={{
                backgroundColor: theme.accentMuted,
                borderColor: theme.accent,
              }}
            >
              <Text
                className="text-xs"
                style={[styles.accentText, { color: theme.text }]}
              >
                {article.relatedAction.label}
              </Text>
              <Ionicons
                name="arrow-forward-outline"
                size={14}
                color={theme.accent}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function EmptyFaqState({ onClear }: { onClear: () => void }) {
  const theme = useTheme();

  return (
    <View
      className="items-center gap-3 rounded-[24px] border px-5 py-8"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-[20px]"
        style={{ backgroundColor: theme.accentMuted }}
      >
        <Ionicons name="search-outline" size={23} color={theme.accent} />
      </View>
      <View className="gap-1">
        <Text
          className="text-center text-base"
          style={[styles.primaryText, { color: theme.text }]}
        >
          No matching questions
        </Text>
        <Text
          className="text-center text-sm leading-6"
          style={[styles.mutedText, { color: theme.textSubtle }]}
        >
          Try another word or clear the filters.
        </Text>
      </View>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        className="rounded-full border px-4 py-2 active:opacity-85"
        style={{
          backgroundColor: theme.cardMuted,
          borderColor: theme.cardBorder,
        }}
      >
        <Text
          className="text-xs"
          style={[styles.primaryText, { color: theme.text }]}
        >
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
  const theme = useTheme();
  const { isDark } = useAppearance();
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
      variant={isDark ? "dark" : "light"}
    >
      <View className="gap-4">
        <View className="gap-2">
          <Text
            className="text-xs uppercase tracking-[1.5px]"
            style={[styles.eyebrowText, { color: theme.textSubtle }]}
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
                  className="rounded-full border px-3 py-2 active:opacity-85"
                  style={{
                    backgroundColor: selected ? theme.accent : theme.cardMuted,
                    borderColor: selected ? theme.accent : theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-xs"
                    style={[
                      selected ? styles.darkText : styles.chipText,
                      { color: selected ? colors.darkLabel : theme.textMuted },
                    ]}
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
          <Text className="text-sm" style={{ color: colors.darkLabel }}>
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
  const theme = useTheme();

  return (
    <View className="gap-1.5">
      <Text
        className="text-xs uppercase tracking-[1.5px]"
        style={[styles.eyebrowText, { color: theme.textSubtle }]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSubtle}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        maxLength={maxLength}
        className="rounded-2xl border px-4 py-3 text-base"
        selectionColor={colors.accent}
        style={[
          styles.reportInputText,
          {
            minHeight,
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
            color: theme.text,
          },
        ]}
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

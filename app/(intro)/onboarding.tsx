import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { Button, Logo } from "@/components/ui";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { PulsingDot } from "@/components/ui/pulsing-dot";
import { colors } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

type SlideMatch = {
  league: string;
  liveMinute: number;
  home: { name: string; color: string; image: string };
  away: { name: string; color: string; image: string };
  score: string;
  possession: number;
  shotsOnTarget: number;
};

type Slide = {
  key: string;
  title: string;
  description: string;
  match: SlideMatch;
};

const slides: Slide[] = [
  {
    key: "realtime",
    title: "Run your league from the pitch.",
    description:
      "Create fixtures, manage teams, and keep scores moving while everyone follows along.",
    match: {
      league: "Lagos Premier League",
      liveMinute: 41,
      home: { name: "Eko Stars", color: "#0EA5E9", image: "https://picsum.photos/200/300" },
      away: { name: "Tafawa FC", color: "#F97316", image: "https://picsum.photos/200/300" },
      score: "1 - 0",
      possession: 53,
      shotsOnTarget: 5,
    },
  },
  {
    key: "speed",
    title: "Live scores without the spreadsheet.",
    description:
      "Start a match, record goals, handle substitutions, and update the table in real time.",
    match: {
      league: "Lagos Premier League",
      liveMinute: 78,
      home: { name: "Mainland FC", color: "#4ADE80", image: "https://picsum.photos/200/300" },
      away: { name: "Island Utd", color: "#22C55E", image: "https://picsum.photos/200/300" },
      score: "2 - 1",
      possession: 62,
      shotsOnTarget: 8,
    },
  },
  {
    key: "goal",
    title: "Profiles that follow every player.",
    description:
      "Players can join leagues, build profiles, and keep their stats and highlights in one place.",
    match: {
      league: "Lagos Premier League",
      liveMinute: 90,
      home: { name: "Naija Knights", color: "#A855F7", image: "https://picsum.photos/200/300" },
      away: { name: "River Roar", color: "#EC4899", image: "https://picsum.photos/200/300" },
      score: "3 - 2",
      possession: 48,
      shotsOnTarget: 12,
    },
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { isDark } = useAppearance();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const { isTablet, isWideTablet } = useAdaptiveLayout();
  const headerHeight = isTablet ? Math.min(height * 0.43, 430) : height * 0.49;
  const tabletMaxWidth = isWideTablet ? 880 : 760;
  const tabletFrameStyle = isTablet
    ? { alignSelf: "center" as const, width: "100%" as const, maxWidth: tabletMaxWidth }
    : undefined;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const scrollToSlide = (target: number) => {
    listRef.current?.scrollToIndex({ index: target, animated: true });
    setIndex(target);
  };

  const goPrev = () => {
    if (index === 0) {
      router.back();
      return;
    }
    const target = Math.max(0, index - 1);
    scrollToSlide(target);
  };

  const goNext = () => {
    if (index === slides.length - 1) {
      void completeOnboarding();
      return;
    }
    scrollToSlide(index + 1);
  };

  const isLast = index === slides.length - 1;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <View
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: headerHeight }}
        pointerEvents="none"
      >
        <BlackPatternBackground
          baseColor={theme.patternBase}
          stripeColor={theme.patternStripe}
        />
        <View
          className="absolute inset-0"
          pointerEvents="none"
          style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.3)" }}
        />
      </View>
      <View
        className="absolute -left-10 -right-10"
        style={{
          backgroundColor: theme.background,
          top: height * 0.45,
          height: 90,
          transform: [{ rotate: "-7deg" }],
        }}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View
          className="px-6 pt-5 pb-5 flex-row items-center justify-between"
          style={tabletFrameStyle}
        >
          <Logo variant="full" color={colors.accent} fontSize={24} lineHeight={44} />
          <Pressable hitSlop={10} onPress={() => void completeOnboarding()}>
            <Text
              className="text-base font-medium"
              style={{ color: isDark ? theme.textMuted : theme.textSubtle }}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <SlideContent
              slide={item}
              width={width}
              tabletFrameStyle={tabletFrameStyle}
            />
          )}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          className="flex-1"
        />

        <View
          className="flex-row gap-2 justify-start pb-6 px-6"
          style={tabletFrameStyle}
        >
          {slides.map((slide, i) => (
            <Pressable
              key={slide.key}
              accessibilityRole="button"
              accessibilityLabel={`Show onboarding step ${i + 1}`}
              accessibilityState={{ selected: i === index }}
              hitSlop={10}
              onPress={() => scrollToSlide(i)}
              className="py-2"
            >
              <View
                className={`h-2 rounded-full ${i === index ? "w-8" : "w-2"}`}
                style={{ backgroundColor: i === index ? theme.brand : theme.inputBorder }}
              />
            </Pressable>
          ))}
        </View>

        <View
          className="flex-row gap-3 px-6 pb-4"
          style={tabletFrameStyle}
        >
          <Button
            variant="secondary"
            size="icon"
            icon={<Ionicons name="arrow-back-sharp" size={22} color={colors.darkLabel} />}
            onPress={goPrev}
            accessibilityLabel={index === 0 ? "Back to welcome" : "Previous step"}
            className="border"
            style={{ borderColor: theme.cardBorder }}
          />
          <Button
            label={isLast ? "Get Started" : "Continue"}
            icon={
              <Ionicons
                name={isLast ? "person-add-outline" : "arrow-forward"}
                size={20}
                color="#fff"
              />
            }
            iconPosition="right"
            onPress={goNext}
            className="flex-1"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideContent({
  slide,
  width,
  tabletFrameStyle,
}: {
  slide: Slide;
  width: number;
  tabletFrameStyle?: { alignSelf: "center"; width: "100%"; maxWidth: number };
}) {
  const theme = useTheme();

  return (
    <View style={{ width }} className="flex-1">
      <View className="px-6 pt-4" style={tabletFrameStyle}>
        <MatchCard match={slide.match} />
      </View>

      <View
        className="flex-1 px-6 justify-end pb-7 gap-3"
        style={tabletFrameStyle}
      >
        <Text
          className="text-5xl font-bold leading-snug"
          style={{ color: theme.text }}
        >
          {slide.title}
        </Text>
        <Text
          className="text-lg leading-relaxed"
          style={{ color: theme.textMuted }}
        >
          {slide.description}
        </Text>
      </View>

      <View
        className="mb-7 h-px w-[90%] shrink-0 self-center"
        style={{ backgroundColor: theme.cardBorder }}
      />
    </View>
  );
}

function MatchCard({ match }: { match: SlideMatch }) {
  const theme = useTheme();

  return (
    <View
      className="gap-4 rounded-2xl border p-5"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 px-2 py-0.5">
          <PulsingDot size={6} />
          <Text className="text-sm font-bold text-red-500 tracking-wider">
            LIVE • {match.liveMinute}&apos;
          </Text>
        </View>
       
        <Text
          className="text-xs font-medium"
          style={{ color: theme.textSubtle }}
        >
          {match.league}
        </Text>
      </View>
      <View
        className="h-px w-full shrink-0 self-center"
        style={{ backgroundColor: theme.cardBorder }}
      />

      <View className="flex-row items-center justify-between">
        <View className="items-center gap-1 flex-1">
         {match.home.image ? (
          <Image source={{ uri: match.home.image }} className="w-12 h-12 rounded-full" resizeMode="cover" />
         ) : (
          <View
            className="w-12 h-12 rounded-full"
            style={{ backgroundColor: match.home.color }}
          />
         )}
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.text }}
          >
            {match.home.name}
          </Text>
        </View>
        <Text className="text-3xl font-bold" style={{ color: theme.brand }}>
          {match.score}
        </Text>
        <View className="items-center gap-1 flex-1">
          {match.away.image ? (
            <Image source={{ uri: match.away.image }} className="w-12 h-12 rounded-full" resizeMode="cover" />
          ) : (
            <View
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: match.away.color }}
            />
          )}
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.text }}
          >
            {match.away.name}
          </Text>
        </View>
      </View>

      <View
        className="flex-row gap-3 rounded-xl p-3"
        style={{ backgroundColor: theme.cardMuted }}
      >
        <Stat
          label="Possession"
          value={`${match.possession}%`}
          percent={match.possession}
          tone="brand"
        />
        <Stat
          label="Shots on Target"
          value={`${match.shotsOnTarget}`}
          percent={Math.min(100, match.shotsOnTarget * 8)}
          tone="accent"
        />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: "brand" | "accent";
}) {
  const theme = useTheme();
  const fillColor = tone === "brand" ? theme.brand : theme.accent;
  return (
    <View className="flex-1 gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs" style={{ color: theme.textSubtle }}>
          {label}
        </Text>
        <Text className="text-xs font-bold" style={{ color: fillColor }}>
          {value}
        </Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: theme.inputBorder }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: fillColor }}
        />
      </View>
    </View>
  );
}

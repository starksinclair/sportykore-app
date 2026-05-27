import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { Button, Logo } from "@/components/ui";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { PulsingDot } from "@/components/ui/pulsing-dot";
import { colors } from "@/constants";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.49;

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
    title: "Real-time match data.",
    description:
      "Stay locked to every kick. Live minutes, scorelines, and momentum the instant they happen.",
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
    title: "Speed-first.\nData-rich insights.",
    description:
      "Sunlight-proof UI built for the pitch side. Follow your local teams, study player heatmaps, and never miss a goal.",
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
    title: "Never miss a goal.",
    description:
      "Goal alerts, lineup leaks, and post-match recaps land in your pocket the moment they break.",
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
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const goPrev = () => {
    const target = Math.max(0, index - 1);
    listRef.current?.scrollToIndex({ index: target, animated: true });
  };

  const goNext = () => {
    if (index === slides.length - 1) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const isLast = index === slides.length - 1;

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: HEADER_HEIGHT }}
        pointerEvents="none"
      >
        <BlackPatternBackground />
      </View>
      <View
        className="absolute bg-slate-50 -left-10 -right-10"
        style={{
          top: height * 0.45,
          height: 90,
          transform: [{ rotate: "-7deg" }],
        }}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="px-6 pt-5 pb-5 flex-row items-center justify-between">
          <Logo variant="full" color={colors.accent} fontSize={24} lineHeight={44} />
          <Pressable hitSlop={10} onPress={completeOnboarding}>
            <Text className="text-base text-[#D1D5DB] font-medium">Skip</Text>
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
          renderItem={({ item }) => <SlideContent slide={item} />}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          className="flex-1"
        />

        <View className="flex-row gap-2 justify-start pb-6 px-6">
          {slides.map((slide, i) => (
            <View
              key={slide.key}
              className={`h-2 rounded-full ${
                i === index ? "w-8 bg-brand-500" : "w-2 bg-slate-300"
              }`}
            />
          ))}
        </View>

        <View className="flex-row gap-3 px-6 pb-4">
          <Button
            variant="secondary"
            size="icon"
            icon={<Ionicons name="arrow-back-sharp" size={22} color="#000" />}
            onPress={goPrev}
            disabled={index === 0}
            className="border border-[#D1D5DB]"
          />
          <Button
            label={isLast ? "Create Account" : "Continue"}
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

function SlideContent({ slide }: { slide: Slide }) {
  return (
    <View style={{ width }} className="flex-1">
      <View className="px-6 pt-4">
        <MatchCard match={slide.match} />
      </View>

      <View className="flex-1 px-6 justify-end pb-7 gap-3">
        <Text className="text-5xl font-bold text-slate-900 leading-snug">
          {slide.title}
        </Text>
        <Text className="text-lg text-slate-600 leading-relaxed">
          {slide.description}
        </Text>
      </View>

      <View className="h-px w-[90%] shrink-0 self-center bg-[#D1D5DB] mb-7 " />
    </View>
  );
}

function MatchCard({ match }: { match: SlideMatch }) {
  return (
    <View
      className="bg-white rounded-2xl p-5 gap-4"
      style={{
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
       
        <Text className="text-xs text-slate-500 font-medium">
          {match.league}
        </Text>
      </View>
      <View className="h-px w-full shrink-0 self-center bg-[#D1D5DB]" />

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
          <Text className="text-sm font-semibold text-slate-900">
            {match.home.name}
          </Text>
        </View>
        <Text className="text-3xl font-bold text-brand-500">
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
          <Text className="text-sm font-semibold text-slate-900">
            {match.away.name}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 bg-slate-50 rounded-xl p-3">
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
  const fillClass = tone === "brand" ? "bg-brand-500" : "bg-accent-500";
  const valueClass = tone === "brand" ? "text-brand-500" : "text-accent-500";
  return (
    <View className="flex-1 gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-slate-500">{label}</Text>
        <Text className={`text-xs font-bold ${valueClass}`}>{value}</Text>
      </View>
      <View className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  );
}

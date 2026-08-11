import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TrackingEventPayload } from "./types";

const STORAGE_PREFIX = "sportykore:tracking-events:v1";
const PINNED_PREFIX = "sportykore:tracking-pinned:v1";
const PITCH_LAYOUT_PREFIX = "sportykore:tracking-pitch-layout:v1";
const enqueueLocks = new Map<number, Promise<QueuedTrackingEvent[]>>();

export type QueuedTrackingEvent = TrackingEventPayload & {
  queuedAt: string;
};

function storageKey(gameId: number) {
  return `${STORAGE_PREFIX}:${gameId}`;
}

function pinnedStorageKey(gameId: number) {
  return `${PINNED_PREFIX}:${gameId}`;
}

function pitchLayoutStorageKey(gameId: number) {
  return `${PITCH_LAYOUT_PREFIX}:${gameId}`;
}

export type TrackingPitchLayout = {
  home: string[];
  away: string[];
};

export async function loadQueuedTrackingEvents(
  gameId: number,
): Promise<QueuedTrackingEvent[]> {
  const raw = await AsyncStorage.getItem(storageKey(gameId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedTrackingEvent);
  } catch {
    return [];
  }
}

export async function enqueueTrackingEvent(
  gameId: number,
  event: TrackingEventPayload,
): Promise<QueuedTrackingEvent[]> {
  const previous = enqueueLocks.get(gameId) ?? Promise.resolve([]);
  const nextWrite = previous
    .catch(() => [])
    .then(async () => {
      const queued = await loadQueuedTrackingEvents(gameId);
      const next = [...queued, { ...event, queuedAt: new Date().toISOString() }];
      await AsyncStorage.setItem(storageKey(gameId), JSON.stringify(next));
      return next;
    });
  enqueueLocks.set(gameId, nextWrite);
  return nextWrite;
}

export async function clearQueuedTrackingEvents(gameId: number): Promise<void> {
  await AsyncStorage.removeItem(storageKey(gameId));
}

export async function loadPinnedTrackingPlayerKeys(gameId: number): Promise<string[]> {
  const raw = await AsyncStorage.getItem(pinnedStorageKey(gameId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export async function savePinnedTrackingPlayerKeys(
  gameId: number,
  playerKeys: string[],
): Promise<void> {
  await AsyncStorage.setItem(pinnedStorageKey(gameId), JSON.stringify(playerKeys));
}

export async function loadTrackingPitchLayout(
  gameId: number,
): Promise<TrackingPitchLayout | null> {
  const raw = await AsyncStorage.getItem(pitchLayoutStorageKey(gameId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<TrackingPitchLayout>;
    if (!Array.isArray(parsed.home) || !Array.isArray(parsed.away)) return null;
    return {
      home: parsed.home.filter((key): key is string => typeof key === "string"),
      away: parsed.away.filter((key): key is string => typeof key === "string"),
    };
  } catch {
    return null;
  }
}

export async function saveTrackingPitchLayout(
  gameId: number,
  layout: TrackingPitchLayout,
): Promise<void> {
  await AsyncStorage.setItem(pitchLayoutStorageKey(gameId), JSON.stringify(layout));
}

export function createClientEventId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function isQueuedTrackingEvent(value: unknown): value is QueuedTrackingEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<QueuedTrackingEvent>;
  return (
    typeof event.clientEventId === "string" &&
    (event.type === "pass" || event.type === "shot") &&
    typeof event.teamId === "number" &&
    typeof event.playerId === "number" &&
    typeof event.queuedAt === "string"
  );
}

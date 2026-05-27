import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "home.recent-searches";
const MAX_ENTRIES = 12;

export async function getRecentSearches(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function pushRecentSearch(term: string): Promise<string[]> {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();

  const current = await getRecentSearches();
  const deduped = [trimmed, ...current.filter((value) => value !== trimmed)].slice(
    0,
    MAX_ENTRIES,
  );

  await AsyncStorage.setItem(KEY, JSON.stringify(deduped));
  return deduped;
}

export async function removeRecentSearch(term: string): Promise<string[]> {
  const current = await getRecentSearches();
  const next = current.filter((value) => value !== term);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

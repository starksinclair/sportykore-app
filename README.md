# SportyKore — Expo / React Native

SportyKore is a soccer league management mobile app. The frontend is **Expo SDK 54 / React Native 0.81 / React 19** with **Expo Router**, **NativeWind v4 (Tailwind)**, and **TanStack React Query v5**. The backend is AdonisJS (separate repo); this document covers the mobile app only.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 54 / React Native 0.81.5 / React 19 |
| Routing | Expo Router 6 (file-based) |
| Styling | NativeWind 4 (Tailwind CSS for RN) |
| Data fetching | TanStack React Query 5 |
| Auth | Custom `AuthProvider` + AsyncStorage |
| Language | TypeScript 5.9 (strict mode) |
| State | React Context + React Query (no Redux/Zustand) |

Expo experiments enabled in `app.json`: `typedRoutes`, `reactCompiler`.

---

## Prerequisites

- **Node.js** LTS
- **npm** (comes with Node)
- **Expo CLI** — use `npx expo ...`, no global install needed

### iOS (Mac only)

- **Xcode** from the App Store
- **Xcode Command Line Tools**: `xcode-select --install`

### Android

- **Android Studio** with an Android emulator (AVD) configured

---

## Setup

```bash
npm install
```

Create a `.env` file at the project root:

```bash
EXPO_PUBLIC_API_URL="http://127.0.0.1:3333"
```

| Target | URL to use |
|---|---|
| iOS Simulator | `http://127.0.0.1:3333` (points to your Mac) |
| Android emulator | `http://10.0.2.2:3333` or run `adb reverse tcp:3333 tcp:3333` then use `127.0.0.1` |
| Physical device | Your machine's LAN IP, e.g. `http://192.168.0.x:3333` |

Only variables prefixed with `EXPO_PUBLIC_` are available in app code.

---

## Running the App

This project uses a **dev client** (not standard Expo Go) because it includes native modules. You must build the dev client once before Metro will work.

```bash
# Build + install dev client and start Metro
npm run ios        # iOS Simulator
npm run android    # Android emulator

# After the dev client is installed, start Metro only
npx expo start --dev-client
```

### When to rebuild the dev client

Rebuild (`npm run ios` / `npm run android`) any time you install a package that includes native code. Common signs you need a rebuild:

- `Cannot find native module 'Expo...'`
- App crashes on launch after adding a new `expo-*` package

---

## Scripts

```bash
npm run start    # start Metro (dev client must already be installed)
npm run ios      # build + run iOS
npm run android  # build + run Android
npm run web      # web target (limited; primary target is native)
npm run lint     # ESLint via expo
```

---

## Project Structure

```
sportykore-app/
├── app/                          # Expo Router pages — thin wrappers only
│   ├── _layout.tsx               # Root layout: providers + auth guards
│   ├── (intro)/                  # Onboarding (shown before first login)
│   │   ├── index.tsx
│   │   └── onboarding.tsx
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot.tsx
│   └── (app)/                    # Protected screens (requires auth)
│       ├── (tabs)/
│       │   ├── index.tsx         # Home / match feed
│       │   ├── create.tsx        # Create league wizard
│       │   └── manage.tsx        # Manage leagues list
│       ├── search.tsx
│       ├── profile.tsx
│       ├── country/[id].tsx
│       ├── league/[id].tsx
│       ├── team/[id].tsx
│       ├── player/[id].tsx
│       ├── match/[id].tsx
│       └── manage/[leagueId]/    # League admin console
│           ├── index.tsx
│           └── game/[gameId].tsx
│
├── src/                          # All logic, UI, and data
│   ├── api/
│   │   ├── config.ts             # API_BASE_URL from env
│   │   ├── errors.ts             # ApiError class
│   │   ├── entities.ts           # Shared API response types
│   │   └── http-client.ts        # apiRequest<T> — single HTTP entry point
│   ├── auth/                     # Auth module
│   ├── color/                    # Color-scheme hooks
│   ├── components/ui/            # Shared presentational components
│   ├── constants/                # App-wide constants + color helpers
│   ├── country/                  # Country feature module
│   ├── entity-data/              # Data graph utilities
│   ├── home/                     # Home / feed feature module
│   ├── league/                   # League feature module
│   ├── lib/                      # Shared utilities
│   ├── manage/                   # League admin (manage) feature module
│   ├── match/                    # Match feature module
│   ├── player/                   # Player feature module
│   ├── team/                     # Team feature module
│   └── theme/
│       └── fonts.ts              # Font family constants
│
├── hooks/                        # Global hooks (useNetworkStatus, useRefresh)
├── assets/                       # Images, icons, fonts
├── documentations/               # Backend API docs + feature guides
├── global.css                    # Tailwind directives (NativeWind entry)
├── tailwind.config.js            # Brand color palette
├── babel.config.js               # NativeWind babel preset
├── metro.config.js               # withNativeWind wrapper
├── tsconfig.json                 # Strict TS + path aliases
└── app.json                      # Expo config
```

---

## Route Groups & Guards

Guards live in `app/_layout.tsx` using `<Stack.Protected guard={...}>`.

| Group | Shown when | Guard |
|---|---|---|
| `(intro)` | First launch (not onboarded) | `!hasOnboarded` |
| `(auth)` | Onboarded, not logged in | `hasOnboarded && !user` |
| `(app)` | Logged in | `hasOnboarded && !!user` |

Page files are **thin wrappers** — extract params, render a `src/` screen component, nothing else:

```tsx
// app/(app)/league/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { LeagueScreen } from "@/league";

export default function LeaguePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LeagueScreen id={id ?? ""} />;
}
```

Navigation:

```ts
import { useRouter } from "expo-router";
const router = useRouter();

router.push(`/league/${id}`);
router.replace("/login");
router.back();
```

---

## Feature Modules

Every domain entity is a self-contained module under `src/`:

```
src/[feature]/
├── api.ts        # Fetch functions using apiRequest
├── hooks.ts      # React Query hooks wrapping api.ts
├── types.ts      # Types for this feature
├── index.ts      # Public barrel export
└── components/   # Screen + sub-components
```

Existing modules: `auth`, `home`, `league`, `match`, `player`, `team`, `country`, `manage`.

Always import from the module root, never from deep internal paths:

```ts
// good
import { useLeagueDetail } from "@/league";

// bad
import { useLeagueDetail } from "@/league/hooks";
```

---

## HTTP Client

All network calls go through `src/api/http-client.ts`:

```ts
import { apiRequest } from "@/api/http-client";

// GET, unauthenticated
const data = await apiRequest<{ data: MyType[] }>("/api/v1/things");

// POST with JSON body, authenticated
const result = await apiRequest<ResponseType>("/api/v1/things", {
  method: "POST",
  auth: true,           // attaches Bearer token automatically
  jsonBody: { name },   // serialised to JSON; use FormData for file uploads
});
```

`apiRequest` throws `ApiError` (from `src/api/errors.ts`) on any non-2xx response. `ApiError` exposes `.message`, `.status`, and `.body`.

---

## Data Fetching (React Query)

### Query client defaults (`src/lib/query-client.ts`)

| Setting | Value |
|---|---|
| `staleTime` | 5 minutes |
| `gcTime` | 24 hours (persisted to AsyncStorage for offline use) |
| Retry | up to 2×, skipped for 403/404 |
| Persistence key | `SOCCER_APP_CACHE` |

### Standard hook pattern

Every query hook must include these options:

```ts
import { useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

export function useLeagueDetail(leagueId: number, seasonId?: number | null) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: ["league", leagueId, seasonId ?? null],
    queryFn: () => fetchLeagueDetail(leagueId, seasonId ?? undefined),
    enabled: leagueId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}
```

- `networkMode: 'offlineFirst'` serves cached data immediately when offline.
- `placeholderData` prevents UI flicker on refetch.
- Always guard with `enabled` when the query depends on a dynamic param.

### Mutations

```ts
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

export function useCreateLeague() {
  return useMutation({
    mutationFn: createLeague,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manageKeys.leagues() });
    },
  });
}
```

### Query keys

Each module centralises its keys (e.g. `src/manage/queryKeys.ts`):

```ts
export const manageKeys = {
  leagues: () => ["manage", "leagues"] as const,
  league: (leagueId: number, seasonId?: number | null) =>
    ["manage", "league", leagueId, seasonId ?? null] as const,
};
```

---

## Auth

Auth state lives in `src/auth/AuthProvider.tsx` and is consumed via `useAuth()`:

```ts
const { user, signIn, signOut, hasOnboarded, hydrated } = useAuth();
```

- `hydrated` is `false` during the initial AsyncStorage read — don't render auth-dependent UI until it's `true`.
- 401/403 responses trigger global sign-out automatically via `src/auth/unauthorized-bus.ts`.
- The Bearer token is stored with `expo-secure-store` and retrieved by `http-client.ts` when `auth: true` is passed.

Auth endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/signup`, `POST /api/v1/auth/logout`. See `documentations/MOBILE_AUTH_ROUTES.md`.

---

## Styling

SportyKore uses **NativeWind v4** — Tailwind class strings on React Native primitives.

### Rules

- Prefer `className` strings over `StyleSheet.create`. Use `StyleSheet` only for values Tailwind can't express (e.g. percentage widths, `letterSpacing`).
- **Never hardcode hex colors** in UI. Use design tokens.
- Set font families with `style={{ fontFamily: fonts.bodyBold }}` — NativeWind does not load custom fonts.

### Brand tokens (`tailwind.config.js`)

```
brand-*    purple    #4A148C  (50–900 shades)
accent-*   gold      #E6A817  (50–900 shades)
```

Usage: `className="bg-brand-500 text-accent-400"`.

### Font tokens (`src/theme/fonts.ts`)

```ts
import { fonts } from "@/theme/fonts";

fonts.brand          // Pacifico_400Regular       — logo / display
fonts.body           // OpenSans_400Regular        — body copy
fonts.bodySemibold   // OpenSans_600SemiBold
fonts.bodyBold       // OpenSans_700Bold
fonts.display        // PlayfairDisplay_400Regular
fonts.displayBold    // PlayfairDisplay_700Bold
```

Always use `style={{ fontFamily: fonts.bodyBold }}` alongside `className` for text weight/style.

---

## Shared UI Components (`src/components/ui/`)

| Component | Purpose |
|---|---|
| `Button` | Primary/secondary/ghost/accent variants; `loading` prop shows spinner |
| `Input` / `AuthTextField` / `TextField` | Text inputs with label |
| `Screen` | Safe-area wrapper |
| `DetailScreenShell` | Shell for detail screens (league, player, etc.) |
| `DetailTabs` | Horizontal tab bar for detail screens |
| `SeasonPicker` | Native wheel picker for season selection |
| `OfflineBanner` | Fixed banner shown when `isOnline` is false |
| `ErrorState` | Full-screen error with retry button |
| `BottomSheetModal` | Slide-up modal sheet |
| `PulsingDot` | Animated live indicator |
| `Logo` | App wordmark |
| `CountryFlag` / `CountryLabel` | Flag image + country name |
| `BlackPatternBackground` | Decorative striped background |
| `Collapsible` | Expandable/collapsible section |

Import from the barrel: `import { Button, OfflineBanner } from "@/components/ui"`.

---

## Global Hooks (`hooks/`)

| Hook | Purpose |
|---|---|
| `useNetworkStatus()` | Returns `{ isOnline: boolean }` |
| `useRefresh()` | Returns `{ refreshing, onRefresh }` for `RefreshControl` |

Every screen with a `FlatList` should wire up `RefreshControl`:

```tsx
import { useRefresh } from "hooks/useRefresh";
import { colors } from "@/constants";

const { refreshing, onRefresh } = useRefresh(refetch);

<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.brand}
      colors={[colors.brand]}
    />
  }
/>
```

---

## TypeScript Conventions

### Path aliases (`tsconfig.json`)

```ts
@/api/...          → src/api/
@/auth             → src/auth/index.ts
@/components/ui    → src/components/ui/index.ts
@/constants        → src/constants/index.ts
@/country          → src/country/index.ts
@/home/...         → src/home/
@/league           → src/league/index.ts
@/lib/...          → src/lib/
@/manage/...       → src/manage/
@/match            → src/match/index.ts
@/player           → src/player/index.ts
@/team             → src/team/index.ts
@/theme/fonts      → src/theme/fonts.ts
```

### Patterns

```ts
// Props: type alias, not interface
type Props = { id: string; label?: string };

// Named exports only — no default exports from component/hook files
export function MyComponent({ id }: Props) { ... }

// Variant maps
type Variant = "primary" | "secondary";
const classes: Record<Variant, string> = { primary: "bg-brand-500", secondary: "bg-white" };

// Never use `any` — use `unknown` and narrow
```

---

## API Response Conventions

Documented in `documentations/ROUTES.md`. Two patterns:

| Pattern | When |
|---|---|
| `{ data: T }` | `GET` routes that call `ctx.serialize(...)` |
| Plain JSON | `POST`/`PUT`/`DELETE` mutations returning `{ message: "..." }` or a raw object |

All shared response types live in `src/api/entities.ts` (`ApiLeague`, `ApiGame`, `ApiPlayer`, `ApiSeason`, etc.). Derive feature-specific types from these — do not duplicate or invent fields.

---

## Screens Built

| Screen | Route | Status |
|---|---|---|
| Home / match feed | `(tabs)/index` | Live (React Query, offline-first) |
| Create league wizard | `(tabs)/create` | Live (3-step, submits to API) |
| Manage leagues list | `(tabs)/manage` | Live (biometric gate) |
| Manage league detail | `manage/[leagueId]` | Live (games, players, settings tabs) |
| League detail | `league/[id]` | Live (standings, fixtures, stats, season picker) |
| Match detail | `match/[id]` | Live |
| Team detail | `team/[id]` | Live |
| Player detail | `player/[id]` | Live |
| Country detail | `country/[id]` | Live |
| Search | `search` | Live |
| Login / Register / Forgot | `(auth)/*` | Live |
| Onboarding | `(intro)/*` | Live |

---

## Documentation

| File | Contents |
|---|---|
| `documentations/ROUTES.md` | All backend API routes, request/response shapes, validators |
| `documentations/MOBILE_AUTH_ROUTES.md` | Auth endpoints (login, signup, token refresh, me) |
| `documentations/MANAGE_LEAGUE.md` | Manage flow: league list, biometric gate, games/players/settings tabs |
| `documentations/TIME_AND_TIMEZONE.md` | How match-day filtering works with timezones |
| `documentations/DETAIL_SCREENS_API_GAPS.md` | Known API gaps and workarounds for detail screens |
| `AGENTS.md` | Canonical conventions reference for code style, patterns, do's/don'ts |

---

## EAS Builds

`eas.json` defines three profiles:

| Profile | Purpose |
|---|---|
| `development` | Dev client, internal distribution |
| `preview` | Internal distribution (TestFlight / Play internal) |
| `production` | Store submission |

---

## Do's and Don'ts

**Do:**
- Keep `app/` files as thin param-extractors; all logic belongs in `src/`.
- Import from module barrels (`@/league`), never from deep internal paths.
- Use `className` NativeWind strings for all layout, spacing, and color.
- Always set `fontFamily` via `style={{ fontFamily: fonts.* }}`.
- Always include `staleTime`, `gcTime`, `networkMode`, and `placeholderData` on every `useQuery`.
- Use `enabled` guard in `useQuery` whenever the query depends on a runtime param.
- Derive all types from `src/api/entities.ts` — the API response is the single source of truth.
- Handle all query states in every screen: loading, error, empty, success.

**Don't:**
- Import from `app/` inside `src/`.
- Use default exports in component or hook files.
- Hardcode hex colors or font name strings in component files.
- Wrap a `FlatList` inside a `ScrollView`.
- Use `any` — use `unknown` and narrow with type guards.
- Add logic or state to `app/` page files.
- Create duplicate types — check `src/api/entities.ts` first.

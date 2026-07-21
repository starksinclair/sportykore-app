# SportyKore – Agent Reference

This document is the authoritative guide for AI agents and contributors working on this codebase. Read it before making changes.

---

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | Expo 54 / React Native 0.81.5 / React 19       |
| Routing       | Expo Router 6 (file-based)                     |
| Styling       | NativeWind 4.2.3 (Tailwind CSS for RN)         |
| Data fetching | TanStack React Query 5                         |
| Auth          | Custom `AuthProvider` + AsyncStorage           |
| Language      | TypeScript 5.9 (strict mode)                   |
| Navigation    | Expo Router Stack + React Navigation Tabs      |
| State         | React Context + React Query (no Zustand/Redux) |

Experiments enabled in `app.json`: `typedRoutes`, `reactCompiler`.

---

## Folder Structure

```
sportykore-app/
├── app/                        # Expo Router pages and layouts (routing layer only)
│   ├── _layout.tsx             # Root layout – providers, auth guards
│   ├── (intro)/                # Onboarding group
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Splash / landing
│   │   └── onboarding.tsx
│   ├── (auth)/                 # Unauthenticated screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot.tsx
│   └── (app)/                  # Protected screens
│       ├── _layout.tsx         # Stack wrapper
│       ├── (tabs)/             # Bottom tab group
│       │   ├── _layout.tsx     # Tabs config
│       │   ├── index.tsx       # Home / feed
│       │   ├── create.tsx      # Create league
│       │   └── manage.tsx      # Manage leagues
│       ├── search.tsx          # Search modal
│       ├── profile.tsx         # Profile modal
│       ├── country/[id].tsx    # Dynamic – country detail
│       ├── league/[id].tsx     # Dynamic – league detail
│       ├── team/[id].tsx       # Dynamic – team detail
│       ├── player/[id].tsx     # Dynamic – player detail
│       └── match/[id].tsx      # Dynamic – match detail
│
├── src/                        # All logic, UI, and data lives here
│   ├── api/                    # Base HTTP layer
│   │   ├── config.ts           # API_BASE_URL (env-configurable)
│   │   ├── errors.ts           # ApiError class
│   │   └── http-client.ts      # apiRequest<T> – single fetch entry point
│   ├── auth/                   # Auth module
│   │   ├── auth-api.ts         # Auth endpoints
│   │   ├── auth-contract.ts    # Backend response shapes
│   │   ├── auth-context.ts     # React context definition
│   │   ├── AuthProvider.tsx    # Context provider
│   │   ├── storage.ts          # AsyncStorage helpers
│   │   ├── types.ts            # AuthUser, AuthContextValue
│   │   ├── unauthorized-bus.ts # Event emitter for 401/403
│   │   ├── use-auth.ts         # useAuth() hook
│   │   ├── index.ts            # Barrel export
│   │   └── components/
│   │       └── auth-screen-layout.tsx
│   ├── color/                  # Theme / color-scheme hooks
│   ├── components/
│   │   └── ui/                 # Shared presentational components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Screen.tsx
│   │       ├── bottom-sheet-modal.tsx
│   │       ├── detail-screen-shell.tsx
│   │       ├── logo.tsx
│   │       ├── pulsing-dot.tsx
│   │       └── index.ts        # Barrel export
│   ├── constants/              # App-wide constants
│   ├── entity-data/            # Mock data graph builders
│   ├── home/                   # Home/feed feature module
│   │   ├── api/                # Feed, league directory, search APIs
│   │   ├── components/         # MatchRow, LeagueBlock, ScoreChip, etc.
│   │   ├── hooks/              # useMatchesFeed, useLeaguesDirectory, useGbakoSearch
│   │   ├── mock/seed.ts        # Seeded mock data
│   │   └── types.ts
│   ├── league/                 # League feature module
│   ├── match/                  # Match feature module
│   ├── player/                 # Player feature module
│   ├── team/                   # Team feature module
│   ├── country/                # Country feature module
│   ├── lib/                    # Shared utilities
│   │   ├── query-client.ts     # React Query client config
│   │   ├── show-error-toast.ts # Toast helpers
│   │   └── copy-to-clipboard.ts
│   └── theme/
│       └── fonts.ts            # Font family constants
│
├── assets/                     # Images, icons, fonts
├── documentations/             # Project docs
├── global.css                  # Tailwind directives (entry for NativeWind)
├── tailwind.config.js          # Brand color palette
├── babel.config.js             # NativeWind babel preset
├── metro.config.js             # withNativeWind wrapper
├── tsconfig.json               # Strict TS + path aliases
└── app.json                    # Expo config
```

---

## Routing & Pages

Pages live exclusively in `app/`. They should be **thin wrappers** – extract params, then delegate to a `src/` screen component.

### Route Groups

| Group          | Purpose                            | Guard                    |
| -------------- | ---------------------------------- | ------------------------ |
| `(intro)`      | Onboarding flow                    | `!hasOnboarded`          |
| `(auth)`       | Login / register / forgot password | `hasOnboarded && !user`  |
| `(app)`        | All protected content              | `hasOnboarded && !!user` |
| `(app)/(tabs)` | Bottom tab bar                     | -                        |

Guards are implemented in `app/_layout.tsx` using `<Stack.Protected guard={...}>`.

### Creating a New Page

1. Add the file under the correct group in `app/`.
2. Use `useLocalSearchParams<{ id: string }>()` for dynamic segments.
3. Delegate all rendering to a component in `src/[feature]/components/`.
4. Register any non-default transition in the group's `_layout.tsx`.

```tsx
// app/(app)/league/[id].tsx  ← thin page
import { useLocalSearchParams } from "expo-router";
import { LeagueScreen } from "@/league";

export default function LeaguePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LeagueScreen id={id ?? ""} />;
}
```

### Navigation

```ts
import { useRouter } from "expo-router";
const router = useRouter();

router.push(`/league/${id}`); // forward
router.back(); // back
router.replace("/login"); // replace history
```

---

## Components

### Location Rules

| Component type                                | Location                                    |
| --------------------------------------------- | ------------------------------------------- |
| Shared / reusable UI (Button, Input, Screen…) | `src/components/ui/`                        |
| Feature-specific UI (MatchRow, ScoreChip…)    | `src/[feature]/components/`                 |
| Screen-level containers                       | `src/[feature]/components/[Name]Screen.tsx` |
| Auth-specific layouts                         | `src/auth/components/`                      |

Every directory that exports components must have an `index.ts` barrel file.

### Component Template

```tsx
// src/[feature]/components/ExampleCard.tsx

type Props = {
  title: string;
  subtitle?: string;
};

export function ExampleCard({ title, subtitle }: Props) {
  return (
    <View className="rounded-xl bg-white p-4">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-base text-neutral-900"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{ fontFamily: fonts.body }}
          className="text-sm text-neutral-500"
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
```

Key rules:

- **Named exports** only – no default exports from component files.
- **Props typed inline** with a `type Props = { … }` alias (not interface).
- Variant mapping objects use `Record<Variant, string>` for NativeWind class strings.
- Extend platform primitives with `Omit<PressableProps, "children"> & { … }` when wrapping them.

---

## Styling

SportyKore uses **NativeWind v4** (Tailwind CSS class strings on React Native primitives).

### Rules

1. Prefer `className` Tailwind strings over `StyleSheet.create`.
2. Use `StyleSheet.create` only for values that cannot be expressed in Tailwind (e.g. `width: "14.2857%"`).
3. Set font families with `style={{ fontFamily: fonts.bodyBold }}` – NativeWind does not handle custom fonts.
4. Never hardcode color hex values; use the theme tokens (`brand-*`, `accent-*`, `neutral-*`).

### Brand Palette (`tailwind.config.js`)

```
brand-*   → purple   (#4A148C and shades 50–900)
accent-*  → gold     (#E6A817 and shades 50–900)
```

### Fonts (`src/theme/fonts.ts`)

```ts
fonts.brand; // Pacifico_400Regular   – logo / display
fonts.body; // OpenSans_400Regular   – default body
fonts.bodySemibold; // OpenSans_600SemiBold
fonts.bodyBold; // OpenSans_700Bold
fonts.display; // PlayfairDisplay_400Regular
fonts.displayBold; // PlayfairDisplay_700Bold
```

---

## Feature Modules

Each domain entity (`auth`, `home`, `league`, `match`, `player`, `team`, `country`) is a self-contained module under `src/`:

```
src/[feature]/
├── api.ts          # Fetch functions (or api/ folder for multiple endpoints)
├── hooks.ts        # React Query hooks that wrap api.ts
├── types.ts        # Types specific to this feature
├── index.ts        # Public barrel export
└── components/     # Screen and sub-components
```

### Adding a New Feature Module

1. Create the directory `src/[feature]/`.
2. Define types in `types.ts`.
3. Implement fetch functions in `api.ts` using `apiRequest<T>` from `@/api/http-client`.
4. Wrap in a React Query hook in `hooks.ts`.
5. Build the screen component in `components/[Feature]Screen.tsx`.
6. Export everything from `index.ts`.
7. Add the page file in `app/(app)/[feature]/[id].tsx`.

---

## Data Fetching

All data fetching goes through **React Query + `apiRequest`**.

### HTTP Client (`src/api/http-client.ts`)

```ts
import { apiRequest } from "@/api/http-client";

// Unauthenticated
const data = await apiRequest<ResponseType>("/api/v1/path");

// Authenticated (attaches Bearer token automatically)
const data = await apiRequest<ResponseType>("/api/v1/path", { auth: true });

// With body
const data = await apiRequest<ResponseType>("/api/v1/path", {
  method: "POST",
  auth: true,
  body: JSON.stringify(payload),
});
```

### React Query Hook Pattern

```ts
// src/league/hooks.ts
import { useQuery } from "@tanstack/react-query";
import { fetchLeagueDetail } from "./api";

export function useLeagueDetail(id: string) {
  return useQuery({
    queryKey: ["league-detail", id],
    queryFn: () => fetchLeagueDetail(id),
    enabled: Boolean(id),
  });
}
```

### Query Client Defaults (`src/lib/query-client.ts`)

| Setting                | Value |
| ---------------------- | ----- |
| `staleTime`            | 30 s  |
| `gcTime`               | 5 min |
| `retry`                | 1     |
| `refetchOnWindowFocus` | false |

### Query Keys

Centralise keys per feature (e.g. `src/home/hooks/queryKeys.ts`). Use the pattern `["entity-type", id]` or `["entity-type", { filter1, filter2 }]`.

---

## Auth

Auth state is managed in `src/auth/AuthProvider.tsx` and accessed via `useAuth()`.

```ts
const { user, signIn, signOut, hasOnboarded, hydrated } = useAuth();
```

The `hydrated` flag is `false` during the initial AsyncStorage read – use it to suppress rendering until session is known.

Unauthorized responses (401/403) are intercepted by `http-client.ts`, which emits on `unauthorized-bus`. `AuthProvider` listens and calls `signOut()` automatically.

---

## TypeScript Conventions

### Path Aliases

```ts
import { Button } from "@/components/ui"; // → src/components/ui
import { useLeagueDetail } from "@/league"; // → src/league/index.ts
import logo from "@/assets/images/logo.png"; // → assets/images/logo.png
```

### Type Patterns

```ts
// Props: use type, not interface
type Props = { id: string; label?: string };

// Variant maps
type Variant = "primary" | "secondary" | "ghost";
const containerClass: Record<Variant, string> = { … };

// Backend contracts in auth-contract.ts / types.ts at the module level
// Runtime types validated by the API layer; use as-casts only when safe
```

---

## Error Handling & Toasts

```ts
import { showErrorToast, showThrownAsToast } from "@/lib/show-error-toast";

try {
  await someApiCall();
} catch (err) {
  showThrownAsToast(err); // automatically maps ApiError → readable message
  // or
  showErrorToast("Title", "Detail message");
}
```

`ApiError` is thrown by `apiRequest` when the server returns a non-2xx status; it exposes `details.status`, `details.code`, and `message`.

---

## Environment Variables

| Variable              | Default                 | Purpose          |
| --------------------- | ----------------------- | ---------------- |
| `EXPO_PUBLIC_API_URL` | `http://127.0.0.1:3333` | Backend base URL |

Prefix all client-side env vars with `EXPO_PUBLIC_`.

---

## Do's and Don'ts

**Do:**

- Keep `app/` files as thin wrappers; all logic belongs in `src/`.
- Export from `index.ts` barrels; import from the module root (`@/league`), not deep paths.
- Use NativeWind class strings for all layout and color.
- Use `fonts.*` constants for every `fontFamily` style prop.
- Type all API responses at the feature module boundary.
- Centralise query keys per feature.

**Don't:**

- Import from `app/` in `src/`.
- Use default exports in component or hook files.
- Hardcode colors or font names as string literals.
- Skip the `enabled` guard in `useQuery` when the query depends on a dynamic param.
- Add logic to `app/` page files beyond param extraction and component rendering.
- Use `any`; use `unknown` and narrow.

# Home Screen Implementation Prompt

## Context

We are building a React Native (Expo) mobile app for a soccer league management platform. The backend is AdonisJS and the API routes are documented in `@documentations/ROUTES.md`.

The following are already set up and should not be recreated:

| Already Exists                                              | Location                                       |
| ----------------------------------------------------------- | ---------------------------------------------- |
| React Query + `persistQueryClient` + AsyncStorage persister | `lib/queryClient.ts`                           |
| `useRefresh` hook                                           | `hooks/useRefresh.ts`                          |
| `OfflineBanner` component                                   | `components/OfflineBanner.tsx`                 |
| `useNetworkStatus` hook                                     | `hooks/useNetworkStatus.ts`                    |
| `usePrefetchData` hook, you will need to create this hook   | `hooks`                                        |
| Color system                                                | `constants/colors.ts` (e.g. `colors.bsuColor`) |

---

## Task

Implement the API calls and UI for the **Home screen only**. Do not touch other screens.

---

## Home Screen Requirements

### Matches Section

- Fetch matches grouped by country from the API using React Query
- The current implementation has a country dropdown → league dropdown → matches. **Remove the league dropdown**
- **Countries** remain as a collapsible accordion dropdown
- Inside each country, **display all leagues as flat visible items** — no toggle, no accordion
- Each league must be a `Pressable` that navigates to the league page, passing `leagueId`
- Under each league, display its matches for that day

---

## General Requirements

- All types must be derived from the API response shape — **the API response is the single source of truth**. Do not invent or assume type fields
- Always check for an existing component before creating a new one. Only create a new component if one does not already exist
- Every screen must include `OfflineBanner` at the top
- Every `FlatList` must include `RefreshControl` using the `useRefresh` hook:

```tsx
refreshControl={
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    colors={[colors.bsuColor]}
    tintColor={colors.bsuColor}
  />
}
```

- Use `networkMode: 'offlineFirst'` on all queries so cached data is served immediately when offline
- Use `placeholderData: (previousData) => previousData` on all queries to prevent UI flicker on refetch
- Handle all query states:
  - `loading` — skeleton or spinner
  - `error` — error message with a retry button
  - `empty` — empty state UI
  - `success` — render data

---

## Prefetch Flow to Implement

Follow this exact flow:

```
App opens (online)
    ↓
usePrefetchUserData → prefetches user's league list
    ↓
Home screen loads → prefetches every league's full data + standings in background
    ↓
User taps a team card → prefetches all player profiles for that team
    ↓
User arrives at match venue (offline)
    ↓
Everything is already in AsyncStorage cache — app works seamlessly
```

Implement the prefetch logic inside the Home screen using `queryClient.prefetchQuery` inside a `useEffect` that runs **only when `isOnline` is true and data is available**.

---

## API and Caching Rules

- Reference `@documentations/ROUTES.md` for all endpoint URLs, query params, and response shapes
- Store all query hooks in `hooks/queries/` — one file per resource

Every `useQuery` hook must include these options:

```ts
{
  queryKey: ['resource', ...allDependentParams],
  staleTime: 1000 * 60 * 5,           // 5 minutes
  gcTime: 1000 * 60 * 60 * 24,        // 24 hours (for offline persistence)
  networkMode: isOnline ? 'online' : 'offlineFirst',
  placeholderData: (previousData) => previousData,
}
```

---

## What NOT to Do

- Do not use `ScrollView` to wrap a `FlatList`
- Do not hardcode any data — everything comes from the API
- Do not manually write types — derive them from the API response
- Do not add a league-level accordion or dropdown — leagues are flat and pressable
- Do not skip any query state (loading, error, empty)
- Do not recreate hooks or components that already exist

# What to Do

- remove all the sample data and use the actual data from the API
- use tailwind classes for all the styles and stylesheets for the difficult styles

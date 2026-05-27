# Sportykore — Waitlist site brand & UI reference

Brief for marketing and waitlisting pages. Derived from the mobile app design system (`tailwind.config.js`, `src/components/ui/Button.tsx`, `src/theme/fonts.ts`, intro screens, pattern components).

---

## Product name & positioning

**Name:** Sportykore

**Elevator pitch (adapt from intro):**  
Local football meets a broadcast-style feed — connect with leagues, follow live matches, and see clear stats built for organizers and fans.

**Headline variants (adapt from legacy in-app copy):**

- Badge-style label: **LOCAL BALL**
- Primary headline direction: **The gathering — where local leagues gather.**
- Supporting line:
  Connect with local leagues, track live matches, and dive into broadcast-level stats.

**Short slogan ideas for waitlist hero** (pick one lane):

| Style | Copy |
|--------|------|
| Community | Sportykore — **where local leagues gather.** |
| Action | **Local ball. Live matches. Clear stats.** |
| Product | **Your gathering place for grassroots football.** |

Tune copy for geography and dialect (e.g. Africa-first, Nigerian English) as your product settles.

---

## Voice & tone

- **Warm, direct, confident** — not corporate sportsbook.
- **Short sentences.** Favor verbs: gather, track, follow, organize.
- **Inclusive** wording: local leagues, teams, fans; avoid jargon.

---

## Color system

### Primary brand (purple)

| Token | Hex | Usage |
|--------|-----|--------|
| **Brand DEFAULT / 500** | `#4A148C` | Primary buttons, emphasis, selections |
| **Tailwind scale** | `brand.50`–`brand.900` | Fills, hovers (`600` `#3B1070`), subtle tints |

### Accent (gold)

| Token | Hex | Usage |
|--------|-----|--------|
| **Accent DEFAULT / 400–500** | `#E6A817` | Wordmark on dark, chips, tabs, emphasis |
| Lighter / CTA variants | `#F9B923`, `#F2A900`, `#FBE9B8` | Bright CTAs, sign-in yellow |

### Neutrals (UI patterns)

- **Dark canvas:** `#121212` (feed / headers / tab bar base)
- **Intro hero purple wash:** e.g. `#3C096C` over photography
- **Surfaces:** `#FFFFFF`, `#F5F5F5`, `#F8F8FA`, slate neutrals for forms and cards

### Auth-specific (button variants)

| Role | Hex |
|------|-----|
| Auth purple | `#5D2A8E` (active ~`#4f2478`) |
| Sign-in yellow | `#F2A900` |

### Live / urgent (sport UI)

- **Red:** `#ba0c2f` (live indicators, emphasis where used in app)

### Accessibility

- White on `#4A148C` and `#121212` is standard; check contrast for small gold text on white.
- Gold CTAs on web: pair with **dark label** (`#171717` / `#0f172a`) as in the app.

---

## Typography

App loads via `@expo-google-fonts`. Mirror on the waitlist site with the same families.

| Role | Font | Weights | Usage |
|------|------|---------|--------|
| **Wordmark** | **Pacifico** | 400 | Logo / “Sportykore” script only |
| **UI body** | **Open Sans** | 400 / 600 / 700 | Paragraphs, labels, buttons |
| **Display** | **Playfair Display** | 400 / 700 | Optional editorial headlines — use sparingly |

**Google Fonts link (web parity):**

`https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Pacifico&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap`

---

## Logo & naming

- **Full wordmark:** Sportykore in **Pacifico**, commonly **accent gold** (`#E6A817` or `#f9b923`) on purple or dark backgrounds.
- **Compact mark:** If you retain a short tab/icon label, define it explicitly for Sportykore (do not reuse legacy abbreviations).

Favicon / OG imagery should align with **purple + gold**.

---

## Buttons (app spec → web)

Source: `src/components/ui/Button.tsx`.

| Property | Value |
|----------|--------|
| **Default height** | `56px` (`h-14`) |
| **Horizontal padding** | `28px` (`px-7`) |
| **Border radius** | **`13px`** (`rounded-[13px]`) — canonical primary control radius |
| **Icon-only** | `56×56px`, same **13px** radius |
| **Label** | `text-base`, semibold |

### Variants

| Variant | Background | Label | Typical use |
|---------|-------------|-------|--------------|
| **primary** | `brand-500` → active `brand-600` | white | Primary actions |
| **secondary** | white, slate border | slate-900 | Secondary |
| **ghost** | transparent | slate-900 | Low emphasis |
| **accent** | `#f9b923` | `#171717` | Bright marketing CTA |
| **authPurple** | `#5D2A8E` (`#4f2478` active) | white | Auth emphasis |
| **signInYellow** | `#F2A900` | `#171717` | Sign-in funnel |

**Disabled / loading:** ~50% opacity; show a loading indicator.

---

## Layout & surface patterns

- **Marketing hero:** Saturated purple over **real grassroots football photography**; small **pill badges** for category labels (e.g. LOCAL BALL narrative, updated for Sportykore).
- **App-style dark chrome:** **`#121212`** + **diagonal gold stripes** — CSS approximation:

```css
repeating-linear-gradient(
  -45deg,
  #121212 0 18px,
  rgba(230, 168, 23, 0.08) 18px 20px
);
```

- **Cards:** Controls at **13px** radius; marketing cards often **22–28px**, white/light gray with `neutral-200` borders.

---

## Imagery

- Real local / street / pitch energy; avoid generic stock “stadium corporate” looks.
- **Purple wash** over hero photos so **gold + white type** stays legible.

---

## Footer / social one-liners (examples)

- *Sportykore — local football, clearer for everyone on the continent.*
- Footer: Privacy · Terms · Contact (as applicable)

---

## Repo / product alignment note

Expo config (`app.json`) may still use legacy **slug**, **scheme**, or **bundle id** from the previous product name. Update those when you ship Sportykore; this document is the **brand layer** for web waitlists and marketing.

---

*Synthesized from the Sportykore (formerly Gbako) mobile UI tokens and patterns.*

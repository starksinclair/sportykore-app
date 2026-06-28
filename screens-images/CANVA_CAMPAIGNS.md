# SportyKore — Canva & WhatsApp campaign kit

Brand colors, screenshot specs, and image prompts for Nigerian **WhatsApp Status** and **Instagram Story** campaigns.  
Place app captures in this folder (`screens-images/`) and drop them into Canva phone mockups.

**Canvas size:** **1080 × 1920 px** (9:16) — use Canva preset **Instagram Story** (same ratio as WhatsApp Status).

---

## Logo & brand colors (Canva)

Add these as **Brand Kit** document colors in Canva (hex values).

### Primary — purple

| Name | Hex | Canva use |
|------|-----|-----------|
| **Brand Purple** | `#4A148C` | Headers, backgrounds, primary buttons |
| Brand Purple Dark | `#3B1070` | Gradients, hover states |
| Brand Purple Deep | `#2C0C54` | Footer bands, depth |
| Brand Purple Light | `#E5D3F4` | Soft tints, badges |

### Accent — gold

| Name | Hex | Canva use |
|------|-----|-----------|
| **SportyKore Gold** | `#E6A817` | Wordmark, highlights, score numbers |
| Gold Bright | `#F2A900` | CTA buttons (pair with dark text) |
| Gold Soft | `#FBE9B8` | Warm backgrounds, chips |

### Neutrals & UI

| Name | Hex | Canva use |
|------|-----|-----------|
| **Dark Canvas** | `#121212` | Hero backgrounds (matches app headers) |
| White | `#FFFFFF` | Body text on dark, cards |
| Off-white | `#F8F8FA` | Light flyer backgrounds |
| Body text | `#171717` | Text on gold CTAs |
| Muted text | `#64748B` | Subcopy on light backgrounds |
| Live red | `#BA0C2F` | “LIVE” badges (optional) |

### Auth / CTA (optional)

| Name | Hex |
|------|-----|
| Auth Purple | `#5D2A8E` |
| Sign-in Yellow | `#F2A900` |

### Gradients (Canva)

- **Hero dark:** `#121212` → `#2C0C54` (top to bottom)
- **Purple CTA:** `#4A148C` → `#3B1070`
- **Gold glow:** `#FBE9B8` → `#E6A817` (subtle, behind phone mockup)

### Typography (Canva substitutes)

| App font | Canva / web substitute |
|----------|-------------------------|
| Pacifico (logo) | Pacifico |
| Playfair Display Bold (headlines) | Playfair Display |
| Open Sans (body) | Open Sans |

**Logo text:** “SportyKore” — gold `#E6A817` on dark, or purple `#4A148C` on white.

---

## Screenshot library (`screens-images/`)

All app screenshots in this folder are captured from the **iOS Simulator** using **iPhone 17 Pro**.

### Device & export specs (iPhone 17 Pro)

| Property | Value |
|----------|--------|
| **Source** | Xcode iOS Simulator → **iPhone 17 Pro** |
| **Capture** | `Cmd + S` in Simulator (File → Save Screen) — **100% scale**, not a Mac display crop |
| **Portrait PNG size** | **1206 × 2622 px** (native @3x) |
| **Logical size (points)** | 402 × 874 pt |
| **Aspect ratio** | ~**9 : 19.5** (taller than a 9:16 Story canvas) |
| **Display** | 6.3" — Dynamic Island at top |

Use these numbers when placing screenshots inside **Canva device frames**.

### Canva device frame tips

1. **Pick the matching frame:** Search Canva for **“iPhone 17 Pro”** or **“iPhone 16 Pro”** (same 6.3" class). Avoid generic frames sized for older 6.1" or 6.7" phones.
2. **Drop screenshot at full resolution:** Import the **1206 × 2622** PNG; let Canva scale inside the frame — do not pre-crop to 1080×1920 before inserting.
3. **Story canvas vs phone:** Your flyer is **1080 × 1920** (9:16). The simulator shot is **taller** — the frame will letterbox or clip slightly. Keep important UI (scores, stats, CTAs in the app) in the **vertical center** of the screenshot so nothing critical sits under the Dynamic Island or home-indicator area in the mockup.
4. **Safe area in mockup:** Leave the top ~8% (Dynamic Island) and bottom ~4% (home indicator) as non-critical chrome when composing captures.
5. **Do not stretch:** Lock aspect ratio when resizing the frame on the 1080×1920 canvas.

### Naming convention

```
screens-images/
├── onboarding.png          ← intro / live match hero (exists)
├── home-feed.png           ← scores & leagues feed
├── player-profile.png      ← player card & stats
├── league-detail.png       ← standings / league page
├── live-match.png          ← match detail with score
├── match-center.png        ← admin live scoring
├── profile.png             ← account / join league entry
├── join-league.png         ← paste invite code
├── manage-leagues.png      ← leagues you own
└── search.png              ← discover leagues (optional)
```

You do not need every file for every campaign — pick the one that matches the story.

---

## How each screen should look (capture guide)

Use these when taking screenshots so they read well on a small Status thumbnail.

### `onboarding.png` (reference: existing file)

- **Source:** iOS Simulator — **iPhone 17 Pro** (1206 × 2622 px).
- **Screen:** Intro onboarding slide with live match card (Eko Stars vs Tafawa FC style).
- **Feel:** Broadcast-style, dark header, gold score chip, “live” energy.
- **Flyer use:** “Real-time local football” / product launch hero.
- **Capture tips:** First onboarding slide with match visible; no personal data.

### `home-feed.png`

- **Screen:** Home tab — date strip, favourite leagues, live or recent match rows.
- **Should show:** At least one **score line** (e.g. `2 - 1`) and a **league name** (e.g. “Lagos Premier League”).
- **Feel:** Busy but readable; proves “my area’s football lives here.”
- **Avoid:** Empty state, loading spinners, error banners.

### `player-profile.png`

- **Screen:** Player detail — avatar/initial, name, country, stats or overview tab.
- **Should show:** Player name, **goals/assists or season stats**, league affiliation if visible.
- **Feel:** Pride — “this is *my* child / *my* record.”
- **Avoid:** Blank profile, “player not found,” placeholder IDs.

### `league-detail.png`

- **Screen:** League page — table, fixtures, or standings tab.
- **Should show:** **Team names** and **points or positions** (top 3–5 rows enough).
- **Feel:** Local rivalry — “who’s top of the league?”
- **Avoid:** Single team with no context; cropped table headers.

### `live-match.png`

- **Screen:** Match detail — two teams, score, status (live / FT), events or timeline.
- **Should show:** Clear **home vs away** names and **score**.
- **Feel:** Match day tension; shareable in group chats.
- **Prefer:** Live or recently finished game, not `0 - 0` scheduled unless that’s the story.

### `match-center.png`

- **Screen:** Manage → live match center — big score, +/− scoring, minute clock.
- **Should show:** **Live minute**, both team names, score not `0-0` if possible.
- **Feel:** “We run match day properly.”
- **Audience:** League admins, organisers.

### `profile.png`

- **Screen:** Profile — user header, **Join a league** row, sections visible.
- **Should show:** Signed-in state; **Join a league** or player profile row.
- **Feel:** Onboarding path — “here’s how you get in.”
- **Avoid:** Logged-out empty shell unless campaign is “Sign in.”

### `join-league.png`

- **Screen:** Join a league — invite code field (can show prefilled token blurred).
- **Should show:** Invite input, **Join league** button, optional league/team context card.
- **Feel:** Simple next step after WhatsApp invite.
- **Privacy:** Blur or fake token in screenshot used publicly.

### `manage-leagues.png`

- **Screen:** Manage tab — list of leagues you own.
- **Should show:** 1–2 league names with logos or placeholders.
- **Feel:** Organizer credibility.
- **Audience:** Admins considering creating a league.

### `search.png` (optional)

- **Screen:** Search modal — leagues or teams with flags/logos.
- **Should show:** Multiple **Nigerian or local** league/country results.
- **Feel:** Discovery — “find football near you.”

---

## Flyer layout template (Canva)

**Size:** **1080 × 1920 px** (9:16 — Instagram Story / WhatsApp Status)

```
┌─────────────────────────────┐
│  HEADLINE (Playfair Bold)   │  ← white or gold on purple/dark
│  Subline (Open Sans)        │  ← white 80% opacity
├─────────────────────────────┤
│                             │
│   [VECTOR ILLUSTRATION]     │  ← upper third, Nigerian context
│                             │
├─────────────────────────────┤
│      ┌───────────┐          │
│      │ SCREEN    │          │  ← iPhone 17 Pro frame (6.3")
│      │  IMAGE    │          │    1206×2622 PNG from Simulator
│      └───────────┘          │
├─────────────────────────────┤
│  CTA pill (gold #F2A900)    │  ← bottom safe zone
│  sportykore.com / link      │
└─────────────────────────────┘
```

- **Vector = emotion** (family, pitch, celebration).
- **Screenshot = proof** (real app UI).
- Keep headline readable at **thumbnail size** (test in Canva mobile preview).
- Keep critical copy in the **center safe zone** — avoid hugging the very top/bottom edges (Status UI overlays).

**Also works for WhatsApp chat:** You can export a **1080 × 1080** crop from the center if you need a square group-post variant.

---

## Campaign prompts (vector + screen reference)

Replace `[SCREEN]` with the file you add (e.g. `screens-images/player-profile.png`).  
In Canva: generate vector in AI / Elements, add an **iPhone 17 Pro** device frame, then drop the **1206 × 2622** simulator PNG inside it.

---

### 1. Your child’s stats — forever

**Audience:** Parents, Sunday league families  
**Screen:** `player-profile.png`  
**Screen should look like:** Named player, visible goal/assist or season stats, clean overview tab.

**Headline:** His goals. His season. Never forgotten.  
**Subline:** Every local league moment — saved on SportyKore.  
**CTA:** Join your league today

**Vector prompt (Canva / AI):**  
Flat vector illustration, Nigerian mother on sidelines of dusty local football pitch, young boy in jersey celebrating, mother holding phone (blank screen — you add screenshot in Canva), palm trees and compound buildings, warm sunset, emotional hopeful mood, colors purple `#4A148C` and gold `#E6A817`, minimal shapes, no photorealism, space for headline at top, 1080x1920

**WhatsApp caption:**  
Every goal. Every assist. Every season — saved for your child. SportyKore turns local football into stats your family can keep. Ask your league admin for an invite.

---

### 2. Scouts see local talent too

**Audience:** Talented players, parents, coaches  
**Screen:** `player-profile.png` or `home-feed.png`  
**Screen should look like:** Stats visible, or feed showing competitive league context.

**Headline:** Local league. Real numbers. One profile.  
**Subline:** Build your SportyKore player card — goals, league, season.  
**CTA:** Get on the radar

**Vector prompt:**  
Vector graphic, confident young Nigerian footballer, floating stat badges (goals, assists), gold connection lines to phone silhouette, purple dark background `#121212`, scout figure subtle in background, aspirational, headline area top, flat design 1080x1920

**WhatsApp caption:**  
Talent in your area deserves to be seen. One player profile — your stats, your league, your story. SportyKore.

---

### 3. Who’s top of your area?

**Audience:** Fans, estate leagues, WhatsApp groups  
**Screen:** `league-detail.png` or `home-feed.png`  
**Screen should look like:** Standings table or multiple scores with recognisable team names.

**Headline:** Sunday league — but with real standings.  
**Subline:** Follow scores and tables for leagues near you.  
**CTA:** See your area on SportyKore

**Vector prompt:**  
Flat vector, Nigerian neighbourhood football rivalry, two team shields, leaderboard podium 1-2-3, small crowd with phones, festive energy, purple header gold accents, map pin icon, 1080x1920, no real club logos

**WhatsApp caption:**  
No more arguing in the group chat. Check the table on SportyKore. Share with your league 👇

---

### 4. Run match day like the pros

**Audience:** League admins, coaches  
**Screen:** `match-center.png`  
**Screen should look like:** Live score, minute clock, both teams named, scoreboard visible.

**Headline:** Stop the screenshot scores.  
**Subline:** Live match center for your league — on SportyKore.  
**CTA:** Create your league free

**Vector prompt:**  
Vector illustration, Nigerian league admin with whistle and phone, left side chaotic chat bubbles right side clean scoreboard 2-1, gold trophy, purple brand frame, professional warm tone, 1080x1920

**WhatsApp caption:**  
Tired of disputed results? Run live scores and rosters properly. SportyKore for league organisers.

---

### 5. You got the invite — make it official

**Audience:** Players joining via admin invite  
**Screen:** `join-league.png` or `profile.png`  
**Screen should look like:** Join flow clear — invite field + button, or Profile → Join a league row.

**Headline:** You’re on the team. Prove it.  
**Subline:** Paste your invite on SportyKore — Profile → Join a league.  
**CTA:** Download SportyKore

**Vector prompt:**  
Emotional vector, teenager with phone golden glow, teammates lining up in background, jersey name tag filling in, purple and gold, soft sunset Nigerian setting, 1080x1920

**WhatsApp caption:**  
Got the link from your admin? Open SportyKore → Profile → Join a league. Your name on the sheet starts here.

---

### 6. “Daddy, how many goals did I score?”

**Audience:** Parents (high share in family groups)  
**Screen:** `player-profile.png`  
**Screen should look like:** Clear goal count or stats section — number should be readable in mockup.

**Headline:** 7 goals. One season. Forever.  
**Subline:** SportyKore tracks every local league goal.  
**CTA:** Join your child’s league

**Vector prompt:**  
Heartwarming flat vector, Nigerian father and daughter on sofa, daughter in kit, father showing phone (blank — add screenshot), football boots by door, warm interior, purple UI accent on phone, 1080x1920

**WhatsApp caption:**  
“Daddy, how many goals?” — Now you’ll always know. SportyKore.

---

### 7. Local ball. Live matches. (Product launch)

**Audience:** Broad Nigerian football community  
**Screen:** `onboarding.png` or `home-feed.png`  
**Screen should look like:** Live match card or feed with gold score styling — matches brand intro.

**Headline:** Where local leagues gather.  
**Subline:** Live scores. Clear stats. Your community.  
**CTA:** Download SportyKore

**Vector prompt:**  
Bold vector hero, diverse Nigerian football fans watching pitch at dusk, gold live dot pulse, purple sky gradient `#2C0C54` to `#121212`, modern flat style, large headline zone, 1080x1920

**WhatsApp caption:**  
Grassroots football deserves broadcast-level care. SportyKore — local leagues, live matches, real stats.

---

## Automated flyers (`make_flyer.py`)

Campaign copy is machine-readable in `campaigns.json` (same seven prompts as below).  
Generate a **1080 × 1920** PNG without Canva:

```bash
cd screens-images
pip install -r requirements-flyer.txt
# Copy fonts into screens-images/fonts/ (Pacifico, Open Sans Variable, Playfair Display Variable)

python make_flyer.py --list
python make_flyer.py --campaign 7
python make_flyer.py --campaign 1 --screen player-profile.png
python make_flyer.py --campaign 3 --vector my-illustration.png -o output/standings.png
```

**Optional local LLM for vector art** (screenshots should stay real simulator PNGs):

```bash
ollama pull flux          # image model
ollama pull llama3.2      # optional prompt expansion
python make_flyer.py --campaign 6 --generate-vector --enhance-vector-prompt
```

- `--vector` — use art you made in Canva / another tool  
- `--generate-vector` — Ollama image model (`--ollama-image-model flux`)  
- `--enhance-vector-prompt` — local text LLM expands the vector brief first  

Outputs land in `screens-images/output/` plus a `.caption.txt` WhatsApp caption.

---

## WhatsApp & Instagram delivery checklist

- [ ] **1080 × 1920** export from Canva (Instagram Story preset → WhatsApp Status)
- [ ] Simulator screenshots from **iPhone 17 Pro** at **1206 × 2622** inside matching Canva frame
- [ ] Headline readable in mobile preview / Status thumbnail
- [ ] One CTA only (link or “Download on App Store / Play Store”)
- [ ] Screenshot cropped inside phone — no tiny unreadable UI
- [ ] Blur tokens, emails, real phone numbers in public assets
- [ ] Optional Pidgin line for reach: *“Your pikin score dey for app — no forget again.”*
- [ ] Status series: Day 1 vector emotion → Day 2 screenshot proof → Day 3 testimonial quote
- [ ] Optional: duplicate design as **1080 × 1080** square for WhatsApp group forwards

---

## Quick screen → campaign map

| Campaign theme | Best screen file | What must be visible in capture |
|----------------|------------------|----------------------------------|
| Kids’ stats | `player-profile.png` | Name + goals/stats |
| Scouts / visibility | `player-profile.png` | Stats + league context |
| Area standings | `league-detail.png` | Table or top teams |
| Match day drama | `live-match.png` | Score + team names |
| Admin / organiser | `match-center.png` | Live score + minute |
| Join via invite | `join-league.png` | Invite field + CTA |
| Product / launch | `onboarding.png` | Live match card |
| Discovery | `search.png` | Multiple leagues/countries |

---

*SportyKore brand colors from `tailwind.config.js`. Screenshots: iOS Simulator, iPhone 17 Pro (1206×2622). Update this doc when new key screens ship.*

# Cursor AI briefing — Sportykore waitlist (premium direction)

Use this file **with** [`WAITLIST_BRAND_GUIDE.md`](./WAITLIST_BRAND_GUIDE.md). The brand guide is the source of truth for tokens; **this** file is what you copy into Cursor so the output stays restrained, editorial, and on-brand.

---

## How to use in Cursor

1. **@ mention** `documentations/WAITLIST_BRAND_GUIDE.md` in your chat.
2. **@ mention** this file after you’ve filled the bracketed sections below (or paste those blocks inline).
3. Add **3–8 reference URLs** or attach screenshots in the chat if you have them.
4. State your **stack** (Next.js, Astro, vanilla, etc.) once; don’t assume Cursor knows.

Optional one-liner prompt pattern:

> Build a single-page waitlist for Sportykore using @WAITLIST_BRAND_GUIDE.md and my filled @WAITLIST_CURSOR_BRIEF.md. Follow the “Do not” list. Mobile-first, accessible contrast, one primary CTA.

---

## 1. Goal & success

**Primary goal:** `[e.g. collect emails for App Store launch / notify when Android drops / invite league admins first]`

**Success metric:** `[e.g. submit rate, qualitative feedback, influencer shares]`

**Launch scope:** `[single-page only / page + thanks / page + blog stub]`

---

## 2. Audience

**Who lands here:** `[fans / league organizers / both — be specific]`

**Primary geography:** `[e.g. Nigeria first, West Africa, global]`

**Languages:** `[e.g. English (UK) only for v1]`

---

## 3. Hero & copy (fill before build)

**Chosen slogan line (one):**  
`[Paste one line from the brand guide table or your final line]`

**Headline (≤8 words if possible):**  
`[Your headline]`

**Subhead (1–2 sentences, specific):**  
`[Your subhead — avoid “revolutionary platform”]`

**Primary CTA label:** `[e.g. Join the waitlist]`  
**Secondary CTA (optional):** `[e.g. Watch a 30s clip — link TBD]`

**Micro-trust line (optional, only if honest):**  
`[e.g. Built with local organizers in Lagos / In private beta with N leagues]`

---

## 4. Value props (exactly 3 bullets)

Keep them **concrete** (what the user gets), not feature soup.

1. `[bullet]`
2. `[bullet]`
3. `[bullet]`

---

## 5. Form & backend

**Fields:** `[email only / name + email / + role dropdown: fan | organizer]`

**Submit behaviour:** `[redirect to thank-you / inline success / double opt-in mention if applicable]`

**Integrations:** `[Formspree ID / Loops / Beehiiv / custom POST to ___]`

**Spam / validation:** `[honeypot yes/no, rate limit handled by ___]`

---

## 6. Tech stack (pick and state)

**Framework:** `[e.g. Next.js 15 App Router / Astro / Vite + React]`

**Styling:** `[e.g. Tailwind v4 / CSS modules]`

**Hosting:** `[e.g. Vercel / Cloudflare Pages]`

**Analytics:** `[e.g. Plausible / PostHog / none]`

**Domain:** `[e.g. waitlist.sportykore.com — or TBD]`

---

## 7. Assets

**Logo:** `[path or “use text wordmark per brand guide — Pacifico not required on web if licensing”]`

**Hero image:** `[describe mood + aspect ratio, or attach file / Unsplash search terms]`

**OG image:** `[1200×630 — use brand purple + gold wordmark or hero still]`

---

## 8. Reference sites (premium bar)

Paste links and **one line each** on what to borrow (layout, type, motion, not colors).

1. `[URL]` — `[why]`
2. `[URL]` — `[why]`
3. `[URL]` — `[why]`

---

## 9. “Premium” direction (non-negotiables)

Tell Cursor to treat these as requirements:

- **Editorial restraint:** one hero, strong type hierarchy, generous whitespace, no “five equal cards in a row” unless justified.
- **Typography:** follow the brand guide (Open Sans body; Pacifico **only** for the wordmark if used; Playfair optional sparingly).
- **Color:** purple + gold system from the brand guide; dark sections may use `#121212` and stripe pattern from the guide.
- **Motion:** subtle fades / small parallax max — no flashy autoplay gimmicks.
- **Accessibility:** visible focus rings, semantic headings (`h1` once), WCAG-ish contrast on buttons and links.
- **Performance:** optimize hero image (responsive `srcset`, modern format), lazy below fold.

---

## 10. Do not (anti-patterns)

Customize this list — it stops “generic SaaS landing page” drift.

- `[ ] No Inter / Roboto / system-font-only stack unless you explicitly choose it`
- `[ ] No rainbow gradients unrelated to Sportykore palette`
- `[ ] No fake metrics (“10,000+ users”) unless verified`
- `[ ] No wall of emoji icons`
- `[ ] No lorem ipsum — use plausible placeholder copy if needed`

---

## 11. FAQs (optional block)

Paste 4–6 real questions **or** ask Cursor to draft from product facts and tag `[REVIEW]` for you.

---

## 12. Post-build QA (ask Cursor to self-check)

- [ ] Lighthouse: performance / accessibility sanity (no obsession, no lying scores)
- [ ] Mobile viewport: tap targets, no horizontal scroll
- [ ] Form: empty state, error state, loading state, success state
- [ ] Meta: title, description, OG tags, favicon link

---

## Master prompt scaffold (copy & edit)

```
You are implementing a premium, professional waitlist page for Sportykore.

Brand + UI tokens: follow documentations/WAITLIST_BRAND_GUIDE.md exactly for colors,
typography roles, button radius (13px for primary buttons), and voice.

Product context:
- Audience: [...]
- Hero headline: [...]
- Subhead: [...]
- Primary CTA: [...]

Tech:
- [...]

Implement:
1) Responsive layout with one clear hero and a single dominant CTA.
2) Waitlist form wired to [...] with validation + accessible errors.
3) Thank-you / success path: [...]

Avoid:
[list from section 10]

After implementation, list any assumptions and run through section 12 checks.
```

---

*Companion to `WAITLIST_BRAND_GUIDE.md` — edit the bracketed fields per launch.*

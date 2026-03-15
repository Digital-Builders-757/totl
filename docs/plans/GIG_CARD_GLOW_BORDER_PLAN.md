# Gig Card Glow Border Effect — Design Plan

**Date:** March 14, 2026  
**Status:** ✅ IMPLEMENTED (Approach C)  
**Feature:** Add spotlight/glow border effect to gig cards using the provided GlowCard component

---

## Diagrams Used

| Diagram | Why |
|---------|-----|
| `docs/diagrams/airport-model.md` | Classifies zones; this feature touches **Terminal** (UI) only. |
| `docs/diagrams/role-surfaces.md` | Gig cards appear in Talent terminal (`/gigs`) and marketing (homepage Featured Opportunities). |
| `docs/features/UI_VISUAL_LANGUAGE.md` | Defines `card-backlit`, `panel-frosted`; glow effect must align with back-lit minimalism. |

**Not used:** `signup-bootstrap-flow`, `infrastructure-flow`, `core-transaction-sequence`, `system-map-full` — no auth, server actions, Stripe, or DB changes.

---

## STEP 1 — Constitution Invariants (5 Bullets)

1. **UI stays in Terminal.**  
   Glow effect is presentation-only. No middleware, auth, or routing changes.

2. **No DB calls in client components.**  
   GlowCard uses `useEffect`/`useRef` (client component). It must not fetch data; parent pages remain Server Components that pass gig data as props.

3. **All mutations are server-side.**  
   Not applicable — no mutations.

4. **No `select('*')`.**  
   Not applicable — no new queries.

5. **RLS is final authority.**  
   Not applicable — no data access changes.

**RED ZONE INVOLVED: NO**

---

## STEP 2 — Airport Map (Architectural Zones)

| Zone | Touched? | Why | Responsibility to stay OUT |
|------|----------|-----|----------------------------|
| **Terminal** | ✅ Yes | Gig cards are UI; glow effect is a visual enhancement. | No business logic, no DB reads. |
| Security | ❌ No | — | — |
| Staff | ❌ No | — | — |
| Ticketing | ❌ No | — | — |
| Announcements | ❌ No | — | — |
| Baggage | ❌ No | — | — |
| Locks | ❌ No | — | — |
| Control Tower | ❌ No | — | — |

**Zone violations to avoid:** Do not add Supabase/Stripe calls inside the glow card or its wrapper.

---

## STEP 3 — Design Proposals (Minimal Diffs)

### Current State

- **Gig cards** are inline in `app/gigs/page.tsx` (lines 446–503): outer `<div>` with `card-backlit`, `overflow-hidden`, `group`, `cursor-pointer`, `active:scale-95 sm:hover:scale-[1.02]`; image (`aspect-4-3`), metadata, CTA.
- **Homepage Featured Opportunities** in `app/page.tsx` (lines 143–199): same visual recipe, different CTA (links to `/choose-role`).
- **Tests** (`tests/talent/talent-functionality.spec.ts`) expect `[data-testid="gig-card"]` — current cards do **not** have this; tests may be failing or using fallback selectors.

### Approach A — GlowCard as Wrapper (Recommended)

**Description:** Add `components/ui/spotlight-card.tsx` (GlowCard). Create a shared `GigCard` client component that wraps content with GlowCard. Use `customSize={true}` so cards fill grid cells. Replace inline card markup in `/gigs` and homepage with `<GigCard>`.

**Files expected to change:**

| File | Change |
|------|--------|
| `components/ui/spotlight-card.tsx` | **New.** GlowCard component (user-provided). Rename export to `SpotlightCard` or keep `GlowCard`; fix duplicate style injection (see risks). |
| `components/gigs/gig-card.tsx` | **New.** Client component: `<SpotlightCard customSize glowColor="purple">` wrapping image + metadata + CTA. Accepts `gig`, `profile`, `variant` (e.g. `"browse"` vs `"featured"`). |
| `app/gigs/page.tsx` | Replace inline card markup with `<GigCard gig={gig} profile={profile} />`. Add `data-testid="gig-card"` for tests. |
| `app/page.tsx` | Replace inline featured card markup with `<GigCard gig={...} variant="featured" />`. |

**Data model impact:** None.

**Key risks:**

- **Duplicate style injection:** Each GlowCard instance injects identical `<style dangerouslySetInnerHTML>`. Move shared styles to a single provider or `globals.css` to avoid duplication.
- **Pointer move scope:** GlowCard uses `document.addEventListener('pointermove')`. All cards share cursor position — glow follows cursor across page. Acceptable for gallery UX.
- **Client boundary:** GigCard becomes a client component. Parent pages stay Server Components; they pass serializable props only.

**Respects:** Constitution (UI only), Airport (Terminal only), UI Visual Language (adds glow without replacing `card-backlit` semantics).

---

### Approach B — CSS-Only Glow (No New Component)

**Description:** Extract the glow effect into CSS/Tailwind. Add a `.gig-card-glow` class that uses `@property` or `mask` + `radial-gradient` with `var(--mouse-x)`, `var(--mouse-y)` set by a single parent `GigCardsGrid` client component that listens to `pointermove` and sets CSS variables on a container.

**Files expected to change:**

| File | Change |
|------|--------|
| `app/globals.css` | Add `.gig-card-glow` and `::before`/`::after` rules (from GlowCard’s `beforeAfterStyles`). |
| `components/gigs/gig-cards-grid.tsx` | **New.** Client component wrapping the grid; listens to `pointermove`, sets `--x`, `--y` on container; children receive via `inherit` or explicit vars. |
| `app/gigs/page.tsx` | Wrap grid with `<GigCardsGrid>`, add `gig-card-glow` to each card. |
| `app/page.tsx` | Same for Featured Opportunities grid. |

**Data model impact:** None.

**Key risks:**

- **Complexity:** Replicating GlowCard’s pseudo-element logic in CSS requires careful maintenance. `mask-composite` and `background-attachment: fixed` can be brittle.
- **Reusability:** Less reusable than a component; future “glow” usage elsewhere would need to duplicate or refactor.

**Respects:** Constitution, Airport, UI Visual Language.

---

### Approach C — Hybrid: GlowCard + Shared Style Provider

**Description:** Same as A, but add a `GlowStyleProvider` that injects the shared `<style>` once at app root. GlowCard checks for provider and skips its own injection if present.

**Files expected to change:**

| File | Change |
|------|--------|
| `components/ui/spotlight-card.tsx` | GlowCard with optional `useGlowStyles` context to avoid duplicate injection. |
| `components/providers/glow-style-provider.tsx` | **New.** Injects `beforeAfterStyles` once. |
| `app/layout.tsx` | Wrap with `<GlowStyleProvider>` (or include in existing provider tree). |
| `components/gigs/gig-card.tsx` | Same as A. |
| `app/gigs/page.tsx`, `app/page.tsx` | Same as A. |

**Data model impact:** None.

**Key risks:**

- **Provider overhead:** Extra provider in layout; minimal impact.
- **SSR:** Style injection must run client-side; ensure no flash.

**Respects:** Constitution, Airport, UI Visual Language; improves A by fixing style duplication.

---

## STEP 4 — Acceptance Criteria (Definition of Done)

| Criterion | Verifiable How |
|-----------|----------------|
| **UI behavior** | Gig cards on `/gigs` and homepage Featured Opportunities show a cursor-following glow border. |
| **Data correctness** | No change to gig data display; title, description, metadata, CTA unchanged. |
| **Permissions** | No change; subscription-aware obfuscation (e.g. `getGigDisplayTitle`) remains in parent. |
| **Failure cases** | No redirect loops; no new DB/Stripe calls; `prefers-reduced-motion` respected (glow can be disabled or simplified). |
| **Tests** | `[data-testid="gig-card"]` present and tests pass. |
| **Mobile** | Glow effect works or degrades gracefully on touch (e.g. last touch position or no glow). |

---

## STEP 5 — Test Plan

### Manual Test Steps

1. **Happy path:** Sign in as talent → `/gigs` → move cursor over cards → glow follows cursor.
2. **Homepage:** Visit `/` → scroll to Featured Opportunities → move cursor over cards → glow follows.
3. **Click-through:** Click gig card → navigates to `/gigs/[id]`; no regression.
4. **Mobile:** Touch cards; verify no layout shift or performance issues; glow may use last touch position or be disabled.
5. **Reduced motion:** Enable `prefers-reduced-motion: reduce` → verify no jarring animation (or glow disabled).

### Automated Tests

- Ensure `tests/talent/talent-functionality.spec.ts` passes: add `data-testid="gig-card"` to gig cards if missing.
- No new E2E tests required for glow effect (visual); optional visual regression if tooling exists.

### RED ZONE Regression

- N/A — no middleware, auth, Stripe, or RLS changes.

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

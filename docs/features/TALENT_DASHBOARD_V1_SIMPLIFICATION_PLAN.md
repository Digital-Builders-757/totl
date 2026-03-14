# Talent Dashboard v1 Simplification Plan

**Status:** ✅ Implemented (March 2026)

**Context:** User feedback (lion + bluhze) — the 6 KPI cards at the top feel overwhelming for v1. Models signing up want: upload photo/stats/contact, see a board of listings, and know if they were **denied or accepted** for a job + **earnings**. Profile views and success rate are not important for v1.

---

## 1. Problem Summary

| Issue | Description |
|-------|-------------|
| **Overwhelming** | 6 metric cards (Profile Views, Total Applications, Accepted, Earnings, Rating, Success Rate) is too much for v1 |
| **Wrong priority** | Profile Views and Success Rate are low value for new users |
| **Core need** | Users care most about: **accepted/denied status** and **earnings** |
| **Alignment bug** | "Next action" text still slightly misaligned across cards |

---

## 2. Proposed Changes

### Phase 1: Reduce KPI Cards (Desktop)

**Current:** 6 cards in a row (`md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`)

**Proposed:** Show only **3 cards** for v1:

| Keep | Drop (for v1) | Rationale |
|------|----------------|-----------|
| **Total Applications** | Profile Views | Users want to know how many they've applied to |
| **Accepted** | Rating | Core: "was I accepted or denied?" |
| **Earnings** | Success Rate | Core: "how much am I making?" |

**Implementation options:**

- **Option A (recommended):** Remove the 3 cards (Profile Views, Rating, Success Rate) from the grid. Keep Total Applications, Accepted, Earnings. Grid becomes `xl:grid-cols-3` for a cleaner row.
- **Option B:** Hide the entire 6-card row on desktop and rely on the existing **MobileSummaryRow** (which already shows Applications, Accepted, Active opportunities, New) — but that component is `md:hidden`, so we'd need to show it on desktop too or create a simplified desktop summary.
- **Option C:** Move dropped metrics to a collapsible "More stats" section below the main content (future enhancement).

**Recommendation:** Option A — keep 3 cards, remove 3. Minimal code change, clear v1 focus.

---

### Phase 2: Fix "Next action" Alignment

**Current:** `.card-footer-row` uses `flex-direction: column` with `align-items: flex-start`. The footer contains:
- `<span>Next action</span>`
- `<Link>...</Link>`

**Possible causes of misalignment:**
1. **Variable card height:** Number values (0, $0, 0%) have different widths; card content height may vary, pushing footers to different vertical positions.
2. **Link text wrap:** "Apply to more opportunities" wraps vs "Improve profile" stays on one line — causes inconsistent footer height.
3. **Grid layout:** Cards in a row may not have equal height if content differs.

**Proposed fixes:**

1. **Ensure equal card height:** Add `flex flex-col` to each Card and `flex-1` to the footer wrapper so footers align at the bottom of equal-height cards.
2. **Constrain link text:** Use `line-clamp-1` or `truncate` on the link so it doesn't wrap, or shorten copy (e.g. "Apply to gigs" instead of "Apply to more opportunities").
3. **Add `min-height` to footer:** Give `.card-footer-row` a `min-height` so all footers occupy the same vertical space even if link text varies.

**Recommended approach:** Use `flex-1` on the content area and `mt-auto` on the footer so it sticks to the bottom of each card, ensuring alignment across the row. Structure:

```tsx
<CardContent className="p-4 flex flex-col flex-1">
  <div className="space-y-3 flex-1">
    {/* header + value */}
  </div>
  <div className="card-footer-row mt-auto">
    ...
  </div>
</CardContent>
```

(Requires Card to be `flex flex-col` and CardContent to grow.)

---

### Phase 3: Surface "Denied/Accepted" More Prominently

**User need:** "See if we were denied or accepted for a job"

**Current:** Applications tab has status filters (New, Accepted, Rejected). Overview tab shows "Accepted" count and "Upcoming Opportunities" for accepted gigs.

**Proposed:**
- Ensure the **Applications** tab is easy to find and clearly shows status (Accepted / Rejected / New).
- Consider a small "Recent activity" or "Application status" summary in the Overview tab that highlights: "X new, Y accepted, Z rejected" — this could replace or complement the Quick Stats card.
- No major structural change needed; the Applications tab already supports this. Optional: add a one-line status summary near the top of Overview.

---

## 4. Files to Modify

| File | Changes |
|------|---------|
| `app/talent/dashboard/client.tsx` | Remove Profile Views, Rating, Success Rate cards; adjust grid to 3 columns; fix card footer alignment |
| `app/globals.css` | Possibly tweak `.card-footer-row` or add `.card-content-flex` if needed |
| `docs/guides/TOTL_AGENCY_USER_GUIDE.md` | Update "Top Stats Cards" section to reflect 3 cards |
| `MVP_STATUS_NOTION.md` | Note v1 simplification in changelog |

---

## 5. Mobile Behavior

**Current:** `MobileSummaryRow` shows 4 items (Applications, Accepted, Active opportunities, New) — **no change needed**. It's already simpler and doesn't include Profile Views, Rating, Success Rate.

The 6-card grid is `hidden` on mobile (`md:hidden` on MobileSummaryRow, `hidden md:grid` on the cards), so mobile users only see the 4-item summary. Desktop gets the simplified 3-card row.

---

## 6. Rollback

- Revert the 3 removed cards from git if needed.
- No schema or API changes; purely UI.

---

## 7. Testing Checklist

- [ ] Desktop: 3 cards visible (Total Applications, Accepted, Earnings)
- [ ] Desktop: "Next action" + link aligned across all 3 cards
- [ ] Mobile: MobileSummaryRow unchanged (4 items)
- [ ] Overview tab: Profile Strength, Available Opportunities, Quick Stats, Upcoming Opportunities still render
- [ ] Applications tab: Status filters work (New, Accepted, Rejected)
- [ ] `npm run build` passes
- [ ] `tests/talent/talent-dashboard-route.spec.ts` passes (no assertions on specific cards)

---

## 8. Future (Post-v1)

- Reintroduce Profile Views, Rating, Success Rate in a "More stats" expandable section or Settings/Analytics page.
- Add real earnings data (currently hardcoded $0).
- Add real profile view tracking if product requires it.
- **Primary CTA:** One big "Browse gigs" / "Find gigs near me" button near the top; everything else secondary. Reinforces "companion" energy now that the KPI row is calmer.

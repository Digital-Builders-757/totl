"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VISIBLE_GIG_CATEGORIES, getCategoryLabel } from "@/lib/constants/gig-categories";
import { GIGS_SORT_OPTIONS, type GigsSortValue } from "@/lib/constants/gigs-sort";
import { PAY_RANGE_OPTIONS, type PayRangeValue } from "@/lib/constants/pay-range-filter";
import { RADIUS_OPTIONS, type RadiusValue } from "@/lib/constants/radius-filter";
import { cn } from "@/lib/utils";

/** YYYY-MM-DD in user's local timezone */
function getLocalDateString(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export interface GigsFilterFormProps {
  rawKeyword: string;
  category: string;
  location: string;
  radiusMiles: RadiusValue;
  compensation: string;
  payRange: PayRangeValue;
  sort: GigsSortValue;
  upcoming: boolean;
}

export function GigsFilterForm({
  rawKeyword,
  category,
  location,
  radiusMiles,
  compensation,
  payRange,
  sort,
  upcoming,
}: GigsFilterFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(
      radiusMiles ||
        compensation ||
        payRange ||
        sort !== "newest" ||
        upcoming
    )
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const upcomingInput = form.elements.namedItem("upcoming") as HTMLInputElement | null;
    if (upcomingInput?.checked) {
      let localDateInput = form.elements.namedItem("local_date") as HTMLInputElement | null;
      if (!localDateInput) {
        localDateInput = document.createElement("input");
        localDateInput.type = "hidden";
        localDateInput.name = "local_date";
        form.appendChild(localDateInput);
      }
      localDateInput.value = getLocalDateString();
    }
  };

  const activeFilterCount =
    Number(Boolean(rawKeyword)) +
    Number(Boolean(category)) +
    Number(Boolean(location)) +
    Number(Boolean(radiusMiles)) +
    Number(Boolean(compensation)) +
    Number(Boolean(payRange)) +
    Number(sort !== "newest") +
    Number(upcoming);

  const submitWithCategory = (categoryValue: string) => {
    const form = formRef.current;
    if (!form) return;

    const categoryInput = form.elements.namedItem("category") as HTMLSelectElement | null;
    const pageInput = form.elements.namedItem("page") as HTMLInputElement | null;
    if (categoryInput) categoryInput.value = categoryValue;
    if (pageInput) pageInput.value = "1";
    form.requestSubmit();
  };

  const submitWithUpcomingToggle = () => {
    const form = formRef.current;
    if (!form) return;

    const upcomingInput = form.elements.namedItem("upcoming") as HTMLInputElement | null;
    const pageInput = form.elements.namedItem("page") as HTMLInputElement | null;
    if (upcomingInput) upcomingInput.checked = !upcomingInput.checked;
    if (pageInput) pageInput.value = "1";
    form.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4 sm:gap-5 md:gap-6 relative z-10"
      method="get"
      onSubmit={handleSubmit}
    >
      <div className="panel-frosted rounded-2xl border border-white/10 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => submitWithCategory("modeling")}
              className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/12"
            >
              Modeling
            </button>
            <button
              type="button"
              onClick={() => submitWithCategory("acting")}
              className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/12"
            >
              Acting
            </button>
            <button
              type="button"
              onClick={() => submitWithCategory("designers")}
              className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/12"
            >
              Designers
            </button>
            <button
              type="button"
              onClick={() => submitWithCategory("crew")}
              className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/12"
            >
              Crew
            </button>
            <button
              type="button"
              onClick={submitWithUpcomingToggle}
              className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:bg-violet-400/20"
            >
              Upcoming
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--oklch-text-tertiary)]">
            <span>
              {activeFilterCount > 0
                ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`
                : "No filters active"}
            </span>
            {activeFilterCount > 0 ? (
              <Link href="/gigs" className="text-white underline-offset-4 transition hover:text-violet-100 hover:underline">
                Clear all
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <div className="relative flex-grow">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <Input
          name="q"
          defaultValue={rawKeyword}
          placeholder="Search keywords..."
          className="min-h-[52px] border-border/50 bg-card/45 py-4 pl-10 text-base text-white sm:h-14 sm:pl-12 sm:py-5 md:h-16 md:py-6 md:text-lg md:text-xl"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
        <select
          name="category"
          defaultValue={category}
          className="min-h-[52px] rounded-lg border border-border/50 bg-card/45 px-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-ring/40 sm:h-14 md:h-16"
        >
          <option value="">All opportunity types</option>
          {VISIBLE_GIG_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>

        <Input
          name="location"
          defaultValue={location}
          placeholder="City or address"
          className="min-h-[52px] border-border/50 bg-card/45 text-base text-white sm:h-14 md:h-16"
        />

        <div className="sm:col-span-2 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] w-full border-border/50 text-white hover:bg-white/10 sm:w-fit"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {advancedOpen ? "Hide filters" : "More filters"}
          </Button>

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4", !advancedOpen && "hidden")}
          >
            <select
              name="radius_miles"
              defaultValue={radiusMiles}
              className="min-h-[52px] rounded-lg border border-border/50 bg-card/45 px-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-ring/40 sm:h-14 md:h-16"
              title="Within X miles of location (requires location)"
            >
              {RADIUS_OPTIONS.map((opt) => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Input
              name="compensation"
              defaultValue={compensation}
              placeholder="Compensation (keyword)"
              className="min-h-[52px] border-border/50 bg-card/45 text-base text-white sm:h-14 md:h-16"
            />

            <select
              name="pay_range"
              defaultValue={payRange}
              className="min-h-[52px] rounded-lg border border-border/50 bg-card/45 px-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-ring/40 sm:h-14 md:h-16"
            >
              {PAY_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              name="sort"
              defaultValue={sort}
              className="min-h-[52px] rounded-lg border border-border/50 bg-card/45 px-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-ring/40 sm:h-14 md:h-16"
            >
              {GIGS_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="flex min-h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-card/45 px-3 text-base text-white sm:h-14 sm:gap-3 md:col-span-3">
              <input
                type="checkbox"
                name="upcoming"
                value="1"
                defaultChecked={upcoming}
                className="rounded border-gray-500"
              />
              <span>Upcoming only (date ≥ today)</span>
            </label>
          </div>
        </div>

        <input type="hidden" name="page" value="1" />
      </div>
      <Button
        type="submit"
        className="button-glow px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg border-0 min-h-[52px] w-full sm:w-auto sm:self-start"
      >
        Search
      </Button>
    </form>
  );
}

"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

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

  return (
    <form
      className="flex flex-col gap-4 sm:gap-5 md:gap-6 relative z-10"
      method="get"
      onSubmit={handleSubmit}
    >
      <div className="relative flex-grow">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <Input
          name="q"
          defaultValue={rawKeyword}
          placeholder="Search keywords..."
          className="input-glow pl-10 sm:pl-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
        <select
          name="category"
          defaultValue={category}
          className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] text-white border-[var(--oklch-border)] rounded-lg px-3 focus:ring-2 focus:ring-white/20 text-base"
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
          className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white text-base"
        />

        <div className="sm:col-span-2 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] border-[var(--oklch-border)] text-white hover:bg-white/10 w-full sm:w-fit"
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
              className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] text-white border-[var(--oklch-border)] rounded-lg px-3 focus:ring-2 focus:ring-white/20 text-base"
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
              className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white text-base"
            />

            <select
              name="pay_range"
              defaultValue={payRange}
              className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] text-white border-[var(--oklch-border)] rounded-lg px-3 focus:ring-2 focus:ring-white/20 text-base"
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
              className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] text-white border-[var(--oklch-border)] rounded-lg px-3 focus:ring-2 focus:ring-white/20 text-base"
            >
              {GIGS_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 sm:gap-3 min-h-[52px] sm:h-14 px-3 rounded-lg bg-[var(--oklch-surface)] border border-[var(--oklch-border)] text-white text-base cursor-pointer md:col-span-3">
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

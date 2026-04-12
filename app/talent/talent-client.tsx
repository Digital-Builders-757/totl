"use client";

import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils/utils";

// Custom type matching the actual selected fields from server query
type TalentProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  experience: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    avatar_url: string | null;
    avatar_path: string | null;
    display_name: string | null;
  };
};

interface TalentClientProps {
  initialTalent: TalentProfile[];
}

export default function TalentClient({ initialTalent }: TalentClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTalent = useMemo(
    () =>
      initialTalent.filter(
        (person) =>
          `${person.first_name} ${person.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          person.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.experience?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [initialTalent, searchTerm]
  );

  const hasCatalog = initialTalent.length > 0;
  const showSearchEmpty = hasCatalog && filteredTalent.length === 0 && searchTerm.length > 0;
  const showCatalogEmpty = !hasCatalog;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Search — primary hierarchy */}
      <div className="mx-auto max-w-3xl space-y-2">
        <label
          htmlFor="talent-search"
          className="block text-sm font-medium text-[var(--oklch-text-secondary)]"
        >
          Search talent
        </label>
        <div className="panel-frosted grain-texture relative rounded-2xl p-3 sm:p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-[var(--oklch-text-muted)]"
              aria-hidden
            />
            <Input
              id="talent-search"
              type="search"
              autoComplete="off"
              placeholder="Name, location, or experience"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "h-12 border-0 bg-transparent pl-10 pr-3 text-base shadow-none sm:h-12 sm:text-lg",
                "placeholder:text-[var(--oklch-text-muted)]"
              )}
            />
          </div>
        </div>
        {hasCatalog && filteredTalent.length > 0 ? (
          <p className="text-center text-sm text-[var(--oklch-text-muted)]">
            {filteredTalent.length} profile{filteredTalent.length === 1 ? "" : "s"}
            {searchTerm ? ` matching “${searchTerm}”` : ""}
          </p>
        ) : null}
      </div>

      {/* Results */}
      {filteredTalent.length === 0 ? (
        <div className="panel-frosted mx-auto max-w-lg rounded-2xl px-6 py-10 text-center sm:px-8">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--oklch-border-alpha)] bg-[var(--oklch-panel-alpha)]"
            aria-hidden
          >
            <Search className="h-8 w-8 text-[var(--oklch-text-muted)]" />
          </div>
          {showSearchEmpty ? (
            <>
              <h2 className="mb-2 font-display text-xl font-semibold text-[var(--oklch-text-primary)] sm:text-2xl">
                No matching profiles
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[var(--oklch-text-secondary)] sm:text-base">
                Try a shorter search or different keywords.
              </p>
              <Button
                type="button"
                variant="default"
                className="rounded-full font-semibold"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </Button>
            </>
          ) : showCatalogEmpty ? (
            <>
              <h2 className="mb-2 font-display text-xl font-semibold text-[var(--oklch-text-primary)] sm:text-2xl">
                No talent profiles yet
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[var(--oklch-text-secondary)] sm:text-base">
                Check back soon for new talent on TOTL.
              </p>
              <Button variant="outline" className="rounded-full border-border/50 font-semibold" asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
          {filteredTalent.map((person) => (
            <div
              key={person.id}
              className="group panel-frosted card-backlit grain-texture hover-lift min-w-0 cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => router.push(`/talent/${person.user_id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/talent/${person.user_id}`);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="image-sophisticated relative aspect-4-5 sm:aspect-3-4 md:aspect-4-5">
                <SafeImage
                  src={
                    person.profiles?.avatar_url ||
                    person.profiles?.avatar_path ||
                    (person.portfolio_url &&
                    !person.portfolio_url.includes("youtube.com") &&
                    !person.portfolio_url.includes("youtu.be")
                      ? person.portfolio_url
                      : null)
                  }
                  alt={`${person.first_name} ${person.last_name}`}
                  fill
                  className="object-cover"
                  context="talent-profile"
                  fallbackSrc="/images/solo_logo.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                  <h3 className="mb-1 line-clamp-2 text-lg font-bold text-white sm:mb-2 sm:text-xl md:text-2xl">
                    {person.first_name} {person.last_name}
                  </h3>
                  <p className="line-clamp-1 text-xs font-medium text-[var(--oklch-text-tertiary)] sm:text-sm">
                    {person.location}
                  </p>
                </div>
              </div>
              <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 md:p-8">
                <div className="space-y-3 sm:space-y-4">
                  {/* Only show public-safe information */}
                  {person.specialties && person.specialties.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[var(--oklch-text-muted)] sm:text-sm">
                        Specialties
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {person.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="line-clamp-1 rounded-full border border-[var(--oklch-border-alpha)] bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-[var(--oklch-text-secondary)]"
                          >
                            {specialty}
                          </span>
                        ))}
                        {person.specialties.length > 3 && (
                          <span className="rounded-full border border-[var(--oklch-border-alpha)] bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-[var(--oklch-text-muted)]">
                            +{person.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {person.experience_years != null && person.experience_years > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--oklch-text-muted)] sm:text-sm">
                        Experience
                      </span>
                      <span className="text-xs font-semibold text-[var(--oklch-text-primary)] sm:text-sm">
                        {person.experience_years} years
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="default"
                  className="w-full rounded-full py-2 text-sm sm:py-2.5 sm:text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/talent/${person.user_id}`);
                  }}
                >
                  View profile
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

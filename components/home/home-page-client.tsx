import { ArrowRight, Briefcase, CheckCircle2, Clock3, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { GigCard } from "@/components/gigs/gig-card";
import { PostGigFooterLink } from "@/components/post-gig-footer-link";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { TotlAtmosphereShell } from "@/components/ui/totl-atmosphere-shell";
import { TotlEditorialSection } from "@/components/ui/totl-editorial-section";
import { TotlSectionDivider } from "@/components/ui/totl-section-divider";
import type { HomeFeaturedGig } from "@/lib/home-featured-gigs";

const processCards = [
  {
    title: "Post with clarity",
    description:
      "Create premium opportunities with the right role, timing, and creative requirements from day one.",
    icon: Briefcase,
  },
  {
    title: "Review with confidence",
    description:
      "Filter serious applicants, compare fit, and keep the shortlist organized without inbox chaos.",
    icon: Search,
  },
  {
    title: "Book cleanly",
    description:
      "Move from opportunity to confirmed booking inside one controlled system built for agency operations.",
    icon: ShieldCheck,
  },
];

const statHighlights = [
  { value: "500+", label: "Verified professionals" },
  { value: "1K+", label: "Projects completed" },
  { value: "50+", label: "Cities covered" },
  { value: "4.9", label: "Average satisfaction" },
];

const trustPillars = [
  "Invite-led marketplace",
  "On-platform collaboration",
  "Role-based access controls",
  "Agency-grade review workflow",
  "Clean booking pipeline",
];

export function HomePageClient({ featuredGigs }: { featuredGigs: HomeFeaturedGig[] }) {
  return (
    <TotlAtmosphereShell className="text-white">
      <main className="relative">
        <TotlEditorialSection className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-32">
          <div className="container mx-auto px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:gap-16">
              <div className="max-w-2xl space-y-8">
                <div className="panel-frosted inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--totl-text-soft)] sm:px-5">
                  <span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.8)]" />
                  TOTL Agency · Premium booking infrastructure
                </div>

                <div className="space-y-5">
                  <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                    Book exceptional talent with
                    <span className="totl-text-gradient"> clarity, control, and speed.</span>
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-[var(--totl-text-soft)] sm:text-lg sm:leading-8">
                    TOTL helps brands post opportunities, review applicants, and move from discovery to
                    confirmed booking inside one premium terminal. No clutter, no generic marketplace feel,
                    just clean agency operations.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link href="/choose-role" prefetch={false} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="button-glow h-14 w-full rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/95 sm:w-auto"
                    >
                      Start booking
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/about" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="panel-frosted h-14 w-full rounded-full border-white/10 bg-white/5 px-8 text-base font-medium text-white hover:bg-white/10 sm:w-auto"
                    >
                      Explore the system
                    </Button>
                  </Link>
                </div>

                <div className="panel-frosted card-backlit rounded-2xl border border-white/10 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--totl-text-soft)]">
                    Why teams switch to TOTL
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trustPillars.map((pillar) => (
                      <span
                        key={pillar}
                        className="hero-trust-chip rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs text-white/90"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="panel-frosted card-backlit rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <CheckCircle2 className="h-4 w-4 text-violet-300" />
                      Verified talent
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--totl-text-soft)]">
                      Trusted professionals and cleaner submissions from the start.
                    </p>
                  </div>
                  <div className="panel-frosted card-backlit rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Clock3 className="h-4 w-4 text-violet-300" />
                      Faster decisions
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--totl-text-soft)]">
                      Keep opportunities moving without losing track of applicants.
                    </p>
                  </div>
                  <div className="panel-frosted card-backlit rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Sparkles className="h-4 w-4 text-violet-300" />
                      Premium workflow
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--totl-text-soft)]">
                      A luxury agency feel built around clarity, polish, and execution.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative lg:justify-self-end">
                <div className="panel-frosted card-backlit grain-texture relative overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%),linear-gradient(180deg,rgba(139,92,246,0.08),transparent_55%)]" />
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="relative z-[1] w-full rounded-[1.5rem] object-contain"
                  >
                    <source src="/videos/slowmo_woman.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="panel-frosted card-backlit absolute -bottom-6 left-4 right-4 rounded-[1.5rem] border border-white/10 px-5 py-4 sm:-bottom-8 sm:left-auto sm:right-6 sm:w-72">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--totl-text-soft)]">Agency mode</p>
                  <p className="mt-2 text-lg font-semibold text-white">Opportunities-first booking workflow</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--totl-text-soft)]">
                    Discovery, review, and booking all stay inside one premium operating layer.
                  </p>
                </div>

                <div className="panel-frosted card-backlit absolute -top-5 right-6 hidden rounded-2xl border border-white/12 px-4 py-3 lg:block">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--totl-text-soft)]">
                    Average satisfaction
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">4.9/5</p>
                </div>
              </div>
            </div>
          </div>
        </TotlEditorialSection>

        <TotlSectionDivider variant="hero" />

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <div className="panel-frosted inline-flex w-fit items-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--totl-text-soft)]">
                  Featured opportunities
                </div>
                <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  Discovery that feels curated, not chaotic.
                </h2>
                <p className="text-base leading-7 text-[var(--totl-text-soft)] sm:text-lg">
                  TOTL is built around premium opportunities, cleaner applicant review, and a tighter path
                  from creative brief to confirmed talent.
                </p>
              </div>
              <div className="panel-frosted rounded-2xl px-5 py-4 text-sm leading-6 text-[var(--totl-text-soft)] lg:max-w-sm">
                No public directory. No messy browsing experience. Just structured opportunities and
                invite-led discovery.
              </div>
            </div>

            {featuredGigs.length === 0 ? (
              <div className="panel-frosted card-backlit mt-10 rounded-2xl border border-white/10 p-8 text-center">
                <p className="text-[var(--totl-text-soft)]">
                  New opportunities are on the way. Browse the full listings for the latest casting calls.
                </p>
                <Button asChild className="button-glow mt-6 rounded-full border-0">
                  <Link href="/gigs">
                    View all opportunities
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {featuredGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} variant="featured" />
                ))}
              </div>
            )}
          </div>
        </section>

        <TotlSectionDivider />

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <div className="panel-frosted inline-flex w-fit items-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--totl-text-soft)]">
                How TOTL works
              </div>
              <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Structured like an agency, not a template.
              </h2>
              <p className="text-base leading-7 text-[var(--totl-text-soft)] sm:text-lg">
                Every step is designed to reduce ambiguity, tighten review, and keep booking operations in
                motion.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:gap-6">
              {processCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="panel-frosted card-backlit rounded-[1.75rem] border border-white/10 p-6 sm:p-7"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-violet-200 ring-1 ring-white/10">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--totl-text-soft)]">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--totl-text-soft)] sm:text-base">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <TotlSectionDivider variant="soft" />

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statHighlights.map((stat) => (
                <div
                  key={stat.label}
                  className="panel-frosted card-backlit rounded-[1.5rem] border border-white/10 px-6 py-6"
                >
                  <div className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--totl-text-soft)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 pt-6 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="panel-frosted card-backlit overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--totl-text-soft)]">
                    Ready to move faster
                  </div>
                  <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                    Give your booking workflow a world that matches the talent.
                  </h2>
                  <p className="text-base leading-7 text-[var(--totl-text-soft)] sm:text-lg">
                    Join brands and operators using TOTL to post cleaner opportunities, review stronger
                    talent, and run premium bookings without the usual friction.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/choose-role" prefetch={false}>
                    <Button
                      size="lg"
                      className="button-glow h-14 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/95"
                    >
                      Start booking
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 rounded-full border-white/10 bg-transparent px-8 text-base text-white hover:bg-white/10"
                    >
                      Learn more
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/6 pb-12 pt-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-4">
              <div className="space-y-5">
                <SafeImage
                  src="/images/solo_logo.png"
                  alt="TOTL Agency"
                  width={120}
                  height={40}
                  className="h-8 w-auto brightness-0 invert"
                />
                <p className="max-w-xs text-sm leading-6 text-[var(--totl-text-soft)]">
                  Premium opportunity management for brands that want better talent operations.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Platform</h3>
                <div className="space-y-3 text-sm text-[var(--totl-text-soft)]">
                  <Link href="/about" className="block transition-colors hover:text-white">
                    About us
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Support</h3>
                <div className="space-y-3 text-sm text-[var(--totl-text-soft)]">
                  <Link href="/help" className="block transition-colors hover:text-white">
                    Help center
                  </Link>
                  <Link href="/contact" className="block transition-colors hover:text-white">
                    Contact us
                  </Link>
                  <Link href="/terms" className="block transition-colors hover:text-white">
                    Terms of service
                  </Link>
                  <Link href="/privacy" className="block transition-colors hover:text-white">
                    Privacy policy
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Get started</h3>
                <div className="space-y-3 text-sm text-[var(--totl-text-soft)]">
                  <Link href="/choose-role" prefetch={false} className="block transition-colors hover:text-white">
                    Apply as talent
                  </Link>
                  <PostGigFooterLink />
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/6 pt-6 text-sm text-[var(--totl-text-soft)] sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 TOTL Agency. All rights reserved.</p>
              <div className="flex items-center gap-3">
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms
                </Link>
                <span className="text-white/20">•</span>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </TotlAtmosphereShell>
  );
}

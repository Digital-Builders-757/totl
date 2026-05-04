import { Skeleton } from "@/components/ui/skeleton";
import { TotlBrandLoadingRibbon, TotlMarketingLoadingBackdrop } from "@/components/ui/totl-brand-loading";

/** Root segment loader: matches homepage hero structure (marketing grid + branded ribbon). */
export default function RootLoading() {
  return (
    <TotlMarketingLoadingBackdrop>
      <main className="relative flex-1">
        <section className="totl-editorial-canopy relative overflow-hidden pb-14 pt-24 sm:pt-28 lg:pt-32">
          <div className="container mx-auto px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
            <div className="mb-10 lg:mb-14">
              <TotlBrandLoadingRibbon
                eyebrow="TOTL Agency"
                footline="Calibrating the experience…"
                className="max-w-xl"
              />
            </div>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:gap-16 lg:items-center">
              <div className="max-w-2xl space-y-8">
                <Skeleton className="inline-flex h-10 max-w-[19rem] rounded-full bg-white/10" />

                <div className="space-y-5">
                  <Skeleton className="h-14 max-w-xl rounded-xl bg-white/12 sm:h-[3.75rem] lg:h-16 lg:max-w-2xl" />
                  <Skeleton className="h-14 max-w-xl rounded-xl bg-white/10 sm:h-[3.5rem] lg:h-[3.75rem]" />
                  <Skeleton className="h-5 max-w-xl rounded-xl bg-white/8 sm:h-6" />
                  <Skeleton className="hidden h-5 max-w-[22rem] rounded-xl bg-white/8 sm:block sm:h-6" />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Skeleton className="h-11 w-[8.5rem] rounded-xl bg-white/10 sm:h-12 sm:w-[9.25rem]" />
                  <Skeleton className="h-11 w-[7rem] rounded-xl bg-white/8 sm:h-12 sm:w-[8rem]" />
                </div>
              </div>

              <div className="relative min-h-[380px] w-full lg:min-h-[420px]">
                <div className="panel-frosted grain-texture relative mx-auto overflow-hidden rounded-3xl border border-white/12 p-5 shadow-xl sm:p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-2xl bg-white/15" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-[45%] max-w-[10rem] rounded-lg bg-white/12" />
                      <Skeleton className="h-3 w-[70%] max-w-[14rem] rounded-lg bg-white/8" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Skeleton className="aspect-[16/11] w-full rounded-2xl bg-white/8" />

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <Skeleton className="h-16 rounded-xl bg-white/8 sm:h-[4.75rem]" />
                      <Skeleton className="h-16 rounded-xl bg-white/10 sm:h-[4.75rem]" />
                      <Skeleton className="col-span-2 h-24 rounded-xl bg-white/10" />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Skeleton className="h-7 w-[4.75rem] rounded-full bg-white/12" />
                      <Skeleton className="h-7 w-[6rem] rounded-full bg-white/8" />
                      <Skeleton className="h-7 w-[7.25rem] rounded-full bg-white/8" />
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute -right-12 top-24 hidden h-48 w-48 rounded-full bg-violet-500/10 blur-[64px] lg:block" aria-hidden />
              </div>
            </div>
          </div>
        </section>
      </main>
    </TotlMarketingLoadingBackdrop>
  );
}

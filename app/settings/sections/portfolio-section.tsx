"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { PortfolioUpload } from "@/components/portfolio/portfolio-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & { imageUrl?: string };

const glassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] text-white shadow-none";

interface PortfolioSectionProps {
  portfolioItems: PortfolioItem[];
}

export function PortfolioSection({ portfolioItems }: PortfolioSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  const handleUploadSuccess = () => {
    setShowUpload(false);
    router.refresh();
  };

  const handleGalleryUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--oklch-text-primary)]">Portfolio gallery</h3>
          <p className="mt-1 text-sm text-[var(--oklch-text-secondary)]">
            Show your work with clear titles and captions. Newest uploads appear first.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          {!showUpload && (
            <Button
              onClick={() => setShowUpload(true)}
              className="min-h-11 w-full bg-[var(--oklch-accent)] text-white hover:bg-[var(--oklch-accent)]/90 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add image
            </Button>
          )}
          {showUpload && (
            <Button
              onClick={() => setShowUpload(false)}
              variant="outline"
              className="min-h-11 w-full border-white/15 bg-white/[0.04] text-[var(--oklch-text-primary)] hover:bg-white/[0.08] sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="animate-in slide-in-from-top-2">
          <PortfolioUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      <PortfolioGallery initialItems={portfolioItems} onUpdate={handleGalleryUpdate} />

      {portfolioItems.length === 0 && !showUpload && (
        <Card className={cn(glassCard)}>
          <CardHeader>
            <CardTitle className="text-[var(--oklch-text-primary)]">Get started</CardTitle>
            <CardDescription className="text-[var(--oklch-text-secondary)]">
              Build a focused set of images clients can browse from your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--oklch-accent)]/25 text-sm font-semibold text-[var(--oklch-accent)]">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-[var(--oklch-text-primary)]">Upload</h4>
                  <p className="text-sm text-[var(--oklch-text-secondary)]">
                    Add JPEG, PNG, or WebP — we optimize on your device before sending to storage.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--oklch-accent)]/25 text-sm font-semibold text-[var(--oklch-accent)]">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-[var(--oklch-text-primary)]">Label</h4>
                  <p className="text-sm text-[var(--oklch-text-secondary)]">
                    Titles and captions help clients understand each piece at a glance.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--oklch-accent)]/25 text-sm font-semibold text-[var(--oklch-accent)]">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-[var(--oklch-text-primary)]">Edit anytime</h4>
                  <p className="text-sm text-[var(--oklch-text-secondary)]">
                    Update titles and captions from the gallery cards whenever you like.
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              className="min-h-11 w-full bg-[var(--oklch-accent)] text-white hover:bg-[var(--oklch-accent)]/90 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first image
            </Button>
          </CardContent>
        </Card>
      )}

      {portfolioItems.length > 0 && (
        <Card className={cn(glassCard)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--oklch-text-primary)]">
              <span className="text-[var(--oklch-accent)]" aria-hidden>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-[var(--oklch-text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--oklch-accent)]">•</span>
                <span>Newest uploads appear at the top of your gallery.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--oklch-accent)]">•</span>
                <span>Use sharp, well-lit images — we compress for delivery while keeping quality high.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--oklch-accent)]">•</span>
                <span>Strong titles and short captions help clients scan your work quickly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--oklch-accent)]">•</span>
                <span>
                  Need a quick resize? Use{" "}
                  <a
                    href="https://squoosh.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--oklch-accent)] underline-offset-2 hover:underline"
                  >
                    Squoosh
                  </a>{" "}
                  or watch a short{" "}
                  <a
                    href="https://www.youtube.com/results?search_query=how+to+resize+images+for+portfolio"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--oklch-accent)] underline-offset-2 hover:underline"
                  >
                    image-resize tutorial
                  </a>
                  .
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

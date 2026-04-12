"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & {
  imageUrl?: string;
};

const glassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] text-white shadow-none";

interface PortfolioPreviewProps {
  items: PortfolioItem[];
  showManageLink?: boolean;
}

export function PortfolioPreview({ items, showManageLink = true }: PortfolioPreviewProps) {
  if (items.length === 0) {
    return (
      <Card className={cn(glassCard, "p-8 text-center sm:p-10")}>
        <div className="mx-auto max-w-md space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
            <ImageIcon className="h-8 w-8 text-[var(--oklch-text-tertiary)]" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--oklch-text-primary)]">
              No portfolio images yet
            </h3>
            <p className="mt-2 text-sm text-[var(--oklch-text-secondary)]">
              Add photos in Settings to show your work here.
            </p>
          </div>
          {showManageLink && (
            <Button
              asChild
              className="min-h-11 w-full bg-[var(--oklch-accent)] text-white hover:bg-[var(--oklch-accent)]/90 sm:w-auto"
            >
              <Link href="/settings">Add photos in Settings</Link>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const previewItems = items.slice(0, 6);
  const hasMore = items.length > 6;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {previewItems.map((item) => (
          <Card
            key={item.id}
            className={cn(
              glassCard,
              "portfolio-preview-tile group relative overflow-hidden transition-all duration-300 ease-out",
              "hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)]"
            )}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20 md:aspect-square">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-[var(--oklch-text-tertiary)]" aria-hidden />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 transition-transform duration-300 ease-out group-hover:translate-y-0 motion-reduce:transform-none sm:p-4">
                <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-white">{item.title}</h4>
                {item.caption && (
                  <p className="line-clamp-2 text-xs text-zinc-300">{item.caption}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--oklch-text-secondary)]">
          {items.length} portfolio {items.length === 1 ? "image" : "images"}
        </p>
        {showManageLink && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="min-h-11 w-full border-white/15 bg-white/[0.04] text-[var(--oklch-text-primary)] hover:bg-white/[0.08] sm:w-auto"
          >
            <Link href="/settings">{hasMore ? "View all in Settings" : "Manage in Settings"}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

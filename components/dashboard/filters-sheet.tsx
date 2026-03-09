"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function FiltersSheet({
  open,
  onOpenChange,
  activeCount,
  children,
  title = "Filters",
  className,
}: FiltersSheetProps) {
  const triggerLabel = activeCount > 0 ? `Filters (${activeCount})` : "Filters";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="filters-sheet-trigger"
        aria-label={triggerLabel}
        className={className}
        onClick={() => onOpenChange(true)}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-testid="filters-sheet-panel"
          className="left-0 top-auto bottom-0 h-[min(82dvh,720px)] w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-t-2xl rounded-b-none border-x-0 border-b-0 border-t border-white/10 bg-black p-0 text-white"
        >
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-black/95 px-4 pb-3 pt-3 backdrop-blur">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{title}</p>
                  <p className="text-xs text-gray-300">Refine results</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid="filters-sheet-close"
                className="absolute right-4 top-3 h-10 w-10 text-white hover:bg-white/10"
                onClick={() => onOpenChange(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div className="space-y-4">{children}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


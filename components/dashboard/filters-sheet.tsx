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
        className={className}
        onClick={() => onOpenChange(true)}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="left-0 top-auto bottom-0 h-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 border-t border-white/10 bg-black p-0 text-white">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{title}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/10"
                onClick={() => onOpenChange(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">{children}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}


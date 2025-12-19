import type React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";

export interface PageLoadingProps {
  className?: string;
}

export function PageLoading({ className }: PageLoadingProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="h-9 w-56 bg-white/10" />
        <Skeleton className="h-4 w-80 max-w-full bg-white/10" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl bg-white/10" />
        <Skeleton className="h-40 w-full rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}


import type React from "react";

import { cn } from "@/lib/utils/utils";

export interface DataTableShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5", className)}>
      {children}
    </div>
  );
}


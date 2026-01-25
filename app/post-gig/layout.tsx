import type React from "react";

export default function PostGigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="pt-24">{children}</div>
    </div>
  );
}

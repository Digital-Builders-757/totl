"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface SecondaryActionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SecondaryActionLink({ href, children, className }: SecondaryActionLinkProps) {
  return (
    <Link
      href={href}
      className={`text-sm text-[var(--oklch-text-secondary)] underline-offset-4 hover:text-[var(--oklch-text-primary)] hover:underline ${className ?? ""}`.trim()}
    >
      {children}
    </Link>
  );
}


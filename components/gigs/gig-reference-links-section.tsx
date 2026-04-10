import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isSafeHttpUrlForDisplay,
  parseStoredReferenceLinksForDisplay,
  referenceLinkKindLabel,
} from "@/lib/gig-reference-links";
import type { Json } from "@/types/database";

type GigReferenceLinksSectionProps = {
  referenceLinks: Json | null | undefined;
  /** Light cards (apply page) vs default */
  variant?: "default" | "dark";
};

export function GigReferenceLinksSection({ referenceLinks, variant = "default" }: GigReferenceLinksSectionProps) {
  const links = parseStoredReferenceLinksForDisplay(referenceLinks);
  if (links.length === 0) return null;

  const isDark = variant === "dark";

  return (
    <Card className={isDark ? "bg-gray-900 border-gray-700" : undefined}>
      <CardHeader>
        <CardTitle className={isDark ? "text-white" : undefined}>Reference & inspiration</CardTitle>
        <CardDescription className={isDark ? "text-gray-300" : undefined}>
          Links from the career builder to help you understand the creative direction (reels, campaigns, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={`${link.sort_order}-${link.url}`}>
              {isSafeHttpUrlForDisplay(link.url) ? (
                <Link
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    isDark
                      ? "inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 underline-offset-4 hover:underline"
                      : "inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                  }
                >
                  <span className="font-medium">{link.label}</span>
                  <Badge variant="secondary" className="font-normal">
                    {referenceLinkKindLabel(link.kind)}
                  </Badge>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

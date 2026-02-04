import { SafeImage } from "@/components/ui/safe-image";

import { cn } from "@/lib/utils/utils";

type MediaThumbVariant = "talent" | "gig" | "avatar";

export interface MediaThumbProps {
  src: string | null | undefined;
  alt: string;
  variant: MediaThumbVariant;
  fallbackText?: string | null;
  className?: string;
}

const variantClasses: Record<MediaThumbVariant, string> = {
  talent: "aspect-[4/5]",
  gig: "aspect-video",
  avatar: "aspect-square",
};

export function MediaThumb({ src, alt, variant, fallbackText, className }: MediaThumbProps) {
  const trimmedFallback = fallbackText?.trim();
  const shouldShowFallbackText = !src && !!trimmedFallback;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-[var(--elev-1)] elev-1",
        variantClasses[variant],
        className
      )}
    >
      {src ? (
        <SafeImage src={src} alt={alt} fill className="object-cover object-center" context="media-thumb" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--oklch-text-secondary)]">
          {trimmedFallback || "—"}
        </div>
      )}
    </div>
  );
}

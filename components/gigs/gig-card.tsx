"use client";

import { ArrowRight, Calendar, DollarSign, Eye, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { getCategoryLabel } from "@/lib/constants/gig-categories";
import { getGigDisplayDescription, getGigDisplayTitle } from "@/lib/gig-access";
import type { Database } from "@/types/supabase";

type SubscriptionAwareProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role" | "subscription_status"
>;

type BrowseGig = Pick<
  Database["public"]["Tables"]["gigs"]["Row"],
  | "id"
  | "title"
  | "description"
  | "location"
  | "compensation"
  | "date"
  | "category"
  | "image_url"
  | "client_id"
>;

type DashboardGig = {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  image_url?: string | null;
  date?: string;
};

type FeaturedGig = {
  title: string;
  category: string;
  location: string;
  compensation: string;
  date: string;
  imageUrl: string;
};

type GigCardProps =
  | {
      gig: BrowseGig;
      profile: SubscriptionAwareProfile | null;
      variant: "browse";
    }
  | {
      gig: DashboardGig;
      profile?: null;
      variant: "dashboard";
    }
  | {
      gig: FeaturedGig;
      profile?: null;
      variant: "featured";
    };

export function GigCard(props: GigCardProps) {
  const { gig, variant } = props;
  const profile = props.variant === "browse" ? props.profile : null;

  const displayTitle =
    variant === "browse"
      ? getGigDisplayTitle(gig, profile)
      : gig.title;
  const displayDescription =
    variant === "browse"
      ? getGigDisplayDescription(gig, profile)
      : variant === "dashboard"
        ? gig.description
        : null;
  const imageSrc =
    variant === "browse"
      ? gig.image_url
      : variant === "dashboard"
        ? gig.image_url
        : gig.imageUrl;
  const href =
    variant === "browse"
      ? `/gigs/${gig.id}`
      : variant === "dashboard"
        ? `/gigs/${gig.id}`
        : "/choose-role";
  const ctaText =
    variant === "browse"
      ? "View Details"
      : variant === "dashboard"
        ? "Apply Now"
        : "View opportunities (sign in)";
  const applyHref = variant === "dashboard" ? `/gigs/${gig.id}/apply` : href;

  const imageContext =
    variant === "browse"
      ? "gig-card"
      : variant === "dashboard"
        ? "gig-card-dashboard"
        : "marketing-featured-gig";
  const fallbackSrc =
    variant === "browse" || variant === "dashboard"
      ? "/images/totl-logo-transparent.png"
      : "/images/solo_logo.png";

  const imageBlock = (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <SafeImage
        src={imageSrc}
        alt={gig.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        context={imageContext}
        fallbackSrc={fallbackSrc}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <Badge
          variant="secondary"
          className="text-xs font-semibold text-black backdrop-blur-sm bg-white/90"
        >
          {variant === "featured" ? gig.category : getCategoryLabel(gig.category)}
        </Badge>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <h3 className="line-clamp-2 text-lg font-bold text-white mb-2 transition-colors group-hover:text-white/90 sm:text-xl">
          {displayTitle}
        </h3>
      </div>
    </div>
  );

  const contentBlock = (
    <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
      {displayDescription && (
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--oklch-text-secondary)]">
          {displayDescription}
        </p>
      )}
      <div className="space-y-2">
        <div className="flex items-center text-xs text-[var(--oklch-text-tertiary)] sm:text-sm">
          <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{gig.location}</span>
        </div>
        <div className="flex items-center text-xs text-[var(--oklch-text-tertiary)] sm:text-sm">
          <DollarSign className="mr-2 h-4 w-4 flex-shrink-0 text-white" />
          <span className="font-semibold text-white">{gig.compensation}</span>
        </div>
          <div className="flex items-center text-xs text-[var(--oklch-text-tertiary)] sm:text-sm">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{gig.date ?? "—"}</span>
          </div>
      </div>
      {variant === "dashboard" ? (
        <div className="flex gap-2 pt-2 mt-auto">
          <Button className="flex-1 button-glow min-h-[48px] border-0" asChild>
            <Link href={applyHref}>
              {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={href} aria-label={`View details for ${gig.title}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          className="button-glow mt-3 w-full min-h-[48px] border-0 sm:mt-4"
          asChild
        >
          <span>
            {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        </Button>
      )}
    </div>
  );

  const cardBacklit = (
    <div className="card-backlit overflow-hidden rounded-2xl group cursor-pointer active:scale-95 transition-all duration-200 sm:hover:scale-[1.02]">
      {variant === "dashboard" ? (
        <>
          <Link href={href} className="block">
            {imageBlock}
          </Link>
          {contentBlock}
        </>
      ) : (
        <>
          {imageBlock}
          {contentBlock}
        </>
      )}
    </div>
  );

  return (
    <SpotlightCard className="relative overflow-visible rounded-2xl">
      {variant === "dashboard" ? (
        <div data-testid="gig-card">{cardBacklit}</div>
      ) : (
        <Link
          href={href}
          prefetch={variant === "featured" ? false : undefined}
          className="block overflow-hidden rounded-2xl"
          data-testid="gig-card"
        >
          {cardBacklit}
        </Link>
      )}
    </SpotlightCard>
  );
}

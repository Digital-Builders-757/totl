import { normalizeGigCategory, type GigCategory } from "@/lib/constants/gig-categories";
import { isActiveSubscriber } from "@/lib/subscription";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type MinimalProfile = Pick<Profile, "role" | "subscription_status">;
type Gig = Database["public"]["Tables"]["gigs"]["Row"];
type GigDisplaySource = Pick<Gig, "title" | "description" | "category">;

/**
 * Whether the viewer may see real gig title/description (not category templates).
 * Guests never see full marketing copy; subscribed talent, clients, and admins do.
 */
export function canViewFullGigMarketingCopy(profile: Profile | MinimalProfile | null): boolean {
  if (!profile) return false;
  if (profile.role === "client" || profile.role === "admin") return true;
  if (profile.role === "talent") return isActiveSubscriber(profile);
  return false;
}

/**
 * Obfuscated titles when full marketing copy is withheld
 * Keyed by normalized category to handle both new and legacy categories
 */
const OBFUSCATED_TITLES: Record<GigCategory, string> = {
  modeling: "Modeling Opportunity for Major Brand",
  acting: "Casting Call for Upcoming Production",
  photography: "Photography Project with Professional Team",
  video: "Video Shoot Opportunity for Major Client",
  influencer: "Influencer Campaign with Premium Brand",
  dancer: "Paid Dance Performance Opportunity",
  musician: "Live Performance / Session Opportunity",
  events: "Event Opportunity for Premium Client",
  others: "Creative Opportunity for Premium Client",
  other: "Creative Opportunity for Premium Client",
};

/**
 * Obfuscated descriptions when full marketing copy is withheld
 * Keyed by normalized category to handle both new and legacy categories
 */
const OBFUSCATED_DESCRIPTIONS: Record<GigCategory, string> = {
  modeling: "Professional modeling opportunity with an established client. Details available to subscribers.",
  acting: "Casting opportunity for a professional production. Subscribe to view role details and requirements.",
  photography: "Photography opportunity with a professional team. Subscribe to see creative direction and deliverables.",
  video: "Video project opportunity with an established client. Subscribe to view scope, dates, and requirements.",
  influencer: "Brand campaign opportunity for creators. Subscribe to view deliverables, usage, and compensation details.",
  dancer: "Performance opportunity for experienced dancers. Subscribe to see schedule, style, and compensation details.",
  musician: "Music opportunity for performers or session players. Subscribe to see set details and compensation.",
  events: "Event opportunity with a premium client. Subscribe to see full details, dates, and requirements.",
  others: "Professional creative opportunity with a premium client. Subscribe to see full details.",
  other: "Professional creative opportunity with a premium client. Subscribe to see full details.",
};

/**
 * Get display title for a gig — real title only when canViewFullGigMarketingCopy; else category template
 */
export function getGigDisplayTitle(
  gig: GigDisplaySource,
  profile: Profile | MinimalProfile | null
): string {
  if (canViewFullGigMarketingCopy(profile)) return gig.title;

  const c = normalizeGigCategory(gig.category);
  return OBFUSCATED_TITLES[c];
}

/**
 * Get display description for a gig — real body only when canViewFullGigMarketingCopy; else category template
 */
export function getGigDisplayDescription(
  gig: GigDisplaySource,
  profile: Profile | MinimalProfile | null
): string {
  if (canViewFullGigMarketingCopy(profile)) return gig.description;

  const c = normalizeGigCategory(gig.category);
  return OBFUSCATED_DESCRIPTIONS[c];
}

/**
 * Check if user can apply to gigs (requires active subscription)
 */
export function canApplyToGig(profile: Profile | MinimalProfile | null): boolean {
  return profile?.role === 'talent' && isActiveSubscriber(profile);
}

/**
 * Check if user can see full client details
 */
export function canSeeClientDetails(profile: Profile | MinimalProfile | null): boolean {
  if (!profile) return false;
  if (profile.role !== "talent") return true;
  return isActiveSubscriber(profile);
}

/**
 * Get client display name based on subscription status
 */
export function getClientDisplayName(
  clientName: string | null,
  profile: Profile | MinimalProfile | null
): string {
  if (!profile || profile.role !== "talent" || isActiveSubscriber(profile)) {
    return clientName || "Client";
  }
  
  return "Premium Client";
}

/**
 * Check if user should see subscription prompt
 */
export function shouldShowSubscriptionPrompt(profile: Profile | MinimalProfile | null): boolean {
  if (!profile) return false; // Guests see different prompts
  return profile.role === 'talent' && !isActiveSubscriber(profile);
}

/**
 * Get subscription prompt message for talent users
 */
export function getSubscriptionPromptMessage(profile: Profile | MinimalProfile | null): string {
  if (!profile || profile.role !== 'talent') {
    return '';
  }

  switch (profile.subscription_status) {
    case "none":
      return "Subscribe to apply to opportunities and see full client details";
    case "canceled":
      return "Reactivate your subscription to apply to opportunities";
    case "past_due":
      return "Update your payment method to continue applying to opportunities";
    case "active":
      return "You already have full access to premium features.";
    default:
      return "Subscribe to unlock premium features";
  }
}

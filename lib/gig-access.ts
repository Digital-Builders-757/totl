import { isActiveSubscriber } from "@/lib/subscription";
import type { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Gig = Database['public']['Tables']['gigs']['Row'];

/**
 * Get display title for a gig based on user's subscription status
 * Non-subscribers see obfuscated titles to protect client privacy
 */
export function getGigDisplayTitle(gig: Gig, profile: Profile | null): string {
  // Show full title to active subscribers
  if (isActiveSubscriber(profile)) {
    return gig.title;
  }
  
  // Obfuscate for non-subscribers - create generic titles based on category
  const category = gig.category || 'General';
  const categoryTitles = {
    'commercial': 'Commercial Shoot for Major Brand',
    'editorial': 'Editorial Shoot for Fashion Magazine',
    'runway': 'Runway Show for Fashion Brand',
    'beauty': 'Beauty Campaign for Cosmetics Brand',
    'fitness': 'Fitness Campaign for Athletic Brand',
    'e-commerce': 'E-commerce Shoot for Retail Brand',
    'other': 'Professional Shoot for Major Client',
  };
  
  return categoryTitles[category.toLowerCase() as keyof typeof categoryTitles] || 
         `${category} Project for Major Client`;
}

/**
 * Get display description for a gig based on user's subscription status
 */
export function getGigDisplayDescription(gig: Gig, profile: Profile | null): string {
  // Show full description to active subscribers
  if (isActiveSubscriber(profile)) {
    return gig.description;
  }
  
  // Provide generic description for non-subscribers
  const category = gig.category || 'general';
  const genericDescriptions = {
    'commercial': 'Exciting commercial opportunity with a well-known brand. Professional shoot with experienced team.',
    'editorial': 'High-fashion editorial shoot for a prestigious publication. Creative and artistic project.',
    'runway': 'Fashion runway show for an established designer. Professional modeling experience required.',
    'beauty': 'Beauty and cosmetics campaign for a major brand. Focus on natural beauty and product showcase.',
    'fitness': 'Athletic and fitness campaign showcasing active lifestyle. Requires fitness modeling experience.',
    'e-commerce': 'Product photography for online retail. Clean, professional shots for e-commerce platform.',
    'other': 'Professional modeling opportunity with established client. Details available to subscribers.',
  };
  
  return genericDescriptions[category.toLowerCase() as keyof typeof genericDescriptions] || 
         'Professional modeling opportunity with established client. Subscribe to see full details.';
}

/**
 * Check if user can apply to gigs (requires active subscription)
 */
export function canApplyToGig(profile: Profile | null): boolean {
  return isActiveSubscriber(profile);
}

/**
 * Check if user can see full client details
 */
export function canSeeClientDetails(profile: Profile | null): boolean {
  return isActiveSubscriber(profile);
}

/**
 * Get client display name based on subscription status
 */
export function getClientDisplayName(clientName: string | null, profile: Profile | null): string {
  if (isActiveSubscriber(profile)) {
    return clientName || 'Client';
  }
  
  return 'Premium Client';
}

/**
 * Check if user should see subscription prompt
 */
export function shouldShowSubscriptionPrompt(profile: Profile | null): boolean {
  if (!profile) return false; // Guests see different prompts
  return profile.role === 'talent' && !isActiveSubscriber(profile);
}

/**
 * Get subscription prompt message for talent users
 */
export function getSubscriptionPromptMessage(profile: Profile | null): string {
  if (!profile || profile.role !== 'talent') {
    return '';
  }

  switch (profile.subscription_status) {
    case 'none':
      return 'Subscribe to apply to gigs and see full client details';
    case 'canceled':
      return 'Reactivate your subscription to apply to gigs';
    case 'past_due':
      return 'Update your payment method to continue applying to gigs';
    case 'active':
      return 'You already have full access to premium features.';
    default:
      return 'Subscribe to unlock premium features';
  }
}

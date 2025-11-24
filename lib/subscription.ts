import type { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];
type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
type SubscriptionAwareProfile = Pick<Profile, 'subscription_status' | 'role'> & Partial<Profile>;

/**
 * Check if a user has an active subscription
 */
export function isActiveSubscriber(profile: SubscriptionAwareProfile | null): boolean {
  return profile?.subscription_status === 'active';
}

/**
 * Check if a user needs to subscribe (no subscription or canceled)
 */
export function needsSubscription(profile: SubscriptionAwareProfile | null): boolean {
  if (!profile) return true;
  return profile.subscription_status === 'none' || profile.subscription_status === 'canceled';
}

/**
 * Check if a user's subscription has payment issues
 */
export function hasPaymentIssues(profile: SubscriptionAwareProfile | null): boolean {
  return profile?.subscription_status === 'past_due';
}

/**
 * Get subscription status display text
 */
export function getSubscriptionStatusText(status: SubscriptionStatus): string {
  switch (status) {
    case 'none':
      return 'No subscription';
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Payment overdue';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

/**
 * Get subscription status color for UI
 */
export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'text-green-600';
    case 'past_due':
      return 'text-yellow-600';
    case 'canceled':
    case 'none':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Map Stripe subscription status to our enum
 */
export function mapStripeStatusToLocal(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'canceled';
  }
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: string | null): string {
  switch (plan) {
    case 'monthly':
      return 'Monthly ($20/month)';
    case 'annual':
      return 'Annual ($200/year)';
    default:
      return 'Unknown plan';
  }
}

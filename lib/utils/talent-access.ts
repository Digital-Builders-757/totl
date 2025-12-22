import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type SupabaseServer = SupabaseClient<Database>;

/**
 * PR3: Check if a client has a relationship with a talent that allows viewing sensitive fields.
 * 
 * Relationship exists if:
 * 1. Talent applied to a gig owned by the client (via applications table), OR
 * 2. Client has a booking with the talent (via bookings table)
 * 
 * This is server-side only and respects RLS policies.
 */
export async function canClientSeeTalentSensitive(opts: {
  supabase: SupabaseServer;
  clientId: string;
  talentUserId: string;
}): Promise<boolean> {
  const { supabase, clientId, talentUserId } = opts;

  // Approach 1: Check if talent applied to a gig owned by this client
  // First, get all gig IDs owned by this client
  const { data: clientGigs } = await supabase
    .from("gigs")
    .select("id")
    .eq("client_id", clientId);

  if (clientGigs && clientGigs.length > 0) {
    const gigIds = clientGigs.map((g) => g.id);
    
    // Check if talent has an application to any of these gigs
    const { data: application } = await supabase
      .from("applications")
      .select("id")
      .eq("talent_id", talentUserId)
      .in("gig_id", gigIds)
      .limit(1)
      .maybeSingle();

    if (application?.id) {
      return true;
    }
  }

  // Approach 2: Check if there's a booking between this client and talent
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("client_id", clientId)
    .eq("talent_id", talentUserId)
    .limit(1)
    .maybeSingle();

  return !!booking?.id;
}


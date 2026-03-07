"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type GigWithCount = Pick<
  Database["public"]["Tables"]["gigs"]["Row"],
  | "id"
  | "client_id"
  | "title"
  | "description"
  | "category"
  | "location"
  | "compensation"
  | "status"
  | "image_url"
  | "created_at"
  | "application_deadline"
> & {
  applications_count: Array<{ count: number }>;
};

export type ClientGig = {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  status?: string;
  image_url?: string | null;
  created_at: string;
  application_deadline?: string | null;
  applications_count?: number;
};

export async function getClientGigs() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("gigs")
      .select(
        `
        id,
        client_id,
        title,
        description,
        category,
        location,
        compensation,
        status,
        image_url,
        created_at,
        application_deadline,
        applications_count:applications(count)
      `
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching client gigs", error);
      return { error: "Failed to load gigs" };
    }

    const transformedData: ClientGig[] =
      (data as unknown as GigWithCount[])?.map((gig) => ({
        ...gig,
        status: gig.status ?? undefined,
        applications_count: gig.applications_count?.[0]?.count || 0,
      })) || [];

    return { success: true, userId: user.id, gigs: transformedData };
  } catch (error) {
    logger.error("Unexpected error fetching client gigs", error);
    return { error: "An unexpected error occurred" };
  }
}

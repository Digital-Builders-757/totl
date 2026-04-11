import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

export type HomeFeaturedGig = {
  id: string;
  title: string;
  category: string;
  location: string;
  compensation: string;
  date: string;
  imageUrl: string;
};

const DEFAULT_LIMIT = 6;

/**
 * Active opportunities still open for submission (or no deadline set), for marketing homepage.
 */
export async function getFeaturedOpportunitiesForHome(
  limit = DEFAULT_LIMIT
): Promise<HomeFeaturedGig[]> {
  const supabase = await createSupabaseServer();
  const nowMs = Date.now();

  const { data, error } = await supabase
    .from("gigs")
    .select("id,title,category,location,compensation,date,image_url,status,application_deadline")
    .in("status", ["active", "featured", "urgent"])
    .order("date", { ascending: true, nullsFirst: false })
    .limit(Math.max(limit * 4, limit));

  if (error) {
    logger.error("[home] featured opportunities query failed", error);
    return [];
  }

  const open = (data ?? []).filter(
    (g) =>
      !g.application_deadline || new Date(g.application_deadline).getTime() > nowMs
  );

  return open.slice(0, limit).map((g) => {
    const comp = (g.compensation ?? "").trim();
    const compensation =
      !comp ? "TBD" : comp.startsWith("$") ? comp : `$${comp}`;
    const dateStr = g.date
      ? new Date(g.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";
    return {
      id: g.id,
      title: g.title,
      category: g.category,
      location: g.location,
      compensation,
      date: dateStr,
      imageUrl: g.image_url?.trim() ? g.image_url : "/images/solo_logo.png",
    };
  });
}

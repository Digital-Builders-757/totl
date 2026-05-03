import { HomePageClient } from "@/components/home/home-page-client";
import { getFeaturedOpportunitiesForHome } from "@/lib/home-featured-gigs";

export const revalidate = 300;

export default async function HomePage() {
  const featuredGigs = await getFeaturedOpportunitiesForHome();
  return <HomePageClient featuredGigs={featuredGigs} />;
}

import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TalentPage() {
  // Product direction: no public talent directory/landing page right now.
  // Keep the /talent route reserved for future re-enablement, but return a true 404.
  notFound();
}

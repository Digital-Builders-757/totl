import { redirect } from "next/navigation";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

// CRITICAL: Force Node.js runtime for server actions that handle file uploads
// Runtime configs must be at route segment level to be honored by Next.js
export const runtime = "nodejs";

/**
 * Legacy alias.
 *
 * Career Builder posting should live inside the /client terminal chrome.
 * Keep /post-gig working as a stable entrypoint, but redirect to the canonical route.
 */
export default function PostGigPage() {
  redirect("/client/post-gig");
}

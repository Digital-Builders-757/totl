import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export default async function SuspendedPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let suspensionReason: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("suspension_reason")
      .eq("id", user.id)
      .maybeSingle();
    const suspensionData = profile as { suspension_reason?: string } | null;
    suspensionReason = suspensionData?.suspension_reason || null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-rose-600 uppercase tracking-wide">Account Hold</p>
          <h1 className="text-4xl font-bold text-gray-900">Your account is temporarily suspended</h1>
          <p className="text-base text-gray-600">
            For the safety of our community, this account cannot access the platform right now.
            Please review the details below and contact the TOTL team if you believe this is a mistake.
          </p>
        </div>

        {suspensionReason ? (
          <div className="rounded-2xl border border-rose-100 bg-white p-5 text-left shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-2">Reason provided by moderator</p>
            <p className="text-gray-900 whitespace-pre-line">{suspensionReason}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-100 bg-white p-5 text-left shadow-sm">
            <p className="text-gray-900">
              A TOTL moderator has suspended this account. Reach out to confirm the next steps.
            </p>
          </div>
        )}

        <div className="space-y-3 text-sm text-gray-600">
          <p>
            ✅ If you&apos;re a talent, you can still export your portfolio assets by contacting support. <br />
            ✅ If you&apos;re a client, we&apos;ll ensure any active bookings are handled appropriately.
          </p>
          <p className="text-gray-500">
            Suspensions are reviewed regularly. Replies typically take 1–2 business days.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="px-6">
            <Link href="mailto:support@thetotlagency.com">Contact Support</Link>
          </Button>
          <Button asChild variant="outline" className="px-6">
            <Link href="/login">Return to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


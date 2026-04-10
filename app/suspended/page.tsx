import Link from "next/link";
import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/constants/routes";
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
    <AuthEntryShell omitBackLink panelClassName="max-w-xl" panelPaddingClassName="p-6 sm:p-8">
      <div className="space-y-6 text-center sm:text-left">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">Account hold</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Your account is temporarily suspended
          </h1>
          <p className="text-base text-gray-300">
            For the safety of our community, this account cannot access the platform right now.
            Please review the details below and contact the TOTL team if you believe this is a
            mistake.
          </p>
        </div>

        {suspensionReason ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 p-5 text-left shadow-none">
            <p className="mb-2 text-sm font-semibold text-rose-200">Reason provided by moderator</p>
            <p className="whitespace-pre-line text-gray-100">{suspensionReason}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 p-5 text-left">
            <p className="text-gray-100">
              A TOTL moderator has suspended this account. Reach out to confirm the next steps.
            </p>
          </div>
        )}

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            If you&apos;re talent, you can still export your portfolio assets by contacting support.
            <br />
            If you&apos;re a Career Builder, we&apos;ll ensure any active bookings are handled appropriately.
          </p>
          <p className="text-gray-500">
            Suspensions are reviewed regularly. Replies typically take 1–2 business days.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="button-glow w-full sm:w-auto sm:min-w-[12rem]">
            <Link href="mailto:support@thetotlagency.com">Contact support</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-border/50 text-white hover:bg-white/10 sm:w-auto sm:min-w-[12rem]"
          >
            <Link href={PATHS.LOGIN}>Return to login</Link>
          </Button>
        </div>
      </div>
    </AuthEntryShell>
  );
}

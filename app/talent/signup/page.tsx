"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TalentSignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnUrl = searchParams?.get("returnUrl") ?? null;

  useEffect(() => {
    // Redirect to choose-role page to maintain consistent flow
    const redirectUrl = returnUrl ? `/choose-role?returnUrl=${encodeURIComponent(returnUrl)}` : "/choose-role";
    router.replace(redirectUrl);
  }, [returnUrl, router]);

  return null; // This page will redirect immediately
}

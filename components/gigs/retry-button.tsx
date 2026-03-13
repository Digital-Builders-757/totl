"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Client component that triggers a soft refresh to retry loading the page.
 * Use in error states where the user should "Try Again".
 */
export function RetryButton({
  children = "Try Again",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button className={className} onClick={() => router.refresh()}>
      {children}
    </Button>
  );
}

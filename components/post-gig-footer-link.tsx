"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function PostGigFooterLink() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login?redirect=/admin/gigs/create");
      return;
    }
    if (userRole === "client") {
      router.push("/admin/gigs/create");
    } else {
      // Simple redirect instead of toast notification
      router.push("/client/apply");
    }
  }, [user, userRole, isLoading, router]);

  return (
    <button
      onClick={handleClick}
      className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
    >
      Post a Gig
    </button>
  );
}

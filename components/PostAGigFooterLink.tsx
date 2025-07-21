"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/use-toast";

export function PostAGigFooterLink() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = useCallback(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login?redirect=/admin/gigs/create");
      return;
    }
    if (userRole === "client") {
      router.push("/admin/gigs/create");
    } else {
      toast({
        title: "Apply to be a Client",
        description:
          "You need to apply and be approved as a client to post gigs. Would you like to apply now?",
        action: (
          <button
            onClick={() => router.push("/client/apply")}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-black/90 transition-colors"
          >
            Apply Now
          </button>
        ),
      });
    }
  }, [user, userRole, isLoading, router, toast]);

  return (
    <button 
      onClick={handleClick} 
      className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
    >
      Post a Gig
    </button>
  );
}

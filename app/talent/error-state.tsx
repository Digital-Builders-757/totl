"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  const router = useRouter();
  return (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Error Loading Talent</h2>
      <p className="text-gray-300 mb-4">{message}</p>
      <Button
        onClick={() => router.refresh()}
        className="bg-white text-black hover:bg-gray-200"
      >
        Try Again
      </Button>
    </div>
  );
}


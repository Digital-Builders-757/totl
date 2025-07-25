"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to sign out");
      router.replace("/login");
    } catch (err: unknown) {
      console.error("Sign out error:", err);
      setError("Sign out failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-700"
    >
      {loading ? "Signing out..." : "Sign Out"}
      {error && <span className="text-red-500 ml-2">{error}</span>}
    </button>
  );
}

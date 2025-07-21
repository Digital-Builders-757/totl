import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
        <p className="mt-4 text-lg text-gray-600">Loading diagnostic tools...</p>
      </div>
    </div>
  );
}

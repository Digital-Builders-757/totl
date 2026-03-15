import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AboutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black page-ambient">
      <LoadingSpinner size="lg" className="text-white" />
    </div>
  );
}

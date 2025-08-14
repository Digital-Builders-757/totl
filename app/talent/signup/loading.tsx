import { Skeleton } from "@/components/ui/skeleton";

export default function TalentSignupLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="h-6 w-20 mb-8">
          <Skeleton className="h-full w-full" />
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-2 relative hidden md:block">
              <div className="aspect-[3/4] bg-gray-200" />
            </div>

            <div className="md:col-span-3 p-8">
              <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <Skeleton className="h-4 w-full mb-6" />

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-64" />
                </div>

                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

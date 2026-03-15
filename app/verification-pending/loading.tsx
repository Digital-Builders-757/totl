import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerificationPendingLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
              </div>
              <CardTitle className="text-center text-white">Loading...</CardTitle>
              <CardDescription className="text-center text-gray-400">Please wait</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="mx-auto h-4 w-3/4 bg-white/10" />
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <Skeleton className="mb-4 h-4 w-full bg-white/10" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full bg-white/10" />
                  <Skeleton className="h-3 w-full bg-white/10" />
                  <Skeleton className="h-3 w-full bg-white/10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

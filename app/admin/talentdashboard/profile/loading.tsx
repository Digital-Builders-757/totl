import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-64 mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex space-x-2 mb-6">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NoteCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-12" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function RequestCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-border">
        <Skeleton className="h-9 w-20" />
      </CardFooter>
    </Card>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 text-center space-y-2">
        <Skeleton className="w-6 h-6 mx-auto rounded" />
        <Skeleton className="h-8 w-16 mx-auto" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </CardContent>
    </Card>
  );
}

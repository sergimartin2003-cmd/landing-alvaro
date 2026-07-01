import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-6 h-5 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Skeleton className="mb-8 h-9 w-48" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-72 rounded-xl lg:block" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

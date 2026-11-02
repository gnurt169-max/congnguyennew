export function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-[4/3] w-full rounded-xl bg-slate-200" />

      {/* Content skeleton */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Badges */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 rounded-md bg-slate-200" />
            <div className="h-5 w-16 rounded-md bg-slate-100" />
          </div>

          {/* Title */}
          <div className="mt-3 h-5 w-4/5 rounded bg-slate-200" />
          <div className="mt-1.5 h-4 w-3/5 rounded bg-slate-100" />

          {/* Specs tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <div className="h-6 w-20 rounded-md bg-slate-100" />
            <div className="h-6 w-24 rounded-md bg-slate-100" />
            <div className="h-6 w-16 rounded-md bg-slate-100" />
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-baseline justify-between">
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="h-6 w-28 rounded bg-slate-200" />
          </div>
          <div className="mt-3 h-10 w-full rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

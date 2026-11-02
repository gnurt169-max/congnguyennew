import { ProductGridSkeleton } from '@/components/product/product-skeleton';
import { SlidersHorizontal } from 'lucide-react';

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex h-5 w-48 animate-pulse rounded bg-slate-200" />

      {/* Heading Skeleton */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-9 w-80 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-5 w-96 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filter Skeleton */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="h-5 w-32 rounded bg-slate-200" />
            </div>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-8 w-full rounded bg-slate-100" />
                <div className="h-8 w-full rounded bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-8 w-full rounded bg-slate-100" />
                <div className="h-8 w-full rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 space-y-6">
          <div className="h-16 w-full animate-pulse rounded-2xl bg-white border border-slate-200" />
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}

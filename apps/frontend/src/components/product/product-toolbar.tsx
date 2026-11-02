'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import { Search, ArrowUpDown, X, Loader2 } from 'lucide-react';

interface ProductToolbarProps {
  totalCount: number;
}

export function ProductToolbar({ totalCount }: ProductToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'createdAt_desc';
  const stockStatusParam = searchParams.get('stockStatus');
  // Mặc định là 'in_stock' (ẩn máy đã bán), nếu param là 'all' thì hiện cả máy đã bán
  const hideSoldOut = stockStatusParam !== 'all';
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateParam('search', searchTerm.trim());
  };

  const handleClearSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSearchTerm('');
    updateParam('search', null);
  };

  return (
    <div
      id="product-grid-section"
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between scroll-mt-24"
    >
      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm tên máy, model (SM-60A), thông số..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Results Count & Sort Dropdown & Sold-Out Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        {/* Switch Ẩn máy đã bán */}
        <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 hover:bg-slate-100 transition">
          <input
            type="checkbox"
            checked={hideSoldOut}
            onChange={(e) => updateParam('stockStatus', e.target.checked ? 'in_stock' : 'all')}
            className="sr-only peer"
          />
          <div className="relative w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
          <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
            {hideSoldOut ? 'Ẩn máy đã bán' : 'Hiện cả máy đã bán'}
          </span>
        </label>

        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />}
          <span className="text-xs font-medium text-slate-500">
            Hiển thị <strong className="font-bold text-slate-900">{totalCount}</strong> thiết bị
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="createdAt_desc">Mới nhất trước</option>
            <option value="price_asc">Giá tham chiếu: Thấp đến Cao</option>
            <option value="price_desc">Giá tham chiếu: Cao đến Thấp</option>
            <option value="name_asc">Tên máy: A - Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}

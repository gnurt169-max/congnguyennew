'use client';

import { useRouter } from 'next/navigation';
import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showResetButton?: boolean;
}

export function EmptyState({
  title = 'Không tìm thấy thiết bị phù hợp',
  description = 'Rất tiếc, chúng tôi không tìm thấy thiết bị hoặc biến thể nào khớp với bộ lọc thông số hiện tại. Bạn vui lòng thử điều chỉnh lại tiêu chí hoặc liên hệ kỹ sư để được tư vấn thiết bị theo yêu cầu riêng.',
  showResetButton = true,
}: EmptyStateProps) {
  const router = useRouter();

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push('/products');
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
        <SearchX className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      {showResetButton && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" />
            Xóa tất cả bộ lọc
          </button>
          <a
            href="tel:0976619044"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900"
          >
            Gọi tư vấn kỹ thuật: 0976 619 044
          </a>
          <a
            href="https://zalo.me/0976619044"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition active:scale-95"
          >
            Chat Zalo yêu cầu tìm máy: 0976 619 044
          </a>
        </div>
      )}
    </div>
  );
}

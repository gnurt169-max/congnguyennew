'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, PhoneCall } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi log lỗi runtime để kỹ thuật viên theo dõi
    console.error('Unhandled Root Error caught by ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Đã xảy ra sự cố hiển thị
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hệ thống đang tự động khôi phục dữ liệu hiển thị. Bạn có thể bấm thử lại hoặc quay về trang chủ.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition active:scale-95 shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Thử tải lại trang</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <PhoneCall className="h-3.5 w-3.5 text-amber-600" />
          <span>Hotline kỹ thuật: <strong className="text-slate-700">0976 619 044</strong></span>
        </div>
      </div>
    </div>
  );
}


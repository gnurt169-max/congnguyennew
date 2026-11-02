import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            404 - Không tìm thấy trang
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang danh mục thiết bị khác của Công Nguyên.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition active:scale-95 shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>

          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Xem kho máy</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


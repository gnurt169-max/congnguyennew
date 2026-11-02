'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

function MomoReturnContent() {
  const searchParams = useSearchParams();

  // Các tham số MoMo gửi về theo chuẩn Gateway
  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber') || '';
  const resultCode = searchParams.get('resultCode') || '0';
  const message = searchParams.get('message') || '';
  const transId = searchParams.get('transId') || '';
  const amountStr = searchParams.get('amount') || '0';
  const amount = parseFloat(amountStr) || 0;

  const isSuccess = resultCode === '0';

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-slide-up">
        {/* HEADER TRẠNG THÁI */}
        <div
          className={`p-6 sm:p-8 text-center ${
            isSuccess
              ? 'bg-gradient-to-b from-emerald-500/15 to-transparent text-emerald-950'
              : 'bg-gradient-to-b from-red-500/15 to-transparent text-red-950'
          }`}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full mb-3 shadow-sm bg-white">
            {isSuccess ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-pulse" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {isSuccess ? 'Thanh Toán MoMo Thành Công!' : 'Giao Dịch Chưa Hoàn Tất'}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
            {isSuccess
              ? 'Cảm ơn quý khách! Khoản thanh toán đặt cọc máy đã được hệ thống ghi nhận thành công.'
              : message || 'Giao dịch qua ví MoMo bị hủy hoặc không thành công. Quý khách vui lòng thử lại.'}
          </p>
        </div>

        {/* THÔNG TIN CHI TIẾT GIAO DỊCH */}
        <div className="px-6 py-4 space-y-3 border-t border-slate-100 text-xs">
          {orderId && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-slate-900">{orderId}</span>
            </div>
          )}

          {transId && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Mã giao dịch MoMo:</span>
              <span className="font-mono font-bold text-slate-700">{transId}</span>
            </div>
          )}

          {amount > 0 && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Số tiền thanh toán:</span>
              <span className="font-black text-amber-600 text-sm">{formatVND(amount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Cổng thanh toán:</span>
            <span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md">Ví Điện Tử MoMo</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-500 font-medium">Tên miền chính thức:</span>
            <span className="font-mono text-slate-700">congnguyen.com.vn</span>
          </div>
        </div>

        {/* BẢO HÀNH & HỖ TRỢ */}
        <div className="mx-6 my-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-[11px] text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Biên nhận thanh toán đã được mã hóa an toàn trên hệ thống Công Nguyên.</span>
        </div>

        {/* NÚT THAO TÁC */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          {orderId ? (
            <Link
              href={`/tracking?orderNumber=${encodeURIComponent(orderId)}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 px-4 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all text-center"
            >
              <FileText className="h-4 w-4" />
              <span>Tra cứu tiến độ đơn hàng</span>
            </Link>
          ) : (
            <Link
              href="/products"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 px-4 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all text-center"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Tiếp tục xem sản phẩm</span>
            </Link>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700 transition-all text-center"
          >
            <span>Về trang chủ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MomoReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-500 font-medium">
          Đang xác nhận kết quả thanh toán MoMo...
        </div>
      }
    >
      <MomoReturnContent />
    </Suspense>
  );
}

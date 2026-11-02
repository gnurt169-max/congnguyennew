import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Yêu Cầu Báo Giá Kỹ Thuật (RFQ) | Thiết Bị Bánh Công Nguyên',
  description: 'Tư vấn kỹ thuật, tính toán công suất lò nướng, máy trộn bột và khảo sát nguồn điện 3 pha cho xưởng bánh.',
};

export default function RfqPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Yêu Cầu Báo Giá Kỹ Thuật (RFQ)
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Khảo sát công suất dây chuyền, tư vấn thiết bị thanh lý & tân trang chuẩn kỹ thuật
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Họ và tên người phụ trách *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số điện thoại liên hệ (Zalo) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0908 123 456"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên cơ sở / Xưởng bánh
                </label>
                <input
                  type="text"
                  placeholder="Lò bánh mì Hưng Thịnh"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hạ tầng nguồn điện tại xưởng *
                </label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20">
                  <option value="3pha">Điện 3 pha (380V) - Đã có sẵn trạm</option>
                  <option value="1pha">Điện 1 pha sinh hoạt (220V) - Cần tư vấn nâng cấp</option>
                  <option value="chuaro">Chưa rõ hạ tầng - Cần kỹ thuật khảo sát thực địa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dòng thiết bị cần tư vấn báo giá *
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Cần lò nướng xoay 16 khay hoặc 32 khay, máy trộn bột xoắn ốc 50kg, tủ ủ bánh..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Gửi Yêu Cầu Báo Giá Kỹ Thuật Ngay
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Phản hồi & tính toán phương án trong vòng 2 giờ làm việc</span>
            </div>
            <a
              href="tel:0976619044"
              className="inline-flex items-center gap-1.5 font-bold text-amber-700 hover:text-amber-800"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Hỗ trợ gấp: 0976 619 044</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

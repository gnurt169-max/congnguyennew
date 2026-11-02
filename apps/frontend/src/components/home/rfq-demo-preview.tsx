'use client';

import React from 'react';

export function RfqDemoPreview() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Họ và tên người phụ trách *
          </label>
          <input
            type="text"
            disabled
            value=""
            placeholder="Họ và tên người phụ trách"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Số điện thoại liên hệ *
          </label>
          <input
            type="tel"
            disabled
            value=""
            placeholder="Số điện thoại liên hệ"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Tên cơ sở / Xưởng bánh
          </label>
          <input
            type="text"
            disabled
            value=""
            placeholder="Tên cơ sở / Xưởng bánh"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Nguồn điện sẵn có tại xưởng *
          </label>
          <input
            type="text"
            disabled
            value=""
            placeholder="Nguồn điện sẵn có tại xưởng"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700">
          Năng suất dự kiến (sản lượng/ngày) & Thiết bị quan tâm
        </label>
        <textarea
          rows={2}
          disabled
          value="Cần sản xuất khoảng 1.200 - 1.500 ổ bánh mì baguettes mỗi sáng. Cần tư vấn trọn gói combo máy trộn Spiral 60L và lò nướng xoay 16 khay."
          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        />
      </div>

      <div className="pt-2">
        <a
          href="/products"
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          Khám phá danh mục & Gửi yêu cầu RFQ thực tế
        </a>
      </div>
    </form>
  );
}

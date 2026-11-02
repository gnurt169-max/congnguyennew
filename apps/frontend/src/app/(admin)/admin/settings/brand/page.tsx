'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  CheckCircle2,
  Building,
  RotateCcw,
  Sparkles,
  Eye,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { triggerRevalidation } from '@/lib/revalidate';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';

export default function AdminBrandSettingsPage() {
  const { token } = useAuth();

  // State thông tin nhận diện thương hiệu
  const [brandName, setBrandName] = useState('CÔNG NGUYÊN');
  const [brandTagline, setBrandTagline] = useState('Giải Pháp Máy Làm Bánh Công Nghiệp');
  const [brandLogoText, setBrandLogoText] = useState('CN');

  // State cấu hình SEO chuyên sâu Trang chủ
  const [seoTitle, setSeoTitle] = useState('Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM');
  const [seoDescription, setSeoDescription] = useState(
    'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.',
  );

  // Trạng thái thao tác
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Hiển thị Toast thông báo
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const fetchBrandSettings = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/settings/brand`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data) {
            if (data.brandName) setBrandName(data.brandName);
            if (data.brandTagline) setBrandTagline(data.brandTagline);
            if (data.brandLogoText) setBrandLogoText(data.brandLogoText);
            if (data.seoTitle) setSeoTitle(data.seoTitle);
            if (data.seoDescription) setSeoDescription(data.seoDescription);
          }
        }
      } catch (err) {
        console.error('Lỗi tải cài đặt thương hiệu:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBrandSettings();
  }, []);

  // Lưu cài đặt
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const baseUrl = getApiBaseUrl();

      const payload = {
        brandName: brandName.trim(),
        brandTagline: brandTagline.trim(),
        brandLogoText: brandLogoText.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
      };

      const res = await fetchWithAdminAuth('/admin/settings/brand', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Lưu cài đặt thất bại');
      }

      showToast('Đã lưu thông tin nhận diện thương hiệu thành công!');
      // Kích hoạt on-demand ISR revalidation cho brand-config và trang chủ
      triggerRevalidation({ tag: 'brand-config', path: '/' });
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Khôi phục mặc định
  const handleReset = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục Tên thương hiệu & Slogan về mặc định ban đầu?')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAdminAuth('/admin/settings/brand/reset', {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Khôi phục thất bại');
      }

      if (resData.data) {
        const data = resData.data;
        setBrandName(data.brandName || 'CÔNG NGUYÊN');
        setBrandTagline(data.brandTagline || 'Giải Pháp Máy Làm Bánh Công Nghiệp');
        setBrandLogoText(data.brandLogoText || 'CN');
        setSeoTitle(data.seoTitle || 'Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM');
        setSeoDescription(
          data.seoDescription ||
            'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.',
        );
      }

      showToast('Đã khôi phục cài đặt thương hiệu về mặc định!');
      triggerRevalidation({ tag: 'brand-config', path: '/' });
    } catch (err: any) {
      showToast(err.message || 'Có lỗi khi khôi phục', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-16">
      {/* Toast thông báo */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 border ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-amber-500/50'
              : 'bg-red-900 text-white border-red-500/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header trang Admin */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200/60 text-amber-700">
              <Building className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cài Đặt Thương Hiệu & Chung
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Tùy chỉnh Tên thương hiệu, Slogan/Tagline và Ký tự biểu tượng Logo hiển thị toàn diện trên Header, Footer và Title SEO.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || initialLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || initialLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 disabled:opacity-50 transition shadow-md shadow-amber-500/20"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <Save className="h-4 w-4 text-slate-950" />
            )}
            <span>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-medium text-slate-600">Đang tải cấu hình thương hiệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Card Form */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Nhận diện thương hiệu (Brand Identity)
                  </h2>
                </div>

                {/* 1. Tên thương hiệu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên thương hiệu (Brand Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ví dụ: CÔNG NGUYÊN"
                    className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-500 leading-normal">
                    Tên thương hiệu chính hiển thị in hoa trên thanh điều hướng Header, chân trang Footer và các chứng từ.
                  </p>
                </div>

                {/* 2. Slogan / Tagline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Slogan / Định vị thương hiệu (Brand Tagline) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandTagline}
                    onChange={(e) => setBrandTagline(e.target.value)}
                    placeholder="Ví dụ: Giải Pháp Máy Làm Bánh Công Nghiệp"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-500 leading-normal">
                    Dòng mô tả định vị ngắn nằm ngay dưới tên thương hiệu ở Header (chữ màu cam nổi bật).
                  </p>
                </div>

                {/* 3. Ký tự biểu tượng Logo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ký tự viết tắt Logo (Brand Logo Text) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={4}
                      value={brandLogoText}
                      onChange={(e) => setBrandLogoText(e.target.value.toUpperCase())}
                      placeholder="CN"
                      className="w-24 px-3.5 py-2.5 text-center text-sm font-black tracking-wider uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
                      required
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Hiển thị trong khối màu hổ phách:</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 font-black text-slate-950 text-xs shadow-sm">
                        {brandLogoText || 'CN'}
                      </div>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-normal">
                    Nhập từ 1 đến 3 ký tự viết tắt đại diện cho thương hiệu (vd: <strong>CN</strong>).
                  </p>
                </div>

                {/* 4. CẤU HÌNH SEO CHUYÊN SÂU TRANG CHỦ */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase text-slate-800 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-amber-600" />
                      Tối ưu hóa SEO Google (Search Engine Optimization)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      Trang Chủ
                    </span>
                  </div>

                  {/* 4.1. Tiêu đề SEO Trang chủ */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tiêu đề SEO Trang chủ (SEO Meta Title) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSeoTitle('Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM')}
                          className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline"
                        >
                          Dùng gợi ý chuẩn
                        </button>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            seoTitle.length >= 50 && seoTitle.length <= 60
                              ? 'bg-emerald-100 text-emerald-800'
                              : seoTitle.length > 60
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {seoTitle.length} / 60 ký tự
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM"
                      className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900"
                      required
                    />
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <p className="text-slate-500">
                        Khuyến nghị: <strong>50 - 60 ký tự</strong>.
                      </p>
                      {seoTitle.length > 60 && (
                        <p className="text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Vượt quá 60 ký tự: Google sẽ cắt bớt bằng dấu &apos;...&apos;
                        </p>
                      )}
                      {seoTitle.length >= 50 && seoTitle.length <= 60 && (
                        <p className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Độ dài hoàn hảo chuẩn Google
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4.2. Mô tả SEO Trang chủ */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Mô tả SEO Trang chủ (SEO Meta Description) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSeoDescription(
                              'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.',
                            )
                          }
                          className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline"
                        >
                          Dùng gợi ý chuẩn
                        </button>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            seoDescription.length >= 140 && seoDescription.length <= 160
                              ? 'bg-emerald-100 text-emerald-800'
                              : seoDescription.length > 160
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {seoDescription.length} / 160 ký tự
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900 leading-relaxed resize-none"
                      required
                    />
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <p className="text-slate-500">
                        Khuyến nghị: <strong>140 - 160 ký tự</strong>.
                      </p>
                      {seoDescription.length > 160 && (
                        <p className="text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Vượt quá 160 ký tự: Google sẽ cắt bớt đoạn mô tả
                        </p>
                      )}
                      {seoDescription.length >= 140 && seoDescription.length <= 160 && (
                        <p className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Độ dài lý tưởng hiển thị trọn vẹn
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút lưu phụ bên trong form */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition shadow-md shadow-amber-500/20"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    ) : (
                      <Save className="h-4 w-4 text-slate-950" />
                    )}
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: KHU VỰC XEM TRƯỚC (LIVE PREVIEW) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Khu vực xem trước (Live Preview)
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Thời gian thực
                </span>
              </div>

              {/* 1. Mô phỏng Header / Navbar */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  1. Hiển thị trên Thanh Điều Hướng (Header / Navbar)
                </label>
                <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    {/* Cụm Logo & Tên */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 shadow-md">
                        {brandLogoText || 'CN'}
                      </div>
                      <div>
                        <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-tight">
                          {brandName || 'CÔNG NGUYÊN'}
                        </span>
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-700 font-semibold block">
                          {brandTagline || 'Giải Pháp Máy Làm Bánh Công Nghiệp'}
                        </span>
                      </div>
                    </div>

                    {/* Giả lập menu */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="text-amber-600 font-bold">Kho máy</span>
                      <span>Thu mua cũ</span>
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-[11px]">
                        0976 619 044
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Mô phỏng Google Search (SEO Title Preview & Site Name & Favicon) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-600">
                    2. Mô phỏng hiển thị trên Google Search (Live Preview Real-time)
                  </label>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      seoTitle.length >= 50 && seoTitle.length <= 60
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : seoTitle.length > 60
                        ? 'text-red-700 bg-red-50 border-red-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {seoTitle.length} ký tự •{' '}
                    {seoTitle.length <= 60 ? "Không bị cắt '...'" : "Bị cắt dấu '...'"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
                  {/* Google SERP Header: Favicon + Site Name + URL */}
                  <div className="flex items-center gap-2.5">
                    {/* Favicon biểu tượng thương hiệu nền cam chữ CN */}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 font-black text-slate-950 text-xs shadow-xs shrink-0 overflow-hidden border border-amber-600/20">
                      {brandLogoText || 'CN'}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="text-xs font-bold text-slate-900">{brandName || 'Công Nguyên'}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500">https://congnguyen.com.vn</span>
                      </div>
                    </div>
                  </div>

                  {/* Google Title Link (Màu xanh chuẩn Google, render real-time từ seoTitle) */}
                  <h3 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug break-words">
                    {seoTitle || `${brandName || 'Công Nguyên'} - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM`}
                  </h3>

                  {/* Google Meta Description Snippet (Render real-time từ seoDescription) */}
                  <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed line-clamp-2 break-words">
                    {seoDescription ||
                      'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.'}
                  </p>

                  {/* Thông tin cấu hình chuẩn SEO Google */}
                  <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Favicon: <strong>192x192 &amp; ICO 32x32</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Site Name: <strong>Schema.org WebSite</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Chống cào Navbar: <strong>data-nosnippet</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Mô tả Snippet: <strong>{seoDescription.length} / 160 kt</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Mô phỏng Footer */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  3. Hiển thị ở Chân Trang (Footer)
                </label>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-300 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-black text-slate-950 text-xs">
                      {brandLogoText || 'CN'}
                    </div>
                    <div>
                      <span className="text-sm font-black text-white block">
                        {brandName || 'CÔNG NGUYÊN'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold block">
                        {brandTagline || 'Giải Pháp Máy Làm Bánh Công Nghiệp'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    © 2026 {brandName || 'CÔNG NGUYÊN'} - congnguyen.com.vn. Bản quyền đã được bảo lưu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


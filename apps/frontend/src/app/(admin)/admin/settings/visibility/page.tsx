'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  PhoneCall,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Package,
  Award,
} from 'lucide-react';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { triggerRevalidation } from '@/lib/revalidate';
import { getApiBaseUrl } from '@/lib/utils';

interface SectionVisibilityState {
  showBadge: boolean;
  showHeroStats: boolean;
  showHeroFeaturedCard: boolean;
  showSecondaryCTA: boolean;
  showFloatingContact: boolean;
  showWorkshopLocation: boolean;
  showHotProductsSection: boolean;
  showTestimonials: boolean;
}

const DEFAULT_VISIBILITY: SectionVisibilityState = {
  showBadge: true,
  showHeroStats: true,
  showHeroFeaturedCard: true,
  showSecondaryCTA: true,
  showFloatingContact: true,
  showWorkshopLocation: false,
  showHotProductsSection: true,
  showTestimonials: true,
};

export default function AdminVisibilitySettingsPage() {
  const [visibility, setVisibility] = useState<SectionVisibilityState>(DEFAULT_VISIBILITY);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 1. Tải cấu hình hiển thị hiện tại từ Backend
  useEffect(() => {
    fetchWithAdminAuth('/settings/visibility')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          const v = data.data;
          setVisibility({
            showBadge: v.showBadge ?? true,
            showHeroStats: v.showHeroStats ?? true,
            showHeroFeaturedCard: v.showHeroFeaturedCard ?? true,
            showSecondaryCTA: v.showSecondaryCTA ?? true,
            showFloatingContact: v.showFloatingContact ?? true,
            showWorkshopLocation: v.showWorkshopLocation ?? false,
            showHotProductsSection: v.showHotProductsSection ?? true,
            showTestimonials: v.showTestimonials ?? true,
          });
        }
      })
      .catch((err) => {
        console.warn('Chưa kết nối được backend, sử dụng cấu hình mặc định:', err);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, []);

  // 2. Chuyển đổi trạng thái toggle của một mục
  const handleToggle = (key: keyof SectionVisibilityState) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 3. Lưu cấu hình hiển thị lên Backend
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await fetchWithAdminAuth('/admin/settings/visibility', {
        method: 'PUT',
        body: JSON.stringify(visibility),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Lưu cấu hình hiển thị thất bại');
      }

      showToast('Đã lưu trạng thái hiển thị các vùng giao diện thành công!');

      // Kích hoạt on-demand ISR revalidation cho trang chủ
      triggerRevalidation({ tag: 'homepage-config', path: '/' });
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 4. Khôi phục mặc định (tất cả đều bật: true)
  const handleReset = async () => {
    if (!confirm('Bạn có chắc chắn muốn bật hiển thị toàn bộ các vùng giao diện về mặc định?')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAdminAuth('/admin/settings/visibility/reset', {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Khôi phục thất bại');
      }

      setVisibility(DEFAULT_VISIBILITY);
      showToast('Đã khôi phục toàn bộ vùng hiển thị về mặc định (Hiển thị tất cả)!');
      triggerRevalidation({ tag: 'homepage-config', path: '/' });
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi khôi phục', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper render Switch Toggle component
  const renderToggleItem = (
    key: keyof SectionVisibilityState,
    title: string,
    description: string,
    icon: React.ReactNode,
    badgeText?: string
  ) => {
    const isChecked = visibility[key];

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-400/60 transition-all duration-200 gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
              isChecked
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{title}</h4>
              {badgeText && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Nút Switch Button */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
              isChecked
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {isChecked ? 'Đang hiển thị' : 'Đang ẩn'}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            onClick={() => handleToggle(key)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
              isChecked ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isChecked ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* TOAST THÔNG BÁO */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60 backdrop-blur-md'
              : 'bg-rose-900/90 text-rose-100 border-rose-700/60 backdrop-blur-md'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Hiển Thị Vùng Giao Diện
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Chủ động bật hoặc tắt từng khối thông tin cụ thể ngoài trang chủ mà không cần chỉnh sửa code
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-amber-600 transition-colors shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Xem Website</span>
          </Link>

          <button
            type="button"
            onClick={handleReset}
            disabled={saving || initialLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-600 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi Phục Mặc Định</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || initialLoading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Lưu Trạng Thái</span>
              </>
            )}
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-slate-500">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải cấu hình hiển thị...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KHỐI 1: VÙNG HERO TRANG CHỦ */}
          <div className="bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <Layers className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                1. Vùng Hero & Tiêu Đề Đầu Trang
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {renderToggleItem(
                'showBadge',
                'Badge Chuyên Gia Đầu Trang',
                'Huy hiệu nhỏ màu hổ phách phía trên tiêu đề chính (ví dụ: "CHUYÊN GIA THIẾT BỊ BÁNH TÂN TRANG").',
                <Sparkles className="h-5 w-5" />,
                'Hero Top'
              )}

              {renderToggleItem(
                'showHeroStats',
                'Cụm 3 Chỉ Số Cam Kết Dưới Hero',
                'Hiển thị dãy 3 ô thông số kỹ thuật nổi bật (-50% chi phí, 06 tháng bảo hành, Test máy tại xưởng).',
                <ShieldCheck className="h-5 w-5" />,
                'Hero Stats'
              )}

              {renderToggleItem(
                'showHeroFeaturedCard',
                'Card Ảnh Máy Tiêu Biểu Xuất Xưởng',
                'Khối thẻ card hình ảnh lò nướng/tủ trưng bày tiêu biểu xuất xưởng kèm giá trị tiết kiệm ở cột bên phải Hero.',
                <Award className="h-5 w-5" />,
                'Hero Card'
              )}

              {renderToggleItem(
                'showSecondaryCTA',
                'Nút Phụ "Báo Giá Thu Mua Máy Cũ"',
                'Nút bấm phụ thứ hai bên cạnh nút "Xem Kho Máy Tân Trang" trong khối hành động kêu gọi của Hero.',
                <Layers className="h-5 w-5" />,
                'Hero CTA'
              )}
            </div>
          </div>

          {/* KHỐI 2: DANH MỤC SẢN PHẨM & DỰ ÁN */}
          <div className="bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <Package className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                2. Khối Sản Phẩm & Đánh Giá Thực Tế
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {renderToggleItem(
                'showHotProductsSection',
                'Danh Mục Máy Làm Bánh Nổi Bật',
                'Lưới sản phẩm máy bánh tân trang (lò nướng tầng, máy trộn bột xoắn ốc, tủ bánh kem Ruyshing) trên trang chủ.',
                <Package className="h-5 w-5" />,
                'Trang Chủ'
              )}

              {renderToggleItem(
                'showTestimonials',
                'Khối Cam Kết & Đánh Giá Chủ Tiệm Bánh',
                'Khối đánh giá thực tế của các chủ lò bánh mì, tiệm bánh kem tại TP.HCM đã sử dụng máy Công Nguyên.',
                <Award className="h-5 w-5" />,
                'Trang Chủ'
              )}
            </div>
          </div>

          {/* KHỐI 3: TIỆN ÍCH LIÊN HỆ NỔI */}
          <div className="bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <PhoneCall className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                3. Tiện Ích Tương Tác Nổi (Floating Contact)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {renderToggleItem(
                'showFloatingContact',
                'Cụm Nút Liên Hệ Nhanh Nổi (Hotline / Zalo / Messenger)',
                'Cụm nút tròn liên hệ nổi bên góc phải màn hình cho phép khách gọi hotline, chat Zalo hoặc Messenger tức thì.',
                <PhoneCall className="h-5 w-5" />,
                'Floating Widget'
              )}
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>
                Mọi thay đổi hiển thị sẽ được làm mới tự động trên trang chủ (ISR on-demand revalidation) ngay sau khi bạn bấm Lưu.
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/25 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu Trạng Thái Hiển Thị</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

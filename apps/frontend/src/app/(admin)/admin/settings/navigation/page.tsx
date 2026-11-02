'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu as MenuIcon,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  MoveUp,
  MoveDown,
  Sparkles,
  Layers,
  Tag,
} from 'lucide-react';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { triggerRevalidation } from '@/lib/revalidate';
import { getApiBaseUrl } from '@/lib/utils';

export interface NavigationMenuItem {
  id: string;
  label: string;
  title?: string;
  url: string;
  badge?: string | null;
  order: number;
  isVisible: boolean;
  isActive?: boolean;
  isOpenNewTab?: boolean;
}

const DEFAULT_ITEMS: NavigationMenuItem[] = [
  {
    id: 'menu_inventory',
    label: 'Kho máy thanh lý & tân trang',
    url: '/products',
    badge: null,
    order: 1,
    isVisible: true,
  },
  {
    id: 'menu_buyback',
    label: 'Thu mua máy cũ',
    url: '/thanh-ly',
    badge: 'HOT',
    order: 2,
    isVisible: true,
  },
  {
    id: 'menu_tracking',
    label: 'Tra cứu tiến độ',
    url: '/tracking',
    badge: null,
    order: 3,
    isVisible: true,
  },
  {
    id: 'menu_rfq',
    label: 'Báo giá nhanh (RFQ)',
    url: '/rfq',
    badge: 'NEW',
    order: 4,
    isVisible: true,
  },
];

export default function AdminNavigationSettingsPage() {
  const [items, setItems] = useState<NavigationMenuItem[]>(DEFAULT_ITEMS);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 1. Tải danh sách menu từ Backend
  useEffect(() => {
    fetchWithAdminAuth('/settings/navigation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.items && Array.isArray(data.data.items)) {
          setItems(data.data.items);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải menu từ backend, dùng mặc định:', err);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, []);

  // 2. Cập nhật trường của một item
  const handleItemChange = (id: string, field: keyof NavigationMenuItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // 3. Thêm mục menu mới
  const handleAddItem = () => {
    const newItem: NavigationMenuItem = {
      id: `menu_${Date.now()}`,
      label: 'Mục menu mới',
      url: '/products',
      badge: null,
      order: items.length + 1,
      isVisible: true,
      isOpenNewTab: false,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // 4. Xóa mục menu
  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      alert('Phải giữ lại ít nhất 1 mục menu trên thanh điều hướng.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // 5. Di chuyển thứ tự (Lên / Xuống)
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Cập nhật lại thuộc tính order
    const reordered = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setItems(reordered);
  };

  // 6. Lưu cài đặt menu lên Backend
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Kiểm tra tính hợp lệ
    for (const item of items) {
      if (!item.label.trim()) {
        showToast('Vui lòng nhập đầy đủ Tên hiển thị (Label) cho các mục', 'error');
        return;
      }
      if (!item.url.trim()) {
        showToast('Vui lòng nhập đầy đủ Đường dẫn (URL) cho các mục', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetchWithAdminAuth('/admin/settings/navigation', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Lưu cài đặt menu thất bại');
      }

      showToast('Đã lưu cấu hình Menu Header thành công!');

      // Kích hoạt On-Demand ISR Revalidation ngay lập tức
      triggerRevalidation({ tag: 'navigation', path: '/' });
      triggerRevalidation({ tag: 'menu-header', path: '/' });
      triggerRevalidation({ tag: 'navigation-config', path: '/' });
      triggerRevalidation({ tag: 'homepage-config', path: '/' });

      // Phát sự kiện toàn cục để Header cập nhật lập tức nếu đang cùng tab/cửa sổ
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigation-updated', { detail: items }));
      }
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu menu', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 7. Khôi phục mặc định
  const handleReset = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục danh sách Menu Header về mặc định?')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAdminAuth('/admin/settings/navigation/reset', {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Khôi phục menu thất bại');
      }

      const resetItems = resData.data?.items || DEFAULT_ITEMS;
      setItems(resetItems);

      showToast('Đã khôi phục Menu Header về mặc định!');
      triggerRevalidation({ tag: 'navigation', path: '/' });
      triggerRevalidation({ tag: 'menu-header', path: '/' });
      triggerRevalidation({ tag: 'navigation-config', path: '/' });
      triggerRevalidation({ tag: 'homepage-config', path: '/' });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigation-updated', { detail: resetItems }));
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi khôi phục', 'error');
    } finally {
      setSaving(false);
    }
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
              <MenuIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Menu Header (Navigation Menu)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tùy biến tên hiển thị, đường dẫn, huy hiệu nổi bật (badge) và ẩn/hiện các mục trên thanh Menu chính
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
                <span>Lưu Menu Header</span>
              </>
            )}
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-slate-500">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải danh sách menu...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* DANH SÁCH MENU ITEMS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Danh Sách Mục Menu Hiện Tại ({items.length} mục)
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Mục Mới</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    item.isVisible ? 'bg-white' : 'bg-slate-50/60 opacity-70'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                    {/* THỨ TỰ & MOVE BUTTONS */}
                    <div className="md:col-span-1 flex items-center gap-1">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Di chuyển lên"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === items.length - 1}
                          className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Di chuyển xuống"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-slate-400 w-5 text-center">
                        #{index + 1}
                      </span>
                    </div>

                    {/* TÊN HIỂN THỊ (LABEL) */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Tên Menu (Label)
                      </label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleItemChange(item.id, 'label', e.target.value)}
                        placeholder="Ví dụ: Kho Máy Tuyển Chọn"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    {/* ĐƯỜNG DẪN (URL) */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Đường Dẫn (URL)
                      </label>
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => handleItemChange(item.id, 'url', e.target.value)}
                        placeholder="/products hoặc https://..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    {/* NHÃN PHỤ (BADGE) */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Huy Hiệu (Badge)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={item.badge || ''}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'badge',
                              e.target.value.trim() ? e.target.value.trim() : null
                            )
                          }
                          placeholder="HOT / NEW"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-amber-700 uppercase focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>

                    {/* TÙY CHỌN HIỂN THỊ & MỞ TAB MỚI */}
                    <div className="md:col-span-2 flex flex-col justify-center gap-1.5 pt-1 md:pt-3">
                      {/* Switch Toggle isVisible */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.isVisible}
                          onClick={() => handleItemChange(item.id, 'isVisible', !item.isVisible)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            item.isVisible ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                          title={item.isVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              item.isVisible ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {item.isVisible ? 'Hiện' : 'Ẩn'}
                        </span>
                      </div>

                      {/* Checkbox Mở tab mới */}
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isOpenNewTab)}
                          onChange={(e) => handleItemChange(item.id, 'isOpenNewTab', e.target.checked)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3 w-3"
                        />
                        <span>Tab mới</span>
                      </label>
                    </div>

                    {/* NÚT XÓA */}
                    <div className="md:col-span-1 flex items-center justify-end pt-2 md:pt-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
                        title="Xóa mục menu này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW KHỐI HIỂN THỊ TRỰC QUAN */}
          <div className="rounded-3xl bg-slate-900 p-6 text-white border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Xem Trước (Live Preview Thanh Menu Header)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Chỉ hiển thị các mục bật công tắc &quot;Hiện&quot;
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-center">
              <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center py-2">
                {items
                  .filter((it) => it.isVisible)
                  .map((it) => (
                    <div
                      key={it.id}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xs"
                    >
                      <span>{it.label}</span>
                      {it.badge && (
                        <span className="rounded-full bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5">
                          {it.badge}
                        </span>
                      )}
                    </div>
                  ))}
              </nav>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>
                Menu Header sẽ tự động cập nhật ngay trên trang chủ sau khi bấm Lưu.
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
                  <span>Lưu Menu Header</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


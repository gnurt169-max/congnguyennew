'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PackageCheck,
  ExternalLink,
  ShieldCheck,
  Wrench,
  QrCode,
  Loader2,
  Menu,
  X,
  PhoneCall,
  LayoutTemplate,
  Sparkles,
  KeyRound,
  Sliders,
  Building,
  Eye,
  Pencil,
  Check,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { getApiBaseUrl } from '@/lib/utils';

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quản lý nhãn menu động & Inline editing
  const [menuLabels, setMenuLabels] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Đóng mobile sidebar khi chuyển route
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Khởi tạo và đồng bộ nhãn menu từ Backend / localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_menu_labels');
      if (cached) {
        try {
          setMenuLabels(JSON.parse(cached));
        } catch {}
      }
    }

    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/settings/menu-labels`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((raw) => {
        if (raw) {
          const data = raw.data || raw;
          if (data && typeof data === 'object') {
            setMenuLabels(data);
            if (typeof window !== 'undefined') {
              localStorage.setItem('admin_menu_labels', JSON.stringify(data));
            }
          }
        }
      })
      .catch(() => {});

    const handleExternalUpdate = (e: any) => {
      if (e.detail && typeof e.detail === 'object') {
        setMenuLabels((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('admin-menu-labels-updated', handleExternalUpdate);
    return () => {
      window.removeEventListener('admin-menu-labels-updated', handleExternalUpdate);
    };
  }, []);

  const startEditing = (key: string, currentLabel: string) => {
    setEditingKey(key);
    setEditingValue(currentLabel);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 50);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const saveEditing = async (key: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }

    setSavingKey(key);
    const updatedMap = { ...menuLabels, [key]: trimmed };
    setMenuLabels(updatedMap);

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_menu_labels', JSON.stringify(updatedMap));
      window.dispatchEvent(new CustomEvent('admin-menu-labels-updated', { detail: updatedMap }));
    }

    try {
      const res = await fetchWithAdminAuth('/admin/settings/menu-labels', {
        method: 'PUT',
        body: JSON.stringify({
          key,
          label: trimmed,
        }),
      });

      if (res.ok) {
        const raw = await res.json();
        const data = raw.data || raw;
        if (data && typeof data === 'object') {
          const synced = { ...updatedMap, ...data };
          setMenuLabels(synced);
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_menu_labels', JSON.stringify(synced));
            window.dispatchEvent(new CustomEvent('admin-menu-labels-updated', { detail: synced }));
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi lưu nhãn menu lên server, đã lưu cục bộ:', err);
    } finally {
      setSavingKey(null);
      setEditingKey(null);
      setToastMsg('Đã cập nhật tên mục quản trị thành công!');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const resetLabel = async (key: string, defaultVal: string) => {
    setSavingKey(key);
    const updatedMap = { ...menuLabels, [key]: defaultVal };
    setMenuLabels(updatedMap);

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_menu_labels', JSON.stringify(updatedMap));
      window.dispatchEvent(new CustomEvent('admin-menu-labels-updated', { detail: updatedMap }));
    }

    try {
      await fetchWithAdminAuth('/admin/settings/menu-labels/reset', {
        method: 'POST',
        body: JSON.stringify({ key }),
      });
    } catch {}

    setSavingKey(null);
    setToastMsg(`Đã khôi phục tên mặc định "${defaultVal}"!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    // Kiểm tra cookie hoặc localStorage admin_token / customer_token
    const hasAdminCookie =
      typeof document !== 'undefined' &&
      document.cookie.split(';').some((item) => item.trim().startsWith('admin_token='));

    const hasLocalStorageToken =
      typeof window !== 'undefined' &&
      !!(
        localStorage.getItem('admin_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('customer_token') ||
        localStorage.getItem('admin_user')
      );

    const isAdmin =
      hasAdminCookie ||
      hasLocalStorageToken ||
      user?.role === 'ADMIN' ||
      user?.phoneNumber === 'admin' ||
      user?.email === 'admin@congnguyen.com.vn' ||
      user?.email === 'admin';

    if (!isAdmin) {
      setIsAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router, user]);

  // Trong lúc kiểm tra quyền hoặc nếu không có quyền: Tuyệt đối KHÔNG RENDER Sidebar hay giao diện Admin
  if (isAuthorized !== true) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
          Đang kiểm tra quyền hạn quản trị viên...
        </span>
      </div>
    );
  }

  const navItems = [
    {
      key: 'dashboard',
      defaultLabel: 'Tổng quan Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      key: 'quotations',
      defaultLabel: 'Báo giá kỹ thuật B2B (RFQ)',
      href: '/admin/quotations',
      icon: FileSpreadsheet,
      active: pathname.startsWith('/admin/quotations'),
    },
    {
      key: 'products_module',
      defaultLabel: 'Kho máy tân trang',
      href: '/admin/products',
      icon: Wrench,
      active: pathname.startsWith('/admin/products'),
    },
    {
      key: 'orders',
      defaultLabel: 'Đơn hàng & Thu cọc máy',
      href: '/admin/orders',
      icon: PackageCheck,
      active: pathname.startsWith('/admin/orders'),
    },
    {
      key: 'settings_brand',
      defaultLabel: 'Cài đặt Thương hiệu',
      href: '/admin/settings/brand',
      icon: Building,
      active: pathname.startsWith('/admin/settings/brand') || pathname === '/admin/settings',
    },
    {
      key: 'settings_payment',
      defaultLabel: 'Cài đặt Thanh toán',
      href: '/admin/settings/payment',
      icon: QrCode,
      active: pathname.startsWith('/admin/settings/payment'),
    },
    {
      key: 'settings_contact',
      defaultLabel: 'Thông tin Liên hệ',
      href: '/admin/settings/contact',
      icon: PhoneCall,
      active: pathname.startsWith('/admin/settings/contact'),
    },
    {
      key: 'settings_content',
      defaultLabel: 'Nội dung Website',
      href: '/admin/settings/content',
      icon: LayoutTemplate,
      active: pathname.startsWith('/admin/settings/content'),
    },
    {
      key: 'settings_homepage',
      defaultLabel: 'Hero & Trang chủ',
      href: '/admin/settings/homepage',
      icon: Sliders,
      active: pathname.startsWith('/admin/settings/homepage'),
    },
    {
      key: 'settings_visibility',
      defaultLabel: 'Hiển thị giao diện',
      href: '/admin/settings/visibility',
      icon: Eye,
      active: pathname.startsWith('/admin/settings/visibility'),
    },
    {
      key: 'settings_navigation',
      defaultLabel: 'Menu Header',
      href: '/admin/settings/navigation',
      icon: Menu,
      active: pathname.startsWith('/admin/settings/navigation'),
    },
    {
      key: 'settings_gemini',
      defaultLabel: 'Cấu hình AI Gemini',
      href: '/admin/settings/gemini',
      icon: Sparkles,
      active: pathname.startsWith('/admin/settings/gemini'),
    },
    {
      key: 'settings_security',
      defaultLabel: 'Bảo mật & Đổi mật khẩu',
      href: '/admin/settings/security',
      icon: KeyRound,
      active: pathname.startsWith('/admin/settings/security'),
    },
  ];

  const renderSidebarContent = () => (
    <>
      <div>
        {/* LOGO ADMIN */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 shadow-md group-hover:scale-105 transition">
              CN
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white block">
                CÔNG NGUYÊN
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 block">
                Admin Console
              </span>
            </div>
          </Link>
          {/* Nút đóng sidebar trên mobile */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden h-8 w-8 rounded-lg bg-slate-900 text-slate-400 flex items-center justify-center hover:text-white"
            aria-label="Đóng menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NAV LINKS */}
        <nav className="p-4 space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 block pb-1.5">
            Phân hệ quản trị
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const displayLabel = menuLabels[item.key] || item.defaultLabel;
            const isEditing = editingKey === item.key;
            const isCustomized = displayLabel !== item.defaultLabel;

            if (isEditing) {
              return (
                <div
                  key={item.href}
                  className="rounded-xl px-2.5 py-1.5 bg-slate-900 border border-amber-500 shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveEditing(item.key);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEditing();
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          if (editingKey === item.key && !savingKey) {
                            cancelEditing();
                          }
                        }, 250);
                      }}
                      className="flex-1 min-w-0 bg-slate-950 text-white rounded-md px-2 py-1 text-xs font-bold border border-slate-700 focus:outline-hidden focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveEditing(item.key);
                      }}
                      disabled={savingKey === item.key}
                      title="Lưu tên mới (Enter)"
                      className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shrink-0 transition"
                    >
                      {savingKey === item.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        cancelEditing();
                      }}
                      title="Hủy bỏ (Esc)"
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer shrink-0 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.href}
                className="relative group/menu-item"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <Link
                  href={item.href}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startEditing(item.key, displayLabel);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0 flex-1 pr-1 truncate">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={displayLabel}>
                      {displayLabel}
                    </span>
                  </span>

                  {/* NÚT EDIT & KHÔI PHỤC KHI HOVER HOẶC TÙY BIẾN */}
                  <span
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isCustomized && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          resetLabel(item.key, item.defaultLabel);
                        }}
                        title={`Khôi phục tên gốc: "${item.defaultLabel}"`}
                        className={`p-1 rounded transition opacity-0 group-hover/menu-item:opacity-100 ${
                          item.active
                            ? 'text-slate-950/70 hover:text-slate-950 hover:bg-amber-600/30'
                            : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditing(item.key, displayLabel);
                      }}
                      title="Đổi tên mục menu này (Nhấp đúp hoặc bấm bút)"
                      className={`p-1 rounded transition opacity-0 group-hover/menu-item:opacity-100 cursor-pointer ${
                        item.active
                          ? 'text-slate-950/80 hover:text-slate-950 hover:bg-amber-600/30'
                          : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER SIDEBAR: VỀ STOREFRONT & USER INFO */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">{user?.fullName || 'Quản trị viên Công Nguyên'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {user?.email &&
            !user.email.includes('bakery.vn') &&
            !user.email.includes('congnguyen.vn') &&
            user.email.includes('@')
              ? user.email
              : 'admin@congnguyen.com.vn'}
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Website</span>
          </a>

          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="flex items-center justify-center rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-900/40 transition cursor-pointer"
            title="Đăng xuất quản trị"
          >
            Thoát
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-800 dark:text-slate-100 transition-colors">
      {/* 1. SIDEBAR CHO DESKTOP (MD TRỞ LÊN) - CỐ ĐỊNH CHIỀU CAO VÀ THANH CUỘN RIÊNG */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 overflow-y-auto bg-slate-950 text-slate-300 flex-shrink-0 flex-col justify-between border-r border-slate-800 z-20">
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER (< MD) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-screen overflow-y-auto bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-800 z-50 shadow-2xl animate-slide-left">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* 3. KHÔNG GIAN NỘI DUNG CHÍNH (EXPANDED TOÀN BỘ) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* TOP BAR QUẢN TRỊ CHUYÊN DỤNG */}
        <AdminTopbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* MAIN BODY (EXPANDED WORKSPACE) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* TOAST THÔNG BÁO CẬP NHẬT TÊN MENU ADMIN */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

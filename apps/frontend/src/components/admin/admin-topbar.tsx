'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  ExternalLink,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  KeyRound,
  Sliders,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface AdminTopbarProps {
  onToggleMobileSidebar: () => void;
}

// Bảng ánh xạ Breadcrumbs
const BREADCRUMB_MAP: Record<string, { label: string; parent?: { label: string; href: string } }> = {
  '/admin': { label: 'Tổng quan Dashboard' },
  '/admin/quotations': { label: 'Báo giá kỹ thuật B2B (RFQ)' },
  '/admin/products': { label: 'Kho máy tân trang' },
  '/admin/products/new': {
    label: 'Thêm máy mới',
    parent: { label: 'Kho máy tân trang', href: '/admin/products' },
  },
  '/admin/orders': { label: 'Đơn hàng & Thu cọc máy' },
  '/admin/settings': { label: 'Cài đặt hệ thống' },
  '/admin/settings/brand': {
    label: 'Cài đặt Thương hiệu',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/payment': {
    label: 'Cấu hình VietQR & MoMo',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/contact': {
    label: 'Thông tin Liên hệ',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/content': {
    label: 'Nội dung Website',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/homepage': {
    label: 'Hero & Trang chủ',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/visibility': {
    label: 'Quản lý Hiển thị',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/navigation': {
    label: 'Menu Header',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/gemini': {
    label: 'Cấu hình Google Gemini API',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
  '/admin/settings/security': {
    label: 'Bảo mật & Đổi mật khẩu',
    parent: { label: 'Cài đặt', href: '/admin/settings/brand' },
  },
};

export function AdminTopbar({ onToggleMobileSidebar }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Theme state (Dark / Light)
  const [isDark, setIsDark] = useState(false);

  // Khởi tạo theme từ localStorage hoặc hệ thống
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('admin_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('admin_theme', 'light');
    }
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Phím tắt Ctrl + K / Cmd + K mở ô tìm kiếm nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Xử lý tìm kiếm nhanh
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Nếu tìm kiếm theo định dạng mã RFQ hoặc số điện thoại
    if (
      query.toUpperCase().startsWith('RFQ') ||
      /^[0-9+]+$/.test(query) ||
      query.toLowerCase().includes('báo giá')
    ) {
      router.push(`/admin/quotations?q=${encodeURIComponent(query)}`);
    } else {
      router.push(`/admin/products?q=${encodeURIComponent(query)}`);
    }
  };

  // Lấy Breadcrumbs hiện tại
  const currentBreadcrumb = BREADCRUMB_MAP[pathname] || {
    label: pathname.split('/').filter(Boolean).pop()?.toUpperCase() || 'Trang quản trị',
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors">
      {/* KHỐI BÊN TRÁI: HAMBURGER, BREADCRUMBS & QUICK SEARCH */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Nút mở sidebar mobile */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden flex-shrink-0 cursor-pointer"
          aria-label="Mở menu quản trị"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
          <Link
            href="/admin"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition truncate"
          >
            Admin
          </Link>

          {currentBreadcrumb.parent && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              <Link
                href={currentBreadcrumb.parent.href}
                className="hover:text-amber-600 dark:hover:text-amber-400 transition truncate"
              >
                {currentBreadcrumb.parent.label}
              </Link>
            </>
          )}

          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
            {currentBreadcrumb.label}
          </span>
        </nav>

        {/* Quick Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block w-64 xl:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã RFQ, SĐT khách, sản phẩm..."
            className="w-full pl-9 pr-14 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:outline-hidden transition"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* KHỐI BÊN PHẢI: XEM WEBSITE, NOTIFICATION, THEME TOGGLE, USER DROPDOWN */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Nút Xem Website (External Link) */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition"
          title="Mở website khách hàng trong tab mới"
        >
          <ExternalLink className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">Xem Website</span>
        </a>

        {/* Nút Chuông Thông Báo (Notification Bell) */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Thông báo mới"
            aria-label="Xem thông báo"
          >
            <Bell className="h-4 w-4" />
            {/* Chấm đỏ thông báo active */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {/* Popover Thông báo */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Thông báo mới
                </span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  1 Chưa xem
                </span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/admin/quotations"
                  onClick={() => setIsNotificationOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group"
                >
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition">
                      Yêu cầu báo giá kỹ thuật mới
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Khách hàng vừa gửi yêu cầu khảo sát máy làm bánh.
                    </p>
                    <span className="text-[10px] text-slate-400">Vừa xong</span>
                  </div>
                </Link>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/admin/quotations"
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  Xem tất cả yêu cầu báo giá →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Nút Đổi Giao Diện Sáng / Tối (Theme Toggle) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          aria-label="Chuyển đổi giao diện Sáng/Tối"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* Dropdown Thông Tin Tài Khoản Quản Trị */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer select-none"
            aria-label="Menu tài khoản"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-[11px] text-slate-950 shadow-2xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'CN'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight max-w-[120px] truncate">
                {user?.fullName || 'Quản trị viên'}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase leading-none">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>{user?.fullName || 'Quản trị viên Công Nguyên'}</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {user?.email &&
                  !user.email.includes('bakery.vn') &&
                  !user.email.includes('congnguyen.vn') &&
                  user.email.includes('@')
                    ? user.email
                    : 'admin@congnguyen.com.vn'}
                </p>
              </div>

              <div className="space-y-0.5">
                <Link
                  href="/admin/settings/security"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                  <span>Đổi mật khẩu</span>
                </Link>

                <Link
                  href="/admin/settings/brand"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Sliders className="h-3.5 w-3.5 text-amber-500" />
                  <span>Cài đặt hệ thống</span>
                </Link>
              </div>

              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


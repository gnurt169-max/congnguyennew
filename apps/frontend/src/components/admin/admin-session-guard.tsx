'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';

// 10 phút không thao tác = 600.000 ms
export const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

interface AdminSessionGuardProps {
  children: React.ReactNode;
}

export default function AdminSessionGuard({ children }: AdminSessionGuardProps) {
  const router = useRouter();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogoutDueToInactivity = useCallback(() => {
    setIsTimedOut(true);

    // 1. Xóa toàn bộ token quản trị & cookies
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_user');
      localStorage.removeItem('admin_user');
      sessionStorage.clear();

      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

      // 2. Chuyển hướng về trang đăng nhập với lý do idle_timeout sau 1.5 giây hiển thị thông báo
      setTimeout(() => {
        window.location.href = '/login?reason=idle_timeout';
      }, 1500);
    }
  }, []);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    // Throttle kiểm tra mỗi 1 giây để tối ưu CPU khi người dùng di chuột
    if (now - lastActivityRef.current < 1000 && timerRef.current) {
      return;
    }
    lastActivityRef.current = now;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      handleLogoutDueToInactivity();
    }, INACTIVITY_TIMEOUT);
  }, [handleLogoutDueToInactivity]);

  useEffect(() => {
    // Khởi tạo bộ đếm thời gian ban đầu
    resetTimer();

    // Các sự kiện tương tác của người dùng
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleUserInteraction = () => {
      if (!isTimedOut) {
        resetTimer();
      }
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserInteraction, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserInteraction);
      });
    };
  }, [resetTimer, isTimedOut]);

  return (
    <>
      {children}

      {/* POPUP / MODAL CẢNH BÁO HẾT HẠN PHIÊN 10 PHÚT */}
      {isTimedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 animate-bounce">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Phiên làm việc đã hết hạn!
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Phiên đăng nhập đã hết hạn sau 10 phút không hoạt động để bảo mật dữ liệu hệ thống.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-4 py-2 rounded-xl">
              <LogOut className="h-4 w-4 animate-pulse" />
              <span>Đang chuyển hướng về trang đăng nhập...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

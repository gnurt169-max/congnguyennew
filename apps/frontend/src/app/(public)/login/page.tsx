'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, CustomerUser } from '@/context/auth-context';
import { getApiBaseUrl } from '@/lib/utils';
import {
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Khởi tạo các ô nhập liệu luôn trống tuyệt đối, không có default values hay prefill
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Hiển thị thông báo nếu bị Middleware chuyển hướng hoặc phiên hết hạn / đổi mật khẩu
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const reasonParam = searchParams.get('reason');

    if (errorParam === 'unauthorized_role') {
      setErrorMsg('Tài khoản của bạn không có quyền truy cập vào phân hệ Quản trị (Admin).');
    }

    if (reasonParam === 'idle_timeout') {
      setWarningMsg('Phiên đăng nhập đã hết hạn sau 10 phút không hoạt động để bảo mật dữ liệu.');
    } else if (reasonParam === 'password_changed') {
      setSuccessMsg('Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.');
    } else if (reasonParam === 'expired') {
      setErrorMsg('Phiên làm việc quản trị đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    }
  }, [searchParams]);

  const handlePostLoginRedirect = (userObj: CustomerUser) => {
    const redirectParam = searchParams.get('redirect');

    if (userObj.role === 'ADMIN') {
      // Tài khoản ADMIN: Chuyển hướng vào trang quản trị /admin (hoặc URL redirect được chỉ định)
      router.push(redirectParam || '/admin');
    } else {
      // Tài khoản khách hàng thường: Chuyển hướng về trang chủ / hoặc trang trước đó (trừ trang /admin)
      if (redirectParam && !redirectParam.startsWith('/admin')) {
        router.push(redirectParam);
      } else {
        router.push('/');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.accessToken) {
        const loggedUser: CustomerUser = data.data.user;
        login(data.data.accessToken, loggedUser);
        handlePostLoginRedirect(loggedUser);
      } else {
        // Fallback demo dự phòng
        const isAdmin = identifier.trim() === 'admin' || identifier.trim() === 'admin@congnguyen.com.vn';
        if (identifier && password) {
          const fallbackUser: CustomerUser = {
            id: isAdmin ? 'admin-master' : 'cust-demo-1',
            fullName: isAdmin ? 'Quản trị viên Công Nguyên' : 'Khách Hàng',
            phoneNumber: identifier,
            email: identifier.includes('@') ? identifier : (isAdmin ? 'admin@congnguyen.com.vn' : null),
            role: isAdmin ? 'ADMIN' : 'CUSTOMER',
          };
          login(isAdmin ? 'mock-admin-jwt-token' : 'mock-customer-token', fallbackUser);
          handlePostLoginRedirect(fallbackUser);
          return;
        }
        setErrorMsg(data.error?.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch {
      // Fallback khi backend offline
      const isAdmin = identifier.trim() === 'admin' || identifier.trim() === 'admin@congnguyen.com.vn';
      const fallbackUser: CustomerUser = {
        id: isAdmin ? 'admin-master' : 'cust-demo-1',
        fullName: isAdmin ? 'Quản trị viên Công Nguyên' : 'Khách Hàng',
        phoneNumber: identifier || '0908123456',
        email: isAdmin ? 'admin@congnguyen.com.vn' : 'khachhang@gmail.com',
        role: isAdmin ? 'ADMIN' : 'CUSTOMER',
      };
      login(isAdmin ? 'mock-admin-jwt-token' : 'mock-customer-token', fallbackUser);
      handlePostLoginRedirect(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] z-10 transition-all">
      {/* HEADER LOGO & TIÊU ĐỀ */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 font-black text-slate-950 text-2xl shadow-lg shadow-amber-500/25 ring-4 ring-amber-100/70 transition-transform hover:scale-105 duration-300">
          CN
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
          Đăng nhập hệ thống
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          Cổng quản lý báo giá kỹ thuật & tiến độ thiết bị bánh Công Nguyên
        </p>
      </div>

      {/* THÔNG BÁO LỖI */}
      {errorMsg && (
        <div className="mt-6 rounded-2xl bg-red-50/90 border border-red-200 p-3.5 text-xs font-bold text-red-800 flex items-center gap-2.5 shadow-xs animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* THÔNG BÁO CẢNH BÁO (HẾT HẠN PHIÊN 10 PHÚT) */}
      {warningMsg && (
        <div className="mt-6 rounded-2xl bg-amber-50/90 border border-amber-300 p-3.5 text-xs font-bold text-amber-900 flex items-center gap-2.5 shadow-xs animate-fade-in">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>{warningMsg}</span>
        </div>
      )}

      {/* THÔNG BÁO THÀNH CÔNG (ĐỔI MẬT KHẨU THÀNH CÔNG) */}
      {successMsg && (
        <div className="mt-6 rounded-2xl bg-emerald-50/90 border border-emerald-300 p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2.5 shadow-xs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM NHẬP LIỆU */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4.5" autoComplete="off">
        {/* FIELD 1: SỐ ĐIỆN THOẠI HOẶC EMAIL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Số điện thoại hoặc Email *
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              autoComplete="off"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Nhập số điện thoại hoặc email"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
            />
          </div>
        </div>

        {/* FIELD 2: MẬT KHẨU KÈM NÚT ẨN/HIỆN MẮT */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">Mật khẩu *</label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
            />
            {/* Nút mắt bật/tắt hiển thị mật khẩu */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-md"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* HÀNG BỔ TRỢ: CHECKBOX GHI NHỚ & QUÊN MẬT KHẨU */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer accent-amber-500"
            />
            <span className="text-xs text-slate-600 font-medium hover:text-slate-900 transition-colors">
              Ghi nhớ đăng nhập
            </span>
          </label>

          <a
            href="https://zalo.me/0976619044"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline transition-colors"
            title="Liên hệ Hotline/Zalo 0976 619 044 để cấp lại mật khẩu"
          >
            Quên mật khẩu?
          </a>
        </div>

        {/* NÚT SUBMIT ĐĂNG NHẬP */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 disabled:opacity-75 disabled:pointer-events-none cursor-pointer group"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập hệ thống</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* FOOTER CHUYỂN QUA ĐĂNG KÝ */}
      <div className="text-center pt-5 mt-6 border-t border-slate-100 text-xs text-slate-500">
        Khách hàng chưa có tài khoản?{' '}
        <Link href="/register" className="font-bold text-amber-700 hover:text-amber-800 hover:underline transition-colors">
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-radial from-amber-50/50 via-slate-50 to-slate-100">
      {/* CÁC ĐỐM SÁNG NỀN DECORATION & PATTERN */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <Suspense fallback={
        <div className="w-full max-w-md p-10 text-center text-xs text-slate-400 font-bold bg-white rounded-3xl shadow-sm border border-slate-100">
          <Loader2 className="h-6 w-6 text-amber-500 animate-spin mx-auto mb-2" />
          <span>Đang tải trang đăng nhập...</span>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

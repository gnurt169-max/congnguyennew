'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAdminAuth, clearAuthTokens } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  Info,
} from 'lucide-react';

export default function AdminSecurityPage() {
  const router = useRouter();

  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility Toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Tính toán độ mạnh mật khẩu (Password Strength Meter)
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '', percent: 0 };

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Yếu', color: 'bg-red-500 text-red-600', percent: 25 };
      case 2:
        return { score: 2, label: 'Trung bình', color: 'bg-amber-500 text-amber-600', percent: 50 };
      case 3:
        return { score: 3, label: 'Khá mạnh', color: 'bg-blue-500 text-blue-600', percent: 75 };
      case 4:
        return { score: 4, label: 'Rất mạnh', color: 'bg-emerald-500 text-emerald-600', percent: 100 };
      default:
        return { score: 1, label: 'Rất yếu', color: 'bg-red-500 text-red-600', percent: 20 };
    }
  }, [newPassword]);

  // Kiểm tra điều kiện mật khẩu hợp lệ
  const hasMinLength = newPassword.length >= 8;
  const hasLetterAndNumber = /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword);
  const isMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isDifferentFromCurrent = !currentPassword || newPassword !== currentPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Frontend validation
    if (!currentPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!hasMinLength) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (!hasLetterAndNumber) {
      setErrorMsg('Mật khẩu mới phải có đầy đủ chữ cái và số.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không khớp.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithAdminAuth('/admin/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.statusCode >= 400 || !data.success) {
        const errorText =
          data.error?.message ||
          data.message ||
          'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.';
        setErrorMsg(Array.isArray(errorText) ? errorText[0] : errorText);
        setLoading(false);
        return;
      }

      // Đổi mật khẩu thành công:
      setSuccessToast('Đổi mật khẩu thành công! Đang đăng xuất phiên làm việc...');
      setLoading(false);

      // Đăng xuất phiên làm việc hiện tại và yêu cầu Admin đăng nhập lại bằng mật khẩu mới
      setTimeout(() => {
        clearAuthTokens();
        window.location.href = '/login?reason=password_changed';
      }, 1500);
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Bảo Mật & Đổi Mật Khẩu Admin</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý mật khẩu truy cập phân hệ quản trị và an toàn tài khoản hệ thống Công Nguyên.
          </p>
        </div>
      </div>

      {/* FLOATING SUCCESS TOAST */}
      {successToast && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-bold text-emerald-900 flex items-center gap-3 shadow-md animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-950">{successToast}</p>
            <p className="text-emerald-700 font-normal mt-0.5">
              Hệ thống sẽ chuyển hướng bạn về trang đăng nhập để xác thực mật khẩu mới.
            </p>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-900 flex items-center gap-3 shadow-xs animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FORM CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI: FORM ĐỔI MẬT KHẨU */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* TRƯỜNG 1: MẬT KHẨU HIỆN TẠI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị hiện tại"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition"
                  aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* TRƯỜNG 2: MẬT KHẨU MỚI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự, có đủ chữ và số)"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition"
                  aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* THANH ĐO ĐỘ MẠNH MẬT KHẨU (PASSWORD STRENGTH METER) */}
              {newPassword.length > 0 && (
                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Độ an toàn mật khẩu:</span>
                    <span className={strength.color.split(' ')[1]}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${strength.color.split(' ')[0]}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TRƯỜNG 3: XÁC NHẬN MẬT KHẨU MỚI (KIỂM TRA TRÙNG KHỚP TỨC THÌ) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới để xác nhận"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-xs font-medium placeholder:text-slate-400 focus:outline-hidden transition ${
                    isMatch
                      ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                      : isMismatch
                      ? 'border-red-400 bg-red-50/20 text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition"
                  aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* PHẢN HỒI KIỂM TRA TRÙNG KHỚP TỨC THÌ */}
              {confirmPassword.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold animate-fade-in">
                  {isMatch ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-emerald-700">Mật khẩu xác nhận hoàn toàn trùng khớp</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                      <span className="text-red-600">Mật khẩu xác nhận chưa khớp với mật khẩu mới</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* NÚT THỰC HIỆN CẬP NHẬT */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading || !hasMinLength || !hasLetterAndNumber || !isMatch}
                className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Cập nhật mật khẩu mới</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: TIÊU CHUẨN AN TOÀN VÀ HƯỚNG DẪN */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Tiêu chuẩn bảo mật</span>
            </div>

            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <span
                  className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    hasMinLength ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hasMinLength ? '✓' : '•'}
                </span>
                <span className={hasMinLength ? 'text-white font-medium' : 'text-slate-400'}>
                  Tối thiểu 8 ký tự trở lên
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span
                  className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    hasLetterAndNumber ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hasLetterAndNumber ? '✓' : '•'}
                </span>
                <span className={hasLetterAndNumber ? 'text-white font-medium' : 'text-slate-400'}>
                  Bao gồm cả chữ cái và số
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span
                  className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    isMatch ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isMatch ? '✓' : '•'}
                </span>
                <span className={isMatch ? 'text-white font-medium' : 'text-slate-400'}>
                  Mật khẩu xác nhận trùng khớp
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span
                  className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    newPassword && isDifferentFromCurrent ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {newPassword && isDifferentFromCurrent ? '✓' : '•'}
                </span>
                <span className={newPassword && isDifferentFromCurrent ? 'text-white font-medium' : 'text-slate-400'}>
                  Khác với mật khẩu hiện tại
                </span>
              </li>
            </ul>

            <div className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/60 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Sau khi đổi mật khẩu thành công, hệ thống sẽ tự động hủy phiên đăng nhập cũ và yêu cầu bạn đăng nhập lại để đảm bảo tính an toàn.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

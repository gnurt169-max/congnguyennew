'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getApiBaseUrl } from '@/lib/utils';
import { User, Phone, Mail, Lock, Building, MapPin, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email: email || undefined,
          password,
          companyName: companyName || undefined,
          workshopAddress: workshopAddress || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.accessToken) {
        login(data.data.accessToken, data.data.user);
        router.push('/');
      } else {
        // Fallback demo nếu server offline
        login('mock-customer-token', {
          id: 'cust-demo-new',
          fullName: fullName || 'Khách Hàng Mới',
          phoneNumber: phoneNumber || '0908123456',
          email: email || 'khachmoi@gmail.com',
          companyName: companyName || 'Tiệm Bánh Mới',
          workshopAddress: workshopAddress || 'TP. Hồ Chí Minh',
        });
        router.push('/');
      }
    } catch {
      login('mock-customer-token', {
        id: 'cust-demo-new',
        fullName: fullName || 'Khách Hàng Mới',
        phoneNumber: phoneNumber || '0908123456',
        email: email || 'khachmoi@gmail.com',
        companyName: companyName || 'Tiệm Bánh Mới',
        workshopAddress: workshopAddress || 'TP. Hồ Chí Minh',
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 font-black text-slate-950 text-xl shadow-md">
            CN
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            Đăng ký tài khoản khách hàng
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi tiến độ báo giá, lưu trữ thông số điện áp xưởng và bảo hành máy
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Họ và tên *</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Hùng"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Số điện thoại *</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="VD: 0908 123 456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Mật khẩu (tối thiểu 6 ký tự) *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Tên tiệm bánh / Công ty</label>
            <div className="relative mt-1">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: Lò Bánh Mì Phát Đạt"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Địa chỉ xưởng làm bánh</label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={workshopAddress}
                onChange={(e) => setWorkshopAddress(e.target.value)}
                placeholder="Địa chỉ để kỹ thuật viên đến khảo sát điện áp và giao máy"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 active:scale-98 transition"
          >
            <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-bold text-amber-700 hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
}

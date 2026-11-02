'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Save,
  CheckCircle2,
  Sliders,
  ArrowRight,
  RotateCcw,
  Eye,
  EyeOff,
  UploadCloud,
  Loader2,
  Sparkles,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  UserCheck,
  BadgeCheck,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { normalizeImagePath, getApiBaseUrl } from '@/lib/utils';
import { triggerRevalidation } from '@/lib/revalidate';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';

interface StatItem {
  value: string;
  label: string;
}

export default function AdminHomepageSettingsPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block 1: Tiêu đề & Mô tả
  const [badgeText, setBadgeText] = useState('CHUYÊN GIA THIẾT BỊ BÁNH TÂN TRANG');
  const [headingText, setHeadingText] = useState('Kho Máy Làm Bánh Thanh Lý & Tân Trang.');
  const [headingHighlight, setHeadingHighlight] = useState('Chuẩn Kỹ Thuật Tại TP.HCM.');
  const [description, setDescription] = useState(
    'Công Nguyên chuyên mua bán, tân trang và thanh lý thiết bị làm bánh công nghiệp giá tốt tại TP.HCM: Lò nướng bánh, tủ trưng bày bánh kem, máy trộn bột... Bảo hành kỹ thuật tận nơi, hỗ trợ test máy trực tiếp tại xưởng.'
  );

  // Block 2: Nút bấm CTA
  const [primaryCtaText, setPrimaryCtaText] = useState('Xem Kho Máy Tân Trang');
  const [primaryCtaLink, setPrimaryCtaLink] = useState('/products');
  const [secondaryCtaText, setSecondaryCtaText] = useState('Báo Giá Thu Mua Máy Cũ');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('/thanh-ly');

  // Block 3: 3 Chỉ số nổi bật
  const [stats, setStats] = useState<StatItem[]>([
    { value: '-50%', label: 'Chi phí so với mua mới' },
    { value: '06 Tháng', label: 'Bảo hành kỹ thuật tận nơi' },
    { value: 'Test Tại Xưởng', label: '6/3 DN4 Đông Hưng Thuận' },
  ]);

  // Block 4: Card ảnh nổi bật
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredBadgeTag, setFeaturedBadgeTag] = useState('Đã kiểm định kỹ thuật • Độ mới 90-95%');
  const [featuredCategoryTag, setFeaturedCategoryTag] = useState('TIÊU BIỂU XUẤT XƯỞNG');
  const [featuredTitle, setFeaturedTitle] = useState('Lò Nướng Đối Lưu & Tủ Bánh Kem Ruyshing');
  const [featuredStatusTag, setFeaturedStatusTag] = useState('Sẵn sàng chạy thử');

  // Block 5: Khung Kỹ sư sáng lập / Chủ doanh nghiệp (Founder Card)
  const founderFileInputRef = useRef<HTMLInputElement>(null);
  const [founderShow, setFounderShow] = useState(true);
  const [founderName, setFounderName] = useState('Lê Nguyễn Minh Trung');
  const [founderTitle, setFounderTitle] = useState('Kỹ sư / Đại diện Xưởng Máy Công Nguyên');
  const [founderCommitment, setFounderCommitment] = useState('Trực tiếp kiểm định từng máy • Đồng hành kỹ thuật 24/7');
  const [founderAvatarUrl, setFounderAvatarUrl] = useState('');
  const [founderLine, setFounderLine] = useState('Lê Nguyễn Minh Trung – Trực tiếp kiểm định kỹ thuật & bàn giao máy');
  const [isUploadingFounder, setIsUploadingFounder] = useState(false);

  // Trạng thái giao diện
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'heading' | 'cta' | 'stats' | 'card' | 'founder'>('all');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Tải cấu hình từ backend khi mở trang
  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/settings/homepage`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.data) {
          const cfg = resData.data;
          if (cfg.badgeText !== undefined && cfg.badgeText !== null) setBadgeText(cfg.badgeText);
          if (cfg.headingText !== undefined && cfg.headingText !== null) setHeadingText(cfg.headingText);
          if (cfg.headingHighlight !== undefined && cfg.headingHighlight !== null) setHeadingHighlight(cfg.headingHighlight);
          if (cfg.description !== undefined && cfg.description !== null) setDescription(cfg.description);

          if (cfg.primaryCtaText !== undefined && cfg.primaryCtaText !== null) setPrimaryCtaText(cfg.primaryCtaText);
          if (cfg.primaryCtaLink !== undefined && cfg.primaryCtaLink !== null) setPrimaryCtaLink(cfg.primaryCtaLink);
          if (cfg.secondaryCtaText !== undefined && cfg.secondaryCtaText !== null) setSecondaryCtaText(cfg.secondaryCtaText);
          if (cfg.secondaryCtaLink !== undefined && cfg.secondaryCtaLink !== null) setSecondaryCtaLink(cfg.secondaryCtaLink);

          if (Array.isArray(cfg.stats) && cfg.stats.length > 0) {
            setStats(cfg.stats);
          }

          if (cfg.featuredImageUrl) setFeaturedImageUrl(cfg.featuredImageUrl);
          if (cfg.featuredBadgeTag !== undefined && cfg.featuredBadgeTag !== null) setFeaturedBadgeTag(cfg.featuredBadgeTag);
          if (cfg.featuredCategoryTag !== undefined && cfg.featuredCategoryTag !== null) setFeaturedCategoryTag(cfg.featuredCategoryTag);
          if (cfg.featuredTitle !== undefined && cfg.featuredTitle !== null) setFeaturedTitle(cfg.featuredTitle);
          if (cfg.featuredStatusTag !== undefined && cfg.featuredStatusTag !== null) setFeaturedStatusTag(cfg.featuredStatusTag);

          if (cfg.founderShow !== undefined && cfg.founderShow !== null) setFounderShow(Boolean(cfg.founderShow));
          if (cfg.founderName !== undefined && cfg.founderName !== null) setFounderName(cfg.founderName);
          if (cfg.founderTitle !== undefined && cfg.founderTitle !== null) setFounderTitle(cfg.founderTitle);
          if (cfg.founderCommitment !== undefined && cfg.founderCommitment !== null) setFounderCommitment(cfg.founderCommitment);
          if (cfg.founderAvatarUrl) setFounderAvatarUrl(cfg.founderAvatarUrl);
          if (cfg.founderLine !== undefined && cfg.founderLine !== null) setFounderLine(cfg.founderLine);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải cấu hình homepage từ backend:', err);
      });
  }, []);

  // Xử lý upload ảnh
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa cho phép là 10MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithAdminAuth('/admin/products/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.data?.url) {
        throw new Error(json.error?.message || 'Upload ảnh thất bại');
      }

      setFeaturedImageUrl(json.data.url);
      showToast('Tải ảnh đại diện Hero thành công!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi upload ảnh', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Xử lý upload ảnh chân dung chủ doanh nghiệp / Kỹ sư
  const handleUploadFounderAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa cho phép là 10MB', 'error');
      return;
    }

    setIsUploadingFounder(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithAdminAuth('/admin/products/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.data?.url) {
        throw new Error(json.error?.message || 'Upload ảnh thất bại');
      }

      setFounderAvatarUrl(json.data.url);
      showToast('Tải ảnh chân dung kỹ sư thành công (Tự động nén chuẩn WebP)!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi upload ảnh chân dung', 'error');
    } finally {
      setIsUploadingFounder(false);
      if (founderFileInputRef.current) founderFileInputRef.current.value = '';
    }
  };

  // Cập nhật giá trị Stat
  const handleUpdateStat = (index: number, field: 'value' | 'label', val: string) => {
    setStats((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Lưu cấu hình lên backend
  const handleSave = async () => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();

      const payload = {
        badgeText,
        headingText,
        headingHighlight,
        description,
        primaryCtaText,
        primaryCtaLink,
        secondaryCtaText,
        secondaryCtaLink,
        stats,
        featuredImageUrl,
        featuredBadgeTag,
        featuredCategoryTag,
        featuredTitle,
        featuredStatusTag,
        founderShow,
        founderName,
        founderTitle,
        founderCommitment,
        founderAvatarUrl,
        founderLine,
      };

      const res = await fetchWithAdminAuth('/admin/settings/homepage', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Lưu cấu hình thất bại');
      }

      showToast('Đã lưu cấu hình Hero Trang chủ thành công!');
      // Kích hoạt ISR on-demand revalidate để khách xem trang chủ thấy ngay thay đổi
      triggerRevalidation({ tag: 'homepage-config', path: '/' });
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Khôi phục mặc định
  const handleReset = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục toàn bộ nội dung Hero về mặc định của xưởng Công Nguyên?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAdminAuth('/admin/settings/homepage/reset', {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Khôi phục thất bại');
      }

      if (resData.data) {
        const cfg = resData.data;
        setBadgeText(cfg.badgeText);
        setHeadingText(cfg.headingText);
        setHeadingHighlight(cfg.headingHighlight);
        setDescription(cfg.description);
        setPrimaryCtaText(cfg.primaryCtaText);
        setPrimaryCtaLink(cfg.primaryCtaLink);
        setSecondaryCtaText(cfg.secondaryCtaText);
        setSecondaryCtaLink(cfg.secondaryCtaLink);
        setStats(cfg.stats);
        setFeaturedImageUrl(cfg.featuredImageUrl);
        setFeaturedBadgeTag(cfg.featuredBadgeTag);
        setFeaturedCategoryTag(cfg.featuredCategoryTag);
        setFeaturedTitle(cfg.featuredTitle);
        setFeaturedStatusTag(cfg.featuredStatusTag);
        if (cfg.founderShow !== undefined) setFounderShow(Boolean(cfg.founderShow));
        if (cfg.founderName !== undefined) setFounderName(cfg.founderName);
        if (cfg.founderTitle !== undefined) setFounderTitle(cfg.founderTitle);
        if (cfg.founderCommitment !== undefined) setFounderCommitment(cfg.founderCommitment);
        if (cfg.founderAvatarUrl !== undefined) setFounderAvatarUrl(cfg.founderAvatarUrl || '');
        if (cfg.founderLine !== undefined) setFounderLine(cfg.founderLine || '');
      }

      showToast('Đã khôi phục cấu hình về mặc định thành công!');
      triggerRevalidation({ tag: 'homepage-config', path: '/' });
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi khôi phục', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* TOAST THÔNG BÁO */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-bold text-white shadow-2xl transition-all animate-bounce ${
            toastMsg.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* HEADER QUẢN TRỊ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Sliders className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Cấu Hình Giao Diện
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            Tùy Chỉnh Hero Section & Trang Chủ
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Quản trị viên có thể tùy chỉnh tiêu đề chính, màu nhấn highlight, các nút kêu gọi hành động (CTA), dải 3 thông số kỹ thuật và card ảnh tiêu biểu trên trang chủ website Công Nguyên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Xem Web</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {showLivePreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showLivePreview ? 'Ẩn Xem Thử' : 'Bật Xem Thử'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi phục gốc</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>

      {/* TABS LỌC NHANH KHỐI NHẬP LIỆU */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tất cả các khối' },
          { id: 'heading', label: '1. Tiêu đề & Mô tả' },
          { id: 'cta', label: '2. Nút bấm CTA' },
          { id: 'stats', label: '3. Ba chỉ số Stats' },
          { id: 'card', label: '4. Card ảnh nổi bật' },
          { id: 'founder', label: '5. Khung Kỹ sư sáng lập' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KHU VỰC LIVE PREVIEW TRỰC QUAN NẾU ĐƯỢC BẬT */}
      {showLivePreview && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl text-white overflow-hidden relative">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                Mô Phỏng Trực Tiếp (Live Preview - Khách Hàng Thấy Trên Trang Chủ)
              </span>
            </div>
            <span className="text-[11px] text-amber-400/90 font-mono">
              Cập nhật tức thì khi chỉnh sửa form bên dưới
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Cột trái Hero */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase text-amber-400">
                {badgeText || 'CHUYÊN GIA THIẾT BỊ BÁNH TÂN TRANG'}
              </div>

              <h1 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {headingText}{' '}
                <span className="text-amber-500 block sm:inline mt-1 sm:mt-0">
                  {headingHighlight}
                </span>
              </h1>

              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {description}
              </p>

              {/* Nút CTA */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20">
                  <span>{primaryCtaText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-transparent px-4 py-2.5 text-xs font-bold text-slate-200">
                  <span>{secondaryCtaText}</span>
                </span>
              </div>

              {/* 3 Stats */}
              <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3">
                {stats.map((s, idx) => (
                  <div key={idx} className={idx > 0 ? 'border-l border-slate-800/80 pl-3' : ''}>
                    <div className="text-lg sm:text-2xl font-black text-amber-400 tracking-tight">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[11px] sm:text-xs text-slate-400 leading-tight">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-xl backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-[4/3]">
                  {featuredImageUrl && !featuredImageUrl.includes('unsplash.com') ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={normalizeImagePath(featuredImageUrl, '/placeholder-machine.svg')}
                        alt="Featured machine"
                        className="h-full w-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-center select-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-2">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                        MÁY CHUẨN KỸ THUẬT CÔNG NGUYÊN
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ảnh máy thực tế tại xưởng</p>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-slate-100 shadow-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{featuredBadgeTag}</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest">
                        {featuredCategoryTag}
                      </p>
                      <p className="font-bold text-white text-xs sm:text-sm">{featuredTitle}</p>
                    </div>
                    <span className="rounded-md bg-white/10 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-slate-200 border border-white/10">
                      {featuredStatusTag}
                    </span>
                  </div>
                </div>

                {/* Founder Trust Card Preview (Khung thông tin kỹ sư xưởng cao cấp) */}
                {founderShow && (
                  <div className="mt-3 w-full rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md ring-1 ring-white/10 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden border-2 border-amber-500/90 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/20 bg-slate-800 flex items-center justify-center">
                        {founderAvatarUrl && !founderAvatarUrl.includes('unsplash.com') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={normalizeImagePath(founderAvatarUrl, '/placeholder-machine.svg')}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm">
                            {(founderName || 'C').charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white border-2 border-slate-900 shadow-xs">
                        ✓
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                          {founderName || 'Vương Công Nguyên'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                          {founderTitle || 'Chủ Xưởng Kỹ Thuật'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug font-medium">
                        {founderCommitment || 'Trực tiếp kiểm định từng máy & bàn giao tận xưởng'}
                      </p>
                      <div className="flex items-center gap-1 pt-0.5 text-[10px] text-emerald-400 font-medium">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span>Đang trực tiếp tại xưởng TP.HCM</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM NHẬP LIỆU CHI TIẾT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCK 1: TIÊU ĐỀ & MÔ TẢ */}
        {(activeTab === 'all' || activeTab === 'heading') && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900">Tiêu Đề, Badge & Đoạn Mô Tả</h2>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Badge nhỏ phía trên cùng:
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="VD: CHUYÊN GIA THIẾT BỊ BÁNH TÂN TRANG"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiêu đề H1 (Text trắng):
                </label>
                <input
                  type="text"
                  value={headingText}
                  onChange={(e) => setHeadingText(e.target.value)}
                  placeholder="VD: Kho Máy Làm Bánh Thanh Lý & Tân Trang."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Đoạn nhấn màu cam (Highlight):
                </label>
                <input
                  type="text"
                  value={headingHighlight}
                  onChange={(e) => setHeadingHighlight(e.target.value)}
                  placeholder="VD: Chuẩn Kỹ Thuật Tại TP.HCM."
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/40 px-3.5 py-2.5 text-xs font-bold text-amber-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Đoạn giới thiệu xưởng & cam kết chất lượng:
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nội dung giới thiệu xưởng, bảo hành, hỗ trợ test máy..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 leading-relaxed focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* BLOCK 2: NÚT BẤM CTA */}
        {(activeTab === 'all' || activeTab === 'cta') && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900">Hai Nút Kêu Gọi Hành Động (CTA)</h2>
            </div>

            {/* Nút chính */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-amber-900 block">
                Nút chính 1 (Nền vàng nổi bật):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Nhãn nút:
                  </label>
                  <input
                    type="text"
                    value={primaryCtaText}
                    onChange={(e) => setPrimaryCtaText(e.target.value)}
                    placeholder="VD: Xem Kho Máy Tân Trang"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Đường dẫn (URL / Route):
                  </label>
                  <input
                    type="text"
                    value={primaryCtaLink}
                    onChange={(e) => setPrimaryCtaLink(e.target.value)}
                    placeholder="VD: /products"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Nút phụ */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Nút phụ 2 (Viền mờ tinh tế):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Nhãn nút:
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaText}
                    onChange={(e) => setSecondaryCtaText(e.target.value)}
                    placeholder="VD: Báo Giá Thu Mua Máy Cũ"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Đường dẫn (URL / Route):
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaLink}
                    onChange={(e) => setSecondaryCtaLink(e.target.value)}
                    placeholder="VD: /thanh-ly"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 3: 3 CHỈ SỐ STATS */}
        {(activeTab === 'all' || activeTab === 'stats') && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
                3
              </span>
              <h2 className="text-base font-bold text-slate-900">Ba Thông Số Cam Kết Xưởng (Stats)</h2>
            </div>

            <div className="space-y-3">
              {stats.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 flex flex-col sm:flex-row items-center gap-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-slate-950 font-black text-[11px] flex-shrink-0">
                    {idx + 1}
                  </span>

                  <div className="w-full sm:w-1/3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Giá trị / Điểm nhấn:
                    </label>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleUpdateStat(idx, 'value', e.target.value)}
                      placeholder="VD: -50% hoặc 06 Tháng"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="w-full sm:w-2/3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Chú thích chi tiết:
                    </label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleUpdateStat(idx, 'label', e.target.value)}
                      placeholder="VD: Chi phí so với mua mới"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCK 4: CARD ẢNH TIÊU BIỂU */}
        {(activeTab === 'all' || activeTab === 'card') && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
                4
              </span>
              <h2 className="text-base font-bold text-slate-900">Card Ảnh & Nhãn Sản Phẩm Tiêu Biểu</h2>
            </div>

            {/* Upload hoặc nhập URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Ảnh đại diện máy (URL hoặc Tải lên):
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="/uploads/... hoặc dán URL ảnh máy thực tế..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadImage}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  ) : (
                    <UploadCloud className="h-4 w-4 text-amber-600" />
                  )}
                  <span>{isUploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                </button>
              </div>
            </div>

            {/* Các nhãn text trên Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tag kiểm định (Góc trên trái):
                </label>
                <input
                  type="text"
                  value={featuredBadgeTag}
                  onChange={(e) => setFeaturedBadgeTag(e.target.value)}
                  placeholder="VD: Đã kiểm định kỹ thuật • Độ mới 90-95%"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tag danh mục (Góc dưới):
                </label>
                <input
                  type="text"
                  value={featuredCategoryTag}
                  onChange={(e) => setFeaturedCategoryTag(e.target.value)}
                  placeholder="VD: TIÊU BIỂU XUẤT XƯỞNG"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên sản phẩm nổi bật:
                </label>
                <input
                  type="text"
                  value={featuredTitle}
                  onChange={(e) => setFeaturedTitle(e.target.value)}
                  placeholder="VD: Lò Nướng Đối Lưu & Tủ Bánh Kem Ruyshing"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Trạng thái bàn giao:
                </label>
                <input
                  type="text"
                  value={featuredStatusTag}
                  onChange={(e) => setFeaturedStatusTag(e.target.value)}
                  placeholder="VD: Sẵn sàng chạy thử"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 5: KHUNG CHỦ DOANH NGHIỆP / KỸ SƯ SÁNG LẬP */}
        {(activeTab === 'all' || activeTab === 'founder') && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 text-xs font-black">
                  5
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Founder Trust Card (Kỹ Sư / Người Sáng Lập)</h2>
                  <p className="text-[11px] text-slate-500">Khung Card nổi cao cấp độc lập đặt dưới Card máy làm bánh ở Hero Section</p>
                </div>
              </div>

              {/* CÔNG TẮC BẬT/TẮT */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={founderShow}
                  onChange={(e) => setFounderShow(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {founderShow ? 'Đang bật' : 'Đang ẩn'}
                </span>
              </label>
            </div>

            {/* UPLOAD ẢNH CHÂN DUNG */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Ảnh chân dung kỹ sư / chủ xưởng (Tự động nén sang WebP 1:1 sắc nét):
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-amber-500/90 shadow-lg shadow-amber-500/25 ring-4 ring-amber-500/10 bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {founderAvatarUrl && !founderAvatarUrl.includes('unsplash.com') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={normalizeImagePath(founderAvatarUrl, '/placeholder-machine.svg')}
                      alt="Preview chân dung"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl">
                      {(founderName || 'C').charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold border-2 border-slate-900 shadow-xs">
                    ✓
                  </span>
                </div>

                <div className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={founderAvatarUrl}
                    onChange={(e) => setFounderAvatarUrl(e.target.value)}
                    placeholder="URL ảnh hoặc tải ảnh từ máy tính..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />

                  <input
                    type="file"
                    ref={founderFileInputRef}
                    onChange={handleUploadFounderAvatar}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => founderFileInputRef.current?.click()}
                    disabled={isUploadingFounder}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isUploadingFounder ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-amber-600" />
                    )}
                    <span>{isUploadingFounder ? 'Đang nén WebP...' : 'Tải chân dung'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CÁC TRƯỜNG THÔNG TIN FOUNDER TRUST CARD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Họ tên người sáng lập / Kỹ sư xưởng:
                </label>
                <input
                  type="text"
                  value={founderName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFounderName(newName);
                    if (founderCommitment) {
                      setFounderLine(`${newName} – ${founderCommitment}`);
                    }
                  }}
                  placeholder="VD: Vương Công Nguyên"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chức danh / Tag định danh:
                </label>
                <input
                  type="text"
                  value={founderTitle}
                  onChange={(e) => setFounderTitle(e.target.value)}
                  placeholder="VD: Chủ Xưởng Kỹ Thuật"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Câu cam kết chuyên môn (Hiển thị đầy đủ, không cắt ba chấm):
              </label>
              <input
                type="text"
                value={founderCommitment}
                onChange={(e) => {
                  const newCommitment = e.target.value;
                  setFounderCommitment(newCommitment);
                  if (founderName) {
                    setFounderLine(`${founderName} – ${newCommitment}`);
                  }
                }}
                placeholder="VD: Trực tiếp kiểm định từng máy & bàn giao tận xưởng"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* DÒNG HIỂN THỊ DỰ PHÒNG TỔNG HỢP */}
            <div className="pt-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dòng hiển thị tổng hợp (Tùy chọn ghi đè):
              </label>
              <input
                type="text"
                value={founderLine}
                onChange={(e) => setFounderLine(e.target.value)}
                placeholder="VD: Vương Công Nguyên – Trực tiếp kiểm định từng máy & bàn giao tận xưởng"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


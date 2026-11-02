'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  LayoutTemplate,
  Phone,
  ArrowRight,
  Plus,
  Trash2,
  Building,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';

interface FeaturedLinkItem {
  label: string;
  url: string;
}

const DEFAULT_LINKS: FeaturedLinkItem[] = [
  { label: 'Tủ trưng bày bánh kem & Bảo quản', url: '/products?categorySlug=tu-trung-bay-banh' },
  { label: 'Lò nướng bánh công nghiệp', url: '/products?categorySlug=lo-nuong-cong-nghiep' },
  { label: 'Máy trộn bột & Cối đánh trứng', url: '/products?categorySlug=may-tron-bot-danh-trung' },
  { label: 'Dịch vụ Thu mua máy làm bánh cũ', url: '/thu-mua-may-cu' },
  { label: 'Tra cứu tiến độ kỹ thuật & Đơn hàng', url: '/tra-cuu-tien-do' },
];

export default function AdminSiteContentSettingsPage() {
  const { token } = useAuth();

  // Khối 1: Banner Tư Vấn
  const [bannerTitle, setBannerTitle] = useState('Tư Vấn & Khảo Sát Dây Chuyền Bánh Tận Nơi');
  const [bannerSubtitle, setBannerSubtitle] = useState(
    'Đội ngũ kỹ thuật hỗ trợ tính toán công suất lò nướng, máy trộn và kiểm tra hạ tầng điện 3 pha cho xưởng của bạn.'
  );
  const [bannerButtonText, setBannerButtonText] = useState('Gửi yêu cầu tư vấn kỹ thuật (RFQ)');
  const [bannerButtonLink, setBannerButtonLink] = useState('/rfq');
  const [bannerHotline, setBannerHotline] = useState('0976 619 044');

  // Khối 2: Footer Giới thiệu & Bản quyền
  const [footerCompanyName, setFooterCompanyName] = useState('CÔNG NGUYÊN');
  const [footerSlogan, setFooterSlogan] = useState('THIẾT BỊ BÁNH THANH LÝ & TÂN TRANG');
  const [footerDescription, setFooterDescription] = useState(
    'Công Nguyên chuyên thu mua, tân trang và thanh lý thiết bị làm bánh công nghiệp chất lượng cao tại TP.HCM. Cam kết máy móc nguyên bản, kỹ thuật kiểm định chuẩn xưởng, bảo hành tận tâm và giá thành tối ưu cho chủ tiệm bánh.'
  );
  const [footerCopyright, setFooterCopyright] = useState(
    '© 2026 CÔNG NGUYÊN - congnguyen.com.vn. Thiết bị làm bánh thanh lý & tân trang hàng đầu TP.HCM.'
  );

  // Khối 3: Danh sách dòng máy chủ lực
  const [featuredLinks, setFeaturedLinks] = useState<FeaturedLinkItem[]>(DEFAULT_LINKS);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'banner' | 'footer' | 'links'>('all');

  useEffect(() => {
    // Tải cấu hình hiện tại từ backend
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/settings/content`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          if (cfg.bannerTitle) setBannerTitle(cfg.bannerTitle);
          if (cfg.bannerSubtitle) setBannerSubtitle(cfg.bannerSubtitle);
          if (cfg.bannerButtonText) setBannerButtonText(cfg.bannerButtonText);
          if (cfg.bannerButtonLink) setBannerButtonLink(cfg.bannerButtonLink);
          if (cfg.bannerHotline) setBannerHotline(cfg.bannerHotline);

          if (cfg.footerCompanyName) setFooterCompanyName(cfg.footerCompanyName);
          if (cfg.footerSlogan) setFooterSlogan(cfg.footerSlogan);
          if (cfg.footerDescription) setFooterDescription(cfg.footerDescription);
          if (cfg.footerCopyright) setFooterCopyright(cfg.footerCopyright);

          if (Array.isArray(cfg.featuredLinks) && cfg.featuredLinks.length > 0) {
            setFeaturedLinks(cfg.featuredLinks);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend chưa khởi động hoặc dùng cấu hình mặc định:', err);
      });
  }, []);

  const handleAddLink = () => {
    setFeaturedLinks([...featuredLinks, { label: '', url: '/products' }]);
  };

  const handleUpdateLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...featuredLinks];
    updated[index][field] = value;
    setFeaturedLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    setFeaturedLinks(featuredLinks.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetchWithAdminAuth('/admin/settings/content', {
        method: 'PUT',
        body: JSON.stringify({
          bannerTitle,
          bannerSubtitle,
          bannerButtonText,
          bannerButtonLink,
          bannerHotline,
          footerCompanyName,
          footerSlogan,
          footerDescription,
          footerCopyright,
          featuredLinks,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success !== false) {
        setToastMsg('Cập nhật cấu hình nội dung website thành công!');
      } else {
        const errMsg = json.error?.message || json.message || 'Lỗi khi lưu cấu hình nội dung website';
        setToastMsg(`Lỗi: ${errMsg}`);
      }
    } catch (err: any) {
      setToastMsg(`Lỗi kết nối: ${err.message || 'Không thể lưu cài đặt'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <LayoutTemplate className="h-4 w-4" />
            <span>Cài đặt hệ thống</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Nội Dung Website
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình nội dung khối Banner tư vấn kỹ thuật và thông tin doanh nghiệp tại Chân trang (Footer)
          </p>
        </div>

        {/* NÚT LƯU THAY ĐỔI */}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-70"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Đang lưu cấu hình...' : 'Lưu thay đổi nội dung'}</span>
        </button>
      </div>

      {/* TOAST THÔNG BÁO THÀNH CÔNG */}
      {toastMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold text-slate-500">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Tất cả khối
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('banner')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'banner'
              ? 'bg-amber-500 text-slate-950'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Khối 1: Banner Tư Vấn
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'footer'
              ? 'bg-amber-500 text-slate-950'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Khối 2: Chân trang (Footer)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('links')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'links'
              ? 'bg-amber-500 text-slate-950'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Khối 3: Máy chủ lực Footer
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* KHỐI 1: BANNER TƯ VẤN & KHẢO SÁT */}
        {(activeTab === 'all' || activeTab === 'banner') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Khối 1: Banner Kêu Gọi Tư Vấn & Khảo Sát Kỹ Thuật
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hiển thị trên trang chủ ngay dưới danh mục thiết bị chủ lực
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu đề Banner *
                </label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="VD: Tư Vấn & Khảo Sát Dây Chuyền Bánh Tận Nơi"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đoạn mô tả Banner *
                </label>
                <textarea
                  rows={2}
                  required
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Mô tả sự hỗ trợ từ đội ngũ kỹ sư tính toán công suất, điện 3 pha..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chữ trên nút bấm chính *
                </label>
                <input
                  type="text"
                  required
                  value={bannerButtonText}
                  onChange={(e) => setBannerButtonText(e.target.value)}
                  placeholder="Gửi yêu cầu tư vấn kỹ thuật (RFQ)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đường dẫn liên kết của nút *
                </label>
                <input
                  type="text"
                  required
                  value={bannerButtonLink}
                  onChange={(e) => setBannerButtonLink(e.target.value)}
                  placeholder="/rfq"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số Hotline hiển thị trên Banner *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={bannerHotline}
                    onChange={(e) => setBannerHotline(e.target.value)}
                    placeholder="0976 619 044"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KHỐI 2: GIỚI THIỆU & BẢN QUYỀN CHÂN TRANG */}
        {(activeTab === 'all' || activeTab === 'footer') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Building className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Khối 2: Thông Tin Giới Thiệu & Bản Quyền Chân Trang (Footer)
                </h2>
                <p className="text-xs text-slate-500">
                  Cập nhật tên thương hiệu, khẩu hiệu, đoạn giới thiệu và dòng quyền tác giả
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên công ty / Thương hiệu *
                </label>
                <input
                  type="text"
                  required
                  value={footerCompanyName}
                  onChange={(e) => setFooterCompanyName(e.target.value)}
                  placeholder="CÔNG NGUYÊN"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khẩu hiệu (Slogan) *
                </label>
                <input
                  type="text"
                  required
                  value={footerSlogan}
                  onChange={(e) => setFooterSlogan(e.target.value)}
                  placeholder="THIẾT BỊ LÀM BÁNH THANH LÝ & TÂN TRANG"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đoạn giới thiệu tóm tắt công ty *
                </label>
                <textarea
                  rows={3}
                  required
                  value={footerDescription}
                  onChange={(e) => setFooterDescription(e.target.value)}
                  placeholder="Đơn vị hàng đầu tư vấn thiết kế dây chuyền sản xuất bánh mì công nghiệp..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dòng Bản quyền (Copyright) *
                </label>
                <input
                  type="text"
                  required
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  placeholder="© 2026 Công Nguyên Machinery. Bảo lưu toàn bộ bản quyền..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* KHỐI 3: DANH SÁCH DÒNG MÁY CHỦ LỰC TÂN TRANG */}
        {(activeTab === 'all' || activeTab === 'links') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <LinkIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Khối 3: Danh Sách Dòng Máy Tân Trang Chủ Lực (Footer Links)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Các liên kết nhanh hiển thị ở cột giữa của Chân trang (Footer)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 text-xs font-bold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm mục</span>
              </button>
            </div>

            <div className="space-y-3">
              {featuredLinks.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-600">
                    {index + 1}
                  </span>

                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={item.label}
                      onChange={(e) => handleUpdateLink(index, 'label', e.target.value)}
                      placeholder="Tên dòng máy (VD: Lò nướng xoay Rotary...)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:w-64">
                    <input
                      type="text"
                      required
                      value={item.url}
                      onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                      placeholder="Đường dẫn (VD: /products?cat=lo-nuong)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLink(index)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors self-end sm:self-center"
                    title="Xóa dòng này"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {featuredLinks.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  Chưa có liên kết nào. Nhấn &quot;Thêm mục&quot; để tạo liên kết hiển thị trên Footer.
                </div>
              )}
            </div>
          </div>
        )}

        {/* NÚT LƯU THAY ĐỔI DƯỚI CÙNG */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Đang lưu cấu hình...' : 'Lưu tất cả thay đổi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

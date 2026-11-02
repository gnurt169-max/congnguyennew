'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Wrench,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/image-uploader';
import { triggerRevalidation } from '@/lib/revalidate';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [product, setProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [brandName, setBrandName] = useState('Sinmag');
  const [manufactureYear, setManufactureYear] = useState('2022');
  const [warrantyMonths, setWarrantyMonths] = useState(12);

  // Pricing
  const [basePrice, setBasePrice] = useState('0');
  const [originalPrice, setOriginalPrice] = useState('0');

  // Condition & Availability
  const [condition, setCondition] = useState('REFURBISHED_FULL');
  const [availability, setAvailability] = useState('AVAILABLE');

  // Refurbish details & Video
  const [refurbishDetails, setRefurbishDetails] = useState('');
  const [testVideoUrl, setTestVideoUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);


  // Load product and categories
  useEffect(() => {
    if (!id) return;

    const baseUrl = getApiBaseUrl();

    // 1. Tải danh mục
    fetch(`${baseUrl}/categories`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          setCategoriesList(data.data);
        }
      })
      .catch(() => {});

    // 2. Tải chi tiết sản phẩm
    fetch(`${baseUrl}/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Không tìm thấy sản phẩm ${id}`);
        return res.json();
      })
      .then((resData) => {
        const prod = resData.data || resData;
        setProduct(prod);
        setName(prod.name || '');
        setModelCode(prod.modelCode || '');
        setCategoryId(prod.categoryId || prod.category?.id || '');
        setBrandName(prod.brand?.name || prod.brandName || 'Sinmag');
        setManufactureYear(prod.manufactureYear || '2022');
        setWarrantyMonths(prod.warrantyMonths || 12);
        setBasePrice(String(prod.basePrice || 0));
        setOriginalPrice(String(prod.originalPrice || 0));
        setCondition(prod.condition || 'REFURBISHED_FULL');
        setAvailability(prod.availability || 'AVAILABLE');
        setRefurbishDetails(prod.refurbishDetails || '');
        setTestVideoUrl(prod.testVideoUrl || '');

        const imgs: string[] = [];
        const mainThumb = prod.imageUrl || prod.thumbnail || null;
        if (Array.isArray(prod.images) && prod.images.length > 0) {
          prod.images.forEach((im: any) => {
            if (typeof im === 'string') imgs.push(im);
            else if (im?.url) imgs.push(im.url);
          });
        }
        if (mainThumb && !imgs.includes(mainThumb)) {
          imgs.unshift(mainThumb);
        }
        setImages(imgs);
        setThumbnail(mainThumb || imgs[0] || null);
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Lỗi khi tải thông tin sản phẩm');
      })
      .finally(() => {
        setLoadingProduct(false);
      });
  }, [id]);



  const orig = Number(originalPrice) || 0;
  const curr = Number(basePrice) || 0;
  const savings = orig > curr ? orig - curr : 0;
  const savingsPercent = orig > 0 && orig > curr ? Math.round((savings / orig) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên thiết bị');
      setSaving(false);
      return;
    }

    const resolvedThumb = thumbnail !== undefined ? thumbnail : (images.length > 0 ? images[0] : null);
    const finalThumbnail = resolvedThumb && resolvedThumb.trim() ? resolvedThumb.trim() : null;

    const payload = {
      name: name.trim(),
      modelCode: modelCode.trim() || undefined,
      categoryId: categoryId || undefined,
      brandName: brandName.trim() || undefined,
      manufactureYear: manufactureYear ? String(manufactureYear) : undefined,
      warrantyMonths: Number(warrantyMonths) || 12,
      basePrice: curr,
      originalPrice: orig,
      condition,
      refurbishDetails: refurbishDetails.trim(),
      testVideoUrl: testVideoUrl.trim() ? testVideoUrl.trim() : null,
      videoUrl: testVideoUrl.trim() ? testVideoUrl.trim() : null,
      thumbnail: finalThumbnail,
      thumbnailUrl: finalThumbnail,
      primaryImage: finalThumbnail,
      avatar: finalThumbnail,
      imageUrl: finalThumbnail,
      images: images,
    };

    try {
      const baseUrl = getApiBaseUrl();

      let res = await fetchWithAdminAuth(`${baseUrl}/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetchWithAdminAuth(`${baseUrl}/admin/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        res = await fetchWithAdminAuth(`${baseUrl}/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        triggerRevalidation({ tag: 'products', path: '/products' });
        triggerRevalidation({ tag: 'products-list', path: '/' });
        if (product?.slug) {
          triggerRevalidation({ path: `/products/${product.slug}` });
          triggerRevalidation({ path: `/san-pham/${product.slug}` });
        }
        setSuccessMessage('Cập nhật sản phẩm thành công! Đang chuyển về danh sách...');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg =
          (Array.isArray(errJson?.message) ? errJson?.message.join(', ') : errJson?.message) ||
          errJson?.error ||
          `Máy chủ trả về mã ${res.status}`;
        setErrorMessage(`Lỗi lưu sản phẩm: ${errMsg}`);
      }
    } catch (err: any) {
      setErrorMessage(`Lỗi kết nối máy chủ: ${err?.message || 'Không thể gửi dữ liệu'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        <p className="mt-3 text-xs text-slate-500">Đang tải dữ liệu thiết bị...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Chỉnh Sửa Thiết Bị Làm Bánh
              <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-mono font-bold">
                {product?.modelCode || id}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật định giá, tình trạng tân trang và album ảnh máy thực tế
            </p>
          </div>
        </div>

        {product?.slug && (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition"
          >
            <span>Xem trang bán hàng</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Thông báo lỗi / thành công */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="font-semibold whitespace-pre-line">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <div className="font-bold">{successMessage}</div>
        </div>
      )}

      {/* Form chỉnh sửa */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">1</span>
            Thông tin định danh thiết bị
          </h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Tên thiết bị *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Mã Model máy</label>
              <input
                type="text"
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Danh mục thiết bị</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Hãng sản xuất</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Năm sản xuất</label>
              <input
                type="text"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Thời gian bảo hành (tháng)</label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* PHẦN 2: ĐỊNH GIÁ & TÌNH TRẠNG KHO */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">2</span>
            Định giá & Tình trạng thiết bị
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Giá máy mới thị trường (đ)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900">Giá hàng tân trang (đ) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-amber-400 bg-amber-50/50 px-3.5 py-2.5 text-xs font-black text-amber-950 focus:border-amber-500 focus:outline-hidden"
              />
              {savingsPercent > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                  Tiết kiệm {savingsPercent}% ({(savings / 1000000).toFixed(1)} tr)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Trạng thái kho máy</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
              >
                <option value="AVAILABLE">SẴN TẠI KHO</option>
                <option value="COMMITTED_PENDING_PAYMENT">GIỮ CHỖ 15 PHÚT</option>
                <option value="DEPOSITED">ĐÃ ĐẶT CỌC</option>
                <option value="SOLD_OUT">ĐÃ BÁN HẾT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Tình trạng tân trang</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
              >
                <option value="REFURBISHED_FULL">TÂN TRANG 95-98% (FULL)</option>
                <option value="REFURBISHED_PARTIAL">TÂN TRANG MỘT PHẦN</option>
                <option value="ORIGINAL_USED">NGUYÊN BẢN CŨ ZIN</option>
              </select>
            </div>
          </div>
        </div>

        {/* PHẦN 3: HÌNH ẢNH MÁY THỰC TẾ & TẢI ẢNH MỚI */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">3</span>
            Album hình ảnh máy thực tế tại kho (Hỗ trợ tải lên tối đa 10MB/ảnh)
          </h2>

          <div className="mt-4">
            <ImageUploader
              images={images}
              onChange={setImages}
              thumbnail={thumbnail}
              onThumbnailChange={setThumbnail}
              maxFileSizeMB={10}
            />
          </div>
        </div>

        {/* PHẦN 4: HẠNG MỤC TÂN TRANG & VIDEO CHẠY THỬ */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">4</span>
            Hạng mục tân trang & Video test máy chạy thực tế
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Chi tiết linh kiện đã đại tu / thay mới</label>
              <textarea
                rows={2}
                value={refurbishDetails}
                onChange={(e) => setRefurbishDetails(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Link Video test máy chạy thực tế (YouTube / MP4)</label>
                {testVideoUrl.trim() ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Đã có video
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    (Tự động ẩn khối video nếu để trống)
                  </span>
                )}
              </div>
              <input
                type="url"
                value={testVideoUrl}
                onChange={(e) => setTestVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Dán link YouTube (Watch, Shorts, Embed) hoặc file MP4 trực tiếp để khách hàng xem video vận hành máy thực tế.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            href="/admin/products"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Hủy bỏ
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu thay đổi...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Lưu Thay Đổi Sản Phẩm</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

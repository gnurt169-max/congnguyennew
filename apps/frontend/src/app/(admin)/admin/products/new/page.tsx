'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Video,
  ClipboardCheck,
  Tag,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/image-uploader';
import { triggerRevalidation } from '@/lib/revalidate';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';

const STANDARD_BAKERY_CATEGORIES = [
  {
    id: 'tu-trung-bay-banh',
    name: 'Tủ trưng bày bánh kem & Bảo quản',
    slug: 'tu-trung-bay-banh',
    icon: '🧊',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  },
  {
    id: 'lo-nuong-cong-nghiep',
    name: 'Lò nướng bánh công nghiệp',
    slug: 'lo-nuong-cong-nghiep',
    icon: '🔥',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'may-tron-bot-danh-trung',
    name: 'Máy trộn bột & Đánh trứng',
    slug: 'may-tron-bot-danh-trung',
    icon: '🥣',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'thiet-bi-phu-tro',
    name: 'Thiết bị tạo hình & Phụ trợ',
    slug: 'thiet-bi-phu-tro',
    icon: '⚙️',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Thông tin cơ bản (Khởi tạo form hoàn toàn trống)
  const [name, setName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [categoriesList, setCategoriesList] = useState(STANDARD_BAKERY_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState<string>('');

  React.useEffect(() => {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/categories`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setCategoriesList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Định giá & Cọc (Khởi tạo form hoàn toàn trống)
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [minDepositAmount, setMinDepositAmount] = useState<string>('');

  // 3. Hình ảnh thực tế (Khởi tạo form hoàn toàn trống: avatar = null, images = [])
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== index));
  };



  // Tính % tiết kiệm
  const orig = Number(originalPrice) || 0;
  const curr = Number(basePrice) || 0;
  const savings = orig > curr ? orig - curr : 0;
  const savingsPercent = orig > 0 && orig > curr ? Math.round((savings / orig) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Tạo slug từ tên máy
    const generatedSlug =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') +
      '-' +
      Math.floor(100 + Math.random() * 900);

    const warrantyNum = warrantyMonths ? Number(warrantyMonths) : 12;
    const descParts: string[] = ['<h3>Thiết bị làm bánh thanh lý tân trang chính hãng</h3>'];
    if (serialNumber) descParts.push(`<p><strong>Mã số Serial:</strong> ${serialNumber}</p>`);
    if (manufactureYear) descParts.push(`<p><strong>Năm sản xuất:</strong> ${manufactureYear}</p>`);
    if (warrantyMonths) descParts.push(`<p><strong>Bảo hành:</strong> ${warrantyNum} tháng tận xưởng bởi đội ngũ kỹ sư Công Nguyên.</p>`);

    const summaryText = savingsPercent > 0
      ? `Máy thanh lý tân trang đã kiểm định QC. Tiết kiệm ${savingsPercent}% so với máy mới.${warrantyMonths ? ` Bảo hành ${warrantyNum} tháng tại xưởng.` : ''}`
      : `Thiết bị làm bánh thanh lý chính hãng.${warrantyMonths ? ` Bảo hành ${warrantyNum} tháng tại xưởng.` : ''}`;

    const payload = {
      name,
      slug: generatedSlug,
      modelCode: modelCode || undefined,
      categoryId: selectedCategoryId || undefined,
      brandName: brandName || undefined,
      isQuoteOnly: true,
      basePrice: curr,
      originalPrice: orig || undefined,
      condition: 'REFURBISHED_FULL',
      availability: 'AVAILABLE',
      summary: summaryText,
      description: descParts.join('\n'),
      thumbnail: thumbnail || (imageUrls.length > 0 ? imageUrls[0] : null),
      imageUrl: thumbnail || (imageUrls.length > 0 ? imageUrls[0] : null),
      images: imageUrls,
      warrantyMonths: warrantyNum,
    };

    try {
      const baseUrl = getApiBaseUrl();

      let res = await fetchWithAdminAuth(`${baseUrl}/admin/products`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetchWithAdminAuth(`${baseUrl}/products`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        triggerRevalidation({ tag: 'products-list', path: '/products' });
        triggerRevalidation({ path: '/' });
        setSuccessMsg('Đăng bán máy thanh lý tân trang thành công! Đang chuyển hướng...');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg =
          (Array.isArray(errJson?.message) ? errJson?.message.join(', ') : errJson?.message) ||
          errJson?.error ||
          `Máy chủ trả về mã lỗi ${res.status}`;
        setErrorMsg(`Không thể thêm sản phẩm: ${errMsg}`);
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối máy chủ: ${err?.message || 'Không thể gửi dữ liệu'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Kho máy</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">
          FORM-REFURBISHED-V2
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-amber-600" />
          Đăng Bán Máy Làm Bánh Thanh Lý & Tân Trang
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Nhập đầy đủ thông tin kỹ thuật, video kiểm định và chi tiết linh kiện đã đại tu để khách hàng yên tâm cọc máy.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
        {/* ======================================================== */}
        {/* PHẦN 1: THÔNG TIN CƠ BẢN CỦA MÁY */}
        {/* ======================================================== */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">1</span>
            Thông tin cơ bản & Xuất xứ
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">Tên thiết bị thanh lý *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên thiết bị"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Mã Model máy *</label>
              <input
                type="text"
                required
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Mã Serial Number máy</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Danh mục thiết bị làm bánh *
                </label>
                <span className="text-[11px] text-amber-700 font-semibold">
                  Chuẩn 7 nhóm máy Công Nguyên
                </span>
              </div>

              {/* Dropdown Select chính */}
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="">-- Chọn danh mục thiết bị --</option>
                {categoriesList.map((cat: any) => (
                  <option key={cat.id || cat.slug} value={cat.id || cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Tag Picker nhanh (Quick Selector Chips) */}
              <div className="mt-2.5">
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">
                  Hoặc chọn nhanh theo thẻ (Tag Picker):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categoriesList.map((cat: any) => {
                    const isSelected =
                      selectedCategoryId === cat.id || selectedCategoryId === cat.slug;
                    return (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id || cat.slug)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-amber-500/40'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                        }`}
                      >
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.name}</span>
                        {isSelected && <CheckCircle2 className="h-3 w-3 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Hãng sản xuất</label>
              <select
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              >
                <option value="">-- Chọn hãng sản xuất --</option>
                <option value="Sinmag">Sinmag (Đài Loan)</option>
                <option value="Kolb">Kolb (Thụy Sỹ / Đức)</option>
                <option value="Chanmag">Chanmag (Đài Loan)</option>
                <option value="Bongard">Bongard (Pháp)</option>
                <option value="Khác">Hãng khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Năm sản xuất</label>
              <input
                type="number"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Thời gian bảo hành (tháng)</label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PHẦN 2: ĐỊNH GIÁ & TIẾT KIỆM (MỎ NEO GIÁ) */}
        {/* ======================================================== */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">2</span>
            Định giá bán thanh lý & Cọc giữ máy
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Giá máy mới 100% ngoài thị trường *</label>
              <input
                type="number"
                required
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900">Giá bán thanh lý tân trang *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border-2 border-amber-400 bg-amber-50/50 px-3.5 py-2.5 text-xs font-black text-amber-950 focus:border-amber-500 focus:outline-hidden"
              />
              {originalPrice.trim() !== '' && basePrice.trim() !== '' && savingsPercent > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                  Tiết kiệm {savingsPercent}% cho khách mua
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Tiền cọc tối thiểu để giữ máy</label>
              <input
                type="number"
                value={minDepositAmount}
                onChange={(e) => setMinDepositAmount(e.target.value)}
                placeholder=""
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PHẦN 3: HÌNH ẢNH MÁY THỰC TẾ & TẢI ẢNH MỚI */}
        {/* ======================================================== */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">3</span>
            Hình ảnh máy thực tế tại kho (Hỗ trợ upload tối đa 10MB/ảnh)
          </h2>

          <div className="mt-4">
            <ImageUploader
              images={imageUrls}
              onChange={setImageUrls}
              thumbnail={thumbnail}
              onThumbnailChange={setThumbnail}
              maxFileSizeMB={10}
            />
          </div>
        </div>

        {/* NÚT SUBMIT */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Link
            href="/admin/products"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Hủy bỏ
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500 px-7 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 transition"
          >
            {loading ? 'Đang lưu vào kho...' : 'Lưu & Đăng bán máy ngay'}
          </button>
        </div>
      </form>
    </div>
  );
}

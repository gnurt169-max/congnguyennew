'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Video,
  ClipboardCheck,
  Save,
  Tag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ImageUploader } from './image-uploader';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { triggerRevalidation } from '@/lib/revalidate';
import { getApiBaseUrl } from '@/lib/utils';

export interface ProductEditModalProps {
  product: any;
  categoriesList: Array<{ id: string; name: string; slug: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: any) => void;
}


export function ProductEditModal({
  product,
  categoriesList,
  isOpen,
  onClose,
  onSuccess,
}: ProductEditModalProps) {
  // 1. TOÀN BỘ REACT HOOKS ĐƯỢC KHAI BÁO VÔ ĐIỀU KIỆN Ở ĐẦU COMPONENT
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(product?.name || '');
  const [modelCode, setModelCode] = useState(product?.modelCode || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || product?.category?.id || categoriesList[0]?.id || '');
  const [brandName, setBrandName] = useState(product?.brand?.name || product?.brandName || 'Sinmag');
  const [manufactureYear, setManufactureYear] = useState(product?.manufactureYear || '2022');
  const [warrantyMonths, setWarrantyMonths] = useState(product?.warrantyMonths || 12);

  // Pricing
  const [basePrice, setBasePrice] = useState<string>(
    product?.basePrice !== undefined && product?.basePrice !== null ? String(product.basePrice) : '0',
  );
  const [originalPrice, setOriginalPrice] = useState<string>(
    product?.originalPrice !== undefined && product?.originalPrice !== null ? String(product.originalPrice) : '0',
  );

  // Availability & Condition
  const [availability, setAvailability] = useState(product?.availability || 'AVAILABLE');
  const [condition, setCondition] = useState(product?.condition || 'REFURBISHED_FULL');

  // Real-time Inventory & Stock State
  const [stock, setStock] = useState<number>(
    product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : 1,
  );
  const [soldCount, setSoldCount] = useState<number>(
    product?.soldCount !== undefined && product?.soldCount !== null ? Number(product.soldCount) : 0,
  );
  const [status, setStatus] = useState<string>(
    product?.status || (Number(product?.stock) <= 0 ? 'out_of_stock' : 'available'),
  );

  // Refurbish details & Video
  const [refurbishDetails, setRefurbishDetails] = useState(
    product?.refurbishDetails ||
      'Đã thay mới toàn bộ vòng bi bạc đạn SKF Thụy Điển, thay mới cặp dây curoa Bando Japan, căn chỉnh đồng trục motor, vệ sinh đánh bóng cối Inox SUS304.',
  );
  const [testVideoUrl, setTestVideoUrl] = useState(product?.testVideoUrl || '');
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(product?.thumbnail || null);

  // Đồng bộ lại state khi `product` thay đổi
  useEffect(() => {
    if (!product) return;

    setName(product.name || '');
    setModelCode(product.modelCode || '');
    setCategoryId(product.categoryId || product.category?.id || categoriesList[0]?.id || '');
    setBrandName(product.brand?.name || product.brandName || 'Sinmag');
    setManufactureYear(product.manufactureYear || '2022');
    setWarrantyMonths(product.warrantyMonths || 12);
    setBasePrice(product.basePrice !== undefined && product.basePrice !== null ? String(product.basePrice) : '0');
    setOriginalPrice(product.originalPrice !== undefined && product.originalPrice !== null ? String(product.originalPrice) : '0');
    setAvailability(product.availability || 'AVAILABLE');
    setCondition(product.condition || 'REFURBISHED_FULL');
    setStock(product.stock !== undefined && product.stock !== null ? Number(product.stock) : 1);
    setSoldCount(product.soldCount !== undefined && product.soldCount !== null ? Number(product.soldCount) : 0);
    setStatus(product.status || (Number(product.stock) <= 0 ? 'out_of_stock' : 'available'));
    setRefurbishDetails(
      product.refurbishDetails ||
        'Đã thay mới toàn bộ vòng bi bạc đạn SKF Thụy Điển, thay mới cặp dây curoa Bando Japan, căn chỉnh đồng trục motor, vệ sinh đánh bóng cối Inox SUS304.',
    );
    setTestVideoUrl(product.testVideoUrl || '');

    const imgs: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img: any) => {
        if (typeof img === 'string') imgs.push(img);
        else if (img?.url) imgs.push(img.url);
      });
    } else if (product.thumbnail) {
      imgs.push(product.thumbnail);
    }
    setImages(imgs);
    setThumbnail(product.thumbnail || imgs[0] || null);

    setErrorMessage(null);
    setSuccessMessage(null);
  }, [product, categoriesList]);

  // Xử lý khi admin thay đổi stock: Nếu <= 0 tự động chuyển thành out_of_stock
  const handleStockChange = (newStock: number) => {
    const val = Math.max(0, newStock);
    setStock(val);
    if (val <= 0) {
      setStatus('out_of_stock');
      setAvailability('SOLD');
    } else if (status === 'out_of_stock') {
      setStatus('available');
      setAvailability('AVAILABLE');
    }
  };



  // Tính mức tiết kiệm
  const orig = Number(originalPrice) || 0;
  const curr = Number(basePrice) || 0;
  const savings = orig > curr ? orig - curr : 0;
  const savingsPercent = orig > 0 && orig > curr ? Math.round((savings / orig) * 100) : 0;

  // 2. CHỈ RẼ NHÁNH RETURN SAU KHI TOÀN BỘ HOOKS ĐÃ ĐƯỢC THI HÀNH
  if (!isOpen || !product) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation cơ bản
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên thiết bị / sản phẩm');
      setSaving(false);
      return;
    }

    if (curr <= 0) {
      setErrorMessage('Giá bán thanh lý phải lớn hơn 0 đ');
      setSaving(false);
      return;
    }

    const finalStock = Number(stock) >= 0 ? Number(stock) : 0;
    const finalSoldCount = Number(soldCount) >= 0 ? Number(soldCount) : 0;
    const finalWarrantyMonths = Number(warrantyMonths) || 12;
    const finalYearOfManufacture = Number(manufactureYear) || 2022;
    const finalStatus = finalStock <= 0 ? 'out_of_stock' : status;
    const finalAvail = finalStock <= 0 ? 'SOLD' : availability;

    // Xác định ảnh đại diện chính xác (nếu đã bị xóa null thì gửi null, không fallback về product.thumbnail)
    const resolvedThumb = thumbnail !== undefined ? thumbnail : (images.length > 0 ? images[0] : null);
    const finalThumbnail = resolvedThumb && resolvedThumb.trim() ? resolvedThumb.trim() : null;

    const payload = {
      name: name.trim(),
      modelCode: modelCode.trim() || undefined,
      categoryId: categoryId || undefined,
      categorySlug: categoryId || undefined,
      brandName: brandName.trim() || undefined,
      manufactureYear: manufactureYear ? String(manufactureYear) : undefined,
      yearOfManufacture: finalYearOfManufacture,
      warrantyMonths: finalWarrantyMonths,
      basePrice: curr,
      price: curr,
      originalPrice: orig,
      stock: finalStock,
      soldCount: finalSoldCount,
      status: finalStatus,
      availability: finalAvail,
      condition,
      refurbishDetails: refurbishDetails.trim(),
      testVideoUrl: testVideoUrl.trim() ? testVideoUrl.trim() : null,
      videoUrl: testVideoUrl.trim() ? testVideoUrl.trim() : null,
      thumbnail: finalThumbnail,
      imageUrl: finalThumbnail,
      thumbnailUrl: finalThumbnail,
      primaryImage: finalThumbnail,
      avatar: finalThumbnail,
      images: images,
    };

    try {
      const baseUrl = getApiBaseUrl();

      // Gọi endpoint chuẩn PUT /api/v1/admin/products/:id
      let res = await fetchWithAdminAuth(`${baseUrl}/admin/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Nếu PUT trả về lỗi, thử PATCH
      if (!res.ok) {
        res = await fetchWithAdminAuth(`${baseUrl}/admin/products/${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }

      // Fallback thêm route /api/v1/products/:id nếu cần
      if (!res.ok) {
        res = await fetchWithAdminAuth(`${baseUrl}/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        triggerRevalidation({ tag: 'products', path: '/products' });
        triggerRevalidation({ tag: 'products-list', path: '/' });
        if (product.slug) {
          triggerRevalidation({ path: `/products/${product.slug}` });
          triggerRevalidation({ path: `/san-pham/${product.slug}` });
        }
        const resData = await res.json().catch(() => ({}));
        const updated = resData.data || { ...product, ...payload };
        setSuccessMessage('Cập nhật sản phẩm và hình ảnh thành công!');
        onSuccess(updated);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorData = await res.json().catch(() => null);
        let errorMsg = 'Có lỗi xảy ra khi cập nhật thiết bị';
        if (errorData) {
          if (Array.isArray(errorData.message)) {
            errorMsg = errorData.message.join(', ');
          } else if (typeof errorData.message === 'string') {
            errorMsg = errorData.message;
          } else if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMsg = errorData.error;
            } else if (typeof errorData.error === 'object') {
              if (Array.isArray(errorData.error.details) && errorData.error.details.length > 0) {
                errorMsg = errorData.error.details.join(', ');
              } else if (typeof errorData.error.message === 'string') {
                errorMsg = errorData.error.message;
              } else {
                errorMsg = JSON.stringify(errorData.error);
              }
            }
          }
        } else {
          errorMsg = `Máy chủ phản hồi mã lỗi HTTP ${res.status}`;
        }
        setErrorMessage(`Lưu thất bại: ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null) ||
        (err?.response?.data?.error && typeof err.response.data.error === 'object'
          ? (Array.isArray(err.response.data.error.details)
              ? err.response.data.error.details.join(', ')
              : err.response.data.error.message)
          : null) ||
        err?.message ||
        'Có lỗi xảy ra khi cập nhật thiết bị';
      const cleanMsg = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
      setErrorMessage(`Lưu thất bại: ${cleanMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Chỉnh Sửa Thiết Bị Làm Bánh
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-normal text-slate-600">
                  ID: {product.id}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật thông số kỹ thuật, hình ảnh thực tế và giá bán thanh lý
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              <span>Xem thực tế</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="font-medium whitespace-pre-line">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="font-bold">{successMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px]">1</span>
              Thông tin định danh máy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Tên thiết bị làm bánh *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Mã Model thiết bị</label>
                <input
                  type="text"
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  placeholder="VD: RS-150-5T"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Danh mục thiết bị *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                  placeholder="Sinmag, Ruyshing, Chanmag, Kolb..."
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
                <label className="block text-xs font-bold text-slate-700">Bảo hành kỹ thuật (tháng)</label>
                <input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* PHẦN 2: ĐỊNH GIÁ & QUẢN LÝ TỒN KHO */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px]">2</span>
              Định giá mỏ neo & Quản lý tồn kho thực tế
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Giá máy mới thị trường (đ)</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 focus:border-amber-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Mỏ neo tâm lý so sánh</span>
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

              {/* TỒN KHO REAL-TIME */}
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Số lượng máy tồn kho (Stock) *</span>
                  {stock <= 0 && (
                    <span className="text-[10px] font-bold text-red-600">HẾT HÀNG</span>
                  )}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => handleStockChange(Number(e.target.value))}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-black focus:outline-hidden ${
                      stock <= 0
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-950'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {stock <= 0 ? 'Tự động gắn nhãn "out_of_stock"' : `Sẵn sàng bán ${stock} máy`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Trạng thái bán (Status)</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    setStatus(newSt);
                    if (newSt === 'out_of_stock') {
                      setStock(0);
                      setAvailability('SOLD');
                    } else if (newSt === 'available' && stock <= 0) {
                      setStock(1);
                      setAvailability('AVAILABLE');
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="available">available (Còn hàng sẵn sàng bán)</option>
                  <option value="out_of_stock">out_of_stock (Hết hàng / Đã bán hết)</option>
                  <option value="reserved">reserved (Đã giữ chỗ / Chờ cọc)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Số lượng đã bán thành công</label>
                <input
                  type="number"
                  min="0"
                  value={soldCount}
                  onChange={(e) => setSoldCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
                />
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
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px]">3</span>
              Hình ảnh thực tế & Tải ảnh mới (Tối đa 10MB/ảnh)
            </h3>

            {/* Component ImageUploader chuyên dụng tuân thủ react-interaction-standard */}
            <ImageUploader
              images={images}
              onChange={(updatedImages) => setImages(updatedImages)}
              thumbnail={thumbnail}
              onThumbnailChange={(thumb) => setThumbnail(thumb)}
              maxFileSizeMB={10}
            />
          </div>

          {/* PHẦN 4: CHI TIẾT TÂN TRANG & VIDEO THỰC TẾ */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px]">4</span>
              Hạng mục kỹ thuật & Video chạy thử máy
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Chi tiết linh kiện đã tân trang/thay mới</label>
                <textarea
                  rows={2}
                  value={refurbishDetails}
                  onChange={(e) => setRefurbishDetails(e.target.value)}
                  placeholder="VD: Đã thay bạc đạn SKF Thụy Điển, thay dây curoa Bando Japan, căn chỉnh đồng trục motor..."
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

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

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
    </div>
  );
}

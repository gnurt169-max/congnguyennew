'use client';

import React, { useRef, useState } from 'react';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { normalizeImagePath, getApiBaseUrl } from '@/lib/utils';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Star,
  AlertCircle,
  Loader2,
  Plus,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  thumbnail?: string | null;
  onThumbnailChange?: (thumbnailUrl: string | null) => void;
  maxFileSizeMB?: number;
  maxFiles?: number;
}

export function ImageUploader({
  images,
  onChange,
  thumbnail,
  onThumbnailChange,
  maxFileSizeMB = 10,
  maxFiles = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Ảnh đại diện hiện thời (thumbnail hoặc phần tử đầu tiên của mảng images)
  const activeAvatar = thumbnail !== undefined && thumbnail !== null && thumbnail !== ''
    ? thumbnail
    : (images.length > 0 ? images[0] : null);

  // Helper hiển thị thông báo tự tắt sau 4s
  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setErrorMessage(null);
      setSuccessMessage(null);
    }, 4500);
  };

  // Upload từng file lên server
  const uploadSingleFile = async (file: File): Promise<string> => {
    // 1. Kiểm tra dung lượng (tối đa 10MB)
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`Ảnh "${file.name}" dung lượng ${(file.size / 1024 / 1024).toFixed(1)}MB vượt quá giới hạn ${maxFileSizeMB}MB.`);
    }

    // 2. Kiểm tra định dạng ảnh
    if (!file.type.startsWith('image/')) {
      throw new Error(`File "${file.name}" không phải là định dạng hình ảnh hợp lệ.`);
    }

    // 3. Thử upload trực tiếp qua Backend NestJS (chuẩn Sharp WebP)
    const backendUrl = getApiBaseUrl();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const bRes = await fetchWithAdminAuth(`${backendUrl}/admin/products/upload`, {
        method: 'POST',
        body: formData,
      });

      if (bRes.ok) {
        const bData = await bRes.json();
        const uploadedUrl = bData.data?.url || bData.url;
        if (uploadedUrl) return normalizeImagePath(uploadedUrl);
      }
    } catch {
      // Tiếp tục thử qua route /api/upload nếu backend trực tiếp lỗi
    }

    // 4. Thử qua route /api/upload cục bộ của Next.js (có proxy chuyển tiếp)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) return normalizeImagePath(data.url);
      }
    } catch {
      // Fallback nếu gọi Next.js API lỗi
    }

    // 5. Fallback cuối cùng: Chuyển Base64 gửi lên Backend
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const bRes = await fetchWithAdminAuth(`${backendUrl}/admin/products/upload`, {
            method: 'POST',
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: file.name,
            }),
          });

          if (bRes.ok) {
            const bData = await bRes.json();
            const uploadedUrl = bData.data?.url || bData.url;
            if (uploadedUrl) {
              resolve(normalizeImagePath(uploadedUrl));
              return;
            }
          }
          // Nếu backend trả về khác, tạm thời giữ base64 để preview và lưu
          resolve(base64Data);
        } catch {
          resolve(base64Data);
        }
      };
      reader.onerror = () => reject(new Error(`Không thể đọc file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };

  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    if (images.length + fileArray.length > maxFiles) {
      showToast(`Chỉ được tải lên tối đa ${maxFiles} ảnh cho mỗi sản phẩm`, true);
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        const url = await uploadSingleFile(file);
        uploadedUrls.push(url);
      } catch (err: any) {
        errors.push(err.message || 'Lỗi không xác định khi upload');
      }
    }

    setUploading(false);

    if (uploadedUrls.length > 0) {
      const updatedImages = [...images, ...uploadedUrls];
      onChange(updatedImages);
      // Nếu chưa có ảnh đại diện, tự động đặt ảnh mới tải lên làm ảnh đại diện
      if (!activeAvatar) {
        onThumbnailChange?.(uploadedUrls[0]);
      }
      showToast(`Đã tải lên thành công ${uploadedUrls.length} ảnh mới!`, false);
    }

    if (errors.length > 0) {
      showToast(errors.join('\n'), true);
    }

    // Reset input file value để có thể chọn lại cùng 1 file nếu muốn
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Xóa ảnh đại diện (handleRemoveAvatar)
  const handleRemoveAvatar = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // 1. Gán state ảnh đại diện về null
    onThumbnailChange?.(null);

    // 2. Nếu avatar nằm trong danh sách images, xóa nó khỏi images
    if (activeAvatar) {
      const updated = images.filter((img) => img !== activeAvatar);
      onChange(updated);
    }

    // 3. Reset tham chiếu của thẻ input file để tránh lưu cache file cũ
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    showToast('Đã xóa ảnh đại diện của thiết bị.');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const removedUrl = images[indexToRemove];
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);

    if (activeAvatar === removedUrl) {
      const nextThumb = updated.length > 0 ? updated[0] : null;
      onThumbnailChange?.(nextThumb);
    }

    // Reset input file value để tránh cache file cũ
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    showToast('Đã xóa hình ảnh khỏi danh sách.');
  };

  const handleSetPrimary = (targetUrl: string, index: number) => {
    // 1. Cập nhật state thumbnail
    onThumbnailChange?.(targetUrl);
    // 2. Đưa ảnh được chọn lên vị trí đầu tiên (index 0)
    const filtered = images.filter((_, idx) => idx !== index);
    const reordered = [targetUrl, ...filtered];
    onChange(reordered);
    showToast('★ Đã đặt làm ảnh đại diện chính của thiết bị!');
  };

  const handleAddCustomUrl = () => {
    if (!customUrl.trim()) return;
    if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://') && !customUrl.startsWith('/uploads/')) {
      showToast('Đường dẫn URL ảnh phải bắt đầu bằng http://, https:// hoặc /uploads/', true);
      return;
    }
    const newUrl = normalizeImagePath(customUrl.trim());
    onChange([...images, newUrl]);
    if (!activeAvatar) {
      onThumbnailChange?.(newUrl);
    }
    setCustomUrl('');
    setShowUrlInput(false);
    showToast('Đã thêm liên kết ảnh thành công!');
  };

  return (
    <div className="space-y-5">
      {/* Input file ẩn, ủy quyền kích hoạt qua ref */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Thông báo lỗi / thành công (Alert/Toast) */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="whitespace-pre-line font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <div className="font-semibold">{successMessage}</div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. KHUNG XEM TRƯỚC ẢNH ĐẠI DIỆN (AVATAR / THUMBNAIL PREVIEW) */}
      {/* ========================================================= */}
      {activeAvatar ? (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                ★
              </span>
              <span className="text-xs font-bold text-slate-800">
                Ảnh đại diện chính của thiết bị (Avatar / Thumbnail)
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              Hiển thị đầu tiên tại danh mục và đầu trang chi tiết
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Khung ảnh đại diện với nút xóa tròn đỏ ở góc trên bên phải */}
            <div className="relative group w-48 h-36 shrink-0 rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-900 shadow-md">
              <img
                src={normalizeImagePath(activeAvatar)}
                alt="Ảnh đại diện thiết bị"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Badge góc trên bên trái */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-emerald-600/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <Star className="h-3 w-3 fill-white text-white" />
                <span>Ảnh đại diện</span>
              </div>

              {/* Nút tròn màu đỏ ở góc trên bên phải với icon Trash2, tooltip "Xóa ảnh này" */}
              <button
                type="button"
                id="btn-remove-avatar"
                title="Xóa ảnh này"
                aria-label="Xóa ảnh này"
                onClick={handleRemoveAvatar}
                className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-2 ring-white/80 hover:bg-red-700 hover:scale-110 active:scale-95 transition-all cursor-pointer group/btn"
              >
                <Trash2 className="h-4 w-4" />
                {/* Tooltip nổi bật */}
                <span className="pointer-events-none absolute -bottom-8 right-0 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover/btn:block z-30">
                  Xóa ảnh này
                </span>
              </button>
            </div>

            {/* Thông tin & nút thao tác phụ */}
            <div className="flex-1 space-y-2 text-left w-full sm:w-auto">
              <p className="text-xs text-slate-600">
                Để thay đổi ảnh đại diện, bạn có thể bấm{' '}
                <strong className="text-slate-800">"Tải ảnh mới"</strong> hoặc bấm nút{' '}
                <span className="inline-flex items-center gap-0.5 font-bold text-red-600">
                  <Trash2 className="inline h-3 w-3" /> Xóa ảnh này
                </span>{' '}
                để xóa bỏ ảnh hiện tại và đưa về trạng thái trống.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-amber-500 hover:bg-amber-50/50 hover:text-amber-900 transition cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-amber-600" />
                  Đổi ảnh đại diện khác
                </button>

                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  Xóa ảnh này
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 2. KHUNG TẢI ẢNH TRỐNG (DROPZONE KÈM NÚT BẤM TẢI ẢNH MỚI) */
        /* ========================================================= */
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!uploading) fileInputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-amber-500 bg-amber-50/80 scale-[1.01]'
              : 'border-slate-300 bg-slate-50/70 hover:border-amber-500 hover:bg-amber-50/30'
          } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 group-hover:border-amber-400 group-hover:scale-105 transition">
            {uploading ? (
              <Loader2 className="h-7 w-7 text-amber-600 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7 text-amber-600" />
            )}
          </div>

          <div className="mt-3">
            <p className="text-sm font-bold text-slate-800">
              {uploading
                ? 'Đang nén và tải ảnh lên máy chủ...'
                : 'Kéo thả hoặc bấm để tải ảnh đại diện lên (Không bắt buộc)'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Định dạng JPG, PNG, WEBP tối đa {maxFileSizeMB}MB/ảnh. Có thể để trống nếu chưa có ảnh.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 active:scale-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tải ảnh đại diện lên
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput(!showUrlInput);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Nhập link URL
            </button>
          </div>
        </div>
      )}

      {/* Input nhập URL trực tiếp nếu không tải từ máy */}
      {showUrlInput && (
        <div className="flex gap-2 animate-in fade-in">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://congnguyen.com.vn/uploads/ten-anh.jpg"
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddCustomUrl}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Thêm link
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ALBUM ẢNH CHI TIẾT CỦA MÁY (GALLERY GRID) */}
      {/* ========================================================= */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-700">
            Album ảnh chi tiết thiết bị ({images.length} ảnh):
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              + Thêm ảnh vào album
            </button>
          </div>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((url, idx) => {
              const isPrimary = activeAvatar === url;

              return (
                <div
                  key={`${url}-${idx}`}
                  className={`group relative rounded-2xl overflow-hidden border bg-white shadow-xs transition-all ${
                    isPrimary
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="aspect-4/3 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={normalizeImagePath(url)}
                      alt={`Hình ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Huy hiệu ảnh chính: Badge xanh [ ★ Ảnh đại diện ] */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Star className="h-3 w-3 fill-white text-white" />
                      <span>★ Ảnh đại diện</span>
                    </div>
                  )}

                  {/* Nút tròn màu đỏ ở góc trên bên phải với tooltip "Xóa ảnh này" */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    <button
                      type="button"
                      title="Xóa ảnh này"
                      aria-label="Xóa ảnh này"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPrimary) {
                          handleRemoveAvatar(e);
                        } else {
                          handleRemoveImage(idx);
                        }
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 hover:scale-110 active:scale-95 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Nếu không phải ảnh đại diện: Hiển thị nút bấm [ Đặt làm ảnh đại diện ] */}
                  {!isPrimary && (
                    <div className="p-1.5 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(url, idx);
                        }}
                        className="inline-flex items-center justify-center gap-1 w-full rounded-lg border border-slate-200 bg-white py-1 px-2 text-[10px] font-bold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                      >
                        <Star className="h-3 w-3 text-slate-400 group-hover:text-emerald-600" />
                        <span>Đặt làm ảnh đại diện</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Album ảnh chi tiết hiện đang trống (0 ảnh).
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              + Thêm ảnh vào album
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatVND, normalizeImagePath, getApiBaseUrl } from '@/lib/utils';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  Tag,
  Edit2,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
  FolderPlus,
  ChevronDown,
  Trash2,
  Loader2,
} from 'lucide-react';
import { ProductEditModal } from '@/components/admin/product-edit-modal';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';

function slugifyVietnamese(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  modelCode?: string | null;
  basePrice?: number | string | null;
  originalPrice?: number | string | null;
  condition?: string | null;
  availability?: string | null;
  stock?: number | null;
  soldCount?: number | null;
  status?: string | null;
  refurbishDetails?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  brand?: {
    name: string;
  } | null;
  category?: {
    id?: string;
    name: string;
    slug?: string;
  } | null;
  createdAt: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  badgeClass: string;
}

const STANDARD_BAKERY_CATEGORIES: CategoryInfo[] = [
  {
    id: 'tu-trung-bay-banh',
    name: 'Tủ trưng bày bánh kem & Bảo quản',
    slug: 'tu-trung-bay-banh',
    icon: '🧊',
    badgeClass: 'bg-cyan-50 text-cyan-900 border-cyan-300 ring-cyan-400/30',
  },
  {
    id: 'lo-nuong-cong-nghiep',
    name: 'Lò nướng bánh công nghiệp',
    slug: 'lo-nuong-cong-nghiep',
    icon: '🔥',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-amber-400/30',
  },
  {
    id: 'may-tron-bot-danh-trung',
    name: 'Máy trộn bột & Đánh trứng',
    slug: 'may-tron-bot-danh-trung',
    icon: '🥣',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 ring-blue-400/30',
  },
  {
    id: 'thiet-bi-phu-tro',
    name: 'Thiết bị tạo hình & Phụ trợ',
    slug: 'thiet-bi-phu-tro',
    icon: '⚙️',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 ring-slate-400/30',
  },
];

const FALLBACK_PRODUCTS: AdminProduct[] = [
  {
    id: 'prod-ruyshing-1m5-5t',
    name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan',
    modelCode: 'RS-150-5T',
    basePrice: 45000000,
    originalPrice: 97000000,
    condition: 'REFURBISHED_FULL',
    availability: 'AVAILABLE',
    refurbishDetails: 'Sấy kính 4 mặt chống đọng sương, block Embraco/Secop mới, nạp gas R404A',
    thumbnail: null,
    brand: { name: 'Ruyshing' },
    category: { id: 'tu-trung-bay-banh', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-ruyshing-1m8-5t',
    name: 'Tủ bánh kem 1m8 5 tầng Ruyshing Đài Loan',
    slug: 'tu-banh-kem-1m8-5-tang-ruyshing-dai-loan',
    modelCode: 'RS-180-5T',
    basePrice: 55000000,
    originalPrice: 118000000,
    condition: 'REFURBISHED_FULL',
    availability: 'AVAILABLE',
    refurbishDetails: 'Tồn kho 3 máy (2 đen, 1 kem), làm lạnh quạt gió bảo quản mềm bánh',
    thumbnail: null,
    brand: { name: 'Ruyshing' },
    category: { id: 'tu-trung-bay-banh', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-ruyshing-2canh-lua',
    name: 'Tủ mát 2 cánh lùa Ruyshing Đài Loan',
    slug: 'tu-mat-2-canh-lua-ruyshing-dai-loan',
    modelCode: 'RS-2SL-COOL',
    basePrice: 38000000,
    originalPrice: 58000000,
    condition: 'REFURBISHED_FULL',
    availability: 'AVAILABLE',
    refurbishDetails: 'Cửa lùa trượt mượt mà, kính Low-E cách nhiệt giữ lạnh tối ưu',
    thumbnail: null,
    brand: { name: 'Ruyshing' },
    category: { id: 'tu-trung-bay-banh', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-ruyshing-2canh-mo',
    name: 'Tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
    slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan',
    modelCode: 'RS-2DR-STOR',
    basePrice: 24000000,
    originalPrice: 38000000,
    condition: 'REFURBISHED_FULL',
    availability: 'AVAILABLE',
    refurbishDetails: 'Vỏ inox 304 dày dặn trữ lạnh nguyên liệu cốt bánh và kem bơ sữa',
    thumbnail: null,
    brand: { name: 'Ruyshing' },
    category: { id: 'tu-trung-bay-banh', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-hobat-mixer',
    name: 'Cối đánh trứng / nhào bột Hobat Đài Loan',
    slug: 'coi-danh-trung-nhao-bot-hobat-dai-loan',
    modelCode: 'HB-30L-MIX',
    basePrice: 16000000,
    originalPrice: 24500000,
    condition: 'REFURBISHED_FULL',
    availability: 'AVAILABLE',
    refurbishDetails: 'Hộp số cơ khí tôi cứng, đủ 3 càng: lồng đánh trứng, móc nhào, cánh buồm',
    thumbnail: null,
    brand: { name: 'Hobat' },
    category: { id: 'may-tron-bot-danh-trung', name: 'Máy trộn bột & Đánh trứng', slug: 'may-tron-bot-danh-trung' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-hewwu-oven',
    name: 'Lò nướng điện Hewwu Trung Quốc',
    slug: 'lo-nuong-dien-hewwu-trung-quoc',
    modelCode: 'HW-1D2T',
    basePrice: 7000000,
    originalPrice: 10500000,
    condition: 'REFURBISHED_FULL',
    availability: 'AVAILABLE',
    refurbishDetails: 'Thanh nhiệt hồng ngoại mới, kiểm soát nhiệt trên dưới độc lập',
    thumbnail: null,
    brand: { name: 'Hewwu' },
    category: { id: 'lo-nuong-cong-nghiep', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-convection-4tray-new',
    name: 'Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)',
    slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100',
    modelCode: 'CV-4T-NEW',
    basePrice: 10000000,
    originalPrice: 18000000,
    condition: 'LIKE_NEW_99',
    availability: 'AVAILABLE',
    refurbishDetails: 'Hàng mới 100% xả thanh lý kho, đối lưu quạt đảo chiều không cần xoay khay',
    thumbnail: null,
    brand: { name: 'Nội địa Trung Quốc' },
    category: { id: 'lo-nuong-cong-nghiep', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-southstar-4tray-90',
    name: 'Lò nướng đối lưu Southstar 4 mâm (Độ mới 90%)',
    slug: 'lo-nuong-doi-luu-southstar-4-mam-moi-90',
    modelCode: 'SS-4M-90',
    basePrice: 25000000,
    originalPrice: 35000000,
    condition: 'EXCELLENT_90_95',
    availability: 'AVAILABLE',
    refurbishDetails: 'Độ mới 90%, cách nhiệt bông thủy tinh chịu nhiệt cao, phun sương tạo ẩm',
    thumbnail: null,
    brand: { name: 'Southstar' },
    category: { id: 'lo-nuong-cong-nghiep', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    createdAt: new Date().toISOString(),
  },
];

function getCategoryBadge(categoryName?: string | null) {
  if (!categoryName) {
    return {
      label: 'Chưa phân loại',
      icon: '⚙️',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const normalized = categoryName.toLowerCase();
  for (const std of STANDARD_BAKERY_CATEGORIES) {
    if (
      std.name.toLowerCase() === normalized ||
      std.slug === normalized ||
      ((normalized.includes('trưng bày') || normalized.includes('tủ') || normalized.includes('mát') || normalized.includes('bảo quản') || normalized.includes('bánh kem')) && std.slug === 'tu-trung-bay-banh') ||
      ((normalized.includes('lò') || normalized.includes('nướng') || normalized.includes('đối lưu')) && std.slug === 'lo-nuong-cong-nghiep') ||
      ((normalized.includes('trộn') || normalized.includes('đánh trứng') || normalized.includes('nhào') || normalized.includes('cối')) && std.slug === 'may-tron-bot-danh-trung') ||
      ((normalized.includes('tạo hình') || normalized.includes('phụ trợ') || normalized.includes('chia') || normalized.includes('cán') || normalized.includes('khay')) && std.slug === 'thiet-bi-phu-tro')
    ) {
      return {
        label: std.name,
        icon: std.icon || '🏷️',
        className: std.badgeClass,
      };
    }
  }

  return {
    label: categoryName,
    icon: '🏷️',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

function getConditionBadge(cond?: string | null) {
  switch (cond) {
    case 'LIKE_NEW_99':
      return {
        label: 'Like New 99%',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'EXCELLENT_90_95':
      return {
        label: 'Đẹp 90-95%',
        className: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    case 'REFURBISHED_FULL':
      return {
        label: 'Tân Trang Toàn Diện',
        className: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      };
    case 'FAIR_80':
      return {
        label: '80% (Giá rẻ)',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    default:
      return {
        label: 'Đã kiểm định',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

function getAvailabilityBadge(avail?: string | null, stock?: number | null, status?: string | null) {
  const isSoldOut = (stock !== undefined && stock !== null && Number(stock) <= 0) || status === 'out_of_stock' || avail === 'SOLD';
  if (isSoldOut) {
    return {
      label: 'Đã bán / Hết hàng',
      className: 'bg-red-100 text-red-800 border border-red-200 font-bold',
    };
  }
  switch (avail) {
    case 'RESERVED':
      return {
        label: 'Đã cọc giữ máy',
        className: 'bg-amber-100 text-amber-900 border border-amber-200 font-bold',
      };
    case 'AVAILABLE':
    default:
      return {
        label: 'Sẵn sàng bàn giao',
        className: 'bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold',
      };
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(FALLBACK_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<CategoryInfo[]>(STANDARD_BAKERY_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modal Chỉnh Sửa Toàn Bộ Sản Phẩm (Form + Upload ảnh)
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Modal Chỉnh Sửa Nhanh Danh Mục
  const [quickEditProduct, setQuickEditProduct] = useState<AdminProduct | null>(null);
  const [updatingCatId, setUpdatingCatId] = useState<string | null>(null);

  // Modal Thêm danh mục mới (Quick Create)
  const [isCreateCatModalOpen, setIsCreateCatModalOpen] = useState(false);
  const [targetProductForNewCat, setTargetProductForNewCat] = useState<AdminProduct | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [catModalError, setCatModalError] = useState<string | null>(null);

  // Modal Quản lý danh mục
  const [isManageCatsModalOpen, setIsManageCatsModalOpen] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const handleOpenCreateCategoryModal = (prod?: AdminProduct | null) => {
    setTargetProductForNewCat(prod || null);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setCatModalError(null);
    setIsCreateCatModalOpen(true);
  };

  const handleNewCatNameChange = (name: string) => {
    setNewCatName(name);
    setNewCatSlug(slugifyVietnamese(name));
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName) return;

    setCreatingCat(true);
    setCatModalError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          slug: newCatSlug.trim() || slugifyVietnamese(trimmedName),
          description: newCatDesc.trim() || undefined,
        }),
      });

      const raw = await res.json();
      if (!res.ok) {
        const errMsg = raw?.error?.message || raw?.message || 'Không thể tạo danh mục!';
        setCatModalError(errMsg);
        return;
      }

      const createdCat = raw.data || raw;
      const formattedCat: CategoryInfo = {
        id: createdCat.id,
        name: createdCat.name,
        slug: createdCat.slug,
        icon: '🏷️',
        badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-emerald-400/30',
      };

      // Thêm vào danh sách danh mục dùng chung
      setCategoriesList((prev) => {
        if (prev.some((c) => c.slug === formattedCat.slug || c.id === formattedCat.id)) return prev;
        return [...prev, formattedCat];
      });

      // Nếu có sản phẩm mục tiêu (gọi từ dropdown của 1 máy): Gán luôn danh mục mới cho máy này
      if (targetProductForNewCat) {
        await handleUpdateCategory(targetProductForNewCat.id, formattedCat.id);
        showToast(`Đã tạo danh mục "${formattedCat.name}" & gán cho máy thành công!`);
      } else {
        showToast(`Đã tạo danh mục mới "${formattedCat.name}" thành công!`);
      }

      setIsCreateCatModalOpen(false);
      setTargetProductForNewCat(null);
    } catch {
      setCatModalError('Lỗi kết nối máy chủ khi tạo danh mục!');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${catName}"?`)) return;
    setDeletingCatId(catId);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/categories/${catId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCategoriesList((prev) => prev.filter((c) => c.id !== catId));
        showToast(`Đã xóa danh mục "${catName}" thành công!`);
      } else {
        showToast(`Không thể xóa danh mục: Có thể đang có sản phẩm thuộc danh mục này!`);
      }
    } catch {
      showToast('Lỗi khi xóa danh mục!');
    } finally {
      setDeletingCatId(null);
    }
  };

  // Xử lý chỉnh sửa nhanh số lượng tồn kho (Quick Stock Change)
  const handleQuickStockChange = async (productId: string, newStock: number) => {
    const clamped = Math.max(0, newStock);
    const isZero = clamped <= 0;

    // 1. Cập nhật giao diện tức thì (Optimistic UI)
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stock: clamped,
            status: isZero ? 'out_of_stock' : 'available',
            availability: isZero ? 'SOLD' : 'AVAILABLE',
          };
        }
        return p;
      }),
    );

    showToast(
      isZero
        ? 'Cảnh báo: Sản phẩm đã chuyển sang HẾT HÀNG (0 máy)!'
        : `Đã cập nhật tồn kho: ${clamped} máy!`,
    );

    // 2. Gửi request PATCH tới Backend
    try {
      const baseUrl = getApiBaseUrl();

      await fetchWithAdminAuth(`${baseUrl}/admin/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: clamped }),
      });
    } catch {
      // Optimistic UI đã phản hồi
    }
  };

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [productModuleName, setProductModuleName] = useState<string>('Kho máy tân trang');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    const baseUrl = getApiBaseUrl();

    // 0. Tải và lắng nghe nhãn menu đồng bộ từ Sidebar
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_menu_labels');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.products_module) {
            setProductModuleName(parsed.products_module);
          }
        } catch {}
      }
    }

    const handleLabelsUpdated = (e: any) => {
      if (e.detail && e.detail.products_module) {
        setProductModuleName(e.detail.products_module);
      }
    };
    window.addEventListener('admin-menu-labels-updated', handleLabelsUpdated);

    fetch(`${baseUrl}/settings/menu-labels`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((raw) => {
        if (raw) {
          const data = raw.data || raw;
          if (data && data.products_module) {
            setProductModuleName(data.products_module);
          }
        }
      })
      .catch(() => {});

    // 1. Tải danh sách sản phẩm
    fetch(`${baseUrl}/products?limit=50`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setProducts(res.data);
        }
      })
      .catch(() => {});

    // 2. Tải danh sách danh mục từ backend
    fetch(`${baseUrl}/categories`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const merged = res.data.map((cat: any) => {
            const std = STANDARD_BAKERY_CATEGORIES.find((s) => s.slug === cat.slug || s.name === cat.name);
            return {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              icon: std?.icon || '🏷️',
              badgeClass: std?.badgeClass || 'bg-slate-100 text-slate-800 border-slate-300',
            };
          });
          setCategoriesList(merged);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('admin-menu-labels-updated', handleLabelsUpdated);
    };
  }, []);

  // Xử lý Cập nhật nhanh danh mục (gọi PATCH /api/v1/admin/products/:id/category)
  const handleUpdateCategory = async (productId: string, newCategoryIdOrName: string) => {
    setUpdatingCatId(productId);

    // Tìm tên danh mục mới để cập nhật giao diện
    const matchedCategory =
      categoriesList.find(
        (c) => c.id === newCategoryIdOrName || c.slug === newCategoryIdOrName || c.name === newCategoryIdOrName,
      ) || STANDARD_BAKERY_CATEGORIES.find((s) => s.slug === newCategoryIdOrName || s.name === newCategoryIdOrName);

    const newCategoryName = matchedCategory ? matchedCategory.name : newCategoryIdOrName;

    // Cập nhật Optimistic UI ngay lập tức
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          return {
            ...prod,
            category: {
              ...prod.category,
              id: matchedCategory?.id || newCategoryIdOrName,
              name: newCategoryName,
              slug: matchedCategory?.slug,
            },
          };
        }
        return prod;
      }),
    );

    showToast(`Đã chuyển danh mục sang "${newCategoryName}" thành công!`);
    setQuickEditProduct(null);

    // Gửi request API
    try {
      const baseUrl = getApiBaseUrl();

      const payload = {
        categoryId: matchedCategory?.id || newCategoryIdOrName,
        categoryName: newCategoryName,
      };

      // Ưu tiên endpoint chuẩn PATCH /api/v1/admin/products/:id/category
      const res = await fetchWithAdminAuth(`${baseUrl}/admin/products/${productId}/category`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback gọi endpoint phụ /products/:id/category
        await fetchWithAdminAuth(`${baseUrl}/products/${productId}/category`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
    } catch {
      // Đã cập nhật optimistic UI cho admin làm việc mượt mà
    } finally {
      setUpdatingCatId(null);
    }
  };

  const inStockCount = products.filter(
    (p) => Number(p.stock !== undefined && p.stock !== null ? p.stock : 1) > 0 && p.status !== 'out_of_stock' && p.availability !== 'SOLD'
  ).length;

  const soldOutCount = products.filter(
    (p) => Number(p.stock !== undefined && p.stock !== null ? p.stock : 1) <= 0 || p.status === 'out_of_stock' || p.availability === 'SOLD'
  ).length;

  const reservedCount = products.filter((p) => p.availability === 'RESERVED').length;

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.modelCode && prod.modelCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod.brand?.name && prod.brand.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod.category?.name && prod.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const curStock = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 1;
    const isZeroStock = curStock <= 0 || prod.status === 'out_of_stock' || prod.availability === 'SOLD';

    let matchesStatus = true;
    if (selectedStatus === 'IN_STOCK' || selectedStatus === 'AVAILABLE') {
      matchesStatus = !isZeroStock;
    } else if (selectedStatus === 'SOLD_OUT' || selectedStatus === 'SOLD') {
      matchesStatus = isZeroStock;
    } else if (selectedStatus === 'RESERVED') {
      matchesStatus = prod.availability === 'RESERVED';
    }

    const matchesCategory =
      selectedCategoryFilter === 'ALL' ||
      prod.category?.slug === selectedCategoryFilter ||
      prod.category?.name === selectedCategoryFilter ||
      (prod.category?.name && prod.category.name.toLowerCase().includes(selectedCategoryFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-amber-600" />
            <span>
              {productModuleName.toLowerCase().startsWith('quản lý')
                ? productModuleName
                : `Quản lý ${productModuleName}`}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tình trạng kiểm định, độ mới linh kiện đại tu, phân loại danh mục chuẩn và tiến độ bán/cọc máy thực tế tại xưởng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút Quản lý / Thêm Danh mục (Luồng 2) */}
          <button
            type="button"
            onClick={() => setIsManageCatsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-amber-400 hover:text-amber-700 transition cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-amber-600" />
            <span>Quản lý / Thêm Danh mục</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition"
          >
            <Plus className="h-4 w-4" />
            Đăng bán máy tân trang mới
          </Link>
        </div>
      </div>

      {/* FILTER BAR & QUICK CATEGORY CHIPS */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên máy, model, hãng, nhóm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Lọc theo trạng thái kho */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tất cả', count: products.length },
              {
                id: 'IN_STOCK',
                label: 'Còn máy (In Stock)',
                count: inStockCount,
                badgeClass: 'bg-emerald-100 text-emerald-800',
              },
              {
                id: 'SOLD_OUT',
                label: 'Đã bán / Hết hàng (Sold Out)',
                count: soldOutCount,
                badgeClass: 'bg-red-100 text-red-800',
              },
              {
                id: 'RESERVED',
                label: 'Đã cọc',
                count: reservedCount,
                badgeClass: 'bg-amber-100 text-amber-800',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                    selectedStatus === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.badgeClass || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lọc nhanh theo danh mục chuẩn */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Tag className="h-3 w-3 text-amber-500" />
            Nhóm máy:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tất cả danh mục ({products.length})
          </button>
          {categoriesList.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.slug;
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => setSelectedCategoryFilter(isSelected ? 'ALL' : cat.slug)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                <span>{cat.icon || '🏷️'}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleOpenCreateCategoryModal(null)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Thêm danh mục mới</span>
          </button>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Hình ảnh & Model</th>
              <th className="py-3 px-4">Tên thiết bị thanh lý</th>
              <th className="py-3 px-4">Hãng</th>
              {/* CỘT DANH MỤC RIÊNG BIỆT VỚI BADGE & QUICK EDIT */}
              <th className="py-3 px-4">Danh mục thiết bị (Quick Edit)</th>
              <th className="py-3 px-4">Độ mới & Đại tu</th>
              <th className="py-3 px-4 text-right">Giá hàng tân trang</th>
              <th className="py-3 px-4 text-center">Tồn kho (Stock)</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((prod) => {
              const cond = getConditionBadge(prod.condition);
              const avail = getAvailabilityBadge(prod.availability, prod.stock, prod.status);
              const catBadge = getCategoryBadge(prod.category?.name);

              let savingsPercent = 0;
              if (prod.basePrice && prod.originalPrice) {
                const b = Number(prod.basePrice);
                const o = Number(prod.originalPrice);
                if (o > b) savingsPercent = Math.round(((o - b) / o) * 100);
              }

              const prodImg = prod.imageUrl || prod.thumbnail;

              return (
                <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                  {/* Cột ảnh & Model */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                        {prodImg && !prodImg.includes('unsplash.com') && !prodImg.includes('pexels.com') ? (
                          <Image
                            src={normalizeImagePath(prodImg)}
                            alt={prod.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <Wrench className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-[11px] font-bold text-slate-700">
                        {prod.modelCode || 'N/A'}
                      </div>
                    </div>
                  </td>

                  {/* Cột tên */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Slug: {prod.slug}
                    </div>
                  </td>

                  {/* Cột hãng */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800">
                      {prod.brand?.name || 'Hãng khác'}
                    </span>
                  </td>

                  {/* CỘT DANH MỤC THIẾT BỊ: SINGLE SLEEK SELECT / COMBOBOX */}
                  <td className="py-3 px-4 min-w-[210px]">
                    <div className="relative w-full max-w-[230px]">
                      <select
                        aria-label={`Chọn danh mục cho máy ${prod.name}`}
                        value={prod.category?.id || prod.category?.slug || prod.category?.name || ''}
                        disabled={updatingCatId === prod.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__ADD_NEW__') {
                            handleOpenCreateCategoryModal(prod);
                            // Giữ nguyên hiển thị danh mục cũ trước khi tạo mới
                            e.target.value = prod.category?.id || prod.category?.slug || prod.category?.name || '';
                          } else if (val) {
                            handleUpdateCategory(prod.id, val);
                          }
                        }}
                        className={`w-full appearance-none rounded-xl border px-3 py-1.5 pr-8 text-[11px] font-bold shadow-2xs transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 ${catBadge.className}`}
                      >
                        <option value="" disabled>-- Chọn danh mục --</option>
                        {categoriesList.map((c) => (
                          <option key={c.id || c.slug} value={c.id || c.slug} className="bg-white text-slate-800 font-semibold py-1">
                            {c.icon || '🏷️'} {c.name}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="bg-amber-100 text-amber-950 font-black py-1.5">
                          ➕ + Thêm danh mục mới...
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                        {updatingCatId === prod.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột độ mới */}
                  <td className="py-3 px-4 max-w-xs">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] ${cond.className}`}>
                      {cond.label}
                    </span>
                    {prod.refurbishDetails && (
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {prod.refurbishDetails}
                      </div>
                    )}
                  </td>

                  {/* Cột giá */}
                  <td className="py-3 px-4 text-right">
                    <div className="font-extrabold text-amber-900 text-sm">
                      {prod.basePrice ? formatVND(prod.basePrice) : 'Liên hệ'}
                    </div>
                    {prod.originalPrice && (
                      <div className="text-[10px] text-slate-400">
                        Mới: <span className="line-through">{formatVND(prod.originalPrice)}</span>
                        {savingsPercent > 0 && (
                          <span className="ml-1 text-red-600 font-bold">(-{savingsPercent}%)</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Cột Tồn kho với cảnh báo đỏ khi = 0 máy và chỉnh sửa nhanh */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {(() => {
                      const curStock =
                        prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 1;
                      const isZeroStock = curStock <= 0 || prod.status === 'out_of_stock' || prod.availability === 'SOLD';

                      return (
                        <div className="flex items-center justify-center gap-1.5">
                          {isZeroStock ? (
                            <button
                              type="button"
                              onClick={() => {
                                const val = window.prompt(`Cập nhật số lượng tồn kho mới cho máy "${prod.name}":`, '1');
                                if (val !== null && !isNaN(Number(val))) {
                                  handleQuickStockChange(prod.id, Math.max(0, parseInt(val, 10)));
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 border border-red-300 shadow-2xs hover:bg-red-200 transition cursor-pointer"
                              title="Bấm để nhập số lượng mở bán lại"
                            >
                              <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                              Hết máy (0)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const val = window.prompt(`Cập nhật số lượng tồn kho mới cho máy "${prod.name}":`, String(curStock));
                                if (val !== null && !isNaN(Number(val))) {
                                  handleQuickStockChange(prod.id, Math.max(0, parseInt(val, 10)));
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                              title="Bấm để chỉnh sửa nhanh số lượng"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Còn {curStock} máy
                            </button>
                          )}

                          {/* Bộ nút tăng/giảm nhanh tồn kho */}
                          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStockChange(prod.id, curStock - 1);
                              }}
                              disabled={curStock <= 0}
                              className="h-5 w-5 rounded flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              title="Giảm 1 máy"
                            >
                              -
                            </button>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                const val = window.prompt(`Nhập số lượng tồn kho cho máy "${prod.name}":`, String(curStock));
                                if (val !== null && !isNaN(Number(val))) {
                                  handleQuickStockChange(prod.id, Math.max(0, parseInt(val, 10)));
                                }
                              }}
                              className="px-1.5 font-mono text-[11px] font-bold text-slate-800 hover:text-amber-600 hover:underline cursor-pointer"
                              title="Bấm để nhập số chính xác"
                            >
                              {curStock}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStockChange(prod.id, curStock + 1);
                              }}
                              className="h-5 w-5 rounded flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                              title="Tăng 1 máy nhập thêm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Cột trạng thái */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] ${avail.className}`}>
                      {avail.label}
                    </span>
                  </td>

                  {/* Cột hành động */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(prod);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <Edit2 className="h-3 w-3 text-amber-700" />
                        <span>Chỉnh sửa</span>
                      </button>

                      <Link
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition"
                        title="Xem trang thực tế"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QUICK CATEGORY EDIT MODAL */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-amber-500" />
                  Cập Nhật Danh Mục Thiết Bị
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đồng bộ ngay với bộ lọc website và Trợ lý AI tư vấn kỹ thuật
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditProduct(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Product Summary */}
            <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-200 flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                {(quickEditProduct.imageUrl || quickEditProduct.thumbnail) ? (
                  <Image
                    src={normalizeImagePath(quickEditProduct.imageUrl || quickEditProduct.thumbnail)}
                    alt={quickEditProduct.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <Wrench className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{quickEditProduct.name}</p>
                <p className="text-[11px] font-mono text-slate-500">Model: {quickEditProduct.modelCode || 'N/A'}</p>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  Hiện tại: {quickEditProduct.category?.name || 'Chưa phân loại'}
                </p>
              </div>
            </div>

            {/* Select 7 Standard Categories */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Chọn danh mục chuẩn ngành máy bánh Công Nguyên:
              </label>

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {STANDARD_BAKERY_CATEGORIES.map((std) => {
                  const isCurrent =
                    quickEditProduct.category?.name === std.name ||
                    quickEditProduct.category?.slug === std.slug;

                  return (
                    <button
                      key={std.id}
                      type="button"
                      onClick={() => handleUpdateCategory(quickEditProduct.id, std.id)}
                      disabled={updatingCatId === quickEditProduct.id}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{std.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{std.name}</div>
                          <div className="text-[10px] text-slate-500">Mã: {std.slug}</div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <CheckCircle2 className="h-4 w-4 text-amber-600" />
                          Đang chọn
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-600">
                          Chọn
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setQuickEditProduct(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PRODUCT EDIT MODAL WITH IMAGE UPLOADER */}
      <ProductEditModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        categoriesList={categoriesList}
        onClose={() => setEditingProduct(null)}
        onSuccess={(updated) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
          );
          showToast(`Cập nhật máy "${updated.name}" thành công!`);
        }}
      />

      {/* MODAL TẠO DANH MỤC MỚI (QUICK CREATE) */}
      {isCreateCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                  <FolderPlus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {targetProductForNewCat ? 'Thêm & Gán Danh Mục Mới' : 'Tạo Danh Mục Mới'}
                  </h3>
                  {targetProductForNewCat && (
                    <p className="text-[11px] text-amber-700 font-medium line-clamp-1">
                      Cho máy: {targetProductForNewCat.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateCatModalOpen(false);
                  setTargetProductForNewCat(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="mt-4 space-y-4">
              {catModalError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{catModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên danh mục thiết bị *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => handleNewCatNameChange(e.target.value)}
                  placeholder="Ví dụ: Máy Cán Bột Công Nghiệp"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Đường dẫn tĩnh (Slug)
                  </label>
                  <span className="text-[10px] text-slate-400">Tự động sinh từ tên</span>
                </div>
                <input
                  type="text"
                  required
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="may-can-bot-cong-nghiep"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả công năng (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Ứng dụng thiết bị cho tiệm bánh, xưởng sản xuất..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateCatModalOpen(false);
                    setTargetProductForNewCat(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingCat || !newCatName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {creatingCat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{creatingCat ? 'Đang tạo...' : 'Tạo danh mục'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ DANH MỤC TOÀN DIỆN (LUỒNG 2) */}
      {isManageCatsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Quản Lý Danh Mục Thiết Bị Bánh
                  </h3>
                  <p className="text-xs text-slate-500">
                    Danh sách {categoriesList.length} danh mục đang được sử dụng để phân loại máy trong hệ thống
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageCatsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Nút bấm mở Form tạo mới nhanh */}
              <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Bạn muốn bổ sung danh mục mới?</h4>
                  <p className="text-[11px] text-amber-800">Tạo danh mục mới để phân loại các dòng máy chuyên dụng khác.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenCreateCategoryModal(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 transition cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Thêm danh mục mới</span>
                </button>
              </div>

              {/* Danh sách danh mục hiện hành */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Danh sách danh mục ({categoriesList.length}):
                </label>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {categoriesList.map((cat) => {
                    const isStandard = STANDARD_BAKERY_CATEGORIES.some(
                      (s) => s.slug === cat.slug || s.name === cat.name,
                    );
                    const prodCount = products.filter(
                      (p) =>
                        p.category?.id === cat.id ||
                        p.category?.slug === cat.slug ||
                        p.category?.name === cat.name,
                    ).length;

                    return (
                      <div
                        key={cat.id || cat.slug}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl shrink-0">{cat.icon || '🏷️'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                              {isStandard ? (
                                <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 border border-slate-200">
                                  Hệ thống
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                                  Tùy chỉnh
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Slug: <code className="font-mono text-slate-600">{cat.slug}</code> • Đang có {prodCount} máy
                            </div>
                          </div>
                        </div>

                        {!isStandard && cat.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            disabled={deletingCatId === cat.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Xóa danh mục này"
                          >
                            {deletingCatId === cat.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageCatsModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

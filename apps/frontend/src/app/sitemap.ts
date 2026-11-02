import type { MetadataRoute } from 'next';
import { getApiBaseUrl } from '@/lib/utils';

interface ProductSlugItem {
  slug: string;
  updatedAt?: string | Date;
}

const FALLBACK_SLUGS: ProductSlugItem[] = [
  { slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan' },
  { slug: 'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan' },
  { slug: 'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan' },
  { slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan' },
  { slug: 'coi-danh-trung-tron-bot-dai-loan-hobat' },
  { slug: 'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc' },
  { slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100' },
  { slug: 'lo-nuong-doi-luu-southstar-4-mam' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://congnguyen.com.vn';
  const currentDate = new Date().toISOString();

  // 1. Các trang tĩnh cốt lõi
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/thanh-ly`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rfq`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tracking`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Các trang danh mục sản phẩm chủ lực (Category Filters)
  const categoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/products?categorySlug=tu-trung-bay-banh`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products?categorySlug=lo-nuong-cong-nghiep`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products?categorySlug=may-tron-bot-danh-trung`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 3. Fetch danh sách sản phẩm động từ backend
  let productRoutes: MetadataRoute.Sitemap = [];
  const apiUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${apiUrl}/products?limit=500`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const envelope = await res.json();
      const products: ProductSlugItem[] = envelope.data || [];

      if (Array.isArray(products) && products.length > 0) {
        productRoutes = products.map((prod) => ({
          url: `${baseUrl}/products/${prod.slug}`,
          lastModified: prod.updatedAt ? new Date(prod.updatedAt).toISOString() : currentDate,
          changeFrequency: 'daily',
          priority: 0.8,
        }));
      }
    }
  } catch {
    // Fallback khi backend chưa phản hồi trong lúc build
    productRoutes = FALLBACK_SLUGS.map((prod) => ({
      url: `${baseUrl}/products/${prod.slug}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  }

  if (productRoutes.length === 0) {
    productRoutes = FALLBACK_SLUGS.map((prod) => ({
      url: `${baseUrl}/products/${prod.slug}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

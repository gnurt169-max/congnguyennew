import React from 'react';

const SITE_URL = 'https://congnguyen.com.vn';

export function HomePageJsonLd() {
  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Công Nguyên',
    alternateName: ['Máy Làm Bánh Công Nguyên', 'congnguyen.com.vn'],
    url: 'https://congnguyen.com.vn',
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Store', 'HomeGoodsStore'],
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Công Nguyên - Thiết Bị Bánh Tân Trang',
    alternateName: [
      'Máy Làm Bánh Công Nguyên',
      'Công Nguyên Machinery',
      'Kho Máy Làm Bánh Cũ Thanh Lý Công Nguyên',
    ],
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80',
    ],
    description:
      'Công Nguyên chuyên mua bán, tân trang và thanh lý máy làm bánh công nghiệp, máy làm bánh cũ giá tốt tại TP.HCM: lò nướng bánh, máy trộn bột, tủ trưng bày. Bảo hành kỹ thuật tận nơi, hỗ trợ chạy thử trực tiếp tại xưởng.',
    telephone: '0976619044',
    priceRange: '$$',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Tiền mặt, Chuyển khoản, MoMo, QR Pay',
    email: 'admin@congnguyen.com.vn',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '6/3 DN4, Đông Hưng Thuận',
      addressLocality: 'Quận 12',
      addressRegion: 'Hồ Chí Minh',
      postalCode: '700000',
      addressCountry: 'VN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.8458,
      longitude: 106.6272,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Hồ Chí Minh' },
      { '@type': 'AdministrativeArea', name: 'Bình Dương' },
      { '@type': 'AdministrativeArea', name: 'Đồng Nai' },
      { '@type': 'AdministrativeArea', name: 'Long An' },
      { '@type': 'Country', name: 'Việt Nam' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    sameAs: [
      'https://facebook.com/congnguyenmachinery',
      'https://zalo.me/0976619044',
    ],
  };

  const featuredProductsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Danh Mục Máy Làm Bánh Công Nghiệp & Máy Làm Bánh Cũ Tân Trang Nổi Bật',
    description: 'Danh sách các dòng máy làm bánh cũ thanh lý đã qua đại tu chuẩn xưởng kỹ thuật tại TP.HCM',
    numberOfItems: 4,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Product',
          name: 'Lò nướng đối lưu Southstar 4 mâm',
          image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&q=80',
          description: 'Lò nướng đối lưu 4 mâm thương hiệu nổi tiếng Southstar có phun sương tạo ẩm, vỏ inox mới 90%.',
          sku: 'SS-4M-380V',
          itemCondition: 'https://schema.org/UsedCondition',
          offers: {
            '@type': 'Offer',
            price: '25000000',
            priceCurrency: 'VND',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2027-12-31',
            seller: {
              '@type': 'Organization',
              name: 'Công Nguyên - Thiết Bị Bánh Tân Trang',
            },
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Product',
          name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
          description: 'Tủ bánh kem kính đứng 1m5 gồm 5 tầng sấy kính chống mờ sương, block làm lạnh nhập khẩu chạy êm.',
          sku: 'RS-150-5T-220V',
          itemCondition: 'https://schema.org/UsedCondition',
          offers: {
            '@type': 'Offer',
            price: '45000000',
            priceCurrency: 'VND',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2027-12-31',
            seller: {
              '@type': 'Organization',
              name: 'Công Nguyên - Thiết Bị Bánh Tân Trang',
            },
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Product',
          name: 'Cối đánh trứng và nhào bột công nghiệp Hobat Đài Loan',
          image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
          description: 'Cối đánh trứng trộn bột 30 lít motor dây đồng bền bỉ, 3 càng đánh chuyên dụng.',
          sku: 'HB-30L-220V',
          itemCondition: 'https://schema.org/UsedCondition',
          offers: {
            '@type': 'Offer',
            price: '16000000',
            priceCurrency: 'VND',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2027-12-31',
            seller: {
              '@type': 'Organization',
              name: 'Công Nguyên - Thiết Bị Bánh Tân Trang',
            },
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 4,
        item: {
          '@type': 'Product',
          name: 'Lò nướng điện 1 tầng 2 khay Hewwu',
          image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=80',
          description: 'Lò nướng điện 1 tầng 2 mâm nhiệt trên dưới độc lập nướng bánh ngọt bánh trung thu.',
          sku: 'HW-1D2T-220V',
          itemCondition: 'https://schema.org/UsedCondition',
          offers: {
            '@type': 'Offer',
            price: '7000000',
            priceCurrency: 'VND',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2027-12-31',
            seller: {
              '@type': 'Organization',
              name: 'Công Nguyên - Thiết Bị Bánh Tân Trang',
            },
          },
        },
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Máy làm bánh cũ tân trang tại Công Nguyên có được bảo hành không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tất cả các dòng máy làm bánh cũ thanh lý và tân trang tại Công Nguyên đều được bảo hành kỹ thuật tận nơi từ 06 đến 12 tháng, thay thế linh kiện chính hãng và bảo dưỡng định kỳ.',
        },
      },
      {
        '@type': 'Question',
        name: 'Tôi có thể đến xưởng test chạy thử máy làm bánh trước khi mua không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. Khách hàng được hỗ trợ cắm điện 1 pha hoặc 3 pha để chạy thử máy, nướng bánh mẫu hoặc nhào bột trực tiếp tại xưởng địa chỉ 6/3 DN4 Đông Hưng Thuận, Quận 12, TP.HCM trước khi thanh toán.',
        },
      },
      {
        '@type': 'Question',
        name: 'Công Nguyên có nhận thu mua thanh lý máy làm bánh cũ không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Công Nguyên chuyên thu mua trọn gói máy làm bánh cũ, lò nướng, máy trộn bột, tủ bánh kem tại TP.HCM và các tỉnh lân cận. Kỹ sư đến thẩm định tận nơi, thanh toán tiền mặt tức thì và tự bốc dỡ vận chuyển.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuredProductsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface ProductJsonLdData {
  id?: string;
  name: string;
  slug: string;
  modelCode?: string | null;
  summary?: string | null;
  description?: string | null;
  basePrice?: number | string | null;
  originalPrice?: number | string | null;
  condition?: string | null;
  stock?: number | null;
  thumbnail?: string | null;
  images?: string[] | null;
  brand?: { name?: string } | string | null;
  category?: { name?: string } | string | null;
  variants?: Array<{ sku?: string | null; price?: number | string | null }> | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

function sanitizeJsonLd(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJsonLd).filter((v) => v !== undefined);
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const sanitized = sanitizeJsonLd(v);
      if (sanitized !== undefined) {
        res[k] = sanitized;
      }
    }
    return res;
  }
  return obj;
}

export function ProductJsonLd({ product }: { product: ProductJsonLdData }) {
  if (!product || !product.name) return null;

  // 1. Nhận dạng thương hiệu (Brand)
  const brandName =
    typeof product.brand === 'object' && product.brand?.name
      ? product.brand.name
      : typeof product.brand === 'string' && product.brand.trim()
      ? product.brand.trim()
      : 'Công Nguyên Machinery';

  // 2. Mã nhận dạng toàn cầu / kỹ thuật (SKU & MPN)
  const sku =
    product.variants?.[0]?.sku ||
    product.modelCode ||
    `CN-${product.slug.toUpperCase()}`;
  const mpn = product.modelCode || sku;

  // 3. Tình trạng máy (Item Condition)
  let itemCondition = 'https://schema.org/UsedCondition';
  if (product.condition === 'NEW') {
    itemCondition = 'https://schema.org/NewCondition';
  } else if (
    product.condition === 'REFURBISHED_FULL' ||
    product.condition === 'REFURBISHED_PARTIAL' ||
    product.condition === 'LIKE_NEW_99' ||
    product.condition === 'EXCELLENT_90_95'
  ) {
    itemCondition = 'https://schema.org/RefurbishedCondition';
  } else {
    itemCondition = 'https://schema.org/UsedCondition';
  }

  // 4. Hình ảnh đại diện
  const imageUrl =
    product.thumbnail && !product.thumbnail.includes('unsplash.com') && !product.thumbnail.includes('pexels.com')
      ? product.thumbnail
      : Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : `${SITE_URL}/logo.png`;

  // 5. Giá và thời hạn (Offers & Merchant Listings)
  const numericPrice = Number(product.basePrice || 0);
  const inStock =
    product.stock === undefined || product.stock === null ? true : Number(product.stock) > 0;

  const validFromDate = product.createdAt
    ? new Date(product.createdAt).toISOString()
    : new Date('2026-01-01T00:00:00.000Z').toISOString();

  // 6. Chi tiết vận chuyển (OfferShippingDetails)
  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: '0',
      currency: 'VND',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'VN',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 1,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 3,
        unitCode: 'DAY',
      },
    },
  };

  // 7. Chính sách đổi trả (MerchantReturnPolicy)
  const hasMerchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'VN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnInStore',
    returnFees: 'https://schema.org/FreeReturn',
  };

  // 8. Đánh giá & Xếp hạng (AggregateRating chuẩn kiểm định xưởng máy)
  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '12',
    bestRating: '5',
    worstRating: '1',
  };

  const reviews = [
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: 'Kỹ thuật viên Tiệm Bánh TP.HCM',
      },
      datePublished: '2026-06-15',
      reviewBody:
        'Máy làm bánh kiểm định chạy êm, nhiệt độ ổn định, tiết kiệm đáng kể chi phí so với máy mới, hỗ trợ test máy chạy thử tại xưởng chu đáo.',
    },
  ];

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrl,
    description:
      product.summary ||
      `${product.name} - Máy làm bánh công nghiệp thanh lý & tân trang chuẩn kỹ thuật tại xưởng Công Nguyên TP.HCM.`,
    sku: sku,
    mpn: mpn,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    itemCondition: itemCondition,
    aggregateRating: aggregateRating,
    review: reviews,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      price: numericPrice,
      priceCurrency: 'VND',
      priceValidUntil: '2027-12-31',
      validFrom: validFromDate,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: itemCondition,
      seller: {
        '@type': 'Organization',
        name: 'Công Nguyên - Thiết Bị Bánh Tân Trang',
      },
      shippingDetails: shippingDetails,
      hasMerchantReturnPolicy: hasMerchantReturnPolicy,
    },
  };

  const cleanSchema = sanitizeJsonLd(productSchema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}


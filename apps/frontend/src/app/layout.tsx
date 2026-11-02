import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ThirdPartyScripts } from '@/components/third-party-scripts';
import { getApiBaseUrl } from '@/lib/utils';

// Cấu hình Google Font tối ưu chống layout shift (CLS) cho Core Web Vitals
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = 'https://congnguyen.com.vn';

export async function generateMetadata(): Promise<Metadata> {
  let brandName = 'Công Nguyên';
  let brandTagline = 'Thiết Bị Bánh Công Nghiệp';
  let seoTitle = 'Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM';
  let seoDescription =
    'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.';

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/settings/general`, { next: { tags: ['brand-config'], revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      if (data) {
        if (data.brandName) brandName = data.brandName;
        if (data.brandTagline) brandTagline = data.brandTagline;
        if (data.seoTitle) seoTitle = data.seoTitle;
        if (data.seoDescription) seoDescription = data.seoDescription;
      }
    }
  } catch {
    // Fallback mặc định an toàn khi backend chưa khởi động
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || SITE_URL),
    applicationName: brandName,
    title: {
      default: seoTitle,
      template: `%s | ${brandName}`,
    },
    description: seoDescription,
    icons: {
      icon: '/icon.png',
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
    },
    keywords: [
      'máy làm bánh công nghiệp',
      'máy làm bánh',
      'máy làm bánh cũ',
      'thanh lý máy làm bánh',
      'máy trộn bột',
      'lò nướng bánh',
      'thiết bị bánh tân trang TP.HCM',
      'lò nướng đối lưu',
      'tủ trưng bày bánh kem',
      'thu mua máy làm bánh cũ',
      `${brandName.toLowerCase()} máy làm bánh`,
    ],
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: SITE_URL,
      siteName: brandName,
      locale: 'vi_VN',
      type: 'website',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&h=630&q=80',
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&h=630&q=80'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'YOUR_GOOGLE_VERIFICATION_CODE_HERE',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Công Nguyên',
    alternateName: ['Máy Làm Bánh Công Nguyên', 'congnguyen.com.vn'],
    url: 'https://congnguyen.com.vn',
  };

  return (
    <html lang="vi" className={inter.variable}>
      <head>
        {/* Google tag (gtag.js) - Google Ads Conversion Tracking (Raw HTML in Head for Bot Scanning) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18549767805"
        />
        <script
          id="google-ads-gtag"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18549767805');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ThirdPartyScripts />
      </body>
    </html>
  );
}

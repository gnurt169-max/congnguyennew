import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { LatestListingsSection } from '@/components/home/latest-listings-section';
import { HeroSection, HomepageHeroConfig } from '@/components/home/hero-section';
import { HomePageJsonLd } from '@/components/seo/json-ld';
import { getApiBaseUrl } from '@/lib/utils';

// Lazy loading banner tư vấn RFQ
const DynamicConsultationBanner = dynamic(
  () => import('@/components/home/consultation-banner').then((mod) => mod.ConsultationBanner),
  {
    loading: () => <div className="h-44 w-full bg-slate-900 animate-pulse rounded-2xl" />,
  },
);

// Hàm lấy URL backend linh hoạt cho cả Server Component và Localhost/Production
function getBackendUrl(): string {
  return getApiBaseUrl();
}

// 1. Dữ liệu trang chủ / Hero Section có gắn tag 'homepage-config' và revalidate 3600s
async function getHomepageConfig(): Promise<HomepageHeroConfig | null> {
  try {
    const baseUrl = getBackendUrl();
    const res = await fetch(`${baseUrl}/settings/homepage`, {
      next: { tags: ['homepage-config'], revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('Không thể tải cấu hình dynamic Hero từ backend:', err);
    return null;
  }
}

// 2. Dữ liệu cài đặt thương hiệu có gắn tag 'brand-config' và revalidate 3600s
async function getBrandConfig() {
  try {
    const baseUrl = getBackendUrl();
    const res = await fetch(`${baseUrl}/settings/brand`, {
      next: { tags: ['brand-config'], revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

// 3. Dữ liệu danh sách máy bánh còn hàng gắn tag 'products-list' & 'products'
async function getFeaturedProducts() {
  try {
    const baseUrl = getBackendUrl();
    const res = await fetch(`${baseUrl}/products?limit=12&stockStatus=in_stock`, {
      next: { tags: ['products-list', 'products'], revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data || json;
    const items = data.items || data;
    return Array.isArray(items) ? items : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const brandConfig = await getBrandConfig();
  const brandName = brandConfig?.brandName || 'Công Nguyên';
  const seoTitle =
    brandConfig?.seoTitle ||
    `${brandName} - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM`;
  const seoDescription =
    brandConfig?.seoDescription ||
    'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.';

  return {
    title: {
      absolute: seoTitle,
    },
    description: seoDescription,
    metadataBase: new URL('https://congnguyen.com.vn'),
    alternates: { canonical: '/' },
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
      'thiết bị làm bánh tân trang',
      'lò nướng bánh',
      'máy trộn bột',
      'tủ trưng bày bánh kem',
      'công nguyên máy làm bánh',
    ],
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: 'https://congnguyen.com.vn',
      siteName: brandName,
      images: [
        {
          url: '/icon.png',
          width: 192,
          height: 192,
          alt: seoTitle,
        },
      ],
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: ['/icon.png'],
    },
  };
}

export default async function HomePage() {
  const [heroConfig, brandConfig, featuredProducts] = await Promise.all([
    getHomepageConfig(),
    getBrandConfig(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="flex flex-col">
      {/* SCHEMA JSON-LD STRUCTURED DATA */}
      <HomePageJsonLd />

      {/* 1. HERO SECTION (DYNAMIC TỪ DATABASE / ADMIN CMS) */}
      <HeroSection config={heroConfig} products={featuredProducts} />

      {/* 2. BỘ LỌC NHANH & DANH MỤC CHÍNH + 8 MÁY THỰC TẾ (LATEST LISTINGS GRID) */}
      <LatestListingsSection initialProducts={featuredProducts || undefined} />

      {/* 3. QUY TRÌNH THU MUA - TÂN TRANG - BẢO HÀNH CHUẨN KỸ THUẬT */}
      <section className="bg-white py-16 lg:py-24 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
              Quy Trình Khép Kín Tại Xưởng
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Quy Trình Thu Mua - Tân Trang - Bảo Hành
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Mỗi chiếc máy bánh tại Công Nguyên đều trải qua quy trình đại tu nghiêm ngặt bởi đội ngũ kỹ sư lành nghề, bảo đảm máy vận hành êm ái, bền bỉ như máy mới trước khi bàn giao.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* BƯỚC 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-xs hover:border-amber-400 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-sm shadow-xs">
                  01
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  Khảo Sát Tận Nơi
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Khảo Sát & Thu Mua Tận Nơi
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kỹ sư trực tiếp đến tiệm thẩm định chi tiết lốc lạnh, motor dây đồng, biến tần và khung sườn inox. Báo giá minh bạch, thanh toán tiền mặt tức thì và tự tháo dỡ vận chuyển.
              </p>
            </div>

            {/* BƯỚC 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-xs hover:border-amber-400 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-sm shadow-xs">
                  02
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  Đại Tu Kỹ Thuật
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Đại Tu & Tân Trang Chuẩn Xưởng
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rã máy vệ sinh áp lực cao, thay mới 100% bạc đạn, phớt chặn dầu, dây curoa chịu tải, súc dàn tản nhiệt, nạp gas lạnh tinh khiết và phục hồi hệ thống mạch điều khiển.
              </p>
            </div>

            {/* BƯỚC 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-xs hover:border-amber-400 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-sm shadow-xs">
                  03
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  Chạy Thử Tải Thực Tế
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Test Máy Với Bột & Nhiệt Độ
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chạy thử liên tục 4-8 tiếng có tải tại xưởng 6/3 DN4 Đông Hưng Thuận. Khách hàng có thể mang bột trực tiếp đến xưởng để kiểm tra độ bung nở, độ bông kem và giữ lạnh thực tế.
              </p>
            </div>

            {/* BƯỚC 4 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-xs hover:border-amber-400 transition-all hover:shadow-md group">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-sm shadow-xs">
                  04
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
                  Bàn Giao & Bảo Hành
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Bàn Giao & Bảo Hành Tận Tiệm
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Vận chuyển an toàn, hỗ trợ đấu nối điện 1 pha/3 pha tận tiệm bánh. Bảo hành kỹ thuật 06 tháng tại chỗ, cam kết linh kiện thay thế trọn đời và hỗ trợ hotline 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KHỐI NĂNG LỰC CUNG CẤP & ĐỊA CHỈ XƯỞNG THỰC TẾ */}
      <section className="bg-slate-50 py-16 lg:py-20 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200/80 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/20 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
              Tổng Kho Thiết Bị Bánh TP.HCM
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Tổng Kho Thiết Bị Làm Bánh Công Nghiệp Thanh Lý & Tân Trang Uy Tín
            </h2>

            <div className="mt-4 text-sm leading-relaxed text-slate-600 space-y-4">
              <p>
                <strong>Công Nguyên</strong> tự hào là đơn vị uy tín hàng đầu tại TP.HCM chuyên cung cấp giải pháp toàn diện về <strong className="text-amber-900">thiết bị làm bánh</strong> công nghiệp thanh lý và máy móc tân trang chất lượng cao. Với hơn 10 năm kinh nghiệm trong ngành máy thực phẩm, chúng tôi giúp các xưởng bánh mì, lò bánh bao, tiệm bánh kem ngọt và chuỗi bakery tối ưu từ <strong>40% đến 60% chi phí đầu tư</strong> so với mua máy mới mà vẫn bảo đảm độ bền bỉ và công suất vận hành ổn định.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Lò nướng bánh công nghiệp
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đa dạng các dòng lò nướng đối lưu 4-5 mâm Southstar, lò nướng tầng điện/gas kiểm soát nhiệt trên-dưới độc lập và lò nướng xoay Rotary 16-32 khay. Phục vụ hoàn hảo từ tiệm bánh gia đình đến xưởng sản xuất bánh mì công suất lớn.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Tủ trưng bày bánh kem & Bảo quản
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Các dòng tủ trưng bày bánh kem kính vuông, kính cong cao cấp Ruyshing Đài Loan từ 1m2 đến 1m8 (3 tầng, 5 tầng). Lốc làm lạnh êm, hệ thống sấy kính chống mờ sương và đèn LED vàng tôn vinh vẻ đẹp bánh gato.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Máy trộn bột & Đánh trứng
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cối trộn bột xoắn ốc Spiral Mixer từ 25kg đến 50kg bột khô, cối đánh trứng / nhào bột Hobart, Chanmag và Sinmag. Cối và càng đánh bằng inox SUS304 chuẩn an toàn vệ sinh thực phẩm HACCP.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Kho xưởng: 6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam</span>
                </div>
                <div>
                  Hotline tư vấn kỹ thuật: <a href="tel:0976619044" className="font-bold text-amber-700 hover:underline">0976 619 044</a> (Zalo 24/7)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONSULTATION BANNER SECTION */}
      <DynamicConsultationBanner />
    </div>
  );
}

'use client';

import Script from 'next/script';

/**
 * Component quản lý tập trung toàn bộ mã Script của bên thứ ba
 * (Google Analytics GA4, Google Tag Manager, Facebook Pixel, Zalo SDK, Hotjar).
 * 
 * Chiến lược tải (Loading Strategy) tối ưu cho Core Web Vitals (TBT, INP, LCP):
 * - Nhóm 1 (Đo lường cơ bản): GA4, GTM -> `strategy="afterInteractive"`
 * - Nhóm 2 (Tiện ích nặng & không khẩn cấp): FB Pixel, Zalo OA, Hotjar -> `strategy="lazyOnload"`
 * 
 * Bảo vệ môi trường:
 * - Chỉ nạp trong môi trường Production (hoặc khi bật NEXT_PUBLIC_ENABLE_ANALYTICS_DEV=true).
 * - Kiểm tra chặt chẽ sự tồn tại của biến môi trường trước khi render thẻ Script.
 */
export function ThirdPartyScripts() {
  const isProduction = process.env.NODE_ENV === 'production';
  const enableDev = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_DEV === 'true';

  // Không nạp mã theo dõi khi đang dev ở localhost trừ khi được cấu hình rõ ràng
  if (!isProduction && !enableDev) {
    return null;
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const zaloOaId = process.env.NEXT_PUBLIC_ZALO_OA_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const hotjarSv = process.env.NEXT_PUBLIC_HOTJAR_SV || '6';

  return (
    <>
      {/* ============================================================== */}
      {/* NHÓM 1: ĐO LƯỜNG CƠ BẢN (strategy="afterInteractive") */}
      {/* ============================================================== */}

      {/* 1. Google Analytics 4 (GA4) */}
      {gaId && (
        <>
          <Script
            id="google-analytics-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                  transport_type: 'beacon'
                });
              `,
            }}
          />
        </>
      )}

      {/* 2. Google Tag Manager (GTM) */}
      {gtmId && (
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `,
          }}
        />
      )}

      {/* ============================================================== */}
      {/* NHÓM 2: TIỆN ÍCH NẶNG / KHÔNG KHẨN CẤP (strategy="lazyOnload") */}
      {/* ============================================================== */}

      {/* 3. Meta / Facebook Pixel */}
      {fbPixelId && (
        <Script
          id="facebook-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* 4. Zalo OA Chat Widget / SDK */}
      {zaloOaId && (
        <Script
          id="zalo-sdk"
          strategy="lazyOnload"
          src="https://sp.zalo.me/plugins/sdk.js"
        />
      )}

      {/* 5. Hotjar Tracking */}
      {hotjarId && (
        <Script
          id="hotjar-snippet"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:${hotjarId},hjsv:${hotjarSv}};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      )}
    </>
  );
}

export default ThirdPartyScripts;


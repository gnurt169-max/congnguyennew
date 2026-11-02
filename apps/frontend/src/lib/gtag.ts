/**
 * Google Tag (gtag.js) & Google Ads Conversion Tracking Helper
 * Container ID: AW-18549767805
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18549767805';

/**
 * Gửi sự kiện đo lường chuyển đổi (Conversion Event) tới Google Ads
 * @param sendTo Mã nhãn chuyển đổi, ví dụ: 'AW-18549767805/AbC-D_efG'
 * @param value Giá trị chuyển đổi (VNĐ)
 * @param currency Đơn vị tiền tệ (mặc định VND)
 */
export function trackGoogleConversion(sendTo: string, value?: number, currency = 'VND') {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value: value,
      currency: currency,
    });
  }
}

/**
 * Gửi sự kiện tuỳ chỉnh bất kỳ qua Google Tag
 */
export function trackGoogleEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}


'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

interface ConsultationBannerProps {
  initialTitle?: string;
  initialSubtitle?: string;
  initialButtonText?: string;
  initialButtonLink?: string;
  initialHotline?: string;
}

export function ConsultationBanner({
  initialTitle = 'Tư Vấn & Khảo Sát Dây Chuyền Bánh Tận Nơi',
  initialSubtitle = 'Đội ngũ kỹ thuật hỗ trợ tính toán công suất lò nướng, máy trộn và kiểm tra hạ tầng điện 3 pha cho xưởng của bạn.',
  initialButtonText = 'Gửi yêu cầu tư vấn kỹ thuật (RFQ)',
  initialButtonLink = '/rfq',
  initialHotline = '0976 619 044',
}: ConsultationBannerProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [buttonText, setButtonText] = useState(initialButtonText);
  const [buttonLink, setButtonLink] = useState(initialButtonLink);
  const [hotline, setHotline] = useState(initialHotline);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/settings/content`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          if (cfg.bannerTitle) setTitle(cfg.bannerTitle);
          if (cfg.bannerSubtitle) setSubtitle(cfg.bannerSubtitle);
          if (cfg.bannerButtonText) setButtonText(cfg.bannerButtonText);
          if (cfg.bannerButtonLink) setButtonLink(cfg.bannerButtonLink);
          if (cfg.bannerHotline) setHotline(cfg.bannerHotline);
        }
      })
      .catch(() => {
        // Fallback gracefully on network error
      });
  }, []);

  const cleanPhone = hotline.replace(/\s+/g, '');

  return (
    <section className="bg-slate-100/70 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 sm:p-10 text-white shadow-2xl">
          {/* Ambient glows and subtle tech pattern */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* BÊN TRÁI */}
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {title}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* BÊN PHẢI */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 flex-shrink-0">
              <Link
                href={buttonLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span>{buttonText}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white hover:border-slate-600 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Phone className="h-4 w-4 text-amber-400" />
                <span>Hotline: {hotline}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ExternalLink,
  Phone,
  Flame,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Wrench,
} from 'lucide-react';
import { formatVND, normalizeImagePath, getApiBaseUrl } from '@/lib/utils';

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  condition?: string | null;
  availability?: string; // 'AVAILABLE' | 'RESERVED' | 'SOLD'
  status?: string;
  stock?: number;
  soldCount?: number;
  basePrice?: number | string | null;
  originalPrice?: number | string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
  } | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isFallback?: boolean;
  recommendedProducts?: RecommendedProduct[];
}

const DEFAULT_WELCOME_MESSAGE =
  'Chào bạn! Công Nguyên chuyên cung cấp & thanh lý máy móc, thiết bị làm bánh công nghiệp (lò nướng, máy trộn bột, máy cán, máy chia bột...). Bạn đang cần tư vấn dòng máy nào hoặc tìm đồ tân trang cho tiệm bánh của mình?';

const DEFAULT_WIDGET_ROLE = 'Chuyên Viên Kỹ Thuật & Báo Giá Máy Bánh Công Nguyên';

const SUGGESTION_PROMPTS = [
  {
    label: '🥖 Lò nướng bánh thanh lý',
    prompt: 'Tư vấn cho mình các dòng lò nướng bánh thanh lý & tân trang đang có sẵn',
  },
  {
    label: '🥣 Máy trộn bột công nghiệp',
    prompt: 'Có những dòng máy trộn bột hoặc cối đánh trứng nào đang có sẵn?',
  },
  {
    label: '🛠 Dịch vụ tân trang & Thu mua máy cũ',
    prompt: 'Quy trình thu mua máy cũ và chính sách tân trang thiết bị bánh của Công Nguyên như thế nào?',
  },
  {
    label: '📋 Yêu cầu báo giá (RFQ)',
    prompt: 'Mình muốn nhận báo giá kỹ thuật và tư vấn công suất máy cho tiệm bánh',
  },
];

function getConditionBadge(condition?: string | null) {
  switch (condition) {
    case 'LIKE_NEW_99':
      return { text: 'Mới 99%', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'EXCELLENT_90_95':
      return { text: 'Đẹp 95%', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'FAIR_80':
      return { text: 'Độ mới 80%', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'REFURBISHED_FULL':
    default:
      return { text: 'Kiểm định tốt', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
}

export function FloatingAiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [welcomeText, setWelcomeText] = useState(DEFAULT_WELCOME_MESSAGE);
  const [widgetRole, setWidgetRole] = useState(DEFAULT_WIDGET_ROLE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Không hiển thị khung chat trên phân hệ quản trị Admin
  const isAdmin = pathname.startsWith('/admin');

  // Tải câu chào mở đầu và vai trò từ backend
  useEffect(() => {
    if (isAdmin) return;

    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/ai/welcome`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.welcomeMessage) {
            setWelcomeText(data.welcomeMessage);
          }
          if (data.widgetRole || data.advisorName) {
            setWidgetRole(data.widgetRole || data.advisorName);
          }
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  // Khởi tạo câu chào ban đầu khi mở widget
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          role: 'model',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeText]);

  // Tự cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus ô nhập khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen]);

  if (isAdmin) {
    return null;
  }

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const baseUrl = getApiBaseUrl();
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-1')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text:
          data.reply ||
          'Hệ thống tư vấn AI hiện đang bảo trì, vui lòng quay lại sau hoặc liên hệ hỗ trợ trực tiếp!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: data.isFallback,
        recommendedProducts: data.recommendedProducts || [],
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch {
      // Fallback lịch sự khi API lỗi mạng hoặc 429 quota
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'model',
          text: 'Hệ thống tư vấn AI hiện đang bảo trì, vui lòng quay lại sau hoặc liên hệ hỗ trợ trực tiếp!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: true,
          recommendedProducts: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Làm sạch văn bản khỏi thẻ :::product_card{...}::: để hiển thị lời thoại mượt mà
  const cleanMarkdownText = (raw: string) => {
    return raw.replace(/:::product_card\{"slug":"[^"]+"\}:::/g, '').trim();
  };

  // Render markdown đơn giản (in đậm **bold**, bullet list, links [text](url))
  const renderFormattedText = (rawText: string) => {
    const cleaned = cleanMarkdownText(rawText);
    const lines = cleaned.split('\n');

    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Thay thế markdown links [Title](url) và **bold**
          const parts: React.ReactNode[] = [];
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          let lastIndex = 0;
          let match;

          while ((match = linkRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
              parts.push(renderBoldText(line.substring(lastIndex, match.index), `${idx}-sub-${lastIndex}`));
            }
            const linkText = match[1];
            const linkUrl = match[2];
            parts.push(
              <Link
                key={`link-${idx}-${match.index}`}
                href={linkUrl}
                className="font-bold text-amber-600 hover:text-amber-700 underline inline-flex items-center gap-0.5 mx-0.5"
              >
                <span>{linkText}</span>
                <ExternalLink className="h-2.5 w-2.5 inline" />
              </Link>
            );
            lastIndex = linkRegex.lastIndex;
          }

          if (lastIndex < line.length) {
            parts.push(renderBoldText(line.substring(lastIndex), `${idx}-sub-end`));
          }

          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          return (
            <p key={idx} className={isBullet ? 'pl-2 border-l-2 border-amber-400' : ''}>
              {parts}
            </p>
          );
        })}
      </div>
    );
  };

  const renderBoldText = (text: string, keyPrefix: string): React.ReactNode => {
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-${pIdx}`} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${keyPrefix}-${pIdx}`}>{part}</span>;
    });
  };

  return (
    <>
      {/* 1. NÚT MỞ FLOATING CHAT WIDGET Ở GÓC DƯỚI PHẢI */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {/* TOOLTIP GỢI Ý MỜ BAN ĐẦU */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xl border border-slate-200/80 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Săn Deal Thanh Lý Cực Hời</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          </button>

          {/* NÚT TRÒN CHÍNH */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Mở trợ lý AI săn deal thanh lý"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/35 ring-4 ring-amber-400/30 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group"
          >
            <Bot className="h-7 w-7 transition-transform group-hover:rotate-12" />
            {/* Chấm tròn trạng thái Online */}
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            {/* Vòng sóng Ping lan tỏa */}
            <span className="absolute -inset-1 rounded-full bg-amber-400 opacity-30 animate-ping pointer-events-none" />
          </button>
        </div>
      )}

      {/* 2. CỬA SỔ KHUNG CHAT TOÀN DIỆN */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[610px] max-h-[88vh] rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
          {/* HEADER CỬA SỔ CHAT */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-4 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-md">
                <Bot className="h-6 w-6" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-tight text-white line-clamp-1 max-w-[220px]" title={widgetRole}>
                    {widgetRole}
                  </h3>
                  <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase shrink-0">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trực tuyến • Tư vấn kỹ thuật & Thiết bị bánh tân trang</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="Đóng khung chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* KHUNG DANH SÁCH TIN NHẮN */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 rounded-tr-xs font-medium'
                      : msg.isFallback
                      ? 'bg-amber-50/90 border border-amber-200 text-amber-950 rounded-tl-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="space-y-3">
                      {/* VĂN BẢN TRẢ LỜI CỦA AI */}
                      <div>{renderFormattedText(msg.text)}</div>

                      {/* RENDER MINI PRODUCT CARDS ĐƯỢC GỢI Ý BỞI AI */}
                      {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                        <div className="space-y-2.5 pt-1">
                          {msg.recommendedProducts.map((prod) => {
                            const stockNum = typeof prod.stock === 'number' ? prod.stock : 1;
                            const isSold =
                              prod.availability === 'SOLD' ||
                              prod.status === 'out_of_stock' ||
                              stockNum <= 0;
                            const condition = getConditionBadge(prod.condition);
                            const basePriceNum =
                              typeof prod.basePrice === 'string'
                                ? parseFloat(prod.basePrice)
                                : Number(prod.basePrice || 0);
                            const origPriceNum =
                              typeof prod.originalPrice === 'string'
                                ? parseFloat(prod.originalPrice)
                                : Number(prod.originalPrice || 0);
                            const hasDiscount = origPriceNum > basePriceNum && basePriceNum > 0;
                            const discountPercent = hasDiscount
                              ? Math.round(((origPriceNum - basePriceNum) / origPriceNum) * 100)
                              : 0;

                            return (
                              <div
                                key={prod.id || prod.slug}
                                className={`rounded-xl border p-2.5 shadow-xs transition-all ${
                                  isSold
                                    ? 'bg-slate-50 border-slate-200 opacity-75'
                                    : 'bg-gradient-to-b from-amber-50/40 to-white border-amber-200/90 hover:border-amber-400'
                                }`}
                              >
                                <div className="flex gap-2.5 items-center">
                                  {/* THUMBNAIL MINI */}
                                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                                    {(prod.imageUrl || prod.thumbnail) && !(prod.imageUrl || prod.thumbnail || '').includes('unsplash.com') && !(prod.imageUrl || prod.thumbnail || '').includes('pexels.com') ? (
                                      <Image
                                        src={normalizeImagePath(prod.imageUrl || prod.thumbnail)}
                                        alt={`Thiết bị làm bánh - ${prod.name}`}
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center bg-slate-900 text-amber-400">
                                        <Wrench className="h-5 w-5" />
                                      </div>
                                    )}
                                    {isSold && (
                                      <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center z-10">
                                        <span className="text-[8px] font-black text-white">ĐÃ BÁN</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* THÔNG TIN CHI TIẾT */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {/* BADGE TỒN KHO & ĐỘ MỚI */}
                                      {isSold ? (
                                        <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-black text-red-700">
                                          ĐÃ BÁN HẾT
                                        </span>
                                      ) : (
                                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800">
                                          ⚡ CÒN {stockNum} MÁY TẠI KHO
                                        </span>
                                      )}

                                      <span
                                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${condition.bg}`}
                                      >
                                        {condition.text}
                                      </span>
                                    </div>

                                    <h4 className="mt-1 text-xs font-bold text-slate-900 truncate">
                                      {prod.name}
                                    </h4>

                                    {/* GIÁ TIỀN & GIẢM GIÁ */}
                                    <div className="mt-0.5 flex items-baseline gap-1.5">
                                      <span className="text-xs font-black text-amber-600">
                                        {formatVND(prod.basePrice)}
                                      </span>
                                      {hasDiscount && (
                                        <>
                                          <span className="text-[10px] text-slate-400 line-through">
                                            {formatVND(prod.originalPrice)}
                                          </span>
                                          <span className="text-[9px] font-bold text-red-600">
                                            -{discountPercent}%
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* NÚT BẤM CTA KÍCH CẦU HOẶC THÔNG BÁO HẾT HÀNG */}
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  {isSold ? (
                                    <span className="text-[10px] font-bold text-slate-500 italic">
                                      Kho vừa chốt cọc cho khách.
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                                      <Flame className="h-3 w-3 text-amber-600 shrink-0" />
                                      <span>Deal hời, xem ngay kẻo lỡ!</span>
                                    </span>
                                  )}

                                  {isSold ? (
                                    <a
                                      href="https://zalo.me/0976619044"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-300 transition"
                                    >
                                      Đăng ký chờ máy
                                    </a>
                                  ) : (
                                    <Link
                                      href={`/products/${prod.slug}`}
                                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950 shadow-xs hover:shadow-sm active:scale-95 transition"
                                    >
                                      <span>Xem máy & Đặt cọc</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* FALLBACK KHI BẢO TRÌ */}
                      {msg.isFallback && (
                        <div className="mt-2 pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-amber-800 font-bold">Cần hỗ trợ gấp?</span>
                          <a
                            href="tel:0976619044"
                            className="inline-flex items-center gap-1 font-bold text-slate-900 bg-white px-2 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 transition"
                          >
                            <Phone className="h-3.5 w-3.5 text-amber-600" />
                            <span>0976 619 044</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.role === 'user' ? 'text-amber-950/70' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* HIỆU ỨNG AI ĐANG SOẠN CÂU TRẢ LỜI */}
            {isTyping && (
              <div className="flex gap-2.5 items-center text-xs text-slate-500 animate-pulse">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-500 font-medium ml-1">AI đang săn deal...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* GỢI Ý CHỦ ĐỀ NHANH (QUICK CHIPS) */}
          <div className="p-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {SUGGESTION_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isTyping}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-950 text-slate-700 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* KHUNG NHẬP TIN NHẮN */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tên máy bánh, công suất, số khay hoặc nhu cầu cần tư vấn..."
                disabled={isTyping}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isTyping || !inputText.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                title="Gửi câu hỏi"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1.5 text-[9px] text-slate-400 text-center leading-tight">
              Trợ lý AI Gemini am hiểu kỹ thuật máy làm bánh. Thông số & máy có sẵn được cập nhật theo thời gian thực.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

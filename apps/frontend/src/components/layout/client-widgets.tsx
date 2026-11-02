'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import các widget nổi & modal client-side trong môi trường Client Component
const CartDrawer = dynamic(
  () => import('@/components/cart/cart-drawer').then((mod) => mod.CartDrawer),
  { ssr: false },
);

const FloatingContactWidget = dynamic(
  () => import('@/components/layout/floating-contact-widget').then((mod) => mod.FloatingContactWidget),
  { ssr: false },
);

const FloatingAiChatWidget = dynamic(
  () => import('@/components/chat/floating-ai-chat-widget').then((mod) => mod.FloatingAiChatWidget),
  { ssr: false },
);

export function ClientWidgets() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chỉ kích hoạt render khi component đã mount tại browser, triệt tiêu 100% lỗi Bailout / Hydration Mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <CartDrawer />
      <FloatingContactWidget />
      <FloatingAiChatWidget />
    </>
  );
}

export default ClientWidgets;


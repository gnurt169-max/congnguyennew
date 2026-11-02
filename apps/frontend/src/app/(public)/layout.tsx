import React from 'react';
import { CartProvider } from '@/context/cart-context';
import { MainHeader, NavigationMenuItem } from '@/components/layout/main-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { MainFooter } from '@/components/layout/main-footer';
import { ClientWidgets } from '@/components/layout/client-widgets';
import { getApiBaseUrl } from '@/lib/utils';

async function getNavigationSettings(): Promise<NavigationMenuItem[] | undefined> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/settings/navigation`, {
      next: { tags: ['navigation', 'menu-header', 'navigation-config'], revalidate: 3600 },
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    const items = json?.data?.items || json?.items || json?.data;
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
  } catch {
    // Tự động fallback về cấu hình mặc định trong MainHeader nếu chưa kết nối được
  }
  return undefined;
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialNavItems = await getNavigationSettings();

  return (
    <CartProvider>
      <MainHeader initialItems={initialNavItems} />
      <main className="pb-16 md:pb-0">{children}</main>
      <BottomNav />
      <MainFooter />
      <ClientWidgets />
    </CartProvider>
  );
}


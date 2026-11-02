import type { Metadata } from 'next';
import AdminClientLayout from './admin-client-layout';
import AdminSessionGuard from '@/components/admin/admin-session-guard';

export const metadata: Metadata = {
  title: 'Hệ Thống Quản Trị | Công Nguyên',
  description: 'Phân hệ quản trị nội bộ thiết bị làm bánh Công Nguyên',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
      </head>
      <AdminSessionGuard>
        <AdminClientLayout>{children}</AdminClientLayout>
      </AdminSessionGuard>
    </>
  );
}

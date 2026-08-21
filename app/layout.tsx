import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HIPA Masala CRM - Premium Enterprise Management System',
  description: 'Enterprise CRM for managing leads, customers, enquiries, follow-ups, quotations, orders, and sales pipeline for HIPA Masala.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-surface">
      <body className="bg-background text-on-background font-body-md min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

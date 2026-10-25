import type { Metadata } from 'next';
import './globals.css';
import SiteShell from './components/SiteShell';

export const metadata: Metadata = {
  title: 'Roblox Creator Platform',
  description: 'Automated Middleman, Verified Commissions, and Studio Tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
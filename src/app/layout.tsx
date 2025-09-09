import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OneTimeMail - 一時メールアドレス',
  description: 'IoTデバイス設定代行サービス向けの一時メールアドレス発行・受信サービス',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

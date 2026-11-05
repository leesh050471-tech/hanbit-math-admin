import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '한빛수학 어드민',
  description: '한빛수학 직원용 수강·출결 관리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

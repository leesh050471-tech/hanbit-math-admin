import { Suspense } from 'react';
import Shell from '@/components/Shell';

// 화면은 모두 로그인 뒤 브라우저에서 그린다 (URL·토큰을 쓰므로 Suspense 안에 둔다)
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="container muted">불러오는 중...</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

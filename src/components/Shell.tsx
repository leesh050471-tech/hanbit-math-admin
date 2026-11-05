'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '@/lib/api';

export interface Me {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  mustChangePassword: boolean;
}

const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext);

const NAV = [
  { href: '/', label: '현황' },
  { href: '/students', label: '학생' },
  { href: '/families', label: '가족' },
  { href: '/classes', label: '반·출결' },
  { href: '/teachers', label: '강사' },
  { href: '/makeups', label: '보강' },
  { href: '/payments', label: '수강료' },
  { href: '/refunds', label: '환불 계산' },
];

/** 로그인한 직원만 들어올 수 있는 화면의 틀 */
export default function Shell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Me>('/auth/staff/me')
      .then((m) => {
        if (m.mustChangePassword) router.replace('/change-password');
        else setMe(m);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!me) return <p className="container muted">로그인 확인 중...</p>;

  const nav = me.role === 'ADMIN' ? [...NAV, { href: '/staff', label: '직원 계정' }] : NAV;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <MeContext.Provider value={me}>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">한빛수학 어드민</div>
          <nav>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="me">
            {me.name} ({me.role === 'ADMIN' ? '관리자' : '직원'})
            <br />
            <Link href="/change-password">비밀번호 변경</Link>
            {' · '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setToken(null);
                router.replace('/login');
              }}
            >
              로그아웃
            </a>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </MeContext.Provider>
  );
}

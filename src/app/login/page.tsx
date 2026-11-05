'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorBox, useAction } from '@/components/ui';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const res = await api('/auth/staff/login', { method: 'POST', body: { email, password } });
      setToken(res.token);
      router.replace(res.user.mustChangePassword ? '/change-password' : '/');
    });
  }

  return (
    <div className="auth-box card">
      <h1>한빛수학 어드민</h1>
      <p className="muted">직원 계정은 관리자가 만들어 줍니다.</p>
      <form onSubmit={submit}>
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <ErrorBox error={error} />
        <button className="primary" disabled={busy}>{busy ? '로그인 중...' : '로그인'}</button>
      </form>
    </div>
  );
}

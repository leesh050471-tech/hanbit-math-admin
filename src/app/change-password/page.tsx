'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorBox, useAction } from '@/components/ui';
import { api, ApiError, getToken } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [forced, setForced] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const { busy, error, run, setError } = useAction();

  useEffect(() => {
    if (!getToken()) return router.replace('/login');
    api('/auth/staff/me').then((me) => setForced(me.mustChangePassword)).catch(() => router.replace('/login'));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError(new ApiError('새 비밀번호 두 칸이 서로 다릅니다.', 400));
      return;
    }
    const ok = await run(() =>
      api('/auth/staff/change-password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      }),
    );
    if (ok) router.replace('/');
  }

  return (
    <div className="auth-box card">
      <h1>비밀번호 변경</h1>
      {forced && <div className="alert warn">임시 비밀번호로 로그인했습니다. 새 비밀번호로 바꿔야 다른 화면을 쓸 수 있어요.</div>}
      <form onSubmit={submit}>
        <label>
          지금 비밀번호 {forced && '(임시 비밀번호)'}
          <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
        </label>
        <label>
          새 비밀번호 (8자 이상)
          <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={8} />
        </label>
        <label>
          새 비밀번호 확인
          <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </label>
        <ErrorBox error={error} />
        <button className="primary" disabled={busy}>바꾸기</button>
        {!forced && <a href="/">돌아가기</a>}
      </form>
    </div>
  );
}

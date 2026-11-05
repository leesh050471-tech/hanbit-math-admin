'use client';

import { useState } from 'react';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api } from '@/lib/api';

export default function TeachersPage() {
  const list = useLoad(() => api<any[]>('/admin/teachers'));
  const [form, setForm] = useState({ name: '', subject: '수학' });
  const act = useAction();

  return (
    <>
      <h1>강사</h1>
      <p className="muted">강사 정보(이름·과목)와 어드민 로그인 계정은 따로 관리합니다. 로그인 계정이 없는 강사도 등록할 수 있습니다.</p>
      <div className="card row">
        <label>이름<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>담당 과목<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
        <button
          className="primary"
          disabled={act.busy || !form.name}
          onClick={async () => {
            if (await act.run(() => api('/admin/teachers', { method: 'POST', body: form }), '강사를 등록했습니다.')) {
              setForm({ name: '', subject: '수학' });
              list.reload();
            }
          }}
        >
          등록
        </button>
      </div>
      <ErrorBox error={act.error || list.error} />
      <OkBox message={act.ok} />
      <Loading loading={list.loading} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>이름</th><th>담당 과목</th><th>맡은 반</th><th>로그인 계정</th></tr></thead>
          <tbody>
            {list.data?.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.subject}</td>
                <td>{t.classes.join(', ') || <span className="muted">없음</span>}</td>
                <td>{t.staffEmail ?? <span className="muted">없음</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

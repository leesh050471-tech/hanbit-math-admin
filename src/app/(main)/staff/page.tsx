'use client';

import { useState } from 'react';
import { useMe } from '@/components/Shell';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api } from '@/lib/api';

/** 직원 계정 관리 (관리자만): 만들기, 고치기, 사용 중지, 비밀번호 리셋 */
export default function StaffPage() {
  const me = useMe();
  const list = useLoad(() => api<any[]>('/admin/staff'));
  const [form, setForm] = useState({ email: '', name: '', role: 'STAFF' });
  const [temp, setTemp] = useState<{ name: string; password: string } | null>(null);
  const act = useAction();

  if (me?.role !== 'ADMIN') return <div className="alert error">관리자만 쓸 수 있는 화면입니다.</div>;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setTemp(null);
    let res: any;
    const ok = await act.run(async () => (res = await api('/admin/staff', { method: 'POST', body: form })));
    if (ok) {
      setTemp({ name: res.staff.name, password: res.tempPassword });
      setForm({ email: '', name: '', role: 'STAFF' });
      list.reload();
    }
  }

  async function update(id: number, body: object, message: string) {
    if (await act.run(() => api(`/admin/staff/${id}`, { method: 'PATCH', body }), message)) list.reload();
  }

  async function reset(id: number, name: string) {
    if (!confirm(`${name}의 비밀번호를 리셋할까요? 지금 비밀번호는 더 이상 쓸 수 없습니다.`)) return;
    setTemp(null);
    let res: any;
    if (await act.run(async () => (res = await api(`/admin/staff/${id}/reset-password`, { method: 'POST' })))) {
      setTemp({ name, password: res.tempPassword });
      list.reload();
    }
  }

  return (
    <>
      <h1>직원 계정</h1>
      <p className="muted">직원은 회원가입이 없습니다. 여기서 만든 계정은 임시 비밀번호로 처음 로그인한 뒤 새 비밀번호로 바꿔야 합니다.</p>

      <div className="card">
        <h2>계정 만들기</h2>
        <form onSubmit={create} className="row">
          <label>이메일<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>이름<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>
            역할
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="STAFF">일반 직원 (강사·실장)</option>
              <option value="ADMIN">관리자 (원장)</option>
            </select>
          </label>
          <button className="primary" disabled={act.busy}>만들기</button>
        </form>
      </div>

      {temp && (
        <div className="alert warn">
          <b>{temp.name}</b>의 임시 비밀번호: <code style={{ fontSize: 16 }}>{temp.password}</code>
          <br />이 화면을 벗어나면 다시 볼 수 없습니다. 본인에게 직접 전해 주세요. (DB에는 알아볼 수 없는 해시로만 저장됩니다)
        </div>
      )}
      <ErrorBox error={act.error || list.error} />
      <OkBox message={act.ok} />
      <Loading loading={list.loading} />

      <div className="card table-wrap">
        <table>
          <thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {list.data?.map((s) => (
              <tr key={s.id}>
                <td>{s.name}{s.id === me.id && <span className="badge">나</span>}</td>
                <td>{s.email}</td>
                <td>
                  <select value={s.role} onChange={(e) => update(s.id, { role: e.target.value }, '역할을 바꿨습니다.')}>
                    <option value="STAFF">일반 직원</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </td>
                <td>
                  {s.isActive ? <span className="badge green">사용 중</span> : <span className="badge red">사용 중지</span>}
                  {s.mustChangePassword && <span className="badge">비밀번호 변경 대기</span>}
                </td>
                <td className="row">
                  <button onClick={() => update(s.id, { isActive: !s.isActive }, s.isActive ? '사용을 멈췄습니다.' : '다시 쓸 수 있게 했습니다.')}>
                    {s.isActive ? '사용 중지' : '다시 사용'}
                  </button>
                  <button className="danger" onClick={() => reset(s.id, s.name)}>비밀번호 리셋</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES } from '@/lib/api';

const empty = {
  name: '', birthDate: '', grade: 8, school: '', familyId: '', newFamilyName: '',
  contacts: [{ relation: '엄마', phone: '' }, { relation: '아빠', phone: '' }],
};

export default function StudentsPage() {
  const list = useLoad(() => api<any[]>('/admin/students'));
  const families = useLoad(() => api<any[]>('/admin/families'));
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState('');
  const act = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act.run(
      () =>
        api('/admin/students', {
          method: 'POST',
          body: {
            ...form,
            familyId: form.familyId ? Number(form.familyId) : undefined,
            newFamilyName: form.familyId ? undefined : form.newFamilyName || undefined,
            contacts: form.contacts.filter((c) => c.phone.trim()),
          },
        }),
      `${form.name} 학생을 등록했습니다.`,
    );
    if (ok) {
      setForm(empty);
      list.reload();
      families.reload();
    }
  }

  const rows = (list.data ?? []).filter((s) => !q || s.name.includes(q) || s.familyName.includes(q));

  return (
    <>
      <h1>학생</h1>
      <div className="card">
        <h2>학생 등록</h2>
        <form onSubmit={submit} className="row">
          <label>이름<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>생년월일<input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} required /></label>
          <label>
            학년
            <select value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}>
              {Object.entries(GRADES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>학교<input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} required /></label>
          <label>
            가족 (형제자매 묶기)
            <select value={form.familyId} onChange={(e) => setForm({ ...form, familyId: e.target.value })}>
              <option value="">새 가족 만들기</option>
              {families.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          {!form.familyId && (
            <label>새 가족 이름<input value={form.newFamilyName} placeholder={`${form.name || '학생'} 가족`} onChange={(e) => setForm({ ...form, newFamilyName: e.target.value })} /></label>
          )}
          {form.contacts.map((c, i) => (
            <label key={i}>
              보호자 연락처 ({c.relation})
              <input
                value={c.phone}
                placeholder="010-0000-0000"
                onChange={(e) => {
                  const contacts = [...form.contacts];
                  contacts[i] = { ...c, phone: e.target.value };
                  setForm({ ...form, contacts });
                }}
              />
            </label>
          ))}
          <button className="primary" disabled={act.busy}>등록</button>
        </form>
        <ErrorBox error={act.error} />
        <OkBox message={act.ok} />
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>학생 목록 ({rows.length}명)</h2>
          <input placeholder="이름·가족 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ErrorBox error={list.error} />
        <Loading loading={list.loading} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>이름</th><th>학년</th><th>학교</th><th>가족</th><th>다니는 반</th><th>보호자 연락처</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/students/${s.id}`}>{s.name}</Link></td>
                  <td>{GRADES[s.grade]}</td>
                  <td>{s.school}</td>
                  <td>{s.familyName}</td>
                  <td>{s.classes.join(', ') || <span className="muted">없음</span>}</td>
                  <td>{s.contacts.map((c: any) => `${c.relation} ${c.phone}`).join(' / ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

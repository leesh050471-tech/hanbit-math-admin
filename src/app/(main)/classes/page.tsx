'use client';

import Link from 'next/link';
import { useState } from 'react';
import ScheduleEditor, { Slot } from '@/components/ScheduleEditor';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES, scheduleText, won } from '@/lib/api';

const emptySlots: Slot[] = [
  { dayOfWeek: 1, startTime: '17:00', endTime: '18:30' },
  { dayOfWeek: 3, startTime: '17:00', endTime: '18:30' },
];

export default function ClassesPage() {
  const list = useLoad(() => api<any[]>('/admin/classes'));
  const teachers = useLoad(() => api<any[]>('/admin/teachers'));
  const [form, setForm] = useState({ name: '', targetGrade: 8, teacherId: '', capacity: 8, monthlyFee: 280000 });
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const act = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act.run(
      () => api('/admin/classes', { method: 'POST', body: { ...form, teacherId: Number(form.teacherId), schedules: slots } }),
      `${form.name} 반을 만들었습니다.`,
    );
    if (ok) {
      setForm({ ...form, name: '' });
      setSlots(emptySlots);
      list.reload();
    }
  }

  return (
    <>
      <h1>반·출결</h1>
      <div className="card table-wrap">
        <Loading loading={list.loading} />
        <ErrorBox error={list.error} />
        <table>
          <thead><tr><th>반</th><th>대상</th><th>강사</th><th>요일·시각</th><th>인원</th><th>월 수강료</th><th></th></tr></thead>
          <tbody>
            {list.data?.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/classes/${c.id}`}>{c.name}</Link>{!c.isActive && <span className="badge">운영 중지</span>}</td>
                <td>{GRADES[c.targetGrade]}</td>
                <td>{c.teacherName}</td>
                <td>{scheduleText(c.schedules)}</td>
                <td>
                  {c.enrolled}/{c.capacity}
                  {c.enrolled >= c.capacity && <span className="badge red">정원 참</span>}
                </td>
                <td>{won(c.monthlyFee)}</td>
                <td><Link href={`/classes/${c.id}`}>출결 →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>반 만들기</h2>
        <form onSubmit={submit}>
          <div className="row" style={{ marginBottom: 8 }}>
            <label>반 이름<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>
              대상 학년
              <select value={form.targetGrade} onChange={(e) => setForm({ ...form, targetGrade: Number(e.target.value) })}>
                {Object.entries(GRADES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>
              담당 강사
              <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required>
                <option value="">고르기</option>
                {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>정원<input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
            <label>월 수강료<input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })} /></label>
          </div>
          <ScheduleEditor value={slots} onChange={setSlots} />
          <p><button className="primary" disabled={act.busy}>만들기</button></p>
        </form>
        <ErrorBox error={act.error} />
        <OkBox message={act.ok} />
      </div>
    </>
  );
}

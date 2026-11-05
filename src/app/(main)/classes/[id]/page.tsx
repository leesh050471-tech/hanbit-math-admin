'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ScheduleEditor, { Slot } from '@/components/ScheduleEditor';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES, scheduleText, STATUS, today, won } from '@/lib/api';

export default function ClassDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const cls = useLoad(() => api(`/admin/classes/${id}`), [id]);
  const teachers = useLoad(() => api<any[]>('/admin/teachers'));
  const students = useLoad(() => api<any[]>('/admin/students'));
  const [date, setDate] = useState(today());
  const roster = useLoad(() => api(`/admin/classes/${id}/attendance?date=${date}`), [id, date]);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [edit, setEdit] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [enroll, setEnroll] = useState({ studentId: '', startDate: today() });
  const act = useAction();

  useEffect(() => {
    if (cls.data) {
      const c = cls.data;
      setEdit({ name: c.name, targetGrade: c.targetGrade, teacherId: c.teacherId, capacity: c.capacity, monthlyFee: c.monthlyFee, isActive: c.isActive });
      setSlots(c.schedules);
    }
  }, [cls.data]);

  useEffect(() => {
    const m: Record<number, string> = {};
    roster.data?.students.forEach((s: any) => (m[s.studentId] = s.status ?? 'PRESENT'));
    setMarks(m);
  }, [roster.data]);

  const c = cls.data;
  if (!c) return <><ErrorBox error={cls.error} /><Loading loading={cls.loading} /></>;

  async function saveAttendance() {
    const ok = await act.run(
      () =>
        api(`/admin/classes/${id}/attendance`, {
          method: 'PUT',
          body: { date, records: Object.entries(marks).map(([studentId, status]) => ({ studentId: Number(studentId), status })) },
        }),
      `${date} 출결을 저장했습니다.`,
    );
    if (ok) roster.reload();
  }

  return (
    <>
      <p><Link href="/classes">← 반 목록</Link></p>
      <h1>
        {c.name} <span className="muted">{GRADES[c.targetGrade]} · {c.teacherName} · {scheduleText(c.schedules)} · {c.enrolled}/{c.capacity}명 · {won(c.monthlyFee)}</span>
      </h1>
      <ErrorBox error={act.error} />
      <OkBox message={act.ok} />

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>출결</h2>
          <label>수업일<input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
        </div>
        <Loading loading={roster.loading} />
        <ErrorBox error={roster.error} />
        {roster.data && !roster.data.isClassDay && (
          <div className="alert warn">이 날은 수업 요일({roster.data.class.days.join(', ')})이 아닙니다. 저장하면 백엔드가 거절합니다.</div>
        )}
        {roster.data && (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>학생</th><th>출결</th><th></th></tr></thead>
                <tbody>
                  {roster.data.students.map((s: any) => (
                    <tr key={s.studentId}>
                      <td>{s.name}</td>
                      <td>
                        {Object.entries(STATUS).map(([v, l]) => (
                          <label key={v} style={{ display: 'inline-flex', flexDirection: 'row', gap: 4, marginRight: 12, color: 'inherit' }}>
                            <input type="radio" name={`a-${s.studentId}`} checked={marks[s.studentId] === v} onChange={() => setMarks({ ...marks, [s.studentId]: v })} />
                            {l}
                          </label>
                        ))}
                      </td>
                      <td>
                        {!s.status && <span className="badge">미기록</span>}
                        {s.hasMakeup && <span className="badge green">보강 잡힘</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {roster.data.students.length === 0 && <p className="muted">이 날 수강 중인 학생이 없습니다.</p>}
            {roster.data.makeupStudents.length > 0 && (
              <p className="muted">
                보강으로 오는 학생: {roster.data.makeupStudents.map((m: any) => `${m.name}(${m.fromClass} ${m.absentDate} 결석분)`).join(', ')}
              </p>
            )}
            <button className="primary" disabled={act.busy || roster.data.students.length === 0} onClick={saveAttendance}>
              출결 저장
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h2>수강생</h2>
        <div className="row" style={{ marginBottom: 12 }}>
          <label>
            학생 (학년이 다른 학생도 고를 수 있음 — 백엔드가 막는지 확인용)
            <select value={enroll.studentId} onChange={(e) => setEnroll({ ...enroll, studentId: e.target.value })}>
              <option value="">학생 고르기</option>
              {students.data?.map((s) => <option key={s.id} value={s.id}>{s.name} ({GRADES[s.grade]})</option>)}
            </select>
          </label>
          <label>시작일<input type="date" value={enroll.startDate} onChange={(e) => setEnroll({ ...enroll, startDate: e.target.value })} /></label>
          <button
            className="primary"
            disabled={act.busy || !enroll.studentId}
            onClick={async () =>
              (await act.run(
                () => api('/admin/enrollments', { method: 'POST', body: { studentId: Number(enroll.studentId), classId: id, startDate: enroll.startDate } }),
                '수강 신청했습니다.',
              )) && (cls.reload(), roster.reload())
            }
          >
            수강 신청
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>학생</th><th>학년</th><th>시작일</th><th>그만둔 날</th></tr></thead>
            <tbody>
              {c.enrollments.map((e: any) => (
                <tr key={e.id}>
                  <td><Link href={`/students/${e.studentId}`}>{e.studentName}</Link></td>
                  <td>{GRADES[e.grade]}</td>
                  <td>{e.startDate}</td>
                  <td>{e.endDate ?? <span className="badge green">수강 중</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <div className="card">
          <h2>반 정보 고치기</h2>
          <div className="row" style={{ marginBottom: 8 }}>
            <label>반 이름<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label>
              대상 학년
              <select value={edit.targetGrade} onChange={(e) => setEdit({ ...edit, targetGrade: Number(e.target.value) })}>
                {Object.entries(GRADES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>
              담당 강사
              <select value={edit.teacherId} onChange={(e) => setEdit({ ...edit, teacherId: Number(e.target.value) })}>
                {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>정원<input type="number" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: Number(e.target.value) })} /></label>
            <label>월 수강료<input type="number" value={edit.monthlyFee} onChange={(e) => setEdit({ ...edit, monthlyFee: Number(e.target.value) })} /></label>
            <label>
              운영
              <select value={String(edit.isActive)} onChange={(e) => setEdit({ ...edit, isActive: e.target.value === 'true' })}>
                <option value="true">운영 중</option>
                <option value="false">운영 중지</option>
              </select>
            </label>
          </div>
          <ScheduleEditor value={slots} onChange={setSlots} />
          <p>
            <button
              className="primary"
              disabled={act.busy}
              onClick={async () =>
                (await act.run(() => api(`/admin/classes/${id}`, { method: 'PATCH', body: { ...edit, schedules: slots } }), '반 정보를 저장했습니다.')) &&
                (cls.reload(), roster.reload())
              }
            >
              저장
            </button>
          </p>
        </div>
      )}
    </>
  );
}

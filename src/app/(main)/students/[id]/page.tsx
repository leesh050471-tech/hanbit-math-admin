'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES, today, won } from '@/lib/api';

export default function StudentDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const st = useLoad(() => api(`/admin/students/${id}`), [id]);
  const families = useLoad(() => api<any[]>('/admin/families'));
  const classes = useLoad(() => api<any[]>('/admin/classes'));

  const [edit, setEdit] = useState({ grade: 8, school: '', familyId: 0 });
  const [contact, setContact] = useState({ relation: '', phone: '' });
  const [enroll, setEnroll] = useState({ classId: '', startDate: today() });
  const [endDates, setEndDates] = useState<Record<number, string>>({});
  const act = useAction();

  useEffect(() => {
    if (st.data) setEdit({ grade: st.data.grade, school: st.data.school, familyId: st.data.familyId });
  }, [st.data]);

  const s = st.data;
  if (!s) return <><ErrorBox error={st.error} /><Loading loading={st.loading} /></>;

  return (
    <>
      <p><Link href="/students">← 학생 목록</Link></p>
      <h1>{s.name} <span className="muted">{GRADES[s.grade]} · {s.school} · {s.birthDate}</span></h1>
      <ErrorBox error={act.error} />
      <OkBox message={act.ok} />

      <div className="grid2">
        <div className="card">
          <h2>기본 정보</h2>
          <div className="row">
            <label>
              학년
              <select value={edit.grade} onChange={(e) => setEdit({ ...edit, grade: Number(e.target.value) })}>
                {Object.entries(GRADES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>학교<input value={edit.school} onChange={(e) => setEdit({ ...edit, school: e.target.value })} /></label>
            <label>
              가족
              <select value={edit.familyId} onChange={(e) => setEdit({ ...edit, familyId: Number(e.target.value) })}>
                {families.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            <button
              disabled={act.busy}
              onClick={async () => (await act.run(() => api(`/admin/students/${id}`, { method: 'PATCH', body: edit }), '저장했습니다.')) && st.reload()}
            >
              저장
            </button>
          </div>
          <p className="muted">
            같은 가족 형제자매: {s.siblings.length ? s.siblings.map((x: any) => `${x.name}(${GRADES[x.grade]})`).join(', ') : '없음'}
          </p>
        </div>

        <div className="card">
          <h2>보호자 연락처</h2>
          <ul>
            {s.contacts.map((c: any) => (
              <li key={c.id}>
                {c.relation} {c.phone}{' '}
                <button
                  className="danger"
                  onClick={async () => (await act.run(() => api(`/admin/contacts/${c.id}`, { method: 'DELETE' }))) && st.reload()}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <div className="row">
            <label>관계<input value={contact.relation} placeholder="엄마" onChange={(e) => setContact({ ...contact, relation: e.target.value })} /></label>
            <label>번호<input value={contact.phone} placeholder="010-0000-0000" onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></label>
            <button
              onClick={async () => {
                if (await act.run(() => api(`/admin/students/${id}/contacts`, { method: 'POST', body: contact }), '연락처를 더했습니다.')) {
                  setContact({ relation: '', phone: '' });
                  st.reload();
                }
              }}
            >
              추가
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>수강</h2>
        <div className="row" style={{ marginBottom: 12 }}>
          <label>
            반
            <select value={enroll.classId} onChange={(e) => setEnroll({ ...enroll, classId: e.target.value })}>
              <option value="">반 고르기</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({GRADES[c.targetGrade]}, {c.enrolled}/{c.capacity}명)
                </option>
              ))}
            </select>
          </label>
          <label>시작일<input type="date" value={enroll.startDate} onChange={(e) => setEnroll({ ...enroll, startDate: e.target.value })} /></label>
          <button
            className="primary"
            disabled={act.busy || !enroll.classId}
            onClick={async () =>
              (await act.run(
                () => api('/admin/enrollments', { method: 'POST', body: { studentId: id, classId: Number(enroll.classId), startDate: enroll.startDate } }),
                '수강 신청했습니다.',
              )) && st.reload()
            }
          >
            수강 신청
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>반</th><th>시작일</th><th>그만둔 날</th><th></th></tr></thead>
            <tbody>
              {s.enrollments.map((e: any) => (
                <tr key={e.id}>
                  <td><Link href={`/classes/${e.classId}`}>{e.className}</Link></td>
                  <td>{e.startDate}</td>
                  <td>{e.endDate ?? <span className="badge green">수강 중</span>}</td>
                  <td>
                    {!e.endDate && (
                      <span className="row">
                        <input type="date" value={endDates[e.id] ?? today()} onChange={(ev) => setEndDates({ ...endDates, [e.id]: ev.target.value })} />
                        <button
                          className="danger"
                          onClick={async () =>
                            (await act.run(
                              () => api(`/admin/enrollments/${e.id}/end`, { method: 'POST', body: { endDate: endDates[e.id] ?? today() } }),
                              '그만둔 날을 기록했습니다.',
                            )) && st.reload()
                          }
                        >
                          그만두기
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>수강료 납부 기록</h2>
        {s.payments.length === 0 && <p className="muted">없습니다.</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>월</th><th>반</th><th>납부일</th><th>낸 금액</th></tr></thead>
            <tbody>
              {s.payments.map((p: any) => (
                <tr key={p.id}><td>{p.month}</td><td>{p.className}</td><td>{p.paidAt}</td><td>{won(p.paidAmount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

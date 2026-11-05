'use client';

import { useEffect, useState } from 'react';
import { ErrorBox, Loading, MonthPicker, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES, thisMonth } from '@/lib/api';

/** 보강: 결석 하나에 다른 반 수업일 하나. 그날 그 반 인원(수강생 + 보강)이 정원을 넘으면 안 된다. */
export default function MakeupsPage() {
  const [month, setMonth] = useState(thisMonth());
  const candidates = useLoad(() => api<any[]>(`/admin/makeups/candidates?month=${month}`), [month]);
  const list = useLoad(() => api<any[]>(`/admin/makeups?month=${month}`), [month]);
  const [absenceId, setAbsenceId] = useState('');
  const [option, setOption] = useState('');
  const options = useLoad(
    () => (absenceId ? api(`/admin/makeups/options/${absenceId}`) : Promise.resolve(null)),
    [absenceId],
  );
  const act = useAction();

  // 현황 화면의 "보강 잡기"에서 넘어온 결석
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('absenceId');
    if (id) setAbsenceId(id);
  }, []);

  async function create() {
    const [targetClassId, makeupDate] = option.split('|');
    const ok = await act.run(
      () => api('/admin/makeups', { method: 'POST', body: { absenceId: Number(absenceId), targetClassId: Number(targetClassId), makeupDate } }),
      '보강을 잡았습니다.',
    );
    if (ok) {
      setAbsenceId('');
      setOption('');
      candidates.reload();
      list.reload();
    }
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>보강</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>
      <p className="muted">규정: 한 달 결석 2회 이상이면 보강 1회, 보강은 결석한 달 안에만. 같은 학년의 다른 반 수업에 들어갑니다.</p>

      <div className="card">
        <h2>보강 잡기</h2>
        <div className="row">
          <label>
            결석 (보강 없는 것)
            <select value={absenceId} onChange={(e) => { setAbsenceId(e.target.value); setOption(''); }}>
              <option value="">결석 고르기</option>
              {candidates.data?.map((a) => (
                <option key={a.absenceId} value={a.absenceId}>
                  {a.absentDate} {a.studentName}({GRADES[a.grade]}) · {a.className}
                </option>
              ))}
            </select>
          </label>
          {options.data && (
            <label>
              들어갈 수업 (꽉 찬 수업도 고를 수 있음 — 백엔드가 막는지 확인용)
              <select value={option} onChange={(e) => setOption(e.target.value)}>
                <option value="">수업 고르기</option>
                {options.data.options.map((o: any) => (
                  <option key={`${o.classId}|${o.date}`} value={`${o.classId}|${o.date}`}>
                    {o.date}({o.day}) {o.className} · {o.headcount}/{o.capacity}명{o.full ? ' · 꽉 참' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="primary" disabled={act.busy || !absenceId || !option} onClick={create}>보강 잡기</button>
        </div>
        {options.data?.options.length === 0 && <p className="muted">같은 학년의 다른 반이 없습니다.</p>}
        <ErrorBox error={act.error || options.error} />
        <OkBox message={act.ok} />
      </div>

      <div className="card">
        <h2>잡힌 보강 <span className="muted">결석한 달 기준</span></h2>
        <Loading loading={list.loading} />
        {list.data?.length === 0 && <p className="muted">없습니다.</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>학생</th><th>결석</th><th>보강</th><th>잡은 사람</th><th></th></tr></thead>
            <tbody>
              {list.data?.map((m) => (
                <tr key={m.id}>
                  <td>{m.studentName}</td>
                  <td>{m.absentDate} {m.fromClass}</td>
                  <td>{m.makeupDate} {m.targetClass}</td>
                  <td>{m.createdBy ?? '-'}</td>
                  <td>
                    <button
                      className="danger"
                      onClick={async () => (await act.run(() => api(`/admin/makeups/${m.id}`, { method: 'DELETE' }), '보강을 지웠습니다.')) && (list.reload(), candidates.reload())}
                    >
                      지우기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ErrorBox, Loading, MonthPicker, useLoad } from '@/components/ui';
import { api, GRADES, thisMonth, won } from '@/lib/api';

/** 현황 (C1 출석률, C2 보강 대상, C3 미납) */
export default function DashboardPage() {
  const [month, setMonth] = useState(thisMonth());
  const att = useLoad(() => api<any[]>(`/admin/reports/attendance?month=${month}`), [month]);
  const need = useLoad(() => api<any[]>(`/admin/reports/makeup-needed?month=${month}`), [month]);
  const unpaid = useLoad(() => api<any[]>(`/admin/reports/unpaid?month=${month}`), [month]);

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>현황</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="card">
        <h2>보강이 필요한 학생 <span className="muted">결석 2회 이상, 보강 없음</span></h2>
        <ErrorBox error={need.error} />
        <Loading loading={need.loading} />
        {need.data?.length === 0 && <p className="muted">없습니다.</p>}
        {!!need.data?.length && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>학생</th><th>학년</th><th>결석</th><th>결석한 수업</th><th></th></tr></thead>
              <tbody>
                {need.data.map((s) => (
                  <tr key={s.studentId}>
                    <td><Link href={`/students/${s.studentId}`}>{s.name}</Link></td>
                    <td>{GRADES[s.grade]}</td>
                    <td>{s.absentCount}회</td>
                    <td>{s.absences.map((a: any) => `${a.date.slice(5)} ${a.className}`).join(', ')}</td>
                    <td><Link href={`/makeups?absenceId=${s.absences[0].absenceId}`}>보강 잡기 →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>수강료 미납 <span className="muted">형제 할인 반영 금액</span></h2>
        <ErrorBox error={unpaid.error} />
        <Loading loading={unpaid.loading} />
        {unpaid.data?.length === 0 && <p className="muted">없습니다.</p>}
        {!!unpaid.data?.length && (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>학생</th><th>가족</th><th>반</th><th>형제 순서</th><th>월 수강료</th><th>낼 금액</th></tr></thead>
                <tbody>
                  {unpaid.data.map((r) => (
                    <tr key={`${r.studentId}-${r.classId}`}>
                      <td><Link href={`/students/${r.studentId}`}>{r.studentName}</Link></td>
                      <td>{r.familyName}</td>
                      <td>{r.className}</td>
                      <td>{r.siblingOrder >= 2 ? <span className="badge green">{r.siblingOrder}째 · 10% 할인</span> : '첫째'}</td>
                      <td>{won(r.monthlyFee)}</td>
                      <td><b>{won(r.amountDue)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              합계 {won(unpaid.data.reduce((n, r) => n + r.amountDue, 0))} · <Link href="/payments">수강료 화면에서 납부 기록하기 →</Link>
            </p>
          </>
        )}
      </div>

      <div className="card">
        <h2>학생별 출석률 <span className="muted">지각 3번 = 결석 1번</span></h2>
        <ErrorBox error={att.error} />
        <Loading loading={att.loading} />
        {att.data?.length === 0 && <p className="muted">이 달 출결 기록이 없습니다.</p>}
        {!!att.data?.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>학생</th><th>학년</th><th>수업</th><th>출석</th><th>지각</th><th>결석</th><th>환산 결석</th><th>출석률</th></tr>
              </thead>
              <tbody>
                {att.data.map((r) => (
                  <tr key={r.studentId}>
                    <td><Link href={`/students/${r.studentId}`}>{r.name}</Link></td>
                    <td>{GRADES[r.grade]}</td>
                    <td>{r.total}</td>
                    <td>{r.present}</td>
                    <td>{r.late}</td>
                    <td>{r.absent}</td>
                    <td>{r.convertedAbsent}</td>
                    <td><b>{r.rate == null ? '-' : `${r.rate}%`}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

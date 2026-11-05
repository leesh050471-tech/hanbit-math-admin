'use client';

import { useState } from 'react';
import { ErrorBox, Loading, MonthPicker, useLoad } from '@/components/ui';
import { api, thisMonth, won } from '@/lib/api';

/** D5 그만둔 학생의 환불 금액 (규정 기준) */
export default function RefundsPage() {
  const [month, setMonth] = useState(thisMonth());
  const list = useLoad(() => api<any[]>(`/admin/reports/refunds?month=${month}`), [month]);

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>환불 계산</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>
      <div className="card">
        <b>환불 규정</b>: 수업 시작 전 전액 · 1/3 지나기 전 2/3 · 1/2 지나기 전 1/2 · 그 뒤 환불 없음
        <p className="muted">
          그만둔 달의 수업 횟수 중 그만둔 날 전까지 지난 수업 수로 비율을 정합니다. 기준 금액은 그 달 실제로 낸 금액입니다. 이 금액은 저장하지 않고 매번 계산합니다.
        </p>
      </div>
      <ErrorBox error={list.error} />
      <Loading loading={list.loading} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>학생</th><th>반</th><th>시작일</th><th>그만둔 날</th><th>지난 수업</th><th>적용 규정</th><th>그 달 낸 금액</th><th>환불</th></tr></thead>
          <tbody>
            {list.data?.map((r) => (
              <tr key={r.enrollmentId}>
                <td>{r.studentName}</td>
                <td>{r.className}</td>
                <td>{r.startDate}</td>
                <td>{r.endDate}</td>
                <td>{r.sessionsPassed}/{r.sessionsTotal}회</td>
                <td>{r.rule}</td>
                <td>{won(r.paidAmount)}</td>
                <td><b>{won(r.refund)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.length === 0 && <p className="muted">이 달에 그만둔 학생이 없습니다.</p>}
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ErrorBox, Loading, MonthPicker, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES, thisMonth, today, won } from '@/lib/api';

/** 수강료: 학생·반·달마다 납부 기록. 행이 있으면 납부, 없으면 미납 */
export default function PaymentsPage() {
  const [month, setMonth] = useState(thisMonth());
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const list = useLoad(() => api<any[]>(`/admin/payments?month=${month}`), [month]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const act = useAction();

  const rows = (list.data ?? []).filter((r) => !unpaidOnly || !r.paid);
  const key = (r: any) => `${r.studentId}-${r.classId}`;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>수강료</h1>
        <div className="row">
          <label style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" checked={unpaidOnly} onChange={(e) => setUnpaidOnly(e.target.checked)} /> 미납만
          </label>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
      </div>
      <p className="muted">낼 금액 = 월 수강료, 형제는 생년월일 순으로 둘째부터 10% 할인 (저장하지 않고 매번 계산). 낸 금액은 사실이므로 저장합니다.</p>
      <ErrorBox error={act.error || list.error} />
      <OkBox message={act.ok} />
      <Loading loading={list.loading} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>학생</th><th>가족</th><th>반</th><th>형제</th><th>낼 금액</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={key(r)}>
                <td><Link href={`/students/${r.studentId}`}>{r.studentName}</Link> <span className="muted">{GRADES[r.grade]}</span></td>
                <td>{r.familyName}</td>
                <td>{r.className}</td>
                <td>{r.siblingOrder >= 2 ? <span className="badge green">{r.siblingOrder}째 -10%</span> : '-'}</td>
                <td>{won(r.amountDue)}</td>
                <td>
                  {r.paid ? <span className="badge green">납부 {r.paidAt} · {won(r.paidAmount)}</span> : <span className="badge red">미납</span>}
                </td>
                <td>
                  {r.paid ? (
                    <button
                      className="danger"
                      onClick={async () => (await act.run(() => api(`/admin/payments/${r.paymentId}`, { method: 'DELETE' }), '납부 기록을 지웠습니다.')) && list.reload()}
                    >
                      납부 취소
                    </button>
                  ) : (
                    <span className="row">
                      <input
                        type="number"
                        style={{ width: 110 }}
                        value={amounts[key(r)] ?? r.amountDue}
                        onChange={(e) => setAmounts({ ...amounts, [key(r)]: Number(e.target.value) })}
                      />
                      <button
                        className="primary"
                        disabled={act.busy}
                        onClick={async () =>
                          (await act.run(
                            () =>
                              api('/admin/payments', {
                                method: 'POST',
                                body: { studentId: r.studentId, classId: r.classId, month, paidAt: today(), paidAmount: amounts[key(r)] ?? r.amountDue },
                              }),
                            `${r.studentName} ${month} 납부를 기록했습니다.`,
                          )) && list.reload()
                        }
                      >
                        납부 기록
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !list.loading && <p className="muted">없습니다.</p>}
      </div>
    </>
  );
}

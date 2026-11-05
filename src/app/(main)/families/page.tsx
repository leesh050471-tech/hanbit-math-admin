'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ErrorBox, Loading, OkBox, useAction, useLoad } from '@/components/ui';
import { api, GRADES } from '@/lib/api';

/** 가족 = 형제 할인의 단위. 학생을 다른 가족으로 옮기는 건 학생 상세 화면에서 */
export default function FamiliesPage() {
  const list = useLoad(() => api<any[]>('/admin/families'));
  const [name, setName] = useState('');
  const act = useAction();

  return (
    <>
      <h1>가족</h1>
      <p className="muted">형제자매는 같은 가족으로 묶습니다. 같은 가족에서 그 달 수강하는 학생을 생년월일 순으로 세어, 둘째부터 수강료 10% 할인.</p>
      <div className="card row">
        <label>새 가족 이름<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <button
          className="primary"
          disabled={act.busy || !name}
          onClick={async () => {
            if (await act.run(() => api('/admin/families', { method: 'POST', body: { name } }), '가족을 만들었습니다.')) {
              setName('');
              list.reload();
            }
          }}
        >
          만들기
        </button>
      </div>
      <ErrorBox error={act.error || list.error} />
      <OkBox message={act.ok} />
      <Loading loading={list.loading} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>가족</th><th>학생 (생년월일 순)</th><th>학부모 계정</th></tr></thead>
          <tbody>
            {list.data?.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>
                  {f.students.map((s: any, i: number) => (
                    <span key={s.id}>
                      {i > 0 && ', '}
                      <Link href={`/students/${s.id}`}>{s.name}</Link> ({GRADES[s.grade]})
                    </span>
                  ))}
                  {f.students.length >= 2 && <span className="badge green">형제</span>}
                </td>
                <td>{f.parents?.map((p: any) => p.email).join(', ') ?? <span className="muted">없음</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

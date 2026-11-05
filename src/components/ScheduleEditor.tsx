'use client';

import { DAYS } from '@/lib/api';

export type Slot = { dayOfWeek: number; startTime: string; endTime: string };

/** 반의 수업 요일·시각 (여러 줄) */
export default function ScheduleEditor({ value, onChange }: { value: Slot[]; onChange: (v: Slot[]) => void }) {
  const set = (i: number, patch: Partial<Slot>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div>
      {value.map((s, i) => (
        <div className="row" key={i} style={{ marginBottom: 6 }}>
          <select value={s.dayOfWeek} onChange={(e) => set(i, { dayOfWeek: Number(e.target.value) })}>
            {DAYS.map((d, n) => <option key={n} value={n}>{d}요일</option>)}
          </select>
          <input type="time" value={s.startTime} onChange={(e) => set(i, { startTime: e.target.value })} />
          ~
          <input type="time" value={s.endTime} onChange={(e) => set(i, { endTime: e.target.value })} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>빼기</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { dayOfWeek: 1, startTime: '17:00', endTime: '18:30' }])}>
        + 요일 추가
      </button>
    </div>
  );
}

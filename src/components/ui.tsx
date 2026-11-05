'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';

/** 거절 이유를 쉬운 말로 보여 준다. 어디서 막았는지(백엔드 / DB)도 함께 표시 */
export function ErrorBox({ error }: { error: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  // 거절되면 메시지가 보이도록 화면을 옮긴다
  useEffect(() => {
    if (error) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);
  if (!error) return null;
  const e = error as ApiError;
  return (
    <div className="alert error" role="alert" ref={ref}>
      {e.message}
      {e.source === 'database' && <span className="badge db">DB가 거절</span>}
      {e.source === 'backend' && <span className="badge">백엔드가 거절</span>}
    </div>
  );
}

export function OkBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="alert ok">{message}</div>;
}

/** 불러오기 + 다시 불러오기 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}

/** 버튼 동작: 실행 중 표시, 성공 메시지, 실패 이유 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);
  async function run(fn: () => Promise<unknown>, okMessage?: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await fn();
      if (okMessage) setOk(okMessage);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, ok, run, setError, setOk };
}

export function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label>
      월
      <input type="month" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />
    </label>
  );
}

export function Loading({ loading }: { loading: boolean }) {
  return loading ? <p className="muted">불러오는 중...</p> : null;
}

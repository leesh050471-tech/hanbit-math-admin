// 백엔드 호출. DB 주소나 API 키는 여기 없다 — 백엔드 주소와 로그인 토큰만 쓴다.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'hanbit_admin_token';

export class ApiError extends Error {
  constructor(message: string, public status: number, public source?: string) {
    super(message);
  }
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string | null) {
  try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch {}
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다. (무료 서버는 처음 깨어나는 데 1분쯤 걸릴 수 있어요)', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message ?? '요청을 처리하지 못했습니다.';
    if (typeof window !== 'undefined') {
      if (res.status === 401 && !location.pathname.startsWith('/login')) {
        setToken(null);
        location.href = '/login';
      } else if (res.status === 403 && String(message).includes('임시 비밀번호') && location.pathname !== '/change-password') {
        location.href = '/change-password';
      }
    }
    throw new ApiError(message, res.status, data.source);
  }
  return data as T;
}

export const GRADES: Record<number, string> = { 7: '중1', 8: '중2', 9: '중3', 10: '고1', 11: '고2', 12: '고3' };
export const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
export const STATUS: Record<string, string> = { PRESENT: '출석', LATE: '지각', ABSENT: '결석' };

export const won = (n?: number | null) => (n == null ? '-' : `${n.toLocaleString('ko-KR')}원`);
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}
export const thisMonth = () => today().slice(0, 7);
export function scheduleText(s: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  return s.map((x) => `${DAYS[x.dayOfWeek]} ${x.startTime}~${x.endTime}`).join(', ');
}

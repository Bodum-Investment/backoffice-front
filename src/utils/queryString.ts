/**
 * 파라미터 객체를 쿼리스트링으로 변환한다.
 * undefined 또는 빈 문자열 값은 제외된다.
 */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

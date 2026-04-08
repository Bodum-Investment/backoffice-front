import type { AssetType, TradeType, TradeSource, UserStatus, EventStatus } from '@/types/common';

/** ISO 8601 -> "2026.04.08 09:00" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 숫자 -> "1,234,567" */
export function formatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num == null) return '0';
  return Number(num).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 숫자 -> "1,234,567원" */
export function formatKRW(amount: number | null | undefined): string {
  if (amount == null) return '0원';
  return Number(amount).toLocaleString('ko-KR') + '원';
}

/** 수익률 -> "+12.34%" */
export function formatPercent(rate: number | null | undefined): string {
  if (rate == null) return '0%';
  const num = Number(rate);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
}

/** 수량 (암호화폐: 최대 8자리, 주식: 정수) */
export function formatQuantity(qty: number | null | undefined, assetType: AssetType): string {
  if (qty == null) return '0';
  const decimals = assetType === 'CRYPTO' ? 8 : 0;
  return Number(qty).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** 한글 변환 맵 */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  DELETED: '삭제',
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  UPCOMING: '예정',
  ONGOING: '진행중',
  ENDED: '종료',
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  CRYPTO: '암호화폐',
  STOCK: '주식',
};

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  BUY: '매수',
  SELL: '매도',
};

export const TRADE_SOURCE_LABEL: Record<TradeSource, string> = {
  MANUAL: '수동',
  BOT: '자동',
};

/** ISO 8601 -> datetime-local 입력값 ("2026-04-08T09:00") */
export function toDatetimeLocalValue(isoStr: string): string {
  const d = new Date(isoStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** 수익률 색상 클래스 (양수: red, 음수: blue, 0: 기본) */
export function profitColorClass(rate: number | null | undefined): string {
  if (rate == null || rate === 0) return '';
  return rate > 0 ? 'text-profit-positive' : 'text-profit-negative';
}

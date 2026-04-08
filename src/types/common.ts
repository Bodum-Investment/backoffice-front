export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';
export type AssetType = 'CRYPTO' | 'STOCK';
export type TradeType = 'BUY' | 'SELL';
export type TradeSource = 'MANUAL' | 'BOT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

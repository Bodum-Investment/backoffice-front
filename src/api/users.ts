import { get, patch } from './client';
import type { PageResponse } from '@/types/common';
import type {
  UserListResponse,
  UserDetailResponse,
  UserPortfolioResponse,
  UserTradeHistoryResponse,
} from '@/types/user';
import { toQueryString } from '@/utils/queryString';

interface GetUsersParams {
  email?: string;
  nickname?: string;
  status?: string;
  page?: number;
  size?: number;
}

interface GetUserTradesParams {
  assetType?: string;
  tradeSource?: string;
  page?: number;
  size?: number;
}

export const getUsers = (params: GetUsersParams = {}): Promise<PageResponse<UserListResponse>> =>
  get<PageResponse<UserListResponse>>(
    `/api/admin/users${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const getUser = (userId: number): Promise<UserDetailResponse> =>
  get<UserDetailResponse>(`/api/admin/users/${userId}`);

export const getUserPortfolio = (userId: number): Promise<UserPortfolioResponse> =>
  get<UserPortfolioResponse>(`/api/admin/users/${userId}/portfolio`);

export const getUserTrades = (
  userId: number,
  params: GetUserTradesParams = {},
): Promise<PageResponse<UserTradeHistoryResponse>> =>
  get<PageResponse<UserTradeHistoryResponse>>(
    `/api/admin/users/${userId}/trades${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const suspendUser = (userId: number, reason: string): Promise<void> =>
  patch<void>(`/api/admin/users/${userId}/suspend`, { reason });

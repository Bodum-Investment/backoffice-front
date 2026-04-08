import { get } from './client';
import type { PageResponse } from '@/types/common';
import type { AdminActionLogResponse } from '@/types/actionLog';

interface GetActionLogsParams {
  adminUserId?: number;
  actionType?: string;
  page?: number;
  size?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const getActionLogs = (
  params: GetActionLogsParams = {},
): Promise<PageResponse<AdminActionLogResponse>> =>
  get<PageResponse<AdminActionLogResponse>>(
    `/api/admin/action-logs${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

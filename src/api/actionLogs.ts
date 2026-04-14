import { get } from './client';
import type { PageResponse } from '@/types/common';
import type { AdminActionLogResponse } from '@/types/actionLog';
import { toQueryString } from '@/utils/queryString';

interface GetActionLogsParams {
  adminUserId?: number;
  actionType?: string;
  page?: number;
  size?: number;
}

export const getActionLogs = (
  params: GetActionLogsParams = {},
): Promise<PageResponse<AdminActionLogResponse>> =>
  get<PageResponse<AdminActionLogResponse>>(
    `/api/admin/action-logs${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

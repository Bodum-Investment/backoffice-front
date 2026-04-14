import { get, post, put, del } from './client';
import type { PageResponse } from '@/types/common';
import type { NoticeResponse, NoticeCreateRequest, NoticeUpdateRequest } from '@/types/notice';
import { toQueryString } from '@/utils/queryString';

interface GetNoticesParams {
  page?: number;
  size?: number;
}

export const getNotices = (params: GetNoticesParams = {}): Promise<PageResponse<NoticeResponse>> =>
  get<PageResponse<NoticeResponse>>(
    `/api/admin/notices${toQueryString({ page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const getNotice = (noticeId: number): Promise<NoticeResponse> =>
  get<NoticeResponse>(`/api/admin/notices/${noticeId}`);

export const createNotice = (data: NoticeCreateRequest): Promise<NoticeResponse> =>
  post<NoticeResponse>('/api/admin/notices', data);

export const updateNotice = (noticeId: number, data: NoticeUpdateRequest): Promise<NoticeResponse> =>
  put<NoticeResponse>(`/api/admin/notices/${noticeId}`, data);

export const deleteNotice = (noticeId: number): Promise<void> =>
  del(`/api/admin/notices/${noticeId}`);

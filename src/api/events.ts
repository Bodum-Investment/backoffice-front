import { get, post, put, del } from './client';
import type { PageResponse } from '@/types/common';
import type { EventResponse, EventCreateRequest, EventUpdateRequest } from '@/types/event';
import { toQueryString } from '@/utils/queryString';

interface GetEventsParams {
  status?: string;
  page?: number;
  size?: number;
}

export const getEvents = (params: GetEventsParams = {}): Promise<PageResponse<EventResponse>> =>
  get<PageResponse<EventResponse>>(
    `/api/admin/events${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const getEvent = (eventId: number): Promise<EventResponse> =>
  get<EventResponse>(`/api/admin/events/${eventId}`);

export const createEvent = (data: EventCreateRequest): Promise<EventResponse> =>
  post<EventResponse>('/api/admin/events', data);

export const updateEvent = (eventId: number, data: EventUpdateRequest): Promise<EventResponse> =>
  put<EventResponse>(`/api/admin/events/${eventId}`, data);

export const deleteEvent = (eventId: number): Promise<void> =>
  del(`/api/admin/events/${eventId}`);

import { get, post, put, del } from './client';
import type { PageResponse } from '@/types/common';
import type { EventResponse, EventCreateRequest, EventUpdateRequest } from '@/types/event';

interface GetEventsParams {
  status?: string;
  page?: number;
  size?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
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

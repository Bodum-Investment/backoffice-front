import type { EventStatus } from './common';

export interface EventResponse {
  id: number;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  status: EventStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateRequest {
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

export interface EventUpdateRequest {
  title?: string;
  content?: string;
  startAt?: string;
  endAt?: string;
  isActive?: boolean;
}

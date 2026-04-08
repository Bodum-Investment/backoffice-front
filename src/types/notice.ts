export interface NoticeResponse {
  id: number;
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeCreateRequest {
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
}

export interface NoticeUpdateRequest {
  title?: string;
  content?: string;
  isPublished?: boolean;
  isPinned?: boolean;
}

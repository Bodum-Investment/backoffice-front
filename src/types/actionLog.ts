export interface AdminActionLogResponse {
  id: number;
  adminUserId: number;
  actionType: string;
  targetType: string;
  targetId: number;
  detail: string | null;
  createdAt: string;
}

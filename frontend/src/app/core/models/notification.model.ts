export type NotificationType =
  | 'service_request_submitted'
  | 'quote_received'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'service_started'
  | 'service_completed'
  | 'review_received'
  | 'review_reminder'
  | 'shop_verified'
  | 'shop_rejected'
  | 'system_notification';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface NotificationResponse {
  notification: Notification;
}

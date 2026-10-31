import type { NotificationItemType } from "@shared/types";
import { http } from "@/lib/http";

export const notificationApiRequest = {
  getAll: () => http.get<NotificationItemType[]>("/notifications"),
  markRead: (id: number) =>
    http.patch<NotificationItemType>(`/notifications/${id}/read`, {}),
  markAllRead: () =>
    http.patch<{ message: string }>("/notifications/read-all", {}),
  delete: (id: number) =>
    http.delete<{ message: string }>(`/notifications/${id}`),
};

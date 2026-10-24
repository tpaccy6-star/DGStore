import { apiClient } from './client';

export type AdminStats = { revenue: number; totalOrders: number; customers: number; byStatus: Record<string, number> };
export type AdminOrderItem = { productId: number; name: string; price: number; quantity: number; image?: string };
export type AdminOrder = { id: string; status: string; total: number; customerName: string | null; customerEmail: string | null; createdAt: string; items?: AdminOrderItem[]; deliveryAddress?: string; paymentMethod?: string };
export type AdminProduct = { id: number; name: string; category: string; price: number; oldPrice: number | null; image: string; color: string; description: string | null; stock: number; isActive: boolean; createdAt: string };
export type AdminCustomer = { id: number; name: string; email: string; ordersCount: number; totalSpend: number; lastActiveAt: string | null; createdAt: string };
export type AdminNotification = { id: number; type: string; title: string; message: string; data: string | null; isRead: boolean; createdAt: string };
export type AdminNotificationsResponse = { unreadCount: number; notifications: AdminNotification[] };

export async function getAdminStats(): Promise<AdminStats> { return (await apiClient.get<AdminStats>('/admin/stats')).data; }
export async function getAdminOrders(): Promise<AdminOrder[]> { return (await apiClient.get<AdminOrder[]>('/admin/orders')).data; }
export async function updateAdminOrderStatus(id: string, status: string): Promise<void> { await apiClient.patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status }); }
export async function getAdminProducts(): Promise<AdminProduct[]> { return (await apiClient.get<AdminProduct[]>('/admin/products')).data; }
export async function createAdminProduct(input: { name: string; category: string; price: number; image: string; stock: number }): Promise<AdminProduct> { return (await apiClient.post<AdminProduct>('/admin/products', input)).data; }
export async function updateAdminProduct(id: number, input: Partial<{ name: string; category: string; price: number; oldPrice: number | null; image: string; color: string; description: string; stock: number }>): Promise<AdminProduct> { return (await apiClient.patch<AdminProduct>(`/admin/products/${id}`, input)).data; }
export async function deleteAdminProduct(id: number): Promise<void> { await apiClient.delete(`/admin/products/${id}`); }
export async function getAdminCustomers(): Promise<AdminCustomer[]> { return (await apiClient.get<AdminCustomer[]>('/admin/customers')).data; }
export async function getAdminNotifications(): Promise<AdminNotificationsResponse> { return (await apiClient.get<AdminNotificationsResponse>('/admin/notifications')).data; }
export async function markAdminNotificationRead(id: number): Promise<void> { await apiClient.patch(`/admin/notifications/${id}/read`); }
export async function markAllAdminNotificationsRead(): Promise<void> { await apiClient.patch('/admin/notifications/read-all'); }

export type WhatsAppSettings = {
  phone: string;
  apiKey: string;
  webhookUrl: string;
  ntfyTopic?: string;
  enabled: boolean;
};

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  return (await apiClient.get<WhatsAppSettings>('/admin/settings/whatsapp')).data;
}

export async function updateWhatsAppSettings(input: {
  phone?: string;
  apiKey?: string;
  webhookUrl?: string;
  ntfyTopic?: string;
}): Promise<WhatsAppSettings> {
  return (await apiClient.post<WhatsAppSettings>('/admin/settings/whatsapp', input)).data;
}

export async function testWhatsAppNotification(input?: {
  phone?: string;
  apiKey?: string;
  webhookUrl?: string;
  ntfyTopic?: string;
}): Promise<{ message: string; success: boolean }> {
  return (await apiClient.post<{ message: string; success: boolean }>('/admin/settings/whatsapp/test', input || {})).data;
}

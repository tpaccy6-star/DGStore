import { apiClient } from './client';

export type AdminStats = { revenue: number; totalOrders: number; customers: number; byStatus: Record<string, number> };
export type AdminOrderItem = { productId: number; name: string; price: number; quantity: number; image?: string };
export type AdminOrder = { id: string; status: string; total: number; customerName: string | null; customerEmail: string | null; createdAt: string; items?: AdminOrderItem[]; deliveryAddress?: string; paymentMethod?: string };
export type AdminProduct = { id: number; name: string; category: string; price: number; oldPrice: number | null; image: string; color: string; description: string | null; stock: number; isActive: boolean; createdAt: string };
export type AdminCustomer = { id: number; name: string; email: string; ordersCount: number; totalSpend: number; lastActiveAt: string | null; createdAt: string };

export async function getAdminStats(): Promise<AdminStats> { return (await apiClient.get<AdminStats>('/admin/stats')).data; }
export async function getAdminOrders(): Promise<AdminOrder[]> { return (await apiClient.get<AdminOrder[]>('/admin/orders')).data; }
export async function updateAdminOrderStatus(id: string, status: string): Promise<void> { await apiClient.patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status }); }
export async function getAdminProducts(): Promise<AdminProduct[]> { return (await apiClient.get<AdminProduct[]>('/admin/products')).data; }
export async function createAdminProduct(input: { name: string; category: string; price: number; image: string; stock: number }): Promise<AdminProduct> { return (await apiClient.post<AdminProduct>('/admin/products', input)).data; }
export async function updateAdminProduct(id: number, input: Partial<{ name: string; category: string; price: number; oldPrice: number | null; image: string; color: string; description: string; stock: number }>): Promise<AdminProduct> { return (await apiClient.patch<AdminProduct>(`/admin/products/${id}`, input)).data; }
export async function deleteAdminProduct(id: number): Promise<void> { await apiClient.delete(`/admin/products/${id}`); }
export async function getAdminCustomers(): Promise<AdminCustomer[]> { return (await apiClient.get<AdminCustomer[]>('/admin/customers')).data; }

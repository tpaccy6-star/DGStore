import { apiClient } from './client';

export type OrderItem = { productId: number; name: string; price: number; quantity: number; image?: string | null };
export type OrderResponse = { id: string; status: string; total: number; trackingNumber: string | null; createdAt: string; deliveryAddress?: string | null; paymentMethod?: string | null; items?: OrderItem[] };
export async function createOrder(input: {
  items: Array<{ productId: number; quantity: number }>;
  deliveryAddress: string;
  paymentMethod: 'momo' | 'airtel' | 'card';
  promoCode?: string;
  paymentDetails?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>('/orders', input);
  return response.data;
}
export async function getOrders(): Promise<OrderResponse[]> { const response = await apiClient.get<OrderResponse[]>('/orders'); return response.data; }

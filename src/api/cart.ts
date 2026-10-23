import { apiClient } from './client';

export type ServerCartItem = { productId: number; quantity: number; name: string; price: number; image: string; stock: number };
export type CartResponse = { cart: Record<string, number>; items: ServerCartItem[] };
export async function syncCart(cart: Record<string, number>): Promise<CartResponse> { const response = await apiClient.post<CartResponse>('/cart', { cart }); return response.data; }
export async function getCart(): Promise<CartResponse> { const response = await apiClient.get<CartResponse>('/cart'); return response.data; }

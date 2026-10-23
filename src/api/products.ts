import { apiClient } from './client';

export type Product = { id: number; name: string; category: string; price: number; oldPrice: number | null; rating: number; reviews: number; image: string; color: string; description: string | null; stock: number; isActive: boolean; createdAt: string };
export async function getProducts(params?: { search?: string; category?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/products', { params });
  return response.data;
}

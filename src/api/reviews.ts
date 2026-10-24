import { apiClient } from './client';

export interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getProductReviews(productId: number | string): Promise<Review[]> {
  const response = await apiClient.get<Review[]>(`/products/${productId}/reviews`);
  return response.data;
}

export async function submitProductReview(
  productId: number | string,
  input: { rating: number; comment: string },
): Promise<Review[]> {
  const response = await apiClient.post<Review[]>(`/products/${productId}/reviews`, input);
  return response.data;
}

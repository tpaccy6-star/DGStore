import { apiClient } from './client';

export type ApiUser = { id: number; name: string; email: string; username: string | null; role: string };
export type AuthResponse = { token: string; user: ApiUser };

export async function login(input: { email?: string; username?: string; password: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', input);
  return response.data;
}

export async function register(input: { name: string; email: string; password: string; username?: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', input);
  return response.data;
}

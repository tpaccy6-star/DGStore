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

export async function updateProfile(input: { name: string }): Promise<{ user: ApiUser }> {
  const response = await apiClient.patch<{ user: ApiUser }>('/auth/profile', input);
  return response.data;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/change-password', input);
  return response.data;
}

export async function forgotPassword(input: { identifier: string }): Promise<{ message: string; code?: string; email?: string }> {
  const response = await apiClient.post<{ message: string; code?: string; email?: string }>('/auth/forgot-password', input);
  return response.data;
}

export async function resetPassword(input: { email: string; code: string; newPassword: string }): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/reset-password', input);
  return response.data;
}

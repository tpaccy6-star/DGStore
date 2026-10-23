import axios from 'axios';

export let API_BASE_URL = 'http://10.0.2.2:3001';
export const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });

export function updateApiBaseUrl(newUrl: string): void {
  if (!newUrl) return;
  let normalized = newUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `http://${normalized}`;
  }
  API_BASE_URL = normalized;
  apiClient.defaults.baseURL = normalized;
}

export function setApiToken(token: string | null): void {
  if (token) apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete apiClient.defaults.headers.common.Authorization;
}

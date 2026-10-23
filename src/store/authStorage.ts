import * as Keychain from 'react-native-keychain';
import type { ApiUser, AuthResponse } from '../api/auth';

const SERVICE = 'com.dgstore.auth';
type StoredAuth = AuthResponse;

export async function getStoredAuth(): Promise<StoredAuth | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  if (!credentials) return null;
  try { return JSON.parse(credentials.password) as StoredAuth; } catch { return null; }
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  await Keychain.setGenericPassword('auth', JSON.stringify(auth), { service: SERVICE });
}

export async function clearAuth(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

export type StoredUser = ApiUser;

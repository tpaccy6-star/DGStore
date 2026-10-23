import * as Keychain from 'react-native-keychain';
import { updateApiBaseUrl, API_BASE_URL } from '../api/client';

const SERVER_SERVICE = 'com.dgstore.server_config';

export async function getSavedServerUrl(): Promise<string> {
  try {
    const creds = await Keychain.getGenericPassword({ service: SERVER_SERVICE });
    if (creds && creds.password) {
      updateApiBaseUrl(creds.password);
      return creds.password;
    }
  } catch {
    // Return default on error
  }
  return API_BASE_URL;
}

export async function saveServerUrl(url: string): Promise<void> {
  try {
    let clean = url.trim();
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    await Keychain.setGenericPassword('server_url', clean, { service: SERVER_SERVICE });
    updateApiBaseUrl(clean);
  } catch {
    // Silently continue
  }
}

import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.dgstore.delivery-address';

export async function getSavedDeliveryAddress(): Promise<string> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  if (!credentials) return '';
  return credentials.password;
}

export async function saveDeliveryAddress(address: string): Promise<void> {
  const trimmed = address.trim();
  if (!trimmed) {
    await Keychain.resetGenericPassword({ service: SERVICE });
    return;
  }
  await Keychain.setGenericPassword('delivery-address', trimmed, { service: SERVICE });
}

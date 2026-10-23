import * as Keychain from 'react-native-keychain';

const PAYMENT_SERVICE = 'com.dgstore.payment';

export type SavedPaymentInfo = {
  momoPhone?: string;
  airtelPhone?: string;
  bankName?: string;
  bankAccount?: string;
  preferredMethod?: 'momo' | 'airtel' | 'card';
};

export async function getSavedPaymentInfo(): Promise<SavedPaymentInfo | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: PAYMENT_SERVICE });
    if (credentials && credentials.password) {
      return JSON.parse(credentials.password) as SavedPaymentInfo;
    }
  } catch {
    // Return null on failure
  }
  return null;
}

export async function savePaymentInfo(info: SavedPaymentInfo): Promise<void> {
  try {
    await Keychain.setGenericPassword('payment_info', JSON.stringify(info), {
      service: PAYMENT_SERVICE,
    });
  } catch {
    // Silently continue
  }
}

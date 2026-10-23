import * as Keychain from 'react-native-keychain';
import { getSavedPaymentInfo, savePaymentInfo } from '../src/store/paymentStorage';

describe('paymentStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves payment info to keychain', async () => {
    const payment = {
      preferredMethod: 'momo' as const,
      momoPhone: '0788123456',
      airtelPhone: '0733123456',
      bankName: 'Bank of Kigali',
      bankAccount: '4002012345678901',
    };

    await savePaymentInfo(payment);

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'payment_info',
      JSON.stringify(payment),
      { service: 'com.dgstore.payment' },
    );
  });

  it('retrieves saved payment info from keychain', async () => {
    const payment = {
      preferredMethod: 'airtel' as const,
      momoPhone: '0788999888',
      airtelPhone: '0733111222',
      bankName: 'I&M Bank',
      bankAccount: '123456789',
    };

    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      password: JSON.stringify(payment),
    });

    const result = await getSavedPaymentInfo();
    expect(result).toEqual(payment);
  });

  it('returns null when no payment info is found', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);

    const result = await getSavedPaymentInfo();
    expect(result).toBeNull();
  });
});

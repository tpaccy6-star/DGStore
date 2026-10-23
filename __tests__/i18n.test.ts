import * as Keychain from 'react-native-keychain';
import i18n, { changeLanguage, formatRwf, supportedLanguages } from '../src/i18n';

describe('i18n', () => {
  it('exposes the supported languages', () => {
    expect(supportedLanguages).toEqual(['en', 'fr', 'rw']);
  });

  it('changes language and persists the selection', async () => {
    await changeLanguage('fr');

    expect(i18n.language).toBe('fr');
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith('language', 'fr', { service: 'com.dgstore.language' });
  });

  it('formats RWF amounts for the active locale', async () => {
    await changeLanguage('en');
    expect(formatRwf(48500)).toContain('48,500');
    await changeLanguage('fr');
    expect(formatRwf(48500)).toContain('48');
  });
});

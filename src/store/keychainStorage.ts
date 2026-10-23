import * as Keychain from 'react-native-keychain';
import type { Storage } from 'redux-persist';

const SERVICE = 'com.dgstore.persisted-state';

export const keychainStorage: Storage = {
  getItem: async key => {
    const credentials = await Keychain.getGenericPassword({ service: `${SERVICE}.${key}` });
    return credentials ? credentials.password : null;
  },
  setItem: async (key, value) => {
    await Keychain.setGenericPassword('dgstore', value, { service: `${SERVICE}.${key}` });
  },
  removeItem: async key => {
    await Keychain.resetGenericPassword({ service: `${SERVICE}.${key}` });
  },
};

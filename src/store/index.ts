import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import cartReducer from './cartSlice';
import authReducer from './authSlice';
import { keychainStorage } from './keychainStorage';

const rootReducer = combineReducers({ auth: authReducer, cart: cartReducer });
const persistedReducer = persistReducer(
  { key: 'root', storage: keychainStorage, timeout: 0, whitelist: ['cart'] },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

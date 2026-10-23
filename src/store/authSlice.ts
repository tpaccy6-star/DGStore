import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ApiUser, AuthResponse } from '../api/auth';

type AuthState = { token: string | null; user: ApiUser | null; hydrated: boolean };
const initialState: AuthState = { token: null, user: null, hydrated: false };

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<AuthResponse>) => { state.token = action.payload.token; state.user = action.payload.user; state.hydrated = true; },
    setHydrated: state => { state.hydrated = true; },
    clearAuthState: state => { state.token = null; state.user = null; state.hydrated = true; },
  },
});

export const { setAuth, setHydrated, clearAuthState } = authSlice.actions;
export default authSlice.reducer;

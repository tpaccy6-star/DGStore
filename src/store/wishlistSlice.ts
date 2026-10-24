import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../api/products';

export interface WishlistState {
  items: Product[];
}

const initialState: WishlistState = {
  items: [],
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const existsIndex = state.items.findIndex(item => item.id === action.payload.id);
      if (existsIndex >= 0) {
        state.items.splice(existsIndex, 1);
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearWishlist: state => {
      state.items = [];
    },
  },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

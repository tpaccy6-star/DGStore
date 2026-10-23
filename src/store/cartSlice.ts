import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type CartItem = {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  stock?: number;
};

type CartState = { items: CartItem[] };

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(item => item.productId === action.payload.productId);
      if (existing) {
        const nextQty = existing.quantity + action.payload.quantity;
        const maxStock = action.payload.stock ?? existing.stock;
        existing.quantity = maxStock ? Math.min(nextQty, maxStock) : nextQty;
        if (action.payload.name) existing.name = action.payload.name;
        if (action.payload.price !== undefined) existing.price = action.payload.price;
        if (action.payload.image) existing.image = action.payload.image;
        if (action.payload.stock !== undefined) existing.stock = action.payload.stock;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find(entry => entry.productId === action.payload.productId);
      if (item) item.quantity = Math.max(0, action.payload.quantity);
      state.items = state.items.filter(entry => entry.quantity > 0);
    },
    clearCart: state => {
      state.items = [];
    },
    replaceItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, replaceItems } = cartSlice.actions;
export default cartSlice.reducer;

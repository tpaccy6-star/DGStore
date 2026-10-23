import cartReducer, { addItem, removeItem } from '../src/store/cartSlice';

describe('cart slice', () => {
  it('adds and merges cart items', () => {
    const first = cartReducer(undefined, addItem({ productId: 'p1', quantity: 1 }));
    const second = cartReducer(first, addItem({ productId: 'p1', quantity: 2 }));
    expect(second.items).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

  it('removes a cart item', () => {
    const state = { items: [{ productId: 'p1', quantity: 1 }] };
    expect(cartReducer(state, removeItem('p1')).items).toEqual([]);
  });
});

import type { Product } from '../api/products';
import type { OrderResponse } from '../api/orders';

export type RootStackParamList = {
  Home: undefined;
  Login: { redirectTo?: 'Checkout' } | undefined;
  Register: { redirectTo?: 'Checkout' } | undefined;
  Products: undefined;
  ProductDetails: { product: Product };
  Cart: undefined;
  Wishlist: undefined;
  Checkout: undefined;
  Orders: undefined;
  OrderDetails: { order: OrderResponse };
  Profile: undefined;
  Admin: { initialSection?: 'Overview' | 'Orders' | 'Notifications' | 'Products' | 'Customers' } | undefined;
};

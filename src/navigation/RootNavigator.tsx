import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { useI18n } from '../i18n';
import { useAppDispatch, useAppSelector } from '../store';
import { setHydrated, setAuth } from '../store/authSlice';
import { getStoredAuth } from '../store/authStorage';
import { setApiToken } from '../api/client';
import type { RootStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const i18n = useI18n(); const dispatch = useAppDispatch(); const { hydrated, user } = useAppSelector(state => state.auth);
  useEffect(() => { getStoredAuth().then(auth => { if (auth) { setApiToken(auth.token); dispatch(setAuth(auth)); } else dispatch(setHydrated()); }).catch(() => dispatch(setHydrated())); }, [dispatch]);
  if (!hydrated) return <View style={styles.loading}><Text>{i18n.t('loading')}</Text></View>;
  return <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'fade' }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Products" component={ProductsScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    {user ? <><Stack.Screen name="Orders" component={OrdersScreen} /><Stack.Screen name="OrderDetails" component={OrderDetailsScreen} /><Stack.Screen name="Profile" component={ProfileScreen} />{user.role === 'owner' ? <Stack.Screen name="Admin" component={AdminScreen} /> : null}</> : null}
  </Stack.Navigator>;
}

const styles = StyleSheet.create({ loading: { alignItems: 'center', flex: 1, justifyContent: 'center' } });

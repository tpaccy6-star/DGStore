import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getOrders, type OrderResponse } from '../api/orders';
import { formatRwf, useI18n } from '../i18n';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { StoreHeader } from '../components/StoreHeader';
import { BottomNav } from '../components/BottomNav';
import { colors, spacing } from '../theme';

export function OrdersScreen(): React.JSX.Element {
  const i18n = useI18n(); const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); const [orders, setOrders] = useState<OrderResponse[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(false); const network = await NetInfo.fetch(); if (!network.isConnected) { setOffline(true); setLoading(false); return; } setOffline(false); try { setOrders(await getOrders()); } catch { setError(true); } finally { setLoading(false); } }, []);
  useEffect(() => { load().catch(() => { setError(true); setLoading(false); }); }, [load]);
  if (loading) return <View style={styles.center}><StoreHeader title="Orders" /><ActivityIndicator color={colors.accent} /><Text>{i18n.t('loading')}</Text></View>;
  if (offline) return <View style={styles.center}><StoreHeader title="Orders" /><Text>{i18n.t('offlineMessage')}</Text></View>;
  if (error) return <View style={styles.center}><StoreHeader title="Orders" /><Text>{i18n.t('ordersError')}</Text><Pressable onPress={() => { load().catch(() => undefined); }} style={styles.button}><Text style={styles.buttonText}>{i18n.t('retryButton')}</Text></Pressable></View>;
  return <View style={styles.screen}><StoreHeader title="Orders" /><FlatList contentContainerStyle={styles.container} data={orders} keyExtractor={item => item.id} ListHeaderComponent={<Text style={styles.title}>{i18n.t('ordersTitle')}</Text>} ListEmptyComponent={<Text>{i18n.t('ordersEmpty')}</Text>} renderItem={({ item }) => <Pressable onPress={() => navigation.navigate('OrderDetails', { order: item })} style={styles.card}><View style={styles.cardRow}>{item.items?.[0]?.image ? <Image source={{ uri: item.items[0].image }} style={styles.thumbnail} /> : <View style={styles.thumbnailPlaceholder}><Text style={styles.placeholderText}>D&G</Text></View>}<View style={styles.cardBody}><View style={styles.cardTop}><Text style={styles.id}>{item.id}</Text><Text style={styles.total}>{formatRwf(item.total)}</Text></View><Text style={styles.status}>{i18n.t('orderStatus', { status: item.status })}</Text><Text style={styles.muted}>{i18n.t('orderTracking', { tracking: item.trackingNumber ?? '-' })}</Text></View></View></Pressable>} /><BottomNav active="Orders" signedIn /></View>;
}

const styles = StyleSheet.create({ button: { backgroundColor: colors.ink, borderRadius: 8, marginTop: 12, paddingHorizontal: 18, paddingVertical: 12 }, buttonText: { color: colors.white, fontWeight: '700' }, card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 8, borderWidth: 1, marginBottom: 10, padding: 14 }, cardBody: { flex: 1, marginLeft: 12 }, cardRow: { flexDirection: 'row' }, cardTop: { flexDirection: 'row', justifyContent: 'space-between' }, center: { alignItems: 'center', backgroundColor: colors.paper, flex: 1, gap: 8, justifyContent: 'center', padding: spacing.page }, container: { padding: spacing.page, paddingBottom: 110 }, id: { color: colors.ink, fontSize: 15, fontWeight: '700' }, muted: { color: colors.muted, fontSize: 12 }, placeholderText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, screen: { backgroundColor: colors.paper, flex: 1 }, status: { color: colors.green, fontSize: 12, fontWeight: '700', marginTop: 6 }, thumbnail: { backgroundColor: colors.cream, borderRadius: 7, height: 65, width: 65 }, thumbnailPlaceholder: { alignItems: 'center', backgroundColor: colors.cream, borderRadius: 7, height: 65, justifyContent: 'center', width: 65 }, title: { color: colors.ink, fontSize: 27, fontWeight: '700', letterSpacing: -1, marginBottom: 14 }, total: { color: colors.ink, fontSize: 15, fontWeight: '800' } });

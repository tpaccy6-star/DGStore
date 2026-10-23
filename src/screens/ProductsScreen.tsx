import NetInfo from '@react-native-community/netinfo';
import { ChevronDown, ChevronUp, Filter, Heart, Search, Star } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getProducts, type Product } from '../api/products';
import { BottomNav } from '../components/BottomNav';
import { StoreHeader } from '../components/StoreHeader';
import { formatRwf, useI18n } from '../i18n';
import { useAppSelector } from '../store';
import { useAppDispatch } from '../store';
import { addItem, updateQuantity } from '../store/cartSlice';
import { colors, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const categories = ['All', 'Shoes', 'Bags', 'Tech', 'Fashion', 'Accessories'];

export function ProductsScreen(): React.JSX.Element {
  const i18n = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(state => state.auth.user);
  const cartItems = useAppSelector(state => state.cart.items);
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hasLoaded = useRef(false);
  const load = useCallback(async () => { const background = hasLoaded.current; if (background) setRefreshing(true); else setLoading(true); setError(false); const network = await NetInfo.fetch(); if (!network.isConnected) { setOffline(true); setLoading(false); setRefreshing(false); hasLoaded.current = true; return; } setOffline(false); try { setProducts(await getProducts({ search: search.trim(), category: category === 'All' ? '' : category })); } catch { setError(true); } finally { setLoading(false); setRefreshing(false); hasLoaded.current = true; } }, [category, search]);
  useEffect(() => { const timer = setTimeout(() => { load().catch(() => { setError(true); setLoading(false); setRefreshing(false); }); }, 300); return () => clearTimeout(timer); }, [load]);
  const renderProduct = ({ item }: { item: Product }) => { const quantity = cartItems.find(entry => entry.productId === String(item.id))?.quantity ?? 0; const changeQuantity = (nextQuantity: number) => { if (nextQuantity <= 0) dispatch(updateQuantity({ productId: String(item.id), quantity: 0 })); else dispatch(addItem({ productId: String(item.id), quantity: nextQuantity - quantity, name: item.name, price: item.price, image: item.image, stock: item.stock })); }; return <Pressable onPress={() => navigation.navigate('ProductDetails', { product: item })} style={styles.card}><View style={styles.imageWrap}><Image source={{ uri: item.image }} style={styles.image} />{item.oldPrice ? <Text style={styles.sale}>SALE</Text> : null}<Heart color={colors.ink} fill="transparent" size={20} strokeWidth={1.7} style={styles.heart} /></View><Text style={styles.name} numberOfLines={1}>{item.name}</Text><View style={styles.meta}><Text style={styles.metaText}>{item.category}</Text><Text style={styles.metaText}>·</Text><Star color={colors.accent} fill={colors.accent} size={11} /><Text style={styles.metaText}>{item.rating.toFixed(1)}</Text></View><Text style={styles.price}>{formatRwf(item.price)}</Text><View style={styles.quantityControls}><Pressable accessibilityLabel={`Remove one ${item.name}`} onPress={event => { event.stopPropagation(); changeQuantity(quantity - 1); }} style={styles.quantityButton}><Text style={styles.quantityButtonText}>−</Text></Pressable><Text style={styles.quantity}>{quantity}</Text><Pressable accessibilityLabel={`Add one ${item.name}`} disabled={quantity >= item.stock} onPress={event => { event.stopPropagation(); changeQuantity(quantity + 1); }} style={styles.quantityButton}><Text style={styles.quantityButtonText}>+</Text></Pressable></View></Pressable>; };
  if (loading) return <View style={styles.center}><StoreHeader title="Shop" /><ActivityIndicator color={colors.accent} /><Text>{i18n.t('loading')}</Text></View>;
  if ((offline || error) && products.length === 0) return <View style={styles.center}><StoreHeader title="Shop" /><Text>{offline ? i18n.t('offlineMessage') : i18n.t('productsError')}</Text><Pressable onPress={() => load().catch(() => undefined)} style={styles.button}><Text style={styles.buttonText}>{i18n.t('retryButton')}</Text></Pressable><BottomNav active="Products" signedIn={Boolean(user)} /></View>;
  return <View style={styles.screen}><StoreHeader title="Shop" /><FlatList contentContainerStyle={styles.content} data={products} numColumns={2} columnWrapperStyle={styles.columns} keyExtractor={item => String(item.id)} ListHeaderComponent={<><Text style={styles.title}>Discover products</Text><Text style={styles.subtitle}>Find something made for your everyday.</Text><View style={styles.search}><Search color={colors.muted} size={19} strokeWidth={1.8} /><TextInput value={search} onChangeText={setSearch} placeholder="Search products" placeholderTextColor={colors.muted} style={styles.searchInput} /></View><View style={styles.categoryHeader}><Text style={styles.categoryHeaderLabel}>Filter by Category</Text><Pressable onPress={() => setDropdownOpen(c => !c)} style={styles.dropdownBtn}><Filter color={colors.goldDark} size={14} /><Text style={styles.dropdownBtnText}>{category}</Text>{dropdownOpen ? <ChevronUp color={colors.ink} size={14} /> : <ChevronDown color={colors.muted} size={14} />}</Pressable></View>{dropdownOpen && <View style={styles.dropdownMenuBox}>{categories.map(item => <Pressable key={item} onPress={() => { setCategory(item); setDropdownOpen(false); }} style={[styles.dropdownRow, category === item && styles.dropdownRowActive]}><Text style={[styles.dropdownRowText, category === item && styles.dropdownRowTextActive]}>{item}</Text>{category === item && <Text style={styles.checkMark}>✓</Text>}</Pressable>)}</View>}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{categories.map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></Pressable>)}</ScrollView>{refreshing ? <Text style={styles.updating}>Updating products...</Text> : null}{offline ? <Text style={styles.notice}>{i18n.t('offlineMessage')}</Text> : null}{error ? <Text style={styles.notice}>{i18n.t('productsError')}</Text> : null}</>} ListEmptyComponent={<Text style={styles.empty}>{i18n.t('productsEmpty')}</Text>} renderItem={renderProduct} /><BottomNav active="Products" signedIn={Boolean(user)} /></View>;
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.ink, borderRadius: 8, marginTop: 18, paddingHorizontal: 20, paddingVertical: 13 },
  buttonText: { color: colors.white, fontWeight: '700' },
  card: { marginBottom: 22, width: '48%' },
  categories: { flexDirection: 'row', gap: 7, marginBottom: 20 },
  category: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 6, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  categoryActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  categoryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  categoryHeaderLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  categoryText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  categoryTextActive: { color: colors.white },
  checkMark: { color: colors.goldDark, fontSize: 14, fontWeight: '800' },
  dropdownBtn: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.line, borderRadius: 6, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  dropdownBtnText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  dropdownMenuBox: { backgroundColor: colors.card, borderColor: colors.goldMuted, borderRadius: 8, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  dropdownRow: { alignItems: 'center', borderBottomColor: colors.lineLight, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  dropdownRowActive: { backgroundColor: colors.goldLight },
  dropdownRowText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  dropdownRowTextActive: { color: colors.goldDark, fontWeight: '800' },
  center: { alignItems: 'center', backgroundColor: colors.paper, flex: 1, gap: 8, justifyContent: 'center', padding: spacing.page },
  columns: { justifyContent: 'space-between' },
  content: { paddingBottom: 110, paddingHorizontal: spacing.page, paddingTop: 25 },
  empty: { color: colors.muted, paddingVertical: 30 },
  heart: { position: 'absolute', right: 8, top: 8 },
  image: { height: 185, width: '100%' },
  imageWrap: { backgroundColor: colors.cream, height: 185, overflow: 'hidden', position: 'relative' },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 4 },
  metaText: { color: colors.muted, fontSize: 10 },
  name: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 9 },
  price: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 5 },
  quantity: { color: colors.ink, fontSize: 12, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  quantityButton: { alignItems: 'center', borderColor: colors.line, borderRadius: 5, borderWidth: 1, height: 27, justifyContent: 'center', width: 28 },
  quantityButtonText: { color: colors.ink, fontSize: 17, lineHeight: 20 },
  quantityControls: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 10 },
  sale: { backgroundColor: colors.ink, color: colors.white, fontSize: 8, fontWeight: '700', left: 8, paddingHorizontal: 6, paddingVertical: 4, position: 'absolute', top: 8 },
  screen: { backgroundColor: colors.paper, flex: 1 },
  search: { alignItems: 'center', backgroundColor: '#F0EEE7', borderRadius: 9, flexDirection: 'row', height: 48, marginBottom: 18, marginTop: 22, paddingHorizontal: 14 },
  searchIcon: { color: colors.muted, fontSize: 22, marginRight: 8 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 13 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 6 },
  notice: { color: colors.danger, fontSize: 11, marginTop: 10 },
  updating: { color: colors.muted, fontSize: 11, marginTop: 10 },
  title: { color: colors.ink, fontSize: 27, fontWeight: '700', letterSpacing: -1 },
});

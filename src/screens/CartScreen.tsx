import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowRight,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react-native';
import { getCart, syncCart, type ServerCartItem } from '../api/cart';
import { formatRwf, useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { replaceItems, updateQuantity, type CartItem } from '../store/cartSlice';
import { StoreHeader } from '../components/StoreHeader';
import { cardShadow, colors, spacing } from '../theme';

function cartItemsMatch(left: CartItem[], right: CartItem[]): boolean {
  if (left.length !== right.length) return false;
  return left.every(item => {
    const matching = right.find(entry => entry.productId === item.productId);
    return (
      matching?.quantity === item.quantity &&
      matching.name === item.name &&
      matching.price === item.price &&
      matching.stock === item.stock
    );
  });
}

export function CartScreen(): React.JSX.Element {
  const i18n = useI18n();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const localItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user);

  const [items, setItems] = useState<ServerCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(false);
    setOffline(false);
    if (!user) {
      setItems(
        localItems.map(item => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          name: item.name ?? 'Product',
          price: item.price ?? 0,
          image: item.image ?? '',
          stock: item.stock ?? 0,
        })),
      );
      setLoading(false);
      return;
    }
    const network = await NetInfo.fetch();
    if (!network.isConnected) {
      setOffline(true);
      setLoading(false);
      return;
    }
    try {
      const cart = Object.fromEntries(localItems.map(item => [item.productId, item.quantity]));
      const response = await syncCart(cart);
      const details = await getCart();
      setItems(details.items);
      const nextItems = response.items.map(item => ({
        productId: String(item.productId),
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image,
        stock: item.stock,
      }));
      if (!cartItemsMatch(localItems, nextItems)) {
        dispatch(replaceItems(nextItems));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [dispatch, localItems, user]);

  useEffect(() => {
    sync().catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [sync]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function changeQuantity(item: ServerCartItem, quantity: number): void {
    const nextQuantity = Math.max(0, Math.min(quantity, item.stock));
    setItems(current =>
      current.flatMap(entry =>
        entry.productId === item.productId && nextQuantity === 0
          ? []
          : entry.productId === item.productId
          ? [{ ...entry, quantity: nextQuantity }]
          : [entry],
      ),
    );
    dispatch(updateQuantity({ productId: String(item.productId), quantity: nextQuantity }));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <StoreHeader title="Your Bag" showBack />
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
      </View>
    );
  }

  if (offline) {
    return (
      <View style={styles.center}>
        <StoreHeader title="Your Bag" showBack />
        <Text style={styles.errorText}>{i18n.t('offlineMessage')}</Text>
        <Text style={styles.muted}>
          {i18n.t('cartLocalMessage', { count: localItems.length })}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <StoreHeader title="Your Bag" showBack />
        <Text style={styles.errorText}>{i18n.t('cartError')}</Text>
        <Pressable
          onPress={() => {
            sync().catch(() => undefined);
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>{i18n.t('retryButton')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StoreHeader title="Your Bag" showBack />

      <FlatList
        contentContainerStyle={styles.container}
        data={items}
        keyExtractor={item => String(item.productId)}
        ListEmptyComponent={
          <View style={[styles.emptyBox, cardShadow]}>
            <View style={styles.emptyIconBox}>
              <ShoppingBag color={colors.goldDark} size={36} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Your shopping bag is empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore high-quality shoes, bags, tech and fashion made for Rwanda.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Products')}
              style={styles.discoverButton}
            >
              <Text style={styles.discoverButtonText}>Discover Products  →</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footerWrap}>
              {/* Add More Items Button */}
              <Pressable
                accessibilityLabel="Add more products to cart"
                accessibilityRole="button"
                onPress={() => navigation.navigate('Products')}
                style={[styles.addMoreButton, cardShadow]}
              >
                <Plus color={colors.goldDark} size={18} strokeWidth={2.4} />
                <Text style={styles.addMoreButtonText}>+ Add More Items to Bag</Text>
              </Pressable>

              {/* Pricing Breakdown Card */}
              <View style={[styles.summaryCard, cardShadow]}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Total Items ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                  </Text>
                  <Text style={styles.summaryValue}>{formatRwf(total)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery (Rwanda)</Text>
                  <Text style={[styles.summaryValue, { color: colors.green }]}>Calculated at checkout</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{formatRwf(total)}</Text>
                </View>
              </View>

              {/* Checkout Button */}
              <Pressable
                accessibilityLabel="Proceed to checkout"
                accessibilityRole="button"
                onPress={() => navigation.navigate('Checkout')}
                style={styles.checkoutButton}
              >
                <Text style={styles.checkoutButtonText}>
                  Proceed to Checkout ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                </Text>
                <ArrowRight color={colors.white} size={18} />
              </Pressable>
            </View>
          ) : null
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Your Shopping Bag</Text>
                <Text style={styles.subtitle}>
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} ready for checkout
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Products')}
                style={styles.addMoreHeaderBtn}
              >
                <Plus color={colors.goldDark} size={14} />
                <Text style={styles.addMoreHeaderBtnText}>Add items</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, cardShadow]}>
            <View style={styles.itemRow}>
              {item.image ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: item.image }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.placeholderText}>D&G</Text>
                </View>
              )}

              <View style={styles.itemContent}>
                <View style={styles.itemTop}>
                  <Text numberOfLines={1} style={styles.name}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatRwf(item.price * item.quantity)}
                  </Text>
                </View>

                <Text style={styles.unitPrice}>
                  {formatRwf(item.price)} each
                </Text>

                <View style={styles.controls}>
                  {/* Stepper for Multiple Choosing */}
                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityLabel={i18n.t('decreaseQuantity')}
                      onPress={() => changeQuantity(item, item.quantity - 1)}
                      style={styles.stepperBtn}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </Pressable>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <Pressable
                      accessibilityLabel={i18n.t('increaseQuantity')}
                      disabled={item.quantity >= item.stock}
                      onPress={() => changeQuantity(item, item.quantity + 1)}
                      style={[
                        styles.stepperBtn,
                        item.quantity >= item.stock && styles.stepperDisabled,
                      ]}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityLabel={i18n.t('removeItem')}
                    hitSlop={8}
                    onPress={() => changeQuantity(item, 0)}
                    style={styles.removeBtn}
                  >
                    <Trash2 color={colors.danger} size={15} />
                    <Text style={styles.removeText}>{i18n.t('removeItem')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addMoreButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.gold,
    borderRadius: spacing.radiusSm,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
  },
  addMoreButtonText: {
    color: colors.goldDark,
    fontSize: 13,
    fontWeight: '800',
  },
  addMoreHeaderBtn: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addMoreHeaderBtnText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  center: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.page,
  },
  checkoutButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  container: {
    padding: spacing.page,
    paddingBottom: 60,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  discoverButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 24,
  },
  discoverButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.radius,
    marginVertical: 40,
    padding: 30,
  },
  emptyIconBox: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    marginBottom: 16,
    width: 72,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  footerWrap: {
    marginTop: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemPrice: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 10,
  },
  muted: {
    color: colors.muted,
    marginTop: 6,
  },
  name: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },
  placeholderText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '900',
  },
  productImage: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    height: 84,
    width: 84,
  },
  productImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 8,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  quantityText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  removeText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 2,
  },
  stepperBtn: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepperBtnText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  stepperDisabled: {
    opacity: 0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    padding: 14,
  },
  summaryDivider: {
    backgroundColor: colors.lineLight,
    height: 1,
    marginVertical: 10,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  totalAmount: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  totalLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitPrice: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});

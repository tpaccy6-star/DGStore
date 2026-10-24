import React from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StoreHeader } from '../components/StoreHeader';
import { BottomNav } from '../components/BottomNav';
import { formatRwf } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import type { Product } from '../api/products';
import { useAppDispatch, useAppSelector } from '../store';
import { removeFromWishlist, clearWishlist } from '../store/wishlistSlice';
import { addItem } from '../store/cartSlice';
import { cardShadow, colors, spacing } from '../theme';

export function WishlistScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const user = useAppSelector(state => state.auth.user);

  const handleMoveToBag = (product: Product) => {
    if (product.stock < 1) {
      Alert.alert('Out of Stock', 'This item is currently out of stock.');
      return;
    }
    dispatch(
      addItem({
        productId: String(product.id),
        quantity: 1,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      }),
    );
    Alert.alert('Added to Bag', `${product.name} was moved to your shopping bag.`, [
      { text: 'Continue' },
      { text: 'View Bag', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleClearAll = () => {
    if (wishlistItems.length === 0) return;
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all saved items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(clearWishlist()),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isOutOfStock = item.stock < 1;
    return (
      <Pressable
        style={[styles.card, cardShadow]}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          {item.oldPrice ? <Text style={styles.saleBadge}>SALE</Text> : null}
        </View>

        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.category}>{item.category}</Text>
            <TouchableOpacity
              onPress={() => dispatch(removeFromWishlist(item.id))}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              style={styles.removeBtn}>
              <Trash2 size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatRwf(item.price)}</Text>
            {item.oldPrice && (
              <Text style={styles.oldPrice}>{formatRwf(item.oldPrice)}</Text>
            )}
          </View>

          <Text
            style={[
              styles.stockStatus,
              isOutOfStock ? styles.outOfStock : styles.inStock,
            ]}>
            {isOutOfStock ? 'Out of stock' : `${item.stock} in stock`}
          </Text>

          <TouchableOpacity
            style={[styles.moveToCartBtn, isOutOfStock && styles.btnDisabled]}
            disabled={isOutOfStock}
            onPress={() => handleMoveToBag(item)}
            activeOpacity={0.8}>
            <ShoppingBag size={14} color={colors.white} />
            <Text style={styles.moveToCartText}>
              {isOutOfStock ? 'OUT OF STOCK' : 'MOVE TO BAG'}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <StoreHeader title="Saved Items" showBack />

      <View style={styles.headerBar}>
        <View style={styles.countBadgeRow}>
          <Heart size={16} color={colors.goldDark} fill={colors.gold} />
          <Text style={styles.countText}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>

        {wishlistItems.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={wishlistItems}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Heart size={38} color={colors.gold} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Save your favorite luxury fashion pieces and accessories to purchase them later.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Products')}>
              <Text style={styles.exploreBtnText}>EXPLORE COLLECTION</Text>
              <ArrowRight size={16} color={colors.goldBright} />
            </TouchableOpacity>
          </View>
        }
      />

      <BottomNav active="Products" signedIn={Boolean(user)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  headerBar: {
    alignItems: 'center',
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm + 2,
  },
  countBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  countText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    paddingVertical: 2,
  },
  clearText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 90,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
    width: 110,
  },
  image: {
    backgroundColor: colors.cream,
    height: '100%',
    width: '100%',
  },
  saleBadge: {
    backgroundColor: colors.danger,
    borderRadius: 3,
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    left: 6,
    overflow: 'hidden',
    paddingHorizontal: 4,
    paddingVertical: 2,
    position: 'absolute',
    top: 6,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  removeBtn: {
    padding: 2,
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 4,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    color: colors.goldDark,
    fontSize: 14,
    fontWeight: '800',
  },
  oldPrice: {
    color: colors.mutedLight,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  stockStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  inStock: {
    color: colors.green,
  },
  outOfStock: {
    color: colors.danger,
  },
  moveToCartBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  moveToCartText: {
    color: colors.goldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  btnDisabled: {
    backgroundColor: colors.mutedLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.page,
    paddingTop: 80,
  },
  emptyIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 40,
    borderWidth: 1,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 80,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  exploreBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radius,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  exploreBtnText: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

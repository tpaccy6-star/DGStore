import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react-native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatRwf, useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem } from '../store/cartSlice';
import { cardShadow, colors, spacing } from '../theme';
import { StoreHeader } from '../components/StoreHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen(): React.JSX.Element {
  const i18n = useI18n();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { product } = route.params;

  const cartItems = useAppSelector(state => state.cart.items);
  const existingInCart =
    cartItems.find(entry => entry.productId === String(product.id))?.quantity ?? 0;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.stock < 1;

  function handleAddToCart(andCheckout = false): void {
    if (isOutOfStock) return;

    dispatch(
      addItem({
        productId: String(product.id),
        quantity,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      }),
    );

    if (andCheckout) {
      navigation.navigate('Checkout');
    } else {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 4500);
    }
  }

  return (
    <View style={styles.screen}>
      <StoreHeader title="Product Details" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageWrap}>
          <Image resizeMode="cover" source={{ uri: product.image }} style={styles.image} />
          {product.oldPrice ? <Text style={styles.sale}>SALE</Text> : null}
          <View style={styles.favoriteButton}>
            <Heart color={colors.ink} fill="transparent" size={20} strokeWidth={1.8} />
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <View style={styles.row}>
            <View style={styles.categoryPill}>
              <Text style={styles.category}>{product.category}</Text>
            </View>
            <View style={styles.rating}>
              <Star color={colors.gold} fill={colors.gold} size={14} />
              <Text style={styles.ratingText}>
                {product.rating.toFixed(1)} ({product.reviews} reviews)
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatRwf(product.price)}</Text>
            {product.oldPrice ? (
              <Text style={styles.oldPrice}>{formatRwf(product.oldPrice)}</Text>
            ) : null}
          </View>

          <Text style={styles.description}>
            {product.description ??
              'Thoughtfully designed for everyday movement, premium comfort and distinct style.'}
          </Text>

          {/* Delivery & Stock Banner */}
          <View style={[styles.delivery, cardShadow]}>
            <View style={styles.deliveryIcon}>
              <Truck color={colors.white} size={18} strokeWidth={2.4} />
            </View>
            <View style={styles.deliveryCopy}>
              <Text style={styles.deliveryTitle}>
                {isOutOfStock ? 'Currently out of stock' : 'Ready to deliver across Rwanda'}
              </Text>
              <Text style={styles.deliveryText}>
                {isOutOfStock
                  ? 'Check back soon for restock'
                  : `${product.stock} items available in Kigali warehouse`}
              </Text>
            </View>
          </View>

          {/* Quantity Selector: Choose Multiple Quantities */}
          {!isOutOfStock && (
            <View style={[styles.quantitySection, cardShadow]}>
              <View>
                <Text style={styles.quantitySectionTitle}>Choose Quantity</Text>
                <Text style={styles.quantitySubtotal}>
                  Subtotal: {formatRwf(product.price * quantity)}
                </Text>
              </View>

              <View style={styles.stepperWrap}>
                <Pressable
                  accessibilityLabel="Decrease quantity"
                  disabled={quantity <= 1}
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  style={[styles.stepperButton, quantity <= 1 && styles.stepperDisabled]}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </Pressable>

                <View style={styles.stepperCountBox}>
                  <Text style={styles.stepperCountText}>{quantity}</Text>
                </View>

                <Pressable
                  accessibilityLabel="Increase quantity"
                  disabled={quantity >= product.stock}
                  onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={[styles.stepperButton, quantity >= product.stock && styles.stepperDisabled]}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Already in Bag Notice */}
          {existingInCart > 0 && (
            <View style={styles.alreadyInCartBox}>
              <Text style={styles.alreadyInCartText}>
                You already have <Text style={{ fontWeight: '800' }}>{existingInCart}</Text> of this
                item in your bag.
              </Text>
            </View>
          )}

          {/* Just Added Confirmation Banner (Supports adding other items) */}
          {justAdded && (
            <View style={[styles.addedConfirmationBanner, cardShadow]}>
              <View style={styles.addedConfirmationLeft}>
                <CheckCircle2 color={colors.green} size={20} strokeWidth={2.4} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addedConfirmationTitle}>Added to bag!</Text>
                  <Text style={styles.addedConfirmationText}>
                    Added {quantity}x "{product.name}". Keep browsing or checkout.
                  </Text>
                </View>
              </View>

              <View style={styles.addedConfirmationActions}>
                <Pressable
                  onPress={() => navigation.navigate('Products')}
                  style={styles.keepShoppingBtn}
                >
                  <Text style={styles.keepShoppingBtnText}>+ Add Other Items</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('Cart')}
                  style={styles.viewCartBtn}
                >
                  <Text style={styles.viewCartBtnText}>
                    View Bag ({totalCartCount + quantity}) →
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Dual Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {/* Add to Bag (stays on screen so user can choose other items) */}
            <Pressable
              accessibilityLabel={`Add ${quantity} to bag`}
              accessibilityRole="button"
              disabled={isOutOfStock}
              onPress={() => handleAddToCart(false)}
              style={[
                styles.addToBagButton,
                isOutOfStock && styles.disabled,
              ]}
            >
              <ShoppingBag color={isOutOfStock ? colors.muted : colors.ink} size={18} />
              <Text
                style={[
                  styles.addToBagButtonText,
                  isOutOfStock && { color: colors.muted },
                ]}
              >
                {isOutOfStock ? i18n.t('outOfStock') : `Add ${quantity} to Bag`}
              </Text>
            </Pressable>

            {/* Buy Now (direct to checkout) */}
            <Pressable
              accessibilityLabel="Buy now"
              accessibilityRole="button"
              disabled={isOutOfStock}
              onPress={() => handleAddToCart(true)}
              style={[styles.buyNowButton, isOutOfStock && styles.disabled]}
            >
              <Text style={styles.buyNowButtonText}>Buy Now</Text>
              <ArrowRight color={colors.white} size={16} />
            </Pressable>
          </View>

          {/* Keep shopping link */}
          <Pressable
            accessibilityLabel="Choose other items"
            onPress={() => navigation.navigate('Products')}
            style={styles.browseOtherLink}
          >
            <ArrowLeft color={colors.goldDark} size={15} />
            <Text style={styles.browseOtherLinkText}>
              Browse more {product.category} & other items
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  addToBagButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
  },
  addToBagButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  addedConfirmationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addedConfirmationBanner: {
    backgroundColor: colors.card,
    borderColor: colors.green,
    borderRadius: spacing.radiusSm,
    borderWidth: 1.5,
    marginTop: 16,
    padding: 12,
  },
  addedConfirmationLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  addedConfirmationText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  addedConfirmationTitle: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
  },
  alreadyInCartBox: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  alreadyInCartText: {
    color: colors.goldDark,
    fontSize: 12,
  },
  browseOtherLink: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  browseOtherLinkText: {
    color: colors.goldDark,
    fontSize: 13,
    fontWeight: '700',
  },
  buyNowButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
  },
  buyNowButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  category: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  categoryPill: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  content: {
    paddingBottom: 60,
  },
  delivery: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    padding: 14,
  },
  deliveryCopy: {
    flex: 1,
  },
  deliveryIcon: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  deliveryText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  deliveryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 14,
  },
  disabled: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 14,
    width: 40,
  },
  image: {
    height: 380,
    width: '100%',
  },
  imageWrap: {
    backgroundColor: colors.cream,
    height: 380,
    overflow: 'hidden',
    position: 'relative',
  },
  info: {
    padding: spacing.page,
  },
  keepShoppingBtn: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  keepShoppingBtnText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  oldPrice: {
    color: colors.mutedLight,
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  price: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  quantitySection: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14,
  },
  quantitySectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  quantitySubtotal: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  rating: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sale: {
    backgroundColor: colors.ink,
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    left: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: 14,
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperButtonText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepperCountBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  stepperCountText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 10,
  },
  viewCartBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 6,
    flex: 1,
    paddingVertical: 8,
  },
  viewCartBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});

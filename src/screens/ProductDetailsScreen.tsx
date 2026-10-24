import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  MessageCircle,
  Send,
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatRwf, useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import { cardShadow, colors, spacing } from '../theme';
import { StoreHeader } from '../components/StoreHeader';
import { getProductReviews, submitProductReview, type Review } from '../api/reviews';
import { openWhatsAppConcierge } from '../utils/concierge';
import { useEffect } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen(): React.JSX.Element {
  const i18n = useI18n();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { product } = route.params;

  const user = useAppSelector(state => state.auth.user);
  const cartItems = useAppSelector(state => state.cart.items);
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const isFav = wishlistItems.some(w => w.id === product.id);
  const existingInCart =
    cartItems.find(entry => entry.productId === String(product.id))?.quantity ?? 0;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    getProductReviews(product.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [product.id]);

  const handleReviewSubmit = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to share your customer review.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!newComment.trim()) {
      Alert.alert('Comment Required', 'Please write a brief comment describing your experience.');
      return;
    }
    setSubmittingReview(true);
    try {
      const updated = await submitProductReview(product.id, {
        rating: newRating,
        comment: newComment.trim(),
      });
      setReviews(updated);
      setNewComment('');
      setShowReviewForm(false);
      Alert.alert('Thank You', 'Your review has been submitted successfully.');
    } catch {
      Alert.alert('Error', 'Unable to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

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
          <Pressable
            accessibilityLabel="Toggle favorite"
            onPress={() => dispatch(toggleWishlist(product))}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            style={styles.favoriteButton}
          >
            <Heart
              color={isFav ? colors.goldDark : colors.ink}
              fill={isFav ? colors.gold : 'transparent'}
              size={20}
              strokeWidth={1.8}
            />
          </Pressable>
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

          {/* WhatsApp Boutique Concierge Consultation */}
          <TouchableOpacity
            style={[styles.conciergeCard, cardShadow]}
            activeOpacity={0.85}
            onPress={() =>
              openWhatsAppConcierge(
                `Hello D&G Store Concierge, I would like to inquire about "${product.name}" (Ref: #${product.id}). Is this available for delivery in Kigali?`,
              )
            }
          >
            <View style={styles.conciergeIconBox}>
              <MessageCircle size={22} color={colors.goldDark} />
            </View>
            <View style={styles.conciergeTextWrap}>
              <Text style={styles.conciergeTitle}>Inquire with Boutique Concierge</Text>
              <Text style={styles.conciergeSubtitle}>
                Chat on WhatsApp about sizing, fit, or instant Kigali delivery
              </Text>
            </View>
          </TouchableOpacity>

          {/* Customer Reviews Section */}
          <View style={[styles.reviewsSection, cardShadow]}>
            <View style={styles.reviewsHeaderRow}>
              <View>
                <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
                <View style={styles.reviewsRatingSummary}>
                  <Star size={14} color={colors.gold} fill={colors.gold} />
                  <Text style={styles.reviewsAvgText}>
                    {product.rating.toFixed(1)} out of 5 ({reviews.length > 0 ? reviews.length : product.reviews} reviews)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.writeReviewToggleBtn}
                onPress={() => setShowReviewForm(f => !f)}
              >
                <Text style={styles.writeReviewToggleText}>
                  {showReviewForm ? 'Cancel' : '+ Write Review'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Write Review Form */}
            {showReviewForm && (
              <View style={styles.reviewFormBox}>
                <Text style={styles.ratingSelectLabel}>Select Rating:</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setNewRating(star)}
                      style={styles.starSelectBtn}
                    >
                      <Star
                        size={22}
                        color={star <= newRating ? colors.gold : colors.mutedLight}
                        fill={star <= newRating ? colors.gold : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.reviewInput}
                  multiline
                  placeholder="Share your experience with this luxury item..."
                  placeholderTextColor={colors.mutedLight}
                  value={newComment}
                  onChangeText={setNewComment}
                />

                <TouchableOpacity
                  style={[styles.submitReviewBtn, submittingReview && styles.disabled]}
                  disabled={submittingReview}
                  onPress={handleReviewSubmit}
                >
                  <Send size={15} color={colors.white} />
                  <Text style={styles.submitReviewText}>
                    {submittingReview ? 'Submitting...' : 'SUBMIT REVIEW'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>
                No written customer reviews yet. Be the first to share your thoughts!
              </Text>
            ) : (
              reviews.map(item => (
                <View key={item.id} style={styles.reviewItem}>
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewerName}>{item.userName}</Text>
                    <View style={styles.reviewerStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={11}
                          color={s <= item.rating ? colors.gold : colors.line}
                          fill={s <= item.rating ? colors.gold : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {item.createdAt ? item.createdAt.split('T')[0] : 'Verified Buyer'}
                  </Text>
                </View>
              ))
            )}
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
  conciergeCard: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  conciergeIconBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.goldMuted,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  conciergeTextWrap: {
    flex: 1,
  },
  conciergeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  conciergeSubtitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  reviewsSection: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  reviewsHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewsSectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  reviewsRatingSummary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  reviewsAvgText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  writeReviewToggleBtn: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusPill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  writeReviewToggleText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  reviewFormBox: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  ratingSelectLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  starSelectBtn: {
    padding: 2,
  },
  reviewInput: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    minHeight: 70,
    padding: spacing.sm,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.sm + 2,
    paddingVertical: 10,
  },
  submitReviewText: {
    color: colors.goldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  noReviewsText: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  reviewItem: {
    borderTopColor: colors.lineLight,
    borderTopWidth: 1,
    paddingVertical: spacing.sm + 4,
  },
  reviewItemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewerStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    color: colors.inkLight,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  reviewDate: {
    color: colors.mutedLight,
    fontSize: 10,
  },
});

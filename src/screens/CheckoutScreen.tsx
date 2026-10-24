import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  User,
  X,
} from 'lucide-react-native';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import { createOrder } from '../api/orders';
import type { OrderResponse } from '../api/orders';
import { formatRwf, useI18n } from '../i18n';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart, updateQuantity } from '../store/cartSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { cardShadow, colors, spacing } from '../theme';
import { StoreHeader } from '../components/StoreHeader';
import { getSavedDeliveryAddress } from '../store/deliveryStorage';
import { getSavedPaymentInfo, type SavedPaymentInfo } from '../store/paymentStorage';
import { openWhatsAppConcierge } from '../utils/concierge';

type FormValues = { deliveryAddress: string };
const schema = z.object({ deliveryAddress: z.string().trim().min(3) });
const paymentMethods = ['momo', 'airtel', 'card'] as const;

const promoRates: Record<string, { label: string; rate: number }> = {
  DG2026: { label: 'DG2026 (20% OFF)', rate: 0.2 },
  WELCOME10: { label: 'WELCOME10 (10% OFF)', rate: 0.1 },
  STUDENT: { label: 'STUDENT (15% OFF)', rate: 0.15 },
};

export function CheckoutScreen(): React.JSX.Element {
  const i18n = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const items = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user);

  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]>('momo');
  const [phoneInput, setPhoneInput] = useState('');
  const [bankInput, setBankInput] = useState('');
  const [accountInput, setAccountInput] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [serverError, setServerError] = useState('');
  const [successOrder, setSuccessOrder] = useState<OrderResponse | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { deliveryAddress: '' } });

  useEffect(() => {
    getSavedDeliveryAddress()
      .then(address => {
        if (address) reset({ deliveryAddress: address });
      })
      .catch(() => undefined);

    getSavedPaymentInfo()
      .then(payment => {
        if (payment) {
          if (payment.preferredMethod) setPaymentMethod(payment.preferredMethod);
          if (payment.momoPhone) setPhoneInput(payment.momoPhone);
          if (payment.bankName) setBankInput(payment.bankName);
          if (payment.bankAccount) setAccountInput(payment.bankAccount);
        }
      })
      .catch(() => undefined);
  }, [reset]);

  // Adjust phone input when switching between momo and airtel
  const switchPaymentMethod = (method: (typeof paymentMethods)[number]) => {
    setPaymentMethod(method);
    getSavedPaymentInfo()
      .then(payment => {
        if (!payment) return;
        if (method === 'momo' && payment.momoPhone) setPhoneInput(payment.momoPhone);
        else if (method === 'airtel' && payment.airtelPhone) setPhoneInput(payment.airtelPhone);
      })
      .catch(() => undefined);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountRate = appliedPromo ? promoRates[appliedPromo]?.rate ?? 0 : 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;

  const applyPromo = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (promoRates[normalized]) {
      setAppliedPromo(normalized);
      setPromoCodeInput('');
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try DG2026, WELCOME10, or STUDENT.');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const submit = async (values: FormValues) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    const network = await NetInfo.fetch();
    if (!network.isConnected) {
      setServerError(i18n.t('offlineMessage'));
      return;
    }
    setServerError('');

    if (!user) {
      if (!guestName.trim()) {
        setServerError('Please enter your full name for delivery.');
        return;
      }
      if (!guestPhone.trim()) {
        setServerError('Please enter your phone number so courier can reach you.');
        return;
      }
    }

    let paymentDetails = '';
    if (paymentMethod === 'momo' || paymentMethod === 'airtel') {
      const activePhone = phoneInput.trim() || guestPhone.trim();
      if (!activePhone) {
        setServerError(`Please enter your ${paymentMethod === 'momo' ? 'MTN' : 'Airtel'} phone number for payment.`);
        return;
      }
      paymentDetails = activePhone;
    } else {
      paymentDetails = bankInput ? `${bankInput} - ${accountInput}` : accountInput;
    }

    try {
      const order = await createOrder({
        items: items.map(item => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        })),
        deliveryAddress: parsed.data.deliveryAddress,
        paymentMethod,
        promoCode: appliedPromo ?? undefined,
        paymentDetails: paymentDetails || undefined,
        customerName: user ? user.name : guestName.trim(),
        customerPhone: user ? undefined : guestPhone.trim(),
        customerEmail: user ? user.email : (guestEmail.trim() || undefined),
      });
      dispatch(clearCart());
      setSuccessOrder(order);
    } catch {
      setServerError(i18n.t('checkoutError'));
    }
  };

  if (items.length === 0 && !successOrder) {
    return (
      <View style={styles.screen}>
        <StoreHeader title="Checkout" showBack />
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <ShoppingBag color={colors.goldDark} size={28} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>Your bag is empty</Text>
          <Text style={styles.subtitle}>
            Please select items from the shop before proceeding to checkout.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Products')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Browse Products  →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (successOrder) {
    return (
      <View style={styles.screen}>
        <StoreHeader title="Order confirmed" showBack />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.successPanel, cardShadow]}>
            <View style={styles.successIcon}>
              <CheckCircle2 color={colors.green} size={32} strokeWidth={2.4} />
            </View>
            <Text style={styles.successTitle}>Payment successful!</Text>
            <Text style={styles.successSubtitle}>
              Your order has been placed. Thank you for shopping with D&G eCOMMERCE.
            </Text>

            <View style={styles.successDivider} />

            <Text style={styles.amountLabel}>Total paid</Text>
            <Text style={styles.successAmount}>{formatRwf(successOrder.total)}</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>PAID · CONFIRMED</Text>
            </View>

            {/* Confirmed Multi-Item Breakdown */}
            {(successOrder.items ?? []).length > 0 && (
              <View style={styles.confirmedItemsBox}>
                <Text style={styles.confirmedItemsHeader}>
                  Ordered Items ({successOrder.items?.length})
                </Text>
                {(successOrder.items ?? []).map(item => (
                  <View key={item.productId} style={styles.confirmedItemRow}>
                    <Text numberOfLines={1} style={styles.confirmedItemName}>
                      {item.quantity}x {item.name}
                    </Text>
                    <Text style={styles.confirmedItemPrice}>
                      {formatRwf(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.receipt}>
              <View>
                <Text style={styles.receiptLabel}>Order number</Text>
                <Text style={styles.receiptValue}>{successOrder.id}</Text>
              </View>
              <View>
                <Text style={styles.receiptLabel}>Payment method</Text>
                <Text style={styles.receiptValue}>
                  {successOrder.paymentMethod ?? paymentMethod.toUpperCase()}
                </Text>
              </View>
              {appliedPromo && (
                <View>
                  <Text style={styles.receiptLabel}>Promo applied</Text>
                  <Text style={[styles.receiptValue, { color: colors.green }]}>
                    {appliedPromo} ({discountRate * 100}% off)
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.receiptLabel}>Order date</Text>
                <Text style={styles.receiptValue}>
                  {new Date(successOrder.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.nextStep}>
              <Truck color={colors.green} size={20} />
              <View style={styles.nextStepCopy}>
                <Text style={styles.nextStepTitle}>What’s next?</Text>
                <Text style={styles.nextStepText}>
                  Your package is being prepared. We’ll notify you when it's out for delivery.
                </Text>
              </View>
            </View>

            {user ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Orders')}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Track my order  →</Text>
              </Pressable>
            ) : (
              <View style={{ gap: spacing.sm, width: '100%' }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    openWhatsAppConcierge(
                      `Hello D&G Store! I just placed Direct Pay Order #${successOrder.id} (${formatRwf(successOrder.total)}) for delivery to ${successOrder.deliveryAddress || 'Kigali'}. Can you confirm dispatch?`,
                    )
                  }
                  style={[styles.primaryButton, { backgroundColor: '#25D366' }]}
                >
                  <MessageCircle color={colors.white} size={18} />
                  <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                    Confirm on WhatsApp  →
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('Register')}
                  style={styles.guestRegisterPromptBtn}
                >
                  <Text style={styles.guestRegisterPromptText}>
                    Create account to save future orders →
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Products')}
              style={styles.continue}
            >
              <Text style={styles.continueText}>Continue shopping</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StoreHeader title="Checkout" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.panel, cardShadow]}>
          <Text style={styles.title}>{i18n.t('checkoutTitle')}</Text>
          <Text style={styles.subtitle}>
            Complete your order with Rwanda mobile money, card, or promo code discount.
          </Text>

          {/* Customer / Direct Pay Contact Information */}
          {user ? (
            <View style={styles.customerAccountBox}>
              <View style={styles.customerAccountHeader}>
                <View style={styles.customerAccountAvatar}>
                  <User color={colors.goldDark} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerAccountName}>{user.name}</Text>
                  <Text style={styles.customerAccountEmail}>{user.email}</Text>
                </View>
                <View style={styles.customerAccountBadge}>
                  <Text style={styles.customerAccountBadgeText}>LOGGED IN</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.directPayCard}>
              <View style={styles.directPayHeader}>
                <View style={styles.directPayBadge}>
                  <Sparkles color={colors.goldDark} size={13} />
                  <Text style={styles.directPayBadgeText}>DIRECT PAY · NO ACCOUNT NEEDED</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('Login', { redirectTo: 'Checkout' })}>
                  <Text style={styles.loginLinkText}>Sign in</Text>
                </Pressable>
              </View>

              <Text style={styles.directPaySubtitle}>
                Pay directly with MoMo, Airtel or Card. Please provide your contact details for delivery.
              </Text>

              {/* Full Name */}
              <Text style={styles.fieldLabel}>Your Full Name *</Text>
              <View style={styles.directInputWrap}>
                <User color={colors.goldDark} size={17} style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Marie Claire Uwase"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.directInput}
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>

              {/* Phone / WhatsApp */}
              <Text style={styles.fieldLabel}>Phone / WhatsApp Number *</Text>
              <View style={styles.directInputWrap}>
                <Phone color={colors.goldDark} size={17} style={styles.inputIcon} />
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="e.g. 0788 123 456"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.directInput}
                  value={guestPhone}
                  onChangeText={text => {
                    setGuestPhone(text);
                    if (!phoneInput) setPhoneInput(text);
                  }}
                />
              </View>

              {/* Optional Email */}
              <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
              <View style={styles.directInputWrap}>
                <Mail color={colors.goldDark} size={17} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="For digital invoice & receipt"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.directInput}
                  value={guestEmail}
                  onChangeText={setGuestEmail}
                />
              </View>
            </View>
          )}

          {/* Order Items Review Section (Supports multiple items & inline adjustments) */}
          <View style={styles.orderItemsHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                Items in your order ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
              </Text>
              <Text style={styles.itemsHelperText}>Review quantities or add other items</Text>
            </View>
            <Pressable
              accessibilityLabel="Add other items to order"
              onPress={() => navigation.navigate('Products')}
              style={styles.addMoreCheckoutBtn}
            >
              <Plus color={colors.goldDark} size={14} strokeWidth={2.4} />
              <Text style={styles.addMoreCheckoutBtnText}>+ Add items</Text>
            </Pressable>
          </View>

          <View style={styles.orderItemsCard}>
            {items.map(item => (
              <View key={item.productId} style={styles.orderItemRow}>
                {item.image ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: item.image }}
                    style={styles.orderItemThumb}
                  />
                ) : (
                  <View style={styles.orderItemThumbPlaceholder}>
                    <Text style={styles.orderItemThumbText}>D&G</Text>
                  </View>
                )}

                <View style={styles.orderItemMeta}>
                  <Text numberOfLines={1} style={styles.orderItemName}>
                    {item.name ?? 'Product'}
                  </Text>
                  <Text style={styles.orderItemUnit}>
                    {formatRwf(item.price ?? 0)} each
                  </Text>

                  {/* Inline Stepper for quantity */}
                  <View style={styles.orderItemStepperRow}>
                    <View style={styles.stepperSmallWrap}>
                      <Pressable
                        accessibilityLabel={`Decrease ${item.name}`}
                        onPress={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity - 1,
                            }),
                          )
                        }
                        style={styles.stepperSmallBtn}
                      >
                        <Text style={styles.stepperSmallBtnText}>−</Text>
                      </Pressable>

                      <Text style={styles.stepperSmallQty}>{item.quantity}</Text>

                      <Pressable
                        accessibilityLabel={`Increase ${item.name}`}
                        disabled={Boolean(item.stock && item.quantity >= item.stock)}
                        onPress={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity + 1,
                            }),
                          )
                        }
                        style={[
                          styles.stepperSmallBtn,
                          Boolean(item.stock && item.quantity >= item.stock) &&
                            styles.stepperSmallDisabled,
                        ]}
                      >
                        <Text style={styles.stepperSmallBtnText}>+</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.orderItemTotal}>
                      {formatRwf((item.price ?? 0) * item.quantity)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery Address */}
          <Text style={styles.label}>{i18n.t('deliveryAddress')}</Text>
          <View style={[styles.inputWrap, errors.deliveryAddress ? styles.inputError : null]}>
            <MapPin color={colors.goldDark} size={18} style={styles.inputIcon} />
            <Controller
              control={control}
              name="deliveryAddress"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  multiline
                  onChangeText={onChange}
                  placeholder="Enter your delivery address, sector or landmark"
                  placeholderTextColor={colors.mutedLight}
                  style={[styles.input, styles.address]}
                  value={value}
                />
              )}
            />
          </View>
          {errors.deliveryAddress && (
            <Text style={styles.error}>{i18n.t('addressValidation')}</Text>
          )}

          {/* Payment Method Selector */}
          <Text style={styles.label}>{i18n.t('paymentMethod')}</Text>
          <View style={styles.methods}>
            {paymentMethods.map(method => (
              <Pressable
                accessibilityRole="button"
                key={method}
                onPress={() => switchPaymentMethod(method)}
                style={[styles.method, paymentMethod === method && styles.selected]}
              >
                <CreditCard
                  color={paymentMethod === method ? colors.ink : colors.muted}
                  size={18}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.methodText,
                    paymentMethod === method && styles.methodTextSelected,
                  ]}
                >
                  {i18n.t(method)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Dynamic Payment Channel Inputs */}
          {paymentMethod === 'momo' && (
            <View style={styles.paymentInputCard}>
              <Text style={styles.inputSublabel}>MTN Mobile Money Number</Text>
              <View style={styles.inputFieldRow}>
                <Phone color={colors.goldDark} size={16} style={styles.inputFieldIcon} />
                <TextInput
                  keyboardType="phone-pad"
                  onChangeText={setPhoneInput}
                  placeholder="078X XXX XXX"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.singleLineInput}
                  value={phoneInput}
                />
              </View>
              <Text style={styles.paymentHint}>
                A payment prompt will be pushed to this MTN phone number.
              </Text>
            </View>
          )}

          {paymentMethod === 'airtel' && (
            <View style={styles.paymentInputCard}>
              <Text style={styles.inputSublabel}>Airtel Money Number</Text>
              <View style={styles.inputFieldRow}>
                <Phone color={colors.danger} size={16} style={styles.inputFieldIcon} />
                <TextInput
                  keyboardType="phone-pad"
                  onChangeText={setPhoneInput}
                  placeholder="073X XXX XXX / 072X XXX XXX"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.singleLineInput}
                  value={phoneInput}
                />
              </View>
              <Text style={styles.paymentHint}>
                A payment prompt will be pushed to this Airtel phone number.
              </Text>
            </View>
          )}

          {paymentMethod === 'card' && (
            <View style={styles.paymentInputCard}>
              <Text style={styles.inputSublabel}>Bank Name & Account/Card Number</Text>
              <View style={styles.inputFieldRow}>
                <Building2 color={colors.ink} size={16} style={styles.inputFieldIcon} />
                <TextInput
                  onChangeText={setBankInput}
                  placeholder="Bank name (e.g. Bank of Kigali)"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.singleLineInput}
                  value={bankInput}
                />
              </View>
              <View style={[styles.inputFieldRow, { marginTop: 8 }]}>
                <CreditCard color={colors.ink} size={16} style={styles.inputFieldIcon} />
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setAccountInput}
                  placeholder="Account or Card Number"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.singleLineInput}
                  value={accountInput}
                />
              </View>
            </View>
          )}

          {/* Promo Code Section */}
          <Text style={styles.label}>Promo Code</Text>
          {appliedPromo ? (
            <View style={styles.promoAppliedBox}>
              <View style={styles.promoAppliedLeft}>
                <Sparkles color={colors.green} size={18} />
                <View>
                  <Text style={styles.promoAppliedCode}>{appliedPromo}</Text>
                  <Text style={styles.promoAppliedDiscount}>
                    {discountRate * 100}% discount applied!
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Remove promo code"
                onPress={removePromo}
                style={styles.removePromoButton}
              >
                <X color={colors.danger} size={16} />
              </Pressable>
            </View>
          ) : (
            <View>
              <View style={styles.promoInputRow}>
                <View style={styles.promoInputWrap}>
                  <Tag color={colors.muted} size={16} style={styles.inputFieldIcon} />
                  <TextInput
                    autoCapitalize="characters"
                    onChangeText={setPromoCodeInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.promoInput}
                    value={promoCodeInput}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => applyPromo(promoCodeInput)}
                  style={styles.applyButton}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </Pressable>
              </View>

              {/* Quick Promo Chips */}
              <View style={styles.promoChipsRow}>
                <Text style={styles.promoChipHint}>Tap to apply:</Text>
                {Object.keys(promoRates).map(code => (
                  <Pressable
                    key={code}
                    onPress={() => applyPromo(code)}
                    style={styles.quickPromoChip}
                  >
                    <Text style={styles.quickPromoChipText}>{promoRates[code].label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {promoError ? <Text style={styles.error}>{promoError}</Text> : null}

          {/* Order Summary & Pricing Breakdown */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatRwf(subtotal)}</Text>
            </View>

            {appliedPromo && (
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryLabel, { color: colors.green }]}>
                  Promo Discount ({discountRate * 100}%)
                </Text>
                <Text style={[styles.summaryValue, { color: colors.green }]}>
                  −{formatRwf(discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total to pay</Text>
              <Text style={styles.total}>{formatRwf(total)}</Text>
            </View>
          </View>

          {serverError ? <Text style={styles.error}>{serverError}</Text> : null}

          {/* Place Order Button */}
          <Pressable
            accessibilityLabel={i18n.t(isSubmitting ? 'loading' : 'placeOrder')}
            accessibilityRole="button"
            disabled={isSubmitting || items.length === 0}
            onPress={() => {
              handleSubmit(submit)().catch(() => undefined);
            }}
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
          >
            <Text style={styles.primaryButtonText}>
              {i18n.t(isSubmitting ? 'loading' : 'placeOrder')}  →
            </Text>
          </Pressable>

          <Text style={styles.secure}>✓ Secure checkout · Your details are protected</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  address: {
    flex: 1,
    minHeight: 72,
    paddingLeft: 8,
    textAlignVertical: 'top',
  },
  amountLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 16,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  center: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.radius,
    margin: spacing.page,
    padding: 28,
  },
  continue: {
    marginTop: 8,
    padding: 12,
  },
  continueText: {
    color: colors.goldDark,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 38,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    marginBottom: 14,
    width: 76,
  },
  input: {
    color: colors.ink,
    fontSize: 13,
    padding: 8,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputFieldIcon: {
    marginLeft: 10,
    marginRight: 6,
  },
  inputFieldRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputIcon: {
    marginLeft: 4,
    marginTop: 6,
  },
  inputSublabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrap: {
    alignItems: 'flex-start',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 20,
  },
  method: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    paddingVertical: 12,
  },
  methodText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  methodTextSelected: {
    color: colors.ink,
    fontWeight: '900',
  },
  methods: {
    flexDirection: 'row',
    gap: 8,
  },
  nextStep: {
    alignItems: 'flex-start',
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    padding: 13,
  },
  nextStepCopy: {
    flex: 1,
  },
  nextStepText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  nextStepTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  paidBadge: {
    alignSelf: 'center',
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  paidText: {
    color: colors.green,
    fontSize: 9,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    padding: spacing.page,
  },
  paymentHint: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 6,
  },
  paymentInputCard: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radius,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  promoAppliedBox: {
    alignItems: 'center',
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  promoAppliedCode: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
  },
  promoAppliedDiscount: {
    color: colors.green,
    fontSize: 11,
  },
  promoAppliedLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  promoChipHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  promoChipsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  promoInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    height: 44,
  },
  promoInputRow: {
    flexDirection: 'row',
  },
  promoInputWrap: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
  },
  quickPromoChip: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickPromoChipText: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
  },
  receipt: {
    borderTopColor: colors.lineLight,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    width: '100%',
  },
  receiptLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  receiptValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  removePromoButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.page,
    paddingBottom: 40,
  },
  secure: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 16,
    textAlign: 'center',
  },
  selected: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },
  singleLineInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    height: 42,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  successAmount: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  successDivider: {
    backgroundColor: colors.lineLight,
    height: 1,
    marginVertical: 14,
    width: '100%',
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: colors.greenLight,
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  successPanel: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    padding: spacing.page,
  },
  successSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  successTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  summaryDivider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: 10,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryLine: {
    alignItems: 'center',
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
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  total: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  totalLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  totalLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addMoreCheckoutBtn: {
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
  addMoreCheckoutBtnText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  checkoutItemControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  checkoutItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkoutItemName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  checkoutItemRow: {
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  checkoutItemSubtotal: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  checkoutItemThumb: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  checkoutItemThumbPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  checkoutItemThumbText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '900',
  },
  checkoutItemUnit: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  confirmedItemName: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  confirmedItemPrice: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  confirmedItemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  confirmedItemsBox: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
    width: '100%',
  },
  confirmedItemsHeader: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  itemsHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 14,
  },
  itemsHelperText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  orderItemMeta: {
    flex: 1,
    marginLeft: 12,
  },
  orderItemName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  orderItemRow: {
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  orderItemStepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  orderItemThumb: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  orderItemThumbPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  orderItemThumbText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '900',
  },
  orderItemTotal: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  orderItemUnit: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  orderItemsCard: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  orderItemsHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 14,
  },
  stepperSmallBtn: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepperSmallBtnText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  stepperSmallDisabled: {
    opacity: 0.3,
  },
  stepperSmallQty: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  stepperSmallWrap: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
  },
  directPayCard: {
    backgroundColor: '#FCFAF5',
    borderColor: colors.goldMuted,
    borderRadius: spacing.radius,
    borderWidth: 1.5,
    marginBottom: 16,
    marginTop: 10,
    padding: spacing.md,
  },
  directPayHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  directPayBadge: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusPill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  directPayBadgeText: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginLinkText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  directPaySubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  directInputWrap: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  directInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    height: 42,
    paddingLeft: 6,
  },
  customerAccountBox: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 14,
    marginTop: 10,
    padding: spacing.md,
  },
  customerAccountHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  customerAccountAvatar: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  customerAccountName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  customerAccountEmail: {
    color: colors.muted,
    fontSize: 12,
  },
  customerAccountBadge: {
    backgroundColor: colors.cream,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customerAccountBadgeText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '800',
  },
  guestRegisterPromptBtn: {
    alignItems: 'center',
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    paddingVertical: 10,
  },
  guestRegisterPromptText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
  },
});

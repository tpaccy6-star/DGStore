import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { CreditCard, MapPin, Package } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StoreHeader } from '../components/StoreHeader';
import { formatRwf, useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { cardShadow, colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

export function OrderDetailsScreen({ route }: Props): React.JSX.Element {
  const i18n = useI18n();
  const { order } = route.params;
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    NetInfo.fetch()
      .then(state => setOffline(!state.isConnected))
      .catch(() => setOffline(true));
  }, []);

  return (
    <View style={styles.screen}>
      <StoreHeader title="Order details" showBack />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {offline ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{i18n.t('offlineMessage')}</Text>
          </View>
        ) : null}

        {/* Order Header Summary Card */}
        <View style={[styles.card, cardShadow]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.orderLabel}>ORDER NUMBER</Text>
              <Text style={styles.orderId}>{order.id}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placed on</Text>
            <Text style={styles.infoValue}>
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          {order.trackingNumber ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tracking number</Text>
              <Text style={styles.infoValue}>{order.trackingNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* Delivery & Payment Details */}
        <View style={[styles.card, cardShadow]}>
          <Text style={styles.cardSectionTitle}>Fulfillment & Payment</Text>

          {order.deliveryAddress ? (
            <View style={styles.detailItem}>
              <MapPin color={colors.goldDark} size={18} style={styles.detailIcon} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Delivery Address</Text>
                <Text style={styles.detailText}>{order.deliveryAddress}</Text>
              </View>
            </View>
          ) : null}

          {order.paymentMethod ? (
            <View style={styles.detailItem}>
              <CreditCard color={colors.green} size={18} style={styles.detailIcon} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailText}>
                  {order.paymentMethod.toUpperCase()} (Confirmed)
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Order Items */}
        <View style={[styles.card, cardShadow]}>
          <View style={styles.itemsTitleRow}>
            <Package color={colors.ink} size={18} />
            <Text style={styles.cardSectionTitle}>Order Items</Text>
          </View>

          {(order.items ?? []).length === 0 ? (
            <Text style={styles.emptyItems}>{i18n.t('ordersEmpty')}</Text>
          ) : (
            (order.items ?? []).map((item, index) => (
              <View
                key={item.productId}
                style={[
                  styles.itemRow,
                  index === (order.items ?? []).length - 1 && styles.lastItemRow,
                ]}
              >
                {item.image ? <Image source={{ uri: item.image }} style={styles.itemImage} /> : <View style={styles.itemImagePlaceholder}><Text style={styles.placeholderText}>D&G</Text></View>}
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatRwf(item.price * item.quantity)}</Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalAmount}>{formatRwf(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    marginBottom: 16,
    padding: spacing.page,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  container: {
    padding: spacing.page,
    paddingBottom: 40,
  },
  detailCopy: {
    flex: 1,
  },
  detailIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  detailItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 10,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  detailText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    backgroundColor: colors.lineLight,
    height: 1,
    marginVertical: 14,
  },
  emptyItems: {
    color: colors.muted,
    paddingVertical: 12,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  itemName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  itemImage: {
    backgroundColor: colors.cream,
    borderRadius: spacing.radiusSm,
    height: 64,
    marginRight: 12,
    width: 64,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: spacing.radiusSm,
    height: 64,
    justifyContent: 'center',
    marginRight: 12,
    width: 64,
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  itemPrice: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  itemQuantity: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  itemRow: {
    alignItems: 'center',
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemsTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  itemCopy: {
    flex: 1,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  offlineBanner: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  offlineText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderId: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  orderLabel: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    borderTopColor: colors.lineLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
  },
});

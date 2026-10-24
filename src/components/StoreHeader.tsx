import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Heart, ChevronLeft, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { BrandLogo } from './BrandLogo';
import { getAdminNotifications } from '../api/admin';

type Props = {
  title?: string;
  showBack?: boolean;
  onCart?: () => void;
  hideBrand?: boolean;
};

export function StoreHeader({ title, showBack = false, onCart, hideBrand = false }: Props): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const user = useAppSelector(state => state.auth.user);
  const count = useAppSelector(state => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useAppSelector(state => state.wishlist.items.length);

  const isOwner = user?.role === 'owner';
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!isOwner) return;
    let mounted = true;
    const fetchUnread = () => {
      getAdminNotifications()
        .then(res => {
          if (mounted) setUnreadNotifs(res.unreadCount || 0);
        })
        .catch(() => undefined);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isOwner]);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top, 8),
          height: 60 + Math.max(insets.top, 8),
        },
      ]}
    >
      <View style={styles.left}>
        {showBack && (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
          >
            <ChevronLeft color={colors.ink} size={24} strokeWidth={2} />
          </Pressable>
        )}
        {!hideBrand && <BrandLogo size="sm" />}
        {title && (
          <View style={styles.titleWrap}>
            {!hideBrand && <View style={styles.dot} />}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightActions}>
        {isOwner && (
          <Pressable
            accessibilityLabel="Owner notifications"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Admin', { initialSection: 'Notifications' })}
            style={styles.iconButton}
          >
            <View style={styles.cartIconWrapper}>
              <Bell
                color={unreadNotifs > 0 ? colors.accent : colors.ink}
                size={21}
                strokeWidth={2}
              />
              {unreadNotifs > 0 && (
                <View style={[styles.badge, styles.notifBadge]}>
                  <Text style={styles.badgeText}>{unreadNotifs > 99 ? '99+' : unreadNotifs}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}

        <Pressable
          accessibilityLabel="Saved items wishlist"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Wishlist')}
          style={styles.iconButton}
        >
          <View style={styles.cartIconWrapper}>
            <Heart
              color={wishlistCount > 0 ? colors.accent : colors.ink}
              fill={wishlistCount > 0 ? colors.goldLight : 'transparent'}
              size={21}
              strokeWidth={2}
            />
            {wishlistCount > 0 && (
              <View style={[styles.badge, styles.wishlistBadge]}>
                <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel="Open cart"
          accessibilityRole="button"
          onPress={onCart ?? (() => navigation.navigate('Cart'))}
          style={styles.iconButton}
        >
          <View style={styles.cartIconWrapper}>
            <ShoppingBag color={colors.ink} size={22} strokeWidth={2} />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.paper,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -7,
    top: -5,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
  cartIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    backgroundColor: colors.mutedLight,
    borderRadius: 2,
    height: 4,
    marginHorizontal: 8,
    width: 4,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  wishlistBadge: {
    backgroundColor: colors.ink,
  },
  notifBadge: {
    backgroundColor: colors.danger,
  },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const topInset = Math.max(insets.top, 8);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topInset,
          height: 58 + topInset,
        },
      ]}
    >
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            accessibilityLabel="Go back"
            accessibilityRole="button"
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft color={colors.ink} size={24} strokeWidth={2.2} />
          </TouchableOpacity>
        )}

        {showBack ? (
          title ? (
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {title}
              </Text>
            </View>
          ) : null
        ) : (
          <>
            {!hideBrand && (
              <TouchableOpacity
                accessibilityLabel="D&G Store Home"
                accessibilityRole="button"
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Home')}
              >
                <BrandLogo size="sm" />
              </TouchableOpacity>
            )}
            {title && (
              <View style={styles.titleWrap}>
                {!hideBrand && <View style={styles.dot} />}
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                  {title}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.rightActions}>
        {isOwner && (
          <TouchableOpacity
            accessibilityLabel="Owner notifications"
            accessibilityRole="button"
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            onPress={() => navigation.navigate('Admin', { initialSection: 'Notifications' })}
            style={styles.iconButton}
          >
            <View style={styles.iconWrapper}>
              <Bell
                color={unreadNotifs > 0 ? colors.accent : colors.ink}
                size={20}
                strokeWidth={2}
              />
              {unreadNotifs > 0 && (
                <View pointerEvents="none" style={[styles.badge, styles.notifBadge]}>
                  <Text style={styles.badgeText}>{unreadNotifs > 99 ? '99+' : unreadNotifs}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          accessibilityLabel="Saved items wishlist"
          accessibilityRole="button"
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => navigation.navigate('Wishlist')}
          style={styles.iconButton}
        >
          <View style={styles.iconWrapper}>
            <Heart
              color={wishlistCount > 0 ? colors.accent : colors.ink}
              fill={wishlistCount > 0 ? colors.goldLight : 'transparent'}
              size={20}
              strokeWidth={2}
            />
            {wishlistCount > 0 && (
              <View pointerEvents="none" style={[styles.badge, styles.wishlistBadge]}>
                <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Open cart"
          accessibilityRole="button"
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={onCart ?? (() => navigation.navigate('Cart'))}
          style={styles.iconButton}
        >
          <View style={styles.iconWrapper}>
            <ShoppingBag color={colors.ink} size={20} strokeWidth={2} />
            {count > 0 && (
              <View pointerEvents="none" style={styles.badge}>
                <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 4,
    width: 40,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.paper,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
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
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 100,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  left: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexShrink: 1,
    marginRight: 8,
    minWidth: 0,
  },
  notifBadge: {
    backgroundColor: colors.danger,
  },
  rightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 2,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexShrink: 1,
    minWidth: 0,
  },
  wishlistBadge: {
    backgroundColor: colors.ink,
  },
});

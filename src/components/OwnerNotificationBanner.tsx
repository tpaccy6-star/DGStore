import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronRight, X } from 'lucide-react-native';
import { useAppSelector } from '../store';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { formatRwf } from '../i18n';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  type AdminNotification,
} from '../api/admin';

export function OwnerNotificationBanner(): React.JSX.Element | null {
  const user = useAppSelector(state => state.auth.user);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [activeNotification, setActiveNotification] = useState<AdminNotification | null>(null);
  const translateY = useRef(new Animated.Value(-200)).current;
  const knownNotificationIds = useRef<Set<number>>(new Set());
  const initialFetchDone = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwner = user?.role === 'owner';

  const showAlert = (notif: AdminNotification) => {
    setActiveNotification(notif);
    // Luxury pulse vibration
    try {
      Vibration.vibrate([0, 250, 100, 250]);
    } catch {
      // Ignore if vibration unavailable
    }

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();

    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      hideAlert();
    }, 12000);
  };

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setActiveNotification(null);
    });
  };

  useEffect(() => {
    if (!isOwner) {
      setActiveNotification(null);
      return;
    }

    let isMounted = true;

    const checkNotifications = async () => {
      try {
        const response = await getAdminNotifications();
        if (!isMounted) return;

        const notifs = response.notifications || [];

        // On first fetch after mount, populate known IDs so we don't spam for old notifications
        if (!initialFetchDone.current) {
          notifs.forEach(n => knownNotificationIds.current.add(n.id));
          initialFetchDone.current = true;
          return;
        }

        // Check for any new unread notification that we haven't seen in this session
        const newUnread = notifs.find(n => !n.isRead && !knownNotificationIds.current.has(n.id));

        if (newUnread) {
          knownNotificationIds.current.add(newUnread.id);
          showAlert(newUnread);
        }
      } catch {
        // Silently handle offline/network issues in background watcher
      }
    };

    // Immediate check
    checkNotifications();

    // Poll every 10 seconds while logged in as owner
    const interval = setInterval(checkNotifications, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [isOwner]);

  if (!isOwner || !activeNotification) {
    return null;
  }

  // Parse structured data if available
  let parsedData: { orderId?: string; customerName?: string; total?: number; itemsCount?: number } = {};
  if (activeNotification.data) {
    try {
      parsedData = JSON.parse(activeNotification.data);
    } catch {
      parsedData = {};
    }
  }

  const handleOpenOrder = async () => {
    const id = activeNotification.id;
    hideAlert();
    try {
      await markAdminNotificationRead(id);
    } catch {
      // Ignore
    }
    navigation.navigate('Admin', { initialSection: 'Orders' });
  };

  const handleDismiss = async () => {
    const id = activeNotification.id;
    hideAlert();
    try {
      await markAdminNotificationRead(id);
    } catch {
      // Ignore
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 6,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={styles.iconPulse}>
              <Bell color={colors.gold} size={15} strokeWidth={2.5} />
            </View>
            <Text style={styles.badgeText}>NEW ORDER RECEIVED</Text>
            <View style={styles.liveDot} />
          </View>
          <Pressable
            accessibilityLabel="Dismiss notification"
            onPress={handleDismiss}
            style={styles.closeBtn}
          >
            <X color={colors.mutedLight} size={18} />
          </Pressable>
        </View>

        <View style={styles.contentWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {activeNotification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {activeNotification.message}
          </Text>
          {parsedData.total !== undefined && (
            <Text style={styles.amountText}>
              Total Amount: <Text style={styles.amountHighlight}>{formatRwf(parsedData.total)}</Text>
            </Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.viewBtn} onPress={handleOpenOrder}>
            <Text style={styles.viewBtnText}>View in Orders</Text>
            <ChevronRight color={colors.ink} size={15} strokeWidth={2.5} />
          </Pressable>
          <Pressable style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: spacing.page,
    position: 'absolute',
    right: spacing.page,
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#181A16',
    borderColor: colors.gold,
    borderRadius: spacing.radiusLg,
    borderWidth: 1.5,
    elevation: 10,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  iconPulse: {
    alignItems: 'center',
    backgroundColor: 'rgba(197, 155, 39, 0.2)',
    borderRadius: spacing.radiusPill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  badgeText: {
    color: colors.goldBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  liveDot: {
    backgroundColor: '#4ade80',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  closeBtn: {
    padding: 4,
  },
  contentWrap: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  amountText: {
    color: colors.mutedLight,
    fontSize: 12,
    marginTop: 3,
  },
  amountHighlight: {
    color: colors.goldBright,
    fontWeight: '700',
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  viewBtn: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusSm,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  viewBtnText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  dismissBtnText: {
    color: colors.mutedLight,
    fontSize: 12,
    fontWeight: '600',
  },
});

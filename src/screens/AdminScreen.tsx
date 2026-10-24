import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  Filter,
  MessageCircle,
  Package,
  Plus,
  Search,
  Send,
  Tag,
  Trash2,
  X,
} from 'lucide-react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { StoreHeader } from '../components/StoreHeader';
import { cardShadow, colors, spacing } from '../theme';
import { formatRwf, useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminCustomers,
  getAdminNotifications,
  getAdminOrders,
  getAdminProducts,
  getAdminStats,
  getWhatsAppSettings,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  testWhatsAppNotification,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateWhatsAppSettings,
  type AdminCustomer,
  type AdminNotification,
  type AdminOrder,
  type AdminProduct,
  type AdminStats,
} from '../api/admin';

const statuses = ['Processing', 'Packed', 'In Transit', 'Delivered', 'Cancelled'];
const sections = ['Overview', 'Orders', 'Notifications', 'Products', 'Customers'] as const;
type AdminSection = (typeof sections)[number];

export const standardCategories = [
  'Shoes',
  'Bags',
  'Tech',
  'Fashion',
  'Accessories',
  'Electronics',
  'Home & Living',
  'Other',
] as const;

export function AdminScreen(): React.JSX.Element {
  const i18n = useI18n();
  const route = useRoute<RouteProp<RootStackParamList, 'Admin'>>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: 'Fashion',
    price: '',
    image: '',
    stock: '10',
  });
  const [customCategory, setCustomCategory] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  // Filtering State in Products Tab
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productSearch, setProductSearch] = useState('');

  // WhatsApp & Phone Notification Settings State
  const [waPhone, setWaPhone] = useState('');
  const [waApiKey, setWaApiKey] = useState('');
  const [waWebhookUrl, setWaWebhookUrl] = useState('');
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [waEnabled, setWaEnabled] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [showAdvancedWa, setShowAdvancedWa] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState<AdminSection>('Overview');

  useEffect(() => {
    if (route.params?.initialSection) {
      setSection(route.params.initialSection);
    }
  }, [route.params?.initialSection]);

  const load = useCallback(async (refresh = false) => {
    const network = await NetInfo.fetch();
    if (!network.isConnected) {
      setOffline(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setOffline(false);
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const results = await Promise.allSettled([
        getAdminStats(),
        getAdminOrders(),
        getAdminProducts(),
        getAdminCustomers(),
        getAdminNotifications(),
        getWhatsAppSettings(),
      ]);
      const [nextStats, nextOrders, nextProducts, nextCustomers, nextNotifs, nextWa] = results;
      if (nextStats.status === 'fulfilled') setStats(nextStats.value);
      if (nextOrders.status === 'fulfilled') setOrders(nextOrders.value);
      if (nextProducts.status === 'fulfilled') setProducts(nextProducts.value);
      if (nextCustomers.status === 'fulfilled') setCustomers(nextCustomers.value);
      if (nextNotifs.status === 'fulfilled') {
        setNotifications(nextNotifs.value.notifications || []);
        setUnreadNotifsCount(nextNotifs.value.unreadCount || 0);
      }
      if (nextWa.status === 'fulfilled') {
        setWaPhone(nextWa.value.phone || '');
        setWaApiKey(nextWa.value.apiKey || '');
        setWaWebhookUrl(nextWa.value.webhookUrl || '');
        setNtfyTopic(nextWa.value.ntfyTopic || '');
        setWaEnabled(Boolean(nextWa.value.enabled));
      }
      setError(results.every(result => result.status === 'rejected'));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function saveWhatsApp() {
    if (!waPhone.trim() && !waApiKey.trim() && !waWebhookUrl.trim() && !ntfyTopic.trim()) {
      Alert.alert('Configuration Required', 'Please enter your WhatsApp details, custom webhook, or ntfy topic.');
      return;
    }
    setWaSaving(true);
    try {
      const res = await updateWhatsAppSettings({
        phone: waPhone.trim(),
        apiKey: waApiKey.trim(),
        webhookUrl: waWebhookUrl.trim(),
        ntfyTopic: ntfyTopic.trim(),
      });
      setWaPhone(res.phone || '');
      setWaApiKey(res.apiKey || '');
      setWaWebhookUrl(res.webhookUrl || '');
      setNtfyTopic(res.ntfyTopic || '');
      setWaEnabled(Boolean(res.enabled));
      Alert.alert('Settings Saved', 'Your order notification preferences have been saved successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.message || 'Could not save notification settings');
    } finally {
      setWaSaving(false);
    }
  }

  async function testWhatsApp() {
    if (!((waPhone.trim() && waApiKey.trim()) || waWebhookUrl.trim() || ntfyTopic.trim())) {
      Alert.alert('Missing Details', 'Please provide either WhatsApp credentials or an ntfy topic to send a test alert.');
      return;
    }
    setWaTesting(true);
    try {
      const res = await testWhatsAppNotification({
        phone: waPhone.trim(),
        apiKey: waApiKey.trim(),
        webhookUrl: waWebhookUrl.trim(),
        ntfyTopic: ntfyTopic.trim(),
      });
      Alert.alert('Test Dispatched', res.message || 'Check your phone! A test notification was sent.');
    } catch (err: any) {
      Alert.alert('Test Failed', err?.response?.data?.message || 'Failed to dispatch test notification.');
    } finally {
      setWaTesting(false);
    }
  }

  function openCustomerWhatsApp(phoneRaw?: string, customerName?: string, orderId?: string) {
    if (!phoneRaw) return;
    const cleanPhone = phoneRaw.replace(/\D/g, '');
    if (!cleanPhone) {
      Alert.alert('No valid phone number', 'Customer phone number is invalid.');
      return;
    }
    const message = `Hello ${customerName || 'Customer'}, this is D&G Store regarding your order #${orderId || ''}.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open WhatsApp', `Could not open WhatsApp for number ${phoneRaw}`);
    });
  }

  function openCallMeBotWhatsApp() {
    const url = 'https://wa.me/34644442063?text=I+allow+callmebot+to+send+me+messages';
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Please save +34 644 44 20 63 in your phone contacts and send "I allow callmebot to send me messages" on WhatsApp.');
    });
  }

  async function markRead(id: number) {
    try {
      await markAdminNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  }

  async function markAllRead() {
    try {
      await markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifsCount(0);
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    load().catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [load]);

  async function updateStatus(order: AdminOrder, status: string): Promise<void> {
    try {
      await updateAdminOrderStatus(order.id, status);
      setOrders(current =>
        current.map(item => (item.id === order.id ? { ...item, status } : item)),
      );
    } catch {
      setError(true);
    }
  }

  function openCreateModal(): void {
    setEditingId(null);
    setForm({
      name: '',
      category: 'Fashion',
      price: '',
      image: '',
      stock: '10',
    });
    setCustomCategory('');
    setIsCategoryDropdownOpen(false);
    setFormError('');
    setFormVisible(true);
  }

  function openEditModal(product: AdminProduct): void {
    setEditingId(product.id);
    const isStandard = standardCategories.includes(product.category as any);
    setForm({
      name: product.name ?? '',
      category: isStandard ? product.category : 'Other',
      price: String(product.price ?? 0),
      image: product.image ?? '',
      stock: String(product.stock ?? 0),
    });
    setCustomCategory(isStandard ? '' : product.category);
    setIsCategoryDropdownOpen(false);
    setFormError('');
    setFormVisible(true);
  }

  async function saveProduct(): Promise<void> {
    const price = Number(form.price.trim());
    const stock = Number(form.stock.trim());
    const selectedCategory =
      form.category === 'Other' ? customCategory.trim() : form.category.trim();

    if (!form.name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!selectedCategory) {
      setFormError('Please select or specify a category.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError(i18n.t('adminInvalidPrice'));
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setFormError(i18n.t('adminInvalidStock'));
      return;
    }
    if (!form.image.trim()) {
      setFormError('Please enter an image URL.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        category: selectedCategory,
        price,
        image: form.image.trim(),
        stock,
      };

      if (editingId === null) {
        const saved = await createAdminProduct(payload);
        setProducts(current => [saved, ...current]);
        Alert.alert('Product added', `${saved.name} was added to the catalog.`);
      } else {
        const saved = await updateAdminProduct(editingId, payload);
        setProducts(current => current.map(item => (item.id === saved.id ? saved : item)));
        Alert.alert('Product updated', `${saved.name} was updated successfully.`);
      }

      setFormVisible(false);
      setEditingId(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || i18n.t('adminSaveError');
      setFormError(msg);
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product: AdminProduct): Promise<void> {
    Alert.alert(i18n.t('adminDeleteProduct'), `Are you sure you want to deactivate "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: i18n.t('adminDeleteProduct'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminProduct(product.id);
            setProducts(current =>
              current.map(item => (item.id === product.id ? { ...item, isActive: false } : item)),
            );
            Alert.alert('Product deactivated', `${product.name} is now inactive.`);
          } catch {
            setError(true);
          }
        },
      },
    ]);
  }

  // Filter products by category & search term
  const filteredProducts = products.filter(p => {
    const matchesCategory =
      productCategoryFilter === 'All' ||
      p.category.toLowerCase() === productCategoryFilter.toLowerCase();
    const matchesSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
      </View>
    );
  }

  if (offline) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{i18n.t('offlineMessage')}</Text>
        <Pressable onPress={() => load()} style={styles.retry}>
          <Text style={styles.retryText}>{i18n.t('retryButton')}</Text>
        </Pressable>
      </View>
    );
  }

  if (error && !stats && !orders.length && !products.length && !customers.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{i18n.t('adminError')}</Text>
        <Pressable onPress={() => load()} style={styles.retry}>
          <Text style={styles.retryText}>{i18n.t('retryButton')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StoreHeader title="Owner Dashboard" showBack />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => load(true)}
            refreshing={refreshing}
            tintColor={colors.gold}
          />
        }
      >
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>D&G eCOMMERCE RWANDA</Text>
            <Text style={styles.title}>{i18n.t('adminTitle')}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.live}>LIVE API</Text>
          </View>
        </View>

        {/* Section Tabs */}
        <ScrollView
          contentContainerStyle={styles.tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {sections.map(item => (
            <Pressable
              key={item}
              onPress={() => setSection(item)}
              style={[styles.tab, section === item && styles.tabActive]}
            >
              <Text style={[styles.tabText, section === item && styles.tabTextActive]}>{item}</Text>
              {item === 'Notifications' && unreadNotifsCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Overview Stats */}
        {section === 'Overview' && (
          <View>
            <Text style={styles.section}>{i18n.t('adminStats')}</Text>
            <View style={styles.metricRow}>
              <View style={[styles.metric, cardShadow]}>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={styles.metricValue}>{formatRwf(stats?.revenue ?? 0)}</Text>
              </View>
              <View style={[styles.metric, cardShadow]}>
                <Text style={styles.metricLabel}>Total Orders</Text>
                <Text style={styles.metricValue}>{stats?.totalOrders ?? 0}</Text>
              </View>
              <View style={[styles.metric, cardShadow]}>
                <Text style={styles.metricLabel}>Customers</Text>
                <Text style={styles.metricValue}>{stats?.customers ?? 0}</Text>
              </View>
            </View>

            <View style={styles.statusSummary}>
              {Object.entries(stats?.byStatus ?? {}).map(([status, count]) => (
                <View key={status} style={styles.statusItem}>
                  <Text style={styles.statusCount}>{count}</Text>
                  <Text style={styles.statusLabel}>{status}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Orders Section */}
        {(section === 'Overview' || section === 'Orders') && (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.section}>{i18n.t('adminOrdersSection')}</Text>
                {section === 'Overview' && orders.length > 0 && (
                  <Text style={styles.sectionSubtitle}>
                    Showing latest {Math.min(3, orders.length)} of {orders.length} orders
                  </Text>
                )}
              </View>
              {section === 'Overview' && orders.length > 3 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSection('Orders')}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllButtonText}>View all ({orders.length}) →</Text>
                </Pressable>
              )}
            </View>

            {orders.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t('adminNoOrders')}</Text>
            ) : (
              (section === 'Overview' ? orders.slice(0, 3) : orders).map(order => (
                <View key={order.id} style={[styles.card, cardShadow]}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{order.id}</Text>
                      <Text style={styles.muted}>
                        {order.customerName ?? order.customerEmail ?? 'Customer'}
                      </Text>
                    </View>
                    <Text style={styles.cardAmount}>{formatRwf(order.total)}</Text>
                  </View>
                  <Text style={styles.status}>{i18n.t('adminStatus', { status: order.status })}</Text>

                  {/* Multi-item breakdown */}
                  {order.items && order.items.length > 0 && (
                    <View style={styles.orderItemsSnippet}>
                      {order.items.map(it => (
                        <View key={it.productId} style={styles.orderItemSnippetRow}>
                          <Text numberOfLines={1} style={styles.orderItemSnippetText}>
                            • {it.quantity}x {it.name}
                          </Text>
                          <Text style={styles.orderItemSnippetPrice}>
                            {formatRwf(it.price * it.quantity)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Direct WhatsApp Customer Contact Button */}
                  {(() => {
                    const phoneMatch = (order.paymentMethod || '').match(/\b(07\d{8}|\+?250\d{9})\b/) ||
                                       (order.deliveryAddress || '').match(/\b(07\d{8}|\+?250\d{9})\b/);
                    const custPhone = phoneMatch ? phoneMatch[0] : '';
                    if (!custPhone) return null;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openCustomerWhatsApp(custPhone, order.customerName || 'Customer', order.id)}
                        style={styles.orderWhatsAppBtn}
                      >
                        <MessageCircle color="#075E54" size={13} strokeWidth={2.5} />
                        <Text style={styles.orderWhatsAppBtnText}>Chat with Customer on WhatsApp ({custPhone})</Text>
                      </Pressable>
                    );
                  })()}

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                    {statuses.map(status => (
                      <Pressable
                        disabled={status === order.status}
                        key={status}
                        onPress={() => updateStatus(order, status)}
                        style={[
                          styles.smallButton,
                          status === order.status && styles.smallButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallButtonText,
                            status === order.status && styles.smallButtonTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ))
            )}

            {section === 'Overview' && orders.length > 3 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSection('Orders')}
                style={styles.overviewMoreOrdersBtn}
              >
                <Text style={styles.overviewMoreOrdersBtnText}>
                  + See remaining {orders.length - 3} orders in Orders tab →
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Notifications Section */}
        {section === 'Notifications' && (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.section}>Order Notifications</Text>
                <Text style={styles.sectionSubtitle}>
                  {unreadNotifsCount} unread • {notifications.length} total alerts
                </Text>
              </View>
              {unreadNotifsCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={markAllRead}
                  style={styles.markAllReadBtn}
                >
                  <Check color={colors.goldDark} size={14} strokeWidth={2.5} />
                  <Text style={styles.markAllReadText}>Mark all as read</Text>
                </Pressable>
              )}
            </View>

            {notifications.length === 0 ? (
              <View style={[styles.emptyContainer, cardShadow]}>
                <Bell color={colors.mutedLight} size={36} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Order Notifications</Text>
                <Text style={styles.emptyText}>
                  When customers place orders in the app, you will receive instant notifications and chimes here.
                </Text>
              </View>
            ) : (
              <View style={styles.notifList}>
                {notifications.map(notif => {
                  let parsed: { customerName?: string; customerPhone?: string; orderId?: string; total?: number; itemsCount?: number; items?: string[]; paymentMethod?: string; deliveryAddress?: string } = {};
                  if (notif.data) {
                    try {
                      parsed = JSON.parse(notif.data);
                    } catch {
                      parsed = {};
                    }
                  }

                  return (
                    <View
                      key={notif.id}
                      style={[
                        styles.notifCard,
                        cardShadow,
                        !notif.isRead && styles.notifCardUnread,
                      ]}
                    >
                      <View style={styles.notifTopRow}>
                        <View style={styles.notifBadgeGroup}>
                          <View
                            style={[
                              styles.notifIconWrap,
                              !notif.isRead ? styles.notifIconWrapUnread : styles.notifIconWrapRead,
                            ]}
                          >
                            <Bell
                              color={!notif.isRead ? colors.gold : colors.muted}
                              size={14}
                              strokeWidth={2}
                            />
                          </View>
                          <Text
                            style={[
                              styles.notifTitle,
                              !notif.isRead && styles.notifTitleUnread,
                            ]}
                          >
                            {notif.title}
                          </Text>
                          {!notif.isRead && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notifTime}>
                          {new Date(notif.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      <Text style={styles.notifMessage}>{notif.message}</Text>

                      {parsed.deliveryAddress && (
                        <Text style={styles.notifDetailText}>
                          📍 Delivery: {parsed.deliveryAddress}
                        </Text>
                      )}

                      {parsed.paymentMethod && (
                        <Text style={styles.notifDetailText}>
                          💳 Payment: {parsed.paymentMethod}
                        </Text>
                      )}

                      {parsed.customerPhone && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => openCustomerWhatsApp(parsed.customerPhone, parsed.customerName, parsed.orderId)}
                          style={styles.orderWhatsAppBtn}
                        >
                          <MessageCircle color="#075E54" size={13} strokeWidth={2.5} />
                          <Text style={styles.orderWhatsAppBtnText}>WhatsApp Customer ({parsed.customerPhone})</Text>
                        </Pressable>
                      )}

                      <View style={styles.notifActionRow}>
                        <Pressable
                          style={styles.notifViewBtn}
                          onPress={() => {
                            if (!notif.isRead) markRead(notif.id);
                            setSection('Orders');
                          }}
                        >
                          <Text style={styles.notifViewBtnText}>View in Orders →</Text>
                        </Pressable>
                        {!notif.isRead && (
                          <Pressable
                            style={styles.notifMarkReadBtn}
                            onPress={() => markRead(notif.id)}
                          >
                            <Text style={styles.notifMarkReadText}>Mark read</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* WhatsApp Instant Order Alerts Setup Card */}
            <View style={[styles.waAlertCard, cardShadow]}>
              <View style={styles.waAlertHeader}>
                <View style={styles.waIconWrap}>
                  <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.waAlertTitle}>WhatsApp Instant Order Alerts</Text>
                  <Text style={styles.waAlertSubtitle}>Get new orders sent directly to your phone</Text>
                </View>
                <View style={[styles.waStatusBadge, waEnabled ? styles.waStatusBadgeActive : styles.waStatusBadgeInactive]}>
                  {waEnabled ? (
                    <>
                      <Check color="#0F5132" size={12} strokeWidth={3} />
                      <Text style={styles.waStatusBadgeTextActive}>Active</Text>
                    </>
                  ) : (
                    <Text style={styles.waStatusBadgeTextInactive}>Not Configured</Text>
                  )}
                </View>
              </View>

              <Text style={styles.waExplainerText}>
                Receive a direct WhatsApp alert on your personal phone with complete order details (customer name, items, delivery address, and amount) as soon as an order is placed.
              </Text>

              {/* 30-Second Setup Guide */}
              <View style={styles.waGuideBox}>
                <Text style={styles.waGuideTitle}>⚡ Option A: Free WhatsApp Bot (CallMeBot):</Text>
                <Text style={styles.waStepText}>
                  <Text style={styles.waStepNum}>1. </Text>Open WhatsApp & message CallMeBot to get your API key:
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={openCallMeBotWhatsApp}
                  style={styles.waOpenBotBtn}
                >
                  <MessageCircle color="#075E54" size={15} strokeWidth={2.5} />
                  <Text style={styles.waOpenBotBtnText}>Open CallMeBot on WhatsApp</Text>
                  <ExternalLink color="#075E54" size={13} />
                </Pressable>
                <Text style={styles.waStepText}>
                  <Text style={styles.waStepNum}>2. </Text>Send: <Text style={styles.waCodeText}>I allow callmebot to send me messages</Text>
                </Text>
                <Text style={styles.waStepText}>
                  <Text style={styles.waStepNum}>3. </Text>Paste your phone number & received API key below:
                </Text>
              </View>

              {/* Input: Owner Phone */}
              <Text style={styles.waInputLabel}>Your WhatsApp Phone Number (with Country Code) *</Text>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setWaPhone}
                placeholder="e.g. +250 788 123 456"
                placeholderTextColor={colors.mutedLight}
                style={styles.waInput}
                value={waPhone}
              />

              {/* Input: API Key */}
              <Text style={styles.waInputLabel}>CallMeBot API Key *</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setWaApiKey}
                placeholder="e.g. 123456"
                placeholderTextColor={colors.mutedLight}
                style={styles.waInput}
                value={waApiKey}
              />

              {/* Instant Phone Push Option (ntfy.sh - 100% Free & Zero Wait) */}
              <View style={styles.ntfySection}>
                <View style={styles.ntfyHeader}>
                  <Bell color="#1B5E20" size={15} strokeWidth={2.5} />
                  <Text style={styles.ntfyTitle}>⚡ Option B: Instant Phone Lockscreen Alerts (ntfy.sh)</Text>
                </View>
                <Text style={styles.ntfyExplainer}>
                  Free, zero-signup, and has no capacity limits! Enter a secret topic name below, install the free <Text style={{ fontWeight: '700' }}>ntfy</Text> app on Android/iOS, and receive instant sound & vibration order alerts!
                </Text>
                <Text style={styles.waInputLabel}>ntfy Secret Topic Name</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setNtfyTopic}
                  placeholder="e.g. dgstore-owner-alerts-kigali"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.waInput}
                  value={ntfyTopic}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => Linking.openURL(`https://ntfy.sh/${ntfyTopic || 'dgstore-owner-alerts'}`)}
                  style={styles.ntfyOpenBtn}
                >
                  <ExternalLink color="#075E54" size={13} />
                  <Text style={styles.ntfyOpenBtnText}>Open / Subscribe to Topic in Browser or App</Text>
                </Pressable>
              </View>

              {/* Advanced Custom Webhook Toggle */}
              <Pressable
                onPress={() => setShowAdvancedWa(prev => !prev)}
                style={styles.waAdvancedToggle}
              >
                <Text style={styles.waAdvancedToggleText}>
                  {showAdvancedWa ? '▾ Hide Advanced Webhook' : '▸ Option C: Custom Webhook URL (TextMeBot, Twilio, Zapier, Make)'}
                </Text>
              </Pressable>

              {showAdvancedWa && (
                <View style={styles.waAdvancedContainer}>
                  <Text style={styles.waInputLabel}>Custom Webhook Endpoint URL (Optional)</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    onChangeText={setWaWebhookUrl}
                    placeholder="https://your-custom-webhook.com/order-alert"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.waInput}
                    value={waWebhookUrl}
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.waBtnRow}>
                <Pressable
                  disabled={waSaving}
                  onPress={saveWhatsApp}
                  style={[styles.waSaveBtn, waSaving && styles.btnDisabled]}
                >
                  {waSaving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Check color={colors.white} size={15} strokeWidth={2.5} />
                      <Text style={styles.waSaveBtnText}>Save WhatsApp</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  disabled={waTesting}
                  onPress={testWhatsApp}
                  style={[styles.waTestBtn, waTesting && styles.btnDisabled]}
                >
                  {waTesting ? (
                    <ActivityIndicator color="#075E54" size="small" />
                  ) : (
                    <>
                      <Send color="#075E54" size={14} strokeWidth={2.5} />
                      <Text style={styles.waTestBtnText}>Test Message</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Products Section */}
        {(section === 'Overview' || section === 'Products') && (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.section}>{i18n.t('adminProductsSection')}</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Add new product"
                onPress={openCreateModal}
                style={styles.addButton}
              >
                <Plus color={colors.white} size={15} />
                <Text style={styles.addButtonText}>Add product</Text>
              </Pressable>
            </View>

            {/* Product Category Filter Chips */}
            <ScrollView
              contentContainerStyle={styles.filterChipRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                onPress={() => setProductCategoryFilter('All')}
                style={[
                  styles.filterChip,
                  productCategoryFilter === 'All' && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    productCategoryFilter === 'All' && styles.filterChipTextActive,
                  ]}
                >
                  All ({products.length})
                </Text>
              </Pressable>
              {standardCategories.map(cat => {
                const count = products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setProductCategoryFilter(cat)}
                    style={[
                      styles.filterChip,
                      productCategoryFilter === cat && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        productCategoryFilter === cat && styles.filterChipTextActive,
                      ]}
                    >
                      {cat} {count > 0 ? `(${count})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Product Search Input */}
            <View style={styles.searchBox}>
              <Search color={colors.muted} size={16} />
              <TextInput
                onChangeText={setProductSearch}
                placeholder="Search products to edit or manage..."
                placeholderTextColor={colors.mutedLight}
                style={styles.searchInput}
                value={productSearch}
              />
              {productSearch ? (
                <Pressable onPress={() => setProductSearch('')}>
                  <X color={colors.muted} size={16} />
                </Pressable>
              ) : null}
            </View>

            {/* Products List */}
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Package color={colors.muted} size={32} />
                <Text style={styles.emptyText}>{i18n.t('adminNoProducts')}</Text>
              </View>
            ) : (
              filteredProducts.map(product => (
                <View key={product.id} style={[styles.card, cardShadow]}>
                  <View style={styles.productRow}>
                    <Image
                      resizeMode="cover"
                      source={{ uri: product.image }}
                      style={styles.productThumb}
                    />
                    <View style={styles.productInfo}>
                      <View style={styles.orderHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text numberOfLines={1} style={styles.cardTitle}>
                            {product.name}
                          </Text>
                          <View style={styles.productMetaRow}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{product.category}</Text>
                            </View>
                            <Text style={styles.stockText}>
                              {i18n.t('stockLabel', { count: product.stock })}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardAmount}>{formatRwf(product.price)}</Text>
                      </View>

                      {/* Action buttons: Edit & Deactivate */}
                      <View style={styles.actions}>
                        <Pressable
                          accessibilityLabel={`Edit ${product.name}`}
                          accessibilityRole="button"
                          onPress={() => openEditModal(product)}
                          style={styles.editButton}
                        >
                          <Edit3 color={colors.goldDark} size={14} />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </Pressable>

                        {product.isActive ? (
                          <Pressable
                            accessibilityLabel={`Deactivate ${product.name}`}
                            accessibilityRole="button"
                            onPress={() => removeProduct(product)}
                            style={styles.deleteButton}
                          >
                            <Trash2 color={colors.danger} size={14} />
                            <Text style={styles.deleteButtonText}>
                              {i18n.t('adminDeleteProduct')}
                            </Text>
                          </Pressable>
                        ) : (
                          <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveText}>Inactive</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Customers Section */}
        {(section === 'Overview' || section === 'Customers') && (
          <View>
            <Text style={styles.section}>{i18n.t('adminCustomersSection')}</Text>
            {customers.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t('adminNoCustomers')}</Text>
            ) : (
              customers.map(customer => (
                <View key={customer.id} style={styles.customer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {customer.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.cardTitle}>{customer.name}</Text>
                    <Text style={styles.muted}>{customer.email}</Text>
                  </View>
                  <Text style={styles.cardAmount}>{formatRwf(customer.totalSpend)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* ADD / EDIT PRODUCT MODAL (Rock-Solid & Easy to Edit)       */}
      {/* ========================================================= */}
      <Modal
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
        transparent
        visible={formVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modal, cardShadow]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingId === null ? 'Add Product' : 'Edit Product'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingId === null
                    ? 'Fill in the product details below'
                    : `Editing product ID #${editingId}`}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close product form"
                hitSlop={12}
                onPress={() => setFormVisible(false)}
                style={styles.closeButton}
              >
                <X color={colors.ink} size={20} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Product Name Input */}
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                onChangeText={name => setForm(current => ({ ...current, name }))}
                placeholder="e.g. Italian Leather Oxford"
                placeholderTextColor={colors.mutedLight}
                style={styles.input}
                value={form.name}
              />

              {/* Category Dropdown Selector */}
              <Text style={styles.inputLabel}>Category *</Text>
              <Pressable
                accessibilityLabel="Select product category"
                accessibilityRole="button"
                onPress={() => setIsCategoryDropdownOpen(current => !current)}
                style={styles.dropdownTrigger}
              >
                <View style={styles.dropdownLeft}>
                  <Tag color={colors.goldDark} size={16} />
                  <Text style={styles.dropdownSelectedText}>
                    {form.category === 'Other' && customCategory
                      ? `Other: ${customCategory}`
                      : form.category}
                  </Text>
                </View>
                {isCategoryDropdownOpen ? (
                  <ChevronUp color={colors.ink} size={18} />
                ) : (
                  <ChevronDown color={colors.muted} size={18} />
                )}
              </Pressable>

              {/* Dropdown Options List */}
              {isCategoryDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {standardCategories.map(cat => {
                    const isSelected = form.category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => {
                          setForm(current => ({ ...current, category: cat }));
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                        {isSelected && <Check color={colors.goldDark} size={16} />}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Quick Category Chips for 1-Tap Selection */}
              <View style={styles.quickChipsRow}>
                {standardCategories.slice(0, 5).map(cat => {
                  const isSelected = form.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        setForm(current => ({ ...current, category: cat }));
                        setIsCategoryDropdownOpen(false);
                      }}
                      style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                    >
                      <Text
                        style={[
                          styles.quickChipText,
                          isSelected && styles.quickChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* If "Other" selected, display custom category input */}
              {form.category === 'Other' && (
                <View style={styles.customCatBox}>
                  <Text style={styles.inputSubLabel}>Custom Category Name *</Text>
                  <TextInput
                    onChangeText={setCustomCategory}
                    placeholder="Enter custom category (e.g. Watches, Sports)"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.input}
                    value={customCategory}
                  />
                </View>
              )}

              {/* Price & Stock Row */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Price (RWF) *</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={price => setForm(current => ({ ...current, price }))}
                    placeholder="45000"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.input}
                    value={form.price}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Stock Count *</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={stock => setForm(current => ({ ...current, stock }))}
                    placeholder="10"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.input}
                    value={form.stock}
                  />
                </View>
              </View>

              {/* Image URL Input */}
              <Text style={styles.inputLabel}>Image URL *</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="url"
                onChangeText={image => setForm(current => ({ ...current, image }))}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.mutedLight}
                style={styles.input}
                value={form.image}
              />

              {/* Image Live Preview */}
              {form.image.trim() ? (
                <View style={styles.previewContainer}>
                  <Image
                    resizeMode="cover"
                    source={{ uri: form.image.trim() }}
                    style={styles.formPreview}
                  />
                  <Text style={styles.previewCaption}>Live Image Preview</Text>
                </View>
              ) : (
                <View style={styles.formPreviewEmpty}>
                  <Text style={styles.muted}>Image preview will appear here</Text>
                </View>
              )}

              {/* Error Message */}
              {formError ? (
                <View style={styles.errorBox}>
                  <AlertCircle color={colors.danger} size={16} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <Pressable
                accessibilityLabel="Submit product changes"
                accessibilityRole="button"
                disabled={saving}
                onPress={saveProduct}
                style={[styles.saveSubmitButton, saving && styles.buttonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Check color={colors.white} size={18} strokeWidth={2.5} />
                )}
                <Text style={styles.saveSubmitButtonText}>
                  {saving
                    ? 'Saving...'
                    : editingId === null
                    ? i18n.t('adminCreateProduct')
                    : i18n.t('adminUpdateProduct')}
                </Text>
              </Pressable>

              {/* Cancel Button */}
              <Pressable
                accessibilityLabel="Cancel editing"
                onPress={() => setFormVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: colors.ink,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radius,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  categoryBadge: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.page,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  container: {
    padding: spacing.page,
    paddingBottom: 60,
  },
  customCatBox: {
    marginBottom: 8,
  },
  customer: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 13,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 11,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownItem: {
    alignItems: 'center',
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownItemSelected: {
    backgroundColor: colors.goldLight,
  },
  dropdownItemText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemTextSelected: {
    color: colors.goldDark,
    fontWeight: '800',
  },
  dropdownLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dropdownMenu: {
    backgroundColor: colors.white,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 8,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownSelectedText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownTrigger: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editButtonText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.radius,
    gap: 8,
    marginVertical: 20,
    padding: 30,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    padding: 10,
  },
  errorText: {
    color: colors.danger,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  eyebrow: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  filterChip: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  formCol: {
    flex: 1,
  },
  formPreview: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    height: 120,
    width: '100%',
  },
  formPreviewEmpty: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: 8,
    borderWidth: 1,
    height: 70,
    justifyContent: 'center',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inactiveBadge: {
    backgroundColor: colors.paper,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inactiveText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    height: 46,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 5,
    marginTop: 4,
  },
  inputSubLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  live: {
    color: colors.green,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    backgroundColor: colors.green,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 10,
  },
  metric: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    padding: 12,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    maxHeight: '88%',
    overflow: 'hidden',
    padding: spacing.page,
    width: '94%',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 20, 16, 0.65)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  modalScroll: {
    paddingBottom: 20,
    paddingTop: 12,
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  muted: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemsSnippet: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    padding: 8,
  },
  orderItemSnippetRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  orderItemSnippetText: {
    color: colors.ink,
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
  },
  orderItemSnippetPrice: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  previewCaption: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  productRow: {
    flexDirection: 'row',
  },
  productThumb: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    height: 80,
    width: 80,
  },
  quickChip: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickChipSelected: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },
  quickChipText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  quickChipTextSelected: {
    color: colors.goldDark,
    fontWeight: '800',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  retry: {
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
  },
  saveSubmitButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 10,
  },
  saveSubmitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
  },
  section: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 20,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  smallButton: {
    borderColor: colors.line,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 6,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  smallButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  smallButtonText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  smallButtonTextActive: {
    color: colors.white,
  },
  status: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  statusCount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  statusItem: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    marginRight: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
  },
  statusRow: {
    marginTop: 4,
  },
  statusSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  stockText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  tab: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.white,
  },
  tabs: {
    paddingVertical: 14,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  viewAllButton: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  viewAllButtonText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  overviewMoreOrdersBtn: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 12,
  },
  overviewMoreOrdersBtnText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    marginLeft: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  markAllReadBtn: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusPill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markAllReadText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  notifList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  notifCard: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    padding: spacing.md,
  },
  notifCardUnread: {
    backgroundColor: '#FFFCF5',
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  notifTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notifBadgeGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  notifIconWrap: {
    alignItems: 'center',
    borderRadius: spacing.radiusPill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  notifIconWrapUnread: {
    backgroundColor: colors.goldLight,
  },
  notifIconWrapRead: {
    backgroundColor: colors.cream,
  },
  notifTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  notifTitleUnread: {
    fontWeight: '800',
  },
  unreadDot: {
    backgroundColor: colors.danger,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  notifTime: {
    color: colors.muted,
    fontSize: 11,
  },
  notifMessage: {
    color: colors.inkLight,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifDetailText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  notifActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 10,
  },
  notifViewBtn: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  notifViewBtnText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  notifMarkReadBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  notifMarkReadText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  telegramGuideCard: {
    backgroundColor: '#F9FBF9',
    borderColor: '#CDE5D4',
    borderRadius: spacing.radius,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  telegramGuideHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  telegramIconWrap: {
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  telegramGuideTitle: {
    color: '#1E4620',
    fontSize: 13,
    fontWeight: '800',
  },
  telegramGuideText: {
    color: '#2D5B31',
    fontSize: 12,
    lineHeight: 17,
  },
  codeHighlight: {
    color: '#0E3A12',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  waAlertCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CDE5D4',
    borderRadius: spacing.radius,
    borderWidth: 1.5,
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  waAlertHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm,
  },
  waIconWrap: {
    alignItems: 'center',
    backgroundColor: '#25D366',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  waAlertTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  waAlertSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  waStatusBadge: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  waStatusBadgeActive: {
    backgroundColor: '#D1E7DD',
    borderColor: '#A3CFBB',
    borderWidth: 1,
  },
  waStatusBadgeInactive: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFE69C',
    borderWidth: 1,
  },
  waStatusBadgeTextActive: {
    color: '#0F5132',
    fontSize: 11,
    fontWeight: '800',
  },
  waStatusBadgeTextInactive: {
    color: '#664D03',
    fontSize: 11,
    fontWeight: '700',
  },
  waExplainerText: {
    color: colors.inkLight,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  waGuideBox: {
    backgroundColor: '#F0FBF4',
    borderColor: '#D0EED9',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  waGuideTitle: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  waStepText: {
    color: '#2E7D32',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  waStepNum: {
    color: '#1B5E20',
    fontWeight: '800',
  },
  waCodeText: {
    backgroundColor: '#E8F5E9',
    color: '#0D5302',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  waOpenBotBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCF8C6',
    borderColor: '#25D366',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginVertical: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  waOpenBotBtnText: {
    color: '#075E54',
    fontSize: 12,
    fontWeight: '800',
  },
  waInputLabel: {
    color: colors.ink,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  waInput: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  waAdvancedToggle: {
    marginTop: 8,
    paddingVertical: 4,
  },
  waAdvancedToggleText: {
    color: colors.muted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  waAdvancedContainer: {
    marginTop: 4,
  },
  waBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  waSaveBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 8,
    flex: 1.4,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  waSaveBtnText: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: '700',
  },
  waTestBtn: {
    alignItems: 'center',
    backgroundColor: '#DCF8C6',
    borderColor: '#25D366',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  waTestBtnText: {
    color: '#075E54',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  orderWhatsAppBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCF8C6',
    borderColor: '#25D366',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginVertical: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderWhatsAppBtnText: {
    color: '#075E54',
    fontSize: 11,
    fontWeight: '800',
  },
  ntfySection: {
    backgroundColor: '#F0FBF4',
    borderColor: '#CDE5D4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: spacing.sm,
  },
  ntfyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  ntfyTitle: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: '800',
  },
  ntfyExplainer: {
    color: '#2D5B31',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  ntfyOpenBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCF8C6',
    borderColor: '#25D366',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  ntfyOpenBtnText: {
    color: '#075E54',
    fontSize: 11,
    fontWeight: '700',
  },
});

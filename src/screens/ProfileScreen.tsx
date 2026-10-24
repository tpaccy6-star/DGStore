import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {
  Building2,
  CreditCard,
  Edit3,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  PhoneCall,
  RefreshCw,
  Save,
  Server,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n } from '../i18n';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthState, setAuth } from '../store/authSlice';
import { clearAuth, getStoredAuth, saveAuth } from '../store/authStorage';
import { updateProfile, changePassword } from '../api/auth';
import { openWhatsAppConcierge, callConcierge, CONCIERGE_PHONE } from '../utils/concierge';
import { API_BASE_URL, apiClient, setApiToken } from '../api/client';
import { getSavedDeliveryAddress, saveDeliveryAddress } from '../store/deliveryStorage';
import {
  getSavedPaymentInfo,
  savePaymentInfo,
  type SavedPaymentInfo,
} from '../store/paymentStorage';
import { getSavedServerUrl, saveServerUrl } from '../store/serverStorage';
import { StoreHeader } from '../components/StoreHeader';
import { BottomNav } from '../components/BottomNav';
import { cardShadow, colors, spacing } from '../theme';

const bankOptions = ['Bank of Kigali', 'I&M Bank', 'Equity Bank', 'Cogebanque'];

export function ProfileScreen(): React.JSX.Element {
  const i18n = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [offline, setOffline] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [paymentInfo, setPaymentInfo] = useState<SavedPaymentInfo>({
    preferredMethod: 'momo',
    momoPhone: '',
    airtelPhone: '',
    bankName: '',
    bankAccount: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [testingConnection, setTestingConnection] = useState(false);

  // Profile Editing state
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  // Password change state
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName(): Promise<void> {
    if (!nameInput.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setSavingName(true);
    try {
      const res = await updateProfile({ name: nameInput.trim() });
      if (res.user) {
        const stored = await getStoredAuth();
        if (stored) {
          const updatedAuth = { ...stored, user: { ...stored.user, name: res.user.name } };
          await saveAuth(updatedAuth);
          dispatch(setAuth(updatedAuth));
        }
      }
      setEditNameModalVisible(false);
      Alert.alert('Updated', 'Your profile name has been updated.');
    } catch {
      Alert.alert('Error', 'Unable to update profile name. Please try again.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(): Promise<void> {
    if (!currentPassword) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setChangePasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been changed successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to update password. Verify your current password.';
      Alert.alert('Error', msg);
    } finally {
      setSavingPassword(false);
    }
  }

  useEffect(() => {
    NetInfo.fetch()
      .then(state => setOffline(!state.isConnected))
      .catch(() => setOffline(true));
    getSavedDeliveryAddress()
      .then(setDeliveryAddress)
      .catch(() => undefined);
    getSavedPaymentInfo()
      .then(info => {
        if (info) setPaymentInfo(info);
      })
      .catch(() => undefined);
    getSavedServerUrl()
      .then(url => {
        if (url) setServerUrl(url);
      })
      .catch(() => undefined);
  }, []);

  async function handleSaveServerUrl(): Promise<void> {
    if (!serverUrl.trim()) return;
    setTestingConnection(true);
    let target = serverUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `http://${target}`;
    }
    try {
      await saveServerUrl(target);
      const res = await apiClient.get('/health', { timeout: 4000 });
      if (res.data?.ok) {
        Alert.alert('Connected!', `Successfully connected to DGStore backend at ${target}`);
      } else {
        Alert.alert('Saved', `Server URL updated to ${target}`);
      }
    } catch {
      Alert.alert(
        'Server Saved',
        `Saved ${target}. If your phone is on the same Wi-Fi, ensure your PC firewall allows port 3001 and the server is running.`,
      );
    } finally {
      setTestingConnection(false);
    }
  }

  function logout(): void {
    clearAuth().catch(() => undefined);
    setApiToken(null);
    dispatch(clearAuthState());
    navigation.navigate('Home');
  }

  async function saveAddress(): Promise<void> {
    if (!deliveryAddress.trim()) {
      Alert.alert('Delivery address', 'Please enter a delivery address or landmark.');
      return;
    }
    setSavingAddress(true);
    try {
      await saveDeliveryAddress(deliveryAddress.trim());
      Alert.alert('Delivery address', 'Your delivery place has been saved.');
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSavePayment(): Promise<void> {
    setSavingPayment(true);
    try {
      await savePaymentInfo(paymentInfo);
      Alert.alert('Payment Methods', 'Your payment methods have been saved for easy checkout.');
    } finally {
      setSavingPayment(false);
    }
  }

  async function detectLocation(): Promise<void> {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Location permission', 'Allow location access to detect your delivery place.');
        return;
      }
    }
    setDetectingLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        const place = `Kigali (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
        setDeliveryAddress(place);
        saveDeliveryAddress(place).catch(() => undefined);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        Alert.alert(
          'Location unavailable',
          'Please enter your street name, sector or landmark manually.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  const initial = user?.name ? user.name.slice(0, 1).toUpperCase() : 'U';

  return (
    <View style={styles.screen}>
      <StoreHeader title="Account" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {offline ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{i18n.t('offlineMessage')}</Text>
          </View>
        ) : null}

        {/* User Hero Profile Card */}
        <View style={[styles.profileCard, cardShadow]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Shield color={colors.white} size={11} strokeWidth={2.5} />
            </View>
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{user?.name ?? 'Customer'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? 'No email'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {user?.role === 'owner' ? 'STORE OWNER' : 'VERIFIED CUSTOMER'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Details Section */}
        <View style={[styles.sectionCard, cardShadow]}>
          <Text style={styles.cardHeaderTitle}>Account Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <UserIcon color={colors.ink} size={16} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{i18n.t('name')}</Text>
              <Text style={styles.detailValue}>{user?.name ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Mail color={colors.ink} size={16} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{i18n.t('email')}</Text>
              <Text style={styles.detailValue}>{user?.email ?? '-'}</Text>
            </View>
          </View>

          {user?.username ? (
            <View style={[styles.detailRow, styles.noBorderRow]}>
              <View style={styles.detailIconBox}>
                <Shield color={colors.ink} size={16} />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>{i18n.t('username')}</Text>
                <Text style={styles.detailValue}>@{user.username}</Text>
              </View>
            </View>
          ) : null}

          {/* Account Action Buttons */}
          <View style={styles.accountActionButtons}>
            <TouchableOpacity
              style={styles.accountActionBtn}
              onPress={() => {
                setNameInput(user?.name ?? '');
                setEditNameModalVisible(true);
              }}
            >
              <Edit3 size={14} color={colors.goldDark} />
              <Text style={styles.accountActionBtnText}>Edit Name</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountActionBtn}
              onPress={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setChangePasswordModalVisible(true);
              }}
            >
              <KeyRound size={14} color={colors.goldDark} />
              <Text style={styles.accountActionBtnText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Boutique Concierge & WhatsApp VIP Support */}
        <View style={[styles.sectionCard, styles.conciergeSectionCard, cardShadow]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIconRow}>
              <MessageCircle color={colors.goldDark} size={18} />
              <Text style={styles.cardHeaderTitle}>Boutique VIP Concierge (Kigali)</Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            Direct personal styling, sizing advice, or instant Kigali delivery inquiries.
          </Text>

          <View style={styles.conciergeButtonRow}>
            <TouchableOpacity
              style={styles.whatsappDirectBtn}
              activeOpacity={0.85}
              onPress={() =>
                openWhatsAppConcierge(
                  `Hello D&G Store Concierge, I am ${user?.name || 'a customer'} inquiring about shopping assistance.`,
                )
              }
            >
              <MessageCircle size={16} color={colors.white} />
              <Text style={styles.whatsappDirectBtnText}>Chat on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callHotlineBtn}
              activeOpacity={0.85}
              onPress={() => callConcierge()}
            >
              <PhoneCall size={15} color={colors.ink} />
              <Text style={styles.callHotlineBtnText}>Call Hotline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Place Section */}
        <View style={[styles.sectionCard, cardShadow]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIconRow}>
              <MapPin color={colors.goldDark} size={18} />
              <Text style={styles.cardHeaderTitle}>Default Delivery Place</Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            Used for automatic checkout across Kigali and Rwanda.
          </Text>

          <TextInput
            multiline
            onChangeText={setDeliveryAddress}
            placeholder="e.g. Kigali, Nyarugenge, KN 4 Ave / Near Kigali Heights"
            placeholderTextColor={colors.mutedLight}
            style={styles.addressInput}
            value={deliveryAddress}
          />

          <View style={styles.addressActions}>
            <Pressable
              accessibilityLabel="Detect GPS location"
              accessibilityRole="button"
              disabled={detectingLocation}
              onPress={() => {
                detectLocation().catch(() => setDetectingLocation(false));
              }}
              style={styles.locationButton}
            >
              <Navigation color={colors.green} size={14} />
              <Text style={styles.locationButtonText}>
                {detectingLocation ? 'Detecting...' : 'Current GPS'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Save delivery address"
              accessibilityRole="button"
              disabled={savingAddress}
              onPress={() => {
                saveAddress().catch(() => setSavingAddress(false));
              }}
              style={styles.saveButton}
            >
              <Save color={colors.white} size={14} />
              <Text style={styles.saveButtonText}>{savingAddress ? 'Saving...' : 'Save place'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Payment Methods Section */}
        <View style={[styles.sectionCard, cardShadow]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIconRow}>
              <CreditCard color={colors.goldDark} size={18} />
              <Text style={styles.cardHeaderTitle}>Saved Payment Methods</Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            Save your phone number and bank account for instant one-tap checkout.
          </Text>

          {/* Preferred Method Selector */}
          <Text style={styles.inputSublabel}>Default Payment Channel</Text>
          <View style={styles.methodSelectorRow}>
            {[
              { key: 'momo', label: 'MTN MoMo' },
              { key: 'airtel', label: 'Airtel Money' },
              { key: 'card', label: 'Bank / Card' },
            ].map(method => {
              const isSelected = paymentInfo.preferredMethod === method.key;
              return (
                <Pressable
                  key={method.key}
                  onPress={() =>
                    setPaymentInfo(current => ({
                      ...current,
                      preferredMethod: method.key as 'momo' | 'airtel' | 'card',
                    }))
                  }
                  style={[styles.methodChip, isSelected && styles.methodChipSelected]}
                >
                  <Text style={[styles.methodChipText, isSelected && styles.methodChipTextSelected]}>
                    {method.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mobile Money Phone */}
          <Text style={styles.inputSublabel}>MTN Mobile Money Phone Number</Text>
          <View style={styles.inputWithIcon}>
            <Phone color={colors.muted} size={16} style={styles.inputFieldIcon} />
            <TextInput
              keyboardType="phone-pad"
              onChangeText={momoPhone => setPaymentInfo(current => ({ ...current, momoPhone }))}
              placeholder="e.g. 0788 123 456"
              placeholderTextColor={colors.mutedLight}
              style={styles.cleanInput}
              value={paymentInfo.momoPhone}
            />
          </View>

          {/* Airtel Money Phone */}
          <Text style={styles.inputSublabel}>Airtel Money Phone Number</Text>
          <View style={styles.inputWithIcon}>
            <Phone color={colors.muted} size={16} style={styles.inputFieldIcon} />
            <TextInput
              keyboardType="phone-pad"
              onChangeText={airtelPhone => setPaymentInfo(current => ({ ...current, airtelPhone }))}
              placeholder="e.g. 0733 123 456"
              placeholderTextColor={colors.mutedLight}
              style={styles.cleanInput}
              value={paymentInfo.airtelPhone}
            />
          </View>

          {/* Bank Name */}
          <Text style={styles.inputSublabel}>Bank Name</Text>
          <View style={styles.bankChipsRow}>
            {bankOptions.map(bank => {
              const isSelected = paymentInfo.bankName === bank;
              return (
                <Pressable
                  key={bank}
                  onPress={() => setPaymentInfo(current => ({ ...current, bankName: bank }))}
                  style={[styles.bankChip, isSelected && styles.bankChipSelected]}
                >
                  <Text style={[styles.bankChipText, isSelected && styles.bankChipTextSelected]}>
                    {bank}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.inputWithIcon}>
            <Building2 color={colors.muted} size={16} style={styles.inputFieldIcon} />
            <TextInput
              onChangeText={bankName => setPaymentInfo(current => ({ ...current, bankName }))}
              placeholder="Or enter custom bank name"
              placeholderTextColor={colors.mutedLight}
              style={styles.cleanInput}
              value={paymentInfo.bankName}
            />
          </View>

          {/* Bank Account Number */}
          <Text style={styles.inputSublabel}>Bank Account / Card Number</Text>
          <View style={styles.inputWithIcon}>
            <CreditCard color={colors.muted} size={16} style={styles.inputFieldIcon} />
            <TextInput
              keyboardType="numeric"
              onChangeText={bankAccount => setPaymentInfo(current => ({ ...current, bankAccount }))}
              placeholder="e.g. 4002 0123 4567 8901"
              placeholderTextColor={colors.mutedLight}
              style={styles.cleanInput}
              value={paymentInfo.bankAccount}
            />
          </View>

          <Pressable
            accessibilityLabel="Save payment methods"
            accessibilityRole="button"
            disabled={savingPayment}
            onPress={handleSavePayment}
            style={[styles.savePaymentButton, savingPayment && styles.buttonDisabled]}
          >
            <Save color={colors.white} size={16} />
            <Text style={styles.savePaymentButtonText}>
              {savingPayment ? 'Saving payment details...' : 'Save payment details'}
            </Text>
          </Pressable>
        </View>

        {/* Backend Server Connection (for Physical Phone / Remote Testing) */}
        <View style={[styles.sectionCard, cardShadow]}>
          <View style={styles.cardHeaderIconRow}>
            <Server color={colors.goldDark} size={18} />
            <Text style={styles.cardHeaderTitle}>Backend API Connection</Text>
          </View>
          <Text style={styles.helperText}>
            For a physical phone on your local Wi-Fi, point to your PC's IP address (e.g. http://192.168.1.50:3001) or a tunnel URL.
          </Text>

          <View style={[styles.inputWithIcon, { marginTop: 10 }]}>
            <Server color={colors.muted} size={16} style={styles.inputFieldIcon} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setServerUrl}
              placeholder="http://192.168.X.X:3001"
              placeholderTextColor={colors.mutedLight}
              style={styles.cleanInput}
              value={serverUrl}
            />
          </View>

          <View style={styles.serverPresetsRow}>
            <Pressable
              onPress={() => setServerUrl('http://10.0.2.2:3001')}
              style={styles.serverPresetChip}
            >
              <Text style={styles.serverPresetText}>Emulator (10.0.2.2)</Text>
            </Pressable>
            <Pressable
              onPress={() => setServerUrl('http://localhost:3001')}
              style={styles.serverPresetChip}
            >
              <Text style={styles.serverPresetText}>Localhost</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityLabel="Save and test server connection"
            disabled={testingConnection}
            onPress={handleSaveServerUrl}
            style={[styles.savePaymentButton, { marginTop: 12 }, testingConnection && styles.buttonDisabled]}
          >
            <RefreshCw color={colors.white} size={16} />
            <Text style={styles.savePaymentButtonText}>
              {testingConnection ? 'Testing connection...' : 'Save & Test Connection'}
            </Text>
          </Pressable>
        </View>

        {/* Language Preferences */}
        <View style={[styles.sectionCard, cardShadow]}>
          <View style={styles.cardHeaderIconRow}>
            <Globe color={colors.ink} size={18} />
            <Text style={styles.cardHeaderTitle}>{i18n.t('profileLanguage')}</Text>
          </View>
          <LanguageSwitcher />
        </View>

        {/* Owner Dashboard Shortcut */}
        {user?.role === 'owner' ? (
          <Pressable
            accessibilityLabel="Access Owner Dashboard"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Admin')}
            style={[styles.dashboardButton, cardShadow]}
          >
            <View style={styles.dashboardLeft}>
              <LayoutDashboard color={colors.goldBright} size={20} />
              <View>
                <Text style={styles.dashboardTitle}>{i18n.t('adminDashboard')}</Text>
                <Text style={styles.dashboardSubtitle}>Manage products, orders and revenue</Text>
              </View>
            </View>
            <Text style={styles.dashboardArrow}>→</Text>
          </Pressable>
        ) : null}

        {/* Logout Button */}
        <Pressable
          accessibilityLabel="Sign out of account"
          accessibilityRole="button"
          onPress={logout}
          style={styles.logoutButton}
        >
          <LogOut color={colors.danger} size={16} />
          <Text style={styles.logoutText}>{i18n.t('logoutButton')}</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, cardShadow]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Update Full Name</Text>
              <TouchableOpacity onPress={() => setEditNameModalVisible(false)}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your full name"
              placeholderTextColor={colors.mutedLight}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, savingName && styles.disabledBtn]}
              disabled={savingName}
              onPress={handleSaveName}
            >
              <Text style={styles.modalSubmitBtnText}>
                {savingName ? 'Saving...' : 'SAVE CHANGES'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, cardShadow]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.mutedLight}
            />

            <Text style={styles.modalInputLabel}>New Password (min 6 chars)</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.mutedLight}
            />

            <Text style={styles.modalInputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.mutedLight}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, savingPassword && styles.disabledBtn]}
              disabled={savingPassword}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalSubmitBtnText}>
                {savingPassword ? 'Updating...' : 'UPDATE PASSWORD'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav active="Profile" signedIn />
    </View>
  );
}

const styles = StyleSheet.create({
  addressActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  addressInput: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    minHeight: 74,
    padding: 12,
    textAlignVertical: 'top',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
    borderRadius: 32,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarBadge: {
    alignItems: 'center',
    backgroundColor: colors.goldDark,
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    bottom: -2,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 20,
  },
  avatarText: {
    color: colors.goldDark,
    fontSize: 24,
    fontWeight: '900',
  },
  avatarWrap: {
    position: 'relative',
  },
  bankChip: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  bankChipSelected: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },
  bankChipText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  bankChipTextSelected: {
    color: colors.goldDark,
    fontWeight: '800',
  },
  bankChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cardHeaderIconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cleanInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    height: 44,
  },
  container: {
    padding: spacing.page,
    paddingBottom: 120,
  },
  dashboardArrow: {
    color: colors.goldBright,
    fontSize: 18,
    fontWeight: '800',
  },
  dashboardButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 16,
  },
  dashboardLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  dashboardSubtitle: {
    color: colors.goldLight,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  dashboardTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  detailIconBox: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.lineLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 10,
    marginTop: 4,
  },
  inputFieldIcon: {
    marginLeft: 10,
    marginRight: 8,
  },
  inputSublabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  inputWithIcon: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
  },
  locationButton: {
    alignItems: 'center',
    borderColor: colors.green,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
  },
  locationButtonText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.danger,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  methodChip: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  methodChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.gold,
  },
  methodChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  methodChipTextSelected: {
    color: colors.white,
  },
  methodSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  noBorderRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  offlineBanner: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  offlineText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    padding: spacing.page,
  },
  profileEmail: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rolePillText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  savePaymentButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    justifyContent: 'center',
    marginTop: 16,
  },
  savePaymentButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    marginBottom: 16,
    padding: spacing.page,
  },
  serverPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  serverPresetChip: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  serverPresetText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  accountActionButtons: {
    borderTopColor: colors.lineLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  accountActionBtn: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  accountActionBtnText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
  },
  conciergeSectionCard: {
    backgroundColor: colors.card,
    borderColor: colors.goldMuted,
  },
  conciergeButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  whatsappDirectBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    flex: 1.2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  whatsappDirectBtnText: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  callHotlineBtn: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 0.9,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  callHotlineBtnText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.page,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
    width: '100%',
  },
  modalHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  modalInputLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  modalSubmitBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radiusSm,
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  modalSubmitBtnText: {
    color: colors.goldBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

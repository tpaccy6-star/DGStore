import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react-native';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';
import { login, forgotPassword, resetPassword } from '../api/auth';
import { setApiToken } from '../api/client';
import { BrandLogo } from '../components/BrandLogo';
import { StoreHeader } from '../components/StoreHeader';
import { useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store';
import { setAuth } from '../store/authSlice';
import { saveAuth } from '../store/authStorage';
import { cardShadow, colors, spacing } from '../theme';

type FormValues = { email: string; password: string };
const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export function LoginScreen(): React.JSX.Element {
  const i18n = useI18n();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'Login'>['route']>();

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Forgot password flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleRequestResetCode = async () => {
    if (!forgotIdentifier.trim()) {
      Alert.alert('Required', 'Please enter your email or username.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await forgotPassword({ identifier: forgotIdentifier.trim() });
      if (res.code) {
        setForgotCode(res.code);
      }
      setForgotTargetEmail(res.email || forgotIdentifier.trim());
      setForgotStep(2);
      Alert.alert(
        'Code Generated',
        `A 6-digit verification code was generated.\nCode: ${res.code || 'Check email'}`,
      );
    } catch {
      Alert.alert('Error', 'Unable to generate reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!forgotCode.trim() || !forgotNewPassword || forgotNewPassword.length < 6) {
      Alert.alert('Invalid Input', 'Enter the 6-digit code and a new password (min 6 chars).');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword({
        email: forgotTargetEmail,
        code: forgotCode.trim(),
        newPassword: forgotNewPassword,
      });
      setShowForgotModal(false);
      setForgotStep(1);
      setValue('password', forgotNewPassword);
      Alert.alert('Password Reset', 'Your password has been reset. You can now log in.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const submit = async (values: FormValues) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    setServerError('');
    try {
      const auth = await login(parsed.data);
      await saveAuth(auth);
      setApiToken(auth.token);
      dispatch(setAuth(auth));
      if (route.params?.redirectTo) {
        navigation.navigate(route.params.redirectTo);
      } else {
        navigation.navigate('Home');
      }
    } catch {
      setServerError(i18n.t('authLoginError'));
    }
  };

  const fillDemoAccount = () => {
    setValue('email', 'student@dgstore.rw', { shouldValidate: true });
    setValue('password', 'Student123!', { shouldValidate: true });
  };

  return (
    <View style={styles.screen}>
      <StoreHeader title="Sign in" showBack hideBrand />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && styles.scrollContentKeyboard,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Presentation */}
          <View style={[styles.brandHero, isKeyboardVisible && styles.brandHeroCompact]}>
            <BrandLogo size={isKeyboardVisible ? 'sm' : 'lg'} showTagline={!isKeyboardVisible} />
          </View>

          {/* Card Container */}
          <View style={[styles.card, cardShadow]}>
            {/* Segmented Auth Switcher */}
            <View style={styles.tabContainer}>
              <View style={[styles.tab, styles.tabActive]}>
                <Text style={styles.tabTextActive}>Sign in</Text>
              </View>
              <Pressable
                accessibilityLabel="Switch to create account"
                accessibilityRole="tab"
                onPress={() => navigation.navigate('Register', { redirectTo: route.params?.redirectTo })}
                style={styles.tab}
              >
                <Text style={styles.tabText}>Create account</Text>
              </Pressable>
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>
                Access your orders, saved addresses and seamless checkout.
              </Text>
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{i18n.t('email')}</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                <Mail color={colors.muted} size={18} strokeWidth={1.8} style={styles.fieldIcon} />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={onChange}
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                        }, 120);
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.mutedLight}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{i18n.t('emailValidation')}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{i18n.t('password')}</Text>
                <Text style={styles.labelHint}>Min 8 chars</Text>
              </View>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <Lock color={colors.muted} size={18} strokeWidth={1.8} style={styles.fieldIcon} />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      onChangeText={onChange}
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 140, animated: true });
                        }, 120);
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.mutedLight}
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  onPress={() => setShowPassword(current => !current)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff color={colors.muted} size={19} />
                  ) : (
                    <Eye color={colors.muted} size={19} />
                  )}
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{i18n.t('passwordValidation')}</Text>}
            </View>

            {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordContainer}>
              <Pressable
                accessibilityLabel="Forgot password link"
                onPress={() => {
                  setForgotIdentifier('');
                  setForgotCode('');
                  setForgotNewPassword('');
                  setForgotStep(1);
                  setShowForgotModal(true);
                }}
              >
                <Text style={styles.forgotPasswordLink}>Forgot your password?</Text>
              </Pressable>
            </View>

            {/* Primary Action Button */}
            <Pressable
              accessibilityLabel={i18n.t('loginButton')}
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                handleSubmit(submit)().catch(() => undefined);
              }}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {i18n.t(isSubmitting ? 'loading' : 'loginButton')}
              </Text>
              <ArrowRight color={colors.white} size={18} strokeWidth={2.2} />
            </Pressable>

            {/* Quick Demo Credentials */}
            <Pressable
              accessibilityLabel="Fill demo student credentials"
              onPress={fillDemoAccount}
              style={styles.demoFill}
            >
              <Sparkles color={colors.goldDark} size={14} />
              <Text style={styles.demoFillText}>Tap to autofill demo account</Text>
            </Pressable>
          </View>

          {/* Value Propositions */}
          <View style={styles.valueRow}>
            <View style={styles.valueItem}>
              <Truck color={colors.goldDark} size={16} />
              <Text style={styles.valueText}>Rwanda-wide delivery</Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueItem}>
              <ShieldCheck color={colors.green} size={16} />
              <Text style={styles.valueText}>Secure MoMo & Card</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Recovery Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, cardShadow]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Password Recovery</Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {forgotStep === 1 ? (
              <View>
                <Text style={styles.modalSubtitle}>
                  Enter your registered email address or username to receive a 6-digit verification code.
                </Text>

                <Text style={styles.modalInputLabel}>Email or Username</Text>
                <TextInput
                  style={styles.modalInput}
                  autoCapitalize="none"
                  value={forgotIdentifier}
                  onChangeText={setForgotIdentifier}
                  placeholder="e.g. aline@dgstore.rw"
                  placeholderTextColor={colors.mutedLight}
                />

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, forgotLoading && styles.buttonDisabled]}
                  disabled={forgotLoading}
                  onPress={handleRequestResetCode}
                >
                  <Text style={styles.modalSubmitBtnText}>
                    {forgotLoading ? 'GENERATING CODE...' : 'CONTINUE'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit code and choose your new password.
                </Text>

                <Text style={styles.modalInputLabel}>6-Digit Verification Code</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={forgotCode}
                  onChangeText={setForgotCode}
                  placeholder="e.g. 123456"
                  placeholderTextColor={colors.mutedLight}
                />

                <Text style={styles.modalInputLabel}>New Password (min 6 chars)</Text>
                <TextInput
                  style={styles.modalInput}
                  secureTextEntry
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.mutedLight}
                />

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, forgotLoading && styles.buttonDisabled]}
                  disabled={forgotLoading}
                  onPress={handleConfirmReset}
                >
                  <Text style={styles.modalSubmitBtnText}>
                    {forgotLoading ? 'RESETTING...' : 'RESET PASSWORD'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  brandHeroCompact: {
    marginBottom: 6,
    marginTop: 0,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    padding: spacing.page,
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  demoFill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusPill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  demoFillText: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    marginTop: 4,
  },
  eyeButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 44,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  formHeader: {
    marginBottom: 20,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    height: 48,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
  },
  keyboardView: {
    flex: 1,
  },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelHint: {
    color: colors.muted,
    fontSize: 11,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.goldDark,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    paddingBottom: 40,
  },
  scrollContentKeyboard: {
    paddingBottom: 280,
  },
  serverError: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  tab: {
    alignItems: 'center',
    borderRadius: spacing.radiusSm,
    flex: 1,
    paddingVertical: 9,
  },
  tabActive: {
    backgroundColor: colors.ink,
  },
  tabContainer: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 3,
  },
  tabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  valueDivider: {
    backgroundColor: colors.line,
    height: 14,
    width: 1,
  },
  valueItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
    gap: 16,
  },
  valueText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotPasswordLink: {
    color: colors.goldDark,
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
    marginBottom: spacing.xs,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
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
});

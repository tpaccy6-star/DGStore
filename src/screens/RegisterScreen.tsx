import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Truck,
  User,
  UserCheck,
} from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';
import { register as registerUser } from '../api/auth';
import { setApiToken } from '../api/client';
import { BrandLogo } from '../components/BrandLogo';
import { StoreHeader } from '../components/StoreHeader';
import { useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store';
import { setAuth } from '../store/authSlice';
import { saveAuth } from '../store/authStorage';
import { cardShadow, colors, spacing } from '../theme';

type FormValues = {
  name: string;
  email: string;
  password: string;
  username: string;
};

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  username: z.string().trim().min(3),
});

export function RegisterScreen(): React.JSX.Element {
  const i18n = useI18n();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'Register'>['route']>();

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      username: '',
    },
  });

  const submit = async (values: FormValues) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    setServerError('');
    try {
      const auth = await registerUser(parsed.data);
      await saveAuth(auth);
      setApiToken(auth.token);
      dispatch(setAuth(auth));
      if (route.params?.redirectTo) {
        navigation.navigate(route.params.redirectTo);
      } else {
        navigation.navigate('Home');
      }
    } catch {
      setServerError(i18n.t('authRegisterError'));
    }
  };

  return (
    <View style={styles.screen}>
      <StoreHeader title="Create account" showBack hideBrand />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Presentation */}
          <View style={styles.brandHero}>
            <BrandLogo size="lg" showTagline />
          </View>

          {/* Card Container */}
          <View style={[styles.card, cardShadow]}>
            {/* Segmented Auth Switcher */}
            <View style={styles.tabContainer}>
              <Pressable
                accessibilityLabel="Switch to sign in"
                accessibilityRole="tab"
                onPress={() => navigation.navigate('Login', { redirectTo: route.params?.redirectTo })}
                style={styles.tab}
              >
                <Text style={styles.tabText}>Sign in</Text>
              </Pressable>
              <View style={[styles.tab, styles.tabActive]}>
                <Text style={styles.tabTextActive}>Create account</Text>
              </View>
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.cardTitle}>Join D&G Store</Text>
              <Text style={styles.cardSubtitle}>
                Create an account to track shipments and order with local payment methods.
              </Text>
            </View>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{i18n.t('name')}</Text>
              <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                <User color={colors.muted} size={18} strokeWidth={1.8} style={styles.fieldIcon} />
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      autoCapitalize="words"
                      onChangeText={onChange}
                      placeholder="e.g. Jean Dupont"
                      placeholderTextColor={colors.mutedLight}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{i18n.t('nameValidation')}</Text>}
            </View>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{i18n.t('username')}</Text>
              <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
                <UserCheck color={colors.muted} size={18} strokeWidth={1.8} style={styles.fieldIcon} />
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={onChange}
                      placeholder="e.g. jdupont"
                      placeholderTextColor={colors.mutedLight}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.username && <Text style={styles.errorText}>{i18n.t('usernameValidation')}</Text>}
            </View>

            {/* Email Address */}
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

            {/* Password */}
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
                      placeholder="Create a strong password"
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

            {/* Primary Action Button */}
            <Pressable
              accessibilityLabel={i18n.t('registerButton')}
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                handleSubmit(submit)().catch(() => undefined);
              }}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {i18n.t(isSubmitting ? 'loading' : 'registerButton')}
              </Text>
              <ArrowRight color={colors.white} size={18} strokeWidth={2.2} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
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
    marginBottom: 14,
  },
  fieldIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  formHeader: {
    marginBottom: 18,
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
    marginTop: 10,
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
    justifyContent: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 20,
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
    gap: 16,
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
  },
  valueText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});

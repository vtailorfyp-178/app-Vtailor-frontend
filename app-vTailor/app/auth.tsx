import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable, TextInput, Alert, NativeSyntheticEvent, TextInputKeyPressEventData, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { getProfile, sendEmailOtp, verifyEmailOtp } from '@/services/authApi';
import { migrateCustomizationsToUser } from '@/services/userDataService';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../assets/images/vTailorlogo.jpeg');

type AuthStep = 'role' | 'email' | 'otp';

export default function AuthScreen() {
  const router = useRouter();
  const { login, updateProfile, markProfileCompleted } = useAuth();

  const [step, setStep] = useState<AuthStep>('role');
  const [role, setRole] = useState<UserRole>(null);

  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  // method_id returned by /otp/start — required by /otp/verify
  const [methodId, setMethodId] = useState<string | null>(null);

  const buttonStart = useThemeColor({}, 'buttonStart');
  const iconBg = useThemeColor({}, 'iconBg');
  const customerMain = ROLE_COLORS.customer.primary;
  const tailorMain = ROLE_COLORS.tailor.primary;
  const tailorText = ROLE_COLORS.tailor.primaryDark;
  const authPrimary = role === 'tailor' ? tailorMain : customerMain;

  const [otpFocusedIndex, setOtpFocusedIndex] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setTimeout(() => setStep('email'), 220);
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendEmailOtp(email);
      setMethodId(res.method_id);
      setStep('otp');
    } catch (err) {
      console.log('OTP send error', err);
      const raw = err instanceof Error ? err.message : '';
      const usingCloud = /onrender\.com|https:\/\//i.test(raw) || !__DEV__;
      const message = /aborted|network request failed|failed to connect/i.test(raw)
        ? usingCloud
          ? 'Cannot reach the server. Check your internet connection and wait a minute — the cloud backend may be waking up, then try again.'
          : 'Cannot reach the backend. Keep Expo running, start the API with start-api.ps1, and use the same Wi‑Fi on your phone.'
        : raw || 'Unable to reach server. Check your connection and try again.';
      Alert.alert('Send OTP Failed', message);
    } finally {
      setSendingOtp(false);
    }
  };

  const resetOtpInputs = () => {
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleResendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please go back and enter a valid email address.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendEmailOtp(email);
      setMethodId(res.method_id);
      resetOtpInputs();
      Alert.alert('OTP Sent', `A new code has been sent to ${email}. Please use the latest code.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach server. Check your connection and try again.';
      Alert.alert('Resend OTP Failed', message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
      newOtp[index + offset] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(index + digits.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyPress = (index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key !== 'Backspace') return;

    const newOtp = [...otp];
    if (newOtp[index]) {
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (index > 0) {
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');

    if (otpValue.length !== 6) return;

    if (!methodId) {
      Alert.alert('Session expired', 'Please go back and request a new OTP.');
      return;
    }

    setVerifyingOtp(true);
    try {
      if (!role) {
        Alert.alert('Role required', 'Please select a role and try again.');
        return;
      }

      const result = await verifyEmailOtp(methodId, otpValue, role);

      if (result?.access_token) {
        const resolvedRole: UserRole = result.role === 'tailor' ? 'tailor' : 'customer';
        const userId = result.user_id;
        login(result.access_token, resolvedRole, result.email ?? email, userId);

        if (userId) {
          await migrateCustomizationsToUser(userId);
        }

        try {
          const profile = await getProfile(result.access_token);
          updateProfile(
            {
              name: profile.name ?? undefined,
              email: profile.email ?? undefined,
              phone: profile.phone ?? undefined,
              address: profile.address ?? undefined,
              experience: profile.experience ?? undefined,
              specialization: profile.specialization ?? undefined,
              description: profile.description ?? undefined,
              avatar: profile.avatar ?? undefined,
            },
            resolvedRole,
            userId ?? null,
          );
          const hasExistingProfile = Boolean(profile?.name && profile?.address);
          if (hasExistingProfile) {
            await markProfileCompleted(resolvedRole, userId);
            if (resolvedRole === 'tailor') router.replace('/tailor');
            else (router as any).replace('/customer');
          } else {
            router.replace('/profile-setup');
          }
        } catch {
          router.replace('/profile-setup');
        }
      } else {
        Alert.alert('Verification failed', 'Invalid or expired code.');
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : '';
      const message = /otp|passcode|incorrect|expired|not found|authenticated/i.test(rawMessage)
        ? 'The OTP code is incorrect or expired. Please enter the latest code from your email, or tap Resend OTP.'
        : 'Unable to verify OTP. Please request a new code and try again.';
      const lastFilledIndex = otp.reduce((lastIndex, digit, digitIndex) => (digit ? digitIndex : lastIndex), -1);
      setTimeout(() => otpRefs.current[Math.max(0, lastFilledIndex)]?.focus(), 100);
      Alert.alert('Verification failed', message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBack = () => {
    if (step === 'email') setStep('role');
    else if (step === 'otp') {
      setOtp(['', '', '', '', '', '']);
      setMethodId(null);
      setStep('email');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 16, 42), paddingBottom: Math.max(insets.bottom + 16, 24) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
      <View style={styles.header}>
        {step !== 'role' ? (
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText>{'‹ Back'}</ThemedText>
          </Pressable>
        ) : null}

        <View style={{ alignItems: 'center' }}>
          <View style={styles.logoWrap}>
            <Image source={logo} style={styles.logo} />
          </View>
          <View style={styles.stepPill}>
            <Ionicons
              name={step === 'role' ? 'sparkles-outline' : step === 'email' ? 'mail-outline' : 'shield-checkmark-outline'}
              size={14}
              color={customerMain}
            />
            <ThemedText style={styles.stepPillText}>
              {step === 'role' ? 'Start your V Tailor journey' : step === 'email' ? 'Secure email login' : 'Almost there'}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            {step === 'role' ? 'Welcome to V Tailor' : step === 'email' ? 'Enter Your Email' : 'Verify OTP'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {step === 'role'
              ? 'Choose how you want to use V Tailor'
              : step === 'email'
                ? 'We will send you a verification code'
                : `Code sent to ${email}`}
          </ThemedText>
          {step === 'role' ? (
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Ionicons name="shirt-outline" size={16} color={customerMain} />
                <ThemedText style={styles.heroStatText}>Custom fits</ThemedText>
              </View>
              <View style={styles.heroStat}>
                <Ionicons name="cut-outline" size={16} color={tailorText} />
                <ThemedText style={styles.heroStatText}>Expert tailors</ThemedText>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>

        {step === 'role' && (
          <View style={styles.roleList}>

            <Pressable
              onPress={() => handleRoleSelect('customer')}
              style={[
                styles.roleCard,
                { borderColor: role === 'customer' ? customerMain : '#fae3ea' },
                role === 'customer' && { borderWidth: 2, backgroundColor: ROLE_COLORS.customer.soft },
              ]}
            >
              <View style={styles.roleInner}>
                <View style={[styles.roleIcon, { backgroundColor: role === 'customer' ? customerMain : iconBg }]}>
                  <Ionicons name="person-outline" size={24} color={role === 'customer' ? '#fff' : customerMain} />
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.roleTitle}>Customer</ThemedText>
                  <ThemedText style={styles.small}>Get custom clothes from expert tailors</ThemedText>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleRoleSelect('tailor')}
              style={[styles.roleCard, styles.roleCardAlt, role === 'tailor' && { borderColor: customerMain, borderWidth: 2, backgroundColor: ROLE_COLORS.tailor.soft }]}
            >
              <View style={styles.roleInner}>
                <View style={[styles.roleIcon, { backgroundColor: role === 'tailor' ? customerMain : ROLE_COLORS.tailor.soft }]}>
                  <Ionicons name="cut-outline" size={24} color={role === 'tailor' ? '#fff' : tailorText} />
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.roleTitle}>Tailor</ThemedText>
                  <ThemedText style={styles.small}>Offer your tailoring services</ThemedText>
                </View>
              </View>
            </Pressable>

            <ThemedText style={styles.tiny}>
              By continuing, you agree to our Terms & Privacy Policy
            </ThemedText>

          </View>
        )}

        {step === 'email' && (
          <View>
            <ThemedText style={styles.label}>Email Address</ThemedText>

            <TextInput
              style={[styles.phoneInput, { borderColor: emailFocused ? authPrimary : '#e6e7eb' }]}
              value={email}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              onChangeText={setEmail}
              placeholder="example@email.com"
            />

            <Pressable
              onPress={handleEmailSubmit}
              disabled={sendingOtp || !email.includes('@')}
              style={[
                styles.button,
                (sendingOtp || !email.includes('@')) && styles.buttonDisabled,
                { backgroundColor: email.includes('@') ? authPrimary : buttonStart }
              ]}
            >
              <ThemedText style={styles.buttonText}>{sendingOtp ? 'Sending…' : 'Send OTP →'}</ThemedText>
            </Pressable>
          </View>
        )}

        {step === 'otp' && (
          <View>
            <ThemedText style={styles.label}>Enter 6-digit code</ThemedText>

            <View style={styles.otpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { otpRefs.current[i] = ref; }}
                  style={[
                    styles.otpInput,
                    { borderColor: d ? authPrimary : (otpFocusedIndex === i ? authPrimary : '#e6e7eb') }
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={d}
                  onFocus={() => setOtpFocusedIndex(i)}
                  onBlur={() => setOtpFocusedIndex((cur) => (cur === i ? null : cur))}
                  onChangeText={(val) => handleOtpChange(i, val)}
                  onKeyPress={(event) => handleOtpKeyPress(i, event)}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerifyOtp}
              disabled={verifyingOtp || otp.join('').length < 6}
              style={[
                styles.button,
                (verifyingOtp || otp.join('').length < 6) && styles.buttonDisabled,
                { backgroundColor: otp.join('').length === 6 ? authPrimary : buttonStart }
              ]}
            >
              <ThemedText style={styles.buttonText}>{verifyingOtp ? 'Verifying…' : 'Verify & Continue'}</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleResendOtp}
              disabled={sendingOtp || verifyingOtp}
              style={styles.resendButton}
            >
              <ThemedText style={[styles.resendText, { color: role === 'tailor' ? tailorText : customerMain }]}>
                {sendingOtp ? 'Sending new code…' : 'Resend OTP'}
              </ThemedText>
            </Pressable>

          </View>
        )}

      </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_MUTED,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  header: {
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    ...UI.softShadow,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 999,
    backgroundColor: '#fff1f7',
  },
  logo: {
    width: 86,
    height: 86,
    resizeMode: 'contain',
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7fb',
    borderWidth: 1,
    borderColor: '#fbcfe8',
    marginBottom: 12,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fdf2f8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 6,
  },
  stepPillText: {
    color: '#be185d',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 40,
    color: TEXT_DARK,
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 16,
    color: '#394052',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fce7f3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroStatText: {
    color: TEXT_DARK,
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    justifyContent: 'flex-start',
  },
  roleList: {
    gap: 12,
    marginTop: 24,
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderColor: '#fae3ea',
    ...UI.softShadow,
  },
  roleCardAlt: {
    borderColor: '#fae3ea',
  },
  roleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
  },
  roleTitle: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: '900',
  },
  small: {
    fontSize: 12,
    marginTop: 4,
    color: '#64748b',
    lineHeight: 17,
  },
  tiny: {
    fontSize: 11,
    marginTop: 36,
    textAlign: 'center',
  },
  label: {
    marginBottom: 12,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...UI.softShadow,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  resendText: {
    fontWeight: '700',
    fontSize: 14,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
});
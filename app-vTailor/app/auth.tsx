import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable, TextInput, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { getProfile, sendEmailOtp, verifyEmailOtp } from '@/services/authApi';

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
  const otpRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  // method_id returned by /otp/start — required by /otp/verify
  const [methodId, setMethodId] = useState<string | null>(null);

  const tint = useThemeColor({}, 'tint');
  const buttonStart = useThemeColor({}, 'buttonStart');
  const accentAlt = useThemeColor({}, 'accentAlt');
  const iconBg = useThemeColor({}, 'iconBg');
  const iconBgAlt = useThemeColor({}, 'iconBgAlt');

  const [otpFocusedIndex, setOtpFocusedIndex] = useState<number | null>(null);

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

      // Backend returns { status: 'success', method_id: '...', message: '...' } on success
      // or { detail: '...' } (HTTP error body) on failure.
      if (res && res.status === 'success' && res.method_id) {
        setMethodId(res.method_id);
        setStep('otp');
      } else {
        const msg = res?.detail || res?.message || 'Failed to send OTP. Please try again.';
        Alert.alert('Send OTP Failed', String(msg));
      }
    } catch (err) {
      console.log('OTP send error', err);
      const message = err instanceof Error ? err.message : 'Unable to reach server. Check your connection and try again.';
      Alert.alert('Send OTP Failed', message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) otpRefs.current[index + 1]?.focus();
      if (!value && index > 0) otpRefs.current[index - 1]?.focus();
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
        // Pass the email so it is auto-populated in profile-setup and stored per-role
        const resolvedRole: UserRole = result.role === 'tailor' ? 'tailor' : 'customer';
        login(result.access_token, resolvedRole, result.email ?? email, result.user_id);

        try {
          const profile = await getProfile(result.access_token);
          updateProfile({
            name: profile?.name,
            email: profile?.email,
            phone: profile?.phone,
            address: profile?.address,
            experience: profile?.experience,
            specialization: profile?.specialization,
            description: profile?.description,
            avatar: profile?.avatar,
          });
          const hasExistingProfile = Boolean(profile?.name && profile?.address);
          if (hasExistingProfile) {
            await markProfileCompleted(resolvedRole);
            if (resolvedRole === 'tailor') router.replace('/tailor');
            else router.replace('/customer');
          } else {
            router.replace('/profile-setup');
          }
        } catch {
          router.replace('/profile-setup');
        }
      } else {
        const msg = result?.detail || result?.message || 'Invalid or expired code.';
        Alert.alert('Verification failed', String(msg));
      }
    } catch (err) {
      console.log('OTP verify error', err);
      const message = err instanceof Error ? err.message : 'Unable to verify OTP. Please try again.';
      Alert.alert('Verification failed', message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBack = () => {
    if (step === 'email') setStep('role');
    else if (step === 'otp') setStep('email');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        {step !== 'role' ? (
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText>{'‹ Back'}</ThemedText>
          </Pressable>
        ) : null}

        <View style={{ alignItems: 'center' }}>
          <Image source={logo} style={styles.logo} />
          <ThemedText type="title" style={styles.title}>
            {step === 'role' && 'Welcome to V Tailor'}
            {step === 'email' && 'Enter Your Email'}
            {step === 'otp' && 'Verify OTP'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {step === 'role' && 'Choose how you want to use V Tailor'}
            {step === 'email' && 'We will send you a verification code'}
            {step === 'otp' && `Code sent to ${email}`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>

        {step === 'role' && (
          <View style={styles.roleList}>

            <Pressable
              onPress={() => handleRoleSelect('customer')}
              style={[
                styles.roleCard,
                { borderColor: role === 'customer' ? tint : '#fae3ea' },
                role === 'customer' && { borderWidth: 2 },
              ]}
            >
              <View style={styles.roleInner}>
                <View style={[styles.roleIcon, { backgroundColor: role === 'customer' ? tint : iconBg }]}>
                  <ThemedText style={{ color: role === 'customer' ? '#fff' : tint }}>👤</ThemedText>
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">Customer</ThemedText>
                  <ThemedText style={styles.small}>Get custom clothes from expert tailors</ThemedText>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleRoleSelect('tailor')}
              style={[styles.roleCard, styles.roleCardAlt, role === 'tailor' && { borderColor: accentAlt, borderWidth: 2 }]}
            >
              <View style={styles.roleInner}>
                <View style={[styles.roleIcon, { backgroundColor: role === 'tailor' ? accentAlt : iconBgAlt }]}>
                  <ThemedText style={{ color: role === 'tailor' ? '#fff' : accentAlt }}>✂️</ThemedText>
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">Tailor</ThemedText>
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
              style={[styles.phoneInput, { borderColor: emailFocused ? tint : '#e6e7eb' }]}
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
                { backgroundColor: email.includes('@') ? tint : buttonStart }
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
                    { borderColor: d ? tint : (otpFocusedIndex === i ? tint : '#e6e7eb') }
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={d}
                  onFocus={() => setOtpFocusedIndex(i)}
                  onBlur={() => setOtpFocusedIndex((cur) => (cur === i ? null : cur))}
                  onChangeText={(val) => handleOtpChange(i, val)}
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerifyOtp}
              disabled={verifyingOtp || otp.join('').length < 6}
              style={[
                styles.button,
                (verifyingOtp || otp.join('').length < 6) && styles.buttonDisabled,
                { backgroundColor: otp.join('').length === 6 ? tint : buttonStart }
              ]}
            >
              <ThemedText style={styles.buttonText}>{verifyingOtp ? 'Verifying…' : 'Verify & Continue'}</ThemedText>
            </Pressable>

          </View>
        )}

      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: 'flex-start',
  },
  header: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 16,
    color: '#394052',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  roleList: {
    gap: 12,
    marginTop: 40,
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
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
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
  },
  small: {
    fontSize: 12,
    marginTop: 4,
  },
  tiny: {
    fontSize: 11,
    marginTop: 36,
    textAlign: 'center',
  },
  label: {
    marginBottom: 12,
    fontWeight: '500',
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
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
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
});
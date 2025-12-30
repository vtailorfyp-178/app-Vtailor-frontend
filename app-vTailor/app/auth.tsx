import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable, TextInput, Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const logo = require('../assets/images/vTailorlogo.jpeg');

type AuthStep = 'role' | 'phone' | 'otp';

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>('role');
  const [role, setRole] = useState<UserRole>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const otpRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep('otp');
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

  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      login(phone, role);
      router.replace('/profile-setup');
    }
  };

  const handleBack = () => {
    if (step === 'phone') setStep('role');
    else if (step === 'otp') setStep('phone');
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
          <ThemedText type="title">
            {step === 'role' && 'Welcome to V Tailor'}
            {step === 'phone' && 'Enter Your Phone'}
            {step === 'otp' && 'Verify OTP'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {step === 'role' && 'Choose how you want to use V Tailor'}
            {step === 'phone' && 'We will send you a verification code'}
            {step === 'otp' && `Code sent to +${phone}`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {step === 'role' && (
          <View style={styles.roleList}>
            <Pressable onPress={() => handleRoleSelect('customer')} style={styles.roleCard}>
              <View style={styles.roleInner}>
                <View style={styles.roleIcon}><ThemedText>👤</ThemedText></View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">I'm a Customer</ThemedText>
                  <ThemedText style={styles.small}>Get custom clothes from expert tailors</ThemedText>
                </View>
              </View>
            </Pressable>

            <Pressable onPress={() => handleRoleSelect('tailor')} style={[styles.roleCard, styles.roleCardAlt]}>
              <View style={styles.roleInner}>
                <View style={styles.roleIcon}><ThemedText>✂️</ThemedText></View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">I'm a Tailor</ThemedText>
                  <ThemedText style={styles.small}>Offer your tailoring services</ThemedText>
                </View>
              </View>
            </Pressable>

            <ThemedText style={styles.tiny}>By continuing, you agree to our Terms & Privacy Policy</ThemedText>
          </View>
        )}

        {step === 'phone' && (
          <View>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <View style={styles.phoneRow}>
              <ThemedText style={styles.cc}>+92</ThemedText>
              <TextInput
                style={styles.phoneInput}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="3XX XXXXXXX"
              />
            </View>
            <Pressable onPress={handlePhoneSubmit} style={[styles.button, phone.length < 10 && styles.buttonDisabled]} disabled={phone.length < 10}>
              <ThemedText style={styles.buttonText}>Send OTP →</ThemedText>
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
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={d}
                  onChangeText={(val) => handleOtpChange(i, val)}
                />
              ))}
            </View>
            <Pressable onPress={handleVerifyOtp} style={[styles.button, otp.join('').length < 6 && styles.buttonDisabled]} disabled={otp.join('').length < 6}>
              <ThemedText style={styles.buttonText}>Verify & Continue</ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.select({ ios: 44, android: 24, default: 24 }), paddingHorizontal: 20 },
  backButton: { marginBottom: 8 },
  logo: { width: 96, height: 96, alignSelf: 'center', marginTop: 8, marginBottom: 8 },
  subtitle: { fontSize: 14, marginTop: 6, color: '#6b7280', textAlign: 'center' },
  content: { flex: 1, padding: 20 },
  roleList: { gap: 12 },
  roleCard: { padding: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: undefined, marginBottom: 10 },
  roleCardAlt: { borderColor: 'rgba(245,158,11,0.2)' },
  roleInner: { flexDirection: 'row', alignItems: 'center' },
  roleIcon: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  small: { fontSize: 13, color: '#6b7280' },
  tiny: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  label: { marginBottom: 8, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cc: { marginRight: 10 },
  phoneInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, height: 48 },
  button: { marginTop: 12, backgroundColor: '#0ea5a4', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: 'rgba(0,0,0,0.1)' },
  buttonText: { color: '#fff', fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderRadius: 10, textAlign: 'center', fontSize: 20, marginHorizontal: 6 },
});

import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, ScrollView, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile as updateProfileApi } from '@/services/authApi';

const logo = require('../assets/images/vTailorlogo.jpeg');

export default function ProfileSetup() {
  const router = useRouter();
  const { user, loginEmail, updateProfile, userRole, markProfileCompleted, token, userId } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar ?? null);
  // loginEmail is set by login() right after OTP verify succeeds, auto-fills the email field
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? loginEmail ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    experience: user?.experience ?? '',
    specialization: user?.specialization ?? [] as string[],
    description: user?.description ?? '',
  });

  const specializations = [
    'Formal Dresses',
    'Casual Wear',
    'Traditional',
    'Wedding Attire',
    'Kids Wear',
    'Alterations',
  ];

  const handlePickProfileImage = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permission Required', 'Camera access is needed to take photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permission Required', 'Gallery access is needed to select photos.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
          }
        },
      },
      ...(profileImage
        ? [
            {
              text: 'Remove Photo',
              onPress: () => setProfileImage(null),
              style: 'destructive' as const,
            },
          ]
        : []),
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const toggleSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  const handleSubmit = async () => {
    if (!token || !userId) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    try {
      await updateProfileApi(token, userId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        experience: formData.experience,
        specialization: formData.specialization,
        description: formData.description,
        avatar: profileImage ?? undefined,
      });

      updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        experience: formData.experience,
        specialization: formData.specialization,
        description: formData.description,
        avatar: profileImage ?? undefined,
      });

      await markProfileCompleted();

      if (userRole === 'admin') (router as any).replace('/admin');
      else if (userRole === 'tailor') (router as any).replace('/tailor');
      else (router as any).replace('/customer');
    } catch (error) {
      console.error('Profile save failed:', error);
      Alert.alert('Save failed', 'Unable to save your profile to the database. Please try again.');
    }
  };

  const isTailor = userRole === 'tailor';
  const rolePrimary = isTailor ? ROLE_COLORS.tailor.primary : ROLE_COLORS.customer.primary;
  const roleText = isTailor ? ROLE_COLORS.tailor.primaryDark : ROLE_COLORS.customer.primaryDark;
  const roleSoft = isTailor ? ROLE_COLORS.tailor.soft : ROLE_COLORS.customer.soft;
  const roleBorder = isTailor ? ROLE_COLORS.tailor.border : ROLE_COLORS.customer.border;

  // theme colors
  const muted = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const avatarBg = useThemeColor({}, 'card');
  const avatarBtn = rolePrimary;
  const chipActiveBg = rolePrimary;
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.logoWrap, { borderColor: roleBorder, backgroundColor: roleSoft }]}>
          <Image source={logo} style={styles.logo} />
        </View>
        <View style={[styles.roleBadge, { backgroundColor: roleSoft, borderColor: roleBorder }]}>
          <Ionicons name={isTailor ? 'cut-outline' : 'person-outline'} size={14} color={roleText} />
          <ThemedText style={[styles.roleBadgeText, { color: roleText }]}>{isTailor ? 'Tailor profile' : 'Customer profile'}</ThemedText>
        </View>
        <ThemedText type="title" style={styles.title}>Complete Your Profile</ThemedText>
        <ThemedText style={[styles.subtitle, { color: muted }]}>{isTailor ? 'Build a trusted storefront for customers' : 'Tell tailors how to reach and serve you'}</ThemedText>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.avatarRow, { backgroundColor: '#fff', borderColor: roleBorder }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarBg, borderColor: rolePrimary, borderWidth: 2 }]}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatarImage} /> : <Ionicons name="person-outline" size={34} color={roleText} />}
          </View>
          <Pressable style={[styles.avatarButton, { backgroundColor: avatarBtn }]} onPress={handlePickProfileImage}>
            <Ionicons name="camera" size={18} color={isTailor ? roleText : '#fff'} />
          </Pressable>
          <Pressable style={[styles.addPhotoButton, { borderColor: roleBorder, backgroundColor: roleSoft }]} onPress={handlePickProfileImage}>
            <Ionicons name="image-outline" size={16} color={roleText} />
            <ThemedText style={[styles.addPhotoButtonText, { color: roleText }]}>
              {profileImage ? 'Change Profile Picture' : 'Add Profile Picture'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.fieldGroup, { borderColor: roleBorder }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="id-card-outline" size={18} color={roleText} />
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          </View>
          <ThemedText style={styles.label}>Full Name *</ThemedText>
          <ThemedTextInput
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            placeholder="Enter your full name"
            style={[styles.input, { borderColor: inputBorder, color: text || TEXT_DARK }]}
          />

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <ThemedTextInput
            value={formData.email}
            editable={false}
            placeholder="your@email.com"
            keyboardType="email-address"
            style={[styles.input, { borderColor: inputBorder, backgroundColor: '#f8fafc', color: '#475569' }]}
          />

          <ThemedText style={styles.label}>Phone Number</ThemedText>
          <ThemedTextInput
            value={formData.phone}
            onChangeText={(t) => setFormData({ ...formData, phone: t })}
            placeholder="e.g., +92 300 1234567"
            keyboardType="phone-pad"
            style={[styles.input, { borderColor: inputBorder, color: text || TEXT_DARK }]}
          />

          <ThemedText style={styles.label}>Address *</ThemedText>
          <ThemedTextInput
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })}
            placeholder="Enter your complete address"
            multiline
            style={[styles.input, styles.textarea, { borderColor: inputBorder, color: text || TEXT_DARK }]}
          />
        </View>

        {isTailor && (
          <View style={[styles.fieldGroup, { borderColor: roleBorder }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={18} color={roleText} />
              <ThemedText style={styles.sectionTitle}>Tailor Details</ThemedText>
            </View>
            <ThemedText style={styles.label}>Years of Experience</ThemedText>
            <ThemedTextInput
              value={formData.experience}
              onChangeText={(t) => setFormData({ ...formData, experience: t })}
              placeholder="e.g., 5"
              keyboardType="numeric"
              style={[styles.input, { borderColor: inputBorder, color: text || TEXT_DARK }]}
            />

            <ThemedText style={[styles.label, { marginTop: 12 }]}>Specialization</ThemedText>
            <View style={styles.chipsRow}>
              {specializations.map((spec) => {
                const active = formData.specialization.includes(spec);
                return (
                  <Pressable key={spec} onPress={() => toggleSpecialization(spec)} style={[styles.chip, { borderColor: roleBorder }, active && { backgroundColor: chipActiveBg, borderColor: chipActiveBg }]}>
                      <ThemedText style={active ? [styles.chipTextActive, isTailor && { color: roleText }] : styles.chipText}>{spec}</ThemedText>
                    </Pressable>
                );
              })}
            </View>

            <ThemedText style={[styles.label, { marginTop: 12 }]}>About Your Work</ThemedText>
            <ThemedTextInput
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Describe your expertise and style..."
              multiline
              style={[styles.input, styles.textarea, { borderColor: inputBorder, color: text || TEXT_DARK }]}
            />

            <ThemedText style={styles.label}>Sample Work</ThemedText>
            <View style={styles.sampleGrid}>
              {[1, 2, 3].map((i) => (
                <Pressable key={i} style={[styles.sampleBox, { backgroundColor: roleSoft, borderColor: roleBorder }]}>
                  <Ionicons name="add" size={24} color={roleText} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable onPress={handleSubmit} style={[styles.button, { backgroundColor: rolePrimary }, (!formData.name || !formData.address) && styles.buttonDisabled]} disabled={!formData.name || !formData.address}>
            <ThemedText style={[styles.buttonText, isTailor && { color: roleText }]}>Complete Setup</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: {
    paddingTop: Platform.select({ ios: 58, android: 44, default: 44 }),
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: { width: 74, height: 74, resizeMode: 'contain' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '900' },
  title: { color: TEXT_DARK, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { marginTop: 6, color: '#6b7280', textAlign: 'center', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  scroll: { padding: 20, paddingTop: 8, paddingBottom: 20 },
  avatarRow: {
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: UI.radius.xl,
    padding: 18,
    ...UI.softShadow,
  },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarButton: { position: 'absolute', right: 26, top: 84, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', ...UI.softShadow },
  addPhotoButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addPhotoButtonText: { fontWeight: '700' },
  fieldGroup: { marginBottom: 14, backgroundColor: '#fff', borderWidth: 1, borderRadius: UI.radius.xl, padding: 16, ...UI.softShadow },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: '900' },
  label: { marginBottom: 7, fontWeight: '800', color: TEXT_DARK, fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#e6e7eb', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, minHeight: 50, marginBottom: 13, backgroundColor: '#fff', color: TEXT_DARK },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', marginRight: 8, marginBottom: 8, borderWidth: 1 },
  chipText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '800', fontSize: 12 },
  sampleGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  sampleBox: { width: '30%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#fce7f3', backgroundColor: '#fff' },
  button: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', ...UI.softShadow },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});

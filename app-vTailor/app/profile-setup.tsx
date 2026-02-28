import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { logo } from '../constants/images';

export default function ProfileSetup() {
  const router = useRouter();
  const { user, updateProfile, userRole, markProfileCompleted } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
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
        onPress: () => {
          setProfileImage('https://via.placeholder.com/200x200?text=Camera+Photo');
          Alert.alert('Success', 'Photo captured');
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          setProfileImage('https://via.placeholder.com/200x200?text=Gallery+Image');
          Alert.alert('Success', 'Photo selected');
        },
      },
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
    updateProfile({
      name: formData.name,
      email: formData.email,
      address: formData.address,
      experience: formData.experience,
      specialization: formData.specialization,
      description: formData.description,
    });
    
    await markProfileCompleted();
    
    // navigate to role-based home
    if (userRole === 'tailor') (router as any).replace('/tailor');
    else (router as any).replace('/customer');
  };

  const isTailor = userRole === 'tailor';

  // theme colors
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const avatarBg = useThemeColor({}, 'card');
  const avatarBtn = tint;
  const chipActiveBg = tint;
  const buttonStart = useThemeColor({}, 'buttonStart');
  const buttonEnd = useThemeColor({}, 'buttonEnd');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
        <ThemedText type="title">Complete Your Profile</ThemedText>
        <ThemedText style={[styles.subtitle, { color: muted }]}>{isTailor ? 'Set up your tailor profile' : 'Tell us about yourself'}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarRow}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarBg, borderColor: tint, borderWidth: 2 }]}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatarImage} /> : <ThemedText>👤</ThemedText>}
          </View>
          <Pressable style={[styles.avatarButton, { backgroundColor: avatarBtn }]} onPress={handlePickProfileImage}>
            <Ionicons name="camera" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText style={styles.label}>Full Name *</ThemedText>
          <TextInput
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            placeholder="Enter your full name"
            style={[styles.input, { borderColor: inputBorder }]}
          />

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            value={formData.email}
            onChangeText={(t) => setFormData({ ...formData, email: t })}
            placeholder="your@email.com"
            keyboardType="email-address"
            style={[styles.input, { borderColor: inputBorder }]}
          />

          <ThemedText style={styles.label}>Address *</ThemedText>
          <TextInput
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })}
            placeholder="Enter your complete address"
            multiline
            style={[styles.input, styles.textarea, { borderColor: inputBorder }]}
          />
        </View>

        {isTailor && (
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Years of Experience</ThemedText>
            <TextInput
              value={formData.experience}
              onChangeText={(t) => setFormData({ ...formData, experience: t })}
              placeholder="e.g., 5"
              keyboardType="numeric"
              style={styles.input}
            />

            <ThemedText style={[styles.label, { marginTop: 12 }]}>Specialization</ThemedText>
            <View style={styles.chipsRow}>
              {specializations.map((spec) => {
                const active = formData.specialization.includes(spec);
                return (
                  <Pressable key={spec} onPress={() => toggleSpecialization(spec)} style={[styles.chip, active && { backgroundColor: chipActiveBg }]}>
                      <ThemedText style={active ? styles.chipTextActive : styles.chipText}>{spec}</ThemedText>
                    </Pressable>
                );
              })}
            </View>

            <ThemedText style={[styles.label, { marginTop: 12 }]}>About Your Work</ThemedText>
            <TextInput
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Describe your expertise and style..."
              multiline
              style={[styles.input, styles.textarea, { borderColor: inputBorder }]}
            />

            <ThemedText style={{ marginTop: 12, marginBottom: 8 }}>Sample Work</ThemedText>
            <View style={styles.sampleGrid}>
              {[1, 2, 3].map((i) => (
                <Pressable key={i} style={[styles.sampleBox, { backgroundColor: avatarBg }]}><ThemedText>＋</ThemedText></Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleSubmit} style={[styles.button, { backgroundColor: tint }, (!formData.name || !formData.address) && styles.buttonDisabled]} disabled={!formData.name || !formData.address}>
          <ThemedText style={styles.buttonText}>Complete Setup</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.select({ ios: 44, android: 24, default: 24 }), padding: 20, alignItems: 'center' },
  logo: { width: 72, height: 72, marginBottom: 8 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  scroll: { padding: 20, paddingBottom: 120 },
  avatarRow: { alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarButton: { position: 'absolute', right: 24, bottom: -6, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e6e7eb', borderRadius: 12, padding: 12, height: 48, marginBottom: 12 },
  textarea: { minHeight: 80, height: 100, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f3f4f6', marginRight: 8, marginBottom: 8 },
  chipActive: {  },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  sampleGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  sampleBox: { width: '30%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: 1, borderColor: '#e6e7eb', backgroundColor: '#fff' },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: 'rgba(0,0,0,0.12)' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

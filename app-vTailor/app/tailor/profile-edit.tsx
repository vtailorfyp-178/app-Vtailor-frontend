import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile as updateProfileApi } from '@/services/authApi';

export default function TailorProfileEdit() {
  const auth = useAuth();
  const { user, loginEmail, updateProfile, token, userId } = auth;
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar ?? null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  // email is locked to the OTP-verified login email — users cannot change it here
  const email = user?.email || loginEmail || '';
  const [address, setAddress] = useState(user?.address || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [specializations, setSpecializations] = useState(
    (user?.specialization ?? []).join(', ') || 'Formal Dresses, Wedding Attire, Traditional'
  );

  const handlePickImage = () => {
    Alert.alert('Change Profile Picture', 'Choose an option', [
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
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!token || !userId) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    const specializationList = specializations.split(',').map(s => s.trim()).filter(Boolean);

    updateProfileApi(token, userId, {
      name: name,
      email: email,
      phone: phone,
      address: address,
      experience: experience,
      specialization: specializationList,
      avatar: profileImage ?? undefined,
    })
      .then(() => {
        updateProfile({
          name: name,
          email: email,
          phone: phone,
          address: address,
          experience: experience,
          specialization: specializationList,
          avatar: profileImage ?? undefined,
        });
        Alert.alert('Success', 'Profile updated successfully!');
        router.replace('/tailor?tab=profile');
      })
      .catch((error) => {
        console.error('Profile save failed:', error);
        Alert.alert('Save failed', 'Unable to save your profile to the database.');
      });
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.replace('/tailor?tab=profile')} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Edit Profile</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Image */}
          <View style={styles.profileImageSection}>
            <View style={[styles.profileImageBox, { backgroundColor: cardBg }]}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="camera-outline" size={34} color={tint} />
              )}
            </View>
            <Pressable style={[styles.changeImageBtn, { backgroundColor: tint }]} onPress={handlePickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.changeImageText}>Change Photo</Text>
            </Pressable>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#111827', backgroundColor: cardBg }]}
              placeholder="Enter your full name"
              placeholderTextColor={muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Phone */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#111827', backgroundColor: cardBg }]}
              placeholder="Enter phone number"
              placeholderTextColor={muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email — read-only: locked to OTP-verified address */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Email (verified)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#6b7280', backgroundColor: '#f3f4f6' }]}
              value={email}
              editable={false}
              keyboardType="email-address"
            />
          </View>

          {/* Address */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Address</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#111827', backgroundColor: cardBg }]}
              placeholder="Enter your address"
              placeholderTextColor={muted}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Experience */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Years of Experience</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#111827', backgroundColor: cardBg }]}
              placeholder="Enter years of experience"
              placeholderTextColor={muted}
              value={experience}
              onChangeText={setExperience}
              keyboardType="number-pad"
            />
          </View>

          {/* Specializations */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Specializations (comma separated)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#111827', backgroundColor: cardBg }]}
              placeholder="e.g., Formal Dresses, Wedding Attire"
              placeholderTextColor={muted}
              value={specializations}
              onChangeText={setSpecializations}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Save Button */}
          <Pressable style={[styles.saveBtn, { backgroundColor: tint }]} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Pressable>

          {/* Cancel Button */}
          <Pressable style={[styles.cancelBtn, { borderColor: tint }]} onPress={() => router.replace('/tailor?tab=profile')}>
            <Text style={[styles.cancelBtnText, { color: tint }]}>Cancel</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  headerButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', color: '#6b7280' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontWeight: '600' },
  profileImageSection: { alignItems: 'center', marginBottom: 24 },
  profileImageBox: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 12 },
  profileImage: { width: '100%', height: '100%', borderRadius: 60 },
  changeImageBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  changeImageText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cancelBtn: { borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { fontWeight: '700', fontSize: 14 },
});

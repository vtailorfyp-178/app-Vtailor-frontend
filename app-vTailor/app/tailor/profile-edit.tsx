import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TailorProfileEdit() {
  const auth = useAuth();
  const { user, updateProfile } = auth;
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const { userPhone } = auth;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [experience, setExperience] = useState('8');
  const [specializations, setSpecializations] = useState('Formal Dresses, Wedding Attire, Traditional');

  const handlePickImage = () => {
    Alert.alert('Change Profile Picture', 'Choose an option', [
      {
        text: 'Camera',
        onPress: () => {
          setProfileImage('https://via.placeholder.com/200x200?text=Camera+Photo');
          Alert.alert('Success', 'Photo captured from camera');
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          setProfileImage('https://via.placeholder.com/200x200?text=Gallery+Image');
          Alert.alert('Success', 'Photo selected from gallery');
        },
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    // Update user profile in auth context
    updateProfile({
      name: name,
      email: email,
      address: address,
      experience: experience,
      specialization: specializations.split(',').map(s => s.trim()),
    });
    Alert.alert('Success', 'Profile updated successfully!');
    router.replace('/tailor?tab=profile');
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
                <Text style={styles.placeholderIcon}>📷</Text>
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

          {/* Email */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorder, color: '#111827', backgroundColor: cardBg }]}
              placeholder="Enter email address"
              placeholderTextColor={muted}
              value={email}
              onChangeText={setEmail}
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
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', color: '#6b7280' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontWeight: '600' },
  profileImageSection: { alignItems: 'center', marginBottom: 24 },
  profileImageBox: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 12 },
  profileImage: { width: '100%', height: '100%', borderRadius: 60 },
  placeholderIcon: { fontSize: 48 },
  changeImageBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  changeImageText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cancelBtn: { borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { fontWeight: '700', fontSize: 14 },
});

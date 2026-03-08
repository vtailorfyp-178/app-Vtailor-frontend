import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri?: string;
  thumbnail?: string;
  name: string;
}

export default function SampleWorkEdit() {
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  const [media, setMedia] = useState<MediaItem[]>([
    { id: '1', type: 'image', name: 'Sample 1', uri: 'https://via.placeholder.com/200x200?text=Sample+1' },
    { id: '2', type: 'image', name: 'Sample 2', uri: 'https://via.placeholder.com/200x200?text=Sample+2' },
    { id: '3', type: 'image', name: 'Sample 3', uri: 'https://via.placeholder.com/200x200?text=Sample+3' },
  ]);

  const handleAddImage = () => {
    Alert.alert('Add Image', 'Pick image from gallery', [
      {
        text: 'Gallery',
        onPress: () => {
          const newItem: MediaItem = {
            id: String(Date.now()),
            type: 'image',
            name: `Sample ${media.length + 1}`,
            uri: 'https://via.placeholder.com/200x200?text=New+Image',
          };
          setMedia([...media, newItem]);
          Alert.alert('Success', 'Image added to sample work');
        },
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handleAddVideo = () => {
    Alert.alert('Add Video', 'Pick video from gallery', [
      {
        text: 'Gallery',
        onPress: () => {
          const newItem: MediaItem = {
            id: String(Date.now()),
            type: 'video',
            name: `Sample Video ${media.filter(m => m.type === 'video').length + 1}`,
            uri: 'https://via.placeholder.com/200x200?text=Video',
          };
          setMedia([...media, newItem]);
          Alert.alert('Success', 'Video added to sample work');
        },
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this item from sample work?', [
      {
        text: 'Delete',
        onPress: () => {
          setMedia(media.filter(m => m.id !== id));
        },
        style: 'destructive',
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    Alert.alert('Success', 'Sample work updated successfully!');
    router.back();
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Edit Sample Work</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Items */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Current Items ({media.length})</ThemedText>
            <View style={styles.grid}>
              {media.map((item) => (
                <View key={item.id} style={[styles.mediaCard, { backgroundColor: cardBg }]}>
                  {item.uri && (
                    <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  )}
                  <View style={styles.mediaOverlay}>
                    {item.type === 'video' && (
                      <Ionicons name="play-circle" size={32} color="#fff" />
                    )}
                    {item.type === 'image' && (
                      <Ionicons name="image" size={28} color="#fff" />
                    )}
                  </View>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Add New Items */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Add More Items</ThemedText>
            <View style={styles.addRow}>
              <Pressable
                style={[styles.addBtn, { backgroundColor: tint }]}
                onPress={handleAddImage}
              >
                <Ionicons name="image" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Add Image</Text>
              </Pressable>
              <Pressable
                style={[styles.addBtn, { backgroundColor: '#10b981' }]}
                onPress={handleAddVideo}
              >
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Add Video</Text>
              </Pressable>
            </View>
          </View>

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }]}>
            <Ionicons name="information-circle" size={20} color="#d97706" />
            <ThemedText style={[styles.infoText, { color: '#92400e' }]}>
              Add high-quality photos and videos of your best work. These help customers understand your craftsmanship.
            </ThemedText>
          </View>

          {/* Save Button */}
          <Pressable
            style={[styles.saveBtn, { backgroundColor: tint }]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, color: '#111827' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mediaCard: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#e5e7eb' },
  thumbnail: { width: '100%', height: '100%' },
  mediaOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  deleteBtn: { position: 'absolute', top: 4, right: 4, padding: 4 },
  addRow: { flexDirection: 'row', gap: 10 },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  infoCard: { flexDirection: 'row', padding: 12, borderRadius: 10, borderWidth: 1, gap: 10, marginBottom: 16, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

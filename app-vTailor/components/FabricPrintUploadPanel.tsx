import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { uploadFabricPrintSelection } from '@/services/fabricPrintApi';
import {
  buildLocalFabricPrintSelection,
  serializeFabricPrintSelection,
  parseFabricPrintSelection,
} from '@/services/glb/fabricPrintSelection';
import {
  captureFabricPrintFromCamera,
  pickFabricPrintFromGallery,
} from '@/services/fabricPrintUpload';

type Props = {
  userId: string;
  printUrl: string | null;
  onPrintUrlChange: (url: string | null) => void;
};

export function FabricPrintUploadPanel({ userId, printUrl, onPrintUrlChange }: Props) {
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const [uploading, setUploading] = useState(false);
  const previewImageUrl =
    parseFabricPrintSelection(printUrl)?.sourceUrl ?? printUrl;

  const runUpload = useCallback(
    async (mode: 'camera' | 'gallery') => {
      try {
        setUploading(true);
        const prepared =
          mode === 'camera'
            ? await captureFabricPrintFromCamera()
            : await pickFabricPrintFromGallery();
        if (!prepared) return;

        const localSelection = buildLocalFabricPrintSelection(prepared.uri);
        onPrintUrlChange(serializeFabricPrintSelection(localSelection));

        try {
          const cloudSelection = await uploadFabricPrintSelection({
            uri: prepared.uri,
            userId: userId || 'guest',
            printName: prepared.fileName,
            mimeType: prepared.mimeType,
            fileName: prepared.fileName,
          });
          onPrintUrlChange(serializeFabricPrintSelection(cloudSelection));
        } catch {
          /* Offline — local texture already applied on the 3D model. */
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not use this image.';
        Alert.alert('Fabric print', msg);
      } finally {
        setUploading(false);
      }
    },
    [onPrintUrlChange, userId],
  );

  const removePrint = () => {
    Alert.alert('Remove print', 'Remove custom fabric print from preview?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onPrintUrlChange(null) },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <ThemedText style={[styles.lead, { color: muted }]}>
        Upload a floral, lawn, or digital print photo. It applies instantly on your 3D dress fabric.
      </ThemedText>

      {printUrl ? (
        <View style={[styles.previewCard, { borderColor: inputBorder, backgroundColor: card }]}>
          <Image source={{ uri: previewImageUrl || undefined }} style={styles.previewImage} resizeMode="cover" />
          <Pressable onPress={removePrint} style={[styles.removeBtn, { borderColor: inputBorder }]}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <ThemedText style={styles.removeText}>Remove print</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          disabled={uploading}
          onPress={() => runUpload('camera')}
          style={[styles.actionBtn, { backgroundColor: tint, opacity: uploading ? 0.7 : 1 }]}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <ThemedText style={styles.actionBtnText}>Camera</ThemedText>
            </>
          )}
        </Pressable>
        <Pressable
          disabled={uploading}
          onPress={() => runUpload('gallery')}
          style={[styles.actionBtnOutline, { borderColor: tint, opacity: uploading ? 0.7 : 1 }]}
        >
          <Ionicons name="images-outline" size={20} color={tint} />
          <ThemedText style={[styles.actionBtnOutlineText, { color: tint }]}>Gallery</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.formats, { color: muted }]}>
        JPG · PNG · WEBP · auto-compressed for mobile
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 4 },
  lead: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewImage: { width: '100%', height: 140 },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  removeText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  actionBtnOutlineText: { fontWeight: '800', fontSize: 15 },
  formats: { fontSize: 11, marginTop: 10, textAlign: 'center' },
});

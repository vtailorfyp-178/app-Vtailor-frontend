import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

const MAX_TEXTURE_EDGE = 2048;
const JPEG_QUALITY = 0.88;

export type PreparedFabricImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  width: number;
  height: number;
};

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function requestGalleryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Preserve full swatch aspect ratio — do NOT square-crop (destroys repeat pattern).
 * Only downscale longest edge for upload; backend detects repeat unit.
 */
async function optimizeForFabricSwatch(uri: string): Promise<PreparedFabricImage> {
  const probe = await ImageManipulator.manipulateAsync(uri, [], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
  const w = probe.width || 1024;
  const h = probe.height || 1024;
  const longest = Math.max(w, h);

  const actions: ImageManipulator.Action[] = [];
  if (longest > MAX_TEXTURE_EDGE) {
    if (w >= h) {
      actions.push({ resize: { width: MAX_TEXTURE_EDGE } });
    } else {
      actions.push({ resize: { height: MAX_TEXTURE_EDGE } });
    }
  }

  const out =
    actions.length > 0
      ? await ImageManipulator.manipulateAsync(uri, actions, {
          compress: JPEG_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        })
      : await ImageManipulator.manipulateAsync(uri, [], {
          compress: JPEG_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        });

  return {
    uri: out.uri,
    mimeType: 'image/jpeg',
    fileName: `fabric-swatch-${Date.now()}.jpg`,
    width: out.width || w,
    height: out.height || h,
  };
}

export async function captureFabricPrintFromCamera(): Promise<PreparedFabricImage | null> {
  const ok = await requestCameraPermission();
  if (!ok) throw new Error('Camera permission is required to capture a fabric print.');
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.95,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return optimizeForFabricSwatch(result.assets[0].uri);
}

export async function pickFabricPrintFromGallery(): Promise<PreparedFabricImage | null> {
  const ok = await requestGalleryPermission();
  if (!ok) throw new Error('Gallery permission is required to select a fabric print.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.95,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType || 'image/jpeg';
  if (mime === 'image/png') {
    const w = asset.width || 1024;
    const h = asset.height || 1024;
    const longest = Math.max(w, h);
    const actions: ImageManipulator.Action[] = [];
    if (longest > MAX_TEXTURE_EDGE) {
      if (w >= h) actions.push({ resize: { width: MAX_TEXTURE_EDGE } });
      else actions.push({ resize: { height: MAX_TEXTURE_EDGE } });
    }
    const pngOut = await ImageManipulator.manipulateAsync(
      asset.uri,
      actions,
      { compress: 1, format: ImageManipulator.SaveFormat.PNG },
    );
    return {
      uri: pngOut.uri,
      mimeType: 'image/png',
      fileName: `fabric-swatch-${Date.now()}.png`,
      width: pngOut.width || w,
      height: pngOut.height || h,
    };
  }
  return optimizeForFabricSwatch(asset.uri);
}

import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { Image, Platform } from 'react-native';
import * as LegacyFS from 'expo-file-system/legacy';
import { stripGlbTexturesForNative } from './stripGlbTextures';

function normalizeDevAssetUri(uri: string): string {
  if (!/localhost|127\.0\.0\.1/.test(uri)) return uri;

  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost;

  const host = debuggerHost?.split(':')[0];
  if (!host) return uri;

  return uri.replace(/localhost|127\.0\.0\.1/g, host);
}

async function resolveGlbUri(assetModule: number): Promise<string> {
  try {
    await Asset.loadAsync(assetModule as never);
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    const fromAsset = asset.localUri ?? asset.uri;
    if (fromAsset) return normalizeDevAssetUri(fromAsset);
  } catch (err) {
    console.warn('[loadBundledGlbBuffer] Asset cache failed, using Metro URI:', err);
  }

  const source = Image.resolveAssetSource(assetModule);
  if (source?.uri) return normalizeDevAssetUri(source.uri);

  throw new Error('Model asset URI missing.');
}

function xhrArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      const buf = xhr.response as ArrayBuffer | null;
      if (buf && buf.byteLength >= 80) {
        resolve(buf);
        return;
      }
      reject(new Error(`Could not read model (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('Could not read model bytes from device.'));
    xhr.send();
  });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/\s/g, '');
  const chars = atob(clean);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i += 1) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes.buffer;
}

async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      return await xhrArrayBuffer(uri);
    } catch {
      /* fall through */
    }
  }

  if (Platform.OS !== 'web' && uri.startsWith('file://')) {
    try {
      const b64 = await LegacyFS.readAsStringAsync(uri, {
        encoding: LegacyFS.EncodingType.Base64,
      });
      const buf = base64ToArrayBuffer(b64);
      if (buf.byteLength >= 80) return buf;
    } catch {
      /* fall through */
    }
  }

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`Could not load model (${res.status}).`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 80) throw new Error('Model file is empty or invalid.');
    return buf;
  }

  return xhrArrayBuffer(uri);
}

/** Soft limit — warn in logs but still try load (preload path handles OOM gracefully). */
const ANDROID_WARN_GLB_BYTES = 14 * 1024 * 1024;

export async function loadBundledGlbBuffer(assetModule: number): Promise<ArrayBuffer> {
  const uri = await resolveGlbUri(assetModule);
  let buf = await readUriAsArrayBuffer(uri);
  if (Platform.OS !== 'web') {
    buf = stripGlbTexturesForNative(buf);
    if (Platform.OS === 'android' && buf.byteLength > ANDROID_WARN_GLB_BYTES) {
      console.warn(
        `[loadBundledGlbBuffer] Large GLB (${(buf.byteLength / 1024 / 1024).toFixed(1)}MB) — may be slow on low-RAM devices.`,
      );
    }
  }
  return buf;
}

import { readGlbChunks } from './glbJsonUtils';
import { isGrarahModelUrl } from './glbMaterialPolicy';

export type GlbMaterialDiagnostics = {
  url: string;
  imageCount: number;
  textureCount: number;
  materialCount: number;
  hasBaseColorTexture: boolean;
  isGrarah: boolean;
};

export function diagnoseGlbBuffer(buf: ArrayBuffer, url: string): GlbMaterialDiagnostics | null {
  const chunks = readGlbChunks(buf);
  if (!chunks) return null;
  const { json } = chunks;
  const materials = json.materials ?? [];
  let hasBaseColorTexture = false;
  for (const mat of materials) {
    if (mat.pbrMetallicRoughness?.baseColorTexture != null) {
      hasBaseColorTexture = true;
      break;
    }
  }
  return {
    url,
    imageCount: json.images?.length ?? 0,
    textureCount: json.textures?.length ?? 0,
    materialCount: materials.length,
    hasBaseColorTexture,
    isGrarah: isGrarahModelUrl(url),
  };
}

export function logGlbMaterialDiagnostics(diag: GlbMaterialDiagnostics): void {
  if (!__DEV__) return;
  const { imageCount, textureCount, materialCount, hasBaseColorTexture, isGrarah } = diag;
  if (isGrarah && imageCount === 0) {
    console.warn(
      '[GlbDiagnostics] Grarah GLB has no embedded textures — applying wedding PBR color. Re-upload textured GLBs to Cloudinary for embroidery detail.',
      { url: diag.url.slice(-72), materialCount },
    );
    return;
  }
  if (imageCount === 0 && !hasBaseColorTexture) {
    console.warn('[GlbDiagnostics] GLB has no textures or baseColor maps', {
      url: diag.url.slice(-72),
      materialCount,
    });
    return;
  }
  console.log('[GlbDiagnostics] OK', {
    url: diag.url.slice(-56),
    imageCount,
    textureCount,
    materialCount,
    hasBaseColorTexture,
  });
}

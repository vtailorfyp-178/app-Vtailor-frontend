import * as ImageManipulator from 'expo-image-manipulator';
import type { FabricPatternMeta } from '@/services/glb/fabricPrintSelection';

const ASSUMED_SWATCH_CM = 45;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Estimate repeat metadata from a phone fabric photo (offline preview). */
export function estimatePatternMetaFromImageSize(
  width: number,
  height: number,
): FabricPatternMeta {
  const w = Math.max(width, 64);
  const h = Math.max(height, 64);
  const longest = Math.max(w, h);
  const tilesAcross = clamp(Math.round(longest / Math.max(w, h) >= 1.2 ? 4 : 5), 3, 7);
  const motifSizeCm = ASSUMED_SWATCH_CM / tilesAcross;
  const tileW = Math.max(64, Math.round(w / tilesAcross));
  const tileH = Math.max(64, Math.round(h / tilesAcross));

  return {
    repeatPeriodX: tileW,
    repeatPeriodY: tileH,
    tileWidth: tileW,
    tileHeight: tileH,
    motifSizeCm,
    repeatsPerMeter: 100 / motifSizeCm,
    confidence: 0.35,
    sourceWidth: w,
    sourceHeight: h,
    tilesAcrossSource: tilesAcross,
  };
}

/**
 * Crop one repeat unit from swatch center for local tile URL (before backend analysis).
 */
export async function extractLocalFabricTileUri(
  sourceUri: string,
  width: number,
  height: number,
): Promise<{ tileUri: string; meta: FabricPatternMeta }> {
  const meta = estimatePatternMetaFromImageSize(width, height);
  const tilesAcross = meta.tilesAcrossSource ?? 4;
  const tileW = Math.max(48, Math.floor(width / tilesAcross));
  const tileH = Math.max(48, Math.floor(height / tilesAcross));
  const originX = Math.max(0, Math.floor((width - tileW) / 2));
  const originY = Math.max(0, Math.floor((height - tileH) / 2));

  const cropped = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ crop: { originX, originY, width: tileW, height: tileH } }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
  );

  return {
    tileUri: cropped.uri,
    meta: {
      ...meta,
      tileWidth: cropped.width ?? tileW,
      tileHeight: cropped.height ?? tileH,
    },
  };
}

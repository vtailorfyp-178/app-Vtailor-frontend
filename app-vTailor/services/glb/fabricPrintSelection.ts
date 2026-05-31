/** Pattern metadata returned from fabric-print upload API. */
export type FabricPatternMeta = {
  repeatPeriodX: number;
  repeatPeriodY: number;
  tileWidth: number;
  tileHeight: number;
  motifSizeCm: number;
  repeatsPerMeter: number;
  confidence: number;
  sourceWidth: number;
  sourceHeight: number;
  tilesAcrossSource?: number;
};

export type FabricPrintSelection = {
  /** Original full-resolution upload (reference). */
  sourceUrl: string;
  /** Single repeat unit — use with THREE.RepeatWrapping. */
  tileUrl: string;
  /** 4×4 pre-tiled swatch — for model-viewer (no repeat API). */
  megatileUrl: string;
  patternMeta: FabricPatternMeta;
};

const DEFAULT_META: FabricPatternMeta = {
  repeatPeriodX: 128,
  repeatPeriodY: 128,
  tileWidth: 256,
  tileHeight: 256,
  motifSizeCm: 8,
  repeatsPerMeter: 12,
  confidence: 0,
  sourceWidth: 1024,
  sourceHeight: 1024,
};

export function defaultFabricPatternMeta(): FabricPatternMeta {
  return { ...DEFAULT_META };
}

/** Serialize for selections['fabric-print'] storage. */
export function serializeFabricPrintSelection(sel: FabricPrintSelection): string {
  return JSON.stringify(sel);
}

/** Parse stored fabric-print value (JSON or legacy plain URL). */
export function parseFabricPrintSelection(raw: string | null | undefined): FabricPrintSelection | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as Partial<FabricPrintSelection>;
      const sourceUrl = parsed.sourceUrl || parsed.tileUrl || '';
      const tileUrl = parsed.tileUrl || sourceUrl;
      return {
        sourceUrl,
        tileUrl,
        megatileUrl: parsed.megatileUrl || tileUrl,
        patternMeta: { ...DEFAULT_META, ...(parsed.patternMeta || {}) },
      };
    } catch {
      return null;
    }
  }
  return {
    sourceUrl: value,
    tileUrl: value,
    megatileUrl: value,
    patternMeta: { ...DEFAULT_META },
  };
}

/** Tile URL for Three.js (repeat wrapping). */
export function fabricPrintTileUrl(raw: string | null | undefined): string | null {
  return parseFabricPrintSelection(raw)?.tileUrl ?? raw ?? null;
}

/** Megatile URL for model-viewer on Android. */
export function fabricPrintMegatileUrl(raw: string | null | undefined): string | null {
  return parseFabricPrintSelection(raw)?.megatileUrl ?? fabricPrintTileUrl(raw);
}

export function fabricPrintPatternMeta(raw: string | null | undefined): FabricPatternMeta {
  return parseFabricPrintSelection(raw)?.patternMeta ?? { ...DEFAULT_META };
}

export function buildFabricPrintSelectionFromUpload(record: {
  cloudinaryUrl: string;
  tileUrl?: string;
  megatileUrl?: string;
  patternMeta?: Partial<FabricPatternMeta>;
}): FabricPrintSelection {
  const tileUrl = record.tileUrl || record.cloudinaryUrl;
  return {
    sourceUrl: record.cloudinaryUrl,
    tileUrl,
    megatileUrl: record.megatileUrl || tileUrl,
    patternMeta: { ...DEFAULT_META, ...(record.patternMeta || {}) },
  };
}

/** Apply picked photo on-device immediately (works offline; no backend required). */
export function buildLocalFabricPrintSelection(localUri: string): FabricPrintSelection {
  const uri = localUri.trim();
  return {
    sourceUrl: uri,
    tileUrl: uri,
    megatileUrl: uri,
    patternMeta: { ...DEFAULT_META },
  };
}

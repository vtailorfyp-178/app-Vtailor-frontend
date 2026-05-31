import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserCustomizations, setCustomizationsSnapshot } from '@/services/userDataService';
import type { TabId } from '@/services/dressGlbResolver';

const TAB_KEYS: TabId[] = ['neck', 'sleeves', 'bottom', 'frock-style', 'colors', 'saree-style', 'fabric-print'];

function normalizeSelections(sel: Record<string, string | null | undefined> | null | undefined): Record<TabId, string | null> {
  const out: Record<TabId, string | null> = {
    neck: null,
    sleeves: null,
    bottom: null,
    'frock-style': null,
    colors: null,
    'saree-style': null,
    'fabric-print': null,
  };
  if (!sel || typeof sel !== 'object') return out;
  for (const k of TAB_KEYS) {
    const v = sel[k];
    out[k] = v == null || v === '' ? null : String(v);
  }
  return out;
}

function selectionsEqual(a: Record<TabId, string | null>, b: Record<TabId, string | null>): boolean {
  return TAB_KEYS.every((k) => a[k] === b[k]);
}

function designAlreadySaved(modelId: string, selections: Record<TabId, string | null>, list: unknown[]): boolean {
  const norm = normalizeSelections(selections);
  return list.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const r = row as { modelId?: string; selections?: unknown };
    if (String(r.modelId ?? '') !== String(modelId)) return false;
    return selectionsEqual(norm, normalizeSelections(r.selections as Record<string, string | null>));
  });
}

async function loadCustomizationList(userId: string | null | undefined): Promise<any[]> {
  if (userId) {
    return getUserCustomizations(userId);
  }
  try {
    const raw = await AsyncStorage.getItem('CUSTOMIZATIONS');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Appends a completed dress design to My Designs storage unless the same model + selections already exist.
 */
export async function persistNewCustomization(
  userId: string | null | undefined,
  modelId: string,
  modelName: string,
  selections: Record<TabId, string | null>
): Promise<void> {
  try {
    const effectiveUserId = userId && String(userId).trim() !== '' ? userId : undefined;
    const list = await loadCustomizationList(effectiveUserId);
    const normSelections = normalizeSelections(selections);

    if (designAlreadySaved(modelId, normSelections, list)) {
      return;
    }

    const item = {
      id: Date.now().toString(),
      modelId,
      modelName,
      selections: normSelections,
      createdAt: new Date().toISOString(),
      /** Set when logged in so tailors can match previews to a customer on shared device / future API. */
      customerUserId: effectiveUserId ?? null,
    };

    list.push(item);
    await setCustomizationsSnapshot(effectiveUserId, list);
  } catch {
    // ignore storage errors
  }
}

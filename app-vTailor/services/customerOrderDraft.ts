import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Router } from 'expo-router';
import type { TabId } from '@/services/dressGlbResolver';
import { upsertSavedDesign, type SavedDesignMeasurements } from '@/services/savedDesign';

export type MeasurementStep = 'basic' | 'shirt' | 'trouser' | 'other';

export type CustomerOrderDraft = {
  modelId: string;
  modelName: string;
  dressLine?: string;
  selections: Record<TabId, string | null>;
  measurements?: {
    basic: Record<string, string>;
    shirt: Record<string, string>;
    trouser: Record<string, string>;
    other: Record<string, string>;
    step: MeasurementStep;
  };
  /** Next screen when user taps Continue on the dashboard. */
  resumeAt: 'view_model' | 'measurements' | 'find_tailors';
  updatedAt: string;
};

const draftKey = (userId: string | null | undefined) =>
  `vtailor_order_draft_${userId && String(userId).trim() ? userId : 'guest'}`;

const TAB_KEYS: TabId[] = [
  'neck',
  'sleeves',
  'bottom',
  'frock-style',
  'colors',
  'saree-style',
  'fabric-print',
];

function normalizeSelections(
  sel: Record<string, string | null | undefined> | null | undefined,
): Record<TabId, string | null> {
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

function requiredMeasurementsComplete(measurements: CustomerOrderDraft['measurements']): boolean {
  if (!measurements) return false;
  const hasAll = (values: Record<string, string>, keys: string[]) =>
    keys.every((key) => Boolean(values[key]?.trim()));
  return (
    hasAll(measurements.basic, ['shoulder', 'biceps', 'arm', 'thigh', 'armpit', 'bust', 'waist', 'hip']) &&
    hasAll(measurements.shirt, ['neck', 'length', 'chawk', 'gherah']) &&
    hasAll(measurements.trouser, ['length', 'phuncha', 'inseam'])
  );
}

async function appendMeasurementSnapshot(payload: {
  basic: Record<string, string>;
  shirt: Record<string, string>;
  trouser: Record<string, string>;
  other: Record<string, string>;
  modelId?: string;
  modelName?: string;
  selections?: Record<TabId, string | null>;
}): Promise<void> {
  const hasAny = [payload.basic, payload.shirt, payload.trouser, payload.other].some((group) =>
    Object.values(group).some((v) => Boolean(v?.trim())),
  );
  if (!hasAny) return;

  const listRaw = await AsyncStorage.getItem('CUSTOMER_MEASUREMENTS');
  const list = listRaw ? JSON.parse(listRaw) : [];
  list.unshift({
    ...payload,
    updatedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem('CUSTOMER_MEASUREMENTS', JSON.stringify(list));
}

export async function getCustomerOrderDraft(
  userId: string | null | undefined,
): Promise<CustomerOrderDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as CustomerOrderDraft;
  } catch {
    return null;
  }
}

export async function clearCustomerOrderDraft(userId: string | null | undefined): Promise<void> {
  try {
    await AsyncStorage.removeItem(draftKey(userId));
  } catch {
    /* ignore */
  }
}

export async function saveCustomerOrderDraft(
  userId: string | null | undefined,
  draft: Omit<CustomerOrderDraft, 'updatedAt'>,
): Promise<void> {
  const payload: CustomerOrderDraft = {
    ...draft,
    selections: normalizeSelections(draft.selections),
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(draftKey(userId), JSON.stringify(payload));
}

type SaveCustomizationProgressInput = {
  userId: string | null | undefined;
  modelId: string;
  modelName: string;
  dressLine?: string;
  selections: Record<TabId, string | null>;
};

/** Save completed customization and mark draft to resume at measurements. */
export async function saveCustomizationProgress(input: SaveCustomizationProgressInput): Promise<void> {
  const { userId, modelId, modelName, dressLine, selections } = input;
  const normSelections = normalizeSelections(selections);
  await upsertSavedDesign(userId, {
    modelId,
    modelName,
    dressLine,
    selections: normSelections,
  });
  await saveCustomerOrderDraft(userId, {
    modelId,
    modelName,
    dressLine,
    selections: normSelections,
    resumeAt: 'measurements',
  });
}

type SaveMeasurementProgressInput = {
  userId: string | null | undefined;
  modelId?: string;
  modelName?: string;
  dressLine?: string;
  selections?: Record<TabId, string | null>;
  basic: Record<string, string>;
  shirt: Record<string, string>;
  trouser: Record<string, string>;
  other: Record<string, string>;
  step: MeasurementStep;
};

/** Save partial or full measurements linked to the current dress design. */
export async function saveMeasurementProgress(input: SaveMeasurementProgressInput): Promise<void> {
  const {
    userId,
    modelId = '',
    modelName = 'Your dress',
    dressLine,
    selections = {},
    basic,
    shirt,
    trouser,
    other,
    step,
  } = input;

  const normSelections = normalizeSelections(selections);
  const measurements = { basic, shirt, trouser, other, step };
  const measurementSnapshot: SavedDesignMeasurements = { basic, shirt, trouser, other };

  if (modelId) {
    await upsertSavedDesign(userId, {
      modelId,
      modelName,
      dressLine,
      selections: normSelections,
      measurements: measurementSnapshot,
    });
  }

  await appendMeasurementSnapshot({
    basic,
    shirt,
    trouser,
    other,
    modelId: modelId || undefined,
    modelName,
    selections: normSelections,
  });

  const resumeAt = requiredMeasurementsComplete(measurements) ? 'find_tailors' : 'measurements';

  await saveCustomerOrderDraft(userId, {
    modelId,
    modelName,
    dressLine,
    selections: normSelections,
    measurements,
    resumeAt,
  });
}

export function resumeCustomerOrderDraft(router: Router, draft: CustomerOrderDraft): void {
  if (draft.resumeAt === 'find_tailors') {
    (router as any).push('/customer/find-tailors');
    return;
  }

  if (draft.resumeAt === 'measurements') {
    (router as any).push({
      pathname: '/customer/measurements',
      params: {
        modelId: draft.modelId,
        modelName: draft.modelName,
        dressLine: draft.dressLine || '',
        selections: JSON.stringify(draft.selections || {}),
        restoreDraft: '1',
      },
    });
    return;
  }

  (router as any).push({
    pathname: '/customer/view-3d-model',
    params: {
      modelId: draft.modelId,
      modelName: draft.modelName,
      dressLine: draft.dressLine || '',
      selections: JSON.stringify(draft.selections || {}),
      flow: 'finalize',
    },
  });
}

export function draftResumeLabel(draft: CustomerOrderDraft): string {
  if (draft.resumeAt === 'find_tailors') {
    return `Ready to find tailors — ${draft.modelName}`;
  }
  if (draft.resumeAt === 'measurements') {
    return `Continue measurements — ${draft.modelName}`;
  }
  return `Continue your design — ${draft.modelName}`;
}

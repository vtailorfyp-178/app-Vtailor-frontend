import type { TabId } from '@/services/dressGlbResolver';
import {
  clearCustomerOrderDraft,
  getCustomerOrderDraft,
  type CustomerOrderDraft,
} from '@/services/customerOrderDraft';
import { getUserCustomizations, setCustomizationsSnapshot } from '@/services/userDataService';
import type { Order } from '@/services/ordersApi';

export type SavedDesignMeasurements = {
  basic: Record<string, string>;
  shirt: Record<string, string>;
  trouser: Record<string, string>;
  other: Record<string, string>;
};

export type SavedDesignTailor = {
  tailorId: string;
  tailorName: string;
  specialization?: string;
  rating?: string;
  priceFrom?: string;
  priceTo?: string;
};

export type SavedDesignOrder = {
  orderId: string;
  description: string;
  budget: number;
  deliveryDays: number;
  placedAt: string;
};

export type SavedDesign = {
  id: string;
  modelId: string;
  modelName: string;
  dressLine?: string;
  selections: Record<TabId, string | null>;
  measurements?: SavedDesignMeasurements;
  tailor?: SavedDesignTailor;
  order?: SavedDesignOrder;
  orderPlaced?: boolean;
  createdAt: string;
  updatedAt?: string;
  customerUserId?: string | null;
};

const TAB_KEYS: TabId[] = [
  'neck',
  'sleeves',
  'bottom',
  'frock-style',
  'colors',
  'saree-style',
  'fabric-print',
];

export function normalizeSavedSelections(
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

function selectionsEqual(a: Record<TabId, string | null>, b: Record<TabId, string | null>): boolean {
  return TAB_KEYS.every((k) => a[k] === b[k]);
}

function findMatchingIndex(
  list: SavedDesign[],
  modelId: string,
  selections: Record<TabId, string | null>,
  id?: string,
): number {
  if (id) {
    const byId = list.findIndex((row) => row.id === id);
    if (byId >= 0) return byId;
  }
  if (!modelId) return -1;
  return list.findIndex(
    (row) => String(row.modelId) === String(modelId) && selectionsEqual(selections, normalizeSavedSelections(row.selections)),
  );
}

async function loadDesignList(userId: string | null | undefined): Promise<SavedDesign[]> {
  if (userId) {
    const list = await getUserCustomizations(userId);
    return (list || []) as SavedDesign[];
  }
  return [];
}

export type UpsertSavedDesignInput = {
  id?: string;
  modelId: string;
  modelName: string;
  dressLine?: string;
  selections: Record<string, string | null | undefined>;
  measurements?: SavedDesignMeasurements;
  tailor?: SavedDesignTailor;
  order?: SavedDesignOrder;
  orderPlaced?: boolean;
};

/** Create or update a saved design (My Designs) with optional measurements / tailor / order. */
export async function upsertSavedDesign(
  userId: string | null | undefined,
  input: UpsertSavedDesignInput,
): Promise<SavedDesign> {
  const effectiveUserId = userId && String(userId).trim() !== '' ? userId : undefined;
  const list = await loadDesignList(effectiveUserId);
  const normSelections = normalizeSavedSelections(input.selections);
  const idx = findMatchingIndex(list, input.modelId, normSelections, input.id);
  const now = new Date().toISOString();
  const existing = idx >= 0 ? list[idx] : null;

  const merged: SavedDesign = {
    id: existing?.id || input.id || Date.now().toString(),
    modelId: input.modelId || existing?.modelId || '',
    modelName: input.modelName || existing?.modelName || 'Custom design',
    dressLine: input.dressLine ?? existing?.dressLine,
    selections: normSelections,
    measurements: input.measurements ?? existing?.measurements,
    tailor: input.tailor ?? existing?.tailor,
    order: input.order ?? existing?.order,
    orderPlaced: input.orderPlaced ?? existing?.orderPlaced ?? false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    customerUserId: effectiveUserId ?? existing?.customerUserId ?? null,
  };

  if (idx >= 0) list[idx] = merged;
  else list.push(merged);

  await setCustomizationsSnapshot(effectiveUserId, list);
  return merged;
}

export async function getSavedDesignById(
  userId: string | null | undefined,
  designId: string,
): Promise<SavedDesign | null> {
  const list = await loadDesignList(userId);
  return list.find((row) => row.id === designId) ?? null;
}

function measurementsFromDraft(draft: CustomerOrderDraft | null): SavedDesignMeasurements | undefined {
  if (!draft?.measurements) return undefined;
  return {
    basic: draft.measurements.basic || {},
    shirt: draft.measurements.shirt || {},
    trouser: draft.measurements.trouser || {},
    other: draft.measurements.other || {},
  };
}

/** After placing an order: save full design to My Designs and clear Continue your order draft. */
export async function finalizePlacedOrder(
  userId: string | null | undefined,
  tailor: SavedDesignTailor,
  orderForm: { description: string; budget: number; deliveryDays: number },
  createdOrder: Order,
): Promise<SavedDesign> {
  const draft = await getCustomerOrderDraft(userId);

  try {
    return await upsertSavedDesign(userId, {
      modelId: draft?.modelId || '',
      modelName: draft?.modelName || orderForm.description.slice(0, 60) || 'Custom design',
      dressLine: draft?.dressLine,
      selections: draft?.selections || {},
      measurements: measurementsFromDraft(draft),
      tailor,
      order: {
        orderId: createdOrder.id,
        description: orderForm.description,
        budget: orderForm.budget,
        deliveryDays: orderForm.deliveryDays,
        placedAt: new Date().toISOString(),
      },
      orderPlaced: true,
    });
  } finally {
    await clearCustomerOrderDraft(userId);
  }
}

export function humanizeSelection(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

const SELECTION_LABELS: Partial<Record<TabId, string>> = {
  neck: 'Neck',
  sleeves: 'Sleeves',
  bottom: 'Bottom',
  'frock-style': 'Style',
  colors: 'Color',
  'saree-style': 'Saree style',
  'fabric-print': 'Fabric print',
};

export function listCustomizationEntries(
  selections: Record<TabId, string | null>,
): { label: string; value: string }[] {
  const norm = normalizeSavedSelections(selections);
  return TAB_KEYS.filter((key) => Boolean(norm[key]))
    .map((key) => ({
      label: SELECTION_LABELS[key] || humanizeSelection(key),
      value: humanizeSelection(norm[key]),
    }));
}

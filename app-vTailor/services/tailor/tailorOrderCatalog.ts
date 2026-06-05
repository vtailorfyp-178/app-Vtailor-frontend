import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TabId } from '@/services/dressGlbResolver';
import { getGlobalCustomizations } from '@/services/userDataService';
import { buildBasicMeasurementValues, type MeasurementValueMap } from '@/services/measurement/measurementLabelConfig';
import type { SavedDesignMeasurements } from '@/services/savedDesign';
import { normalizeSavedSelections } from '@/services/savedDesign';

export type TailorOrderCustomization = {
  modelId: string;
  modelName: string;
  selections: Record<string, string | null>;
  designId?: string;
};

export type TailorOrderMeasurements = {
  basic: Record<string, string>;
  shirt: Record<string, string>;
  trouser: Record<string, string>;
  other?: Record<string, string>;
  updatedAt?: string;
};

export type TailorOrderRecord = {
  orderId: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  garment: string;
  status: string;
  deliveryDate: string;
  deliveryLabel: string;
  amount: number;
  hasMeasurements: boolean;
  color?: string;
  fabric?: string;
  notes?: string;
  customization?: TailorOrderCustomization;
  measurements?: TailorOrderMeasurements;
};

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
  'fabric-print': null,
};

/** Demo tailor orders — each linked to 3D design + measurements where applicable. */
export const TAILOR_SAMPLE_ORDERS: TailorOrderRecord[] = [
  {
    orderId: 'ORD001',
    customerId: '1',
    customerName: 'Ali Hassan',
    phone: '+92 300 1234567',
    email: 'ali.hassan@example.com',
    garment: 'Long Frock',
    status: 'in progress',
    deliveryDate: '2026-01-12',
    deliveryLabel: 'Jan 12 • Pickup',
    amount: 1200,
    hasMeasurements: true,
    color: 'Beige',
    fabric: 'Silk blend',
    notes: 'Flared bottom with bell sleeves for wedding event.',
    customization: {
      modelId: 'long-frock',
      modelName: 'Long Frock',
      selections: {
        ...defaultSelections,
        neck: 'v-neck',
        sleeves: 'bell',
        'frock-style': 'flared-bottom',
        colors: 'beige',
      },
    },
    measurements: {
      basic: {
        shoulder: '17',
        biceps: '13',
        arm: '33',
        thigh: '22',
        armpit: '18',
        bust: '39',
        waist: '33',
        hip: '40',
      },
      shirt: { neck: '16', length: '50', chawk: '20', gherah: '48' },
      trouser: { length: '40', phuncha: '14', inseam: '30' },
      other: {},
      updatedAt: '2026-01-02T10:00:00.000Z',
    },
  },
  {
    orderId: 'ORD002',
    customerId: '2',
    customerName: 'Zara Khan',
    phone: '+92 333 9876543',
    email: 'zara.khan@example.com',
    garment: 'Lehenga Bridal',
    status: 'pending',
    deliveryDate: '2026-01-06',
    deliveryLabel: 'Jan 06 • Home Delivery',
    amount: 9500,
    hasMeasurements: false,
    color: 'Red & Gold',
    fabric: 'Net',
    notes: 'Heavy embroidery requested — awaiting measurements.',
    customization: {
      modelId: 'lehnga-bridal',
      modelName: 'Bridal Lehenga',
      selections: {
        ...defaultSelections,
        neck: 'round',
        sleeves: 'full',
        colors: 'red',
      },
    },
  },
  {
    orderId: 'ORD003',
    customerId: '5',
    customerName: 'Usman Tariq',
    phone: '+92 321 5558899',
    email: 'usman.t@example.com',
    garment: 'Sharara',
    status: 'ready',
    deliveryDate: '2026-01-04',
    deliveryLabel: 'Jan 04 • Store Pickup',
    amount: 6500,
    hasMeasurements: true,
    color: 'Navy',
    fabric: 'Chiffon',
    customization: {
      modelId: 'shalwar-kameez-short',
      modelName: 'Sharara Set',
      selections: {
        ...defaultSelections,
        neck: 'round',
        sleeves: 'full',
        bottom: 'patiyala',
        colors: 'blue',
      },
    },
    measurements: {
      basic: {
        shoulder: '18',
        biceps: '14',
        arm: '34',
        thigh: '24',
        armpit: '19',
        bust: '41',
        waist: '35',
        hip: '42',
      },
      shirt: { neck: '16.5', length: '48', chawk: '21', gherah: '50' },
      trouser: { length: '40', phuncha: '14', inseam: '31' },
      updatedAt: '2025-12-30T14:30:00.000Z',
    },
  },
  {
    orderId: 'ORD-001',
    customerId: '3',
    customerName: 'Fatima Khan',
    phone: '+92 300 1234567',
    email: 'fatima@example.com',
    garment: 'Long Frock',
    status: 'in progress',
    deliveryDate: '2025-12-28',
    deliveryLabel: 'Dec 28 • Home Delivery',
    amount: 4200,
    hasMeasurements: true,
    color: 'Red',
    fabric: 'Silk',
    notes: 'Formal dress — priority stitching.',
    customization: {
      modelId: 'long-frock',
      modelName: 'Long Frock',
      selections: {
        ...defaultSelections,
        neck: 'round',
        sleeves: 'full',
        'frock-style': 'front-slit',
        colors: 'red',
      },
    },
    measurements: {
      basic: {
        shoulder: '14',
        biceps: '12',
        arm: '32',
        thigh: '21',
        armpit: '17',
        bust: '38',
        waist: '32',
        hip: '39',
      },
      shirt: { neck: '16', length: '28', chawk: '19', gherah: '46' },
      trouser: { length: '30', phuncha: '14', inseam: '28' },
      updatedAt: '2026-01-02T08:00:00.000Z',
    },
  },
];

export function formatSelectionLines(selections: Record<string, string | null>): string[] {
  const labels: Partial<Record<TabId, string>> = {
    neck: 'Neck',
    sleeves: 'Sleeves',
    bottom: 'Bottom',
    'frock-style': 'Style',
    colors: 'Color',
    'saree-style': 'Saree style',
    'fabric-print': 'Fabric print',
  };
  const lines: string[] = [];
  (Object.keys(labels) as TabId[]).forEach((key) => {
    const value = selections[key];
    if (value) lines.push(`${labels[key]}: ${value.replace(/-/g, ' ')}`);
  });
  return lines.length ? lines : ['Standard design'];
}

export function measurementValuesForModel(m?: TailorOrderMeasurements): MeasurementValueMap {
  if (!m?.basic) return {};
  return buildBasicMeasurementValues(m.basic);
}

export function getOrderById(orderId: string): TailorOrderRecord | undefined {
  const key = orderId.trim().toLowerCase();
  return TAILOR_SAMPLE_ORDERS.find((o) => o.orderId.toLowerCase() === key);
}

function hasMeasurementData(m?: TailorOrderMeasurements | SavedDesignMeasurements | null): boolean {
  if (!m) return false;
  return [m.basic, m.shirt, m.trouser, m.other].some(
    (group) => group && Object.values(group).some((v) => Boolean(String(v || '').trim())),
  );
}

function toTailorMeasurements(
  raw: Partial<TailorOrderMeasurements> & { updatedAt?: string },
): TailorOrderMeasurements {
  return {
    basic: raw.basic || {},
    shirt: raw.shirt || {},
    trouser: raw.trouser || {},
    other: raw.other || {},
    updatedAt: raw.updatedAt,
  };
}

function measurementsFromDesignRecord(design: Record<string, unknown>): TailorOrderMeasurements | undefined {
  const embedded = design.measurements as SavedDesignMeasurements | undefined;
  if (embedded && hasMeasurementData(embedded)) {
    return toTailorMeasurements({
      basic: embedded.basic || {},
      shirt: embedded.shirt || {},
      trouser: embedded.trouser || {},
      other: embedded.other || {},
      updatedAt: String(design.updatedAt || design.createdAt || ''),
    });
  }
  return undefined;
}

function selectionsMatch(
  a: Record<string, string | null>,
  b: Record<string, string | null | undefined>,
): boolean {
  const normA = normalizeSavedSelections(a);
  const normB = normalizeSavedSelections(b);
  return (Object.keys(normA) as TabId[]).every((k) => normA[k] === normB[k]);
}

async function loadMeasurementSnapshots(): Promise<
  Array<TailorOrderMeasurements & { modelId?: string; modelName?: string; selections?: Record<string, string | null> }>
> {
  try {
    const raw = await AsyncStorage.getItem('CUSTOMER_MEASUREMENTS');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function findMeasurementSnapshotForDesign(
  modelId: string,
  selections: Record<string, string | null>,
): Promise<TailorOrderMeasurements | undefined> {
  const snapshots = await loadMeasurementSnapshots();
  const match =
    snapshots.find((row) => row.modelId === modelId && selectionsMatch(selections, row.selections || {})) ||
    snapshots.find((row) => row.modelId === modelId) ||
    snapshots[0];
  if (!match || !hasMeasurementData(match)) return undefined;
  return toTailorMeasurements(match);
}

async function enrichOrderWithMeasurements(order: TailorOrderRecord): Promise<TailorOrderRecord> {
  if (hasMeasurementData(order.measurements)) return order;

  const modelId = order.customization?.modelId;
  const selections = order.customization?.selections;
  if (!modelId || !selections) return order;

  const snapshot = await findMeasurementSnapshotForDesign(modelId, selections);
  if (!snapshot) return order;

  return {
    ...order,
    measurements: snapshot,
    hasMeasurements: true,
  };
}

function orderFromSavedDesign(design: Record<string, unknown>): TailorOrderRecord | null {
  if (!design.modelId || !design.selections) return null;

  const createdAt = design.createdAt ? String(design.createdAt) : new Date().toISOString();
  const customerUserId = design.customerUserId ? String(design.customerUserId) : 'guest';
  const modelName = String(design.modelName || design.modelId);
  const selections = design.selections as Record<string, string | null>;
  const colorSlug = selections.colors;
  const orderInfo = design.order as { description?: string; budget?: number; orderId?: string } | undefined;
  const measurements = measurementsFromDesignRecord(design);

  return {
    orderId: orderInfo?.orderId || `DES-${String(design.id || Date.now())}`,
    customerId: customerUserId,
    customerName:
      typeof design.customerName === 'string' && design.customerName.trim()
        ? design.customerName.trim()
        : customerUserId !== 'guest'
          ? `Customer ${customerUserId.slice(0, 8)}`
          : 'Customer',
    phone: '—',
    garment: modelName,
    status: design.orderPlaced ? 'confirmed' : 'pending',
    deliveryDate: createdAt.slice(0, 10),
    deliveryLabel: new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: orderInfo?.budget ?? 0,
    hasMeasurements: Boolean(measurements),
    color: colorSlug ? colorSlug.replace(/-/g, ' ') : undefined,
    notes: orderInfo?.description,
    customization: {
      modelId: String(design.modelId),
      modelName,
      selections: { ...defaultSelections, ...selections },
      designId: String(design.id || ''),
    },
    measurements,
  };
}

async function findSavedDesignRecord(
  orderId: string,
  designId?: string,
): Promise<Record<string, unknown> | undefined> {
  const designs = await getGlobalCustomizations();
  if (designId) {
    const byDesign = designs.find((d) => String((d as Record<string, unknown>).id) === designId);
    if (byDesign) return byDesign as Record<string, unknown>;
  }

  const trimmed = orderId.trim();
  if (trimmed.toUpperCase().startsWith('DES-')) {
    const rawId = trimmed.slice(4);
    const byDes = designs.find((d) => String((d as Record<string, unknown>).id) === rawId);
    if (byDes) return byDes as Record<string, unknown>;
  }

  return designs.find((d) => {
    const row = d as Record<string, unknown>;
    const linked = row.order as { orderId?: string } | undefined;
    return linked?.orderId === trimmed || String(row.id) === trimmed;
  }) as Record<string, unknown> | undefined;
}

/** Resolve demo orders, saved customer designs (DES-*), and API order ids. */
export async function resolveTailorOrder(
  orderId: string,
  designId?: string,
  customerNameOverride?: string,
): Promise<TailorOrderRecord | undefined> {
  const sample = getOrderById(orderId);
  if (sample) {
    const enriched = await enrichOrderWithMeasurements(sample);
    const approved = await isTailorTemplateApproved(enriched.orderId);
    const withStatus = approved ? { ...enriched, status: 'in progress' } : enriched;
    if (customerNameOverride?.trim()) {
      return { ...withStatus, customerName: customerNameOverride.trim() };
    }
    return withStatus;
  }

  const design = await findSavedDesignRecord(orderId, designId);
  if (design) {
    const fromDesign = orderFromSavedDesign(design);
    if (!fromDesign) return undefined;
    const enriched = await enrichOrderWithMeasurements(fromDesign);
    const approved = await isTailorTemplateApproved(enriched.orderId);
    const withStatus = approved ? { ...enriched, status: 'in progress' } : enriched;
    if (customerNameOverride?.trim()) {
      return { ...withStatus, customerName: customerNameOverride.trim() };
    }
    return withStatus;
  }

  return undefined;
}

/** Real customer 3D designs saved on device — no demo/mock orders. */
export async function loadTailorOrdersWithDesigns(): Promise<TailorOrderRecord[]> {
  try {
    const designs = await getGlobalCustomizations();
    const orders: TailorOrderRecord[] = [];

    for (const raw of designs) {
      if (!raw || typeof raw !== 'object') continue;
      const order = orderFromSavedDesign(raw as Record<string, unknown>);
      if (order) orders.push(await enrichOrderWithMeasurements(order));
    }

    return orders.reverse();
  } catch {
    return [];
  }
}

/** Orders that include customer measurements (saved designs + demo samples). */
export async function loadTailorOrdersWithMeasurements(): Promise<TailorOrderRecord[]> {
  const sample = await enrichMeasurementsFromStorage([...TAILOR_SAMPLE_ORDERS]);
  const fromSample = sample.filter((o) => o.hasMeasurements && hasMeasurementData(o.measurements));

  const fromDesigns = (await loadTailorOrdersWithDesigns()).filter(
    (o) => o.hasMeasurements && hasMeasurementData(o.measurements),
  );

  const seen = new Set<string>();
  return [...fromDesigns, ...fromSample].filter((o) => {
    if (seen.has(o.orderId)) return false;
    seen.add(o.orderId);
    return true;
  });
}

export async function loadAllTailorOrders(): Promise<TailorOrderRecord[]> {
  const sample = await enrichMeasurementsFromStorage([...TAILOR_SAMPLE_ORDERS]);
  const designs = await loadTailorOrdersWithDesigns();
  const seen = new Set(designs.map((d) => d.orderId));
  return [...designs, ...sample.filter((o) => !seen.has(o.orderId))];
}

async function enrichMeasurementsFromStorage(orders: TailorOrderRecord[]): Promise<TailorOrderRecord[]> {
  const enriched = await Promise.all(orders.map((o) => enrichOrderWithMeasurements(o)));
  try {
    const raw = await AsyncStorage.getItem('CUSTOMER_MEASUREMENTS');
    if (!raw) return enriched;
    const list = JSON.parse(raw) as TailorOrderMeasurements[];
    if (!Array.isArray(list) || !list.length) return enriched;
    const latest = list[0];
    const firstWithMeasurements = enriched.findIndex(
      (o) => o.hasMeasurements && !hasMeasurementData(o.measurements),
    );
    if (firstWithMeasurements >= 0 && latest?.basic) {
      enriched[firstWithMeasurements] = {
        ...enriched[firstWithMeasurements],
        measurements: toTailorMeasurements(latest),
        hasMeasurements: true,
      };
    }
  } catch {
    /* ignore */
  }
  return enriched;
}

export function orderProgressStorageKey(orderId: string): string {
  return `order_progress_${orderId}`;
}

export const tailorTemplateApprovedKey = (orderId: string) => `tailor_template_approved_${orderId}`;

export async function markTailorTemplateApproved(orderId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(tailorTemplateApprovedKey(orderId), new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export async function isTailorTemplateApproved(orderId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(tailorTemplateApprovedKey(orderId));
    return Boolean(raw);
  } catch {
    return false;
  }
}

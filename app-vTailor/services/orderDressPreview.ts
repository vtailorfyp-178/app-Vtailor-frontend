/**
 * Demo orders + dress name → GLB preview mapping (valid 3D combinations only).
 */
import type { TabId } from '@/services/dressGlbResolver';

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
  'fabric-print': null,
};

function mergeSelections(
  partial: Partial<Record<TabId, string | null>>,
): Record<TabId, string | null> {
  return { ...defaultSelections, ...partial } as Record<TabId, string | null>;
}

export type DemoCustomerOrder = {
  id: number;
  name: string;
  modelId: string;
  selections: Record<TabId, string | null>;
  tailor: string;
  tailorId: string;
  tailorPhone: string;
  tailorAvatar: string;
  rating: string;
  status: string;
  date: string;
  price: number;
  sample: { neck: string; sleeves: string; style: string; color: string };
  measurements: { chest: string; waist: string; length: string; shoulder: string };
  daysLeft?: number;
};

export const DEMO_CUSTOMER_ORDERS: DemoCustomerOrder[] = [
  {
    id: 1,
    name: 'Long Frock',
    modelId: 'long-frock',
    selections: mergeSelections({
      neck: 'round',
      sleeves: 'bell',
      'frock-style': 'flared-bottom',
      colors: 'white',
    }),
    tailor: 'Ahmad Tailor',
    tailorId: 'sample-tailor-aliya-formal',
    tailorPhone: '+923215560190',
    tailorAvatar: 'AT',
    rating: '⭐ 4.8 (245 reviews)',
    status: 'In Progress',
    date: '2026-12-25',
    price: 8500,
    daysLeft: 5,
    sample: {
      neck: 'Round Neck',
      sleeves: 'Bell Sleeves',
      style: 'Flared Bottom',
      color: 'White',
    },
    measurements: { chest: '36 in', waist: '30 in', length: '52 in', shoulder: '15 in' },
  },
  {
    id: 2,
    name: 'Shalwar Kameez',
    modelId: 'shalwar-kameez-short',
    selections: mergeSelections({
      neck: 'round',
      sleeves: 'full',
      bottom: 'patiyala',
      colors: 'blue-royal',
    }),
    tailor: 'Master Tailors',
    tailorId: 'sample-tailor-fatima-traditional',
    tailorPhone: '+923129018820',
    tailorAvatar: 'MT',
    rating: '⭐ 4.6 (180 reviews)',
    status: 'Cutting',
    date: '2026-12-20',
    price: 25000,
    daysLeft: 12,
    sample: {
      neck: 'Round Neck',
      sleeves: 'Full Sleeves',
      style: 'Patiyala Shalwar',
      color: 'Royal Blue',
    },
    measurements: { chest: '38 in', waist: '32 in', length: '44 in', shoulder: '16 in' },
  },
  {
    id: 3,
    name: 'Plain Saree',
    modelId: 'saree',
    selections: mergeSelections({
      'saree-style': 'plain',
      neck: 'round',
      sleeves: 'full',
      colors: 'white',
    }),
    tailor: 'Noor Party Wear Studio',
    tailorId: 'sample-tailor-noor-party',
    tailorPhone: '+923332198744',
    tailorAvatar: 'NP',
    rating: '⭐ 4.7 (132 reviews)',
    status: 'Delivered',
    date: '2026-12-15',
    price: 3500,
    sample: {
      neck: 'Round Neck',
      sleeves: 'Full Sleeves',
      style: 'Plain Saree',
      color: 'White',
    },
    measurements: { chest: '35 in', waist: '29 in', length: '40 in', shoulder: '14.5 in' },
  },
  {
    id: 4,
    name: 'Lehenga',
    modelId: 'lehnga-bridal',
    selections: mergeSelections({
      neck: 'round',
      sleeves: 'full',
      colors: 'peach',
    }),
    tailor: 'Zainab Bridal Couture',
    tailorId: 'sample-tailor-zainab-bridal',
    tailorPhone: '+923004102231',
    tailorAvatar: 'ZB',
    rating: '⭐ 4.8 (245 reviews)',
    status: 'Delivered',
    date: '2026-12-10',
    price: 6000,
    sample: {
      neck: 'Round Neck',
      sleeves: 'Full Sleeves',
      style: 'Bridal Lehnga',
      color: 'Peach',
    },
    measurements: { chest: '37 in', waist: '31 in', length: '54 in', shoulder: '15.5 in' },
  },
];

export function dressPreviewFromOrderDescription(orderDescription: string): {
  modelId: string;
  selections: Record<TabId, string | null>;
} | null {
  const order = DEMO_CUSTOMER_ORDERS.find((o) => o.name === orderDescription.trim());
  if (!order) return null;
  return { modelId: order.modelId, selections: order.selections };
}

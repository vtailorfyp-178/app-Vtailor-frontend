export type Tailor = {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  experience: number;
  distance: string;
  specialization: string[];
  avatar: string;
  isAvailable: boolean;
};

export const ALL: Tailor[] = [
  { id: 1, name: 'Ahmad Master Tailor', rating: 4.9, reviews: 156, experience: 15, distance: '0.8 km', specialization: ['Formal', 'Wedding'], avatar: '👨‍🔧', isAvailable: true },
  { id: 2, name: 'Karachi Tailoring House', rating: 4.7, reviews: 89, experience: 10, distance: '1.2 km', specialization: ['Casual'], avatar: '🧵', isAvailable: true },
  { id: 3, name: 'Classic Stitchers', rating: 4.8, reviews: 210, experience: 20, distance: '2.5 km', specialization: ['Traditional'], avatar: '✂️', isAvailable: false },
];

export const TAILORS: Record<number, Tailor> = ALL.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {} as Record<number, Tailor>);

export const getTailorById = (id: number) => TAILORS[id] || null;

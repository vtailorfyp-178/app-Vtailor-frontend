/** Measurement label definitions — styled like tailoring reference guide. */

export type MeasurementLabelId =
  | 'shoulder-width'
  | 'bust-circumference'
  | 'waist-circumference'
  | 'hip-circumference'
  | 'biceps-circumference'
  | 'thigh-circumference'
  | 'arm-length'
  | 'leg-length'
  | 'armpit-marker';

export type MeasurementLabelSide = 'left' | 'right';

export type MeasurementLabelDef = {
  id: MeasurementLabelId;
  text: string;
  hint: string;
  color: string;
  side: MeasurementLabelSide;
  /** Normalized guide point on the mannequin in model-local space (0–1). */
  anchor: { x: number; y: number; z: number };
};

/** Maps basic form field labels to 3D model label ids. */
export const FIELD_TO_MEASUREMENT_LABEL: Record<string, MeasurementLabelId> = {
  'Shoulder Width': 'shoulder-width',
  Biceps: 'biceps-circumference',
  'Arm Length': 'arm-length',
  Thigh: 'thigh-circumference',
  Armpit: 'armpit-marker',
  'Bust / Chest': 'bust-circumference',
  Waist: 'waist-circumference',
  Hips: 'hip-circumference',
};

/** Anchors tuned to the painted guide lines on measurement-model.glb (front view). */
export const MEASUREMENT_LABELS: MeasurementLabelDef[] = [
  {
    id: 'shoulder-width',
    text: 'Shoulder Width',
    hint: '(Straight shoulders)',
    color: '#7c3aed',
    side: 'left',
    anchor: { x: 0.78, y: 0.865, z: 0.58 },
  },
  {
    id: 'biceps-circumference',
    text: 'Biceps Circ.',
    hint: '(Upper arm)',
    color: '#2563eb',
    side: 'left',
    anchor: { x: 0.86, y: 0.735, z: 0.55 },
  },
  {
    id: 'arm-length',
    text: 'Arm Length',
    hint: '(Shoulder to wrist)',
    color: '#ea580c',
    side: 'left',
    anchor: { x: 0.9, y: 0.58, z: 0.56 },
  },
  {
    id: 'thigh-circumference',
    text: 'Thigh Circ.',
    hint: '(Upper thigh)',
    color: '#2563eb',
    side: 'left',
    anchor: { x: 0.68, y: 0.4, z: 0.54 },
  },
  {
    id: 'leg-length',
    text: 'Leg Length',
    hint: '(Hip to ankle)',
    color: '#db2777',
    side: 'left',
    anchor: { x: 0.4, y: 0.36, z: 0.56 },
  },
  {
    id: 'bust-circumference',
    text: 'Bust Circ.',
    hint: '(360° around body)',
    color: '#dc2626',
    side: 'right',
    anchor: { x: 0.52, y: 0.745, z: 0.56 },
  },
  {
    id: 'waist-circumference',
    text: 'Waist Circ.',
    hint: '(360° around body)',
    color: '#ca8a04',
    side: 'right',
    anchor: { x: 0.5, y: 0.625, z: 0.56 },
  },
  {
    id: 'hip-circumference',
    text: 'Hip Circ.',
    hint: '(360° around body)',
    color: '#16a34a',
    side: 'right',
    anchor: { x: 0.5, y: 0.505, z: 0.55 },
  },
  {
    id: 'armpit-marker',
    text: 'Armpit Marker',
    hint: '(Arm-body connection)',
    color: '#16a34a',
    side: 'right',
    anchor: { x: 0.26, y: 0.805, z: 0.54 },
  },
];

export function resolveFocusedLabelId(focusedField: string | null | undefined): MeasurementLabelId | null {
  if (!focusedField) return null;
  return FIELD_TO_MEASUREMENT_LABEL[focusedField] ?? null;
}

/** Live values on 3D model — basic measurements only. */
export type MeasurementValueMap = Partial<Record<MeasurementLabelId, string>>;

export function buildBasicMeasurementValues(basic: Record<string, string>): MeasurementValueMap {
  const values: MeasurementValueMap = {};
  const put = (id: MeasurementLabelId, raw?: string) => {
    const trimmed = raw?.trim();
    if (trimmed) values[id] = trimmed;
  };

  put('shoulder-width', basic.shoulder);
  put('biceps-circumference', basic.biceps);
  put('arm-length', basic.arm);
  put('thigh-circumference', basic.thigh);
  put('armpit-marker', basic.armpit);
  put('bust-circumference', basic.bust);
  put('waist-circumference', basic.waist);
  put('hip-circumference', basic.hip);

  return values;
}

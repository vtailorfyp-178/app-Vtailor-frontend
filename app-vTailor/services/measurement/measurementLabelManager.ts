import type { MeasurementLabelDef, MeasurementLabelId } from '@/services/measurement/measurementLabelConfig';
import { MEASUREMENT_LABELS } from '@/services/measurement/measurementLabelConfig';

export type MeasurementLabelObject = {
  id: MeasurementLabelId;
  text: string;
  worldPosition: { x: number; y: number; z: number };
};

/**
 * Resolves label anchor positions from a model axis-aligned bounding box.
 * Used by the WebView viewer after GLB load and for future native sprite labels.
 */
export function resolveLabelWorldPositions(
  box: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  labels: MeasurementLabelDef[] = MEASUREMENT_LABELS,
): MeasurementLabelObject[] {
  const size = {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };

  return labels.map((def) => {
    const ax = box.min.x + size.x * def.anchor.x;
    const ay = box.min.y + size.y * def.anchor.y;
    const az = box.min.z + size.z * def.anchor.z;
    return {
      id: def.id,
      text: def.text,
      worldPosition: { x: ax, y: ay, z: az },
    };
  });
}

export function labelsForViewer(focusedId?: MeasurementLabelId | null): MeasurementLabelDef[] {
  return MEASUREMENT_LABELS;
}

export { MEASUREMENT_LABELS };

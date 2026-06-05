import type { TabId } from '@/services/dressGlbResolver';
import { upsertSavedDesign } from '@/services/savedDesign';

/**
 * Appends or updates a dress design in My Designs unless only duplicating without new data.
 */
export async function persistNewCustomization(
  userId: string | null | undefined,
  modelId: string,
  modelName: string,
  selections: Record<TabId, string | null>,
  extra?: { dressLine?: string },
): Promise<void> {
  try {
    await upsertSavedDesign(userId, {
      modelId,
      modelName,
      dressLine: extra?.dressLine,
      selections,
    });
  } catch {
    // ignore storage errors
  }
}

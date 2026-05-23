import type { GlbModelPath } from './glbModelUrl';
import { toOptimizedRelativePath } from './catalogPathAliases';
import { grarahPathForTexturedDisplay } from './grarahDisplayPath';

/**
 * Path used for Cloudinary / MongoDB catalog lookup.
 * Long frock: `…/optimized/optimized-*.glb` (exact upload names).
 * Grarah: `optimized/optimized-*.glb` (textured); legacy mobile paths remap here.
 */
export function pathForCloudinaryLookup(relativePath: GlbModelPath): GlbModelPath {
  const norm = relativePath.replace(/\\/g, '/').trim();
  if (norm.toLowerCase().includes('grarah/')) {
    return grarahPathForTexturedDisplay(norm);
  }
  if (norm.includes('/optimized/') || /\/optimized-[^/]+\.glb$/i.test(norm)) return norm;
  const optimized = toOptimizedRelativePath(norm);
  return optimized ?? norm;
}

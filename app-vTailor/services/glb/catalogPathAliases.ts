/** Helpers: resolver uses `mobile/foo bar.glb`, uploads often use `optimized/optimized-foo-bar.glb`. */

export function normalizeBasenameSlug(relativePath: string): string {
  const file = relativePath.split('/').pop() || '';
  return file
    .replace(/\.glb$/i, '')
    .replace(/^optimized-/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

/** `3d model/3d long frock/mobile/white round neck full sleeves flarred.glb` → optimized path. */
export function toOptimizedRelativePath(relativePath: string): string | null {
  const parts = relativePath.replace(/\\/g, '/').replace(/^\/+/, '').split('/');
  const file = parts.pop();
  if (!file?.toLowerCase().endsWith('.glb')) return null;
  if (parts[parts.length - 1]?.toLowerCase() === 'mobile') parts.pop();
  const stem = file.replace(/\.glb$/i, '').trim();
  if (/^optimized-/i.test(stem)) {
    return [...parts, 'optimized', file].join('/');
  }
  const kebab = stem.split(/\s+/).filter(Boolean).join('-');
  return [...parts, 'optimized', `optimized-${kebab}.glb`].join('/');
}

/** Inverse: optimized kebab filename → spaced mobile filename. */
export function optimizedPathToMobileAlias(optimizedRelativePath: string): string | null {
  const norm = optimizedRelativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const match = norm.match(/^(.+)\/optimized\/optimized-(.+)\.glb$/i);
  if (!match) return null;
  const [, folder, kebab] = match;
  const spaced = `${kebab.replace(/-/g, ' ')}.glb`;
  return `${folder}/mobile/${spaced}`;
}

/** Web resolver paths without `/mobile/`. */
export function optimizedPathToRootAlias(optimizedRelativePath: string): string | null {
  const mobile = optimizedPathToMobileAlias(optimizedRelativePath);
  if (!mobile) return null;
  return mobile.replace(/\/mobile\//i, '/');
}

/** Grarah shirt: `shirt/optimized-*-shirt.glb` ↔ `shirt/mobile/optimized-*-shirt.glb`. */
function grarahShirtOptimizedAliases(relativePath: string): string[] {
  const norm = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const m = norm.match(
    /^(3d model\/3d grarah\/shirt)\/(?:mobile\/)?(optimized-.+-shirt\.glb)$/i,
  );
  if (!m) return [];
  const [, folder, file] = m;
  return [`${folder}/${file}`, `${folder}/mobile/${file}`];
}

export function expandCatalogAliases(relativePath: string, url: string): string[] {
  const extra: string[] = [];
  const mobileFromOpt = optimizedPathToMobileAlias(relativePath);
  if (mobileFromOpt) extra.push(mobileFromOpt);
  const rootFromOpt = optimizedPathToRootAlias(relativePath);
  if (rootFromOpt) extra.push(rootFromOpt);
  const optimized = toOptimizedRelativePath(relativePath);
  if (optimized && optimized !== relativePath) extra.push(optimized);
  for (const alias of grarahShirtOptimizedAliases(relativePath)) {
    extra.push(alias);
  }
  void url;
  return extra;
}

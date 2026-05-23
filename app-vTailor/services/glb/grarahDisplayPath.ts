import type { GlbModelPath } from './glbModelUrl';



/**

 * Grarah `mobile/*` Tripo GLBs have no embedded textures (blank in viewer).

 * Map legacy mobile / bare paths → `optimized/optimized-*.glb` (textured, &lt;10MB).

 */

export function grarahPathForTexturedDisplay(relativePath: GlbModelPath): GlbModelPath {

  const norm = relativePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();

  if (!norm.toLowerCase().includes('grarah/')) return norm;



  if (norm.includes('/optimized/optimized-')) return norm;



  const shirtMobile = norm.match(

    /^3d model\/3d grarah\/shirt\/mobile\/(.+)-shirt\.glb$/i,

  );

  if (shirtMobile) {

    return `3d model/3d grarah/shirt/optimized/optimized-${shirtMobile[1]}-shirt.glb`;

  }



  const peplumMobile = norm.match(

    /^3d model\/3d grarah\/peplum\/mobile\/(.+)-peplum\.glb$/i,

  );

  if (peplumMobile) {

    return `3d model/3d grarah/peplum/optimized/optimized-${peplumMobile[1]}-peplum.glb`;

  }



  const shirtBare = norm.match(/^3d model\/3d grarah\/shirt\/(.+)-shirt\.glb$/i);

  if (shirtBare && !shirtBare[1].startsWith('optimized-')) {

    return `3d model/3d grarah/shirt/optimized/optimized-${shirtBare[1]}-shirt.glb`;

  }



  const peplumBare = norm.match(/^3d model\/3d grarah\/peplum\/(.+)-peplum\.glb$/i);

  if (peplumBare && !peplumBare[1].startsWith('optimized-')) {

    return `3d model/3d grarah/peplum/optimized/optimized-${peplumBare[1]}-peplum.glb`;

  }



  return norm;

}



import * as THREE from 'three';
import {
  CASUAL_FABRIC_METALNESS,
  CASUAL_FABRIC_ROUGHNESS,
} from '@/services/glb/casualFabricMaterial';
import {
  fabricPrintTextureCandidates,
  loadFabricPrintTexture,
  textureHasImage,
} from '@/services/glb/fabricTextureCache';
import { parseFabricPrintSelection } from '@/services/glb/fabricPrintSelection';
import { isFabricDressMesh, isPatiyalaTintMesh, toDisplayStandardMaterial } from '@/services/glb/gltfSceneDisplay';

const LOG = '[fabricTextureApply]';

export type FabricTextureApplyResult = {
  applied: number;
  failed: boolean;
  textureUrl: string | null;
};

function isDressMesh(name: string, tintAllDressMeshes: boolean): boolean {
  return tintAllDressMeshes ? isPatiyalaTintMesh(name) : isFabricDressMesh(name);
}

/**
 * Apply uploaded print to all dress fabric meshes — simple map assign, preserve material on failure.
 */
export async function applyFabricPrintToScene(
  model: THREE.Object3D,
  fabricPrintRaw: string | null | undefined,
  options?: { tintAllDressMeshes?: boolean },
): Promise<FabricTextureApplyResult> {
  const tintAll = options?.tintAllDressMeshes ?? false;
  const candidates = fabricPrintTextureCandidates(fabricPrintRaw);
  const parsed = parseFabricPrintSelection(fabricPrintRaw);

  if (!candidates.length) {
    console.log(`${LOG} no fabric print URL`);
    return { applied: 0, failed: false, textureUrl: null };
  }

  console.log(`${LOG} uploaded image URL`, parsed?.sourceUrl?.slice(0, 160));
  console.log(`${LOG} Cloudinary / tile URL`, parsed?.tileUrl?.slice(0, 160));
  console.log(`${LOG} applying print`, { candidates: candidates.map((u) => u.slice(0, 100)) });

  const texture = await loadFabricPrintTexture(fabricPrintRaw);
  if (!texture || !textureHasImage(texture)) {
    console.error(`${LOG} texture load failed — keeping existing materials (no white blank)`);
    return { applied: 0, failed: true, textureUrl: null };
  }

  let applied = 0;
  model.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (!isDressMesh(obj.name, tintAll)) return;

    const sources = Array.isArray(obj.material) ? obj.material : [obj.material];
    const nextMats: THREE.MeshStandardMaterial[] = [];

    for (const source of sources) {
      const mat =
        source instanceof THREE.MeshStandardMaterial
          ? source
          : toDisplayStandardMaterial(source);

      mat.map = texture;
      mat.color.set('#ffffff');
      mat.metalness = CASUAL_FABRIC_METALNESS;
      mat.roughness = CASUAL_FABRIC_ROUGHNESS;
      mat.metalnessMap = null;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      mat.transparent = false;
      mat.opacity = 1;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;

      console.log(`${LOG} material.map assigned`, {
        mesh: obj.name,
        hasMap: Boolean(mat.map),
        hasImage: textureHasImage(mat.map),
        mapNull: mat.map == null,
        textureImageNull: texture.image == null,
      });

      nextMats.push(mat);
      applied += 1;
    }

    obj.material = nextMats.length === 1 ? nextMats[0]! : nextMats;
  });

  console.log(`${LOG} done`, { applied, textureUrl: candidates[0]?.slice(0, 100) });
  return { applied, failed: applied === 0, textureUrl: candidates[0] ?? null };
}

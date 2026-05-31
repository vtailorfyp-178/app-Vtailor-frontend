import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { DressSelections } from '@/services/dressGlbResolver';
import { isGlbLoadSupersededError } from '@/services/glb/glbFetchErrors';
import {
  peekDressGlbUrlCached,
  resolveDressGlbUrlCached,
} from '@/services/glb/glbUrlResolve';
import { prefetchGlbBuffer, prefetchGltfScene } from '@/services/glb/loadGltfFromUrl';
import { setActiveGlbLoadUrl } from '@/services/glb/glbModelCache';
import type { GlbModelPath } from '@/services/glb/glbModelUrl';

export type BundledDressGlbState = {
  url: string | null;
  path: GlbModelPath | null;
  loading: boolean;
  error: string | null;
  /** selectionKey this url was resolved for — do not render 3D until it matches current picks */
  resolvedKey: string | null;
};

const IDLE: BundledDressGlbState = {
  url: null,
  path: null,
  loading: false,
  error: null,
  resolvedKey: null,
};

const RESOLVE_DEBOUNCE_MS = 0;

export function useBundledDressGlb(
  selections: DressSelections,
  modelId: string,
  enabled = true,
): BundledDressGlbState {
  const [state, setState] = useState<BundledDressGlbState>(IDLE);
  const selectionKey = JSON.stringify(selections);
  const resolveGenRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const gen = (resolveGenRef.current += 1);

    if (!modelId || !enabled) {
      setState(IDLE);
      setActiveGlbLoadUrl(null);
      return () => {
        cancelled = true;
      };
    }

    const applyHit = (hit: Awaited<ReturnType<typeof resolveDressGlbUrlCached>>) => {
      if (cancelled || gen !== resolveGenRef.current) return;
      if (!hit) {
        const straightOnly =
          modelId === 'shalwar-kameez-short' && selections.bottom === 'straight';
        const trouserShirtVariation =
          modelId === 'trouser-shirt-bell-bottom' || modelId === 'trouser-shirt-tulip-trouser';
        setState({
          url: null,
          path: null,
          loading: false,
          error: straightOnly
            ? '3D preview is available for Patiyala shalwar only.'
            : trouserShirtVariation
              ? 'Trouser shirt 3D is loading from Cloudinary. If this persists, models may not be uploaded yet.'
              : 'No 3D model for this combination. Pick neck, sleeves, and color (red, blue, white, or black for long frock).',
          resolvedKey: selectionKey,
        });
        setActiveGlbLoadUrl(null);
        return;
      }
      setActiveGlbLoadUrl(hit.url);
      if (Platform.OS === 'web') {
        prefetchGlbBuffer(hit.url);
        prefetchGltfScene(hit.url);
      }
      setState({
        url: hit.url,
        path: hit.path,
        loading: false,
        error: null,
        resolvedKey: selectionKey,
      });
    };

    const applyError = (err: unknown) => {
      if (cancelled || gen !== resolveGenRef.current) return;
      if (isGlbLoadSupersededError(err)) return;
      setActiveGlbLoadUrl(null);
      setState({
        url: null,
        path: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Could not resolve 3D model.',
        resolvedKey: selectionKey,
      });
    };

    const cached = peekDressGlbUrlCached(selections, modelId);
    if (cached !== undefined) {
      if (cached?.url && Platform.OS === 'web') {
        prefetchGlbBuffer(cached.url);
        prefetchGltfScene(cached.url);
      }
      applyHit(cached);
      return () => {
        cancelled = true;
      };
    }

    setState((prev) => {
      if (prev.resolvedKey === selectionKey && prev.url) {
        return { ...prev, loading: false, error: null };
      }
      return {
        url: prev.url,
        path: prev.path,
        loading: true,
        error: null,
        resolvedKey: prev.resolvedKey,
      };
    });

    const runResolve = () => {
      resolveDressGlbUrlCached(selections, modelId).then(applyHit).catch(applyError);
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (RESOLVE_DEBOUNCE_MS > 0) {
      timer = setTimeout(runResolve, RESOLVE_DEBOUNCE_MS);
    } else {
      runResolve();
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [modelId, selectionKey, enabled]);

  return state;
}

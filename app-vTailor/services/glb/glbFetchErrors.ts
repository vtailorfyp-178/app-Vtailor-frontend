/** Thrown when a newer GLB selection replaces an in-flight download (not a user-facing error). */
export class GlbLoadSupersededError extends Error {
  constructor() {
    super('GLB load superseded');
    this.name = 'GlbLoadSupersededError';
  }
}

export function isGlbLoadSupersededError(err: unknown): boolean {
  return err instanceof GlbLoadSupersededError;
}

export function isAbortLikeError(err: unknown): boolean {
  if (isGlbLoadSupersededError(err)) return true;
  if (err instanceof Error) {
    if (err.name === 'AbortError') return true;
    if (/aborted|operation was aborted|cancelled|canceled/i.test(err.message)) return true;
  }
  return false;
}

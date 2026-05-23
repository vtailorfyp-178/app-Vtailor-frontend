/** One GLB parse at a time on native — avoids overlapping peaks that crash the app. */
let chain: Promise<void> = Promise.resolve();

export function runExclusiveGlbTask<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

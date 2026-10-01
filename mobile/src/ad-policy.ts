export type AdState = { completedSets: number; lastShownAt: number };
export type AdDependencies = {
  access: () => Promise<'free' | 'paid' | 'unknown'>;
  consent: () => Promise<boolean>;
  prepare: () => Promise<void>;
  show: () => Promise<void>;
  isCurrent: () => boolean;
};

// Unknown billing state skips ads. Recheck after loading to catch a purchase
// or account/navigation change while the request was in flight.
export async function showAtPracticeBreak(state: AdState, deps: AdDependencies, now = Date.now()): Promise<boolean> {
  if (state.completedSets < 2 || state.completedSets % 2 !== 0 || now - state.lastShownAt < 10 * 60_000) return false;
  try {
    if (!deps.isCurrent() || await deps.access() !== 'free') return false;
    if (!await deps.consent() || !deps.isCurrent()) return false;
    await deps.prepare();
    if (await deps.access() !== 'free' || !deps.isCurrent()) return false;
    await deps.show();
    return true;
  } catch {
    // Ads never turn a finished practice set into an error.
    return false;
  }
}

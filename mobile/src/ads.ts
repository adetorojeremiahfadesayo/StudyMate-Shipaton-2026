import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import { api, setupBilling, supabase } from './lib';
import { showAtPracticeBreak, type AdState } from './ad-policy';

export const adsEnabled = Capacitor.isNativePlatform() && import.meta.env.VITE_ADS_ENABLED === 'true';
const testAdId = 'ca-app-pub-3940256099942544/1033173712';
let initialized = false;
let inFlight = false;

async function consent() {
  if (!initialized) { await AdMob.initialize(); initialized = true; }
  let info = await AdMob.requestConsentInfo();
  if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm();
  return info.canRequestAds;
}

export async function showAdPrivacyOptions(): Promise<void> {
  if (!adsEnabled) return;
  await consent();
  await AdMob.showPrivacyOptionsForm();
}

export async function maybeShowPracticeAd(userId: string, isAtBreak: () => boolean): Promise<void> {
  if (!adsEnabled || inFlight) return;
  inFlight = true;
  try {
    const key = `studymate:ads:${userId}`;
    let previous: AdState = { completedSets: 0, lastShownAt: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null') as AdState | null;
      if (saved && Number.isSafeInteger(saved.completedSets) && saved.completedSets >= 0 && Number.isFinite(saved.lastShownAt)) previous = saved;
    } catch { /* A corrupt preference never blocks study. */ }
    const state = { ...previous, completedSets: previous.completedSets + 1 };
    localStorage.setItem(key, JSON.stringify(state));
    const shown = await showAtPracticeBreak(state, {
      access: async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.id !== userId) return 'unknown';
        await setupBilling(userId);
        const result = await api<{ access: 'free' | 'paid' | 'unknown' }>('/api/billing/access', {});
        return result.access;
      },
      consent,
      // Test ads only. Production publisher IDs are a separate release setup.
      prepare: async () => { await AdMob.prepareInterstitial({ adId: testAdId, isTesting: true }); },
      show: () => AdMob.showInterstitial({ adId: testAdId }),
      isCurrent: isAtBreak,
    });
    if (shown) localStorage.setItem(key, JSON.stringify({ ...state, lastShownAt: Date.now() }));
  } catch { /* Missing billing/consent/network configuration skips the ad. */ }
  finally { inFlight = false; }
}

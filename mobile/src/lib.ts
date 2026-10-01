import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const configured = Boolean(supabaseUrl && supabaseAnonKey && import.meta.env.VITE_API_BASE_URL);
export const supabase = createClient(supabaseUrl || 'https://missing.invalid', supabaseAnonKey || 'missing', {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export async function api<T>(path: string, body: object | FormData, requestKey = crypto.randomUUID()): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in again.');
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      'Idempotency-Key': requestKey,
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload as T;
}

export async function shareRevisionPdf(courseId: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in again.');
  const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '')}/api/report/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || `Report failed (${response.status}).`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error('The report was empty.');
  const fileName = `studymate-revision-${Date.now()}.pdf`;
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a'); link.href = url; link.download = fileName; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const saved = await Filesystem.writeFile({ path: fileName, data: btoa(binary), directory: Directory.Cache });
  await Share.share({ title: 'StudyMate revision PDF', url: saved.uri, dialogTitle: 'Share revision PDF' });
}

let billingUser: string | null = null;
export async function setupBilling(userId: string) {
  const key = import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY as string | undefined;
  if (!Capacitor.isNativePlatform()) throw new Error('Purchases require the Android app.');
  if (!key) throw new Error('RevenueCat public SDK key is missing.');
  if (billingUser === userId) return;
  if (billingUser) await Purchases.logIn({ appUserID: userId });
  else await Purchases.configure({ apiKey: key, appUserID: userId });
  billingUser = userId;
}

export async function getPackage(userId: string) {
  await setupBilling(userId);
  const offerings = await Purchases.getOfferings();
  const available = offerings.current?.availablePackages;
  if (!available?.length) throw new Error('No subscription package is configured in RevenueCat.');
  const monthly = available.find(p => p.identifier === '$rc_monthly');
  if (!monthly) throw new Error('The monthly subscription is unavailable.');
  return monthly;
}

export async function getTopUp(userId: string) {
  await setupBilling(userId);
  const offerings = await Purchases.getOfferings();
  const pack = offerings.all.session_topups?.availablePackages.find(p => p.product.identifier === 'studymate_sessions_10_test_v1');
  if (!pack) throw new Error('The ten-session top-up is unavailable.');
  return pack;
}
export async function purchaseTopUp(userId: string) {
  const pack = await getTopUp(userId);
  await Purchases.purchasePackage({ aPackage: pack });
  // The SDK result cannot grant credits. The authenticated webhook updates the server ledger.
}

export async function purchase(userId: string) {
  const selected = await getPackage(userId);
  const result = await Purchases.purchasePackage({ aPackage: selected });
  return Boolean(result.customerInfo.entitlements.active.studymate_pro);
}

export async function restore(userId: string) {
  await setupBilling(userId);
  const result = await Purchases.restorePurchases();
  return Boolean(result.customerInfo.entitlements.active.studymate_pro);
}

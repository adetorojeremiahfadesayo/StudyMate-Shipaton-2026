import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRevenueCatAccess, hasRevenueCatPro } from '@/lib/revenuecat-access';

const originalKey = process.env.REVENUECAT_SECRET_API_KEY;
afterEach(() => {
  if (originalKey === undefined) delete process.env.REVENUECAT_SECRET_API_KEY;
  else process.env.REVENUECAT_SECRET_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

describe('RevenueCat server entitlement', () => {
  it('denies access when the secret is missing', async () => {
    delete process.env.REVENUECAT_SECRET_API_KEY;
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect(await hasRevenueCatPro('student')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts an active entitlement and denies an expired one', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ subscriber: { entitlements: { studymate_pro: { expires_date: '2099-01-01T00:00:00Z' } } } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscriber: { entitlements: { studymate_pro: { expires_date: '2000-01-01T00:00:00Z' } } } }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await hasRevenueCatPro('student')).toBe(true);
    expect(await hasRevenueCatPro('student')).toBe(false);
  });

  it('denies provider failure', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await hasRevenueCatPro('student')).toBe(false);
    expect(await getRevenueCatAccess('student')).toBe('unknown');
  });

  it('distinguishes confirmed free users from incomplete provider responses', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscriber: { entitlements: {} } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }));
    expect(await getRevenueCatAccess('student')).toBe('free');
    expect(await getRevenueCatAccess('student')).toBe('unknown');
  });

  it('keeps verified school access ad-free', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subscriber: { entitlements: { studymate_school: { expires_date: null } } } }) }));
    expect(await getRevenueCatAccess('student')).toBe('paid');
  });
});

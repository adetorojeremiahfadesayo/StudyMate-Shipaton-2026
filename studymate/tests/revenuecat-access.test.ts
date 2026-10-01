import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRevenueCatAccess, hasRevenueCatPro } from '@/lib/revenuecat-access';

const originalKey = process.env.REVENUECAT_SECRET_API_KEY;
const originalSandboxUsers = process.env.REVENUECAT_SANDBOX_USER_IDS;
afterEach(() => {
  if (originalKey === undefined) delete process.env.REVENUECAT_SECRET_API_KEY;
  else process.env.REVENUECAT_SECRET_API_KEY = originalKey;
  if (originalSandboxUsers === undefined) delete process.env.REVENUECAT_SANDBOX_USER_IDS;
  else process.env.REVENUECAT_SANDBOX_USER_IDS = originalSandboxUsers;
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
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ subscriber: { entitlements: { studymate_pro: { expires_date: '2099-01-01T00:00:00Z', product_identifier: 'monthly' } }, subscriptions: { monthly: { is_sandbox: false } } } }) })
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subscriber: { entitlements: { studymate_school: { expires_date: null, product_identifier: 'school' } }, subscriptions: { school: { is_sandbox: false } } } }) }));
    expect(await getRevenueCatAccess('student')).toBe('paid');
  });

  it('restricts sandbox access to the server test-account allowlist', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    process.env.REVENUECAT_SANDBOX_USER_IDS = ' judge,other-tester ';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subscriber: {
      entitlements: { studymate_pro: { expires_date: '2099-01-01T00:00:00Z', product_identifier: 'monthly' } },
      subscriptions: { monthly: { is_sandbox: true } },
    } }) }));
    expect(await getRevenueCatAccess('student')).toBe('free');
    expect(await getRevenueCatAccess('judge')).toBe('paid');
    delete process.env.REVENUECAT_SANDBOX_USER_IDS;
    expect(await hasRevenueCatPro('judge')).toBe(false);
  });

  it('withholds unverifiable access and denies refunded subscriptions', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    const entitlements = { studymate_pro: { expires_date: null, product_identifier: 'monthly' } };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscriber: { entitlements } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscriber: { entitlements, subscriptions: { monthly: { is_sandbox: false, refunded_at: '2026-01-01T00:00:00Z' } } } }) }));
    expect(await getRevenueCatAccess('student')).toBe('unknown');
    expect(await getRevenueCatAccess('student')).toBe('free');
  });

  it('retains verified access during the provider grace period', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subscriber: {
      entitlements: { studymate_pro: { expires_date: '2000-01-01T00:00:00Z', grace_period_expires_date: '2099-01-01T00:00:00Z', product_identifier: 'monthly' } },
      subscriptions: { monthly: { is_sandbox: false } },
    } }) }));
    expect(await getRevenueCatAccess('student')).toBe('paid');
  });
});

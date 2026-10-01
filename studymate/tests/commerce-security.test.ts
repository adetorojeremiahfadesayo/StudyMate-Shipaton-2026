import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), auth: vi.fn(), operation: vi.fn(), plan: vi.fn() }));
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock('@/lib/route-helpers', () => ({ getAuthenticatedRouteSupabase: mocks.auth, unauthorizedResponse: () => Response.json({ error: 'Unauthorized' }, { status: 401 }) }));
vi.mock('@/lib/study-usage', async importOriginal => ({ ...await importOriginal<object>(), rpc: mocks.rpc, operationSession: mocks.operation, getStudyPlan: mocks.plan }));
import { authorizedWebhook, creditEvent, processCreditWebhook } from '@/lib/credit-webhook';
import { canonicalInput, withStudyQuota } from '@/lib/metered-route';
import { NextRequest } from 'next/server';
const uid = 'b828c874-2c8f-4cbb-bb4f-bb7052d0717d';
const event = { id: 'event1', app_id: 'approved', type: 'NON_RENEWING_PURCHASE', app_user_id: uid, product_id: 'studymate_sessions_10_test_v1', transaction_id: 'tx1', store: 'TEST_STORE', environment: 'SANDBOX' };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('REVENUECAT_ALLOWED_APP_IDS', 'approved'); vi.stubEnv('REVENUECAT_SANDBOX_USER_IDS', uid); vi.stubEnv('STUDYMATE_METERING_ENABLED', 'true'); });
afterEach(() => vi.unstubAllEnvs());
describe('credit purchase boundary', () => {
  it('requires the exact configured Authorization value', () => { expect(authorizedWebhook(null, 'secret')).toBe(false); expect(authorizedWebhook('secret2','secret')).toBe(false); expect(authorizedWebhook('secret','secret')).toBe(true); expect(authorizedWebhook('secret',undefined)).toBe(false); });
  it('ignores subscription and dashboard test events', () => { expect(creditEvent({ ...event, product_id: 'pro' })).toBeNull(); expect(creditEvent({ ...event, type: 'TEST' })).toBeNull(); });
  it('acknowledges the dashboard payload with null fields without granting credits', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ upsert });
    const result = await processCreditWebhook({ ...event, type: 'TEST', product_id: 'test_product', transaction_id: null, cancel_reason: null, quantity: null });
    expect(result).toEqual({ accepted: true, creditsChanged: false });
    expect(upsert).toHaveBeenCalledWith({ id: 'event1', type: 'TEST' }, { onConflict: 'id', ignoreDuplicates: true });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(() => creditEvent({ ...event, transaction_id: null })).toThrow();
  });
  it('permits sandbox credits only for allowlisted identities', () => { expect(creditEvent(event)?.units).toBe(10); expect(creditEvent({ ...event, app_user_id: '95c63a0c-7d66-430a-a958-5ed5dbe09b50' })).toBeNull(); });
  it('rejects unknown apps, anonymous users and production Test Store', () => { expect(() => creditEvent({ ...event, app_id: 'other' })).toThrow(); expect(() => creditEvent({ ...event, app_user_id: '$RCAnonymousID:test' })).toThrow(); expect(() => creditEvent({ ...event, environment: 'PRODUCTION' })).toThrow(); });
  it('reverses refunds and ignores ordinary subscription cancellations', () => { expect(creditEvent({ ...event, type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' })?.refund).toBe(true); expect(creditEvent({ ...event, type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' })).toBeNull(); });
  it('passes the transaction identity and quantity to an atomic ledger RPC', async () => { mocks.rpc.mockResolvedValue(false); await processCreditWebhook({ ...event, quantity: 2 }); expect(mocks.rpc).toHaveBeenCalledWith('study_credit_event', expect.objectContaining({ p_event: 'event1', p_transaction: 'TEST_STORE:SANDBOX:tx1', p_units: 20, p_user: uid })); });
});
describe('metered generation', () => {
  const request = (body: unknown) => new NextRequest('https://example.com/api/test', { method: 'POST', body: JSON.stringify(body) });
  beforeEach(() => { mocks.auth.mockResolvedValue({ user: { id: uid } }); mocks.operation.mockResolvedValue({ id: uid, source: 'included' }); mocks.plan.mockResolvedValue({ tier: 'free' }); });
  it('includes nested answers in the idempotency hash', () => { expect(canonicalInput({ answers: [{ answer: 'A' }] })).not.toEqual(canonicalInput({ answers: [{ answer: 'B' }] })); expect(canonicalInput({ b: 2, a: 1 })).toBe(canonicalInput({ a: 1, b: 2 })); });
  it('does not generate or reserve on an unauthenticated request', async () => { mocks.auth.mockResolvedValue(null); const handler = vi.fn(); expect((await withStudyQuota(handler, 'quiz')(request({ courseId: uid }))).status).toBe(401); expect(mocks.operation).not.toHaveBeenCalled(); expect(handler).not.toHaveBeenCalled(); });
  it('reuses saved work without an AI call or another finish', async () => { mocks.rpc.mockResolvedValue({ cached: true, result: { saved: true } }); const handler = vi.fn(); const response = await withStudyQuota(handler, 'quiz')(request({ courseId: uid })); expect(await response.json()).toEqual({ saved: true }); expect(handler).not.toHaveBeenCalled(); expect(mocks.rpc).toHaveBeenCalledTimes(1); });
  it('releases a failed first generation through the atomic RPC', async () => { mocks.rpc.mockResolvedValueOnce({ cached: false, token: uid }).mockResolvedValue(true); const response = await withStudyQuota(async () => Response.json({ error: 'AI failed' }, { status: 503 }), 'preparation')(request({ courseId: uid })); expect(response.status).toBe(503); expect(mocks.rpc).toHaveBeenLastCalledWith('study_finish_operation', expect.objectContaining({ p_success: false, p_token: uid })); });
  it('denies five free questions before calling AI', async () => { mocks.rpc.mockResolvedValueOnce({ token: uid }).mockResolvedValue(true); const handler = vi.fn(); expect((await withStudyQuota(handler, 'quiz')(request({ courseId: uid, questionCount: 5 }))).status).toBe(403); expect(handler).not.toHaveBeenCalled(); });
  it('omits answer keys and marks results as saved only after completion', async () => { mocks.rpc.mockResolvedValueOnce({ token: uid }).mockResolvedValue(true); const response = await withStudyQuota(async () => Response.json({ questions: [{ id: uid, type: 'mcq', question: 'Q', correct_answer: 'B', explanation: 'secret', options: [{ label: 'A', text: 'a', isCorrect: false }] }] }), 'quiz')(request({ courseId: uid, questionCount: 3 })); const body = await response.json(); expect(body.questions[0]).not.toHaveProperty('correct_answer'); expect(body.questions[0].options[0]).not.toHaveProperty('isCorrect'); expect(mocks.rpc).toHaveBeenLastCalledWith('study_finish_operation', expect.objectContaining({ p_success: true })); });
});

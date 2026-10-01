import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { rpc, checked, StudyError } from '@/lib/study-usage';
import { supabaseAdmin } from '@/lib/supabase-admin';
export function authorizedWebhook(header: string | null, secret = process.env.REVENUECAT_WEBHOOK_AUTH) {
  if (!header || !secret) return false;
  const a = Buffer.from(header), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
// RevenueCat sends null for fields that do not apply, including TEST transactions.
const eventSchema = z.object({ id: z.string().min(1).max(200), type: z.string().max(60), app_user_id: z.string().max(200).nullish(), app_id: z.string().max(200).nullish(), environment: z.enum(['SANDBOX','PRODUCTION']).nullish(), store: z.string().max(100).nullish(), product_id: z.string().max(200).nullish(), transaction_id: z.string().min(1).max(300).nullish(), cancel_reason: z.string().max(100).nullish(), quantity: z.number().int().min(1).max(100).nullish() });
export function creditEvent(input: unknown) {
  const e = eventSchema.parse(input);
  const products = new Set((process.env.REVENUECAT_CREDIT_PRODUCT_IDS || 'studymate_sessions_10_test_v1').split(',').map(s => s.trim()));
  if (!e.product_id || !products.has(e.product_id)) return null;
  if (!e.app_user_id || !z.uuid().safeParse(e.app_user_id).success || !e.transaction_id || !e.environment || !e.store || !e.app_id) throw new StudyError('Credit purchase identity or environment is incomplete.', 400);
  const apps = (process.env.REVENUECAT_ALLOWED_APP_IDS || '').split(',').filter(Boolean);
  if (!apps.includes(e.app_id)) throw new StudyError('Unapproved billing app.', 403);
  if (e.environment === 'SANDBOX' && !(process.env.REVENUECAT_SANDBOX_USER_IDS || '').split(',').includes(e.app_user_id)) return null;
  if (e.store === 'TEST_STORE' && e.environment !== 'SANDBOX') throw new StudyError('Test Store cannot grant production credits.', 403);
  if (e.type !== 'NON_RENEWING_PURCHASE' && !(e.type === 'CANCELLATION' && ['CUSTOMER_SUPPORT','DEVELOPER_INITIATED'].includes(e.cancel_reason || ''))) return null;
  return { eventId: e.id, type: e.type, userId: e.app_user_id, transaction: `${e.store}:${e.environment}:${e.transaction_id}`, product: e.product_id, units: 10 * (e.quantity || 1), environment: e.environment, refund: e.type === 'CANCELLATION' };
}
export async function processCreditWebhook(input: unknown) {
  const event = eventSchema.parse(input);
  const grant = creditEvent(input);
  if (!grant) {
    checked(await supabaseAdmin.from('study_billing_events').upsert({ id: event.id, type: event.type }, { onConflict: 'id', ignoreDuplicates: true }));
    return { accepted: true, creditsChanged: false };
  }
  const changed = await rpc<boolean>('study_credit_event', { p_event: grant.eventId, p_type: grant.type, p_user: grant.userId, p_transaction: grant.transaction, p_product: grant.product, p_units: grant.units, p_environment: grant.environment, p_refund: grant.refund });
  return { accepted: true, processed: changed };
}

import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRevenueCatAccess } from '@/lib/revenuecat-access';
import type { StudySession, StudyPlan, SchoolLicense } from '@/types';

export const meteringEnabled = () => process.env.STUDYMATE_METERING_ENABLED === 'true';
export const periodStart = () => new Date().toISOString().slice(0, 7) + '-01';
export class StudyError extends Error {
  constructor(public code: string, public status = 409) { super(code); }
}
export function checked<T>(response: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (response.error) {
    const code = response.error.message;
    if (/LIMIT/.test(code)) throw new StudyError(code, 429);
    if (/FORBIDDEN|OWNER_CONFLICT/.test(code)) throw new StudyError(code, 403);
    if (/NOT_FOUND|NOT_ACTIVE/.test(code)) throw new StudyError(code, 404);
    if (/CONFLICT|EXPIRED|BUSY|RELEASED|INCOMPLETE|INACTIVE|INVITE|PAUSE_REASON|ALREADY_ACTIVE|ALREADY_CLAIMED/.test(code)) throw new StudyError(code);
    throw new StudyError('Service data is unavailable. Please retry.', 503);
  }
  return response.data as NonNullable<T>;
}
export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  return checked(await supabaseAdmin.rpc(name, args)) as T;
}
export async function getStudyPlan(userId: string, schoolId?: string): Promise<StudyPlan> {
  const members = checked(await supabaseAdmin.from('school_members').select('school_id,schools(*)').eq('user_id', userId).eq('active', true));
  const schools = members.flatMap(m => (Array.isArray(m.schools) ? m.schools : [m.schools])) as SchoolLicense[];
  const school = schools.find(s => s && (!schoolId || s.id === schoolId) && s.status !== 'suspended' && Date.parse(s.expires_at) > Date.now());
  if (schoolId && !school) throw new StudyError('SCHOOL_INACTIVE', 403);
  const access = school ? 'paid' : await getRevenueCatAccess(userId);
  const tier = school ? 'school' : access === 'paid' ? 'pro' : 'free';
  const plan: StudyPlan = { tier, courseLimit: tier === 'free' ? 1 : 5, monthlySessions: tier === 'free' ? 3 : 30, access, school: school || null };
  checked(await supabaseAdmin.from('study_accounts').upsert({ user_id: userId, plan: tier, verified_until: new Date(Date.now() + 5 * 60_000).toISOString() }, { onConflict: 'user_id' }));
  return plan;
}
export async function usageSummary(userId: string) {
  const plan = await getStudyPlan(userId);
  const [account, sessions, courses, ledger] = await Promise.all([
    supabaseAdmin.from('study_accounts').select('credits').eq('user_id', userId).single(),
    supabaseAdmin.from('study_sessions').select('id,status,source,expires_at').eq('user_id', userId).eq('period', periodStart()),
    supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('archived_at', null),
    supabaseAdmin.from('study_credit_ledger').select('delta,reason,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ]);
  const used = checked(sessions).filter(s => ['active','completed'].includes(s.status) || s.status === 'reserved' && Date.parse(s.expires_at) > Date.now()).filter(s => s.source !== 'credit').length;
  checked(courses);
  let poolRemaining: number | null = null;
  if (plan.school) {
    const pool = checked(await supabaseAdmin.from('study_sessions').select('status,expires_at').eq('school_id', plan.school.id).eq('period', periodStart()).eq('source', 'school'));
    poolRemaining = Math.max(0, plan.school.monthly_pool - pool.filter(s => ['active','completed'].includes(s.status) || s.status === 'reserved' && Date.parse(s.expires_at) > Date.now()).length);
  }
  return { ...plan, period: periodStart(), used, remaining: Math.max(0, Math.min(plan.monthlySessions - used, poolRemaining ?? Infinity)), poolRemaining, credits: Math.max(0, checked(account).credits), creditDebt: Math.max(0, -checked(account).credits), activeCourses: courses.count || 0, ledger: checked(ledger) };
}
export async function reserveSession(userId: string, courseId: string, key: string, topic = '', assignmentId?: string) {
  let schoolId: string | undefined;
  if (assignmentId) {
    const assignment = checked(await supabaseAdmin.from('school_assignments').select('topic,school_classes(school_id)').eq('id', assignmentId).single());
    const cls = (Array.isArray(assignment.school_classes) ? assignment.school_classes[0] : assignment.school_classes) as { school_id: string };
    schoolId = cls.school_id;
    if (topic && topic.toLowerCase() !== assignment.topic.toLowerCase()) throw new StudyError('TOPIC_CONFLICT');
    topic = assignment.topic;
  }
  const plan = await getStudyPlan(userId, schoolId);
  return rpc<StudySession>('study_reserve', { p_user: userId, p_course: courseId, p_key: key, p_topic: topic.trim().slice(0, 300), p_school: plan.school?.id || null, p_assignment: assignmentId || null });
}
export async function operationSession(userId: string, courseId: string, topic: string, requestedId?: string, key?: string) {
  if (requestedId) {
    const session = checked(await supabaseAdmin.from('study_sessions').select('*').eq('id', requestedId).eq('user_id', userId).eq('course_id', courseId).maybeSingle()) as StudySession | null;
    if (!session) throw new StudyError('SESSION_NOT_FOUND', 404);
    return session;
  }
  // The legacy website can reuse its current course session. The mobile app supplies its explicit ID.
  const active = checked(await supabaseAdmin.from('study_sessions').select('*').eq('user_id', userId).eq('course_id', courseId).in('status', ['reserved','active']).gt('expires_at', new Date().toISOString()).eq('period', periodStart()).order('created_at', { ascending: false }).limit(1));
  const prior = active[0] as StudySession | undefined;
  if (prior && (!topic || !prior.topic || prior.topic.toLowerCase() === topic.toLowerCase())) return prior;
  return reserveSession(userId, courseId, key || randomUUID(), topic);
}

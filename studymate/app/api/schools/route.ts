import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedRouteSupabase, unauthorizedResponse } from '@/lib/route-helpers';
import { checked, rpc, StudyError } from '@/lib/study-usage';
import { schoolMember, managedClass, schoolDashboard } from '@/lib/school-access';
import { usageError } from '@/lib/metered-route';
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('create'), name: z.string().trim().min(2).max(100) }),
  z.object({ action: z.literal('join'), code: z.string().min(40).max(100) }),
  z.object({ action: z.literal('dashboard'), schoolId: z.uuid() }),
  z.object({ action: z.literal('class'), schoolId: z.uuid(), name: z.string().trim().min(1).max(100), teacherId: z.uuid() }),
  z.object({ action: z.literal('invite'), schoolId: z.uuid(), email: z.email(), role: z.enum(['teacher','student']), classId: z.uuid().optional() }),
  z.object({ action: z.literal('assignment'), schoolId: z.uuid(), classId: z.uuid(), title: z.string().trim().min(1).max(150), topic: z.string().trim().min(1).max(300), targetMinutes: z.number().int().min(1).max(120), dueAt: z.iso.datetime().optional() }),
  z.object({ action: z.literal('member'), schoolId: z.uuid(), userId: z.uuid(), active: z.boolean() }),
  z.object({ action: z.literal('delete-own-records'), schoolId: z.uuid() }),
  z.object({ action: z.literal('delete-school'), schoolId: z.uuid(), confirmationName: z.string() }),
]);
export async function POST(request: Request) {
  const auth = await getAuthenticatedRouteSupabase(request); if (!auth) return unauthorizedResponse();
  try {
    const b = schema.parse(await request.json()); const uid = auth.user.id;
    if (b.action === 'list') {
      const memberships = checked(await supabaseAdmin.from('school_members').select('school_id,role,schools(id,name,status,expires_at)').eq('user_id', uid).eq('active', true));
      const claimed = checked(await supabaseAdmin.from('school_pilot_claims').select('user_id').eq('user_id', uid).maybeSingle());
      const canCreate = !claimed && (process.env.STUDYMATE_SCHOOL_PILOT_USER_IDS || '').split(',').includes(uid);
      return Response.json({ memberships, canCreate });
    }
    if (b.action === 'create') {
      if (!(process.env.STUDYMATE_SCHOOL_PILOT_USER_IDS || '').split(',').includes(uid)) throw new StudyError('School pilots require an approved owner account.', 403);
      const id = await rpc<string>('school_create_pilot', { p_user: uid, p_name: b.name });
      checked(await supabaseAdmin.from('school_members').update({ display_name: auth.user.email || 'Administrator' }).eq('school_id', id).eq('user_id', uid));
      return Response.json({ schoolId: id });
    }
    if (b.action === 'join') {
      if (!auth.user.email_confirmed_at || !auth.user.email) throw new StudyError('Confirm your email before joining.', 403);
      const id = await rpc<string>('school_accept_invite', { p_user: uid, p_email: auth.user.email, p_hash: createHash('sha256').update(b.code).digest('hex') });
      return Response.json({ schoolId: id });
    }
    if (b.action === 'dashboard') return Response.json(await schoolDashboard(uid, b.schoolId), { headers: { 'Cache-Control': 'no-store' } });
    if (b.action === 'delete-own-records') {
      await schoolMember(uid, b.schoolId);
      const classes = checked(await supabaseAdmin.from('school_classes').select('id').eq('school_id', b.schoolId));
      const assignments = checked(await supabaseAdmin.from('school_assignments').select('id').in('class_id', classes.map(c => c.id)));
      checked(await supabaseAdmin.from('school_runs').delete().eq('user_id', uid).in('assignment_id', assignments.map(a => a.id)));
      return Response.json({ success: true });
    }
    if (b.action === 'delete-school') {
      await schoolMember(uid, b.schoolId, ['admin']);
      const org = checked(await supabaseAdmin.from('schools').select('owner_id,name').eq('id', b.schoolId).single());
      if (org.owner_id !== uid || org.name !== b.confirmationName) throw new StudyError('School owner and exact name confirmation required.', 403);
      checked(await supabaseAdmin.from('schools').delete().eq('id', b.schoolId).eq('owner_id', uid));
      return Response.json({ success: true });
    }
    if (b.action === 'assignment') {
      await managedClass(uid, b.schoolId, b.classId);
      const result = checked(await supabaseAdmin.from('school_assignments').insert({ class_id: b.classId, title: b.title, topic: b.topic, target_minutes: b.targetMinutes, due_at: b.dueAt || null }).select('id').single());
      return Response.json(result);
    }
    if (b.action === 'invite') {
      if (b.role === 'teacher' || !b.classId) await schoolMember(uid, b.schoolId, ['admin']);
      if (b.classId) await managedClass(uid, b.schoolId, b.classId);
      const code = randomBytes(32).toString('hex');
      checked(await supabaseAdmin.from('school_invites').insert({ token_hash: createHash('sha256').update(code).digest('hex'), school_id: b.schoolId, email: b.email.toLowerCase(), role: b.role, class_id: b.classId || null }));
      return Response.json({ code, expiresInDays: 7 });
    }
    await schoolMember(uid, b.schoolId, ['admin']);
    if (b.action === 'class') {
      await schoolMember(b.teacherId, b.schoolId, ['admin','teacher']);
      return Response.json(checked(await supabaseAdmin.from('school_classes').insert({ school_id: b.schoolId, name: b.name, teacher_id: b.teacherId }).select('id').single()));
    }
    if (b.action === 'member') {
      if (b.active) throw new StudyError('Use a new invite to reactivate a seat.', 400);
      const org = checked(await supabaseAdmin.from('schools').select('owner_id').eq('id', b.schoolId).single());
      if (b.userId === org.owner_id) throw new StudyError('The school owner seat cannot be removed.', 400);
      checked(await supabaseAdmin.from('school_members').update({ active: false }).eq('school_id', b.schoolId).eq('user_id', b.userId));
      return Response.json({ success: true });
    }
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: 'Check the school form fields.' }, { status: 400 }); return usageError(error); }
}

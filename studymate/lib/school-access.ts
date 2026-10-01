import { supabaseAdmin } from '@/lib/supabase-admin';
import { checked, StudyError } from '@/lib/study-usage';
export async function schoolMember(userId: string, schoolId: string, roles = ['admin','teacher','student']) {
  const row = checked(await supabaseAdmin.from('school_members').select('role').eq('school_id', schoolId).eq('user_id', userId).eq('active', true).maybeSingle());
  if (!row || !roles.includes(row.role)) throw new StudyError('SCHOOL_FORBIDDEN', 403);
  return row.role as 'admin' | 'teacher' | 'student';
}
export async function managedClass(userId: string, schoolId: string, classId: string) {
  const role = await schoolMember(userId, schoolId, ['admin','teacher']);
  const cls = checked(await supabaseAdmin.from('school_classes').select('*').eq('id', classId).eq('school_id', schoolId).maybeSingle());
  if (!cls || role === 'teacher' && cls.teacher_id !== userId) throw new StudyError('CLASS_FORBIDDEN', 403);
  return cls;
}
export async function schoolDashboard(userId: string, schoolId: string) {
  const role = await schoolMember(userId, schoolId);
  const school = checked(await supabaseAdmin.from('schools').select('*').eq('id', schoolId).single());
  // Retain assignment activity for 90 days. Personal course documents are never queried here.
  const old = new Date(Date.now() - 90 * 86400000).toISOString();
  const allClasses = checked(await supabaseAdmin.from('school_classes').select('*').eq('school_id', schoolId));
  const enrolled = checked(await supabaseAdmin.from('school_class_members').select('*').in('class_id', allClasses.map(c => c.id)));
  const classes = allClasses.filter(c => role === 'admin' || role === 'teacher' && c.teacher_id === userId || role === 'student' && enrolled.some(e => e.class_id === c.id && e.user_id === userId));
  const classIds = classes.map(c => c.id);
  const assignments = checked(await supabaseAdmin.from('school_assignments').select('*').in('class_id', classIds));
  const assignmentIds = assignments.map(a => a.id);
  if (assignmentIds.length) checked(await supabaseAdmin.from('school_runs').delete().in('assignment_id', assignmentIds).lt('started_at', old));
  const runsQuery = supabaseAdmin.from('school_runs').select('*').in('assignment_id', assignmentIds);
  const runs = checked(await (role === 'student' ? runsQuery.eq('user_id', userId) : runsQuery));
  const visibleUsers = new Set(enrolled.filter(e => classIds.includes(e.class_id)).map(e => e.user_id));
  const members = checked(await supabaseAdmin.from('school_members').select('user_id,role,active,display_name').eq('school_id', schoolId)).filter(m => role === 'admin' || m.user_id === userId || role === 'teacher' && visibleUsers.has(m.user_id));
  const feedback = checked(await supabaseAdmin.from('study_operations').select('session_id,result').in('session_id', runs.map(r => r.session_id)).eq('operation', 'feedback').eq('status', 'complete'));
  const activity = runs.map(r => ({ ...r, state: r.state === 'active' && Date.parse(r.last_seen) + 45_000 < Date.now() ? 'paused' : r.state, practice: feedback.find(f => f.session_id === r.session_id)?.result as { percentage?: number; questionCount?: number } | undefined })).map(r => ({ ...r, practice: r.practice ? { percentage: r.practice.percentage, questionCount: r.practice.questionCount } : null }));
  return { school, role, classes, members, assignments, activity, retentionDays: 90 };
}

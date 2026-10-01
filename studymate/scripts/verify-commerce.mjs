// Integration fixtures are isolated, synthetic users. Never point this at a student's account.
import { createClient } from '@supabase/supabase-js';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const db = createClient(url, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const origin = process.env.COMMERCE_TEST_ORIGIN || (process.argv.includes('--live') ? 'https://studymate-pro.up.railway.app' : undefined);
const marker = randomUUID(); const users = [], events = [], orgs = []; let check = 'setup'; let passed = 0;
function ok(result) { if (result.error) throw new Error(result.error.code + ': ' + result.error.message); return result.data; }
async function rpc(name, args) { return ok(await db.rpc(name, args)); }
async function test(name, fn) { check = name; await fn(); passed++; console.log(JSON.stringify({ check: name, passed: true })); }
async function user() {
  const email = `commerce-${randomUUID()}@example.com`, password = randomUUID() + randomUUID();
  const u = ok(await db.auth.admin.createUser({ email, password, email_confirm: true })).user; users.push(u.id);
  const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const auth = ok(await client.auth.signInWithPassword({ email, password }));
  return { ...u, client, token: auth.session.access_token };
}
async function course(u) { return ok(await db.from('courses').insert({ user_id: u.id, name: `Commerce fixture ${marker}`, subject_type: 'law' }).select('id').single()).id; }
async function reserve(u, cid, key = randomUUID(), school = null, assignment = null) { return rpc('study_reserve', { p_user: u.id, p_course: cid, p_key: key, p_topic: 'Synthetic topic', p_school: school, p_assignment: assignment }); }
async function operation(u, s, success = true, op = 'preparation', result = { fixture: true }) {
  const lease = await rpc('study_begin_operation', { p_user: u.id, p_session: s.id, p_operation: op, p_hash: 'fixture', p_topic: '' });
  await rpc('study_finish_operation', { p_user: u.id, p_session: s.id, p_operation: op, p_token: lease.token, p_result: success ? result : null, p_success: success });
}
async function credit(u, transaction, refund = false, event = randomUUID()) {
  const id = `fixture:${marker}:${event}`; events.push(id);
  return rpc('study_credit_event', { p_event: id, p_type: refund ? 'CANCELLATION' : 'NON_RENEWING_PURCHASE', p_user: u.id, p_transaction: `fixture:${marker}:${transaction}`, p_product: 'fixture', p_units: 10, p_environment: 'SANDBOX', p_refund: refund });
}
async function balance(u) { return ok(await db.from('study_accounts').select('credits').eq('user_id', u.id).single()).credits; }
async function post(u, path, body, status = 200) {
  const r = await fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(u ? { Authorization: `Bearer ${u.token}` } : {}) }, body: JSON.stringify(body) });
  const data = await r.json(); assert.equal(r.status, status, `HTTP ${r.status} at ${path}: ${data.code || data.error || ''}`); return data;
}
try {
  const free = await user(), other = await user(), pro = await user();
  const cid = await course(free), otherCourse = await course(other);
  await test('free-course-cap-is-a-database-boundary', async () => { assert.match((await db.from('courses').insert({ user_id: free.id, name: 'Must fail', subject_type: 'law' })).error.message, /COURSE_LIMIT/); });
  await test('pro-has-five-active-slots-and-archive-releases-one', async () => {
    ok(await db.from('study_accounts').upsert({ user_id: pro.id, plan: 'pro', verified_until: new Date(Date.now() + 300000).toISOString() }));
    const ids = []; for (let i = 0; i < 5; i++) ids.push(await course(pro));
    assert.match((await db.from('courses').insert({ user_id: pro.id, name: 'Must fail', subject_type: 'law' })).error.message, /COURSE_LIMIT/);
    ok(await db.from('courses').update({ archived_at: new Date().toISOString() }).eq('id', ids[0])); await course(pro);
    assert.match((await db.from('courses').update({ archived_at: null }).eq('id', ids[0])).error.message, /COURSE_LIMIT/);
  });
  let sessions;
  await test('concurrent-free-reservations-cannot-exceed-three', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => db.rpc('study_reserve', { p_user: free.id, p_course: cid, p_key: randomUUID(), p_topic: 'Synthetic topic' })));
    sessions = results.filter(r => !r.error).map(r => r.data); assert.equal(sessions.length, 3); assert.ok(results.filter(r => r.error).every(r => r.error.message.includes('SESSION_LIMIT')));
  });
  await test('reservation-idempotency-and-course-ownership', async () => { const s = sessions[0]; assert.equal((await reserve(free, cid, s.request_key)).id, s.id); assert.match((await db.rpc('study_reserve', { p_user: other.id, p_course: cid, p_key: randomUUID(), p_topic: '' })).error.message, /COURSE_NOT_ACTIVE/); });
  await test('failed-first-call-returns-included-allowance', async () => { await operation(free, sessions[0], false); assert.equal(ok(await db.from('study_sessions').select('status').eq('id', sessions[0].id).single()).status, 'released'); sessions[0] = await reserve(free, cid); });
  await test('saved-operation-is-idempotent-and-lease-fenced', async () => {
    await operation(free, sessions[0]); const cached = await rpc('study_begin_operation', { p_user: free.id, p_session: sessions[0].id, p_operation: 'preparation', p_hash: 'fixture' }); assert.equal(cached.cached, true);
    assert.match((await db.rpc('study_begin_operation', { p_user: free.id, p_session: sessions[0].id, p_operation: 'preparation', p_hash: 'changed' })).error.message, /CONFLICT/);
    assert.match((await db.rpc('study_finish_operation', { p_user: free.id, p_session: sessions[0].id, p_operation: 'preparation', p_token: randomUUID(), p_success: true, p_result: {} })).error.message, /LEASE_LOST/);
  });
  await test('duplicate-purchase-and-alias-cannot-mint-twice', async () => {
    await credit(free, 'tx1', false, 'same'); await credit(free, 'tx1', false, 'same'); await credit(free, 'tx1'); assert.equal(await balance(free), 10);
    await assert.rejects(() => credit(other, 'tx1'), /OWNER_CONFLICT/);
  });
  await test('credits-use-after-quota-and-failure-returns-exactly-one', async () => { const s = await reserve(free, cid); assert.equal(s.source, 'credit'); assert.equal(await balance(free), 9); await operation(free, s, false); assert.equal(await balance(free), 10); });
  await test('refunds-create-debt-and-refund-before-purchase-cannot-grant', async () => { const s = await reserve(free, cid); await operation(free, s); await credit(free, 'tx1', true); await credit(free, 'tx1', true); assert.equal(await balance(free), -1); await credit(free, 'tx2', true); await credit(free, 'tx2'); assert.equal(await balance(free), -1); });
  await test('deleting-a-course-does-not-reset-monthly-usage', async () => { ok(await db.from('courses').delete().eq('id', cid)); const replacement = await course(free); await assert.rejects(() => reserve(free, replacement), /SESSION_LIMIT/); });
  await test('authenticated-clients-cannot-mint-ledger-or-call-trusted-RPCs', async () => { assert.ok((await other.client.from('study_accounts').insert({ user_id: other.id, credits: 500 })).error); assert.ok((await other.client.rpc('study_credit_event', { p_event: 'fake', p_type: 'fake', p_user: other.id, p_transaction: 'fake', p_product: 'fake', p_units: 100, p_environment: 'PRODUCTION', p_refund: false })).error); });
  const owner = await user(), teacher = await user(), student = await user(), outsider = await user();
  const school = await rpc('school_create_pilot', { p_user: owner.id, p_name: `Fixture ${marker}` }); orgs.push(school);
  await test('school-pilot-is-capped-and-cannot-be-recreated', async () => { const s = ok(await db.from('schools').select('*').eq('id', school).single()); assert.equal(s.seat_limit, 25); assert.equal(s.monthly_pool, 300); assert.ok(Date.parse(s.expires_at) < Date.now() + 31 * 86400000); await assert.rejects(() => rpc('school_create_pilot', { p_user: owner.id, p_name: 'Repeat' }), /ALREADY_CLAIMED/); });
  const cls = ok(await db.from('school_classes').insert({ school_id: school, name: 'Class A', teacher_id: teacher.id }).select('id').single()).id;
  const otherClass = ok(await db.from('school_classes').insert({ school_id: school, name: 'Class B', teacher_id: owner.id }).select('id').single()).id;
  ok(await db.from('school_members').insert({ school_id: school, user_id: teacher.id, role: 'teacher' }));
  const code = randomUUID(), hash = createHash('sha256').update(code).digest('hex');
  ok(await db.from('school_invites').insert({ token_hash: hash, school_id: school, email: student.email, role: 'student', class_id: cls }));
  await test('school-invite-checks-email-and-is-repeat-safe', async () => { await assert.rejects(() => rpc('school_accept_invite', { p_user: outsider.id, p_email: outsider.email, p_hash: hash }), /INVITE_INVALID/); assert.equal(await rpc('school_accept_invite', { p_user: student.id, p_email: student.email, p_hash: hash }), school); assert.equal(await rpc('school_accept_invite', { p_user: student.id, p_email: student.email, p_hash: hash }), school); });
  const assignment = ok(await db.from('school_assignments').insert({ class_id: cls, title: 'Fixture practice', topic: 'Synthetic topic', target_minutes: 1 }).select('id').single()).id;
  const studentCourse = await course(student); const assigned = await reserve(student, studentCourse, randomUUID(), school, assignment);
  await test('assignments-deny-non-enrolled-users', async () => { await assert.rejects(() => reserve(other, otherCourse, randomUUID(), school, assignment), /SCHOOL_INACTIVE/); });
  await test('timer-uses-server-clock-and-rejects-duplicates-and-incomplete-finish', async () => {
    const args = { p_user: student.id, p_session: assigned.id, p_sequence: 1, p_action: 'heartbeat' }; const r = await rpc('school_timer_event', args); assert.equal(r.active_seconds, 0);
    ok(await db.from('school_runs').update({ last_seen: new Date(Date.now() - 120000).toISOString() }).eq('session_id', assigned.id));
    assert.equal((await rpc('school_timer_event', { ...args, p_sequence: 2 })).active_seconds, 45); assert.equal((await rpc('school_timer_event', { ...args, p_sequence: 2 })).active_seconds, 45);
    await assert.rejects(() => rpc('school_timer_event', { ...args, p_sequence: 3, p_action: 'finish' }), /INCOMPLETE/);
    await assert.rejects(() => rpc('school_timer_event', { ...args, p_sequence: 3, p_action: 'pause', p_reason: '' }), /PAUSE_REASON/);
    assert.equal((await rpc('school_timer_event', { ...args, p_sequence: 3, p_action: 'pause', p_reason: 'Break' })).state, 'paused');
  });
  await test('school-pool-and-seat-cap-are-atomic', async () => {
    ok(await db.from('schools').update({ monthly_pool: 1, seat_limit: 3 }).eq('id', school));
    await assert.rejects(() => reserve(student, studentCourse, randomUUID(), school), /SESSION_LIMIT/);
    const h = createHash('sha256').update(randomUUID()).digest('hex'); ok(await db.from('school_invites').insert({ token_hash: h, school_id: school, email: outsider.email, role: 'student' }));
    await assert.rejects(() => rpc('school_accept_invite', { p_user: outsider.id, p_email: outsider.email, p_hash: h }), /SEAT_LIMIT/);
  });
  if (origin) {
    await test('live-school-role-and-class-isolation', async () => {
      await post(outsider, '/api/schools', { action: 'dashboard', schoolId: school }, 403);
      const d = await post(teacher, '/api/schools', { action: 'dashboard', schoolId: school }); assert.deepEqual(d.classes.map(c => c.id), [cls]); assert.ok(!JSON.stringify(d).includes(otherClass));
      await post(teacher, '/api/schools', { action: 'assignment', schoolId: school, classId: otherClass, title: 'No', topic: 'No', targetMinutes: 1 }, 403);
      const own = await post(student, '/api/schools', { action: 'dashboard', schoolId: school }); assert.ok(own.activity.every(r => r.user_id === student.id));
      await post(null, '/api/billing/usage', {}, 401);
    });
    await test('live-server-grading-ignores-client-scores-and-rubrics', async () => {
      const s = await reserve(other, otherCourse); await operation(other, s);
      const q = ok(await db.from('quiz_questions').insert({ course_id: otherCourse, quiz_session_id: s.id, type: 'mcq', question: 'Synthetic fixture: select B.', options: [{ label: 'A', text: 'Wrong' }, { label: 'B', text: 'Right' }], correct_answer: 'B', marks: 1, explanation: 'Fixture reference: B.' }).select('id').single());
      const body = { courseId: otherCourse, studySessionId: s.id, score: 100, correct_answer: 'A', answers: [{ questionId: q.id, answer: 'A' }] };
      const result = await post(other, '/api/study/submit', body); assert.equal(result.percentage, 0); assert.equal((await post(other, '/api/study/submit', body)).attemptId, result.attemptId);
      await post(outsider, '/api/study/submit', body, 404);
      assert.ok((await other.client.from('quiz_attempts').update({ score: 100 }).eq('id', result.attemptId)).error);
      const report = await fetch(origin + '/api/report/generate', { method: 'POST', headers: { Authorization: `Bearer ${other.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: otherCourse }) });
      assert.equal(report.status, 200); const pdf = Buffer.from(await report.arrayBuffer()); assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    });
  }
  console.log(JSON.stringify({ completed: true, checks: passed, syntheticDataOnly: true, aiAndStorePurchaseNotClaimed: true }));
} catch (e) { console.error(JSON.stringify({ failedCheck: check, error: e.message })); process.exitCode = 1; }
finally {
  for (const sid of orgs) ok(await db.from('schools').delete().eq('id', sid));
  if (users.length) { ok(await db.from('school_pilot_claims').delete().in('user_id', users)); ok(await db.from('courses').delete().in('user_id', users)); for (const id of users) ok(await db.auth.admin.deleteUser(id)); }
  if (events.length) ok(await db.from('study_billing_events').delete().in('id', events));
  console.log(JSON.stringify({ cleanupComplete: true, testUsersRemoved: users.length }));
}

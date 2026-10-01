import { test } from 'node:test';
import assert from 'node:assert/strict';
import { showAtPracticeBreak } from '../src/ad-policy.ts';

function dependencies(access = async () => 'free') {
  const calls = [];
  return { calls, access, consent: async () => true, prepare: async () => { calls.push('prepare'); }, show: async () => { calls.push('show'); }, isCurrent: () => true };
}
const eligible = { completedSets: 2, lastShownAt: 0 };

test('paid and unknown accounts do not load ads', async () => {
  for (const access of ['paid', 'unknown']) {
    const deps = dependencies(async () => access);
    assert.equal(await showAtPracticeBreak(eligible, deps), false);
    assert.deepEqual(deps.calls, []);
  }
});
test('first set and ten-minute cooldown preserve study time', async () => {
  const deps = dependencies();
  assert.equal(await showAtPracticeBreak({ completedSets: 1, lastShownAt: 0 }, deps), false);
  assert.equal(await showAtPracticeBreak({ completedSets: 4, lastShownAt: 1000 }, deps, 2000), false);
  assert.deepEqual(deps.calls, []);
});
test('a purchase during ad loading prevents the ad', async () => {
  let checks = 0;
  const deps = dependencies(async () => ++checks === 1 ? 'free' : 'paid');
  assert.equal(await showAtPracticeBreak(eligible, deps), false);
  assert.deepEqual(deps.calls, ['prepare']);
});
test('navigation or sign-out during loading prevents the ad', async () => {
  const deps = dependencies();
  deps.prepare = async () => { deps.isCurrent = () => false; };
  assert.equal(await showAtPracticeBreak(eligible, deps), false);
  assert.deepEqual(deps.calls, []);
});
test('consent refusal and provider failure skip ads', async () => {
  const deps = dependencies();
  deps.consent = async () => false;
  assert.equal(await showAtPracticeBreak(eligible, deps), false);
  deps.access = async () => { throw new Error('offline'); };
  assert.equal(await showAtPracticeBreak(eligible, deps), false);
  assert.deepEqual(deps.calls, []);
});
test('confirmed free access shows one ad at an eligible break', async () => {
  const deps = dependencies();
  assert.equal(await showAtPracticeBreak(eligible, deps), true);
  assert.deepEqual(deps.calls, ['prepare', 'show']);
});

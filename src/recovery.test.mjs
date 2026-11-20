import assert from "node:assert/strict";
import test from "node:test";
import {
  RECOVERY_DURATION,
  completeCheckin,
  countdown,
  dailyLimit,
  initialTracker,
  localDate,
  markOverLimit,
  normalizePrototype,
  normalizeTracker,
  redSimulation,
  restorePrototype,
} from "./recovery.ts";

const now = new Date(2026, 0, 26, 23, 30).getTime();

test("exactly the daily limit is normal; exceeding it creates a pending alert", () => {
  assert.equal(markOverLimit({ ...initialTracker(now), consumed: 5 }).recovery, null);
  const over = markOverLimit({ ...initialTracker(now), consumed: 12 });
  assert.equal(over.recovery.excess, 7);
  assert.equal(over.recovery.expiresAt, null);
});

test("the latest draft excess is reflected before check-in and can be corrected", () => {
  const pending = markOverLimit({ ...initialTracker(now), consumed: 6 });
  assert.equal(markOverLimit({ ...pending, consumed: 12 }).recovery.excess, 7);
  assert.equal(markOverLimit({ ...pending, consumed: 5 }).recovery, null);
  assert.equal(completeCheckin(pending, 5, now).recovery, null);
});

test("check-in starts exactly 24 hours, not just until midnight", () => {
  const checked = completeCheckin(initialTracker(now), 12, now);
  assert.equal(checked.checkedIn, true);
  assert.equal(checked.recovery.expiresAt, now + RECOVERY_DURATION);
  assert.equal(checked.recovery.excess, 7);
  assert.equal(countdown(checked.recovery.expiresAt, now), "24:00:00");
  assert.equal(countdown(checked.recovery.expiresAt, now + 888_000), "23:45:12");
  const afterMidnight = normalizeTracker(checked, now + 60 * 60 * 1000);
  assert.equal(afterMidnight.consumed, 0);
  assert.equal(afterMidnight.checkedIn, false);
  assert.equal(afterMidnight.recovery.expiresAt, checked.recovery.expiresAt);
});

test("refresh restores the original deadline and recovery snapshot", () => {
  const state = { current: redSimulation(now), simulation: null };
  const restored = restorePrototype(JSON.stringify(state), now + 720_000);
  assert.deepEqual(restored.current.recovery, state.current.recovery);
  assert.equal(countdown(restored.current.recovery.expiresAt, now + 720_000), "23:48:00");
});

test("under-limit check-ins and quota edits cannot dismiss or extend active recovery", () => {
  const active = redSimulation(now);
  const edited = completeCheckin({ ...active, quota: 99 }, 0, now + 2000);
  assert.deepEqual(edited.recovery, active.recovery);
  const repeated = completeCheckin(active, 14, now + 5000);
  assert.deepEqual(repeated.recovery, active.recovery);
});

test("recovery expires at its deadline, resets Rem Total, and does not reactivate on reload", () => {
  const state = { current: { ...redSimulation(now), remTotal: true }, simulation: null };
  assert.notEqual(normalizePrototype(state, now + RECOVERY_DURATION - 1).current.recovery, null);
  const expired = normalizePrototype(state, now + RECOVERY_DURATION);
  assert.equal(expired.current.recovery, null);
  assert.equal(expired.current.remTotal, false);
  assert.equal(expired.current.consumed, 0);
  assert.equal(expired.current.date, localDate(now + RECOVERY_DURATION));
  assert.deepEqual(restorePrototype(JSON.stringify(state), now + RECOVERY_DURATION), expired);
  assert.equal(countdown(now, now + 1000), "00:00:00");
});

test("Rem Total uses a zero daily limit without changing the weekly target or snapshot", () => {
  const active = { ...redSimulation(now), remTotal: true };
  assert.equal(dailyLimit(active), 0);
  assert.equal(active.quota, 5);
  assert.equal(markOverLimit(active).recovery.excess, 7);
  const pending = { ...markOverLimit({ ...initialTracker(now), consumed: 12 }), remTotal: true };
  assert.equal(pending.recovery.expiresAt, null);
  const checked = completeCheckin(pending, 12, now);
  assert.equal(checked.recovery.quota, 5);
  assert.equal(checked.recovery.excess, 7);
});

test("zero targets and zero consumption do not produce invalid recovery data", () => {
  const zeroTarget = { ...initialTracker(now), quota: 0, consumed: 0 };
  assert.equal(markOverLimit(zeroTarget).recovery, null);
  const checked = completeCheckin(zeroTarget, 1, now);
  assert.equal(checked.recovery.quota, 0);
  assert.equal(checked.recovery.excess, 1);
});

test("simulation persists separately and leaves the real tracker unchanged", () => {
  const current = { ...initialTracker(now), quota: 7, consumed: 3 };
  const simulation = redSimulation(now);
  const restored = restorePrototype(JSON.stringify({ current, simulation }), now + 1000);
  assert.deepEqual(restored.current, current);
  assert.deepEqual(restored.simulation, simulation);
});

test("missing, malformed, or invalid stored data safely falls back", () => {
  const fallback = { current: initialTracker(now), simulation: null };
  for (const raw of [
    null,
    "{",
    "null",
    "[]",
    '{"current":{}}',
    JSON.stringify({
      current: { ...initialTracker(now), quota: -1 },
      simulation: null,
    }),
  ]) {
    assert.deepEqual(restorePrototype(raw, now), fallback);
  }
});

export const PROTOTYPE_STORAGE_KEY = "pelan.prototype.v1";
export const RECOVERY_DURATION = 24 * 60 * 60 * 1000;

export type Recovery = {
  date: string;
  consumed: number;
  quota: number;
  excess: number;
  expiresAt: number | null;
};

export type DailyTracker = {
  date: string;
  consumed: number;
  quota: number;
  checkedIn: boolean;
  remTotal: boolean;
  recovery: Recovery | null;
};

export type PrototypeState = {
  current: DailyTracker;
  simulation: DailyTracker | null;
};

export function localDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function initialTracker(now: number): DailyTracker {
  return {
    date: localDate(now),
    consumed: 2,
    quota: 5,
    checkedIn: false,
    remTotal: false,
    recovery: null,
  };
}

export function dailyLimit(tracker: DailyTracker) {
  return tracker.remTotal && tracker.recovery ? 0 : tracker.quota;
}

export function markOverLimit(tracker: DailyTracker): DailyTracker {
  if (tracker.recovery?.expiresAt != null || (tracker.remTotal && tracker.recovery)) return tracker;
  if (tracker.consumed <= dailyLimit(tracker)) {
    return tracker.recovery?.date === tracker.date ? { ...tracker, recovery: null } : tracker;
  }
  return {
    ...tracker,
    recovery: {
      date: tracker.date,
      consumed: tracker.consumed,
      quota: dailyLimit(tracker),
      excess: tracker.consumed - dailyLimit(tracker),
      expiresAt: null,
    },
  };
}

export function normalizeTracker(tracker: DailyTracker, now: number): DailyTracker {
  const newDay = tracker.date !== localDate(now);
  const expired = tracker.recovery?.expiresAt != null && tracker.recovery.expiresAt <= now;
  if (!newDay && !expired) return tracker;
  return {
    ...tracker,
    ...(newDay ? { date: localDate(now), consumed: 0, checkedIn: false } : {}),
    ...(expired ? { recovery: null, remTotal: false } : {}),
  };
}

export function normalizePrototype(state: PrototypeState, now: number): PrototypeState {
  const current = normalizeTracker(state.current, now);
  const simulation = state.simulation ? normalizeTracker(state.simulation, now) : null;
  return current === state.current && simulation === state.simulation
    ? state
    : { current, simulation };
}

export function completeCheckin(tracker: DailyTracker, count: number, now: number): DailyTracker {
  const normalized = normalizeTracker(tracker, now);
  const limit = dailyLimit(normalized);
  const recoveryQuota = count > normalized.quota ? normalized.quota : limit;
  const locked = normalized.recovery?.expiresAt != null;
  // Corrected, within-limit check-ins may clear a draft alert, never a running recovery.
  const recovery = locked
    ? normalized.recovery
    : count > limit
      ? {
          date: normalized.date,
          consumed: count,
          quota: recoveryQuota,
          excess: count - recoveryQuota,
          expiresAt: now + RECOVERY_DURATION,
        }
      : null;
  return { ...normalized, consumed: count, checkedIn: true, recovery };
}

export function redSimulation(now: number): DailyTracker {
  return completeCheckin(initialTracker(now), 12, now);
}

export function countdown(expiresAt: number, now: number) {
  const seconds = Math.min(
    RECOVERY_DURATION / 1000,
    Math.max(0, Math.ceil((expiresAt - now) / 1000)),
  );
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function validTracker(value: unknown): value is DailyTracker {
  if (!value || typeof value !== "object") return false;
  const tracker = value as DailyTracker;
  const validCount = (n: unknown, max: number) =>
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
  if (
    typeof tracker.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(tracker.date) ||
    !validCount(tracker.consumed, 1_000_000) ||
    !validCount(tracker.quota, 99) ||
    typeof tracker.checkedIn !== "boolean" ||
    typeof tracker.remTotal !== "boolean"
  )
    return false;
  const recovery = tracker.recovery;
  return (
    recovery === null ||
    (typeof recovery === "object" &&
      typeof recovery.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(recovery.date) &&
      validCount(recovery.consumed, 1_000_000) &&
      validCount(recovery.quota, 99) &&
      validCount(recovery.excess, 1_000_000) &&
      recovery.excess > 0 &&
      (recovery.expiresAt === null ||
        (typeof recovery.expiresAt === "number" &&
          Number.isFinite(recovery.expiresAt) &&
          recovery.expiresAt > 0)))
  );
}

export function restorePrototype(raw: string | null, now: number): PrototypeState {
  const fallback = { current: initialTracker(now), simulation: null };
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    const state = parsed as PrototypeState;
    if (
      !validTracker(state.current) ||
      (state.simulation !== null && !validTracker(state.simulation))
    ) {
      return fallback;
    }
    return normalizePrototype(state, now);
  } catch {
    return fallback;
  }
}

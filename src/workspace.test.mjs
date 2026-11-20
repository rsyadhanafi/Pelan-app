import assert from "node:assert/strict";
import test from "node:test";
import {
  initialWorkspace,
  refreshActivityDay,
  removeActivity,
  restoreWorkspace,
  validateActivity,
  validateTask,
} from "./workspace.ts";

const now = new Date(2026, 0, 26, 12);
const task = {
  title: "Review notebook klasifikasi",
  category: "Intern ML/AI",
  minutes: 45,
  status: "On going",
};

test("starter examples include all task statuses and the user's five activities", () => {
  const workspace = initialWorkspace(now);
  assert.deepEqual(
    workspace.tasks.map((item) => item.status),
    ["On going", "Hold", "Done"],
  );
  assert.deepEqual(
    workspace.activities.map((item) => item.label),
    ["Ngerjain tugas", "Intern ML/AI Engineer", "Running", "Baca Buku", "Coffee time / me time"],
  );
  assert.equal(workspace.activities.find((item) => item.label === "Running").icon, "run");
});

test("custom categories, durations, and each status are accepted", () => {
  for (const status of ["On going", "Hold", "Done"]) {
    assert.equal(validateTask({ ...task, category: "Penelitian pribadi", status }), "");
  }
});

test("blank and oversized fields, invalid durations, and invalid status are rejected", () => {
  for (const override of [
    { title: " " },
    { title: "a".repeat(101) },
    { category: "" },
    { category: "a".repeat(41) },
    { minutes: 0 },
    { minutes: -1 },
    { minutes: 2.5 },
    { minutes: 1441 },
    { minutes: NaN },
    { status: "Paused" },
  ])
    assert.notEqual(validateTask({ ...task, ...override }), "");
});

test("duplicate activity names are rejected case-insensitively, but editing itself is allowed", () => {
  const workspace = initialWorkspace(now);
  assert.notEqual(validateActivity({ label: "  RUNNING ", icon: "run" }, workspace.activities), "");
  assert.equal(
    validateActivity({ label: "Running", icon: "run" }, workspace.activities, "activity-running"),
    "",
  );
  assert.equal(
    validateActivity({ label: "Running sore 3 km", icon: "run" }, workspace.activities),
    "",
  );
  assert.notEqual(validateActivity({ label: "  ", icon: "run" }, []), "");
  assert.notEqual(validateActivity({ label: "Gym", icon: "unknown" }, []), "");
});

test("saved custom data restores with stable IDs, trimmed inputs, and selected activities", () => {
  const workspace = initialWorkspace(now);
  workspace.tasks.unshift({
    id: "my-task",
    ...task,
    title: ` ${task.title} `,
    category: " Riset pribadi ",
  });
  workspace.activities.push({ id: "my-activity", label: " Menulis jurnal ", icon: "spark" });
  workspace.completedActivityIds = ["my-activity", "my-activity", "deleted-activity"];
  const restored = restoreWorkspace(JSON.stringify(workspace), now);
  assert.equal(restored.tasks[0].id, "my-task");
  assert.equal(restored.tasks[0].category, "Riset pribadi");
  assert.equal(restored.activities.at(-1).label, "Menulis jurnal");
  assert.deepEqual(restored.completedActivityIds, ["my-activity"]);
});

test("empty lists remain empty on reload, without restoring deleted examples", () => {
  const workspace = {
    ...initialWorkspace(now),
    tasks: [],
    activities: [],
    completedActivityIds: [],
  };
  assert.deepEqual(restoreWorkspace(JSON.stringify(workspace), now), workspace);
});

test("deleting an activity removes its check-in selection, preserving other data", () => {
  const workspace = {
    ...initialWorkspace(now),
    completedActivityIds: ["activity-running", "activity-coffee"],
  };
  const next = removeActivity(workspace, "activity-running");
  assert.equal(
    next.activities.some((activity) => activity.id === "activity-running"),
    false,
  );
  assert.deepEqual(next.completedActivityIds, ["activity-coffee"]);
  assert.deepEqual(next.tasks, workspace.tasks);
});

test("a new day resets only activity completion, not custom lists or task statuses", () => {
  const workspace = { ...initialWorkspace(now), completedActivityIds: ["activity-coffee"] };
  assert.equal(refreshActivityDay(workspace, now), workspace);
  const next = refreshActivityDay(workspace, new Date(2026, 0, 27, 0));
  assert.deepEqual(next.completedActivityIds, []);
  assert.deepEqual(next.tasks, workspace.tasks);
  assert.deepEqual(next.activities, workspace.activities);
});

test("malformed storage falls back safely and invalid rows are filtered", () => {
  for (const raw of [null, "{", "null", "[]", '{"tasks":null}']) {
    assert.deepEqual(restoreWorkspace(raw, now), initialWorkspace(now));
  }
  const workspace = initialWorkspace(now);
  workspace.tasks.push(null, { ...workspace.tasks[0] }, { id: "bad", ...task, minutes: -1 });
  workspace.activities.push(null, { id: "bad-icon", label: "Bad", icon: "unknown" });
  const restored = restoreWorkspace(JSON.stringify(workspace), now);
  assert.equal(restored.tasks.length, 3);
  assert.equal(restored.activities.length, 5);
});

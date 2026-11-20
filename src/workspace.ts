export const WORKSPACE_STORAGE_KEY = "pelan.workspace.v1";
export const TASK_STATUSES = ["On going", "Hold", "Done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const ACTIVITY_ICONS = [
  { value: "book", label: "Buku / belajar" },
  { value: "work", label: "Pekerjaan" },
  { value: "run", label: "Lari" },
  { value: "coffee", label: "Coffee time" },
  { value: "spark", label: "Personal" },
  { value: "leaf", label: "Istirahat" },
] as const;
export type ActivityIcon = (typeof ACTIVITY_ICONS)[number]["value"];
export type Task = {
  id: string;
  title: string;
  category: string;
  minutes: number;
  status: TaskStatus;
};
export type Activity = { id: string; label: string; icon: ActivityIcon };
export type Workspace = {
  tasks: Task[];
  activities: Activity[];
  activityDate: string;
  completedActivityIds: string[];
};

export function activityDay(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function initialWorkspace(now = new Date()): Workspace {
  return {
    tasks: [
      {
        id: "task-proposal",
        title: "Selesaikan revisi proposal",
        category: "Kuliah",
        minutes: 25,
        status: "On going",
      },
      {
        id: "task-notebook",
        title: "Review notebook klasifikasi",
        category: "Intern ML/AI",
        minutes: 45,
        status: "Hold",
      },
      {
        id: "task-reading",
        title: "Baca 10 halaman buku",
        category: "Personal",
        minutes: 20,
        status: "Done",
      },
    ],
    activities: [
      { id: "activity-study", label: "Ngerjain tugas", icon: "book" },
      { id: "activity-intern", label: "Intern ML/AI Engineer", icon: "work" },
      { id: "activity-running", label: "Running", icon: "run" },
      { id: "activity-reading", label: "Baca Buku", icon: "book" },
      { id: "activity-coffee", label: "Coffee time / me time", icon: "coffee" },
    ],
    activityDate: activityDay(now),
    completedActivityIds: [],
  };
}

export function refreshActivityDay(workspace: Workspace, now = new Date()): Workspace {
  const date = activityDay(now);
  return workspace.activityDate === date
    ? workspace
    : { ...workspace, activityDate: date, completedActivityIds: [] };
}

export function validateTask(task: Omit<Task, "id">) {
  if (!task.title.trim() || task.title.trim().length > 100)
    return "Isi nama tugas, maksimal 100 karakter.";
  if (!task.category.trim() || task.category.trim().length > 40)
    return "Isi kategori sendiri, maksimal 40 karakter.";
  if (!Number.isInteger(task.minutes) || task.minutes < 1 || task.minutes > 1440)
    return "Durasi harus berupa angka 1–1440 menit.";
  if (!TASK_STATUSES.includes(task.status)) return "Pilih status On going, Hold, atau Done.";
  return "";
}

export function validateActivity(
  activity: Omit<Activity, "id">,
  activities: Activity[],
  editingId?: string,
) {
  if (!activity.label.trim() || activity.label.trim().length > 60)
    return "Isi nama aktivitas, maksimal 60 karakter.";
  if (!ACTIVITY_ICONS.some((icon) => icon.value === activity.icon))
    return "Pilih salah satu ikon aktivitas.";
  if (
    activities.some(
      (item) =>
        item.id !== editingId &&
        item.label.toLocaleLowerCase() === activity.label.trim().toLocaleLowerCase(),
    )
  ) {
    return "Aktivitas ini sudah ada. Gunakan nama lain atau edit aktivitas tersebut.";
  }
  return "";
}

export function removeActivity(workspace: Workspace, id: string): Workspace {
  return {
    ...workspace,
    activities: workspace.activities.filter((activity) => activity.id !== id),
    completedActivityIds: workspace.completedActivityIds.filter((selectedId) => selectedId !== id),
  };
}

export function restoreWorkspace(raw: string | null, now = new Date()): Workspace {
  const fallback = () => initialWorkspace(now);
  if (!raw) return fallback();
  try {
    const value = JSON.parse(raw);
    if (!value || !Array.isArray(value.tasks) || !Array.isArray(value.activities))
      return fallback();
    const ids = new Set<string>();
    const validId = (item: unknown): item is { id: string } => {
      if (
        !item ||
        typeof item !== "object" ||
        !("id" in item) ||
        typeof item.id !== "string" ||
        !item.id ||
        ids.has(item.id)
      )
        return false;
      return true;
    };
    const tasks = value.tasks
      .filter((item: unknown): item is Task => {
        if (!validId(item)) return false;
        const task = item as Task;
        if (
          typeof task.title !== "string" ||
          typeof task.category !== "string" ||
          validateTask(task)
        )
          return false;
        ids.add(task.id);
        return true;
      })
      .map((task: Task) => ({ ...task, title: task.title.trim(), category: task.category.trim() }));
    const activities: Activity[] = [];
    for (const item of value.activities) {
      if (!validId(item)) continue;
      const activity = item as Activity;
      if (typeof activity.label !== "string" || validateActivity(activity, activities)) continue;
      ids.add(activity.id);
      activities.push({ id: activity.id, label: activity.label.trim(), icon: activity.icon });
    }
    const completedActivityIds = Array.isArray(value.completedActivityIds)
      ? [
          ...new Set<string>(
            value.completedActivityIds.filter(
              (id: unknown) =>
                typeof id === "string" && activities.some((activity) => activity.id === id),
            ),
          ),
        ]
      : [];
    return refreshActivityDay(
      { tasks, activities, completedActivityIds, activityDate: value.activityDate },
      now,
    );
  } catch {
    return fallback();
  }
}

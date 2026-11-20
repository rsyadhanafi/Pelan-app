import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import {
  PROTOTYPE_STORAGE_KEY,
  completeCheckin,
  countdown,
  dailyLimit,
  initialTracker,
  markOverLimit,
  normalizePrototype,
  normalizeTracker,
  redSimulation,
  restorePrototype,
} from "./recovery";
import type { DailyTracker, Recovery } from "./recovery";
import {
  ACTIVITY_ICONS,
  TASK_STATUSES,
  WORKSPACE_STORAGE_KEY,
  refreshActivityDay,
  removeActivity,
  restoreWorkspace,
  validateActivity,
  validateTask,
} from "./workspace";
import type { ActivityIcon, Task, TaskStatus } from "./workspace";

type Page = "home" | "mission" | "checkin" | "notifications";
type IconName =
  | "arrow"
  | "sun"
  | "moon"
  | "bell"
  | "clock"
  | "check"
  | "plus"
  | "minus"
  | "close"
  | "leaf"
  | "spark"
  | "flag"
  | "grid"
  | "chevron"
  | "water"
  | "book"
  | "work"
  | "walk"
  | "run"
  | "edit"
  | "trash"
  | "coffee"
  | "warning"
  | "menu"
  | "smile";

function Icon({
  name,
  size = 20,
  ...props
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    moon: <path d="M20.7 13.2A9 9 0 0 1 10.8 3.3a9 9 0 1 0 9.9 9.9Z" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    warning: (
      <>
        <path d="m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.2l-8-14a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    leaf: (
      <>
        <path d="M20 3c0 10-1 16-8 16a7 7 0 0 1-7-7c0-7 8-4 15-9Z" />
        <path d="M3 21 15 9" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
        <path d="M21 2v4m-2-2h4" />
      </>
    ),
    flag: (
      <>
        <path d="M5 21V3c5-3 9 3 14 0v11c-5 3-9-3-14 0" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    water: (
      <>
        <path d="M12 2c-2 4-7 9-7 13a7 7 0 0 0 14 0c0-4-5-9-7-13Z" />
        <path d="M8 15a4 4 0 0 0 4 4" />
      </>
    ),
    book: (
      <>
        <path d="M12 5C8 2 4 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-2-1-6-2-10 1v15" />
      </>
    ),
    work: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="3" />
        <path d="M8 7V4h8v3M3 12c5 3 13 3 18 0M12 12v4" />
      </>
    ),
    walk: (
      <>
        <circle cx="14" cy="4" r="2" />
        <path d="m7 12 4-5 4 4 4 1M11 7l-1 9-4 5m5-8 5 3v5" />
      </>
    ),
    run: (
      <>
        <circle cx="15" cy="4" r="2" />
        <path d="m12 8-4-1-3 4m7-3 4 5 5 1M12 8l-3 6 4 3-2 5m-2-8-4 4H2" />
      </>
    ),
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L21 7a3.5 3.5 0 0 0-5-5L4 14l-1 7Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
      </>
    ),
    coffee: (
      <>
        <path d="M4 8h13v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm13 1h2a3 3 0 0 1 0 6h-2M7 2v3m6-3v3" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14c2 3 6 3 8 0M8 9h.01M16 9h.01" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

const schedule = [
  { time: "06:30", place: "Sebelum berangkat kampus" },
  { time: "10:30", place: "Peralihan Mata kuliah" },
  { time: "12:00", place: "Indom" },
  { time: "13:30", place: "Kontrakan" },
  { time: "14:00", place: "Kontrakan" },
  { time: "18:00", place: "Abis Lari" },
  { time: "22:00", place: "Di rumah" },
];

function getNextSchedule(now: Date) {
  const next =
    schedule.find((s) => {
      const [h, m] = s.time.split(":").map(Number);
      return h * 60 + m > now.getHours() * 60 + now.getMinutes();
    }) ?? schedule[0];
  const [h, m] = next.time.split(":").map(Number);
  const date = new Date(now);
  date.setHours(h, m, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 1);
  return { ...next, minutes: Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 60000)) };
}

function Cigarette({ burned = false, small = false }: { burned?: boolean; small?: boolean }) {
  return (
    <span className={`cigarette ${burned ? "burned" : ""} ${small ? "small" : ""}`}>
      <span className="cig-paper" />
      <span className="cig-filter" />
      <span className="cig-ember" />
    </span>
  );
}

function HangingWidget({
  remaining,
  consumed,
  burning,
  recovery,
}: {
  remaining: number;
  consumed: number;
  burning: boolean;
  recovery: Recovery | null;
}) {
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const start = useRef(0);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function release(impulse = angle) {
    setDragging(false);
    setSettling(true);
    let position = Math.abs(impulse) < 2 ? -20 : impulse;
    let velocity = 0;
    let previous = performance.now();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAngle(0);
      setSettling(false);
      return;
    }
    function tick(time: number) {
      const dt = Math.min((time - previous) / 1000, 0.032);
      previous = time;
      velocity += (-70 * position - 5 * velocity) * dt;
      position += velocity * dt;
      setAngle(position);
      if (Math.abs(position) > 0.05 || Math.abs(velocity) > 0.1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setAngle(0);
        setSettling(false);
      }
    }
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
  }
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);
    start.current = e.clientX;
    setSettling(false);
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  return (
    <div className={`hanging-scene ${burning ? "is-burning" : ""}`}>
      <div className="scene-orbit orbit-one" />
      <div className="scene-orbit orbit-two" />
      <span className="scene-plus plus-one">+</span>
      <span className="scene-plus plus-two">+</span>
      <div
        className={`hanging-object ${dragging ? "dragging" : ""} ${settling ? "settling" : ""}`}
        style={{ "--angle": `${angle}deg` } as CSSProperties}
        role="button"
        tabIndex={0}
        aria-label="Goyangkan tag sisa jatah"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          if (dragging) setAngle(Math.max(-28, Math.min(28, (e.clientX - start.current) / 4)));
        }}
        onPointerUp={() => release()}
        onPointerCancel={() => release()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            release(20);
          }
        }}
      >
        <div className="lanyard">
          <span />
          <span />
          <b className="lanyard-brand">pelan.</b>
        </div>
        <div className="lanyard-clip" aria-hidden="true">
          <i />
        </div>
        <div className="quota-tag">
          <div className="tag-slot" />
          <div className="tag-top">
            <Icon name={recovery ? "warning" : "leaf"} size={18} />
            <span>pelan.</span>
            <small>PERSONAL PACE CLUB</small>
          </div>
          <div className="tag-face">
            <span className="tag-label">
              {recovery ? `OVER LIMIT • +${recovery.excess} BATANG` : "JATAH TERSISA"}
            </span>
            <div key={remaining} className="tag-number">
              {recovery ? "00" : remaining.toString().padStart(2, "0")}
              <span>batang</span>
            </div>
            <div className="tag-face-meta">
              <span />
              {recovery ? "SAATNYA PEGANG KENDALI." : "SEDIKIT LEBIH BAIK, SETIAP HARI."}
            </div>
          </div>
          <div className="tag-bottom">
            <span>
              {recovery ? "Tahan batang berikutnya." : "Satu hari dulu."}
              <br />
              {recovery ? "Mulai lagi, tanpa menghakimi." : "At your own pace."}
            </span>
            <span className="tag-star">
              <Icon name="spark" size={25} />
            </span>
          </div>
        </div>
      </div>
      <div className="cig-cluster" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <div key={n} className={`scene-cig scene-cig-${n}`}>
            <Cigarette burned={(burning && n === 0) || consumed > 3 + n} />
          </div>
        ))}
        {burning && (
          <div className="smoke">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <span className="drag-hint">
        <svg width="30" height="23" viewBox="0 0 30 23" fill="none">
          <path
            d="M2 2c1 13 12 17 25 12m-5-3 6 3-4 6"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>{" "}
        coba goyangkan!
      </span>
    </div>
  );
}

type Organizer = { tab: "tasks" | "activities"; mode: "list" | "form"; editingId: string | null };

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("pelan.appearance") !== "light";
    } catch {
      return true;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState(new Date());
  const [prototype, setPrototype] = useState(() => {
    try {
      return restorePrototype(localStorage.getItem(PROTOTYPE_STORAGE_KEY), Date.now());
    } catch {
      return restorePrototype(null, Date.now());
    }
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  const tracker = prototype.simulation ?? prototype.current;
  const { quota, consumed, checkedIn, recovery, remTotal } = tracker;
  const redAlert = recovery !== null;
  const recoveryActive = recovery?.expiresAt != null;
  const limit = dailyLimit(tracker);
  const heroConsumed = recovery?.consumed ?? consumed;
  const heroQuota = recovery?.quota ?? quota;
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaDraft, setQuotaDraft] = useState("5");
  const [workspace, setWorkspace] = useState(() => {
    try {
      return restoreWorkspace(localStorage.getItem(WORKSPACE_STORAGE_KEY));
    } catch {
      return restoreWorkspace(null);
    }
  });
  const [workspaceStorageAvailable, setWorkspaceStorageAvailable] = useState(true);
  const { tasks, activities, completedActivityIds: selectedActivities } = workspace;
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    category: "",
    minutes: "",
    status: "On going" as TaskStatus,
  });
  const [activityDraft, setActivityDraft] = useState({ label: "", icon: "book" as ActivityIcon });
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [microTask, setMicroTask] = useState<string | null>(null);
  const microTaskRecord = tasks.find((task) => task.id === microTask);
  const [microDone, setMicroDone] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [burning, setBurning] = useState(false);
  const [missionStarted, setMissionStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [xp, setXp] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const [checkinCount, setCheckinCount] = useState(2);
  const [mood, setMood] = useState("Fokus");
  const [ritual, setRitual] = useState(false);
  const [notificationTime, setNotificationTime] = useState("13:00");
  const [banner, setBanner] = useState(false);
  const notified = useRef(new Set<string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const remaining = Math.max(0, limit - consumed);
  const usedPercentage =
    heroQuota === 0 ? (heroConsumed > 0 ? 100 : 0) : (heroConsumed / heroQuota) * 100;
  const nextSchedule = getNextSchedule(now);
  const complete = tasks.filter((task) => task.status === "Done").length;
  const categories = [
    ...new Set([
      "Kuliah",
      "Intern ML/AI",
      "Personal",
      "Kesehatan",
      ...tasks.map((task) => task.category),
    ]),
  ];

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
      setWorkspaceStorageAvailable(true);
    } catch {
      setWorkspaceStorageAvailable(false);
    }
  }, [workspace]);
  useEffect(() => {
    setWorkspace((current) => refreshActivityDay(current, now));
  }, [now]);

  function toggleActivity(id: string) {
    setWorkspace((current) => ({
      ...current,
      completedActivityIds: current.completedActivityIds.includes(id)
        ? current.completedActivityIds.filter((selectedId) => selectedId !== id)
        : [...current.completedActivityIds, id],
    }));
  }
  function changeTaskStatus(id: string, status: TaskStatus) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, status } : task)),
    }));
  }
  function openOrganizer(tab: Organizer["tab"]) {
    setOrganizer({ tab, mode: "list", editingId: null });
    setPendingDelete(null);
    setFormError("");
  }
  function openTaskEditor(task?: Task) {
    setTaskDraft(
      task
        ? {
            title: task.title,
            category: task.category,
            minutes: String(task.minutes),
            status: task.status,
          }
        : { title: "", category: "", minutes: "", status: "On going" },
    );
    setOrganizer({ tab: "tasks", mode: "form", editingId: task?.id ?? null });
    setFormError("");
    setPendingDelete(null);
  }
  function openActivityEditor(id?: string) {
    const activity = activities.find((item) => item.id === id);
    setActivityDraft(
      activity ? { label: activity.label, icon: activity.icon } : { label: "", icon: "book" },
    );
    setOrganizer({ tab: "activities", mode: "form", editingId: activity?.id ?? null });
    setFormError("");
    setPendingDelete(null);
  }
  function saveOrganizer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizer) return;
    const id = organizer.editingId ?? crypto.randomUUID();
    if (organizer.tab === "tasks") {
      const draft = {
        ...taskDraft,
        title: taskDraft.title.trim(),
        category: taskDraft.category.trim(),
        minutes: Number(taskDraft.minutes),
      };
      const error = validateTask(draft);
      if (error) {
        setFormError(error);
        return;
      }
      const task = { id, ...draft };
      setWorkspace((current) => ({
        ...current,
        tasks: organizer.editingId
          ? current.tasks.map((item) => (item.id === id ? task : item))
          : [task, ...current.tasks],
      }));
    } else {
      const draft = { ...activityDraft, label: activityDraft.label.trim() };
      const error = validateActivity(draft, activities, organizer.editingId ?? undefined);
      if (error) {
        setFormError(error);
        return;
      }
      const activity = { id, ...draft };
      setWorkspace((current) => ({
        ...current,
        activities: organizer.editingId
          ? current.activities.map((item) => (item.id === id ? activity : item))
          : [...current.activities, activity],
      }));
    }
    notify(
      `${organizer.tab === "tasks" ? "Tugas" : "Aktivitas"} ${organizer.editingId ? "diperbarui" : "ditambahkan"}.`,
    );
    setOrganizer({ ...organizer, mode: "list", editingId: null });
    setFormError("");
  }

  function updateTracker(update: (current: DailyTracker) => DailyTracker) {
    setPrototype((state) => {
      const key = state.simulation ? "simulation" : "current";
      const current = normalizeTracker(state[key]!, Date.now());
      return { ...state, [key]: markOverLimit(update(current)) };
    });
  }

  useEffect(() => {
    try {
      localStorage.setItem(PROTOTYPE_STORAGE_KEY, JSON.stringify(prototype));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [prototype]);
  useEffect(() => {
    setPrototype((state) => normalizePrototype(state, now.getTime()));
  }, [now]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (missionStarted)
      setElapsed(Math.max(0, Math.floor((now.getTime() - missionStarted) / 1000)));
    for (const s of schedule) {
      const [h, m] = s.time.split(":").map(Number);
      const key = `${now.toDateString()}-${s.time}`;
      if (
        now.getHours() * 60 + now.getMinutes() === h * 60 + m - 15 &&
        !notified.current.has(key)
      ) {
        notified.current.add(key);
        setNotificationTime(s.time);
        setBanner(true);
      }
    }
  }, [now, missionStarted]);
  useEffect(() => {
    if (!quotaOpen && microTask === null && organizer === null) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      );
    const initialFocus = dialog?.querySelector<HTMLElement>("[data-initial-focus]");
    if (initialFocus) initialFocus.focus();
    else if (!quotaOpen) focusable()?.[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuotaOpen(false);
        setMicroTask(null);
        setOrganizer(null);
      }
      if (e.key === "Tab") {
        const elements = focusable();
        const first = elements?.[0];
        const last = elements?.[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [quotaOpen, microTask, organizer]);
  useEffect(() => {
    const color = redAlert ? (dark ? "#16090B" : "#FFF7F8") : dark ? "#222222" : "#F5F5F5";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
    document.documentElement.style.backgroundColor = color;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("pelan.appearance", dark ? "dark" : "light");
    } catch {}
  }, [dark, redAlert]);
  useEffect(() => {
    if (!menuOpen) return;
    document.querySelector<HTMLElement>("#main-navigation button")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.querySelector<HTMLElement>(".menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  useEffect(() => {
    setNavHidden(false);
    let lastY = Math.max(0, window.scrollY);
    let frame = 0;
    const updateNavbar = () => {
      frame = 0;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.max(0, Math.min(window.scrollY, maxY));
      const keyboardFocus =
        navbarRef.current?.contains(document.activeElement) &&
        document.activeElement?.matches(":focus-visible");
      if (
        y <= 96 ||
        menuOpen ||
        quotaOpen ||
        microTask !== null ||
        organizer !== null ||
        keyboardFocus
      ) {
        setNavHidden(false);
        lastY = y;
        return;
      }
      // Ignore tiny movements so the navbar doesn't flicker while scrolling.
      if (Math.abs(y - lastY) < 8) return;
      setNavHidden(y > lastY);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateNavbar);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [menuOpen, quotaOpen, microTask, organizer, page]);

  function notify(message: string) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3600);
  }
  function navigate(next: Page) {
    setPage(next);
    setMenuOpen(false);
    if (next === "checkin") {
      setStep(1);
      setCheckinCount(consumed);
    }
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }
  function logCigarette() {
    updateTracker((current) => ({ ...current, consumed: current.consumed + 1 }));
    setBurning(true);
    setTimeout(() => setBurning(false), 1800);
    notify(
      consumed + 1 > limit
        ? "Jatah terlewati. Tahan batang berikutnya; catat dengan jujur, tanpa menghakimi."
        : `1 batang tercatat. Sisa jatah: ${Math.max(0, limit - consumed - 1)} batang.`,
    );
  }
  function startMission() {
    if (!missionStarted) {
      setMissionStarted(Date.now());
      setElapsed(0);
      setXp(0);
    }
    setBanner(false);
    navigate("mission");
  }
  function rejectOffer() {
    setXp((x) => x + 1);
    const id = Date.now() + Math.random();
    setParticles((p) => [...p, id]);
    setTimeout(() => setParticles((p) => p.filter((x) => x !== id)), 1600);
  }
  function finishCheckin() {
    updateTracker((current) => completeCheckin(current, checkinCount, Date.now()));
    navigate("home");
    notify(
      checkinCount > limit || recoveryActive
        ? "Check-in tersimpan. Mode pemulihan aktif. Fokus menahan batang berikutnya."
        : "Check-in selesai. Terima kasih sudah hadir untuk dirimu hari ini.",
    );
  }
  function activateRemTotal() {
    updateTracker((current) => ({
      ...current,
      remTotal: true,
    }));
    notify("Rem Total aktif: target hari ini 0 batang. Jatah mingguan tetap tersimpan.");
    startMission();
  }
  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = `${Math.floor(elapsed / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((elapsed / 60) % 60)
    .toString()
    .padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`app ${dark ? "dark" : ""} ${redAlert ? "red-alert" : ""}`}>
      <div className="page-shell">
        <nav
          ref={navbarRef}
          className={`navbar ${menuOpen ? "menu-open" : ""} ${navHidden ? "is-scroll-hidden" : ""}`}
          aria-label="Navigasi utama"
          onFocusCapture={() => setNavHidden(false)}
        >
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="Kembali ke beranda"
          >
            <span className="brand-symbol">
              <Icon name="leaf" size={21} />
            </span>
            pelan<span className="brand-dot">.</span>
          </button>
          <div className="nav-links" id="main-navigation">
            <button className={page === "home" ? "active" : ""} onClick={() => navigate("home")}>
              Beranda
            </button>
            <button className={page === "mission" ? "active" : ""} onClick={startMission}>
              Mode Misi <span className="tiny-dot" />
            </button>
            <button
              className={page === "checkin" ? "active" : ""}
              onClick={() => navigate("checkin")}
            >
              Check-in
            </button>
            <button
              className={`mobile-nav-item ${page === "notifications" ? "active" : ""}`}
              onClick={() => navigate("notifications")}
            >
              Notifikasi <Icon name="bell" size={16} />
            </button>
            <button
              className="mobile-nav-item"
              onClick={() => {
                setQuotaDraft(String(quota));
                setQuotaOpen(true);
                setMenuOpen(false);
              }}
            >
              Atur jatah mingguan <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="nav-actions">
            <button
              className="icon-button notification-button"
              aria-label="Preview notifikasi"
              onClick={() => navigate("notifications")}
            >
              <Icon name="bell" size={19} />
              <span />
            </button>
            <button
              className="icon-button theme-button"
              aria-label={dark ? "Aktifkan light mode" : "Aktifkan dark mode"}
              onClick={() => {
                setDark((d) => !d);
              }}
            >
              <Icon name={dark ? "sun" : "moon"} size={19} />
            </button>
            <button
              className="target-pill"
              onClick={() => {
                setQuotaDraft(String(quota));
                setQuotaOpen(true);
              }}
            >
              <span />
              @target-mingguan
              <Icon name="arrow" size={14} />
            </button>
            <button
              className="icon-button menu-toggle"
              aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={27} />
            </button>
          </div>
        </nav>

        {recovery && (
          <aside className="recovery-banner" aria-label="Status mode peringatan">
            <span className="recovery-banner-icon">
              <Icon name="warning" size={21} />
            </span>
            <div>
              <strong>Mode Peringatan Aktif</strong>
              <span>
                {recoveryActive
                  ? "Jeda dulu. Tahan batang berikutnya."
                  : "Jatah harian terlewati. Mulai pemulihan lewat check-in."}
              </span>
            </div>
            {recovery.expiresAt !== null ? (
              <span className="recovery-deadline">
                Berakhir dalam{" "}
                <time role="timer" aria-label="Sisa waktu pemulihan">
                  {countdown(recovery.expiresAt, now.getTime())}
                </time>
              </span>
            ) : (
              <button onClick={() => navigate("checkin")}>
                Check-in sekarang <Icon name="arrow" size={15} />
              </button>
            )}
          </aside>
        )}
        <div className="dashboard-topline">
          <span>
            <span className="status-dot" /> RUANG TUMBUHMU, SETIAP HARI
          </span>
          <details className="prototype-tools">
            <summary>
              Mode simulasi <Icon name="chevron" size={12} />
            </summary>
            <div className="simulation-toolbar">
              <span>
                SIMULASI{" "}
                {prototype.simulation && (
                  <span className="simulation-indicator">• Data asli tidak diubah</span>
                )}
              </span>
              <div className="simulation-controls" aria-label="Simulasi tema">
                <button
                  aria-label="Simulasi Normal Blue Mode"
                  aria-pressed={prototype.simulation !== null && !redAlert}
                  onClick={() => {
                    setPrototype((state) => ({ ...state, simulation: initialTracker(Date.now()) }));
                    setMissionStarted(null);
                  }}
                >
                  <span className="mode-dot normal-dot" />
                  Normal Blue
                </button>
                <button
                  aria-label="Simulasi Over-Limit Red Alert Mode (24 Jam)"
                  aria-pressed={prototype.simulation !== null && redAlert}
                  onClick={() => {
                    setPrototype((state) => ({ ...state, simulation: redSimulation(Date.now()) }));
                    setMissionStarted(null);
                  }}
                >
                  <span className="mode-dot red-dot" />
                  Over-Limit Red
                </button>
              </div>
              {prototype.simulation && (
                <button
                  className="exit-simulation"
                  onClick={() => {
                    setPrototype((state) => ({ ...state, simulation: null }));
                    setMissionStarted(null);
                  }}
                >
                  Keluar simulasi <Icon name="close" size={13} />
                </button>
              )}
            </div>
          </details>
        </div>
        {(!storageAvailable || !workspaceStorageAvailable) && (
          <p className="storage-notice storage-fallback" role="status">
            Penyimpanan lokal tidak tersedia; perubahan hanya berlaku di sesi ini.
          </p>
        )}

        <main>
          {page === "home" && (
            <div className="home-page page-enter">
              <section className="hero-card">
                <div className="hero-content">
                  <header className="page-heading">
                    <span className="hero-greeting">
                      Halo, ini ruang <strong>tumbuhmu.</strong>
                    </span>
                    <h1>
                      Satu hari.
                      <br />
                      Lebih baik<span className="blue">.</span>
                    </h1>
                    <p>
                      Kerja lebih ringan, hidup lebih terkendali. Nggak harus sempurna. Satu langkah
                      dulu, ya.
                    </p>
                  </header>
                  <span className="section-label">
                    <span className="label-icon">
                      <Icon name="leaf" size={15} />
                    </span>{" "}
                    {redAlert ? "OVER LIMIT · WAKTUNYA PEMULIHAN" : "LEBIH SEDIKIT, LEBIH BERARTI"}
                  </span>
                  <h2>
                    {recoveryActive ? "Catatan Check-in Terakhir" : "Jatah Harian Minggu Ini"}
                  </h2>
                  <div className={`quota-display ${heroConsumed >= 100 ? "long-count" : ""}`}>
                    <span key={heroConsumed} className="count-enter">
                      {heroConsumed}
                    </span>
                    <span className="quota-divider">/</span>
                    <span className="quota-target">{heroQuota}</span>
                    <span className="quota-unit">Batang</span>
                  </div>
                  <p className="hero-caption">
                    {recovery ? (
                      recoveryActive ? (
                        <>
                          Jatah kemarin jebol (<strong>+{recovery.excess} batang</strong>). Hari ini
                          fokus rem total di Kontrakan & jam 22:00.
                        </>
                      ) : (
                        <>
                          Jatah hari ini terlewati (<strong>+{recovery.excess} batang</strong>).
                          Tahan batang berikutnya dan selesaikan check-in.
                        </>
                      )
                    ) : (
                      <>
                        Kamu masih punya <strong>{remaining} batang</strong> untuk hari ini.
                        <br /> Bukan soal sempurna, tapi terus berusaha.
                      </>
                    )}
                  </p>
                  <div
                    className="quota-track"
                    aria-label={`${heroConsumed} dari ${heroQuota} batang terpakai`}
                  >
                    <span style={{ width: `${Math.min(100, usedPercentage)}%` }} />
                  </div>
                  <div className="track-label">
                    <span>
                      {heroQuota === 0 && redAlert
                        ? "Target 0 batang terlewati"
                        : `${Math.round(usedPercentage)}% jatah terpakai`}
                      {redAlert &&
                        (recoveryActive
                          ? " — Mode Pemulihan 24 Jam Aktif"
                          : " — Melebihi Jatah Harian")}
                    </span>
                    {!redAlert && <span>Target: {quota} batang / hari</span>}
                  </div>
                  <button
                    className="button primary"
                    onClick={() => {
                      if (redAlert) {
                        if (remTotal) startMission();
                        else activateRemTotal();
                        return;
                      }
                      setQuotaDraft(String(quota));
                      setQuotaOpen(true);
                    }}
                  >
                    {redAlert
                      ? remTotal
                        ? "Lanjutkan Rem Total (0 Batang)"
                        : "Aktifkan Mode Rem Total (0 Batang)"
                      : "Atur Jatah Minggu Ini"}
                    <Icon name="arrow" size={17} />
                  </button>
                  <span className="hero-footnote">
                    <Icon name="flag" size={13} />{" "}
                    {remTotal
                      ? `Rem Total aktif · Target hari ini 0 batang · Tercatat ${consumed} batang`
                      : redAlert
                        ? "Pengingat untuk berhenti sejenak, bukan untuk menyalahkan diri."
                        : "Pelan-pelan berkurang, bukan langsung hilang."}
                  </span>
                </div>
                <HangingWidget
                  remaining={remaining}
                  consumed={consumed}
                  burning={burning}
                  recovery={recovery}
                />
                <div className="hero-corner-label">
                  <span /> YOUR PACE. YOUR PROGRESS.
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <span className="eyebrow">YANG PENTING HARI INI</span>
                  <h2>
                    Ruang untuk fokus<span className="blue">.</span>
                  </h2>
                </div>
                <span className="section-date">{dateLabel}</span>
              </div>
              <div className="dashboard-grid">
                <section className="card risk-card">
                  <div className="card-topline">
                    <span className="card-icon blue-tint">
                      <Icon name="clock" size={21} />
                    </span>
                    <span className="live-badge">
                      <span /> LIVE REMINDER
                    </span>
                  </div>
                  <h2>Kenali jam rawanmu.</h2>
                  <p className="card-description">Siapkan diri sebelum tawaran berikutnya.</p>
                  <div className="countdown-block">
                    <span className="countdown-number">
                      {nextSchedule.minutes < 60
                        ? nextSchedule.minutes
                        : Math.floor(nextSchedule.minutes / 60)}
                      <span>
                        {nextSchedule.minutes < 60
                          ? "menit lagi"
                          : `jam ${nextSchedule.minutes % 60} menit lagi`}
                      </span>
                    </span>
                    <span className="countdown-target">
                      menuju {nextSchedule.time}
                      <br />
                      <strong>{nextSchedule.place}</strong>
                    </span>
                  </div>
                  <div className="schedule-pills">
                    {schedule.map((s) => (
                      <button
                        key={s.time}
                        className={s.time === nextSchedule.time ? "selected" : ""}
                        onClick={() => {
                          setNotificationTime(s.time);
                          navigate("notifications");
                        }}
                      >
                        {s.time}
                        {s.time === "22:00" && <span>rumah</span>}
                      </button>
                    ))}
                  </div>
                  <div className="card-buttons">
                    <button className="button primary" onClick={startMission}>
                      Mulai Misi Basecamp
                      <Icon name="arrow" size={16} />
                    </button>
                    <button className="button outline" onClick={logCigarette}>
                      <Icon name="plus" size={16} />
                      Catat 1 Batang
                    </button>
                  </div>
                </section>

                <section className="card tasks-card">
                  <div className="card-topline">
                    <span className="card-icon neutral-tint">
                      <Icon name="grid" size={20} />
                    </span>
                    <span className="subtle-badge">
                      {complete} dari {tasks.length} selesai
                    </span>
                  </div>
                  <h2>Sedikit tugas, lebih fokus.</h2>
                  <p className="card-description">
                    Tiga tugas teratas untuk fokus. Sisanya tetap tersimpan.
                  </p>
                  <div className="workspace-card-actions">
                    <button className="button outline" onClick={() => openOrganizer("tasks")}>
                      Kelola tugas <Icon name="edit" size={14} />
                    </button>
                    <button className="button primary" onClick={() => openTaskEditor()}>
                      <Icon name="plus" size={15} />
                      Tambah tugas
                    </button>
                  </div>
                  <div className="task-list">
                    {tasks.slice(0, 3).map((task) => (
                      <div
                        className={`task-row editable-task-row ${task.status === "Done" ? "is-done" : ""}`}
                        key={task.id}
                      >
                        <button
                          className="task-checkbox"
                          aria-label={`${task.status === "Done" ? "Batalkan" : "Selesaikan"} ${task.title}`}
                          aria-pressed={task.status === "Done"}
                          onClick={() =>
                            changeTaskStatus(task.id, task.status === "Done" ? "On going" : "Done")
                          }
                        >
                          {task.status === "Done" && <Icon name="check" size={15} />}
                        </button>
                        <div className="task-text">
                          <span>{task.title}</span>
                          <small>
                            {task.category}
                            <span>·</span>
                            {task.minutes} menit
                          </small>
                          <div className="task-row-controls">
                            <select
                              className={`task-status status-${task.status.toLowerCase().replace(" ", "-")}`}
                              aria-label={`Status ${task.title}`}
                              value={task.status}
                              onChange={(event) =>
                                changeTaskStatus(task.id, event.target.value as TaskStatus)
                              }
                            >
                              {TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            {task.status !== "Done" && (
                              <button className="break-task" onClick={() => setMicroTask(task.id)}>
                                <Icon name="spark" size={12} />
                                Pecah Tugas
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          className="icon-button edit-task-button"
                          aria-label={`Edit tugas ${task.title}`}
                          onClick={() => openTaskEditor(task)}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="workspace-empty">
                        <Icon name="grid" size={25} />
                        <p>Belum ada tugas. Mulai dari satu hal kecil.</p>
                        <button onClick={() => openTaskEditor()}>
                          Tambah tugas pertama <Icon name="plus" size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {tasks.length > 3 && (
                    <button className="workspace-see-all" onClick={() => openOrganizer("tasks")}>
                      Lihat semua {tasks.length} tugas <Icon name="arrow" size={14} />
                    </button>
                  )}
                  <div className="task-footnote">
                    <Icon name="spark" size={15} />
                    <span>Tugas terasa berat? Mulai dari 5 menit saja.</span>
                  </div>
                </section>
              </div>
              <section className="card personal-activities-card">
                <div className="activities-heading">
                  <div>
                    <span className="eyebrow">RITMEMU, PILIHANMU</span>
                    <h2>Aktivitas yang berarti.</h2>
                    <p className="card-description">
                      Pilih yang sudah dikerjakan hari ini. Pilihanmu ikut muncul di check-in.
                    </p>
                  </div>
                  <button className="button outline" onClick={() => openOrganizer("activities")}>
                    Kelola aktivitas <Icon name="edit" size={15} />
                  </button>
                </div>
                <div className="activity-grid home-activity-grid">
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      className={`activity-option ${selectedActivities.includes(activity.id) ? "active" : ""}`}
                      aria-pressed={selectedActivities.includes(activity.id)}
                      onClick={() => toggleActivity(activity.id)}
                    >
                      <Icon name={activity.icon} size={25} />
                      <span>{activity.label}</span>
                      {selectedActivities.includes(activity.id) && <Icon name="check" size={14} />}
                    </button>
                  ))}
                  <button
                    className="activity-option add-activity-option"
                    onClick={() => openActivityEditor()}
                  >
                    <Icon name="plus" size={24} />
                    <span>Aktivitas baru</span>
                  </button>
                </div>
              </section>
              <div className="bottom-note">
                <Icon name="leaf" size={17} />
                <span>Kamu nggak harus langsung hebat. Cukup lebih baik dari kemarin.</span>
                <span className="note-line" />
                <span className="note-small">DIBUAT UNTUK PROGRES, BUKAN PERFEKSI.</span>
              </div>
            </div>
          )}

          {page === "mission" && (
            <div className="mission-page page-enter">
              <div className="subpage-back">
                <button onClick={() => navigate("home")}>
                  <span>←</span> Kembali ke beranda
                </button>
                <span className="live-badge">
                  <span /> MISI BERLANGSUNG
                </span>
              </div>
              <header className="center-heading">
                <span className="eyebrow">SOCIAL SURVIVAL MODE</span>
                <h1>
                  Tetap nongkrong.
                  <br />
                  Tetap pegang kendali<span className="blue">.</span>
                </h1>
                <p>Kamu bisa menikmati momennya, tanpa harus menerima semuanya.</p>
              </header>
              <section className={`mission-card ${particles.length ? "pulse" : ""}`}>
                <div className="mission-location">
                  <span className="status-dot" /> Basecamp Prodi
                </div>
                <span className="timer-caption">WAKTU UNTUK TETAP JADI DIRIMU</span>
                <div className="mission-timer">{timeLabel}</div>
                <div className="remaining-badge">
                  <Icon name="leaf" size={17} /> Sisa jatah hari ini:{" "}
                  <strong>{remaining} batang</strong>
                </div>
                {remTotal && (
                  <p className="rem-total-status">
                    <Icon name="check" size={14} /> Rem Total aktif · Target 0 batang
                  </p>
                )}
                <div className="xp-container">
                  <div className="xp-orbit">
                    <Icon name="spark" size={38} />
                  </div>
                  <span className="xp-total">
                    {xp}
                    <small>Tawaran ditolak</small>
                  </span>
                </div>
                <div className="reject-button-wrap">
                  <button className="button primary big-button" onClick={rejectOffer}>
                    <Icon name="spark" />
                    Tahan 1 Tawaran <span>+1 XP</span>
                  </button>
                  {particles.map((id) => (
                    <div className="xp-particles" key={id}>
                      <span>+1 XP</span>
                      {Array.from({ length: 9 }, (_, i) => (
                        <i key={i} style={{ "--i": i } as CSSProperties} />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mission-encouragement">
                  “Nggak dulu, lagi ngurangin.” Sudah cukup, kok.
                </p>
                <button
                  className="button outline finish-mission"
                  onClick={() => {
                    setMissionStarted(null);
                    navigate("home");
                    notify(`Misi selesai. ${xp} tawaran ditolak. Kamu hebat sudah berusaha!`);
                  }}
                >
                  Selesai Nongkrong
                  <Icon name="arrow" size={17} />
                </button>
              </section>
              <p className="page-bottom-copy">
                Hadir untuk temanmu. Tetap pilih yang baik untuk dirimu.
              </p>
            </div>
          )}

          {page === "checkin" && (
            <div className="checkin-page page-enter">
              <div className="subpage-back">
                <button onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate("home"))}>
                  <span>←</span> {step > 1 ? "Langkah sebelumnya" : "Kembali ke beranda"}
                </button>
                <span className="eyebrow">DAILY CHECK-IN</span>
              </div>
              <div className="checkin-layout">
                <header className="checkin-intro">
                  <span className="eyebrow">
                    <Icon name="moon" size={15} /> WAKTU UNTUK DIRIMU
                  </span>
                  <h1>
                    Hari ini, <br />
                    kamu sudah <br />
                    berusaha<span className="blue">.</span>
                  </h1>
                  <p>
                    Tarik napas sebentar. Yuk, tutup harimu dengan sedikit refleksi, tanpa
                    menghakimi.
                  </p>
                  <div className="checkin-quote">
                    <Icon name="leaf" size={26} />
                    <p>
                      Progres kecil tetaplah progres.
                      <br />
                      Dan itu layak dirayakan.
                    </p>
                  </div>
                  <span className="checkin-duration">
                    <Icon name="clock" size={15} /> Cuma butuh 1 menit
                  </span>
                </header>
                <section className="checkin-card card">
                  <div className="stepper">
                    {[1, 2, 3].map((s, i) => (
                      <div className="stepper-item" key={s}>
                        <button
                          className={`step-circle ${step === s ? "active" : ""} ${step > s ? "completed" : ""}`}
                          onClick={() => {
                            if (s < step) setStep(s);
                          }}
                          disabled={s > step}
                          aria-label={`Langkah ${s}`}
                          aria-current={s === step ? "step" : undefined}
                        >
                          {step > s ? <Icon name="check" size={19} /> : `0${s}`}
                        </button>
                        {i < 2 && <span className={step > s ? "filled" : ""} />}
                      </div>
                    ))}
                  </div>
                  <div className="step-content page-enter" key={step}>
                    <span className="step-label">LANGKAH 0{step} DARI 03</span>
                    <h2>
                      {step === 1
                        ? "Apa yang selesai hari ini?"
                        : step === 2
                          ? "Berapa batang hari ini?"
                          : "Gimana perasaanmu?"}
                    </h2>
                    <p>
                      {step === 1
                        ? "Hal kecil juga layak masuk daftar."
                        : step === 2
                          ? "Jujur pada diri sendiri. Nggak ada penghakiman."
                          : "Apapun rasanya, semua perasaanmu valid."}
                    </p>
                    {step === 1 && (
                      <>
                        <div className="activity-grid">
                          {activities.map((a) => (
                            <button
                              key={a.id}
                              className={`activity-option ${selectedActivities.includes(a.id) ? "active" : ""}`}
                              aria-pressed={selectedActivities.includes(a.id)}
                              onClick={() => toggleActivity(a.id)}
                            >
                              <Icon name={a.icon} size={25} />
                              <span>{a.label}</span>
                              {selectedActivities.includes(a.id) && <Icon name="check" size={14} />}
                            </button>
                          ))}
                          <button
                            className="activity-option add-activity-option"
                            onClick={() => openActivityEditor()}
                          >
                            <Icon name="plus" size={25} />
                            <span>Aktivitas baru</span>
                          </button>
                        </div>
                        <button
                          className="workspace-see-all"
                          onClick={() => openOrganizer("activities")}
                        >
                          Kelola aktivitas sendiri <Icon name="edit" size={14} />
                        </button>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <div
                          className={`cigarette-counter ${checkinCount > limit ? "counter-over-limit" : ""}`}
                        >
                          <div className="cigarette-row">
                            {Array.from({ length: Math.min(12, checkinCount) }, (_, i) => (
                              <Cigarette key={i} small />
                            ))}
                            {checkinCount === 0 && (
                              <div className="zero-cigarettes">
                                <Icon name="leaf" size={38} />
                                <span>Hari tanpa rokok. Hebat!</span>
                              </div>
                            )}
                            {checkinCount > 12 && (
                              <span className="more-cigarettes">+{checkinCount - 12}</span>
                            )}
                          </div>
                          <div className="counter-controls">
                            <button
                              className="round-button"
                              disabled={checkinCount === 0}
                              aria-label="Kurangi satu batang"
                              onClick={() => setCheckinCount((c) => Math.max(0, c - 1))}
                            >
                              <Icon name="minus" />
                            </button>
                            <span key={checkinCount} className="count-enter">
                              {String(checkinCount).padStart(2, "0")}
                              <small>batang</small>
                            </span>
                            <button
                              className="round-button"
                              disabled={checkinCount >= 99}
                              aria-label="Tambah satu batang"
                              onClick={() => setCheckinCount((c) => Math.min(99, c + 1))}
                            >
                              <Icon name="plus" />
                            </button>
                          </div>
                        </div>
                        <div
                          className={`quota-warning ${checkinCount > limit ? "over-limit" : ""}`}
                          role="status"
                        >
                          {checkinCount > limit ? (
                            <>
                              <Icon name="flag" size={15} />
                              {recoveryActive
                                ? "Melebihi Jatah Harian — Mode Pemulihan Tetap Aktif"
                                : "Melebihi Jatah Harian — Tema Merah 24 Jam Akan Aktif"}
                            </>
                          ) : (
                            <>
                              <Icon name="check" size={15} />
                              Masih dalam jatah harian ({limit} batang)
                            </>
                          )}
                        </div>
                      </>
                    )}
                    {step === 3 && (
                      <>
                        <div className={`mood-illustration mood-${mood}`}>
                          <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" />
                            {mood === "Fokus" ? (
                              <>
                                <path
                                  d="M29 40h8m26 0h8M32 62q18 18 36 0"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </>
                            ) : mood === "Capek" ? (
                              <>
                                <path
                                  d="m27 39 12 3m22 0 12-3M39 65h22"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </>
                            ) : (
                              <>
                                <path
                                  d="m28 34 12 7m20 0 12-7M35 68q15-14 30 0"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="mood-options">
                          {["Capek", "Fokus", "Stres"].map((m) => (
                            <button
                              className={mood === m ? "active" : ""}
                              key={m}
                              aria-pressed={mood === m}
                              onClick={() => setMood(m)}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        <button
                          className={`ritual-card ${ritual ? "selected" : ""}`}
                          aria-pressed={ritual}
                          onClick={() => setRitual((v) => !v)}
                        >
                          <Icon name="water" size={26} />
                          <span>
                            <small>RITUAL JAM 22:00</small>Sikat gigi & minum air dingin sebelum
                            tidur
                          </span>
                          <span className="ritual-check">
                            {ritual && <Icon name="check" size={13} />}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    className="button primary checkin-next"
                    onClick={() => (step < 3 ? setStep((s) => s + 1) : finishCheckin())}
                  >
                    {step === 3 ? "Selesai Check-in" : "Lanjut"}
                    <Icon name={step === 3 ? "check" : "arrow"} size={18} />
                  </button>
                </section>
              </div>
            </div>
          )}

          {page === "notifications" && (
            <div className="notifications-page page-enter">
              <div className="subpage-back">
                <button onClick={() => navigate("home")}>
                  <span>←</span> Kembali ke beranda
                </button>
                <span className="eyebrow">PREVIEW NOTIFIKASI</span>
              </div>
              <header className="center-heading">
                <span className="eyebrow">PENGINGAT KECIL. DAMPAK BESAR.</span>
                <h1>
                  Selangkah sebelum
                  <br />
                  jam rawan<span className="blue">.</span>
                </h1>
                <p>Pengingat lembut, 15 menit sebelum kamu membutuhkannya.</p>
              </header>
              <div className="notification-layout">
                <section className="notification-settings card">
                  <span className="card-icon blue-tint">
                    <Icon name="bell" size={22} />
                  </span>
                  <h2>Pengingat yang tepat waktu.</h2>
                  <p>Pilih jadwal untuk melihat simulasi notifikasi di layar kunci.</p>
                  <div className="notification-schedules">
                    {schedule.map((s) => {
                      const [h, m] = s.time.split(":").map(Number);
                      const t = h * 60 + m - 15;
                      return (
                        <button
                          key={s.time}
                          className={notificationTime === s.time ? "active" : ""}
                          onClick={() => setNotificationTime(s.time)}
                        >
                          <Icon name={s.time === "22:00" ? "moon" : "clock"} size={19} />
                          <span>
                            <strong>
                              {String(Math.floor(t / 60)).padStart(2, "0")}:
                              {String(t % 60).padStart(2, "0")}
                            </strong>
                            <small>
                              Jam rawan {s.time} · {s.place}
                            </small>
                          </span>
                          <span className="radio-dot" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="preview-disclaimer">
                    <Icon name="bell" size={15} /> Ini simulasi. Pengingat dalam aplikasi aktif saat
                    halaman terbuka, bukan push latar belakang.
                  </div>
                </section>
                <section className="lockscreen">
                  <div className="lockscreen-camera" />
                  <div className="lockscreen-date">{dateLabel}</div>
                  <div className="lockscreen-time">
                    {(() => {
                      const [h, m] = notificationTime.split(":").map(Number);
                      const t = h * 60 + m - 15;
                      return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
                    })()}
                  </div>
                  <div className="notification-preview" key={notificationTime}>
                    <div className="notification-header">
                      <span className="notification-app">
                        <Icon name="leaf" size={15} />
                      </span>
                      <strong>pelan.</strong>
                      <span>sekarang</span>
                    </div>
                    <strong>Waktunya siap-siap, bukan khawatir.</strong>
                    <p>
                      15 menit lagi jam {notificationTime} (
                      {notificationTime === "22:00" ? "Di rumah" : "Basecamp Prodi"}). Sisa jatah
                      hari ini: {remaining} batang. Siap aktifkan Mode Misi Basecamp?
                    </p>
                    <div className="notification-quick-actions">
                      <button onClick={startMission}>
                        Mulai Misi
                        <Icon name="arrow" size={14} />
                      </button>
                      <button onClick={logCigarette}>
                        Catat 1 Batang
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                  </div>
                  <span className="lockscreen-bottom">Satu pilihan baik, setiap waktu.</span>
                  <div className="home-indicator" />
                </section>
              </div>
            </div>
          )}
        </main>

        <footer className="site-footer">
          <span>
            pelan<span className="blue">.</span>{" "}
            <span className="footer-tagline">Ruang kecil untuk perubahan baik.</span>
          </span>
          <span>
            ONE DAY AT A TIME <Icon name="leaf" size={13} />
          </span>
        </footer>
      </div>

      {page === "home" && (
        <div className="floating-checkin">
          <span className="checkin-moon">
            <Icon name={checkedIn ? "check" : "moon"} size={19} />
          </span>
          <div>
            <strong>
              {checkedIn ? "Hari ini sudah direfleksikan." : "Sudah menyapa dirimu hari ini?"}
            </strong>
            <span>
              {checkedIn
                ? "Sampai bertemu lagi besok."
                : "Satu menit untuk menutup hari dengan baik."}
            </span>
          </div>
          <button onClick={() => navigate("checkin")}>
            {checkedIn ? "Lihat Check-in" : "Daily Check-in Malam"}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      )}

      {organizer && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOrganizer(null);
          }}
        >
          <section
            className="modal-card organizer-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="organizer-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Tutup pengelola"
              onClick={() => setOrganizer(null)}
            >
              <Icon name="close" />
            </button>
            <span className="card-icon blue-tint">
              <Icon name={organizer.tab === "tasks" ? "grid" : "spark"} size={24} />
            </span>
            <span className="eyebrow">RUANG KERJAMU SENDIRI</span>
            <h2 id="organizer-title">
              {organizer.mode === "list"
                ? "Tugas & aktivitasmu."
                : organizer.tab === "tasks"
                  ? organizer.editingId
                    ? "Edit tugas."
                    : "Tugas baru."
                  : organizer.editingId
                    ? "Edit aktivitas."
                    : "Aktivitas baru."}
            </h2>
            <p>
              {organizer.mode === "list"
                ? "Contoh di bawah bisa kamu ubah, hapus, atau ganti dengan rutinitasmu sendiri."
                : organizer.tab === "tasks"
                  ? "Beri nama yang spesifik, kategori sendiri, dan durasi yang realistis."
                  : "Tuliskan aktivitas yang biasa kamu lakukan, lalu pilih ikon yang paling cocok."}
            </p>
            {organizer.mode === "list" ? (
              <>
                <div className="organizer-tabs" aria-label="Pilih daftar">
                  <button
                    data-initial-focus={organizer.tab === "tasks" ? "" : undefined}
                    aria-pressed={organizer.tab === "tasks"}
                    onClick={() => openOrganizer("tasks")}
                  >
                    Tugas <span>{tasks.length}</span>
                  </button>
                  <button
                    data-initial-focus={organizer.tab === "activities" ? "" : undefined}
                    aria-pressed={organizer.tab === "activities"}
                    onClick={() => openOrganizer("activities")}
                  >
                    Aktivitas <span>{activities.length}</span>
                  </button>
                </div>
                <div className="organizer-list-heading">
                  <span>
                    {organizer.tab === "tasks"
                      ? "Semua tugas tersimpan. Home menampilkan 3 teratas."
                      : "Daftar ini juga dipakai di Daily Check-in."}
                  </span>
                  <button
                    className="button primary"
                    onClick={() =>
                      organizer.tab === "tasks" ? openTaskEditor() : openActivityEditor()
                    }
                  >
                    <Icon name="plus" size={14} />
                    {organizer.tab === "tasks" ? "Tambah tugas" : "Tambah aktivitas"}
                  </button>
                </div>
                <div className="organizer-list">
                  {organizer.tab === "tasks"
                    ? tasks.map((task) => (
                        <div className="organizer-item" key={task.id}>
                          <span className="organizer-item-icon">
                            <Icon name={task.status === "Done" ? "check" : "grid"} size={19} />
                          </span>
                          <div className="organizer-item-copy">
                            <strong>{task.title}</strong>
                            <small>
                              {task.category} · {task.minutes} menit
                            </small>
                            <span
                              className={`status-label status-${task.status.toLowerCase().replace(" ", "-")}`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <div className="organizer-item-actions">
                            <button
                              className="icon-button"
                              aria-label={`Edit tugas ${task.title}`}
                              onClick={() => openTaskEditor(task)}
                            >
                              <Icon name="edit" size={17} />
                            </button>
                            <button
                              className="icon-button delete-button"
                              aria-label={`Hapus tugas ${task.title}`}
                              onClick={() => setPendingDelete(task.id)}
                            >
                              <Icon name="trash" size={17} />
                            </button>
                          </div>
                          {pendingDelete === task.id && (
                            <div className="delete-confirmation">
                              <p>Hapus “{task.title}”? Tindakan ini tidak bisa dibatalkan.</p>
                              <div>
                                <button onClick={() => setPendingDelete(null)}>Batal</button>
                                <button
                                  className="confirm-delete"
                                  onClick={() => {
                                    setWorkspace((current) => ({
                                      ...current,
                                      tasks: current.tasks.filter((item) => item.id !== task.id),
                                    }));
                                    setMicroDone((done) =>
                                      done.filter((key) => !key.startsWith(`${task.id}-`)),
                                    );
                                    setPendingDelete(null);
                                    notify("Tugas dihapus.");
                                  }}
                                >
                                  Ya, hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    : activities.map((activity) => (
                        <div className="organizer-item" key={activity.id}>
                          <span className="organizer-item-icon">
                            <Icon name={activity.icon} size={22} />
                          </span>
                          <div className="organizer-item-copy">
                            <strong>{activity.label}</strong>
                            <small>
                              {ACTIVITY_ICONS.find((icon) => icon.value === activity.icon)?.label}
                            </small>
                          </div>
                          <div className="organizer-item-actions">
                            <button
                              className="icon-button"
                              aria-label={`Edit aktivitas ${activity.label}`}
                              onClick={() => openActivityEditor(activity.id)}
                            >
                              <Icon name="edit" size={17} />
                            </button>
                            <button
                              className="icon-button delete-button"
                              aria-label={`Hapus aktivitas ${activity.label}`}
                              onClick={() => setPendingDelete(activity.id)}
                            >
                              <Icon name="trash" size={17} />
                            </button>
                          </div>
                          {pendingDelete === activity.id && (
                            <div className="delete-confirmation">
                              <p>Hapus “{activity.label}” dari daftar dan pilihan check-in?</p>
                              <div>
                                <button onClick={() => setPendingDelete(null)}>Batal</button>
                                <button
                                  className="confirm-delete"
                                  onClick={() => {
                                    setWorkspace((current) => removeActivity(current, activity.id));
                                    setPendingDelete(null);
                                    notify("Aktivitas dihapus dari daftar dan check-in.");
                                  }}
                                >
                                  Ya, hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  {(organizer.tab === "tasks" ? tasks.length === 0 : activities.length === 0) && (
                    <div className="workspace-empty">
                      <Icon name="leaf" size={28} />
                      <p>Daftarmu masih kosong. Tambahkan satu dulu, ya.</p>
                    </div>
                  )}
                </div>
                <button
                  className="button outline organizer-close"
                  onClick={() => setOrganizer(null)}
                >
                  Selesai mengelola <Icon name="check" size={16} />
                </button>
              </>
            ) : (
              <form className="organizer-form" onSubmit={saveOrganizer}>
                <div className="form-example">
                  <span>CONTOH PENGISIAN</span>
                  <p>
                    {organizer.tab === "tasks" ? (
                      <>
                        <strong>Review notebook klasifikasi</strong>
                        <br />
                        Kategori: Intern ML/AI · Durasi: 45 menit · Status: On going
                      </>
                    ) : (
                      <>
                        <strong>Running sore 3 km</strong>
                        <br />
                        Pilih ikon Lari, supaya mudah dikenali di Home & check-in.
                      </>
                    )}
                  </p>
                </div>
                {organizer.tab === "tasks" ? (
                  <>
                    <label htmlFor="task-title-input">Nama tugas</label>
                    <input
                      id="task-title-input"
                      data-initial-focus
                      required
                      maxLength={100}
                      placeholder="Contoh: Review notebook klasifikasi"
                      value={taskDraft.title}
                      onChange={(event) =>
                        setTaskDraft((draft) => ({ ...draft, title: event.target.value }))
                      }
                    />
                    <label htmlFor="task-category-input">
                      Kategori <span>Bisa kamu ketik sendiri</span>
                    </label>
                    <input
                      id="task-category-input"
                      list="task-category-options"
                      required
                      maxLength={40}
                      placeholder="Contoh: Intern ML/AI atau Kuliah"
                      value={taskDraft.category}
                      onChange={(event) =>
                        setTaskDraft((draft) => ({ ...draft, category: event.target.value }))
                      }
                    />
                    <datalist id="task-category-options">
                      {categories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    <div className="organizer-form-columns">
                      <div>
                        <label htmlFor="task-minutes-input">Durasi (menit)</label>
                        <input
                          id="task-minutes-input"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="1440"
                          step="1"
                          required
                          placeholder="Contoh: 45"
                          value={taskDraft.minutes}
                          onChange={(event) =>
                            setTaskDraft((draft) => ({ ...draft, minutes: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="task-status-input">Status</label>
                        <select
                          id="task-status-input"
                          value={taskDraft.status}
                          onChange={(event) =>
                            setTaskDraft((draft) => ({
                              ...draft,
                              status: event.target.value as TaskStatus,
                            }))
                          }
                        >
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <span className="form-field-hint">
                      Durasi cukup angka 1–1440. On going = dikerjakan, Hold = ditunda, Done =
                      selesai.
                    </span>
                  </>
                ) : (
                  <>
                    <label htmlFor="activity-label-input">Nama aktivitas</label>
                    <input
                      id="activity-label-input"
                      data-initial-focus
                      required
                      maxLength={60}
                      placeholder="Contoh: Running sore 3 km"
                      value={activityDraft.label}
                      onChange={(event) =>
                        setActivityDraft((draft) => ({ ...draft, label: event.target.value }))
                      }
                    />
                    <fieldset className="activity-icon-picker">
                      <legend>Pilih ikon</legend>
                      <div>
                        {ACTIVITY_ICONS.map((icon) => (
                          <button
                            type="button"
                            key={icon.value}
                            aria-pressed={activityDraft.icon === icon.value}
                            onClick={() =>
                              setActivityDraft((draft) => ({ ...draft, icon: icon.value }))
                            }
                          >
                            <Icon name={icon.value} size={23} />
                            <span>{icon.label}</span>
                            {activityDraft.icon === icon.value && <Icon name="check" size={12} />}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
                {formError && (
                  <p className="organizer-form-error" role="alert">
                    {formError}
                  </p>
                )}
                <div className="organizer-form-actions">
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => openOrganizer(organizer.tab)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="button primary">
                    Simpan {organizer.tab === "tasks" ? "tugas" : "aktivitas"}
                    <Icon name="check" size={16} />
                  </button>
                </div>
                <span className="organizer-storage-note">
                  {workspaceStorageAvailable
                    ? "Tersimpan lokal di browser ini, bukan di server."
                    : "Penyimpanan lokal tidak tersedia; perubahan hanya berlaku di sesi ini."}
                </span>
              </form>
            )}
          </section>
        </div>
      )}
      {quotaOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuotaOpen(false);
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quota-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Tutup"
              onClick={() => setQuotaOpen(false)}
            >
              <Icon name="close" />
            </button>
            <span className="card-icon blue-tint">
              <Icon name="leaf" size={25} />
            </span>
            <span className="eyebrow">TARGET KECIL, NIAT BESAR</span>
            <h2 id="quota-title">Tentukan langkahmu.</h2>
            <p>
              Berapa batang per hari untuk minggu ini?
              <br />
              Pilih target yang terasa realistis untukmu.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = Number(quotaDraft);
                if (Number.isInteger(value) && value >= 0 && value <= 99) {
                  updateTracker((current) => ({ ...current, quota: value }));
                  setQuotaOpen(false);
                  notify(`Target diperbarui: ${value} batang per hari. Pelan-pelan, kamu bisa.`);
                }
              }}
            >
              <label htmlFor="quota-input">Jatah rokok harian</label>
              <div className="quota-input-wrap">
                <input
                  id="quota-input"
                  type="number"
                  min="0"
                  max="99"
                  required
                  autoFocus
                  value={quotaDraft}
                  onChange={(e) => setQuotaDraft(e.target.value)}
                />
                <span>batang / hari</span>
              </div>
              <button className="button primary" type="submit">
                Simpan Target Mingguan
                <Icon name="check" size={18} />
              </button>
            </form>
            <span className="modal-footnote">Target berlaku untuk setiap hari minggu ini.</span>
          </section>
        </div>
      )}
      {microTaskRecord && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMicroTask(null);
          }}
        >
          <section
            className="modal-card micro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="micro-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Tutup"
              onClick={() => setMicroTask(null)}
            >
              <Icon name="close" />
            </button>
            <span className="card-icon blue-tint">
              <Icon name="spark" size={24} />
            </span>
            <span className="eyebrow">SATU LANGKAH DULU</span>
            <h2 id="micro-title">Mulai dari 5 menit.</h2>
            <p>{microTaskRecord.title}</p>
            <div className="micro-steps">
              {[
                `Siapkan bahan untuk “${microTaskRecord.title}”`,
                "Pilih satu langkah paling kecil, lalu kerjakan",
                "Cek hasil awal & tentukan langkah berikutnya",
              ].map((text, i) => {
                const key = `${microTask}-${i}`;
                return (
                  <button
                    key={text}
                    className={microDone.includes(key) ? "done" : ""}
                    onClick={() =>
                      setMicroDone((d) =>
                        d.includes(key) ? d.filter((x) => x !== key) : [...d, key],
                      )
                    }
                  >
                    <span className="micro-check">
                      {microDone.includes(key) ? <Icon name="check" size={15} /> : `0${i + 1}`}
                    </span>
                    <span>
                      {text}
                      <small>5 menit</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              className="button primary"
              onClick={() => {
                setMicroTask(null);
                notify("Langkah kecilmu siap. Mulai dari yang paling mudah, ya.");
              }}
            >
              Siap, mulai pelan-pelan
              <Icon name="arrow" size={17} />
            </button>
          </section>
        </div>
      )}
      {banner && (
        <div className="in-app-notification">
          <button
            className="dismiss-banner"
            aria-label="Tutup notifikasi"
            onClick={() => setBanner(false)}
          >
            <Icon name="close" size={16} />
          </button>
          <div className="notification-header">
            <span className="notification-app">
              <Icon name="leaf" size={15} />
            </span>
            <strong>pelan.</strong>
            <span>sekarang</span>
          </div>
          <p>
            15 menit lagi jam {notificationTime} (
            {notificationTime === "22:00" ? "Di rumah" : "Basecamp Prodi"}). Sisa jatah hari ini:{" "}
            {remaining} batang. Siap aktifkan Mode Misi Basecamp?
          </p>
          <div className="notification-quick-actions">
            <button onClick={startMission}>Mulai Misi</button>
            <button onClick={logCigarette}>Catat 1 Batang</button>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={16} />
          </span>
          {toast}
          <button onClick={() => setToast("")} aria-label="Tutup pesan">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

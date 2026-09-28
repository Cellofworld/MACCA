import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Flame,
  Gauge,
  History as HistoryIcon,
  LayoutGrid,
  Plus,
  Settings,
  Sparkles,
  Target,
  Weight as WeightIcon,
} from "lucide-react";
import type {
  Profile,
  RangeKey,
  ToastData,
  ToastKind,
  View,
  WeightEntry,
} from "./lib/types";
import {
  fmtDay,
  fmtFull,
  fmtNum,
  fmtSigned,
  todayISO,
} from "./lib/dates";
import { computeStats, type Stats } from "./lib/stats";
import { defaultProfile, makeDemoData, uid } from "./lib/store";
import {
  clearAllData,
  deleteEntry,
  loadEntries,
  loadProfile,
  saveProfile,
  upsertEntry,
  updateEntryWeight,
} from "./lib/db";
import { ToastHost } from "./components/Toast";
import { AnimatedNumber } from "./components/AnimatedNumber";
import { WeightChart } from "./components/WeightChart";
import { EntryForm } from "./components/EntryForm";
import { HistoryList } from "./components/HistoryList";
import { SettingsModal } from "./components/SettingsModal";
import { Recommendations } from "./components/Recommendations";
import { WeeklyMenu } from "./components/WeeklyMenu";
import { Exercises } from "./components/Exercises";

/* ---------- фирменный знак ---------- */

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="13" fill="var(--color-pine-900)" />
      <path
        d="M13 27a11 11 0 0 1 22 0"
        stroke="var(--color-lime)"
        strokeWidth="3.4"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="27"
        x2="29.5"
        y2="18.5"
        stroke="#f5f2e6"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="27" r="2.7" fill="var(--color-lime)" />
      <line
        x1="12.5"
        y1="34"
        x2="35.5"
        y2="34"
        stroke="var(--color-lime)"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/* ---------- мелкие детали ---------- */

function HeroChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  const toneCls =
    tone === "good" ? "text-lime" : tone === "bad" ? "text-[#ff9d80]" : "text-cream/85";
  return (
    <div className="rounded-xl border border-cream/10 bg-cream/5 px-3 py-2 transition-colors hover:border-cream/25">
      <p className="text-[10px] font-bold tracking-[0.16em] text-cream/45 uppercase">
        {label}
      </p>
      <p className={`tnum mt-0.5 text-sm font-bold ${toneCls}`}>{value}</p>
    </div>
  );
}

function GoalRing({
  progress,
  size = 148,
  stroke = 11,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(201 243 91 / 0.14)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-lime)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {children}
      </div>
    </div>
  );
}

function AnalysisCard({
  stats,
  profile,
  onEdit,
}: {
  stats: Stats;
  profile: Profile;
  onEdit: () => void;
}) {
  const bmiToneCls =
    stats.bmi == null
      ? ""
      : stats.bmi.tone === "good"
        ? "bg-mint text-pine-700"
        : stats.bmi.tone === "warn"
          ? "bg-amber/15 text-amber"
          : "bg-coral/10 text-coral";

  const rows: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    sub: string;
  }[] = [
    {
      icon: <Gauge className="h-4 w-4" />,
      label: "ИМТ",
      value:
        stats.bmi != null ? (
          <span className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="tnum font-display text-base font-bold text-ink">
              {fmtNum(stats.bmi.value)}
            </span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${bmiToneCls}`}>
              {stats.bmi.label}
            </span>
          </span>
        ) : (
          "—"
        ),
      sub: `рост ${profile.heightCm} см · ${profile.age} лет`,
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Темп",
      value: (
        <span className={`tnum font-display text-base font-bold ${
          stats.weeklyRate == null
            ? "text-fog"
            : stats.weeklyRate < 0
              ? "text-pine-600"
              : "text-coral"
        }`}>
          {stats.weeklyRate != null ? `${fmtSigned(stats.weeklyRate)} кг` : "—"}
        </span>
      ),
      sub: stats.weeklyRate != null ? "в неделю, по тренду" : "нужно хотя бы 3 записи",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: "Прогноз цели",
      value: (
        <span className="font-display text-base font-bold text-ink">
          {profile.target == null
            ? "—"
            : stats.etaISO
              ? fmtDay(stats.etaISO)
              : "—"}
        </span>
      ),
      sub:
        profile.target == null
          ? "задайте цель в параметрах"
          : stats.etaISO
            ? `ориентировочно, при темпе ${fmtSigned(stats.weeklyRate ?? 0)} кг/нед`
            : stats.progress != null && stats.progress >= 1
              ? "цель достигнута — поздравляем!"
              : "стабильный темп ещё не сложился",
    },
    {
      icon: <WeightIcon className="h-4 w-4" />,
      label: "Минимум и максимум",
      value: (
        <span className="tnum font-display text-base font-bold text-ink">
          {stats.min != null && stats.max != null
            ? `${fmtNum(stats.min)} – ${fmtNum(stats.max)}`
            : "—"}
        </span>
      ),
      sub: "кг за всё время наблюдений",
    },
  ];

  return (
    <section className="reveal d3 rounded-xl border border-line bg-cream shadow-card">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">Аналитика</h2>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-fog transition hover:bg-mint hover:text-pine-700 active:scale-95"
        >
          <Settings className="h-3.5 w-3.5" />
          Параметры
        </button>
      </header>
      <ul className="divide-y divide-line px-5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 py-3.5 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint text-pine-700">
              {r.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.12em] text-fog uppercase">{r.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-fog/80">{r.sub}</p>
            </div>
            <div className="shrink-0 text-right">{r.value}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- приложение ---------- */

export default function App() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<Profile>({
    heightCm: 170,
    age: 30,
    sex: "female",
    target: null,
  });
  const [view, setView] = useState<View>("overview");
  const [range, setRange] = useState<RangeKey>("30");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const toastId = useRef(1);

  // Загрузка данных при монтировании
  useEffect(() => {
    (async () => {
      const [loadedEntries, loadedProfile] = await Promise.all([
        loadEntries(),
        loadProfile(),
      ]);
      setEntries(loadedEntries);
      setProfile(loadedProfile);
    })();
  }, []);

  // на мобильных при смене вкладки возвращаемся к началу экрана
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [view]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );
  const stats = useMemo(() => computeStats(sorted, profile), [sorted, profile]);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success", action?: ToastData["action"]) => {
      const id = toastId.current++;
      setToasts((t) => [...t.slice(-2), { id, message, kind, action }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
    },
    []
  );
  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const focusForm = useCallback(() => {
    setView("overview");
    window.setTimeout(() => {
      setFocusTick((t) => t + 1);
      document
        .getElementById("entry-form")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }, []);

  const handleSubmit = useCallback(
    async (draft: { date: string; weight: number; note: string }) => {
      const existing = entries.find((e) => e.date === draft.date);
      const next: WeightEntry = {
        id: existing?.id ?? uid(),
        date: draft.date,
        weight: draft.weight,
        note: draft.note || undefined,
      };

      try {
        await upsertEntry(next);
        setEntries((prev) => {
          const rest = prev.filter((e) => e.date !== draft.date);
          return [...rest, next].sort((a, b) => a.date.localeCompare(b.date));
        });
        toast(
          existing
            ? `Запись за ${fmtDay(draft.date)} обновлена: ${fmtNum(draft.weight)} кг`
            : `Записано ${fmtNum(draft.weight)} кг · ${fmtDay(draft.date)}`,
          "success"
        );
      } catch (err) {
        toast("Ошибка при сохранении в базу данных", "error");
        console.error(err);
      }
    },
    [entries, toast]
  );

  const handleDelete = useCallback(
    async (entry: WeightEntry) => {
      try {
        await deleteEntry(entry.id);
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
        toast(`Запись за ${fmtDay(entry.date)} удалена`, "info", {
          label: "Вернуть",
          onClick: async () => {
            await upsertEntry(entry);
            setEntries((prev) =>
              [...prev, entry].sort((a, b) => a.date.localeCompare(b.date))
            );
          },
        });
      } catch (err) {
        toast("Ошибка при удалении из базы данных", "error");
        console.error(err);
      }
    },
    [toast]
  );

  const handleUpdate = useCallback(
    async (id: string, weight: number) => {
      try {
        await updateEntryWeight(id, weight);
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, weight } : e)));
        toast(`Вес изменён на ${fmtNum(weight)} кг`, "success");
      } catch (err) {
        toast("Ошибка при обновлении в базе данных", "error");
        console.error(err);
      }
    },
    [toast]
  );

  const handleSaveProfile = useCallback(
    async (p: Profile) => {
      try {
        await saveProfile(p);
        setProfile(p);
        setSettingsOpen(false);
        toast("Параметры сохранены", "success");
      } catch (err) {
        toast("Ошибка при сохранении параметров", "error");
        console.error(err);
      }
    },
    [toast]
  );

  const handleClearAll = useCallback(async () => {
    try {
      await clearAllData();
      setEntries([]);
      setProfile({ ...defaultProfile });
      setSettingsOpen(false);
      toast("Все данные удалены", "info");
    } catch (err) {
      toast("Ошибка при очистке данных", "error");
      console.error(err);
    }
  }, [toast]);

  const handleDemo = useCallback(async () => {
    const demo = makeDemoData();
    try {
      // Сохраняем все записи демо в БД
      for (const entry of demo.entries) {
        await upsertEntry(entry);
      }
      await saveProfile(demo.profile);
      setEntries(demo.entries);
      setProfile(demo.profile);
      setView("overview");
      toast("Демо-данные загружены — можно изучать", "success");
    } catch (err) {
      // Если БД не настроена, просто загружаем в состояние
      setEntries(demo.entries);
      setProfile(demo.profile);
      setView("overview");
      toast("Демо-данные загружены (локально)", "info");
    }
  }, [toast]);

  const goodWhenDown = !(
    profile.target != null && stats.first && profile.target > stats.first.weight
  );
  const deltaTone = (d: number | null): "good" | "bad" | "neutral" => {
    if (d == null || Math.abs(d) < 0.001) return "neutral";
    if (d < 0) return goodWhenDown ? "good" : "bad";
    return goodWhenDown ? "bad" : "good";
  };

  const goalReached = stats.remaining != null && Math.abs(stats.remaining) < 0.05;

  const navBtn = (v: View, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setView(v)}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
        view === v
          ? "bg-pine-900 text-lime shadow-card"
          : "text-fog hover:bg-mint hover:text-ink"
      }`}
    >
      {icon}
      {label}
      {v === "history" && entries.length > 0 && (
        <span
          className={`tnum ml-auto rounded-md px-1.5 py-0.5 text-[10px] ${
            view === v ? "bg-pine-800 text-cream/80" : "bg-line/70 text-fog"
          }`}
        >
          {entries.length}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[228px_1fr] lg:gap-8">
        {/* -------- сайдбар -------- */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-line px-4 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <LogoMark className="h-11 w-11" />
            <div>
              <p className="font-display text-base leading-none font-bold tracking-wide text-ink">
                МАССА
              </p>
              <p className="mt-1 text-[11px] font-medium text-fog">дневник контроля веса</p>
            </div>
          </div>

          <nav className="mt-9 space-y-1.5">
            {navBtn("overview", "Обзор", <LayoutGrid className="h-4 w-4" />)}
            {navBtn("history", "История", <HistoryIcon className="h-4 w-4" />)}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-fog transition-all hover:bg-mint hover:text-ink"
            >
              <Settings className="h-4 w-4" />
              Параметры
            </button>
          </nav>

          <div className="mt-auto space-y-3">
            <div className="graph-dark rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/15 text-lime">
                  <Flame className="h-4 w-4" />
                </span>
                <p className="tnum font-display text-xl font-bold text-cream">
                  {stats.streak}{" "}
                  <span className="text-xs font-medium text-cream/55">
                    {stats.streak === 1 ? "день" : stats.streak < 5 ? "дня" : "дней"}
                  </span>
                </p>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-cream/55">
                {stats.streak > 0
                  ? "Серия взвешиваний подряд. Так держать!"
                  : "Сегодня записи ещё нет — отметьтесь, чтобы начать серию."}
              </p>
              {stats.streak === 0 && (
                <button
                  onClick={focusForm}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime px-3 py-1.5 text-[11px] font-bold text-pine-950 transition hover:brightness-95 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  Отметиться
                </button>
              )}
            </div>
            <p className="px-2 text-[10px] leading-relaxed text-fog/70">
              Данные хранятся в PostgreSQL на вашем сервере.
            </p>
          </div>
        </aside>

        {/* -------- мобильная шапка -------- */}
        <div className="lg:hidden">
          <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-9 w-9" />
                <div>
                  <p className="font-display text-sm leading-none font-bold tracking-wide text-ink">
                    МАССА
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-fog">дневник веса</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-cream px-2.5 py-2"
                  title={`Серия взвешиваний: ${stats.streak} ${
                    stats.streak === 1 ? "день" : stats.streak < 5 ? "дня" : "дней"
                  }`}
                >
                  <Flame className="h-4 w-4 text-amber" />
                  <span className="tnum text-xs font-bold text-ink">{stats.streak}</span>
                </span>
                <button
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Параметры"
                  className="rounded-xl border border-line bg-cream p-2.5 text-fog transition hover:text-ink active:scale-90"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>
        </div>

        {/* -------- нижняя навигация (мобильные) -------- */}
        <nav
          aria-label="Основная навигация"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 shadow-[0_-10px_30px_-18px_rgb(28_42_35/0.4)] backdrop-blur lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto grid max-w-md grid-cols-3 items-end px-6 pt-2 pb-1.5">
            <button
              onClick={() => setView("overview")}
              className="flex flex-col items-center gap-0.5 py-1 transition active:scale-90"
            >
              <span
                className={`rounded-xl px-4 py-1 transition-colors ${
                  view === "overview" ? "bg-pine-900 text-lime" : "text-fog"
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
              </span>
              <span
                className={`text-[10px] font-bold ${view === "overview" ? "text-ink" : "text-fog"}`}
              >
                Обзор
              </span>
            </button>

            <div className="flex flex-col items-center">
              <button
                onClick={focusForm}
                aria-label="Записать вес"
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-paper bg-pine-700 text-cream shadow-pop transition hover:bg-pine-800 active:scale-90"
              >
                <Plus className="h-6 w-6" strokeWidth={2.75} />
              </button>
              <span className="mt-0.5 text-[10px] font-bold text-pine-700">Записать</span>
            </div>

            <button
              onClick={() => setView("history")}
              className="flex flex-col items-center gap-0.5 py-1 transition active:scale-90"
            >
              <span
                className={`relative rounded-xl px-4 py-1 transition-colors ${
                  view === "history" ? "bg-pine-900 text-lime" : "text-fog"
                }`}
              >
                <HistoryIcon className="h-5 w-5" />
                {entries.length > 0 && (
                  <span
                    className={`tnum absolute -top-1.5 -right-0.5 rounded-md px-1 py-px text-[9px] font-bold ${
                      view === "history" ? "bg-lime text-pine-950" : "bg-line text-fog"
                    }`}
                  >
                    {entries.length}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-bold ${view === "history" ? "text-ink" : "text-fog"}`}
              >
                История
              </span>
            </button>
          </div>
        </nav>

        {/* -------- контент -------- */}
        <main className="min-w-0 px-4 pt-4 pb-32 sm:px-6 sm:pt-5 lg:px-0 lg:pt-8 lg:pb-14">
          {view === "overview" ? (
            <div key="overview" className="space-y-5">
              {/* герой */}
              <section className="graph-dark reveal relative overflow-hidden rounded-2xl px-6 py-7 text-cream shadow-pop md:px-9 md:py-9">
                <div className="float-slow pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="live-dot h-2 w-2 rounded-full bg-lime" />
                      <p className="text-[11px] font-bold tracking-[0.22em] text-cream/60 uppercase">
                        Текущий вес
                        {stats.latest ? ` · ${fmtDay(stats.latest.date)}` : ""}
                      </p>
                    </div>

                    {stats.latest ? (
                      <>
                        <div className="mt-3 flex items-baseline gap-3">
                          <AnimatedNumber
                            value={stats.latest.weight}
                            className="font-display text-5xl leading-none font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-[84px]"
                          />
                          <span className="font-display text-xl font-medium text-cream/50">кг</span>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <HeroChip
                            label="К прошлому разу"
                            value={
                              stats.changeLast != null
                                ? `${fmtSigned(stats.changeLast)} кг`
                                : "первая запись"
                            }
                            tone={deltaTone(stats.changeLast)}
                          />
                          <HeroChip
                            label="С начала"
                            value={
                              stats.totalChange != null ? `${fmtSigned(stats.totalChange)} кг` : "—"
                            }
                            tone={deltaTone(stats.totalChange)}
                          />
                          <HeroChip
                            label="Темп в неделю"
                            value={
                              stats.weeklyRate != null ? `${fmtSigned(stats.weeklyRate)} кг` : "—"
                            }
                            tone={deltaTone(stats.weeklyRate)}
                          />
                          <HeroChip
                            label="Серия дней"
                            value={`${stats.streak} ${
                              stats.streak === 1 ? "день" : stats.streak < 5 ? "дня" : "дней"
                            }`}
                            tone={stats.streak > 0 ? "good" : "neutral"}
                          />
                        </div>

                        {/* Дополнительная информация */}
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-cream/70">
                          {stats.bmi && (
                            <span className="rounded-lg bg-cream/10 px-3 py-1.5">
                              ИМТ: <strong className="text-cream">{fmtNum(stats.bmi.value)}</strong>
                            </span>
                          )}
                          {stats.min != null && stats.max != null && (
                            <span className="rounded-lg bg-cream/10 px-3 py-1.5">
                              Диапазон: <strong className="text-cream">{fmtNum(stats.min)}-{fmtNum(stats.max)} кг</strong>
                            </span>
                          )}
                          {stats.etaISO && (
                            <span className="rounded-lg bg-cream/10 px-3 py-1.5">
                              Цель: <strong className="text-cream">{fmtDay(stats.etaISO)}</strong>
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="mt-3 font-display text-5xl leading-none font-bold text-cream/25 sm:text-6xl md:text-7xl lg:text-[80px]">
                          ——,——
                        </p>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60">
                          Встаньте на весы и запишите первое значение — график, темп и прогноз
                          появятся автоматически.
                        </p>
                        <button
                          onClick={focusForm}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-pine-950 shadow-card transition hover:brightness-95 active:scale-95"
                        >
                          <Plus className="h-4 w-4" strokeWidth={3} />
                          Записать первый вес
                        </button>
                      </div>
                    )}
                  </div>

                  {/* цель */}
                  <div className="flex shrink-0 flex-col items-center gap-3 lg:items-end">
                    {stats.latest == null ? (
                      <p className="max-w-[230px] text-center text-xs leading-relaxed text-cream/45 lg:text-right">
                        Кольцо прогресса появится после первой записи и заданной цели
                      </p>
                    ) : profile.target != null && stats.progress != null ? (
                      <>
                        <GoalRing progress={stats.progress} size={120} stroke={10}>
                          <span className="tnum font-display text-2xl font-bold text-lime sm:text-3xl">
                            {Math.round(stats.progress * 100)}%
                          </span>
                          <span className="text-[10px] font-bold tracking-[0.16em] text-cream/50 uppercase">
                            пройдено
                          </span>
                        </GoalRing>
                        <div className="text-center lg:text-right">
                          <p className={`tnum text-sm font-bold ${goalReached ? "text-lime" : "text-cream"}`}>
                            {goalReached
                              ? "Цель достигнута!"
                              : stats.remaining != null
                                ? `Осталось ${fmtNum(Math.abs(stats.remaining))} кг до ${fmtNum(
                                    profile.target,
                                    0
                                  )}`
                                : ""}
                          </p>
                          <p className="mt-1 text-xs text-cream/55">
                            {stats.etaISO
                              ? `по плану — ${fmtDay(stats.etaISO)}`
                              : goalReached
                                ? "можно ставить новую цель"
                                : "прогноз появится при стабильном темпе"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setSettingsOpen(true)}
                        className="group flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cream/25 px-8 py-6 transition hover:border-lime/60 hover:bg-cream/5"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime/12 text-lime transition-transform group-hover:scale-110">
                          <Target className="h-6 w-6" />
                        </span>
                        <span className="text-center">
                          <span className="block text-sm font-bold text-cream">Указать цель</span>
                          <span className="mt-0.5 block text-[11px] text-cream/50">
                            чтобы видеть прогресс и прогноз
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* график + форма + аналитика */}
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="min-w-0 lg:col-span-2">
                  <WeightChart
                    entries={sorted}
                    target={profile.target}
                    range={range}
                    onRangeChange={setRange}
                    onDemo={handleDemo}
                  />
                </div>
                <div className="min-w-0 space-y-5">
                  <EntryForm
                    initialWeight={stats.latest?.weight ?? null}
                    focusTick={focusTick}
                    onSubmit={handleSubmit}
                  />
                  <AnalysisCard
                    stats={stats}
                    profile={profile}
                    onEdit={() => setSettingsOpen(true)}
                  />
                </div>
              </div>

              {/* последние записи */}
              {sorted.length > 0 && (
                <section className="reveal d4 overflow-hidden rounded-xl border border-line bg-cream shadow-card">
                  <header className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
                      Последние записи
                    </h2>
                    <button
                      onClick={() => setView("history")}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-pine-700 transition hover:bg-mint active:scale-95"
                    >
                      Вся история
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </header>
                  <HistoryList
                    entries={sorted}
                    grouped={false}
                    limit={5}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                </section>
              )}

              {/* рекомендации, меню и упражнения */}
              <div className="grid gap-5 lg:grid-cols-2">
                <Recommendations
                  bmi={stats.bmi?.value ?? null}
                  weeklyRate={stats.weeklyRate}
                />
                <WeeklyMenu
                  weight={stats.latest?.weight ?? 70}
                  heightCm={profile.heightCm}
                  age={profile.age}
                  sex={profile.sex}
                  target={profile.target}
                />
              </div>

              <Exercises />

              {/* Советы по здоровью */}
              <section className="reveal rounded-xl border border-line bg-cream shadow-card">
                <header className="border-b border-line px-5 py-4">
                  <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
                    Полезные привычки
                  </h2>
                  <p className="mt-0.5 text-xs text-fog">
                    Маленькие шаги к большим результатам
                  </p>
                </header>
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      emoji: "💧",
                      title: "Пейте воду",
                      desc: "1.5-2 литра в день. Стакан воды за 30 минут до еды ускоряет метаболизм на 30%.",
                    },
                    {
                      emoji: "🌙",
                      title: "Спите 7-9 часов",
                      desc: "Недосып повышает уровень грелина — гормона голода. Ложитесь до 23:00.",
                    },
                    {
                      emoji: "🚶",
                      title: "10 000 шагов",
                      desc: "Используйте лестницу вместо лифта. Паркуйтесь дальше. Гуляйте во время обеденного перерыва.",
                    },
                    {
                      emoji: "🥗",
                      title: "Больше овощей",
                      desc: "Заполняйте половину тарелки овощами. Они дают объём и клетчатку при минимуме калорий.",
                    },
                    {
                      emoji: "⏰",
                      title: "Режим питания",
                      desc: "Ешьте в одно и то же время. Избегайте перекусов между приёмами пищи.",
                    },
                    {
                      emoji: "🧘",
                      title: "Управляйте стрессом",
                      desc: "Стресс повышает кортизол, который способствует накоплению жира. Медитируйте, гуляйте, дышите.",
                    },
                  ].map((tip) => (
                    <div
                      key={tip.title}
                      className="rounded-lg border border-line/50 bg-paper/50 p-4 transition-colors hover:border-line hover:bg-paper"
                    >
                      <div className="mb-2 text-2xl">{tip.emoji}</div>
                      <p className="text-sm font-bold text-ink">{tip.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-fog">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            /* -------- история -------- */
            <div key="history" className="space-y-5">
              <section className="reveal">
                <h1 className="font-display text-2xl font-bold text-ink">История взвешиваний</h1>
                <p className="mt-1 text-sm text-fog">
                  {sorted.length > 0
                    ? `${sorted.length} ${
                        sorted.length === 1
                          ? "запись"
                          : sorted.length < 5
                            ? "записи"
                            : "записей"
                      } · с ${fmtFull(sorted[0].date)} · темп ${
                        stats.weeklyRate != null ? `${fmtSigned(stats.weeklyRate)} кг/нед` : "—"
                      }`
                    : "Журнал пуст — записи появятся после первого взвешивания"}
                </p>
              </section>

              {sorted.length > 0 ? (
                <section className="reveal d1 overflow-hidden rounded-xl border border-line bg-cream shadow-card">
                  <HistoryList
                    entries={sorted}
                    grouped
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                </section>
              ) : (
                <section className="reveal d1 flex flex-col items-center rounded-xl border border-dashed border-line bg-cream/60 px-6 py-16 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-pine-700">
                    <CalendarDays className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-bold text-ink">Пока нет записей</h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog">
                    Каждое взвешивание попадает в журнал с днём недели, заметкой и разницей к
                    прошлому разу. Начните с одного числа.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={focusForm}
                      className="inline-flex items-center gap-2 rounded-xl bg-pine-700 px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-pine-800 active:scale-95"
                    >
                      <Plus className="h-4 w-4" strokeWidth={3} />
                      Записать вес
                    </button>
                    <button
                      onClick={handleDemo}
                      className="rounded-xl border border-line bg-cream px-5 py-2.5 text-sm font-bold text-fog transition hover:border-pine-600/40 hover:text-pine-700 active:scale-95"
                    >
                      Посмотреть демо
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}

          <footer className="mt-12 flex flex-col gap-1 border-t border-line pt-4 text-[11px] text-fog sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display font-medium tracking-wide">МАССА · дневник контроля веса</p>
            <p>PostgreSQL · сегодня {fmtFull(todayISO())}</p>
          </footer>
        </main>
      </div>

      {settingsOpen && (
        <SettingsModal
          profile={profile}
          onSave={handleSaveProfile}
          onClearAll={handleClearAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

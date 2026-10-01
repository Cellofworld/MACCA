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
import type { Profile, RangeKey, ToastData, ToastKind, View, WeightEntry } from "./lib/types";
import { fmtDay, fmtFull, fmtNum, fmtSigned, todayISO } from "./lib/dates";
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

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="13" fill="var(--color-pine-900)" />
      <path d="M13 27a11 11 0 0 1 22 0" stroke="var(--color-lime)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <line x1="24" y1="27" x2="29.5" y2="18.5" stroke="#f5f2e6" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="24" cy="27" r="2.7" fill="var(--color-lime)" />
      <line x1="12.5" y1="34" x2="35.5" y2="34" stroke="var(--color-lime)" strokeWidth="3.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function HeroChip({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "neutral" }) {
  return (
    <div className="hero-chip">
      <p className="hero-chip-label">{label}</p>
      <p className={`hero-chip-value ${tone}`}>{value}</p>
    </div>
  );
}

function GoalRing({ progress, size = 120, stroke = 10, children }: { progress: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="hero-goal-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="hero-goal-ring-bg" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="hero-goal-ring-progress" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
      </svg>
      <div className="hero-goal-ring-content">{children}</div>
    </div>
  );
}

function AnalysisCard({ stats, profile, onEdit }: { stats: Stats; profile: Profile; onEdit: () => void }) {
  const bmiToneCls = stats.bmi == null ? "" : stats.bmi.tone === "good" ? "bg-mint text-pine-700" : stats.bmi.tone === "warn" ? "bg-amber/15 text-amber" : "bg-coral/10 text-coral";

  const rows = [
    {
      icon: <Gauge className="h-4 w-4" />,
      label: "ИМТ",
      value: stats.bmi != null ? (
        <span className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="tnum font-display text-base font-bold text-ink">{fmtNum(stats.bmi.value)}</span>
          <span className={`badge ${bmiToneCls}`}>{stats.bmi.label}</span>
        </span>
      ) : "—",
      sub: `рост ${profile.heightCm} см · ${profile.age} лет`,
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Темп",
      value: (
        <span className={`tnum font-display text-base font-bold ${stats.weeklyRate == null ? "text-fog" : stats.weeklyRate < 0 ? "text-pine-600" : "text-coral"}`}>
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
          {profile.target == null ? "—" : stats.etaISO ? fmtDay(stats.etaISO) : "—"}
        </span>
      ),
      sub: profile.target == null ? "задайте цель в параметрах" : stats.etaISO ? `ориентировочно, при темпе ${fmtSigned(stats.weeklyRate ?? 0)} кг/нед` : stats.progress != null && stats.progress >= 1 ? "цель достигнута — поздравляем!" : "стабильный темп ещё не сложился",
    },
    {
      icon: <WeightIcon className="h-4 w-4" />,
      label: "Минимум и максимум",
      value: (
        <span className="tnum font-display text-base font-bold text-ink">
          {stats.min != null && stats.max != null ? `${fmtNum(stats.min)} – ${fmtNum(stats.max)}` : "—"}
        </span>
      ),
      sub: "кг за всё время наблюдений",
    },
  ];

  return (
    <section className="card reveal">
      <header className="card-header">
        <h2 className="card-title">Аналитика</h2>
        <button onClick={onEdit} className="btn btn-secondary btn-sm">
          <Settings className="h-3.5 w-3.5" />
          Параметры
        </button>
      </header>
      <ul className="analysis-list">
        {rows.map((r) => (
          <li key={r.label} className="analysis-row">
            <span className="icon">{r.icon}</span>
            <div className="analysis-info">
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

export default function App() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<Profile>({ ...defaultProfile });
  const [view, setView] = useState<View>("overview");
  const [range, setRange] = useState<RangeKey>("30");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const toastId = useRef(1);

  useEffect(() => {
    (async () => {
      const [loadedEntries, loadedProfile] = await Promise.all([loadEntries(), loadProfile()]);
      setEntries(loadedEntries);
      setProfile(loadedProfile);
    })();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [view]);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);
  const stats = useMemo(() => computeStats(sorted, profile), [sorted, profile]);

  const toast = useCallback((message: string, kind: ToastKind = "success", action?: ToastData["action"]) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, kind, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const focusForm = useCallback(() => {
    setView("overview");
    window.setTimeout(() => {
      setFocusTick((t) => t + 1);
      document.getElementById("entry-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }, []);

  const handleSubmit = useCallback(
    async (draft: { date: string; weight: number; note: string }) => {
      const existing = entries.find((e) => e.date === draft.date);
      const next: WeightEntry = { id: existing?.id ?? uid(), date: draft.date, weight: draft.weight, note: draft.note || undefined };
      try {
        await upsertEntry(next);
        setEntries((prev) => {
          const rest = prev.filter((e) => e.date !== draft.date);
          return [...rest, next].sort((a, b) => a.date.localeCompare(b.date));
        });
        toast(existing ? `Запись за ${fmtDay(draft.date)} обновлена: ${fmtNum(draft.weight)} кг` : `Записано ${fmtNum(draft.weight)} кг · ${fmtDay(draft.date)}`, "success");
      } catch (err) {
        toast("Ошибка при сохранении", "error");
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
            setEntries((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
          },
        });
      } catch (err) {
        toast("Ошибка при удалении", "error");
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
        toast("Ошибка при обновлении", "error");
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
        toast("Ошибка при сохранении", "error");
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
      toast("Ошибка при очистке", "error");
      console.error(err);
    }
  }, [toast]);

  const handleDemo = useCallback(async () => {
    const demo = makeDemoData();
    try {
      for (const entry of demo.entries) await upsertEntry(entry);
      await saveProfile(demo.profile);
      setEntries(demo.entries);
      setProfile(demo.profile);
      setView("overview");
      toast("Демо-данные загружены", "success");
    } catch {
      setEntries(demo.entries);
      setProfile(demo.profile);
      setView("overview");
      toast("Демо-данные загружены (локально)", "info");
    }
  }, [toast]);

  const goodWhenDown = !(profile.target != null && stats.first && profile.target > stats.first.weight);
  const deltaTone = (d: number | null): "good" | "bad" | "neutral" => {
    if (d == null || Math.abs(d) < 0.001) return "neutral";
    if (d < 0) return goodWhenDown ? "good" : "bad";
    return goodWhenDown ? "bad" : "good";
  };

  const goalReached = stats.remaining != null && Math.abs(stats.remaining) < 0.05;

  const navBtn = (v: View, label: string, icon: React.ReactNode) => (
    <button onClick={() => setView(v)} className={`sidebar-nav-btn ${view === v ? "active" : ""}`}>
      {icon}
      {label}
      {v === "history" && entries.length > 0 && (
        <span className="tnum ml-auto rounded-md bg-line/70 px-1.5 py-0.5 text-[10px] font-bold text-fog">
          {entries.length}
        </span>
      )}
    </button>
  );

  return (
    <div className="app">
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <LogoMark className="sidebar-logo" />
            <div>
              <p className="sidebar-title">МАССА</p>
              <p className="sidebar-subtitle">дневник контроля веса</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navBtn("overview", "Обзор", <LayoutGrid className="h-4 w-4" />)}
            {navBtn("history", "История", <HistoryIcon className="h-4 w-4" />)}
            <button onClick={() => setSettingsOpen(true)} className="sidebar-nav-btn">
              <Settings className="h-4 w-4" />
              Параметры
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-streak">
              <div className="sidebar-streak-header">
                <span className="sidebar-streak-icon">
                  <Flame className="h-4 w-4" />
                </span>
                <p className="sidebar-streak-value">
                  {stats.streak}{" "}
                  <span className="sidebar-streak-label">
                    {stats.streak === 1 ? "день" : stats.streak < 5 ? "дня" : "дней"}
                  </span>
                </p>
              </div>
              <p className="sidebar-streak-text">
                {stats.streak > 0 ? "Серия взвешиваний подряд. Так держать!" : "Сегодня записи ещё нет — отметьтесь, чтобы начать серию."}
              </p>
              {stats.streak === 0 && (
                <button onClick={focusForm} className="sidebar-streak-btn">
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  Отметиться
                </button>
              )}
            </div>
            <p className="sidebar-info">Данные хранятся в PostgreSQL на вашем сервере.</p>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <header className="mobile-header">
            <div className="mobile-header-content">
              <div className="mobile-header-logo">
                <LogoMark className="mobile-header-logo-icon" />
                <div>
                  <p className="mobile-header-logo-text">МАССА</p>
                  <p className="mobile-header-logo-subtitle">дневник веса</p>
                </div>
              </div>
              <div className="mobile-header-actions">
                <span className="mobile-header-streak">
                  <Flame className="h-4 w-4 text-amber" />
                  <span className="tnum text-xs font-bold text-ink">{stats.streak}</span>
                </span>
                <button onClick={() => setSettingsOpen(true)} aria-label="Параметры" className="mobile-header-settings-btn">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="mobile-nav">
          <div className="mobile-nav-content">
            <button onClick={() => setView("overview")} className={`mobile-nav-btn ${view === "overview" ? "active" : ""}`}>
              <span className="mobile-nav-btn-icon">
                <LayoutGrid className="h-5 w-5" />
              </span>
              <span className="mobile-nav-btn-label">Обзор</span>
            </button>

            <div className="mobile-nav-btn-center">
              <button onClick={focusForm} aria-label="Записать вес" className="mobile-nav-btn-center-btn">
                <Plus className="h-6 w-6" strokeWidth={2.75} />
              </button>
              <span className="mobile-nav-btn-center-label">Записать</span>
            </div>

            <button onClick={() => setView("history")} className={`mobile-nav-btn ${view === "history" ? "active" : ""}`}>
              <span className="mobile-nav-btn-icon">
                <HistoryIcon className="h-5 w-5" />
                {entries.length > 0 && (
                  <span className="tnum mobile-nav-badge">{entries.length}</span>
                )}
              </span>
              <span className="mobile-nav-btn-label">История</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main">
          {view === "overview" ? (
            <div className="space-y-5">
              {/* Hero */}
              <section className="hero">
                <div className="hero-glow" />
                <div className="hero-content">
                  <div>
                    <div className="hero-status">
                      <span className="hero-status-dot live-dot" />
                      <p className="hero-status-text">
                        Текущий вес{stats.latest ? ` · ${fmtDay(stats.latest.date)}` : ""}
                      </p>
                    </div>

                    {stats.latest ? (
                      <>
                        <div className="hero-weight">
                          <AnimatedNumber value={stats.latest.weight} className="hero-weight-value" />
                          <span className="hero-weight-unit">кг</span>
                        </div>
                        <div className="hero-chips">
                          <HeroChip label="К прошлому разу" value={stats.changeLast != null ? `${fmtSigned(stats.changeLast)} кг` : "первая запись"} tone={deltaTone(stats.changeLast)} />
                          <HeroChip label="С начала" value={stats.totalChange != null ? `${fmtSigned(stats.totalChange)} кг` : "—"} tone={deltaTone(stats.totalChange)} />
                          <HeroChip label="Темп в неделю" value={stats.weeklyRate != null ? `${fmtSigned(stats.weeklyRate)} кг` : "—"} tone={deltaTone(stats.weeklyRate)} />
                          <HeroChip label="Серия дней" value={`${stats.streak} ${stats.streak === 1 ? "день" : stats.streak < 5 ? "дня" : "дней"}`} tone={stats.streak > 0 ? "good" : "neutral"} />
                        </div>
                        <div className="hero-info">
                          {stats.bmi && (
                            <span className="hero-info-item">ИМТ: <strong>{fmtNum(stats.bmi.value)}</strong></span>
                          )}
                          {stats.min != null && stats.max != null && (
                            <span className="hero-info-item">Диапазон: <strong>{fmtNum(stats.min)}-{fmtNum(stats.max)} кг</strong></span>
                          )}
                          {stats.etaISO && (
                            <span className="hero-info-item">Цель: <strong>{fmtDay(stats.etaISO)}</strong></span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="hero-empty">——,——</p>
                        <p className="hero-empty-text">Встаньте на весы и запишите первое значение — график, темп и прогноз появятся автоматически.</p>
                        <button onClick={focusForm} className="hero-empty-btn">
                          <Plus className="h-4 w-4" strokeWidth={3} />
                          Записать первый вес
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Goal */}
                  <div className="hero-goal">
                    {stats.latest == null ? (
                      <p className="hero-goal-empty-text">Кольцо прогресса появится после первой записи и заданной цели</p>
                    ) : profile.target != null && stats.progress != null ? (
                      <>
                        <GoalRing progress={stats.progress}>
                          <span className="tnum hero-goal-ring-value">{Math.round(stats.progress * 100)}%</span>
                          <span className="hero-goal-ring-label">пройдено</span>
                        </GoalRing>
                        <div className="hero-goal-info">
                          <p className={`tnum text-sm font-bold ${goalReached ? "text-lime" : "text-cream"}`}>
                            {goalReached ? "Цель достигнута!" : stats.remaining != null ? `Осталось ${fmtNum(Math.abs(stats.remaining))} кг до ${fmtNum(profile.target, 0)}` : ""}
                          </p>
                          <p className="hero-goal-info-subtitle">
                            {stats.etaISO ? `по плану — ${fmtDay(stats.etaISO)}` : goalReached ? "можно ставить новую цель" : "прогноз появится при стабильном темпе"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => setSettingsOpen(true)} className="hero-goal-empty">
                        <span className="hero-goal-empty-icon">
                          <Target className="h-6 w-6" />
                        </span>
                        <span className="text-center">
                          <span className="block text-sm font-bold text-cream">Указать цель</span>
                          <span className="mt-0.5 block text-[11px] text-cream/50">чтобы видеть прогресс и прогноз</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Chart + Form + Analysis */}
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <WeightChart entries={sorted} target={profile.target} range={range} onRangeChange={setRange} onDemo={handleDemo} />
                </div>
                <div className="space-y-5">
                  <EntryForm initialWeight={stats.latest?.weight ?? null} focusTick={focusTick} onSubmit={handleSubmit} />
                  <AnalysisCard stats={stats} profile={profile} onEdit={() => setSettingsOpen(true)} />
                </div>
              </div>

              {/* Recent Entries */}
              {sorted.length > 0 && (
                <section className="card reveal">
                  <header className="card-header">
                    <h2 className="card-title">Последние записи</h2>
                    <button onClick={() => setView("history")} className="btn btn-secondary btn-sm">
                      Вся история
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </header>
                  <HistoryList entries={sorted} grouped={false} limit={5} onDelete={handleDelete} onUpdate={handleUpdate} />
                </section>
              )}

              {/* Recommendations + Menu */}
              <div className="grid gap-5 lg:grid-cols-2">
                <Recommendations bmi={stats.bmi?.value ?? null} weeklyRate={stats.weeklyRate} />
                <WeeklyMenu weight={stats.latest?.weight ?? 70} heightCm={profile.heightCm} age={profile.age} sex={profile.sex} target={profile.target} />
              </div>

              <Exercises />

              {/* Tips */}
              <section className="card reveal">
                <header className="card-header">
                  <div>
                    <h2 className="card-title">Полезные привычки</h2>
                    <p className="card-subtitle">Маленькие шаги к большим результатам</p>
                  </div>
                </header>
                <div className="tips-grid">
                  {[
                    { emoji: "💧", title: "Пейте воду", desc: "1.5-2 литра в день. Стакан воды за 30 минут до еды ускоряет метаболизм на 30%." },
                    { emoji: "🌙", title: "Спите 7-9 часов", desc: "Недосып повышает уровень грелина — гормона голода. Ложитесь до 23:00." },
                    { emoji: "🚶", title: "10 000 шагов", desc: "Используйте лестницу вместо лифта. Паркуйтесь дальше. Гуляйте во время обеденного перерыва." },
                    { emoji: "🥗", title: "Больше овощей", desc: "Заполняйте половину тарелки овощами. Они дают объём и клетчатку при минимуме калорий." },
                    { emoji: "⏰", title: "Режим питания", desc: "Ешьте в одно и то же время. Избегайте перекусов между приёмами пищи." },
                    { emoji: "🧘", title: "Управляйте стрессом", desc: "Стресс повышает кортизол, который способствует накоплению жира. Медитируйте, гуляйте, дышите." },
                  ].map((tip) => (
                    <div key={tip.title} className="tip-card">
                      <div className="mb-2 text-2xl">{tip.emoji}</div>
                      <p className="text-sm font-bold">{tip.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-fog">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              <section className="reveal">
                <h1 className="text-2xl font-bold">История взвешиваний</h1>
                <p className="mt-1 text-sm text-fog">
                  {sorted.length > 0 ? `${sorted.length} записей · с ${fmtFull(sorted[0].date)} · темп ${stats.weeklyRate != null ? `${fmtSigned(stats.weeklyRate)} кг/нед` : "—"}` : "Журнал пуст — записи появятся после первого взвешивания"}
                </p>
              </section>

              {sorted.length > 0 ? (
                <section className="card reveal">
                  <HistoryList entries={sorted} grouped onDelete={handleDelete} onUpdate={handleUpdate} />
                </section>
              ) : (
                <section className="card reveal text-center p-5">
                  <span className="icon icon-md mx-auto">
                    <CalendarDays className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 text-lg font-bold">Пока нет записей</h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog">Каждое взвешивание попадает в журнал с днём недели, заметкой и разницей к прошлому разу.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button onClick={focusForm} className="btn btn-primary btn-md">
                      <Plus className="h-4 w-4" strokeWidth={3} />
                      Записать вес
                    </button>
                    <button onClick={handleDemo} className="btn btn-secondary btn-md">Посмотреть демо</button>
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
        <SettingsModal profile={profile} onSave={handleSaveProfile} onClearAll={handleClearAll} onClose={() => setSettingsOpen(false)} />
      )}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

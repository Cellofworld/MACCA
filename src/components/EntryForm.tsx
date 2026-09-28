import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Scale } from "lucide-react";
import { fmtNum, todayISO } from "../lib/dates";

const MIN_W = 20;
const MAX_W = 400;

export function parseWeight(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(",", ".").trim());
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

export function EntryForm({
  initialWeight,
  focusTick,
  onSubmit,
}: {
  initialWeight: number | null;
  /** инкремент — сфокусировать поле веса */
  focusTick: number;
  onSubmit: (draft: { date: string; weight: number; note: string }) => void;
}) {
  const [weight, setWeight] = useState(() =>
    initialWeight != null ? fmtNum(initialWeight) : ""
  );
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusTick > 0) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusTick]);

  const nudge = (delta: number) => {
    const base = parseWeight(weight) ?? initialWeight ?? 70;
    const next = Math.min(MAX_W, Math.max(MIN_W, Math.round((base + delta) * 10) / 10));
    setWeight(fmtNum(next));
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseWeight(weight);
    if (w == null || w < MIN_W || w > MAX_W) {
      setError(`Введите вес от ${MIN_W} до ${MAX_W} кг`);
      setShakeKey((k) => k + 1);
      return;
    }
    if (!date) {
      setError("Укажите дату взвешивания");
      setShakeKey((k) => k + 1);
      return;
    }
    if (date > todayISO()) {
      setError("Дата не может быть в будущем");
      setShakeKey((k) => k + 1);
      return;
    }
    onSubmit({ date, weight: w, note: note.trim() });
    setWeight(fmtNum(w));
    setNote("");
    setDate(todayISO());
    setError(null);
  };

  const stepBtn =
    "flex h-9 w-10 items-center justify-center rounded-lg border border-line bg-cream px-0 text-xs font-bold text-pine-700 transition hover:border-pine-600/50 hover:bg-mint active:scale-90 sm:w-auto sm:min-w-11 sm:px-2 sm:text-sm";

  return (
    <section
      id="entry-form"
      className="reveal d2 rounded-xl border border-line bg-cream shadow-card"
    >
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Новое взвешивание
        </h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-pine-700">
          <Scale className="h-4 w-4" />
        </span>
      </header>

      <form onSubmit={submit} className="p-5" key={shakeKey ? `s${shakeKey}` : "s0"}>
        <div className={shakeKey ? "shake" : undefined}>
          <label
            htmlFor="weight-input"
            className="text-[11px] font-bold tracking-[0.14em] text-fog uppercase"
          >
            Вес, кг
          </label>

          <div className="mt-2 flex items-center justify-between gap-0.5 sm:gap-1.5">
            <button type="button" onClick={() => nudge(-1)} className={stepBtn} aria-label="Минус килограмм">
              −1
            </button>
            <button type="button" onClick={() => nudge(-0.1)} className={stepBtn} aria-label="Минус 100 граммов">
              <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <div className="relative flex-1 text-center">
              <input
                id="weight-input"
                ref={inputRef}
                inputMode="decimal"
                autoComplete="off"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value.replace(/[^\d.,]/g, ""));
                  setError(null);
                }}
                placeholder="70,0"
                className="tnum w-full min-w-0 rounded-xl border border-line bg-paper/70 py-2 text-center font-display text-2xl font-bold text-ink transition focus:border-pine-600 focus:bg-cream focus:outline-none sm:py-2.5 sm:text-3xl"
              />
            </div>

            <button type="button" onClick={() => nudge(0.1)} className={stepBtn} aria-label="Плюс 100 граммов">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button type="button" onClick={() => nudge(1)} className={stepBtn} aria-label="Плюс килограмм">
              +1
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="date-input"
                className="text-[11px] font-bold tracking-[0.14em] text-fog uppercase"
              >
                Дата
              </label>
              <input
                id="date-input"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper/70 px-3 py-2.5 text-sm font-medium text-ink transition focus:border-pine-600 focus:bg-cream focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="note-input"
                className="text-[11px] font-bold tracking-[0.14em] text-fog uppercase"
              >
                Заметка
              </label>
              <input
                id="note-input"
                type="text"
                maxLength={80}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="например: после пробежки"
                className="mt-1.5 w-full rounded-lg border border-line bg-paper/70 px-3 py-2.5 text-sm font-medium text-ink transition placeholder:text-fog/60 focus:border-pine-600 focus:bg-cream focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pine-700 py-3 text-sm font-bold text-cream shadow-card transition-all hover:bg-pine-800 hover:shadow-pop active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
            Сохранить запись
          </button>
          <p className="mt-2.5 text-center text-[11px] text-fog">
            Одна запись на дату — повторная перезапишет прежнюю
          </p>
        </div>
      </form>
    </section>
  );
}

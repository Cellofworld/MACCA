import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Profile, Sex } from "../lib/types";
import { fmtNum } from "../lib/dates";

export function SettingsModal({
  profile,
  onSave,
  onClearAll,
  onClose,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  const [height, setHeight] = useState(String(profile.heightCm));
  const [age, setAge] = useState(String(profile.age));
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [target, setTarget] = useState(
    profile.target != null ? fmtNum(profile.target) : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const h = Number.parseFloat(height.replace(",", "."));
    const a = Number.parseInt(age, 10);
    const t = target.trim() === "" ? null : Number.parseFloat(target.replace(",", "."));

    if (!Number.isFinite(h) || h < 100 || h > 250) errs.height = "Рост: 100–250 см";
    if (!Number.isFinite(a) || a < 10 || a > 120) errs.age = "Возраст: 10–120 лет";
    if (t != null && (!Number.isFinite(t) || t < 20 || t > 400)) {
      errs.target = "Цель: 20–400 кг (или пусто)";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      heightCm: Math.round(h),
      age: a,
      sex,
      target: t != null ? Math.round(t * 10) / 10 : null,
    });
  };

  const field =
    "mt-1.5 w-full rounded-lg border border-line bg-paper/70 px-3 py-2.5 text-sm font-medium text-ink transition focus:border-pine-600 focus:bg-cream focus:outline-none";
  const label = "text-[11px] font-bold tracking-[0.14em] text-fog uppercase";

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-pine-950/55 p-4 backdrop-blur-[3px] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
    >
      <div className="pop max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-line bg-cream shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Параметры и цель</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-2 text-fog transition hover:bg-paper hover:text-ink active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <span className={label}>Пол</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-line bg-paper p-1">
              {(
                [
                  ["female", "Женский"],
                  ["male", "Мужской"],
                ] as [Sex, string][]
              ).map(([key, text]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSex(key)}
                  className={`rounded-md py-2 text-sm font-bold transition-all ${
                    sex === key
                      ? "bg-pine-900 text-lime shadow-card"
                      : "text-fog hover:text-ink"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="set-height" className={label}>
                Рост, см
              </label>
              <input
                id="set-height"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^\d.,]/g, ""))}
                className={`${field} ${errors.height ? "border-coral" : ""}`}
              />
              {errors.height && (
                <p className="mt-1 text-[11px] font-semibold text-coral">{errors.height}</p>
              )}
            </div>
            <div>
              <label htmlFor="set-age" className={label}>
                Возраст
              </label>
              <input
                id="set-age"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
                className={`${field} ${errors.age ? "border-coral" : ""}`}
              />
              {errors.age && (
                <p className="mt-1 text-[11px] font-semibold text-coral">{errors.age}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="set-target" className={label}>
              Целевой вес, кг
            </label>
            <input
              id="set-target"
              inputMode="decimal"
              value={target}
              placeholder="например: 65,0 — пусто, если цели нет"
              onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ""))}
              className={`${field} ${errors.target ? "border-coral" : ""}`}
            />
            {errors.target ? (
              <p className="mt-1 text-[11px] font-semibold text-coral">{errors.target}</p>
            ) : (
              <p className="mt-1 text-[11px] text-fog">
                По цели строятся прогресс-кольцо, линия на графике и прогноз даты.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-bold text-fog transition hover:bg-paper hover:text-ink active:scale-[0.98]"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-pine-700 py-2.5 text-sm font-bold text-cream transition hover:bg-pine-800 active:scale-[0.98]"
            >
              Сохранить
            </button>
          </div>
        </form>

        <footer className="border-t border-line px-6 py-4">
          {confirming ? (
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xs font-semibold text-coral">
                Удалить все записи и цель безвозвратно?
              </p>
              <button
                onClick={onClearAll}
                className="rounded-lg bg-coral px-3 py-2 text-xs font-bold text-cream transition hover:brightness-95 active:scale-95"
              >
                Да, удалить
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-fog transition hover:text-ink active:scale-95"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-fog transition hover:bg-coral/10 hover:text-coral active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить все данные
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

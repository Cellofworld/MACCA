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

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
    >
      <div className="modal-content">
        <header className="modal-header">
          <h2 className="card-title">Параметры и цель</h2>
          <button onClick={onClose} aria-label="Закрыть" className="modal-close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="modal-body">
          <div>
            <span className="input-label">Пол</span>
            <div className="settings-sex-group">
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
                  className={`settings-sex-btn ${sex === key ? "active" : ""}`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div>
              <label htmlFor="set-height" className="input-label">
                Рост, см
              </label>
              <input
                id="set-height"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^\d.,]/g, ""))}
                className={`input mt-1 ${errors.height ? "border-coral" : ""}`}
              />
              {errors.height && (
                <p className="settings-error">{errors.height}</p>
              )}
            </div>
            <div>
              <label htmlFor="set-age" className="input-label">
                Возраст
              </label>
              <input
                id="set-age"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
                className={`input mt-1 ${errors.age ? "border-coral" : ""}`}
              />
              {errors.age && (
                <p className="settings-error">{errors.age}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="set-target" className="input-label">
              Целевой вес, кг
            </label>
            <input
              id="set-target"
              inputMode="decimal"
              value={target}
              placeholder="например: 65,0 — пусто, если цели нет"
              onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ""))}
              className={`input mt-1 ${errors.target ? "border-coral" : ""}`}
            />
            {errors.target ? (
              <p className="settings-error">{errors.target}</p>
            ) : (
              <p className="settings-hint">
                По цели строятся прогресс-кольцо, линия на графике и прогноз даты.
              </p>
            )}
          </div>

          <div className="settings-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md flex-1">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary btn-md flex-1">
              Сохранить
            </button>
          </div>
        </form>

        <footer className="modal-footer">
          {confirming ? (
            <div className="settings-confirm">
              <p className="settings-confirm-text">
                Удалить все записи и цель безвозвратно?
              </p>
              <button onClick={onClearAll} className="btn btn-sm flex-1" style={{ background: "var(--color-coral)", color: "var(--color-cream)" }}>
                Да, удалить
              </button>
              <button onClick={() => setConfirming(false)} className="btn btn-secondary btn-sm flex-1">
                Отмена
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="settings-clear-btn">
              <Trash2 className="h-3.5 w-3.5" />
              Удалить все данные
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

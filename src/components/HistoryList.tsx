import { useMemo, useState } from "react";
import { Check, Minus, Pencil, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import type { WeightEntry } from "../lib/types";
import { dayNum, fmtMonth, fmtNum, fmtSigned, fmtWeekday } from "../lib/dates";

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta == null) {
    return <span className="inline-block w-[72px] text-right text-xs text-fog">старт</span>;
  }
  const down = delta < -0.001;
  const up = delta > 0.001;
  const cls = down ? "text-pine-600" : up ? "text-coral" : "text-fog";
  const Icon = down ? TrendingDown : up ? TrendingUp : Minus;
  return (
    <span className={`tnum inline-flex w-[72px] items-center justify-end gap-1 text-xs font-bold ${cls}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {fmtSigned(delta)}
    </span>
  );
}

function Row({
  entry,
  delta,
  onDelete,
  onUpdate,
}: {
  entry: WeightEntry;
  delta: number | null;
  onDelete: (e: WeightEntry) => void;
  onUpdate: (id: string, weight: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState(false);

  const startEdit = () => {
    setDraft(fmtNum(entry.weight));
    setEditing(true);
    setErr(false);
  };

  const save = () => {
    const n = Number.parseFloat(draft.replace(",", ".").trim());
    if (!Number.isFinite(n) || n < 20 || n > 400) {
      setErr(true);
      return;
    }
    onUpdate(entry.id, Math.round(n * 10) / 10);
    setEditing(false);
  };

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-mint/50 sm:gap-4 sm:px-5">
      <div className="w-11 shrink-0">
        <p className="tnum font-display text-lg leading-tight font-semibold text-ink">
          {dayNum(entry.date)}
        </p>
        <p className="text-[11px] font-medium text-fog">{fmtWeekday(entry.date)}</p>
      </div>

      <p className="min-w-0 flex-1 truncate text-sm text-fog">
        {entry.note ? entry.note : <span className="text-fog/45">без заметки</span>}
      </p>

      <DeltaChip delta={delta} />

      {editing ? (
        <span className="flex w-[132px] shrink-0 items-center justify-end gap-1">
          <input
            autoFocus
            inputMode="decimal"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value.replace(/[^\d.,]/g, ""));
              setErr(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            aria-label="Новый вес"
            className={`tnum w-16 rounded-lg border bg-cream px-2 py-1.5 text-right text-sm font-bold text-ink focus:outline-none ${
              err ? "shake border-coral" : "border-pine-600"
            }`}
          />
          <button
            onClick={save}
            aria-label="Сохранить"
            className="rounded-lg bg-pine-700 p-1.5 text-cream transition hover:bg-pine-800 active:scale-90"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
          <button
            onClick={() => setEditing(false)}
            aria-label="Отменить"
            className="rounded-lg border border-line p-1.5 text-fog transition hover:text-ink active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <p className="tnum w-[76px] shrink-0 text-right font-display text-base font-semibold text-ink">
          {fmtNum(entry.weight)}
          <span className="ml-1 text-[11px] font-medium text-fog">кг</span>
        </p>
      )}

      {!editing && (
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            onClick={startEdit}
            aria-label="Изменить запись"
            className="rounded-lg p-1.5 text-fog transition hover:bg-cream hover:text-pine-700 active:scale-90"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(entry)}
            aria-label="Удалить запись"
            className="rounded-lg p-1.5 text-fog transition hover:bg-cream hover:text-coral active:scale-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </li>
  );
}

export function HistoryList({
  entries,
  grouped,
  limit,
  onDelete,
  onUpdate,
}: {
  /** отсортированы по возрастанию */
  entries: WeightEntry[];
  grouped: boolean;
  limit?: number;
  onDelete: (e: WeightEntry) => void;
  onUpdate: (id: string, weight: number) => void;
}) {
  const groups = useMemo(() => {
    const deltaById = new Map<string, number | null>();
    entries.forEach((e, i) => {
      deltaById.set(e.id, i === 0 ? null : e.weight - entries[i - 1].weight);
    });

    const desc = [...entries].reverse();
    const shown = limit ? desc.slice(0, limit) : desc;

    if (!grouped) {
      return [{ label: "", items: shown.map((e) => ({ e, delta: deltaById.get(e.id) ?? null })) }];
    }
    const map = new Map<string, { e: WeightEntry; delta: number | null }[]>();
    shown.forEach((e) => {
      const key = fmtMonth(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ e, delta: deltaById.get(e.id) ?? null });
    });
    return [...map.entries()].map(([label, items]) => ({ label, items }));
  }, [entries, grouped, limit]);

  return (
    <div>
      {groups.map((g) => (
        <div key={g.label || "plain"}>
          {g.label && (
            <p className="border-b border-line bg-paper/60 px-5 py-2 text-[11px] font-bold tracking-[0.14em] text-fog uppercase">
              {g.label}
            </p>
          )}
          <ul className="divide-y divide-line">
            {g.items.map(({ e, delta }) => (
              <Row key={e.id} entry={e} delta={delta} onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

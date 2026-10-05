import { useMemo, useState } from "react";
import { Check, Minus, Pencil, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import type { WeightEntry } from "../lib/types";
import { dayNum, fmtMonth, fmtNum, fmtSigned, fmtWeekday } from "../lib/dates";

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta == null || !Number.isFinite(delta)) {
    return <span className="history-delta-chip start">старт</span>;
  }
  const down = delta < -0.001;
  const up = delta > 0.001;
  const cls = down ? "down" : up ? "up" : "neutral";
  const Icon = down ? TrendingDown : up ? TrendingUp : Minus;
  return (
    <span className={`history-delta-chip ${cls}`}>
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
    setDraft(Number.isFinite(entry.weight) ? fmtNum(entry.weight) : "");
    setEditing(true);
    setErr(false);
  };

  const save = () => {
    const n = Number.parseFloat(draft.replace(",", ".").trim());
    if (!Number.isFinite(n) || n < 20 || n > 400) {
      setErr(true);
      return;
    }
    const rounded = Math.round(n * 10) / 10;
    if (Number.isFinite(rounded)) {
      onUpdate(entry.id, rounded);
      setEditing(false);
    }
  };

  return (
    <li className="history-row">
      <div className="history-row-main">
        <div className="history-date">
          <p className="tnum font-bold">{String(dayNum(entry.date))}</p>
          <p className="text-xs text-fog">{fmtWeekday(entry.date)}</p>
        </div>

        <p className="history-note">
          {entry.note ? entry.note : <span className="text-fog/45">без заметки</span>}
        </p>

        <DeltaChip delta={delta} />

        {editing ? (
          <span className="history-edit">
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
              className={`tnum history-edit-input ${err ? "shake border-coral" : "border-pine-600"}`}
            />
            <button onClick={save} aria-label="Сохранить" className="history-edit-save">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <button onClick={() => setEditing(false)} aria-label="Отменить" className="history-edit-cancel">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <p className="history-weight">
            {Number.isFinite(entry.weight) ? fmtNum(entry.weight) : "—"}
            <span className="history-weight-unit">кг</span>
          </p>
        )}

        {!editing && (
          <span className="history-actions">
            <button onClick={startEdit} aria-label="Изменить" className="history-action-btn">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(entry)} aria-label="Удалить" className="history-action-btn danger">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>

      {!editing && entry.note && (
        <p className="history-note-mobile">{entry.note}</p>
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
            <p className="history-group-label">{g.label}</p>
          )}
          <ul className="history-list">
            {g.items.map(({ e, delta }) => (
              <Row key={e.id} entry={e} delta={delta} onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

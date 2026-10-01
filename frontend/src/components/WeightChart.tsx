import { useEffect, useRef, useState } from "react";
import { LineChart, MousePointerClick } from "lucide-react";
import type { RangeKey, WeightEntry } from "../lib/types";
import {
  daysAgoISO,
  fmtDay,
  fmtFull,
  fmtNum,
  fmtWeekday,
  parseISO,
  toISO,
} from "../lib/dates";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7 дн" },
  { key: "30", label: "30 дн" },
  { key: "90", label: "90 дн" },
  { key: "all", label: "Всё" },
];

function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const H = 260;
const PAD = { l: 46, r: 18, t: 18, b: 32 };

export function WeightChart({
  entries,
  target,
  range,
  onRangeChange,
  onDemo,
}: {
  entries: WeightEntry[];
  target: number | null;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  onDemo: () => void;
}) {
  const [ref, rawWidth] = useMeasure<HTMLDivElement>();
  const width = Math.floor(rawWidth);
  const [hover, setHover] = useState<number | null>(null);

  const visible = (() => {
    if (range === "all") return entries;
    const cutoff = daysAgoISO(Number(range));
    return entries.filter((e) => e.date >= cutoff);
  })();

  const geom = (() => {
    if (visible.length === 0 || width < 200) return null;
    const ws = visible.map((e) => e.weight);
    let min = Math.min(...ws);
    let max = Math.max(...ws);
    if (target != null) {
      min = Math.min(min, target);
      max = Math.max(max, target);
    }
    if (max - min < 1.2) {
      const c = (max + min) / 2;
      min = c - 0.9;
      max = c + 0.9;
    }
    const pad = (max - min) * 0.12;
    min -= pad;
    max += pad;

    const t0 = parseISO(visible[0].date).getTime();
    const t1 = parseISO(visible[visible.length - 1].date).getTime();
    const iw = width - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const x = (iso: string) =>
      t1 === t0 ? PAD.l + iw / 2 : PAD.l + ((parseISO(iso).getTime() - t0) / (t1 - t0)) * iw;
    const y = (w: number) => PAD.t + (1 - (w - min) / (max - min)) * ih;
    const pts = visible.map((e) => ({ x: x(e.date), y: y(e.weight) }));

    const span = max - min;
    const yDigits = span > 16 ? 0 : 1;
    const ticks = [0, 1, 2, 3].map((i) => min + (span * i) / 3);

    const xLabels =
      t1 === t0
        ? [{ x: PAD.l + iw / 2, label: fmtDay(visible[0].date) }]
        : width < 500
          ? [0, 2].map((i) => ({
              x: PAD.l + (iw * i) / 2,
              label: fmtDay(toISO(new Date(t0 + ((t1 - t0) * i) / 2))),
            }))
          : [0, 1, 2, 3].map((i) => ({
              x: PAD.l + (iw * i) / 3,
              label: fmtDay(toISO(new Date(t0 + ((t1 - t0) * i) / 3))),
            }));

    return { pts, y, ticks, yDigits, xLabels, iw, ih };
  })();

  const linePath = geom ? smoothPath(geom.pts) : "";
  const areaPath =
    geom && geom.pts.length > 1
      ? `${linePath} L ${geom.pts[geom.pts.length - 1].x} ${PAD.t + geom.ih} L ${geom.pts[0].x} ${
          PAD.t + geom.ih
        } Z`
      : "";

  const goalY = geom && target != null ? geom.y(target) : null;
  const hoverEntry = hover != null ? visible[hover] : null;
  const hoverPt = hover != null && geom ? geom.pts[hover] : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!geom || visible.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = 0;
    let bd = Infinity;
    geom.pts.forEach((p, i) => {
      const d = Math.abs(p.x - mx);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  return (
    <section className="card reveal">
      <header className="chart-header">
        <div>
          <h2 className="card-title">Динамика веса</h2>
          <p className="card-subtitle">
            {visible.length > 0
              ? `${visible.length} записей · ${fmtDay(visible[0].date)} — ${fmtDay(
                  visible[visible.length - 1].date
                )}`
              : "нет записей в периоде"}
          </p>
        </div>
        <div className="chart-ranges">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                onRangeChange(r.key);
                setHover(null);
              }}
              className={`chart-range-btn ${range === r.key ? "active" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div ref={ref} className="chart-container">
        <div className="chart-wrapper">
          {geom ? (
            <svg
              width={width}
              height={H}
              className="chart-svg"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-pine-500)" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="var(--color-pine-500)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {geom.ticks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={PAD.l}
                    x2={width - PAD.r}
                    y1={geom.y(t)}
                    y2={geom.y(t)}
                    stroke="var(--color-line)"
                    strokeDasharray={i === 0 ? undefined : "3 5"}
                  />
                  <text
                    x={PAD.l - 8}
                    y={geom.y(t) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--color-fog)"
                    className="tnum select-none"
                  >
                    {fmtNum(t, geom.yDigits)}
                  </text>
                </g>
              ))}

              {geom.xLabels.map((l, i) => (
                <text
                  key={i}
                  x={l.x}
                  y={H - 10}
                  textAnchor={i === 0 ? "start" : i === geom.xLabels.length - 1 ? "end" : "middle"}
                  fontSize="11"
                  fill="var(--color-fog)"
                  className="select-none"
                >
                  {l.label}
                </text>
              ))}

              {goalY != null && target != null && (
                <g>
                  <line
                    x1={PAD.l}
                    x2={width - PAD.r}
                    y1={goalY}
                    y2={goalY}
                    stroke="var(--color-lime-deep)"
                    strokeWidth="1.5"
                    strokeDasharray="7 6"
                  />
                  <text
                    x={width - PAD.r}
                    y={goalY - 7}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--color-lime-deep)"
                    className="tnum select-none"
                  >
                    цель · {fmtNum(target, 0)} кг
                  </text>
                </g>
              )}

              <g>
                {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="var(--color-pine-600)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                )}

                {hoverPt && hoverEntry && (
                  <g>
                    <line
                      x1={hoverPt.x}
                      x2={hoverPt.x}
                      y1={PAD.t}
                      y2={PAD.t + geom.ih}
                      stroke="var(--color-pine-500)"
                      strokeOpacity="0.35"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={hoverPt.x}
                      cy={hoverPt.y}
                      r="5.5"
                      fill="var(--color-cream)"
                      stroke="var(--color-pine-600)"
                      strokeWidth="2.5"
                    />
                  </g>
                )}
              </g>
            </svg>
          ) : null}

          {geom && hoverPt && hoverEntry && (
            <div
              className="chart-tooltip"
              style={{
                left: Math.max(90, Math.min(width - 90, hoverPt.x)),
                top: Math.max(4, hoverPt.y - 68),
              }}
            >
              <p className="tnum font-bold">{fmtNum(hoverEntry.weight)} кг</p>
              <p className="chart-tooltip-date">
                {fmtWeekday(hoverEntry.date)}, {fmtFull(hoverEntry.date)}
              </p>
            </div>
          )}

          {visible.length === 0 && (
            <div className="chart-empty">
              <span className="icon icon-md">
                <LineChart />
              </span>
              <p className="font-bold">В этом периоде записей нет</p>
              <p className="text-xs text-fog">
                {entries.length === 0
                  ? "Добавьте первое взвешивание — и здесь появится график."
                  : "Попробуйте расширить диапазон дат."}
              </p>
              {entries.length === 0 && (
                <button onClick={onDemo} className="btn btn-primary btn-sm mt-3">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Посмотреть с демо-данными
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

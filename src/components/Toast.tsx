import { AlertTriangle, Check, Info, X } from "lucide-react";
import type { ToastData } from "../lib/types";

const KIND_STYLE: Record<
  ToastData["kind"],
  { icon: typeof Check; ring: string; iconBox: string }
> = {
  success: {
    icon: Check,
    ring: "border-pine-600/30",
    iconBox: "bg-pine-700 text-lime",
  },
  error: {
    icon: AlertTriangle,
    ring: "border-coral/40",
    iconBox: "bg-coral text-cream",
  },
  info: {
    icon: Info,
    ring: "border-line",
    iconBox: "bg-pine-900 text-lime",
  },
};

export function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 right-4 z-[60] flex flex-col gap-2 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
    >
      {toasts.map((t) => {
        const s = KIND_STYLE[t.kind];
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex items-center gap-3 rounded-xl border ${s.ring} bg-cream p-3 pr-2 shadow-pop`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.iconBox}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <p className="min-w-0 flex-1 text-sm font-medium text-ink">{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  onDismiss(t.id);
                }}
                className="shrink-0 rounded-lg bg-mint px-2.5 py-1.5 text-xs font-bold text-pine-700 transition hover:bg-lime hover:text-pine-950 active:scale-95"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Закрыть уведомление"
              className="shrink-0 rounded-lg p-1.5 text-fog transition hover:bg-paper hover:text-ink active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

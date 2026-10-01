import { Check, Info, AlertTriangle, X } from "lucide-react";
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
      className="toast-host"
    >
      {toasts.map((t) => {
        const s = KIND_STYLE[t.kind];
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={`toast-in toast-item border ${s.ring}`}
          >
            <span className={`toast-icon ${s.iconBox}`}>
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <p className="toast-message">{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  onDismiss(t.id);
                }}
                className="toast-action"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Закрыть"
              className="toast-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

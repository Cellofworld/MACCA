import { useEffect, useState } from "react";
import { Copy, Database, ExternalLink, X } from "lucide-react";
import {
  clearSupabaseConfig,
  getSupabaseConfig,
  saveSupabaseConfig,
} from "../lib/supabase";
import { SCHEMA_SQL } from "../lib/db";

export function DatabaseSettingsModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: () => void;
}) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    setUrl(config.url);
    setKey(config.key);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    saveSupabaseConfig(url.trim(), key.trim());
    onConnected();
    onClose();
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    onConnected();
    onClose();
  };

  const handleCopySchema = async () => {
    await navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const field =
    "mt-1.5 w-full rounded-lg border border-line bg-paper/70 px-3 py-2.5 text-sm font-medium text-ink transition focus:border-pine-600 focus:bg-cream focus:outline-none";
  const label = "text-[11px] font-bold tracking-[0.14em] text-fog uppercase";

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[3px] sm:items-center sm:pb-4 bg-pine-950/55"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки базы данных"
    >
      <div className="pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-cream shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-pine-700">
              <Database className="h-4 w-4" />
            </span>
            <h2 className="font-display text-base font-semibold text-ink">
              Подключение к PostgreSQL
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-2 text-fog transition hover:bg-paper hover:text-ink active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <div>
            <p className="text-sm leading-relaxed text-fog">
              Приложение использует Supabase — PostgreSQL как сервис. Создайте бесплатный проект на{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-pine-700 underline decoration-dotted underline-offset-2 hover:text-pine-800"
              >
                supabase.com
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
              , выполните SQL-скрипт ниже и вставьте URL проекта и anon-ключ.
            </p>
          </div>

          <div>
            <label htmlFor="db-url" className={label}>
              Project URL
            </label>
            <input
              id="db-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className={field}
            />
          </div>

          <div>
            <label htmlFor="db-key" className={label}>
              Anon public key
            </label>
            <input
              id="db-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className={field}
            />
            <p className="mt-1 text-[11px] text-fog">
              Anon-ключ — публичный, его можно хранить в клиенте.
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-pine-700 transition hover:bg-mint active:scale-95"
            >
              {showSchema ? "Скрыть" : "Показать"} SQL-скрипт для создания таблиц
            </button>
            {showSchema && (
              <div className="mt-2 rounded-lg border border-line bg-paper/70 p-3">
                <pre className="max-h-[300px] overflow-auto text-[11px] leading-relaxed text-ink">
                  {SCHEMA_SQL}
                </pre>
                <button
                  onClick={handleCopySchema}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-pine-700 px-3 py-1.5 text-xs font-bold text-cream transition hover:bg-pine-800 active:scale-95"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Скопировано!" : "Копировать SQL"}
                </button>
              </div>
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
              onClick={handleSave}
              className="flex-1 rounded-xl bg-pine-700 py-2.5 text-sm font-bold text-cream transition hover:bg-pine-800 active:scale-[0.98]"
            >
              Сохранить
            </button>
          </div>

          {url && key && (
            <div className="border-t border-line pt-4">
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-fog transition hover:bg-coral/10 hover:text-coral active:scale-95"
              >
                <X className="h-3.5 w-3.5" />
                Отключиться от базы данных
              </button>
              <p className="mt-1 text-[11px] text-fog">
                Данные останутся в Supabase, но приложение вернётся к локальному хранению.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

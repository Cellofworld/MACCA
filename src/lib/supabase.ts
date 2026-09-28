import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL_KEY = "massa.supabase.url";
const SUPABASE_KEY_KEY = "massa.supabase.key";

export function getSupabaseConfig(): { url: string; key: string } {
  return {
    url: localStorage.getItem(SUPABASE_URL_KEY) || "",
    key: localStorage.getItem(SUPABASE_KEY_KEY) || "",
  };
}

export function saveSupabaseConfig(url: string, key: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url);
  localStorage.setItem(SUPABASE_KEY_KEY, key);
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_URL_KEY);
  localStorage.removeItem(SUPABASE_KEY_KEY);
}

export function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return url.length > 0 && key.length > 0;
}

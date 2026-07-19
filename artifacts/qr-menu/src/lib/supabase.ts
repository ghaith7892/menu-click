import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co")
);

if (!supabaseConfigured) {
  console.error(
    "⚠️ MenuClick: Supabase غير مُهيَّأ.\n" +
    "يجب ضبط المتغيرات التالية في بيئة التشغيل:\n" +
    "  VITE_SUPABASE_URL  = https://xxxx.supabase.co\n" +
    "  VITE_SUPABASE_ANON_KEY = eyJ..."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-key"
);

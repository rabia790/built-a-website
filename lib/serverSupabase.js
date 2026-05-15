import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isServerSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const serverSupabase = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function safeInsert(table, payload) {
  if (!serverSupabase) return null;

  try {
    const { data, error } = await serverSupabase
      .from(table)
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error(`Could not insert ${table}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Could not insert ${table}:`, error);
    return null;
  }
}

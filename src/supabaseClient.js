import { createClient } from "@supabase/supabase-js";

// Client Supabase (progetto in region UE).
// La chiave "publishable"/anon è pensata per stare nel client: i dati sono protetti
// da Row Level Security lato database. Sovrascrivibili via env su Vercel:
//   REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY
const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || "https://qtuqyexskfnyqnrhaqvj.supabase.co";
const SUPABASE_ANON =
  process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_L4-P3L_jiqfvkh24cMZ2Lg_Femwrjd8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export default supabase;

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fallback logic for when evaluation users haven't set up Supabase yet
const hasSupabase = !!(supabaseUrl && supabaseAnonKey);

console.log("hasSupabase", hasSupabase);
export const supabase = hasSupabase
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

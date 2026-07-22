import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a dummy client if env vars are missing (for local dev without Supabase)
export const supabase = url && anon ? createClient(url, anon) : null;

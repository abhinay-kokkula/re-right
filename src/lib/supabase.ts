import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RewriteOption = {
  text: string;
  style: string;
  tone: string;
};

export type RewriteHistory = {
  id: string;
  original_text: string;
  rewrite_options: RewriteOption[];
  selected_option: number | null;
  created_at: string;
  user_session: string;
};

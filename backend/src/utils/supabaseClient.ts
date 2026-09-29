import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co' && !supabaseKey.includes('your-')) {
  try {
    client = createClient(supabaseUrl, supabaseKey);
    console.log('[EKSetu DB] Connected to Supabase PostgreSQL successfully.');
  } catch (err) {
    console.warn('[EKSetu DB] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[EKSetu DB] Supabase credentials not provided or using placeholders. Using in-memory fallback persistence for V1 prototype.');
}

export const supabase = client;

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const hasValidCredentials =
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseKey.includes('your-');

let client: SupabaseClient | null = null;

if (hasValidCredentials) {
  try {
    client = createClient(supabaseUrl!, supabaseKey!);
    console.log('[EKSetu DB] Connected to Supabase PostgreSQL audit & verification store.');
  } catch (err: any) {
    console.error('[EKSetu DB] Failed to initialize Supabase client:', err?.message || err);
    if (isProduction) {
      throw new Error(`[CRITICAL CONFIG ERROR] Deployed production instance failed to connect to Supabase: ${err?.message || err}`);
    }
  }
} else {
  if (isProduction) {
    const errorMsg = '[CRITICAL CONFIG ERROR] EKSetu Backend is running in production (NODE_ENV=production) but SUPABASE_URL and SUPABASE_KEY are not configured. The deployed system must not run without persistent database!';
    console.error(errorMsg);
    throw new Error(errorMsg);
  } else {
    console.log('[EKSetu DB] Local development mode: Using in-memory fallback persistence for audit and verification records.');
  }
}

export const supabase = client;

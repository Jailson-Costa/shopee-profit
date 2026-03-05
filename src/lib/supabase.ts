import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Provide a dummy lock to prevent "Lock broken by another request with the 'steal' option"
    // errors in the iframe/hot-reload environment.
    lock: (name, acquireTimeout, fn) => fn()
  }
});

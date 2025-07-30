/**
 * Supabase Client for Storage operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase not configured - Storage features will be disabled');
}

// Create a comprehensive mock client if not configured
const mockClient = {
  storage: {
    getBucket: () => Promise.resolve({ data: null, error: null }),
    createBucket: () => Promise.resolve({ data: null, error: null }),
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      list: () => Promise.resolve({ data: [], error: null }),
      remove: () => Promise.resolve({ error: null })
    })
  }
};

// Service role client for server-side operations
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : mockClient as any;

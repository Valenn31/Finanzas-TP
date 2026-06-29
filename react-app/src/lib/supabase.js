import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qpsdprjcuredetcbppwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwc2RwcmpjdXJlZGV0Y2JwcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjg1MDgsImV4cCI6MjA5NzY0NDUwOH0.0C918vHL2mL3Vi30k3-oH-blZ8a1nXrnBlRWiha1vw0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

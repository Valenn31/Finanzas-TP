/* =============================================
   supabase.js — Configuración del cliente
   ⚠️  REEMPLAZÁ los valores de SUPABASE_URL y
       SUPABASE_ANON_KEY con los de tu proyecto.
       Ver README.md para instrucciones.
============================================= */

const SUPABASE_URL      = 'https://qpsdprjcuredetcbppwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwc2RwcmpjdXJlZGV0Y2JwcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjg1MDgsImV4cCI6MjA5NzY0NDUwOH0.0C918vHL2mL3Vi30k3-oH-blZ8a1nXrnBlRWiha1vw0';

// Inicializa el cliente global usando el CDN ya cargado en index.html
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

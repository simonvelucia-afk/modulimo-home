import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://bpxscgrbxjscicpnheep.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweHNjZ3JieGpzY2ljcG5oZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYxNzIsImV4cCI6MjA5MDk3MjE3Mn0._M6HHhCwKuuqAzicDZzJp7ul0M3KpDBBDb6ImDWWcLo';

try {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await sb.from('app_config').select('value').eq('key', 'home_theme').maybeSingle();
  const theme = (data && data.value) || 'none';
  if (theme && theme !== 'none') {
    document.body.classList.add('theme-' + theme);
  }
} catch (e) {
  console.warn('[theme] load failed', e);
}

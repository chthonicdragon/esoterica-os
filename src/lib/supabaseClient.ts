import { createClient } from '@supabase/supabase-js';

// Подставьте ваш реальный URL и anon key из Supabase Project Settings
const SUPABASE_URL = 'https://esoterica-os.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnY3Vxcm14YWdocmNoenBrYWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjg0NTIsImV4cCI6MjA4ODMwNDQ1Mn0.Lh1kCl1uvxf483yj_5lYprtUrW46yaF0-L6rFu57xQo'; // замените на реальный ключ из Supabase

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: { apikey: SUPABASE_ANON_KEY },
  },
});


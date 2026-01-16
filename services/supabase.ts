
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://epwmiojemucoxaygymbn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_d7eucFjayvH2aBwF7Ws9fQ_SmzUOAa9';

// مقداردهی اولیه کلاینت سوپربیس برای استفاده در کل اپلیکیشن
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

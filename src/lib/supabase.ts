import { createClient } from '@supabase/supabase-js';

// PASTE YOUR SUPABASE URL AND ANON KEY HERE
const supabaseUrl = 'https://kxbzccczopddlhknzjxw.supabase.co';
const supabaseKey = 'sb_publishable_unj8LUescRolC7pykDLRhg_ou5g7gxq';

export const supabase = createClient(supabaseUrl, supabaseKey);

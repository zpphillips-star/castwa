import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owgtfdzmevgeoohnnltg.supabase.co'
const supabaseAnonKey = 'sb_publishable_csRqzEYvE40JKldk3cMl8A_hIr1_3dn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Optional: Typen importieren, falls du sie generiert hast
// import type { Database } from './database.types' 

// Die Umgebungsvariablen werden zur Laufzeit im Browser gelesen,
// daher brauchen wir process.env hier nicht.

// Client für Browser-Komponenten
// Er wird einmal erstellt und wiederverwendet.
export const supabase = createClientComponentClient()
// export const supabase = createClientComponentClient<Database>() // Mit DB-Typen

// Früherer Code (verwendet nicht die Auth Helpers):
/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
*/

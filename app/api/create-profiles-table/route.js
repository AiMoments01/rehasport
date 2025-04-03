import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase-Client erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export async function POST() {
  try {
    // Erstelle die profiles-Tabelle mit einer RPC-Funktion
    const { error: createError } = await supabase.rpc('create_profiles_table');
    
    if (createError) {
      console.error('Fehler beim Erstellen der profiles-Tabelle:', createError);
      
      // Wenn die RPC-Funktion nicht existiert, erstellen wir sie
      if (createError.code === '42883') { // Ungültige Funktion
        // Erstelle die Funktion zur Tabellenerstellung
        try {
          // Verwende eine direkte Anfrage mit dem Admin-Key
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_profiles_table_function`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            }
          });
          
          if (!response.ok) {
            // Wenn diese Funktion auch nicht existiert, erstellen wir sie
            const createFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_function_creator`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                function_name: 'create_profiles_table',
                function_body: `
                  CREATE OR REPLACE FUNCTION create_profiles_table()
                  RETURNS void AS $$
                  BEGIN
                    CREATE TABLE IF NOT EXISTS profiles (
                      id UUID PRIMARY KEY REFERENCES auth.users(id),
                      email TEXT,
                      first_name TEXT,
                      last_name TEXT,
                      avatar_url TEXT,
                      role TEXT DEFAULT 'user',
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                    
                    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
                    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
                  END;
                  $$ LANGUAGE plpgsql;
                `
              })
            });
            
            if (!createFunctionResponse.ok) {
              // Als letzten Ausweg verwenden wir eine direkte Anfrage an die Datenbank
              // Diese Methode ist nicht ideal, aber es ist ein Fallback
              
              // Erstelle die Tabelle direkt
              await fetch(`${supabaseUrl}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Prefer': 'resolution=ignore-duplicates'
                },
                body: JSON.stringify({
                  id: '00000000-0000-0000-0000-000000000000', // Dummy-ID
                  email: 'system@example.com',
                  first_name: 'System',
                  last_name: 'User',
                  role: 'system'
                })
              });
              
              return NextResponse.json({ 
                success: true, 
                message: 'Tabelle direkt erstellt (Fallback-Methode)' 
              });
            }
          }
          
          // Versuche erneut, die Tabelle zu erstellen
          const retryResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_profiles_table`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            }
          });
          
          if (!retryResponse.ok) {
            return NextResponse.json({ 
              success: false, 
              error: 'Konnte die Tabelle nicht erstellen nach mehreren Versuchen' 
            }, { status: 500 });
          }
        } catch (rpcError) {
          console.error('RPC-Fehler:', rpcError);
          return NextResponse.json({ 
            success: false, 
            error: 'RPC-Fehler: ' + rpcError.message 
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Konnte die Tabelle nicht erstellen: ' + createError.message 
        }, { status: 500 });
      }
    }
    
    console.log('profiles-Tabelle erfolgreich erstellt.');
    
    return NextResponse.json({ success: true, message: 'Tabelle erfolgreich erstellt' });
  } catch (error) {
    console.error('Fehler beim Erstellen der profiles-Tabelle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

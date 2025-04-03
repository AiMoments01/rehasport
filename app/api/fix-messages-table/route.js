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

export async function GET() {
  try {
    // Prüfe die aktuelle Struktur der messages-Tabelle
    const { data, error: tableError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    if (tableError && tableError.code !== '42P01') {
      console.error('Fehler beim Abrufen der Tabellenstruktur:', tableError);
      return NextResponse.json({ success: false, error: tableError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, tableExists: !tableError || tableError.code !== '42P01' });
  } catch (error) {
    console.error('Fehler beim Abrufen der Tabellenstruktur:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('Starte Reparatur der messages-Tabelle...');
    
    // Wir verwenden den gleichen SQL-Ansatz wie in der SQL-Datei
    const sqlCommands = [
      // 1. Lösche die Tabelle, falls sie existiert
      'DROP TABLE IF EXISTS messages;',
      
      // 2. Erstelle die Tabelle mit der korrekten Struktur
      `CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID NOT NULL,
        receiver_id UUID NOT NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // 3. Füge eine Test-Nachricht ein
      `INSERT INTO messages (sender_id, receiver_id, content, read)
      VALUES 
        ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Tabelle wurde automatisch repariert', true);`
    ];
    
    // Führe jeden SQL-Befehl einzeln aus
    for (const sql of sqlCommands) {
      try {
        console.log(`Führe SQL aus: ${sql.substring(0, 50)}...`);
        
        // Verwende die REST API direkt für SQL-Ausführung
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            sql: sql
          })
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.log(`Warnung bei SQL-Ausführung: ${errorData}`);
          // Wir fahren trotzdem fort, da einige Fehler erwartet sein könnten (z.B. wenn die Tabelle nicht existiert)
        }
      } catch (sqlError) {
        console.error(`Fehler bei der Ausführung von SQL: ${sql.substring(0, 50)}...`, sqlError);
        // Wir fahren trotzdem fort, um alle Befehle zu versuchen
      }
    }
    
    // Überprüfe, ob die Tabelle jetzt existiert und die richtigen Spalten hat
    console.log('Prüfe, ob die Tabelle korrekt erstellt wurde...');
    
    const { data: tableInfo, error: finalCheckError } = await supabase
      .from('messages')
      .select('sender_id, receiver_id', { head: true })
      .limit(1);
    
    if (finalCheckError) {
      console.error('Tabelle konnte nicht überprüft werden:', finalCheckError);
      return NextResponse.json({ 
        success: false, 
        error: 'Tabelle konnte nicht überprüft werden: ' + finalCheckError.message 
      }, { status: 500 });
    }
    
    // Überprüfe explizit, ob die receiver_id-Spalte existiert
    try {
      const { error: columnCheckError } = await supabase
        .from('messages')
        .select('receiver_id')
        .limit(1);
      
      if (columnCheckError) {
        console.error('receiver_id-Spalte existiert nicht:', columnCheckError);
        return NextResponse.json({ 
          success: false, 
          error: 'receiver_id-Spalte existiert nicht: ' + columnCheckError.message 
        }, { status: 500 });
      }
    } catch (columnError) {
      console.error('Fehler beim Überprüfen der receiver_id-Spalte:', columnError);
      return NextResponse.json({ 
        success: false, 
        error: 'Fehler beim Überprüfen der receiver_id-Spalte: ' + columnError.message 
      }, { status: 500 });
    }
    
    console.log('messages-Tabelle erfolgreich erstellt oder repariert.');
    return NextResponse.json({ success: true, message: 'Tabelle erfolgreich erstellt oder repariert' });
  } catch (error) {
    console.error('Unerwarteter Fehler beim Erstellen der messages-Tabelle:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Unerwarteter Fehler: ' + (error.message || String(error))
    }, { status: 500 });
  }
}

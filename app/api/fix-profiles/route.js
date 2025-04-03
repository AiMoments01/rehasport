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
    // Prüfe die aktuelle Struktur der profiles-Tabelle
    const { data: tableInfo, error: tableError } = await supabase.sql(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND table_schema = 'public'
    `);
    
    if (tableError) {
      console.error('Fehler beim Abrufen der Tabellenstruktur:', tableError);
      return NextResponse.json({ success: false, error: tableError.message }, { status: 500 });
    }
    
    // Prüfe, ob Benutzer in der profiles-Tabelle existieren
    const { data: profileCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Fehler beim Zählen der Profile:', countError);
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
    }
    
    // Prüfe, ob Benutzer in der auth.users-Tabelle existieren
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Fehler beim Abrufen der Auth-Benutzer:', authError);
      return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      tableInfo, 
      profileCount: profileCount?.count || 0,
      authUserCount: authUsers?.users?.length || 0 
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerinformationen:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    // 1. Prüfe, ob die profiles-Tabelle existiert
    const { data: tableExists, error: tableError } = await supabase.sql(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    // Wenn die Tabelle nicht existiert, erstellen wir sie
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      console.log('Die profiles-Tabelle existiert nicht. Erstelle sie...');
      
      // Erstelle die Tabelle
      const { error: createError } = await supabase.sql(`
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
      `);
      
      if (createError) {
        console.error('Fehler beim Erstellen der profiles-Tabelle:', createError);
        return NextResponse.json({ success: false, error: createError.message }, { status: 500 });
      }
      
      console.log('profiles-Tabelle erfolgreich erstellt.');
    }
    
    // 2. Hole alle Benutzer aus auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Fehler beim Abrufen der Auth-Benutzer:', authError);
      return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
    }
    
    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      return NextResponse.json({ success: false, message: 'Keine Auth-Benutzer gefunden' }, { status: 404 });
    }
    
    // 3. Migriere Benutzer von auth.users zu profiles
    const migrationResults = [];
    
    for (const user of authUsers.users) {
      // Prüfe, ob der Benutzer bereits in profiles existiert
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 bedeutet "Kein Datensatz gefunden"
        console.error(`Fehler beim Prüfen des Profils für Benutzer ${user.id}:`, profileError);
        migrationResults.push({ user: user.id, success: false, error: profileError.message });
        continue;
      }
      
      // Wenn der Benutzer nicht existiert, füge ihn hinzu
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            role: user.user_metadata?.role || 'user'
          });
        
        if (insertError) {
          console.error(`Fehler beim Hinzufügen des Profils für Benutzer ${user.id}:`, insertError);
          migrationResults.push({ user: user.id, success: false, error: insertError.message });
        } else {
          console.log(`Profil für Benutzer ${user.id} erfolgreich erstellt.`);
          migrationResults.push({ user: user.id, success: true });
        }
      } else {
        console.log(`Profil für Benutzer ${user.id} existiert bereits.`);
        migrationResults.push({ user: user.id, success: true, existing: true });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Benutzerprofile erfolgreich migriert', 
      results: migrationResults 
    });
  } catch (error) {
    console.error('Fehler bei der Benutzermigration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

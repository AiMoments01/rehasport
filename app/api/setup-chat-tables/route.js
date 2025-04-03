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
    // 1. Prüfe, ob die messages-Tabelle existiert
    const { error: checkError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    // Wenn die Tabelle nicht existiert, erstelle sie
    if (checkError && checkError.code === '42P01') { // Relation does not exist
      console.log('Die messages-Tabelle existiert nicht. Erstelle Tabelle...');
      
      // SQL zum Erstellen der messages-Tabelle
      const { error: sqlError } = await supabase.sql(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sender_id UUID NOT NULL,
          recipient_id UUID NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          read BOOLEAN DEFAULT FALSE
        );
        
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      `);
      
      if (sqlError) {
        console.error('Fehler beim direkten Erstellen der messages-Tabelle:', sqlError);
        return NextResponse.json({ success: false, error: sqlError.message }, { status: 500 });
      }
      
      console.log('messages-Tabelle erfolgreich erstellt.');
    }
    
    // 2. Prüfe, ob die profiles-Tabelle existiert (für Chat-Benutzer)
    const { error: profilesCheckError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    // Wenn die Tabelle nicht existiert, erstelle sie
    if (profilesCheckError && profilesCheckError.code === '42P01') {
      console.log('Die profiles-Tabelle existiert nicht. Erstelle Tabelle...');
      
      // SQL zum Erstellen der profiles-Tabelle
      const { error: sqlError } = await supabase.sql(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT,
          vorname TEXT,
          nachname TEXT,
          avatar_url TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
      `);
      
      if (sqlError) {
        console.error('Fehler beim direkten Erstellen der profiles-Tabelle:', sqlError);
        return NextResponse.json({ success: false, error: sqlError.message }, { status: 500 });
      }
      
      console.log('profiles-Tabelle erfolgreich erstellt.');
      
      // Füge einen Trigger hinzu, um neue Benutzer automatisch in profiles einzufügen
      const { error: triggerError } = await supabase.sql(`
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email)
          VALUES (NEW.id, NEW.email);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `);
      
      if (triggerError) {
        console.error('Fehler beim Erstellen des Triggers:', triggerError);
      } else {
        console.log('Trigger für automatische Profilanlage erfolgreich erstellt.');
      }
      
      // Migriere bestehende Benutzer in die profiles-Tabelle
      await migrateExistingUsers();
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Setup der Chat-Tabellen:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Migriert bestehende Benutzer in die profiles-Tabelle
 */
async function migrateExistingUsers() {
  try {
    // Hole alle Benutzer aus auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Fehler beim Abrufen der Benutzer:', authError);
      return;
    }
    
    // Hole alle vorhandenen Profile
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
      
    if (profilesError && profilesError.code !== '42P01') {
      console.error('Fehler beim Abrufen der Profile:', profilesError);
      return;
    }
    
    const existingProfileIds = (existingProfiles || []).map(profile => profile.id);
    
    // Finde Benutzer, die noch kein Profil haben
    const usersToMigrate = authUsers.users.filter(user => !existingProfileIds.includes(user.id));
    
    if (usersToMigrate.length === 0) {
      console.log('Keine Benutzer zum Migrieren gefunden.');
      return;
    }
    
    console.log(`${usersToMigrate.length} Benutzer zum Migrieren gefunden.`);
    
    // Erstelle Profile für diese Benutzer
    for (const user of usersToMigrate) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          vorname: user.user_metadata?.vorname || '',
          nachname: user.user_metadata?.nachname || ''
        });
        
      if (error) {
        console.error(`Fehler beim Migrieren des Benutzers ${user.id}:`, error);
      }
    }
    
    console.log('Benutzermigration abgeschlossen.');
  } catch (error) {
    console.error('Fehler bei der Benutzermigration:', error);
  }
}

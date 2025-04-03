'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RepairPage() {
  const [status, setStatus] = useState({
    profiles: 'idle',
    messages: 'idle',
    profilesResult: null,
    messagesResult: null,
    error: null
  });

  // Funktion zum Reparieren der Profile
  const repairProfiles = async () => {
    setStatus(prev => ({ ...prev, profiles: 'loading' }));
    try {
      // 1. Hole den aktuellen Benutzer
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!authData || !authData.user) {
        setStatus(prev => ({ 
          ...prev, 
          profiles: 'error', 
          error: 'Kein Benutzer angemeldet. Bitte melde dich an, um fortzufahren.' 
        }));
        return;
      }
      
      const user = authData.user;
      
      // 2. Prüfe, ob die profiles-Tabelle existiert
      const { count, error: tableError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (tableError) {
        console.log('Profiles-Tabelle existiert nicht oder ist nicht zugänglich. Erstelle sie...');
        try {
          // Erstelle die Tabelle über die API
          const response = await fetch('/api/create-profiles-table', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Fehler beim Erstellen der profiles-Tabelle über API');
          }
          
          console.log('Profiles-Tabelle erfolgreich über API erstellt');
        } catch (apiError) {
          console.error('API-Fehler:', apiError);
          throw apiError;
        }
      }
      
      // 3. Prüfe, ob der Benutzer bereits in profiles existiert
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Wenn der Benutzer nicht existiert oder ein Fehler auftritt (außer "nicht gefunden")
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 bedeutet "Kein Datensatz gefunden"
        // Versuche, die Tabelle zu erstellen, indem wir einen Eintrag einfügen
        try {
          // Erstelle einen Dummy-Eintrag, um die Tabelle zu erstellen
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
            console.error('Fehler beim Erstellen des Profils:', insertError);
            throw insertError;
          }
        } catch (createError) {
          console.error('Fehler beim Erstellen des Profils:', createError);
          throw createError;
        }
      }
      
      // Wenn der Benutzer nicht existiert (PGRST116), füge ihn hinzu
      if (profileError && profileError.code === 'PGRST116') {
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
          throw insertError;
        }
        
        console.log(`Profil für Benutzer ${user.id} erfolgreich erstellt.`);
      } else if (!profileError) {
        console.log(`Profil für Benutzer ${user.id} existiert bereits.`);
      }
      
      // 4. Erstelle Demo-Benutzer für Chat-Tests
      const demoUsers = [
        {
          email: 'demo1@example.com',
          first_name: 'Max',
          last_name: 'Mustermann',
          avatar_url: null,
          role: 'user'
        },
        {
          email: 'demo2@example.com',
          first_name: 'Erika',
          last_name: 'Musterfrau',
          avatar_url: null,
          role: 'user'
        },
        {
          email: 'demo3@example.com',
          first_name: 'Thomas',
          last_name: 'Test',
          avatar_url: null,
          role: 'user'
        }
      ];
      
      // Füge Demo-Benutzer hinzu
      let demoUsersCreated = 0;
      for (const demoUser of demoUsers) {
        try {
          // Prüfe, ob der Benutzer bereits existiert (anhand der E-Mail)
          const { data: existingDemo, error: demoCheckError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', demoUser.email)
            .maybeSingle(); // Verwende maybeSingle statt single, um keinen Fehler zu werfen
          
          if (!existingDemo) {
            // Generiere eine zufällige UUID für den Benutzer
            const randomUUID = 'demo-' + Math.random().toString(36).substring(2, 15);
            
            // Füge den Benutzer direkt in die profiles-Tabelle ein
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: randomUUID,
                ...demoUser
              });
            
            if (insertError) {
              console.error(`Fehler beim Hinzufügen des Demo-Benutzers ${demoUser.email}:`, insertError);
              
              // Alternativer Ansatz: Versuche ohne ID einzufügen
              const { error: fallbackError } = await supabase
                .from('profiles')
                .insert(demoUser);
                
              if (fallbackError) {
                console.error(`Auch alternativer Ansatz fehlgeschlagen für ${demoUser.email}:`, fallbackError);
              } else {
                console.log(`Demo-Benutzer ${demoUser.email} erfolgreich mit Fallback-Methode erstellt.`);
                demoUsersCreated++;
              }
            } else {
              console.log(`Demo-Benutzer ${demoUser.email} erfolgreich erstellt mit ID ${randomUUID}.`);
              demoUsersCreated++;
            }
          } else {
            console.log(`Demo-Benutzer ${demoUser.email} existiert bereits.`);
            demoUsersCreated++;
          }
        } catch (demoError) {
          console.error(`Fehler bei der Erstellung des Demo-Benutzers ${demoUser.email}:`, demoError);
          // Wir setzen fort, um andere Demo-Benutzer zu erstellen
        }
      }
      
      // 5. Überprüfe, wie viele Benutzer jetzt in der Tabelle sind
      const { data: allProfiles, error: countError } = await supabase
        .from('profiles')
        .select('*');
      
      const profileCount = allProfiles ? allProfiles.length : 0;
      
      setStatus(prev => ({ 
        ...prev, 
        profiles: 'complete', 
        profilesResult: { 
          message: `Profil für ${user.email} und ${profileCount - 1} weitere Benutzer erfolgreich erstellt/überprüft.`,
          results: { 
            currentUser: user.email,
            totalProfiles: profileCount,
            demoUsersCreated: demoUsersCreated
          }
        } 
      }));
    } catch (error) {
      console.error('Fehler bei der Benutzermigration:', error);
      setStatus(prev => ({ 
        ...prev, 
        profiles: 'error', 
        error: error.message || 'Unbekannter Fehler' 
      }));
    }
  };

  // Funktion zum Reparieren der Messages-Tabelle
  const repairMessages = async () => {
    setStatus(prev => ({ ...prev, messages: 'loading' }));
    try {
      // 1. Prüfe, ob die messages-Tabelle existiert
      const { data, error: tableError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      // 2. Erstelle eine Nachricht, um die Tabelle zu erstellen oder zu testen
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!authData || !authData.user) {
        setStatus(prev => ({ 
          ...prev, 
          messages: 'error', 
          error: 'Kein Benutzer angemeldet. Bitte melde dich an, um fortzufahren.' 
        }));
        return;
      }
      
      const user = authData.user;
      
      // 3. Erstelle eine Test-Nachricht
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: user.id, // Sende an sich selbst als Test
          content: 'Test-Nachricht zur Tabellenerstellung',
          read: true
        });
      
      if (insertError && insertError.code !== '23505') { // 23505 bedeutet "Doppelter Schlüssel"
        console.error('Fehler beim Erstellen der Test-Nachricht:', insertError);
        
        // Wenn die Tabelle nicht existiert, versuche, sie zu erstellen
        if (insertError.code === '42P01') { // 42P01 bedeutet "Tabelle existiert nicht"
          // Verwende die REST-API, um die Tabelle zu erstellen
          try {
            // Erstelle die Tabelle durch direkte Anfrage an die API
            const response = await fetch('/api/fix-messages-table', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Fehler beim Erstellen der Tabelle');
            }
            
            // Versuche erneut, eine Test-Nachricht zu erstellen
            const { error: retryError } = await supabase
              .from('messages')
              .insert({
                sender_id: user.id,
                recipient_id: user.id, // Sende an sich selbst als Test
                content: 'Test-Nachricht zur Tabellenerstellung (Retry)',
                read: true
              });
            
            if (retryError && retryError.code !== '23505') {
              throw retryError;
            }
          } catch (apiError) {
            console.error('API-Fehler:', apiError);
            throw apiError;
          }
        } else {
          throw insertError;
        }
      }
      
      setStatus(prev => ({ 
        ...prev, 
        messages: 'complete', 
        messagesResult: { message: 'Messages-Tabelle erfolgreich überprüft und repariert' } 
      }));
    } catch (error) {
      console.error('Fehler beim Neuerstellen der messages-Tabelle:', error);
      setStatus(prev => ({ 
        ...prev, 
        messages: 'error', 
        error: error.message || 'Unbekannter Fehler' 
      }));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Datenbank-Reparatur</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Benutzerprofile reparieren */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Benutzerprofile</h2>
          
          <div className="mb-4">
            <button
              onClick={repairProfiles}
              disabled={status.profiles === 'loading'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {status.profiles === 'loading' ? 'Wird repariert...' : 'Profile reparieren'}
            </button>
          </div>
          
          {status.profiles === 'complete' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p><strong>Erfolg:</strong> {status.profilesResult?.message}</p>
              {status.profilesResult?.results && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Details anzeigen</summary>
                  <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(status.profilesResult.results, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          {status.profiles === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p><strong>Fehler:</strong> {status.error}</p>
            </div>
          )}
        </div>
        
        {/* Messages-Tabelle reparieren */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Messages-Tabelle</h2>
          
          <div className="mb-4">
            <button
              onClick={repairMessages}
              disabled={status.messages === 'loading'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {status.messages === 'loading' ? 'Wird repariert...' : 'Messages-Tabelle reparieren'}
            </button>
          </div>
          
          {status.messages === 'complete' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p><strong>Erfolg:</strong> {status.messagesResult?.message}</p>
            </div>
          )}
          
          {status.messages === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p><strong>Fehler:</strong> {status.error}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Nächste Schritte:</h3>
        <ol className="list-decimal list-inside">
          <li className="mb-2">Klicke auf "Profile reparieren", um die Benutzerprofile zu erstellen</li>
          <li className="mb-2">Klicke auf "Messages-Tabelle reparieren", um die Chat-Tabelle zu überprüfen</li>
          <li className="mb-2">Gehe zur <a href="/chat" className="text-blue-500 hover:underline">Chat-Seite</a>, um zu prüfen, ob alles funktioniert</li>
        </ol>
      </div>
    </div>
  );
}

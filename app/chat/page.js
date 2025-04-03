// app/chat/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import LogoutButton from '../../components/LogoutButton'; // Annahme: LogoutButton existiert
import { ArrowLeft, Send } from 'lucide-react'; // Icons hinzufügen

export default function ChatPage() {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(''); // E-Mail des eingeloggten Benutzers
  const [users, setUsers] = useState([]); // Liste potenzieller Chatpartner
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedChatPartner, setSelectedChatPartner] = useState(null); // Ausgewählter Benutzer
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  // 1. Benutzer-ID des aktuellen Benutzers abrufen
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          setUserEmail(user.email);
          console.log('Benutzer-ID:', user.id);
        } else {
          setError('Nicht eingeloggt. Bitte melden Sie sich an.');
          router.push('/login');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Fehler beim Abrufen des Benutzers.');
      }
    };

    fetchUserId();
  }, [router]);

  // 2. Chat-Partner laden
  useEffect(() => {
    if (!userId) return;

    const fetchChatPartners = async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        console.log('Versuche Teilnehmer als Chat-Partner zu laden');
        
        // Prüfen, ob die teilnehmer-Tabelle existiert
        const { count, error: countError } = await supabase
          .from('teilnehmer')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Fehler beim Prüfen der teilnehmer-Tabelle:', countError);
          throw new Error('Die teilnehmer-Tabelle existiert nicht oder ist nicht zugänglich.');
        }
        
        // Direkte Datenbankabfrage für Teilnehmer
        const { data, error } = await supabase
          .from('teilnehmer')
          .select('*')
          .order('nachname', { ascending: true });
        
        if (error) {
          console.error('Supabase error details:', error);
          throw error;
        }
        
        console.log('Teilnehmer geladen:', data);
        
        // Wenn keine Teilnehmer gefunden wurden oder die Liste leer ist, verwenden wir Demo-Benutzer
        if (!data || data.length === 0) {
          console.log('Keine Teilnehmer gefunden, verwende Demo-Benutzer');
          // Demo-Benutzer anzeigen
          setUsers([
            {
              id: 'demo-user-1',
              email: 'demo1@example.com',
              first_name: 'Max',
              last_name: 'Mustermann',
              is_demo: true
            },
            {
              id: 'demo-user-2',
              email: 'demo2@example.com',
              first_name: 'Erika',
              last_name: 'Musterfrau',
              is_demo: true
            },
            {
              id: 'demo-user-3',
              email: 'demo3@example.com',
              first_name: 'Thomas',
              last_name: 'Test',
              is_demo: true
            }
          ]);
          setLoadingUsers(false);
          return;
        }
        
        // Transformiere die Teilnehmerdaten in das Format, das die Chat-Komponente erwartet
        const formattedUsers = (data || []).map(teilnehmer => ({
          id: teilnehmer.id,
          email: teilnehmer.email || 'Keine E-Mail',
          first_name: teilnehmer.vorname || '',
          last_name: teilnehmer.nachname || '',
          telefon: teilnehmer.telefon || '',
          is_demo: false
        }));
        
        setUsers(formattedUsers);
      } catch (err) {
        console.error('Fehler beim Laden der Chat-Partner:', err);
        setError(`Fehler beim Laden der Chat-Partner: ${err.message}`);
        
        // Fallback: Demo-Benutzer anzeigen
        setUsers([
          {
            id: 'demo-user-1',
            email: 'demo1@example.com',
            first_name: 'Max',
            last_name: 'Mustermann',
            is_demo: true
          },
          {
            id: 'demo-user-2',
            email: 'demo2@example.com',
            first_name: 'Erika',
            last_name: 'Musterfrau',
            is_demo: true
          },
          {
            id: 'demo-user-3',
            email: 'demo3@example.com',
            first_name: 'Thomas',
            last_name: 'Test',
            is_demo: true
          }
        ]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchChatPartners();
  }, [userId]);

  // Funktion zum Reparieren der messages-Tabelle
  const repairMessagesTable = async () => {
    setIsRepairing(true);
    setError(null);
    setRepairSuccess(false);
    
    try {
      console.log('Starte Reparatur der messages-Tabelle...');
      const response = await fetch('/api/fix-messages-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Fehler beim Reparieren der Datenbank');
      }
      
      console.log('Datenbank erfolgreich repariert:', result);
      setRepairSuccess(true);
      
      // Nach erfolgreicher Reparatur Nachrichten neu laden
      if (selectedChatPartner) {
        setTimeout(() => {
          fetchMessages();
        }, 1000);
      }
    } catch (err) {
      console.error('Fehler beim Reparieren der Datenbank:', err);
      setError(`Fehler beim Reparieren der Datenbank: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // 3. Nachrichten laden, wenn ein Chat-Partner ausgewählt wurde
  useEffect(() => {
    if (!userId || !selectedChatPartner) return;
    
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        console.log('Lade Nachrichten für Chat mit:', selectedChatPartner.id);
        
        // Wenn es sich um einen Demo-Benutzer handelt, simulieren wir Nachrichten
        if (selectedChatPartner.is_demo) {
          console.log('Demo-Benutzer ausgewählt, simuliere Nachrichten');
          // Simulierte Nachrichten für Demo-Benutzer
          const simulatedMessages = [
            {
              id: `demo-msg-${Date.now()}-1`,
              sender_id: selectedChatPartner.id,
              receiver_id: userId,
              content: `Hallo! Ich bin ${selectedChatPartner.first_name} ${selectedChatPartner.last_name}, ein Demo-Benutzer.`,
              created_at: new Date(Date.now() - 3600000).toISOString() // 1 Stunde zuvor
            }
          ];
          setMessages(simulatedMessages);
          setLoadingMessages(false);
          return;
        }
        
        // Prüfen, ob die messages-Tabelle existiert und die richtigen Spalten hat
        try {
          const { data: tableCheck, error: tableError } = await supabase
            .from('messages')
            .select('sender_id, receiver_id', { head: true })
            .limit(1);
            
          if (tableError) {
            console.error('Fehler beim Prüfen der messages-Tabelle:', tableError);
            
            // Prüfen, ob die Tabelle nicht existiert (Code 42P01) oder Spalten fehlen
            if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
              throw new Error('Die messages-Tabelle existiert nicht oder hat eine falsche Struktur. Bitte reparieren Sie die Datenbank.');
            } else {
              throw new Error(`Fehler beim Zugriff auf die messages-Tabelle: ${tableError.message}`);
            }
          }
        } catch (tableError) {
          console.error('Fehler beim Prüfen der messages-Tabelle:', tableError);
          throw tableError;
        }
        
        // Vereinfachte Abfrage für Nachrichten
        // Wir holen alle Nachrichten, bei denen der aktuelle Benutzer beteiligt ist
        let { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error('Fehler beim Laden der Nachrichten:', error);
          
          // Wenn der Fehler auf fehlende Spalten hinweist, müssen wir die Tabelle reparieren
          if (error.message && (error.message.includes('does not exist') || error.message.includes('column'))) {
            throw new Error('Die messages-Tabelle hat eine falsche Struktur. Bitte reparieren Sie die Datenbank.');
          }
          
          // Versuche einen alternativen Ansatz mit zwei separaten Abfragen
          try {
            console.log('Versuche alternativen Ansatz für Nachrichten...');
            
            // Nachrichten, die der Benutzer gesendet hat
            const { data: sentMessages, error: sentError } = await supabase
              .from('messages')
              .select('*')
              .eq('sender_id', userId)
              .eq('receiver_id', selectedChatPartner.id)
              .order('created_at', { ascending: true });
              
            if (sentError) {
              // Wenn auch hier ein Spaltenfehler auftritt, müssen wir die Tabelle reparieren
              if (sentError.message && (sentError.message.includes('does not exist') || sentError.message.includes('column'))) {
                throw new Error('Die messages-Tabelle hat eine falsche Struktur. Bitte reparieren Sie die Datenbank.');
              }
              throw sentError;
            }
            
            // Nachrichten, die der Benutzer empfangen hat
            const { data: receivedMessages, error: receivedError } = await supabase
              .from('messages')
              .select('*')
              .eq('sender_id', selectedChatPartner.id)
              .eq('receiver_id', userId)
              .order('created_at', { ascending: true });
              
            if (receivedError) {
              // Wenn auch hier ein Spaltenfehler auftritt, müssen wir die Tabelle reparieren
              if (receivedError.message && (receivedError.message.includes('does not exist') || receivedError.message.includes('column'))) {
                throw new Error('Die messages-Tabelle hat eine falsche Struktur. Bitte reparieren Sie die Datenbank.');
              }
              throw receivedError;
            }
            
            // Kombiniere beide Ergebnisse
            data = [...(sentMessages || []), ...(receivedMessages || [])].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
          } catch (alternativeError) {
            console.error('Auch alternativer Ansatz fehlgeschlagen:', alternativeError);
            throw alternativeError; // Werfe den neuen Fehler
          }
        }
        
        console.log('Geladene Nachrichten:', data);
        
        // Filtern der Nachrichten zwischen dem aktuellen Benutzer und dem ausgewählten Chat-Partner
        const filteredMessages = (data || []).filter(msg => 
          (msg.sender_id === userId && msg.receiver_id === selectedChatPartner.id) || 
          (msg.sender_id === selectedChatPartner.id && msg.receiver_id === userId)
        );
        
        setMessages(filteredMessages);
      } catch (err) {
        console.error('Fehler beim Laden der Nachrichten:', err);
        // Stellen Sie sicher, dass wir eine Fehlermeldung haben, auch wenn err.message leer ist
        const errorMessage = err.message || (err.toString && err.toString()) || JSON.stringify(err) || 'Unbekannter Fehler';
        setError(`Fehler beim Laden der Nachrichten: ${errorMessage}`);
        
        // Wenn es sich um einen Demo-Benutzer handelt, zeigen wir trotzdem simulierte Nachrichten an
        if (selectedChatPartner && selectedChatPartner.is_demo) {
          const simulatedMessages = [
            {
              id: `demo-msg-${Date.now()}-1`,
              sender_id: selectedChatPartner.id,
              receiver_id: userId,
              content: `Hallo! Ich bin ${selectedChatPartner.first_name} ${selectedChatPartner.last_name}, ein Demo-Benutzer.`,
              created_at: new Date(Date.now() - 3600000).toISOString() // 1 Stunde zuvor
            }
          ];
          setMessages(simulatedMessages);
        } else {
          setMessages([]);
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    
    // Echtzeit-Abonnement für neue Nachrichten
    let subscription;
    try {
      subscription = supabase
        .channel('messages-channel')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}` 
        }, (payload) => {
          // Nur Nachrichten vom ausgewählten Chat-Partner hinzufügen
          if (payload.new && payload.new.sender_id === selectedChatPartner.id) {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
          }
        })
        .subscribe();
    } catch (err) {
      console.error('Fehler beim Einrichten des Echtzeit-Abonnements:', err);
      // Wir setzen keinen Fehler, da das Hauptfunktionalität trotzdem funktionieren sollte
    }
      
    return () => {
      // Abonnement beenden, wenn die Komponente unmounted wird
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (err) {
          console.error('Fehler beim Entfernen des Channels:', err);
        }
      }
    };
  }, [userId, selectedChatPartner]);

  // 4. Automatisch zum Ende der Nachrichten scrollen, wenn neue Nachrichten hinzugefügt werden
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 5. Chatpartner auswählen
  const handleSelectUser = (user) => {
    setSelectedChatPartner(user);
  };

  // 6. Funktion zum Senden einer neuen Nachricht
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatPartner) return;
    
    // Neue Nachricht erstellen
    const messageContent = newMessage.trim();
    setNewMessage(''); // Eingabefeld zurücksetzen
    
    // Temporäre ID für die neue Nachricht
    const tempId = `temp-${Date.now()}`;
    
    // Optimistisches UI-Update: Nachricht sofort anzeigen
    const newMessageObj = {
      id: tempId,
      sender_id: userId,
      receiver_id: selectedChatPartner.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      isTemp: true // Markiere als temporär
    };
    
    setMessages(prev => [...prev, newMessageObj]);
    scrollToBottom();
    
    // Wenn es sich um einen Demo-Benutzer handelt, simulieren wir eine Antwort
    if (selectedChatPartner.is_demo) {
      setTimeout(() => {
        const responseOptions = [
          `Danke für deine Nachricht! Als Demo-Benutzer kann ich leider nicht wirklich antworten.`,
          `Hallo! Schön, von dir zu hören. Ich bin ${selectedChatPartner.first_name}, ein Demo-Benutzer.`,
          `Interessant! Wenn du mit echten Teilnehmern chatten möchtest, wähle einen aus der Liste.`
        ];
        
        const responseIndex = Math.floor(Math.random() * responseOptions.length);
        const responseMessage = {
          id: `demo-response-${Date.now()}`,
          sender_id: selectedChatPartner.id,
          receiver_id: userId,
          content: responseOptions[responseIndex],
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, responseMessage]);
        scrollToBottom();
      }, 1000 + Math.random() * 2000); // Zufällige Verzögerung zwischen 1-3 Sekunden
      
      return;
    }
    
    // Echte Nachricht an die Datenbank senden
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: selectedChatPartner.id,
          content: messageContent,
          read: false
        })
        .select();
      
      if (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
        setError(`Fehler beim Senden der Nachricht: ${error.message || JSON.stringify(error)}`);
        
        // Entferne die temporäre Nachricht
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        return;
      }
      
      console.log('Nachricht erfolgreich gesendet:', data);
      
      // Ersetze die temporäre Nachricht durch die echte
      if (data && data.length > 0) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? data[0] : msg)
        );
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Senden der Nachricht:', err);
      setError(`Unerwarteter Fehler beim Senden der Nachricht: ${err.message || JSON.stringify(err)}`);
      
      // Entferne die temporäre Nachricht
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  // 7. Zum Ende der Nachrichten scrollen
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">{userEmail}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="md:grid md:grid-cols-3 md:divide-x md:divide-gray-200 dark:md:divide-gray-700">
            {/* Benutzer-Liste */}
            <aside className={`${selectedChatPartner ? 'hidden md:block' : 'block'} md:col-span-1 bg-gray-50 dark:bg-gray-900`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold">Teilnehmer</h2>
              </div>
              <div className="overflow-y-auto h-[calc(100vh-12rem)]">
                {loadingUsers && (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                )}
                {error && error.includes('reparieren') && !loadingUsers && (
                  <div className="p-4 text-red-500">
                    {error}
                  </div>
                )}
                {!loadingUsers && users.length === 0 && (
                  <div className="p-4 text-gray-500">
                    Keine Teilnehmer gefunden.
                  </div>
                )}
                <ul>
                  {users.map((user) => (
                    <li key={user.id}>
                      <button
                        onClick={() => handleSelectUser(user)}
                        className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none ${
                          selectedChatPartner?.id === user.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-lg font-semibold text-white">
                              {user.first_name && user.first_name[0]}
                              {user.last_name && user.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.first_name} {user.last_name}
                              {user.is_demo && <span className="ml-2 text-xs text-gray-500">(Demo)</span>}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email || user.telefon || 'Keine Kontaktdaten'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Chat-Bereich */}
            <main className={`${selectedChatPartner ? 'block' : 'hidden md:block'} md:col-span-2 flex flex-col h-[calc(100vh-12rem)]`}>
              {!selectedChatPartner ? (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                  Wähle einen Benutzer aus, um den Chat zu beginnen.
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
                    <button onClick={() => setSelectedChatPartner(null)} className="md:hidden p-1 rounded hover:bg-gray-100">
                       <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-semibold">
                      Chat mit {
                        selectedChatPartner.first_name && selectedChatPartner.last_name 
                          ? `${selectedChatPartner.first_name} ${selectedChatPartner.last_name}`
                          : selectedChatPartner.email || `Benutzer ${selectedChatPartner.id.substring(0, 6)}`
                      }
                      {selectedChatPartner.is_demo && <span className="ml-2 text-xs text-gray-500">(Demo)</span>}
                    </h2>
                  </div>

                  {/* Nachrichtenbereich */}
                  <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {loadingMessages && <p className="text-center text-gray-500">Lade Nachrichten...</p>}
                    
                    {error && (
                      <div className="text-center">
                        <p className="text-red-500">{error}</p>
                        {error.includes('messages-Tabelle') && (
                          <button 
                            onClick={repairMessagesTable}
                            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md text-sm"
                          >
                            Nachrichten-Tabelle reparieren
                          </button>
                        )}
                      </div>
                    )}
                    
                    {!loadingMessages && messages.length === 0 && !error && (
                      <p className="text-center text-gray-500">Noch keine Nachrichten.</p>
                    )}
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === userId ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} /> {/* Anker zum Scrollen */} 
                  </div>

                  {/* Eingabebereich */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nachricht eingeben..."
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedChatPartner}
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={!newMessage.trim() || !selectedChatPartner}
                      >
                        <Send size={18} className="mr-1"/> Senden
                      </button>
                    </form>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
      {error && error.includes('messages-Tabelle') && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 mb-2">Es gibt ein Problem mit der Nachrichten-Tabelle. Bitte klicken Sie auf den Button, um die Tabelle zu reparieren.</p>
          <button 
            onClick={repairMessagesTable}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
          >
            Nachrichten-Tabelle reparieren
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mb-4 relative">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
          
          {(error.includes('messages-Tabelle existiert nicht') || 
            error.includes('falsche Struktur') || 
            error.includes('column') || 
            error.includes('does not exist')) && (
            <div className="mt-2">
              <button
                onClick={repairMessagesTable}
                disabled={isRepairing}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isRepairing ? 'Repariere Datenbank...' : 'Datenbank reparieren'}
              </button>
            </div>
          )}
        </div>
      )}
      {repairSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mb-4 relative">
          <strong className="font-bold">Erfolg: </strong>
          <span className="block sm:inline">Die Datenbank wurde erfolgreich repariert!</span>
        </div>
      )}
    </div>
  );
}

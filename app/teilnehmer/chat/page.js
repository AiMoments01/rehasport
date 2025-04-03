'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  MessageSquare,
  ChevronLeft,
  Send,
  User,
  Clock,
  RefreshCw
} from 'lucide-react';
import LogoutButton from '../../../components/LogoutButton';

export default function TeilnehmerChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [teilnehmerData, setTeilnehmerData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showMobileContacts, setShowMobileContacts] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Benutzer-Session abrufen
  useEffect(() => {
    async function getSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session) {
          // Keine aktive Sitzung gefunden, zur Login-Seite umleiten
          router.push('/');
          return;
        }
        
        // Überprüfen, ob der Benutzer ein Teilnehmer ist
        if (data.session.user.user_metadata?.role !== 'teilnehmer') {
          // Benutzer ist kein Teilnehmer, zum allgemeinen Dashboard umleiten
          router.push('/dashboard');
          return;
        }
        
        setUser(data.session.user);
      } catch (err) {
        console.error('Fehler beim Abrufen der Session:', err);
        setError(err.message);
      }
    }
    
    getSession();
    
    // Listener für Authentifizierungsänderungen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (session) {
          setUser(session.user);
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // Teilnehmer-Daten laden
  useEffect(() => {
    async function loadTeilnehmerData() {
      if (!user) return;
      
      try {
        // Teilnehmer-Profil laden
        const { data: teilnehmerProfile, error: teilnehmerError } = await supabase
          .from('teilnehmer')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (teilnehmerError) {
          console.error('Fehler beim Laden des Teilnehmerprofils:', teilnehmerError);
          return;
        }
        
        if (!teilnehmerProfile) {
          console.error('Kein Teilnehmerprofil gefunden');
          return;
        }
        
        setTeilnehmerData(teilnehmerProfile);
        
        // Kontakte laden (Trainer und Admins)
        try {
          // Trainer laden
          const { data: trainer, error: trainerError } = await supabase
            .from('trainer')
            .select('id, name, email')
            .eq('aktiv', true);
          
          if (trainerError) {
            console.error('Fehler beim Laden der Trainer:', trainerError);
          }
          
          // Admins laden
          const { data: admins, error: adminsError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'admin');
          
          if (adminsError) {
            console.error('Fehler beim Laden der Admins:', adminsError);
          }
          
          // Kontakte zusammenführen
          const allContacts = [
            ...(trainer || []).map(t => ({
              id: `trainer_${t.id}`,
              name: t.name,
              email: t.email,
              type: 'trainer'
            })),
            ...(admins || []).map(a => ({
              id: `admin_${a.id}`,
              name: a.full_name || a.email,
              email: a.email,
              type: 'admin'
            }))
          ];
          
          setContacts(allContacts);
          
          // Ersten Kontakt auswählen, wenn vorhanden
          if (allContacts.length > 0) {
            setSelectedContact(allContacts[0]);
          }
        } catch (contactsErr) {
          console.error('Fehler beim Laden der Kontakte:', contactsErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden der Teilnehmerdaten:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadTeilnehmerData();
  }, [user, supabase]);

  // Nachrichten laden
  useEffect(() => {
    async function loadMessages() {
      if (!teilnehmerData || !selectedContact) return;
      
      try {
        setLoading(true);
        
        let receiverId;
        if (selectedContact.type === 'trainer') {
          receiverId = selectedContact.id.replace('trainer_', '');
        } else if (selectedContact.type === 'admin') {
          receiverId = selectedContact.id.replace('admin_', '');
        }
        
        // Nachrichten zwischen Teilnehmer und ausgewähltem Kontakt laden
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${teilnehmerData.id},receiver_id.eq.${receiverId},sender_type.eq.teilnehmer,receiver_type.eq.${selectedContact.type}),and(sender_id.eq.${receiverId},receiver_id.eq.${teilnehmerData.id},sender_type.eq.${selectedContact.type},receiver_type.eq.teilnehmer)`)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Fehler beim Laden der Nachrichten:', error);
          return;
        }
        
        setMessages(data || []);
      } catch (err) {
        console.error('Fehler beim Laden der Nachrichten:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadMessages();
    
    // Echtzeit-Abonnement für neue Nachrichten
    let subscription;
    
    async function subscribeToMessages() {
      if (!teilnehmerData) return;
      
      subscription = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${teilnehmerData.id}`
          },
          (payload) => {
            // Neue Nachricht hinzufügen, wenn sie vom aktuell ausgewählten Kontakt stammt
            if (selectedContact && 
                payload.new.sender_type === selectedContact.type && 
                payload.new.sender_id.toString() === selectedContact.id.replace(`${selectedContact.type}_`, '')) {
              setMessages(prev => [...prev, payload.new]);
            }
          }
        )
        .subscribe();
    }
    
    subscribeToMessages();
    
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [teilnehmerData, selectedContact, supabase]);

  // Zum Ende der Nachrichtenliste scrollen, wenn neue Nachrichten hinzugefügt werden
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Nachricht senden
  async function sendMessage(e) {
    e.preventDefault();
    
    if (!newMessage.trim() || !teilnehmerData || !selectedContact) return;
    
    try {
      setSending(true);
      
      let receiverId;
      if (selectedContact.type === 'trainer') {
        receiverId = selectedContact.id.replace('trainer_', '');
      } else if (selectedContact.type === 'admin') {
        receiverId = selectedContact.id.replace('admin_', '');
      }
      
      const messageData = {
        content: newMessage.trim(),
        sender_id: teilnehmerData.id,
        sender_type: 'teilnehmer',
        receiver_id: receiverId,
        receiver_type: selectedContact.type,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
      
      if (error) {
        throw error;
      }
      
      // Optimistisches Update der UI
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
    } catch (err) {
      console.error('Fehler beim Senden der Nachricht:', err);
      alert('Fehler beim Senden der Nachricht: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  // Datum formatieren
  function formatiereDatum(datumString) {
    if (!datumString) return '';
    
    const datum = new Date(datumString);
    return datum.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  
  // Uhrzeit formatieren
  function formatiereUhrzeit(datumString) {
    if (!datumString) return '';
    
    const datum = new Date(datumString);
    return datum.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Nachrichten neu laden
  async function refreshMessages() {
    if (!teilnehmerData || !selectedContact) return;
    
    try {
      setLoading(true);
      
      let receiverId;
      if (selectedContact.type === 'trainer') {
        receiverId = selectedContact.id.replace('trainer_', '');
      } else if (selectedContact.type === 'admin') {
        receiverId = selectedContact.id.replace('admin_', '');
      }
      
      // Nachrichten zwischen Teilnehmer und ausgewähltem Kontakt laden
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${teilnehmerData.id},receiver_id.eq.${receiverId},sender_type.eq.teilnehmer,receiver_type.eq.${selectedContact.type}),and(sender_id.eq.${receiverId},receiver_id.eq.${teilnehmerData.id},sender_type.eq.${selectedContact.type},receiver_type.eq.teilnehmer)`)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setMessages(data || []);
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Nachrichten:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !teilnehmerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Chat-Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Fehler</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  if (!teilnehmerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">Kein Teilnehmerprofil gefunden</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Es wurde kein Teilnehmerprofil für Ihren Account gefunden. Bitte kontaktieren Sie einen Administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Nachrichten
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <div className="mb-8">
            <Link href="/teilnehmer/dashboard" className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück zum Dashboard
            </Link>
          </div>
          
          {/* Chat-Bereich */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat
              </h3>
            </div>
            
            <div className="flex flex-col md:flex-row h-[600px]">
              {/* Kontaktliste - auf Mobilgeräten ausblendbar */}
              <div className={`w-full md:w-1/4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto ${
                selectedContact && showMobileContacts === false ? 'hidden md:block' : 'block'
              }`}>
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Kontakte</h4>
                  {contacts.length > 0 ? (
                    <ul className="space-y-2">
                      {contacts.map((contact) => (
                        <li key={contact.id}>
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowMobileContacts(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                              selectedContact?.id === contact.id
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {contact.type === 'trainer' ? 'Trainer' : 'Administrator'}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Keine Kontakte gefunden
                    </p>
                  )}
                </div>
              </div>
              
              {/* Chat-Fenster */}
              <div className={`flex-1 flex flex-col ${
                !selectedContact || showMobileContacts ? 'hidden md:flex' : 'flex'
              }`}>
                {/* Kontakt-Header */}
                {selectedContact && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setShowMobileContacts(true)} 
                        className="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedContact.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedContact.type === 'trainer' ? 'Trainer' : 'Administrator'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={refreshMessages}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Nachrichten aktualisieren"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Nachrichten */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading && (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Noch keine Nachrichten. Starten Sie die Konversation!
                      </p>
                    </div>
                  )}
                  
                  {!loading && messages.length > 0 && (
                    <>
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender_type === 'teilnehmer' && message.sender_id === teilnehmerData.id;
                        const showDate = index === 0 || formatiereDatum(messages[index - 1]?.created_at) !== formatiereDatum(message.created_at);
                        
                        return (
                          <div key={message.id || index}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">
                                  {formatiereDatum(message.created_at)}
                                </span>
                              </div>
                            )}
                            
                            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                isOwnMessage 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                              }`}>
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  isOwnMessage 
                                    ? 'text-blue-100' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  <Clock className="inline-block h-3 w-3 mr-1" />
                                  {formatiereUhrzeit(message.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                {/* Nachricht-Eingabe */}
                {selectedContact && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <form onSubmit={sendMessage} className="flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nachricht schreiben..."
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className={`bg-blue-500 text-white rounded-r-md py-2 px-4 ${
                          sending || !newMessage.trim()
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-blue-600'
                        }`}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {new Date().getFullYear()} Reha-Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

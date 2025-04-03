'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Calendar, 
  LineChart,
  Clock,
  MessageSquare,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react';
import LogoutButton from '../../../components/LogoutButton';

export default function TeilnehmerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teilnehmerData, setTeilnehmerData] = useState(null);
  const [meineKurse, setMeineKurse] = useState([]);
  const [naechsterKurs, setNaechsterKurs] = useState(null);
  const [nachrichten, setNachrichten] = useState([]);
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
        
        // Meine Kurse laden
        const { data: kursTeilnehmer, error: kursError } = await supabase
          .from('kurs_teilnehmer')
          .select('kurs_id')
          .eq('teilnehmer_id', teilnehmerProfile.id);
        
        if (kursError) {
          console.error('Fehler beim Laden der Kurs-Teilnehmer-Beziehungen:', kursError);
          return;
        }
        
        if (kursTeilnehmer && kursTeilnehmer.length > 0) {
          const kursIds = kursTeilnehmer.map(kt => kt.kurs_id);
          
          const { data: kurse, error: kurseError } = await supabase
            .from('kurse')
            .select('*')
            .in('id', kursIds)
            .order('datum', { ascending: true });
          
          if (kurseError) {
            console.error('Fehler beim Laden der Kurse:', kurseError);
            return;
          }
          
          setMeineKurse(kurse || []);
          
          // Nächsten Kurs finden
          const heute = new Date();
          const zukuenftigeKurse = kurse.filter(kurs => {
            const kursDatum = new Date(kurs.datum);
            return kursDatum >= heute;
          });
          
          if (zukuenftigeKurse.length > 0) {
            setNaechsterKurs(zukuenftigeKurse[0]);
          }
        }
        
        // Nachrichten laden
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*, profiles(full_name)')
          .or(`receiver_id.eq.${teilnehmerProfile.id},receiver_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (messagesError) {
          console.error('Fehler beim Laden der Nachrichten:', messagesError);
          return;
        }
        
        setNachrichten(messages || []);
      } catch (err) {
        console.error('Fehler beim Laden der Teilnehmerdaten:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadTeilnehmerData();
  }, [user, supabase]);

  // Datum formatieren
  function formatiereDatum(datumString) {
    if (!datumString) return '';
    
    const datum = new Date(datumString);
    return datum.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Uhrzeit formatieren
  function formatiereUhrzeit(uhrzeitString) {
    if (!uhrzeitString) return '';
    
    return uhrzeitString.substring(0, 5) + ' Uhr';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Teilnehmer-Dashboard...</p>
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
            Teilnehmer-Dashboard
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
          {/* Willkommensbereich */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  Willkommen, {teilnehmerData.vorname} {teilnehmerData.nachname}!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Hier finden Sie alle wichtigen Informationen zu Ihren Kursen und Ihrem Fortschritt.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <Link href="/teilnehmer/kurse" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center mb-4">
                <Calendar className="w-10 h-10 text-blue-500 mr-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Meine Kurse</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Alle Ihre Kurse anzeigen und verwalten</p>
              <div className="mt-4 flex justify-end">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            
            <Link href="/teilnehmer/fortschritt" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center mb-4">
                <LineChart className="w-10 h-10 text-purple-500 mr-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Mein Fortschritt</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Ihren persönlichen Fortschritt verfolgen</p>
              <div className="mt-4 flex justify-end">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            
            <Link href="/teilnehmer/profil" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center mb-4">
                <User className="w-10 h-10 text-green-500 mr-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Mein Profil</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Ihre persönlichen Daten verwalten</p>
              <div className="mt-4 flex justify-end">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            
            <Link href="/teilnehmer/chat" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-10 h-10 text-yellow-500 mr-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Nachrichten</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Mit Trainern und Administratoren kommunizieren</p>
              <div className="mt-4 flex justify-end">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Linke Spalte */}
            <div className="lg:col-span-2 space-y-8">
              {/* Nächster Kurs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
                  <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Nächster Termin
                  </h3>
                </div>
                
                <div className="p-4 sm:p-6">
                  {naechsterKurs ? (
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        {naechsterKurs.name}
                      </h4>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatiereDatum(naechsterKurs.datum)}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatiereUhrzeit(naechsterKurs.uhrzeit_start)} - {formatiereUhrzeit(naechsterKurs.uhrzeit_ende)}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {naechsterKurs.beschreibung || 'Keine Beschreibung verfügbar.'}
                      </p>
                      <div className="mt-4">
                        <Link href={`/kurse/${naechsterKurs.id}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                          Details ansehen
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      Sie haben derzeit keine anstehenden Kurstermine.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Meine Kurse */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800">
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Meine Kurse
                  </h3>
                </div>
                
                <div className="p-4 sm:p-6">
                  {meineKurse.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {meineKurse.slice(0, 5).map((kurs) => (
                        <div key={kurs.id} className="py-4 first:pt-0 last:pb-0">
                          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                            {kurs.name}
                          </h4>
                          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatiereDatum(kurs.datum)}
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-2">
                            <Clock className="h-4 w-4 mr-2" />
                            {formatiereUhrzeit(kurs.uhrzeit_start)} - {formatiereUhrzeit(kurs.uhrzeit_ende)}
                          </div>
                          <div className="mt-2">
                            <Link href={`/kurse/${kurs.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center">
                              Details ansehen
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      Sie sind derzeit in keinem Kurs angemeldet.
                    </p>
                  )}
                  
                  {meineKurse.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/teilnehmer/kurse" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                        Alle Kurse anzeigen
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <Link 
                      href="/teilnehmer/kurse" 
                      className="block w-full text-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      Zur Kursübersicht
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rechte Spalte */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* Fortschritt */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
                  <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 flex items-center">
                    <LineChart className="h-5 w-5 mr-2" />
                    Mein Fortschritt
                  </h3>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Anwesenheit</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Übungen abgeschlossen</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">70%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gesamtfortschritt</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">60%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link 
                      href="/teilnehmer/fortschritt" 
                      className="block w-full text-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                    >
                      Detaillierter Fortschritt
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Nachrichten */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-100 dark:border-yellow-800">
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Nachrichten
                  </h3>
                </div>
                
                <div className="p-4 sm:p-6">
                  {nachrichten.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {nachrichten.map((nachricht) => (
                        <div key={nachricht.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {nachricht.profiles?.full_name || 'System'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(nachricht.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {nachricht.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      Sie haben keine neuen Nachrichten.
                    </p>
                  )}
                  
                  <div className="mt-6">
                    <Link 
                      href="/chat" 
                      className="block w-full text-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      Zum Chat
                    </Link>
                  </div>
                </div>
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

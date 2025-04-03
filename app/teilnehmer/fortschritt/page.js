'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  LineChart,
  BarChart,
  PieChart,
  ChevronLeft,
  Calendar,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react';
import LogoutButton from '../../../components/LogoutButton';

export default function TeilnehmerFortschritt() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teilnehmerData, setTeilnehmerData] = useState(null);
  const [fortschrittData, setFortschrittData] = useState(null);
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
        
        // Fortschrittsdaten laden
        try {
          // In einer zukünftigen Version könnten hier echte Fortschrittsdaten geladen werden
          // Für den Moment verwenden wir Beispieldaten
          const fortschrittDaten = {
            anwesenheit: {
              prozent: 85,
              details: [
                { datum: '2025-03-01', status: 'anwesend' },
                { datum: '2025-03-08', status: 'anwesend' },
                { datum: '2025-03-15', status: 'entschuldigt' },
                { datum: '2025-03-22', status: 'anwesend' },
                { datum: '2025-03-29', status: 'anwesend' }
              ]
            },
            uebungen: {
              prozent: 70,
              details: [
                { name: 'Grundübungen', abgeschlossen: 100 },
                { name: 'Fortgeschrittene Übungen', abgeschlossen: 75 },
                { name: 'Spezialübungen', abgeschlossen: 35 }
              ]
            },
            ziele: {
              prozent: 60,
              details: [
                { name: 'Schmerzreduktion', fortschritt: 80 },
                { name: 'Beweglichkeit', fortschritt: 65 },
                { name: 'Kraft', fortschritt: 50 },
                { name: 'Ausdauer', fortschritt: 45 }
              ]
            },
            gesamtFortschritt: [
              { monat: 'Jan', wert: 20 },
              { monat: 'Feb', wert: 35 },
              { monat: 'Mär', wert: 60 },
              { monat: 'Apr', wert: 60 }
            ]
          };
          
          setFortschrittData(fortschrittDaten);
        } catch (fortschrittErr) {
          console.error('Fehler beim Laden der Fortschrittsdaten:', fortschrittErr);
          // Bei Fehler verwenden wir leere Daten
          setFortschrittData({
            anwesenheit: { prozent: 0, details: [] },
            uebungen: { prozent: 0, details: [] },
            ziele: { prozent: 0, details: [] },
            gesamtFortschritt: []
          });
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

  // Datum formatieren
  function formatiereDatum(datumString) {
    if (!datumString) return '';
    
    const datum = new Date(datumString);
    return datum.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Status-Badge für Anwesenheit
  function getStatusBadge(status) {
    switch (status) {
      case 'anwesend':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Anwesend
          </span>
        );
      case 'entschuldigt':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Entschuldigt
          </span>
        );
      case 'fehlt':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Fehlt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Unbekannt
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Fortschrittsdaten...</p>
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

  if (!fortschrittData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">Keine Fortschrittsdaten gefunden</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Es wurden keine Fortschrittsdaten für Ihr Profil gefunden. Bitte kontaktieren Sie einen Administrator.
          </p>
          <button
            onClick={() => router.push('/teilnehmer/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Zurück zum Dashboard
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
            Mein Fortschritt
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
          
          {/* Übersicht */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
              <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Übersicht
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                    <h4 className="text-lg font-medium text-purple-800 dark:text-purple-200">Anwesenheit</h4>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200 dark:text-purple-200 dark:bg-purple-800">
                          Fortschritt
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-purple-600 dark:text-purple-200">
                          {fortschrittData.anwesenheit.prozent}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200 dark:bg-purple-800">
                      <div style={{ width: `${fortschrittData.anwesenheit.prozent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                    <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200">Übungen</h4>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:text-blue-200 dark:bg-blue-800">
                          Fortschritt
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-200">
                          {fortschrittData.uebungen.prozent}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200 dark:bg-blue-800">
                      <div style={{ width: `${fortschrittData.uebungen.prozent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Award className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                    <h4 className="text-lg font-medium text-green-800 dark:text-green-200">Ziele</h4>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200 dark:text-green-200 dark:bg-green-800">
                          Fortschritt
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-green-600 dark:text-green-200">
                          {fortschrittData.ziele.prozent}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200 dark:bg-green-800">
                      <div style={{ width: `${fortschrittData.ziele.prozent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Gesamtfortschritt
                </h4>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="h-64 flex items-end justify-between">
                    {fortschrittData.gesamtFortschritt.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-16 bg-purple-500 dark:bg-purple-400 rounded-t"
                          style={{ height: `${item.wert}%` }}
                        ></div>
                        <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.monat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detaillierte Ansichten */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8">
            {/* Anwesenheit */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
                <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Anwesenheit
                </h3>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Datum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {fortschrittData.anwesenheit.details.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatiereDatum(item.datum)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Übungen */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Übungen
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 sm:space-y-6">
                  {fortschrittData.uebungen.details.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.abgeschlossen}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${item.abgeschlossen}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Ziele */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Ziele
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 sm:space-y-6">
                  {fortschrittData.ziele.details.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.fortschritt}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ width: `${item.fortschritt}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Tipps und Empfehlungen */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-100 dark:border-yellow-800">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Tipps und Empfehlungen
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-2 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Übungshäufigkeit</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Versuchen Sie, die Übungen mindestens 3-mal pro Woche durchzuführen, um optimale Ergebnisse zu erzielen.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Fortgeschrittene Übungen</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Sie machen gute Fortschritte bei den Grundübungen. Konzentrieren Sie sich jetzt mehr auf die fortgeschrittenen Übungen.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Ziel: Ausdauer</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Ihre Ausdauer könnte verbessert werden. Sprechen Sie mit Ihrem Trainer über zusätzliche Übungen.
                    </p>
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

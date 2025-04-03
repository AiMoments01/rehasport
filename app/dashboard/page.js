'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import KpiCard from '../../components/KpiCard';
import StatsChart from '../../components/StatsChart';
import LogoutButton from '../../components/LogoutButton';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  DollarSign,
  BarChart4,
  PieChart,
  LineChart,
  Home
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    aktiveTeilnehmer: 0,
    kurseHeute: 0,
    neueLeads: 0,
    umsatz: 0,
    formatierterUmsatz: '0 €',
    teilnehmerEntwicklung: [],
    kursauslastung: [],
    teilnehmerNachRolle: []
  });
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
          window.location.href = '/';
          return;
        }
        
        setUser(data.session.user);
      } catch (err) {
        console.error('Fehler beim Abrufen der Session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    getSession();
    
    // Listener für Authentifizierungsänderungen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          window.location.href = '/';
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
  }, []);

  // Dashboard-Daten laden, wenn der Benutzer ein Admin ist
  useEffect(() => {
    async function loadDashboardData() {
      if (user && user.user_metadata?.role === 'admin') {
        try {
          // Aktive Teilnehmer laden
          let aktiveTeilnehmer = 0;
          try {
            const { count, error } = await supabase
              .from('teilnehmer')
              .select('*', { count: 'exact', head: true })
              .eq('aktiv', true);
            
            if (!error) {
              aktiveTeilnehmer = count || 0;
            }
          } catch (err) {
            console.error('Fehler beim Laden der aktiven Teilnehmer:', err);
          }
          
          // Kurse heute laden
          let kurseHeute = 0;
          try {
            const heute = new Date().toISOString().split('T')[0];
            const { count, error } = await supabase
              .from('kurse')
              .select('*', { count: 'exact', head: true })
              .gte('datum', heute)
              .lt('datum', heute + 'T23:59:59');
            
            if (!error) {
              kurseHeute = count || 0;
            }
          } catch (err) {
            console.error('Fehler beim Laden der heutigen Kurse:', err);
          }
          
          // Neue Leads laden
          let neueLeads = 0;
          try {
            const heute = new Date();
            const tagDerWoche = heute.getDay();
            const differenzZuMontag = tagDerWoche === 0 ? 6 : tagDerWoche - 1;
            
            const wochenstart = new Date(heute);
            wochenstart.setDate(heute.getDate() - differenzZuMontag);
            wochenstart.setHours(0, 0, 0, 0);
            
            const wochenstartIso = wochenstart.toISOString();
            
            const { count, error } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', wochenstartIso);
            
            if (!error) {
              neueLeads = count || 0;
            }
          } catch (err) {
            console.error('Fehler beim Laden der neuen Leads:', err);
          }
          
          // Umsatz laden
          let umsatz = 0;
          let formatierterUmsatz = '0 €';
          try {
            const { data, error } = await supabase
              .from('umsatz')
              .select('summe')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (!error && data && data.length > 0) {
              umsatz = data[0].summe;
              formatierterUmsatz = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(umsatz);
            } else {
              // Demo-Wert
              umsatz = 2450.75;
              formatierterUmsatz = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(umsatz);
            }
          } catch (err) {
            console.error('Fehler beim Laden des Umsatzes:', err);
          }
          
          // Demo-Daten für Diagramme
          const teilnehmerEntwicklung = [
            { monat: 'Jan', anzahl_teilnehmer: 65 },
            { monat: 'Feb', anzahl_teilnehmer: 78 },
            { monat: 'Mär', anzahl_teilnehmer: 90 },
            { monat: 'Apr', anzahl_teilnehmer: 105 },
            { monat: 'Mai', anzahl_teilnehmer: 120 },
            { monat: 'Jun', anzahl_teilnehmer: 150 },
            { monat: 'Jul', anzahl_teilnehmer: 180 },
            { monat: 'Aug', anzahl_teilnehmer: 210 },
            { monat: 'Sep', anzahl_teilnehmer: 250 },
            { monat: 'Okt', anzahl_teilnehmer: 280 },
            { monat: 'Nov', anzahl_teilnehmer: 310 },
            { monat: 'Dez', anzahl_teilnehmer: 350 }
          ];
          
          const kursauslastung = [
            { woche: 'KW 1', auslastung_prozent: 75 },
            { woche: 'KW 2', auslastung_prozent: 82 },
            { woche: 'KW 3', auslastung_prozent: 78 },
            { woche: 'KW 4', auslastung_prozent: 85 },
            { woche: 'KW 5', auslastung_prozent: 90 },
            { woche: 'KW 6', auslastung_prozent: 88 }
          ];
          
          const teilnehmerNachRolle = [
            { rolle: 'Selbstzahler', anzahl: 120 },
            { rolle: 'Gesetzliche Kasse', anzahl: 230 },
            { rolle: 'Private Kasse', anzahl: 85 },
            { rolle: 'Berufsgenossenschaft', anzahl: 65 }
          ];
          
          // Alle Daten zusammenführen und setzen
          setDashboardData({
            aktiveTeilnehmer,
            kurseHeute,
            neueLeads,
            umsatz,
            formatierterUmsatz,
            teilnehmerEntwicklung,
            kursauslastung,
            teilnehmerNachRolle
          });
          
        } catch (err) {
          console.error('Fehler beim Laden der Dashboard-Daten:', err);
          setError('Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.');
        }
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-500 rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="mx-auto max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Fehler</h1>
          <p className="mb-4 text-gray-800 dark:text-gray-200">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  const userRole = user?.user_metadata?.role || 'Benutzer';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reha-Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.email} ({userRole})
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">Übersicht und Statistiken</p>
        </div>

        {userRole === 'admin' ? (
          <>
            {/* KPI Cards - Gleichmäßig in einer Reihe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard 
                title="Aktive Teilnehmer" 
                value={dashboardData.aktiveTeilnehmer} 
                icon={<Users className="h-6 w-6 text-blue-500" />} 
                variant="blue"
              />
              <KpiCard 
                title="Kurse heute" 
                value={dashboardData.kurseHeute} 
                icon={<Calendar className="h-6 w-6 text-green-500" />} 
                variant="green"
              />
              <KpiCard 
                title="Neue Leads (Woche)" 
                value={dashboardData.neueLeads} 
                icon={<UserPlus className="h-6 w-6 text-orange-500" />} 
                variant="orange"
              />
              <KpiCard 
                title="Umsatz (Monat)" 
                value={dashboardData.formatierterUmsatz} 
                icon={<DollarSign className="h-6 w-6 text-yellow-500" />} 
                variant="yellow"
              />
            </div>
            
            {/* Charts - Besser ausgerichtet und konsistenter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Teilnehmerentwicklung (Linienchart) */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
                <div className="flex items-center mb-6">
                  <LineChart className="w-6 h-6 mr-3 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Teilnehmerentwicklung</h3>
                </div>
                <div className="h-80">
                  <StatsChart 
                    type="line" 
                    data={dashboardData.teilnehmerEntwicklung} 
                    xKey="monat" 
                    yKey="anzahl_teilnehmer"
                    height={300}
                  />
                </div>
              </div>
              
              {/* Kursauslastung (Balkenchart) */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
                <div className="flex items-center mb-6">
                  <BarChart4 className="w-6 h-6 mr-3 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Kursauslastung</h3>
                </div>
                <div className="h-80">
                  <StatsChart 
                    type="bar" 
                    data={dashboardData.kursauslastung} 
                    xKey="woche" 
                    yKey="auslastung_prozent"
                    height={300}
                  />
                </div>
              </div>
            </div>
            
            {/* Teilnehmer nach Rolle (Tortendiagramm) - Zentriert und besser formatiert */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <PieChart className="w-6 h-6 mr-3 text-purple-500" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Teilnehmer nach Kostenträger</h3>
              </div>
              <div className="max-w-md mx-auto h-80">
                <StatsChart 
                  type="pie" 
                  data={dashboardData.teilnehmerNachRolle} 
                  xKey="rolle" 
                  dataKey="anzahl"
                  height={300}
                />
              </div>
            </div>
            
            {/* Schnellzugriff-Karten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/kurse" className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center mb-4">
                  <Calendar className="w-10 h-10 text-indigo-500 mr-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Kursverwaltung</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Kurse anzeigen, erstellen und bearbeiten</p>
              </Link>
              
              <Link href="/teilnehmer" className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center mb-4">
                  <Users className="w-10 h-10 text-blue-500 mr-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Teilnehmerverwaltung</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Teilnehmer verwalten und Kursen zuweisen</p>
              </Link>
              
              <Link href="/admin/fix-profiles" className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center mb-4">
                  <UserPlus className="w-10 h-10 text-green-500 mr-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Profile-Reparatur</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Benutzerprofile überprüfen und reparieren</p>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-all hover:shadow-lg">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                Willkommen, {user.email}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                Sie sind als <span className="font-medium">{userRole}</span> angemeldet.
              </p>
              
              {userRole === 'trainer' && (
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h3 className="text-xl font-medium mb-4 text-blue-800 dark:text-blue-200">Trainer-Bereich</h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-6">
                    Hier können Sie Ihre Kurse und Teilnehmer verwalten.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/trainer/kurse" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Calendar className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
                      <h4 className="font-medium text-gray-800 dark:text-white">Meine Kurse</h4>
                    </Link>
                    <Link href="/trainer/teilnehmer" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Users className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
                      <h4 className="font-medium text-gray-800 dark:text-white">Meine Teilnehmer</h4>
                    </Link>
                  </div>
                </div>
              )}
              
              {userRole === 'teilnehmer' && (
                <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <h3 className="text-xl font-medium mb-4 text-green-800 dark:text-green-200">Teilnehmer-Bereich</h3>
                  <p className="text-green-700 dark:text-green-300 mb-6">
                    Hier können Sie Ihre Kurse und Fortschritte einsehen.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/teilnehmer/kurse" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Calendar className="w-8 h-8 text-green-500 mb-2 mx-auto" />
                      <h4 className="font-medium text-gray-800 dark:text-white">Meine Kurse</h4>
                    </Link>
                    <Link href="/teilnehmer/fortschritt" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700">
                      <LineChart className="w-8 h-8 text-green-500 mb-2 mx-auto" />
                      <h4 className="font-medium text-gray-800 dark:text-white">Mein Fortschritt</h4>
                    </Link>
                  </div>
                </div>
              )}
              
              {userRole !== 'admin' && userRole !== 'trainer' && userRole !== 'teilnehmer' && (
                <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-lg">
                    Für Zugriff auf das Admin-Dashboard benötigen Sie Administrator-Rechte.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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

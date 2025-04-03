'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TeilnehmerTable from '../../components/TeilnehmerTable';
import { Search, Filter, UserPlus } from 'lucide-react';

export default function TeilnehmerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teilnehmer, setTeilnehmer] = useState([]);
  const [filteredTeilnehmer, setFilteredTeilnehmer] = useState([]);
  
  // States für die Filterung
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [kursFilter, setKursFilter] = useState('alle');
  const [kostenFilter, setKostenFilter] = useState('alle');
  const [kurse, setKurse] = useState([]);
  const [error, setError] = useState(null);
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
          router.push('/login');
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
  }, [router]);

  // Teilnehmerdaten mit Supabase-Client laden
  useEffect(() => {
    async function loadTeilnehmerData() {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Teilnehmer laden
        let teilnehmerData = [];
        try {
          const { data: teilnehmerResult, error: teilnehmerError } = await supabase
            .from('teilnehmer')
            .select('*')
            .order('nachname', { ascending: true });
            
          if (teilnehmerError) throw teilnehmerError;
          teilnehmerData = teilnehmerResult || [];
        } catch (teilnehmerErr) {
          console.error('Fehler beim Laden der Teilnehmer:', teilnehmerErr);
          teilnehmerData = [];
        }
        
        // Kurse laden
        let kurseData = [];
        try {
          const { data: kurseResult, error: kurseError } = await supabase
            .from('kurse')
            .select('*')
            .order('name', { ascending: true });
            
          if (kurseError) {
            console.error('Fehler beim Laden der Kurse:', kurseError);
            setError('Kurse konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
            kurseData = []; // Still continue with empty courses
          } else {
            kurseData = kurseResult || [];
            console.log('Geladene Kurse:', kurseData);
          }
        } catch (kurseErr) {
          console.error('Fehler beim Laden der Kurse:', kurseErr);
          setError('Kurse konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
          kurseData = [];
        }
        
        // Teilnehmer mit Kursnamen und Kosten anreichern
        const teilnehmerMitKurs = teilnehmerData.map(teilnehmer => {
          const kurs = kurseData.find(k => k.id === teilnehmer.kurs_id);
          return {
            ...teilnehmer,
            kursname: kurs ? kurs.name : 'Kein Kurs',
            kosten: teilnehmer.kosten || (kurs ? kurs.kosten : 0)
          };
        });
        
        setTeilnehmer(teilnehmerMitKurs);
        setFilteredTeilnehmer(teilnehmerMitKurs);
        setKurse(kurseData);
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
        setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    }
    
    loadTeilnehmerData();
  }, [user]);

  // Filter und Suche anwenden
  useEffect(() => {
    if (!teilnehmer.length) return;
    
    let filtered = [...teilnehmer];
    
    // Suchfilter anwenden
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.vorname?.toLowerCase().includes(query)) || 
        (t.nachname?.toLowerCase().includes(query)) || 
        (t.email?.toLowerCase().includes(query))
      );
    }
    
    // Statusfilter anwenden
    if (statusFilter !== 'alle') {
      const isActive = statusFilter === 'aktiv';
      filtered = filtered.filter(t => t.aktiv === isActive);
    }
    
    // Kursfilter anwenden
    if (kursFilter !== 'alle') {
      filtered = filtered.filter(t => t.kurs_id === kursFilter);
    }
    
    // Kostenfilter anwenden
    if (kostenFilter !== 'alle') {
      const kosten = parseInt(kostenFilter);
      filtered = filtered.filter(t => t.kosten === kosten);
    }
    
    setFilteredTeilnehmer(filtered);
  }, [teilnehmer, searchQuery, statusFilter, kursFilter, kostenFilter]);

  const handleTeilnehmerClick = (id) => {
    router.push(`/teilnehmer/${id}`);
  };
  
  // Wenn noch geladen wird, zeige Ladeindikator
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Wenn kein Benutzer angemeldet ist, zeige Login-Aufforderung
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nicht angemeldet</h1>
          <p className="mb-4">Sie müssen angemeldet sein, um auf die Teilnehmerverwaltung zuzugreifen.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Teilnehmerverwaltung
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/teilnehmer/neu')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            >
              <UserPlus className="h-5 w-5 mr-1" />
              Neuer Teilnehmer
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Suche nach Namen oder E-Mail..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="alle">Alle Status</option>
                  <option value="aktiv">Aktiv</option>
                  <option value="inaktiv">Inaktiv</option>
                </select>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={kursFilter}
                  onChange={(e) => setKursFilter(e.target.value)}
                >
                  <option value="alle">Alle Kurse</option>
                  {kurse.map(kurs => (
                    <option key={kurs.id} value={kurs.id}>{kurs.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={kostenFilter}
                  onChange={(e) => setKostenFilter(e.target.value)}
                >
                  <option value="alle">Alle Kosten</option>
                  <option value="0">Kostenlos</option>
                  <option value="10">10 €</option>
                  <option value="20">20 €</option>
                  <option value="30">30 €</option>
                </select>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <TeilnehmerTable 
            teilnehmer={filteredTeilnehmer} 
            kurse={kurse}
            onTeilnehmerClick={handleTeilnehmerClick} 
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

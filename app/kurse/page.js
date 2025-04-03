'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllKurse } from '../../lib/supabaseServer';
import { Calendar, PlusCircle, AlertTriangle } from 'lucide-react';
import KalenderView from '../../components/KalenderView';

export default function KursePage() {
  const [kurse, setKurse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadKurse() {
      try {
        setLoading(true);
        const data = await getAllKurse();
        setKurse(data || []);
        setError(null); // Reset error on successful load
      } catch (err) {
        console.error('Fehler beim Laden der Kurse:', err);
        setError('Kurse konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
        setKurse([]); // Clear courses on error
      } finally {
        setLoading(false);
      }
    }
    
    loadKurse();
  }, []);

  // Funktion zum Formatieren des Datums (vereinfacht)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return 'Ungültiges Datum';
    }
  };
  
   // Funktion zum Formatieren der Zeit (vereinfacht)
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Ungültige Zeit';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-lg text-gray-700 dark:text-gray-300">Lade Kurse...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Calendar className="mr-2 h-6 w-6"/> Kursübersicht
          </h1>
          {/* Button zum Hinzufügen neuer Kurse */}
          <button
            onClick={() => router.push('/kurse/neu')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center transition-colors duration-150 ease-in-out"
          >
            <PlusCircle className="mr-1 h-5 w-5"/> Neuer Kurs
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900 dark:text-red-200 rounded-md flex items-center" role="alert">
            <AlertTriangle className="h-5 w-5 mr-2"/>
            <p><span className="font-bold">Fehler:</span> {error}</p>
          </div>
        )}
        
        {/* Hier wird die KalenderView Komponente verwendet */}
        {!loading && !error && (
          <KalenderView kurse={kurse} />
        )}
        
        {/* Die einfache Listenansicht kann entfernt oder optional behalten werden */}
        {/* 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kurse.length > 0 ? (
            kurse.map((kurs) => (
              <div key={kurs.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                   onClick={() => router.push(`/kurse/${kurs.id}`)}
              >
                <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{kurs.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{kurs.beschreibung || 'Keine Beschreibung'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Zeitraum: {formatDate(kurs.start_datum)} {formatTime(kurs.start_datum)} - {formatDate(kurs.end_datum)} {formatTime(kurs.end_datum)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Max. Teilnehmer: {kurs.max_teilnehmer || 'N/A'}
                </p>
                 <p className="text-sm font-medium mt-2">
                  Status: {kurs.aktiv ? 
                    <span className="text-green-600 dark:text-green-400">Aktiv</span> : 
                    <span className="text-red-600 dark:text-red-400">Inaktiv</span>}
                </p>
              </div>
            ))
          ) : (
            !loading && !error && (
              <p className="text-gray-500 dark:text-gray-400 col-span-full text-center">Keine Kurse gefunden.</p>
            )
          )}
        </div>
        */}
      </main>
    </div>
  );
}

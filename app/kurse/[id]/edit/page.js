'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // useParams importieren
import { getKursById, updateKurs, getAllTrainer } from '../../../../lib/supabaseServer'; // Pfad anpassen (4 Ebenen hoch)
import KursForm from '../../../../components/KursForm'; // Pfad anpassen
import Link from 'next/link';
import { ArrowLeft, Edit, Loader2, AlertTriangle } from 'lucide-react';

export default function KursBearbeitenPage() {
  const router = useRouter();
  const params = useParams(); // Hook verwenden, um Parameter zu bekommen
  const kursId = params?.id; // ID aus den Parametern extrahieren

  const [kursData, setKursData] = useState(null);
  const [trainerList, setTrainerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!kursId) {
          setError('Kurs-ID fehlt in der URL.');
          setLoading(false);
          return;
      }
      
      setLoading(true);
      setError(null);
      try {
        // Parallel Trainer und Kursdaten laden
        const [trainers, kurs] = await Promise.all([
          getAllTrainer(),
          getKursById(kursId)
        ]);
        
        setTrainerList(trainers);
        
        if (kurs) {
          setKursData(kurs);
        } else {
          setError(`Kurs mit ID ${kursId} konnte nicht gefunden werden.`);
        }
      } catch (e) {
        console.error('Fehler beim Laden der Daten:', e);
        setError('Daten konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [kursId]);

  const handleUpdateKurs = async (formData) => {
    if (!kursId) return;
    
    setSaving(true);
    setError(null);
    try {
      const updatedKurs = await updateKurs(kursId, formData);
      if (updatedKurs) {
        // Bei Erfolg zur Kursübersicht oder Detailseite navigieren
        router.push(`/kurse`); // oder /kurse/${updatedKurs.id} oder zurück zur Detailseite wenn vorhanden?
        // Optional: Erfolgsmeldung
      } else {
        setError('Der Kurs konnte nicht aktualisiert werden. Bitte versuche es erneut.');
      }
    } catch (e) {
      console.error('Fehler beim Aktualisieren:', e);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8">
        {/* Link zurück zur Kursübersicht oder Detailseite */} 
        <Link href="/kurse" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Zurück zur Kursübersicht
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
            <Edit className="mr-3 h-8 w-8 text-indigo-600 dark:text-indigo-400"/>
            Kurs bearbeiten
        </h1>
      </header>

      <main className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8">
        {loading && (
           <div className="flex justify-center items-center py-10">
             <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
             <span className="ml-3 text-lg">Lade Kursdaten...</span>
           </div>
        )}
        
        {error && !loading && (
            <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900 dark:text-red-200 rounded-md flex items-center" role="alert">
              <AlertTriangle className="h-5 w-5 mr-2"/>
              <p><span className="font-bold">Fehler:</span> {error}</p>
            </div>
        )}

        {!loading && !error && kursData && (
          <KursForm 
            initialData={kursData}
            trainerList={trainerList} 
            onSubmit={handleUpdateKurs} 
            saving={saving} 
            error={error} // Übergibt den Update-Fehler, falls einer auftritt
          />
        )}
        
        {!loading && !error && !kursData && (
           <p className="text-center text-gray-500 dark:text-gray-400">Der angeforderte Kurs konnte nicht geladen werden.</p>
        )}
      </main>
    </div>
  );
}

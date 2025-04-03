'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createKurs, getAllTrainer } from '../../../lib/supabaseServer'; // Angepasster Pfad
import KursForm from '../../../components/KursForm';
import Link from 'next/link';
import { ArrowLeft, PlusSquare } from 'lucide-react';

export default function NeuerKursPage() {
  const router = useRouter();
  const [trainerList, setTrainerList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrainer = async () => {
      const trainers = await getAllTrainer();
      setTrainerList(trainers);
    };
    loadTrainer();
  }, []);

  const handleCreateKurs = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      const newKurs = await createKurs(formData);
      if (newKurs) {
        // Bei Erfolg zur Kursübersicht oder zur Detailseite navigieren
        router.push('/kurse'); // oder /kurse/${newKurs.id}
        // Optional: Erfolgsmeldung anzeigen (z.B. mit react-toastify)
      } else {
        setError('Der Kurs konnte nicht erstellt werden. Bitte versuche es erneut.');
      }
    } catch (e) {
      console.error('Fehler beim Erstellen:', e);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <Link href="/kurse" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Zurück zur Kursübersicht
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
            <PlusSquare className="mr-3 h-8 w-8 text-indigo-600 dark:text-indigo-400"/>
            Neuen Kurs erstellen
        </h1>
      </header>

      <main className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8">
        <KursForm 
          trainerList={trainerList} 
          onSubmit={handleCreateKurs} 
          saving={saving} 
          error={error}
        />
      </main>
    </div>
  );
}

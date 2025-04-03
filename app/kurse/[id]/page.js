import { getKursById } from '../../../lib/supabaseServer'; // Pfad anpassen
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, Calendar, Users, User, Info, CheckCircle, XCircle } from 'lucide-react';
import KursTeilnehmerSection from './KursTeilnehmerSection'; // Client-Komponente

// Hilfsfunktionen für Datum/Zeit (könnten zentralisiert werden)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return 'Ungültig'; }
};
const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '' ; }
};

// Metadaten für die Seite (z.B. Titel)
export async function generateMetadata({ params }) {
  const kurs = await getKursById(params.id);
  return {
    title: kurs ? `Kurs: ${kurs.name}` : 'Kursdetails',
  };
}

export default async function KursDetailPage({ params }) {
  const kursId = params.id;
  const kurs = await getKursById(kursId);

  // Wenn Kurs nicht gefunden wird, 404-Seite anzeigen
  if (!kurs) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <Link href="/kurse" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Zurück zur Kursübersicht
          </Link>
          <h1 className="text-3xl font-bold flex items-center">
             <Info className="mr-3 h-8 w-8 text-indigo-600 dark:text-indigo-400"/>
             Kursdetails: {kurs.name}
          </h1>
        </div>
        <Link href={`/kurse/${kursId}/edit`} className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          <Edit className="mr-2 h-4 w-4" />
          Kurs bearbeiten
        </Link>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Linke Spalte: Kursinformationen */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">Informationen</h2>
          
          <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Beschreibung</label>
              <p className="mt-1 text-gray-800 dark:text-gray-200">{kurs.beschreibung || 'Keine Beschreibung vorhanden.'}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-1"/> Zeitraum
              </label>
              <p className="mt-1 text-gray-800 dark:text-gray-200">
                {formatDate(kurs.start_datum)} ({formatTime(kurs.start_datum)} Uhr) -
                <br/> 
                {formatDate(kurs.end_datum)} ({formatTime(kurs.end_datum)} Uhr)
              </p>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Users className="h-4 w-4 mr-1"/> Max. Teilnehmer
              </label>
              <p className="mt-1 text-gray-800 dark:text-gray-200">{kurs.max_teilnehmer}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <User className="h-4 w-4 mr-1"/> Trainer
              </label>
              <p className="mt-1 text-gray-800 dark:text-gray-200">
                  {kurs.trainer ? `${kurs.trainer.vorname} ${kurs.trainer.nachname}` : 'Kein Trainer zugewiesen'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Info className="h-4 w-4 mr-1"/> Status
              </label>
              <p className={`mt-1 flex items-center ${kurs.aktiv ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {kurs.aktiv ? <CheckCircle className="h-5 w-5 mr-1"/> : <XCircle className="h-5 w-5 mr-1"/>}
                {kurs.aktiv ? 'Aktiv' : 'Inaktiv'}
              </p>
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Teilnehmerliste - jetzt als Client-Komponente */}
        <KursTeilnehmerSection kursId={kursId} maxTeilnehmer={kurs.max_teilnehmer} />
      </main>
    </div>
  );
}

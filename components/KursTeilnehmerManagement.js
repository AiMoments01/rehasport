'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    getTeilnehmerForKurs, 
    getAvailableTeilnehmerForKurs, 
    addTeilnehmerToKurs, 
    removeTeilnehmerFromKurs 
} from '../lib/supabaseServer'; // Korrigierter Pfad
import { UserPlus, UserMinus, Users, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link'; // Importiere Link

export default function KursTeilnehmerManagement({ kursId, maxTeilnehmer }) {
  const router = useRouter();
  const [teilnehmerImKurs, setTeilnehmerImKurs] = useState([]);
  const [verfuegbareTeilnehmer, setVerfuegbareTeilnehmer] = useState([]);
  const [selectedTeilnehmerToAdd, setSelectedTeilnehmerToAdd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null); // ID des Teilnehmers, der gerade entfernt wird
  
  // useTransition für nicht-blockierende UI-Updates beim Neuladen
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kursTN, verfuegbareTN] = await Promise.all([
        getTeilnehmerForKurs(kursId),
        getAvailableTeilnehmerForKurs(kursId)
      ]);
      setTeilnehmerImKurs(kursTN);
      setVerfuegbareTeilnehmer(verfuegbareTN);
    } catch (e) {
      console.error("Fehler beim Laden der Teilnehmerdaten:", e);
      setError("Teilnehmerdaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [kursId]);

  const handleAddTeilnehmer = async () => {
    if (!selectedTeilnehmerToAdd) return;
    setAdding(true);
    setError(null);
    
    const { success, error: addError } = await addTeilnehmerToKurs(kursId, selectedTeilnehmerToAdd);
    
    if (success) {
      setSelectedTeilnehmerToAdd(''); // Reset dropdown
      // Daten neu laden mit Transition, um UI nicht zu blockieren
      startTransition(() => {
          loadData();
          // Optional: router.refresh() wenn Server-Komponenten aktualisiert werden sollen
          // router.refresh(); 
      });
    } else {
      setError(addError || "Teilnehmer konnte nicht hinzugefügt werden.");
    }
    setAdding(false);
  };

  const handleRemoveTeilnehmer = async (teilnehmerId) => {
    setRemovingId(teilnehmerId); // Zeige Ladezustand für diesen Teilnehmer
    setError(null);
    
    const { success, error: removeError } = await removeTeilnehmerFromKurs(kursId, teilnehmerId);
    
    if (success) {
       // Daten neu laden mit Transition
       startTransition(() => {
          loadData();
          // router.refresh();
       });
    } else {
      setError(removeError || "Teilnehmer konnte nicht entfernt werden.");
    }
    setRemovingId(null); // Ladezustand entfernen
  };
  
  const aktuelleTeilnehmerzahl = teilnehmerImKurs.length;
  const isKursVoll = maxTeilnehmer !== null && aktuelleTeilnehmerzahl >= maxTeilnehmer;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2 dark:border-gray-700 flex justify-between items-center">
        <span>Teilnehmer ({aktuelleTeilnehmerzahl}{maxTeilnehmer !== null ? ` / ${maxTeilnehmer}` : ''})</span>
         <button 
             onClick={loadData} 
             disabled={loading || isPending}
             title="Liste neu laden"
             className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${(loading || isPending) ? 'animate-spin' : ''}`}
             >
             <RefreshCw size={18}/>
         </button>
      </h2>

      {loading && (
        <div className="flex justify-center items-center py-5">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="ml-2">Lade Teilnehmer...</span>
        </div>
      )}

      {error && (
        <div className="my-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-700" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Teilnehmer hinzufügen */}
      {!loading && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-3">
          <h3 className="text-lg font-medium flex items-center">
            <UserPlus className="h-5 w-5 mr-2"/> Teilnehmer hinzufügen
          </h3>
          {isKursVoll ? (
                <p className="text-sm text-orange-600 dark:text-orange-400">Der Kurs ist voll (Max. {maxTeilnehmer} Teilnehmer).</p>
          ) : verfuegbareTeilnehmer.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Keine weiteren verfügbaren Teilnehmer gefunden.</p>
          ) : (
             <div className="flex items-center space-x-2">
                <select 
                    value={selectedTeilnehmerToAdd}
                    onChange={(e) => setSelectedTeilnehmerToAdd(e.target.value)}
                    className="input-field flex-grow"
                    disabled={adding}
                >
                    <option value="">-- Teilnehmer auswählen --</option>
                    {verfuegbareTeilnehmer.map(tn => (
                    <option key={tn.id} value={tn.id}>{tn.nachname}, {tn.vorname}</option>
                    ))}
                </select>
                <button 
                    onClick={handleAddTeilnehmer}
                    disabled={!selectedTeilnehmerToAdd || adding || isPending}
                    className={`btn-secondary px-3 py-2 ${adding || isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus size={16}/>}
                </button>
             </div>
          )}
        </div>
      )}

      {/* Liste der Teilnehmer im Kurs */}
      {!loading && teilnehmerImKurs.length > 0 && (
        <div className="space-y-3 mt-6">
           <h3 className="text-lg font-medium">Aktuelle Teilnehmer</h3>
           <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {teilnehmerImKurs.map(tn => (
              <li key={tn.id} className="py-3 flex justify-between items-center">
                {/* Mache den Namen zum Link */}
                <Link href={`/teilnehmer/${tn.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 group">
                   <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:underline">{tn.nachname}, {tn.vorname}</span>
                   <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({tn.email})</span>
                   {!tn.aktiv && <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">(Inaktiv)</span>}
                </Link>
                 <button 
                     onClick={() => handleRemoveTeilnehmer(tn.id)} 
                     disabled={removingId === tn.id || isPending}
                     className={`btn-danger p-2 ${removingId === tn.id || isPending ? 'opacity-50 cursor-wait' : ''}`}
                     title="Teilnehmer entfernen"
                 >
                   {removingId === tn.id ? 
                     <Loader2 className="h-4 w-4 animate-spin"/> : 
                     <UserMinus size={16}/>
                    }
                 </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {!loading && teilnehmerImKurs.length === 0 && (
           <p className="text-center text-gray-500 dark:text-gray-400 mt-6">Noch keine Teilnehmer in diesem Kurs.</p>
      )}
      
       {/* Input Field & Button Styles (kopiert und angepasst) */}
      <style jsx>{`
        .input-field {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
          background-color: #ffffff; /* white */
          color: #111827; /* gray-900 */
        }
        .dark .input-field {
          background-color: #374151; /* gray-700 */
          border-color: #4b5563; /* gray-600 */
          color: #ffffff; /* white */
        }
        .input-field:focus {
          outline: none;
          border-color: #4f46e5; /* indigo-500 */
          box-shadow: 0 0 0 1px #4f46e5; /* ring-1 ring-indigo-500 */
        }
        .btn-secondary {
          /* ... (wie vorher) ... */
           display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db; /* gray-300 */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem; /* text-sm */
          font-weight: 500; /* font-medium */
          border-radius: 0.375rem; /* rounded-md */
          color: #374151; /* text-gray-700 */
          background-color: #ffffff; /* bg-white */
        }
        .dark .btn-secondary {
           background-color: #4b5563; /* dark:bg-gray-600 */
           color: #e5e7eb; /* dark:text-gray-200 */
           border-color: #6b7280; /* dark:border-gray-500 */
        }
        .btn-secondary:hover {
          background-color: #f9fafb; /* hover:bg-gray-50 */
        }
        .dark .btn-secondary:hover {
          background-color: #374151; /* dark:hover:bg-gray-700 */
        }
        .btn-danger {
           /* ... (ähnlich btn-secondary, aber rote Farben) ... */
            display: inline-flex;
            justify-content: center;
            align-items: center;
            padding: 0.5rem; /* Kleinere Padding für Icon-Button */
            border: 1px solid #ef4444; /* red-500 */
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            font-size: 0.875rem; 
            font-weight: 500; 
            border-radius: 0.375rem; 
            color: #ef4444; /* red-500 */
            background-color: #ffffff; /* bg-white */
        }
        .dark .btn-danger {
            background-color: #4b5563; 
            color: #fca5a5; /* dark:text-red-300 */
            border-color: #dc2626; /* dark:border-red-600 */
        }
        .btn-danger:hover {
            background-color: #fef2f2; /* hover:bg-red-50 */
        }
        .dark .btn-danger:hover {
            background-color: #52525b; /* dark:bg-zinc-600 */
            color: #ef4444; /* dark:text-red-500 */
        }
      `}</style>
    </div>
  );
}

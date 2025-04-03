'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Hilfsfunktionen für Datum/Zeit (könnten ausgelagert werden)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'Ungültiges Datum';
  }
};

const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Ungültige Zeit';
  }
};

export default function KalenderView({ kurse }) {
  const router = useRouter();

  if (!kurse || kurse.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-center mt-8">Keine Kurse zur Anzeige im Kalender vorhanden.</p>;
  }

  // Einfache Gruppierung nach Startdatum (nur Tag) für die Demo
  // Für eine echte Kalenderansicht bräuchte man eine komplexere Logik oder eine Bibliothek
  const kurseNachDatum = kurse.reduce((acc, kurs) => {
    const datum = formatDate(kurs.start_datum);
    if (!acc[datum]) {
      acc[datum] = [];
    }
    acc[datum].push(kurs);
    return acc;
  }, {});

  // Sortiere die Daten
  const sortierteDaten = Object.keys(kurseNachDatum).sort((a, b) => {
    // Konvertiere DD.MM.YYYY zu YYYY-MM-DD für den Vergleich
    const dateA = a.split('.').reverse().join('-');
    const dateB = b.split('.').reverse().join('-');
    return new Date(dateA) - new Date(dateB);
  });

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Kurskalender (Einfache Ansicht)</h2>
      <div className="space-y-6">
        {sortierteDaten.map((datum) => (
          <div key={datum} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">{datum}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {kurseNachDatum[datum]
                .sort((a, b) => new Date(a.start_datum) - new Date(b.start_datum)) // Sortiere Kurse nach Uhrzeit
                .map((kurs) => (
                <div 
                  key={kurs.id} 
                  className="bg-white dark:bg-gray-700 rounded shadow p-3 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => router.push(`/kurse/${kurs.id}`)} // Navigation zur Detailseite
                >
                  <h4 className="font-semibold text-indigo-700 dark:text-indigo-400">{kurs.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(kurs.start_datum)} - {formatTime(kurs.end_datum)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                    Max. TN: {kurs.max_teilnehmer || 'N/A'}
                  </p>
                  {/* Platzhalter für Trainer & Auslastung */}
                  {/* <p className="text-xs text-gray-500 dark:text-gray-300">Trainer: {kurs.trainer || 'N/A'}</p> */}
                  {/* <p className="text-xs text-gray-500 dark:text-gray-300">Auslastung: ...%</p> */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-6 text-gray-500 dark:text-gray-400">
        Hinweis: Dies ist eine vereinfachte Ansicht. Eine vollständige Wochen-/Monatsansicht erfordert zusätzliche Logik.
      </p>
    </div>
  );
}

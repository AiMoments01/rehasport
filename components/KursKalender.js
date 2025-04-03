'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import de from 'date-fns/locale/de'; // Deutsche Lokalisierung
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAllKurse } from '../lib/supabaseServer'; // Funktion zum Laden der Kurse
import { Loader2 } from 'lucide-react';

// Konfiguriere den date-fns Localizer für Deutsch
const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Woche beginnt am Montag
  getDay,
  locales,
});

export default function KursKalender() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month'); // Zustand für die aktuelle Ansicht
  const [date, setDate] = useState(new Date()); // Zustand für das aktuelle Datum
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wrapper für onNavigate zum Debuggen
  const handleNavigate = useCallback((newDate, view) => {
    setDate(newDate); // Aktualisiere den Datumszustand
  }, []); // Leeres Abhängigkeitsarray, da setDate stabil ist

  useEffect(() => {
    const fetchKurse = async () => {
      setLoading(true);
      setError(null);
      try {
        const kurse = await getAllKurse(); // Lade alle Kurse
        
        // Konvertiere Kurse in das Event-Format von react-big-calendar
        const calendarEvents = kurse
           .filter(kurs => kurs.start_datum && kurs.end_datum && kurs.aktiv) // Nur aktive Kurse mit Start/Enddatum
           .map(kurs => ({
             id: kurs.id,
             title: kurs.name,
             start: new Date(kurs.start_datum),
             end: new Date(kurs.end_datum),
             allDay: false, // Oder true, wenn es Ganztageskurse wären
             resource: kurs, // Speichere das ganze Kurs-Objekt für Details
           }));
           
        setEvents(calendarEvents);
      } catch (e) {
        console.error('Fehler beim Laden der Kurse für den Kalender:', e);
        setError('Kurse konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    fetchKurse();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="ml-3 text-lg">Lade Kalenderdaten...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-700" role="alert">
        <strong className="font-bold">Fehler: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="h-[80vh] bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        view={view} // Aktuelle Ansicht übergeben
        date={date} // Aktuelles Datum übergeben
        onView={setView} // Handler für Ansichtsänderung
        onNavigate={handleNavigate} // Debugging-Handler für Datumsänderung
        views={['month', 'week', 'day', 'agenda']} // Verfügbare Ansichten definieren
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture='de' // Setze die Kultur auf Deutsch
        messages={{
            week: 'Woche',
            work_week: 'Arbeitswoche',
            day: 'Tag',
            month: 'Monat',
            previous: 'Zurück',
            next: 'Weiter',
            today: 'Heute',
            agenda: 'Agenda',
            showMore: total => `+${total} weitere`
        }}
        // Optional: Event-Styling oder Klick-Handler hinzufügen
        // onSelectEvent={event => alert(event.title)}
      />
    </div>
  );
}

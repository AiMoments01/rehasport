'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase-Client für Server-Komponenten erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funktion zum Abrufen aller Dashboard-Daten
export async function getDashboardData() {
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
    
    // Alle Daten zurückgeben
    return {
      aktiveTeilnehmer,
      kurseHeute,
      neueLeads,
      umsatz,
      formatierterUmsatz,
      teilnehmerEntwicklung,
      kursauslastung,
      teilnehmerNachRolle
    };
    
  } catch (err) {
    console.error('Fehler beim Laden der Dashboard-Daten:', err);
    return {
      aktiveTeilnehmer: 0,
      kurseHeute: 0,
      neueLeads: 0,
      umsatz: 0,
      formatierterUmsatz: '0 €',
      teilnehmerEntwicklung: [],
      kursauslastung: [],
      teilnehmerNachRolle: []
    };
  }
}

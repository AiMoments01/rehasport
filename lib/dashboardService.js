'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase-Client für Server-Komponenten erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funktion zum Abrufen der aktiven Teilnehmer
export async function getActiveTeilnehmer() {
  try {
    const { count, error } = await supabase
      .from('teilnehmer')
      .select('*', { count: 'exact', head: true })
      .eq('aktiv', true);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Fehler beim Abrufen der aktiven Teilnehmer:', error);
    return 0;
  }
}

// Funktion zum Abrufen der heutigen Kurse
export async function getKurseHeute() {
  const heute = new Date().toISOString().split('T')[0];
  
  try {
    const { count, error } = await supabase
      .from('kurse')
      .select('*', { count: 'exact', head: true })
      .gte('datum', heute)
      .lt('datum', heute + 'T23:59:59');
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Fehler beim Abrufen der heutigen Kurse:', error);
    return 0;
  }
}

// Funktion zum Abrufen der neuen Leads diese Woche
export async function getNeueLeadsWoche() {
  // Datum für Anfang der aktuellen Woche (Montag)
  const heute = new Date();
  const tagDerWoche = heute.getDay(); // 0 = Sonntag, 1 = Montag, ...
  const differenzZuMontag = tagDerWoche === 0 ? 6 : tagDerWoche - 1;
  
  const wochenstart = new Date(heute);
  wochenstart.setDate(heute.getDate() - differenzZuMontag);
  wochenstart.setHours(0, 0, 0, 0);
  
  const wochenstartIso = wochenstart.toISOString();
  
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', wochenstartIso);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Fehler beim Abrufen der neuen Leads:', error);
    return 0;
  }
}

// Funktion zum Abrufen des Umsatzes (Demo-Wert oder aus Supabase)
export async function getUmsatz() {
  try {
    // Versuche, den Umsatz aus der Datenbank zu laden
    const { data, error } = await supabase
      .from('umsatz')
      .select('summe')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    // Wenn Daten vorhanden sind, gib den Umsatz zurück
    if (data && data.length > 0) {
      const umsatz = data[0].summe;
      const formatierterUmsatz = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(umsatz);
      
      return { umsatz, formatierterUmsatz };
    }
    
    // Ansonsten gib einen Demo-Wert zurück
    const umsatz = 2450.75;
    const formatierterUmsatz = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(umsatz);
    
    return { umsatz, formatierterUmsatz };
  } catch (error) {
    console.error('Fehler beim Abrufen des Umsatzes:', error);
    return { umsatz: 0, formatierterUmsatz: '0 €' };
  }
}

// Funktion zum Abrufen der Teilnehmerentwicklung (monatlich)
export async function getTeilnehmerEntwicklung() {
  try {
    // In einer realen Anwendung würde hier eine SQL-Abfrage mit Gruppierung nach Monat stehen
    // Für Demo-Zwecke geben wir Beispieldaten zurück
    
    // Versuche, die Daten aus der Datenbank zu laden
    const { data, error } = await supabase
      .from('teilnehmer_entwicklung')
      .select('monat, anzahl_teilnehmer')
      .order('monat', { ascending: true });
    
    if (error) throw error;
    
    // Wenn Daten vorhanden sind, gib sie zurück
    if (data && data.length > 0) {
      return data;
    }
    
    // Ansonsten gib Demo-Daten zurück
    const demoData = [
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
    
    return demoData;
  } catch (error) {
    console.error('Fehler beim Abrufen der Teilnehmerentwicklung:', error);
    
    // Demo-Daten für den Fehlerfall
    return [
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
  }
}

// Funktion zum Abrufen der Kursauslastung pro Woche
export async function getKursauslastung() {
  try {
    // In einer realen Anwendung würde hier eine SQL-Abfrage mit Gruppierung nach Woche stehen
    // Für Demo-Zwecke geben wir Beispieldaten zurück
    
    // Versuche, die Daten aus der Datenbank zu laden
    const { data, error } = await supabase
      .from('kurs_auslastung')
      .select('woche, auslastung_prozent')
      .order('woche', { ascending: true });
    
    if (error) throw error;
    
    // Wenn Daten vorhanden sind, gib sie zurück
    if (data && data.length > 0) {
      return data;
    }
    
    // Ansonsten gib Demo-Daten zurück
    const demoData = [
      { woche: 'KW 1', auslastung_prozent: 75 },
      { woche: 'KW 2', auslastung_prozent: 82 },
      { woche: 'KW 3', auslastung_prozent: 78 },
      { woche: 'KW 4', auslastung_prozent: 85 },
      { woche: 'KW 5', auslastung_prozent: 90 },
      { woche: 'KW 6', auslastung_prozent: 88 }
    ];
    
    return demoData;
  } catch (error) {
    console.error('Fehler beim Abrufen der Kursauslastung:', error);
    
    // Demo-Daten für den Fehlerfall
    return [
      { woche: 'KW 1', auslastung_prozent: 75 },
      { woche: 'KW 2', auslastung_prozent: 82 },
      { woche: 'KW 3', auslastung_prozent: 78 },
      { woche: 'KW 4', auslastung_prozent: 85 },
      { woche: 'KW 5', auslastung_prozent: 90 },
      { woche: 'KW 6', auslastung_prozent: 88 }
    ];
  }
}

// Funktion zum Abrufen der Teilnehmer nach Rolle (z.B. Selbstzahler vs. Kasse)
export async function getTeilnehmerNachRolle() {
  try {
    // In einer realen Anwendung würde hier eine SQL-Abfrage mit Gruppierung nach Rolle stehen
    // Für Demo-Zwecke geben wir Beispieldaten zurück
    
    // Versuche, die Daten aus der Datenbank zu laden
    const { data, error } = await supabase
      .from('teilnehmer_rollen')
      .select('rolle, anzahl');
    
    if (error) throw error;
    
    // Wenn Daten vorhanden sind, gib sie zurück
    if (data && data.length > 0) {
      return data;
    }
    
    // Ansonsten gib Demo-Daten zurück
    const demoData = [
      { rolle: 'Selbstzahler', anzahl: 120 },
      { rolle: 'Gesetzliche Kasse', anzahl: 230 },
      { rolle: 'Private Kasse', anzahl: 85 },
      { rolle: 'Berufsgenossenschaft', anzahl: 65 }
    ];
    
    return demoData;
  } catch (error) {
    console.error('Fehler beim Abrufen der Teilnehmer nach Rolle:', error);
    
    // Demo-Daten für den Fehlerfall
    return [
      { rolle: 'Selbstzahler', anzahl: 120 },
      { rolle: 'Gesetzliche Kasse', anzahl: 230 },
      { rolle: 'Private Kasse', anzahl: 85 },
      { rolle: 'Berufsgenossenschaft', anzahl: 65 }
    ];
  }
}

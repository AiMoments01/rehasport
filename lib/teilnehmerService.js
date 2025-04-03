'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase-Client für Server-Komponenten erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Alle Teilnehmer abrufen
 * @param {Object} options - Optionen für die Abfrage
 * @param {number} options.limit - Anzahl der zurückzugebenden Einträge
 * @param {number} options.offset - Offset für Paginierung
 * @param {string} options.orderBy - Spalte für Sortierung
 * @param {boolean} options.ascending - Sortierrichtung
 * @returns {Promise<Array>} - Liste der Teilnehmer
 */
export async function getAllTeilnehmer(options = {}) {
  const {
    limit = 25,
    offset = 0,
    orderBy = 'nachname',
    ascending = true
  } = options;

  try {
    let query = supabase
      .from('teilnehmer')
      .select('*')
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen der Teilnehmer:', error);
    throw error;
  }
}

/**
 * Teilnehmer nach ID abrufen
 * @param {string} id - ID des Teilnehmers
 * @returns {Promise<Object>} - Teilnehmerdaten
 */
export async function getTeilnehmerById(id) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Fehler beim Abrufen des Teilnehmers mit ID ${id}:`, error);
    throw error;
  }
}

/**
 * Teilnehmer nach Suchbegriff filtern
 * @param {string} query - Suchbegriff
 * @returns {Promise<Array>} - Liste der gefilterten Teilnehmer
 */
export async function searchTeilnehmer(query) {
  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const { data, error } = await supabase
      .from('teilnehmer')
      .select('*')
      .or(`vorname.ilike.${searchTerm},nachname.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .order('nachname', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Fehler bei der Teilnehmersuche:', error);
    throw error;
  }
}

/**
 * Teilnehmer nach Status filtern
 * @param {boolean} isActive - Aktiv-Status
 * @returns {Promise<Array>} - Liste der gefilterten Teilnehmer
 */
export async function getTeilnehmerByStatus(isActive) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .select('*')
      .eq('aktiv', isActive)
      .order('nachname', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Fehler beim Abrufen der Teilnehmer mit Status ${isActive}:`, error);
    throw error;
  }
}

/**
 * Teilnehmer nach Kurs filtern
 * @param {string} kursId - ID des Kurses
 * @returns {Promise<Array>} - Liste der gefilterten Teilnehmer
 */
export async function getTeilnehmerByKurs(kursId) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .select('*')
      .eq('kurs_id', kursId)
      .order('nachname', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Fehler beim Abrufen der Teilnehmer für Kurs ${kursId}:`, error);
    throw error;
  }
}

/**
 * Teilnehmer aktualisieren
 * @param {string} id - ID des Teilnehmers
 * @param {Object} updateData - Zu aktualisierende Daten
 * @returns {Promise<Object>} - Aktualisierte Teilnehmerdaten
 */
export async function updateTeilnehmer(id, updateData) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Teilnehmers mit ID ${id}:`, error);
    throw error;
  }
}

/**
 * Neuen Teilnehmer erstellen
 * @param {Object} teilnehmerData - Teilnehmerdaten
 * @returns {Promise<Object>} - Erstellte Teilnehmerdaten
 */
export async function createTeilnehmer(teilnehmerData) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .insert({
        ...teilnehmerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Fehler beim Erstellen des Teilnehmers:', error);
    throw error;
  }
}

/**
 * Alle Kurse abrufen
 * @returns {Promise<Array>} - Liste der Kurse
 */
export async function getAllKurse() {
  try {
    const { data, error } = await supabase
      .from('kurse')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen der Kurse:', error);
    throw error;
  }
}

/**
 * Verlaufseinträge für einen Teilnehmer abrufen
 * @param {string} teilnehmerId - ID des Teilnehmers
 * @returns {Promise<Array>} - Liste der Verlaufseinträge
 */
export async function getTeilnehmerVerlauf(teilnehmerId) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer_verlauf')
      .select('*')
      .eq('teilnehmer_id', teilnehmerId)
      .order('datum', { ascending: false });
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Fehler beim Abrufen des Verlaufs für Teilnehmer ${teilnehmerId}:`, error);
    throw error;
  }
}

/**
 * Verlaufseintrag erstellen
 * @param {Object} verlaufData - Verlaufsdaten
 * @returns {Promise<Object>} - Erstellte Verlaufsdaten
 */
export async function createVerlaufseintrag(verlaufData) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer_verlauf')
      .insert({
        ...verlaufData,
        datum: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Fehler beim Erstellen des Verlaufseintrags:', error);
    // Hier werfen wir den Fehler nicht, da die Verlaufstabelle optional ist
    return null;
  }
}

'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase-Client für Server-Komponenten erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funktion zum Abrufen aller Teilnehmer
export async function getAllTeilnehmer() {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .select('*')
      .order('nachname', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen aller Teilnehmer:', error);
    return [];
  }
}

// Funktion zum Abrufen aller Kurse
export async function getAllKurse() {
  try {
    const { data, error } = await supabase
      .from('kurse')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen aller Kurse:', error);
    return [];
  }
}

// Funktion zum Abrufen eines einzelnen Teilnehmers
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
    return null;
  }
}

// Funktion zum Erstellen eines neuen Teilnehmers
export async function createTeilnehmer(teilnehmerData) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .insert([teilnehmerData])
      .select();
      
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Fehler beim Erstellen des Teilnehmers:', error);
    return { success: false, error: error.message };
  }
}

// Funktion zum Aktualisieren eines Teilnehmers
export async function updateTeilnehmer(id, teilnehmerData) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .update(teilnehmerData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Teilnehmers mit ID ${id}:`, error);
    return { success: false, error: error.message };
  }
}

// Funktion zum Löschen eines Teilnehmers
export async function deleteTeilnehmer(id) {
  try {
    const { error } = await supabase
      .from('teilnehmer')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Fehler beim Löschen des Teilnehmers mit ID ${id}:`, error);
    return { success: false, error: error.message };
  }
}

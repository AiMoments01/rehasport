'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase-Client für Server-Komponenten erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.");
}

// Verwende den Service Key, falls vorhanden, sonst den Anon Key
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Prüft, ob die notwendigen Tabellen für die Chat-Funktionalität existieren
 * Da die Tabellen bereits manuell erstellt wurden, prüfen wir nur ihre Existenz
 */
export async function setupChatTables() {
  try {
    console.log('Prüfe Chat-Tabellen...');
    
    // Prüfe, ob die messages-Tabelle existiert
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    if (messagesError && messagesError.code === '42P01') {
      console.error('Die messages-Tabelle existiert nicht:', messagesError);
      return { success: false, error: messagesError };
    }
    
    // Prüfe, ob die profiles-Tabelle existiert
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError && profilesError.code === '42P01') {
      console.error('Die profiles-Tabelle existiert nicht:', profilesError);
      return { success: false, error: profilesError };
    }
    
    console.log('Chat-Tabellen existieren.');
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Prüfen der Chat-Tabellen:', error);
    return { success: false, error };
  }
}

/**
 * Migriert bestehende Benutzer in die profiles-Tabelle
 * Diese Funktion wird nicht mehr benötigt, da die Tabellen manuell erstellt wurden
 */
export async function migrateExistingUsers() {
  // Diese Funktion ist jetzt leer, da die Migration bereits manuell durchgeführt wurde
  return { success: true };
}

/**
 * Sendet eine Nachricht von einem Benutzer an einen anderen
 */
export async function sendMessage(senderId, recipientId, content) {
  try {
    console.log(`Sende Nachricht von ${senderId} an ${recipientId}: ${content}`);
    
    // Sende die Nachricht
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content
      })
      .select();
      
    if (error) throw error;
    
    return { success: true, message: data && data.length > 0 ? data[0] : null };
  } catch (error) {
    console.error('Fehler beim Senden der Nachricht:', error);
    return { success: false, error };
  }
}

/**
 * Ruft Nachrichten zwischen zwei Benutzern ab
 */
export async function getMessages(userId, partnerId) {
  try {
    console.log(`Hole Nachrichten zwischen ${userId} und ${partnerId}`);
    
    // Hole die Nachrichten
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    return { success: true, messages: data || [] };
  } catch (error) {
    console.error('Fehler beim Abrufen der Nachrichten:', error);
    return { success: false, error, messages: [] };
  }
}

/**
 * Ruft alle Benutzer ab, mit denen der aktuelle Benutzer chatten kann
 */
export async function getChatUsers(currentUserId) {
  try {
    console.log(`Hole Chat-Benutzer für ${currentUserId}`);
    
    // Hole Benutzer aus der profiles-Tabelle
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, avatar_url')
      .neq('id', currentUserId);
      
    if (profilesError) throw profilesError;
    
    return { success: true, users: profilesData || [] };
  } catch (error) {
    console.error('Fehler beim Abrufen der Chat-Benutzer:', error);
    return { success: false, error, users: [] };
  }
}

/**
 * Markiert Nachrichten als gelesen
 */
export async function markMessagesAsRead(userId, partnerId) {
  try {
    console.log(`Markiere Nachrichten als gelesen für ${userId} von ${partnerId}`);
    
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('recipient_id', userId)
      .eq('read', false);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Markieren der Nachrichten als gelesen:', error);
    return { success: false, error };
  }
}

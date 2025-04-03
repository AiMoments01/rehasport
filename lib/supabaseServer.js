'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase-Client für Server-Komponenten erstellen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Nicht mehr verwenden
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // NEU: Service Key laden

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.");
}
if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_KEY is not set. Falling back to anon key (limited permissions).');
  // Fallback oder spezifischer Fehler, hier verwenden wir erstmal einen Warnhinweis und könnten den anon key nehmen, wenn er noch da wäre
  // Aktuell würde es ohne Service Key jetzt fehlschlagen.
  // Besser: throw new Error("SUPABASE_SERVICE_KEY is not set in environment variables.");
}

// Verwende den Service Key, falls vorhanden
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        // WICHTIG: Verhindert, dass der Service Key an den Client gesendet wird
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // Fallback zu anon key, falls service key fehlt (optional)

// Prüfen, ob der Client erstellt werden konnte (besonders wenn Service Key fehlt)
if (!supabase) {
  throw new Error("Failed to create Supabase client.");
}

// Funktion zum Erstellen eines Server-Supabase-Clients (kann jetzt weg oder bleibt so)
// export async function createServerSupabaseClient() {
//   return supabase; // Gibt jetzt den Client mit Service Key zurück
// }

// Funktion zum Abrufen des aktuellen Benutzers
// Diese Funktion könnte fehlschlagen oder null zurückgeben, wenn der Service Key verwendet wird,
// da der Service Key keinen spezifischen Benutzerkontext hat. Sie funktioniert nur korrekt,
// wenn sie im Kontext einer Anfrage mit Benutzer-Cookie aufgerufen wird (via Auth Helpers).
export async function getUser() {
  try {
    // Mit Service Key ist getSession/getUser nicht direkt sinnvoll, es gibt keine User-Session
    // Wir lassen es vorerst so, aber es wird wahrscheinlich nicht wie erwartet funktionieren.
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    if (!session) {
      // console.log('Keine Session gefunden (möglicherweise Service Key aktiv)');
      return null;
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    return user;
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers (evtl. wegen Service Key):', error);
    return null;
  }
}

/**
 * Alle Teilnehmer abrufen
 */
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

/**
 * Teilnehmer nach ID abrufen
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
    return null;
  }
}

/**
 * Alle Kurse abrufen
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
    console.error('Fehler beim Abrufen aller Kurse:', error);
    return [];
  }
}

/**
 * Teilnehmer aktualisieren
 */
export async function updateTeilnehmer(id, updatedData) {
  try {
    // Füge einen Verlaufseintrag hinzu, bevor die Daten aktualisiert werden
    // Optional: Hole alte Daten für detailliertere Verlaufsinfo
    
    const { data, error } = await supabase
      .from('teilnehmer')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;

    // Nach erfolgreicher Aktualisierung den Verlaufseintrag erstellen
    try {
      await supabase.from('teilnehmer_verlauf').insert({
        teilnehmer_id: id,
        aktion: 'Aktualisiert',
        details: `Teilnehmerdaten aktualisiert. Geänderte Felder: ${Object.keys(updatedData).join(', ')}`,
        // benutzer_id: userId // Falls Benutzer-ID verfügbar ist
      });
    } catch (verlaufError) {
      console.error('Fehler beim Erstellen des Verlaufseintrags:', verlaufError);
      // Fahre fort, auch wenn der Verlaufseintrag fehlschlägt
    }

    return data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Teilnehmers mit ID ${id}:`, error);
    throw error;
  }
}

/**
 * Neuen Teilnehmer erstellen
 */
export async function createTeilnehmer(teilnehmerData) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer')
      .insert([
        {
          vorname: teilnehmerData.vorname,
          nachname: teilnehmerData.nachname,
          email: teilnehmerData.email,
          telefon: teilnehmerData.telefon,
          geburtsdatum: teilnehmerData.geburtsdatum || null,
          strasse: teilnehmerData.strasse, 
          plz: teilnehmerData.plz,         
          ort: teilnehmerData.ort,          
          aktiv: teilnehmerData.aktiv,
          kurs_id: teilnehmerData.kurs_id || null, 
          notizen: teilnehmerData.notizen
        }
      ])
      .select(); 

    if (error) {
      console.error('Fehler beim Erstellen des Teilnehmers in Supabase:', error);
      throw error;
    }
    
    // Optional: Log in teilnehmer_verlauf hinzufügen (falls implementiert)
    // await logTeilnehmerAenderung(data[0].id, 'create', 'Teilnehmer erstellt', null);
    
    return data ? data[0] : null; 
  } catch (error) {
    console.error('Unerwarteter Fehler in createTeilnehmer:', error);
    return null; 
  }
}

/**
 * Verlaufseinträge für einen Teilnehmer abrufen
 */
export async function getTeilnehmerVerlauf(teilnehmerId) {
  try {
    const { data, error } = await supabase
      .from('teilnehmer_verlauf')
      .select('*')
      .eq('teilnehmer_id', teilnehmerId)
      .order('datum', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Fehler beim Abrufen des Verlaufs für Teilnehmer mit ID ${teilnehmerId}:`, error);
    return [];
  }
}

// ==================
// Trainer Management
// ==================

/**
 * Alle aktiven Trainer abrufen
 */
export async function getAllTrainer() {
  try {
    const { data, error } = await supabase
      .from('trainer')
      .select('id, vorname, nachname')
      .eq('aktiv', true)
      .order('nachname', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen aller Trainer:', error);
    return [];
  }
}

// ==================
// Kurs Management
// ==================

/**
 * Einen spezifischen Kurs anhand seiner ID abrufen, inklusive Trainerdaten
 */
export async function getKursById(id) {
  if (!id) {
    console.error('getKursById wurde ohne ID aufgerufen.');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('kurse')
      .select(`
        *,
        trainer ( id, vorname, nachname )
      `)
      .eq('id', id)
      .single(); // .single() gibt ein Objekt oder null zurück, und wirft Fehler wenn > 1 Ergebnis

    if (error) {
      // Fehler speziell behandeln, wenn kein Kurs gefunden wurde (Supabase wirft PGROST0002)
      if (error.code === 'PGRST116') { // Standard-PostgREST-Fehlercode für 0 Zeilen bei .single()
          console.log(`Kurs mit ID ${id} nicht gefunden.`);
          return null; 
      }
      // Anderen Fehler werfen
      console.error(`Fehler beim Abrufen des Kurses mit ID ${id}:`, error);
      throw error;
    }
    return data;
  } catch (error) {
    // Fängt auch den Fehler von .single() wenn nichts gefunden wurde, falls der Code nicht PGRST116 ist
    console.error(`Unerwarteter Fehler beim Abrufen des Kurses mit ID ${id}:`, error);
    return null;
  }
}

/**
 * Neuen Kurs erstellen
 */
export async function createKurs(kursData) {
  try {
    // Bereinige Trainer-ID: Leerer String -> null
    const trainerId = kursData.trainer_id === '' ? null : kursData.trainer_id;
    
    const { data, error } = await supabase
      .from('kurse')
      .insert({
        name: kursData.name,
        beschreibung: kursData.beschreibung,
        max_teilnehmer: kursData.max_teilnehmer,
        start_datum: kursData.start_datum || null,
        end_datum: kursData.end_datum || null,
        aktiv: kursData.aktiv,
        trainer_id: trainerId
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Fehler beim Erstellen eines neuen Kurses:', error);
    return null;
  }
}

/**
 * Bestehenden Kurs aktualisieren
 */
export async function updateKurs(id, kursData) {
  if (!id) {
     console.error('updateKurs wurde ohne ID aufgerufen.');
     return null;
  }
  try {
     // Bereinige Trainer-ID: Leerer String -> null
    const trainerId = kursData.trainer_id === '' ? null : kursData.trainer_id;
    
    const { data, error } = await supabase
      .from('kurse')
      .update({
        name: kursData.name,
        beschreibung: kursData.beschreibung,
        max_teilnehmer: kursData.max_teilnehmer,
        start_datum: kursData.start_datum || null,
        end_datum: kursData.end_datum || null,
        aktiv: kursData.aktiv,
        trainer_id: trainerId,
        updated_at: new Date().toISOString() // Aktualisiere updated_at Zeitstempel
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Kurses mit ID ${id}:`, error);
    return null;
  }
}

// ===========================
// Kurs-Teilnehmer Management
// ===========================

/**
 * Ruft alle Teilnehmer für einen bestimmten Kurs ab.
 */
export async function getTeilnehmerForKurs(kursId) {
  if (!kursId) return [];
  try {
    const { data, error } = await supabase
      .from('kurs_teilnehmer')
      .select(`
        teilnehmer ( id, vorname, nachname, email, aktiv )
      `)
      .eq('kurs_id', kursId)
      .order('teilnehmer(nachname)', { ascending: true });

    if (error) throw error;
    // Extrahiere die Teilnehmer-Daten aus dem verschachtelten Ergebnis
    return data ? data.map(item => item.teilnehmer).filter(Boolean) : []; 
  } catch (error) {
    console.error(`Fehler beim Abrufen der Teilnehmer für Kurs ${kursId}:`, error);
    return [];
  }
}

/**
 * Ruft alle aktiven Teilnehmer ab, die *nicht* bereits einem bestimmten Kurs zugeordnet sind.
 */
export async function getAvailableTeilnehmerForKurs(kursId) {
  if (!kursId) return [];
  try {
    // 1. Alle IDs der Teilnehmer holen, die bereits im Kurs sind
    const { data: zugeordneteIdsData, error: zugeordneteError } = await supabase
      .from('kurs_teilnehmer')
      .select('teilnehmer_id')
      .eq('kurs_id', kursId);
      
    if (zugeordneteError) throw zugeordneteError;
    const zugeordneteIds = zugeordneteIdsData ? zugeordneteIdsData.map(item => item.teilnehmer_id) : [];

    // 2. Alle aktiven Teilnehmer holen, die NICHT in der Liste der zugeordneten IDs sind
    let query = supabase
      .from('teilnehmer')
      .select('id, vorname, nachname')
      .eq('aktiv', true);
      
    if (zugeordneteIds.length > 0) {
       query = query.not('id', 'in', `(${zugeordneteIds.join(',')})`);
    }
    
    const { data, error } = await query.order('nachname', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Fehler beim Abrufen verfügbarer Teilnehmer für Kurs ${kursId}:`, error);
    return [];
  }
}

/**
 * Fügt einen Teilnehmer zu einem Kurs hinzu.
 */
export async function addTeilnehmerToKurs(kursId, teilnehmerId) {
  if (!kursId || !teilnehmerId) {
      console.error('addTeilnehmerToKurs: kursId oder teilnehmerId fehlt.');
      return { success: false, error: 'Kurs- oder Teilnehmer-ID fehlt.' };
  }
  try {
    const { error } = await supabase
      .from('kurs_teilnehmer')
      .insert({ 
          kurs_id: kursId, 
          teilnehmer_id: teilnehmerId 
      });

    if (error) {
        // Prüfen, ob der Fehler wegen eines doppelten Eintrags auftritt (unique constraint violation)
        if (error.code === '23505') { // PostgreSQL unique violation code
            console.warn(`Teilnehmer ${teilnehmerId} ist bereits in Kurs ${kursId}.`);
            return { success: true }; // Betrachte es als Erfolg, da die Bedingung (Teilnehmer ist im Kurs) erfüllt ist.
        } else {
             throw error;
        }
    }
    return { success: true };
  } catch (error) {
    console.error(`Fehler beim Hinzufügen von Teilnehmer ${teilnehmerId} zu Kurs ${kursId}:`, error);
    return { success: false, error: error.message || 'Unbekannter Fehler.' };
  }
}

/**
 * Entfernt einen Teilnehmer aus einem Kurs.
 */
export async function removeTeilnehmerFromKurs(kursId, teilnehmerId) {
  if (!kursId || !teilnehmerId) {
      console.error('removeTeilnehmerFromKurs: kursId oder teilnehmerId fehlt.');
      return { success: false, error: 'Kurs- oder Teilnehmer-ID fehlt.' };
  }
  try {
    const { error } = await supabase
      .from('kurs_teilnehmer')
      .delete()
      .eq('kurs_id', kursId)
      .eq('teilnehmer_id', teilnehmerId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Fehler beim Entfernen von Teilnehmer ${teilnehmerId} aus Kurs ${kursId}:`, error);
    return { success: false, error: error.message || 'Unbekannter Fehler.' };
  }
}

// ==========================
// Teilnehmer Verlauf (Beispiel)

// == Lead Management Funktionen ==

/**
 * Erstellt einen neuen Lead in der Datenbank
 */
export async function createLead(leadData) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: leadData.name,
        email: leadData.email,
        interest: leadData.interest,
        source: leadData.source || null // Setze Quelle auf null, wenn leer
        // Status wird standardmäßig auf 'neu' gesetzt (siehe Tabellendefinition)
      })
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fehler beim Erstellen des Leads:', error);
    // Spezifischere Fehlermeldung für unique constraint violation (doppelte E-Mail)
    if (error.code === '23505') { 
        return { success: false, error: 'Diese E-Mail-Adresse ist bereits registriert.' };
    }
    return { success: false, error: 'Lead konnte nicht erstellt werden.' };
  }
}

/**
 * Ruft alle Leads aus der Datenbank ab, sortiert nach Erstellungsdatum (neueste zuerst)
 */
export async function getAllLeads() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || []; // Leeres Array zurückgeben, wenn keine Daten vorhanden sind
  } catch (error) {
    console.error('Fehler beim Abrufen aller Leads:', error);
    return []; // Leeres Array bei Fehler zurückgeben
  }
}

/**
 * Aktualisiert den Status eines bestimmten Leads
 */
export async function updateLeadStatus(leadId, newStatus) {
  if (!leadId || !newStatus) {
    console.error('updateLeadStatus: leadId oder newStatus fehlt.');
    return { success: false, error: 'Lead-ID oder neuer Status fehlt.' };
  }
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Lead-Status für ID ${leadId}:`, error);
    return { success: false, error: 'Status konnte nicht aktualisiert werden.' };
  }
}

// ==============================
// Dokumenten-Management Funktionen
// ==============================

const DOKUMENTE_BUCKET = 'teilnehmer-dokumente'; // Name des Storage Buckets

/**
 * Lädt eine Datei in den Supabase Storage Bucket 'teilnehmer-dokumente'.
 * Erzeugt einen eindeutigen Pfad mit Teilnehmer-ID und UUID.
 *
 * @param {File} file Das hochzuladende File-Objekt.
 * @param {string} teilnehmerId Die UUID des Teilnehmers.
 * @returns {Promise<{ data: { path: string } | null, error: any }>} Das Ergebnis des Uploads.
 */
export async function uploadDocument(file, teilnehmerId) {
  if (!file || !teilnehmerId) {
    console.error('uploadDocument: Datei oder Teilnehmer-ID fehlt.');
    return { data: null, error: 'Datei oder Teilnehmer-ID fehlt.' };
  }

  try {
    // Erzeuge einen eindeutigeren Pfad, um Konflikte zu vermeiden
    // Format: <teilnehmerId>/<uuid>-<originalerDateiname>
    // (uuid_generate_v4 muss in der DB aktiviert sein: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";)
    // Wir verwenden hier crypto.randomUUID(), was im Browser und Node.js > 15 verfügbar ist.
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${teilnehmerId}/${uniqueFileName}`;

    console.log(`Uploading to path: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(DOKUMENTE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Nicht überschreiben, falls Pfad existiert (sollte durch UUID unwahrscheinlich sein)
      });

    if (error) throw error;
    console.log('Upload successful:', data);
    return { data, error: null }; // data enthält { path: string }
  } catch (error) {
    console.error('Fehler beim Hochladen des Dokuments:', error);
    return { data: null, error: error.message || 'Datei konnte nicht hochgeladen werden.' };
  }
}

/**
 * Speichert Metadaten eines Dokuments in der 'dokumente'-Tabelle.
 *
 * @param {object} metadata Metadaten-Objekt.
 * @param {string} metadata.teilnehmer_id UUID des Teilnehmers.
 * @param {string} metadata.dokument_typ Typ des Dokuments.
 * @param {string} metadata.dateiname Originaler Dateiname.
 * @param {string} metadata.storage_path Pfad im Supabase Storage.
 * @param {string} [metadata.mime_type] Optional: MIME-Typ der Datei.
 * @param {number} [metadata.file_size] Optional: Dateigröße in Bytes.
 * @returns {Promise<{ success: boolean, data: any | null, error: any }>} Ergebnis der Operation.
 */
export async function saveDocumentMetadata(metadata) {
  if (!metadata || !metadata.teilnehmer_id || !metadata.dokument_typ || !metadata.dateiname || !metadata.storage_path) {
      console.error('saveDocumentMetadata: Fehlende Metadaten.', metadata);
      return { success: false, data: null, error: 'Unvollständige Metadaten für das Dokument.' };
  }
  try {
      const { data, error } = await supabase
          .from('dokumente')
          .insert({
              teilnehmer_id: metadata.teilnehmer_id,
              dokument_typ: metadata.dokument_typ,
              dateiname: metadata.dateiname,
              storage_path: metadata.storage_path,
              mime_type: metadata.mime_type || null,
              file_size: metadata.file_size || null,
          })
          .select()
          .single();

      if (error) throw error;
      return { success: true, data, error: null };
  } catch (error) {
      console.error('Fehler beim Speichern der Dokument-Metadaten:', error);
      // Spezieller Fehlercode für Unique Constraint Verletzung des storage_path
      if (error.code === '23505') {
          return { success: false, data: null, error: 'Ein Dokument mit diesem Speicherpfad existiert bereits.' };
      }
      return { success: false, data: null, error: 'Metadaten konnten nicht gespeichert werden.' };
  }
}

/**
 * Ruft Dokumente ab, optional gefiltert nach Teilnehmer, Typ und Datum.
 * Fügt Teilnehmerinformationen hinzu.
 *
 * @param {object} [filters] Filteroptionen.
 * @param {string} [filters.teilnehmerId] UUID des Teilnehmers.
 * @param {string} [filters.dokumentTyp] Typ des Dokuments.
 * @param {string} [filters.startDate] Startdatum (ISO-String).
 * @param {string} [filters.endDate] Enddatum (ISO-String).
 * @returns {Promise<Array<object>>} Liste der Dokumente mit Teilnehmerdaten.
 */
export async function getDocuments(filters = {}) {
  try {
    let query = supabase
      .from('dokumente')
      .select(`
        id,
        dokument_typ,
        dateiname,
        storage_path,
        mime_type,
        file_size,
        uploaded_at,
        teilnehmer_id,
        teilnehmer ( id, vorname, nachname )
      `)
      .order('uploaded_at', { ascending: false });

    if (filters.teilnehmerId) {
      query = query.eq('teilnehmer_id', filters.teilnehmerId);
    }
    if (filters.dokumentTyp) {
      query = query.eq('dokument_typ', filters.dokumentTyp);
    }
    if (filters.startDate) {
      query = query.gte('uploaded_at', filters.startDate);
    }
    if (filters.endDate) {
      // Für das Enddatum nehmen wir den Beginn des Folgetages, um den gesamten Tag einzuschließen
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('uploaded_at', endDate.toISOString().split('T')[0]); 
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Abrufen der Dokumente:', error);
    return [];
  }
}

/**
 * Erstellt eine signierte URL zum Herunterladen/Anzeigen einer Datei aus einem privaten Bucket.
 * Hinweis: Funktioniert nur für private Buckets zuverlässig.
 * Für öffentliche Buckets kann getPublicUrl verwendet werden.
 *
 * @param {string} storagePath Pfad zur Datei im Bucket.
 * @param {number} [expiresIn=60] Gültigkeitsdauer der URL in Sekunden (default 1 Minute).
 * @returns {Promise<{ data: { signedUrl: string } | null, error: any }>} Die signierte URL.
 */
export async function getDocumentUrl(storagePath, expiresIn = 60) {
  if (!storagePath) {
    console.error('getDocumentUrl: storagePath fehlt.');
    return { data: null, error: 'Speicherpfad fehlt.' };
  }
  try {
    const { data, error } = await supabase.storage
      .from(DOKUMENTE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
     console.error(`Fehler beim Erstellen der Signed URL für ${storagePath}:`, error);
     return { data: null, error: 'URL konnte nicht erstellt werden.' };
  }
}

/**
 * Löscht ein Dokument aus dem Storage und den Metadaten-Eintrag aus der Datenbank.
 *
 * @param {string} documentId Die UUID des Dokuments in der 'dokumente'-Tabelle.
 * @param {string} storagePath Der Pfad der Datei im Storage Bucket.
 * @returns {Promise<{ success: boolean, error: any }>} Ergebnis der Operation.
 */
export async function deleteDocument(documentId, storagePath) {
    if (!documentId || !storagePath) {
        console.error('deleteDocument: Dokumenten-ID oder Speicherpfad fehlt.');
        return { success: false, error: 'Dokumenten-ID oder Speicherpfad fehlt.' };
    }

    try {
        // 1. Datei aus Storage löschen
        const { error: storageError } = await supabase.storage
            .from(DOKUMENTE_BUCKET)
            .remove([storagePath]);

        // Fehler im Storage behandeln, aber versuchen, DB-Eintrag trotzdem zu löschen
        if (storageError) {
            console.error(`Fehler beim Löschen der Datei ${storagePath} aus dem Storage:`, storageError);
            // Optional: Entscheiden, ob hier abgebrochen werden soll oder der DB-Löschversuch trotzdem stattfindet
            // return { success: false, error: 'Fehler beim Löschen der Datei aus dem Speicher.' };
        }

        // 2. Metadaten aus Datenbank löschen
        const { error: dbError } = await supabase
            .from('dokumente')
            .delete()
            .eq('id', documentId);

        if (dbError) throw dbError; // Wenn DB-Löschen fehlschlägt, ist es ein ernster Fehler

        // Wenn Storage-Löschen fehlschlug, aber DB erfolgreich war, dies melden
        if (storageError) {
             return { success: false, error: 'Metadaten gelöscht, aber Fehler beim Löschen der Speicherdatei.' };
        }

        return { success: true, error: null };

    } catch (error) {
        console.error(`Fehler beim Löschen des Dokuments ${documentId}:`, error);
        return { success: false, error: 'Dokument konnte nicht vollständig gelöscht werden.' };
    }
}

// ==========================
// PDF Generierung & Upload
// ==========================

import { generatePdf } from '../lib/pdfGenerator'; // Importiere die PDF-Generierungsfunktion
import { v4 as uuidv4 } from 'uuid'; // Zum Erzeugen eindeutiger Dateinamen

/**
 * Generiert ein PDF für einen Teilnehmer, lädt es hoch und speichert die Metadaten.
 * 
 * @param {string} teilnehmerId Die UUID des Teilnehmers.
 * @param {string} documentType Der Typ des zu generierenden Dokuments (z.B. 'Bescheinigung').
 * @param {string} [filenamePrefix='Generiertes_Dokument'] Ein Präfix für den Dateinamen.
 * @returns {Promise<{ success: boolean, data: any | null, error: any }>} Ergebnis der Operation.
 */
export async function generateAndSaveDocument(teilnehmerId, documentType, filenamePrefix = 'Generiertes_Dokument') {
  try {
    // 1. Teilnehmerdaten abrufen
    const teilnehmer = await getTeilnehmerById(teilnehmerId);
    if (!teilnehmer) {
      throw new Error(`Teilnehmer mit ID ${teilnehmerId} nicht gefunden.`);
    }

    // 2. PDF generieren
    console.log(`Generiere PDF Typ '${documentType}' für ${teilnehmer.vorname} ${teilnehmer.nachname}...`);
    const pdfBytes = await generatePdf(teilnehmer, documentType);
    console.log(`PDF generiert (${(pdfBytes.length / 1024).toFixed(2)} KB).`);

    // 3. Eindeutigen Dateinamen und Pfad erstellen
    const uniqueId = uuidv4();
    const dateiname = `${filenamePrefix}_${teilnehmer.nachname}_${teilnehmer.vorname}_${uniqueId.substring(0, 8)}.pdf`;
    const storagePath = `teilnehmer-dokumente/${teilnehmerId}/${dateiname}`; // Pfad im Storage

    // 4. PDF in Supabase Storage hochladen
    console.log(`Lade PDF hoch nach: ${storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from('teilnehmer-dokumente') // Sicherstellen, dass der Bucket-Name korrekt ist!
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false // Nicht überschreiben, falls Pfad existiert (sollte durch UUID unwahrscheinlich sein)
      });

    if (uploadError) {
      console.error('Fehler beim Hochladen des generierten PDFs:', uploadError);
      throw new Error('Generiertes PDF konnte nicht hochgeladen werden.');
    }
    console.log('PDF erfolgreich hochgeladen.');

    // 5. Metadaten in der 'dokumente'-Tabelle speichern
    const metadata = {
      teilnehmer_id: teilnehmerId,
      dokument_typ: documentType, // Oder spezifischer, z.B. 'Generierte Bescheinigung'
      dateiname: dateiname, // Der generierte, eindeutige Dateiname
      storage_path: storagePath,
      mime_type: 'application/pdf',
      file_size: pdfBytes.length,
      // uploaded_at wird automatisch von der DB gesetzt
    };

    console.log('Speichere Metadaten:', metadata);
    const { success, data: metaDataResult, error: metaDataError } = await saveDocumentMetadata(metadata);

    if (!success) {
      // Versuch, das gerade hochgeladene PDF zu löschen, wenn Metadaten fehlschlagen
      console.error('Fehler beim Speichern der Metadaten, versuche Upload rückgängig zu machen:', metaDataError);
      await supabase.storage.from('teilnehmer-dokumente').remove([storagePath]);
      throw new Error(metaDataError?.message || 'Metadaten konnten nicht gespeichert werden.');
    }

    console.log('Metadaten erfolgreich gespeichert.');
    return { success: true, data: metaDataResult, error: null };

  } catch (error) {
    console.error('Fehler in generateAndSaveDocument:', error);
    // Gib spezifische Fehlermeldungen zurück, wenn möglich
    return { success: false, data: null, error: error.message || 'Ein unbekannter Fehler ist aufgetreten.' };
  }
}

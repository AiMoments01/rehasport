'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { 
  User, 
  Mail, 
  Calendar, 
  Save, 
  ArrowLeft,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Book,
  FileText, // Für PDF Button
  Loader2,  // Für Ladeanzeige
  AlertCircle // Für Fehlermeldung
} from 'lucide-react';
import { 
  getTeilnehmerById, 
  getAllKurse, 
  updateTeilnehmer, 
  getTeilnehmerVerlauf
} from '../../../lib/supabaseServer';

export default function TeilnehmerDetail({ params }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const [user, setUser] = useState(null);
  const [teilnehmer, setTeilnehmer] = useState(null);
  const [kurse, setKurse] = useState([]);
  const [verlauf, setVerlauf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    geburtsdatum: '',
    strasse: '',
    plz: '',
    ort: '',
    aktiv: true,
    kurs_id: '',
    notizen: ''
  });
  
  const router = useRouter();

  // Benutzer-Session abrufen
  useEffect(() => {
    async function getSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session) {
          // Keine aktive Sitzung gefunden, zur Login-Seite umleiten
          router.push('/login');
          return;
        }
        
        setUser(data.session.user);
      } catch (err) {
        console.error('Fehler beim Abrufen der Session:', err);
        setError(err.message);
      }
    }
    
    getSession();
  }, [router]);

  // Teilnehmerdaten laden
  useEffect(() => {
    async function loadTeilnehmerData() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Server-Funktionen verwenden
        let teilnehmerData = null;
        let kurseData = [];
        let verlaufData = [];
        
        try {
          teilnehmerData = await getTeilnehmerById(id);
          
          if (teilnehmerData) {
            setFormData({
              vorname: teilnehmerData.vorname || '',
              nachname: teilnehmerData.nachname || '',
              email: teilnehmerData.email || '',
              telefon: teilnehmerData.telefon || '',
              geburtsdatum: teilnehmerData.geburtsdatum ? new Date(teilnehmerData.geburtsdatum).toISOString().split('T')[0] : '',
              strasse: teilnehmerData.strasse || '',
              plz: teilnehmerData.plz || '',
              ort: teilnehmerData.ort || '',
              aktiv: teilnehmerData.aktiv !== false,
              kurs_id: teilnehmerData.kurs_id || '',
              notizen: teilnehmerData.notizen || ''
            });
            
            setTeilnehmer(teilnehmerData);
          } else {
            setError('Teilnehmer nicht gefunden');
            return;
          }
        } catch (teilnehmerError) {
          console.error('Fehler beim Laden des Teilnehmers:', teilnehmerError);
          setError('Fehler beim Laden des Teilnehmers. Bitte versuchen Sie es später erneut.');
        }
        
        try {
          kurseData = await getAllKurse();
          setKurse(kurseData);
        } catch (kurseError) {
          console.error('Fehler beim Laden der Kurse:', kurseError);
        }
        
        try {
          verlaufData = await getTeilnehmerVerlauf(id);
          setVerlauf(verlaufData);
        } catch (verlaufError) {
          console.error('Fehler beim Laden des Verlaufs:', verlaufError);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadTeilnehmerData();
  }, [id, user]);

  // Eingabeänderungen verarbeiten
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Änderungen speichern
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !teilnehmer) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedData = { ...formData };
      // Sicherstellen, dass kurs_id null ist, wenn es leer ist
      if (updatedData.kurs_id === '') {
        updatedData.kurs_id = null;
      }
      
      // Geburtsdatum validieren und formatieren (optional, aber empfohlen)
      if (updatedData.geburtsdatum && isNaN(new Date(updatedData.geburtsdatum).getTime())) {
          throw new Error("Ungültiges Geburtsdatum");
      }

      const result = await updateTeilnehmer(id, updatedData);
      
      if (result) {
        setTeilnehmer(result); // Aktualisiere den lokalen Teilnehmerstatus
        setSuccess('Teilnehmerdaten erfolgreich aktualisiert!');
        // Optional: Lade den Verlauf neu, wenn eine Funktion dafür existiert
        // loadVerlauf(); 
      } else {
        // updateTeilnehmer sollte im Fehlerfall null zurückgeben oder einen Fehler werfen
        // Dieser Fall sollte idealerweise durch die Fehlerbehandlung im try-catch abgedeckt sein
        setError('Unbekannter Fehler beim Speichern.'); 
      }

    } catch (err) {
      console.error('Fehler beim Speichern der Teilnehmerdaten:', err);
      setError(err.message || 'Fehler beim Speichern der Daten.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Lade Teilnehmerdaten...</p>
      </div>
    );
  }

  if (error && !teilnehmer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => router.push('/teilnehmer')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zurück zur Teilnehmerliste
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Nicht angemeldet</h1>
          <p className="mb-4">Sie müssen angemeldet sein, um auf die Teilnehmerverwaltung zuzugreifen.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  if (!teilnehmer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Teilnehmer nicht gefunden</h1>
          <p className="mb-4">Der gesuchte Teilnehmer konnte nicht gefunden werden.</p>
          <button
            onClick={() => router.push('/teilnehmer')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zurück zur Teilnehmerliste
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/teilnehmer')}
              className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Teilnehmerdetails
            </h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 dark:bg-green-900 dark:text-green-200" role="alert">
            <p className="font-bold">Erfolg</p>
            <p>{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900 dark:text-red-200" role="alert">
            <p className="font-bold">Fehler</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Teilnehmerdetails */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                Teilnehmerinformationen
              </h2>
              
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white flex items-center">
                      <User className="h-5 w-5 mr-2 text-gray-400" />
                      {teilnehmer.vorname} {teilnehmer.nachname}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">E-Mail</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-gray-400" />
                      {teilnehmer.email}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefon</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white">
                      <Phone className="h-5 w-5 mr-2 text-gray-400" />
                      {teilnehmer.telefon || '-'}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white">
                      {teilnehmer.strasse && teilnehmer.plz && teilnehmer.ort ? (
                        <>
                          {teilnehmer.strasse}<br />
                          {teilnehmer.plz} {teilnehmer.ort}
                        </>
                      ) : (
                        'Keine Adresse angegeben'
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teilnehmer.aktiv 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {teilnehmer.aktiv ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {teilnehmer.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Zugewiesener Kurs</h3>
                    <p className="mt-1 text-lg text-gray-900 dark:text-white flex items-center">
                      <Book className="h-5 w-5 mr-2 text-gray-400" />
                      {teilnehmer.kurs_id ? (
                        kurse.find(k => k.id === teilnehmer.kurs_id)?.name || '-'
                      ) : (
                        'Kein Kurs zugewiesen'
                      )}
                    </p>
                  </div>
                  
                  {teilnehmer.created_at && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Registriert am</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(teilnehmer.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
                
                {teilnehmer.notizen && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notizen</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                      <p className="text-gray-900 dark:text-white whitespace-pre-line">{teilnehmer.notizen}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Verlauf */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-400" />
                Verlauf
              </h2>
              
              {verlauf.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {verlauf.map((eintrag, index) => (
                      <li key={eintrag.id}>
                        <div className="relative pb-8">
                          {index !== verlauf.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-xs">{index + 1}</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">{eintrag.details}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Aktion: {eintrag.aktion}</p>
                              </div>
                              <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {new Date(eintrag.datum).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Kein Verlauf verfügbar
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Bearbeitungsformular */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
            Teilnehmer bearbeiten
          </h2>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Vorname */}
              <div>
                <label htmlFor="vorname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vorname</label>
                <input
                  type="text"
                  name="vorname"
                  id="vorname"
                  value={formData.vorname}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Nachname */}
              <div>
                <label htmlFor="nachname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nachname</label>
                <input
                  type="text"
                  name="nachname"
                  id="nachname"
                  value={formData.nachname}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Telefon */}
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                <input
                  type="tel"
                  name="telefon"
                  id="telefon"
                  value={formData.telefon}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Strasse */}
              <div className="md:col-span-2">
                <label htmlFor="strasse" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Straße</label>
                <input
                  type="text"
                  name="strasse"
                  id="strasse"
                  value={formData.strasse}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* PLZ */}
              <div>
                <label htmlFor="plz" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PLZ</label>
                <input
                  type="text"
                  name="plz"
                  id="plz"
                  value={formData.plz}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Ort */}
              <div>
                <label htmlFor="ort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ort</label>
                <input
                  type="text"
                  name="ort"
                  id="ort"
                  value={formData.ort}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Geburtsdatum */}
              <div>
                <label htmlFor="geburtsdatum" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Geburtsdatum</label>
                <input
                  type="date"
                  name="geburtsdatum"
                  id="geburtsdatum"
                  value={formData.geburtsdatum}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Kurs Zuweisung */}
              <div>
                <label htmlFor="kurs_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zugewiesener Kurs</label>
                <select
                  name="kurs_id"
                  id="kurs_id"
                  value={formData.kurs_id || ''} // Stellt sicher, dass null als leerer String behandelt wird
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Kein Kurs</option>
                  {kurse.map(kurs => (
                    <option key={kurs.id} value={kurs.id}>{kurs.name}</option>
                  ))}
                </select>
              </div>
              {/* Aktiv Checkbox */}
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  name="aktiv"
                  id="aktiv"
                  checked={formData.aktiv}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="aktiv" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Teilnehmer ist aktiv</label>
              </div>
              {/* Notizen */}
              <div className="md:col-span-2">
                <label htmlFor="notizen" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notizen</label>
                <textarea
                  name="notizen"
                  id="notizen"
                  rows="4"
                  value={formData.notizen}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
            </div>
            
            {/* Speicher-Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
              >
                {saving ? 'Speichert...' : 'Änderungen speichern'}
                <Save className="ml-2 h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

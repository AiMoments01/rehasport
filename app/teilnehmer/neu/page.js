'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { 
  User, 
  Mail, 
  Calendar, 
  Save, 
  ArrowLeft,
  Phone,
  Home,
  MapPin
} from 'lucide-react';
import { getAllKurse, createTeilnehmer } from '../../../lib/supabaseServer';

export default function NeuerTeilnehmer() {
  const [user, setUser] = useState(null);
  const [kurse, setKurse] = useState([]);
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
        
        // Prüfen, ob der Benutzer Admin oder Trainer ist
        const userRole = data.session.user.user_metadata?.role;
        if (userRole !== 'admin' && userRole !== 'trainer') {
          setError('Sie haben keine Berechtigung, neue Teilnehmer anzulegen.');
          return;
        }
        
        setUser(data.session.user);
      } catch (err) {
        console.error('Fehler beim Abrufen der Session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    getSession();
  }, [router]);

  // Kurse laden
  useEffect(() => {
    async function loadKurse() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Server-Funktion verwenden
        const kurseData = await getAllKurse();
        
        setKurse(kurseData || []);
      } catch (err) {
        console.error('Fehler beim Laden der Kurse:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadKurse();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Server-Funktion zum Erstellen eines neuen Teilnehmers verwenden
      await createTeilnehmer({
        vorname: formData.vorname,
        nachname: formData.nachname,
        email: formData.email,
        telefon: formData.telefon,
        geburtsdatum: formData.geburtsdatum || null,
        strasse: formData.strasse,
        plz: formData.plz,
        ort: formData.ort,
        aktiv: formData.aktiv,
        kurs_id: formData.kurs_id === '' ? null : formData.kurs_id,
        notizen: formData.notizen
      });
      
      setSuccess('Teilnehmer erfolgreich erstellt');
      
      // Formular zurücksetzen
      setFormData({
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
      
      // Nach 2 Sekunden zur Teilnehmerliste zurückkehren
      setTimeout(() => {
        router.push('/teilnehmer');
      }, 2000);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setError(`Fehler beim Speichern: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Lade...</p>
      </div>
    );
  }

  if (error && !user) {
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
              Neuen Teilnehmer anlegen
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
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="vorname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vorname *
                </label>
                <input
                  type="text"
                  id="vorname"
                  name="vorname"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.vorname}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="nachname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nachname *
                </label>
                <input
                  type="text"
                  id="nachname"
                  name="nachname"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.nachname}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="telefon"
                    name="telefon"
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.telefon}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="geburtsdatum" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Geburtsdatum
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="geburtsdatum"
                    name="geburtsdatum"
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.geburtsdatum}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="strasse" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Home className="h-4 w-4 mr-1"/> Straße
                </label>
                <input
                  type="text"
                  id="strasse"
                  name="strasse"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.strasse}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="plz" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <MapPin className="h-4 w-4 mr-1"/> PLZ
                </label>
                <input
                  type="text"
                  id="plz"
                  name="plz"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.plz}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="ort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <MapPin className="h-4 w-4 mr-1"/> Ort
                </label>
                <input
                  type="text"
                  id="ort"
                  name="ort"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.ort}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="kurs_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zugewiesener Kurs
                </label>
                <select
                  id="kurs_id"
                  name="kurs_id"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.kurs_id}
                  onChange={handleInputChange}
                >
                  <option value="">Kein Kurs zugewiesen</option>
                  {kurse.map((kurs) => (
                    <option key={kurs.id} value={kurs.id}>
                      {kurs.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="aktiv"
                  name="aktiv"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.aktiv}
                  onChange={handleInputChange}
                />
                <label htmlFor="aktiv" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Aktiv
                </label>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="notizen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notizen
              </label>
              <textarea
                id="notizen"
                name="notizen"
                rows="4"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.notizen}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                onClick={() => router.push('/teilnehmer')}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Teilnehmer anlegen
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

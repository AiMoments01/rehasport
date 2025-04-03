'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  User,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Shield,
  Edit
} from 'lucide-react';
import LogoutButton from '../../../components/LogoutButton';

export default function TeilnehmerProfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teilnehmerData, setTeilnehmerData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    telefon: '',
    adresse: '',
    notizen: ''
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

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
          router.push('/');
          return;
        }
        
        // Überprüfen, ob der Benutzer ein Teilnehmer ist
        if (data.session.user.user_metadata?.role !== 'teilnehmer') {
          // Benutzer ist kein Teilnehmer, zum allgemeinen Dashboard umleiten
          router.push('/dashboard');
          return;
        }
        
        setUser(data.session.user);
      } catch (err) {
        console.error('Fehler beim Abrufen der Session:', err);
        setError(err.message);
      }
    }
    
    getSession();
    
    // Listener für Authentifizierungsänderungen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (session) {
          setUser(session.user);
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // Teilnehmer-Daten laden
  useEffect(() => {
    async function loadTeilnehmerData() {
      if (!user) return;
      
      try {
        // Teilnehmer-Profil laden
        const { data: teilnehmerProfile, error: teilnehmerError } = await supabase
          .from('teilnehmer')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (teilnehmerError) {
          console.error('Fehler beim Laden des Teilnehmerprofils:', teilnehmerError);
          return;
        }
        
        if (!teilnehmerProfile) {
          console.error('Kein Teilnehmerprofil gefunden');
          return;
        }
        
        setTeilnehmerData(teilnehmerProfile);
        setFormData({
          telefon: teilnehmerProfile.telefon || '',
          adresse: teilnehmerProfile.adresse || '',
          notizen: teilnehmerProfile.notizen || ''
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden der Teilnehmerdaten:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadTeilnehmerData();
  }, [user, supabase]);

  // Datum formatieren
  function formatiereDatum(datumString) {
    if (!datumString) return '';
    
    const datum = new Date(datumString);
    return datum.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Formular-Änderungen verarbeiten
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
  
  // Profil aktualisieren
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!teilnehmerData) return;
    
    try {
      const { error } = await supabase
        .from('teilnehmer')
        .update({
          telefon: formData.telefon,
          adresse: formData.adresse,
          notizen: formData.notizen,
          updated_at: new Date().toISOString()
        })
        .eq('id', teilnehmerData.id);
      
      if (error) {
        throw error;
      }
      
      // Daten neu laden
      const { data, error: refreshError } = await supabase
        .from('teilnehmer')
        .select('*')
        .eq('id', teilnehmerData.id)
        .single();
      
      if (refreshError) {
        throw refreshError;
      }
      
      setTeilnehmerData(data);
      setEditMode(false);
      
      // Erfolgsmeldung anzeigen
      alert('Profil erfolgreich aktualisiert!');
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Profils:', err);
      alert('Fehler beim Aktualisieren des Profils: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Profildaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Fehler</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  if (!teilnehmerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">Kein Teilnehmerprofil gefunden</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Es wurde kein Teilnehmerprofil für Ihren Account gefunden. Bitte kontaktieren Sie einen Administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mein Profil
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profil-Karte */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Persönliche Informationen
              </h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Bearbeiten
                </button>
              )}
            </div>
            
            <div className="p-6">
              {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={teilnehmerData.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Der Name kann nur von einem Administrator geändert werden.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={teilnehmerData.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Die E-Mail kann nur von einem Administrator geändert werden.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      id="telefon"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Adresse
                    </label>
                    <textarea
                      id="adresse"
                      name="adresse"
                      rows="3"
                      value={formData.adresse}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="notizen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Persönliche Notizen
                    </label>
                    <textarea
                      id="notizen"
                      name="notizen"
                      rows="4"
                      value={formData.notizen}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Hier können Sie persönliche Notizen hinterlegen (z.B. Gesundheitszustand, Ziele, etc.)"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          telefon: teilnehmerData.telefon || '',
                          adresse: teilnehmerData.adresse || '',
                          notizen: teilnehmerData.notizen || ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</h4>
                      <p className="text-gray-900 dark:text-white">{teilnehmerData.name || 'Nicht angegeben'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">E-Mail</h4>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-gray-900 dark:text-white">{teilnehmerData.email || 'Nicht angegeben'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Telefon</h4>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-gray-900 dark:text-white">{teilnehmerData.telefon || 'Nicht angegeben'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Registriert seit</h4>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-gray-900 dark:text-white">
                          {teilnehmerData.created_at ? formatiereDatum(teilnehmerData.created_at) : 'Unbekannt'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Adresse</h4>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-1" />
                      <p className="text-gray-900 dark:text-white whitespace-pre-line">
                        {teilnehmerData.adresse || 'Nicht angegeben'}
                      </p>
                    </div>
                  </div>
                  
                  {teilnehmerData.notizen && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Persönliche Notizen</h4>
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 text-gray-400 mr-1 mt-1" />
                        <p className="text-gray-900 dark:text-white whitespace-pre-line">
                          {teilnehmerData.notizen}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-gray-400 mr-1" />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teilnehmerData.aktiv 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {teilnehmerData.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Datenschutz-Hinweis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Datenschutz-Hinweis</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Ihre persönlichen Daten werden gemäß unserer Datenschutzrichtlinie behandelt. Sie können jederzeit 
                Auskunft über Ihre gespeicherten Daten verlangen oder deren Löschung beantragen. Bitte kontaktieren 
                Sie dazu einen Administrator.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {new Date().getFullYear()} Reha-Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

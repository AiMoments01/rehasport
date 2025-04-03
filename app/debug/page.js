'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function DebugPage() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teilnehmer');
  const [registerStatus, setRegisterStatus] = useState(null);
  const [loginStatus, setLoginStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Supabase-Verbindungstest
  const testConnection = async () => {
    setLoading(true);
    try {
      // Einfacher Test: Hole die Supabase-Systemzeit
      const { data, error } = await supabase.rpc('get_current_timestamp');
      
      if (error) {
        throw error;
      }
      
      setTestResult({
        success: true,
        message: `Verbindung erfolgreich! Server-Zeit: ${data}`,
        data
      });
    } catch (error) {
      console.error('Verbindungsfehler:', error);
      setTestResult({
        success: false,
        message: `Fehler bei der Verbindung: ${error.message}`,
        error
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer registrieren
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterStatus('Registrierung läuft...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      setRegisterStatus(`Registrierung erfolgreich! Bestätigungsmail wurde an ${email} gesendet.`);
    } catch (error) {
      console.error('Registrierungsfehler:', error);
      setRegisterStatus(`Fehler bei der Registrierung: ${error.message}`);
    }
  };

  // Benutzer anmelden
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus('Anmeldung läuft...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      setLoginStatus('Anmeldung erfolgreich!');
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Anmeldefehler:', error);
      setLoginStatus(`Fehler bei der Anmeldung: ${error.message}`);
    }
  };

  // Benutzer abmelden
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setLoginStatus('Abgemeldet');
    } catch (error) {
      console.error('Abmeldefehler:', error);
      setLoginStatus(`Fehler bei der Abmeldung: ${error.message}`);
    }
  };

  // Aktuellen Benutzer prüfen
  const checkCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        setCurrentUser(data.session.user);
        setLoginStatus('Angemeldet');
      } else {
        setCurrentUser(null);
        setLoginStatus('Nicht angemeldet');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Benutzers:', error);
      setLoginStatus(`Fehler: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Supabase Debug-Seite</h1>
        
        {/* Verbindungstest */}
        <div className="mb-8 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Verbindungstest</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Teste...' : 'Verbindung testen'}
          </button>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded-md ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
        
        {/* Benutzerbereich */}
        <div className="mb-8 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Benutzer</h2>
          
          <div className="mb-4">
            <button
              onClick={checkCurrentUser}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Aktuellen Benutzer prüfen
            </button>
          </div>
          
          {currentUser ? (
            <div className="mb-6 p-3 bg-blue-50 rounded-md">
              <p className="font-medium">Angemeldet als: {currentUser.email}</p>
              <p>Rolle: {currentUser.user_metadata?.role || 'Keine Rolle'}</p>
              <p>ID: {currentUser.id}</p>
              <button
                onClick={handleLogout}
                className="mt-3 bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700"
              >
                Abmelden
              </button>
            </div>
          ) : (
            <div className="mb-6 p-3 bg-yellow-50 rounded-md">
              <p>Kein Benutzer angemeldet</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registrierungsformular */}
            <div>
              <h3 className="text-lg font-medium mb-3">Neuen Benutzer registrieren</h3>
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passwort</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rolle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="teilnehmer">Teilnehmer</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Registrieren
                </button>
              </form>
              {registerStatus && (
                <div className="mt-3 p-2 text-sm bg-gray-50 rounded-md">
                  {registerStatus}
                </div>
              )}
            </div>
            
            {/* Anmeldeformular */}
            <div>
              <h3 className="text-lg font-medium mb-3">Anmelden</h3>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passwort</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Anmelden
                </button>
              </form>
              {loginStatus && (
                <div className="mt-3 p-2 text-sm bg-gray-50 rounded-md">
                  {loginStatus}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-8 pt-4 border-t">
          <h2 className="text-lg font-semibold mb-3">Navigation</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Startseite
            </Link>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-blue-600 hover:underline">
              Registrieren
            </Link>
            <Link href="/test" className="text-blue-600 hover:underline">
              Test-Seite
            </Link>
            <Link href="/login-test" className="text-blue-600 hover:underline">
              Login-Test
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

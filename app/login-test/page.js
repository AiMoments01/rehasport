'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function LoginTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [user, setUser] = useState(null);

  // Beim Laden prüfen, ob ein Benutzer angemeldet ist
  useState(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
        setStatus('Angemeldet');
      } else {
        setStatus('Nicht angemeldet');
      }
    }
    checkUser();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('Anmeldung läuft...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setUser(data.user);
      setStatus('Angemeldet');
    } catch (error) {
      setStatus(`Fehler: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    setStatus('Abmeldung läuft...');
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setStatus('Abgemeldet');
    } catch (error) {
      setStatus(`Fehler beim Abmelden: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Login-Test</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <p className="font-medium">Status: {status || 'Wird geladen...'}</p>
          {user && (
            <div className="mt-2">
              <p>E-Mail: {user.email}</p>
              <p>Rolle: {user.user_metadata?.role || 'Keine Rolle'}</p>
            </div>
          )}
        </div>
        
        {!user ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Anmelden
            </button>
          </form>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Abmelden
          </button>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex space-x-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Startseite
            </Link>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <Link href="/test" className="text-blue-600 hover:underline">
              Test-Seite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

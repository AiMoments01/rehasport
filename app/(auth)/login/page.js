'use client';

import { useState } from 'react';
// Stelle sicher, dass dieser Import den korrekten Client-Komponenten-Client bereitstellt
import { supabase } from '../../../lib/supabaseClient'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Ungültige E-Mail oder Passwort.');
        } else {
          setError(`Login fehlgeschlagen: ${error.message}`);
        }
        setLoading(false);
        return; 
      }

      if (data?.user) {
          window.location.reload(); 

      } else {
          setError('Login fehlgeschlagen. Unerwartete Antwort vom Server.');
          setLoading(false);
      }

    } catch (err) {
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${err.message}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Anmelden
        </h2>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Noch kein Konto?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

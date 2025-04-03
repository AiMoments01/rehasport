'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teilnehmer'); // Standard-Rolle
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Registrierung mit Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role, // Speichern der Rolle in den Benutzermetadaten
          },
        },
      });

      if (error) {
        throw error;
      }

      // Erfolgreiche Registrierung
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError(error.message || 'Ein Fehler ist bei der Registrierung aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Registrieren
        </h2>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleRegister}>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Rolle
            </label>
            <div className="mt-1">
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="teilnehmer">Teilnehmer</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Wird registriert...' : 'Registrieren'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Bereits registriert?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

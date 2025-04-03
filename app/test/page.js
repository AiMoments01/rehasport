'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function TestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setUser(data.session?.user || null);
      } catch (err) {
        console.error('Fehler beim Abrufen der Session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    getSession();
    
    // Listener für Authentifizierungsänderungen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Authentifizierungs-Test</h1>
        
        {loading ? (
          <p>Lade Benutzerdaten...</p>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">Fehler: {error}</p>
          </div>
        ) : user ? (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-green-700">
              Angemeldet als: <span className="font-medium">{user.email}</span>
            </p>
            <p className="text-green-700">
              Benutzer-ID: <span className="font-medium">{user.id}</span>
            </p>
            <p className="text-green-700">
              Rolle: <span className="font-medium">{user.user_metadata?.role || 'Keine Rolle'}</span>
            </p>
            <div className="mt-4">
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    setUser(null);
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Abmelden
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-md mb-6">
            <p className="text-yellow-700">Sie sind nicht angemeldet.</p>
            <div className="mt-4">
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Zum Login
              </Link>
            </div>
          </div>
        )}
        
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Navigation</h2>
          <div className="flex space-x-4">
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
          </div>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Debug-Informationen</h2>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto">
            <pre className="text-xs">
              {user ? JSON.stringify(user, null, 2) : 'Kein Benutzer angemeldet'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

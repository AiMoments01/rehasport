'use client';

import { useState } from 'react';

export default function FixProfilesPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fix-profiles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Fehler beim Überprüfen der Profile:', err);
      setError('Fehler beim Überprüfen der Profile');
    } finally {
      setLoading(false);
    }
  };

  const fixProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fix-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Fehler beim Reparieren der Profile:', err);
      setError('Fehler beim Reparieren der Profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile-Reparatur</h1>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={checkProfiles}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Profile überprüfen
        </button>
        
        <button 
          onClick={fixProfiles}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Profile reparieren
        </button>
      </div>
      
      {loading && <p className="text-gray-600">Lädt...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Ergebnis:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

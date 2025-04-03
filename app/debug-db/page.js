'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugDbPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teilnehmer, setTeilnehmer] = useState([]);
  const [kurse, setKurse] = useState([]);
  const [dbInfo, setDbInfo] = useState({});

  useEffect(() => {
    async function checkDatabase() {
      try {
        setLoading(true);
        
        // Direkten Supabase-Client erstellen
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Teilnehmer abrufen
        const { data: teilnehmerData, error: teilnehmerError } = await supabase
          .from('teilnehmer')
          .select('*')
          .limit(10);
          
        if (teilnehmerError) {
          console.error('Teilnehmer-Fehler:', teilnehmerError);
          setError(`Teilnehmer-Fehler: ${teilnehmerError.message}`);
        } else {
          setTeilnehmer(teilnehmerData || []);
        }
        
        // Kurse abrufen
        const { data: kurseData, error: kurseError } = await supabase
          .from('kurse')
          .select('*')
          .limit(10);
          
        if (kurseError) {
          console.error('Kurse-Fehler:', kurseError);
          if (!error) {
            setError(`Kurse-Fehler: ${kurseError.message}`);
          }
        } else {
          setKurse(kurseData || []);
        }
        
        // Tabellen-Informationen abrufen
        const { data: tablesData, error: tablesError } = await supabase
          .rpc('get_tables_info')
          .select('*');
          
        if (tablesError) {
          console.log('Info: RPC get_tables_info nicht verfügbar. Das ist normal.');
        } else {
          setDbInfo(tablesData || {});
        }
        
      } catch (err) {
        console.error('Allgemeiner Fehler:', err);
        setError(`Allgemeiner Fehler: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    checkDatabase();
  }, []);

  if (loading) {
    return <div className="p-8">Lade Datenbank-Informationen...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Datenbank-Debug</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Fehler</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Teilnehmer ({teilnehmer.length})</h2>
          {teilnehmer.length > 0 ? (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {teilnehmer.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="p-2">{t.id.substring(0, 8)}...</td>
                    <td className="p-2">{t.vorname} {t.nachname}</td>
                    <td className="p-2">{t.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Keine Teilnehmer gefunden</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Kurse ({kurse.length})</h2>
          {kurse.length > 0 ? (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Max. Teilnehmer</th>
                </tr>
              </thead>
              <tbody>
                {kurse.map(k => (
                  <tr key={k.id} className="border-b">
                    <td className="p-2">{k.id.substring(0, 8)}...</td>
                    <td className="p-2">{k.name}</td>
                    <td className="p-2">{k.max_teilnehmer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Keine Kurse gefunden</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Umgebungsvariablen</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'nicht gesetzt'}<br />
          NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' : 'nicht gesetzt'}
        </pre>
      </div>
      
      <div className="mt-8">
        <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Zurück zum Dashboard
        </a>
      </div>
    </div>
  );
}

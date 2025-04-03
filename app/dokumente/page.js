'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getDocuments, getDocumentUrl, deleteDocument } from '../../lib/supabaseServer';
import { getAllTeilnehmer } from '../../lib/supabaseServer'; // Annahme: Funktion existiert
import UploadForm from '../../components/UploadForm';
import { Loader2, Filter, Trash2, Download, FileText, AlertTriangle, Search, Calendar, User } from 'lucide-react';

// Helper zum Formatieren des Datums
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      // Optional: Uhrzeit hinzufügen
      // hour: '2-digit',
      // minute: '2-digit',
    });
  } catch (e) {
    return 'Ungültig';
  }
};

// Helper für Dateigröße
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DOKUMENT_TYPEN = [
    'Verordnung', 
    'Bescheinigung', 
    'Anmeldung', 
    'Rechnung', 
    'Bericht', 
    'Sonstiges',
    'Generiert' // Hinzugefügt für PDFs
];

export default function DokumentePage() {
  const [documents, setDocuments] = useState([]);
  const [teilnehmerList, setTeilnehmerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeilnehmer, setLoadingTeilnehmer] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // ID des Dokuments, das gelöscht wird
  const [downloadingUrl, setDownloadingUrl] = useState({}); // { docId: url } oder { docId: 'loading' } oder { docId: 'error' }

  // Filter States
  const [filterTeilnehmer, setFilterTeilnehmer] = useState('');
  const [filterTyp, setFilterTyp] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Funktion zum Laden der Dokumente
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterTeilnehmer) filters.teilnehmerId = filterTeilnehmer;
      if (filterTyp) filters.dokumentTyp = filterTyp;
      if (filterStartDate) filters.startDate = filterStartDate;
      if (filterEndDate) filters.endDate = filterEndDate;

      const data = await getDocuments(filters);
      setDocuments(data);
    } catch (err) {
      console.error('Fehler beim Laden der Dokumente:', err);
      setError('Dokumente konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [filterTeilnehmer, filterTyp, filterStartDate, filterEndDate]);

  // Funktion zum Laden der Teilnehmerliste
  const loadTeilnehmer = useCallback(async () => {
    setLoadingTeilnehmer(true);
    try {
        // Annahme: getAllTeilnehmer gibt eine Liste von {id, vorname, nachname} zurück
        // Passe dies ggf. an deine Implementierung an.
        const teilnehmerData = await getAllTeilnehmer(); 
        setTeilnehmerList(teilnehmerData || []);
    } catch (err) {
        console.error('Fehler beim Laden der Teilnehmerliste:', err);
        setError('Teilnehmerliste konnte nicht geladen werden.'); // Zeige Fehler an
    } finally {
        setLoadingTeilnehmer(false);
    }
  }, []);

  // Initiales Laden von Dokumenten und Teilnehmern
  useEffect(() => {
    loadDocuments();
    loadTeilnehmer();
  }, [loadDocuments, loadTeilnehmer]); // Abhängigkeiten hinzugefügt

  // Callback für erfolgreichen Upload -> Liste neu laden
  const handleUploadSuccess = () => {
    loadDocuments(); // Lädt die Dokumentenliste neu
  };

  // Dokument löschen
  const handleDelete = async (docId, storagePath) => {
    if (!docId || !storagePath) return;
    if (!confirm(`Möchten Sie das Dokument "${documents.find(d => d.id === docId)?.dateiname || 'dieses Dokument'}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
        return;
    }
    
    setDeletingId(docId);
    setError(null);
    try {
      const result = await deleteDocument(docId, storagePath);
      if (result.success) {
        // Dokument aus der Liste entfernen
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
      } else {
        setError(result.error || 'Dokument konnte nicht gelöscht werden.');
      }
    } catch (err) {
      console.error('Client-Fehler beim Löschen:', err);
      setError('Ein Fehler ist beim Löschen aufgetreten.');
    } finally {
      setDeletingId(null);
    }
  };

  // Download/Anzeige-URL holen
  const handleDownload = async (docId, storagePath) => {
      if (!storagePath) return;
      setDownloadingUrl(prev => ({ ...prev, [docId]: 'loading' }));
      setError(null);
      try {
          const result = await getDocumentUrl(storagePath, 300); // 5 Minuten Gültigkeit
          if (result.data?.signedUrl) {
              setDownloadingUrl(prev => ({ ...prev, [docId]: result.data.signedUrl }));
              // URL in neuem Tab öffnen
              window.open(result.data.signedUrl, '_blank');
          } else {
              throw new Error(result.error || 'Signierte URL konnte nicht abgerufen werden.');
          }
      } catch (err) {
          console.error('Fehler beim Abrufen der Download-URL:', err);
          setDownloadingUrl(prev => ({ ...prev, [docId]: 'error' }));
          setError(err.message || 'Download-Link konnte nicht erstellt werden.');
      }
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dokumentenverwaltung</h1>

      {/* Fehleranzeige */} 
      {error && (
          <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3"/>
            <span className="font-medium">Fehler:</span> {error}
          </div>
      )}

      {/* Upload Formular */} 
      <div className="mb-8">
          {loadingTeilnehmer ? (
              <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
          ) : teilnehmerList.length > 0 ? (
             <UploadForm teilnehmerListe={teilnehmerList} onUploadSuccess={handleUploadSuccess} />
          ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">Keine Teilnehmer zum Hochladen gefunden. Bitte legen Sie zuerst Teilnehmer an.</p>
          )
          }
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Gespeicherte Dokumente</h2>
      
      {/* Filter */} 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          {/* Teilnehmer Filter */} 
          <div>
              <label htmlFor="filter-teilnehmer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teilnehmer</label>
              <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                      id="filter-teilnehmer"
                      value={filterTeilnehmer}
                      onChange={(e) => setFilterTeilnehmer(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                      <option value="">Alle Teilnehmer</option>
                      {teilnehmerList.map(tn => (
                          <option key={tn.id} value={tn.id}>{tn.vorname} {tn.nachname}</option>
                      ))}
                  </select>
              </div>
          </div>
          {/* Typ Filter */} 
          <div>
              <label htmlFor="filter-typ" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dokumenttyp</label>
              <div className="relative">
                 <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <select
                      id="filter-typ"
                      value={filterTyp}
                      onChange={(e) => setFilterTyp(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                      <option value="">Alle Typen</option>
                      {DOKUMENT_TYPEN.map(typ => (
                          <option key={typ} value={typ}>{typ}</option>
                      ))}
                  </select>
              </div>
          </div>
          {/* Datumsfilter (Start) */} 
          <div>
              <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hochgeladen ab</label>
               <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                      type="date" 
                      id="filter-start-date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      />
              </div>
          </div>
          {/* Datumsfilter (Ende) */} 
          <div>
              <label htmlFor="filter-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hochgeladen bis</label>
               <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                      type="date" 
                      id="filter-end-date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
              </div>
          </div>
          {/* Filter Anwenden Button (Optional, da Filterung bei Änderung erfolgt) */} 
          {/* 
          <div className="lg:col-span-4 flex justify-end items-end">
              <button onClick={loadDocuments} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                  Filter anwenden
              </button>
          </div> 
          */}
      </div>

      {/* Dokumenten Tabelle */} 
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dateiname</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teilnehmer</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Typ</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Größe</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hochgeladen am</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" /></td></tr>
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id} className={`${deletingId === doc.id ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs" title={doc.dateiname}>{doc.dateiname}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {doc.teilnehmer ? `${doc.teilnehmer.vorname} ${doc.teilnehmer.nachname}` : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{doc.dokument_typ}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(doc.uploaded_at)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                        onClick={() => handleDownload(doc.id, doc.storage_path)}
                        disabled={downloadingUrl[doc.id] === 'loading' || deletingId === doc.id}
                        className={`p-1 rounded ${downloadingUrl[doc.id] === 'error' ? 'text-red-500' : 'text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={downloadingUrl[doc.id] === 'error' ? 'Fehler beim Laden' : 'Herunterladen/Anzeigen'}
                    >
                      {downloadingUrl[doc.id] === 'loading' ? 
                        <Loader2 className="h-4 w-4 animate-spin" /> : 
                        downloadingUrl[doc.id] === 'error' ? 
                        <AlertTriangle className="h-4 w-4" /> : 
                        <Download className="h-4 w-4"/>
                      }
                    </button>
                    <button 
                        onClick={() => handleDelete(doc.id, doc.storage_path)}
                        disabled={deletingId === doc.id || downloadingUrl[doc.id] === 'loading'}
                        className="p-1 rounded text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Löschen"
                    >
                       {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4"/>}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-300">Keine Dokumente gefunden{filterTeilnehmer || filterTyp || filterStartDate || filterEndDate ? ' für die aktuelle Filterung' : ''}.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

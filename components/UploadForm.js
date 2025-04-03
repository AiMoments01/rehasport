'use client';

import React, { useState } from 'react';
import { uploadDocument, saveDocumentMetadata } from '../lib/supabaseServer';
import { Loader2, UploadCloud, AlertTriangle, CheckCircle } from 'lucide-react';

const DOKUMENT_TYPEN = [
    'Verordnung', 
    'Bescheinigung', 
    'Anmeldung', 
    'Rechnung', 
    'Bericht', 
    'Sonstiges'
];

export default function UploadForm({ teilnehmerListe, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTeilnehmerId, setSelectedTeilnehmerId] = useState('');
  const [selectedTyp, setSelectedTyp] = useState(DOKUMENT_TYPEN[0]); // Default zum ersten Typ
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileChange = (event) => {
    setError(null);
    setSuccessMessage(null);
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !selectedTeilnehmerId || !selectedTyp) {
      setError('Bitte wählen Sie eine Datei, einen Teilnehmer und einen Dokumenttyp aus.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Datei hochladen
      const uploadResult = await uploadDocument(selectedFile, selectedTeilnehmerId);
      if (uploadResult.error || !uploadResult.data?.path) {
        throw new Error(uploadResult.error || 'Upload fehlgeschlagen, kein Pfad zurückgegeben.');
      }
      
      const storagePath = uploadResult.data.path;
      console.log('Datei hochgeladen, Pfad:', storagePath);

      // 2. Metadaten speichern
      const metadata = {
        teilnehmer_id: selectedTeilnehmerId,
        dokument_typ: selectedTyp,
        dateiname: selectedFile.name,
        storage_path: storagePath,
        mime_type: selectedFile.type,
        file_size: selectedFile.size,
      };
      
      const saveResult = await saveDocumentMetadata(metadata);
      if (!saveResult.success) {
          // Versuch, die gerade hochgeladene Datei wieder zu löschen, wenn Metadaten-Speichern fehlschlägt
          console.warn('Metadaten konnten nicht gespeichert werden, versuche Upload rückgängig zu machen...');
          await supabase.storage.from('teilnehmer-dokumente').remove([storagePath]);
          throw new Error(saveResult.error || 'Metadaten konnten nicht gespeichert werden.');
      }

      console.log('Metadaten gespeichert:', saveResult.data);
      setSuccessMessage(`Dokument "${selectedFile.name}" erfolgreich hochgeladen!`);
      
      // Reset Form
      setSelectedFile(null);
      setSelectedTeilnehmerId('');
      setSelectedTyp(DOKUMENT_TYPEN[0]);
      // Informiere die Elternkomponente (z.B. zum Neuladen der Liste)
      if (onUploadSuccess) {
        onUploadSuccess(saveResult.data); 
      }

    } catch (err) {
      console.error('Fehler beim Hochladen des Dokuments:', err);
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
      // Reset file input visually (may need more robust solution across browsers)
      const fileInput = document.getElementById('file-upload-input');
      if(fileInput) fileInput.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Neues Dokument hochladen</h3>

      {/* Teilnehmer Auswahl */} 
      <div>
        <label htmlFor="teilnehmer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teilnehmer</label>
        <select
          id="teilnehmer"
          name="teilnehmer"
          value={selectedTeilnehmerId}
          onChange={(e) => {
              setError(null);
              setSuccessMessage(null);
              setSelectedTeilnehmerId(e.target.value);
          }}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-offset-gray-800"
        >
          <option value="" disabled>Bitte Teilnehmer wählen...</option>
          {teilnehmerListe && teilnehmerListe.length > 0 ? (
            teilnehmerListe.map((tn) => (
              <option key={tn.id} value={tn.id}>
                {tn.vorname} {tn.nachname}
              </option>
            ))
          ) : (
            <option value="" disabled>Keine Teilnehmer gefunden</option>
          )}
        </select>
      </div>

      {/* Dokumenttyp Auswahl */} 
      <div>
        <label htmlFor="dokumentTyp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dokumenttyp</label>
        <select
          id="dokumentTyp"
          name="dokumentTyp"
          value={selectedTyp}
          onChange={(e) => {
              setError(null);
              setSuccessMessage(null);
              setSelectedTyp(e.target.value);
          }}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-offset-gray-800"
        >
          {DOKUMENT_TYPEN.map((typ) => (
            <option key={typ} value={typ}>{typ}</option>
          ))}
        </select>
      </div>

      {/* Datei Auswahl */} 
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Datei</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400"/>
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor="file-upload-input"
                className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus-within:ring-offset-gray-800"
              >
                <span>Datei auswählen</span>
                <input id="file-upload-input" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} required />
              </label>
              <p className="pl-1">oder hierher ziehen</p> {/* Drag & Drop nicht implementiert */} 
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedFile ? selectedFile.name : 'PDF, JPG, PNG, DOCX etc. bis 10MB'} {/* TODO: Max size handling */}
            </p>
          </div>
        </div>
      </div>

      {/* Fehler- und Erfolgsanzeige */} 
      {error && (
          <div className="flex items-center p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-2"/>
            <span className="font-medium">Fehler:</span> {error}
          </div>
      )}
       {successMessage && (
          <div className="flex items-center p-3 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
            <CheckCircle className="flex-shrink-0 inline w-4 h-4 mr-2"/>
            <span className="font-medium">Erfolg:</span> {successMessage}
          </div>
      )}

      {/* Submit Button */} 
      <div>
        <button
          type="submit"
          disabled={isLoading || !selectedFile || !selectedTeilnehmerId}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <><Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Wird hochgeladen...</>
          ) : (
            'Dokument speichern'
          )}
        </button>
      </div>
    </form>
  );
}

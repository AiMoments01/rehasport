'use client';

import React, { useState, useEffect } from 'react';
import { Save, Calendar, User, Users, BookOpen, CheckCircle, Type } from 'lucide-react';

export default function KursForm({ initialData, trainerList, onSubmit, saving, error }) {
  const [formData, setFormData] = useState({
    name: '',
    beschreibung: '',
    max_teilnehmer: '10', // Standardwert
    start_datum: '',
    end_datum: '',
    aktiv: true,
    trainer_id: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        beschreibung: initialData.beschreibung || '',
        max_teilnehmer: initialData.max_teilnehmer || '10',
        // Formatiere Datum für datetime-local Input
        start_datum: initialData.start_datum ? new Date(new Date(initialData.start_datum).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        end_datum: initialData.end_datum ? new Date(new Date(initialData.end_datum).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        aktiv: initialData.aktiv !== false, // Standard ist true
        trainer_id: initialData.trainer_id || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
      e.preventDefault();
      // Konvertiere max_teilnehmer zu Zahl
      const dataToSubmit = {
          ...formData,
          max_teilnehmer: parseInt(formData.max_teilnehmer, 10) || 0, // Zu Zahl konvertieren
          // Optional: Datum zurück in ISO oder Timestamp konvertieren, falls Server es so erwartet
          // start_datum: formData.start_datum ? new Date(formData.start_datum).toISOString() : null,
          // end_datum: formData.end_datum ? new Date(formData.end_datum).toISOString() : null,
      };
      onSubmit(dataToSubmit);
  };

  // Hilfsfunktion zum Formatieren von Trainer-Namen
  const formatTrainerName = (trainer) => {
      if (!trainer) return 'N/A';
      return `${trainer.nachname}, ${trainer.vorname}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-700" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{typeof error === 'string' ? error : 'Ein Fehler ist aufgetreten.'}</span>
        </div>
      )}
      
      {/* Kursname */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <Type className="h-4 w-4 mr-1"/> Kursname *
        </label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="mt-1 input-field" />
      </div>
      
      {/* Beschreibung */}
      <div>
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <BookOpen className="h-4 w-4 mr-1"/> Beschreibung
        </label>
        <textarea name="beschreibung" id="beschreibung" rows="3" value={formData.beschreibung} onChange={handleInputChange} className="mt-1 input-field"></textarea>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Datum & Zeit */}
        <div>
          <label htmlFor="start_datum" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Calendar className="h-4 w-4 mr-1"/> Start *
          </label>
          <input type="datetime-local" name="start_datum" id="start_datum" value={formData.start_datum} onChange={handleInputChange} required className="mt-1 input-field" />
        </div>
        
        {/* End Datum & Zeit */}
        <div>
          <label htmlFor="end_datum" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Calendar className="h-4 w-4 mr-1"/> Ende
          </label>
          <input type="datetime-local" name="end_datum" id="end_datum" value={formData.end_datum} onChange={handleInputChange} className="mt-1 input-field" />
        </div>
        
        {/* Max Teilnehmer */}
        <div>
          <label htmlFor="max_teilnehmer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Users className="h-4 w-4 mr-1"/> Max. Teilnehmer *
          </label>
          <input type="number" name="max_teilnehmer" id="max_teilnehmer" min="1" value={formData.max_teilnehmer} onChange={handleInputChange} required className="mt-1 input-field" />
        </div>
        
        {/* Trainer Zuweisung */}
        <div>
          <label htmlFor="trainer_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <User className="h-4 w-4 mr-1"/> Zugewiesener Trainer
          </label>
          <select name="trainer_id" id="trainer_id" value={formData.trainer_id || ''} onChange={handleInputChange} className="mt-1 input-field">
            <option value="">Kein Trainer</option>
            {trainerList && trainerList.map(trainer => (
              <option key={trainer.id} value={trainer.id}>{formatTrainerName(trainer)}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Aktiv Checkbox */}
      <div className="flex items-center">
        <input type="checkbox" name="aktiv" id="aktiv" checked={formData.aktiv} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600" />
        <label htmlFor="aktiv" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1"/> Kurs ist aktiv
        </label>
      </div>
      
      {/* Speicher-Button */}
      <div className="flex justify-end pt-4">
        <button type="submit" disabled={saving} className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {saving ? 'Speichert...' : (initialData ? 'Änderungen speichern' : 'Kurs erstellen')}
          <Save className="ml-2 h-5 w-5" />
        </button>
      </div>
       {/* Style für die Input Felder (kopiert aus NeuerTeilnehmerPage) */}
      <style jsx>{`
        .input-field {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
          background-color: #ffffff; /* white */
          color: #111827; /* gray-900 */
        }
        .dark .input-field {
          background-color: #374151; /* gray-700 */
          border-color: #4b5563; /* gray-600 */
          color: #ffffff; /* white */
        }
        .input-field:focus {
          outline: none;
          border-color: #4f46e5; /* indigo-500 */
          box-shadow: 0 0 0 1px #4f46e5; /* ring-1 ring-indigo-500 */
        }
        .btn-primary {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem 1rem;
          border: 1px solid transparent;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem; /* text-sm */
          font-weight: 500; /* font-medium */
          border-radius: 0.375rem; /* rounded-md */
          color: #ffffff; /* text-white */
          background-color: #4f46e5; /* bg-indigo-600 */
        }
        .btn-primary:hover {
          background-color: #4338ca; /* hover:bg-indigo-700 */
        }
        .btn-primary:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(199, 210, 254, 1); /* focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 */
        }
      `}</style>
    </form>
  );
}

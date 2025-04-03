'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createLead } from '../lib/supabaseServer'; // Importiere die Server Action
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// Definiere die möglichen Interessen und Quellen
const interestOptions = [
  'Rehasport',
  'Rückenschule',
  'Präventionskurs',
  'Funktionstraining',
  'Sonstiges',
];
const sourceOptions = ['Google', 'Flyer', 'Empfehlung', 'Arzt', 'Website', 'Sonstiges'];

export default function LeadForm() {
  const {
    register,
    handleSubmit,
    reset, // Zum Zurücksetzen des Formulars
    formState: { errors, isSubmitting },
  } = useForm();

  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' }); // null | 'success' | 'error'

  const onSubmit = async (formData) => {
    setSubmitStatus({ type: null, message: '' }); // Reset status on new submission
    try {
      const result = await createLead(formData);
      if (result.success) {
        setSubmitStatus({ type: 'success', message: 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.' });
        reset(); // Setze das Formular zurück
      } else {
        setSubmitStatus({ type: 'error', message: result.error || 'Ein unerwarteter Fehler ist aufgetreten.' });
      }
    } catch (error) {
      console.error('Client-Fehler beim Senden des Formulars:', error);
      setSubmitStatus({ type: 'error', message: 'Formular konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Kontaktanfrage / Interesse</h2>

      {/* Erfolgsmeldung */} 
      {submitStatus.type === 'success' && (
        <div className="flex items-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
          <CheckCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
          <span className="font-medium">Erfolg!</span> {submitStatus.message}
        </div>
      )}

      {/* Fehlermeldung */} 
      {submitStatus.type === 'error' && (
        <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3"/>
          <span className="font-medium">Fehler!</span> {submitStatus.message}
        </div>
      )}

      {/* Name */} 
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input
          id="name"
          type="text"
          {...register('name', { required: 'Name ist erforderlich' })}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
          aria-invalid={errors.name ? "true" : "false"}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
      </div>

      {/* E-Mail */} 
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail</label>
        <input
          id="email"
          type="email"
          {...register('email', { 
             required: 'E-Mail ist erforderlich', 
             pattern: { value: /^\S+@\S+$/i, message: 'Ungültiges E-Mail-Format' } 
          })}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
      </div>

      {/* Interesse */} 
      <div>
        <label htmlFor="interest" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interesse</label>
        <select
          id="interest"
          {...register('interest', { required: 'Interesse ist erforderlich' })}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.interest ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
          aria-invalid={errors.interest ? "true" : "false"}
        >
          <option value="">Bitte wählen...</option>
          {interestOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {errors.interest && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.interest.message}</p>}
      </div>

      {/* Quelle (Optional) */} 
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wie sind Sie auf uns aufmerksam geworden? (Optional)</label>
        <select
          id="source"
          {...register('source')} // Keine Validierung, da optional
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Bitte wählen...</option>
          {sourceOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Submit Button */} 
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Senden...</>
          ) : (
            'Anfrage senden'
          )}
        </button>
      </div>
    </form>
  );
}

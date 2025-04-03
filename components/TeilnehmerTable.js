import React from 'react';
import { ChevronRight, User, Mail, Calendar, CheckCircle, XCircle, Euro, BookOpen } from 'lucide-react';

const TeilnehmerTable = ({ teilnehmer, kurse, onTeilnehmerClick, loading }) => {
  // Funktion zum Abrufen des Kursnamens anhand der ID
  const getKursName = (kursId) => {
    if (!kursId) return '-';
    const kurs = kurse?.find(k => k.id === kursId);
    return kurs ? kurs.name : '-';
  };

  // Funktion zum Formatieren von Währungsbeträgen
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (!teilnehmer?.length) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">Keine Teilnehmer gefunden.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              E-Mail
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Kurs
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Kosten
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span className="sr-only">Aktionen</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {teilnehmer.map((teilnehmer) => (
            <tr 
              key={teilnehmer.id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onTeilnehmerClick(teilnehmer.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {teilnehmer.vorname} {teilnehmer.nachname}
                    </div>
                    {teilnehmer.geburtsdatum && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(teilnehmer.geburtsdatum).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900 dark:text-white">
                  <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  {teilnehmer.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  teilnehmer.aktiv 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {teilnehmer.aktiv ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {teilnehmer.aktiv ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900 dark:text-white">
                  <BookOpen className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                  {teilnehmer.kursname || getKursName(teilnehmer.kurs_id)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                  <Euro className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                  {formatCurrency(teilnehmer.kosten)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end">
                  <div className="bg-blue-50 dark:bg-blue-900 p-1 rounded-full">
                    <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeilnehmerTable;

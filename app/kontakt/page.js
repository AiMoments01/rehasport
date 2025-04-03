import React from 'react';
import LeadForm from '../../components/LeadForm';

export const metadata = {
  title: 'Kontakt & Interesse | Reha App',
  description: 'Stellen Sie eine Kontaktanfrage oder bekunden Sie Ihr Interesse an unseren Kursen.',
};

export default function KontaktPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">Kontakt & Interesse</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Haben Sie Fragen oder möchten Sie Interesse an einem unserer Angebote bekunden? 
          Füllen Sie bitte das folgende Formular aus. Wir melden uns in Kürze bei Ihnen!
        </p>

        <LeadForm />

        {/* Optional: Weitere Kontaktinformationen */}
        {/* 
        <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
          <h2 className="text-xl font-semibold mb-2">Weitere Kontaktmöglichkeiten</h2>
          <p>Telefon: 0123 / 456 789</p>
          <p>E-Mail: info@reha-app.de</p>
          <p>Adresse: Musterstraße 1, 12345 Musterstadt</p>
        </div>
        */}
      </div>
    </div>
  );
}

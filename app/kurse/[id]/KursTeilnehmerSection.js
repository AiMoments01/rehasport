'use client';

import KursTeilnehmerManagement from '../../../components/KursTeilnehmerManagement';

export default function KursTeilnehmerSection({ kursId, maxTeilnehmer }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700">Teilnehmer</h2>
      <KursTeilnehmerManagement kursId={kursId} maxTeilnehmer={maxTeilnehmer} />
      
      {/* Style für Buttons */}
      <style jsx global>{`
        .btn-secondary {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db; /* gray-300 */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem; /* text-sm */
          font-weight: 500; /* font-medium */
          border-radius: 0.375rem; /* rounded-md */
          color: #374151; /* text-gray-700 */
          background-color: #ffffff; /* bg-white */
        }
        .dark .btn-secondary {
           background-color: #4b5563; /* dark:bg-gray-600 */
           color: #e5e7eb; /* dark:text-gray-200 */
           border-color: #6b7280; /* dark:border-gray-500 */
        }
        .btn-secondary:hover {
          background-color: #f9fafb; /* hover:bg-gray-50 */
        }
        .dark .btn-secondary:hover {
          background-color: #374151; /* dark:hover:bg-gray-700 */
        }
        .btn-secondary:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(199, 210, 254, 1); /* focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 */
        }
      `}</style>
    </div>
  );
}

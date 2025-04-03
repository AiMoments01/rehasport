import React from 'react';
import KursKalender from '../../components/KursKalender'; 

export default function KalenderPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kurskalender</h1>
       
      {/* Binde die Kalenderkomponente ein */}
      {/* Verwende einen Container mit etwas mehr Padding und definiere die Höhe hier */}
      <div className="h-[calc(100vh-10rem)]"> {/* Höhe anpassen, z.B. 100% Viewport-Höhe minus Header/Padding */} 
        <KursKalender />
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAllLeads, updateLeadStatus } from '../../../lib/supabaseServer';
import { Loader2, Filter, Search, Edit, CheckSquare, Mail, Users, X } from 'lucide-react';

// Mögliche Status-Optionen für Filter und Bearbeitung
const statusOptions = ['neu', 'kontaktiert', 'angebot gesendet', 'angemeldet', 'abgelehnt'];

// Helper zum Formatieren des Datums
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'Ungültig';
  }
};

export default function LeadManagementPage() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' bedeutet alle Status
  const [editingStatus, setEditingStatus] = useState({}); // Speichert { leadId: currentStatus }
  const [updatingStatus, setUpdatingStatus] = useState(null); // Speichert leadId des Leads, der gerade aktualisiert wird

  // Lade Leads beim Mounten
  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllLeads();
        setLeads(data);
      } catch (err) {
        console.error('Fehler beim Laden der Leads:', err);
        setError('Leads konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  // Filter und Suche anwenden, wenn sich Leads, Suchbegriff oder Filter ändern
  useEffect(() => {
    let tempLeads = [...leads];

    // Nach Status filtern
    if (statusFilter) {
      tempLeads = tempLeads.filter(lead => lead.status === statusFilter);
    }

    // Nach Name oder E-Mail suchen (case-insensitive)
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      tempLeads = tempLeads.filter(lead =>
        lead.name.toLowerCase().includes(lowerCaseSearch) ||
        lead.email.toLowerCase().includes(lowerCaseSearch)
      );
    }

    setFilteredLeads(tempLeads);
  }, [leads, searchTerm, statusFilter]);

  // Statusänderung starten
  const handleEditStatus = (leadId, currentStatus) => {
    setEditingStatus(prev => ({ ...prev, [leadId]: currentStatus }));
  };

  // Statusänderung abbrechen
  const handleCancelEdit = (leadId) => {
    setEditingStatus(prev => {
        const newState = { ...prev };
        delete newState[leadId];
        return newState;
    });
  };

  // Status speichern
  const handleSaveStatus = async (leadId, newStatus) => {
    if (!newStatus || editingStatus[leadId] === newStatus) {
      handleCancelEdit(leadId); // Kein Update nötig, wenn Status gleich bleibt oder leer ist
      return;
    }
    
    setUpdatingStatus(leadId);
    setError(null);
    try {
      const result = await updateLeadStatus(leadId, newStatus);
      if (result.success) {
        // Update den Lead in der lokalen Liste
        setLeads(prevLeads => prevLeads.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
        handleCancelEdit(leadId); // Schließe den Edit-Mode
      } else {
        setError(result.error || 'Status konnte nicht aktualisiert werden.');
      }
    } catch (err) {
      console.error('Client-Fehler beim Status-Update:', err);
      setError('Ein Fehler ist beim Speichern aufgetreten.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Management</h1>

      {/* Fehleranzeige */} 
      {error && (
        <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3"/>
          <span className="font-medium">Fehler:</span> {error}
        </div>
      )}

      {/* Filter und Suche */} 
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Suche nach Name oder E-Mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Alle Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lead Tabelle */} 
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-Mail</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interesse</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quelle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Erstellt am</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{lead.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.interest}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.source || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(lead.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {editingStatus.hasOwnProperty(lead.id) ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editingStatus[lead.id]}
                          onChange={(e) => setEditingStatus(prev => ({ ...prev, [lead.id]: e.target.value }))}
                          disabled={updatingStatus === lead.id}
                          className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                          ))}
                        </select>
                        <button 
                            onClick={() => handleSaveStatus(lead.id, editingStatus[lead.id])}
                            disabled={updatingStatus === lead.id}
                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                            {updatingStatus === lead.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckSquare className="h-4 w-4"/>}
                        </button>
                        <button 
                            onClick={() => handleCancelEdit(lead.id)}
                            disabled={updatingStatus === lead.id}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                      </div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!editingStatus.hasOwnProperty(lead.id) && (
                       <button onClick={() => handleEditStatus(lead.id, lead.status)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" title="Status ändern">
                         <Edit className="h-4 w-4"/>
                       </button>
                    )}
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200" title="E-Mail senden">
                       <Mail className="h-4 w-4"/>
                    </a>
                    {/* Button "In Teilnehmer umwandeln" kommt später */}
                     <button disabled className="text-gray-400 cursor-not-allowed" title="In Teilnehmer umwandeln (kommt bald)">
                       <Users className="h-4 w-4"/>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">Keine Leads gefunden{searchTerm || statusFilter ? ' für die aktuelle Filterung' : ''}.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

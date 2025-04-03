'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, Calendar, ClipboardList, FileText, MessageSquare } from 'lucide-react'; // Icons hinzufügen

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/teilnehmer', label: 'Teilnehmer', icon: Users },
  { href: '/kurse', label: 'Kurse', icon: BookOpen },
  { href: '/vertrieb/leads', label: 'Leads', icon: ClipboardList }, // Link zur Lead-Verwaltung
  { href: '/dokumente', label: 'Dokumente', icon: FileText }, // Link zur Dokumentenverwaltung
  { href: '/kalender', label: 'Kalender', icon: Calendar },
  { href: '/chat', label: 'Chat', icon: MessageSquare }, // Chat-Link hinzugefügt
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 h-screen bg-gray-100 dark:bg-gray-800 p-4 flex flex-col shadow-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Reha App</h1>
      </div>
      <ul className="space-y-2 flex-grow">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link 
                 href={item.href}
                 className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out 
                            ${isActive
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                              : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}
                           `}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-500 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Optional: Footer oder User-Info hier */}
      {/* <div className="mt-auto">
        <p className="text-xs text-gray-500 dark:text-gray-400"> 2025</p>
      </div> */}
    </nav>
  );
}

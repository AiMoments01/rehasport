'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  Heart, 
  Shield, 
  Mail,
  Lock,
  UserCircle,
  X
} from 'lucide-react';

// ClientOnly-Komponente zum Vermeiden von Hydration-Fehlern
function ClientOnly({ children }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  return children;
}

export default function LandingPage() {
  // Login-States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Popup-States
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  
  // Register-States
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [role, setRole] = useState('teilnehmer'); // Standard-Rolle
  const [registerError, setRegisterError] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsLoggedIn(true);
          // Automatisch zum Dashboard weiterleiten, wenn der Benutzer bereits angemeldet ist
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error("Fehler beim Prüfen der Session:", error);
      } finally {
        setSessionChecked(true);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Ungültige E-Mail oder Passwort.');
        } else {
          setError(`Login fehlgeschlagen: ${error.message}`);
        }
        return;
      }

      if (data?.user) {
        // Erfolgreiche Anmeldung - zur App weiterleiten
        console.log("Anmeldung erfolgreich, Weiterleitung zum Dashboard...");
        setShowLoginPopup(false);
        // Verwende replace statt push für eine vollständige Navigation
        window.location.href = '/dashboard';
      } else {
        setError('Login fehlgeschlagen. Unerwartete Antwort vom Server.');
      }
    } catch (err) {
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);

    try {
      // Registrierung mit Supabase
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            role: role, // Speichern der Rolle in den Benutzermetadaten
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Erfolgreiche Registrierung
        console.log("Registrierung erfolgreich, Weiterleitung zum Dashboard...");
        setShowRegisterPopup(false);
        // Verwende replace statt push für eine vollständige Navigation
        window.location.href = '/dashboard';
      } else {
        setRegisterError('Registrierung fehlgeschlagen. Unerwartete Antwort vom Server.');
      }
    } catch (error) {
      setRegisterError(error.message || 'Ein Fehler ist bei der Registrierung aufgetreten.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      window.location.reload();
    } catch (error) {
      console.error("Fehler beim Abmelden:", error);
    }
  };

  const goToApp = () => {
    if (isLoggedIn) {
      window.location.href = '/dashboard';
    } else {
      // Öffne Login-Popup
      setShowLoginPopup(true);
    }
  };

  const switchToRegister = () => {
    setShowLoginPopup(false);
    setShowRegisterPopup(true);
    setError(null);
  };

  const switchToLogin = () => {
    setShowRegisterPopup(false);
    setShowLoginPopup(true);
    setRegisterError(null);
  };

  const features = [
    {
      icon: <Users className="h-10 w-10 text-blue-500" />,
      title: "Teilnehmerverwaltung",
      description: "Verwalten Sie alle Teilnehmer übersichtlich und effizient. Behalten Sie den Überblick über Kontaktdaten, Kurszuweisungen und Fortschritte."
    },
    {
      icon: <Calendar className="h-10 w-10 text-green-500" />,
      title: "Kursplanung",
      description: "Planen Sie Kurse und Termine mit wenigen Klicks. Vermeiden Sie Überschneidungen und optimieren Sie die Ressourcennutzung."
    },
    {
      icon: <Dumbbell className="h-10 w-10 text-purple-500" />,
      title: "Fortschrittsanalyse",
      description: "Verfolgen Sie die Entwicklung Ihrer Teilnehmer mit detaillierten Auswertungen und visualisierten Daten für fundierte Entscheidungen."
    },
    {
      icon: <Shield className="h-10 w-10 text-red-500" />,
      title: "Datensicherheit",
      description: "Ihre Daten sind bei uns sicher. Wir verwenden modernste Verschlüsselungstechnologien und befolgen strenge Datenschutzrichtlinien."
    },
    {
      icon: <Heart className="h-10 w-10 text-yellow-500" />,
      title: "Zeitersparnis",
      description: "Reduzieren Sie administrativen Aufwand um bis zu 70% durch automatisierte Prozesse und intuitive Benutzeroberfläche."
    },
    {
      icon: <Mail className="h-10 w-10 text-teal-500" />,
      title: "Qualitätssicherung",
      description: "Verbessern Sie die Qualität Ihrer Reha-Maßnahmen durch kontinuierliche Datenerfassung und -auswertung."
    }
  ];

  const testimonials = [
    {
      quote: "Die Reha-Management-Software hat unsere Verwaltungsprozesse revolutioniert. Wir sparen täglich wertvolle Zeit und können uns mehr auf unsere Patienten konzentrieren.",
      author: "Dr. Martina Weber",
      position: "Leiterin Reha-Zentrum München"
    },
    {
      quote: "Seit wir diese Software nutzen, haben wir unsere Kursauslastung um 30% verbessert und die Zufriedenheit unserer Teilnehmer deutlich gesteigert.",
      author: "Thomas Müller",
      position: "Geschäftsführer Physio & Reha GmbH"
    }
  ];

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
        {/* Header mit Login/Abmelden-Button */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Reha-Management</h1>
              </div>
              <div className="flex space-x-3">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Danger Zone Abmelden
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowLoginPopup(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Anmelden
                    </button>
                    <button
                      onClick={() => setShowRegisterPopup(true)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Registrieren
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Login Popup */}
        {showLoginPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowLoginPopup(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Anmelden</h2>
                <p className="text-gray-600">
                  Melden Sie sich an, um auf Ihr Dashboard zuzugreifen
                </p>
              </div>
              
              {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="name@beispiel.de"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Wird angemeldet...' : 'Anmelden'}
                  </button>
                </div>
                
                <div className="mt-4 text-center text-sm">
                  <p className="text-gray-600">
                    Noch kein Konto?{' '}
                    <button 
                      type="button"
                      onClick={switchToRegister}
                      className="text-blue-600 font-medium hover:text-blue-500"
                    >
                      Registrieren
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Register Popup */}
        {showRegisterPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowRegisterPopup(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registrieren</h2>
                <p className="text-gray-600">
                  Erstellen Sie ein neues Konto
                </p>
              </div>
              
              {registerError && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md text-sm">
                  {registerError}
                </div>
              )}
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="registerEmail"
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="name@beispiel.de"
                  />
                </div>
                
                <div>
                  <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <input
                    id="registerPassword"
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Rolle
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="teilnehmer">Teilnehmer</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition duration-300 disabled:opacity-50"
                  >
                    {registerLoading ? 'Wird registriert...' : 'Registrieren'}
                  </button>
                </div>
                
                <div className="mt-4 text-center text-sm">
                  <p className="text-gray-600">
                    Bereits registriert?{' '}
                    <button 
                      type="button"
                      onClick={switchToLogin}
                      className="text-blue-600 font-medium hover:text-blue-500"
                    >
                      Anmelden
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-20 md:py-28">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Professionelles Reha-Management leicht gemacht
                </h1>
                <p className="text-xl md:text-2xl mb-10 text-blue-100">
                  Optimieren Sie Ihre Reha-Einrichtung mit unserer umfassenden Management-Lösung
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={goToApp}
                    className="px-8 py-4 bg-white text-blue-700 rounded-md font-bold text-lg hover:bg-blue-50 transition duration-300"
                  >
                    Zur App
                  </button>
                  <a
                    href="#features"
                    className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-md font-bold text-lg hover:bg-white/10 transition duration-300"
                  >
                    Mehr erfahren
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Alles was Sie für effizientes Reha-Management brauchen
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unsere Plattform bietet alle Werkzeuge, die Sie für die erfolgreiche Verwaltung Ihrer Reha-Einrichtung benötigen.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition duration-300">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <button
                onClick={goToApp}
                className="px-8 py-4 bg-blue-600 text-white rounded-md font-bold text-lg hover:bg-blue-700 transition duration-300"
              >
                Jetzt zur App
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Das sagen unsere Kunden</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Erfahren Sie, wie unsere Lösung anderen Reha-Einrichtungen geholfen hat
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-md">
                  <div className="text-blue-600 mb-4">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6 italic">{testimonial.quote}</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-500">{testimonial.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Reha-Management</h3>
                <p className="text-gray-400">
                  Die führende Software-Lösung für Reha-Einrichtungen in Deutschland.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Produkt</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white transition duration-300">Funktionen</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Preise</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Unternehmen</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Über uns</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Karriere</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Kontakt</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Rechtliches</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Datenschutz</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">AGB</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Impressum</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} Reha-Management. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </footer>
      </div>
    </ClientOnly>
  );
}

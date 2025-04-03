import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import type { Database } from '@/lib/database.types' // Optional: Wenn du Typen für deine DB hast

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Erstelle einen Supabase-Client, der speziell für Middleware entwickelt wurde.
  // Dieser Client benötigt Zugriff auf Cookies, um die Sitzung des Benutzers zu lesen/aktualisieren.
  const supabase = createMiddlewareClient({ req, res });
  // const supabase = createMiddlewareClient<Database>({ req, res }); // Mit DB-Typen

  // Aktualisiere die Benutzersitzung basierend auf dem Cookie.
  // Wichtig: Muss vor der Überprüfung der Sitzung erfolgen.
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Definiere öffentliche Pfade, die keine Authentifizierung erfordern
  // Die Landing Page ist immer öffentlich zugänglich.
  const publicPaths = ['/', '/login']; 

  // Prüfe, ob der aktuelle Pfad ein öffentlicher Pfad ist (vereinfacht, da / immer erlaubt ist)
  const isLoginPage = pathname === '/login';
  const isRootPage = pathname === '/';

  // --- Schutz für geschützte Seiten --- 
  // Wenn der Benutzer nicht eingeloggt ist UND versucht, eine Seite aufzurufen, 
  // die weder die Landing Page ('/') noch die Login-Seite ('/login') ist,
  // leite ihn zur Login-Seite um.
  if (!session && !isRootPage && !isLoginPage) { 
    console.log(`Middleware: No session found for protected path ${pathname}, redirecting to /login`);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set(`redirectedFrom`, pathname); 
    return NextResponse.redirect(redirectUrl);
  }

  // --- Umleitung für eingeloggte Benutzer --- 
  // Wenn der Benutzer eingeloggt ist UND versucht, die Login-Seite ('/login') aufzurufen,
  // leite ihn zum Dashboard um. Zugriff auf die Landing Page ('/') wird erlaubt.
  if (session && isLoginPage) {
    console.log(`Middleware: Session found, redirecting from /login to /dashboard`);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard'; 
    return NextResponse.redirect(redirectUrl);
  }

  // Wenn keine der obigen Bedingungen zutrifft, erlaube den Zugriff auf die angeforderte Seite.
  // Dies beinhaltet den Zugriff auf '/' für eingeloggte Benutzer und den Zugriff
  // auf geschützte Seiten für eingeloggte Benutzer.
  return res;
}

// Konfiguration: Definiere, auf welche Pfade die Middleware angewendet werden soll.
export const config = {
  matcher: [
    /*
     * Übereinstimmung mit allen Routen außer:
     * - _next/static (statische Dateien)
     * - _next/image (Bildoptimierungsdateien)
     * - favicon.ico (Favicon-Datei)
     * - /api/auth (Supabase Auth API Routen) 
     * Passe dies bei Bedarf an (z.B. für öffentliche API-Endpunkte)
     * 
     * WICHTIG: Der Matcher muss ALLE Pfade abdecken, die von der Middleware-Logik betroffen sein könnten,
     * also sowohl öffentliche als auch geschützte.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};

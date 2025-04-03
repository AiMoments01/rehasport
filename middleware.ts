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
  const publicPaths = ['/', '/login']; 
  const isPublicPath = publicPaths.includes(pathname);

  // Wenn der Benutzer nicht eingeloggt ist und versucht, auf eine geschützte Seite zuzugreifen
  if (!session && !isPublicPath) { 
    console.log(`Middleware: No session found for protected path ${pathname}, redirecting to /login`);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Wenn der Benutzer eingeloggt ist und versucht, auf die Login-Seite zuzugreifen
  if (session && pathname === '/login') {
    console.log(`Middleware: Session found, redirecting from /login to appropriate dashboard`);
    const userRole = session.user?.user_metadata?.role || 'teilnehmer';
    const redirectUrl = req.nextUrl.clone();
    
    if (userRole === 'admin') {
      redirectUrl.pathname = '/dashboard';
    } else if (userRole === 'trainer') {
      redirectUrl.pathname = '/trainer-dashboard';
    } else {
      redirectUrl.pathname = '/teilnehmer/dashboard';
    }
    
    return NextResponse.redirect(redirectUrl);
  }

  // Rollenbasierte Zugriffskontrolle für eingeloggte Benutzer
  if (session) {
    const userRole = session.user?.user_metadata?.role || 'teilnehmer';
    
    // Admin-Bereiche, die nur für Administratoren zugänglich sind
    const adminOnlyPaths = ['/admin', '/kurse', '/trainer'];
    const isAdminOnlyPath = adminOnlyPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
    
    // Dashboard-Pfad
    const isDashboardPath = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    
    // Wenn ein Nicht-Admin versucht, auf Admin-Bereiche zuzugreifen
    if (userRole !== 'admin' && (isAdminOnlyPath || isDashboardPath)) {
      console.log(`Middleware: Non-admin user tried to access admin path ${pathname}`);
      const redirectUrl = req.nextUrl.clone();
      
      if (userRole === 'trainer') {
        redirectUrl.pathname = '/trainer-dashboard';
      } else {
        redirectUrl.pathname = '/teilnehmer/dashboard';
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // Wenn ein Teilnehmer versucht, auf Trainer-Bereiche zuzugreifen
    const trainerPaths = ['/trainer-dashboard'];
    const isTrainerPath = trainerPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
    
    if (userRole === 'teilnehmer' && isTrainerPath) {
      console.log(`Middleware: Teilnehmer tried to access trainer path ${pathname}`);
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/teilnehmer/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  }

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
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};

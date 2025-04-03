import './globals.css'
import Navigation from '../components/Navigation'; 

export const metadata = {
  title: 'Reha App',
  description: 'Eine Next.js App mit Supabase und shadcn/ui',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="flex bg-gray-50">
        <Navigation /> 
        <main className="flex-grow p-4 md:p-6 overflow-auto"> 
          {children}
        </main>
      </body>
    </html>
  )
}

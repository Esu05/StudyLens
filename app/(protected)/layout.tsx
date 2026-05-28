import Sidebar from '@/components/sidebar'
import Topbar from '@/components/topbar'
import { ThemeProvider } from '@/context/ThemeContext'
import GuestBanner from '@/components/GuestBanner'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar name="Aditi" />
          <GuestBanner />
          <main className="flex-1 overflow-auto p-7">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
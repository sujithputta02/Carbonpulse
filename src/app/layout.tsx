import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/utils/auth";
import { logoutAction } from "./authActions";

export const metadata: Metadata = {
  title: "CarbonPulse — Personal Carbon Footprint Tracker & Coach",
  description: "Understand your carbon footprint, log daily habits, and get actionable, personalized micro-coaching to reduce emissions.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col font-sans bg-[#090d16] text-[#f8fafc]">
        {/* Responsive Sticky Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#090d16]/75 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              {/* Pulsing dot icon */}
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Carbon<span className="text-gradient-cyan">Pulse</span>
              </span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center space-x-8 text-sm font-medium" aria-label="Main Navigation">
                <Link href="/dashboard" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
                  Dashboard
                </Link>
                <Link href="/track" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
                  Daily Track
                </Link>
                <Link href="/insights" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
                  Insights
                </Link>
                <Link href="/history" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
                  History
                </Link>
                <Link href="/admin/factors" className="text-gray-300 hover:text-cyan-400 transition-colors text-xs bg-white/5 px-2.5 py-1 rounded-full border border-white/10 font-semibold">
                  Admin Settings
                </Link>
              </nav>
            )}

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400 hidden sm:inline-block border-r border-white/10 pr-3 font-semibold tracking-wide">
                    {user.email}
                  </span>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-white/5 hover:bg-rose-500/10 text-gray-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 transition-all cursor-pointer font-semibold"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#090d16] font-display shadow-md shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Sub-header */}
        {user && (
          <nav className="flex md:hidden w-full overflow-x-auto whitespace-nowrap py-3 px-4 bg-[#090d16] border-b border-white/5 scrollbar-none justify-center space-x-6 text-xs font-medium sticky top-16 z-40" aria-label="Mobile Navigation">
            <Link href="/dashboard" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
              Dashboard
            </Link>
            <Link href="/track" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
              Daily Track
            </Link>
            <Link href="/insights" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
              Insights
            </Link>
            <Link href="/history" className="text-gray-300 hover:text-emerald-400 transition-colors font-semibold">
              History
            </Link>
            <Link href="/admin/factors" className="text-gray-300 hover:text-cyan-400 transition-colors font-semibold">
              Admin Settings
            </Link>
          </nav>
        )}

        {/* Main Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
          {children}
        </main>

        {/* Semantic Footer */}
        <footer className="w-full border-t border-white/5 bg-[#070b12] py-6 mt-12 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} CarbonPulse. Personalized ecological feedback.</p>
            <div className="flex space-x-6">
              <Link href="/about" className="hover:text-gray-300 transition-colors">
                Science & Factors
              </Link>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

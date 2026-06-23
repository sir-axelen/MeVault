"use client";

import Link from "next/link";
import Hyperspeed from "../components/Hyperspeed";

export default function LandingPage() {
  return (
    <>
      <Hyperspeed />
      
      {/* Navbar Minimalist */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-800">
            <img src="/axel.png" alt="Axel" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">
            MeVault
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 drop-shadow-lg" style={{ letterSpacing: "-0.02em" }}>
          The Fastest Hot Storage <br className="hidden md:block" /> on Aptos
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-12" style={{ fontFamily: 'var(--font-space-mono)' }}>
          Decentralized. Real-Time. Instant Access.
        </p>
        
        <Link href="/dashboard" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-transparent border border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
          <span className="mr-3 tracking-wider uppercase text-sm">Launch App</span>
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="absolute inset-0 h-full w-full rounded-full group-hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-shadow duration-300 pointer-events-none"></div>
        </Link>
      </main>
    </>
  );
}

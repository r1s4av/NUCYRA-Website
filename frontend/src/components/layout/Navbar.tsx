import React, { useState } from 'react';
import { Microscope, Layers, Cpu, Ruler, BookOpen, Menu, X, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Overview', icon: <Microscope className="w-3.5 h-3.5" /> },
    { id: 'lab', label: 'Analysis Lab', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'ivp', label: 'IVP Studio', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'quant', label: 'Quantitative', icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI Insights', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'methodology', label: 'Methodology', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-bio-950/85 backdrop-blur-xl border-b border-bio-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Subtitle */}
          <button
            type="button"
            aria-label="NUCYRA overview"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3.5 cursor-pointer group select-none text-left"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-bio-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]">
                <Microscope className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-wider text-white font-mono flex items-center gap-1.5">
                  NUCYRA
                  <span className="text-[10px] text-cyan-400/90 font-normal font-sans tracking-normal bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                    Research
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-tight font-sans">
                AI-Assisted Histopathology Nuclei Analysis
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 p-1 bg-bio-900/60 rounded-xl border border-bio-800/80">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors select-none ${
                    isActive
                      ? 'text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-pill"
                      className="absolute inset-0 bg-bio-800/90 rounded-lg border border-cyan-500/30 shadow-[0_0_12px_-2px_rgba(6,182,212,0.25)]"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {item.icon}
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Static platform descriptor; runtime connectivity is reported by StatusBanner. */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-bio-900/80 border border-bio-800 text-[11px] font-mono text-slate-400">
            <Microscope className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-300">RESEARCH WORKBENCH</span>
            <span className="text-bio-500">&bull;</span>
            <span className="text-cyan-400">IMAGE PROCESSING</span>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-bio-900 border border-bio-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-bio-800 bg-bio-900/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1 overflow-hidden"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-bio-850 text-cyan-400 border border-bio-700'
                      : 'text-slate-300 hover:text-white hover:bg-bio-850/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

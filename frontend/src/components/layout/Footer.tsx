import React from 'react';
import { ShieldCheck, Terminal, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-bio-800/80 bg-bio-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white font-mono font-semibold text-sm mb-2">
              <span>NUCYRA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Academic Research
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              An educational histopathology analysis platform built to demonstrate digital microscopy image-processing routines, morphological nuclear extraction, and machine learning model evaluation.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-white font-medium text-xs uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>Scientific Integrity & Policy</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              This system is strictly an academic research prototype. It does not provide medical diagnoses, treatment suggestions, or clinical advice. All processed outputs and metrics are for algorithmic evaluation only.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-white font-medium text-xs uppercase tracking-wider mb-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span>Architecture</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              FastAPI backend running OpenCV, NumPy, and scikit-learn in Python 3.13. React 18 + TypeScript + Tailwind CSS frontend with in-memory image execution and zero persistence.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-bio-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>NUCYRA Histopathology Nuclei Platform &copy; 2026</span>
          </div>
          <div className="font-mono text-slate-400">
            OpenCV &bull; NumPy &bull; scikit-learn &bull; FastAPI &bull; Vite &bull; Tailwind
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HealthStatus } from '../../types';

interface StatusBannerProps {
  health: HealthStatus | null;
  isLoading: boolean;
  error: string | null;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ health, isLoading, error }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  const startCmd = "cd backend\n.\\.venv\\Scripts\\Activate.ps1\npython run.py";

  const handleCopy = () => {
    navigator.clipboard.writeText(startCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-bio-950 border-b border-bio-800/80 px-4 py-1.5 text-xs flex items-center justify-between text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>CHECKING BACKEND API &bull; WAITING FOR HEALTH RESPONSE...</span>
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="bg-rose-950/70 border-b border-rose-900/80 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-rose-200 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">
              Backend Service Offline &bull; image processing and model status unavailable
            </span>
            <span className="text-rose-400/80 hidden sm:inline text-[11px] font-mono">
              (Expected on <code className="bg-rose-950 px-1 py-0.5 rounded text-rose-200">http://127.0.0.1:8000</code>)
            </span>
          </div>
          {error && <p className="max-w-7xl mx-auto px-4 pb-2 text-[11px] text-rose-300/90">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-[11px] font-mono transition-colors"
            >
              <Terminal className="w-3 h-3 text-rose-300" />
              <span>Launch Guide</span>
              {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900 text-rose-300 border border-rose-700">
              OFFLINE
            </span>
          </div>
        </div>

        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-bio-950/90 border-t border-rose-900/60 px-4 py-3"
            >
              <div className="max-w-7xl mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono text-cyan-400">Launch backend in Windows PowerShell:</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-bio-900 border border-bio-800"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-cyan-300 bg-black/60 p-2.5 rounded border border-bio-800 overflow-x-auto">
{startCmd}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const allModels = health.models_status.all_loaded;

  return (
    <div className="bg-bio-950/90 border-b border-bio-800/60 px-4 py-1.5 text-xs text-slate-400 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">ENGINE ONLINE</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 border-l border-bio-800 pl-3">
            <span>OpenCV {health.runtime.opencv_version}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 border-l border-bio-800 pl-3">
            <span>Maximum upload: {health.limits.max_upload_size_mb}MB</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          {allModels ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Model artifacts loaded (not used on whole-slide uploads)</span>
            </span>
          ) : (
            <span className="text-amber-400/90 flex items-center gap-1.5" title="One or more local model artifacts are missing or could not be loaded.">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Some model artifacts unavailable</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

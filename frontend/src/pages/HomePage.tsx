import React from 'react';
import { motion } from 'motion/react';
import {
  FlaskConical,
  Layers,
  Cpu,
  BookOpen,
  ArrowRight,
  Sliders,
  Binary,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Zap,
  Microscope
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20 py-8">
      {/* Cinematic Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-bio-900/90 via-bio-950 to-bio-950 border border-bio-800/80 shadow-2xl p-6 sm:p-10 lg:p-14">
        {/* Ambient Optics Lighting */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Hero Content (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="cyan" size="md">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                DIGITAL PATHOLOGY WORKBENCH
              </Badge>
              <Badge variant="neutral" size="md">
                FastAPI &bull; OpenCV &bull; scikit-learn
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-mono leading-none">
                <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  NUCYRA
                </span>
                <span className="text-cyan-500 text-3xl sm:text-4xl">.io</span>
              </h1>
              <p className="text-lg sm:text-xl font-medium tracking-tight bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                AI-Assisted Histopathology Nuclei Analysis & IVP Studio
              </p>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans">
              A biomedical research platform demonstrating nuclei-focused image processing algorithms, morphological feature extraction, and machine-learning evaluation on digital microscopy tissue sections.
            </p>

            {/* Spec Readout Chips */}
            <div className="grid grid-cols-3 gap-3 py-2 max-w-lg">
              <div className="p-2.5 rounded-xl bg-bio-950/80 border border-bio-800/80 text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">Input Engine</p>
                <p className="text-xs font-bold font-mono text-cyan-300 mt-0.5">RAM Stream</p>
                <p className="text-[9px] text-slate-500">Zero Disk Write</p>
              </div>
              <div className="p-2.5 rounded-xl bg-bio-950/80 border border-bio-800/80 text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">Feature Vector</p>
                <p className="text-xs font-bold font-mono text-teal-300 mt-0.5">8 Per-Nucleus</p>
                <p className="text-[9px] text-slate-500">Morph &amp; Color</p>
              </div>
              <div className="p-2.5 rounded-xl bg-bio-950/80 border border-bio-800/80 text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase">IVP Operations</p>
                <p className="text-xs font-bold font-mono text-violet-300 mt-0.5">11 Algorithms</p>
                <p className="text-[9px] text-slate-500">OpenCV Native</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3.5 pt-2 flex-wrap">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('lab')}
                icon={<FlaskConical className="w-4 h-4" />}
                className="shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)]"
              >
                Launch Analysis Lab
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('ivp')}
                icon={<Layers className="w-4 h-4" />}
              >
                Open IVP Studio
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate('methodology')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                Methodology
              </Button>
            </div>
          </motion.div>

          {/* Honest empty viewport: only user-provided images are shown in analysis tools. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-2xl p-4 bg-bio-950/90 border border-cyan-500/20 shadow-2xl glass-panel-elevated">
              {/* Viewport Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-bio-800/80 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-200 font-bold">IMAGE VIEWPORT</span>
                </div>
                <span className="rounded border border-bio-700 bg-bio-900 px-2 py-0.5 text-[10px] text-slate-400">NO FILE LOADED</span>
              </div>

              {/* Decorative viewport only; no sample or simulated activity is rendered. */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-bio-900/90 border border-bio-700 flex items-center justify-center">
                <div className="absolute inset-0 bg-microscope-grid opacity-60" />
                <div className="absolute inset-8 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-16 rounded-full border border-cyan-500/10" />
                <div className="relative z-10 max-w-xs space-y-3 rounded-2xl border border-bio-700 bg-bio-950/90 p-5 text-center backdrop-blur">
                  <Microscope className="mx-auto h-8 w-8 text-cyan-400" />
                  <p className="font-mono text-sm font-semibold text-white">No microscopy image loaded</p>
                  <p className="text-xs leading-relaxed text-slate-400">Upload a real image in Analysis Lab or IVP Studio to inspect backend-processed results.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('lab')}
                    icon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Choose an image
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4-Step Scientific Workflow */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/60">
            <Zap className="w-3.5 h-3.5" />
            STANDARDIZED COMPUTATIONAL PIPELINE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            Biomedical Processing Sequence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered for high-fidelity cellular feature extraction with complete auditability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="h-full space-y-3.5 border-bio-800 hover:border-cyan-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-bio-850 border border-bio-700 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm shadow-inner">
                01
              </div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono">
                In-Memory Ingestion
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Stream TIFF, PNG, or JPEG digital biopsies directly into memory. Validates dimensions (&le;4096px) and mime headers with zero persistent disk storage.
              </p>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="h-full space-y-3.5 border-bio-800 hover:border-teal-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-bio-850 border border-bio-700 flex items-center justify-center text-teal-400 font-mono font-bold text-sm shadow-inner">
                02
              </div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono">
                Stain &amp; Contrast IVP
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                CLAHE adaptive contrast enhancement, bilateral edge-preserving smoothing, and optical density deconvolution isolating hematoxylin nuclear stain absorption.
              </p>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="h-full space-y-3.5 border-bio-800 hover:border-cyan-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-bio-850 border border-bio-700 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm shadow-inner">
                03
              </div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono">
                Morphological Partitioning
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Binarization via Otsu's optimal inter-class variance thresholding, followed by mathematical morphological opening to detach overlapping nuclear bodies.
              </p>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="h-full space-y-3.5 border-bio-800 hover:border-violet-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-bio-850 border border-bio-700 flex items-center justify-center text-violet-400 font-mono font-bold text-sm shadow-inner">
                04
              </div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono">
                Statistical Auditing
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Real-time derivation of Shannon entropy, RMS contrast, connected candidate nuclei densities, and Peak Signal-to-Noise Ratio (PSNR) vs input reference.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 hover:border-cyan-500/40 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white font-mono">IVP Studio</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Image-processing workbench with 11 native OpenCV algorithms, interactive parameters, real backend metrics, and split-screen comparisons.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('ivp')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Studio
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 hover:border-teal-500/40 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-teal-950/80 border border-teal-800 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
            <Binary className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white font-mono">Analysis Lab</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-stage pipeline builder. Chain filters, inspect candidate nuclei counts (15 &le; Area &le; 5000 px&sup2;), and download high-resolution outputs.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('lab')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Launch Lab
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 hover:border-violet-500/40 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-violet-950/80 border border-violet-800 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white font-mono">AI Insights</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Historical academic benchmarks for the 8-feature Decision Tree (~49.83% test accuracy) and K-Means clustering (ARI ~0.055) with server guardrails.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('ai')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Insights
            </Button>
          </div>
        </Card>
      </section>

      {/* Honest Scientific Boundaries Banner */}
      <section className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-900/40 border border-amber-700/60 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-200 font-mono">
              Academic Research Integrity &amp; Strict Guardrails
            </h3>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              NUCYRA is built with absolute fidelity to scientific truth. The historical Decision Tree classifier was trained exclusively on 8-dimensional per-nucleus feature vectors (<code className="font-mono text-amber-200">gray_mean, gray_std, red_mean, green_mean, blue_mean, area, perimeter, circularity</code>). Direct classification of arbitrary unsegmented whole images is purposefully blocked on the backend until an instance segmentation pipeline is linked.
            </p>
            <div className="flex items-center gap-4 pt-2 text-[11px] text-amber-400 font-mono flex-wrap">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Educational Research Prototype
              </span>
              <span>&bull;</span>
              <span>Not a Clinical Diagnostic Device</span>
              <span>&bull;</span>
              <span>Zero Fabricated Patient Data</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import {
  GraduationCap,
  Microscope,
  Calculator,
  Binary,
  Layers,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const MethodologyPage: React.FC = () => {

  return (
    <div className="space-y-12 py-6">
      {/* Page Header */}
      <div className="border-b border-bio-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            Methodology &amp; Scientific Specifications
          </h1>
          <Badge variant="cyan" size="sm">
            Formal Mathematics &amp; Histology
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete mathematical formulations of nuclear morphometric extraction, optical stain deconvolution, and machine learning evaluation.
        </p>
      </div>

      {/* Histopathology & Staining Chemistry */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-base font-mono">
          <Microscope className="w-4 h-4 text-cyan-400" />
          <span>Biomedical Context: Hematoxylin &amp; Eosin (H&amp;E) Staining</span>
        </div>

        <Card className="glass-panel-elevated space-y-4 leading-relaxed text-xs text-slate-300 font-sans">
          <p>
            In digital pathology, tissue biopsies are prepared via microtome sectioning (3–5 &mu;m thickness) and stained with two complementary dyes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="p-4 rounded-xl bg-bio-950 border border-violet-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-violet-300 font-mono text-xs">
                  Hematoxylin (Basophilic Stain)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                  Target: Nucleic Acids
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                A cationic dye that selectively binds to negatively charged phosphate backbones in nuclear DNA and RNA. Forms an aluminum-hematein lake that absorbs strongly in the green-yellow spectrum (560–590 nm), rendering nuclear chromatin deep blue-violet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bio-950 border border-rose-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300 font-mono text-xs">
                  Eosin Y (Acidophilic Counterstain)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Target: Proteins &amp; Stroma
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                An anionic xanthene dye that binds to positively charged amine sidechains in cytoplasmic proteins and extracellular collagen stroma. Displays maximal absorption in the green spectrum (~525 nm), staining the extracellular matrix pink and red.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* The 8 Per-Nucleus Features Mathematical Formulations */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-white font-semibold text-base font-mono">
          <Calculator className="w-4 h-4 text-teal-400" />
          <span>Mathematical Formulations: The 8 Extracted Features</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {/* Morphometric Geometry Card */}
          <Card className="glass-panel-elevated space-y-4">
            <CardHeader
              title="Morphometric Features (Shape & Scale)"
              subtitle="Enclosed region geometry & boundary topology"
              icon={<Binary className="w-4 h-4 text-cyan-400" />}
            />

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">1. Nuclear Area (A)</span>
                  <span className="text-[10px] font-mono text-slate-500">pixels&sup2;</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Total number of discrete pixel coordinates contained inside the segmented nuclear binary mask &Omega;:
                </p>
                <div className="font-mono bg-bio-900/90 p-3 rounded-lg text-slate-100 text-xs border border-bio-800">
                  A = &sum;<sub>(x,y) &isin; &Omega;</sub> 1
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">2. Nuclear Perimeter (P)</span>
                  <span className="text-[10px] font-mono text-slate-500">pixels</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Arc length of the closed outer contour boundary &part;&Omega; evaluated using polygonal chain-code contours:
                </p>
                <div className="font-mono bg-bio-900/90 p-3 rounded-lg text-slate-100 text-xs border border-bio-800">
                  P = &oint;<sub>&part;&Omega;</sub> ds &asymp; &sum;<sub>i=1</sub><sup>N</sup> &radic;[ (x<sub>i+1</sub> - x<sub>i</sub>)&sup2; + (y<sub>i+1</sub> - y<sub>i</sub>)&sup2; ]
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">3. Circularity Quotient (C)</span>
                  <span className="text-[10px] font-mono text-slate-500">Ratio &isin; (0, 1]</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Isoperimetric quotient measuring nuclear circular regularity. Equals 1.0 for a perfect circle; decays toward 0 as nuclear membranes show invaginations:
                </p>
                <div className="font-mono bg-bio-900/90 p-3 rounded-lg text-slate-100 text-xs border border-bio-800">
                  C = (4 &middot; &pi; &middot; A) / (P&sup2;)
                </div>
              </div>
            </div>
          </Card>

          {/* Photometric & Chromatic Moments Card */}
          <Card className="glass-panel-elevated space-y-4">
            <CardHeader
              title="Photometric & Chromatic Moments"
              subtitle="Luminance and spectral stain absorption"
              icon={<Layers className="w-4 h-4 text-teal-400" />}
            />

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-teal-400 font-bold">4. Grayscale Mean (&mu;<sub>gray</sub>)</span>
                  <span className="text-[10px] font-mono text-slate-500">0–255 a.u.</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Average luminance across ITU-R BT.601 converted pixels within the nuclear boundary:
                </p>
                <div className="font-mono bg-bio-900/90 p-3 rounded-lg text-slate-100 text-xs border border-bio-800">
                  &mu;<sub>gray</sub> = (1 / A) &sum;<sub>(x,y) &isin; &Omega;</sub> I<sub>gray</sub>(x,y)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-teal-400 font-bold">5. Grayscale Std Dev (&sigma;<sub>gray</sub>)</span>
                  <span className="text-[10px] font-mono text-slate-500">RMS Contrast</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Internal texture variance quantifying chromatin granularity and hyperchromatic condensation:
                </p>
                <div className="font-mono bg-bio-900/90 p-3 rounded-lg text-slate-100 text-xs border border-bio-800">
                  &sigma;<sub>gray</sub> = &radic;[ (1 / A) &sum; (I<sub>gray</sub>(x,y) - &mu;<sub>gray</sub>)&sup2; ]
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-rose-400 font-bold">6–8. RGB Channel Means (&mu;<sub>R</sub>, &mu;<sub>G</sub>, &mu;<sub>B</sub>)</span>
                  <span className="text-[10px] font-mono text-slate-500">Color Spectrum</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Individual channel intensity means capturing differential hematoxylin vs eosin absorption:
                </p>
                <div className="font-mono bg-bio-900/90 p-3 rounded-lg text-slate-100 text-xs border border-bio-800">
                  &mu;<sub>c</sub> = (1 / A) &sum;<sub>(x,y) &isin; &Omega;</sub> I<sub>c</sub>(x,y) &nbsp; for c &isin; &#123;R, G, B&#125;
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Machine Learning Methodology & Discussion */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-white font-semibold text-base font-mono">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>Evaluation Analysis &amp; Academic Findings</span>
        </div>

        <Card className="glass-panel-elevated space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Decision Tree Analysis (~49.83% Historical Accuracy)
            </h3>
            <p>
              In digital histopathology, cellular pleomorphism results in overlapping feature distributions across tumor grades. The Decision Tree split metric evaluates Gini Impurity:
            </p>
            <div className="font-mono bg-bio-950 p-3 rounded-lg text-cyan-300 text-xs border border-bio-800 max-w-md">
              I<sub>Gini</sub>(p) = 1 - &sum;<sub>i=1</sub><sup>J</sup> p<sub>i</sub>&sup2;
            </div>
            <p>
              While the 8 hand-crafted features quantify global geometry and color moments, they struggle without spatial context:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-2">
              <li>They ignore inter-cellular clustering, glandular architecture, and tissue context.</li>
              <li>Hand-crafted scalar features exhibit high variance between different patient biopsies.</li>
              <li>Ensemble deep neural networks (e.g. Hover-Net or ResNet) are typically required for clinical grade classification.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-bio-800 space-y-2.5">
            <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Unsupervised K-Means Concordance (ARI ~0.055, NMI ~0.073)
            </h3>
            <p>
              Unsupervised K-Means clustering minimizes the sum of squared Euclidean distances in the 8-D normalized space:
            </p>
            <div className="font-mono bg-bio-950 p-3 rounded-lg text-emerald-300 text-xs border border-bio-800 max-w-md">
              J = &sum;<sub>k=1</sub><sup>K</sup> &sum;<sub>x &isin; S<sub>k</sub></sub> &parallel; x - &mu;<sub>k</sub> &parallel;&sup2;
            </div>
            <p>
              In this historical evaluation, the low Adjusted Rand Index (ARI ~0.055) and Normalized Mutual Information (NMI ~0.073) indicate limited alignment between cluster assignments and reference labels. These scores do not establish why the clusters formed or give them a verified biological or clinical interpretation.
            </p>
          </div>
        </Card>
      </section>

      {/* Strict Institutional Research Disclaimer */}
      <section className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-6 sm:p-8 space-y-3 glass-panel">
        <div className="flex items-center gap-2 text-rose-300 font-mono">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-bold">
            Institutional Research Prototype Notice
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          NUCYRA is developed solely for academic research, education, and algorithmic benchmarking of image-processing and machine learning routines in digital histopathology. It is <strong>not</strong> an FDA, CE-IVD, or SaMD-cleared medical device. It must never be used for clinical diagnosis, patient staging, treatment planning, or clinical triage.
        </p>
      </section>
    </div>
  );
};

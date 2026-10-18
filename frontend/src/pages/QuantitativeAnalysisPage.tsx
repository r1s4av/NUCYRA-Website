import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Ruler, Loader2, Info, Layers, Scissors, AlertTriangle, Cpu, UploadCloud } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface ModelRes { accuracy: number; macro_f1: number; weighted_f1: number; f1: number[]; recall: number[] }

interface Summary {
  meta: {
    images: number; nuclei_measured: number; images_without_nuclei: number;
    border_touching_percent: number; nuclei_after_border_exclusion: number;
    min_nucleus_area_px: number; source: string;
  };
  class_counts: { type: string; nuclei: number; percent: number }[];
  type_medians: Record<string, number | string>[];
  stages: { stage: string; contrast_std: number; entropy: number; sharpness: number; separation_dprime: number }[];
  segmentation: {
    pipeline: string; dice: number; iou: number; precision: number; recall: number;
    instance_precision: number; instance_recall: number; instance_f1: number; merged_components: number;
  }[];
  ai?: {
    test_crops: number; support: number[]; majority_baseline: number; note: string;
    cnn: ModelRes; decision_tree: ModelRes; cnn_confusion: number[][]; dt_confusion: number[][];
    cnn_confidence: { mean_correct: number; mean_wrong: number; wrong_with_conf_ge_0_8: number; wrong_total: number };
  };
  member2_segmentation?: { images_evaluated: number; image_set: string; methods: Record<string, number | string>[] };
  failure_examples: { failure_type: string; file: string; dice: number; gt_instances: number; merged_components: number; missed_nuclei: number }[];
}

const BASE = '/results/quantitative';
const COLORS = { a: '#22d3ee', b: '#a78bfa', c: '#34d399', d: '#fbbf24' };

const Fig: React.FC<{ file: string; caption: string }> = ({ file, caption }) => {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return <p className="text-xs text-slate-500 font-mono">Figure {file} is not available.</p>;
  }
  return (
    <figure>
      <img src={`${BASE}/figures/${file}`} alt={caption} loading="lazy" onError={() => setMissing(true)}
        className="w-full rounded-lg border border-bio-800 bg-white" />
      <figcaption className="text-xs text-slate-400 mt-2">{caption}</figcaption>
    </figure>
  );
};

const Table: React.FC<{ head: string[]; rows: (string | number)[][] }> = ({ head, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs font-mono">
      <thead>
        <tr className="text-slate-400 border-b border-bio-800">
          {head.map((h) => <th key={h} className="text-left py-2 pr-4 font-medium whitespace-nowrap">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-bio-800/50 text-slate-200">
            {r.map((c, j) => <td key={j} className="py-2 pr-4 whitespace-nowrap">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const num = (v: unknown, d = 2) => Number(v).toFixed(d);

const SHORT = ['Neopl.', 'Inflam.', 'Conn.', 'Dead', 'Epith.'];
const ConfusionMatrix: React.FC<{ title: string; m: number[][] }> = ({ title, m }) => {
  const max = Math.max(...m.flat());
  return (
    <div>
      <div className="text-xs text-slate-300 mb-2">{title} <span className="text-slate-500">(rows = true, columns = predicted)</span></div>
      <table className="text-xs font-mono">
        <thead><tr><th className="p-1" />{m.map((_, j) => <th key={j} className="p-1 text-slate-400 font-medium">{SHORT[j]}</th>)}</tr></thead>
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              <th className="p-1 text-slate-400 font-medium">{SHORT[i]}</th>
              {row.map((v, j) => (
                <td key={j} className="w-16 h-9 text-center text-slate-100 border border-bio-900"
                  style={{ background: `rgba(34,211,238,${(0.08 + 0.7 * v / max).toFixed(2)})`, outline: i === j ? '1px solid rgba(255,255,255,0.5)' : undefined }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface CropResult {
  classes: string[]; features: Record<string, number>; disclaimer: string;
  cnn: { predicted?: string; confidence?: number; probabilities?: Record<string, number>; unavailable?: boolean; reason?: string };
  decision_tree: { predicted?: string; probabilities?: Record<string, number>; unavailable?: boolean; reason?: string };
}


const ProbBars: React.FC<{
  title: string;
  p?: Record<string, number>;
  predicted?: string;
}> = ({ title, p, predicted }) => (
  <div className="min-w-0 w-full">
    <div className="text-sm text-slate-300 mb-3 break-words">
      {title}
      {predicted && (
        <span className="ml-2 text-cyan-300 font-mono">
          → {predicted}
        </span>
      )}
    </div>

    {p &&
      Object.entries(p).map(([k, v]) => (
        <div
          key={k}
          className="grid grid-cols-[minmax(100px,auto)_minmax(0,1fr)_56px] items-center gap-3 mb-2 text-xs font-mono"
        >
          <span
            className="text-slate-300 whitespace-normal break-words leading-tight"
            title={k}
          >
            {k}
          </span>

          <div className="w-full min-w-0 h-2.5 rounded bg-bio-850 overflow-hidden">
            <div
              className="h-full rounded bg-cyan-400"
              style={{
                width: `${Math.max(0, Math.min(100, v * 100))}%`,
              }}
            />
          </div>

          <span className="text-right text-slate-300 tabular-nums whitespace-nowrap">
            {(v * 100).toFixed(1)}%
          </span>
        </div>
      ))}
  </div>
);

const CropClassifier: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<CropResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setErr(null); setRes(null); setPreview(URL.createObjectURL(f));
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/ai/predict-crop', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.detail?.message || j?.detail || `Request failed (HTTP ${r.status})`);
      setRes(j);
    } catch (e: any) {
      setErr(e.message || 'Backend not reachable. Start the FastAPI backend to use this panel.');
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader title="Try one nucleus crop" subtitle="Upload a single, nucleus-centred crop (up to 128×128 px; 32×32 is what the models were trained on)" icon={<UploadCloud className="w-4 h-4" />} />
      <label className="inline-flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border border-bio-700 bg-bio-850 text-slate-200 cursor-pointer hover:border-cyan-500/60">
        <input type="file" accept="image/png,image/jpeg,image/tiff,image/bmp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        Choose image
      </label>
      {busy && <span className="ml-3 text-xs text-slate-400">Classifying…</span>}
      {err && <p className="mt-3 text-xs text-rose-300">{err}</p>}
      {res && (
        <div className="mt-4 grid md:grid-cols-[96px_1fr_1fr] gap-5 items-start">
          {preview && <img src={preview} alt="uploaded crop" className="w-24 h-24 rounded border border-bio-800 object-cover" style={{ imageRendering: 'pixelated' }} />}
          {res.cnn.unavailable ? <p className="text-xs text-amber-300">CNN unavailable: {res.cnn.reason}</p>
            : <ProbBars title="CNN" p={res.cnn.probabilities} predicted={res.cnn.predicted} />}
          {res.decision_tree.unavailable ? <p className="text-xs text-amber-300">Decision Tree unavailable: {res.decision_tree.reason}</p>
            : <ProbBars title="Decision Tree" p={res.decision_tree.probabilities} predicted={res.decision_tree.predicted} />}
        </div>
      )}
      <p className="text-xs text-slate-500 mt-4">{res?.disclaimer ?? 'Whole tissue images are rejected on purpose: no validated nucleus detector is linked. Educational prototype, not a diagnostic tool.'}</p>
    </Card>
  );
};


export const QuantitativeAnalysisPage: React.FC = () => {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/summary.json`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  if (error) {
    return (
      <div className="py-10">
        <Card>
          <CardHeader title="Quantitative analysis results not found" icon={<Ruler className="w-4 h-4" />} />
          <p className="text-sm text-slate-300">
            Could not load <code className="font-mono">{BASE}/summary.json</code> ({error}). Place the generated
            analysis files in <code className="font-mono">frontend/public/results/quantitative/</code>. No placeholder numbers are shown.
          </p>
        </Card>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
      </div>
    );
  }

  const m = data.meta;
  const segChart = data.segmentation.map((s) => ({
    name: s.pipeline.replace('Hematoxylin channel', 'Hematoxylin').replace('morphology', 'morph.'),
    'Dice (pixels)': +s.dice.toFixed(3),
    'F1 (per nucleus, IoU≥0.5)': +s.instance_f1.toFixed(3),
  }));

  return (
    <div className="py-8 space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="cyan">Member 3</Badge>
          <Badge variant="neutral">Classical IVP only</Badge>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Quantitative Analysis</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Measurements of every ground-truth nucleus, a numeric comparison of image-processing stages, and a
          test of six classical segmentation pipelines against ground truth. Computed offline from the
          {' '}{m.images.toLocaleString()} training images; nothing on this page is estimated.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Images', m.images.toLocaleString()],
          ['Nuclei measured', m.nuclei_measured.toLocaleString()],
          ['Touch image border', `${m.border_touching_percent}%`],
          ['Images with no nuclei', m.images_without_nuclei],
        ].map(([k, v]) => (
          <Card key={k as string}>
            <div className="text-xs text-slate-400">{k}</div>
            <div className="text-xl font-mono font-semibold text-cyan-300 mt-1">{v}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Class distribution" subtitle="Label 1-5: Neoplastic, Inflammatory, Connective, Dead, Epithelial (PanNuke / HoVer-Net numbering)" icon={<Layers className="w-4 h-4" />} />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.class_counts}>
              <CartesianGrid stroke="#1f2937" vertical={false} />
              <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} contentStyle={{ background: '#0b1220', border: '1px solid #1f2937', fontSize: 12 }} />
              <Bar isAnimationActive={false} dataKey="nuclei" fill={COLORS.a} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          The Dead class has only {data.class_counts[3]?.nuclei.toLocaleString()} nuclei ({data.class_counts[3]?.percent}%), so a classifier
          has little data for it and overall accuracy alone would hide weak Dead results.
        </p>
      </Card>

      <Card>
        <CardHeader title="Shape, colour and texture by type" subtitle={`Median per type, excluding ${m.border_touching_percent}% border-cut nuclei (${m.nuclei_after_border_exclusion.toLocaleString()} nuclei kept)`} icon={<Ruler className="w-4 h-4" />} />
        <Table
          head={['Type', 'Nuclei', 'Area px', 'Perimeter', 'Circularity', 'Eccentricity', 'Aspect', 'R', 'G', 'B', 'GLCM contrast', 'Homogeneity', 'Energy']}
          rows={data.type_medians.map((t) => [
            t.type as string, (t.n_nuclei as number).toLocaleString(), num(t.area, 0), num(t.perimeter, 1), num(t.circularity),
            num(t.eccentricity), num(t.aspect_ratio), num(t.mean_R, 0), num(t.mean_G, 0), num(t.mean_B, 0),
            num(t.glcm_contrast, 1), num(t.glcm_homogeneity), num(t.glcm_energy, 3),
          ])}
        />
        <p className="text-xs text-slate-500 mt-3">
          Circularity can slightly exceed 1 for very small nuclei because perimeter is estimated on a pixel grid.
          The type distributions overlap strongly, so colour and texture only partly separate the types.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-5">
          <Fig file="02_shape_by_type.png" caption="Shape measurements by type" />
          <Fig file="03_colour_rgb_by_type.png" caption="Mean RGB inside nuclei by type" />
          <Fig file="04_texture_by_type.png" caption="GLCM texture inside nuclei by type" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Effect of each IVP stage" subtitle="Image statistics averaged over all images" icon={<Layers className="w-4 h-4" />} />
        <Table
          head={['Stage', 'Contrast (std)', 'Entropy', 'Sharpness', 'Nucleus/background d′']}
          rows={data.stages.map((s) => [s.stage, num(s.contrast_std), num(s.entropy), num(s.sharpness, 0), num(s.separation_dprime)])}
        />
        <p className="text-xs text-slate-400 mt-3">
          CLAHE raises contrast and sharpness but lowers nucleus/background separation (d′), so more contrast does not mean
          easier nucleus detection. These are image statistics only; effect on a classifier was not tested.
        </p>
      </Card>

      <Card>
        <CardHeader title="Classical segmentation vs ground truth" subtitle="Pixel overlap looks good; finding each nucleus individually is much harder" icon={<Scissors className="w-4 h-4" />} />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segChart} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#1f2937" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} stroke="#94a3b8" fontSize={11} />
              <YAxis type="category" dataKey="name" width={190} stroke="#94a3b8" fontSize={10} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} contentStyle={{ background: '#0b1220', border: '1px solid #1f2937', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar isAnimationActive={false} dataKey="Dice (pixels)" fill={COLORS.a} />
              <Bar isAnimationActive={false} dataKey="F1 (per nucleus, IoU≥0.5)" fill={COLORS.b} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <Table
            head={['Pipeline', 'Dice', 'IoU', 'Precision', 'Recall', 'Nucleus precision', 'Nucleus recall', 'Nucleus F1', 'Merged blobs']}
            rows={data.segmentation.map((s) => [s.pipeline, num(s.dice, 3), num(s.iou, 3), num(s.precision, 3), num(s.recall, 3),
              num(s.instance_precision, 3), num(s.instance_recall, 3), num(s.instance_f1, 3), s.merged_components.toLocaleString()])}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          The best pipeline (hematoxylin channel + Otsu + morphology) reaches Dice {num(data.segmentation[5].dice, 2)} but only
          finds about {Math.round(data.segmentation[5].instance_recall * 100)}% of nuclei as separate objects, mainly because touching nuclei merge.
          Member 2's segmentation masks are not included here yet.
        </p>
        <div className="mt-5">
          <Fig file="07_segmentation_examples.png" caption="Example segmentations from each pipeline" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Failure analysis" subtitle="Worst cases of the best pipeline, not typical images" icon={<AlertTriangle className="w-4 h-4" />} />
        <Fig file="10_failure_gallery.png" caption="Green = ground truth, red = predicted. Rows: merged nuclei, missed pale nuclei, false positives on dark non-nuclear tissue." />
      </Card>


      {data.ai && (
        <Card>
          <CardHeader title="CNN vs Decision Tree" subtitle={`Same ${data.ai.test_crops.toLocaleString()} held-out test crops for both models`} icon={<Cpu className="w-4 h-4" />} />
          <Table
            head={['Model', 'Accuracy', 'Macro F1', 'Weighted F1', ...['1', '2', '3', '4', '5'].map((k) => `F1 ${['Neoplastic','Inflammatory','Connective','Dead','Epithelial'][Number(k)-1]}`)]}
            rows={[
              ['CNN', num(data.ai.cnn.accuracy, 3), num(data.ai.cnn.macro_f1, 3), num(data.ai.cnn.weighted_f1, 3), ...data.ai.cnn.f1.map((v) => num(v, 3))],
              ['Decision Tree', num(data.ai.decision_tree.accuracy, 3), num(data.ai.decision_tree.macro_f1, 3), num(data.ai.decision_tree.weighted_f1, 3), ...data.ai.decision_tree.f1.map((v) => num(v, 3))],
            ]}
          />
          <p className="text-xs text-slate-400 mt-3">
            Always predicting the largest class (Neoplastic) would score {num(data.ai.majority_baseline * 100, 1)}%. {data.ai.note}
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-5">
            <ConfusionMatrix title="CNN" m={data.ai.cnn_confusion} />
            <ConfusionMatrix title="Decision Tree" m={data.ai.dt_confusion} />
          </div>
          <p className="text-xs text-slate-400 mt-4">
            CNN confidence is higher when it is right ({num(data.ai.cnn_confidence.mean_correct * 100, 0)}% on average) than when it is wrong
            ({num(data.ai.cnn_confidence.mean_wrong * 100, 0)}%), but {data.ai.cnn_confidence.wrong_with_conf_ge_0_8} of its {data.ai.cnn_confidence.wrong_total} errors
            still have confidence of 80% or more. The Dead class has only {data.ai.support[3]} test crops, so its F1 is less reliable.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <Fig file="class_imbalance_f1.png" caption="Class sizes and per-class F1 on the shared test crops" />
            <Fig file="classification_examples_by_outcome.png" caption="Test crops by outcome: both right, only the CNN right, only the Decision Tree right" />
          </div>
          <div className="mt-5"><Fig file="misclassified_gallery.png" caption="Most confident CNN mistakes for the six largest confusions" /></div>
        </Card>
      )}

      {data.member2_segmentation && (
        <Card>
          <CardHeader title="Member 2 segmentation methods" subtitle={`${data.member2_segmentation.images_evaluated} annotated images – ${data.member2_segmentation.image_set}`} icon={<Scissors className="w-4 h-4" />} />
          <Table
            head={['Method', 'IoU', 'Dice', 'Precision', 'Recall', 'Nucleus precision', 'Nucleus recall', 'Nucleus F1']}
            rows={data.member2_segmentation.methods.map((m) => [m.Method as string, num(m.IoU, 4), num(m.Dice, 4), num(m.Precision, 4), num(m.Recall, 4), num(m.Instance_precision, 3), num(m.Instance_recall, 3), num(m.Instance_F1, 3)])}
          />
          <p className="text-xs text-slate-400 mt-3">Hematoxylin is best on every measure. Pixel overlap looks far better than per-nucleus detection because touching nuclei merge into single blobs.</p>
          <div className="mt-4"><Fig file="member2_segmentation_comparison.png" caption="Pixel overlap (left) and per-nucleus detection (right)" /></div>
        </Card>
      )}

      <CropClassifier />

      <div className="flex items-start gap-2 text-xs text-slate-500">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Educational research analysis, not a diagnostic tool. Source: {m.source}. Nuclei smaller than {m.min_nucleus_area_px} px are ignored.</span>
      </div>
    </div>
  );
};

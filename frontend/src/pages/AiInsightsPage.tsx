import React, { useRef, useState, useEffect } from 'react';
import {
  Cpu,
  BarChart3,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  Info,
  Loader2,
  FolderOpen,
  Filter,
  FileImage,
  UploadCloud,
  Play
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AiMetricsResponse, ModelAssetStatus, PerNucleusFeature } from '../types';
import { analyzeUploadedImage, fetchAiMetrics } from '../services/api';

type CsvRows = string[][];

const EXPECTED_MODELS = [
  ['decision_tree', 'NUCYRA_DecisionTree.joblib'],
  ['feature_scaler', 'NUCYRA_FeatureScaler.joblib'],
  ['kmeans', 'NUCYRA_KMeans.joblib'],
] as const;

async function fetchResultCsv(filename: string): Promise<CsvRows> {
  const response = await fetch(`/results/${filename}`);
  if (!response.ok) {
    throw new Error(`Could not load /results/${filename} (HTTP ${response.status}).`);
  }

  const text = await response.text();
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()));

  if (rows.length < 2 || rows.some((row) => row.length !== rows[0].length)) {
    throw new Error(`/results/${filename} is empty or has inconsistent columns.`);
  }

  return rows;
}

export const AiInsightsPage: React.FC = () => {
  const [data, setData] = useState<AiMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classificationRows, setClassificationRows] = useState<CsvRows | null>(null);
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [isClassificationLoading, setIsClassificationLoading] = useState(true);
  const [kmeansRows, setKmeansRows] = useState<CsvRows | null>(null);
  const [kmeansError, setKmeansError] = useState<string | null>(null);
  const [isKmeansLoading, setIsKmeansLoading] = useState(true);
  const [confusionMatrixError, setConfusionMatrixError] = useState(false);
  const [selectedAnalysisFile, setSelectedAnalysisFile] = useState<File | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'morphometric' | 'intensity' | 'chromatic'>('all');

  useEffect(() => {
    let isMounted = true;

    fetchAiMetrics()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to fetch AI metrics.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    fetchResultCsv('decision_tree_classification_metrics.csv')
      .then((rows) => {
        if (isMounted) setClassificationRows(rows);
      })
      .catch((err: Error) => {
        if (isMounted) setClassificationError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsClassificationLoading(false);
      });

    fetchResultCsv('kmeans_cluster_comparison.csv')
      .then((rows) => {
        if (isMounted) setKmeansRows(rows);
      })
      .catch((err: Error) => {
        if (isMounted) setKmeansError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsKmeansLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyzeImage = async () => {
    if (!selectedAnalysisFile) {
      setAnalysisError('Select a histopathology image before requesting analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeUploadedImage(selectedAnalysisFile);
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'The backend could not analyze this image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dt = data?.historical_benchmarks.decision_tree;
  const km = data?.historical_benchmarks.kmeans;
  const models = data?.status.models;
  const classificationHeaders = classificationRows?.[0] ?? [];
  const accuracyRow = classificationRows?.find((row) => row[0].toLowerCase() === 'accuracy');
  const csvAccuracy = accuracyRow ? Number(accuracyRow[1]) * 100 : null;
  const accuracyIsCsv = csvAccuracy !== null && Number.isFinite(csvAccuracy);
  const accuracy = accuracyIsCsv ? csvAccuracy : dt?.reported_accuracy_percent;
  const confusionMatrixPath = '/results/decision_tree_confusion_matrix.png';

  const filteredFeatures = dt?.features.filter((f: PerNucleusFeature) =>
    selectedCategory === 'all' ? true : f.category === selectedCategory
  );

  return (
    <div className="space-y-12 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bio-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
              AI Insights &amp; Historical Benchmarks
            </h1>
            <Badge variant="cyan" size="sm">
              Academic Validation Baseline
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical machine learning evaluation metrics, model asset detection, and non-diagnostic boundaries.
          </p>
        </div>

        <Badge variant="neutral" size="md">
          Historical experiments &bull; no whole-image inference
        </Badge>
      </div>

      {(isLoading || error) && (
        <div className={`rounded-xl border p-4 text-xs font-mono ${error ? 'border-amber-800 bg-amber-950/40 text-amber-200' : 'border-cyan-900 bg-cyan-950/30 text-cyan-200'}`}>
          {isLoading ? (
        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Connecting to the backend for model status and scientific metadata…</span>
          ) : (
        <span><strong>Backend unavailable:</strong> {error} Historical report files below are loaded independently from the frontend.</span>
          )}
        </div>
      )}

      {/* Model Asset Drop-Zone Registry */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            Local Model Asset Registry
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {data ? 'Backend deserialization status' : 'Status unavailable until the backend responds'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {EXPECTED_MODELS.map(([key, filename]) => {
              const item: ModelAssetStatus | undefined = models?.[key];
              const isLoaded = item?.is_loaded === true;
              const statusLabel = !item ? 'Status unavailable' : isLoaded ? 'Loaded' : item.is_present ? 'Present, not loaded' : 'Missing';
              const statusDescription = !item
                ? 'The API has not reported model status.'
                : isLoaded
                ? 'Deserialized successfully; whole-image inference is not enabled.'
                : item.is_present
                ? 'The file is present but could not be loaded.'
                : 'The model file is missing from the backend.';
              return (
                <Card key={key} className="space-y-3 glass-panel-elevated">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-100">
                      {filename}
                    </span>
                    <Badge variant={isLoaded ? 'emerald' : item ? 'amber' : 'neutral'} size="sm">
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <p className="text-slate-400">
                      Path: <code className="text-cyan-400">backend/models/{filename}</code>
                    </p>
                    <p className="text-slate-400">{statusDescription}</p>
                    <p className="text-slate-500">
                      {item?.is_present ? `File size: ${(item.size_bytes / 1024).toFixed(1)} KB` : !item ? 'The API has not reported file presence.' : 'The expected model file is not available to the backend.'}
                    </p>
                    {item?.load_error && <p className="break-words text-rose-300">Load error: {item.load_error}</p>}
                    {item?.load_warnings.map((warning) => <p key={warning} className="break-words text-amber-300">Compatibility warning: {warning}</p>)}
                  </div>
                </Card>
              );
            })}
        </div>
      </section>

      {/* Decision Tree Historical Evaluation */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Decision Tree Historical Classifier Evaluation
          </h2>
          <Badge variant="cyan" size="sm">
            Supervised Baseline
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Accuracy Stat Card (4 cols) */}
          <Card className="lg:col-span-4 space-y-4 flex flex-col justify-between glass-panel-elevated">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wide">
                  Historical Test Accuracy
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Historical CSV report
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-5xl font-extrabold font-mono text-cyan-300">
                  {accuracy === undefined ? '—' : `${accuracy.toFixed(2)}%`}
                </span>
                <span className="text-xs text-slate-400 font-mono">Test Partition</span>
              </div>
              <p className="text-xs text-slate-300 mt-3.5 leading-relaxed font-sans">
                {accuracyIsCsv ? 'Accuracy read from the historical classification report below, evaluated on the report’s test partition.' : classificationRows ? 'The CSV has no valid accuracy row; showing the backend historical summary.' : 'Accuracy is available from the backend historical summary while the CSV report is unavailable.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 text-[11px] text-slate-400 space-y-1 font-sans">
              <p className="font-semibold text-slate-200 font-mono">Academic Context:</p>
              <p>
                Decision tree trained on the 8 per-nucleus morphometric and chromatic features. Features represent scalar moments rather than convolutional spatial context.
              </p>
            </div>
          </Card>

          {/* Static Report Artifact Drop Card (8 cols) */}
          <Card className="lg:col-span-8 space-y-4 glass-panel-elevated">
            <CardHeader
              title="Historical Decision Tree Confusion Matrix"
              subtitle={confusionMatrixPath}
              icon={<BarChart3 className="w-4 h-4 text-cyan-400" />}
            />

            <div className="rounded-xl border border-bio-800 bg-bio-950 p-2">
              {confusionMatrixError ? (
                <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
                  <FileImage className="h-10 w-10 text-amber-400" />
                  <p className="text-sm font-semibold text-slate-200">Historical confusion matrix unavailable</p>
                  <p className="text-xs text-slate-400">Expected asset: <code className="text-cyan-300">{confusionMatrixPath}</code></p>
                </div>
              ) : (
                <img
                  src={confusionMatrixPath}
                  alt="Historical Decision Tree confusion matrix for labels 1 through 5. Rows are true labels and columns are predicted labels."
                  className="mx-auto max-h-[32rem] w-full rounded-lg object-contain"
                  onError={() => setConfusionMatrixError(true)}
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400">Archived experiment result; this is not output from the currently uploaded image or a live prediction.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white font-mono">Historical Classification Report</h2>
            <p className="text-xs text-slate-400">Values loaded directly from <code className="text-cyan-300">decision_tree_classification_metrics.csv</code>.</p>
          </div>
          <Badge variant="neutral" size="sm">Archived experiment &bull; not live analysis</Badge>
        </div>
        {isClassificationLoading ? (
          <div className="rounded-xl border border-bio-800 p-5 text-xs text-slate-400">Loading historical CSV report…</div>
        ) : classificationError ? (
          <div role="alert" className="rounded-xl border border-amber-800 bg-amber-950/30 p-5 text-xs text-amber-200">Historical report unavailable: {classificationError}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bio-800 glass-panel-elevated">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <thead className="bg-bio-950/80 font-mono text-[11px] text-slate-400">
                <tr>{classificationHeaders.map((header, index) => <th key={header || `class-${index}`} className="px-4 py-3">{header || 'class'}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-bio-800/60 font-mono">
                {classificationRows?.slice(1).map((row) => (
                  <tr key={row[0]} className={row[0] === 'accuracy' ? 'bg-cyan-950/20 text-cyan-200' : 'text-slate-300'}>
                    {row.map((value, index) => <td key={`${row[0]}-${index}`} className="px-4 py-3">{index > 0 && Number.isFinite(Number(value)) && row[0] !== 'support' && index < 4 ? Number(value).toFixed(4) : value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* The 8 Per-Nucleus Features Table */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white font-mono flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-400" />
            The 8 Per-Nucleus Extracted Features
          </h2>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono bg-bio-950 p-1 rounded-xl border border-bio-800 select-none">
            <span className="text-[10px] text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(['all', 'morphometric', 'intensity', 'chromatic'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-bio-850 text-cyan-300 font-bold border border-bio-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-bio-800 bg-bio-900 glass-panel-elevated">
          <table className="w-full text-left text-xs">
            <thead className="bg-bio-950/80 text-slate-400 font-mono text-[11px] border-b border-bio-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Feature Identifier</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dimension Unit</th>
                <th className="py-3 px-4">Mathematical / Histological Formulation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bio-800/60 font-mono">
              {filteredFeatures?.map((f: PerNucleusFeature, i: number) => (
                <tr key={f.name} className="hover:bg-bio-850/60 transition-colors">
                  <td className="py-3 px-4 text-cyan-400 font-bold">{i + 1}</td>
                  <td className="py-3 px-4 font-bold text-white">{f.name}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        f.category === 'morphometric'
                          ? 'teal'
                          : f.category === 'chromatic'
                          ? 'rose'
                          : 'cyan'
                      }
                      size="sm"
                    >
                      {f.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{f.unit}</td>
                  <td className="py-3 px-4 font-sans text-slate-300 text-xs">
                    {f.description}
                  </td>
                </tr>
              ))}
              {!filteredFeatures?.length && (
                <tr><td colSpan={5} className="px-4 py-5 text-center text-slate-400">{isLoading ? 'Loading feature metadata…' : 'Feature metadata unavailable while the backend is offline.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* K-Means Unsupervised Evaluation */}
      <section className="space-y-5">
        <h2 className="text-base font-semibold text-white font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          K-Means Clustering Evaluation &amp; Unsupervised Boundaries
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          <Card className="space-y-4 glass-panel-elevated">
            <CardHeader
              title="Reported Cluster Concordance"
              subtitle="Evaluated against ground truth annotations"
              icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                <span className="text-xs font-mono text-slate-400">Adjusted Rand Index (ARI)</span>
                <p className="text-3xl font-extrabold font-mono text-cyan-300 mt-1">
                  {km?.reported_ari ?? '—'}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1">Scale: [-1.0, 1.0]</p>
              </div>

              <div className="p-4 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                <span className="text-xs font-mono text-slate-400">
                  Normalized Mutual Info (NMI)
                </span>
                <p className="text-3xl font-extrabold font-mono text-teal-300 mt-1">
                  {km?.reported_nmi ?? '—'}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1">Scale: [0.0, 1.0]</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {km?.unsupervised_disclaimer ?? 'Historical K-means metrics are not available from the backend right now.'}
            </p>
          </Card>

          <Card className="space-y-4 glass-panel-elevated">
            <CardHeader
              title="Scientific Boundary: Interpretation of Clusters"
              subtitle="Why unsupervised clusters do not mirror pathology classes"
              icon={<Info className="w-4 h-4 text-amber-400" />}
            />

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <p>
                Digital histology tissue sections exhibit continuous <strong>nuclear polymorphism</strong> and optical density shifts. K-Means clusters data purely by Euclidean distances in the 8-dimensional normalized feature space:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
                <li>Microtome section thickness variations produce global luminance shifts.</li>
                <li>Overlapping nuclear contours blur boundary area and perimeter calculations.</li>
                <li>Unsupervised clusters isolate photometric modes, not biological malignancy.</li>
              </ul>
              <div className="p-3 rounded-xl bg-bio-950 border border-bio-800 text-[11px] text-amber-300 font-mono">
                NOTICE: Cluster indices must never be presented as confirmed tumor grades or clinical diagnoses.
              </div>
            </div>
          </Card>
        </div>

        <Card className="space-y-4 glass-panel-elevated">
          <CardHeader
            title="Historical K-means Label/Cluster Cross-tabulation"
            subtitle="Counts from kmeans_cluster_comparison.csv; cluster IDs are not biological classes"
            icon={<Database className="w-4 h-4 text-emerald-400" />}
          />
          {isKmeansLoading ? (
            <p className="text-xs text-slate-400">Loading historical cluster comparison…</p>
          ) : kmeansError ? (
            <p role="alert" className="text-xs text-amber-200">Historical cluster comparison unavailable: {kmeansError}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-xs">
                <thead className="bg-bio-950 font-mono text-slate-400">
                  <tr>{kmeansRows?.[0].map((header, index) => <th key={`${header}-${index}`} className="px-4 py-3">{index === 0 ? 'Reference label' : `Cluster ${header}`}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-bio-800/60 font-mono text-slate-300">
                  {kmeansRows?.slice(1).map((row) => (
                    <tr key={row[0]}><th scope="row" className="px-4 py-3 font-semibold text-slate-200">{row[0]}</th>{row.slice(1).map((count, index) => <td key={`${row[0]}-${index}`} className="px-4 py-3">{Number(count).toLocaleString()}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-amber-200">This is an archived unsupervised comparison table. Cluster IDs are arbitrary assignments and must not be interpreted as confirmed tumor grades or other verified biological classes.</p>
        </Card>
      </section>

      {/* Experimental whole-image candidate detection and model inference. */}
      <section className="rounded-2xl border border-bio-800 bg-bio-900/90 p-6 sm:p-8 space-y-5 glass-panel-elevated">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white font-mono">
              Analyze an Uploaded Image
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Upload a histopathology image to run experimental stain-threshold candidate detection, extract the eight per-candidate features, and request CNN / Decision Tree predictions. This detector is not validated instance segmentation; outputs are research-only, not diagnostic.
          </p>
          <p className="text-xs text-slate-400">
            Required Decision Tree input order: <code className="text-cyan-300">{dt?.features.map((feature) => feature.name).join(', ') ?? 'gray_mean, gray_std, red_mean, green_mean, blue_mean, area, perimeter, circularity'}</code>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/tiff,image/bmp,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedAnalysisFile(file);
                setAnalysisError(null);
                setAnalysisResult(null);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              icon={<UploadCloud className="h-4 w-4" />}
            >
              {selectedAnalysisFile ? 'Choose another image' : 'Choose histopathology image'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyzeImage}
              disabled={!selectedAnalysisFile}
              isLoading={isAnalyzing}
              icon={<Play className="h-3.5 w-3.5" />}
            >
              Analyze image
            </Button>
            {selectedAnalysisFile && (
              <span className="truncate text-xs text-slate-400">
                {selectedAnalysisFile.name} ({(selectedAnalysisFile.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
          <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-xs text-amber-100">
            Results are marked EXPERIMENTAL. Candidate counts and predictions can be wrong when nuclei overlap, stain intensity varies, or non-nuclear regions are detected. Do not use for clinical decisions.
          </div>
        </div>

        {analysisResult && (
          <div className="space-y-4 rounded-xl border border-bio-700 bg-bio-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-white">Image analysis results</h4>
              <span className="rounded-full border border-amber-700 bg-amber-950/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-200">Experimental · Not diagnostic</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-bio-800 p-3"><p className="text-[10px] uppercase text-slate-400">Candidates detected</p><p className="mt-1 text-2xl font-semibold text-white">{analysisResult.candidate_count}</p></div>
              <div className="rounded-lg border border-bio-800 p-3"><p className="text-[10px] uppercase text-slate-400">CNN model</p><p className="mt-1 text-sm font-semibold text-white">{analysisResult.cnn_available ? 'Available' : 'Unavailable'}</p></div>
              <div className="rounded-lg border border-bio-800 p-3"><p className="text-[10px] uppercase text-slate-400">Decision Tree</p><p className="mt-1 text-sm font-semibold text-white">{analysisResult.decision_tree_available ? 'Available' : 'Unavailable'}</p></div>
              <div className="rounded-lg border border-bio-800 p-3"><p className="text-[10px] uppercase text-slate-400">Image size</p><p className="mt-1 text-sm font-semibold text-white">{analysisResult.image_size?.[0]} × {analysisResult.image_size?.[1]}</p></div>
            </div>
            {analysisResult.annotated_image && <div className="space-y-2"><p className="text-xs text-slate-300">Detected candidates (yellow boxes)</p><img src={analysisResult.annotated_image} alt="Experimental candidate detection overlay" className="max-h-[34rem] w-full rounded-lg border border-bio-800 object-contain bg-black" /></div>}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2"><h5 className="text-xs font-semibold text-white">Decision Tree class counts</h5>{Object.entries(analysisResult.class_counts || {}).map(([name, count]) => <div key={name} className="flex justify-between border-b border-bio-800/70 py-1.5 text-xs"><span className="text-slate-300">{name}</span><span className="font-mono text-white">{String(count)}</span></div>)}{!analysisResult.decision_tree_available && <p className="text-[11px] text-amber-200">{analysisResult.decision_tree_reason || 'Decision Tree unavailable or feature order could not be verified.'}</p>}</div>
              <div className="space-y-2"><h5 className="text-xs font-semibold text-white">Per-candidate predictions</h5><div className="max-h-64 overflow-auto rounded-lg border border-bio-800"><table className="w-full text-left text-[11px]"><thead className="sticky top-0 bg-bio-900 text-slate-400"><tr><th className="p-2">ID</th><th className="p-2">Decision Tree</th><th className="p-2">CNN</th><th className="p-2">CNN confidence</th></tr></thead><tbody>{(analysisResult.candidates || []).map((item: any) => <tr key={item.id} className="border-t border-bio-800/70"><td className="p-2 text-slate-300">{item.id}</td><td className="p-2 text-slate-300">{item.decision_tree?.predicted || '—'}</td><td className="p-2 text-slate-300">{item.cnn?.predicted || '—'}</td><td className="p-2 text-slate-300">{typeof item.cnn?.confidence === 'number' ? `${(item.cnn.confidence * 100).toFixed(1)}%` : '—'}</td></tr>)}</tbody></table></div>{!analysisResult.cnn_available && <p className="text-[11px] text-amber-200">{analysisResult.cnn_reason || 'CNN unavailable.'}</p>}</div>
            </div>
            <p className="rounded-lg border border-amber-800/70 bg-amber-950/30 p-3 text-[11px] leading-relaxed text-amber-100">{analysisResult.warning}</p>
          </div>
        )}

        {analysisError && (
          <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/50 p-4 text-xs text-rose-100">
            <p className="mb-1 font-semibold">Image analysis unavailable</p>
            <p>{analysisError}</p>
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FlaskConical,
  Play,
  Download,
  Sliders,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
  ShieldCheck,
  FileImage
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Slider } from '../components/ui/Slider';
import { ImageCompareSlider } from '../components/image/ImageCompareSlider';
import { ImageZoomViewer } from '../components/image/ImageZoomViewer';
import { HistogramChart } from '../components/image/HistogramChart';
import {
  PipelineStep,
  PipelineRunResponse,
  IvpOperationType,
  PipelinePreset
} from '../types';
import { runAnalysisPipeline, fetchPipelinePresets } from '../services/api';

const DEFAULT_STEPS: PipelineStep[] = [
  {
    step_id: 'step_1',
    title: 'Grayscale Conversion',
    operation: 'grayscale',
    gray_mode: 'luminance',
    enabled: true,
  },
  {
    step_id: 'step_2',
    title: 'CLAHE Contrast Equalization',
    operation: 'clahe',
    clahe_clip_limit: 2.5,
    clahe_tile_grid: 8,
    enabled: true,
  },
  {
    step_id: 'step_3',
    title: 'Gaussian Noise Filter',
    operation: 'gaussian_blur',
    gaussian_kernel: 5,
    gaussian_sigma: 1.2,
    enabled: true,
  },
  {
    step_id: 'step_4',
    title: 'Otsu Binarization',
    operation: 'otsu_threshold',
    threshold_invert: true,
    enabled: true,
  },
  {
    step_id: 'step_5',
    title: 'Morphological Opening',
    operation: 'morphology',
    morph_op: 'opening',
    morph_kernel_shape: 'ellipse',
    morph_kernel_size: 3,
    morph_iterations: 1,
    enabled: true,
  },
];

export const AnalysisLabPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>(DEFAULT_STEPS);
  const [presets, setPresets] = useState<PipelinePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nuclei_binarization');
  const [activeTab, setActiveTab] = useState<'compare' | 'zoom' | 'histogram'>('compare');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineRunResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch presets on load
  useEffect(() => {
    fetchPipelinePresets()
      .then((data) => {
        if (data.length > 0) setPresets(data);
      })
      .catch(() => {
        // Fallback default presets already active
      });
  }, []);

  // Handle file selection and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (15 MB max)
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Payload exceeds 15 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|tiff?|bmp)$/i)) {
      setError("Unsupported format. Please upload a PNG, JPEG, TIFF, or BMP digital microscopy tile.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPipelineResult(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({ target: { files: dataTransfer.files } } as any);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setSteps(preset.steps);
      setPipelineResult(null);
    }
  };

  const handleToggleStep = (stepId: string) => {
    setSteps((prev: PipelineStep[]) =>
      prev.map((s: PipelineStep) => (s.step_id === stepId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleUpdateStepParam = (stepId: string, param: string, value: any) => {
    setSteps((prev: PipelineStep[]) =>
      prev.map((s: PipelineStep) => (s.step_id === stepId ? { ...s, [param]: value } : s))
    );
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps((prev: PipelineStep[]) => prev.filter((s: PipelineStep) => s.step_id !== stepId));
  };

  const handleAddStep = (operation: IvpOperationType) => {
    const newStep: PipelineStep = {
      step_id: `step_${Date.now()}`,
      title: `${operation.toUpperCase()} Stage`,
      operation,
      enabled: true,
      clahe_clip_limit: 2.0,
      clahe_tile_grid: 8,
      gaussian_kernel: 5,
      gaussian_sigma: 1.5,
      median_kernel: 5,
      bilateral_d: 9,
      bilateral_sigma_color: 75.0,
      bilateral_sigma_space: 75.0,
      threshold_invert: false,
      adaptive_method: 'gaussian',
      adaptive_block_size: 11,
      adaptive_c: 2.0,
      morph_op: 'opening',
      morph_kernel_shape: 'ellipse',
      morph_kernel_size: 3,
      morph_iterations: 1,
      canny_thresh1: 50.0,
      canny_thresh2: 150.0,
      sobel_ksize: 3,
    };
    setSteps((prev: PipelineStep[]) => [...prev, newStep]);
  };

  const handleRunPipeline = async () => {
    if (!selectedFile) {
      setError('Please select or drag-and-drop a histopathology image first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await runAnalysisPipeline(selectedFile, steps);
      setPipelineResult(result);
    } catch (err: any) {
      setError(err.message || 'Pipeline execution failed on backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!pipelineResult) return;
    const a = document.createElement('a');
    a.href = pipelineResult.final_image_base64;
    a.download = `nucyra_pipeline_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Page Header with Optical Station Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bio-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
              Analysis Lab
            </h1>
            <Badge variant="cyan" size="sm">
              OpenCV 4.10+ Native
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure and execute multi-stage digital histopathology image processing pipelines in volatile RAM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleRunPipeline}
            isLoading={isLoading}
            disabled={!selectedFile}
            icon={<Play className="w-4 h-4 fill-white" />}
            className="shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] px-5"
          >
            Execute Pipeline
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-900/60"
            >
              DISMISS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Analysis Station Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Image Ingestion & Pipeline Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Ingestion Dropzone */}
          <Card className="glass-panel-elevated">
            <CardHeader
              title="Image Ingestion Station"
              subtitle="Upload high-power histopathology tissue tile"
              icon={<UploadCloud className="w-4 h-4 text-cyan-400" />}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.tiff,.tif,.bmp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3.5 group select-none ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                    : 'border-bio-750 hover:border-cyan-500/70 bg-bio-950/70'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-bio-850/80 border border-bio-700 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 group-hover:scale-110 transition-all shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200 font-mono tracking-wide">
                    DROP MICROSCOPY TILE HERE
                  </p>
                  <p className="text-[11px] text-slate-400">
                    or click to browse filesystem
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-bio-900 border border-bio-800">PNG</span>
                  <span className="px-2 py-0.5 rounded bg-bio-900 border border-bio-800">JPEG</span>
                  <span className="px-2 py-0.5 rounded bg-bio-900 border border-bio-800">TIFF</span>
                  <span className="px-2 py-0.5 rounded bg-bio-900 border border-bio-800">BMP</span>
                </div>
                <Badge variant="teal" size="sm">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  Volatile RAM Only &bull; Zero Disk Persistence
                </Badge>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-bio-800 bg-bio-950 flex items-center justify-center reticle-corner shadow-inner">
                  <img
                    src={previewUrl}
                    alt="Loaded Tile"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setPipelineResult(null);
                      }}
                      className="p-1.5 rounded-lg bg-bio-900/90 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-bio-800 transition-colors shadow-md"
                      title="Clear image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-2.5 rounded-xl bg-bio-950 border border-bio-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <FileImage className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate text-slate-200 font-semibold">{selectedFile.name}</span>
                    </div>
                    <span className="text-cyan-400 shrink-0 font-bold">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Pipeline Configuration Studio */}
          <Card className="glass-panel-elevated">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-bio-800/80">
              <div className="flex items-center gap-2 font-mono">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Pipeline Execution Stack</h3>
              </div>

              {presets.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">PRESET:</span>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handleApplyPreset(e.target.value)}
                    className="bg-bio-900 text-cyan-300 text-xs rounded-lg border border-bio-700 px-2 py-1 font-mono focus:outline-none focus:border-cyan-400"
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Stage Pipeline Cards */}
            <div className="space-y-3">
              {steps.map((step: PipelineStep, idx: number) => (
                <div
                  key={step.step_id}
                  className={`p-3.5 rounded-xl border transition-all duration-200 ${
                    step.enabled
                      ? 'bg-bio-850/90 border-bio-700/80 shadow-md'
                      : 'bg-bio-950/40 border-bio-850 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-cyan-400 font-bold w-5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="checkbox"
                        checked={step.enabled}
                        onChange={() => handleToggleStep(step.step_id)}
                        className="rounded bg-bio-900 border-bio-700 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-100 font-mono">
                        {step.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={step.enabled ? 'cyan' : 'neutral'} size="sm">
                        {step.operation}
                      </Badge>
                      <button
                        onClick={() => handleRemoveStep(step.step_id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove stage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contextual Parameter Controls */}
                  {step.enabled && (
                    <div className="pt-2.5 border-t border-bio-800/80 space-y-3 mt-2 text-xs">
                      {step.operation === 'clahe' && (
                        <div className="space-y-2.5">
                          <Slider
                            label="Clip Limit"
                            value={step.clahe_clip_limit || 2.0}
                            min={0.5}
                            max={10.0}
                            step={0.5}
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'clahe_clip_limit', val)
                            }
                          />
                          <Slider
                            label="Tile Grid Matrix"
                            value={step.clahe_tile_grid || 8}
                            min={2}
                            max={16}
                            step={2}
                            unit="px"
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'clahe_tile_grid', val)
                            }
                          />
                        </div>
                      )}

                      {step.operation === 'gaussian_blur' && (
                        <div className="space-y-2.5">
                          <Slider
                            label="Kernel Size (odd)"
                            value={step.gaussian_kernel || 5}
                            min={1}
                            max={15}
                            step={2}
                            unit="px"
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'gaussian_kernel', val)
                            }
                          />
                          <Slider
                            label="Gaussian Sigma"
                            value={step.gaussian_sigma || 1.5}
                            min={0.1}
                            max={5.0}
                            step={0.1}
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'gaussian_sigma', val)
                            }
                          />
                        </div>
                      )}

                      {step.operation === 'otsu_threshold' && (
                        <div className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-300 font-mono text-[11px]">Invert Mask (Nuclei White = 255)</span>
                          <input
                            type="checkbox"
                            checked={step.threshold_invert || false}
                            onChange={(e) =>
                              handleUpdateStepParam(
                                step.step_id,
                                'threshold_invert',
                                e.target.checked
                              )
                            }
                            className="rounded bg-bio-900 border-bio-700 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                        </div>
                      )}

                      {step.operation === 'morphology' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-mono text-[11px]">Operator</span>
                            <select
                              value={step.morph_op || 'opening'}
                              onChange={(e) =>
                                handleUpdateStepParam(step.step_id, 'morph_op', e.target.value)
                              }
                              className="bg-bio-900 text-cyan-300 text-xs rounded-lg border border-bio-700 px-2 py-1 font-mono"
                            >
                              <option value="opening">Opening (Erode then Dilate)</option>
                              <option value="closing">Closing (Dilate then Erode)</option>
                              <option value="erosion">Erosion (Contour Shrink)</option>
                              <option value="dilation">Dilation (Contour Grow)</option>
                            </select>
                          </div>
                          <Slider
                            label="Kernel Window Size"
                            value={step.morph_kernel_size || 3}
                            min={1}
                            max={9}
                            step={2}
                            unit="px"
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'morph_kernel_size', val)
                            }
                          />
                        </div>
                      )}

                      {step.operation === 'canny' && (
                        <div className="space-y-2.5">
                          <Slider
                            label="Lower Hysteresis Threshold"
                            value={step.canny_thresh1 || 50}
                            min={0}
                            max={200}
                            step={10}
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'canny_thresh1', val)
                            }
                          />
                          <Slider
                            label="Upper Hysteresis Threshold"
                            value={step.canny_thresh2 || 150}
                            min={50}
                            max={255}
                            step={10}
                            onChange={(val) =>
                              handleUpdateStepParam(step.step_id, 'canny_thresh2', val)
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Append Stage Quick Bar */}
            <div className="mt-4 pt-3.5 border-t border-bio-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px]">APPEND STAGE:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleAddStep('clahe')}
                  className="px-2 py-1 rounded bg-bio-900 hover:bg-bio-850 text-cyan-300 border border-bio-800 hover:border-cyan-700 transition-colors text-[11px]"
                >
                  + CLAHE
                </button>
                <button
                  onClick={() => handleAddStep('gaussian_blur')}
                  className="px-2 py-1 rounded bg-bio-900 hover:bg-bio-850 text-teal-300 border border-bio-800 hover:border-teal-700 transition-colors text-[11px]"
                >
                  + Blur
                </button>
                <button
                  onClick={() => handleAddStep('otsu_threshold')}
                  className="px-2 py-1 rounded bg-bio-900 hover:bg-bio-850 text-cyan-300 border border-bio-800 hover:border-cyan-700 transition-colors text-[11px]"
                >
                  + Otsu
                </button>
                <button
                  onClick={() => handleAddStep('canny')}
                  className="px-2 py-1 rounded bg-bio-900 hover:bg-bio-850 text-violet-300 border border-bio-800 hover:border-violet-700 transition-colors text-[11px]"
                >
                  + Canny
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: High-Power Viewing Station & Quantitative Audit (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="glass-panel-elevated">
            {/* View Station Mode Bar */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-bio-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-bio-950 p-1 rounded-xl border border-bio-800 text-xs font-mono select-none">
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'compare'
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Split Compare
                </button>
                <button
                  onClick={() => setActiveTab('zoom')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'zoom'
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Microscopy Zoom
                </button>
                <button
                  onClick={() => setActiveTab('histogram')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === 'histogram'
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Intensity Spectra
                </button>
              </div>

              {pipelineResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadResult}
                  icon={<Download className="w-3.5 h-3.5" />}
                  className="font-mono text-xs"
                >
                  Export PNG
                </Button>
              )}
            </div>

            {/* Viewport Canvas */}
            {!previewUrl ? (
              <div className="aspect-[4/3] rounded-2xl border border-bio-800 bg-bio-950/70 flex flex-col items-center justify-center p-8 text-center space-y-3.5 reticle-corner">
                <div className="w-14 h-14 rounded-2xl bg-bio-900 border border-bio-800 flex items-center justify-center text-slate-500 shadow-inner">
                  <FlaskConical className="w-7 h-7 text-bio-500" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-semibold text-slate-200 font-mono">
                    AWAITING TILE INGESTION
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload a histopathology biopsy tile on the left to run OpenCV image processing in memory and estimate connected-component candidates.
                  </p>
                </div>
              </div>
            ) : pipelineResult ? (
              <div>
                {activeTab === 'compare' && (
                  <ImageCompareSlider
                    originalSrc={previewUrl}
                    processedSrc={pipelineResult.final_image_base64}
                    originalLabel="Original Tissue"
                    processedLabel="Final Pipeline Stage"
                  />
                )}

                {activeTab === 'zoom' && (
                  <ImageZoomViewer
                    src={pipelineResult.final_image_base64}
                    alt="High-Power Cellular Inspection"
                  />
                )}

                {activeTab === 'histogram' && (
                  <div className="space-y-4">
                    <HistogramChart
                      histogram={pipelineResult.final_metrics.histogram}
                      title="Processed Output Intensity Profile"
                    />
                    <HistogramChart
                      histogram={pipelineResult.original_metrics.histogram}
                      title="Input Reference Intensity Profile"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl border border-bio-800 bg-bio-950 flex flex-col items-center justify-center p-8 text-center space-y-3 reticle-corner shadow-inner">
                <img
                  src={previewUrl}
                  alt="Original Tile Preview"
                  className="max-h-72 object-contain rounded-xl border border-bio-800"
                />
                <p className="text-xs text-slate-400 font-mono">
                  Stage initialized. Click <strong className="text-cyan-400">Execute Pipeline</strong> above to process.
                </p>
              </div>
            )}
          </Card>

          {/* Quantitative Instrumentation Metrics */}
          {pipelineResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <Card className="glass-panel-elevated">
                <CardHeader
                  title="Quantitative Biomedical Telemetry"
                  subtitle="Mathematically verified statistical image properties"
                  icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-mono">Mean Intensity &mu;</p>
                    <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">
                      {pipelineResult.final_metrics.mean_intensity}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Scale: 0–255 a.u.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-mono">RMS Contrast &sigma;</p>
                    <p className="text-xl font-bold text-cyan-300 font-mono mt-0.5">
                      {pipelineResult.final_metrics.std_intensity}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Standard Deviation</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-mono">Shannon Entropy H</p>
                    <p className="text-xl font-bold text-teal-300 font-mono mt-0.5">
                      {pipelineResult.final_metrics.shannon_entropy}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Bits per pixel</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-mono">Michelson Contrast</p>
                    <p className="text-xl font-bold text-slate-100 font-mono mt-0.5">
                      {pipelineResult.final_metrics.michelson_contrast}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">(Imax-Imin)/(Imax+Imin)</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-mono">Candidate Nuclei</p>
                    <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                      {pipelineResult.nuclei_candidates_detected != null
                        ? pipelineResult.nuclei_candidates_detected
                        : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">8-conn (15&le;A&le;5000px)</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-mono">PSNR vs Baseline</p>
                    <p className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                      {pipelineResult.final_metrics.psnr_db != null
                        ? `${pipelineResult.final_metrics.psnr_db} dB`
                        : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">10 &middot; log10(255&sup2;/MSE)</p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-bio-950 border border-bio-800 text-[11px] text-slate-400 font-mono">
                  <p>{pipelineResult.scientific_disclaimer}</p>
                </div>
              </Card>

              {/* Execution Audit Trail */}
              <Card className="glass-panel-elevated">
                <CardHeader
                  title="Pipeline Stage Execution Audit"
                  subtitle="Wall-clock latency tracking per OpenCV routine"
                  icon={<Clock className="w-4 h-4 text-teal-400" />}
                />

                <div className="space-y-2">
                  {pipelineResult.intermediate_steps.map((st, i) => (
                    <div
                      key={st.step_id}
                      className="p-3 rounded-xl bg-bio-950 border border-bio-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold">
                          #{i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-100 font-mono">{st.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{st.note}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0 pl-3">
                        <span className="text-teal-400 font-bold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/60">
                          {st.latency_ms} ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

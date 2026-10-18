import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  UploadCloud,
  Sliders,
  Play,
  Info,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Slider } from '../components/ui/Slider';
import { ImageCompareSlider } from '../components/image/ImageCompareSlider';
import { HistogramChart } from '../components/image/HistogramChart';
import { IvpOperationType, IvpStepConfig, ProcessImageResponse } from '../types';
import { processSingleOperation } from '../services/api';

export const IvpStudioPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeOp, setActiveOp] = useState<IvpOperationType>('clahe');
  const [config, setConfig] = useState<IvpStepConfig>({
    operation: 'clahe',
    gray_mode: 'luminance',
    clahe_clip_limit: 2.5,
    clahe_tile_grid: 8,
    gaussian_kernel: 5,
    gaussian_sigma: 1.5,
    median_kernel: 5,
    bilateral_d: 9,
    bilateral_sigma_color: 75.0,
    bilateral_sigma_space: 75.0,
    threshold_invert: true,
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessImageResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const operations: { id: IvpOperationType; label: string; category: string; desc: string }[] = [
    { id: 'grayscale', label: 'Grayscale & Stain Deconvolution', category: 'Color', desc: 'Rec.601 luminance or optical density hematoxylin absorption.' },
    { id: 'clahe', label: 'CLAHE Contrast Equalization', category: 'Contrast', desc: 'Contrast Limited Adaptive Histogram Equalization.' },
    { id: 'equalize_hist', label: 'Global Histogram Equalization', category: 'Contrast', desc: 'Full dynamic range intensity redistribution.' },
    { id: 'gaussian_blur', label: 'Gaussian Noise Smoothing', category: 'Filter', desc: 'Attenuates high-frequency sensor noise.' },
    { id: 'median_blur', label: 'Median Despeckle Filter', category: 'Filter', desc: 'Edge-preserving non-linear impulse noise removal.' },
    { id: 'bilateral_filter', label: 'Bilateral Edge Preservation', category: 'Filter', desc: 'Smooths chromatic textures while keeping boundaries crisp.' },
    { id: 'otsu_threshold', label: "Otsu's Optimal Binarization", category: 'Threshold', desc: 'Minimizes intra-class intensity variance.' },
    { id: 'adaptive_threshold', label: 'Local Adaptive Threshold', category: 'Threshold', desc: 'Windowed thresholding correcting non-uniform illumination.' },
    { id: 'morphology', label: 'Mathematical Morphology', category: 'Morphology', desc: 'Erosion, dilation, opening, and closing.' },
    { id: 'sobel', label: 'Sobel Spatial Gradient', category: 'Gradients', desc: 'First-order spatial derivative accentuating nuclear boundaries.' },
    { id: 'canny', label: 'Canny Multi-Stage Detector', category: 'Gradients', desc: 'Hysteresis and non-maximum suppression edge tracing.' },
  ];

  const handleSelectOp = (op: IvpOperationType) => {
    setActiveOp(op);
    setConfig((prev: IvpStepConfig) => ({ ...prev, operation: op }));
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError(`File size exceeds 15 MB limit.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleExecute = async () => {
    if (!selectedFile) {
      setError('Please upload or select an image tile first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await processSingleOperation(selectedFile, {
        ...config,
        operation: activeOp,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Operation failed on server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bio-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
              IVP Studio
            </h1>
            <Badge variant="teal" size="sm">
              Modular Algorithmic Workbench
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Test and calibrate foundational biomedical computer vision algorithms with immediate mathematical telemetry.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleExecute}
          isLoading={isLoading}
          disabled={!selectedFile}
          icon={<Play className="w-4 h-4 fill-white" />}
          className="shadow-[0_0_20px_-3px_rgba(20,184,166,0.4)] px-5"
        >
          Execute Algorithm
        </Button>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 font-mono text-xs font-semibold">
              DISMISS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Algorithm Catalog & Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Catalog */}
          <Card className="glass-panel-elevated">
            <CardHeader
              title="Algorithm Catalog"
              subtitle="Select OpenCV transformation"
              icon={<Layers className="w-4 h-4 text-teal-400" />}
            />

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {operations.map((op) => {
                const isSelected = activeOp === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => handleSelectOp(op.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 flex items-center justify-between font-mono select-none ${
                      isSelected
                        ? 'bg-teal-950/80 text-teal-300 border border-teal-700/80 shadow-md font-semibold'
                        : 'text-slate-300 hover:bg-bio-950 hover:text-white border border-transparent'
                    }`}
                  >
                    <div>
                      <p>{op.label}</p>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">{op.desc}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-bio-900 border border-bio-800 text-slate-400 shrink-0 ml-2">
                      {op.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Dynamic Hyperparameter Controls */}
          <Card className="glass-panel-elevated">
            <CardHeader
              title="Hyperparameter Tuning"
              subtitle="Algorithmic controls for selected filter"
              icon={<Sliders className="w-4 h-4 text-cyan-400" />}
            />

            <div className="space-y-4">
              {activeOp === 'grayscale' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 font-mono">
                    Conversion Model
                  </label>
                  <select
                    value={config.gray_mode || 'luminance'}
                    onChange={(e) =>
                      setConfig((prev: IvpStepConfig) => ({
                        ...prev,
                        gray_mode: e.target.value as any,
                      }))
                    }
                    className="w-full bg-bio-950 text-cyan-300 text-xs rounded-lg border border-bio-800 p-2 font-mono"
                  >
                    <option value="luminance">ITU-R BT.601 Luminance (0.299R + 0.587G + 0.114B)</option>
                    <option value="mean">Arithmetic Average RGB</option>
                    <option value="hematoxylin_approx">
                      Hematoxylin Optical Density (OD Green/Red Absorption)
                    </option>
                  </select>
                </div>
              )}

              {activeOp === 'clahe' && (
                <div className="space-y-3.5">
                  <Slider
                    label="Clip Limit"
                    value={config.clahe_clip_limit || 2.0}
                    min={0.5}
                    max={15.0}
                    step={0.5}
                    description="Limits contrast amplification slope to prevent background noise"
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, clahe_clip_limit: val }))
                    }
                  />
                  <Slider
                    label="Tile Grid Size"
                    value={config.clahe_tile_grid || 8}
                    min={2}
                    max={24}
                    step={2}
                    unit="px"
                    description="Local contextual pixel neighborhood size"
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, clahe_tile_grid: val }))
                    }
                  />
                </div>
              )}

              {activeOp === 'gaussian_blur' && (
                <div className="space-y-3.5">
                  <Slider
                    label="Kernel Window"
                    value={config.gaussian_kernel || 5}
                    min={1}
                    max={25}
                    step={2}
                    unit="px"
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, gaussian_kernel: val }))
                    }
                  />
                  <Slider
                    label="Gaussian Sigma"
                    value={config.gaussian_sigma || 1.5}
                    min={0.2}
                    max={5.0}
                    step={0.1}
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, gaussian_sigma: val }))
                    }
                  />
                </div>
              )}

              {activeOp === 'median_blur' && (
                <Slider
                  label="Aperture Linear Size"
                  value={config.median_kernel || 5}
                  min={3}
                  max={25}
                  step={2}
                  unit="px"
                  description="Odd integer window size for non-linear median filtering"
                  onChange={(val) =>
                    setConfig((prev: IvpStepConfig) => ({ ...prev, median_kernel: val }))
                  }
                />
              )}

              {activeOp === 'bilateral_filter' && (
                <div className="space-y-3.5">
                  <Slider
                    label="Diameter (d)"
                    value={config.bilateral_d || 9}
                    min={1}
                    max={21}
                    step={2}
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, bilateral_d: val }))
                    }
                  />
                  <Slider
                    label="Color Sigma"
                    value={config.bilateral_sigma_color || 75}
                    min={10}
                    max={150}
                    step={5}
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, bilateral_sigma_color: val }))
                    }
                  />
                </div>
              )}

              {activeOp === 'otsu_threshold' && (
                <div className="flex items-center justify-between text-xs py-2 font-mono">
                  <span className="text-slate-300">Invert Threshold Mask</span>
                  <input
                    type="checkbox"
                    checked={config.threshold_invert || false}
                    onChange={(e) =>
                      setConfig((prev: IvpStepConfig) => ({
                        ...prev,
                        threshold_invert: e.target.checked,
                      }))
                    }
                    className="rounded bg-bio-950 border-bio-700 text-cyan-500 cursor-pointer w-4 h-4"
                  />
                </div>
              )}

              {activeOp === 'morphology' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-mono">Operator</label>
                    <select
                      value={config.morph_op || 'opening'}
                      onChange={(e) =>
                        setConfig((prev: IvpStepConfig) => ({ ...prev, morph_op: e.target.value as any }))
                      }
                      className="w-full bg-bio-950 text-cyan-300 text-xs rounded-lg border border-bio-800 p-2 font-mono"
                    >
                      <option value="opening">Opening (Erosion &rarr; Dilation)</option>
                      <option value="closing">Closing (Dilation &rarr; Erosion)</option>
                      <option value="erosion">Erosion (Contour Shrink)</option>
                      <option value="dilation">Dilation (Contour Grow)</option>
                      <option value="gradient">Morphological Gradient (Outer Boundary)</option>
                    </select>
                  </div>
                  <Slider
                    label="Structuring Element Size"
                    value={config.morph_kernel_size || 3}
                    min={1}
                    max={15}
                    step={2}
                    unit="px"
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, morph_kernel_size: val }))
                    }
                  />
                </div>
              )}

              {activeOp === 'canny' && (
                <div className="space-y-3.5">
                  <Slider
                    label="Low Hysteresis Threshold"
                    value={config.canny_thresh1 || 50}
                    min={0}
                    max={200}
                    step={10}
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, canny_thresh1: val }))
                    }
                  />
                  <Slider
                    label="High Hysteresis Threshold"
                    value={config.canny_thresh2 || 150}
                    min={50}
                    max={255}
                    step={10}
                    onChange={(val) =>
                      setConfig((prev: IvpStepConfig) => ({ ...prev, canny_thresh2: val }))
                    }
                  />
                </div>
              )}

              {activeOp === 'sobel' && (
                <Slider
                  label="Sobel Kernel Aperture"
                  value={config.sobel_ksize || 3}
                  min={1}
                  max={7}
                  step={2}
                  unit="px"
                  onChange={(val) =>
                    setConfig((prev: IvpStepConfig) => ({ ...prev, sobel_ksize: val }))
                  }
                />
              )}
            </div>
          </Card>

          {/* Quick Select Image Tile */}
          <Card className="glass-panel-elevated">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.tiff,.tif,.bmp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="md"
              className="w-full font-mono text-xs"
              onClick={() => fileInputRef.current?.click()}
              icon={<UploadCloud className="w-4 h-4" />}
            >
              {selectedFile ? 'Switch Image Tile' : 'Ingest Histology Tile'}
            </Button>
            {selectedFile && (
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5 px-1">
                <span className="truncate max-w-[200px] text-slate-200">{selectedFile.name}</span>
                <span className="text-cyan-400">{(selectedFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Interactive Microscopy Canvas & Metrics (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="glass-panel-elevated">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-bio-800/80 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="cyan" size="sm">
                  {activeOp.toUpperCase()}
                </Badge>
                <span className="text-slate-400">BENCH CANVAS</span>
              </div>

              {result && (
                <span className="text-teal-400 font-bold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800">
                  Latency: {result.metrics.execution_time_ms} ms
                </span>
              )}
            </div>

            {!previewUrl ? (
              <div className="aspect-[4/3] rounded-2xl border border-bio-800 bg-bio-950/70 flex flex-col items-center justify-center p-8 text-center space-y-3.5 reticle-corner">
                <Layers className="w-12 h-12 text-bio-600" />
                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-semibold text-slate-200 font-mono">
                    IVP WORKBENCH READY
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select a histopathology tile and click <strong className="text-teal-400">Execute Algorithm</strong> to run OpenCV computations with before/after split inspection.
                  </p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <ImageCompareSlider
                  originalSrc={previewUrl}
                  processedSrc={result.image_base64}
                  originalLabel="Input Image"
                  processedLabel={`Applied: ${activeOp}`}
                />

                {result.scientific_note && (
                  <div className="p-3.5 rounded-xl bg-bio-950 border border-bio-800 text-xs text-slate-300 flex items-start gap-2.5 font-sans">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{result.scientific_note}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl border border-bio-800 bg-bio-950 flex flex-col items-center justify-center p-8 text-center space-y-3 reticle-corner">
                <img
                  src={previewUrl}
                  alt="Original Tile Preview"
                  className="max-h-72 object-contain rounded-xl border border-bio-800"
                />
                <p className="text-xs text-slate-400 font-mono">
                  Image ready. Click <strong className="text-teal-400">Execute Algorithm</strong> above.
                </p>
              </div>
            )}
          </Card>

          {/* Quantitative Metrics & Histograms */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="glass-panel-elevated">
                <CardHeader
                  title="Algorithmic Properties"
                  subtitle="Evaluated on transformed pixel matrix"
                  icon={<Sparkles className="w-4 h-4 text-teal-400" />}
                />

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-bio-950 border border-bio-800">
                    <span className="text-slate-400 text-[11px]">Mean &mu;</span>
                    <p className="font-bold text-slate-100 text-lg mt-0.5">
                      {result.metrics.mean_intensity}
                    </p>
                    <p className="text-[10px] text-slate-500">0–255 scale</p>
                  </div>

                  <div className="p-3 rounded-xl bg-bio-950 border border-bio-800">
                    <span className="text-slate-400 text-[11px]">RMS Contrast &sigma;</span>
                    <p className="font-bold text-cyan-300 text-lg mt-0.5">
                      {result.metrics.std_intensity}
                    </p>
                    <p className="text-[10px] text-slate-500">Standard Deviation</p>
                  </div>

                  <div className="p-3 rounded-xl bg-bio-950 border border-bio-800">
                    <span className="text-slate-400 text-[11px]">Entropy H</span>
                    <p className="font-bold text-teal-300 text-lg mt-0.5">
                      {result.metrics.shannon_entropy}
                    </p>
                    <p className="text-[10px] text-slate-500">Bits per pixel</p>
                  </div>

                  <div className="p-3 rounded-xl bg-bio-950 border border-bio-800">
                    <span className="text-slate-400 text-[11px]">PSNR vs Input</span>
                    <p className="font-bold text-amber-400 text-lg mt-0.5">
                      {result.metrics.psnr_db != null ? `${result.metrics.psnr_db} dB` : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500">Signal-to-Noise</p>
                  </div>
                </div>
              </Card>

              <Card className="glass-panel-elevated">
                <HistogramChart
                  histogram={result.metrics.histogram}
                  title="Output Intensity Profile"
                />
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

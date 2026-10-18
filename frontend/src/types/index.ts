export interface ImageMetrics {
  width: number;
  height: number;
  channels: number;
  mean_intensity: number;
  std_intensity: number;
  michelson_contrast: number;
  shannon_entropy: number;
  histogram: number[];
  rgb_histograms?: {
    r: number[];
    g: number[];
    b: number[];
  } | null;
  foreground_ratio?: number | null;
  candidate_nuclei_count?: number | null;
  psnr_db?: number | null;
  execution_time_ms: number;
}

export type IvpOperationType =
  | 'grayscale'
  | 'clahe'
  | 'equalize_hist'
  | 'gaussian_blur'
  | 'median_blur'
  | 'bilateral_filter'
  | 'otsu_threshold'
  | 'adaptive_threshold'
  | 'morphology'
  | 'sobel'
  | 'canny';

export interface IvpStepConfig {
  operation: IvpOperationType;
  gray_mode?: 'luminance' | 'mean' | 'hematoxylin_approx';
  clahe_clip_limit?: number;
  clahe_tile_grid?: number;
  gaussian_kernel?: number;
  gaussian_sigma?: number;
  median_kernel?: number;
  bilateral_d?: number;
  bilateral_sigma_color?: number;
  bilateral_sigma_space?: number;
  threshold_invert?: boolean;
  adaptive_method?: 'gaussian' | 'mean';
  adaptive_block_size?: number;
  adaptive_c?: number;
  morph_op?: 'opening' | 'closing' | 'erosion' | 'dilation' | 'gradient' | 'tophat';
  morph_kernel_shape?: 'ellipse' | 'rect' | 'cross';
  morph_kernel_size?: number;
  morph_iterations?: number;
  canny_thresh1?: number;
  canny_thresh2?: number;
  sobel_ksize?: number;
}

export interface ProcessImageResponse {
  success: boolean;
  image_base64: string;
  format: string;
  operation_applied: string;
  metrics: ImageMetrics;
  reference_metrics?: ImageMetrics | null;
  scientific_note?: string | null;
}

export interface PipelineStep extends IvpStepConfig {
  step_id: string;
  title: string;
  enabled: boolean;
}

export interface IntermediateStepResult {
  step_id: string;
  title: string;
  operation: string;
  note: string;
  latency_ms: number;
  mean_intensity: number;
  shannon_entropy: number;
}

export interface PipelineRunResponse {
  success: boolean;
  final_image_base64: string;
  intermediate_steps: IntermediateStepResult[];
  final_metrics: ImageMetrics;
  original_metrics: ImageMetrics;
  nuclei_candidates_detected?: number | null;
  scientific_disclaimer: string;
}

export interface PipelinePreset {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
}

export interface HealthStatus {
  status: string;
  service: string;
  runtime: {
    opencv_version: string;
    numpy_version: string;
    scikit_learn_version: string;
  };
  limits: {
    max_upload_size_mb: number;
    max_image_dimension_px: number;
    allowed_formats: string[];
  };
  models_status: {
    all_loaded: boolean;
    models: Record<string, boolean>;
  };
}

export interface ModelAssetStatus {
  filename: string;
  expected_path: string;
  is_present: boolean;
  is_loaded: boolean;
  size_bytes: number;
  load_error: string | null;
  load_warnings: string[];
}

export interface PerNucleusFeature {
  name: string;
  category: 'intensity' | 'chromatic' | 'morphometric';
  unit: string;
  description: string;
}

export interface HistoricalBenchmarks {
  decision_tree: {
    reported_accuracy_percent: number;
    feature_count: number;
    features: PerNucleusFeature[];
    validation_note: string;
  };
  kmeans: {
    reported_ari: number;
    reported_nmi: number;
    unsupervised_disclaimer: string;
  };
  scientific_integrity_notice: string;
}

export interface AiMetricsResponse {
  status: {
    all_models_present: boolean;
    all_models_loaded: boolean;
    models_directory: string;
    models: Record<string, ModelAssetStatus>;
    features_defined: PerNucleusFeature[];
  };
  historical_benchmarks: HistoricalBenchmarks;
}

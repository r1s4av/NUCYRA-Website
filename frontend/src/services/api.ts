import {
  HealthStatus,
  ProcessImageResponse,
  IvpStepConfig,
  PipelineStep,
  PipelineRunResponse,
  PipelinePreset,
  AiMetricsResponse
} from '../types';

const API_BASE = '/api';

export async function checkBackendHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function processSingleOperation(
  file: File,
  config: IvpStepConfig
): Promise<ProcessImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('config_json', JSON.stringify(config));

  const res = await fetch(`${API_BASE}/ivp/process`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Unknown error occurred' }));
    throw new Error(errorData.detail || `Processing failed with status ${res.status}`);
  }

  return res.json();
}

export async function runAnalysisPipeline(
  file: File,
  steps: PipelineStep[]
): Promise<PipelineRunResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pipeline_json', JSON.stringify(steps));

  const res = await fetch(`${API_BASE}/analysis/pipeline`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Analysis pipeline failed' }));
    throw new Error(errorData.detail || `Pipeline execution failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchPipelinePresets(): Promise<PipelinePreset[]> {
  const res = await fetch(`${API_BASE}/analysis/presets`);
  if (!res.ok) {
    throw new Error('Failed to fetch presets');
  }
  const data = await res.json();
  return data.presets || [];
}

export async function fetchAiMetrics(): Promise<AiMetricsResponse> {
  const res = await fetch(`${API_BASE}/ai/metrics`);
  if (!res.ok) {
    throw new Error('Failed to fetch AI evaluation metrics');
  }
  return res.json();
}

export async function analyzeUploadedImage(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/ai/predict`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({ detail: 'The backend returned an unreadable response.' }));
  if (!res.ok) {
    const detail = data.detail;
    const message = typeof detail === 'string' ? detail : detail?.message;
    throw new Error(message || `Image analysis failed with status ${res.status}.`);
  }

  return data;
}

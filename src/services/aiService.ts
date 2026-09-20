import {
  SingleImageAnalysisResult,
  ComparisonAnalysisResult,
  ChatMessage,
  DermatologyClinic,
  SkinTimelineFrame,
  DermaLensEvaluation
} from '../types';

export async function evaluateWithDermaLens(
  imageUrl: string,
  isFaceScan: boolean = true
): Promise<DermaLensEvaluation> {
  const res = await fetch('/api/ai/dermalens-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      isFaceScan,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `DermaLens evaluation failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.evaluation as DermaLensEvaluation;
}

export async function analyzeSingleSkinImage(
  imageUrl: string,
  conditionHint?: string,
  notes?: string,
  bodyLocation?: string,
  erythemaIndex?: number,
  severityScore?: number,
  dermaLensEvaluation?: DermaLensEvaluation
): Promise<SingleImageAnalysisResult> {
  const res = await fetch('/api/ai/analyze-single', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      conditionHint,
      notes,
      bodyLocation,
      erythemaIndex,
      severityScore,
      dermaLensEvaluation,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `AI analysis failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.analysis as SingleImageAnalysisResult;
}

export async function compareSkinFrames(
  baselineImageUrl: string,
  latestImageUrl: string,
  baselineLabel: string,
  latestLabel: string,
  conditionName: string,
  daysElapsed?: number,
  baselineErythema?: number,
  latestErythema?: number
): Promise<ComparisonAnalysisResult> {
  const res = await fetch('/api/ai/compare-frames', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baselineImageUrl,
      latestImageUrl,
      baselineLabel,
      latestLabel,
      conditionName,
      daysElapsed,
      baselineErythema,
      latestErythema,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `Comparison failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.comparison as ComparisonAnalysisResult;
}

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  activePhotos: SkinTimelineFrame[],
  clinicalContext: {
    condition?: string;
    activeLabel?: string;
    latestEI?: number;
    severity?: string;
  }
): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory,
      activePhotos: activePhotos.map((p) => ({
        label: p.label,
        imageUrl: p.imageUrl,
        week: p.week,
        day: p.day,
        erythemaIndex: p.erythemaIndex,
      })),
      clinicalContext,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `Chat failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function fetchClinics(query?: string, state?: string): Promise<DermatologyClinic[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (state) params.append('state', state);

  const res = await fetch(`/api/clinics?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load dermatology clinics');
  }

  const data = await res.json();
  return data.clinics as DermatologyClinic[];
}

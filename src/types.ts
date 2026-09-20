export type DermaLensCondition =
  | 'Acne Vulgaris'
  | 'Atopic Dermatitis (Eczema)'
  | 'Plaque Psoriasis'
  | 'Rosacea'
  | 'Seborrheic Dermatitis'
  | 'Contact Dermatitis'
  | 'Tinea (Fungal Infection)'
  | 'Urticaria (Hives)'
  | 'Actinic Keratosis / Benign Nevi (Moles)'
  | 'Benign / Clear / Normal Skin';

export type DermaLensTriageStatus = 'optimal' | 'monitoring' | 'suboptimal';

export interface DermaLensEvaluation {
  detected_condition: DermaLensCondition | string;
  iga_score: 0 | 1 | 2 | 3 | 4;
  status: DermaLensTriageStatus;
  clinical_rationale: string;
}

export interface SkinTimelineFrame {
  id: string;
  week: number;
  day: number;
  date: string;
  label: string;
  imageUrl: string;
  thumbnailUrl?: string;
  erythemaIndex: number; // 0 - 100
  inflammationAreaMm2: number;
  severityScore: number; // EASI or PASI (e.g. 0 - 72)
  notes: string;
  isUserAnalyzed?: boolean; // true when dynamically computed from user photo
  aiAnalysis?: SingleImageAnalysisResult;
  dermaLensEvaluation?: DermaLensEvaluation;
  presageTelemetry?: {
    microvascularPerfusion: number;
    tissueOxygenationProxy: number;
    signalConfidence: number;
  };
}

export interface SingleImageAnalysisResult {
  conditionAssessment: string;
  primaryDiagnosisSuggestion: string;
  diagnosticConfidence: number;
  erythemaIndex: number;
  healthScore?: number;
  isHarmonized?: boolean;
  inflammationSeverity: 'Mild' | 'Moderate' | 'Severe' | 'Resolving' | 'Clear' | 'Almost Clear' | string;
  estimatedAreaMm2: number;
  dermaLensEvaluation?: DermaLensEvaluation;
  lesionCharacteristics: {
    colorVariation: string;
    borderDefinition: string;
    surfaceTexture: string;
    symmetry: string;
  };
  differentialDiagnoses: {
    name: string;
    probability: string;
    clinicalRationale: string;
  }[];
  treatmentRecommendations: {
    category: string;
    title: string;
    instructions: string;
    cautions?: string;
  }[];
  triggersToAvoid: string[];
  redFlagWarnings: string[];
  recommendedAction: string;
}

export interface ComparisonAnalysisResult {
  healingTrajectory: 'significant_improvement' | 'moderate_improvement' | 'stable_unchanged' | 'slight_worsening' | 'active_flare' | string;
  trajectoryLabel: string;
  erythemaReductionPct: number;
  surfaceAreaChangePct: number;
  baselineErythemaScore: number;
  currentErythemaScore: number;
  visualDifferenceSummary: string;
  detailedDifferences: {
    rednessErythema: string;
    lesionMargins: string;
    textureAndScaling: string;
    barrierIntegrity: string;
  };
  clinicalInterpretation: string;
  recommendedAdjustments: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DermatologyClinic {
  id: string;
  name: string;
  physician: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  acceptingNewPatients: boolean;
  telehealthAvailable: boolean;
  notes: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  isGuestDemo?: boolean;
}

export interface ClinicalCase {
  id: string;
  condition: string;
  patientInitials: string;
  age: number;
  medication: string;
  prescribingHcp: string;
  targetAnatomy: string;
  silhouetteType: 'face' | 'forearm' | 'shoulder' | 'lesion_circle';
  totalWeeks: number;
  baselineSeverity: string;
  currentSeverity: string;
  adherenceRate: number; // e.g. 96%
  frames: SkinTimelineFrame[];
  isicReferenceId?: string;
}

export interface CameraAlignmentTelemetry {
  isFramed: boolean;
  distanceStatus: 'optimal' | 'too_close' | 'too_far';
  distanceMm: number;
  angleTiltDeg: number;
  isAngleLevel: boolean;
  luxLevel: number;
  lightingStatus: 'optimal' | 'low_light' | 'overexposed';
  stabilityScore: number; // 0 - 100
  isStable: boolean;
  readyToCapture: boolean;
}

export interface IsicArchiveItem {
  isicId: string;
  attribution: string;
  diagnosis: string;
  benign_malignant: 'benign' | 'malignant' | 'indeterminate';
  dermoscopicType: string;
  anatomicalSite: string;
  ageApprox?: number;
  sex?: string;
  thumbnailUrl: string;
  fullImageUrl: string;
  dataset: string;
  url: string;
}

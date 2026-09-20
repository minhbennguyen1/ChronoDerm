export type UserRole = 'patient' | 'hcp';

export type ClinicalDirectiveType = 'escalate_regimen' | 'invite_sample' | 'request_daily_scans';

export interface ClinicalDirective {
  id: string;
  type: ClinicalDirectiveType;
  doctorName: string;
  patientInitials?: string;
  patientId?: string;
  title: string;
  message: string;
  subtext?: string;
  createdAt: string;
  acknowledged?: boolean;
  actionPayload?: {
    copayUrl?: string;
    sampleDrug?: string;
    frequency?: string;
  };
}

export interface SampleRequestOrder {
  id: string;
  doctorId: string;
  patientInitials: string;
  drugName: string;
  status: 'dispatched' | 'pending' | 'delivered' | 'in_transit' | string;
  orderDate: string;
  clinicAddress?: string;
  patientCondition?: string;
  patientAge?: number;
  trackingNumber?: string;
  dosageDetails?: string;
}

export interface CopayCardRecord {
  id: string;
  cardVoucherId: string;
  patientName: string;
  patientInitials: string;
  doctorId: string;
  doctorName: string;
  drugName: string;
  condition: string;
  designatedPharmacy: string;
  binNumber: string;
  pcnNumber: string;
  groupId: string;
  memberId: string;
  copayAmount: string;
  maxAnnualSavings: string;
  issuedDate: string;
  status: 'active' | 'routed_to_pharmacy' | 'redeemed';
  notes?: string;
}

export interface AppointmentRecord {
  id: string;
  patientName: string;
  patientInitials: string;
  patientId?: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  clinicName?: string;
  clinicAddress?: string;
  date: string;
  appointmentDate?: string;
  dayOfWeek: string;
  timeSlot: string;
  appointmentTime?: string;
  consultType: 'scheduled_video' | 'in_clinic' | 'urgent_flare' | 'async_monitoring' | string;
  type?: string;
  reason: string;
  urgency?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  source?: 'patient_portal' | 'doctor_recommended' | 'matched';
  bookedBy?: 'patient' | 'doctor';
  matchedWithPatientPortal?: boolean;
  doctorRecommendationNotes?: string;
  dataReportContext?: {
    igaScore: number;
    erythemaIndex: number;
    condition: string;
    lastCheckpointDate: string;
  };
  createdAt?: string;
}

export interface AppointmentRecommendation {
  id: string;
  patientId: string;
  patientName: string;
  patientInitials?: string;
  doctorId: string;
  doctorName: string;
  recommendedTimeframe?: string;
  recommendedDate?: string;
  recommendedDateFormatted?: string;
  recommendedDayOfWeek?: string;
  recommendedTimeSlot?: string;
  urgency?: string;
  condition?: string;
  rationale?: string;
  consultType?: 'scheduled_video' | 'in_clinic' | 'urgent_flare' | 'async_monitoring' | string;
  clinicalRationale?: string;
  dataReportSummary?: {
    igaScore: number;
    erythemaIndex: number;
    condition: string;
    flareStatus: string;
  };
  status?: 'pending_patient_confirmation' | 'accepted' | 'declined';
  sentAt?: string;
  createdAt?: string;
}

export interface PatientConsultationRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  consultType: 'urgent_video' | 'scheduled_video' | 'in_clinic' | 'async_rx';
  chiefComplaint: string;
  symptoms: string[];
  refNumber: string;
  submittedAt: string;
  frame?: SkinTimelineFrame;
  impiricusCopayAttached?: boolean;
  designatedPharmacy?: string;
  urgencyLevel?: 'critical' | 'standard';
  status: 'pending_review' | 'reviewed' | 'rx_dispatched';
}

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
  latitude?: number;
  longitude?: number;
  phone: string;
  website: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  acceptingNewPatients: boolean;
  telehealthAvailable: boolean;
  acceptsWalkIns?: boolean;
  teledermatologyAvailable?: boolean;
  notes: string;
}

export interface ClinicReferral {
  id: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicPhysician: string;
  clinicSpecialties: string[];
  patientId: string;
  patientName: string;
  referringDoctorName?: string;
  priority: 'routine' | 'expedited_flare' | 'urgent';
  referralReason: string;
  notes?: string;
  createdAt: string;
  status: 'dispatched' | 'scheduled' | 'pending';
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
  assignedDoctorId?: string;
  consultations?: PatientConsultationRecord[];
  appointmentRecommendation?: AppointmentRecommendation;
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

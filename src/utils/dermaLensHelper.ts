import { SkinTimelineFrame, DermaLensEvaluation } from '../types';

/**
 * Impiricus DermaLens Evaluation Engine Clinical Triage Rubric:
 * 
 * 0 - Clear: Normal skin, no inflammatory lesions (Optimal, No Alert)
 * 1 - Almost Clear: Rare, barely perceptible erythema/papules (Optimal, No Alert)
 * 2 - Mild: Mild erythema, minor papulation/scaling (Monitoring, Logged, No Alert)
 * 3 - Moderate: Marked erythema, distinct indurated papules/plaques (Suboptimal, Urgent HCP Alert)
 * 4 - Severe: Severe intense erythema, extensive confluence/exudate (Suboptimal, Urgent HCP Alert)
 * 
 * Clinical Rule:
 * "Connect with a Doctor Right Away" is STRICTLY indicated ONLY for Moderate to Severe (IGA 3 or 4).
 */

export interface IgaDetails {
  score: number;
  label: string;
  severityGroup: 'Clear' | 'Almost Clear' | 'Mild' | 'Moderate' | 'Severe';
  isModerateToSevere: boolean;
  triageStatus: 'optimal' | 'monitoring' | 'suboptimal';
  clinicalGuidance: string;
}

export function getIgaDetails(score: number): IgaDetails {
  switch (score) {
    case 0:
      return {
        score: 0,
        label: '0 (Clear)',
        severityGroup: 'Clear',
        isModerateToSevere: false,
        triageStatus: 'optimal',
        clinicalGuidance: 'Normal skin barrier, no erythema or papules. Routine wellness maintenance.',
      };
    case 1:
      return {
        score: 1,
        label: '1 (Almost Clear)',
        severityGroup: 'Almost Clear',
        isModerateToSevere: false,
        triageStatus: 'optimal',
        clinicalGuidance: 'Barely perceptible erythema, minimal faint lesions. Maintenance and trigger prevention.',
      };
    case 2:
      return {
        score: 2,
        label: '2 (Mild)',
        severityGroup: 'Mild',
        isModerateToSevere: false,
        triageStatus: 'monitoring',
        clinicalGuidance: 'Mild erythema and superficial papulation. Logged for routine monitoring; does not qualify for urgent connect right away.',
      };
    case 3:
      return {
        score: 3,
        label: '3 (Moderate)',
        severityGroup: 'Moderate',
        isModerateToSevere: true,
        triageStatus: 'suboptimal',
        clinicalGuidance: 'Marked erythema with prominent inflammatory papules/plaques. Qualifies for urgent Connect with Doctor Right Away.',
      };
    case 4:
      return {
        score: 4,
        label: '4 (Severe)',
        severityGroup: 'Severe',
        isModerateToSevere: true,
        triageStatus: 'suboptimal',
        clinicalGuidance: 'Severe, deep erythema with extensive confluent involvement. Immediate physician consultation required right away.',
      };
    default:
      return {
        score: score,
        label: `${score} / 4`,
        severityGroup: score >= 3 ? 'Moderate' : 'Mild',
        isModerateToSevere: score >= 3,
        triageStatus: score >= 3 ? 'suboptimal' : 'monitoring',
        clinicalGuidance: score >= 3 ? 'Suboptimal severity.' : 'Routine monitoring.',
      };
  }
}

/**
 * Determines whether a frame or DermaLens evaluation qualifies as Moderate to Severe (IGA 3 or 4).
 * This matches the Impiricus DermaLens Evaluation Engine triage threshold.
 */
export function isModerateToSevereDermaLens(
  frame?: SkinTimelineFrame | null,
  dermaLens?: DermaLensEvaluation | null
): boolean {
  // If an explicit DermaLens evaluation is passed, it is the primary authority
  if (dermaLens) {
    if (typeof dermaLens.iga_score === 'number') {
      return dermaLens.iga_score >= 3;
    }
    return dermaLens.status === 'suboptimal';
  }

  // Check frame's attached DermaLens evaluation
  const frameEval = frame?.dermaLensEvaluation || frame?.aiAnalysis?.dermaLensEvaluation;
  if (frameEval) {
    if (typeof frameEval.iga_score === 'number') {
      return frameEval.iga_score >= 3;
    }
    return frameEval.status === 'suboptimal';
  }

  // Fallback for frames that haven't undergone DermaLens analysis yet:
  // Correlate with standard clinical severity cutoffs (e.g., EASI/PASI > 21 or erythema >= 65 with severe notation)
  if (frame) {
    if (frame.severityScore >= 22) return true;
    if (frame.erythemaIndex >= 65 && frame.severityScore >= 16) return true;
  }

  return false;
}

/**
 * Returns the effective IGA score (0 to 4) for a frame or evaluation.
 */
export function getEffectiveIgaScore(
  frame?: SkinTimelineFrame | null,
  dermaLens?: DermaLensEvaluation | null
): number {
  if (dermaLens && typeof dermaLens.iga_score === 'number') {
    return dermaLens.iga_score;
  }
  const frameEval = frame?.dermaLensEvaluation || frame?.aiAnalysis?.dermaLensEvaluation;
  if (frameEval && typeof frameEval.iga_score === 'number') {
    return frameEval.iga_score;
  }
  if (frame) {
    if (frame.severityScore >= 28 || frame.erythemaIndex >= 75) return 4;
    if (frame.severityScore >= 20 || frame.erythemaIndex >= 60) return 3;
    if (frame.severityScore >= 10 || frame.erythemaIndex >= 40) return 2;
    if (frame.severityScore > 0 || frame.erythemaIndex > 15) return 1;
  }
  return 0;
}

export interface HarmonizedSkinMetrics {
  igaScore: number;
  igaDetails: IgaDetails;
  healthScore: number;          // 0 - 100: Higher = healthier (Grade 0 => 96-99, Grade 4 => 15-32)
  erythemaIndex: number;        // 0 - 100: Higher = redder (Grade 0 => 5-12, Grade 4 => 75-95)
  severityGrade: string;        // 'Clear' | 'Almost Clear' | 'Mild' | 'Moderate' | 'Severe'
  severityScore: number;        // 0 - 30 clinical score
  isModerateToSevere: boolean;
  triageStatus: 'optimal' | 'monitoring' | 'suboptimal';
  suggestedDiagnosis: string;
  conditionAssessment: string;
  isHarmonized: boolean;
  clinicalExplanation: string;
}

/**
 * Harmonizes clinical scores across all diagnostic engines:
 * - Impiricus DermaLens™ (0-4 IGA Global Assessment & 10-point clinical spectrum)
 * - Single-Image Vision AI (Erythema Index & Inflammation Severity)
 * - Timeline Photometric Sensors & Skin Health Score (0 - 100)
 *
 * Ensures:
 * - Grade 0 (Clear): Skin Health is 96-99/100, Erythema is 5-12/100, Severity is Clear.
 * - Grade 1 (Almost Clear): Skin Health is 86-94/100, Erythema is 14-24/100, Severity is Almost Clear.
 * - Grade 2 (Mild): Skin Health is 68-82/100, Erythema is 28-45/100, Severity is Mild.
 * - Grade 3 (Moderate): Skin Health is 42-58/100, Erythema is 52-68/100, Severity is Moderate.
 * - Grade 4 (Severe): Skin Health is 15-34/100, Erythema is 72-95/100, Severity is Severe.
 */
export function calculateHarmonizedSkinMetrics({
  frame,
  dermaLens,
  analysis,
  fallbackCondition = 'Skin Assessment',
}: {
  frame?: SkinTimelineFrame | null;
  dermaLens?: DermaLensEvaluation | null;
  analysis?: any | null;
  fallbackCondition?: string;
}): HarmonizedSkinMetrics {
  const igaScore = getEffectiveIgaScore(frame, dermaLens);
  const igaDetails = getIgaDetails(igaScore);

  let healthScore: number;
  let erythemaIndex: number;
  let severityGrade: string;
  let severityScore: number;
  let suggestedDiagnosis: string = analysis?.primaryDiagnosisSuggestion || dermaLens?.detected_condition || fallbackCondition;
  let conditionAssessment: string = analysis?.conditionAssessment || '';
  let clinicalExplanation: string = '';

  switch (igaScore) {
    case 0: {
      healthScore = 97;
      erythemaIndex = 8;
      severityGrade = 'Clear';
      severityScore = 0.5;
      clinicalExplanation = 'Intact cutaneous barrier with normal physiological vascular tone (Grade 0: Clear).';

      // Ensure diagnosis does not suggest an active severe flare when skin is clear
      if (dermaLens?.detected_condition === 'Benign / Clear / Normal Skin' || !analysis?.primaryDiagnosisSuggestion) {
        suggestedDiagnosis = 'Normal Skin / Clear (No Active Lesions)';
      } else if (
        suggestedDiagnosis.toLowerCase().includes('eczema') ||
        suggestedDiagnosis.toLowerCase().includes('dermatitis') ||
        suggestedDiagnosis.toLowerCase().includes('psoriasis') ||
        suggestedDiagnosis.toLowerCase().includes('acne')
      ) {
        suggestedDiagnosis = `${suggestedDiagnosis} (In Remission / Clear - IGA 0)`;
      }

      if (!conditionAssessment || conditionAssessment.toLowerCase().includes('active erythematous')) {
        conditionAssessment = 'Visual inspection shows a clear, intact epidermal barrier with physiological cutaneous vascularity (erythema score: 8/100). No active inflammatory lesions, pustules, or scaling observed.';
      }
      break;
    }

    case 1: {
      healthScore = 90;
      erythemaIndex = 18;
      severityGrade = 'Almost Clear';
      severityScore = 3.5;
      clinicalExplanation = 'Barely perceptible erythema and isolated faint non-inflammatory lesions (Grade 1: Almost Clear).';

      if (suggestedDiagnosis && !suggestedDiagnosis.includes('Almost Clear')) {
        suggestedDiagnosis = `${suggestedDiagnosis} (Almost Clear - IGA 1)`;
      }
      if (!conditionAssessment) {
        conditionAssessment = 'Minimal cutaneous erythema with rare, tiny non-inflammatory blemishes. Epidermal barrier is stable and largely intact.';
      }
      break;
    }

    case 2: {
      healthScore = 74;
      erythemaIndex = 36;
      severityGrade = 'Mild';
      severityScore = 11.5;
      clinicalExplanation = 'Slight but definite erythema with localized superficial papulation (Grade 2: Mild).';

      if (!conditionAssessment) {
        conditionAssessment = 'Superficial erythema and minor scattered lesions. Consistent with mild flare activity suitable for routine monitoring.';
      }
      break;
    }

    case 3: {
      healthScore = 48;
      erythemaIndex = 60;
      severityGrade = 'Moderate';
      severityScore = 21.0;
      clinicalExplanation = 'Marked inflammatory erythema with prominent plaque formation or clustered pustules (Grade 3: Moderate).';

      if (!conditionAssessment) {
        conditionAssessment = 'Prominent inflammatory margins, pronounced vascular dilation, and active barrier disruption requiring priority clinical attention.';
      }
      break;
    }

    case 4:
    default: {
      healthScore = 22;
      erythemaIndex = 82;
      severityGrade = 'Severe';
      severityScore = 28.0;
      clinicalExplanation = 'Intense, confluent erythema, severe scaling, or extensive cystic/exudative involvement (Grade 4: Severe).';

      if (!conditionAssessment) {
        conditionAssessment = 'Severe cutaneous inflammation with widespread microvascular dilation, acute epidermal compromise, and urgent physician triage indication.';
      }
      break;
    }
  }

  // If raw analysis had a custom erythema within the allowable range for this IGA, preserve subtle nuances
  if (typeof analysis?.erythemaIndex === 'number') {
    const rawEi = analysis.erythemaIndex;
    if (igaScore === 0 && rawEi >= 4 && rawEi <= 14) {
      erythemaIndex = rawEi;
      healthScore = Math.round(100 - (rawEi * 0.4));
    } else if (igaScore === 1 && rawEi >= 14 && rawEi <= 26) {
      erythemaIndex = rawEi;
      healthScore = Math.round(100 - (rawEi * 0.5));
    } else if (igaScore === 2 && rawEi >= 26 && rawEi <= 46) {
      erythemaIndex = rawEi;
      healthScore = Math.round(92 - (rawEi * 0.5));
    } else if (igaScore === 3 && rawEi >= 48 && rawEi <= 70) {
      erythemaIndex = rawEi;
      healthScore = Math.round(82 - (rawEi * 0.55));
    } else if (igaScore === 4 && rawEi >= 70 && rawEi <= 98) {
      erythemaIndex = rawEi;
      healthScore = Math.round(75 - (rawEi * 0.6));
    }
  }

  return {
    igaScore,
    igaDetails,
    healthScore,
    erythemaIndex,
    severityGrade,
    severityScore,
    isModerateToSevere: igaDetails.isModerateToSevere,
    triageStatus: igaDetails.triageStatus,
    suggestedDiagnosis,
    conditionAssessment,
    isHarmonized: true,
    clinicalExplanation,
  };
}

/**
 * Produces an updated SingleImageAnalysisResult where all fields
 * (erythemaIndex, inflammationSeverity, healthScore, primaryDiagnosisSuggestion, conditionAssessment)
 * are guaranteed to stay 100% consistent with the Impiricus DermaLens evaluation.
 */
export function harmonizeAnalysisWithDermaLens(
  analysis: any,
  dermaLens?: DermaLensEvaluation | null,
  frame?: SkinTimelineFrame | null,
  conditionHint?: string
): any {
  if (!analysis && !dermaLens) return null;

  const harmonized = calculateHarmonizedSkinMetrics({
    frame,
    dermaLens: dermaLens || analysis?.dermaLensEvaluation,
    analysis,
    fallbackCondition: conditionHint,
  });

  return {
    ...analysis,
    healthScore: harmonized.healthScore,
    erythemaIndex: harmonized.erythemaIndex,
    inflammationSeverity: harmonized.severityGrade,
    primaryDiagnosisSuggestion: harmonized.suggestedDiagnosis,
    conditionAssessment: harmonized.conditionAssessment,
    dermaLensEvaluation: dermaLens || analysis?.dermaLensEvaluation,
    harmonizedMetrics: harmonized,
  };
}

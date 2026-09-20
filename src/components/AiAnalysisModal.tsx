import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  ShieldAlert,
  Flame,
  Activity,
  Layers,
  Info,
  RefreshCw,
  MessageSquare,
  MapPin,
  HelpCircle,
  Pill,
  ArrowRight,
  Scan,
  Check
} from 'lucide-react';
import { SkinTimelineFrame, SingleImageAnalysisResult, DermaLensEvaluation } from '../types';
import { analyzeSingleSkinImage, evaluateWithDermaLens } from '../services/aiService';
import {
  isModerateToSevereDermaLens,
  getEffectiveIgaScore,
  getIgaDetails,
  calculateHarmonizedSkinMetrics,
  harmonizeAnalysisWithDermaLens,
} from '../utils/dermaLensHelper';

interface AiAnalysisModalProps {
  frame: SkinTimelineFrame;
  conditionName?: string;
  onClose: () => void;
  onAskChatbot?: () => void;
  onFindClinic?: () => void;
  onConnectDoctor?: (frame: SkinTimelineFrame, reason: string, healthScore: number) => void;
  onSaveAnalysis?: (frameId: string, analysis: SingleImageAnalysisResult) => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  frame,
  conditionName = 'Skin Condition',
  onClose,
  onAskChatbot,
  onFindClinic,
  onConnectDoctor,
  onSaveAnalysis,
}) => {
  const [analysis, setAnalysis] = useState<SingleImageAnalysisResult | null>(frame.aiAnalysis || null);
  const [dermaLens, setDermaLens] = useState<DermaLensEvaluation | null>(
    frame.dermaLensEvaluation || frame.aiAnalysis?.dermaLensEvaluation || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!frame.aiAnalysis && !frame.dermaLensEvaluation);
  const [error, setError] = useState<string | null>(null);

  // Compute fully harmonized clinical metrics across all diagnostic engines
  // Guarantees that Grade 0 (Clear) always exhibits 96-99/100 skin health, minimal erythema (8/100), and Clear severity
  const harmonized = calculateHarmonizedSkinMetrics({
    frame,
    dermaLens,
    analysis,
    fallbackCondition: conditionName,
  });

  const healthScore = harmonized.healthScore;
  const effectiveIga = harmonized.igaScore;
  const igaDetails = harmonized.igaDetails;
  const isModerateToSevere = harmonized.isModerateToSevere;
  const displayErythema = harmonized.erythemaIndex;
  const displaySeverity = harmonized.severityGrade;
  const displayDiagnosis = harmonized.suggestedDiagnosis;
  const displayAssessment = harmonized.conditionAssessment;

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Evaluate with Impiricus DermaLens first or take cached
      const dermaLensResult = dermaLens || (await evaluateWithDermaLens(frame.imageUrl, true).catch(() => null));
      if (dermaLensResult) {
        setDermaLens(dermaLensResult);
      }

      // 2. Run single image inspection passing the DermaLens context to keep Gemini aligned
      const analysisResult = await analyzeSingleSkinImage(
        frame.imageUrl,
        conditionName,
        frame.notes,
        'Skin surface',
        frame.erythemaIndex,
        frame.severityScore,
        dermaLensResult || undefined
      );

      // 3. Harmonize all metrics so no contradictions exist
      const harmonizedAnalysis = harmonizeAnalysisWithDermaLens(
        analysisResult,
        dermaLensResult,
        frame,
        conditionName
      );

      setAnalysis(harmonizedAnalysis);

      if (onSaveAnalysis) {
        onSaveAnalysis(frame.id, harmonizedAnalysis);
      }
    } catch (err: any) {
      console.error('Error running AI image analysis:', err);
      setError(err.message || 'Failed to analyze skin photo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!frame.aiAnalysis || !dermaLens) {
      runAnalysis();
    }
  }, [frame.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card-glow rounded-3xl border border-cyan-500/40 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  AI Dermatological Inspection
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {frame.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual evaluation & condition analysis powered by Gemini 3.8 Flash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* CRITICAL URGENT ALERT: Strictly matches Impiricus DermaLens Evaluation Engine (Moderate to Severe: IGA 3 or 4) */}
          {isModerateToSevere && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/95 via-red-950/90 to-[#220710] border-2 border-rose-500 shadow-2xl shadow-rose-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/40 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-rose-500 text-white shadow-sm">
                      🚨 Impiricus DermaLens™ Triage: {igaDetails.severityGroup.toUpperCase()} (IGA {effectiveIga}/4)
                    </span>
                    <span className="text-xs font-bold text-rose-300">
                      Immediate Doctor Consultation Recommended Right Away
                    </span>
                  </div>
                  <p className="text-xs text-rose-100/90 mt-1 max-w-xl leading-relaxed">
                    The Impiricus DermaLens Evaluation Engine identified active {dermaLens?.detected_condition || conditionName} with {(igaDetails?.severityGroup || 'moderate').toLowerCase()} severity (IGA score {effectiveIga}/4, Suboptimal Status). Clinical triage rubrics advise connecting with a board-certified dermatologist right away.
                  </p>
                </div>
              </div>

              {onConnectDoctor && (
                <button
                  type="button"
                  onClick={() => {
                    onConnectDoctor(
                      frame,
                      `Urgent HCP Alert (Impiricus DermaLens™): ${dermaLens?.detected_condition || conditionName} evaluated as ${igaDetails.severityGroup} (IGA ${effectiveIga}/4, Suboptimal Status). Clinical protocol advises connecting right away.`,
                      healthScore
                    );
                    onClose();
                  }}
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 animate-pulse"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Connect with a Doctor Right Away</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Top Row: Photo Preview + Primary Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Photo Preview (4 cols) */}
            <div className="md:col-span-4 flex flex-col gap-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square shadow-lg">
                <img
                  src={frame.imageUrl}
                  alt={frame.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono text-cyan-300">
                  Week {frame.week}, Day {frame.day}
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-col gap-2 pt-1">
                {onConnectDoctor && (
                  <button
                    type="button"
                    onClick={() => {
                      onConnectDoctor(
                        frame,
                        isModerateToSevere
                          ? `Urgent HCP Alert (Impiricus DermaLens™): ${dermaLens?.detected_condition || conditionName} evaluated as ${igaDetails.severityGroup} (IGA ${effectiveIga}/4, Suboptimal).`
                          : `Clinical consultation request for ${frame.label} - ${conditionName} (IGA ${effectiveIga}/4: ${igaDetails.severityGroup} - Routine monitoring)`,
                        healthScore
                      );
                      onClose();
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isModerateToSevere
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 animate-pulse'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{isModerateToSevere ? `Connect Doctor Right Away (IGA ${effectiveIga}/4)` : `Connect Doctor (IGA ${effectiveIga}/4)`}</span>
                  </button>
                )}

                {onAskChatbot && (
                  <button
                    type="button"
                    onClick={onAskChatbot}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discuss in AI Chat</span>
                  </button>
                )}

                {onFindClinic && (
                  <button
                    type="button"
                    onClick={onFindClinic}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Find US Specialist</span>
                  </button>
                )}
              </div>
            </div>

            {/* Assessment Details (8 cols) */}
            <div className="md:col-span-8 flex flex-col gap-4">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="text-sm font-bold text-white">
                    Analyzing Skin Lesion Morphology...
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Detecting micro-erythema, margin regularities, scale density, and inflammatory biomarkers with Gemini.
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Analysis Error</span>
                  </div>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 text-slate-950 font-bold font-mono text-xs cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  {/* IMPIRICUS DERMALENS EVALUATION ENGINE ASSESSMENT CARD */}
                  {dermaLens && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1624] to-slate-900 border border-cyan-500/40 shadow-xl space-y-3.5 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                            <Scan className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                Impiricus DermaLens™ Evaluation Engine
                              </h4>
                              <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                10-POINT SPECTRUM
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Objective morphological triage feeding clinician dashboard
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="font-mono text-xs font-bold">
                          {dermaLens.status === 'optimal' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Status: Optimal (No Alert)</span>
                            </span>
                          )}
                          {dermaLens.status === 'monitoring' && (
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" />
                              <span>Status: Monitoring (Logged)</span>
                            </span>
                          )}
                          {dermaLens.status === 'suboptimal' && (
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Status: Suboptimal (Urgent HCP Alert)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Condition & IGA Score Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-8 space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                            Identified Condition
                          </span>
                          <div className="text-base font-bold text-cyan-200">
                            {dermaLens.detected_condition}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 italic">
                            "{dermaLens.clinical_rationale}"
                          </p>
                        </div>

                        <div className="sm:col-span-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            0-4 IGA Global Assessment
                          </span>
                          <span className="text-2xl font-black font-mono text-white mt-0.5">
                            Grade {dermaLens.iga_score}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">
                            {dermaLens.iga_score === 0 && 'Clear (0)'}
                            {dermaLens.iga_score === 1 && 'Almost Clear (1)'}
                            {dermaLens.iga_score === 2 && 'Mild (2)'}
                            {dermaLens.iga_score === 3 && 'Moderate (3)'}
                            {dermaLens.iga_score === 4 && 'Severe (4)'}
                          </span>
                        </div>
                      </div>

                      {/* Visual IGA Scale Stepper */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Severity Spectrum (Investigator's Global Assessment):</span>
                          <span>Score: {dermaLens.iga_score} / 4</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 h-2 rounded-full overflow-hidden">
                          {[0, 1, 2, 3, 4].map((step) => {
                            const isActive = step <= dermaLens.iga_score;
                            const isCurrent = step === dermaLens.iga_score;
                            let color = 'bg-slate-800';
                            if (isActive) {
                              if (step <= 1) color = 'bg-emerald-400';
                              else if (step === 2) color = 'bg-blue-400';
                              else color = 'bg-rose-500';
                            }
                            return (
                              <div
                                key={step}
                                className={`h-full rounded-sm transition-all ${color} ${
                                  isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''
                                }`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>0: Clear</span>
                          <span>1: Almost</span>
                          <span>2: Mild</span>
                          <span>3: Moderate</span>
                          <span>4: Severe</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Diagnosis & Score Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            Primary AI Clinical Observation
                          </span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            Harmonized with Impiricus DermaLens™ (Grade {effectiveIga})
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mt-1">
                          {displayDiagnosis}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-mono text-slate-400">Diagnostic Match</div>
                        <div className="text-base font-bold font-mono text-cyan-300">
                          {analysis.diagnosticConfidence}%
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      {displayAssessment}
                    </p>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className={`p-2.5 rounded-xl border ${
                        isModerateToSevere
                          ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-cyan-300'
                      }`}>
                        <div className="text-[10px] text-slate-400">Skin Health Score</div>
                        <div className="text-sm font-bold flex items-center gap-1 mt-0.5">
                          <span>{healthScore} / 100</span>
                          {isModerateToSevere ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-sans font-bold">
                              SUBOPTIMAL
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-sans font-bold">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Erythema Score</div>
                        <div className="text-sm font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{displayErythema} / 100</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">Severity Grade</div>
                        <div className={`text-sm font-bold flex items-center gap-1 mt-0.5 ${
                          effectiveIga === 0 ? 'text-emerald-400' : effectiveIga === 1 ? 'text-cyan-300' : effectiveIga === 2 ? 'text-blue-300' : 'text-amber-300'
                        }`}>
                          <Activity className="w-3.5 h-3.5" />
                          <span>{displaySeverity}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">DermaLens IGA</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Grade {effectiveIga} / 4</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lesion Morphology Characteristics */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Lesion Morphological Characteristics</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-400 block">Color & Hue:</span>
                        <span className="text-slate-200">{analysis.lesionCharacteristics.colorVariation}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-400 block">Border Definition:</span>
                        <span className="text-slate-200">{analysis.lesionCharacteristics.borderDefinition}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-400 block">Surface Texture:</span>
                        <span className="text-slate-200">{analysis.lesionCharacteristics.surfaceTexture}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-400 block">Symmetry:</span>
                        <span className="text-slate-200">{analysis.lesionCharacteristics.symmetry}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bottom Section: Treatment Recommendations & Differential Considerations */}
          {analysis && !isLoading && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Evidence-Based Treatment Recommendations */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                  <Pill className="w-4 h-4 text-cyan-400" />
                  <span>Clinical Treatment & Skincare Recommendations</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.treatmentRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                          {rec.category}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white">{rec.title}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rec.instructions}</p>
                      {rec.cautions && (
                        <div className="text-[10px] text-amber-300/90 font-mono pt-1">
                          Caution: {rec.cautions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers to Avoid + Red Flag Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Triggers */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Common Triggers to Eliminate</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysis.triggersToAvoid.map((trigger, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">&bull;</span>
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Red Flags */}
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>When to Seek Immediate In-Person Care</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-200/90">
                    {analysis.redFlagWarnings.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">&bull;</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>AI assessment calibrated against dermatological optical criteria.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

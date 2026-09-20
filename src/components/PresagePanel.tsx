import React from 'react';
import {
  Activity,
  Flame,
  ShieldCheck,
  HeartPulse,
  Droplets,
  Trash2,
  Camera,
  Sparkles,
  MessageSquare,
  Stethoscope,
  Pill,
  AlertTriangle
} from 'lucide-react';
import { SkinTimelineFrame } from '../types';

interface PresagePanelProps {
  currentFrame: SkinTimelineFrame;
  baselineFrame?: SkinTimelineFrame;
  onOpenCamera?: () => void;
  onRequestDelete?: () => void;
  onAnalyzeFrame?: (frame: SkinTimelineFrame) => void;
  onCompareDifference?: (baseline: SkinTimelineFrame, current: SkinTimelineFrame) => void;
  onOpenChatbot?: (frame: SkinTimelineFrame) => void;
}

export const PresagePanel: React.FC<PresagePanelProps> = ({
  currentFrame,
  baselineFrame,
  onOpenCamera,
  onRequestDelete,
  onAnalyzeFrame,
  onCompareDifference,
  onOpenChatbot,
}) => {
  const isRealUserPhoto = !!currentFrame.isUserAnalyzed;
  const ai = currentFrame.aiAnalysis;

  const deltaImprovement = baselineFrame
    ? Math.round(
        ((baselineFrame.erythemaIndex - currentFrame.erythemaIndex) /
          Math.max(1, baselineFrame.erythemaIndex)) *
          100
      )
    : 0;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                AI Visual Skin Evaluation & Telemetry
              </h3>
              {ai ? (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Gemini Verified
                </span>
              ) : isRealUserPhoto ? (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  User Photo
                </span>
              ) : (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Ready for AI Inspection
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {ai
                ? `AI Diagnosis: ${ai.primaryDiagnosisSuggestion} (${ai.diagnosticConfidence}% confidence)`
                : 'Computer-vision morphological analysis detecting erythema, borders, and lesion textures.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onRequestDelete && (
            <button
              type="button"
              onClick={onRequestDelete}
              className="flex items-center gap-1 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Delete this photo checkpoint"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Quick Inspection Callout */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/50 p-3 rounded-xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{ai ? 'AI Clinical Findings Available' : "What is wrong with this skin?"}</span>
              {ai && (
                <span className="text-[10px] text-cyan-300 font-mono">
                  Severity: {ai.inflammationSeverity}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {ai
                ? ai.conditionAssessment.slice(0, 100) + '...'
                : 'Run Gemini AI to analyze lesion borders, erythema depth, and diagnose this picture.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAnalyzeFrame && (
            <button
              type="button"
              onClick={() => onAnalyzeFrame(currentFrame)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{ai ? 'View AI Report' : "Analyze What's Wrong"}</span>
            </button>
          )}

          {baselineFrame && baselineFrame.id !== currentFrame.id && onCompareDifference && (
            <button
              type="button"
              onClick={() => onCompareDifference(baselineFrame, currentFrame)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Compare Differences</span>
            </button>
          )}

          {onOpenChatbot && (
            <button
              type="button"
              onClick={() => onOpenChatbot(currentFrame)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-white transition-all cursor-pointer"
              title="Discuss with AI Dermatologist"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {/* 1. Erythema Index */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" />
            Erythema Score
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-white font-mono">{currentFrame.erythemaIndex}</span>
            <span className="text-[10px] text-slate-500 font-mono">/100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, currentFrame.erythemaIndex)}%` }}
            />
          </div>
        </div>

        {/* 2. Inflammation Area */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            Lesion Area
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-white font-mono">{currentFrame.inflammationAreaMm2}</span>
            <span className="text-[10px] text-slate-500 font-mono">mm²</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">Surface coverage</span>
        </div>

        {/* 3. Severity Score */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" />
            Severity Score
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-white font-mono">{currentFrame.severityScore}</span>
            <span className="text-[10px] text-slate-500 font-mono">EASI/PASI</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">Clinical grade</span>
        </div>

        {/* 4. Color / Hue Character */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <HeartPulse className="w-3 h-3 text-pink-400" />
            Vascular Hue
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-white truncate">
              {ai?.lesionCharacteristics?.colorVariation || 'Hyperemic'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">Pixel tone</span>
        </div>

        {/* 5. Edge Definition */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-teal-400" />
            Borders
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-white truncate">
              {ai?.lesionCharacteristics?.borderDefinition || 'Demarcated'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">Margin profile</span>
        </div>

        {/* 6. Delta Improvement vs Baseline */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Clearance Delta
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {deltaImprovement > 0 ? `+${deltaImprovement}%` : `${deltaImprovement}%`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">vs. Baseline Day 0</span>
        </div>
      </div>

      {/* Narrative Progress Note & Treatment snippet */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 animate-ping" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white font-medium">{currentFrame.label}:</strong>{' '}
            {currentFrame.notes || 'Photo checkpoint recorded.'}
            {ai && ai.treatmentRecommendations?.length > 0 && (
              <div className="text-[11px] text-cyan-200 mt-1 font-mono">
                Rx/OTC Suggestion: {ai.treatmentRecommendations[0].title}
              </div>
            )}
          </div>
        </div>

        {!isRealUserPhoto && onOpenCamera && (
          <button
            type="button"
            onClick={onOpenCamera}
            className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <Camera className="w-3 h-3 text-cyan-400" />
            <span>Capture Photo &rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
};

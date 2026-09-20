import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Clock
} from 'lucide-react';
import { SkinTimelineFrame, ComparisonAnalysisResult } from '../types';
import { compareSkinFrames } from '../services/aiService';

interface AiDifferenceModalProps {
  baselineFrame: SkinTimelineFrame;
  latestFrame: SkinTimelineFrame;
  conditionName?: string;
  onClose: () => void;
  onAskChatbot?: () => void;
}

export const AiDifferenceModal: React.FC<AiDifferenceModalProps> = ({
  baselineFrame,
  latestFrame,
  conditionName = 'Skin Condition',
  onClose,
  onAskChatbot,
}) => {
  const [comparison, setComparison] = useState<ComparisonAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const daysElapsed = Math.max(1, (latestFrame.week - baselineFrame.week) * 7 + (latestFrame.day - baselineFrame.day));

  const runComparison = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await compareSkinFrames(
        baselineFrame.imageUrl,
        latestFrame.imageUrl,
        baselineFrame.label,
        latestFrame.label,
        conditionName,
        daysElapsed,
        baselineFrame.erythemaIndex,
        latestFrame.erythemaIndex
      );
      setComparison(result);
    } catch (err: any) {
      console.error('Error running AI difference comparison:', err);
      setError(err.message || 'Failed to compare skin frames with Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [baselineFrame.id, latestFrame.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card-glow rounded-3xl border border-cyan-500/40 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  AI Longitudinal Difference Analysis
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {daysElapsed} Days Interval
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual change detection comparing {baselineFrame.label} vs {latestFrame.label}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Side-by-side Photo Comparison Strip */}
          <div className="grid grid-cols-2 gap-4">
            {/* Baseline Frame */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-bold">Earlier / Baseline</span>
                <span className="text-cyan-400">{baselineFrame.label}</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-[4/3] bg-slate-900 shadow-md">
                <img
                  src={baselineFrame.imageUrl}
                  alt={baselineFrame.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-700">
                  Week {baselineFrame.week}, Day {baselineFrame.day}
                </div>
              </div>
            </div>

            {/* Latest Frame */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-bold">Current / Checkpoint</span>
                <span className="text-emerald-400">{latestFrame.label}</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-[4/3] bg-slate-900 shadow-md">
                <img
                  src={latestFrame.imageUrl}
                  alt={latestFrame.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                  Week {latestFrame.week}, Day {latestFrame.day}
                </div>
              </div>
            </div>
          </div>

          {/* AI Comparison Results */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-sm font-bold text-white">
                Comparing Longitudinal Pixel Differences with Gemini...
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Measuring objective erythema clearance rate, boundary shrinkage, and epidermal healing trajectory.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Comparison Error</span>
              </div>
              <p>{error}</p>
              <button
                type="button"
                onClick={runComparison}
                className="px-3 py-1.5 rounded-lg bg-rose-500 text-slate-950 font-bold font-mono text-xs cursor-pointer"
              >
                Retry Comparison
              </button>
            </div>
          ) : comparison ? (
            <div className="space-y-4">
              {/* Objective Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Erythema Clearance Delta */}
                <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Erythema Clearance Rate
                  </div>
                  <div className="text-2xl font-black font-mono flex items-center gap-2 text-emerald-400">
                    <TrendingDown className="w-6 h-6" />
                    <span>
                      {comparison.erythemaReductionPct > 0 ? `+${comparison.erythemaReductionPct}%` : `${comparison.erythemaReductionPct}%`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Baseline score: {comparison.baselineErythemaScore} &rarr; Current: {comparison.currentErythemaScore}
                  </div>
                </div>

                {/* Surface Area Delta */}
                <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Lesion Area Shift
                  </div>
                  <div className="text-2xl font-black font-mono flex items-center gap-2 text-cyan-300">
                    <Layers className="w-6 h-6" />
                    <span>
                      {comparison.surfaceAreaChangePct < 0
                        ? `${comparison.surfaceAreaChangePct}%`
                        : `+${comparison.surfaceAreaChangePct}%`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {comparison.surfaceAreaChangePct < 0 ? 'Regression in active plaque area' : 'Expansion in plaque margin'}
                  </div>
                </div>

                {/* Healing Trajectory Status */}
                <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Trajectory Status
                  </div>
                  <div className="text-base font-bold text-white flex items-center gap-1.5 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{comparison.trajectoryLabel}</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-300 mt-1">
                    {daysElapsed} days on protocol
                  </div>
                </div>
              </div>

              {/* Natural Language Visual Difference Summary */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Clinical Visual Difference Summary</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {comparison.visualDifferenceSummary}
                </p>
              </div>

              {/* Detailed Breakdown of 4 Visual Dimensions */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300">
                  Detailed Comparative Findings
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-1">Redness & Erythema:</span>
                    <span className="text-slate-300 leading-relaxed">
                      {comparison.detailedDifferences.rednessErythema}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-1">Lesion Margins:</span>
                    <span className="text-slate-300 leading-relaxed">
                      {comparison.detailedDifferences.lesionMargins}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-1">Texture & Scaling:</span>
                    <span className="text-slate-300 leading-relaxed">
                      {comparison.detailedDifferences.textureAndScaling}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-1">Epidermal Barrier:</span>
                    <span className="text-slate-300 leading-relaxed">
                      {comparison.detailedDifferences.barrierIntegrity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Interpretation & Recommended Adjustments */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div>
                  <span className="text-xs font-bold text-cyan-300 block">Efficacy Interpretation:</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {comparison.clinicalInterpretation}
                  </p>
                </div>

                {comparison.recommendedAdjustments?.length > 0 && (
                  <div className="pt-2 border-t border-cyan-500/20">
                    <span className="text-xs font-bold text-white block mb-1.5">Actionable Next Steps:</span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {comparison.recommendedAdjustments.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">&bull;</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          {onAskChatbot && (
            <button
              type="button"
              onClick={onAskChatbot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuss Comparison with AI Chatbot</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

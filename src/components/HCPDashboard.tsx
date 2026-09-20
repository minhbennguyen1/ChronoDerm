import React from 'react';
import {
  FileText,
  TrendingDown,
  CheckCircle,
  Calendar,
  Share2,
  Stethoscope,
  Activity,
  Layers
} from 'lucide-react';
import { ClinicalCase, SkinTimelineFrame } from '../types';

interface HCPDashboardProps {
  clinicalCase: ClinicalCase;
  onNavigateToSlider: () => void;
}

export const HCPDashboard: React.FC<HCPDashboardProps> = ({
  clinicalCase,
  onNavigateToSlider,
}) => {
  const frames = clinicalCase.frames || [];
  const baselineFrame = frames[0];
  const latestFrame = frames[frames.length - 1];

  const baselineEI = baselineFrame?.erythemaIndex || 0;
  const latestEI = latestFrame?.erythemaIndex || 0;
  const clearancePct = baselineEI > 0
    ? Math.max(0, Math.round(((baselineEI - latestEI) / baselineEI) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Clinician Overview Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  HCP Longitudinal Monitoring Summary
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {clinicalCase.condition}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient {clinicalCase.patientInitials} ({clinicalCase.age}y) &bull; Prescribed: {clinicalCase.medication}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToSlider}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Open 3D Time Machine
            </button>
          </div>
        </div>

        {/* Impiricus DermaLens Diagnostic Triage Telemetry for HCP */}
        {latestFrame?.dermaLensEvaluation && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Impiricus DermaLens Evaluation
                </span>
                <span className="text-xs font-bold text-white">
                  {latestFrame.dermaLensEvaluation.detected_condition}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic">
                "{latestFrame.dermaLensEvaluation.clinical_rationale}"
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">IGA Severity Score</div>
                <div className="text-base font-black font-mono text-cyan-300">
                  IGA {latestFrame.dermaLensEvaluation.iga_score} / 4
                </div>
              </div>

              <div className="font-mono text-xs font-bold">
                {latestFrame.dermaLensEvaluation.status === 'optimal' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Optimal (0-1)
                  </span>
                )}
                {latestFrame.dermaLensEvaluation.status === 'monitoring' && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Monitoring (2)
                  </span>
                )}
                {latestFrame.dermaLensEvaluation.status === 'suboptimal' && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                    🚨 Suboptimal (3-4 Alert)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Treatment Clearance</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1">+{clearancePct}%</span>
            <span className="text-[10px] text-slate-500 mt-1">Erythema reduction</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Saved Checkpoints</span>
            <span className="text-2xl font-black text-cyan-400 font-mono mt-1">{frames.length}</span>
            <span className="text-[10px] text-slate-500 mt-1">Photos aligned</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Adherence Rate</span>
            <span className="text-2xl font-black text-purple-400 font-mono mt-1">{clinicalCase.adherenceRate}%</span>
            <span className="text-[10px] text-slate-500 mt-1">Protocol compliance</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Current Status</span>
            <span className="text-sm font-bold text-white mt-2 truncate">{clinicalCase.currentSeverity}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Clinical grade</span>
          </div>
        </div>
      </div>

      {/* Progress checkpoints list */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col gap-4">
        <h4 className="text-sm font-bold text-white">Chronological Checkpoint Records</h4>
        {frames.length === 0 ? (
          <p className="text-xs text-slate-400">No checkpoints recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {frames.map((frame: SkinTimelineFrame, index: number) => (
              <div key={frame.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-500 text-[11px]">#{index + 1}</span>
                  <div>
                    <span className="font-bold text-white">{frame.label}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{frame.notes || 'Routine checkpoint.'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                  <span className="text-cyan-300">EI: {frame.erythemaIndex}</span>
                  <span className="text-slate-400">{frame.date || `Day ${frame.day}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

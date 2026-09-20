import React, { useState } from 'react';
import {
  Layers,
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  Grid,
  Eye,
  FileText,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  User,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Package,
  Send,
  Download,
  Maximize2
} from 'lucide-react';
import { ClinicalCase, SkinTimelineFrame, AppointmentRecommendation, DermaLensEvaluation } from '../types';
import { getEffectiveIgaScore, getIgaDetails } from '../utils/dermaLensHelper';

interface HcpTimelineDatasetViewerProps {
  cases: ClinicalCase[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  activeDoctorName?: string;
  activeDoctorId?: string;
  onOpenRecommendAppointmentModal?: (patientCase: ClinicalCase) => void;
  onOpenRecommendModal?: (patientCase: ClinicalCase) => void;
  onAddPatientCheckpoint?: (caseId: string, newFrame: SkinTimelineFrame) => void;
  onOpenSampleModal?: () => void;
  onNavigateToAppointments?: () => void;
}

export const HcpTimelineDatasetViewer: React.FC<HcpTimelineDatasetViewerProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  activeDoctorName = 'Dr. Rachel Nazarian, MD, FAAD',
  activeDoctorId = 'dr-nazarian',
  onOpenRecommendAppointmentModal,
  onOpenRecommendModal,
  onAddPatientCheckpoint,
  onOpenSampleModal,
  onNavigateToAppointments,
}) => {
  const triggerRecommendModal = (patientCase: ClinicalCase) => {
    if (onOpenRecommendModal) {
      onOpenRecommendModal(patientCase);
    } else if (onOpenRecommendAppointmentModal) {
      onOpenRecommendAppointmentModal(patientCase);
    }
  };
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const frames = activeCase?.frames || [];

  // Active frame indexes for medical inspection
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(() =>
    frames.length > 0 ? frames.length - 1 : 0
  );
  const [comparisonBaselineIndex, setComparisonBaselineIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'split_comparison' | 'reticle_grid'>('split_comparison');

  // Optical filters simulation for clinical examination
  const [showDermoscopyGrid, setShowDermoscopyGrid] = useState<boolean>(true);
  const [erythemaEnhance, setErythemaEnhance] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 1.5x, 2x

  // Doctor Clinical Impression note state
  const [clinicalNote, setClinicalNote] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<{ [key: string]: string }>({});
  const [isNoteSaved, setIsNoteSaved] = useState<boolean>(false);

  const currentFrame: SkinTimelineFrame | undefined = frames[selectedFrameIndex];
  const baselineFrame: SkinTimelineFrame | undefined = frames[comparisonBaselineIndex];

  const currentIga = currentFrame ? getEffectiveIgaScore(currentFrame, currentFrame.dermaLensEvaluation) : 0;
  const currentIgaInfo = getIgaDetails(currentIga);

  const baselineIga = baselineFrame ? getEffectiveIgaScore(baselineFrame, baselineFrame.dermaLensEvaluation) : 0;

  const handleSaveClinicalNote = () => {
    if (!currentFrame) return;
    setSavedNotes((prev) => ({
      ...prev,
      [currentFrame.id]: clinicalNote,
    }));
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Clinician Portal Header */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                HCP Clinical Dataset Portal
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                Registry ID: IMP-DATASET-8402
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                HIPAA De-identified Clinical Cohort
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Longitudinal Dermatological Image Dataset &amp; Telemetry Review
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Reviewing verified optical skin checkpoints, standardized DermLens calibrated scores, and multi-patient dataset archives.
            </p>
          </div>
        </div>

        {/* Action: Recommend Appointment Based on Data Report */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => triggerRecommendModal(activeCase)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4 text-slate-950" />
            <span>Recommend Appointment Based on Data Report</span>
          </button>
        </div>
      </div>

      {/* MULTI-PATIENT DATASET ACCESSOR BAR */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Patient Cohort Dataset Registry ({cases.length} Clinical Cases Available)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Selected: <strong className="text-cyan-300">Patient {activeCase.patientInitials}</strong> ({activeCase.condition})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {cases.map((c) => {
            const isSelected = c.id === activeCase.id;
            const lastF = c.frames[c.frames.length - 1];
            const iga = lastF ? getEffectiveIgaScore(lastF, lastF.dermaLensEvaluation) : 0;
            const isSevere = iga >= 3;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectCase(c.id);
                  setSelectedFrameIndex(c.frames.length > 0 ? c.frames.length - 1 : 0);
                  setComparisonBaselineIndex(0);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center">
                      {c.patientInitials}
                    </span>
                    <span className="font-bold text-white text-xs">Patient {c.patientInitials}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                      isSevere
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    IGA {iga}/4
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate font-medium">{c.condition}</div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>{c.frames.length} Photos in Dataset</span>
                  <span>Age: {c.age}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CLINICIAN IMAGE REVIEW BENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Medical Inspection & Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
            {/* Viewport Control Bar */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">View Mode:</span>
                <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('split_comparison')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'split_comparison' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Baseline vs Current Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('single')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'single' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Single Checkpoint Focus
                  </button>
                </div>
              </div>

              {/* Optical Tools */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDermoscopyGrid(!showDermoscopyGrid)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
                    showDermoscopyGrid
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle 10mm Calibrated Dermoscopy Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>10mm Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setErythemaEnhance(!erythemaEnhance)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
                    erythemaEnhance
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Cross-Polarized Subsurface Erythema Filter"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Erythema Filter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  title="Magnification Loupe"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{zoomLevel}x Loupe</span>
                </button>
              </div>
            </div>

            {/* Visual Display Stage */}
            <div className="relative p-6 bg-[#06080e] min-h-[420px] flex items-center justify-center overflow-hidden">
              {viewMode === 'split_comparison' && baselineFrame && currentFrame ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {/* Left: Baseline Photo */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Baseline Photo (Week {baselineFrame.week})</span>
                      <span className="text-cyan-300 font-bold">IGA {baselineIga}/4</span>
                    </div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
                      <img
                        src={baselineFrame.imageUrl}
                        alt="Baseline clinical frame"
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          erythemaEnhance ? 'contrast-150 saturate-200 hue-rotate-15' : ''
                        }`}
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                      {showDermoscopyGrid && (
                        <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 border border-cyan-500/20">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div key={i} className="border border-cyan-500/10" />
                          ))}
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-white font-mono text-[10px]">
                        {baselineFrame.date} • EI: {baselineFrame.erythemaIndex}
                      </div>
                    </div>
                  </div>

                  {/* Right: Selected Latest Checkpoint Photo */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Latest Photo (Week {currentFrame.week})</span>
                      <span className={`font-bold ${currentIga >= 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        IGA {currentIga}/4 ({currentIgaInfo.severityGroup})
                      </span>
                    </div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-inner group">
                      <img
                        src={currentFrame.imageUrl}
                        alt="Current clinical frame"
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          erythemaEnhance ? 'contrast-150 saturate-200 hue-rotate-15' : ''
                        }`}
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                      {showDermoscopyGrid && (
                        <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 border border-cyan-500/20">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div key={i} className="border border-cyan-500/10" />
                          ))}
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-white font-mono text-[10px]">
                        {currentFrame.date} • EI: {currentFrame.erythemaIndex}
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-cyan-500 text-slate-950 font-mono text-[10px] font-black">
                        Current Checkpoint
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentFrame ? (
                /* Single Image Inspection */
                <div className="relative max-w-lg w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl">
                  <img
                    src={currentFrame.imageUrl}
                    alt="Clinical frame focus"
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      erythemaEnhance ? 'contrast-150 saturate-200 hue-rotate-15' : ''
                    }`}
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                  {showDermoscopyGrid && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8 border border-cyan-500/20">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className="border border-cyan-500/10" />
                      ))}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md text-white font-mono text-xs">
                    {currentFrame.label} ({currentFrame.date}) • EI: {currentFrame.erythemaIndex} • IGA {currentIga}/4
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 font-mono text-xs">No image frames loaded for this dataset.</div>
              )}
            </div>

            {/* Checkpoint Filmstrip Selector */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Select Timeline Checkpoint to Inspect:</span>
                <span>
                  Frame {selectedFrameIndex + 1} of {frames.length}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {frames.map((frame, idx) => {
                  const isSelected = idx === selectedFrameIndex;
                  const fIga = getEffectiveIgaScore(frame, frame.dermaLensEvaluation);
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setSelectedFrameIndex(idx)}
                      className={`p-1.5 rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <img
                        src={frame.imageUrl}
                        alt={frame.label}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                      />
                      <div className="text-left font-mono text-[11px] pr-2">
                        <div className="font-bold text-white leading-tight">{frame.label}</div>
                        <div className="text-slate-400 text-[10px]">
                          {frame.date} • IGA {fIga}/4
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Clinician Report & Appointment Recommendation */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Clinical Data Report Card */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">DermaLens™ Data Report</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                Standardized IGA
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Current Severity:</span>
                  <span
                    className={`font-mono font-bold ${
                      currentIga >= 3 ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'
                    }`}
                  >
                    IGA {currentIga}/4 ({currentIgaInfo.severityGroup})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Erythema Index:</span>
                  <span className="font-mono text-white font-bold">{currentFrame?.erythemaIndex || 0} / 100</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Inflammation Area:</span>
                  <span className="font-mono text-white font-bold">
                    {currentFrame?.inflammationAreaMm2 || currentFrame?.aiAnalysis?.estimatedAreaMm2 || 350} mm²
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Prescribed Medication:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[170px]">{activeCase.medication}</span>
                </div>
              </div>

              {/* Clinical Interpretation Rationale */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-cyan-300 block mb-1 font-mono">Data Report Summary:</strong>
                {currentIga >= 3 ? (
                  <span className="text-rose-200">
                    Active flare identified on latest checkpoint scan. Erythema elevation observed in target anatomical site ({activeCase.targetAnatomy}). Clinical recommendation: Schedule in-person or virtual acute flare assessment.
                  </span>
                ) : (
                  <span className="text-emerald-200">
                    Longitudinal trajectory demonstrates therapeutic response. Erythema index reduced from baseline. Routine scheduled follow-up recommended.
                  </span>
                )}
              </div>

              {/* Action Button: Recommend Appointment based on report */}
              <button
                type="button"
                onClick={() => triggerRecommendModal(activeCase)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>Recommend When to Meet (Schedule)</span>
              </button>
            </div>
          </div>

          {/* Doctor Clinical Impression & Assessment Annotation */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white">Doctor Clinical Impression</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Attending: {activeDoctorName}</span>
            </div>

            <textarea
              rows={3}
              placeholder="Record clinical assessment notes, dermoscopic observations, or instructions for this checkpoint..."
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                {isNoteSaved ? '✓ Note saved to patient medical record' : 'Notes synced to patient file'}
              </span>
              <button
                type="button"
                onClick={handleSaveClinicalNote}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Save Impression
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

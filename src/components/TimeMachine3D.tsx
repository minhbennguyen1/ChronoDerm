import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Columns,
  Flame,
  Play,
  Pause,
  Download,
  Calendar,
  Layers,
  Trash2,
  Camera,
  Upload,
  HardDrive,
  Info,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Bot,
  MapPin,
  Stethoscope
} from 'lucide-react';
import { ClinicalCase, SkinTimelineFrame } from '../types';
import { PresagePanel } from './PresagePanel';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  isModerateToSevereDermaLens,
  getEffectiveIgaScore,
  getIgaDetails,
  calculateHarmonizedSkinMetrics,
} from '../utils/dermaLensHelper';

interface TimeMachine3DProps {
  clinicalCase: ClinicalCase;
  onLaunchCamera: () => void;
  onDeleteFrame?: (frameId: string) => void;
  onOpenSingleAnalysis?: (frame: SkinTimelineFrame) => void;
  onOpenDifferenceAnalysis?: (baseline: SkinTimelineFrame, latest: SkinTimelineFrame) => void;
  onOpenChatbot?: (frame?: SkinTimelineFrame) => void;
  onOpenMap?: () => void;
  onConnectDoctor?: (frame: SkinTimelineFrame, reason: string, healthScore: number) => void;
}

export const TimeMachine3D: React.FC<TimeMachine3DProps> = ({
  clinicalCase,
  onLaunchCamera,
  onDeleteFrame,
  onOpenSingleAnalysis,
  onOpenDifferenceAnalysis,
  onOpenChatbot,
  onOpenMap,
  onConnectDoctor,
}) => {
  const frames = clinicalCase.frames || [];

  // Timeline unit: 'weeks' (standard) or 'days' (daily progress)
  const [timelineUnit, setTimelineUnit] = useState<'weeks' | 'days'>('weeks');

  const minWeeks = frames.length > 0 ? frames[0].week : 1;
  const maxWeeks = frames.length > 0 ? Math.max(...frames.map((f: SkinTimelineFrame) => f.week)) : 1;
  const minDays = frames.length > 0 ? frames[0].day : 0;
  const maxDays = frames.length > 0 ? Math.max(...frames.map((f: SkinTimelineFrame) => f.day)) : 0;

  // Continuous slider position
  const [sliderProgress, setSliderProgress] = useState<number>(minWeeks);

  // View modes: 'morph3d' (smooth cross-blend), 'split' (curtain wipe), 'heatmap' (erythema overlay)
  const [viewMode, setViewMode] = useState<'morph3d' | 'split' | 'heatmap'>('morph3d');

  // Split-screen curtain position (0 to 100%)
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const isDraggingSplit = useRef(false);

  // 3D Parallax Tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // 5-Second Scannable Video Loop state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const loopReqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Loaded images cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Delete modal state
  const [frameToDelete, setFrameToDelete] = useState<SkinTimelineFrame | null>(null);

  // Preload frames
  useEffect(() => {
    frames.forEach((frame: SkinTimelineFrame) => {
      if (frame.imageUrl && !imageCacheRef.current.has(frame.id)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = frame.imageUrl;
        imageCacheRef.current.set(frame.id, img);
      }
    });
  }, [frames]);

  // Adjust slider when case or frames change
  useEffect(() => {
    if (timelineUnit === 'weeks') {
      setSliderProgress((prev) => Math.max(minWeeks, Math.min(maxWeeks, prev)));
    } else {
      setSliderProgress((prev) => Math.max(minDays, Math.min(maxDays, prev)));
    }
  }, [clinicalCase.id, minWeeks, maxWeeks, minDays, maxDays, timelineUnit]);

  // Unit switch
  const handleToggleUnit = () => {
    if (timelineUnit === 'weeks') {
      const currentDay = Math.round((sliderProgress - 1) * 7);
      setTimelineUnit('days');
      setSliderProgress(Math.max(minDays, Math.min(maxDays, currentDay)));
    } else {
      const currentWeek = parseFloat((sliderProgress / 7 + 1).toFixed(1));
      setTimelineUnit('weeks');
      setSliderProgress(Math.max(minWeeks, Math.min(maxWeeks, currentWeek)));
    }
  };

  // Interpolation pair calculation
  const getInterpolationPair = useCallback((): {
    frameA: SkinTimelineFrame;
    frameB: SkinTimelineFrame;
    ratio: number;
    currentWeekNum: number;
    currentDayNum: number;
  } => {
    if (frames.length === 0) {
      const emptyFallback: SkinTimelineFrame = {
        id: 'empty',
        week: 1,
        day: 0,
        date: '',
        label: 'No Photo',
        imageUrl: '',
        erythemaIndex: 0,
        inflammationAreaMm2: 0,
        severityScore: 0,
        notes: 'No photos captured yet.',
      };
      return { frameA: emptyFallback, frameB: emptyFallback, ratio: 0, currentWeekNum: 1, currentDayNum: 0 };
    }

    if (frames.length === 1) {
      return {
        frameA: frames[0],
        frameB: frames[0],
        ratio: 0,
        currentWeekNum: frames[0].week,
        currentDayNum: frames[0].day,
      };
    }

    if (timelineUnit === 'weeks') {
      const currentWeek = sliderProgress;
      if (currentWeek <= frames[0].week) {
        return { frameA: frames[0], frameB: frames[0], ratio: 0, currentWeekNum: frames[0].week, currentDayNum: frames[0].day };
      }
      if (currentWeek >= frames[frames.length - 1].week) {
        const last = frames[frames.length - 1];
        return { frameA: last, frameB: last, ratio: 1, currentWeekNum: last.week, currentDayNum: last.day };
      }

      for (let i = 0; i < frames.length - 1; i++) {
        const a = frames[i];
        const b = frames[i + 1];
        if (currentWeek >= a.week && currentWeek <= b.week) {
          const span = b.week - a.week || 1;
          const ratio = (currentWeek - a.week) / span;
          const currentDayNum = Math.round(a.day + (b.day - a.day) * ratio);
          return { frameA: a, frameB: b, ratio, currentWeekNum: parseFloat(currentWeek.toFixed(1)), currentDayNum };
        }
      }
    } else {
      const currentDay = sliderProgress;
      if (currentDay <= frames[0].day) {
        return { frameA: frames[0], frameB: frames[0], ratio: 0, currentWeekNum: frames[0].week, currentDayNum: frames[0].day };
      }
      if (currentDay >= frames[frames.length - 1].day) {
        const last = frames[frames.length - 1];
        return { frameA: last, frameB: last, ratio: 1, currentWeekNum: last.week, currentDayNum: last.day };
      }

      for (let i = 0; i < frames.length - 1; i++) {
        const a = frames[i];
        const b = frames[i + 1];
        if (currentDay >= a.day && currentDay <= b.day) {
          const span = b.day - a.day || 1;
          const ratio = (currentDay - a.day) / span;
          const currentWeekNum = parseFloat((a.week + (b.week - a.week) * ratio).toFixed(1));
          return { frameA: a, frameB: b, ratio, currentWeekNum, currentDayNum: Math.round(currentDay) };
        }
      }
    }

    return { frameA: frames[0], frameB: frames[0], ratio: 0, currentWeekNum: frames[0].week, currentDayNum: frames[0].day };
  }, [frames, timelineUnit, sliderProgress]);

  const { frameA, frameB, ratio, currentWeekNum, currentDayNum } = getInterpolationPair();

  // Interpolate numerical biomarkers
  const currentErythema = Math.round(
    frameA.erythemaIndex + (frameB.erythemaIndex - frameA.erythemaIndex) * ratio
  );
  const currentArea = Math.round(
    frameA.inflammationAreaMm2 + (frameB.inflammationAreaMm2 - frameA.inflammationAreaMm2) * ratio
  );
  const currentSeverity = parseFloat(
    (frameA.severityScore + (frameB.severityScore - frameA.severityScore) * ratio).toFixed(1)
  );

  const activeInterpolatedFrame: SkinTimelineFrame = useMemo(() => {
    return {
      id: ratio < 0.5 ? frameA.id : frameB.id,
      week: currentWeekNum,
      day: currentDayNum,
      date: ratio < 0.5 ? frameA.date : frameB.date,
      label: ratio < 0.5 ? frameA.label : frameB.label,
      imageUrl: ratio < 0.5 ? frameA.imageUrl : frameB.imageUrl,
      erythemaIndex: currentErythema,
      inflammationAreaMm2: currentArea,
      severityScore: currentSeverity,
      notes: ratio < 0.5 ? frameA.notes : frameB.notes,
      isUserAnalyzed: frameA.isUserAnalyzed || frameB.isUserAnalyzed,
      presageTelemetry: {
        microvascularPerfusion: parseFloat(
          (
            (frameA.presageTelemetry?.microvascularPerfusion || currentErythema * 0.9) +
            ((frameB.presageTelemetry?.microvascularPerfusion || currentErythema * 0.9) -
              (frameA.presageTelemetry?.microvascularPerfusion || currentErythema * 0.9)) *
              ratio
          ).toFixed(1)
        ),
        tissueOxygenationProxy: parseFloat(
          (
            (frameA.presageTelemetry?.tissueOxygenationProxy || 100 - currentErythema * 0.3) +
            ((frameB.presageTelemetry?.tissueOxygenationProxy || 100 - currentErythema * 0.3) -
              (frameA.presageTelemetry?.tissueOxygenationProxy || 100 - currentErythema * 0.3)) *
              ratio
          ).toFixed(1)
        ),
        signalConfidence: 98,
      },
    };
  }, [frameA, frameB, ratio, currentWeekNum, currentDayNum, currentErythema, currentArea, currentSeverity]);

  // Canvas drawing
  useEffect(() => {
    if (frames.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgA = imageCacheRef.current.get(frameA.id);
    const imgB = imageCacheRef.current.get(frameB.id);

    canvas.width = 600;
    canvas.height = 600;

    ctx.fillStyle = '#080b12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (viewMode === 'morph3d') {
      if (imgA && imgA.complete && imgA.naturalWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.drawImage(imgA, 0, 0, canvas.width, canvas.height);
      }
      if (imgB && imgB.complete && imgB.naturalWidth > 0 && ratio > 0) {
        ctx.globalAlpha = Math.min(1, Math.max(0, ratio));
        ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
      }
      ctx.globalAlpha = 1;
    } else if (viewMode === 'split') {
      const baselineImg = imageCacheRef.current.get(frames[0]?.id) || imgA;
      const currentImg = imgB || imgA;

      if (baselineImg && baselineImg.complete && baselineImg.naturalWidth > 0) {
        ctx.drawImage(baselineImg, 0, 0, canvas.width, canvas.height);
      }

      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        const splitX = (splitPosition / 100) * canvas.width;
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();
      }
    } else if (viewMode === 'heatmap') {
      const activeImg = ratio < 0.5 ? imgA : imgB;
      if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
        ctx.drawImage(activeImg, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 130 && r > g * 1.15) {
            data[i] = Math.min(255, r + 60);
            data[i + 1] = Math.round(g * 0.4);
            data[i + 2] = Math.round(b * 0.3);
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }
  }, [frameA, frameB, ratio, viewMode, splitPosition, frames]);

  // 3D Tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 14, y: x * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // 5-Second Video Loop controller
  const startLoop = () => {
    if (frames.length < 2) return;
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
  };

  const stopLoop = () => {
    setIsPlaying(false);
    if (loopReqRef.current) cancelAnimationFrame(loopReqRef.current);
  };

  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;

    const animateLoop = (time: number) => {
      if (lastTimeRef.current != null) {
        const deltaSec = (time - lastTimeRef.current) / 1000;
        const totalDurationSec = 5 / playbackSpeed;
        const range = timelineUnit === 'weeks' ? maxWeeks - minWeeks : maxDays - minDays;
        const increment = (range / totalDurationSec) * deltaSec;

        setSliderProgress((prev) => {
          let next = prev + increment;
          const maxVal = timelineUnit === 'weeks' ? maxWeeks : maxDays;
          const minVal = timelineUnit === 'weeks' ? minWeeks : minDays;
          if (next > maxVal) next = minVal;
          return next;
        });
      }
      lastTimeRef.current = time;
      loopReqRef.current = requestAnimationFrame(animateLoop);
    };

    loopReqRef.current = requestAnimationFrame(animateLoop);
    return () => {
      if (loopReqRef.current) cancelAnimationFrame(loopReqRef.current);
    };
  }, [isPlaying, frames.length, maxWeeks, minWeeks, maxDays, minDays, timelineUnit, playbackSpeed]);

  const jumpToFrame = (frame: SkinTimelineFrame) => {
    if (timelineUnit === 'weeks') {
      setSliderProgress(frame.week);
    } else {
      setSliderProgress(frame.day);
    }
    if (isPlaying) stopLoop();
  };

  const downloadSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `chronoderm-${clinicalCase.id}-W${currentWeekNum}-D${currentDayNum}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // Baseline and clearance metrics
  const baselineErythema = frames[0]?.erythemaIndex || 1;
  const clearancePct = Math.max(
    0,
    Math.round(((baselineErythema - currentErythema) / baselineErythema) * 100)
  );

  return (
    <div id="chronoderm-slider-section" className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{clinicalCase.condition}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30">
                {frames.length} Photo Checkpoint{frames.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target: <span className="text-slate-300 font-semibold">{clinicalCase.targetAnatomy}</span> &bull; {clinicalCase.medication}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Account Storage Active</span>
          </div>
        </div>

        {/* View Mode Pill Tabs (only relevant if photos exist) */}
        {frames.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-full border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('morph3d')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'morph3d'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D Morph Slider</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-gradient-to-r from-emerald-300 to-teal-400 text-slate-950 glow-mint'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Curtain Split</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'heatmap'
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white glow-magenta'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Erythema Heatmap</span>
              </button>
            </div>

            {/* AI Action Quick Triggers */}
            <div className="flex items-center gap-1.5">
              {frames.length >= 2 && onOpenDifferenceAnalysis && (
                <button
                  type="button"
                  onClick={() => {
                    const latest = frames[frames.length - 1];
                    onOpenDifferenceAnalysis(frames[0], latest);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
                  title="Analyze visual differences across chronological photos with Gemini AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Difference Analysis</span>
                </button>
              )}

              {onOpenSingleAnalysis && (
                <button
                  type="button"
                  onClick={() => {
                    const target = frames.find((f: SkinTimelineFrame) => f.id === activeInterpolatedFrame.id) || frames[0];
                    onOpenSingleAnalysis(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-mono transition-all cursor-pointer"
                  title="Evaluate what is wrong with this skin photo using Gemini AI"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{frames.length === 1 ? "Analyze What's Wrong" : "AI Inspection"}</span>
                </button>
              )}

              {onOpenChatbot && (
                <button
                  type="button"
                  onClick={() => {
                    const target = frames.find((f: SkinTimelineFrame) => f.id === activeInterpolatedFrame.id) || frames[0];
                    onOpenChatbot(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-all cursor-pointer"
                  title="Ask AI Chatbot about treatments and photos"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Chat</span>
                </button>
              )}

              {onOpenMap && (
                <button
                  type="button"
                  onClick={onOpenMap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-mono transition-all cursor-pointer"
                  title="View US Dermatologist Clinic Locator Map"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>US Map</span>
                </button>
              )}

              {onConnectDoctor && (() => {
                const target = frames.find((f: SkinTimelineFrame) => f.id === activeInterpolatedFrame.id) || frames[frames.length - 1] || frames[0];
                const harmonized = calculateHarmonizedSkinMetrics({ frame: target, fallbackCondition: clinicalCase.condition });
                const isModSevere = harmonized.isModerateToSevere;
                const iga = harmonized.igaScore;
                const hScore = harmonized.healthScore;

                return (
                  <button
                    type="button"
                    onClick={() => {
                      onConnectDoctor(
                        target,
                        isModSevere
                          ? `Urgent physician triage: Impiricus DermaLens evaluated as ${iga === 4 ? 'Severe' : 'Moderate'} (IGA ${iga}/4, Suboptimal) on ${clinicalCase.condition}`
                          : `Clinical consultation request for ${clinicalCase.condition} (IGA ${iga}/4, Routine monitoring)`,
                        hScore
                      );
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-sm cursor-pointer ${
                      isModSevere
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300'
                    }`}
                    title={isModSevere ? "Urgent DermaLens Alert: Connect with doctor right away" : "Connect with a board-certified dermatologist"}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{isModSevere ? `Connect Doctor Right Away (IGA ${iga}/4)` : `Connect Doctor (IGA ${iga}/4)`}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* IMPIRICUS DERMALENS URGENT TIMELINE ALERT: Only connects with doctor right away if moderate to severe (IGA 3-4) */}
      {(() => {
        if (frames.length === 0) return null;
        const target = frames.find((f: SkinTimelineFrame) => f.id === activeInterpolatedFrame.id) || frames[frames.length - 1] || frames[0];
        const harmonized = calculateHarmonizedSkinMetrics({ frame: target, fallbackCondition: clinicalCase.condition });
        const isModSevere = harmonized.isModerateToSevere;
        if (!isModSevere) return null;

        const iga = harmonized.igaScore;
        const igaInfo = harmonized.igaDetails;
        const hScore = harmonized.healthScore;

        return (
          <div className="p-4 px-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-[#18080e] border border-rose-500 shadow-lg shadow-rose-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/40 animate-pulse">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-mono font-bold">
                    IMPIRICUS DERMALENS: {igaInfo.severityGroup.toUpperCase()} (IGA {iga}/4)
                  </span>
                  <span className="text-xs font-bold text-rose-200">
                    Active Flare on {timelineUnit === 'weeks' ? `Week ${currentWeekNum}` : `Day ${currentDayNum}`} &bull; Suboptimal Disease Activity
                  </span>
                </div>
                <p className="text-[11px] text-rose-100/90 mt-0.5 max-w-2xl leading-relaxed">
                  Impiricus DermaLens Evaluation Engine detects moderate-to-severe disease severity (IGA {iga}/4). Per clinical triage rubrics, urgent physician consultation is indicated right away.
                </p>
              </div>
            </div>

            {onConnectDoctor && (
              <button
                type="button"
                onClick={() => {
                  onConnectDoctor(
                    target,
                    `Urgent HCP Alert: Impiricus DermaLens evaluated as ${igaInfo.severityGroup} (IGA ${iga}/4) on ${clinicalCase.condition}. Clinical protocol indicates connecting right away.`,
                    hScore
                  );
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all hover:scale-105 shrink-0 cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Connect with Doctor Right Away</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* ZERO FRAMES EMPTY STATE: Clean Personal Account Slate */}
      {frames.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 sm:p-12 border border-slate-800 text-center flex flex-col items-center justify-center gap-5 max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-bold text-white tracking-tight">
              No Photos Saved in This Account Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your personal account begins with a clean slate (zero pre-existing demo photos). Align your camera or upload an image to start tracking your longitudinal skin progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onLaunchCamera}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Take or Upload Baseline Photo</span>
            </button>
          </div>
        </div>
      ) : (
        /* MAIN INTERACTIVE 3D STAGE & CONTROLS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Visualizer Canvas (Left 7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={stageRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              className="perspective-1000 relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden glass-card-glow cursor-crosshair select-none border border-slate-700/60 shadow-2xl"
            >
              <div
                className="preserve-3d w-full h-full relative transition-transform duration-100 ease-out"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.02 : 1})`,
                }}
              >
                <canvas ref={canvasRef} className="w-full h-full object-cover rounded-xl" />

                {/* Specular gloss */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl opacity-30 mix-blend-overlay transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at ${50 + tilt.y * 2.5}% ${50 - tilt.x * 2.5}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`,
                  }}
                />

                {/* Split Curtain Handle */}
                {viewMode === 'split' && (
                  <div
                    className="absolute inset-0 z-30 cursor-ew-resize"
                    onMouseDown={() => {
                      isDraggingSplit.current = true;
                    }}
                    onMouseMove={(e) => {
                      if (!isDraggingSplit.current && e.buttons !== 1) return;
                      if (!stageRef.current) return;
                      const rect = stageRef.current.getBoundingClientRect();
                      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                      setSplitPosition(pct);
                    }}
                    onMouseUp={() => {
                      isDraggingSplit.current = false;
                    }}
                  >
                    <div
                      className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center pointer-events-none"
                      style={{ left: `${splitPosition}%` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                        ↔
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Pill on Canvas */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-mono text-cyan-300">
                <Calendar className="w-3.5 h-3.5" />
                <span>Week {currentWeekNum} &bull; Day {currentDayNum}</span>
              </div>

              {/* Snapshot download */}
              <button
                type="button"
                onClick={downloadSnapshot}
                title="Download snapshot"
                className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Slider & Playback Controls Bar */}
            <div className="w-full max-w-[500px] mt-4 flex flex-col gap-3 p-4 rounded-2xl glass-card border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Timeline Progress:</span>
                  <span className="text-cyan-300 font-bold">
                    {timelineUnit === 'weeks' ? `Week ${sliderProgress.toFixed(1)}` : `Day ${Math.round(sliderProgress)}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleUnit}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                >
                  Switch to {timelineUnit === 'weeks' ? 'Daily (Days)' : 'Weekly (Weeks)'}
                </button>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min={timelineUnit === 'weeks' ? minWeeks : minDays}
                max={timelineUnit === 'weeks' ? maxWeeks : maxDays}
                step={timelineUnit === 'weeks' ? 0.1 : 1}
                value={sliderProgress}
                onChange={(e) => {
                  setSliderProgress(parseFloat(e.target.value));
                  if (isPlaying) stopLoop();
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{timelineUnit === 'weeks' ? `Week ${minWeeks}` : `Day ${minDays}`} (Baseline)</span>
                <span>{timelineUnit === 'weeks' ? `Week ${maxWeeks}` : `Day ${maxDays}`} (Latest)</span>
              </div>

              {/* Video Loop Controls */}
              {frames.length >= 2 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={isPlaying ? stopLoop : startLoop}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors font-mono font-semibold"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause 5s Loop' : 'Play 5s Scannable Loop'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                    <span>Speed:</span>
                    {[0.5, 1, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPlaybackSpeed(s)}
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          playbackSpeed === s ? 'bg-cyan-400 text-slate-950 font-bold' : 'hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Presage Telemetry Panel & Photo Actions (Right 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <PresagePanel
              currentFrame={activeInterpolatedFrame}
              baselineFrame={frames[0]}
              onOpenCamera={onLaunchCamera}
              onRequestDelete={
                onDeleteFrame && activeInterpolatedFrame.id
                  ? () => {
                      const target = frames.find((f: SkinTimelineFrame) => f.id === activeInterpolatedFrame.id) || frames[0];
                      setFrameToDelete(target);
                    }
                  : undefined
              }
              onAnalyzeFrame={onOpenSingleAnalysis}
              onCompareDifference={onOpenDifferenceAnalysis}
              onOpenChatbot={onOpenChatbot}
            />

            {/* Quick Add Photo Prompt */}
            <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Add Next Photo Checkpoint
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Save another photo to order into this account timeline.
                </p>
              </div>

              <button
                type="button"
                onClick={onLaunchCamera}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shrink-0 shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Align Camera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHRONOLOGICAL PHOTO REEL & BULLETPROOF DELETE */}
      {frames.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Chronological Photo Checkpoints ({frames.length} Saved)
              </h3>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Click photo to jump slider &bull; Tap trash icon to delete
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {frames.map((frame: SkinTimelineFrame, index: number) => {
              const isCurrentlyActive =
                timelineUnit === 'weeks'
                  ? Math.abs(sliderProgress - frame.week) < 0.3
                  : Math.abs(sliderProgress - frame.day) < 3;

              return (
                <div
                  key={frame.id}
                  onClick={() => jumpToFrame(frame)}
                  className={`relative rounded-xl overflow-hidden border p-2 flex flex-col gap-2 transition-all cursor-pointer ${
                    isCurrentlyActive
                      ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50 shadow-lg'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-900">
                    {frame.imageUrl ? (
                      <img
                        src={frame.imageUrl}
                        alt={frame.label}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}

                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-cyan-300 border border-slate-800">
                      #{index + 1}
                    </div>

                    {/* Quick AI Inspect button on thumbnail */}
                    {onOpenSingleAnalysis && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSingleAnalysis(frame);
                        }}
                        aria-label={`AI analyze what is wrong with ${frame.label}`}
                        title="AI Analysis: what is wrong with this picture"
                        className="absolute top-1.5 left-8 p-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 border border-slate-700 hover:border-cyan-400 shadow-md transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-emerald-400 border border-slate-800">
                      EI: {frame.erythemaIndex}
                    </div>

                    {/* BULLETPROOF DELETE BUTTON: Always accessible, in-app modal */}
                    {onDeleteFrame && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFrameToDelete(frame);
                        }}
                        aria-label={`Delete photo for ${frame.label}`}
                        title="Delete photo checkpoint"
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 shadow-md transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Frame Metadata */}
                  <div className="flex flex-col text-xs">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Week {frame.week}</span>
                      <span className="text-cyan-400 font-mono text-[11px]">Day {frame.day}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {frame.label}
                    </div>
                    {frame.date && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {frame.date}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom In-App Confirmation Modal for Deletion (NO window.confirm!) */}
      <DeleteConfirmModal
        isOpen={!!frameToDelete}
        frame={frameToDelete}
        onClose={() => setFrameToDelete(null)}
        onConfirm={() => {
          if (frameToDelete && onDeleteFrame) {
            onDeleteFrame(frameToDelete.id);
          }
        }}
      />
    </div>
  );
};

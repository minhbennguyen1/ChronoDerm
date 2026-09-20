import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sun,
  Compass,
  Maximize2,
  Scan,
  ShieldAlert,
  Activity,
  UserCheck,
  Stethoscope,
  ArrowRight,
  Check
} from 'lucide-react';
import { SkinTimelineFrame, CameraAlignmentTelemetry, DermaLensEvaluation } from '../types';
import { analyzeSkinPhotoWithPresage } from '../services/presageService';
import { evaluateWithDermaLens } from '../services/aiService';

interface CameraOverlayProps {
  silhouetteType: 'face' | 'forearm' | 'shoulder' | 'lesion_circle';
  conditionName: string;
  defaultWeek?: number;
  defaultDay?: number;
  onCaptureFrame: (frame: SkinTimelineFrame) => void;
  onClose: () => void;
  onTriggerDoctorReferral?: (frame: SkinTimelineFrame, reason: string) => void;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  silhouetteType,
  conditionName,
  defaultWeek = 1,
  defaultDay = 0,
  onCaptureFrame,
  onClose,
  onTriggerDoctorReferral,
}) => {
  const [selectedTab, setSelectedTab] = useState<'camera' | 'upload'>('camera');
  const [scanMode, setScanMode] = useState<'face' | 'general'>('face');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Week and day inputs
  const [week, setWeek] = useState<number>(defaultWeek);
  const [day, setDay] = useState<number>(defaultDay);
  const [notes, setNotes] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Optical analysis & DermaLens state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatusText, setAnalysisStatusText] = useState<string>('Initializing optical sensors...');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [dermaLensResult, setDermaLensResult] = useState<DermaLensEvaluation | null>(null);
  const [pendingFrame, setPendingFrame] = useState<SkinTimelineFrame | null>(null);

  // Simulated optical alignment telemetry
  const [telemetry, setTelemetry] = useState<CameraAlignmentTelemetry>({
    isFramed: true,
    distanceStatus: 'optimal',
    distanceMm: 250,
    angleTiltDeg: 2,
    isAngleLevel: true,
    luxLevel: 420,
    lightingStatus: 'optimal',
    stabilityScore: 94,
    isStable: true,
    readyToCapture: true,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Callback ref to attach stream immediately upon video element mounting
  const setVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch((err) => console.log('Video play caught:', err));
    }
  };

  // Synchronize stream with video ref whenever mediaStream or tab changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch((err) => console.log('Video play caught:', err));
    }
  }, [mediaStream, selectedTab]);

  // Initialize camera
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (selectedTab !== 'camera') return;
      try {
        setStreamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setMediaStream(stream);
        setStreamActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.log('Video play caught:', err));
        }
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        setStreamError('Camera permission not granted or device not found. You can upload a photo instead.');
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedTab]);

  // Trigger snapshot from video feed
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    processPhoto(dataUrl);
  };

  // Trigger from file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        processPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Perform Dawson photometric analysis + Impiricus DermaLens Evaluation Engine
  const processPhoto = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setCapturedPreview(dataUrl);
    setAnalysisStatusText('Running Impiricus DermaLens™ Face Scan & IGA Evaluation...');

    try {
      // 1. Run Impiricus DermaLens Evaluation Engine
      const dermaLensEval = await evaluateWithDermaLens(dataUrl, scanMode === 'face');
      setDermaLensResult(dermaLensEval);

      // 2. Run Presage Dawson Photometric Biomarker analysis
      setAnalysisStatusText('Extracting Dawson microvascular optical telemetry...');
      const presageResult = await analyzeSkinPhotoWithPresage(dataUrl);

      const computedSeverity = dermaLensEval.iga_score * 16 + (dermaLensEval.status === 'suboptimal' ? 24 : 8);

      const newFrame: SkinTimelineFrame = {
        id: `photo_${Date.now()}`,
        week: Number(week),
        day: Number(day),
        date: dateStr,
        label: `Week ${week} (Day ${day})`,
        imageUrl: dataUrl,
        erythemaIndex: presageResult.erythemaIndex,
        inflammationAreaMm2: presageResult.inflammationAreaMm2,
        severityScore: computedSeverity,
        notes: notes.trim() || `${dermaLensEval.detected_condition} (IGA ${dermaLensEval.iga_score}) - ${dermaLensEval.clinical_rationale}`,
        isUserAnalyzed: true,
        dermaLensEvaluation: dermaLensEval,
        presageTelemetry: {
          microvascularPerfusion: presageResult.microvascularPerfusion,
          tissueOxygenationProxy: presageResult.tissueOxygenationProxy,
          signalConfidence: presageResult.signalConfidence,
        },
      };

      setPendingFrame(newFrame);
    } catch (err) {
      console.error('Error in face scan analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSaveFrame = () => {
    if (pendingFrame) {
      onCaptureFrame(pendingFrame);
      onClose();
    }
  };

  const isModerateToSevere = dermaLensResult ? (dermaLensResult.iga_score >= 3 || dermaLensResult.status === 'suboptimal') : false;

  const handleTriggerUrgentDoctor = () => {
    if (pendingFrame && dermaLensResult) {
      onCaptureFrame(pendingFrame);
      if (onTriggerDoctorReferral) {
        onTriggerDoctorReferral(
          pendingFrame,
          `Urgent HCP Alert (Impiricus DermaLens™): ${dermaLensResult.detected_condition} evaluated as ${dermaLensResult.iga_score === 4 ? 'Severe' : 'Moderate'} (IGA Score ${dermaLensResult.iga_score}/4, Suboptimal Status). ${dermaLensResult.clinical_rationale}`
        );
      }
      onClose();
    }
  };

  const getIgaLabel = (score: number) => {
    switch (score) {
      case 0:
        return '0 (Clear)';
      case 1:
        return '1 (Almost Clear)';
      case 2:
        return '2 (Mild)';
      case 3:
        return '3 (Moderate)';
      case 4:
        return '4 (Severe)';
      default:
        return `${score} / 4`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-md">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Impiricus DermaLens™ Evaluation Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  FACE SCAN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                10-Point Clinical Spectrum &bull; 0-4 IGA Global Assessment &bull; Triage Protocol
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Mode & Source Switch Tabs */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <div className="flex w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-slate-800">
            <button
              type="button"
              onClick={() => setScanMode('face')}
              className={`px-4 py-2.5 flex items-center gap-2 transition-colors ${
                scanMode === 'face'
                  ? 'text-cyan-300 bg-cyan-950/30 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Face Scan (DermaLens)</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('general')}
              className={`px-4 py-2.5 flex items-center gap-2 transition-colors ${
                scanMode === 'general'
                  ? 'text-cyan-300 bg-cyan-950/30 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>General Lesion</span>
            </button>
          </div>

          <div className="flex flex-1">
            <button
              type="button"
              onClick={() => setSelectedTab('camera')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                selectedTab === 'camera'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Aligned Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('upload')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                selectedTab === 'upload'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Face Photo</span>
            </button>
          </div>
        </div>

        {/* Viewport / Upload Zone OR DermaLens Result Screen */}
        <div className="relative aspect-square max-h-[380px] bg-slate-950 flex items-center justify-center overflow-hidden">
          {dermaLensResult && pendingFrame ? (
            /* REAL-TIME IMPIRICUS DERMALENS EVALUATION RESULT SCREEN */
            <div className="w-full h-full p-5 overflow-y-auto bg-slate-950 flex flex-col justify-between space-y-4 animate-in fade-in">
              <div className="space-y-4">
                {/* Result Top Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                      Impiricus DermaLens Diagnostic Evaluation
                    </span>
                  </div>

                  {/* Triage Status Pill */}
                  <div className="font-mono text-xs font-bold">
                    {dermaLensResult.status === 'optimal' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Optimal (No Alert)</span>
                      </span>
                    )}
                    {dermaLensResult.status === 'monitoring' && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>Monitoring (Logged)</span>
                      </span>
                    )}
                    {dermaLensResult.status === 'suboptimal' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Suboptimal (Urgent HCP Alert)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Suboptimal Urgent HCP Alert Banner */}
                {dermaLensResult.status === 'suboptimal' && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-red-950/80 border border-rose-500/80 text-xs text-rose-100 flex items-start gap-3 shadow-lg shadow-rose-950/50 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-rose-200">
                        🚨 Urgent HCP Alert Triggered (IGA Score: {dermaLensResult.iga_score} / 4)
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-snug">
                        Suboptimal severity detected on facial presentation. Direct physician review is advised to initiate prescription therapy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Condition & IGA Card */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="sm:col-span-8 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Primary Clinical Classification (1 of 10 Spectrums)
                    </span>
                    <h4 className="text-lg font-bold text-white tracking-tight">
                      {dermaLensResult.detected_condition}
                    </h4>
                    <p className="text-xs text-slate-300 italic pt-1">
                      "{dermaLensResult.clinical_rationale}"
                    </p>
                  </div>

                  <div className="sm:col-span-4 flex flex-col justify-center items-center sm:items-end border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Investigator's Global Assessment
                    </span>
                    <div className="text-2xl font-black font-mono text-cyan-300 mt-0.5">
                      IGA {dermaLensResult.iga_score}
                    </div>
                    <span className="text-[11px] font-mono text-slate-300">
                      {getIgaLabel(dermaLensResult.iga_score)}
                    </span>
                  </div>
                </div>

                {/* 0-4 IGA Visual Meter */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>IGA Scale:</span>
                    <span>Score: {dermaLensResult.iga_score} of 4</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-2 rounded-full overflow-hidden">
                    {[0, 1, 2, 3, 4].map((step) => {
                      const isActive = step <= dermaLensResult.iga_score;
                      const isCurrent = step === dermaLensResult.iga_score;
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
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                    <span>0: Clear</span>
                    <span>1: Almost</span>
                    <span>2: Mild</span>
                    <span>3: Mod</span>
                    <span>4: Severe</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for DermaLens Result */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDermaLensResult(null);
                    setPendingFrame(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Retake Scan
                </button>

                {isModerateToSevere ? (
                  <button
                    type="button"
                    onClick={handleTriggerUrgentDoctor}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Save &amp; Connect with Doctor Right Away (Moderate to Severe: IGA {dermaLensResult.iga_score}/4)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-full sm:flex-1 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleConfirmSaveFrame}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Save to ChronoDerm Timeline &bull; IGA {dermaLensResult.iga_score} ({getIgaLabel(dermaLensResult.iga_score)})</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center font-mono">
                      Impiricus DermaLens Policy: "Connect Right Away" is reserved for Moderate to Severe (IGA 3-4). Current score is {getIgaLabel(dermaLensResult.iga_score)} (routine care).
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : selectedTab === 'camera' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Camera Video Feed always in DOM */}
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                  setStreamActive(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  streamActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                }`}
              />

              {/* Connecting loading state before stream is ready */}
              {!streamActive && !streamError && (
                <div className="p-6 text-center flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-mono">Accessing clinical camera sensor...</p>
                  <p className="text-[11px] text-slate-500">Please grant camera permissions if prompted</p>
                </div>
              )}

              {/* Error fallback state */}
              {streamError && (
                <div className="p-6 text-center flex flex-col items-center gap-3 z-10">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-slate-300 max-w-xs">{streamError}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedTab('upload')}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-cyan-400 transition-colors"
                  >
                    Switch to File Upload
                  </button>
                </div>
              )}

              {/* Standardized Anatomical Face Silhouette & Optical Alignment Reticle */}
              {streamActive && (
                <>
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-2 border-dashed border-cyan-400/30 rounded-xl m-4">
                    {scanMode === 'face' ? (
                      /* Anatomical Face Oval & Biometric Alignment Guides */
                      <div className="relative w-3/5 h-4/5 border-2 border-cyan-400/80 rounded-[50%_50%_45%_45%] flex flex-col items-center justify-between p-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                        {/* Eye alignment guide line */}
                        <div className="w-full flex items-center justify-between px-2 pt-8 opacity-60">
                          <span className="w-4 h-0.5 bg-cyan-400" />
                          <span className="text-[9px] font-mono text-cyan-300 bg-slate-950/70 px-2 py-0.5 rounded">
                            Eye Level Reticle
                          </span>
                          <span className="w-4 h-0.5 bg-cyan-400" />
                        </div>

                        {/* Center face badge */}
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/90 px-3 py-1 rounded-full border border-cyan-500/60 shadow-lg">
                          Center Face in Reticle
                        </span>

                        {/* Chin guide line */}
                        <div className="w-16 h-0.5 bg-cyan-400/60 mb-3" />
                      </div>
                    ) : (
                      <div className="w-3/4 h-3/4 border-2 border-cyan-400/80 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                        <span className="text-[11px] font-mono font-medium text-cyan-300 bg-slate-950/85 px-3 py-1 rounded-full border border-cyan-500/50 shadow-lg">
                          Center Target Area Here
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Telemetry pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 text-[10px] font-mono text-emerald-400 border border-emerald-500/40 shadow-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>DermaLens Sensor: Ready &bull; Lighting: Optimal</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-8 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700 hover:border-cyan-400 transition-colors cursor-pointer text-slate-400 hover:text-white"
            >
              <Upload className="w-10 h-10 text-cyan-400" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">Click or drag &amp; drop skin / face photo here</p>
                <p className="text-xs text-slate-500 mt-1">Impiricus DermaLens will automatically evaluate facial morphology &amp; IGA</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30 text-white p-6 text-center">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Impiricus DermaLens™ Evaluation Engine
                </p>
                <p className="text-xs font-mono text-cyan-300 max-w-sm">
                  {analysisStatusText}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                10-Point Clinical Spectrum &bull; 0-4 IGA Global Assessment &bull; Triage Alert Mapping
              </div>
            </div>
          )}
        </div>

        {/* Form Controls: Week, Day, Date, Notes */}
        {!dermaLensResult && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono">Week Number</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={week}
                  onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono">Day Number</label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono">Date Taken</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-mono">Clinical / Patient Notes</label>
              <input
                type="text"
                placeholder="e.g. Day 14 checkpoint: facial redness, itching severity..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              {selectedTab === 'camera' && streamActive && (
                <button
                  type="button"
                  onClick={captureFromVideo}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Face &amp; Evaluate with DermaLens</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

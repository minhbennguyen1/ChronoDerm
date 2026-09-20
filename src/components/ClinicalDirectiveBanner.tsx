import React, { useState } from 'react';
import {
  Bell,
  CreditCard,
  Package,
  Camera,
  X,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ClinicalDirective } from '../types';
import { ImpiricusCopayCardModal } from './ImpiricusCopayCardModal';

interface ClinicalDirectiveBannerProps {
  directive: ClinicalDirective;
  onDismiss: () => void;
  onLaunchCamera: () => void;
  onNavigateToMap: () => void;
  onNavigateToDoctor: () => void;
  patientCondition?: string;
  patientName?: string;
}

export const ClinicalDirectiveBanner: React.FC<ClinicalDirectiveBannerProps> = ({
  directive,
  onDismiss,
  onLaunchCamera,
  onNavigateToMap,
  onNavigateToDoctor,
  patientCondition = 'Inflammatory Dermatosis',
  patientName = 'Patient',
}) => {
  const [isCopayModalOpen, setIsCopayModalOpen] = useState(false);
  const [showSampleInstructions, setShowSampleInstructions] = useState(false);
  const [showScanDetails, setShowScanDetails] = useState(false);

  // Badge and theme colors based on directive type
  const isEscalate = directive.type === 'escalate_regimen';
  const isSample = directive.type === 'invite_sample';
  const isDailyScans = directive.type === 'request_daily_scans';

  return (
    <>
      <div className="w-full relative overflow-hidden rounded-3xl border-2 border-cyan-400 bg-gradient-to-r from-slate-950 via-[#0c1425] to-slate-950 shadow-2xl shadow-cyan-500/20 p-5 animate-in fade-in slide-in-from-top-4">
        {/* Glowing atmospheric accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-500/10 via-purple-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Icon & Narrative Header */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isEscalate
                  ? 'bg-gradient-to-tr from-emerald-400 to-cyan-500 text-slate-950 shadow-emerald-500/30'
                  : isSample
                  ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-purple-500/30'
                  : 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-rose-500/30'
              }`}
            >
              {isEscalate ? (
                <CreditCard className="w-6 h-6" />
              ) : isSample ? (
                <Package className="w-6 h-6" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  HCP Clinical Directive &bull; In-App Alert
                </span>

                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-cyan-400" />
                  {directive.doctorName}
                </span>

                <span className="text-[10px] font-mono text-slate-500">
                  &bull; {directive.createdAt || 'Just now'}
                </span>
              </div>

              <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{directive.title}</span>
                {directive.subtext && (
                  <span className="hidden sm:inline-block text-xs font-mono font-normal text-slate-400">
                    ({directive.subtext})
                  </span>
                )}
              </h4>

              {/* Exact Notification Copy */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                {directive.message}
              </p>
            </div>
          </div>

          {/* Right: 1-Click Interactive In-App Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {isEscalate && (
              <>
                <button
                  type="button"
                  onClick={() => setIsCopayModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Download $0 Co-Pay Card</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToDoctor}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View e-Rx Details</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </>
            )}

            {isSample && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSampleInstructions(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-500/30 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Front Desk Instructions</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToMap}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>Locate Clinic</span>
                </button>
              </>
            )}

            {isDailyScans && (
              <>
                <button
                  type="button"
                  onClick={onLaunchCamera}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  <span>Open Alignment Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowScanDetails(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>7-Day Protocol</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onDismiss}
              title="Acknowledge and dismiss directive"
              className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Acknowledge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Impiricus $0 Co-Pay Savings Card Digital Modal */}
      <ImpiricusCopayCardModal
        isOpen={isCopayModalOpen}
        onClose={() => setIsCopayModalOpen(false)}
        doctorName={directive.doctorName}
        patientName={patientName}
        conditionName={patientCondition}
      />

      {/* Front Desk Starter Kit Instructions Modal */}
      {showSampleInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#0a0f1d] border border-purple-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Starter Kit Front Desk Pick-Up</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleInstructions(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <span className="text-[10px] font-mono text-purple-300 uppercase block font-bold">
                  Authorized by {directive.doctorName}
                </span>
                <p className="mt-1 text-white font-medium">
                  Complimentary Biologic Starter Kit (Prescription Samples authorized under PDMA § 503).
                </p>
              </div>

              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Visit the Schweiger Dermatology Group clinic reception desk.</li>
                <li>State your name and show this in-app directive authorization.</li>
                <li>Your starter package includes cold-chain travel pouch, injection guide, and first-dose instructions.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowSampleInstructions(false);
                  onNavigateToMap();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View Clinic Map</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSampleInstructions(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Acute Protocol Modal */}
      {showScanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#0a0f1d] border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">7-Day Acute Scan Protocol</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScanDetails(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">
                  Care Team Directive
                </span>
                <p className="mt-1 text-white font-medium">
                  {directive.doctorName} switched your monitoring interval from weekly to daily acute flare tracking for the next 7 days.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Capture Frequency:</span>
                  <span className="text-amber-400 font-bold">Daily (Same Lighting)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Auto-Alignment:</span>
                  <span className="text-cyan-400 font-bold">Guided Ghost Silhouette</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Triage Escalation:</span>
                  <span className="text-emerald-400 font-bold">Direct Doctor Feed</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowScanDetails(false);
                  onLaunchCamera();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Launch Camera Now</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScanDetails(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

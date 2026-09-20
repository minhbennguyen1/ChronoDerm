import React from 'react';
import { Sparkles, Camera, Layers, Activity, UserCheck, ArrowRight, UserPlus } from 'lucide-react';

interface TryOutGuideProps {
  onExploreCases: () => void;
  onTryCamera: () => void;
  onGoToPersonalAccount: () => void;
  isGuestDemo: boolean;
}

export const TryOutGuide: React.FC<TryOutGuideProps> = ({
  onExploreCases,
  onTryCamera,
  onGoToPersonalAccount,
  isGuestDemo,
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Hero Card */}
      <div className="glass-card-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">New User Test Drive</h2>
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Try Now Mode
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Explore the 3D skin time-machine using clinical trial benchmark data. Ready to track your own skin with zero pre-existing data? Log in to your personal account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToPersonalAccount}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Open My Personal Account</span>
          </button>
        </div>

        {/* Guided Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
              <span>01 &bull; 3D SLIDER</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Continuous Time Machine</h3>
              <p className="text-xs text-slate-400 mt-1">
                Drag the interactive slider to watch skin heal over 5 clinical trial weeks with real-time 3D parallax.
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreCases}
              className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 font-mono pt-2"
            >
              <span>Test 3D Slider</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
              <span>02 &bull; OPTICAL SENSOR</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Camera Alignment & Telemetry</h3>
              <p className="text-xs text-slate-400 mt-1">
                Test the camera overlay with anatomical framing, orientation sensors, and photometric Dawson erythema scoring.
              </p>
            </div>
            <button
              type="button"
              onClick={onTryCamera}
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-mono pt-2"
            >
              <span>Open Test Camera</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 text-pink-400 text-xs font-mono font-bold">
              <span>03 &bull; ZERO DATA CLEAN SLATE</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Personal Account Storage</h3>
              <p className="text-xs text-slate-400 mt-1">
                Logging in gives you an isolated personal timeline with zero pre-existing placeholder data. All photos save strictly to your account.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToPersonalAccount}
              className="flex items-center gap-1.5 text-xs text-pink-300 hover:text-pink-200 font-mono pt-2"
            >
              <span>Switch to Personal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

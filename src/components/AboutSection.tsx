import React from 'react';
import { ShieldCheck, Cpu, Camera, Clock, Layers, Sparkles } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4 text-slate-300">
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">About ChronoDerm</h2>
          <p className="text-sm text-slate-400 mt-1">
            Clinical-grade interactive 3D longitudinal skin time-machine and standardized optical tracking platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono">
              <Clock className="w-4 h-4" />
              <span>CONTINUOUS 3D TIME MACHINE</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Smooth cross-dissolve and 3D parallax morphing allowing patients and dermatologists to inspect recovery day-by-day and week-by-week.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
              <Camera className="w-4 h-4" />
              <span>STANDARDIZED OPTICAL ALIGNMENT</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Silhouette overlays and orientation guides ensure every photo is captured at the same angle, distance, and lighting for scientific comparability.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-xs font-mono">
              <Cpu className="w-4 h-4" />
              <span>PRESAGE OPTICAL TELEMETRY</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Photometric algorithms (Dawson log10 red-to-green ratio) quantify erythema indices, microvascular perfusion, and lesion area objectively.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>ACCOUNT-PARTITIONED PRIVACY</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Photos and medical timelines are stored client-side in partitioned IndexedDB accounts with zero pre-existing dummy data for real users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

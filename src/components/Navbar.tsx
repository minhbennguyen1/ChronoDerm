import React from 'react';
import {
  Activity,
  Camera,
  Layers,
  Sparkles,
  Stethoscope,
  Info,
  User,
  ChevronDown,
  HardDrive,
  Bot,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Package,
  CreditCard,
  Calendar
} from 'lucide-react';
import { ClinicalCase, UserAccount, UserRole } from '../types';

export type AppNavTab = 'slider' | 'doctor' | 'chat' | 'map' | 'tryout' | 'hcp' | 'samples_copay' | 'appointments' | 'about';

interface NavbarProps {
  cases: ClinicalCase[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  onLaunchCamera: () => void;
  currentUser: UserAccount;
  onOpenAccountModal: () => void;
  hasLowScoreAlert?: boolean;
  currentRole: UserRole;
  onToggleRole: (role: UserRole) => void;
  activeDoctorName?: string;
  pendingTriageCount?: number;
  hasPendingRecommendation?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  activeTab,
  onSelectTab,
  onLaunchCamera,
  currentUser,
  onOpenAccountModal,
  hasLowScoreAlert = false,
  currentRole,
  onToggleRole,
  activeDoctorName = 'Dr. Rachel Nazarian, MD',
  pendingTriageCount = 0,
  hasPendingRecommendation = false,
}) => {
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080b12]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Case Selector */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onSelectTab(currentRole === 'hcp' ? 'hcp' : 'slider')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">ChronoDerm</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  AI
                </span>
                {currentRole === 'hcp' && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    HCP Clinician
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                {currentRole === 'hcp' ? 'Impiricus Clinician Portal' : 'Clinical Skin Time-Machine'}
              </p>
            </div>
          </div>

          {/* Case Selector Dropdown */}
          {cases.length > 1 && (
            <div className="relative ml-1 hidden sm:block">
              <select
                value={activeCaseId}
                onChange={(e) => onSelectCase(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.patientInitials} ({c.condition} - {c.frames.length} photos)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Center: Top-Level Role Segmented Switch (Patient vs HCP) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => onToggleRole('patient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentRole === 'patient'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleRole('hcp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentRole === 'hcp'
                ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 text-white shadow-md shadow-purple-500/30 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>HCP Clinician Portal</span>
            {pendingTriageCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                {pendingTriageCount}
              </span>
            )}
          </button>
        </div>

        {/* Navigation Tabs based on Role */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
          {currentRole === 'patient' ? (
            /* Patient-Only Tabs */
            <>
              <button
                type="button"
                onClick={() => onSelectTab('slider')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'slider'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Time Machine</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('doctor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'doctor'
                    ? 'bg-gradient-to-r from-rose-500/25 to-red-500/25 text-rose-200 border border-rose-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                <span>Connect Doctor</span>
                {hasPendingRecommendation ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-black animate-pulse shadow-sm">
                    1 Invite
                  </span>
                ) : hasLowScoreAlert ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black animate-pulse">
                    Urgent
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Chatbot</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'map'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>US Clinic Map</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('tryout')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'tryout'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Now</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('about')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'about'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>About</span>
              </button>
            </>
          ) : (
            /* HCP-Specific Tabs */
            <>
              <button
                type="button"
                onClick={() => onSelectTab('hcp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'hcp'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
                <span>Patient Queue &amp; Triage</span>
                {pendingTriageCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black animate-pulse">
                    {pendingTriageCount} Alert{pendingTriageCount > 1 ? 's' : ''}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('slider')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'slider'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clinical Dataset Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('samples_copay')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'samples_copay'
                    ? 'bg-gradient-to-r from-purple-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-purple-400" />
                <span>Samples &amp; Co-Pay Database</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('appointments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'appointments'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Appointments &amp; Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'map'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clinic Network Map</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('about')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeTab === 'about'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Clinical Criteria</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentRole === 'patient' ? (
            /* Patient Right Actions: Camera Trigger & Account */
            <>
              <button
                type="button"
                onClick={onLaunchCamera}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Align Camera</span>
              </button>

              <button
                type="button"
                onClick={onOpenAccountModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer text-xs"
                title="Manage account & data storage"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-[10px] font-mono font-bold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-200 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 leading-none">
                    {currentUser.isGuestDemo ? 'Demo Mode' : 'Personal'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
              </button>
            </>
          ) : (
            /* HCP Right Actions: Physician Credentials & Impiricus Verified Badge */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/50 flex items-center justify-center text-xs font-bold font-mono">
                  Dr
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-purple-200">{activeDoctorName}</span>
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400">Impiricus Verified Provider</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAccountModal}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Account Settings"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { User, Mail, ShieldCheck, Sparkles, LogOut, Check, X } from 'lucide-react';
import { UserAccount } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  currentUser: UserAccount;
  onClose: () => void;
  onLogin: (email: string, name?: string) => void;
  onEnterDemo: () => void;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLogin,
  onEnterDemo,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    onLogin(emailInput, nameInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Account & Storage</h3>
            <p className="text-xs text-slate-400">
              Personal accounts save real skin photos with zero pre-existing data
            </p>
          </div>
        </div>

        {/* Current User Status Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-mono font-bold shrink-0">
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
                {currentUser.isGuestDemo ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Try Now Demo
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Personal Account
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {currentUser.isGuestDemo ? (
              <button
                type="button"
                onClick={() => {
                  onLogin('agadkarvineet0@gmail.com', 'Vineet Agadkar');
                  onClose();
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
              >
                Go to My Account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onEnterDemo();
                  onClose();
                }}
                className="text-xs font-mono px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                title="Switch to Try Now demo mode"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Try Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Sign In to Different Account */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-300 tracking-wide font-mono uppercase">
            Sign In or Switch Account
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. agadkarvineet0@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pl-9 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Vineet"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            Sign In to Account
          </button>
        </form>

        {/* Quick Account Switch Preset */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
          <span className="text-[11px] font-mono text-slate-400">Quick Profile Access:</span>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                onLogin('agadkarvineet0@gmail.com', 'Vineet Agadkar');
                onClose();
              }}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                  VA
                </div>
                <div>
                  <div className="text-white font-semibold">Vineet Agadkar</div>
                  <div className="text-[10px] text-slate-400 font-mono">agadkarvineet0@gmail.com</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">Personal (Clean)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { SkinTimelineFrame } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  frame: SkinTimelineFrame | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  frame,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !frame) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with warning icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Delete Photo Checkpoint?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This photo will be removed from your timeline and permanently deleted from your account storage.
            </p>
          </div>
        </div>

        {/* Target Frame Snapshot Preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
          {frame.imageUrl ? (
            <img
              src={frame.imageUrl}
              alt={frame.label}
              className="w-16 h-16 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center text-slate-600 shrink-0">
              <AlertTriangle className="w-6 h-6 text-slate-600" />
            </div>
          )}

          <div className="flex flex-col text-xs gap-1 min-w-0">
            <span className="font-bold text-white truncate">{frame.label}</span>
            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300">
              <span>Week {frame.week}</span>
              <span>&bull;</span>
              <span>Day {frame.day}</span>
            </div>
            {frame.date && (
              <span className="text-[10px] text-slate-400 font-mono">{frame.date}</span>
            )}
            <span className="text-[10px] font-mono text-emerald-400">
              Erythema Index: {frame.erythemaIndex}
            </span>
          </div>
        </div>

        {/* Confirmation Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

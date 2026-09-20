import React, { useState } from 'react';
import {
  CreditCard,
  X,
  Download,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  Building,
  HelpCircle
} from 'lucide-react';

interface ImpiricusCopayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
  patientName?: string;
  conditionName?: string;
  medicationName?: string;
}

export const ImpiricusCopayCardModal: React.FC<ImpiricusCopayCardModalProps> = ({
  isOpen,
  onClose,
  doctorName = 'Dr. Rachel Nazarian, MD, FAAD',
  patientName = 'Patient (Active Member)',
  conditionName = 'Atopic Dermatitis / Inflammatory Dermatosis',
  medicationName = 'Targeted Biologic Therapy (Dupilumab / Secukinumab / Upadacitinib)',
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => {
      // simulate print or download
      const element = document.createElement('a');
      const file = new Blob(
        [
          `IMPIRICUS CO-PAY SAVINGS CARD\n` +
          `===================================\n` +
          `Member: ${patientName}\n` +
          `RxBIN: 004336\n` +
          `RxPCN: ADV\n` +
          `RxGroup: IMPIRICUS01\n` +
          `Cardholder ID: CHRONO-772910\n` +
          `Patient Copay: $0.00 / month\n` +
          `Max Benefit: Up to $1,500 / year\n` +
          `Authorized by: ${doctorName}\n` +
          `Condition: ${conditionName}\n` +
          `Valid at all US retail & specialty pharmacies.\n` +
          `Pharmacist Help Desk: 1-800-555-0199\n`
        ],
        { type: 'text/plain' }
      );
      element.href = URL.createObjectURL(file);
      element.download = 'Impiricus-0-Copay-Savings-Card.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#0a0f1d] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl shadow-cyan-500/20 flex flex-col gap-5 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Impiricus Manufacturer Co-Pay Card
                </h3>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  $0 Copay
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prescription Savings Voucher &bull; Authorized by {doctorName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital Co-Pay Card UI (Glass Card Aesthetics) */}
        <div className="relative z-10 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border-2 border-emerald-500/40 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs">
                I
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-white uppercase">
                  Impiricus Co-Pay Bridge
                </span>
                <span className="block text-[9px] font-mono text-emerald-300">
                  Commercial Patient Assistance Program
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Patient Cost</span>
              <span className="block text-xl font-black font-mono text-emerald-400">
                $0.00 / mo
              </span>
            </div>
          </div>

          {/* Card Processing Values */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">RxBIN</span>
              <span className="font-bold text-white">004336</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">RxPCN</span>
              <span className="font-bold text-white">ADV</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">RxGroup</span>
              <span className="font-bold text-emerald-300">IMPIRICUS01</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Member ID</span>
              <span className="font-bold text-cyan-300">CHRONO-772910</span>
            </div>
          </div>

          {/* Benefit Terms */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-emerald-300">Maximum Annual Benefit:</strong> Up to{' '}
              <span className="font-mono font-bold text-white">$1,500/year</span> in manufacturer co-pay assistance. Present this digital voucher or bin info to any US retail or specialty pharmacy.
            </div>
          </div>
        </div>

        {/* Pharmacy Instructions */}
        <div className="relative z-10 text-xs text-slate-400 space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pharmacy Instructions:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Submit primary commercial insurance first, then submit balance to Impiricus under Secondary Payer using RxBIN 004336. Patient responsibility is reduced to $0.00.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="relative z-10 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Card Saved / Printed</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>Download &amp; Print Card</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Package,
  CreditCard,
  Send,
  Building2,
  Clock,
  ShieldCheck,
  Calendar,
  FileText,
  User,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  ExternalLink,
  Search,
  Filter,
  Check,
  MapPin,
  Sparkles,
  Inbox,
  AlertCircle,
  Zap,
  Bell,
  ArrowRight
} from 'lucide-react';
import {
  ClinicalCase,
  SkinTimelineFrame,
  SampleRequestOrder,
  PatientConsultationRecord,
  ClinicalDirective,
  ClinicalDirectiveType,
  CopayCardRecord,
  AppointmentRecord,
  AppointmentRecommendation
} from '../types';
import { getEffectiveIgaScore, getIgaDetails } from '../utils/dermaLensHelper';

interface HCPDashboardProps {
  cases: ClinicalCase[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onNavigateToSlider: () => void;
  activeDoctorId?: string;
  activeDoctorName?: string;
  sampleOrders: SampleRequestOrder[];
  onAddSampleOrder: (order: SampleRequestOrder) => void;
  copayCards?: CopayCardRecord[];
  onAddCopayCard?: (card: CopayCardRecord) => void;
  activeDirective?: ClinicalDirective | null;
  onSendDirective?: (directive: ClinicalDirective) => void;
  onNavigateToSamplesCopay?: () => void;
  onNavigateToAppointments?: () => void;
  onOpenRecommendAppointmentModal?: (patientCase: ClinicalCase) => void;
}

export const HCPDashboard: React.FC<HCPDashboardProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onNavigateToSlider,
  activeDoctorId = 'dr-nazarian',
  activeDoctorName = 'Dr. Rachel Nazarian, MD, FAAD',
  sampleOrders,
  onAddSampleOrder,
  copayCards = [],
  onAddCopayCard,
  activeDirective,
  onSendDirective,
  onNavigateToSamplesCopay,
  onNavigateToAppointments,
  onOpenRecommendAppointmentModal,
}) => {
  // Active Case resolution
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0] || null;

  // Filter for patient inbox
  const [filterMode, setFilterMode] = useState<'all' | 'urgent' | 'stable'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sample Modal state
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [sampleDrug, setSampleDrug] = useState<string>('Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)');
  const [sampleClinicAddress, setSampleClinicAddress] = useState<string>(
    'Schweiger Dermatology Group - Midtown, 110 E 55th St, 14th Fl, New York, NY 10022'
  );
  const [physicianNpi, setPhysicianNpi] = useState<string>('1841398204');
  const [pdmaAttestation, setPdmaAttestation] = useState<boolean>(true);
  const [sampleUrgency, setSampleUrgency] = useState<'overnight' | 'standard'>('overnight');

  // Co-Pay e-Rx Modal state
  const [isCopayModalOpen, setIsCopayModalOpen] = useState<boolean>(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('CVS Pharmacy #4120 - 1500 Broadway, NY');
  const [rxNotes, setRxNotes] = useState<string>('Initiate Dupilumab 600mg loading dose, followed by 300mg Q2W.');

  // In-App Toast Alert State (strictly in-app, NO SMS)
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'sample' | 'copay' | 'info' | 'directive';
  } | null>(null);

  const showToast = (title: string, message: string, type: 'sample' | 'copay' | 'info' | 'directive') => {
    const id = Date.now().toString();
    setToastNotification({ id, title, message, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.id === id ? null : prev));
    }, 5500);
  };

  // 1-Click Biologic Sample Request via Impiricus
  const handleOrderTargetedBiologicSample = () => {
    const condStr = (activeCase?.condition || '').toLowerCase();
    const recommendedDrug = condStr.includes('psoriasis')
      ? 'Secukinumab 300mg SensoReady Pen Starter Kit (2x 150mg/mL)'
      : 'Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)';

    const newOrder: SampleRequestOrder = {
      id: `IMP-SMP-${Math.floor(100000 + Math.random() * 900000)}`,
      doctorId: activeDoctorId,
      patientInitials: activeCase?.patientInitials || 'J.D.',
      drugName: recommendedDrug,
      status: 'dispatched',
      orderDate: new Date().toISOString().split('T')[0],
      clinicAddress: sampleClinicAddress,
      patientCondition: activeCase?.condition,
      dosageDetails: 'Priority Cold-Chain Express (Overnight)',
      trackingNumber: `1Z9999999${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    onAddSampleOrder(newOrder);

    // Exact required confirmation toast: "Sample request routed to Impiricus."
    showToast(
      'Sample request routed to Impiricus.',
      `Complimentary targeted biologic starter pack (${recommendedDrug}) ordered for ${activeCase?.patientInitials}. Tracking #${newOrder.trackingNumber}.`,
      'sample'
    );
  };

  // 1-Click Clinical Directives (Doctor-to-Patient Outreach)
  const handleSendDirective = (type: ClinicalDirectiveType) => {
    let title = '';
    let message = '';
    let subtext = '';

    if (type === 'escalate_regimen') {
      title = 'Treatment Protocol Escalated';
      subtext = 'Attach Impiricus Co-Pay Card & Rx';
      message = `Dr. ${activeDoctorName} has escalated your treatment protocol. Tap here to download your Impiricus $0 Co-Pay Savings Card and view pharmacy details.`;
    } else if (type === 'invite_sample') {
      title = 'Complimentary Biologic Starter Kit Ready';
      subtext = 'Tell patient to pick up starter kit at front desk';
      message = `Dr. ${activeDoctorName} has authorized a complimentary biologic starter kit for you. Please pick up your starter pack at the clinic front desk.`;
    } else {
      title = 'Acute Flare Protocol: Daily Checkpoints Requested';
      subtext = 'Switch tracking to 7-day acute interval';
      message = `Dr. ${activeDoctorName} has requested daily acute-interval tracking scans for the next 7 days to monitor flare resolution.`;
    }

    const directive: ClinicalDirective = {
      id: `DIR-${Date.now()}`,
      type,
      doctorName: activeDoctorName,
      patientInitials: activeCase?.patientInitials,
      patientId: activeCase?.id,
      title,
      message,
      subtext,
      createdAt: 'Just now',
      acknowledged: false,
    };

    if (onSendDirective) {
      onSendDirective(directive);
    }

    showToast(
      'In-App Clinical Directive Dispatched',
      `Sent 1-click directive "${title}" to ${activeCase?.patientInitials}'s in-app notification feed.`,
      'directive'
    );
  };

  // Extract frames & latest telemetry
  const frames = activeCase?.frames || [];
  const baselineFrame = frames[0];
  const latestFrame = frames[frames.length - 1];

  const baselineEI = baselineFrame?.erythemaIndex || 0;
  const latestEI = latestFrame?.erythemaIndex || 0;
  const clearancePct = baselineEI > 0
    ? Math.max(0, Math.round(((baselineEI - latestEI) / baselineEI) * 100))
    : 0;

  // DermaLens Evaluation for active case
  const effectiveIga = latestFrame
    ? getEffectiveIgaScore(latestFrame, latestFrame.dermaLensEvaluation)
    : 0;
  const isSuboptimalFlare = effectiveIga >= 3 || latestFrame?.dermaLensEvaluation?.status === 'suboptimal';

  // Filtered patients in inbox
  const filteredCases = cases.filter((c) => {
    const lastFrame = c.frames[c.frames.length - 1];
    const iga = lastFrame ? getEffectiveIgaScore(lastFrame, lastFrame.dermaLensEvaluation) : 0;
    const isUrgent = iga >= 3 || lastFrame?.dermaLensEvaluation?.status === 'suboptimal';

    if (filterMode === 'urgent' && !isUrgent) return false;
    if (filterMode === 'stable' && isUrgent) return false;

    if (searchQuery.trim()) {
      const q = (searchQuery || '').toLowerCase().trim();
      return (
        (c.patientInitials || '').toLowerCase().includes(q) ||
        (c.condition || '').toLowerCase().includes(q) ||
        (c.medication || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const urgentCount = cases.filter((c) => {
    const last = c.frames[c.frames.length - 1];
    return last && (getEffectiveIgaScore(last, last.dermaLensEvaluation) >= 3 || last.dermaLensEvaluation?.status === 'suboptimal');
  }).length;

  // Handle Dispatch Sample Action
  const handleConfirmSampleOrder = () => {
    if (!pdmaAttestation) {
      alert('Please check the PDMA compliance attestation checkbox before requesting samples.');
      return;
    }

    const orderId = `IMP-SMP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: SampleRequestOrder = {
      id: orderId,
      doctorId: activeDoctorId,
      patientInitials: activeCase?.patientInitials || 'Patient',
      drugName: sampleDrug,
      status: 'dispatched',
      orderDate: new Date().toISOString().split('T')[0],
      clinicAddress: sampleClinicAddress,
      patientCondition: activeCase?.condition,
      dosageDetails: sampleUrgency === 'overnight' ? 'Priority Cold-Chain Express (Overnight)' : 'Standard Medical Dispatch',
      trackingNumber: `1Z9999999${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    onAddSampleOrder(newOrder);
    setIsSampleModalOpen(false);

    showToast(
      'Clinical Sample Dispatch Confirmed via Impiricus Provider Portal',
      `Requested ${sampleDrug} dispatched to ${sampleClinicAddress.split(',')[0]} for patient ${activeCase?.patientInitials}. Tracking #${newOrder.trackingNumber}.`,
      'sample'
    );
  };

  // Handle Co-Pay Sponsored e-Rx
  const handleConfirmCopayRx = () => {
    const newCard: CopayCardRecord = {
      id: `CPY-${Date.now()}`,
      cardVoucherId: `IMP-CPY-${Math.floor(100000 + Math.random() * 900000)}`,
      patientName: `Patient ${activeCase?.patientInitials || 'A.M.'}`,
      patientInitials: activeCase?.patientInitials || 'A.M.',
      doctorId: activeDoctorId,
      doctorName: activeDoctorName,
      drugName: activeCase?.medication || 'Dupilumab (Dupixent)',
      condition: activeCase?.condition || 'Atopic Dermatitis',
      designatedPharmacy: selectedPharmacy,
      binNumber: '022938',
      pcnNumber: 'ADV',
      groupId: 'W48102',
      memberId: `IMP${Math.floor(10000000 + Math.random() * 90000000)}`,
      copayAmount: '$0.00',
      maxAnnualSavings: '$1,500.00',
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'routed_to_pharmacy',
      notes: rxNotes,
    };

    onAddCopayCard?.(newCard);
    setIsCopayModalOpen(false);
    showToast(
      'Impiricus $0 Co-Pay Sponsored e-Rx Dispatched',
      `Manufacturer Co-Pay Savings Card ($0 patient copay, up to $1,500/yr value) attached and transmitted to ${selectedPharmacy}. Stored in Clinical Database.`,
      'copay'
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification Container (Strictly in-app, NO SMS) */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5">
          <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 text-white shadow-2xl backdrop-blur-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
              {toastNotification.type === 'sample' ? (
                <Package className="w-5 h-5 text-purple-400" />
              ) : toastNotification.type === 'copay' ? (
                <CreditCard className="w-5 h-5 text-emerald-400" />
              ) : toastNotification.type === 'directive' ? (
                <Bell className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-cyan-300 font-mono tracking-wide uppercase">
                  Impiricus In-App Provider Alert
                </span>
                <button
                  type="button"
                  onClick={() => setToastNotification(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h5 className="text-sm font-bold text-white mt-0.5 leading-snug">
                {toastNotification.title}
              </h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {toastNotification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Clinician Header & Practice Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/25">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {activeDoctorName}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Impiricus Verified Clinician
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Schweiger Dermatology Group &bull; NPI: {physicianNpi} &bull; Active State Licenses: NY, CA, NJ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToSlider}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Open 3D Time Machine</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSampleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Request Biologic Sample</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Patient Inbox on Left, Detailed Clinical Review on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Roster / Triage Inbox (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Patient Triage Queue</h3>
              </div>
              {urgentCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold animate-pulse">
                  {urgentCount} High-Priority Flare{urgentCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`py-1 rounded-lg text-center transition-colors cursor-pointer ${
                  filterMode === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({cases.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('urgent')}
                className={`py-1 rounded-lg text-center transition-colors cursor-pointer ${
                  filterMode === 'urgent' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Flares ({urgentCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('stable')}
                className={`py-1 rounded-lg text-center transition-colors cursor-pointer ${
                  filterMode === 'stable' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stable
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, condition, drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Patient Cards List */}
            <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = c.id === activeCaseId;
                const lastFrame = c.frames[c.frames.length - 1];
                const iga = lastFrame ? getEffectiveIgaScore(lastFrame, lastFrame.dermaLensEvaluation) : 0;
                const isUrgent = iga >= 3 || lastFrame?.dermaLensEvaluation?.status === 'suboptimal';

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                          {c.patientInitials}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white leading-tight block">
                            Patient {c.patientInitials} ({c.age}y)
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {c.condition}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {isUrgent ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold animate-pulse">
                            IGA {iga}/4 Alert
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                            IGA {iga}/4
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>{c.frames.length} Checkpoints</span>
                      <span>Adherence: {c.adherenceRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Samples & Co-Pay Database Navigation Widget */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white">Fulfillment &amp; Co-Pay Database</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                Audited
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Central clinical database tracking all physician biologic samples ordered and manufacturer $0 co-pay cards attached for patients.
            </p>

            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/20">
                <div className="text-base font-black text-purple-400">{sampleOrders.length}</div>
                <div className="text-[10px] text-slate-400">Samples Dispatched</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/20">
                <div className="text-base font-black text-emerald-400">{copayCards.length}</div>
                <div className="text-[10px] text-slate-400">Co-Pay Cards Active</div>
              </div>
            </div>

            {onNavigateToSamplesCopay && (
              <button
                type="button"
                onClick={onNavigateToSamplesCopay}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-emerald-600/20 hover:from-purple-600/30 hover:to-emerald-600/30 border border-purple-500/30 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-purple-400"
              >
                <Package className="w-3.5 h-3.5 text-purple-400" />
                <span>Open Samples &amp; Co-Pay Database</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {onNavigateToAppointments && (
              <button
                type="button"
                onClick={onNavigateToAppointments}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>View Appointments Schedule</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Active Patient Longitudinal Detail & Triage Action (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {activeCase ? (
            <>
              {/* URGENT FLARE STEP-UP BANNER (Shown for suboptimal or IGA >= 3) */}
              {isSuboptimalFlare && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/80 via-red-950/60 to-purple-950/80 border-2 border-rose-500 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/40 animate-pulse">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-rose-500 text-white">
                          Priority Triage Alert
                        </span>
                        <h4 className="text-base font-black text-white tracking-tight">
                          Urgent Flare Triage - Immediate Step-Up Required
                        </h4>
                      </div>
                      <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                        Impiricus DermaLens™ detected severe flare progression (IGA {effectiveIga}/4, Erythema Index {latestEI}/100). Patient shows inadequate response to current line of therapy. Clinical guidelines recommend initiating targeted biologic starter samples or co-pay assisted therapy.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsSampleModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Order Free Biologic Sample via Impiricus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCopayModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-slate-950" />
                      <span>$0 Co-Pay e-Rx</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Case Summary Card */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Patient {activeCase.patientInitials} ({activeCase.age}y) &bull; Longitudinal Dossier
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {activeCase.condition}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Prescribed: {activeCase.medication} &bull; Target Anatomy: {activeCase.targetAnatomy}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenRecommendAppointmentModal && (
                      <button
                        type="button"
                        onClick={() => onOpenRecommendAppointmentModal(activeCase)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Recommend When to Meet</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsSampleModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5 text-purple-400" />
                      <span>Order Clinical Sample</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCopayModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Attach Co-Pay Card</span>
                    </button>
                  </div>
                </div>

                {/* Impiricus DermaLens Diagnostic Triage Telemetry for HCP */}
                {latestFrame?.dermaLensEvaluation && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                            Impiricus DermaLens Evaluation
                          </span>
                          <span className="text-xs font-bold text-white">
                            {latestFrame.dermaLensEvaluation.detected_condition}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic">
                          "{latestFrame.dermaLensEvaluation.clinical_rationale}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400">IGA Severity Score</div>
                          <div className="text-base font-black font-mono text-cyan-300">
                            IGA {latestFrame.dermaLensEvaluation.iga_score} / 4
                          </div>
                        </div>

                        <div className="font-mono text-xs font-bold">
                          {latestFrame.dermaLensEvaluation.status === 'optimal' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Optimal (0-1)
                            </span>
                          )}
                          {latestFrame.dermaLensEvaluation.status === 'monitoring' && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              Monitoring (2)
                            </span>
                          )}
                          {latestFrame.dermaLensEvaluation.status === 'suboptimal' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                              🚨 Suboptimal (3-4 Alert)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Longitudinal Telemetry Report Generated (DermaLens IGA {latestFrame.dermaLensEvaluation.iga_score}/4)
                      </span>
                      {onOpenRecommendAppointmentModal && (
                        <button
                          type="button"
                          onClick={() => onOpenRecommendAppointmentModal(activeCase)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-950" />
                          <span>Recommend When to Meet Based on Data Report</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Impiricus Business Integration & 1-Click Clinical Directives */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  effectiveIga >= 3 || isSuboptimalFlare
                    ? 'bg-gradient-to-br from-rose-950/40 via-[#0e1629] to-[#0a101f] border-rose-500/50 shadow-xl shadow-rose-950/20'
                    : 'bg-gradient-to-br from-[#0e1629] to-[#0a101f] border-slate-800'
                }`}>
                  {/* Impiricus Business Integration */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Impiricus Business Integration
                        </span>
                        {(effectiveIga >= 3 || isSuboptimalFlare) && (
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            🚨 Worsening Scan (IGA {effectiveIga}/4)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">
                        Directly provision compliant biologic pharmaceutical samples via Impiricus cold-chain logistics to accelerate patient recovery.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOrderTargetedBiologicSample}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                    >
                      <Package className="w-4 h-4" />
                      <span>Order Targeted Biologic Sample via Impiricus</span>
                    </button>
                  </div>

                  {/* 1-Click Clinical Directives (Doctor-to-Patient Outreach) */}
                  <div className="pt-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>1-Click Clinical Directives (Doctor-to-Patient Outreach)</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          1-click outreach without typing — dispatches an immediate in-app clinical alert to {activeCase.patientInitials}'s feed.
                        </p>
                      </div>

                      {activeDirective && (
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Active Patient Directive: {activeDirective.title}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 1. Escalate Regimen */}
                      <button
                        type="button"
                        onClick={() => handleSendDirective('escalate_regimen')}
                        className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-400/60 text-left transition-all group cursor-pointer flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                            Directive 1
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          Escalate Regimen
                        </span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          Attach Impiricus Co-Pay Card &amp; Rx
                        </span>
                      </button>

                      {/* 2. Invite for Sample */}
                      <button
                        type="button"
                        onClick={() => handleSendDirective('invite_sample')}
                        className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-purple-400/60 text-left transition-all group cursor-pointer flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                            Directive 2
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          Invite for Sample
                        </span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          Tell patient to pick up starter kit at front desk
                        </span>
                      </button>

                      {/* 3. Request Daily Scans */}
                      <button
                        type="button"
                        onClick={() => handleSendDirective('request_daily_scans')}
                        className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400/60 text-left transition-all group cursor-pointer flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                            Directive 3
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          Request Daily Scans
                        </span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          Switch tracking to 7-day acute interval
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Summary Stat Tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                    <span className="text-[11px] font-mono text-slate-400">Treatment Clearance</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono mt-1">+{clearancePct}%</span>
                    <span className="text-[10px] text-slate-500 mt-1">Erythema reduction</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                    <span className="text-[11px] font-mono text-slate-400">Saved Checkpoints</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono mt-1">{frames.length}</span>
                    <span className="text-[10px] text-slate-500 mt-1">Photos aligned</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                    <span className="text-[11px] font-mono text-slate-400">Adherence Rate</span>
                    <span className="text-2xl font-black text-purple-400 font-mono mt-1">{activeCase.adherenceRate}%</span>
                    <span className="text-[10px] text-slate-500 mt-1">Protocol compliance</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                    <span className="text-[11px] font-mono text-slate-400">Current Status</span>
                    <span className="text-sm font-bold text-white mt-2 truncate">{activeCase.currentSeverity}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Clinical grade</span>
                  </div>
                </div>
              </div>

              {/* Longitudinal Photos & Checkpoint Records */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Chronological Checkpoint Records &amp; Clinical Photos</h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {frames.length} Captured Checkpoint{frames.length > 1 ? 's' : ''}
                  </span>
                </div>

                {frames.length === 0 ? (
                  <p className="text-xs text-slate-400">No checkpoints recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {frames.map((frame: SkinTimelineFrame, index: number) => {
                      const frameIga = getEffectiveIgaScore(frame, frame.dermaLensEvaluation);
                      return (
                        <div
                          key={frame.id}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5 overflow-hidden group"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                            {frame.imageUrl ? (
                              <img
                                src={frame.imageUrl}
                                alt={frame.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                                Photo Frame #{index + 1}
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white font-mono text-[9px] font-bold">
                              {frame.date || `Day ${frame.day}`}
                            </div>
                            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-cyan-500/80 backdrop-blur-md text-slate-950 font-mono text-[9px] font-extrabold">
                              EI: {frame.erythemaIndex}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate">{frame.label}</span>
                              <span className="text-[10px] font-mono text-cyan-300">
                                IGA {frameIga}/4
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {frame.notes || 'Routine longitudinal checkpoint scan.'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 glass-card rounded-2xl border border-slate-800">
              Select a patient from the left triage inbox to view longitudinal clinical telemetry.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: IMPIRICUS CLINICAL SAMPLE ORDERING MODAL */}
      {isSampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-[#0b0f19] border-2 border-purple-500/60 rounded-3xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      Order Free Clinical Sample via Impiricus
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      PDMA Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Complimentary in-office biologic and topical initiation sample packs for licensed HCPs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSampleModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Patient Context */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-mono block text-[10px]">Recipient Patient:</span>
                  <span className="text-white font-bold text-sm">
                    {activeCase?.patientInitials} ({activeCase?.condition || 'Skin Condition'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-mono block text-[10px]">Current Severity:</span>
                  <span className="text-rose-400 font-mono font-bold">
                    IGA {effectiveIga}/4 (Severe Flare)
                  </span>
                </div>
              </div>

              {/* Sample Product Selection */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Select Biologic / Targeted Starter Sample:
                </label>
                <select
                  value={sampleDrug}
                  onChange={(e) => setSampleDrug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)">
                    Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg) - Atopic Dermatitis
                  </option>
                  <option value="Secukinumab 300mg SensoReady Pen Starter Kit (2x 150mg/mL)">
                    Secukinumab 300mg SensoReady Pen Starter Kit (2x 150mg/mL) - Psoriasis
                  </option>
                  <option value="Ruxolitinib 1.5% Cream 60g Clinic Demonstration Tube">
                    Ruxolitinib 1.5% Cream 60g Clinic Demonstration Tube - Eczema / Vitiligo
                  </option>
                  <option value="Tofacitinib 2% Topical Barrier Ointment 45g Starter">
                    Tofacitinib 2% Topical Barrier Ointment 45g Starter
                  </option>
                </select>
              </div>

              {/* Delivery Clinic Address (Pre-populated from Doctor Profile) */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Clinic Delivery Address (PDMA Registered Site):
                </label>
                <input
                  type="text"
                  value={sampleClinicAddress}
                  onChange={(e) => setSampleClinicAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Physician NPI Number</label>
                  <input
                    type="text"
                    value={physicianNpi}
                    onChange={(e) => setPhysicianNpi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Cold-Chain Dispatch Speed</label>
                  <select
                    value={sampleUrgency}
                    onChange={(e) => setSampleUrgency(e.target.value as 'overnight' | 'standard')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs"
                  >
                    <option value="overnight">Priority Overnight (24 hrs)</option>
                    <option value="standard">Standard Dispatch (2-3 days)</option>
                  </select>
                </div>
              </div>

              {/* PDMA Compliance Checkbox */}
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="pdma-checkbox"
                  checked={pdmaAttestation}
                  onChange={(e) => setPdmaAttestation(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 text-purple-600 bg-slate-950 border-slate-700 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="pdma-checkbox" className="text-[11px] text-purple-200 leading-relaxed cursor-pointer">
                  I certify that I am a licensed healthcare provider requesting medication samples for in-office patient evaluation under the Prescription Drug Marketing Act (PDMA). These samples will not be sold or billed to any patient or third-party payer.
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSampleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSampleOrder}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Confirm &amp; Dispatch Sample</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPIRICUS CO-PAY SPONSORED E-RX DISPATCH MODAL */}
      {isCopayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0b0f19] border-2 border-emerald-500/60 rounded-3xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      Send Impiricus Co-Pay Sponsored e-Rx
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      $0 Patient Copay
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Direct-to-pharmacy transmission with manufacturer commercial assistance voucher attached
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCopayModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Impiricus Co-Pay Bridge Program</span>
                  <span className="font-mono text-emerald-300 font-bold">$0.00 Out-of-Pocket</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Attaches an active commercial manufacturer co-pay card guaranteeing $0 copay (covers up to $1,500/yr in deductible / coinsurance costs).
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Target Pharmacy:</label>
                <select
                  value={selectedPharmacy}
                  onChange={(e) => setSelectedPharmacy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                >
                  <option value="CVS Pharmacy #4120 - 1500 Broadway, NY">CVS Pharmacy #4120 - 1500 Broadway, New York, NY</option>
                  <option value="Walgreens Specialty Pharmacy #1209 - 350 5th Ave, NY">Walgreens Specialty Pharmacy #1209 - 350 5th Ave, New York, NY</option>
                  <option value="Duane Reade #1438 - 100 Delancey St, NY">Duane Reade #1438 - 100 Delancey St, New York, NY</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Prescription Directives &amp; Sig:</label>
                <textarea
                  rows={3}
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCopayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCopayRx}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>Transmit e-Rx with $0 Co-Pay Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

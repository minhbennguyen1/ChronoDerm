import React, { useState } from 'react';
import {
  Package,
  CreditCard,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  Send,
  Sparkles
} from 'lucide-react';
import { SampleRequestOrder, CopayCardRecord, ClinicalCase } from '../types';

interface HcpSampleCopayDatabaseProps {
  sampleOrders: SampleRequestOrder[];
  copayCards: CopayCardRecord[];
  onOpenSampleModal?: () => void;
  onOpenCopayModal?: () => void;
  onAddSampleOrder?: (order: SampleRequestOrder) => void;
  onAddCopayCard?: (card: CopayCardRecord) => void;
  cases: ClinicalCase[];
  activeDoctorId?: string;
  activeDoctorName?: string;
  onSelectPatientCase?: (caseId: string) => void;
}

export const HcpSampleCopayDatabase: React.FC<HcpSampleCopayDatabaseProps> = ({
  sampleOrders,
  copayCards,
  onOpenSampleModal,
  onOpenCopayModal,
  onAddSampleOrder,
  onAddCopayCard,
  cases = [],
  activeDoctorId = 'dr-nazarian',
  activeDoctorName = 'Dr. Rachel Nazarian, MD, FAAD',
  onSelectPatientCase,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'samples' | 'copay'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Interactive Modal States
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isCopayModalOpen, setIsCopayModalOpen] = useState<boolean>(false);

  // New Sample Form State
  const defaultCase = cases[0];
  const [samplePatientId, setSamplePatientId] = useState<string>(defaultCase?.id || '');
  const [sampleDrug, setSampleDrug] = useState<string>(
    'Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)'
  );
  const [sampleCondition, setSampleCondition] = useState<string>(
    defaultCase?.condition || 'Atopic Dermatitis (Eczema)'
  );
  const [sampleAddress, setSampleAddress] = useState<string>(
    'Schweiger Dermatology Group - Midtown, 110 E 55th St, 14th Fl, New York, NY 10022'
  );
  const [sampleShipping, setSampleShipping] = useState<string>(
    'Priority Cold-Chain Express (Overnight 2-8°C)'
  );

  // New Copay Form State
  const [copayPatientId, setCopayPatientId] = useState<string>(defaultCase?.id || '');
  const [copayDrug, setCopayDrug] = useState<string>(
    'Dupixent (dupilumab 300mg/2mL)'
  );
  const [copayCondition, setCopayCondition] = useState<string>(
    defaultCase?.condition || 'Atopic Dermatitis (Eczema)'
  );
  const [copayPharmacy, setCopayPharmacy] = useState<string>(
    'Walgreens Specialty Pharmacy Desk - Express Routing'
  );
  const [copaySavings, setCopaySavings] = useState<string>('$1,500.00');

  // Filtered samples
  const filteredSamples = sampleOrders.filter((s) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const drugName = (s.drugName || '').toLowerCase();
    const patientInitials = (s.patientInitials || '').toLowerCase();
    const id = (s.id || '').toLowerCase();
    const trackingNumber = (s.trackingNumber || '').toLowerCase();

    const matchesSearch =
      !q ||
      drugName.includes(q) ||
      patientInitials.includes(q) ||
      id.includes(q) ||
      trackingNumber.includes(q);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered co-pay cards
  const filteredCards = copayCards.filter((c) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const drugName = (c.drugName || '').toLowerCase();
    const patientName = (c.patientName || '').toLowerCase();
    const patientInitials = (c.patientInitials || '').toLowerCase();
    const voucherId = (c.cardVoucherId || c.id || '').toLowerCase();
    const pharmacy = (c.designatedPharmacy || '').toLowerCase();

    const matchesSearch =
      !q ||
      drugName.includes(q) ||
      patientName.includes(q) ||
      patientInitials.includes(q) ||
      voucherId.includes(q) ||
      pharmacy.includes(q);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // SYNCHRONIZED TOP METRICS (computed directly from the live ledger arrays)
  const totalSamplesCount = sampleOrders.length;
  const inTransitCount = sampleOrders.filter(
    (s) => s.status === 'dispatched' || s.status === 'in_transit'
  ).length;
  const deliveredCount = sampleOrders.filter((s) => s.status === 'delivered').length;

  const activeCopayCardsCount = copayCards.filter(
    (c) => c.status === 'active' || c.status === 'routed_to_pharmacy'
  ).length;

  // Max Annual Patient Savings - Summed dynamically from all copay cards
  const totalAnnualSavingsSum = copayCards.reduce((sum, card) => {
    const raw = card.maxAnnualSavings || '$1,500.00';
    const numeric = parseFloat(raw.replace(/[^0-9.]/g, '')) || 1500;
    return sum + numeric;
  }, 0);

  // Cold-Chain Overnight Speed - Calculated from actual sample dispatches
  const coldChainOrdersCount = sampleOrders.filter((s) => {
    const text = ((s.dosageDetails || '') + ' ' + (s.drugName || '')).toLowerCase();
    return (
      text.includes('cold-chain') ||
      text.includes('overnight') ||
      text.includes('priority') ||
      text.includes('express')
    );
  }).length;
  const coldChainPercentage =
    sampleOrders.length > 0 ? Math.round((coldChainOrdersCount / sampleOrders.length) * 100) : 100;

  // Handler to open Sample Modal
  const handleOpenSample = () => {
    if (onOpenSampleModal) {
      onOpenSampleModal();
    }
    setIsSampleModalOpen(true);
  };

  // Handler to open Copay Modal
  const handleOpenCopay = () => {
    if (onOpenCopayModal) {
      onOpenCopayModal();
    }
    setIsCopayModalOpen(true);
  };

  // Submit new Biologic Sample order
  const handleCreateSampleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCase = cases.find((c) => c.id === samplePatientId) || cases[0];
    const initials = selectedCase?.patientInitials || 'P.T.';
    const trackingNum = `1Z9999999${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newOrder: SampleRequestOrder = {
      id: `IMP-SMP-${Math.floor(100000 + Math.random() * 900000)}`,
      doctorId: activeDoctorId,
      patientInitials: initials,
      drugName: sampleDrug,
      status: 'dispatched',
      orderDate: new Date().toISOString().split('T')[0],
      clinicAddress: sampleAddress,
      patientCondition: sampleCondition,
      dosageDetails: sampleShipping,
      trackingNumber: trackingNum,
    };

    if (onAddSampleOrder) {
      onAddSampleOrder(newOrder);
    }
    setIsSampleModalOpen(false);
  };

  // Submit new $0 Copay Card
  const handleCreateCopayCard = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCase = cases.find((c) => c.id === copayPatientId) || cases[0];
    const patientName = selectedCase ? `Patient ${selectedCase.patientInitials}` : 'Alex Morgan';
    const patientInitials = selectedCase?.patientInitials || 'A.M.';
    const newCard: CopayCardRecord = {
      id: `CPY-${Math.floor(100 + Math.random() * 900)}`,
      cardVoucherId: `IMP-CPY-${Math.floor(100000 + Math.random() * 900000)}`,
      patientName,
      patientInitials,
      doctorId: activeDoctorId,
      doctorName: activeDoctorName,
      drugName: copayDrug,
      condition: copayCondition,
      designatedPharmacy: copayPharmacy,
      binNumber: '004336',
      pcnNumber: 'RXPR',
      groupId: 'IMP9921',
      memberId: `IMP${Math.floor(10000000 + Math.random() * 90000000)}`,
      copayAmount: '$0.00',
      maxAnnualSavings: copaySavings,
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: 'Direct-to-pharmacy manufacturer assistance bridge attached.',
    };

    if (onAddCopayCard) {
      onAddCopayCard(newCard);
    }
    setIsCopayModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold uppercase tracking-wider">
                Impiricus Provider Network
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                Live Fulfillment &amp; Assistance Ledger
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Biologic Samples &amp; Co-Pay Card Fulfillment Database
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable clinical ledger tracking physician sample dispatches and direct-to-pharmacy manufacturer co-pay bridge cards.
            </p>
          </div>
        </div>

        {/* Working Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenSample}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Package className="w-4 h-4" />
            <span>Order Biologic Sample</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCopay}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Attach $0 Co-Pay Card</span>
          </button>
        </div>
      </div>

      {/* 4 LIVE SYNCHRONIZED METRICS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Samples Dispatched */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400">Total Samples Dispatched</span>
          <span className="text-2xl font-black text-purple-400 font-mono mt-1">
            {totalSamplesCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            {inTransitCount} In Transit &bull; {deliveredCount} Delivered
          </span>
        </div>

        {/* Metric 2: Active Co-Pay Cards */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400">Active Co-Pay Cards</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {activeCopayCardsCount}
          </span>
          <span className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            $0.00 Out-of-Pocket Guaranteed
          </span>
        </div>

        {/* Metric 3: Max Annual Patient Savings (Live Synced Sum) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400">Max Annual Patient Savings</span>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1">
            ${totalAnnualSavingsSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">
            Avg ${Math.round(totalAnnualSavingsSum / (copayCards.length || 1)).toLocaleString()} / Patient Bridge
          </span>
        </div>

        {/* Metric 4: Cold-Chain Overnight Speed (Live Synced Percentage) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400">Cold-Chain Overnight Speed</span>
          <span className="text-2xl font-black text-indigo-400 font-mono mt-1">
            {coldChainPercentage}%
          </span>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">
            {coldChainOrdersCount} of {sampleOrders.length} Priority Overnight (2-8°C)
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Segmented Control */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Ledger Records ({sampleOrders.length + copayCards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('samples')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'samples'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Biologic Samples ({sampleOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('copay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'copay'
                ? 'bg-emerald-600 text-slate-950 font-extrabold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Co-Pay Cards ({copayCards.length})</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient, drug, tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 w-52"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
          >
            <option value="all">Status: All</option>
            <option value="dispatched">Dispatched</option>
            <option value="active">Active</option>
            <option value="routed_to_pharmacy">Routed to Pharmacy</option>
          </select>
        </div>
      </div>

      {/* LEDGER CONTENT TABLE & CARDS */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Impiricus Audit &amp; Fulfillment Registry</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Attending Physician: {activeDoctorName}
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {/* SAMPLES SECTION */}
          {(filterType === 'all' || filterType === 'samples') &&
            filteredSamples.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-[10px] font-bold">
                        Biologic Sample
                      </span>
                      <span className="font-mono text-xs text-slate-400">{order.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                        {(order.status || 'dispatched').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1">{order.drugName}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono mt-1">
                      <span>
                        Patient: <strong className="text-slate-200">{order.patientInitials}</strong>
                      </span>
                      {order.patientCondition && (
                        <span>
                          Condition: <strong className="text-slate-200">{order.patientCondition}</strong>
                        </span>
                      )}
                      <span>Ordered: {order.orderDate}</span>
                    </div>

                    {order.clinicAddress && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-xl">{order.clinicAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  {order.trackingNumber && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-purple-500/30 font-mono text-xs text-purple-200 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Tracking: {order.trackingNumber}</span>
                    </div>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    {order.dosageDetails || 'Priority Cold-Chain Express'}
                  </span>
                </div>
              </div>
            ))}

          {/* CO-PAY CARDS SECTION */}
          {(filterType === 'all' || filterType === 'copay') &&
            filteredCards.map((card) => (
              <div
                key={card.id}
                className="p-4 sm:p-5 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
                        $0 Co-Pay Savings Card
                      </span>
                      <span className="font-mono text-xs text-slate-400">{card.cardVoucherId}</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                        {(card.status || 'active').replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1">
                      {card.drugName} &bull; {card.patientName} ({card.patientInitials})
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono mt-1">
                      <span>
                        Condition: <strong className="text-slate-200">{card.condition}</strong>
                      </span>
                      <span>
                        Target Pharmacy:{' '}
                        <strong className="text-emerald-300">{card.designatedPharmacy}</strong>
                      </span>
                      <span>Issued: {card.issuedDate}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 mt-1.5">
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        RxBIN: {card.binNumber}
                      </span>
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        PCN: {card.pcnNumber}
                      </span>
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        GRP: {card.groupId}
                      </span>
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
                        MEMBER: {card.memberId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {card.copayAmount} Patient Cost
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Up to {card.maxAnnualSavings} assistance/yr
                  </span>
                </div>
              </div>
            ))}

          {filteredSamples.length === 0 && filteredCards.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              No matching sample orders or co-pay cards found in registry.
            </div>
          )}
        </div>
      </div>

      {/* WORKING MODAL 1: ORDER BIOLOGIC SAMPLE */}
      {isSampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0b0f19] border-2 border-purple-500/60 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Order Biologic Clinical Sample
                  </h3>
                  <p className="text-xs text-slate-400">
                    Impiricus PDMA-Compliant Physician Sample Request
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

            <form onSubmit={handleCreateSampleOrder} className="space-y-4 text-xs">
              {/* Select Patient */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Select Patient:
                </label>
                <select
                  value={samplePatientId}
                  onChange={(e) => {
                    setSamplePatientId(e.target.value);
                    const sel = cases.find((c) => c.id === e.target.value);
                    if (sel) setSampleCondition(sel.condition);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      Patient {c.patientInitials} &bull; {c.condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Biologic Kit */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Biologic Sample Kit:
                </label>
                <select
                  value={sampleDrug}
                  onChange={(e) => setSampleDrug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)">
                    Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)
                  </option>
                  <option value="Secukinumab 300mg SensoReady Pen Starter Kit (2x 150mg/mL)">
                    Secukinumab 300mg SensoReady Pen Starter Kit (2x 150mg/mL)
                  </option>
                  <option value="Ustekinumab 45mg/0.5mL Syringe Sample">
                    Ustekinumab 45mg/0.5mL Syringe Sample
                  </option>
                  <option value="Bimekizumab-bkzx 160mg/mL Autoinjector Kit">
                    Bimekizumab-bkzx 160mg/mL Autoinjector Kit
                  </option>
                  <option value="Upadacitinib 15mg Once-Daily Starter Pack (30-day)">
                    Upadacitinib 15mg Once-Daily Starter Pack (30-day)
                  </option>
                  <option value="Crisaborole 2% Ointment 60g Clinical Trial Tube">
                    Crisaborole 2% Ointment 60g Clinical Trial Tube
                  </option>
                </select>
              </div>

              {/* Delivery Clinic Address */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Clinic Delivery Address (Physician Practice):
                </label>
                <input
                  type="text"
                  value={sampleAddress}
                  onChange={(e) => setSampleAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              {/* Cold-Chain Shipping Priority */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Shipping &amp; Temperature Control:
                </label>
                <select
                  value={sampleShipping}
                  onChange={(e) => setSampleShipping(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Priority Cold-Chain Express (Overnight 2-8°C)">
                    Priority Cold-Chain Express (Overnight 2-8°C)
                  </option>
                  <option value="FedEx Medical Priority Overnight with Temp Logger">
                    FedEx Medical Priority Overnight with Temp Logger
                  </option>
                  <option value="Standard Clinical Dispatch Courier">
                    Standard Clinical Dispatch Courier
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs">
                <span className="font-bold block">✓ PDMA Practitioner Attestation</span>
                <span className="text-[11px] opacity-80">
                  Authorized under {activeDoctorName} DEA/NPI profile for direct clinical in-office patient trial.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSampleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Biologic Sample</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKING MODAL 2: ATTACH $0 CO-PAY CARD */}
      {isCopayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0b0f19] border-2 border-emerald-500/60 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Attach $0 Manufacturer Co-Pay Card
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct Electronic Pharmacy Routing &bull; Instant Patient Assistance
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

            <form onSubmit={handleCreateCopayCard} className="space-y-4 text-xs">
              {/* Select Patient */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Select Patient:
                </label>
                <select
                  value={copayPatientId}
                  onChange={(e) => {
                    setCopayPatientId(e.target.value);
                    const sel = cases.find((c) => c.id === e.target.value);
                    if (sel) setCopayCondition(sel.condition);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      Patient {c.patientInitials} &bull; {c.condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medication Selection */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Targeted Medication:
                </label>
                <select
                  value={copayDrug}
                  onChange={(e) => setCopayDrug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Dupixent (dupilumab 300mg/2mL)">
                    Dupixent (dupilumab 300mg/2mL) &bull; MyWay Bridge
                  </option>
                  <option value="Cosentyx (secukinumab 300mg)">
                    Cosentyx (secukinumab 300mg) &bull; Connect Co-Pay
                  </option>
                  <option value="Stelara (ustekinumab 45mg/0.5mL)">
                    Stelara (ustekinumab 45mg/0.5mL) &bull; Janssen CarePath
                  </option>
                  <option value="Rinvoq (upadacitinib 15mg)">
                    Rinvoq (upadacitinib 15mg) &bull; Complete Savings
                  </option>
                  <option value="Bimzelx (bimekizumab-bkzx 160mg/mL)">
                    Bimzelx (bimekizumab-bkzx 160mg/mL) &bull; UCB Bridge
                  </option>
                </select>
              </div>

              {/* Designated Specialty Pharmacy */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Designated Specialty Pharmacy Desk:
                </label>
                <select
                  value={copayPharmacy}
                  onChange={(e) => setCopayPharmacy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Walgreens Specialty Pharmacy Desk - Express Routing">
                    Walgreens Specialty Pharmacy Desk - Express Routing
                  </option>
                  <option value="CVS Caremark Specialty Rx Desk">
                    CVS Caremark Specialty Rx Desk
                  </option>
                  <option value="Mount Sinai Faculty Specialty Pharmacy">
                    Mount Sinai Faculty Specialty Pharmacy
                  </option>
                  <option value="Optum Specialty Pharmacy Network">
                    Optum Specialty Pharmacy Network
                  </option>
                </select>
              </div>

              {/* Max Annual Savings */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Maximum Annual Benefit / Patient Savings:
                </label>
                <select
                  value={copaySavings}
                  onChange={(e) => setCopaySavings(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="$1,500.00">$1,500.00 (Standard Commercial Bridge)</option>
                  <option value="$2,500.00">$2,500.00 (High-Tier Biologic Support)</option>
                  <option value="$3,000.00">$3,000.00 (Extended Co-Pay Cap)</option>
                  <option value="$5,000.00">$5,000.00 (Comprehensive Bridge Assistance)</option>
                </select>
              </div>

              {/* Electronic Routing Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5 font-mono text-[11px]">
                <span className="text-emerald-400 font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Instant Electronic Routing Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>RxBIN: <strong className="text-white">004336</strong></div>
                  <div>PCN: <strong className="text-white">RXPR</strong></div>
                  <div>Group ID: <strong className="text-white">IMP9921</strong></div>
                  <div>Patient Out-of-Pocket: <strong className="text-emerald-300">$0.00</strong></div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCopayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Transmit &amp; Attach Co-Pay Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

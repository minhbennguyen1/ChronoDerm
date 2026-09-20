import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  X,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Send,
  Video,
  Building2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { ClinicalCase, AppointmentRecord, AppointmentRecommendation } from '../types';
import { getEffectiveIgaScore, getIgaDetails } from '../utils/dermaLensHelper';

interface RecommendAppointmentModalProps {
  patientCase: ClinicalCase;
  doctorName?: string;
  activeDoctorName?: string;
  doctorId?: string;
  activeDoctorId?: string;
  onClose: () => void;
  onSubmitRecommendation?: (recommendation: AppointmentRecommendation, appointment: AppointmentRecord) => void;
  onSendRecommendation?: (recommendation: AppointmentRecommendation, appointment?: AppointmentRecord) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RecommendAppointmentModal: React.FC<RecommendAppointmentModalProps> = ({
  patientCase,
  doctorName,
  activeDoctorName = 'Dr. Rachel Nazarian, MD, FAAD',
  doctorId,
  activeDoctorId = 'dr-nazarian',
  onClose,
  onSubmitRecommendation,
  onSendRecommendation,
}) => {
  const effectiveDoctorName = doctorName || activeDoctorName;
  const effectiveDoctorId = doctorId || activeDoctorId;
  const lastFrame = patientCase.frames[patientCase.frames.length - 1];
  const iga = lastFrame ? getEffectiveIgaScore(lastFrame, lastFrame.dermaLensEvaluation) : 2;
  const igaInfo = getIgaDetails(iga);
  const isNonCritical = iga <= 1;
  const isModerate = iga === 2;
  const isCriticalFlare = iga >= 3;

  // Calendar month state (default to current date or October 2026 for clinical timeline context)
  const initialDate = useMemo(() => {
    const today = new Date();
    // Use current year or 2026 timeline
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Helper to find upcoming Saturday
  const getUpcomingSaturday = (weeksAhead = 0) => {
    const d = new Date();
    const currentDay = d.getDay();
    const daysUntilSat = (6 - currentDay + 7) % 7 || 7;
    const sat = new Date(d);
    sat.setDate(d.getDate() + daysUntilSat + weeksAhead * 7);
    return sat;
  };

  // Selected date state
  const defaultSelectedDate = isNonCritical
    ? new Date(new Date().setDate(new Date().getDate() + 28)) // 4 weeks for non-critical
    : getUpcomingSaturday(0);

  const [selectedDateObj, setSelectedDateObj] = useState<Date>(defaultSelectedDate);
  const [consultType, setConsultType] = useState<'scheduled_video' | 'in_clinic' | 'urgent_flare' | 'async_monitoring'>(
    isNonCritical ? 'async_monitoring' : isCriticalFlare ? 'scheduled_video' : 'scheduled_video'
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(
    isNonCritical ? 'Flexible Asynchronous Review' : '10:30 AM'
  );

  const formattedDateStr = `${SHORT_MONTHS[selectedDateObj.getMonth()]} ${selectedDateObj.getDate()}, ${selectedDateObj.getFullYear()}`;
  const dayOfWeekStr = DAY_NAMES[selectedDateObj.getDay()];

  // Generate default clinical rationale tailored to severity and consult modality
  const generateRationale = (type: string, dateStr: string, day: string, time: string) => {
    if (type === 'async_monitoring') {
      return `DermaLens evaluation confirms non-critical barrier stability (IGA ${iga}/4 - ${igaInfo.severityGroup}, Erythema Index ${lastFrame?.erythemaIndex || 25}/100). Because symptoms are controlled, an urgent in-person or live video visit is not required. Asynchronous photo & telemetry review scheduled for ${day}, ${dateStr}. Please submit updated scans through the app.`;
    }
    if (isCriticalFlare) {
      return `DermaLens checkpoint detected active erythema flare and elevated severity (IGA ${iga}/4 - ${igaInfo.severityGroup}, Erythema Index ${lastFrame?.erythemaIndex || 65}/100). Prompt evaluation scheduled for ${day}, ${dateStr} at ${time} to assess barrier inflammation and adjust biologic protocol.`;
    }
    return `Longitudinal checkpoint demonstrates stable healing trajectory (IGA ${iga}/4). Follow-up consultation scheduled for ${day}, ${dateStr} at ${time} to review treatment tolerance and progress.`;
  };

  const [clinicalRationale, setClinicalRationale] = useState<string>(() =>
    generateRationale(consultType, formattedDateStr, dayOfWeekStr, selectedTimeSlot)
  );

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar grid days calculation
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dayNum: number;
      date: Date;
      isCurrentMonth: boolean;
      isSaturday: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const date = new Date(viewYear, viewMonth - 1, dayNum);
      days.push({
        dayNum,
        date,
        isCurrentMonth: false,
        isSaturday: date.getDay() === 6,
        isSelected: false,
        isToday: false,
      });
    }

    // Current month days
    const now = new Date();
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(viewYear, viewMonth, dayNum);
      const isSelected =
        selectedDateObj.getFullYear() === viewYear &&
        selectedDateObj.getMonth() === viewMonth &&
        selectedDateObj.getDate() === dayNum;
      const isToday =
        now.getFullYear() === viewYear &&
        now.getMonth() === viewMonth &&
        now.getDate() === dayNum;

      days.push({
        dayNum,
        date,
        isCurrentMonth: true,
        isSaturday: date.getDay() === 6,
        isSelected,
        isToday,
      });
    }

    // Next month padding to fill complete grid rows (35 or 42)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const date = new Date(viewYear, viewMonth + 1, dayNum);
      days.push({
        dayNum,
        date,
        isCurrentMonth: false,
        isSaturday: date.getDay() === 6,
        isSelected: false,
        isToday: false,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDateObj]);

  const handleSelectDate = (date: Date) => {
    setSelectedDateObj(date);
    const dateStr = `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    const dayName = DAY_NAMES[date.getDay()];
    setClinicalRationale(generateRationale(consultType, dateStr, dayName, selectedTimeSlot));
  };

  const handleSelectConsultType = (type: 'scheduled_video' | 'in_clinic' | 'urgent_flare' | 'async_monitoring') => {
    setConsultType(type);
    let time = selectedTimeSlot;
    if (type === 'async_monitoring') {
      time = 'Flexible Asynchronous Review';
      setSelectedTimeSlot(time);
    } else if (selectedTimeSlot === 'Flexible Asynchronous Review') {
      time = '10:30 AM';
      setSelectedTimeSlot(time);
    }
    setClinicalRationale(generateRationale(type, formattedDateStr, dayOfWeekStr, time));
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const recId = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const apptId = `CD-APPT-${Math.floor(100000 + Math.random() * 900000)}`;
    const isSat = selectedDateObj.getDay() === 6;

    const isoDateStr = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDateObj.getDate()).padStart(2, '0')}`;

    const recommendation: AppointmentRecommendation = {
      id: recId,
      patientId: patientCase.id,
      patientName: `Patient ${patientCase.patientInitials}`,
      patientInitials: patientCase.patientInitials,
      doctorId: effectiveDoctorId,
      doctorName: effectiveDoctorName,
      recommendedTimeframe: `${dayOfWeekStr}, ${formattedDateStr}`,
      recommendedDate: isoDateStr,
      recommendedDateFormatted: formattedDateStr,
      recommendedDayOfWeek: dayOfWeekStr,
      recommendedTimeSlot: selectedTimeSlot,
      consultType,
      clinicalRationale,
      rationale: clinicalRationale,
      condition: patientCase.condition,
      dataReportSummary: {
        igaScore: iga,
        erythemaIndex: lastFrame?.erythemaIndex || 50,
        condition: patientCase.condition,
        flareStatus: isCriticalFlare ? 'Suboptimal / Active Flare' : isNonCritical ? 'Stable / Controlled' : 'Monitoring',
      },
      status: 'pending_patient_confirmation',
      createdAt: new Date().toISOString(),
    };

    const appointment: AppointmentRecord = {
      id: apptId,
      patientName: `Patient ${patientCase.patientInitials}`,
      patientInitials: patientCase.patientInitials,
      patientId: patientCase.id,
      doctorId: effectiveDoctorId,
      doctorName: effectiveDoctorName,
      clinicName: 'Schweiger Dermatology Group - Midtown',
      clinicAddress: '110 E 55th St, 14th Fl, New York, NY 10022',
      date: isoDateStr,
      appointmentDate: isoDateStr,
      dayOfWeek: dayOfWeekStr,
      timeSlot: selectedTimeSlot,
      appointmentTime: selectedTimeSlot,
      consultType,
      type: consultType,
      reason: `Physician Recommended: ${dayOfWeekStr} (${consultType === 'async_monitoring' ? 'Asynchronous Review' : consultType}). ${clinicalRationale}`,
      status: 'confirmed',
      source: 'doctor_recommended',
      doctorRecommendationNotes: clinicalRationale,
      dataReportContext: {
        igaScore: iga,
        erythemaIndex: lastFrame?.erythemaIndex || 50,
        condition: patientCase.condition,
        lastCheckpointDate: lastFrame?.date || 'Recent',
      },
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitRecommendation) {
        onSubmitRecommendation(recommendation, appointment);
      } else if (onSendRecommendation) {
        onSendRecommendation(recommendation, appointment);
      }
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0b0f19] border-2 border-cyan-500/50 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Recommend Appointment / Clinical Review</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono">
                  Calendar Integrated
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Attending: {effectiveDoctorName} &bull; Patient {patientCase.patientInitials} ({patientCase.condition})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Severity Evaluation Callout - Explains whether live visit is required */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isNonCritical
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : isCriticalFlare
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              {isNonCritical ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCriticalFlare ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span>
                DermaLens Triage: IGA {iga}/4 ({igaInfo.severityGroup}) &bull;{' '}
                {isNonCritical
                  ? 'Controlled / Non-Critical Presentation'
                  : isCriticalFlare
                  ? 'Active Flare / Acute Window Recommended'
                  : 'Stable Healing Trajectory'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {isNonCritical
                ? 'Because the report indicates clear/almost clear skin, an in-person or live video appointment is not mandatory. You can choose Asynchronous Digital Monitoring (upload photos in 4-6 weeks) or pick any flexible calendar slot.'
                : isCriticalFlare
                ? 'Active inflammatory rebound detected. Recommended to schedule an acute check (e.g. this Saturday clinic or priority 48-72h slot).'
                : 'Standard maintenance checkpoint. Select an optional virtual review or routine office appointment based on patient convenience.'}
            </p>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase shrink-0 self-start sm:self-auto border ${
              isNonCritical
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isCriticalFlare
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            }`}
          >
            {isNonCritical ? 'Live Visit Optional' : isCriticalFlare ? 'Acute Action' : 'Routine'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Calendar Date Picker & Quick Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Interactive Month Calendar (7 cols) */}
            <div className="md:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs font-mono">
                  <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day header */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-slate-500 font-bold py-1">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span className="text-cyan-400">Sa</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                {calendarGrid.map((item, idx) => {
                  const isSat = item.isSaturday;
                  const isSelected = item.isSelected;
                  const isCur = item.isCurrentMonth;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(item.date)}
                      className={`relative h-8 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${
                        isSelected
                          ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25 ring-2 ring-cyan-300'
                          : isSat && isCur
                          ? 'bg-blue-950/60 text-cyan-300 border border-blue-500/30 hover:bg-blue-900/60'
                          : isCur
                          ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                          : 'bg-slate-950/40 text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <span>{item.dayNum}</span>
                      {isSat && isCur && !isSelected && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  Saturday Clinic Slots
                </span>
                <span className="text-cyan-300 font-bold">
                  Selected: {dayOfWeekStr}, {formattedDateStr}
                </span>
              </div>
            </div>

            {/* Quick Smart Presets & Modality (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-2">
              <label className="text-slate-300 font-bold block font-mono text-[11px]">
                Quick Scheduling Presets:
              </label>

              <button
                type="button"
                onClick={() => {
                  const sat = getUpcomingSaturday(0);
                  handleSelectDate(sat);
                  handleSelectConsultType(isCriticalFlare ? 'urgent_flare' : 'scheduled_video');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedDateObj.getDay() === 6
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>This Saturday Clinic</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                    Priority
                  </span>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono">
                  {SHORT_MONTHS[getUpcomingSaturday(0).getMonth()]} {getUpcomingSaturday(0).getDate()} &bull; In-Clinic / Video
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const sat2 = getUpcomingSaturday(1);
                  handleSelectDate(sat2);
                  handleSelectConsultType('scheduled_video');
                }}
                className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-left cursor-pointer transition-all"
              >
                <div className="font-bold text-white text-xs">Next Saturday Session</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {SHORT_MONTHS[getUpcomingSaturday(1).getMonth()]} {getUpcomingSaturday(1).getDate()} &bull; Video Telehealth
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const routineDate = new Date();
                  routineDate.setDate(routineDate.getDate() + 28);
                  handleSelectDate(routineDate);
                  handleSelectConsultType('async_monitoring');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  consultType === 'async_monitoring'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>4-Week Asynchronous Review</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">
                    Non-Critical
                  </span>
                </div>
                <div className="text-[10px] text-emerald-300/90 font-mono">
                  No live visit needed &bull; Patient uploads photos
                </div>
              </button>
            </div>
          </div>

          {/* Consultation Modality Selection */}
          <div>
            <label className="text-slate-300 font-bold block mb-1.5 font-mono">
              Choose Consultation / Review Modality:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Asynchronous Digital Check-in */}
              <button
                type="button"
                onClick={() => handleSelectConsultType('async_monitoring')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  consultType === 'async_monitoring'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Asynchronous Photo &amp; Telemetry Check-in</span>
                    {isNonCritical && (
                      <span className="text-[9px] px-1 rounded bg-emerald-500/30 text-emerald-300 font-mono font-bold">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Patient submits updated scans remotely in 4-6 weeks. No live visit needed if condition is stable.
                  </div>
                </div>
              </button>

              {/* Telehealth Video Call */}
              <button
                type="button"
                onClick={() => handleSelectConsultType('scheduled_video')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  consultType === 'scheduled_video'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Telehealth HD Video Call</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Live virtual video consult with screen review of patient’s 3D timeline &amp; erythema graphs.
                  </div>
                </div>
              </button>

              {/* In-Clinic Comprehensive Exam */}
              <button
                type="button"
                onClick={() => handleSelectConsultType('in_clinic')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  consultType === 'in_clinic'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">In-Clinic Comprehensive Exam</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    In-person clinical examination at Schweiger Dermatology Group or Mount Sinai practice.
                  </div>
                </div>
              </button>

              {/* Acute Flare Priority Check */}
              <button
                type="button"
                onClick={() => handleSelectConsultType('urgent_flare')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  consultType === 'urgent_flare'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-md shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Acute Flare Priority Window</span>
                    {isCriticalFlare && (
                      <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-300 font-mono font-bold">
                        Indicated
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Expedited acute evaluation slot reserved specifically for flare triage and treatment step-up.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-mono">
                {consultType === 'async_monitoring' ? 'Review Timing Window' : 'Appointment Time Slot'}
              </label>
              {consultType === 'async_monitoring' ? (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Flexible Asynchronous Chart Review</span>
                </div>
              ) : (
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => {
                    setSelectedTimeSlot(e.target.value);
                    setClinicalRationale(generateRationale(consultType, formattedDateStr, dayOfWeekStr, e.target.value));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                >
                  <option value="9:30 AM">9:30 AM (Morning Slot)</option>
                  <option value="10:30 AM">10:30 AM (Recommended Saturday Clinic)</option>
                  <option value="11:15 AM">11:15 AM</option>
                  <option value="2:00 PM">2:00 PM (Afternoon Slot)</option>
                  <option value="3:30 PM">3:30 PM</option>
                  <option value="4:15 PM">4:15 PM</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono">Selected Target Date</label>
              <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center justify-between">
                <span>
                  {dayOfWeekStr}, {formattedDateStr}
                </span>
                {selectedDateObj.getDay() === 6 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold">
                    Saturday
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Rationale sent to patient */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold block font-mono">
                Clinical Rationale (Sent to Patient):
              </label>
              <button
                type="button"
                onClick={() =>
                  setClinicalRationale(
                    generateRationale(consultType, formattedDateStr, dayOfWeekStr, selectedTimeSlot)
                  )
                }
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
              >
                Reset to Auto Rationale
              </button>
            </div>
            <textarea
              rows={3}
              value={clinicalRationale}
              onChange={(e) => setClinicalRationale(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>
                {consultType === 'async_monitoring'
                  ? 'Send Asynchronous Check-in Schedule'
                  : 'Send Recommendation to Patient'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

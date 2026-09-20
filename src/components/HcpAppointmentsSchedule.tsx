import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Building2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  User,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  Phone,
  Mail,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  LayoutGrid,
  CalendarCheck,
  X,
  Stethoscope,
  Smartphone
} from 'lucide-react';
import { AppointmentRecord, ClinicalCase } from '../types';

interface HcpAppointmentsScheduleProps {
  appointments: AppointmentRecord[];
  cases: ClinicalCase[];
  activeDoctorName?: string;
  activeDoctorId?: string;
  onSelectCaseAndReview?: (caseId: string) => void;
  onOpenRecommendModal: (patientCase: ClinicalCase) => void;
  onConfirmAppointment?: (apptId: string) => void;
  onUpdateAppointmentStatus?: (apptId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to normalize and extract year/month/day from various date strings
function parseAppointmentDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  // Match ISO YYYY-MM-DD directly to prevent UTC timezone shift
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10),
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
  const clean = dateStr.toLowerCase().replace(/,/g, '').trim();
  const parts = clean.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    const mIdx = SHORT_MONTHS.findIndex((m) => parts[i].startsWith(m.toLowerCase()));
    if (mIdx !== -1 && parts[i + 1]) {
      const day = parseInt(parts[i + 1], 10);
      const year = parts[i + 2] ? parseInt(parts[i + 2], 10) : new Date().getFullYear();
      if (!isNaN(day)) return { year, month: mIdx, day };
    }
  }
  return null;
}

export const HcpAppointmentsSchedule: React.FC<HcpAppointmentsScheduleProps> = ({
  appointments,
  cases,
  activeDoctorName = 'Dr. Rachel Nazarian, MD, FAAD',
  activeDoctorId,
  onSelectCaseAndReview,
  onOpenRecommendModal,
  onConfirmAppointment,
  onUpdateAppointmentStatus,
}) => {
  // View mode: Ledger Style vs Interactive Calendar Style
  const [viewMode, setViewMode] = useState<'calendar' | 'ledger'>('calendar');
  const [filterDay, setFilterDay] = useState<'all' | 'Saturday' | 'weekdays'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideoModalAppt, setActiveVideoModalAppt] = useState<AppointmentRecord | null>(null);

  // Initialize calendar view around existing appointments or current date
  const defaultCalDate = useMemo(() => {
    if (appointments.length > 0) {
      for (const a of appointments) {
        const parsed = parseAppointmentDate(a.date || a.appointmentDate || '');
        if (parsed) return new Date(parsed.year, parsed.month, parsed.day);
      }
    }
    return new Date();
  }, [appointments]);

  const [calYear, setCalYear] = useState<number>(defaultCalDate.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(defaultCalDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(defaultCalDate);

  // Auto-jump to newest appointment when appointments list changes
  React.useEffect(() => {
    if (appointments.length > 0) {
      const activeAppts = appointments.filter((a) => a.status !== 'cancelled');
      if (activeAppts.length > 0) {
        const targetAppt = activeAppts[0];
        const parsed = parseAppointmentDate(targetAppt.date || targetAppt.appointmentDate || '');
        if (parsed) {
          setCalYear(parsed.year);
          setCalMonth(parsed.month);
          setSelectedDate(new Date(parsed.year, parsed.month, parsed.day));
        }
      }
    }
  }, [appointments.length]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setSelectedDate(today);
  };

  // Build calendar grid days
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();

    const days: Array<{
      dayNum: number;
      date: Date;
      isCurrentMonth: boolean;
      isSaturday: boolean;
      isSelected: boolean;
      isToday: boolean;
      appointments: AppointmentRecord[];
    }> = [];

    const now = new Date();

    // Map appointments to date string key "YYYY-MM-DD"
    const apptMap = new Map<string, AppointmentRecord[]>();
    for (const appt of appointments) {
      const parsed = parseAppointmentDate(appt.date || appt.appointmentDate || '');
      if (parsed) {
        const key = `${parsed.year}-${parsed.month}-${parsed.day}`;
        if (!apptMap.has(key)) apptMap.set(key, []);
        apptMap.get(key)!.push(appt);
      }
    }

    // Prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrev - i;
      const date = new Date(calYear, calMonth - 1, dayNum);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      days.push({
        dayNum,
        date,
        isCurrentMonth: false,
        isSaturday: date.getDay() === 6,
        isSelected:
          selectedDate.getFullYear() === date.getFullYear() &&
          selectedDate.getMonth() === date.getMonth() &&
          selectedDate.getDate() === date.getDate(),
        isToday: false,
        appointments: apptMap.get(key) || [],
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(calYear, calMonth, dayNum);
      const key = `${calYear}-${calMonth}-${dayNum}`;
      const isSelected =
        selectedDate.getFullYear() === calYear &&
        selectedDate.getMonth() === calMonth &&
        selectedDate.getDate() === dayNum;
      const isToday =
        now.getFullYear() === calYear &&
        now.getMonth() === calMonth &&
        now.getDate() === dayNum;

      days.push({
        dayNum,
        date,
        isCurrentMonth: true,
        isSaturday: date.getDay() === 6,
        isSelected,
        isToday,
        appointments: apptMap.get(key) || [],
      });
    }

    // Next month padding
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const date = new Date(calYear, calMonth + 1, dayNum);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      days.push({
        dayNum,
        date,
        isCurrentMonth: false,
        isSaturday: date.getDay() === 6,
        isSelected:
          selectedDate.getFullYear() === date.getFullYear() &&
          selectedDate.getMonth() === date.getMonth() &&
          selectedDate.getDate() === date.getDate(),
        isToday: false,
        appointments: apptMap.get(key) || [],
      });
    }

    return days;
  }, [calYear, calMonth, selectedDate, appointments]);

  // Appointments on the selected calendar date
  const selectedDateAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const parsed = parseAppointmentDate(appt.date || appt.appointmentDate || '');
      if (!parsed) return false;
      return (
        parsed.year === selectedDate.getFullYear() &&
        parsed.month === selectedDate.getMonth() &&
        parsed.day === selectedDate.getDate()
      );
    });
  }, [selectedDate, appointments]);

  // Filtered appointments for Ledger View
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const day = (appt.dayOfWeek || '').toLowerCase();
      const dateStr = (appt.date || appt.appointmentDate || '').toLowerCase();
      const patientNameStr = (appt.patientName || '').toLowerCase();
      const reasonStr = (appt.reason || '').toLowerCase();
      const timeSlotStr = (appt.timeSlot || appt.appointmentTime || '').toLowerCase();
      const q = (searchQuery || '').toLowerCase();

      const isSat = day === 'saturday' || dateStr.includes('saturday');

      const matchesDay =
        filterDay === 'all'
          ? true
          : filterDay === 'Saturday'
          ? isSat
          : !isSat;

      const matchesSearch =
        !q ||
        patientNameStr.includes(q) ||
        reasonStr.includes(q) ||
        timeSlotStr.includes(q) ||
        dateStr.includes(q);

      return matchesDay && matchesSearch;
    });
  }, [appointments, filterDay, searchQuery]);

  const saturdayCount = appointments.filter((a) => {
    const day = (a.dayOfWeek || '').toLowerCase();
    const dateStr = (a.date || a.appointmentDate || '').toLowerCase();
    return day === 'saturday' || dateStr.includes('saturday');
  }).length;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Streamlined, Decluttered Top Bar with View Mode Switcher */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Appointment Schedule
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-950/90 border border-blue-500/40 text-blue-300 font-mono text-[11px] font-bold">
                {appointments.length} Scheduled
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeDoctorName} &bull; {saturdayCount} Saturday Clinic Slots
            </p>
          </div>
        </div>

        {/* View Switcher: Ledger Style vs Calendar Style */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Ledger View</span>
            </button>
          </div>

          {cases.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenRecommendModal(cases[0])}
              className="px-3.5 py-2 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Recommend Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= VIEW 1: INTERACTIVE CALENDAR STYLE ================= */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Month Calendar Card (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 glass-card rounded-3xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-3">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[11px] font-bold text-slate-400 py-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-cyan-400 font-extrabold">Sat (Clinic)</span>
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {calendarGrid.map((dayItem, idx) => {
                const isSelected = dayItem.isSelected;
                const isSat = dayItem.isSaturday;
                const isCur = dayItem.isCurrentMonth;
                const hasAppts = dayItem.appointments.length > 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dayItem.date);
                      if (!dayItem.isCurrentMonth) {
                        setCalYear(dayItem.date.getFullYear());
                        setCalMonth(dayItem.date.getMonth());
                      }
                    }}
                    className={`min-h-[72px] sm:min-h-[82px] p-1.5 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-950/70 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/50'
                        : hasAppts
                        ? 'bg-slate-950/90 border-blue-500/30 hover:border-blue-400 hover:bg-slate-900/60'
                        : isSat && isCur
                        ? 'bg-blue-950/20 border-slate-800 hover:bg-blue-950/40'
                        : isCur
                        ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/50'
                        : 'bg-slate-950/10 border-transparent text-slate-600 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isSelected
                            ? 'text-cyan-300 font-black'
                            : isSat && isCur
                            ? 'text-cyan-400'
                            : isCur
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {dayItem.dayNum}
                      </span>

                      {hasAppts && (
                        <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 flex items-center justify-center font-mono text-[9px] font-black">
                          {dayItem.appointments.length}
                        </span>
                      )}
                    </div>

                    {/* Appointment indicator pills inside cell */}
                    <div className="flex flex-col gap-1 mt-1 w-full overflow-hidden">
                      {dayItem.appointments.slice(0, 2).map((a, i) => {
                        const isVideo =
                          a.consultType === 'scheduled_video' || a.type === 'scheduled_video';
                        const isAsync = a.consultType === 'async_monitoring';
                        return (
                          <div
                            key={i}
                            className={`truncate px-1.5 py-0.5 rounded text-[10px] font-mono leading-tight ${
                              isAsync
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : isVideo
                                ? 'bg-blue-950 text-cyan-300 border border-cyan-500/30'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            <span className="font-bold">{a.patientInitials || 'Pt'}</span> &bull;{' '}
                            {a.timeSlot || 'TBA'}
                          </div>
                        );
                      })}
                      {dayItem.appointments.length > 2 && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          +{dayItem.appointments.length - 2} more
                        </span>
                      )}
                    </div>

                    {isSat && isCur && !hasAppts && (
                      <span className="text-[9px] text-cyan-500/60 font-mono tracking-tighter">
                        Saturday
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  Telehealth Video
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                  In-Clinic Exam
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Asynchronous Review
                </span>
              </div>
              <span className="text-cyan-300">
                Click any calendar date to view or manage patient agenda
              </span>
            </div>
          </div>

          {/* Interactive Day Agenda Panel (5 cols on lg, 4 on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
            <div className="glass-card rounded-3xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Selected Day Agenda
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {DAY_NAMES[selectedDate.getDay()]}, {SHORT_MONTHS[selectedDate.getMonth()]}{' '}
                    {selectedDate.getDate()}, {selectedDate.getFullYear()}
                  </h3>
                </div>
                {selectedDate.getDay() === 6 && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                    Saturday Clinic
                  </span>
                )}
              </div>

              {/* Appointments on selected date */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[460px] pr-1">
                {selectedDateAppointments.map((appt) => {
                  const isVideo =
                    appt.consultType === 'scheduled_video' || appt.type === 'scheduled_video';
                  const isAsync = appt.consultType === 'async_monitoring';

                  const matchingCase = cases.find(
                    (c) =>
                      (appt.patientInitials && c.patientInitials === appt.patientInitials) ||
                      (appt.patientName && c.patientInitials && appt.patientName.includes(c.patientInitials)) ||
                      c.id === appt.id
                  );

                  return (
                    <div
                      key={appt.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">
                              {appt.patientName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({appt.patientInitials})
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{appt.timeSlot || '10:30 AM'}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isAsync
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isVideo
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {isAsync ? 'Async' : isVideo ? 'Video' : 'In-Clinic'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2 rounded-xl">
                        {appt.reason}
                      </div>

                      {/* Quick Interactive Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {isVideo && (
                          <button
                            type="button"
                            onClick={() => setActiveVideoModalAppt(appt)}
                            className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Start Video</span>
                          </button>
                        )}

                        {!isVideo && (
                          <button
                            type="button"
                            onClick={() => onConfirmAppointment?.(appt.id)}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                            <span>Check-In</span>
                          </button>
                        )}

                        {matchingCase && (
                          <button
                            type="button"
                            onClick={() => onSelectCaseAndReview?.(matchingCase.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs border border-slate-800 transition-colors cursor-pointer"
                            title="View Patient Scans"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {selectedDateAppointments.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 rounded-2xl my-auto">
                    <CalendarCheck className="w-6 h-6 text-slate-600" />
                    <span>No appointments scheduled for this date.</span>
                    {cases.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenRecommendModal(cases[0])}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold hover:bg-cyan-500/30 cursor-pointer transition-colors"
                      >
                        Book Patient on this Date
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: LEDGER STYLE ================= */}
      {viewMode === 'ledger' && (
        <div className="flex flex-col gap-4">
          {/* Filter and Search Bar for Ledger */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterDay('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDay === 'all'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDay('Saturday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterDay === 'Saturday'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Saturday Clinic ({saturdayCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterDay('weekdays')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDay === 'weekdays'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekdays ({appointments.length - saturdayCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, slot, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 w-56 font-mono"
              />
            </div>
          </div>

          {/* APPOINTMENT CARDS LIST */}
          <div className="flex flex-col gap-3">
            {filteredAppointments.map((appt) => {
              const apptDay = appt.dayOfWeek || 'Scheduled';
              const apptDate = appt.date || appt.appointmentDate || 'Upcoming';
              const apptTime = appt.timeSlot || appt.appointmentTime || 'Time TBA';
              const isSaturday =
                (appt.dayOfWeek || '').toLowerCase() === 'saturday' ||
                (appt.date || appt.appointmentDate || '').toLowerCase().includes('saturday');
              const isVideo =
                appt.consultType === 'scheduled_video' || appt.type === 'scheduled_video';
              const isAsync = appt.consultType === 'async_monitoring';

              const matchingCase = cases.find(
                (c) =>
                  (appt.patientInitials && c.patientInitials === appt.patientInitials) ||
                  (appt.patientName && c.patientInitials && appt.patientName.includes(c.patientInitials)) ||
                  c.id === appt.id
              );

              return (
                <div
                  key={appt.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSaturday
                      ? 'bg-slate-950/90 border-blue-500/40 shadow-lg shadow-blue-500/5 hover:border-blue-400'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isAsync
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isSaturday
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isAsync ? (
                        <Smartphone className="w-5 h-5" />
                      ) : isVideo ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {appt.patientName}
                        </span>
                        {isSaturday && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[10px] font-bold">
                            Saturday Slot
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            appt.source === 'patient_portal'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {appt.source === 'patient_portal'
                            ? 'Matched from Patient Portal'
                            : 'Doctor Recommended'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[10px]">
                          {appt.id}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-300">
                        <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {apptDate} ({apptDay})
                        </span>
                        <span className="flex items-center gap-1.5 text-white font-bold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {apptTime}
                        </span>
                        <span className="text-slate-400">
                          {isAsync
                            ? 'Asynchronous Digital Review'
                            : isVideo
                            ? 'Telehealth Virtual Video'
                            : 'In-Clinic Comprehensive Exam'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        <strong className="text-slate-400 font-mono">Indication:</strong>{' '}
                        {appt.reason}
                      </div>

                      {appt.dataReportContext && (
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                          <span>
                            Condition:{' '}
                            <strong className="text-white">
                              {appt.dataReportContext.condition}
                            </strong>
                          </span>
                          <span>
                            Severity Score:{' '}
                            <strong
                              className={
                                appt.dataReportContext.igaScore >= 3
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }
                            >
                              IGA {appt.dataReportContext.igaScore}/4
                            </strong>
                          </span>
                          <span>
                            Erythema:{' '}
                            <strong className="text-cyan-300">
                              {appt.dataReportContext.erythemaIndex}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap md:flex-col lg:flex-row items-center gap-2 shrink-0">
                    {matchingCase && (
                      <button
                        type="button"
                        onClick={() => onSelectCaseAndReview?.(matchingCase.id)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>View Scans</span>
                      </button>
                    )}

                    {isVideo ? (
                      <button
                        type="button"
                        onClick={() => setActiveVideoModalAppt(appt)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Enter Video Room</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConfirmAppointment?.(appt.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                        <span>Check-In Patient</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAppointments.length === 0 && (
              <div className="p-12 text-center text-slate-500 font-mono text-xs glass-card rounded-3xl border border-slate-800">
                No appointments found for the selected view.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TELEHEALTH VIDEO ROOM MODAL */}
      {activeVideoModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0b0f19] border-2 border-blue-500/60 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    HIPAA Secure Video Telehealth Session
                  </h3>
                  <p className="text-xs text-slate-400">
                    Attending: {activeDoctorName} &bull; {activeVideoModalAppt.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModalAppt(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white font-mono text-xs"
              >
                End Call
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                  <User className="w-8 h-8" />
                </div>
                <div className="font-bold text-white text-sm">
                  Connecting to {activeVideoModalAppt.patientName}...
                </div>
                <div className="text-xs font-mono text-emerald-400">
                  &bull; WebRTC Encrypted (AES-256) &bull; HD 1080p Video Feed
                </div>
              </div>

              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md font-mono text-[11px] text-white">
                Scheduled Slot: {activeVideoModalAppt.timeSlot} &bull; {activeVideoModalAppt.date}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-mono">
                Reason: {activeVideoModalAppt.reason}
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoModalAppt(null)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Disconnect Telehealth
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

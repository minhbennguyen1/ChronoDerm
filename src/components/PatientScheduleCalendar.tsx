import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarCheck,
  MapPin,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Sparkles,
  Phone,
  FileText,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { AppointmentRecord } from '../types';

interface PatientScheduleCalendarProps {
  appointments: AppointmentRecord[];
  patientName?: string;
  onBookNewAppointment?: (date?: string) => void;
  onCancelAppointment?: (apptId: string) => void;
  onJoinVideoCall?: (appt: AppointmentRecord) => void;
  onNavigateToClinicMap?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to normalize any date format (YYYY-MM-DD, Month Day, Year, ISO string) into YYYY-MM-DD
export const normalizeDateKey = (dateStr: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return trimmed;
};

export const PatientScheduleCalendar: React.FC<PatientScheduleCalendarProps> = ({
  appointments = [],
  patientName = 'Patient',
  onBookNewAppointment,
  onCancelAppointment,
  onJoinVideoCall,
  onNavigateToClinicMap,
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  
  // Selected date object
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  
  // Filter for appointment list: 'upcoming' | 'all' | 'video' | 'in_clinic'
  const [filterMode, setFilterMode] = useState<'upcoming' | 'all' | 'video' | 'in_clinic'>('upcoming');

  // Auto-jump to the latest appointment when appointments change (e.g. newly accepted from clinician portal)
  React.useEffect(() => {
    if (appointments.length > 0) {
      const activeAppts = appointments.filter((a) => a.status !== 'cancelled');
      if (activeAppts.length > 0) {
        const targetAppt = activeAppts[activeAppts.length - 1];
        const rawDate = targetAppt.date || targetAppt.appointmentDate || '';
        const norm = normalizeDateKey(rawDate);
        if (norm) {
          const parts = norm.split('-').map(Number);
          if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            setCurrentYear(parts[0]);
            setCurrentMonth(parts[1] - 1);
            setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
          }
        }
      }
    }
  }, [appointments.length]);

  // Format date helper: YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateKey = formatDateKey(selectedDate);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  // Map appointments by date string for O(1) lookup
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>();
    appointments.forEach((appt) => {
      const rawDate = appt.date || appt.appointmentDate || '';
      if (!rawDate) return;
      const normalizedKey = normalizeDateKey(rawDate);
      if (!normalizedKey) return;
      const existing = map.get(normalizedKey) || [];
      existing.push(appt);
      map.set(normalizedKey, existing);
    });
    return map;
  }, [appointments]);

  // Appointments on selected day
  const selectedDayAppointments = useMemo(() => {
    return appointmentsByDate.get(selectedDateKey) || [];
  }, [appointmentsByDate, selectedDateKey]);

  // All active appointments sorted by date
  const sortedAppointments = useMemo(() => {
    return [...appointments]
      .filter((appt) => appt.status !== 'cancelled')
      .sort((a, b) => {
        const dateA = a.date || a.appointmentDate || '';
        const dateB = b.date || b.appointmentDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [appointments]);

  // Filtered appointments list
  const filteredAppointments = useMemo(() => {
    const todayStr = formatDateKey(today);
    return sortedAppointments.filter((appt) => {
      const apptDate = appt.date || appt.appointmentDate || '';
      if (filterMode === 'upcoming') {
        return apptDate >= todayStr;
      }
      if (filterMode === 'video') {
        return (
          appt.consultType === 'scheduled_video' ||
          appt.consultType === 'urgent_video' ||
          appt.type === 'scheduled_video' ||
          appt.type === 'urgent_video'
        );
      }
      if (filterMode === 'in_clinic') {
        return appt.consultType === 'in_clinic' || appt.type === 'in_clinic';
      }
      return true; // 'all'
    });
  }, [sortedAppointments, filterMode, today]);

  // Generate calendar grid (including leading/trailing padding days)
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNum: number;
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      appointments: AppointmentRecord[];
      hasVideo: boolean;
      hasInClinic: boolean;
      hasAsync: boolean;
    }> = [];

    // Previous month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const date = new Date(currentYear, currentMonth - 1, dayNum);
      const dateKey = formatDateKey(date);
      const dayAppts = appointmentsByDate.get(dateKey) || [];
      
      days.push({
        dayNum,
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        isSelected: dateKey === selectedDateKey,
        appointments: dayAppts,
        hasVideo: dayAppts.some((a) => a.consultType?.includes('video') || a.type?.includes('video')),
        hasInClinic: dayAppts.some((a) => a.consultType === 'in_clinic' || a.type === 'in_clinic'),
        hasAsync: dayAppts.some((a) => a.consultType?.includes('async') || a.type?.includes('async')),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(currentYear, currentMonth, dayNum);
      const dateKey = formatDateKey(date);
      const isToday =
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === dayNum;
      const dayAppts = appointmentsByDate.get(dateKey) || [];

      days.push({
        dayNum,
        date,
        dateKey,
        isCurrentMonth: true,
        isToday,
        isSelected: dateKey === selectedDateKey,
        appointments: dayAppts,
        hasVideo: dayAppts.some((a) => a.consultType?.includes('video') || a.type?.includes('video')),
        hasInClinic: dayAppts.some((a) => a.consultType === 'in_clinic' || a.type === 'in_clinic'),
        hasAsync: dayAppts.some((a) => a.consultType?.includes('async') || a.type?.includes('async')),
      });
    }

    // Next month padding days to fill 35 or 42 cells
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const date = new Date(currentYear, currentMonth + 1, dayNum);
      const dateKey = formatDateKey(date);
      const dayAppts = appointmentsByDate.get(dateKey) || [];

      days.push({
        dayNum,
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        isSelected: dateKey === selectedDateKey,
        appointments: dayAppts,
        hasVideo: dayAppts.some((a) => a.consultType?.includes('video') || a.type?.includes('video')),
        hasInClinic: dayAppts.some((a) => a.consultType === 'in_clinic' || a.type === 'in_clinic'),
        hasAsync: dayAppts.some((a) => a.consultType?.includes('async') || a.type?.includes('async')),
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDateKey, appointmentsByDate, today]);

  // Export to .ics format for Apple / Google Calendar
  const handleExportIcs = (appt: AppointmentRecord) => {
    const rawDate = appt.date || appt.appointmentDate || '2026-10-24';
    const dateFormatted = rawDate.replace(/-/g, '');
    const startTime = '143000Z'; // fallback standard UTC
    const endTime = '151500Z';

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChronoDerm//Patient Dermatology Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${appt.id || Date.now()}@chronoderm.app`,
      `DTSTAMP:${dateFormatted}T090000Z`,
      `DTSTART:${dateFormatted}T${startTime}`,
      `DTEND:${dateFormatted}T${endTime}`,
      `SUMMARY:Dermatology Visit with ${appt.doctorName}`,
      `DESCRIPTION:${appt.reason || 'Clinical Consultation'}. Notes: ${appt.notes || 'ChronoDerm Telehealth Protocol'}`,
      `LOCATION:${appt.clinicName || appt.clinicAddress || 'Encrypted Video Room - ChronoDerm App'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appointment-${appt.id || 'visit'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedFormattedTitle = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* 1. Header with Book New Appointment Action */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" />
              Patient Clinical Schedule
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Synchronized with Clinician Portal
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Schedule &amp; Appointments</span>
          </h2>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            View and manage your scheduled virtual visits and in-clinic appointments with board-certified dermatologists.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
          {onBookNewAppointment && (
            <button
              type="button"
              onClick={() => onBookNewAppointment(selectedDateKey)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Book New Appointment</span>
            </button>
          )}

          {onNavigateToClinicMap && (
            <button
              type="button"
              onClick={onNavigateToClinicMap}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>US Clinic Map</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Layout: Interactive Calendar + Selected Date Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Calendar View (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleGoToday}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-[11px] font-mono font-bold text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                const hasAppts = cell.appointments.length > 0;
                return (
                  <button
                    key={`${cell.dateKey}-${idx}`}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      cell.isSelected
                        ? 'bg-gradient-to-br from-cyan-950 to-blue-950 border-2 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : cell.isToday
                        ? 'bg-slate-800/80 border border-cyan-500/50'
                        : cell.isCurrentMonth
                        ? 'bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/70'
                        : 'bg-slate-950/20 hover:bg-slate-800/30 border border-slate-900/50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          cell.isSelected
                            ? 'text-cyan-300'
                            : cell.isToday
                            ? 'text-cyan-400 underline font-black'
                            : cell.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {cell.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </div>

                    {/* Appointment Badges on Calendar Day */}
                    {hasAppts && (
                      <div className="w-full space-y-1 mt-1">
                        {cell.appointments.slice(0, 2).map((a) => {
                          const isVideo = a.consultType?.includes('video') || a.type?.includes('video');
                          const isInClinic = a.consultType === 'in_clinic' || a.type === 'in_clinic';
                          return (
                            <div
                              key={a.id}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold truncate flex items-center gap-1 ${
                                isVideo
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : isInClinic
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              }`}
                              title={`${a.timeSlot} with ${a.doctorName}`}
                            >
                              {isVideo ? (
                                <Video className="w-2.5 h-2.5 shrink-0" />
                              ) : isInClinic ? (
                                <Building2 className="w-2.5 h-2.5 shrink-0" />
                              ) : (
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                              )}
                              <span className="truncate">{a.timeSlot || 'Visit'}</span>
                            </div>
                          );
                        })}
                        {cell.appointments.length > 2 && (
                          <div className="text-[9px] font-mono text-cyan-400 text-center">
                            +{cell.appointments.length - 2} more
                          </div>
                        )}
                      </div>
                    )}

                    {!hasAppts && cell.isCurrentMonth && (
                      <div className="w-full text-right opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-mono text-slate-500">Free</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Virtual Video Visit</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>In-Clinic Exam</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span>Digital Review</span>
              </span>
            </div>
            <span>Click any day to inspect details</span>
          </div>
        </div>

        {/* Right / Selected Date Inspector & Availability (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Selected Date Header */}
            <div className="pb-3 border-b border-slate-800 flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Selected Day Inspection
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedFormattedTitle}
                </h3>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                selectedDayAppointments.length > 0
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {selectedDayAppointments.length > 0
                  ? `${selectedDayAppointments.length} Visit${selectedDayAppointments.length > 1 ? 's' : ''} Set Up`
                  : 'Open Availability'}
              </span>
            </div>

            {/* Scheduled Appointments on This Date */}
            {selectedDayAppointments.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Appointments on this Date:
                </h4>

                {selectedDayAppointments.map((appt) => {
                  const isVideo = appt.consultType?.includes('video') || appt.type?.includes('video');
                  const isInClinic = appt.consultType === 'in_clinic' || appt.type === 'in_clinic';

                  return (
                    <div
                      key={appt.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isVideo
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : isInClinic
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}>
                            {isVideo ? (
                              <Video className="w-5 h-5" />
                            ) : isInClinic ? (
                              <Building2 className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {appt.doctorName}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {appt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                              </span>
                            </div>

                            <div className="text-xs text-cyan-300 font-mono font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{appt.timeSlot} • {isVideo ? 'Encrypted Video Room' : isInClinic ? 'In-Clinic Physical' : 'Digital e-Rx'}</span>
                            </div>
                          </div>
                        </div>

                        {onCancelAppointment && (
                          <button
                            type="button"
                            onClick={() => onCancelAppointment(appt.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Cancel appointment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Clinic or Video Room Location Details */}
                      {isInClinic && (appt.clinicName || appt.clinicAddress) && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white">{appt.clinicName || 'Dermatology Clinic'}</div>
                            <div className="text-slate-400 font-mono">{appt.clinicAddress || 'Address on file'}</div>
                          </div>
                        </div>
                      )}

                      {/* Reason / Notes */}
                      {appt.reason && (
                        <p className="text-[11px] text-slate-300 italic bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
                          "{appt.reason}"
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {isVideo && onJoinVideoCall && (
                          <button
                            type="button"
                            onClick={() => onJoinVideoCall(appt)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video Room</span>
                          </button>
                        )}

                        {isInClinic && onNavigateToClinicMap && (
                          <button
                            type="button"
                            onClick={onNavigateToClinicMap}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>View Clinic Map</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExportIcs(appt)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Export to iCal / Google Calendar"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Export .ics</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">No Appointments on this Date</h4>
                  <p className="text-[11px] text-slate-400">
                    Your personal availability is fully open. You can book a virtual visit or clinic exam for this date.
                  </p>
                </div>
                {onBookNewAppointment && (
                  <button
                    type="button"
                    onClick={() => onBookNewAppointment(selectedDateKey)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book New Appointment for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 text-center">
            Synchronized with ChronoDerm Patient Care Coordination
          </div>
        </div>
      </div>

      {/* 3. All Scheduled Appointments Overview List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              All My Scheduled Appointments ({sortedAppointments.length})
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['upcoming', 'all', 'video', 'in_clinic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  filterMode === mode
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'in_clinic' ? 'In-Clinic' : mode}
              </button>
            ))}
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-bold text-slate-300">No appointments found matching this filter</div>
            <p className="text-[11px] text-slate-500">
              When a doctor or clinical provider sends an appointment invitation or when you book a visit, it appears here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAppointments.map((appt) => {
              const isVideo = appt.consultType?.includes('video') || appt.type?.includes('video');
              const isInClinic = appt.consultType === 'in_clinic' || appt.type === 'in_clinic';

              return (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isVideo
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : isInClinic
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}>
                        {isVideo ? 'Virtual Video' : isInClinic ? 'In-Clinic Physical' : 'Digital e-Rx'}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {appt.status || 'Confirmed'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{appt.doctorName}</h4>
                      <div className="text-xs text-cyan-300 font-mono mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{appt.dayOfWeek || 'Upcoming'}, {appt.date || appt.appointmentDate} at {appt.timeSlot}</span>
                      </div>
                    </div>

                    {appt.clinicName && (
                      <div className="text-[11px] text-slate-400 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="truncate">{appt.clinicName}</span>
                      </div>
                    )}

                    {appt.reason && (
                      <p className="text-[11px] text-slate-300 line-clamp-2 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        "{appt.reason}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isVideo && onJoinVideoCall && (
                        <button
                          type="button"
                          onClick={() => onJoinVideoCall(appt)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExportIcs(appt)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Export iCal file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {onCancelAppointment && (
                      <button
                        type="button"
                        onClick={() => onCancelAppointment(appt.id)}
                        className="text-[11px] font-mono text-rose-400/80 hover:text-rose-300 hover:underline transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

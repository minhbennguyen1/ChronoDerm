import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppNavTab } from './components/Navbar';
import { TimeMachine3D } from './components/TimeMachine3D';
import { CameraOverlay } from './components/CameraOverlay';
import { HCPDashboard } from './components/HCPDashboard';
import { TryOutGuide } from './components/TryOutGuide';
import { AboutSection } from './components/AboutSection';
import { AccountModal } from './components/AccountModal';
import { AiDermatologyChatbot } from './components/AiDermatologyChatbot';
import { UsDermatologyMap } from './components/UsDermatologyMap';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { AiDifferenceModal } from './components/AiDifferenceModal';
import { ConnectDoctorSection, DoctorReferralContext } from './components/ConnectDoctorSection';
import { ClinicalDirectiveBanner } from './components/ClinicalDirectiveBanner';
import { HcpTimelineDatasetViewer } from './components/HcpTimelineDatasetViewer';
import { HcpSampleCopayDatabase } from './components/HcpSampleCopayDatabase';
import { HcpAppointmentsSchedule } from './components/HcpAppointmentsSchedule';
import { RecommendAppointmentModal } from './components/RecommendAppointmentModal';
import {
  ClinicalCase,
  SkinTimelineFrame,
  UserAccount,
  SingleImageAnalysisResult,
  UserRole,
  SampleRequestOrder,
  PatientConsultationRecord,
  ClinicalDirective,
  CopayCardRecord,
  AppointmentRecord,
  AppointmentRecommendation,
  ClinicReferral
} from './types';
import { isModerateToSevereDermaLens, getEffectiveIgaScore, getIgaDetails } from './utils/dermaLensHelper';
import {
  getCurrentUser,
  setCurrentUser,
  logInUser,
  enterDemoMode,
  logOutUser,
  DEFAULT_USER
} from './services/authService';
import {
  loadUserCases,
  saveUserCases,
  sortFramesChronologically
} from './services/storageService';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Trash2,
  Camera,
  ArrowRight,
  Bot,
  MapPin,
  Stethoscope,
  ShieldCheck,
  Package
} from 'lucide-react';

export function App() {
  // Current user account state
  const [currentUser, setUserState] = useState<UserAccount>(() => getCurrentUser());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Role Switcher: 'patient' vs 'hcp'
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  const [activeDoctorId, setActiveDoctorId] = useState<string>('dr-nazarian');

  // Cases state
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AppNavTab>('slider');

  // Doctor referral & triage context (e.g. from a low-score scan)
  const [doctorReferralContext, setDoctorReferralContext] = useState<DoctorReferralContext | null>(null);

  // Camera Overlay modal
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // AI Inspection Modals state
  const [singleAnalysisFrame, setSingleAnalysisFrame] = useState<SkinTimelineFrame | null>(null);
  const [differencePair, setDifferencePair] = useState<{
    baseline: SkinTimelineFrame;
    latest: SkinTimelineFrame;
  } | null>(null);

  // Chatbot selected photo context
  const [selectedChatPhoto, setSelectedChatPhoto] = useState<SkinTimelineFrame | null>(null);

  // Impiricus Clinical Sample Orders
  const [sampleOrders, setSampleOrders] = useState<SampleRequestOrder[]>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_sample_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'IMP-SMP-849201',
        doctorId: 'dr-nazarian',
        patientInitials: 'J.D.',
        drugName: 'Dupilumab 300mg Pre-filled Syringe Starter Kit (2x 300mg)',
        status: 'dispatched',
        orderDate: '2026-08-02',
        clinicAddress: 'Schweiger Dermatology Group - Midtown, 110 E 55th St, New York, NY',
        patientCondition: 'Atopic Dermatitis (Eczema)',
        dosageDetails: 'Priority Cold-Chain Express (Overnight)',
        trackingNumber: '1Z99999994829104',
      },
      {
        id: 'IMP-SMP-629143',
        doctorId: 'dr-schweiger',
        patientInitials: 'M.K.',
        drugName: 'Secukinumab 300mg SensoReady Pen Starter Kit (2x 150mg/mL)',
        status: 'dispatched',
        orderDate: '2026-07-16',
        clinicAddress: 'Schweiger Dermatology Group - Midtown, 110 E 55th St, New York, NY',
        patientCondition: 'Plaque Psoriasis',
        dosageDetails: 'Standard Medical Dispatch',
        trackingNumber: '1Z99999997193021',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('chronoderm_sample_orders', JSON.stringify(sampleOrders));
    } catch (e) {
      console.error('Failed to persist sample orders', e);
    }
  }, [sampleOrders]);

  const handleAddSampleOrder = (newOrder: SampleRequestOrder) => {
    setSampleOrders((prev) => [newOrder, ...prev]);
  };

  // Impiricus In-App Clinical Directive State (Strictly In-App, NO SMS)
  const [activeDirective, setActiveDirective] = useState<ClinicalDirective | null>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_active_directive');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    try {
      if (activeDirective) {
        localStorage.setItem('chronoderm_active_directive', JSON.stringify(activeDirective));
      } else {
        localStorage.removeItem('chronoderm_active_directive');
      }
    } catch (e) {
      console.error('Failed to persist active directive', e);
    }
  }, [activeDirective]);

  // Impiricus Co-Pay Database State
  const [copayCards, setCopayCards] = useState<CopayCardRecord[]>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_copay_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => ({
            ...c,
            cardVoucherId: c.cardVoucherId || c.id || `VCH-${Math.floor(100000 + Math.random() * 900000)}`,
            drugName: c.drugName || 'Specialty Biologic',
            patientName: c.patientName || 'Patient',
            patientInitials: c.patientInitials || 'P.T.',
            designatedPharmacy: c.designatedPharmacy || 'Designated Specialty Desk',
          }));
        }
      }
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'CPY-101',
        cardVoucherId: 'IMP-CPY-829104',
        patientName: 'Alex Morgan',
        patientInitials: 'A.M.',
        doctorId: 'dr-nazarian',
        doctorName: 'Dr. Rachel Nazarian, MD, FAAD',
        drugName: 'Dupilumab (Dupixent 300mg)',
        condition: 'Atopic Dermatitis (Moderate-to-Severe)',
        designatedPharmacy: 'CVS Pharmacy - Main St #4120',
        binNumber: '022938',
        pcnNumber: 'ADV',
        groupId: 'W48102',
        memberId: 'IMP94820194',
        copayAmount: '$0.00',
        maxAnnualSavings: '$1,500.00',
        issuedDate: '2026-08-14',
        status: 'active',
        notes: 'Attached during DermaLens flare assessment. Zero patient copay.',
      },
      {
        id: 'CPY-102',
        cardVoucherId: 'IMP-CPY-481920',
        patientName: 'Jordan Lee',
        patientInitials: 'J.L.',
        doctorId: 'dr-schweiger',
        doctorName: 'Dr. Eric Schweiger, MD, FAAD',
        drugName: 'Secukinumab (Cosentyx 300mg)',
        condition: 'Plaque Psoriasis',
        designatedPharmacy: 'Walgreens Pharmacy - Express Rx Desk',
        binNumber: '004336',
        pcnNumber: 'RXPR',
        groupId: 'COS9921',
        memberId: 'IMP11849201',
        copayAmount: '$0.00',
        maxAnnualSavings: '$1,500.00',
        issuedDate: '2026-08-10',
        status: 'routed_to_pharmacy',
        notes: 'Prior auth support bridge voucher transmitted to specialty desk.',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('chronoderm_copay_cards', JSON.stringify(copayCards));
    } catch (e) {
      console.error('Failed to persist copay cards', e);
    }
  }, [copayCards]);

  const handleAddCopayCard = (newCard: CopayCardRecord) => {
    setCopayCards((prev) => [newCard, ...prev]);
    showToast(`Impiricus Co-Pay Card attached for ${newCard.patientName}`, 'success');
  };

  // Two-Way Synchronized Appointments State (Matching Patient Portal & HCP Clinician Portal)
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({
            ...a,
            patientName: a.patientName || 'Patient',
            patientInitials: a.patientInitials || 'P.T.',
            dayOfWeek: a.dayOfWeek || 'Saturday',
            date: a.date || a.appointmentDate || '2026-10-24',
            appointmentDate: a.appointmentDate || a.date || '2026-10-24',
            timeSlot: a.timeSlot || a.appointmentTime || '10:00 AM',
            appointmentTime: a.appointmentTime || a.timeSlot || '10:00 AM',
            reason: a.reason || 'Clinical Consultation',
            consultType: a.consultType || (a.type as any) || 'scheduled_video',
            type: a.type || a.consultType || 'scheduled_video',
            status: a.status || 'confirmed',
          }));
        }
      }
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'APT-1001',
        doctorId: 'dr-nazarian',
        doctorName: 'Dr. Rachel Nazarian, MD, FAAD',
        patientId: 'patient-alex-morgan',
        patientName: 'Alex Morgan',
        patientInitials: 'A.M.',
        date: '2026-10-24',
        appointmentDate: '2026-10-24',
        timeSlot: '10:30 AM',
        appointmentTime: '10:30 AM',
        dayOfWeek: 'Saturday',
        consultType: 'scheduled_video',
        type: 'scheduled_video',
        status: 'confirmed',
        reason: 'Longitudinal Flare Assessment & Biologic Review (Saturday Clinic Session)',
        urgency: 'high',
        notes: 'Patient requested Saturday weekend consult for Atopic Dermatitis flare triage.',
        bookedBy: 'patient',
        matchedWithPatientPortal: true,
      },
      {
        id: 'APT-1002',
        doctorId: 'dr-nazarian',
        doctorName: 'Dr. Rachel Nazarian, MD, FAAD',
        patientId: 'patient-jordan-lee',
        patientName: 'Jordan Lee',
        patientInitials: 'J.L.',
        date: '2026-10-27',
        appointmentDate: '2026-10-27',
        timeSlot: '2:15 PM',
        appointmentTime: '2:15 PM',
        dayOfWeek: 'Tuesday',
        consultType: 'in_clinic',
        type: 'in_clinic',
        clinicName: 'Mount Sinai Dermatology Faculty Practice - 5 E 98th St, New York, NY',
        status: 'confirmed',
        reason: 'Psoriasis Biologic In-Clinic Check & PASI Assessment',
        urgency: 'routine',
        notes: 'Scheduled following week 6 phototherapy session.',
        bookedBy: 'doctor',
        matchedWithPatientPortal: true,
      },
      {
        id: 'APT-1003',
        doctorId: 'dr-schweiger',
        doctorName: 'Dr. Eric Schweiger, MD, FAAD',
        patientId: 'patient-case-acne',
        patientName: 'Sarah Chen',
        patientInitials: 'S.C.',
        date: '2026-10-28',
        appointmentDate: '2026-10-28',
        timeSlot: '11:00 AM',
        appointmentTime: '11:00 AM',
        dayOfWeek: 'Wednesday',
        consultType: 'scheduled_video',
        type: 'scheduled_video',
        status: 'pending',
        reason: 'Severe Cystic Acne Oral Retinoid Monitoring',
        urgency: 'routine',
        notes: 'Monthly lab check and adherence verification.',
        bookedBy: 'patient',
        matchedWithPatientPortal: true,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('chronoderm_appointments', JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to persist appointments', e);
    }
  }, [appointments]);

  const handleAddAppointment = (newAppt: AppointmentRecord) => {
    setAppointments((prev) => [newAppt, ...prev.filter((a) => a.id !== newAppt.id)]);
    showToast(`Appointment scheduled for ${newAppt.dayOfWeek}, ${newAppt.appointmentDate} at ${newAppt.appointmentTime} (Matched across portals)`, 'success');
  };

  const handleUpdateAppointmentStatus = (apptId: string, status: 'confirmed' | 'pending' | 'completed' | 'cancelled') => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status } : a))
    );
    showToast(`Appointment status updated to ${status.toUpperCase()}`, 'info');
  };

  // Doctor Appointment Recommendation State (Dispatched from HCP Clinician Portal)
  // By default null: ONLY shows up if an HCP clinician sends an appointment invitation
  const [activeRecommendation, setActiveRecommendation] = useState<AppointmentRecommendation | null>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_active_recommendation');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Specifically exclude legacy hardcoded demo default ID 'REC-2026-01'
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.id !== 'REC-2026-01') {
          return {
            ...parsed,
            patientName: parsed.patientName || 'Patient',
            patientInitials: parsed.patientInitials || 'P.T.',
            recommendedDate: parsed.recommendedDate || '2026-10-24',
            recommendedDayOfWeek: parsed.recommendedDayOfWeek || 'Saturday',
            recommendedTimeSlot: parsed.recommendedTimeSlot || '10:30 AM',
            condition: parsed.condition || 'Skin Flare Review',
            rationale: parsed.rationale || 'Longitudinal data report review follow-up.',
          };
        }
      }
    } catch (e) {
      // ignore
    }
    // Default to null so NO unsolicited recommendation appears
    return null;
  });

  useEffect(() => {
    try {
      if (activeRecommendation && activeRecommendation.id !== 'REC-2026-01') {
        localStorage.setItem('chronoderm_active_recommendation', JSON.stringify(activeRecommendation));
      } else {
        localStorage.removeItem('chronoderm_active_recommendation');
      }
    } catch (e) {
      console.error('Failed to persist active recommendation', e);
    }
  }, [activeRecommendation]);

  // Dispatched Clinic Referrals from HCP Clinician to Patient
  const [clinicReferrals, setClinicReferrals] = useState<ClinicReferral[]>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_clinic_referrals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'REF-2026-01',
        clinicId: 'schweiger-manhattan',
        clinicName: 'Schweiger Dermatology Group - Manhattan Flagship',
        clinicAddress: '110 E 55th St, 14th Floor, New York, NY 10022',
        clinicPhone: '(844) 337-6362',
        clinicPhysician: 'Dr. Eric Schweiger, MD & Team (110+ locations)',
        clinicSpecialties: ['Atopic Eczema', 'Psoriasis', 'Acne & Rosacea', 'Biologic Therapies', 'Same-Day Flares'],
        patientId: 'case-atopic-dermatitis',
        patientName: 'Alex Morgan',
        referringDoctorName: 'Dr. Rachel Nazarian, MD, FAAD',
        priority: 'expedited_flare',
        referralReason: 'Specialized Biologic Evaluation & Administration',
        notes: 'Patient exhibits recurrent moderate-to-severe AD flares with elevated IGA rebound. Referred for in-person biologic administration (Dupilumab/JAK inhibitor step therapy assessment) and narrowband phototherapy protocol.',
        createdAt: '2026-10-18T15:45:00Z',
        status: 'dispatched',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('chronoderm_clinic_referrals', JSON.stringify(clinicReferrals));
    } catch (e) {
      console.error('Failed to persist clinic referrals', e);
    }
  }, [clinicReferrals]);

  const handleReferClinic = (referral: ClinicReferral) => {
    setClinicReferrals((prev) => [referral, ...prev.filter((r) => r.clinicId !== referral.clinicId)]);
    showToast(`Referral for ${referral.clinicName} sent to ${referral.patientName}`, 'success');
  };

  // Modal State for Doctor Recommending When to Meet
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState<boolean>(false);
  const [recommendModalCase, setRecommendModalCase] = useState<ClinicalCase | null>(null);

  const handleSendAppointmentRecommendation = (rec: AppointmentRecommendation) => {
    setActiveRecommendation(rec);
    showToast(`Appointment recommendation dispatched to ${rec.patientName} for ${rec.recommendedDayOfWeek}, ${rec.recommendedDate}`, 'success');
  };

  const handleAcceptRecommendation = (rec: AppointmentRecommendation) => {
    let isoDate = new Date().toISOString().split('T')[0];
    if (rec.recommendedDate) {
      const trimmed = rec.recommendedDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        isoDate = trimmed;
      } else {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          isoDate = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        }
      }
    }

    const newAppt: AppointmentRecord = {
      id: `APT-${Date.now()}`,
      doctorId: rec.doctorId,
      doctorName: rec.doctorName,
      patientId: rec.patientId || (currentUser?.id ? `patient-${currentUser.id}` : 'patient-user'),
      patientName: rec.patientName || currentUser?.name || 'Patient',
      patientInitials: rec.patientInitials || 'PT',
      date: isoDate,
      appointmentDate: isoDate,
      timeSlot: rec.recommendedTimeSlot || '10:00 AM',
      appointmentTime: rec.recommendedTimeSlot || '10:00 AM',
      dayOfWeek: rec.recommendedDayOfWeek || 'Saturday',
      consultType: rec.consultType || 'scheduled_video',
      type: rec.consultType || 'scheduled_video',
      status: 'confirmed',
      reason: `Physician Recommended Visit: ${rec.condition || 'Longitudinal Clinical Checkpoint'}`,
      urgency: rec.urgency || 'routine',
      notes: rec.rationale || rec.clinicalRationale || '',
      bookedBy: 'patient',
      matchedWithPatientPortal: true,
    };
    handleAddAppointment(newAppt);
    setActiveRecommendation(null);
    try {
      localStorage.removeItem('chronoderm_active_recommendation');
    } catch (e) {
      // ignore
    }
    showToast(`Appointment confirmed with ${rec.doctorName} for ${rec.recommendedDayOfWeek || 'Upcoming'}, ${rec.recommendedDateFormatted || rec.recommendedDate} at ${rec.recommendedTimeSlot}!`, 'success');
  };

  const handleDeclineRecommendation = (rec?: AppointmentRecommendation | null) => {
    setActiveRecommendation(null);
    try {
      localStorage.removeItem('chronoderm_active_recommendation');
    } catch (e) {
      // ignore
    }
    showToast(`Doctor appointment invitation declined. Your schedule remains open.`, 'info');
  };

  // In-app Toast message
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'delete' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'delete' | 'error' = 'success') => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 3500);
    },
    []
  );

  // Load cases whenever user changes
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const loaded = await loadUserCases(currentUser.id, !!currentUser.isGuestDemo);
        if (!mounted) return;
        setCases(loaded);
        if (loaded.length > 0) {
          setActiveCaseId(loaded[0].id);
        }
      } catch (err) {
        console.error('Failed to load user cases:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [currentUser.id, currentUser.isGuestDemo]);

  // Active case object
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  // Urgent triage flare count
  const pendingTriageCount = cases.filter((c) => {
    const last = c.frames[c.frames.length - 1];
    return last && (getEffectiveIgaScore(last, last.dermaLensEvaluation) >= 3 || last.dermaLensEvaluation?.status === 'suboptimal');
  }).length;

  // Detect whether case or active scan has a Moderate-to-Severe presentation per Impiricus DermaLens (IGA 3 or 4)
  const hasLowScoreAlert = Boolean(
    activeCase?.frames.some((f) => isModerateToSevereDermaLens(f)) ||
    (doctorReferralContext?.frame && isModerateToSevereDermaLens(doctorReferralContext.frame))
  );

  // Connect to doctor triage handler (strictly gates urgent connect right away to Moderate to Severe per Impiricus DermaLens)
  const handleConnectDoctor = useCallback(
    (frame?: SkinTimelineFrame, reason?: string, healthScore?: number) => {
      const dermaLens = frame?.dermaLensEvaluation || frame?.aiAnalysis?.dermaLensEvaluation;
      const isModSevere = isModerateToSevereDermaLens(frame, dermaLens);
      const iga = getEffectiveIgaScore(frame, dermaLens);
      const igaInfo = getIgaDetails(iga);

      setDoctorReferralContext({
        frame,
        conditionName: activeCase?.condition,
        reason: reason || (isModSevere
          ? `Urgent physician triage (Impiricus DermaLens™): ${igaInfo.severityGroup} presentation (IGA ${iga}/4, Suboptimal Status)`
          : `Routine clinical consultation for ${activeCase?.condition} (IGA ${iga}/4: ${igaInfo.severityGroup})`),
        healthScore,
        urgencyLevel: isModSevere ? 'critical' : 'standard',
        dermaLensEvaluation: dermaLens,
      });
      setActiveTab('doctor');
      if (isModSevere) {
        showToast(`Impiricus DermaLens Alert: ${igaInfo.severityGroup} (IGA ${iga}/4) - Connect Right Away Active`, 'error');
      } else {
        showToast(`Dermatology Consultation: Scan graded as ${igaInfo.severityGroup} (IGA ${iga}/4 - Routine)`, 'info');
      }
    },
    [activeCase, showToast]
  );

  // Save new photo frame to active case
  const handleCaptureFrame = async (newFrame: SkinTimelineFrame) => {
    if (!activeCase) return;

    const updatedFrames = sortFramesChronologically([...activeCase.frames, newFrame]);
    const updatedCase: ClinicalCase = {
      ...activeCase,
      frames: updatedFrames,
      totalWeeks: Math.max(...updatedFrames.map((f) => f.week), activeCase.totalWeeks),
    };

    const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
    setCases(updatedCases);

    // Save to account-partitioned storage
    await saveUserCases(currentUser.id, updatedCases);

    if (newFrame.dermaLensEvaluation) {
      const evalData = newFrame.dermaLensEvaluation;
      showToast(
        `DermaLens: ${evalData.detected_condition} (IGA ${evalData.iga_score}/4 • ${evalData.status.toUpperCase()})`,
        evalData.status === 'suboptimal' ? 'error' : 'success'
      );
    } else {
      showToast(`Photo for Week ${newFrame.week} (Day ${newFrame.day}) saved! Running AI diagnostic check...`, 'success');
    }

    // Automatically trigger AI single image analysis modal so user immediately sees diagnostic score & doctor recommendations
    setSingleAnalysisFrame(newFrame);
  };

  // Save AI diagnosis to a frame
  const handleSaveAnalysis = async (frameId: string, analysis: SingleImageAnalysisResult) => {
    if (!activeCase) return;

    const updatedFrames = activeCase.frames.map((f) => {
      if (f.id === frameId) {
        return {
          ...f,
          aiAnalysis: analysis,
          dermaLensEvaluation: analysis.dermaLensEvaluation || f.dermaLensEvaluation,
          erythemaIndex: analysis.erythemaIndex ?? f.erythemaIndex,
          inflammationAreaMm2: analysis.estimatedAreaMm2 ?? f.inflammationAreaMm2,
        };
      }
      return f;
    });

    const updatedCase: ClinicalCase = {
      ...activeCase,
      frames: updatedFrames,
    };

    const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
    setCases(updatedCases);
    await saveUserCases(currentUser.id, updatedCases);
    showToast(`AI diagnostic report saved for ${analysis.primaryDiagnosisSuggestion}!`, 'success');
  };

  // BULLETPROOF DELETE FRAME HANDLER
  const handleDeleteFrame = async (frameId: string) => {
    if (!activeCase) return;

    const targetFrame = activeCase.frames.find((f: SkinTimelineFrame) => f.id === frameId);
    const updatedFrames = activeCase.frames.filter((f: SkinTimelineFrame) => f.id !== frameId);

    const updatedCase: ClinicalCase = {
      ...activeCase,
      frames: updatedFrames,
    };

    const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
    setCases(updatedCases);

    // Immediately persist to user's storage
    await saveUserCases(currentUser.id, updatedCases);

    const label = targetFrame?.label || 'Photo checkpoint';
    showToast(`${label} deleted from account storage.`, 'delete');
  };

  // Patient Consultation Submission handler from ConnectDoctorSection
  const handleSubmitConsultation = useCallback(
    (record: PatientConsultationRecord) => {
      if (!activeCase) return;

      const existingConsultations = activeCase.consultations || [];
      const updatedCase: ClinicalCase = {
        ...activeCase,
        assignedDoctorId: record.doctorId,
        prescribingHcp: record.doctorName,
        consultations: [record, ...existingConsultations],
      };

      const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
      setCases(updatedCases);
      saveUserCases(currentUser.id, updatedCases);

      showToast(
        `Consultation packet & photos routed to ${record.doctorName}'s clinician queue (${record.refNumber})`,
        'success'
      );
    },
    [activeCase, cases, currentUser.id, showToast]
  );

  // Switch Role handler
  const handleToggleRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'hcp') {
      setActiveTab('hcp');
      showToast('Entered HCP Clinician Portal (Impiricus Provider Network)', 'info');
    } else {
      setActiveTab('slider');
      showToast('Returned to Patient Portal', 'info');
    }
  };

  // Switch to personal user account
  const handleLogin = async (email: string, name?: string) => {
    const user = logInUser(email, name);
    setUserState(user);
    showToast(`Signed into ${user.name}'s personal account. Zero pre-existing data.`, 'info');
    setActiveTab('slider');
  };

  // Switch to demo mode (Try Now feature for new users)
  const handleEnterDemo = () => {
    const guestUser = enterDemoMode();
    setUserState(guestUser);
    showToast('Switched to Try Now Demo mode (sample clinical trial benchmark data).', 'info');
  };

  const handleLogout = () => {
    const defaultUser = logOutUser();
    setUserState(defaultUser);
    showToast('Logged out of account session.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar with Role Switcher */}
      <Navbar
        cases={cases}
        activeCaseId={activeCaseId}
        onSelectCase={(id) => setActiveCaseId(id)}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        onLaunchCamera={() => setIsCameraOpen(true)}
        currentUser={currentUser}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        hasLowScoreAlert={hasLowScoreAlert}
        currentRole={currentRole}
        onToggleRole={handleToggleRole}
        activeDoctorName="Dr. Rachel Nazarian, MD"
        pendingTriageCount={pendingTriageCount}
        hasPendingRecommendation={!!activeRecommendation}
      />

      {/* Demo Banner for New Users (Try Now Mode) */}
      {currentUser.isGuestDemo && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-transparent border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>Try Now Demo Mode:</strong> You are exploring clinical trial benchmark cases. Real user accounts have zero pre-existing data.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleLogin(DEFAULT_USER.email, DEFAULT_USER.name)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <span>Open Personal Account</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading account storage...</p>
          </div>
        ) : (
          <>
            {/* HCP Clinical Directive In-App Notification Banner (Strictly In-App, NO SMS) */}
            {currentRole === 'patient' && activeDirective && (
              <ClinicalDirectiveBanner
                directive={activeDirective}
                onDismiss={() => {
                  setActiveDirective(null);
                  showToast('Directive acknowledged and dismissed', 'info');
                }}
                onLaunchCamera={() => {
                  setIsCameraOpen(true);
                }}
                onNavigateToMap={() => {
                  setActiveTab('map');
                }}
                onNavigateToDoctor={() => {
                  setActiveTab('doctor');
                }}
                patientCondition={activeCase?.condition}
                patientName={currentUser.name || 'Patient'}
              />
            )}

            {/* 1. 3D Morph & Presage Telemetry Slider */}
            {activeTab === 'slider' && (
              currentRole === 'hcp' ? (
                <HcpTimelineDatasetViewer
                  cases={cases}
                  activeCaseId={activeCaseId}
                  onSelectCase={(id: string) => setActiveCaseId(id)}
                  onOpenRecommendModal={(patientCase: ClinicalCase) => {
                    setRecommendModalCase(patientCase);
                    setIsRecommendModalOpen(true);
                  }}
                  onAddPatientCheckpoint={(caseId: string, newFrame: SkinTimelineFrame) => {
                    const targetCase = cases.find((c) => c.id === caseId);
                    if (!targetCase) return;
                    const updated = {
                      ...targetCase,
                      frames: sortFramesChronologically([...targetCase.frames, newFrame]),
                    };
                    const updatedCases = cases.map((c) => (c.id === caseId ? updated : c));
                    setCases(updatedCases);
                    saveUserCases(currentUser.id, updatedCases);
                    showToast(`Clinical photograph recorded in ${targetCase.patientInitials}'s dataset`, 'success');
                  }}
                />
              ) : (
                activeCase && (
                  <TimeMachine3D
                    clinicalCase={activeCase}
                    onLaunchCamera={() => setIsCameraOpen(true)}
                    onDeleteFrame={handleDeleteFrame}
                    onOpenSingleAnalysis={(frame) => setSingleAnalysisFrame(frame)}
                    onOpenDifferenceAnalysis={(baseline, latest) => setDifferencePair({ baseline, latest })}
                    onOpenChatbot={(frame) => {
                      setSelectedChatPhoto(frame || null);
                      setActiveTab('chat');
                    }}
                    onOpenMap={() => setActiveTab('map')}
                    onConnectDoctor={handleConnectDoctor}
                  />
                )
              )
            )}

            {/* 2. Connect with a Board-Certified Dermatologist (Patient Mode) */}
            {activeTab === 'doctor' && (
              <ConnectDoctorSection
                referralContext={doctorReferralContext}
                onClearReferral={() => setDoctorReferralContext(null)}
                onNavigateToMap={() => setActiveTab('map')}
                onNavigateToSlider={() => setActiveTab('slider')}
                onSubmitConsultation={handleSubmitConsultation}
                appointments={appointments}
                onBookAppointment={handleAddAppointment}
                activeRecommendation={activeRecommendation}
                onAcceptRecommendation={handleAcceptRecommendation}
                onDeclineRecommendation={handleDeclineRecommendation}
                onCancelAppointment={(apptId) => handleUpdateAppointmentStatus(apptId, 'cancelled')}
              />
            )}

            {/* 3. Interactive AI Clinical Dermatology Chatbot */}
            {activeTab === 'chat' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">AI Dermatology Consultation &amp; Treatments</h2>
                      <p className="text-xs text-slate-400">
                        Discuss your skin images, understand visual changes, and explore dermatologist-recommended treatments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('slider')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Back to 3D Slider
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('map')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Find Clinic on US Map</span>
                    </button>
                  </div>
                </div>

                <AiDermatologyChatbot
                  photos={activeCase?.frames || []}
                  activePhoto={selectedChatPhoto || (activeCase?.frames.length ? activeCase.frames[0] : null)}
                  conditionName={activeCase?.condition || 'Skin Condition'}
                  onNavigateToMap={() => setActiveTab('map')}
                  onNavigateToDifference={() => {
                    if (activeCase && activeCase.frames.length >= 2) {
                      setDifferencePair({
                        baseline: activeCase.frames[0],
                        latest: activeCase.frames[activeCase.frames.length - 1],
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* 4. Clinic Network Map & Patient Referrals */}
            {activeTab === 'map' && (
              <UsDermatologyMap
                cases={cases}
                activeCase={activeCase}
                currentRole={currentRole}
                referrals={clinicReferrals}
                onReferClinicToPatient={handleReferClinic}
                onAskChatbot={(clinicName) => {
                  setActiveTab('chat');
                  showToast(`Ready to discuss ${clinicName} with AI Assistant`, 'info');
                }}
                onBackToSlider={() => setActiveTab('slider')}
              />
            )}

            {/* 5. Try Out Guide Tab (Patient Mode) */}
            {activeTab === 'tryout' && (
              <TryOutGuide
                isGuestDemo={!!currentUser.isGuestDemo}
                onExploreCases={() => {
                  if (!currentUser.isGuestDemo) {
                    handleEnterDemo();
                  }
                  setActiveTab('slider');
                }}
                onTryCamera={() => setIsCameraOpen(true)}
                onGoToPersonalAccount={() => {
                  handleLogin(DEFAULT_USER.email, DEFAULT_USER.name);
                  setActiveTab('slider');
                }}
              />
            )}

            {/* 6. Healthcare Professional (HCP) Clinician Portal */}
            {activeTab === 'hcp' && (
              <HCPDashboard
                cases={cases}
                activeCaseId={activeCaseId}
                onSelectCase={(id) => setActiveCaseId(id)}
                onNavigateToSlider={() => setActiveTab('slider')}
                activeDoctorId={activeDoctorId}
                activeDoctorName="Dr. Rachel Nazarian, MD, FAAD"
                sampleOrders={sampleOrders}
                onAddSampleOrder={handleAddSampleOrder}
                copayCards={copayCards}
                onAddCopayCard={handleAddCopayCard}
                activeDirective={activeDirective}
                onSendDirective={(dir) => setActiveDirective(dir)}
                onNavigateToSamplesCopay={() => setActiveTab('samples_copay')}
                onNavigateToAppointments={() => setActiveTab('appointments')}
                onOpenRecommendAppointmentModal={(patientCase) => {
                  setRecommendModalCase(patientCase);
                  setIsRecommendModalOpen(true);
                }}
              />
            )}

            {/* 6b. Impiricus Clinical Samples & Co-Pay Card Database Section */}
            {activeTab === 'samples_copay' && (
              <HcpSampleCopayDatabase
                sampleOrders={sampleOrders}
                copayCards={copayCards}
                onAddSampleOrder={handleAddSampleOrder}
                onAddCopayCard={handleAddCopayCard}
                cases={cases}
                activeDoctorId={activeDoctorId}
                activeDoctorName="Dr. Rachel Nazarian, MD, FAAD"
                onSelectPatientCase={(caseId: string) => {
                  setActiveCaseId(caseId);
                  setActiveTab('hcp');
                }}
              />
            )}

            {/* 6c. Synchronized Appointments & Clinic Schedule Matching Section */}
            {activeTab === 'appointments' && (
              <HcpAppointmentsSchedule
                appointments={appointments}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onOpenRecommendModal={(c: ClinicalCase) => {
                  setRecommendModalCase(c || activeCase || cases[0]);
                  setIsRecommendModalOpen(true);
                }}
                cases={cases}
                activeDoctorId={activeDoctorId}
                activeDoctorName="Dr. Rachel Nazarian, MD, FAAD"
              />
            )}

            {/* 7. About Section */}
            {activeTab === 'about' && <AboutSection />}
          </>
        )}
      </main>

      {/* Standardized Camera & Photo Upload Overlay Modal */}
      {isCameraOpen && activeCase && (
        <CameraOverlay
          silhouetteType={activeCase.silhouetteType}
          conditionName={activeCase.condition}
          defaultWeek={activeCase.frames.length > 0 ? activeCase.frames[activeCase.frames.length - 1].week + 1 : 1}
          defaultDay={activeCase.frames.length > 0 ? activeCase.frames[activeCase.frames.length - 1].day + 7 : 0}
          onCaptureFrame={handleCaptureFrame}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* AI Single Image Diagnostic Modal */}
      {singleAnalysisFrame && activeCase && (
        <AiAnalysisModal
          frame={singleAnalysisFrame}
          conditionName={activeCase.condition}
          onClose={() => setSingleAnalysisFrame(null)}
          onSaveAnalysis={handleSaveAnalysis}
          onConnectDoctor={(frame: SkinTimelineFrame, reason: string, score: number) => {
            setSingleAnalysisFrame(null);
            handleConnectDoctor(frame, reason, score);
          }}
          onAskChatbot={() => {
            const frameToDiscuss = singleAnalysisFrame;
            setSingleAnalysisFrame(null);
            setSelectedChatPhoto(frameToDiscuss);
            setActiveTab('chat');
          }}
          onFindClinic={() => {
            setSingleAnalysisFrame(null);
            setActiveTab('map');
          }}
        />
      )}

      {/* AI Longitudinal Difference Modal */}
      {differencePair && activeCase && (
        <AiDifferenceModal
          baselineFrame={differencePair.baseline}
          latestFrame={differencePair.latest}
          conditionName={activeCase.condition}
          onClose={() => setDifferencePair(null)}
          onAskChatbot={() => {
            const latestFrame = differencePair.latest;
            setDifferencePair(null);
            setSelectedChatPhoto(latestFrame);
            setActiveTab('chat');
          }}
        />
      )}

      {/* HCP Doctor Recommend When to Meet Modal */}
      {isRecommendModalOpen && recommendModalCase && (
        <RecommendAppointmentModal
          patientCase={recommendModalCase}
          doctorName="Dr. Rachel Nazarian, MD, FAAD"
          doctorId={activeDoctorId}
          onClose={() => {
            setIsRecommendModalOpen(false);
            setRecommendModalCase(null);
          }}
          onSendRecommendation={(rec: AppointmentRecommendation) => {
            handleSendAppointmentRecommendation(rec);
            setIsRecommendModalOpen(false);
            setRecommendModalCase(null);
          }}
        />
      )}

      {/* Account & Storage Manager Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAccountModalOpen(false)}
        onLogin={handleLogin}
        onEnterDemo={handleEnterDemo}
        onLogout={handleLogout}
      />

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-medium ${
              toastMessage.type === 'delete' || toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {toastMessage.type === 'delete' ? (
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

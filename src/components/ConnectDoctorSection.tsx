import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Video,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  FileText,
  Send,
  RefreshCw,
  Mic,
  MicOff,
  VideoOff,
  Lock,
  ExternalLink,
  Pill,
  HeartHandshake,
  Search,
  Building2,
  ChevronRight,
  ChevronLeft,
  Flame,
  Activity,
  Layers,
  X,
  Filter,
  CalendarCheck,
  Download,
  Bell,
  CreditCard,
  Check,
  Map,
  HelpCircle,
} from 'lucide-react';
import {
  SkinTimelineFrame,
  DermatologyClinic,
  DermaLensEvaluation,
  PatientConsultationRecord,
  AppointmentRecord,
  AppointmentRecommendation
} from '../types';
import { COMPREHENSIVE_US_DERMATOLOGY_CLINICS } from '../data/dermatologyClinics';
import { isModerateToSevereDermaLens, getEffectiveIgaScore, getIgaDetails } from '../utils/dermaLensHelper';
import { PatientScheduleCalendar } from './PatientScheduleCalendar';

export interface DoctorReferralContext {
  frame?: SkinTimelineFrame;
  conditionName?: string;
  healthScore?: number;
  reason?: string;
  urgencyLevel?: 'critical' | 'high' | 'standard';
  dermaLensEvaluation?: DermaLensEvaluation;
}

interface ConnectDoctorSectionProps {
  referralContext?: DoctorReferralContext | null;
  onClearReferral?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToSlider?: () => void;
  onSubmitConsultation?: (record: PatientConsultationRecord) => void;
  appointments?: AppointmentRecord[];
  onBookAppointment?: (appt: AppointmentRecord) => void;
  activeRecommendation?: AppointmentRecommendation | null;
  onAcceptRecommendation?: (rec: AppointmentRecommendation) => void;
  onDeclineRecommendation?: (rec: AppointmentRecommendation) => void;
  onCancelAppointment?: (apptId: string) => void;
}
 
export interface AffiliatedClinic {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  distanceMiles: number;
}

export interface DoctorProfile {
  id: string;
  name: string;
  credentials: string;
  title: string;
  hospitalAffiliation: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  telehealthAvailability: string;
  isAvailableNow: boolean;
  estWaitMinutes: number;
  avatarUrl: string;
  licensedStates: string[];
  consultFee: string;
  phone: string;
  distanceMiles: number;
  affiliatedClinicCount: number;
  affiliatedClinicsSummary: string;
  affiliatedClinics: AffiliatedClinic[];
}

export const DOCTOR_RANGE_OPTIONS = [
  { value: 'ALL', label: 'All Distances' },
  { value: '15', label: 'Within 15 Miles' },
  { value: '30', label: 'Within 30 Miles' },
  { value: '50', label: 'Within 50 Miles' },
  { value: '100', label: 'Within 100 Miles' },
] as const;

export const CLINIC_NETWORK_OPTIONS = [
  { value: 'ALL', label: 'Any Clinic Network' },
  { value: '10', label: '10+ Clinics' },
  { value: '20', label: '20+ Clinics' },
  { value: '50', label: '50+ Clinics (Large Network)' },
  { value: '100', label: '100+ Clinics (Major)' },
] as const;

export const ALL_SPECIALTY_FILTERS = [
  'All Specialties',
  'Atopic Eczema',
  'Psoriasis',
  'Acne & Rosacea',
  'Skin Lesions & Mohs',
  'Acute Flare Triage',
  'Barrier Repair',
  'Biologic Therapies',
] as const;

export const FEATURED_DOCTORS: DoctorProfile[] = [
  {
    id: 'dr-nazarian',
    name: 'Dr. Rachel Nazarian',
    credentials: 'MD, FAAD',
    title: 'Board-Certified Dermatologist & Clinical Faculty',
    hospitalAffiliation: 'Mount Sinai Hospital & Schweiger Dermatology Group',
    rating: 4.9,
    reviewsCount: 1420,
    specialties: ['Atopic Eczema', 'Acute Flare Triage', 'Psoriasis', 'Barrier Repair'],
    telehealthAvailability: 'Available Now for Urgent Video Consult',
    isAvailableNow: true,
    estWaitMinutes: 8,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    licensedStates: ['NY', 'NJ', 'PA', 'CT', 'FL', 'CA', 'TX', 'IL'],
    consultFee: '$49 Flat or In-Network Insurance',
    phone: '(844) 337-6362',
    distanceMiles: 4.2,
    affiliatedClinicCount: 14,
    affiliatedClinicsSummary: '14 Connected Clinics across Manhattan, Brooklyn & NJ Tri-State Area',
    affiliatedClinics: [
      {
        name: 'Schweiger Dermatology Group - Midtown Flagship',
        address: '110 E 55th St, 14th Fl',
        city: 'New York',
        state: 'NY',
        phone: '(844) 337-6362',
        distanceMiles: 4.2,
      },
      {
        name: 'Mount Sinai Doctors Dermatology - Upper East Side',
        address: '5 E 98th St, 5th Fl',
        city: 'New York',
        state: 'NY',
        phone: '(212) 241-9728',
        distanceMiles: 5.8,
      },
      {
        name: 'Schweiger Dermatology Group - Flatiron',
        address: '21 W 19th St',
        city: 'New York',
        state: 'NY',
        phone: '(844) 337-6362',
        distanceMiles: 6.1,
      },
      {
        name: 'Schweiger Dermatology Group - Downtown Brooklyn',
        address: '32 Court St, Ste 303',
        city: 'Brooklyn',
        state: 'NY',
        phone: '(844) 337-6362',
        distanceMiles: 9.4,
      },
    ],
  },
  {
    id: 'dr-schweiger',
    name: 'Dr. Eric Schweiger',
    credentials: 'MD, FAAD',
    title: 'Founder & Chief Medical Officer',
    hospitalAffiliation: 'Schweiger Dermatology Group (110+ locations)',
    rating: 4.9,
    reviewsCount: 2450,
    specialties: ['Complex Lesion Evaluation', 'Biologic Therapies', 'Atopic Eczema'],
    telehealthAvailability: 'Available Today (Next slot in 25 min)',
    isAvailableNow: true,
    estWaitMinutes: 25,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    licensedStates: ['NY', 'NJ', 'PA', 'FL', 'CT', 'MA'],
    consultFee: '$49 Flat or In-Network Insurance',
    phone: '(844) 337-6362',
    distanceMiles: 8.5,
    affiliatedClinicCount: 110,
    affiliatedClinicsSummary: '110+ Connected Regional Clinics across NY, NJ, PA, CT & FL',
    affiliatedClinics: [
      {
        name: 'Schweiger Dermatology Group - Midtown Flagship',
        address: '110 E 55th St, 14th Fl',
        city: 'New York',
        state: 'NY',
        phone: '(844) 337-6362',
        distanceMiles: 8.5,
      },
      {
        name: 'Schweiger Dermatology Group - Garden City',
        address: '1300 Franklin Ave, Ste UL1',
        city: 'Garden City',
        state: 'NY',
        phone: '(844) 337-6362',
        distanceMiles: 18.2,
      },
      {
        name: 'Schweiger Dermatology Group - Paramus',
        address: '140 E Ridgewood Ave',
        city: 'Paramus',
        state: 'NJ',
        phone: '(844) 337-6362',
        distanceMiles: 22.0,
      },
      {
        name: 'Schweiger Dermatology Group - Philadelphia Center City',
        address: '1528 Walnut St, Ste 1500',
        city: 'Philadelphia',
        state: 'PA',
        phone: '(844) 337-6362',
        distanceMiles: 88.0,
      },
    ],
  },
  {
    id: 'dr-lin',
    name: 'Dr. Sarah Lin',
    credentials: 'MD, FAAD',
    title: 'Associate Clinical Professor of Dermatology',
    hospitalAffiliation: 'Stanford Health Care & Bay Area Telederm Network',
    rating: 4.8,
    reviewsCount: 980,
    specialties: ['Acne & Rosacea', 'Acute Flare Triage', 'Atopic Eczema', 'Barrier Repair'],
    telehealthAvailability: 'Available Now for Urgent Video Consult',
    isAvailableNow: true,
    estWaitMinutes: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813587-c5000570b679?auto=format&fit=crop&q=80&w=400',
    licensedStates: ['CA', 'WA', 'OR', 'AZ', 'NV', 'CO'],
    consultFee: '$49 Flat or In-Network Insurance',
    phone: '(800) 843-2287',
    distanceMiles: 24.0,
    affiliatedClinicCount: 18,
    affiliatedClinicsSummary: '18 Academic & Community Dermatology Clinics in Bay Area Network',
    affiliatedClinics: [
      {
        name: 'Stanford Medicine Dermatology Clinic',
        address: '450 Broadway St, Pavilion B',
        city: 'Redwood City',
        state: 'CA',
        phone: '(650) 723-6316',
        distanceMiles: 24.0,
      },
      {
        name: 'Stanford Health Care Dermatology - Palo Alto',
        address: '900 Blake Wilbur Dr',
        city: 'Palo Alto',
        state: 'CA',
        phone: '(650) 723-6316',
        distanceMiles: 29.5,
      },
      {
        name: 'Bay Area Dermatology Center - San Francisco',
        address: '2100 Webster St, Ste 405',
        city: 'San Francisco',
        state: 'CA',
        phone: '(415) 923-3000',
        distanceMiles: 35.0,
      },
    ],
  },
  {
    id: 'dr-leavitt',
    name: 'Dr. Matt Leavitt',
    credentials: 'DO, FAOCD',
    title: 'Executive Medical Director',
    hospitalAffiliation: 'Advanced Dermatology & Cosmetic Surgery (ADCS)',
    rating: 4.8,
    reviewsCount: 3100,
    specialties: ['Skin Lesions & Mohs', 'Psoriasis', 'Acute Flare Triage'],
    telehealthAvailability: 'Available Today (Next slot in 40 min)',
    isAvailableNow: true,
    estWaitMinutes: 40,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    licensedStates: ['FL', 'GA', 'NC', 'SC', 'OH', 'MI', 'VA'],
    consultFee: '$49 Flat or In-Network Insurance',
    phone: '(800) 647-9851',
    distanceMiles: 42.0,
    affiliatedClinicCount: 150,
    affiliatedClinicsSummary: '150+ Nationwide ADCS Dermatology & Clinical Surgery Centers',
    affiliatedClinics: [
      {
        name: 'ADCS Dermatology & Cosmetic Surgery - Orlando Flagship',
        address: '14050 Town Loop Blvd',
        city: 'Orlando',
        state: 'FL',
        phone: '(800) 647-9851',
        distanceMiles: 42.0,
      },
      {
        name: 'ADCS Dermatology Center - Tampa Bay',
        address: '13101 N 30th St',
        city: 'Tampa',
        state: 'FL',
        phone: '(813) 977-2040',
        distanceMiles: 65.0,
      },
      {
        name: 'ADCS Dermatology & Mohs Surgery - Miami',
        address: '3850 Bird Rd, Ste 401',
        city: 'Coral Gables',
        state: 'FL',
        phone: '(305) 448-3132',
        distanceMiles: 95.0,
      },
    ],
  },
  {
    id: 'dr-harper',
    name: 'Dr. Julie Harper',
    credentials: 'MD, FAAD',
    title: 'Clinical Dermatologist & Rosacea Authority',
    hospitalAffiliation: 'Dermatology & Laser Center & UAB Medical Center',
    rating: 4.9,
    reviewsCount: 1680,
    specialties: ['Acne & Rosacea', 'Barrier Repair', 'Acute Flare Triage'],
    telehealthAvailability: 'Available Tomorrow (Virtual slots open)',
    isAvailableNow: false,
    estWaitMinutes: 60,
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400',
    licensedStates: ['AL', 'GA', 'TN', 'FL', 'MS', 'TX'],
    consultFee: '$49 Flat or In-Network Insurance',
    phone: '(800) 458-3376',
    distanceMiles: 68.0,
    affiliatedClinicCount: 8,
    affiliatedClinicsSummary: '8 Specialized Rosacea & Complex Medical Dermatology Centers',
    affiliatedClinics: [
      {
        name: 'Dermatology & Laser Center of Alabama',
        address: '200 Missionary Ridge, Ste 110',
        city: 'Birmingham',
        state: 'AL',
        phone: '(205) 978-3336',
        distanceMiles: 68.0,
      },
      {
        name: 'UAB Medicine Dermatology Clinic',
        address: 'The Kirklin Clinic, 2000 6th Ave S',
        city: 'Birmingham',
        state: 'AL',
        phone: '(205) 801-8000',
        distanceMiles: 74.0,
      },
    ],
  },
  {
    id: 'dr-libby',
    name: 'Dr. Tiffany J. Libby',
    credentials: 'MD, FAAD, FACMS',
    title: 'Director of Mohs Micrographic & Dermatologic Surgery',
    hospitalAffiliation: 'Brown University Health Dermatology',
    rating: 5.0,
    reviewsCount: 890,
    specialties: ['Skin Lesions & Mohs', 'Biologic Therapies', 'Psoriasis'],
    telehealthAvailability: 'Available Today for Virtual Review',
    isAvailableNow: true,
    estWaitMinutes: 30,
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    licensedStates: ['RI', 'MA', 'CT', 'NY', 'NH', 'ME'],
    consultFee: '$49 Flat or In-Network Insurance',
    phone: '(401) 444-7959',
    distanceMiles: 18.5,
    affiliatedClinicCount: 12,
    affiliatedClinicsSummary: '12 Academic Mohs & Surgical Centers in Brown University Health',
    affiliatedClinics: [
      {
        name: 'Brown University Health Dermatology Clinic',
        address: '593 Eddy St, APC 10',
        city: 'Providence',
        state: 'RI',
        phone: '(401) 444-7959',
        distanceMiles: 18.5,
      },
      {
        name: 'Lifespan Physician Group Dermatology - East Greenwich',
        address: '1454 S County Trail',
        city: 'East Greenwich',
        state: 'RI',
        phone: '(401) 606-3800',
        distanceMiles: 27.0,
      },
    ],
  },
];

export const ConnectDoctorSection: React.FC<ConnectDoctorSectionProps> = ({
  referralContext,
  onClearReferral,
  onNavigateToMap,
  onNavigateToSlider,
  onSubmitConsultation,
  appointments = [],
  onBookAppointment,
  activeRecommendation,
  onAcceptRecommendation,
  onDeclineRecommendation,
  onCancelAppointment,
}) => {
  // Navigation view: 'calendar' (Patient Calendar & Availability) or 'booking' (Connect & Book Visit)
  const [activeSectionView, setActiveSectionView] = useState<'calendar' | 'booking'>(() => {
    return referralContext ? 'booking' : 'calendar';
  });

  // Selected doctor
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile>(FEATURED_DOCTORS[0]);

  // Consultation mode: 4 distinct workflows
  const [consultType, setConsultType] = useState<'urgent_video' | 'scheduled_video' | 'in_clinic' | 'async_rx'>('urgent_video');

  // Doctor Specialty Filter
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('All Specialties');

  // Doctor Range / Distance Filter (miles radius)
  const [rangeFilter, setRangeFilter] = useState<string>('ALL');

  // Doctor Connected Clinics Network Size Filter
  const [networkFilter, setNetworkFilter] = useState<string>('ALL');

  // Interactive toggle for viewing doctor's affiliated clinics
  const [expandedDoctorClinicsId, setExpandedDoctorClinicsId] = useState<string | null>(null);

  // Common patient profile fields
  const [patientName, setPatientName] = useState<string>('Patient');
  const [patientEmail, setPatientEmail] = useState<string>('alex.morgan@example.com');
  const [patientPhone, setPatientPhone] = useState<string>('(555) 392-1048');
  const [patientState, setPatientState] = useState<string>('NY');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'insurance' | 'self_pay' | 'hsa_fsa'>('self_pay');
  const [insuranceName, setInsuranceName] = useState<string>('Blue Cross Blue Shield');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Intense itching or burning sensation',
    'Severe redness / spreading erythema',
  ]);

  // Urgent Video State
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState<boolean>(false);
  const [roomStage, setRoomStage] = useState<'connecting' | 'doctor_joined' | 'rx_generated'>('connecting');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [consultationRefNumber, setConsultationRefNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<{ title: string; message: string; subDetails?: string } | null>(null);

  // Scheduled Virtual Visit Calendar State
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number>(today.getDate() + 1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:30 AM');
  const [visitReason, setVisitReason] = useState<string>('Skin Flare & Barrier Assessment');
  const [sendInAppReminder, setSendInAppReminder] = useState<boolean>(true);

  // In-Clinic Appointment State
  const [clinicSearchQuery, setClinicSearchQuery] = useState<string>('');
  const [selectedClinicState, setSelectedClinicState] = useState<string>('ALL');
  const [selectedClinic, setSelectedClinic] = useState<DermatologyClinic>(COMPREHENSIVE_US_DERMATOLOGY_CLINICS[0]);
  const [clinicServiceType, setClinicServiceType] = useState<string>('Comprehensive In-Person Skin Exam');
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<'morning' | 'afternoon' | 'first_available'>('morning');

  // Digital Review & e-Rx State
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('CVS Pharmacy - Main St #4120');
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState<string>('');
  const [rashDuration, setRashDuration] = useState<string>('1 to 2 weeks');
  const [priorTopicalUsage, setPriorTopicalUsage] = useState<string>('Over-the-counter hydrocortisone with no relief');
  const [knownAllergies, setKnownAllergies] = useState<string>('No known drug allergies (NKDA)');
  const [itchingScore, setItchingScore] = useState<number>(7);
  const [attachImpiricusCopayCard, setAttachImpiricusCopayCard] = useState<boolean>(true);

  // Populate triage complaint when referralContext changes
  // Matches Impiricus DermaLens Evaluation Engine: Only connect right away (urgent_video) if moderate to severe (IGA 3 or 4)
  useEffect(() => {
    if (referralContext) {
      const isModSevere = isModerateToSevereDermaLens(referralContext.frame, referralContext.dermaLensEvaluation);
      const iga = getEffectiveIgaScore(referralContext.frame, referralContext.dermaLensEvaluation);
      const igaInfo = getIgaDetails(iga);

      const scoreText = `Impiricus DermaLens™ Severity: ${igaInfo.severityGroup} (IGA ${iga}/4, Status: ${igaInfo.triageStatus}).`;
      const reasonText = referralContext.reason || `Clinical consultation requested for ${referralContext.conditionName || 'skin presentation'}.`;
      setChiefComplaint(`${reasonText} ${scoreText}`);

      if (isModSevere) {
        setConsultType('urgent_video');
      } else {
        setConsultType('scheduled_video');
      }
      setActiveSectionView('booking');
    }
  }, [referralContext]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // Filtered doctors by specialty, distance range, and affiliated clinic network size
  const filteredDoctors = useMemo(() => {
    return FEATURED_DOCTORS.filter((doc) => {
      // 1. Distance / Range filter
      if (rangeFilter !== 'ALL') {
        const maxDist = parseFloat(rangeFilter);
        if (doc.distanceMiles > maxDist) return false;
      }

      // 2. Connected Clinic Network filter
      if (networkFilter !== 'ALL') {
        const minClinics = parseInt(networkFilter, 10);
        if (doc.affiliatedClinicCount < minClinics) return false;
      }

      // 3. Specialty filter
      if (specialtyFilter && specialtyFilter !== 'All Specialties') {
        const filterLower = specialtyFilter.toLowerCase();
        const matches = doc.specialties && doc.specialties.some((spec) => {
          const specLower = (spec || '').toLowerCase();
          return specLower.includes(filterLower) || filterLower.includes(specLower);
        });
        if (!matches) return false;
      }

      return true;
    });
  }, [specialtyFilter, rangeFilter, networkFilter]);

  // One-click select a doctor's connected clinic
  const handleSelectAffiliatedClinic = (doc: DoctorProfile, affClinic: AffiliatedClinic) => {
    setSelectedDoctor(doc);
    const existing = COMPREHENSIVE_US_DERMATOLOGY_CLINICS.find(
      (c) => c.name.toLowerCase().includes(affClinic.name.toLowerCase()) || affClinic.name.toLowerCase().includes(c.name.toLowerCase())
    );
    if (existing) {
      setSelectedClinic(existing);
    } else {
      setSelectedClinic({
        id: `clinic-${doc.id}-${affClinic.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: affClinic.name,
        physician: doc.name,
        address: affClinic.address,
        city: affClinic.city,
        state: affClinic.state,
        zip: '10001',
        lat: 40.75,
        lng: -73.98,
        latitude: 40.75,
        longitude: -73.98,
        phone: affClinic.phone,
        website: 'https://derm-partner.org',
        rating: 4.9,
        reviewsCount: 140,
        specialties: doc.specialties,
        acceptingNewPatients: true,
        telehealthAvailable: true,
        acceptsWalkIns: true,
        teledermatologyAvailable: true,
        notes: `Affiliated clinical network of ${doc.name}`,
      });
    }
    setConsultType('in_clinic');
    setActiveSectionView('booking');
  };

  // Handle Action Submissions for each mode
  const handleLaunchUrgentVideo = () => {
    setIsSubmitting(true);
    const refNum = `CD-URGENT-${Math.floor(100000 + Math.random() * 900000)}`;
    setConsultationRefNumber(refNum);

    if (onSubmitConsultation) {
      onSubmitConsultation({
        id: refNum,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName: patientName || 'Patient',
        patientPhone,
        patientEmail,
        consultType: 'urgent_video',
        chiefComplaint: chiefComplaint || 'Urgent live triage requested via video consult.',
        symptoms: selectedSymptoms,
        refNumber: refNum,
        submittedAt: new Date().toISOString(),
        frame: referralContext?.frame,
        urgencyLevel: 'critical',
        status: 'pending_review',
      });
    }

    if (onBookAppointment) {
      const now = new Date();
      const todayIso = now.toISOString().split('T')[0];
      const todayDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      onBookAppointment({
        id: `APT-URGENT-${Date.now()}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientId: 'patient-user',
        patientName: patientName || 'Patient',
        patientInitials: 'PT',
        date: todayIso,
        appointmentDate: todayIso,
        timeSlot: `${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (Immediate)`,
        appointmentTime: 'Now',
        dayOfWeek: todayDay,
        consultType: 'urgent_video',
        type: 'urgent_video',
        status: 'confirmed',
        reason: `Urgent Video Triage: ${chiefComplaint || 'Live Dermatologist Telehealth Evaluation'}`,
        urgency: 'critical',
        notes: `Direct urgent connection with ${selectedDoctor.name}. Room ref #${refNum}.`,
        bookedBy: 'patient',
        matchedWithPatientPortal: true,
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsVideoRoomOpen(true);
      setRoomStage('connecting');
      setTimeout(() => {
        setRoomStage('doctor_joined');
      }, 3500);
    }, 800);
  };

  const handleBookScheduledVisit = () => {
    setIsSubmitting(true);
    const refNum = `CD-SCHED-${Math.floor(100000 + Math.random() * 900000)}`;
    setConsultationRefNumber(refNum);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${monthNames[calendarMonth]} ${selectedCalendarDate}, ${calendarYear}`;

    const apptDateObj = new Date(calendarYear, calendarMonth, selectedCalendarDate);
    const dayOfWeekName = apptDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const isoDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(selectedCalendarDate).padStart(2, '0')}`;

    if (onBookAppointment) {
      onBookAppointment({
        id: `APT-${Date.now()}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientId: 'patient-user',
        patientName: patientName || 'Patient',
        patientInitials: 'PT',
        date: isoDateStr,
        appointmentDate: isoDateStr,
        timeSlot: selectedTimeSlot,
        appointmentTime: selectedTimeSlot,
        dayOfWeek: dayOfWeekName,
        consultType: 'scheduled_video',
        type: 'scheduled_video',
        status: 'confirmed',
        reason: visitReason,
        urgency: isModerateToSevereDermaLens(referralContext?.frame, referralContext?.dermaLensEvaluation) ? 'urgent' : 'routine',
        notes: chiefComplaint,
        bookedBy: 'patient',
        matchedWithPatientPortal: true,
      });
    }

    if (onSubmitConsultation) {
      onSubmitConsultation({
        id: refNum,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName: patientName || 'Patient',
        patientPhone,
        patientEmail,
        consultType: 'scheduled_video',
        chiefComplaint: `${visitReason}. ${chiefComplaint}`.trim(),
        symptoms: selectedSymptoms,
        refNumber: refNum,
        submittedAt: new Date().toISOString(),
        frame: referralContext?.frame,
        urgencyLevel: isModerateToSevereDermaLens(referralContext?.frame, referralContext?.dermaLensEvaluation) ? 'critical' : 'standard',
        status: 'pending_review',
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
      setSuccessNotice({
        title: 'Virtual Visit Confirmed on Your Calendar!',
        message: `Your appointment with ${selectedDoctor.name}, ${selectedDoctor.credentials} is booked for ${dateStr} (${dayOfWeekName}) at ${selectedTimeSlot} (${patientState} Time).`,
        subDetails: `A calendar invitation and join link have been dispatched to ${patientEmail}. Matched and synchronized with Dr. ${selectedDoctor.name.split(' ')[1] || 'Clinician'}'s HCP portal schedule.`,
      });
    }, 800);
  };

  const handleBookInClinicVisit = () => {
    setIsSubmitting(true);
    const refNum = `CD-CLINIC-${Math.floor(100000 + Math.random() * 900000)}`;
    setConsultationRefNumber(refNum);

    const apptDateObj = new Date(calendarYear, calendarMonth, selectedCalendarDate);
    const dayOfWeekName = apptDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const isoDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(selectedCalendarDate).padStart(2, '0')}`;

    if (onBookAppointment) {
      const chosenTime = preferredTimeOfDay === 'morning' ? '10:00 AM' : preferredTimeOfDay === 'afternoon' ? '2:30 PM' : '11:15 AM';
      onBookAppointment({
        id: `APT-${Date.now()}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientId: 'patient-user',
        patientName: patientName || 'Patient',
        patientInitials: 'PT',
        date: isoDateStr,
        appointmentDate: isoDateStr,
        timeSlot: chosenTime,
        appointmentTime: chosenTime,
        dayOfWeek: dayOfWeekName,
        consultType: 'in_clinic',
        type: 'in_clinic',
        clinicName: selectedClinic.name,
        clinicAddress: selectedClinic.address,
        status: 'confirmed',
        reason: clinicServiceType,
        urgency: 'routine',
        notes: `In-Clinic: ${clinicServiceType}. Preferred: ${preferredTimeOfDay}. ${chiefComplaint}`.trim(),
        bookedBy: 'patient',
        matchedWithPatientPortal: true,
      });
    }

    if (onSubmitConsultation) {
      onSubmitConsultation({
        id: refNum,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName: patientName || 'Patient',
        patientPhone,
        patientEmail,
        consultType: 'in_clinic',
        chiefComplaint: `In-Clinic: ${clinicServiceType}. Preferred: ${preferredTimeOfDay}. ${chiefComplaint}`.trim(),
        symptoms: selectedSymptoms,
        refNumber: refNum,
        submittedAt: new Date().toISOString(),
        frame: referralContext?.frame,
        urgencyLevel: 'standard',
        status: 'pending_review',
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
      setSuccessNotice({
        title: 'In-Clinic Appointment Reserved!',
        message: `Your appointment for ${clinicServiceType} has been requested at ${selectedClinic.name} (${selectedClinic.city}, ${selectedClinic.state}).`,
        subDetails: `The clinical coordinator will phone ${patientPhone} to confirm check-in time. Clinic Phone: ${selectedClinic.phone}.`,
      });
    }, 800);
  };

  const handleSubmitDigitalRx = () => {
    setIsSubmitting(true);
    const refNum = `CD-ERX-${Math.floor(100000 + Math.random() * 900000)}`;
    setConsultationRefNumber(refNum);

    if (onSubmitConsultation) {
      onSubmitConsultation({
        id: refNum,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName: patientName || 'Patient',
        patientPhone,
        patientEmail,
        consultType: 'async_rx',
        chiefComplaint: `Digital e-Rx Review. Duration: ${rashDuration}. Itch: ${itchingScore}/10. Prior: ${priorTopicalUsage}. Allergies: ${knownAllergies}. ${chiefComplaint}`.trim(),
        symptoms: selectedSymptoms,
        refNumber: refNum,
        submittedAt: new Date().toISOString(),
        frame: referralContext?.frame,
        impiricusCopayAttached: attachImpiricusCopayCard,
        designatedPharmacy: selectedPharmacy,
        urgencyLevel: isModerateToSevereDermaLens(referralContext?.frame, referralContext?.dermaLensEvaluation) ? 'critical' : 'standard',
        status: 'pending_review',
      });
    }

    if (onBookAppointment) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = tomorrow.toISOString().split('T')[0];
      const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      onBookAppointment({
        id: `APT-ASYNC-${Date.now()}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientId: 'patient-user',
        patientName: patientName || 'Patient',
        patientInitials: 'PT',
        date: tomorrowIso,
        appointmentDate: tomorrowIso,
        timeSlot: '24hr Asynchronous Review',
        appointmentTime: 'Within 24 Hours',
        dayOfWeek: tomorrowDay,
        consultType: 'async_monitoring',
        type: 'async_monitoring',
        status: 'confirmed',
        reason: `Digital Skin Review & e-Rx: ${selectedPharmacy}`,
        urgency: 'routine',
        notes: `Digital review packet routed to ${selectedDoctor.name}. Prescription routing: ${selectedPharmacy}.`,
        bookedBy: 'patient',
        matchedWithPatientPortal: true,
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
      setSuccessNotice({
        title: 'Digital Skin Review & e-Rx Packet Submitted!',
        message: `Your photo checkpoint and symptom review have been submitted to ${selectedDoctor.name}, ${selectedDoctor.credentials}.`,
        subDetails: `Guaranteed turnaround within 24 hours. Prescribed medications with ${attachImpiricusCopayCard ? 'Impiricus $0 Co-Pay Savings Card attached' : 'standard pharmacy routing'} dispatched to ${selectedPharmacy}.`,
      });
    }, 800);
  };

  // Calendar Helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInCurrentMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // Filtered Clinics for In-Clinic Appointment
  const filteredInClinicList = useMemo(() => {
    return COMPREHENSIVE_US_DERMATOLOGY_CLINICS.filter((c) => {
      if (selectedClinicState !== 'ALL' && c.state !== selectedClinicState) return false;
      if (!clinicSearchQuery.trim()) return true;
      const q = (clinicSearchQuery || '').toLowerCase().trim();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q) ||
        (c.physician || '').toLowerCase().includes(q) ||
        (c.specialties && c.specialties.some((s) => (s || '').toLowerCase().includes(q)))
      );
    }).slice(0, 8);
  }, [clinicSearchQuery, selectedClinicState]);

  // Common Pharmacy Options
  const COMMON_PHARMACIES = [
    'CVS Pharmacy - Nearest Location (Auto-Detect)',
    'Walgreens Pharmacy - Express Rx Desk',
    'Duane Reade by Walgreens',
    'Capsule - Free Same-Day Hand Delivery',
    'Amazon Pharmacy / PillPack Home Delivery',
    'Rite Aid Pharmacy',
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#0c1427] via-[#091020] to-[#080b12] p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Board-Certified Teledermatology &amp; Urgent Care Network</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Connect with a Licensed Dermatologist
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Choose from 4 distinct clinical pathways: immediate urgent video visits, scheduled calendar appointments, in-clinic physical bookings, or asynchronous digital reviews with pharmacy e-Rx dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:18443376362"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Triage: (844) 337-DERM</span>
            </a>

            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono text-emerald-300 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Explore US Clinic Map</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REFERRAL BANNER: Triggered when user has an active referral context, strictly aligned with Impiricus DermaLens */}
      {referralContext && (() => {
        const isModSevere = isModerateToSevereDermaLens(referralContext.frame, referralContext.dermaLensEvaluation);
        const iga = getEffectiveIgaScore(referralContext.frame, referralContext.dermaLensEvaluation);
        const igaInfo = getIgaDetails(iga);

        return (
          <div className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 ${
            isModSevere
              ? 'border-rose-500/80 bg-gradient-to-r from-rose-950/90 via-red-950/80 to-[#18090f] shadow-rose-950/60'
              : 'border-cyan-500/40 bg-gradient-to-r from-slate-950/95 via-cyan-950/40 to-slate-900 shadow-cyan-950/30'
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg ${
                  isModSevere ? 'bg-rose-600 shadow-rose-600/40 animate-pulse' : 'bg-cyan-600 shadow-cyan-600/30'
                }`}>
                  {isModSevere ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-white font-mono text-xs font-bold uppercase tracking-wider ${
                      isModSevere ? 'bg-rose-500' : 'bg-cyan-600'
                    }`}>
                      {isModSevere ? '🚨 Impiricus DermaLens™ Urgent Triage' : 'ℹ️ Impiricus DermaLens™ Clinical Assessment'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                      isModSevere
                        ? 'bg-rose-900/80 border border-rose-400/40 text-rose-200'
                        : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-200'
                    }`}>
                      IGA {iga}/4: {igaInfo.severityGroup} ({igaInfo.triageStatus.toUpperCase()})
                    </span>
                    <span className={`text-xs font-bold ${isModSevere ? 'text-rose-300' : 'text-cyan-300'}`}>
                      {isModSevere ? 'Priority Connect Right Away Active' : 'Scheduled Virtual Visit Recommended'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {isModSevere
                      ? 'Moderate to Severe Presentation — Immediate Physician Triage Authorized'
                      : 'Optimal / Monitoring Presentation — Routine Clinical Pathway'}
                  </h3>

                  <p className={`text-xs max-w-3xl leading-relaxed ${isModSevere ? 'text-rose-100/90' : 'text-slate-300'}`}>
                    {isModSevere
                      ? `The Impiricus DermaLens Evaluation Engine scored your recent scan as ${igaInfo.severityGroup} (IGA ${iga}/4, Suboptimal Status). Per Impiricus clinical protocol, urgent connect right away is designated for moderate to severe flares.`
                      : `The Impiricus DermaLens Evaluation Engine scored your scan as ${igaInfo.severityGroup} (IGA ${iga}/4, ${igaInfo.triageStatus}). Under Impiricus DermaLens clinical protocols, urgent "Connect Right Away" is reserved strictly for Moderate to Severe flare states (IGA 3-4). We have defaulted to Scheduled Virtual Visit so you can pick an appointment.`}
                  </p>
                </div>
              </div>

              {/* Attached Photo Preview & Fast Connect */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
                {referralContext.frame && (
                  <div className="flex items-center gap-3">
                    <img
                      src={referralContext.frame.imageUrl}
                      alt="Referral frame"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow-md"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">{referralContext.frame.label}</div>
                      <div className="text-[11px] font-mono text-cyan-300">
                        IGA: {iga}/4 ({igaInfo.severityGroup})
                      </div>
                      <div className="text-[10px] text-slate-400">Attached to clinical intake</div>
                    </div>
                  </div>
                )}

                {onClearReferral && (
                  <button
                    type="button"
                    onClick={onClearReferral}
                    className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/60 border border-slate-700 text-xs transition-colors cursor-pointer"
                    title="Dismiss referral alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* INCOMING DOCTOR APPOINTMENT INVITATION (Sent from HCP Clinician Portal) */}
      {activeRecommendation && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-950/90 via-cyan-950/80 to-indigo-950/90 border-2 border-cyan-400 shadow-2xl shadow-cyan-950/60 flex flex-col gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/30">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                Action Required: Incoming Appointment Invitation
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hidden sm:inline-block">
                Sent from HCP Clinician Portal
              </span>
            </div>

            {activeRecommendation.urgency && (
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md self-start sm:self-auto ${
                activeRecommendation.urgency === 'critical' || activeRecommendation.urgency === 'urgent' || activeRecommendation.urgency === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                Priority: {activeRecommendation.urgency}
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                <Calendar className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {activeRecommendation.doctorName}
                  </span>
                  <span className="text-xs text-slate-400">
                    has proposed an appointment for you
                  </span>
                </div>

                <div className="text-base sm:text-lg font-black text-cyan-300 flex flex-wrap items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>
                    {activeRecommendation.recommendedDayOfWeek || 'Upcoming'}, {activeRecommendation.recommendedDate || 'Soon'} at {activeRecommendation.recommendedTimeSlot || '10:00 AM'}
                  </span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-800">
                    {activeRecommendation.consultType === 'in_clinic' ? 'In-Clinic Exam' : 'Virtual Video Visit'}
                  </span>
                </div>

                <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/90 max-w-3xl italic">
                  "{activeRecommendation.rationale || activeRecommendation.clinicalRationale || 'Doctor reviewed your longitudinal skin report and recommends clinical checkpoint.'}"
                </p>

                <p className="text-xs font-bold text-amber-300 pt-0.5">
                  Would you like to accept this appointment with {activeRecommendation.doctorName}?
                </p>
              </div>
            </div>

            {/* Accept / Decline Decision Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (onAcceptRecommendation) {
                    onAcceptRecommendation(activeRecommendation);
                  }
                  setActiveSectionView('calendar');
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Accept Appointment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeclineRecommendation) {
                    onDeclineRecommendation(activeRecommendation);
                  }
                }}
                className="px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Switcher: Patient Calendar & Availability vs Book Visit */}
      <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSectionView('calendar')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSectionView === 'calendar'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Schedule &amp; Calendar</span>
            {appointments.filter((a) => a.status !== 'cancelled').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-300 text-slate-950">
                {appointments.filter((a) => a.status !== 'cancelled').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionView('booking')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeSectionView === 'booking'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 px-3 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Patient Availability: <strong className="text-emerald-300">Open &amp; Synchronized</strong></span>
        </div>
      </div>

      {/* VIEW 1: Patient Calendar & Availability */}
      {activeSectionView === 'calendar' && (
        <PatientScheduleCalendar
          appointments={appointments}
          patientName={patientName}
          onBookNewAppointment={(date) => {
            if (date) {
              const parts = date.split('-');
              if (parts.length === 3) {
                setCalendarYear(Number(parts[0]));
                setCalendarMonth(Number(parts[1]) - 1);
                setSelectedCalendarDate(Number(parts[2]));
              }
            }
            setActiveSectionView('booking');
          }}
          onCancelAppointment={onCancelAppointment}
          onJoinVideoCall={(appt) => {
            const matchedDoc = FEATURED_DOCTORS.find((d) => d.id === appt.doctorId) || FEATURED_DOCTORS[0];
            setSelectedDoctor(matchedDoc);
            setIsVideoRoomOpen(true);
          }}
          onNavigateToClinicMap={onNavigateToMap}
        />
      )}

      {/* VIEW 2: Book / Connect with Doctor Workflow */}
      {activeSectionView === 'booking' && (
        <>
          {/* Main 4 Mode Tabs Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Urgent Video Visit */}
        <button
          type="button"
          onClick={() => {
            setConsultType('urgent_video');
            setBookingSuccess(false);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            consultType === 'urgent_video'
              ? 'bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold animate-pulse">
              ⚡ Live &lt; 15 min
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Urgent Video Visit</span>
              {consultType === 'urgent_video' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Instant on-call board-certified MD video visit for acute flares &amp; urgent evaluations.
            </p>
          </div>
        </button>

        {/* 2. Scheduled Virtual Visit (Dedicated Calendar Page) */}
        <button
          type="button"
          onClick={() => {
            setConsultType('scheduled_video');
            setBookingSuccess(false);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            consultType === 'scheduled_video'
              ? 'bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
              Interactive Calendar
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Scheduled Virtual Visit</span>
              {consultType === 'scheduled_video' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Select date &amp; time slots on the interactive calendar with your chosen specialist.
            </p>
          </div>
        </button>

        {/* 3. In-Clinic Appointment */}
        <button
          type="button"
          onClick={() => {
            setConsultType('in_clinic');
            setBookingSuccess(false);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            consultType === 'in_clinic'
              ? 'bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
              In-Person Care
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>In-Clinic Appointment</span>
              {consultType === 'in_clinic' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Fast-track in-person scheduling at verified partner dermatology clinics across the US.
            </p>
          </div>
        </button>

        {/* 4. Digital Review & e-Rx */}
        <button
          type="button"
          onClick={() => {
            setConsultType('async_rx');
            setBookingSuccess(false);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            consultType === 'async_rx'
              ? 'bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
              24-hr e-Prescription
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Digital Review &amp; e-Rx</span>
              {consultType === 'async_rx' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Doctor reviews your photo scan asynchronously and sends prescriptions to your pharmacy.
            </p>
          </div>
        </button>
      </div>

      {/* Main 2-Column Grid: Active Pathway View (Left 7 cols) + Available Dermatologists with Specialty Filter (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dedicated view depending on selected consultType (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* ========================================================================= */}
          {/* VIEW 1: URGENT VIDEO VISIT */}
          {/* ========================================================================= */}
          {consultType === 'urgent_video' && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Mode: Urgent Video Consultation</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Direct On-Call Physician Triage
                  </h2>
                </div>
                <div className="text-right font-mono text-xs text-emerald-400">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Doctor Ready Now
                  </span>
                </div>
              </div>

              {/* Provider Selected */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDoctor.avatarUrl}
                    alt={selectedDoctor.name}
                    className="w-12 h-12 rounded-xl object-cover border border-cyan-500/50"
                  />
                  <div>
                    <div className="text-xs font-mono text-cyan-300">Assigned On-Call Specialist</div>
                    <div className="text-sm font-bold text-white">{selectedDoctor.name}, {selectedDoctor.credentials}</div>
                    <div className="text-xs text-slate-400">{selectedDoctor.hospitalAffiliation}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-300 font-bold">~{selectedDoctor.estWaitMinutes} min wait</div>
                  <div className="text-[10px] text-slate-500 font-mono">Avg queue time</div>
                </div>
              </div>

              {/* Patient Intake Fields */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Patient Full Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Phone Number (for Telehealth Verification & Access)</label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Email Address</label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">US State (Physician Licensing)</label>
                    <select
                      value={patientState}
                      onChange={(e) => setPatientState(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-medium"
                    >
                      <option value="NY">New York (NY)</option>
                      <option value="CA">California (CA)</option>
                      <option value="FL">Florida (FL)</option>
                      <option value="PA">Pennsylvania (PA)</option>
                      <option value="TX">Texas (TX)</option>
                      <option value="IL">Illinois (IL)</option>
                      <option value="OH">Ohio (OH)</option>
                      <option value="GA">Georgia (GA)</option>
                      <option value="MA">Massachusetts (MA)</option>
                      <option value="WA">Washington (WA)</option>
                    </select>
                  </div>
                </div>

                {/* Symptoms Checklist */}
                <div>
                  <label className="text-slate-400 block mb-2 font-mono">Active Flare Symptoms:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Intense itching or burning sensation',
                      'Severe redness / spreading erythema',
                      'Crusting, weeping, or oozing lesions',
                      'Skin pain or extreme tenderness',
                      'Failure of over-the-counter hydrocortisone',
                      'Sleep disturbance due to skin discomfort',
                    ].map((symptom, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2 cursor-pointer ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            selectedSymptoms.includes(symptom)
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'border-slate-700'
                          }`}
                        >
                          {selectedSymptoms.includes(symptom) && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[11px] leading-tight">{symptom}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Chief Complaint / History:</label>
                  <textarea
                    rows={2}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Describe your skin flare, how many days it has persisted, and prior topicals used..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                {/* Payment Option */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 font-semibold">Consultation Coverage:</span>
                    <span className="font-mono text-cyan-400">HSA / FSA Card Eligible</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('self_pay')}
                      className={`p-2 rounded-xl border text-center cursor-pointer ${
                        paymentOption === 'self_pay'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">Flat $49</div>
                      <div className="text-[10px] text-slate-400">No referral needed</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('insurance')}
                      className={`p-2 rounded-xl border text-center cursor-pointer ${
                        paymentOption === 'insurance'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">Insurance</div>
                      <div className="text-[10px] text-slate-400">Copay varies</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('hsa_fsa')}
                      className={`p-2 rounded-xl border text-center cursor-pointer ${
                        paymentOption === 'hsa_fsa'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">HSA / FSA</div>
                      <div className="text-[10px] text-slate-400">Receipt generated</div>
                    </button>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  type="button"
                  onClick={handleLaunchUrgentVideo}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Connecting to Video Examination Room...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 text-slate-950" />
                      <span>Launch Urgent Video Consultation Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>HIPAA Compliant Video • 256-bit AES</span>
                  </span>
                  <span>•</span>
                  <span>Instant e-Rx dispatch upon completion</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: SCHEDULED VIRTUAL VISIT WITH INTERACTIVE CALENDAR */}
          {/* ========================================================================= */}
          {consultType === 'scheduled_video' && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Mode: Scheduled Virtual Appointment</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Schedule on Interactive Calendar
                  </h2>
                </div>
                <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-xl">
                  Provider: {selectedDoctor.name}
                </div>
              </div>

              {/* Interactive Calendar Card */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                {/* Month Selector Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-cyan-400" />
                    <span className="text-base font-bold text-white">
                      {monthNames[calendarMonth]} {calendarYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 text-center font-mono text-[11px] text-slate-400 font-bold border-b border-slate-800 pb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-xs">
                  {/* Empty preceding padding days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10 rounded-xl" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isToday =
                      dayNum === today.getDate() &&
                      calendarMonth === today.getMonth() &&
                      calendarYear === today.getFullYear();
                    const isPast =
                      calendarYear === today.getFullYear() &&
                      calendarMonth === today.getMonth() &&
                      dayNum < today.getDate();
                    const isSelected = selectedCalendarDate === dayNum;

                    // Weekend vs Weekday availability
                    const dayOfWeek = (firstDayOfWeek + i) % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedCalendarDate(dayNum)}
                        className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isPast
                            ? 'text-slate-600 bg-slate-950/40 cursor-not-allowed opacity-40'
                            : isSelected
                            ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30 scale-105 z-10'
                            : isToday
                            ? 'bg-blue-950/60 border border-blue-400 text-blue-200 font-bold hover:bg-slate-900'
                            : 'bg-slate-900/70 border border-slate-800/80 text-slate-200 hover:border-cyan-400/60 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-semibold">{dayNum}</span>
                        {!isPast && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              isSelected
                                ? 'bg-slate-950'
                                : isWeekend
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                        )}
                        {isToday && !isSelected && (
                          <span className="absolute -top-1 px-1 rounded bg-blue-500 text-slate-950 text-[8px] font-bold">
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots for the Selected Date */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Available Slots for {monthNames[calendarMonth].slice(0, 3)} {selectedCalendarDate}, {calendarYear}:
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">8 Slots Open</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    '09:00 AM',
                    '09:45 AM',
                    '10:30 AM',
                    '11:15 AM',
                    '01:30 PM',
                    '02:15 PM',
                    '03:45 PM',
                    '04:30 PM',
                  ].map((time) => {
                    const isSlotSelected = selectedTimeSlot === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(time)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                          isSlotSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-400/50 hover:bg-slate-800'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason for Virtual Visit */}
              <div className="space-y-2 text-xs">
                <label className="text-slate-400 font-mono block">Primary Visit Purpose</label>
                <select
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Skin Flare & Barrier Assessment">Skin Flare &amp; Barrier Assessment (Acute Erythema)</option>
                  <option value="Longitudinal Time Machine Progress Review">Longitudinal Time Machine Progress Review</option>
                  <option value="Atopic Dermatitis & Eczema Maintenance">Atopic Dermatitis &amp; Eczema Maintenance</option>
                  <option value="Psoriasis Biologic Protocol Check">Psoriasis Biologic Protocol Check</option>
                  <option value="Prescription Refill & Topicals Adjustment">Prescription Refill &amp; Topicals Adjustment</option>
                  <option value="Second Opinion / Mole & Lesion Dermoscopy">Second Opinion / Mole &amp; Lesion Dermoscopy</option>
                </select>
              </div>

              {/* Patient Contact & Reminder Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Email (for Calendar Invite)</label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Send 24-hr &amp; 1-hr In-App Push and Portal Alerts to patient profile</span>
                </div>
                <input
                  type="checkbox"
                  checked={sendInAppReminder}
                  onChange={(e) => setSendInAppReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-400 cursor-pointer"
                />
              </div>

              {/* Confirm Booking Button */}
              <button
                type="button"
                onClick={handleBookScheduledVisit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Reserving Calendar Slot...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4 text-slate-950" />
                    <span>Confirm Virtual Visit for {monthNames[calendarMonth].slice(0, 3)} {selectedCalendarDate} at {selectedTimeSlot}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: IN-CLINIC APPOINTMENT */}
          {/* ========================================================================= */}
          {consultType === 'in_clinic' && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Mode: In-Clinic Physical Examination</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Book In-Person Partner Clinic
                  </h2>
                </div>
                {onNavigateToMap && (
                  <button
                    type="button"
                    onClick={onNavigateToMap}
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Open 50-State Interactive Map</span>
                  </button>
                )}
              </div>

              {/* Doctor's Connected Clinics Fast Picker */}
              {selectedDoctor.affiliatedClinics && selectedDoctor.affiliatedClinics.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{selectedDoctor.name}'s Connected Clinics ({selectedDoctor.affiliatedClinicCount} in network):</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-200/70">1-Click Partner Selection</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDoctor.affiliatedClinics.map((aff, i) => {
                      const isMatch = selectedClinic.name === aff.name;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectAffiliatedClinic(selectedDoctor, aff)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            isMatch
                              ? 'bg-purple-900/60 border-purple-400 text-white font-semibold ring-1 ring-purple-400 shadow-md shadow-purple-500/10'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:bg-slate-900'
                          }`}
                        >
                          <div className="font-bold text-white truncate flex items-center justify-between gap-1">
                            <span className="truncate">{aff.name}</span>
                            {isMatch && <span className="text-[10px] text-purple-300 font-mono shrink-0">Selected ✓</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{aff.address}, {aff.city}, {aff.state}</div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 mt-1.5 pt-1.5 border-t border-slate-800/60">
                            <span>📍 {aff.distanceMiles} mi away</span>
                            <span>{aff.phone}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clinic Location Search & State Filter */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search clinic by city, state, or doctor (e.g. New York, Schweiger, Chicago)..."
                      value={clinicSearchQuery}
                      onChange={(e) => setClinicSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={selectedClinicState}
                    onChange={(e) => setSelectedClinicState(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">All States</option>
                    <option value="NY">New York (NY)</option>
                    <option value="CA">California (CA)</option>
                    <option value="FL">Florida (FL)</option>
                    <option value="TX">Texas (TX)</option>
                    <option value="IL">Illinois (IL)</option>
                    <option value="PA">Pennsylvania (PA)</option>
                    <option value="MA">Massachusetts (MA)</option>
                    <option value="GA">Georgia (GA)</option>
                  </select>
                </div>

                {/* Clinic Selector Cards */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredInClinicList.map((clinic) => {
                    const isChosen = selectedClinic.id === clinic.id;
                    return (
                      <div
                        key={clinic.id}
                        onClick={() => setSelectedClinic(clinic)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isChosen
                            ? 'bg-purple-950/40 border-purple-400 shadow-md text-white'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold flex items-center gap-1.5 truncate">
                            <span>{clinic.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300">
                              {clinic.state}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>{clinic.address}, {clinic.city}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Physician: {clinic.physician} • {clinic.phone}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isChosen ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700'}`}>
                            {isChosen && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-2 text-xs">
                <label className="text-slate-400 font-mono block">In-Person Clinical Service Required:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Comprehensive In-Person Skin Exam',
                    'Acute Lesion Biopsy & Dermoscopy',
                    'Biologics / Inflammatory Flare Protocol',
                    'Patch Allergy Testing & Contact Eczema',
                  ].map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => setClinicServiceType(service)}
                      className={`p-2.5 rounded-xl border text-left font-medium cursor-pointer transition-colors ${
                        clinicServiceType === service
                          ? 'bg-purple-950/50 border-purple-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Time Window */}
              <div className="space-y-2 text-xs">
                <label className="text-slate-400 font-mono block">Preferred Arrival Time:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredTimeOfDay('morning')}
                    className={`py-2 px-3 rounded-xl border text-center font-mono cursor-pointer ${
                      preferredTimeOfDay === 'morning'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Early (8 AM – 12 PM)</div>
                    <div className="text-[10px] text-slate-400">8:00 AM – 12:00 PM</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredTimeOfDay('afternoon')}
                    className={`py-2 px-3 rounded-xl border text-center font-mono cursor-pointer ${
                      preferredTimeOfDay === 'afternoon'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Afternoon</div>
                    <div className="text-[10px] text-slate-400">12:00 PM – 5:00 PM</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredTimeOfDay('first_available')}
                    className={`py-2 px-3 rounded-xl border text-center font-mono cursor-pointer ${
                      preferredTimeOfDay === 'first_available'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>First Available</div>
                    <div className="text-[10px] text-slate-400">Fastest check-in</div>
                  </button>
                </div>
              </div>

              {/* Submit In-Clinic Button */}
              <button
                type="button"
                onClick={handleBookInClinicVisit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-600 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Routing to Clinic Desk...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 text-white" />
                    <span>Request In-Clinic Appointment at {selectedClinic.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: DIGITAL REVIEW & E-RX */}
          {/* ========================================================================= */}
          {consultType === 'async_rx' && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    <span>Mode: Asynchronous Photo Review &amp; e-Prescription</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    24-Hour Doctor Review &amp; Pharmacy e-Rx
                  </h2>
                </div>
                <div className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-xl">
                  Guaranteed &lt; 24 hr Turnaround
                </div>
              </div>

              {/* Photo Attachment Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {referralContext?.frame ? (
                    <img
                      src={referralContext.frame.imageUrl}
                      alt="Skin frame"
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-500/50"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">ChronoDerm Clinical Checkpoint Photo Attached</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {referralContext?.frame
                        ? `Week ${referralContext.frame.week} • Erythema ${referralContext.frame.erythemaIndex}/100`
                        : 'Most recent skin timeline scan ready for physician diagnosis'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </div>

              {/* Pharmacy Selector */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-mono font-bold block">
                    Designated Local Pharmacy for e-Prescription (e-Rx):
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">NCPDP E-Prescribing Compliant</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_PHARMACIES.map((pharmacy) => (
                    <button
                      key={pharmacy}
                      type="button"
                      onClick={() => setSelectedPharmacy(pharmacy)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                        selectedPharmacy === pharmacy
                          ? 'bg-emerald-950/50 border-emerald-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{pharmacy}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or enter custom pharmacy name, address, or zip code..."
                    value={pharmacySearchQuery}
                    onChange={(e) => {
                      setPharmacySearchQuery(e.target.value);
                      if (e.target.value.trim()) {
                        setSelectedPharmacy(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Asynchronous Medical History Questionnaire */}
              <div className="space-y-3 text-xs pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Flare Duration</label>
                    <select
                      value={rashDuration}
                      onChange={(e) => setRashDuration(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="1 to 3 days">1 to 3 days (Acute onset)</option>
                      <option value="1 to 2 weeks">1 to 2 weeks (Sub-acute)</option>
                      <option value="Over 1 month">Over 1 month (Chronic recalcitrant)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Known Drug Allergies</label>
                    <input
                      type="text"
                      value={knownAllergies}
                      onChange={(e) => setKnownAllergies(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-mono">Itching / Burning Severity (0-10):</label>
                    <span className="font-mono font-bold text-amber-400">{itchingScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={itchingScore}
                    onChange={(e) => setItchingScore(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Prior Topicals / Treatments Tried</label>
                  <input
                    type="text"
                    value={priorTopicalUsage}
                    onChange={(e) => setPriorTopicalUsage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Impiricus Manufacturer Co-Pay Savings Card Injection ($0 Patient Copay) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-cyan-950/40 border border-emerald-500/50 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                          Impiricus Co-Pay Bridge
                        </span>
                        <span className="text-xs font-bold text-white">
                          Attach Impiricus Manufacturer Co-Pay Savings Card ($0 Patient Copay)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Attach an Impiricus-sponsored pharmaceutical co-pay assistance voucher to your digital e-prescription packet. Qualifies eligible commercially insured patients for $0 out-of-pocket prescription copays (up to $1,500/year savings) at checkout.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={attachImpiricusCopayCard}
                      onChange={(e) => setAttachImpiricusCopayCard(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {attachImpiricusCopayCard && (
                  <div className="pt-2.5 border-t border-emerald-500/20 flex flex-col gap-2.5">
                    {/* Explicit UI note for pharmacy routing */}
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-white font-bold">Automatic Pharmacy Dispatch:</strong> Card will be automatically routed to the designated pharmacy ({selectedPharmacy.split('-')[0].trim()}) with the e-prescription packet.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col">
                        <span className="text-slate-400 font-mono text-[10px]">Patient Copay:</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">$0.00 / month</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col">
                        <span className="text-slate-400 font-mono text-[10px]">Annual Assistance:</span>
                        <span className="text-sm font-black text-cyan-300 font-mono">Up to $1,500 / yr</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col">
                        <span className="text-slate-400 font-mono text-[10px]">Direct e-Rx Routing:</span>
                        <span className="text-xs font-bold text-slate-200 truncate mt-0.5">{selectedPharmacy.split('-')[0]}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit e-Rx Review */}
              <button
                type="button"
                onClick={handleSubmitDigitalRx}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Dispatching Digital Intake Packet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Submit for 24-hr Asynchronous e-Rx Review ($39 Flat)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Booking / Request Success Confirmation Banner */}
          {bookingSuccess && successNotice && (
            <div className="p-6 rounded-3xl bg-emerald-950/50 border-2 border-emerald-500/60 text-emerald-100 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-base text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span>{successNotice.title}</span>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-900/80 border border-emerald-500 text-emerald-200">
                  Ref #{consultationRefNumber}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200 font-medium">
                {successNotice.message}
              </p>
              {successNotice.subDetails && (
                <p className="text-[11px] text-emerald-200/90 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/30">
                  {successNotice.subDetails}
                </p>
              )}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {consultType === 'scheduled_video' && (
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`ChronoDerm Dermatology Consultation with ${selectedDoctor.name}`)}&details=${encodeURIComponent(`Virtual visit for ${visitReason}. Provider: ${selectedDoctor.name}, ${selectedDoctor.credentials}.`)}&dates=${calendarYear}${String(calendarMonth + 1).padStart(2, '0')}${String(selectedCalendarDate).padStart(2, '0')}T143000Z/${calendarYear}${String(calendarMonth + 1).padStart(2, '0')}${String(selectedCalendarDate).padStart(2, '0')}T150000Z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow hover:bg-cyan-400 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Add to Google Calendar</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(false);
                    setActiveSectionView('calendar');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View on My Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingSuccess(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Another Request
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Available Dermatologists with RANGE & CLINIC NETWORK FILTERS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4">
            {/* Header with Total Count & Reset */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Available Dermatologists</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Board-certified MDs connected with regional clinical networks
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(rangeFilter !== 'ALL' || networkFilter !== 'ALL' || specialtyFilter !== 'All Specialties') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRangeFilter('ALL');
                      setNetworkFilter('ALL');
                      setSpecialtyFilter('All Specialties');
                    }}
                    className="text-[10px] text-cyan-400 hover:underline font-mono cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  {filteredDoctors.length} Specialists
                </span>
              </div>
            </div>

            {/* Range & Network Filters */}
            <div className="space-y-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-xs">
              {/* Doctor Range / Distance Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>Doctor Range / Distance:</span>
                  </span>
                  {rangeFilter !== 'ALL' && (
                    <span className="text-cyan-400 font-bold">≤ {rangeFilter} miles</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {DOCTOR_RANGE_OPTIONS.map((opt) => {
                    const isActive = rangeFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRangeFilter(opt.value)}
                        className={`px-2 py-0.8 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connected Clinic Network Size Filter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-purple-400" />
                    <span>Clinic Network Size:</span>
                  </span>
                  {networkFilter !== 'ALL' && (
                    <span className="text-purple-300 font-bold">≥ {networkFilter} clinics</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {CLINIC_NETWORK_OPTIONS.map((opt) => {
                    const isActive = networkFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNetworkFilter(opt.value)}
                        className={`px-2 py-0.8 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specialty Filter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-emerald-400" />
                    <span>Clinical Specialty:</span>
                  </span>
                  {specialtyFilter !== 'All Specialties' && (
                    <span className="text-emerald-300 font-bold">{specialtyFilter}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {ALL_SPECIALTY_FILTERS.map((specialty) => {
                    const isActive = specialtyFilter === specialty;
                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => setSpecialtyFilter(specialty)}
                        className={`px-2 py-0.8 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {specialty}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Doctors List */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredDoctors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono space-y-2">
                  <p>No specialists found matching your active range, network, or specialty filters.</p>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setRangeFilter('ALL');
                        setNetworkFilter('ALL');
                        setSpecialtyFilter('All Specialties');
                      }}
                      className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctor.id === doc.id;
                  const isClinicsExpanded = expandedDoctorClinicsId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={doc.avatarUrl}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs text-white truncate">
                              {doc.name}, <span className="text-cyan-300">{doc.credentials}</span>
                            </h4>
                            <span className="text-[10px] font-mono text-amber-300 flex items-center gap-0.5 shrink-0">
                              ★ {doc.rating}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 truncate mt-0.5">
                            {doc.hospitalAffiliation}
                          </p>

                          {/* Distance Range & Connected Clinic Count Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{doc.distanceMiles} mi away</span>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDoctorClinicsId(isClinicsExpanded ? null : doc.id);
                              }}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-500/30 text-purple-300 hover:border-purple-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                              title="Click to toggle connected clinics"
                            >
                              <Building2 className="w-2.5 h-2.5" />
                              <span>{doc.affiliatedClinicCount} Connected Clinics</span>
                              <span className="text-[8px] font-bold ml-0.5">{isClinicsExpanded ? '▲' : '▼'}</span>
                            </button>
                          </div>

                          {/* Specialties with highlighted active match */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {doc.specialties.map((sp, idx) => {
                              const filterLower = (specialtyFilter || '').toLowerCase();
                              const spLower = (sp || '').toLowerCase();
                              const matchesFilter =
                                specialtyFilter &&
                                specialtyFilter !== 'All Specialties' &&
                                (spLower.includes(filterLower) || filterLower.includes(spLower));
                              return (
                                <span
                                  key={idx}
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                    matchesFilter
                                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                                      : 'bg-slate-950 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  {sp}
                                </span>
                              );
                            })}
                          </div>

                          {/* Interactive Connected Clinics Accordion Drawer */}
                          {isClinicsExpanded && doc.affiliatedClinics && doc.affiliatedClinics.length > 0 && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-purple-500/40 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 font-bold">
                                <span>Affiliated Clinic Network ({doc.affiliatedClinicCount} total):</span>
                                <span className="text-slate-400 font-normal">Click to book here</span>
                              </div>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {doc.affiliatedClinics.map((aff, affIdx) => (
                                  <div
                                    key={affIdx}
                                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-1"
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-bold text-white text-[11px] truncate">{aff.name}</span>
                                      <span className="text-[9px] font-mono text-cyan-300 shrink-0">📍 {aff.distanceMiles} mi</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate">{aff.address}, {aff.city}, {aff.state}</p>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                                      <span className="text-[9px] font-mono text-slate-400">{aff.phone}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSelectAffiliatedClinic(doc, aff)}
                                        className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-400/40 text-[9px] font-bold cursor-pointer transition-colors"
                                      >
                                        Book In-Clinic Here
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Wait: ~{doc.estWaitMinutes} mins</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDoctor(doc);
                                  setConsultType('scheduled_video');
                                  setActiveSectionView('booking');
                                }}
                                className="px-2 py-0.8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 text-[10px] transition-colors cursor-pointer"
                                title="Schedule on calendar"
                              >
                                Calendar
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDoctor(doc);
                                  setConsultType('urgent_video');
                                  setActiveSectionView('booking');
                                  handleLaunchUrgentVideo();
                                }}
                                className="px-2 py-0.8 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40 text-[10px] transition-colors cursor-pointer"
                              >
                                Connect Now
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Find In-Person Clinic Search */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Partner Dermatology Clinics</span>
              </h3>

              {onNavigateToMap && (
                <button
                  type="button"
                  onClick={onNavigateToMap}
                  className="text-xs text-cyan-400 hover:underline font-mono flex items-center gap-1 cursor-pointer"
                >
                  <span>Full US Map</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filteredInClinicList.slice(0, 4).map((clinic) => (
                <div
                  key={clinic.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{clinic.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{clinic.city}, {clinic.state} • {clinic.phone}</span>
                    </div>
                  </div>

                  <a
                    href={`tel:${clinic.phone.replace(/[^0-9]/g, '')}`}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-emerald-400 shrink-0"
                    title={`Call ${clinic.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency & Red Flag Warnings */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>When to Seek Immediate Emergency (ER) Care</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              If you experience facial swelling, difficulty breathing, high fever with rapidly spreading purple/black lesions, or excruciating pain, do not wait for a telehealth consultation—call <strong>911</strong> or visit the nearest Emergency Room immediately.
            </p>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Simulated Live Teledermatology Video Consultation Room Modal (Urgent Video Visit) */}
      {isVideoRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-4xl bg-[#090d16] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Room Header */}
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Encrypted Clinical Teledermatology Room</span>
                    <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      ID: {consultationRefNumber || 'CD-URGENT-841'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Direct Patient Intake: {patientName} • State: {patientState}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVideoRoomOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Room Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {roomStage === 'connecting' ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin flex items-center justify-center" />
                    <Stethoscope className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">
                      Connecting you with {selectedDoctor.name}, {selectedDoctor.credentials}...
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Doctor is reviewing your ChronoDerm photo scan, optical biomarkers, and symptoms. Stand by...
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-cyan-300 max-w-sm w-full space-y-1 text-left">
                    <div>✓ HIPAA Video Session Initialized</div>
                    <div>✓ ChronoDerm Photo Packet Attached</div>
                    <div>✓ Triage Priority: URGENT FLARE</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in">
                  {/* Active Video Streams Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Physician Stream (8 cols) */}
                    <div className="md:col-span-8 relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl flex items-center justify-center">
                      <img
                        src={selectedDoctor.avatarUrl}
                        alt={selectedDoctor.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{selectedDoctor.name}, {selectedDoctor.credentials} (Live)</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200">
                        <p className="font-sans italic">
                          "Hello {patientName}, I have reviewed your ChronoDerm checkpoint. Given the high erythema and active flare, I am issuing a prescription for topical barrier stabilization and oral anti-inflammatory therapy."
                        </p>
                      </div>
                    </div>

                    {/* Patient Self-View Stream + Telemetry (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-3">
                      <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                        {referralContext?.frame ? (
                          <img
                            src={referralContext.frame.imageUrl}
                            alt="Your scan"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-400 text-xs font-mono text-center p-4">
                            Patient Frontal Camera Feed
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                          You ({patientName})
                        </div>
                      </div>

                      {/* Clinical Telemetry Card */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                          Shared Scan Biomarkers
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Erythema Index:</span>
                          <span className="font-bold text-rose-400">
                            {referralContext?.frame?.erythemaIndex || 74} / 100
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Inflammation Area:</span>
                          <span className="font-bold text-cyan-300">
                            {referralContext?.frame?.inflammationAreaMm2 || 380} mm²
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Diagnostic Match:</span>
                          <span className="font-bold text-emerald-400">
                            {referralContext?.conditionName || 'Atopic Dermatitis Flare'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Physician Prescription & Action Output */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                        <Pill className="w-4 h-4 text-emerald-400" />
                        <span>e-Prescription &amp; Clinical Orders Dispatched</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Rx Sent to Designated Pharmacy
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="font-bold text-white">1. Tacrolimus Ointment 0.1%</div>
                        <p className="text-slate-300 text-[11px]">
                          Apply thin layer twice daily to affected lesion area for 14 days. Avoid direct sun exposure immediately after applying.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="font-bold text-white">2. Medical-Grade Ceramide Barrier Cream</div>
                        <p className="text-slate-300 text-[11px]">
                          Apply liberally within 3 minutes of lukewarm bathing to lock in stratum corneum moisture.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Controls Bar */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isMicMuted
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isVideoOff
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsVideoRoomOpen(false)}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
                >
                  End Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Phone,
  Globe,
  Star,
  ExternalLink,
  Filter,
  CheckCircle,
  Video,
  Navigation,
  Sparkles,
  Stethoscope,
  Building2,
  Calendar,
  Send,
  UserCheck,
  X,
  Check,
  Share2,
  ChevronRight,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Bot,
  AlertCircle,
  FileText,
  CheckCircle2,
  MessageSquare,
  Compass
} from 'lucide-react';
import { DermatologyClinic, ClinicalCase, ClinicReferral } from '../types';
import { fetchClinics } from '../services/aiService';

interface UsDermatologyMapProps {
  onAskChatbot?: (clinicName: string) => void;
  cases?: ClinicalCase[];
  activeCase?: ClinicalCase | null;
  currentRole?: 'patient' | 'hcp';
  referrals?: ClinicReferral[];
  onReferClinicToPatient?: (referral: ClinicReferral) => void;
  onBackToSlider?: () => void;
  onNavigateToBooking?: (clinic: DermatologyClinic) => void;
}

const PRIMARY_SPECIALTY_CHIPS = [
  { id: 'ALL', label: 'All Specialties' },
  { id: 'Biologic', label: 'Biologic Therapies' },
  { id: 'Eczema', label: 'Atopic Eczema' },
  { id: 'Psoriasis', label: 'Psoriasis & Phototherapy' },
  { id: 'Acne', label: 'Acne & Rosacea' },
  { id: 'Mohs', label: 'Mohs & Skin Surgery' },
  { id: 'Pediatric', label: 'Pediatric Dermatology' },
  { id: 'Complex', label: 'Complex Medical' },
];

export const UsDermatologyMap: React.FC<UsDermatologyMapProps> = ({
  onAskChatbot,
  cases = [],
  activeCase,
  currentRole = 'hcp',
  referrals: externalReferrals,
  onReferClinicToPatient,
  onBackToSlider,
  onNavigateToBooking,
}) => {
  const isPatient = currentRole === 'patient';
  const isHcp = currentRole === 'hcp';

  const [clinics, setClinics] = useState<DermatologyClinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<DermatologyClinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<DermatologyClinic | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active referral tab index for patient if multiple exist
  const [activeReferralIdx, setActiveReferralIdx] = useState<number>(0);

  // HCP Referral Modal State
  const [clinicToRefer, setClinicToRefer] = useState<DermatologyClinic | null>(null);
  const [referralPatientId, setReferralPatientId] = useState<string>(activeCase?.id || 'case-atopic-dermatitis');
  const [customPatientName, setCustomPatientName] = useState<string>('');
  const [customPatientContact, setCustomPatientContact] = useState<string>('');
  const [referralReason, setReferralReason] = useState<string>('Specialized Biologic Evaluation & Administration');
  const [referralPriority, setReferralPriority] = useState<'routine' | 'expedited_flare' | 'urgent'>('expedited_flare');
  const [referralNotes, setReferralNotes] = useState<string>('');
  const [isReferSubmitting, setIsReferSubmitting] = useState<boolean>(false);
  const [referralSuccessNotice, setReferralSuccessNotice] = useState<string | null>(null);

  // Patient Contact Clinic Modal State
  const [contactModalClinic, setContactModalClinic] = useState<DermatologyClinic | null>(null);
  const [contactReferralAttached, setContactReferralAttached] = useState<ClinicReferral | null>(null);
  const [patientContactName, setPatientContactName] = useState<string>('Alex Morgan');
  const [patientContactPhone, setPatientContactPhone] = useState<string>('(555) 019-2834');
  const [patientContactEmail, setPatientContactEmail] = useState<string>('alex.morgan@example.com');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'phone' | 'email' | 'sms'>('phone');
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<'morning' | 'afternoon' | 'anytime'>('morning');
  const [contactReason, setContactReason] = useState<string>('Consultation & Biologic Step-Therapy');
  const [contactPatientNote, setContactPatientNote] = useState<string>('');
  const [isContactSubmitting, setIsContactSubmitting] = useState<boolean>(false);
  const [contactSuccessMessage, setContactSuccessMessage] = useState<string | null>(null);

  // Local/synced referrals state with fallback
  const [internalReferrals, setInternalReferrals] = useState<ClinicReferral[]>(() => {
    try {
      const saved = localStorage.getItem('chronoderm_clinic_referrals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Default initial clinical referral from Dr. Rachel Nazarian for Alex Morgan
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

  const activeReferrals = externalReferrals || internalReferrals;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Available US States computed dynamically from active clinics
  const availableStates = useMemo(() => {
    const stateCounts: Record<string, number> = {};
    clinics.forEach((c) => {
      stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
    });

    const stateNames: Record<string, string> = {
      AL: 'Alabama',
      AK: 'Alaska',
      AZ: 'Arizona',
      CA: 'California',
      CO: 'Colorado',
      CT: 'Connecticut',
      DC: 'Washington D.C.',
      FL: 'Florida',
      GA: 'Georgia',
      HI: 'Hawaii',
      IL: 'Illinois',
      IN: 'Indiana',
      LA: 'Louisiana',
      MA: 'Massachusetts',
      MD: 'Maryland',
      MI: 'Michigan',
      MN: 'Minnesota',
      MO: 'Missouri',
      NC: 'North Carolina',
      NV: 'Nevada',
      NY: 'New York',
      OH: 'Ohio',
      OR: 'Oregon',
      PA: 'Pennsylvania',
      SC: 'South Carolina',
      TN: 'Tennessee',
      TX: 'Texas',
      UT: 'Utah',
      VA: 'Virginia',
      WA: 'Washington',
      WI: 'Wisconsin',
    };

    const sorted = Object.keys(stateCounts)
      .sort()
      .map((code) => ({
        code,
        name: `${stateNames[code] || code} (${stateCounts[code]})`,
      }));

    return [{ code: 'ALL', name: `All US States (${clinics.length} Clinics)` }, ...sorted];
  }, [clinics]);

  // Compute all unique individual specialties
  const allDiscoveredSpecialties = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((c) => {
      if (Array.isArray(c.specialties)) {
        c.specialties.forEach((s) => set.add(s.trim()));
      }
    });
    return Array.from(set).sort();
  }, [clinics]);

  // Compute live counts per specialty chip
  const specialtyCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: clinics.length };
    PRIMARY_SPECIALTY_CHIPS.forEach((chip) => {
      if (chip.id === 'ALL') return;
      const term = chip.id.toLowerCase();
      counts[chip.id] = clinics.filter((c) =>
        c.specialties && c.specialties.some((s) => (s || '').toLowerCase().includes(term))
      ).length;
    });
    return counts;
  }, [clinics]);

  // Load clinics from server
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchClinics();
        if (mounted) {
          setClinics(data);
          setFilteredClinics(data);
          if (data.length > 0) {
            // If there's an active referral for the patient, select that clinic first!
            const firstRef = activeReferrals[0];
            const matchingClinic = firstRef ? data.find((c) => c.id === firstRef.clinicId) : null;
            setSelectedClinic(matchingClinic || data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching clinics:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter clinics based on state, specialty, and search
  useEffect(() => {
    let result = clinics;

    if (selectedState !== 'ALL') {
      result = result.filter((c) => c.state === selectedState);
    }

    if (selectedSpecialty !== 'ALL') {
      const specFilter = selectedSpecialty.toLowerCase();
      result = result.filter((c) =>
        c.specialties && c.specialties.some((s) => (s || '').toLowerCase().includes(specFilter))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.state || '').toLowerCase().includes(q) ||
          (c.zip || '').includes(q) ||
          (c.physician || '').toLowerCase().includes(q) ||
          (c.specialties && c.specialties.some((s) => (s || '').toLowerCase().includes(q)))
      );
    }

    setFilteredClinics(result);
    if (result.length > 0 && (!selectedClinic || !result.some((c) => c.id === selectedClinic.id))) {
      setSelectedClinic(result[0]);
    }
  }, [searchQuery, selectedState, selectedSpecialty, clinics]);

  // HCP opens Referral Modal
  const handleOpenReferModal = (clinic: DermatologyClinic) => {
    setClinicToRefer(clinic);
    setReferralSuccessNotice(null);
    const topSpecs = clinic.specialties.slice(0, 3).join(', ');
    setReferralNotes(
      `Referred to ${clinic.name} (${clinic.city}, ${clinic.state}) for dedicated in-person evaluation, biologic step-therapy, and clinical barrier recovery support. Practice specializes in ${topSpecs}.`
    );
    if (clinic.specialties.some((s) => s.toLowerCase().includes('biologic'))) {
      setReferralReason('Specialized Biologic Evaluation & Administration');
    } else if (clinic.specialties.some((s) => s.toLowerCase().includes('phototherapy'))) {
      setReferralReason('Narrowband UVB Phototherapy Referral');
    } else if (clinic.specialties.some((s) => s.toLowerCase().includes('mohs'))) {
      setReferralReason('Mohs Micrographic Surgery & Skin Excision');
    } else {
      setReferralReason('Specialized Dermatologic Second Opinion & In-Person Care');
    }
  };

  // HCP Confirms and dispatches referral
  const handleConfirmReferral = () => {
    if (!clinicToRefer) return;
    setIsReferSubmitting(true);

    let patientName = 'Alex Morgan';
    if (referralPatientId === 'custom') {
      patientName = customPatientName.trim() || 'Patient';
    } else {
      const foundCase = cases.find((c) => c.id === referralPatientId);
      if (foundCase) {
        if (foundCase.patientInitials === 'A.M.') patientName = 'Alex Morgan';
        else if (foundCase.patientInitials === 'S.C.') patientName = 'Sarah Chen';
        else if (foundCase.patientInitials === 'M.V.') patientName = 'Marcus Vance';
        else if (foundCase.patientInitials === 'E.R.') patientName = 'Elena Rostova';
        else patientName = `Patient (${foundCase.patientInitials})`;
      }
    }

    const newReferral: ClinicReferral = {
      id: `REF-${Date.now()}`,
      clinicId: clinicToRefer.id,
      clinicName: clinicToRefer.name,
      clinicAddress: clinicToRefer.address,
      clinicPhone: clinicToRefer.phone,
      clinicPhysician: clinicToRefer.physician,
      clinicSpecialties: clinicToRefer.specialties,
      patientId: referralPatientId,
      patientName,
      referringDoctorName: 'Dr. Rachel Nazarian, MD, FAAD',
      priority: referralPriority,
      referralReason,
      notes: referralNotes,
      createdAt: new Date().toISOString(),
      status: 'dispatched',
    };

    const updated = [newReferral, ...internalReferrals.filter((r) => r.clinicId !== newReferral.clinicId)];
    setInternalReferrals(updated);
    try {
      localStorage.setItem('chronoderm_clinic_referrals', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save clinic referral', e);
    }

    if (onReferClinicToPatient) {
      onReferClinicToPatient(newReferral);
    }

    setTimeout(() => {
      setIsReferSubmitting(false);
      setReferralSuccessNotice(`Referral successfully dispatched for ${patientName}! Patient notified with clinic contact details.`);
      setTimeout(() => {
        setReferralSuccessNotice(null);
        setClinicToRefer(null);
      }, 1400);
    }, 600);
  };

  // Patient opens Contact / Inquiry Modal
  const handleOpenContactModal = (clinic: DermatologyClinic, attachedReferral?: ClinicReferral) => {
    setContactModalClinic(clinic);
    setContactReferralAttached(attachedReferral || null);
    setContactSuccessMessage(null);
    if (attachedReferral) {
      setContactReason(attachedReferral.referralReason);
      setContactPatientNote(
        `I have an official referral from ${attachedReferral.referringDoctorName || 'my dermatologist'} for ${attachedReferral.referralReason}. Please contact me to schedule an in-clinic intake.`
      );
    } else {
      setContactReason('Specialized Dermatologic Consultation');
      setContactPatientNote(
        `Interested in scheduling an in-clinic consultation for specialized evaluation and step therapy.`
      );
    }
  };

  // Patient Submits Contact Inquiry
  const handleSubmitContactInquiry = () => {
    if (!contactModalClinic) return;
    setIsContactSubmitting(true);

    setTimeout(() => {
      setIsContactSubmitting(false);
      setContactSuccessMessage(
        `Inquiry successfully transmitted to ${contactModalClinic.name}! The patient coordinator will reach out to ${patientContactPhone} via ${preferredContactMethod.toUpperCase()}.`
      );
      setTimeout(() => {
        setContactSuccessMessage(null);
        setContactModalClinic(null);
      }, 1800);
    }, 700);
  };

  // Patient clicks "Focus on Map" for a referred clinic
  const handleFocusReferredClinic = (referral: ClinicReferral) => {
    const clinic = clinics.find((c) => c.id === referral.clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([clinic.lat, clinic.lng], 14, {
          duration: 1.4,
        });
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Continental US
      const map = L.map(mapContainerRef.current, {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const map = mapInstanceRef.current;
    setTimeout(() => {
      map?.invalidateSize();
    }, 200);

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add markers for filtered clinics
    filteredClinics.forEach((clinic) => {
      const isSelected = selectedClinic?.id === clinic.id;
      const isReferred = activeReferrals.some((r) => r.clinicId === clinic.id);

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 duration-200">
          <div class="w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-cyan-500 shadow-lg shadow-cyan-500/60 ring-4 ring-cyan-300/40 text-slate-950 font-black'
              : isReferred
              ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-300/40 shadow-lg shadow-emerald-500/50'
              : 'bg-slate-900 border-2 border-cyan-400 text-cyan-300 shadow-md shadow-black/60'
          } flex items-center justify-center text-xs font-bold">
            ${
              isReferred
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
            }
          </div>
          <div class="absolute -bottom-1 w-2 h-2 ${
            isSelected ? 'bg-cyan-400' : isReferred ? 'bg-emerald-500' : 'bg-slate-900'
          } rotate-45 border-r border-b ${isReferred ? 'border-emerald-500' : 'border-cyan-400'}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [32, 36],
        iconAnchor: [16, 36],
      });

      const marker = L.marker([clinic.lat, clinic.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedClinic(clinic);
        map.setView([clinic.lat, clinic.lng], Math.max(map.getZoom(), 12), {
          animate: true,
        });
      });

      markersRef.current.set(clinic.id, marker);
    });

    // Auto-fit bounds if clinics are filtered
    if (filteredClinics.length > 0 && selectedState !== 'ALL') {
      const bounds = L.latLngBounds(filteredClinics.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [filteredClinics, selectedClinic, selectedState, activeReferrals]);

  const handleSelectClinic = (clinic: DermatologyClinic) => {
    setSelectedClinic(clinic);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([clinic.lat, clinic.lng], 13, {
        duration: 1.2,
      });
    }
  };

  const currentReferral = activeReferrals[activeReferralIdx] || activeReferrals[0];

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full py-2">
      {/* Top Header Bar (Role-Specific) */}
      <div className="glass-card-glow rounded-2xl p-4 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isPatient ? 'US Dermatology Clinic Locator' : 'Clinic Network Map'}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {isPatient ? 'VERIFIED PRACTICES' : 'PARTNER PRACTICES'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5 text-cyan-400" />
                Coast-to-Coast Specialized Coverage
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPatient
                ? 'Find in-person dermatology centers, filter by clinical specialty, and view dedicated physician referrals.'
                : 'Explore specialized dermatology centers by clinical focus and directly dispatch partner clinic referrals to your patients.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {onBackToSlider && (
            <button
              type="button"
              onClick={onBackToSlider}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to 3D Slider</span>
            </button>
          )}
          {onAskChatbot && (
            <button
              type="button"
              onClick={() => onAskChatbot(selectedClinic ? selectedClinic.name : 'Dermatology Network')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Chatbot</span>
            </button>
          )}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{filteredClinics.length} Active Centers</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NEW SECTION: DOCTOR'S CLINICAL REFERRALS (PATIENT PORTAL VIEW) */}
      {/* ========================================================================= */}
      {isPatient && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-5 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4">
            {/* Referral Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Doctor's Clinical Referrals
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {activeReferrals.length} Active Referral{activeReferrals.length > 1 ? 's' : ''} on File
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your dermatologist has evaluated your longitudinal recovery data and dispatched an official referral to a specialized in-person practice.
                  </p>
                </div>
              </div>

              {/* Multi-referral tabs if more than one */}
              {activeReferrals.length > 1 && (
                <div className="flex items-center gap-1.5 self-start sm:self-center overflow-x-auto">
                  {activeReferrals.map((ref, idx) => (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => setActiveReferralIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        activeReferralIdx === idx
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      Ref #{idx + 1}: {ref.clinicName.split('-')[0].trim()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Referral Body */}
            {currentReferral ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left Column (8 cols): Exact Clinic, Physician & Indication */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-emerald-300 font-bold flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                        Referring Doctor: {currentReferral.referringDoctorName || 'Dr. Rachel Nazarian, MD, FAAD'}
                      </span>

                      <div className="flex items-center gap-2">
                        {currentReferral.priority === 'expedited_flare' ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Expedited Flare Priority (&lt; 48 hrs)
                          </span>
                        ) : currentReferral.priority === 'urgent' ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Urgent Priority
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Routine Specialized Care
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(currentReferral.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Exact Clinic Name & Lead Physician */}
                    <div>
                      <h4 className="text-base font-bold text-white leading-tight">
                        {currentReferral.clinicName}
                      </h4>
                      <p className="text-xs text-cyan-300 font-medium mt-0.5">
                        {currentReferral.clinicPhysician}
                      </p>
                    </div>

                    {/* Address & Contact Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{currentReferral.clinicAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-cyan-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{currentReferral.clinicPhone}</span>
                      </div>
                    </div>

                    {/* Primary Referral Indication */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-400">Clinical Indication:</span>
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        {currentReferral.referralReason}
                      </span>
                    </div>

                    {/* Doctor's Clinical Instructions Note */}
                    {currentReferral.notes && (
                      <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                            Physician Instructions &amp; Clinical Context:
                          </div>
                          <p className="mt-0.5 text-slate-200 leading-relaxed italic">
                            "{currentReferral.notes}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Specialties pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentReferral.clinicSpecialties?.map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300 font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (4 cols): Patient Direct Actions */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Take Action on this Referral</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Reach out to the clinic coordinator to schedule your intake visit, or locate the center on the map below.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Primary Button: Contact Clinic / Send Inquiry */}
                    <button
                      type="button"
                      onClick={() => {
                        const cl = clinics.find((c) => c.id === currentReferral.clinicId) || {
                          id: currentReferral.clinicId,
                          name: currentReferral.clinicName,
                          address: currentReferral.clinicAddress,
                          city: 'New York',
                          state: 'NY',
                          zip: '10022',
                          lat: 40.7602,
                          lng: -73.9712,
                          phone: currentReferral.clinicPhone,
                          physician: currentReferral.clinicPhysician,
                          website: '',
                          rating: 4.9,
                          reviewsCount: 200,
                          specialties: currentReferral.clinicSpecialties,
                          acceptingNewPatients: true,
                          telehealthAvailable: true,
                          notes: '',
                        };
                        handleOpenContactModal(cl, currentReferral);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-950" />
                      <span>Contact Clinic / Request Appointment</span>
                    </button>

                    {/* Direct Call Button */}
                    <a
                      href={`tel:${currentReferral.clinicPhone.replace(/[^0-9]/g, '')}`}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Clinic: {currentReferral.clinicPhone}</span>
                    </a>

                    {/* Focus on Map Button */}
                    <button
                      type="button"
                      onClick={() => handleFocusReferredClinic(currentReferral)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Locate on Map Below</span>
                    </button>

                    {/* Directions */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        currentReferral.clinicName + ' ' + currentReferral.clinicAddress
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Navigation className="w-3 h-3 text-cyan-400" />
                      <span>Get Driving / Transit Directions &rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 text-center text-xs text-slate-400 font-mono">
                No active specialist referrals on file. When your dermatologist refers you to an in-person center for biologic therapy or procedures, details will appear here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCTOR VIEW: DISPATCHED REFERRALS OVERVIEW (HCP PORTAL VIEW) */}
      {/* ========================================================================= */}
      {isHcp && activeReferrals.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Your Dispatched Patient Referrals ({activeReferrals.length})</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              Active in Patient Portal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeReferrals.map((ref) => (
              <div
                key={ref.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white truncate">{ref.patientName}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Dispatched
                  </span>
                </div>
                <div className="text-xs text-cyan-300 font-medium truncate">{ref.clinicName}</div>
                <div className="text-[11px] text-slate-400 truncate">{ref.referralReason}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
                  <span>Priority: {ref.priority.replace('_', ' ').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => handleFocusReferredClinic(ref)}
                    className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    View Marker
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specialty Filter Pills & Search Section */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-3">
        {/* Specialty Filter Chips */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filter Clinics by Specialty:</span>
            </span>
            {selectedSpecialty !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedSpecialty('ALL')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
              >
                Clear Specialty Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {PRIMARY_SPECIALTY_CHIPS.map((chip) => {
              const isSelected = selectedSpecialty === chip.id;
              const count = specialtyCounts[chip.id] || 0;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedSpecialty(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/30 scale-[1.02]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-slate-950/40 text-slate-950'
                        : 'bg-slate-800 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input, State Dropdown & Granular Specialty Dropdown */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinic name, physician, city, or specialty..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* State Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              {availableStates.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Granular Specialty Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">All Specialties:</span>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">All Practice Specialties</option>
              {allDiscoveredSpecialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedState !== 'ALL' || selectedSpecialty !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedState('ALL');
                setSelectedSpecialty('ALL');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono px-2 py-1 underline cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Main Map + Clinic Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
        {/* Interactive Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-800 p-2 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="relative w-full h-[380px] lg:h-full min-h-[440px] rounded-xl overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Overlay Badge */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Interactive Map &bull; Pan &amp; Zoom</span>
            </div>

            {/* Mobile Selected Clinic Card Bar */}
            {selectedClinic && (
              <div className="absolute bottom-3 left-3 right-3 z-20 lg:hidden bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-cyan-500/40 shadow-xl flex items-center justify-between gap-3">
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{selectedClinic.name}</div>
                  <div className="text-[10px] text-cyan-300 truncate">
                    {selectedClinic.city}, {selectedClinic.state} &bull; {selectedClinic.phone}
                  </div>
                </div>

                {isHcp ? (
                  <button
                    type="button"
                    onClick={() => handleOpenReferModal(selectedClinic)}
                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Refer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenContactModal(selectedClinic)}
                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Contact</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Clinic Profile & Partner Network List on Right (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Selected Clinic Feature Detail Card */}
          {selectedClinic && (
            <div className="glass-card-glow rounded-2xl p-5 border border-cyan-500/40 shadow-xl flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      {selectedClinic.state} Practice Center
                    </span>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedClinic.rating}</span>
                      <span className="text-slate-400 text-[10px]">({selectedClinic.reviewsCount})</span>
                    </div>
                    {activeReferrals.some((r) => r.clinicId === selectedClinic.id) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Referred by Doctor
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                    {selectedClinic.name}
                  </h3>
                  <p className="text-xs text-cyan-200 mt-0.5 font-medium flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{selectedClinic.physician}</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div>{selectedClinic.address}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{selectedClinic.notes}</div>
                </div>
              </div>

              {/* Specialties pills */}
              <div className="flex flex-wrap gap-1.5">
                {selectedClinic.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-cyan-200 font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Availability Badges */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                {selectedClinic.acceptingNewPatients && (
                  <div className="flex items-center gap-1 text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3" />
                    <span>Accepting New Patients</span>
                  </div>
                )}
                {selectedClinic.telehealthAvailable && (
                  <div className="flex items-center gap-1 text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-500/30">
                    <Video className="w-3 h-3" />
                    <span>Telehealth Available</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: ROLE SPECIFIC */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                {/* FOR HCP CLINICIAN: Refer to Patient */}
                {isHcp && (
                  <button
                    type="button"
                    onClick={() => handleOpenReferModal(selectedClinic)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Refer this Clinic to Patient</span>
                  </button>
                )}

                {/* FOR PATIENT: Contact Clinic / Request Consultation */}
                {isPatient && (
                  <button
                    type="button"
                    onClick={() => handleOpenContactModal(selectedClinic)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-950" />
                    <span>Contact Clinic / Request Appointment</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedClinic.phone.replace(/[^0-9]/g, '')}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedClinic.phone}</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      selectedClinic.name + ' ' + selectedClinic.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Directions</span>
                  </a>
                </div>

                {onAskChatbot && (
                  <button
                    type="button"
                    onClick={() => onAskChatbot(selectedClinic.name)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask AI Assistant About This Clinic</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Clinic Directory List */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex-1 flex flex-col overflow-hidden max-h-[340px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-400">
              <span>{isPatient ? 'Verified Dermatology Centers' : 'Partner Dermatology Centers'}</span>
              <span className="font-mono text-cyan-400">{filteredClinics.length} locations</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/80 pr-1 mt-2 space-y-1">
              {filteredClinics.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No clinics found matching your criteria.
                </div>
              ) : (
                filteredClinics.map((clinic) => {
                  const isSelected = selectedClinic?.id === clinic.id;
                  const isReferred = activeReferrals.some((r) => r.clinicId === clinic.id);

                  return (
                    <div
                      key={clinic.id}
                      onClick={() => handleSelectClinic(clinic)}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                          : 'hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs leading-snug">
                          {clinic.name}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isReferred && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              Referred
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 shrink-0">
                            {clinic.state}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{clinic.city}, {clinic.state}</span>
                          <span>&bull;</span>
                          <div className="flex items-center gap-1 text-amber-400 font-mono">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{clinic.rating}</span>
                          </div>
                        </div>

                        {/* Button in list item: Role specific */}
                        {isHcp ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReferModal(clinic);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Refer</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenContactModal(clinic);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>Contact</span>
                          </button>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 truncate">
                        {clinic.specialties.slice(0, 3).join(' &bull; ')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PATIENT CONTACT / INQUIRY MODAL */}
      {/* ========================================================================= */}
      {contactModalClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Contact Practice Coordinator
                  </h3>
                  <p className="text-xs text-slate-400">
                    Request an intake consultation, check-in, or callback at {contactModalClinic.name}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setContactModalClinic(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clinic Info Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{contactModalClinic.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {contactModalClinic.state} Center
                </span>
              </div>
              <div className="text-xs text-slate-300">{contactModalClinic.address}</div>
              <div className="text-xs text-emerald-300 flex items-center gap-2">
                <span>{contactModalClinic.physician}</span>
                <span>&bull;</span>
                <span>{contactModalClinic.phone}</span>
              </div>

              {contactReferralAttached && (
                <div className="mt-1 pt-2 border-t border-slate-800 flex items-center gap-2 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Official Referral Attached: {contactReferralAttached.referralReason} from {contactReferralAttached.referringDoctorName || 'Dr. Rachel Nazarian'}
                  </span>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Patient Full Name:</label>
                  <input
                    type="text"
                    value={patientContactName}
                    onChange={(e) => setPatientContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Phone Number:</label>
                  <input
                    type="text"
                    value={patientContactPhone}
                    onChange={(e) => setPatientContactPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Preferred Callback Method:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['phone', 'sms', 'email'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPreferredContactMethod(method)}
                      className={`p-2 rounded-xl border text-center cursor-pointer capitalize font-semibold transition-all ${
                        preferredContactMethod === method
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {method === 'sms' ? 'SMS Text' : method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Preferred Time for Callback:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Morning (9am - 12pm)' },
                    { id: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
                    { id: 'anytime', label: 'First Available' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferredTimeOfDay(t.id as any)}
                      className={`p-2 rounded-xl border text-center cursor-pointer text-[11px] font-medium transition-all ${
                        preferredTimeOfDay === t.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Clinical Reason / Inquiry:</label>
                <input
                  type="text"
                  value={contactReason}
                  onChange={(e) => setContactReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Message / Questions for Clinic:</label>
                <textarea
                  rows={2}
                  value={contactPatientNote}
                  onChange={(e) => setContactPatientNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white resize-none font-sans"
                />
              </div>
            </div>

            {/* Success Notice Banner */}
            {contactSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{contactSuccessMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setContactModalClinic(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isContactSubmitting}
                onClick={handleSubmitContactInquiry}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isContactSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inquiry to Practice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HCP ONLY: REFER CLINIC TO PATIENT MODAL */}
      {/* ========================================================================= */}
      {isHcp && clinicToRefer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Refer Dermatology Center to Patient
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch an official clinical referral with specialized indications &amp; clinic contacts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClinicToRefer(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Clinic Highlight */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{clinicToRefer.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {clinicToRefer.state} Center
                </span>
              </div>
              <div className="text-xs text-slate-300">{clinicToRefer.address}</div>
              <div className="text-xs text-cyan-300 flex items-center gap-2">
                <span>{clinicToRefer.physician}</span>
                <span>&bull;</span>
                <span>{clinicToRefer.phone}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {clinicToRefer.specialties.map((s) => (
                  <span key={s} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Referral Form */}
            <div className="flex flex-col gap-3.5 text-xs">
              {/* Patient Selector */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Select Patient to Receive Referral:
                </label>
                <select
                  value={referralPatientId}
                  onChange={(e) => setReferralPatientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
                >
                  {cases.map((c) => {
                    const name =
                      c.patientInitials === 'A.M.'
                        ? 'Alex Morgan'
                        : c.patientInitials === 'S.C.'
                        ? 'Sarah Chen'
                        : c.patientInitials === 'M.V.'
                        ? 'Marcus Vance'
                        : c.patientInitials === 'E.R.'
                        ? 'Elena Rostova'
                        : `Patient ${c.patientInitials}`;
                    return (
                      <option key={c.id} value={c.id}>
                        {name} ({c.condition})
                      </option>
                    );
                  })}
                  <option value="custom">+ Enter Another Patient Name</option>
                </select>
              </div>

              {referralPatientId === 'custom' && (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Patient Full Name:</label>
                    <input
                      type="text"
                      value={customPatientName}
                      onChange={(e) => setCustomPatientName(e.target.value)}
                      placeholder="e.g. Jordan Miller"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Email / Phone:</label>
                    <input
                      type="text"
                      value={customPatientContact}
                      onChange={(e) => setCustomPatientContact(e.target.value)}
                      placeholder="e.g. jordan@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Specialty Referral Reason */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Primary Clinical Indication / Referral Reason:
                </label>
                <select
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="Specialized Biologic Evaluation & Administration">
                    Specialized Biologic Evaluation &amp; Administration
                  </option>
                  <option value="Narrowband UVB Phototherapy Referral">
                    Narrowband UVB Phototherapy Referral
                  </option>
                  <option value="Refractory Flare / Skin Barrier Recovery">
                    Refractory Flare / Skin Barrier Recovery
                  </option>
                  <option value="Mohs Micrographic Surgery & Skin Excision">
                    Mohs Micrographic Surgery &amp; Skin Excision
                  </option>
                  <option value="Contact Dermatitis & Patch Testing">
                    Contact Dermatitis &amp; Patch Testing
                  </option>
                  <option value="Specialized Dermatologic Second Opinion & In-Person Care">
                    Specialized Dermatologic Second Opinion &amp; In-Person Care
                  </option>
                </select>
              </div>

              {/* Urgency Priority */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Referral Priority:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReferralPriority('routine')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      referralPriority === 'routine'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs">Routine Specialized Care</div>
                    <div className="text-[10px] text-slate-400 font-normal">Standard 2-4 week window</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReferralPriority('expedited_flare')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      referralPriority === 'expedited_flare'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs">Expedited Flare Priority</div>
                    <div className="text-[10px] text-slate-400 font-normal">Immediate review (&lt; 48 hrs)</div>
                  </button>
                </div>
              </div>

              {/* Clinical Notes to Patient */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Physician Note / Clinical Instructions for Patient:
                </label>
                <textarea
                  rows={3}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-sans"
                />
              </div>
            </div>

            {/* Success Notice Banner */}
            {referralSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{referralSuccessNotice}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setClinicToRefer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isReferSubmitting}
                onClick={handleConfirmReferral}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
              >
                {isReferSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching Referral...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Referral to Patient</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

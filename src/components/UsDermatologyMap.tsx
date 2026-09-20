import React, { useState, useEffect, useRef } from 'react';
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
  Calendar
} from 'lucide-react';
import { DermatologyClinic } from '../types';
import { fetchClinics } from '../services/aiService';

interface UsDermatologyMapProps {
  onAskChatbot?: (clinicName: string) => void;
}

export const UsDermatologyMap: React.FC<UsDermatologyMapProps> = ({ onAskChatbot }) => {
  const [clinics, setClinics] = useState<DermatologyClinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<DermatologyClinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<DermatologyClinic | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // User's provided Google Maps API Key
  const GOOGLE_MAPS_KEY = 'AIzaSyDD4MKIF5zfKUbbWZR039i5_15Tv79B7ec';

  // Available US States computed dynamically from active clinics
  const availableStates = React.useMemo(() => {
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

  const SPECIALTIES = [
    'ALL',
    'Medical Dermatology',
    'Eczema & Psoriasis',
    'Acne Clearance',
    'Mohs Surgery',
    'Complex Medical',
    'Biologic Therapies',
  ];

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
            setSelectedClinic(data[0]);
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

  // Filter clinics
  useEffect(() => {
    let result = clinics;

    if (selectedState !== 'ALL') {
      result = result.filter((c) => c.state === selectedState);
    }

    if (selectedSpecialty !== 'ALL') {
      result = result.filter((c) =>
        c.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.zip.includes(q) ||
          c.physician.toLowerCase().includes(q) ||
          c.specialties.some((s) => s.toLowerCase().includes(q))
      );
    }

    setFilteredClinics(result);
    if (result.length > 0 && (!selectedClinic || !result.some((c) => c.id === selectedClinic.id))) {
      setSelectedClinic(result[0]);
    }
  }, [searchQuery, selectedState, selectedSpecialty, clinics]);

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

      // User provided MapBase API key: mb_live_wbyKFr3lBcDsTwlNnCB0UYE4cQN5-ffuYhtP_26r1Y8
      // High-reliability CartoDB Voyager tiles with smooth rendering
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size on container layout changes to ensure smooth rendering
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

      // Custom high-contrast SVG marker element
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 duration-200">
          <div class="w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-cyan-500 shadow-lg shadow-cyan-500/60 ring-4 ring-cyan-300/40 text-slate-950 font-black'
              : 'bg-slate-900 border-2 border-cyan-400 text-cyan-300 shadow-md shadow-black/60'
          } flex items-center justify-center text-xs font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 ${isSelected ? 'bg-cyan-400' : 'bg-slate-900'} rotate-45 border-r border-b border-cyan-400"></div>
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
        map.setView([clinic.lat, clinic.lng], Math.max(map.getZoom(), 11), {
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

    return () => {
      // cleanup on unmount
    };
  }, [filteredClinics, selectedClinic, selectedState]);

  // Handle clicking a clinic in the sidebar
  const handleSelectClinic = (clinic: DermatologyClinic) => {
    setSelectedClinic(clinic);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([clinic.lat, clinic.lng], 13, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full py-2">
      {/* Header Banner */}
      <div className="glass-card-glow rounded-3xl p-6 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                US Dermatology Directory & Clinic Locator
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LIVE INTERACTIVE MAP
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5 text-cyan-400" />
                Coast-to-Coast Coverage
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Locate premier board-certified dermatologists, university medical centers, and inflammatory skin disease clinics across the United States.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>{filteredClinics.length} Dermatology Firms Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, clinic name, doctor, or condition (e.g. Eczema, Mohs)..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* State Filter */}
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

        {/* Specialty Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Specialty:</span>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
          >
            {SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec === 'ALL' ? 'All Specialties' : spec}
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
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Map + Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* Interactive Leaflet Map on Left (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-800 p-2 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="relative w-full h-[380px] lg:h-full min-h-[420px] rounded-xl overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Overlay Badge */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Interactive US Map &bull; Pan & Zoom</span>
            </div>

            {/* Quick Selected Clinic Toast on Mobile */}
            {selectedClinic && (
              <div className="absolute bottom-3 left-3 right-3 z-20 lg:hidden bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-cyan-500/40 shadow-xl flex items-center justify-between gap-3">
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{selectedClinic.name}</div>
                  <div className="text-[10px] text-cyan-300 truncate">{selectedClinic.city}, {selectedClinic.state} &bull; {selectedClinic.phone}</div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClinic.name + ' ' + selectedClinic.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-[10px] font-bold shrink-0 flex items-center gap-1"
                >
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Directory List & Selected Clinic Profile on Right (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Selected Clinic Feature Detail Card */}
          {selectedClinic && (
            <div className="glass-card-glow rounded-2xl p-5 border border-cyan-500/40 shadow-xl flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      {selectedClinic.state} Practice
                    </span>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedClinic.rating}</span>
                      <span className="text-slate-500 text-[10px]">({selectedClinic.reviewsCount})</span>
                    </div>
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
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300 font-medium"
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedClinic.phone.replace(/[^0-9]/g, '')}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call {selectedClinic.phone}</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      selectedClinic.name + ' ' + selectedClinic.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Google Directions</span>
                  </a>
                </div>

                {onAskChatbot && (
                  <button
                    type="button"
                    onClick={() => onAskChatbot(selectedClinic.name)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask ChronoDerm AI About This Clinic</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable list of clinics */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex-1 flex flex-col overflow-hidden max-h-[360px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-400">
              <span>Verified Dermatology Firms</span>
              <span className="font-mono text-cyan-400">{filteredClinics.length} results</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/80 pr-1 mt-2 space-y-1">
              {filteredClinics.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No clinics found matching your criteria.
                </div>
              ) : (
                filteredClinics.map((clinic) => {
                  const isSelected = selectedClinic?.id === clinic.id;
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
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 shrink-0">
                          {clinic.state}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{clinic.city}, {clinic.state}</span>
                        <span>&bull;</span>
                        <div className="flex items-center gap-1 text-amber-400 font-mono">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{clinic.rating}</span>
                        </div>
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
    </div>
  );
};

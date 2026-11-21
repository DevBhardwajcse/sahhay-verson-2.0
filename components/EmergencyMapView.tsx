'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  AlertTriangle,
  Crosshair,
  List,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  PhoneCall,
  Search,
  Share2,
  SlidersHorizontal,
  Stethoscope,
  WifiOff,
  X,
} from 'lucide-react';
import type { EmergencyCategoryId, NormalizedEmergencyPlace } from '@/app/api/maps/nearby/route';
import {
  buildLocationShareMessage,
  loadEmergencyContacts,
  type TrustedEmergencyContact,
} from '@/lib/emergency-contact';
import {
  CATEGORY_OPTIONS,
  DEFAULT_MAP_CENTER,
  RADIUS_OPTIONS,
  SPECIALTY_FILTERS,
  filterAndRankFacilities,
  getPinColor,
  isValidEmergencyCategory,
  type FacilitySortMode,
  type SectorFilterMode,
} from '@/lib/hospital-matcher';
import type { Language } from '@/lib/triage-engine';
import { usePWA } from './PWABootstrap';
import { MapViewportSync, RouteLayer, type RouteMetrics } from './map/MapRouteLayer';
import { BloodBankBanner } from './map/BloodBankBanner';
import { PlaceDetailCard } from './map/PlaceDetailCard';
import { FacilityReportModal, ShareLocationModal } from './map/MapModals';

interface EmergencyMapViewProps {
  language: Language;
  mapsApiKey: string;
  initialCategory?: string;
  initialSpecialtyQuery?: string;
  onOpenOffline: () => void;
}

export function EmergencyMapView({
  language,
  mapsApiKey,
  initialCategory = 'emergency_hospital',
  initialSpecialtyQuery = '',
  onOpenOffline,
}: EmergencyMapViewProps) {
  const { isOnline, reportMapsQuotaExceeded } = usePWA();

  const validInitialCat: EmergencyCategoryId = isValidEmergencyCategory(initialCategory)
    ? initialCategory
    : 'emergency_hospital';

  const [category, setCategory] = useState<EmergencyCategoryId>(validInitialCat);
  const [specialtyQuery, setSpecialtyQuery] = useState<string>(initialSpecialtyQuery);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ ...DEFAULT_MAP_CENTER });
  const [locationLabel, setLocationLabel] = useState<string>(
    'New Delhi (Default — tap Detect Location or search your city/PIN)'
  );
  const [hasExplicitLocation, setHasExplicitLocation] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);

  const [manualQuery, setManualQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [places, setPlaces] = useState<NormalizedEmergencyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NormalizedEmergencyPlace | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  const [sectorFilter, setSectorFilter] = useState<SectorFilterMode>('all');
  const [sortMode, setSortMode] = useState<FacilitySortMode>('best_match');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');

  const [trustedContacts, setTrustedContacts] = useState<TrustedEmergencyContact[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const contacts = loadEmergencyContacts();
    if (contacts.length > 0) {
      queueMicrotask(() => setTrustedContacts(contacts));
    }
  }, []);

  const [prevInitialCategory, setPrevInitialCategory] = useState(initialCategory);
  if (initialCategory !== prevInitialCategory) {
    setPrevInitialCategory(initialCategory);
    if (isValidEmergencyCategory(initialCategory)) {
      setCategory(initialCategory);
    }
  }

  const [prevInitialSpecialty, setPrevInitialSpecialty] = useState(initialSpecialtyQuery);
  if (initialSpecialtyQuery !== prevInitialSpecialty) {
    setPrevInitialSpecialty(initialSpecialtyQuery);
    setSpecialtyQuery(initialSpecialtyQuery);
  }

  const locLat = location.lat;
  const locLng = location.lng;

  useEffect(() => {
    if (!isOnline || !mapsApiKey) return;
    let cancelled = false;
    const controller = new AbortController();

    Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setSearching(true);
          setMapError(null);
        }
        return fetch('/api/maps/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            lat: locLat,
            lng: locLng,
            radiusMeters,
            category,
            specialtyQuery: specialtyQuery.trim() || undefined,
          }),
        });
      })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 429 || data.quotaExceeded) {
          reportMapsQuotaExceeded();
          setMapError(data.error || 'Google Maps Platform demo quota reached.');
          setPlaces([]);
          return;
        }
        if (!res.ok) {
          setMapError(data.error || 'Could not retrieve nearby places.');
          setPlaces([]);
          return;
        }
        setPlaces(data.places || []);
        setSelectedPlace(null);
        setRouteMetrics(null);
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) {
          setMapError(
            'Network error while searching nearby facilities. Check Safety Directory or call 112.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    locLat,
    locLng,
    category,
    specialtyQuery,
    radiusMeters,
    isOnline,
    mapsApiKey,
    reportMapsQuotaExceeded,
  ]);

  const handleDetectCurrentLocation = () => {
    setMapError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMapError(
        language === 'hi'
          ? 'इस डिवाइस में GPS उपलब्ध नहीं है। कृपया नीचे अपना शहर, जिला या पिन कोड दर्ज करें।'
          : 'Browser geolocation is unavailable. Please enter your city, district, or PIN code below.'
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(nextCoords);
        setHasExplicitLocation(true);
        setLocationLabel(
          `Current Location (${nextCoords.lat.toFixed(4)}, ${nextCoords.lng.toFixed(4)})`
        );
        try {
          const revRes = await fetch('/api/maps/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'reverse', lat: nextCoords.lat, lng: nextCoords.lng }),
          });
          if (revRes.status === 429) {
            reportMapsQuotaExceeded();
          } else if (revRes.ok) {
            const revData = await revRes.json();
            if (revData.formattedAddress) {
              setLocationLabel(revData.formattedAddress);
            }
          }
        } catch {
          // keep coordinate label
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setMapError(
          err.code === err.PERMISSION_DENIED
            ? language === 'hi'
              ? 'लोकेशन अनुमति अस्वीकृत हुई। आप नीचे शहर, गांव या पिन कोड लिखकर खोज सकते हैं या मानचित्र पर क्लिक कर सकते हैं।'
              : 'Location permission was declined. Enter your city, village, district, or 6-digit PIN code below, or click anywhere on the map.'
            : 'Could not detect GPS location. Try entering your city or PIN code manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const handleManualGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = manualQuery.trim();
    if (q.length < 2) return;
    setLocating(true);
    setMapError(null);
    try {
      const res = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'forward', query: q }),
      });
      const data = await res.json();
      if (res.status === 429 || data.quotaExceeded) {
        reportMapsQuotaExceeded();
        setMapError('Google Maps geocoding quota reached.');
        return;
      }
      if (!res.ok) {
        setMapError(data.error || 'Could not locate that place. Try a district name or PIN code.');
        return;
      }
      setLocation({ lat: data.lat, lng: data.lng });
      setHasExplicitLocation(true);
      setLocationLabel(data.formattedAddress || q);
    } catch {
      setMapError('Unable to geocode location right now.');
    } finally {
      setLocating(false);
    }
  };

  const handleRouteMetrics = useCallback((metrics: RouteMetrics | null) => {
    setRouteMetrics(metrics);
  }, []);

  const sharePayload = buildLocationShareMessage(
    location.lat,
    location.lng,
    locationLabel,
    language
  );

  const nextExpandedRadius = RADIUS_OPTIONS.find((r) => r.meters > radiusMeters)?.meters || null;

  const displayedPlaces = useMemo(
    () => filterAndRankFacilities(places, { sectorFilter, sortMode }),
    [places, sectorFilter, sortMode]
  );

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      {/* Control Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {language === 'hi'
                ? 'लाइव अस्पताल एवं आपातकालीन संसाधन मानचित्र'
                : 'Live Hospital & Emergency Resource Navigator'}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {language === 'hi'
                ? 'लाइव Google Maps Platform द्वारा संचालित। अपनी लोकेशन चुनें, विशेषज्ञता के अनुसार सही अस्पताल खोजें और ट्रैफिक-आधारित मार्ग देखें।'
                : 'Live Google Maps Platform discovery with specialty matching, traffic-aware routing, and optional location sharing.'}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-nowrap">
            <button
              type="button"
              disabled={locating}
              onClick={handleDetectCurrentLocation}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Crosshair className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {language === 'hi' ? 'मेरी वर्तमान लोकेशन खोजें' : 'Detect My Current Location'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              <Share2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>{language === 'hi' ? 'लोकेशन साझा करें' : 'Share Location'}</span>
            </button>

            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-red-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-red-700"
            >
              <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
              <span>112</span>
            </a>
          </div>
        </div>

        {/* Manual City / PIN Search + Radius + View Switcher */}
        <div className="mt-4 grid gap-3 lg:grid-cols-12 lg:items-center">
          <form onSubmit={handleManualGeocode} className="flex items-center gap-2 lg:col-span-6">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                aria-label="Enter city, village, district, or PIN code"
                placeholder={
                  language === 'hi'
                    ? 'शहर, गांव, जिला या 6-अंकीय पिन कोड दर्ज करें...'
                    : 'Enter city, village, district, or 6-digit PIN code...'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={locating || manualQuery.trim().length < 2}
              className="shrink-0 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {language === 'hi' ? 'खोजें' : 'Set Area'}
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 lg:col-span-6 lg:justify-end">
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.meters}
                  type="button"
                  onClick={() => setRadiusMeters(r.meters)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums transition ${
                    radiusMeters === r.meters
                      ? 'bg-teal-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  { id: 'split', label: 'Split', icon: MapIcon },
                  { id: 'map', label: 'Map', icon: MapPin },
                  { id: 'list', label: 'List', icon: List },
                ] as const
              ).map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setViewMode(v.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      viewMode === v.id
                        ? 'bg-white text-teal-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Search Location Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />
            <span className="font-medium text-slate-800">{locationLabel}</span>
            {!hasExplicitLocation && (
              <span className="text-[11px] text-slate-500">(Click map to move pin)</span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            {displayedPlaces.length} {language === 'hi' ? 'संसाधन मिले' : 'facilities matched'}
          </span>
        </div>

        {/* Smart Hospital Matcher: Specialty + Sector + Match Ranking */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Stethoscope className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
            <span>{language === 'hi' ? 'स्मार्ट अस्पताल मैचर:' : 'Smart Hospital Matcher:'}</span>
          </div>
          <select
            aria-label="Filter by medical specialty"
            value={
              SPECIALTY_FILTERS.some((s) => s.query === specialtyQuery)
                ? specialtyQuery
                : '__custom__'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val !== '__custom__') setSpecialtyQuery(val);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none"
          >
            {SPECIALTY_FILTERS.map((sf) => (
              <option key={sf.query || 'all'} value={sf.query}>
                {language === 'hi' ? sf.hi : sf.en}
              </option>
            ))}
            {specialtyQuery && !SPECIALTY_FILTERS.some((s) => s.query === specialtyQuery) && (
              <option value="__custom__">AI Recommended: {specialtyQuery}</option>
            )}
          </select>

          <select
            aria-label="Filter by hospital sector"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value as SectorFilterMode)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none"
          >
            <option value="all">
              {language === 'hi' ? 'सभी सेक्टर (सरकारी + निजी)' : 'All Sectors (Public + Private)'}
            </option>
            <option value="public_named">
              {language === 'hi' ? 'सरकारी / सार्वजनिक नामित' : 'Public / Govt. Named Only'}
            </option>
            <option value="other">
              {language === 'hi' ? 'निजी / सामान्य सूचीबद्ध' : 'Private / General Listed'}
            </option>
          </select>

          <div className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <select
              aria-label="Rank matched facilities"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as FacilitySortMode)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none"
            >
              <option value="best_match">
                {language === 'hi' ? 'क्रम: स्मार्ट क्लिनिकल मैच' : 'Rank: Best Clinical Match'}
              </option>
              <option value="distance">
                {language === 'hi' ? 'क्रम: सबसे नजदीक' : 'Rank: Closest Distance'}
              </option>
              <option value="open_first">
                {language === 'hi' ? 'क्रम: अभी खुला पहले' : 'Rank: Listed Open First'}
              </option>
            </select>
          </div>

          {(specialtyQuery || sectorFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSpecialtyQuery('');
                setSectorFilter('all');
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100"
            >
              <span>{language === 'hi' ? 'फ़िल्टर रीसेट' : 'Reset filters'}</span>
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* All Emergency Resource Category Filter Buttons */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setCategory(opt.id);
                setSpecialtyQuery('');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                category === opt.id && !specialtyQuery
                  ? opt.id === 'blood_bank'
                    ? 'bg-rose-700 text-white'
                    : 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {language === 'hi' ? opt.hi : opt.en}
            </button>
          ))}
        </div>

        {category === 'blood_bank' && (
          <BloodBankBanner
            language={language}
            selectedBloodGroup={selectedBloodGroup}
            onSelectBloodGroup={setSelectedBloodGroup}
          />
        )}
      </div>

      {/* Offline or Unconfigured Maps Guard */}
      {(!isOnline || !mapsApiKey) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-950">
          <div className="flex items-start gap-2.5">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <div className="font-bold">
                {!isOnline
                  ? 'Live Google Maps is unavailable offline'
                  : 'Google Maps Platform API key is not active in this runtime'}
              </div>
              <p className="mt-0.5">
                Use the Offline Assistance Centre for independently sourced Government of India
                public hospitals, or dial 112 / 102 immediately for emergencies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenOffline}
            className="rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900"
          >
            Open Offline Assistance Centre
          </button>
        </div>
      )}

      {mapError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>{mapError}</span>
          </div>
          <button
            type="button"
            onClick={onOpenOffline}
            className="font-bold text-amber-900 underline"
          >
            Offline Hospitals
          </button>
        </div>
      )}

      {/* Synchronized Map + Results List */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-12">
        {viewMode !== 'list' && mapsApiKey && isOnline && (
          <div
            className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white ${
              viewMode === 'map' ? 'lg:col-span-12' : 'lg:col-span-7'
            }`}
          >
            <div className="relative h-[460px] w-full lg:h-[560px]">
              <button
                type="button"
                onClick={() => setRecenterSignal((n) => n + 1)}
                aria-label="Recenter map on my selected location"
                className="absolute right-3 bottom-6 z-10 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-xs hover:bg-slate-50"
              >
                <LocateFixed className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>{language === 'hi' ? 'पुनः केंद्रित करें' : 'Recenter'}</span>
              </button>

              <APIProvider
                apiKey={mapsApiKey}
                language={language === 'hi' ? 'hi' : 'en'}
                region="IN"
              >
                <GoogleMap
                  defaultCenter={location}
                  defaultZoom={13}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  gestureHandling="greedy"
                  onClick={(ev) => {
                    const latLng = ev.detail.latLng;
                    if (latLng) {
                      setLocation({ lat: latLng.lat, lng: latLng.lng });
                      setHasExplicitLocation(true);
                      setLocationLabel(
                        `Pinned Location (${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)})`
                      );
                    }
                  }}
                >
                  <MapViewportSync center={location} recenterSignal={recenterSignal} />

                  <AdvancedMarker position={location} title="Search Origin">
                    <Pin background="#0F172A" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
                  </AdvancedMarker>

                  {displayedPlaces.map((place) => (
                    <AdvancedMarker
                      key={place.id}
                      position={{ lat: place.lat, lng: place.lng }}
                      title={place.name}
                      onClick={() => setSelectedPlace(place)}
                    >
                      <Pin
                        background={getPinColor(place.category)}
                        borderColor="#FFFFFF"
                        glyphColor="#FFFFFF"
                      />
                    </AdvancedMarker>
                  ))}

                  {selectedPlace && (
                    <InfoWindow
                      position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                      onCloseClick={() => {
                        setSelectedPlace(null);
                        setRouteMetrics(null);
                      }}
                    >
                      <div className="max-w-[230px] space-y-1 p-0.5 text-xs text-slate-900">
                        <div className="font-bold">{selectedPlace.name}</div>
                        <div className="text-[11px] text-teal-800">
                          {selectedPlace.categoryLabel}
                        </div>
                        <div className="text-[11px] text-slate-600">{selectedPlace.address}</div>
                        <div className="text-[11px] font-semibold text-slate-700 tabular-nums">
                          {routeMetrics
                            ? `${routeMetrics.distanceText} · ${routeMetrics.durationText}`
                            : `~${selectedPlace.straightLineKm} km (straight-line approx.)`}
                        </div>
                      </div>
                    </InfoWindow>
                  )}

                  <RouteLayer
                    origin={location}
                    destination={
                      selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : null
                    }
                    onMetrics={handleRouteMetrics}
                  />
                </GoogleMap>
              </APIProvider>
            </div>
          </div>
        )}

        {viewMode !== 'map' && (
          <div
            className={`min-w-0 space-y-4 ${
              viewMode === 'list' || !mapsApiKey || !isOnline ? 'lg:col-span-12' : 'lg:col-span-5'
            }`}
          >
            {selectedPlace && (
              <PlaceDetailCard
                key={selectedPlace.id}
                language={language}
                place={selectedPlace}
                routeMetrics={routeMetrics}
                onClose={() => {
                  setSelectedPlace(null);
                  setRouteMetrics(null);
                }}
                onReportIssue={() => setShowReportModal(true)}
              />
            )}

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-xs font-bold text-slate-900">
                  {language === 'hi' ? 'नजदीकी सुविधाएं' : 'Nearby Facilities'}
                </span>
                {searching && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-teal-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Searching...
                  </span>
                )}
              </div>

              <div className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto">
                {displayedPlaces.length === 0 && !searching ? (
                  <div className="p-6 text-center text-xs text-slate-600">
                    <p>
                      {sectorFilter !== 'all' && places.length > 0
                        ? language === 'hi'
                          ? 'चुने गए सेक्टर फ़िल्टर से कोई सुविधा मेल नहीं खाई। सभी सेक्टर दिखाने के लिए फ़िल्टर रीसेट करें।'
                          : 'No facilities match the selected Public/Private sector filter. Show all sectors to view nearby results.'
                        : language === 'hi'
                          ? `चुने गए ${radiusMeters / 1000} किमी दायरे में कोई परिणाम नहीं मिला।`
                          : `No facilities returned within ${radiusMeters / 1000} km for this category.`}
                    </p>
                    {sectorFilter !== 'all' && places.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSectorFilter('all')}
                        className="mt-3 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
                      >
                        Show All Sectors ({places.length})
                      </button>
                    ) : (
                      nextExpandedRadius && (
                        <button
                          type="button"
                          onClick={() => setRadiusMeters(nextExpandedRadius)}
                          className="mt-3 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
                        >
                          Expand Search Radius to {nextExpandedRadius / 1000} km
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  displayedPlaces.map((place) => {
                    const isSelected = selectedPlace?.id === place.id;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => setSelectedPlace(place)}
                        className={`flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition ${
                          isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {place.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-teal-800">
                            <span>{place.categoryLabel}</span>
                            {place.openNowKnown === true && (
                              <span className="font-semibold text-emerald-700">· Listed Open</span>
                            )}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                            {place.address}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                            ~{place.straightLineKm} km
                          </div>
                          <div className="text-[10px] text-slate-500">straight-line</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareLocationModal
          language={language}
          locationLabel={locationLabel}
          sharePayload={sharePayload}
          trustedContacts={trustedContacts}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showReportModal && selectedPlace && (
        <FacilityReportModal
          language={language}
          place={selectedPlace}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

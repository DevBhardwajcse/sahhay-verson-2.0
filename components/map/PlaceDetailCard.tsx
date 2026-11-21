'use client';

import React, { useState } from 'react';
import {
  Clock,
  ExternalLink,
  Flag,
  Navigation,
  PhoneCall,
  Route as RouteIcon,
} from 'lucide-react';
import type { NormalizedEmergencyPlace } from '@/app/api/maps/nearby/route';
import type { Language } from '@/lib/triage-engine';
import type { RouteMetrics } from './MapRouteLayer';

interface PlaceDetailCardProps {
  language: Language;
  place: NormalizedEmergencyPlace;
  routeMetrics: RouteMetrics | null;
  onClose: () => void;
  onReportIssue: () => void;
}

export function PlaceDetailCard({
  language,
  place,
  routeMetrics,
  onClose,
  onReportIssue,
}: PlaceDetailCardProps) {
  const [showFullHours, setShowFullHours] = useState(false);

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold text-teal-800 uppercase">{place.categoryLabel}</div>
          <h2 className="mt-0.5 text-sm font-extrabold text-slate-900">{place.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
        >
          Close
        </button>
      </div>

      <p className="mt-1.5 text-slate-700">{place.address}</p>

      <div className="mt-2.5 space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 tabular-nums">
          <RouteIcon className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
          <span>
            {routeMetrics
              ? `${routeMetrics.distanceText} (${routeMetrics.durationText})`
              : `Approx. ${place.straightLineKm} km straight-line distance`}
          </span>
        </div>
        {routeMetrics && routeMetrics.alternatives.length > 0 && (
          <div className="text-[11px] text-slate-600 tabular-nums">
            <strong>Alternative routes:</strong>{' '}
            {routeMetrics.alternatives
              .map((a) => `${a.distanceText} (${a.durationText})`)
              .join(' · ')}
          </div>
        )}
        {place.businessStatus && (
          <div className="text-[11px] text-slate-600">
            <strong>Status:</strong>{' '}
            <span className="font-mono text-[10px] uppercase">
              {place.businessStatus.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        <div className="text-[11px] text-slate-600">
          <strong>Ownership:</strong> {place.ownershipLabel}
        </div>
        <div className="text-[11px] text-slate-600">
          <strong>Hours:</strong>{' '}
          {place.openNowKnown === true
            ? 'Listed as currently open on Google Maps (confirm by calling)'
            : place.openNowKnown === false
              ? 'Listed as closed on Google Maps (confirm emergency desk by calling)'
              : 'Operating hours not confirmed — verify directly with facility'}
        </div>
        {place.openingHoursFull && place.openingHoursFull.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowFullHours((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:underline"
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{showFullHours ? 'Hide weekly hours' : 'View weekly hours'}</span>
            </button>
            {showFullHours && (
              <ul className="mt-1 space-y-0.5 pl-4 text-[11px] text-slate-600">
                {place.openingHoursFull.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="text-[11px] text-slate-500">
          Real-time bed availability and specialist presence are not guaranteed by map data.
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {place.phone && (
          <a
            href={`tel:${place.phone.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 font-bold text-white hover:bg-teal-800"
          >
            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{place.phone}</span>
          </a>
        )}
        <a
          href={
            place.googleMapsUri ||
            `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-800 hover:bg-slate-50"
        >
          <Navigation className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
          <span>Open Directions</span>
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={onReportIssue}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Flag className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
          <span>{language === 'hi' ? 'गलत जानकारी रिपोर्ट करें' : 'Report Issue'}</span>
        </button>
      </div>
    </div>
  );
}

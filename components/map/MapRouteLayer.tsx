'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export interface RouteOptionSummary {
  distanceText: string;
  durationText: string;
  isTrafficAware: boolean;
}

export interface RouteMetrics {
  distanceText: string;
  durationText: string;
  isTrafficAware: boolean;
  alternatives: RouteOptionSummary[];
  path: Array<{ lat: number; lng: number }>;
}

/**
 * Computes an actual road route using the modern Google Maps JS Routes Library (`Route.computeRoutes()`)
 * and renders a polyline on the active GoogleMap instance.
 */
export function RouteLayer({
  origin,
  destination,
  onMetrics,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
  onMetrics: (metrics: RouteMetrics | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const mapsLib = useMapsLibrary('maps');
  const polyRef = useRef<google.maps.Polyline | null>(null);

  const originLat = origin.lat;
  const originLng = origin.lng;
  const destLat = destination?.lat ?? null;
  const destLng = destination?.lng ?? null;

  useEffect(() => {
    if (polyRef.current) {
      polyRef.current.setMap(null);
      polyRef.current = null;
    }

    if (destLat === null || destLng === null || !map || !routesLib || !mapsLib) {
      onMetrics(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const RouteClass = (
          routesLib as unknown as {
            Route?: {
              computeRoutes: (req: unknown) => Promise<{
                routes?: Array<{
                  distanceMeters?: number;
                  durationMillis?: number;
                  path?: Array<google.maps.LatLng>;
                }>;
              }>;
            };
          }
        ).Route;

        if (!RouteClass?.computeRoutes) {
          onMetrics(null);
          return;
        }

        let response: {
          routes?: Array<{
            distanceMeters?: number;
            durationMillis?: number;
            path?: Array<google.maps.LatLng>;
          }>;
        } | null = null;
        let isTrafficAware = true;

        try {
          response = await RouteClass.computeRoutes({
            origin: { lat: originLat, lng: originLng },
            destination: { lat: destLat, lng: destLng },
            travelMode: 'DRIVING',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: true,
            fields: ['path', 'distanceMeters', 'durationMillis'],
          });
        } catch {
          isTrafficAware = false;
          response = await RouteClass.computeRoutes({
            origin: { lat: originLat, lng: originLng },
            destination: { lat: destLat, lng: destLng },
            travelMode: 'DRIVING',
            fields: ['path', 'distanceMeters', 'durationMillis'],
          });
        }

        if (cancelled) return;
        const routes = response?.routes ?? [];
        const first = routes[0];
        if (!first) {
          onMetrics(null);
          return;
        }

        const km = first.distanceMeters ? (first.distanceMeters / 1000).toFixed(1) : null;
        const mins = first.durationMillis
          ? Math.max(1, Math.round(first.durationMillis / 60000))
          : null;

        const pathPoints = first.path?.map((pt) => ({ lat: pt.lat(), lng: pt.lng() })) || [];

        if (pathPoints.length > 0 && mapsLib.Polyline) {
          const line = new mapsLib.Polyline({
            path: pathPoints,
            geodesic: true,
            strokeColor: '#0F766E',
            strokeOpacity: 0.92,
            strokeWeight: 4,
            map,
          });
          polyRef.current = line;
        }

        const alternatives: RouteOptionSummary[] = routes.slice(1, 3).map((alt) => ({
          distanceText: alt.distanceMeters
            ? `${(alt.distanceMeters / 1000).toFixed(1)} km`
            : 'Alt route',
          durationText: alt.durationMillis
            ? `~${Math.max(1, Math.round(alt.durationMillis / 60000))} min`
            : 'N/A',
          isTrafficAware,
        }));

        onMetrics({
          distanceText: km ? `${km} km road route` : 'Road route computed',
          durationText: mins
            ? isTrafficAware
              ? `~${mins} min (traffic-aware)`
              : `~${mins} min drive`
            : 'Live estimate unavailable',
          isTrafficAware,
          alternatives,
          path: pathPoints,
        });
      } catch {
        if (!cancelled) onMetrics(null);
      }
    })();

    return () => {
      cancelled = true;
      if (polyRef.current) {
        polyRef.current.setMap(null);
        polyRef.current = null;
      }
    };
  }, [originLat, originLng, destLat, destLng, map, routesLib, mapsLib, onMetrics]);

  return null;
}

/**
 * Keeps the GoogleMap viewport centered smoothly when the user updates their selected coordinates
 * or taps the Recenter button.
 */
export function MapViewportSync({
  center,
  recenterSignal,
}: {
  center: { lat: number; lng: number };
  recenterSignal: number;
}) {
  const map = useMap();
  const centerLat = center.lat;
  const centerLng = center.lng;
  useEffect(() => {
    if (map) {
      map.panTo({ lat: centerLat, lng: centerLng });
    }
  }, [map, centerLat, centerLng, recenterSignal]);
  return null;
}

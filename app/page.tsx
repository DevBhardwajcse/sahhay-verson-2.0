import React from 'react';
import { SahaayShell } from '@/components/SahaayShell';
import type { SahaayTab } from '@/components/HomeDashboard';
import { resolveGoogleMapsApiKey } from '@/lib/maps-key';

export const dynamic = 'force-dynamic';

const VALID_TABS: ReadonlySet<SahaayTab> = new Set([
  'home',
  'assistant',
  'triage',
  'map',
  'helplines',
  'offline',
  'saved',
  'profile',
]);

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Server-resolved runtime key for Google Maps JS APIProvider (never hardcoded in source)
  const mapsApiKey = resolveGoogleMapsApiKey();
  const resolvedParams = searchParams ? await searchParams : {};

  const rawAutostart = Array.isArray(resolvedParams.autostart)
    ? resolvedParams.autostart[0]
    : resolvedParams.autostart;
  const rawTab = Array.isArray(resolvedParams.tab)
    ? resolvedParams.tab[0]
    : resolvedParams.tab;

  const initialTab: SahaayTab =
    rawTab && VALID_TABS.has(rawTab as SahaayTab) ? (rawTab as SahaayTab) : 'home';
  const initialOnboarded = rawAutostart === '1' || Boolean(rawTab && VALID_TABS.has(rawTab as SahaayTab));

  return (
    <SahaayShell
      mapsApiKey={mapsApiKey}
      initialOnboarded={initialOnboarded}
      initialTab={initialTab}
    />
  );
}

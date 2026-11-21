/**
 * Resolves the active Google Maps Platform API key from runtime environment variables.
 * Never hardcodes secrets; ignores placeholder strings and prefers real `AIza...` keys.
 */
export function isLikelyRealGoogleApiKey(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 25) return false;
  if (trimmed === 'MY_GOOGLE_MAPS_API_KEY') return false;
  return trimmed.startsWith('AIza');
}

export function resolveGoogleMapsApiKey(
  env: Record<string, string | undefined> = process.env
): string {
  const candidates = [
    env.GOOGLE_MAPS_API_KEY,
    env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    env.VITE_GOOGLE_MAPS_API_KEY,
    env.GOOGLE_MAPS_PLATFORM_KEY,
    env.NEXT_PUBLIC_GOOGLE_MAPS_PLATFORM_KEY,
  ];

  // First pass: prefer a valid Google Cloud API key (AIza..., length >= 25)
  for (const candidate of candidates) {
    if (isLikelyRealGoogleApiKey(candidate)) {
      return candidate.trim();
    }
  }

  return '';
}

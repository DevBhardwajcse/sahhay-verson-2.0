import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveGoogleMapsApiKey } from '@/lib/maps-key';
import { checkApiRateLimit } from '@/lib/security-utils';

const GeocodeSchema = z.union([
  z.object({
    mode: z.literal('forward'),
    query: z.string().trim().min(2).max(160),
  }),
  z.object({
    mode: z.literal('reverse'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
]);

function getServerMapsKey(): string {
  return resolveGoogleMapsApiKey();
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`maps-geo:${clientIp}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many location lookups. Please wait.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = GeocodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid location query.' }, { status: 400 });
    }

    const apiKey = getServerMapsKey();
    if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY') {
      return NextResponse.json(
        { error: 'Google Maps geocoding is not configured right now.' },
        { status: 503 }
      );
    }

    const url =
      parsed.data.mode === 'forward'
        ? `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            `${parsed.data.query}, India`
          )}&key=${encodeURIComponent(apiKey)}`
        : `https://maps.googleapis.com/maps/api/geocode/json?latlng=${parsed.data.lat},${parsed.data.lng}&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      headers: {
        'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
      },
    });

    if (res.status === 429) {
      return NextResponse.json(
        { quotaExceeded: true, error: 'Google Maps geocoding quota reached.' },
        { status: 429 }
      );
    }

    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    };

    if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'OVER_DAILY_LIMIT') {
      return NextResponse.json(
        { quotaExceeded: true, error: 'Google Maps geocoding quota reached.' },
        { status: 429 }
      );
    }

    const top = data.results?.[0];
    if (!top?.geometry?.location) {
      return NextResponse.json(
        { error: 'Location not found. Try entering a city, district, or 6-digit Indian PIN code.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      formattedAddress: top.formatted_address || 'Selected location',
    });
  } catch {
    return NextResponse.json({ error: 'Location lookup failed. Please try again.' }, { status: 502 });
  }
}

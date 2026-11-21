export interface TrustedEmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
}

const STORAGE_KEY = 'sahaay_emergency_contact';
const MULTI_STORAGE_KEY = 'sahaay_emergency_contacts_v2';

export function loadEmergencyContacts(): TrustedEmergencyContact[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawMulti = window.localStorage.getItem(MULTI_STORAGE_KEY);
    if (rawMulti) {
      const parsed = JSON.parse(rawMulti) as Partial<TrustedEmergencyContact>[];
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c) => Boolean(c?.name && c?.phone))
          .slice(0, 3)
          .map((c, idx) => ({
            id: c.id || `contact-${idx + 1}`,
            name: String(c.name).slice(0, 80),
            relationship: String(c.relationship || '').slice(0, 50),
            phone: String(c.phone).slice(0, 24),
          }));
      }
    }

    // Backward compatibility with single saved contact
    const legacy = loadEmergencyContact();
    return legacy ? [{ ...legacy, id: 'contact-1' }] : [];
  } catch {
    return [];
  }
}

export function saveEmergencyContacts(contacts: TrustedEmergencyContact[]): void {
  if (typeof window === 'undefined') return;
  const cleaned = contacts
    .filter((c) => c.name.trim() && c.phone.trim())
    .slice(0, 3)
    .map((c, idx) => ({
      id: c.id || `contact-${idx + 1}`,
      name: c.name.trim().slice(0, 80),
      relationship: c.relationship.trim().slice(0, 50),
      phone: c.phone.trim().slice(0, 24),
    }));

  if (cleaned.length === 0) {
    window.localStorage.removeItem(MULTI_STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(MULTI_STORAGE_KEY, JSON.stringify(cleaned));
  // Keep legacy primary contact synced
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned[0]));
}

export function loadEmergencyContact(): TrustedEmergencyContact | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TrustedEmergencyContact>;
    if (!parsed.name || !parsed.phone) return null;
    return {
      id: parsed.id || 'contact-1',
      name: String(parsed.name).slice(0, 80),
      relationship: String(parsed.relationship || '').slice(0, 50),
      phone: String(parsed.phone).slice(0, 24),
    };
  } catch {
    return null;
  }
}

export function saveEmergencyContact(contact: TrustedEmergencyContact | null): void {
  if (typeof window === 'undefined') return;
  if (!contact || !contact.name.trim() || !contact.phone.trim()) {
    window.localStorage.removeItem(STORAGE_KEY);
    const existing = loadEmergencyContacts().slice(1);
    saveEmergencyContacts(existing);
    return;
  }
  const normalized: TrustedEmergencyContact = {
    id: contact.id || 'contact-1',
    name: contact.name.trim().slice(0, 80),
    relationship: contact.relationship.trim().slice(0, 50),
    phone: contact.phone.trim().slice(0, 24),
  };
  const rest = loadEmergencyContacts().filter((c) => c.id !== normalized.id);
  saveEmergencyContacts([normalized, ...rest]);
}

export function buildLocationShareMessage(
  lat: number,
  lng: number,
  label: string,
  language: 'en' | 'hi'
): { mapsUrl: string; message: string } {
  const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  const message =
    language === 'hi'
      ? `SAHAAY आपातकालीन लोकेशन शेयर: मैं वर्तमान में यहाँ हूँ (${label})। Google Maps लिंक: ${mapsUrl}`
      : `SAHAAY Emergency Location Share: My current location (${label}). Google Maps pin: ${mapsUrl}`;
  return { mapsUrl, message };
}

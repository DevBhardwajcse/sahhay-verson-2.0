import React from 'react';
import type { Metadata } from 'next';
import { VerificationPortal } from '@/components/VerificationPortal';

export const metadata: Metadata = {
  title: 'Medical Answer Verification & Clinical Sources — SAHAAY',
  description:
    'Inspect clinician-reviewed medical guidelines, verification dates, evidence tiers, drug interaction rules, and report AI responses for clinical audit.',
};

export default function VerificationPage() {
  return <VerificationPortal />;
}

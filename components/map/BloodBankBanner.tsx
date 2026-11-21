'use client';

import React from 'react';
import { Droplets, ExternalLink, PhoneCall } from 'lucide-react';
import { BLOOD_GROUPS } from '@/lib/hospital-matcher';
import type { Language } from '@/lib/triage-engine';

interface BloodBankBannerProps {
  language: Language;
  selectedBloodGroup: string;
  onSelectBloodGroup: (group: string) => void;
}

export function BloodBankBanner({
  language,
  selectedBloodGroup,
  onSelectBloodGroup,
}: BloodBankBannerProps) {
  return (
    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex items-center gap-1.5 font-bold text-rose-900">
            <Droplets className="h-4 w-4 text-rose-700" aria-hidden="true" />
            <span>
              {language === 'hi'
                ? 'ब्लड बैंक खोजक एवं आधिकारिक रक्त उपलब्धता जांच (e-RaktKosh)'
                : 'Blood Bank Finder & Verified Blood-Group Availability (MoHFW e-RaktKosh)'}
            </span>
          </div>
          <p className="mt-1 leading-relaxed text-rose-900/90">
            {language === 'hi'
              ? 'मानचित्र नीचे नजदीकी ब्लड बैंक और उनके फ़ोन नंबर दिखाता है। लाइव रक्त यूनिट स्टॉक की पुष्टि के लिए सीधे ब्लड बैंक को कॉल करें या भारत सरकार के आधिकारिक e-RaktKosh पोर्टल पर जांचें।'
              : 'Live Google Maps locates nearby blood banks and phone numbers below. Because Google Maps does not carry live blood-unit inventory, call the blood bank directly or check verified real-time blood-group stock on the official Govt. of India MoHFW e-RaktKosh portal.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/stockAvailability.cnt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-800"
          >
            <span>
              {language === 'hi'
                ? `e-RaktKosh (${selectedBloodGroup}) स्टॉक जांचें`
                : `Check ${selectedBloodGroup} on e-RaktKosh`}
            </span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="tel:104"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-900 hover:bg-rose-50"
          >
            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
            <span>104 Health Helpline</span>
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-semibold text-rose-900">
          {language === 'hi' ? 'ब्लड ग्रुप चुनें:' : 'Needed Blood Group:'}
        </span>
        {BLOOD_GROUPS.map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => onSelectBloodGroup(bg)}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold transition ${
              selectedBloodGroup === bg
                ? 'bg-rose-700 text-white'
                : 'border border-rose-200 bg-white text-rose-900 hover:bg-rose-100'
            }`}
          >
            {bg}
          </button>
        ))}
      </div>
    </div>
  );
}

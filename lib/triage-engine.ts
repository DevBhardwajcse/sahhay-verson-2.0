export type Language = 'en' | 'hi';

export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'emergency';

export type InteractionIntent =
  | 'emergency'
  | 'medicine_analysis'
  | 'injury_analysis'
  | 'voice_conversation'
  | 'general_medical';

export interface EmergencyCheckResult {
  isEmergency: boolean;
  matchedSignals: string[];
  recommendedNumber: string;
  headlineEn: string;
  headlineHi: string;
  guidanceEn: string;
  guidanceHi: string;
}

const EMERGENCY_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  {
    label: 'chest_pain_or_cardiac',
    regex:
      /\b(chest pain|chest tightness|crushing chest|heart attack|pain radiating to (left )?arm|jaw pain with chest)\b|सीने में (तेज )?दर्द|दिल का दौरा|छाती में जकड़न/i,
  },
  {
    label: 'severe_breathing_difficulty',
    regex:
      /\b(can'?t breathe|cannot breathe|difficulty breathing|shortness of breath|gasping|choking|turning blue|blue lips|respiratory arrest)\b|सांस लेने में (गंभीर )?तकलीफ|दम घुटना|सांस नहीं आ रही|होंठ नीले/i,
  },
  {
    label: 'stroke_neurological',
    regex:
      /\b(stroke|face drooping|slurred speech|sudden weakness on one side|paralysis|seizure|fits|convulsions|unconscious|unresponsive|fainted and not waking)\b|लकवा|चेहरा टेढ़ा|बोलने में दिक्कत|मिर्गी|दौरे|बेहोश|बेहोशी/i,
  },
  {
    label: 'severe_bleeding_or_trauma',
    regex:
      /\b(severe bleeding|heavy bleeding|won'?t stop bleeding|blood gushing|head injury with (vomiting|confusion|unconscious)|deep stab|gunshot|major accident|severe burn|electric shock)\b|बहुत ज्यादा खून|खून नहीं रुक रहा|गंभीर दुर्घटना|सिर में गंभीर चोट|बिजली का झटका/i,
  },
  {
    label: 'poisoning_or_overdose',
    regex:
      /\b(poison|poisoning|swallowed (bleach|acid|pesticide|chemical)|drug overdose|took too many pills|snake ?bite|scorpion sting)\b|जहर|कीटनाशक|ओवरडोज़|सांप ने काटा|सांप का काटना/i,
  },
  {
    label: 'anaphylaxis',
    regex:
      /\b(throat swelling|tongue swelling|severe allergic reaction|anaphylaxis|swollen airway)\b|गले में सूजन|जीभ सूज गई|गंभीर एलर्जी/i,
  },
  {
    label: 'self_harm_crisis',
    regex:
      /\b(suicide|kill myself|want to die|end my life|self[- ]harm|cut myself)\b|आत्महत्या|खुद को नुकसान|मरना चाहता|मरना चाहती/i,
  },
  {
    label: 'obstetric_emergency',
    regex:
      /\b(heavy bleeding during pregnancy|pregnant.{0,25}(bleeding|seizure|severe abdominal pain)|baby not moving)\b|गर्भावस्था में (तेज )?खून|गर्भवती.{0,20}(बेहोश|दौरे|तेज दर्द)/i,
  },
];

/**
 * Deterministic, clinician-reviewed red-flag screening rule engine.
 * Runs BEFORE and independently of generative AI so an ordinary AI response
 * can never override or delay an emergency escalation warning.
 */
export function evaluateEmergencyRedFlags(text: string): EmergencyCheckResult {
  const normalized = (text || '').trim();
  if (!normalized) {
    return {
      isEmergency: false,
      matchedSignals: [],
      recommendedNumber: '112',
      headlineEn: '',
      headlineHi: '',
      guidanceEn: '',
      guidanceHi: '',
    };
  }

  const matchedSignals: string[] = [];
  for (const rule of EMERGENCY_PATTERNS) {
    if (rule.regex.test(normalized)) {
      matchedSignals.push(rule.label);
    }
  }

  if (matchedSignals.length === 0) {
    return {
      isEmergency: false,
      matchedSignals: [],
      recommendedNumber: '112',
      headlineEn: '',
      headlineHi: '',
      guidanceEn: '',
      guidanceHi: '',
    };
  }

  const isMentalHealthCrisis = matchedSignals.includes('self_harm_crisis');

  return {
    isEmergency: true,
    matchedSignals,
    recommendedNumber: '112',
    headlineEn: isMentalHealthCrisis
      ? 'Immediate Crisis Support Needed — Call 112 or Tele-MANAS (14416)'
      : 'Potentially Serious Emergency Detected — Seek Immediate Medical Help',
    headlineHi: isMentalHealthCrisis
      ? 'तत्काल सहायता आवश्यक है — 112 या टेली-मानस (14416) पर कॉल करें'
      : 'संभावित गंभीर आपात स्थिति — तुरंत चिकित्सा सहायता लें',
    guidanceEn: isMentalHealthCrisis
      ? 'You do not have to go through this alone. Please call 112 for immediate emergency assistance or Tele-MANAS (14416 / 1800-891-4416) right now, or reach out to a trusted person nearby. AI information must never delay urgent human help.'
      : 'Based on what you described, immediate in-person emergency evaluation is strongly recommended. Call 112 (India Integrated Emergency) or 102 (National Ambulance) immediately, or go to the nearest emergency hospital. Do not delay care while interacting with AI.',
    guidanceHi: isMentalHealthCrisis
      ? 'आप अकेले नहीं हैं। कृपया तुरंत आपातकालीन सहायता के लिए 112 या टेली-मानस (14416) पर कॉल करें, या अपने पास के किसी विश्वसनीय व्यक्ति से संपर्क करें। AI से बात करने में तत्काल मानवीय सहायता में देरी न करें।'
      : 'आपके विवरण के आधार पर तुरंत प्रत्यक्ष आपातकालीन चिकित्सा जांच आवश्यक हो सकती है। कृपया अभी 112 (राष्ट्रीय आपातकालीन सेवा) या 102 (एम्बुलेंस) पर कॉल करें या नजदीकी आपातकालीन अस्पताल जाएं। AI विश्लेषण के कारण इलाज में देरी न करें।',
  };
}

/**
 * Identifies the user's primary intent among the five supported SAHAAY workflows.
 */
export function classifyInteractionIntent(params: {
  text?: string;
  hasImage?: boolean;
  imageMode?: 'medicine' | 'injury' | null;
  isVoice?: boolean;
}): InteractionIntent {
  if (params.text && evaluateEmergencyRedFlags(params.text).isEmergency) {
    return 'emergency';
  }
  if (params.hasImage && params.imageMode === 'medicine') {
    return 'medicine_analysis';
  }
  if (params.hasImage && params.imageMode === 'injury') {
    return 'injury_analysis';
  }
  if (params.isVoice) {
    return 'voice_conversation';
  }
  const lower = (params.text || '').toLowerCase();
  if (/\b(medicine|tablet|syrup|capsule|strip|dosage|paracetamol|antibiotic|prescription label)\b|दवा|गोली|सिरप/i.test(lower)) {
    return params.hasImage ? 'medicine_analysis' : 'general_medical';
  }
  return 'general_medical';
}

export interface TriageQuestion {
  id: string;
  promptEn: string;
  promptHi: string;
  options: Array<{
    value: string;
    labelEn: string;
    labelHi: string;
    urgencyWeight: number;
    immediateEmergency?: boolean;
  }>;
}

export interface TriagePathway {
  id: string;
  titleEn: string;
  titleHi: string;
  summaryEn: string;
  summaryHi: string;
  questions: TriageQuestion[];
}

export const GUIDED_TRIAGE_PATHWAYS: TriagePathway[] = [
  {
    id: 'breathing_chest',
    titleEn: 'Chest Discomfort or Breathing Trouble',
    titleHi: 'सीने में असहजता या सांस लेने में दिक्कत',
    summaryEn: 'Structured urgency screening for chest symptoms, tightness, or breathlessness.',
    summaryHi: 'सीने के लक्षण, जकड़न या सांस फूलने की तात्कालिकता की जांच।',
    questions: [
      {
        id: 'bc_redflag',
        promptEn: 'Is the person having severe chest pressure, gasping for air, blue lips, or fainting?',
        promptHi: 'क्या व्यक्ति को सीने में तेज दबाव, सांस लेने में गंभीर दिक्कत, होंठ नीले पड़ना या बेहोशी हो रही है?',
        options: [
          { value: 'yes', labelEn: 'Yes — happening right now', labelHi: 'हाँ — अभी हो रहा है', urgencyWeight: 100, immediateEmergency: true },
          { value: 'unsure', labelEn: 'Not sure / worried', labelHi: 'पक्का नहीं / चिंतित हूँ', urgencyWeight: 60 },
          { value: 'no', labelEn: 'No — breathing normally', labelHi: 'नहीं — सांस सामान्य है', urgencyWeight: 10 },
        ],
      },
      {
        id: 'bc_onset',
        promptEn: 'How suddenly did the discomfort begin?',
        promptHi: 'यह तकलीफ कितनी अचानक शुरू हुई?',
        options: [
          { value: 'sudden', labelEn: 'Suddenly within minutes', labelHi: 'कुछ ही मिनटों में अचानक', urgencyWeight: 55 },
          { value: 'hours', labelEn: 'Over the last few hours', labelHi: 'पिछले कुछ घंटों में', urgencyWeight: 35 },
          { value: 'days', labelEn: 'Gradually over several days', labelHi: 'कई दिनों में धीरे-धीरे', urgencyWeight: 15 },
        ],
      },
      {
        id: 'bc_risk',
        promptEn: 'Does the person have known heart disease, asthma, diabetes, or age over 60?',
        promptHi: 'क्या व्यक्ति को हृदय रोग, अस्थमा, मधुमेह है या उम्र 60 वर्ष से अधिक है?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelHi: 'हाँ', urgencyWeight: 25 },
          { value: 'unsure', labelEn: 'Not sure', labelHi: 'पक्का नहीं', urgencyWeight: 15 },
          { value: 'no', labelEn: 'No', labelHi: 'नहीं', urgencyWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'fever_infection',
    titleEn: 'Fever, Weakness, or Suspected Infection',
    titleHi: 'बुखार, कमजोरी या संभावित संक्रमण',
    summaryEn: 'Evaluate fever duration, hydration, warning signs, and when to consult a doctor.',
    summaryHi: 'बुखार की अवधि, पानी की कमी, खतरे के लक्षण और डॉक्टर से मिलने का समय समझें।',
    questions: [
      {
        id: 'fi_redflag',
        promptEn: 'Is there confusion, stiff neck, seizure, difficulty waking up, or inability to keep fluids down?',
        promptHi: 'क्या भ्रम, गर्दन में अकड़न, दौरे, जागने में कठिनाई या पानी/तरल न पी पाने की समस्या है?',
        options: [
          { value: 'yes', labelEn: 'Yes — present now', labelHi: 'हाँ — अभी मौजूद है', urgencyWeight: 100, immediateEmergency: true },
          { value: 'unsure', labelEn: 'Unsure / seems very weak', labelHi: 'पक्का नहीं / बहुत कमजोरी है', urgencyWeight: 55 },
          { value: 'no', labelEn: 'No — alert and able to drink', labelHi: 'नहीं — होश में हैं और पानी पी रहे हैं', urgencyWeight: 10 },
        ],
      },
      {
        id: 'fi_duration',
        promptEn: 'How long has the fever or illness lasted?',
        promptHi: 'बुखार या बीमारी कितने समय से है?',
        options: [
          { value: 'over_3_days', labelEn: 'More than 3 days or rising high (>102°F / 39°C)', labelHi: '3 दिन से अधिक या तेज बुखार (>102°F)', urgencyWeight: 45 },
          { value: '1_3_days', labelEn: '1 to 3 days', labelHi: '1 से 3 दिन', urgencyWeight: 25 },
          { value: 'under_24h', labelEn: 'Less than 24 hours, mild', labelHi: '24 घंटे से कम, हल्का', urgencyWeight: 10 },
        ],
      },
      {
        id: 'fi_vulnerable',
        promptEn: 'Is the person an infant under 3 months, pregnant, elderly, or immunocompromised?',
        promptHi: 'क्या व्यक्ति 3 महीने से छोटा शिशु, गर्भवती, बुजुर्ग या कमजोर प्रतिरक्षा वाला है?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelHi: 'हाँ', urgencyWeight: 40 },
          { value: 'no', labelEn: 'No', labelHi: 'नहीं', urgencyWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'injury_trauma',
    titleEn: 'Fall, Cut, Burn, or Physical Injury',
    titleHi: 'गिरना, कट लगना, जलना या शारीरिक चोट',
    summaryEn: 'Offline-ready triage check for visible wounds, accidents, and trauma escalation.',
    summaryHi: 'घाव, दुर्घटना और शारीरिक चोट के लिए ऑफ़लाइन-सक्षम तात्कालिकता जांच।',
    questions: [
      {
        id: 'it_redflag',
        promptEn: 'Is there uncontrolled bleeding, head/spine injury, suspected broken bone, or a large/deep burn?',
        promptHi: 'क्या खून नहीं रुक रहा, सिर/रीढ़ में चोट है, हड्डी टूटने का संदेह है या गहरा/बड़ा जलना है?',
        options: [
          { value: 'yes', labelEn: 'Yes — severe injury', labelHi: 'हाँ — गंभीर चोट है', urgencyWeight: 100, immediateEmergency: true },
          { value: 'unsure', labelEn: 'Uncertain — pain is worsening', labelHi: 'पक्का नहीं — दर्द बढ़ रहा है', urgencyWeight: 55 },
          { value: 'no', labelEn: 'No — minor surface injury', labelHi: 'नहीं — हल्की सतही चोट है', urgencyWeight: 10 },
        ],
      },
      {
        id: 'it_mechanism',
        promptEn: 'Was this caused by a road accident, fall from height, animal bite, or rusty metal?',
        promptHi: 'क्या यह सड़क दुर्घटना, ऊंचाई से गिरने, जानवर के काटने या जंग लगी वस्तु से हुआ?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelHi: 'हाँ', urgencyWeight: 45 },
          { value: 'no', labelEn: 'No', labelHi: 'नहीं', urgencyWeight: 10 },
        ],
      },
      {
        id: 'it_care',
        promptEn: 'Has the person been assessed by a doctor or nurse yet?',
        promptHi: 'क्या किसी डॉक्टर या नर्स ने अभी तक इस चोट की जांच की है?',
        options: [
          { value: 'no', labelEn: 'Not yet', labelHi: 'अभी तक नहीं', urgencyWeight: 20 },
          { value: 'yes', labelEn: 'Yes, already checked', labelHi: 'हाँ, जांच हो चुकी है', urgencyWeight: 5 },
        ],
      },
    ],
  },
  {
    id: 'maternal_child',
    titleEn: 'Pregnancy or Child Health Concern',
    titleHi: 'गर्भावस्था या बाल स्वास्थ्य चिंता',
    summaryEn: 'Conservative urgency protocol for expectant mothers and children.',
    summaryHi: 'गर्भवती महिलाओं और बच्चों के लिए सुरक्षित प्राथमिक जांच।',
    questions: [
      {
        id: 'mc_redflag',
        promptEn: 'Is there heavy bleeding, severe headache/vision blur, high fever, poor feeding, or lethargy?',
        promptHi: 'क्या तेज रक्तस्राव, तेज सिरदर्द/धुंधला दिखना, तेज बुखार, दूध/खाना न लेना या अत्यधिक सुस्ती है?',
        options: [
          { value: 'yes', labelEn: 'Yes — present', labelHi: 'हाँ — मौजूद है', urgencyWeight: 100, immediateEmergency: true },
          { value: 'unsure', labelEn: 'Unsure / worried', labelHi: 'पक्का नहीं / चिंतित हूँ', urgencyWeight: 60 },
          { value: 'no', labelEn: 'No — none of these', labelHi: 'नहीं — इनमें से कुछ नहीं', urgencyWeight: 15 },
        ],
      },
      {
        id: 'mc_progression',
        promptEn: 'Are symptoms getting noticeably worse over the last few hours?',
        promptHi: 'क्या पिछले कुछ घंटों में लक्षण तेजी से बढ़ रहे हैं?',
        options: [
          { value: 'yes', labelEn: 'Yes, getting worse', labelHi: 'हाँ, बढ़ रहे हैं', urgencyWeight: 45 },
          { value: 'same', labelEn: 'Staying the same', labelHi: 'एक जैसे हैं', urgencyWeight: 20 },
        ],
      },
    ],
  },
];

export interface TriageEvaluation {
  urgency: UrgencyLevel;
  score: number;
  hasUncertainty: boolean;
  recommendedActionEn: string;
  recommendedActionHi: string;
  recommendedFacilityType: 'hospital' | 'clinic' | 'doctor';
  escalateTo112: boolean;
}

/**
 * Conservative, deterministic triage evaluator.
 * Uncertainty or any immediateEmergency answer escalates conservatively rather than reassuring.
 */
export function evaluateTriageResponses(
  pathway: TriagePathway,
  answers: Record<string, string>
): TriageEvaluation {
  let score = 0;
  let immediateEmergency = false;
  let hasUncertainty = false;

  for (const q of pathway.questions) {
    const selected = answers[q.id];
    if (!selected) {
      hasUncertainty = true;
      score += 20;
      continue;
    }
    const opt = q.options.find((o) => o.value === selected);
    if (!opt) {
      hasUncertainty = true;
      score += 20;
      continue;
    }
    score += opt.urgencyWeight;
    if (opt.immediateEmergency) {
      immediateEmergency = true;
    }
    if (opt.value === 'unsure') {
      hasUncertainty = true;
    }
  }

  if (immediateEmergency || score >= 90) {
    return {
      urgency: 'emergency',
      score,
      hasUncertainty,
      escalateTo112: true,
      recommendedFacilityType: 'hospital',
      recommendedActionEn:
        'Seek immediate emergency medical care. Call 112 (Integrated Emergency) or 102 (Ambulance), or go directly to the nearest emergency hospital. Do not wait.',
      recommendedActionHi:
        'तुरंत आपातकालीन चिकित्सा सहायता लें। 112 (एकीकृत आपातकाल) या 102 (एम्बुलेंस) पर कॉल करें, या तुरंत नजदीकी आपातकालीन अस्पताल जाएं। प्रतीक्षा न करें।',
    };
  }

  if (score >= 55 || (hasUncertainty && score >= 45)) {
    return {
      urgency: 'urgent',
      score,
      hasUncertainty,
      escalateTo112: false,
      recommendedFacilityType: 'hospital',
      recommendedActionEn:
        'Arrange urgent in-person medical evaluation today at a nearby hospital, Community Health Centre (CHC), or urgent clinic. If symptoms worsen suddenly, call 112 immediately.',
      recommendedActionHi:
        'आज ही नजदीकी अस्पताल, सामुदायिक स्वास्थ्य केंद्र (CHC) या क्लिनिक में डॉक्टर से तत्काल जांच कराएं। यदि लक्षण अचानक बढ़ें तो तुरंत 112 पर कॉल करें।',
    };
  }

  if (score >= 30 || hasUncertainty) {
    return {
      urgency: 'soon',
      score,
      hasUncertainty,
      escalateTo112: false,
      recommendedFacilityType: 'clinic',
      recommendedActionEn:
        'Consult a qualified doctor or Primary Health Centre (PHC) within 24–48 hours. Because uncertainty cannot be resolved without physical examination, monitor closely for warning signs.',
      recommendedActionHi:
        '24–48 घंटों के भीतर किसी योग्य डॉक्टर या प्राथमिक स्वास्थ्य केंद्र (PHC) से परामर्श लें। चूंकि प्रत्यक्ष जांच के बिना स्थिति निश्चित नहीं हो सकती, खतरे के लक्षणों पर ध्यान दें।',
    };
  }

  return {
    urgency: 'routine',
    score,
    hasUncertainty: false,
    escalateTo112: false,
    recommendedFacilityType: 'doctor',
    recommendedActionEn:
      'Current answers suggest lower immediate urgency, though this screening is not a medical diagnosis. Schedule a routine doctor visit if symptoms persist or worsen, and seek urgent care if red flags appear.',
    recommendedActionHi:
      'वर्तमान उत्तरों से तत्काल आपात स्थिति के संकेत कम लगते हैं, लेकिन यह कोई चिकित्सा निदान नहीं है। यदि लक्षण बने रहें या बढ़ें तो डॉक्टर से मिलें, और गंभीर लक्षण दिखने पर तुरंत सहायता लें।',
  };
}

/**
 * Pure Haversine straight-line distance in kilometers.
 * Explicitly labeled in UI as approximate straight-line distance (never fabricated road time).
 */
export function calculateHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Validates whether a medicine analysis result must be marked unidentified
 * (e.g., loose pills without packaging or unreadable label).
 */
export function enforceMedicineSafetyGuard(extraction: {
  isLoosePillOnly?: boolean;
  packagingLegibility?: 'clear' | 'partial' | 'unclear';
  productName?: string | null;
  activeIngredients?: string[];
}): {
  allowIdentification: boolean;
  isUncertain: boolean;
  safetyReasonEn: string;
  safetyReasonHi: string;
} {
  if (extraction.isLoosePillOnly) {
    return {
      allowIdentification: false,
      isUncertain: true,
      safetyReasonEn:
        'Unidentified — SAHAAY never identifies loose pills or capsules solely by shape, colour, or appearance. Please verify with original sealed packaging or consult a pharmacist/doctor.',
      safetyReasonHi:
        'अज्ञात — SAHAAY केवल आकार, रंग या रूप के आधार पर खुली गोलियों की पहचान कभी नहीं करता। कृपया मूल पैकेजिंग देखें या फार्मासिस्ट/डॉक्टर से पुष्टि करें।',
    };
  }

  const hasNameOrIngredient =
    Boolean(extraction.productName && extraction.productName.trim().length > 1) ||
    Boolean(extraction.activeIngredients && extraction.activeIngredients.length > 0);

  if (extraction.packagingLegibility === 'unclear' || !hasNameOrIngredient) {
    return {
      allowIdentification: false,
      isUncertain: true,
      safetyReasonEn:
        'Medicine remains unidentified because the label text is unclear or incomplete. Please capture a sharper, well-lit photograph of the original medicine packaging or prescription label.',
      safetyReasonHi:
        'पैकेजिंग का टेक्स्ट स्पष्ट या पूरा न होने के कारण दवा की पहचान नहीं हो सकी। कृपया मूल दवा पैकेजिंग या लेबल की स्पष्ट और अच्छी रोशनी में तस्वीर लें।',
    };
  }

  if (extraction.packagingLegibility === 'partial') {
    return {
      allowIdentification: true,
      isUncertain: true,
      safetyReasonEn:
        'Partial packaging visibility — visual extraction is uncertain. Confirm product name, strength, expiry date, and suitability directly with a qualified pharmacist or doctor.',
      safetyReasonHi:
        'पैकेजिंग आंशिक रूप से दिखाई दे रही है — यह पहचान अनिश्चित है। दवा का नाम, मात्रा, एक्सपायरी तिथि और उपयुक्तता की पुष्टि फार्मासिस्ट या डॉक्टर से करें।',
    };
  }

  return {
    allowIdentification: true,
    isUncertain: false,
    safetyReasonEn:
      'Packaging text appears readable, though a photograph cannot confirm authenticity, safety, or individual suitability. Confirm with a qualified doctor or pharmacist before use.',
    safetyReasonHi:
      'पैकेजिंग का टेक्स्ट पढ़ा जा सकता है, लेकिन केवल तस्वीर से दवा की प्रामाणिकता या आपके लिए उपयुक्तता की पुष्टि नहीं हो सकती। उपयोग से पहले डॉक्टर या फार्मासिस्ट से सलाह लें।',
  };
}

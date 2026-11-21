import type { Language, UrgencyLevel } from './triage-engine';

export type RecommendedFacilityCategory =
  | 'emergency_hospital'
  | 'government_hospital'
  | 'general_hospital'
  | 'phc'
  | 'chc'
  | 'medical_clinic'
  | 'doctor'
  | 'pharmacy';

export interface CuratedClinicalEntry {
  id: string;
  sourceName: string;
  documentTitle: string;
  subject: string;
  publicationDate: string;
  version: string;
  sourceUrl: string;
  reviewStatus: 'Clinician-Reviewed Reference';
  lastVerifiedDate: string;
  keywords: string[];
  summaryEn: string;
  summaryHi: string;
  precautionsEn: string;
  precautionsHi: string;
  recommendedFacilityCategory: RecommendedFacilityCategory;
  recommendedSpecialtyQuery?: string;
  recommendedSpecialtyLabelEn: string;
  recommendedSpecialtyLabelHi: string;
  defaultUrgency: UrgencyLevel;
}

export const CURATED_CLINICAL_KNOWLEDGE_BASE: CuratedClinicalEntry[] = [
  {
    id: 'mohfw-fever-vector',
    sourceName: 'MoHFW India / NVBDCP & WHO Primary Care',
    documentTitle: 'Standard Treatment Guidelines — Acute Febrile Illness, Dengue & Malaria',
    subject: 'Fever, viral infections, dengue, malaria & dehydration red flags',
    publicationDate: '2024-06-15',
    version: 'STG-IN-2024.2',
    sourceUrl: 'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1044&lid=608',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'fever',
      'bukhar',
      'बुखार',
      'dengue',
      'malaria',
      'typhoid',
      'chills',
      'high temperature',
      'body ache',
      'headache',
      'sir dard',
      'सिरदर्द',
    ],
    summaryEn:
      'Persistent fever (>2–3 days), high fever, or fever with rash, severe headache, vomiting, or body ache requires clinical evaluation and blood testing when indicated to differentiate viral illness, dengue, malaria, or bacterial infection. Maintain hydration with fluids/ORS while awaiting medical advice.',
    summaryHi:
      '2–3 दिन से अधिक बुखार, तेज़ बुखार, या चकत्ते, गंभीर सिरदर्द, उल्टी या बदन दर्द के साथ बुखार होने पर डॉक्टर से जांच और आवश्यक रक्त परीक्षण कराना ज़रूरी है। तरल पदार्थ और ORS से हाइड्रेशन बनाए रखें।',
    precautionsEn:
      'Avoid self-medicating with NSAIDs (like ibuprofen or aspirin) if dengue is suspected due to bleeding risk. Seek immediate emergency care for persistent vomiting, abdominal pain, bleeding, drowsiness, or breathing difficulty.',
    precautionsHi:
      'डेंगू की आशंका में बिना डॉक्टर की सलाह इबुप्रोफेन या एस्पिरिन जैसी दर्द निवारक दवाएं न लें। लगातार उल्टी, पेट दर्द, रक्तस्राव या सांस फूलने पर तुरंत आपातकालीन अस्पताल जाएं।',
    recommendedFacilityCategory: 'doctor',
    recommendedSpecialtyQuery: 'general physician fever clinic hospital',
    recommendedSpecialtyLabelEn: 'General Physician / Fever Clinic',
    recommendedSpecialtyLabelHi: 'सामान्य चिकित्सक / बुखार क्लिनिक',
    defaultUrgency: 'soon',
  },
  {
    id: 'who-cardiac-chest',
    sourceName: 'WHO Interagency Integrated Triage & ICMR',
    documentTitle: 'Acute Chest Pain & Cardiovascular Risk Triage Guidance',
    subject: 'Chest discomfort, palpitations, high blood pressure & cardiac evaluation',
    publicationDate: '2024-09-01',
    version: 'WHO-IIT-2024.1',
    sourceUrl: 'https://www.who.int/health-topics/cardiovascular-diseases',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'chest',
      'heart',
      'palpitation',
      'palpitations',
      'blood pressure',
      'bp',
      'hypertension',
      'angina',
      'cardiac',
      'सीने',
      'दिल',
      'रक्तचाप',
    ],
    summaryEn:
      'Chest discomfort, unusual shortness of breath, racing heartbeat, or persistently elevated blood pressure requires prompt physician evaluation, ECG, or cardiac assessment. Never assume chest symptoms are simple acidity without proper clinical check.',
    summaryHi:
      'सीने में बेचैनी, सांस फूलना, धड़कन तेज़ होना या लगातार बढ़ा हुआ रक्तचाप होने पर चिकित्सक से जांच और आवश्यक ईसीजी (ECG) कराना आवश्यक है। सीने की तकलीफ को बिना जांच केवल गैस न मानें।',
    precautionsEn:
      'Any crushing chest pain, pain spreading to jaw/arm/back, sweating, or fainting is a medical emergency — call 112 immediately and do not drive yourself.',
    precautionsHi:
      'सीने में तेज़ जकड़न, बांह/जबड़े में दर्द, पसीना आना या बेहोशी होने पर तुरंत 112 पर कॉल करें और नजदीकी आपातकालीन अस्पताल जाएं।',
    recommendedFacilityCategory: 'emergency_hospital',
    recommendedSpecialtyQuery: 'cardiology heart hospital emergency',
    recommendedSpecialtyLabelEn: 'Cardiology / Heart Care Hospital',
    recommendedSpecialtyLabelHi: 'हृदय रोग (कार्डियोलॉजी) अस्पताल',
    defaultUrgency: 'urgent',
  },
  {
    id: 'who-respiratory-cough',
    sourceName: 'WHO & MoHFW India Respiratory Guidelines',
    documentTitle: 'Acute Respiratory Symptoms, Asthma & Cough Triage Reference',
    subject: 'Cough, cold, asthma, wheezing, sore throat & respiratory care',
    publicationDate: '2024-04-10',
    version: 'WHO-RESP-2024.3',
    sourceUrl: 'https://www.who.int/health-topics/chronic-respiratory-diseases',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'cough',
      'khansi',
      'खांसी',
      'cold',
      'asthma',
      'wheezing',
      'breathing',
      'sore throat',
      'sinus',
      'bronchitis',
      'pneumonia',
      'सांस',
      'जुकाम',
    ],
    summaryEn:
      'Most mild viral upper respiratory infections improve with rest and warm fluids, but cough lasting over 2 weeks, wheezing, chest tightness, or fever with fast breathing requires evaluation by a physician or pulmonologist.',
    summaryHi:
      'हल्का वायरल जुकाम-खांसी आराम और गुनगुने तरल पदार्थ से बेहतर हो सकता है, लेकिन 2 सप्ताह से अधिक खांसी, घरघराहट, सीने में जकड़न या तेज़ सांस चलने पर डॉक्टर से जांच कराएं।',
    precautionsEn:
      'Do not take antibiotics without a prescription. Seek urgent emergency care if lips turn bluish, speaking in full sentences becomes difficult, or breathing rapidly worsens.',
    precautionsHi:
      'बिना डॉक्टर की सलाह एंटीबायोटिक न लें। यदि होंठ नीले पड़ें, पूरे वाक्य बोलने में कठिनाई हो या सांस तेज़ी से बिगड़े तो तुरंत 112 पर कॉल करें।',
    recommendedFacilityCategory: 'medical_clinic',
    recommendedSpecialtyQuery: 'pulmonology chest specialist clinic hospital',
    recommendedSpecialtyLabelEn: 'Pulmonology / Respiratory Clinic',
    recommendedSpecialtyLabelHi: 'श्वसन रोग / चेस्ट क्लिनिक',
    defaultUrgency: 'soon',
  },
  {
    id: 'who-diarrhea-ors',
    sourceName: 'WHO / UNICEF & NHM India',
    documentTitle: 'Diarrhoeal Disease Management & Oral Rehydration (ORS) Guidance',
    subject: 'Diarrhea, vomiting, gastroenteritis, dehydration & ORS preparation',
    publicationDate: '2024-02-20',
    version: 'WHO-ORS-2024.1',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'diarrhea',
      'diarrhoea',
      'loose motion',
      'dehydration',
      'ors',
      'vomiting',
      'stomach',
      'gastric',
      'food poisoning',
      'दस्त',
      'उल्टी',
      'डिहाइड्रेशन',
      'पेट',
    ],
    summaryEn:
      'Preventing dehydration is the main priority in acute diarrhea or vomiting. Standard WHO-formula ORS prepared strictly according to packet directions with clean drinking water helps replace lost fluids and salts.',
    summaryHi:
      'दस्त या उल्टी में निर्जलीकरण (डिहाइड्रेशन) से बचाव सबसे महत्वपूर्ण है। साफ पीने के पानी में पैकेट पर लिखे निर्देश के अनुसार WHO-मानक ORS घोलकर धीरे-धीरे पिएं।',
    precautionsEn:
      'Seek prompt medical care for blood in stool, inability to keep fluids down, very little urine output, sunken eyes, dry mouth, or diarrhea in infants and elderly adults.',
    precautionsHi:
      'मल में खून, तरल पदार्थ न टिकना, पेशाब बहुत कम आना, अत्यधिक कमजोरी या शिशुओं व बुजुर्गों में दस्त होने पर तुरंत डॉक्टर से मिलें।',
    recommendedFacilityCategory: 'phc',
    recommendedSpecialtyQuery: 'primary health centre medical clinic gastroenterology',
    recommendedSpecialtyLabelEn: 'Medical Clinic / PHC',
    recommendedSpecialtyLabelHi: 'मेडिकल क्लिनिक / प्राथमिक स्वास्थ्य केंद्र',
    defaultUrgency: 'soon',
  },
  {
    id: 'nhm-maternal-pediatric',
    sourceName: 'NHM India / MoHFW Maternal & Child Health',
    documentTitle: 'Maternal Danger Signs & Pediatric Care Guidelines',
    subject: 'Pregnancy symptoms, newborn care, child fever & pediatric warning signs',
    publicationDate: '2024-08-12',
    version: 'NHM-MCH-2024.4',
    sourceUrl: 'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=822&lid=218',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'pregnancy',
      'pregnant',
      'maternity',
      'baby',
      'infant',
      'child',
      'toddler',
      'pediatric',
      'newborn',
      'गर्भावस्था',
      'गर्भवती',
      'बच्चा',
      'शिशु',
    ],
    summaryEn:
      'Pregnant individuals and young children have specialized safety requirements; medications that are routine for adults may be unsafe in pregnancy or childhood. Always consult an OB-GYN or pediatrician for dosing and evaluation.',
    summaryHi:
      'गर्भवती महिलाओं और छोटे बच्चों के लिए विशेष चिकित्सकीय देखभाल आवश्यक होती है। वयस्कों की सामान्य दवाएं बच्चों या गर्भावस्था में सुरक्षित न हो सकती हैं; हमेशा स्त्री रोग विशेषज्ञ या बाल रोग विशेषज्ञ से सलाह लें।',
    precautionsEn:
      'Urgent evaluation is mandatory for fever in infants under 3 months, reduced fetal movements, vaginal bleeding, severe headache/blurred vision in pregnancy, or difficulty feeding/breathing in a child.',
    precautionsHi:
      '3 महीने से छोटे शिशु को बुखार, गर्भावस्था में रक्तस्राव, तेज़ सिरदर्द, धुंधला दिखना या बच्चे के दूध न पीने/सांस लेने में कठिनाई पर तुरंत अस्पताल जाएं।',
    recommendedFacilityCategory: 'general_hospital',
    recommendedSpecialtyQuery: 'maternity pediatric hospital',
    recommendedSpecialtyLabelEn: 'Maternity / Pediatric Hospital',
    recommendedSpecialtyLabelHi: 'प्रसूति / बाल रोग अस्पताल',
    defaultUrgency: 'urgent',
  },
  {
    id: 'who-trauma-orthopedic',
    sourceName: 'WHO Basic Emergency Care & ICMR Trauma',
    documentTitle: 'Musculoskeletal Injury, Sprain, Wound & Burn First-Aid Reference',
    subject: 'Sprains, fractures, cuts, wounds, burns, back pain & joint injuries',
    publicationDate: '2024-05-05',
    version: 'WHO-BEC-2024.2',
    sourceUrl: 'https://www.who.int/publications/i/item/basic-emergency-care-approach-to-the-acutely-ill-and-injured',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'injury',
      'fracture',
      'sprain',
      'swelling',
      'ankle',
      'knee',
      'bone',
      'burn',
      'wound',
      'cut',
      'bleeding',
      'back pain',
      'joint',
      'चोट',
      'हड्डी',
      'मोच',
      'जलना',
      'घाव',
    ],
    summaryEn:
      'Visual appearance alone cannot rule out fractures, tendon damage, or deeper infection. Cool minor burns under clean running water (never apply toothpaste, butter, or ice), keep minor cuts clean, and immobilize suspected limb injuries until examined.',
    summaryHi:
      'केवल बाहर से देखकर हड्डी टूटने या अंदरूनी चोट से इनकार नहीं किया जा सकता। हल्के जलने पर साफ ठंडा बहता पानी डालें (टूथपेस्ट या बर्फ न लगाएं) और संदिग्ध मोच/चोट को स्थिर रखकर डॉक्टर से जांच कराएं।',
    precautionsEn:
      'Seek emergency trauma/orthopedic care for inability to bear weight, visible deformity, numbness, deep or heavily bleeding wounds, animal bites, or large/facial burns.',
    precautionsHi:
      'वज़न न रख पाना, अंग का टेढ़ा दिखना, सुन्नपन, गहरा या अधिक खून बहने वाला घाव, जानवर का काटना या चेहरे/बड़े हिस्से के जलने पर तुरंत आपातकालीन अस्पताल जाएं।',
    recommendedFacilityCategory: 'emergency_hospital',
    recommendedSpecialtyQuery: 'orthopedic trauma hospital emergency',
    recommendedSpecialtyLabelEn: 'Orthopedic / Trauma Hospital',
    recommendedSpecialtyLabelHi: 'हड्डी एवं ट्रॉमा (आर्थोपेडिक) अस्पताल',
    defaultUrgency: 'urgent',
  },
  {
    id: 'icmr-diabetes-chronic',
    sourceName: 'ICMR-INDIAB & MoHFW NP-NCD Guidelines',
    documentTitle: 'Type 2 Diabetes, Blood Sugar & Chronic Condition Education',
    subject: 'Diabetes, blood sugar, thyroid, chronic disease monitoring & diet',
    publicationDate: '2024-07-18',
    version: 'ICMR-NCD-2024.1',
    sourceUrl: 'https://www.icmr.gov.in/',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'diabetes',
      'sugar',
      'insulin',
      'metformin',
      'thyroid',
      'cholesterol',
      'chronic',
      'मधुमेह',
      'शुगर',
      'थायराइड',
    ],
    summaryEn:
      'Managing diabetes and chronic conditions depends on regular clinician follow-up, lab monitoring (e.g., HbA1c, lipid profile, kidney checks), balanced nutrition, and never altering prescribed doses without medical guidance.',
    summaryHi:
      'मधुमेह और अन्य दीर्घकालिक स्थितियों के प्रबंधन के लिए नियमित डॉक्टर जांच, आवश्यक लैब परीक्षण, संतुलित आहार और बिना डॉक्टर की सलाह दवा की खुराक न बदलना अत्यंत महत्वपूर्ण है।',
    precautionsEn:
      'Watch for low blood sugar (sweating, shakiness, confusion) or very high blood sugar (excessive thirst, vomiting, fruity breath, drowsiness) — seek urgent medical care if severe.',
    precautionsHi:
      'कम शुगर (पसीना, कंपकंपी, भ्रम) या अत्यधिक बढ़ी शुगर (उल्टी, सुस्ती, अत्यधिक प्यास) के गंभीर लक्षणों में तुरंत चिकित्सकीय सहायता लें।',
    recommendedFacilityCategory: 'doctor',
    recommendedSpecialtyQuery: 'internal medicine endocrinology diabetes clinic',
    recommendedSpecialtyLabelEn: 'Internal Medicine / Diabetes Clinic',
    recommendedSpecialtyLabelHi: 'आंतरिक चिकित्सा / मधुमेह क्लिनिक',
    defaultUrgency: 'routine',
  },
  {
    id: 'mohfw-telemanas-mental',
    sourceName: 'MoHFW India Tele-MANAS & NIMHANS',
    documentTitle: 'Mental Health Support, Anxiety, Sleep & Stress Guidance',
    subject: 'Stress, anxiety, depression, insomnia & emotional wellbeing',
    publicationDate: '2024-10-10',
    version: 'NIMHANS-TM-2024.2',
    sourceUrl: 'https://telemanas.mohfw.gov.in/',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'anxiety',
      'stress',
      'depression',
      'mental',
      'sleep',
      'insomnia',
      'panic',
      'sad',
      'तनाव',
      'चिंता',
      'अवसाद',
      'नींद',
      'मानसिक',
    ],
    summaryEn:
      'Persistent anxiety, low mood, panic episodes, or disrupted sleep lasting weeks are common health concerns that respond well to professional counseling and clinical support. India provides free 24x7 confidential support through Tele-MANAS (14416).',
    summaryHi:
      'लगातार चिंता, उदासी, घबराहट या नींद की समस्या आम स्वास्थ्य विषय हैं जिनका पेशेवर परामर्श और चिकित्सकीय सहयोग से प्रभावी समाधान संभव है। भारत में Tele-MANAS (14416) पर 24x7 निःशुल्क गोपनीय सहायता उपलब्ध है।',
    precautionsEn:
      'If experiencing thoughts of self-harm or crisis, immediately call Tele-MANAS (14416), KIRAN (1800-599-0019), or Emergency 112 and stay with a trusted person.',
    precautionsHi:
      'यदि स्वयं को नुकसान पहुंचाने के विचार आएं या गंभीर संकट महसूस हो, तो तुरंत Tele-MANAS (14416) या 112 पर कॉल करें और किसी विश्वसनीय व्यक्ति के साथ रहें।',
    recommendedFacilityCategory: 'medical_clinic',
    recommendedSpecialtyQuery: 'psychiatry mental health clinic counseling',
    recommendedSpecialtyLabelEn: 'Mental Health / Psychiatry Clinic',
    recommendedSpecialtyLabelHi: 'मानसिक स्वास्थ्य / मनोचिकित्सा क्लिनिक',
    defaultUrgency: 'soon',
  },
  {
    id: 'mohfw-eye-ent-skin',
    sourceName: 'MoHFW India Standard Treatment Guidelines & MedlinePlus',
    documentTitle: 'Dermatology, Eye & ENT General Care Guidance',
    subject: 'Skin rashes, allergies, eye redness, ear pain & ENT concerns',
    publicationDate: '2024-03-22',
    version: 'STG-SENS-2024.1',
    sourceUrl: 'https://medlineplus.gov/',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'skin',
      'rash',
      'itching',
      'allergy',
      'eye',
      'vision',
      'ear',
      'tooth',
      'dental',
      'त्वचा',
      'खुजली',
      'आंख',
      'कान',
      'दांत',
    ],
    summaryEn:
      'Skin rashes, eye irritation, and ear pain have diverse causes ranging from mild irritation to infection or allergic reactions. Avoid unprescribed steroid creams or unverified eye/ear drops before an in-person exam.',
    summaryHi:
      'त्वचा पर चकत्ते, आंख में जलन या कान दर्द के कई कारण हो सकते हैं। बिना डॉक्टर की जांच के स्टेरॉयड क्रीम या अनजान आई/ईयर ड्रॉप का उपयोग करने से बचें।',
    precautionsEn:
      'Seek urgent care for sudden vision loss, chemical splash in the eye, spreading facial/lip swelling, or severe ear pain with high fever.',
    precautionsHi:
      'अचानक दृष्टि कम होना, आंख में रसायन जाना, चेहरे/होंठ पर सूजन या तेज़ बुखार के साथ कान दर्द होने पर तुरंत अस्पताल जाएं।',
    recommendedFacilityCategory: 'medical_clinic',
    recommendedSpecialtyQuery: 'dermatology eye ent specialist clinic',
    recommendedSpecialtyLabelEn: 'Specialist Clinic (Skin / Eye / ENT)',
    recommendedSpecialtyLabelHi: 'विशेषज्ञ क्लिनिक (त्वचा / आंख / कान-नाक-गला)',
    defaultUrgency: 'soon',
  },
  {
    id: 'nlem-medicine-safety',
    sourceName: 'NLEM India / CDSCO & WHO Medication Safety',
    documentTitle: 'Safe Medicine Use, Packaging Verification & Antibiotic Stewardship',
    subject: 'Medicine labels, expiry dates, storage, generics & safe usage',
    publicationDate: '2024-11-01',
    version: 'CDSCO-SAFE-2024.1',
    sourceUrl: 'https://cdsco.gov.in/',
    reviewStatus: 'Clinician-Reviewed Reference',
    lastVerifiedDate: '2026-03-01',
    keywords: [
      'medicine',
      'tablet',
      'syrup',
      'expiry',
      'label',
      'antibiotic',
      'prescription',
      'pharmacy',
      'side effect',
      'dosage',
      'दवा',
      'गोली',
      'एक्सपायरी',
    ],
    summaryEn:
      'Always verify the active ingredient, printed strength, expiry date, intact seal, and prescription directions before using any medication. Never share prescription medicines or take unidentified loose pills.',
    summaryHi:
      'किसी भी दवा का उपयोग करने से पहले उसके सक्रिय घटक, मात्रा, एक्सपायरी तिथि, सुरक्षित सील और डॉक्टर के निर्देश अवश्य जांचें। बिना पहचान वाली खुली गोलियां कभी न लें।',
    precautionsEn:
      'Do not stop prescribed chronic medications abruptly without consulting your doctor. Ask a licensed pharmacist or doctor before combining medicines or giving any medicine to children.',
    precautionsHi:
      'बिना डॉक्टर की सलाह के नियमित चल रही दवाएं अचानक बंद न करें। बच्चों को कोई भी दवा देने या दो दवाएं साथ लेने से पहले डॉक्टर या फार्मासिस्ट से पुष्टि करें।',
    recommendedFacilityCategory: 'pharmacy',
    recommendedSpecialtyQuery: 'pharmacy medical store',
    recommendedSpecialtyLabelEn: 'Licensed Pharmacy / Medical Store',
    recommendedSpecialtyLabelHi: 'लाइसेंस प्राप्त फ़ार्मेसी / मेडिकल स्टोर',
    defaultUrgency: 'routine',
  },
];

export interface ClinicalKnowledgeMatch {
  entry: CuratedClinicalEntry;
  score: number;
}

/**
 * Deterministic keyword & topic relevance search over SAHAAY's curated clinician-reviewed knowledge base.
 */
export function searchClinicalKnowledgeBase(
  query: string,
  limit = 3
): ClinicalKnowledgeMatch[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized
    .split(/[^a-z0-9\u0900-\u097F]+/u)
    .filter((t) => t.length >= 2);

  const scored: ClinicalKnowledgeMatch[] = [];

  for (const entry of CURATED_CLINICAL_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (normalized.includes(kwLower)) {
        score += kwLower.includes(' ') ? 5 : 3;
      } else if (tokens.some((tok) => kwLower.startsWith(tok) && tok.length >= 4)) {
        score += 1;
      }
    }
    const subjectLower = `${entry.subject} ${entry.documentTitle}`.toLowerCase();
    for (const tok of tokens) {
      if (tok.length >= 4 && subjectLower.includes(tok)) {
        score += 1;
      }
    }
    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface CareRecommendation {
  shouldRecommend: boolean;
  urgency: UrgencyLevel;
  facilityCategory: RecommendedFacilityCategory;
  specialtyQuery?: string;
  labelEn: string;
  labelHi: string;
  reasonEn: string;
  reasonHi: string;
}

const PURE_EDUCATIONAL_PATTERNS = [
  /^\s*(what is|define|explain|meaning of|how does|how to check|difference between|what are the benefits of)\b/i,
  /(packaging|expiry date|how should i check|what is vitamin|what is ors|what does .+ mean)/i,
  /(क्या है|कैसे जांचें|का अर्थ|क्या होता है)/u,
];

const SYMPTOM_OR_CARE_TRIGGER_PATTERNS = [
  /(pain|ache|fever|cough|vomit|diarrhea|diarrhoea|rash|swelling|bleeding|dizzy|weakness|infection|injury|burn|cut|sprain|fracture|days|hours|worsening|severe|high bp|breath|pregnant|child|baby|anxiety|panic|symptom)/i,
  /(दर्द|बुखार|खांसी|उल्टी|दस्त|सूजन|चोट|जलन|चक्कर|कमजोरी|लक्षण|दिनों से|सांस|गर्भवती|बच्चे|चिंता)/u,
];

/**
 * Determines whether SAHAAY should surface the inline "Find Nearby Medical Assistance" action card
 * AND which specific facility / specialty is most appropriate (never blindly showing it on pure definitions).
 */
export function analyzeCareRecommendation(
  message: string,
  isEmergency: boolean,
  matches: ClinicalKnowledgeMatch[]
): CareRecommendation {
  if (isEmergency) {
    return {
      shouldRecommend: true,
      urgency: 'emergency',
      facilityCategory: 'emergency_hospital',
      specialtyQuery: 'emergency trauma hospital',
      labelEn: 'Nearest Emergency & Trauma Hospital',
      labelHi: 'नजदीकी आपातकालीन और ट्रॉमा अस्पताल',
      reasonEn:
        'Potential emergency red flags detected. Call 112 immediately and navigate to an emergency hospital.',
      reasonHi:
        'संभावित आपातकालीन संकेत मिले हैं। तुरंत 112 पर कॉल करें और आपातकालीन अस्पताल जाएं।',
    };
  }

  const trimmed = message.trim();
  const hasSymptomSignal = SYMPTOM_OR_CARE_TRIGGER_PATTERNS.some((re) => re.test(trimmed));
  const looksPurelyEducational =
    PURE_EDUCATIONAL_PATTERNS.some((re) => re.test(trimmed)) && !hasSymptomSignal;

  if (looksPurelyEducational) {
    return {
      shouldRecommend: false,
      urgency: 'routine',
      facilityCategory: 'doctor',
      labelEn: 'General Physician',
      labelHi: 'सामान्य चिकित्सक',
      reasonEn: 'Informational question — no immediate facility lookup required.',
      reasonHi: 'सामान्य जानकारी का प्रश्न।',
    };
  }

  const top = matches[0]?.entry;
  if (top && (hasSymptomSignal || matches[0].score >= 3)) {
    // Refine specialty for specific sub-keywords (eye, ear, skin, dental, child, maternity)
    const lower = trimmed.toLowerCase();
    if (/(eye|vision|आंख)/u.test(lower)) {
      return {
        shouldRecommend: true,
        urgency: 'soon',
        facilityCategory: 'medical_clinic',
        specialtyQuery: 'eye hospital ophthalmologist',
        labelEn: 'Eye Hospital / Ophthalmologist',
        labelHi: 'नेत्र अस्पताल / आंख के विशेषज्ञ',
        reasonEn: 'Eye symptoms are best checked in person by an eye specialist.',
        reasonHi: 'आंखों के लक्षणों की प्रत्यक्ष जांच नेत्र विशेषज्ञ द्वारा कराना सबसे उपयुक्त है।',
      };
    }
    if (/(child|baby|infant|toddler|newborn|बच्चा|शिशु)/u.test(lower)) {
      return {
        shouldRecommend: true,
        urgency: 'urgent',
        facilityCategory: 'general_hospital',
        specialtyQuery: 'pediatric hospital child specialist',
        labelEn: 'Pediatric Hospital / Child Specialist',
        labelHi: 'बाल रोग विशेषज्ञ / शिशु अस्पताल',
        reasonEn: 'Children and infants benefit from prompt evaluation by a pediatrician.',
        reasonHi: 'बच्चों और शिशुओं के लिए बाल रोग विशेषज्ञ द्वारा समय पर जांच आवश्यक है।',
      };
    }
    if (/(pregnant|pregnancy|maternity|गर्भवती|गर्भावस्था)/u.test(lower)) {
      return {
        shouldRecommend: true,
        urgency: 'urgent',
        facilityCategory: 'general_hospital',
        specialtyQuery: 'maternity hospital gynecologist',
        labelEn: 'Maternity Hospital / OB-GYN',
        labelHi: 'प्रसूति अस्पताल / स्त्री रोग विशेषज्ञ',
        reasonEn: 'Pregnancy-related concerns should be reviewed by an obstetrician or maternity hospital.',
        reasonHi: 'गर्भावस्था से जुड़े लक्षणों की जांच स्त्री रोग विशेषज्ञ या प्रसूति अस्पताल में कराएं।',
      };
    }

    return {
      shouldRecommend: true,
      urgency: top.defaultUrgency,
      facilityCategory: top.recommendedFacilityCategory,
      specialtyQuery: top.recommendedSpecialtyQuery,
      labelEn: top.recommendedSpecialtyLabelEn,
      labelHi: top.recommendedSpecialtyLabelHi,
      reasonEn: `Based on your concern (${top.subject}), an in-person review with a ${top.recommendedSpecialtyLabelEn} is the most appropriate next step.`,
      reasonHi: `आपके प्रश्न के आधार पर ${top.recommendedSpecialtyLabelHi} से प्रत्यक्ष परामर्श सबसे उपयुक्त कदम है।`,
    };
  }

  if (hasSymptomSignal) {
    return {
      shouldRecommend: true,
      urgency: 'soon',
      facilityCategory: 'doctor',
      specialtyQuery: 'general physician medical clinic',
      labelEn: 'General Physician / Medical Clinic',
      labelHi: 'सामान्य चिकित्सक / मेडिकल क्लिनिक',
      reasonEn: 'An in-person checkup with a qualified physician can properly evaluate your symptoms.',
      reasonHi: 'योग्य चिकित्सक से प्रत्यक्ष जांच आपके लक्षणों का सही मूल्यांकन कर सकती है।',
    };
  }

  return {
    shouldRecommend: false,
    urgency: 'routine',
    facilityCategory: 'doctor',
    labelEn: 'General Physician',
    labelHi: 'सामान्य चिकित्सक',
    reasonEn: 'General educational inquiry.',
    reasonHi: 'सामान्य शैक्षणिक प्रश्न।',
  };
}

/**
 * Generates 3 concise, context-aware follow-up suggestion chips for the user's conversation.
 */
export function generateFollowUpSuggestions(
  language: Language,
  matches: ClinicalKnowledgeMatch[],
  isEmergency: boolean
): string[] {
  if (isEmergency) {
    return language === 'hi'
      ? [
          'एम्बुलेंस आने तक सुरक्षित रूप से क्या करें?',
          'नजदीकी आपातकालीन अस्पताल कैसे खोजें?',
        ]
      : [
          'What safe steps should I take while waiting for emergency help?',
          'What information should I share with the emergency doctor?',
        ];
  }

  const topId = matches[0]?.entry.id;
  if (topId === 'mohfw-fever-vector') {
    return language === 'hi'
      ? [
          'बुखार के साथ कौन से खतरे के संकेत तुरंत अस्पताल जाने को कहते हैं?',
          'डॉक्टर को दिखाने के लिए कौन सी जानकारी नोट करनी चाहिए?',
          'घर पर सुरक्षित हाइड्रेशन कैसे बनाए रखें?',
        ]
      : [
          'Which fever warning signs require urgent hospital care?',
          'What details should I note down before seeing a doctor?',
          'How can I stay safely hydrated while monitoring a fever?',
        ];
  }
  if (topId === 'who-cardiac-chest') {
    return language === 'hi'
      ? [
          'सीने में दर्द और सामान्य एसिडिटी में सावधानी के क्या अंतर हैं?',
          'रक्तचाप की नियमित जांच कैसे करें?',
          'हृदय विशेषज्ञ से मिलने से पहले क्या तैयार रखें?',
        ]
      : [
          'What warning signs distinguish urgent chest symptoms from mild indigestion?',
          'How should blood pressure be monitored accurately at home?',
          'What information should I bring to a cardiology checkup?',
        ];
  }
  if (topId === 'who-diarrhea-ors') {
    return language === 'hi'
      ? [
          'WHO मानक ORS सही तरीके से कैसे तैयार करें?',
          'गंभीर डिहाइड्रेशन के कौन से संकेत हैं?',
          'दस्त के दौरान कौन सा हल्का भोजन उपयुक्त है?',
        ]
      : [
          'How do I prepare standard WHO ORS safely?',
          'What are the warning signs of severe dehydration?',
          'When is a doctor needed for stomach upset or diarrhea?',
        ];
  }

  return language === 'hi'
    ? [
        'इसके कौन से गंभीर लक्षण होने पर तुरंत डॉक्टर के पास जाना चाहिए?',
        'डॉक्टर से मिलने पर मुझे कौन से प्रश्न पूछने चाहिए?',
        'इस स्थिति में किन सामान्य सावधानियों का ध्यान रखना चाहिए?',
      ]
    : [
        'What warning signs mean I should see a doctor urgently?',
        'What questions should I ask a doctor during an appointment?',
        'What safe general precautions should I keep in mind meanwhile?',
      ];
}

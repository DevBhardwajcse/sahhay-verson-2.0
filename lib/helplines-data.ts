export interface HelplineRecord {
  id: string;
  nameEn: string;
  nameHi: string;
  number: string;
  category: 'integrated' | 'medical' | 'police' | 'fire' | 'women_child' | 'disaster' | 'mental_health' | 'senior';
  descriptionEn: string;
  descriptionHi: string;
  jurisdiction: 'National (India)' | 'State / UT';
  state?: string;
  source: string;
  lastVerified: string;
  featured?: boolean;
}

export const VERIFIED_HELPLINES: HelplineRecord[] = [
  {
    id: 'erss-112',
    nameEn: 'Emergency Response Support System (ERSS)',
    nameHi: 'एकीकृत आपातकालीन सहायता सेवा (ERSS)',
    number: '112',
    category: 'integrated',
    descriptionEn: 'India’s single pan-India integrated emergency number connecting Police, Fire, Health, and Disaster response.',
    descriptionHi: 'पुलिस, अग्निशमन, स्वास्थ्य और आपदा सहायता के लिए भारत का एकीकृत राष्ट्रीय आपातकालीन नंबर।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Home Affairs, Govt. of India (112.gov.in)',
    lastVerified: '2026-10-15',
    featured: true,
  },
  {
    id: 'ambulance-102',
    nameEn: 'National Ambulance Service',
    nameHi: 'राष्ट्रीय एम्बुलेंस सेवा',
    number: '102',
    category: 'medical',
    descriptionEn: 'Free government ambulance service for pregnant women, newborns, and general medical transport across India.',
    descriptionHi: 'गर्भवती महिलाओं, नवजात शिशुओं और चिकित्सा परिवहन के लिए सरकारी एम्बुलेंस सेवा।',
    jurisdiction: 'National (India)',
    source: 'National Health Mission / National Portal of India',
    lastVerified: '2026-10-15',
    featured: true,
  },
  {
    id: 'emergency-108',
    nameEn: 'Emergency Medical & Trauma Ambulance',
    nameHi: 'आपातकालीन चिकित्सा एवं ट्रॉमा एम्बुलेंस',
    number: '108',
    category: 'medical',
    descriptionEn: '24×7 emergency medical, trauma, and accident ambulance service available across participating Indian states.',
    descriptionHi: 'सहभागी भारतीय राज्यों में 24×7 आपातकालीन चिकित्सा और दुर्घटना एम्बुलेंस सेवा।',
    jurisdiction: 'National (India)',
    source: 'National Health Mission (NHM), Govt. of India',
    lastVerified: '2026-10-15',
    featured: true,
  },
  {
    id: 'police-100',
    nameEn: 'Police Emergency Helpline',
    nameHi: 'पुलिस आपातकालीन हेल्पलाइन',
    number: '100',
    category: 'police',
    descriptionEn: 'Direct police emergency assistance (also integrated into 112).',
    descriptionHi: 'तत्काल पुलिस सहायता (112 के साथ भी एकीकृत)।',
    jurisdiction: 'National (India)',
    source: 'National Portal of India (india.gov.in)',
    lastVerified: '2026-10-15',
  },
  {
    id: 'fire-101',
    nameEn: 'Fire & Rescue Emergency',
    nameHi: 'अग्निशमन एवं बचाव सेवा',
    number: '101',
    category: 'fire',
    descriptionEn: 'Fire brigade and urgent fire rescue operations.',
    descriptionHi: 'अग्निशमन और तत्काल आग से बचाव सहायता।',
    jurisdiction: 'National (India)',
    source: 'National Portal of India (india.gov.in)',
    lastVerified: '2026-10-15',
  },
  {
    id: 'child-1098',
    nameEn: 'Childline India Helpline',
    nameHi: 'चाइल्डलाइन हेल्पलाइन',
    number: '1098',
    category: 'women_child',
    descriptionEn: '24-hour emergency helpline for children in distress or requiring protection and medical care.',
    descriptionHi: 'संकट में फंसे बच्चों की सुरक्षा और सहायता के लिए 24 घंटे की राष्ट्रीय हेल्पलाइन।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Women and Child Development, Govt. of India',
    lastVerified: '2026-10-15',
  },
  {
    id: 'women-181',
    nameEn: 'Women Helpline (All India)',
    nameHi: 'महिला हेल्पलाइन (अखिल भारतीय)',
    number: '181',
    category: 'women_child',
    descriptionEn: '24-hour immediate support, safety response, and referral helpline for women.',
    descriptionHi: 'महिलाओं की सुरक्षा और तत्काल सहायता के लिए 24 घंटे की राष्ट्रीय हेल्पलाइन।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Women and Child Development, Govt. of India',
    lastVerified: '2026-10-15',
  },
  {
    id: 'senior-14567',
    nameEn: 'Elder Line — Senior Citizen Helpline',
    nameHi: 'एल्डर लाइन — वरिष्ठ नागरिक हेल्पलाइन',
    number: '14567',
    category: 'senior',
    descriptionEn: 'National helpline offering healthcare guidance, emotional support, and emergency aid for senior citizens.',
    descriptionHi: 'वरिष्ठ नागरिकों के लिए स्वास्थ्य मार्गदर्शन, सहायता और आपातकालीन समर्थन।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Social Justice & Empowerment, Govt. of India',
    lastVerified: '2026-10-15',
  },
  {
    id: 'disaster-1070',
    nameEn: 'Disaster Relief Commissioner / NDMA',
    nameHi: 'आपदा राहत आयुक्त / NDMA हेल्पलाइन',
    number: '1070',
    category: 'disaster',
    descriptionEn: 'State Emergency Operation Centre for floods, earthquakes, cyclones, and natural disasters.',
    descriptionHi: 'बाढ़, भूकंप, चक्रवात और प्राकृतिक आपदाओं के लिए राज्य आपातकालीन संचालन केंद्र।',
    jurisdiction: 'National (India)',
    source: 'National Disaster Management Authority (NDMA)',
    lastVerified: '2026-10-15',
  },
  {
    id: 'road-1073',
    nameEn: 'Road Accident Emergency Service',
    nameHi: 'सड़क दुर्घटना आपातकालीन सेवा',
    number: '1073',
    category: 'disaster',
    descriptionEn: 'Emergency response coordination for highway and road traffic accidents.',
    descriptionHi: 'राजमार्ग और सड़क दुर्घटनाओं के लिए आपातकालीन सहायता सेवा।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Road Transport & Highways / National Portal of India',
    lastVerified: '2026-10-15',
  },
  {
    id: 'tele-manas-14416',
    nameEn: 'Tele-MANAS Mental Health Helpline',
    nameHi: 'टेली-मानस मानसिक स्वास्थ्य हेल्पलाइन',
    number: '14416',
    category: 'mental_health',
    descriptionEn: '24×7 free mental health counselling and crisis support by the Ministry of Health & Family Welfare.',
    descriptionHi: 'स्वास्थ्य एवं परिवार कल्याण मंत्रालय द्वारा 24×7 निःशुल्क मानसिक स्वास्थ्य परामर्श।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Health & Family Welfare (MoHFW), Govt. of India',
    lastVerified: '2026-10-15',
  },
  {
    id: 'cyber-1930',
    nameEn: 'National Cyber Crime Helpline',
    nameHi: 'राष्ट्रीय साइबर अपराध हेल्पलाइन',
    number: '1930',
    category: 'police',
    descriptionEn: 'Report financial fraud and urgent cybercrime incidents nationwide.',
    descriptionHi: 'वित्तीय धोखाधड़ी और साइबर अपराध की तत्काल शिकायत के लिए राष्ट्रीय नंबर।',
    jurisdiction: 'National (India)',
    source: 'Ministry of Home Affairs (cybercrime.gov.in)',
    lastVerified: '2026-10-15',
  },
];

/**
 * Independently sourced offline healthcare facility records (Public Govt. of India / NHP / AIIMS directories).
 * Strictly separated from Google Maps Platform live results to honor GMP caching policies.
 */
export interface OfflineFacilityRecord {
  id: string;
  name: string;
  category: 'Government Hospital' | 'Primary Health Centre' | 'Community Health Centre' | 'District Hospital' | 'Emergency Hub';
  district: string;
  state: string;
  address: string;
  phone: string;
  verifiedOwnership: 'Government of India / State Health Dept';
  source: string;
  lastVerified: string;
  notesEn: string;
  notesHi: string;
}

export const INDEPENDENT_OFFLINE_FACILITIES: OfflineFacilityRecord[] = [
  {
    id: 'off-aiims-delhi',
    name: 'AIIMS New Delhi — Main Emergency & JPNATC Trauma Centre',
    category: 'Government Hospital',
    district: 'New Delhi',
    state: 'Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029',
    phone: '011-26588500',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'AIIMS Official Public Directory (aiims.edu)',
    lastVerified: '2026-10-10',
    notesEn: '24×7 tertiary emergency & trauma care. Call ahead or check in person for current bed status.',
    notesHi: '24×7 आपातकालीन और ट्रॉमा सेवा। वर्तमान बेड उपलब्धता की पुष्टि अस्पताल से करें।',
  },
  {
    id: 'off-safdarjung-delhi',
    name: 'Vardhman Mahavir Medical College & Safdarjung Hospital',
    category: 'Government Hospital',
    district: 'New Delhi',
    state: 'Delhi',
    address: 'Ansari Nagar West, Ring Road, New Delhi 110029',
    phone: '011-26730000',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'MoHFW Central Govt. Hospital Directory',
    lastVerified: '2026-10-10',
    notesEn: 'Central government multi-specialty hospital with emergency & burns unit.',
    notesHi: 'केंद्र सरकार का बहु-विशेषता अस्पताल, आपातकालीन और बर्न यूनिट उपलब्ध।',
  },
  {
    id: 'off-pgimer-chandigarh',
    name: 'PGIMER Chandigarh — Emergency & Advanced Trauma Centre',
    category: 'Government Hospital',
    district: 'Chandigarh',
    state: 'Chandigarh',
    address: 'Madhya Marg, Sector 12, Chandigarh 160012',
    phone: '0172-2747585',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'PGIMER Official Directory (pgimer.edu.in)',
    lastVerified: '2026-10-10',
    notesEn: 'Regional referral & trauma emergency institute for North India.',
    notesHi: 'उत्तर भारत के लिए प्रमुख रेफरल और ट्रॉमा चिकित्सा संस्थान।',
  },
  {
    id: 'off-kem-mumbai',
    name: 'King Edward Memorial (KEM) Hospital',
    category: 'Government Hospital',
    district: 'Mumbai',
    state: 'Maharashtra',
    address: 'Acharya Donde Marg, Parel, Mumbai 400012',
    phone: '022-24107000',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'BMC / Maharashtra Public Health Directory',
    lastVerified: '2026-10-10',
    notesEn: 'Major public municipal hospital with 24-hour casualty department.',
    notesHi: '24 घंटे आपातकालीन विभाग के साथ प्रमुख सार्वजनिक अस्पताल।',
  },
  {
    id: 'off-sms-jaipur',
    name: 'Sawai Man Singh (SMS) Hospital',
    category: 'District Hospital',
    district: 'Jaipur',
    state: 'Rajasthan',
    address: 'Jawahar Lal Nehru Marg, Gangawal Park, Jaipur 302004',
    phone: '0141-2518222',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'Medical & Health Dept., Govt. of Rajasthan',
    lastVerified: '2026-10-10',
    notesEn: 'Major state referral hospital and trauma centre for Rajasthan.',
    notesHi: 'राजस्थान का प्रमुख राज्य रेफरल अस्पताल और ट्रॉमा केंद्र।',
  },
  {
    id: 'off-kgmu-lucknow',
    name: 'King George’s Medical University (KGMU) Trauma Centre',
    category: 'Government Hospital',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    address: 'Shah Mina Road, Chowk, Lucknow 226003',
    phone: '0522-2257540',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'Dept. of Medical Education, Govt. of Uttar Pradesh',
    lastVerified: '2026-10-10',
    notesEn: 'State referral hospital with dedicated trauma and pediatric emergency care.',
    notesHi: 'समर्पित ट्रॉमा और बाल आपातकालीन देखभाल के साथ राज्य रेफरल अस्पताल।',
  },
  {
    id: 'off-nimhans-bengaluru',
    name: 'NIMHANS — Emergency & Neuro-Psychiatry Services',
    category: 'Government Hospital',
    district: 'Bengaluru',
    state: 'Karnataka',
    address: 'Hosur Road, Lakkasandra, Bengaluru 560029',
    phone: '080-26995000',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'MoHFW / NIMHANS Public Directory',
    lastVerified: '2026-10-10',
    notesEn: 'Institute of national importance for neurological and mental health emergencies.',
    notesHi: 'न्यूरोलॉजिकल और मानसिक स्वास्थ्य आपातकाल के लिए राष्ट्रीय संस्थान।',
  },
  {
    id: 'off-rgh-chennai',
    name: 'Rajiv Gandhi Government General Hospital',
    category: 'Government Hospital',
    district: 'Chennai',
    state: 'Tamil Nadu',
    address: 'EVR Periyar Salai, Park Town, Chennai 600003',
    phone: '044-25305000',
    verifiedOwnership: 'Government of India / State Health Dept',
    source: 'Directorate of Medical Education, Govt. of Tamil Nadu',
    lastVerified: '2026-10-10',
    notesEn: 'Tertiary state government general hospital with 24×7 emergency services.',
    notesHi: '24×7 आपातकालीन सेवाओं वाला प्रमुख राजकीय सामान्य अस्पताल।',
  },
];

export interface OfflineEducationGuide {
  id: string;
  titleEn: string;
  titleHi: string;
  category: string;
  source: string;
  lastReviewed: string;
  stepsEn: string[];
  stepsHi: string[];
  redFlagsEn: string;
  redFlagsHi: string;
}

export const OFFLINE_CLINICAL_GUIDES: OfflineEducationGuide[] = [
  {
    id: 'guide-ors-dehydration',
    titleEn: 'Dehydration & Oral Rehydration (ORS)',
    titleHi: 'निर्जलीकरण और ओआरएस (ORS) सावधानियां',
    category: 'Hydration & General Care',
    source: 'WHO / National Health Mission India Guidelines',
    lastReviewed: '2026-10-01',
    stepsEn: [
      'Use standard WHO-formula ORS packets mixed strictly according to the packet volume in clean, safe drinking water.',
      'Give small, frequent sips rather than large amounts at once if nausea is present.',
      'Continue breastfeeding infants and avoid sugary sodas or undiluted fruit juices.',
    ],
    stepsHi: [
      'स्वच्छ पीने के पानी में पैकेट पर लिखे निर्देशानुसार ही WHO-मानक ORS घोल तैयार करें।',
      'यदि मतली हो तो एक बार में ज्यादा पीने के बजाय थोड़े-थोड़े घूंट बार-बार दें।',
      'शिशुओं को स्तनपान जारी रखें और अत्यधिक मीठे पेय या सोडा से बचें।',
    ],
    redFlagsEn: 'Seek urgent hospital care if unable to drink, sunken eyes, no urination for 6+ hours, blood in stool, or lethargy.',
    redFlagsHi: 'यदि पानी न पी सकें, आंखें धंसी हों, 6 घंटे से अधिक पेशाब न हो, मल में खून हो या अत्यधिक सुस्ती हो तो तुरंत अस्पताल जाएं।',
  },
  {
    id: 'guide-heatstroke',
    titleEn: 'Heat Exhaustion & Heatstroke Warning Signs',
    titleHi: 'लू लगना (हीटस्ट्रोक) के लक्षण और प्राथमिक सावधानी',
    category: 'Environmental Emergency',
    source: 'NDMA & MoHFW India Heat Action Plan',
    lastReviewed: '2026-10-01',
    stepsEn: [
      'Move the person immediately into a shaded, cool, or ventilated area and loosen tight clothing.',
      'Cool the body gently using cool damp cloths on the neck, armpits, and forehead.',
      'Offer sips of cool water or ORS ONLY if the person is fully alert and able to swallow safely.',
    ],
    stepsHi: [
      'व्यक्ति को तुरंत छायादार, ठंडी और हवादार जगह पर ले जाएं और तंग कपड़े ढीले करें।',
      'गर्दन, बगल और माथे पर ठंडे गीले कपड़े रखकर शरीर को धीरे-धीरे ठंडा करें।',
      'यदि व्यक्ति पूरी तरह होश में हो तभी ठंडा पानी या ORS के घूंट दें।',
    ],
    redFlagsEn: 'Confusion, slurred speech, hot dry skin, fainting, or seizures indicate possible heatstroke — call 112 immediately.',
    redFlagsHi: 'भ्रम, बोलने में कठिनाई, गर्म सूखी त्वचा, बेहोशी या दौरे हीटस्ट्रोक के संकेत हैं — तुरंत 112 पर कॉल करें।',
  },
  {
    id: 'guide-minor-burn',
    titleEn: 'Safe General First-Aid Guidance for Minor Burns',
    titleHi: 'हल्के जलने पर सुरक्षित प्राथमिक सावधानियां',
    category: 'Injury First Aid',
    source: 'WHO Basic Emergency Care / Red Cross India',
    lastReviewed: '2026-10-01',
    stepsEn: [
      'Cool the burned area under clean, cool (not ice-cold) running water for up to 20 minutes.',
      'Remove rings, watches, or tight clothing near the area gently before swelling develops, unless stuck to skin.',
      'Do NOT apply toothpaste, butter, oil, turmeric, ice, or break blisters. Cover loosely with clean non-stick dressing.',
    ],
    stepsHi: [
      'जले हुए हिस्से को 20 मिनट तक साफ, सामान्य ठंडे (बर्फ नहीं) बहते पानी के नीचे रखें।',
      'सूजन आने से पहले अंगूठी, घड़ी या तंग कपड़े धीरे से हटा दें (यदि त्वचा से चिपके न हों)।',
      'टूथपेस्ट, मक्खन, तेल, हल्दी या बर्फ न लगाएं और छाले न फोड़ें। साफ कपड़े से हल्का ढकें।',
    ],
    redFlagsEn: 'Burns on the face, hands, joints, genitals, chemical/electrical burns, or deep/large burns require immediate emergency hospital assessment.',
    redFlagsHi: 'चेहरे, हाथ, जोड़ों, रासायनिक/बिजली से जलने या बड़े/गहरे घाव के लिए तुरंत आपातकालीन अस्पताल जाएं।',
  },
  {
    id: 'guide-snakebite',
    titleEn: 'Snakebite Precautions (What To Do & Avoid)',
    titleHi: 'सांप के काटने पर आवश्यक सावधानियां',
    category: 'Rural Emergency',
    source: 'MoHFW National Snakebite Management Protocol (India)',
    lastReviewed: '2026-10-01',
    stepsEn: [
      'Treat every snakebite as a medical emergency. Keep the person calm and still to slow venom spread.',
      'Immobilize the bitten limb gently at or slightly below heart level and transport rapidly to a hospital with anti-venom.',
      'Do NOT cut the wound, attempt to suck out venom, apply tight tourniquets, or rely on herbal remedies.',
    ],
    stepsHi: [
      'हर सांप के काटने को चिकित्सा आपातकाल मानें। व्यक्ति को शांत और स्थिर रखें।',
      'काटे गए अंग को हल्के से स्थिर रखें और तुरंत एंटी-वेनम सुविधा वाले अस्पताल ले जाएं।',
      'घाव को न काटें, मुंह से जहर न चूसें, कसकर पट्टी न बांधें और घरेलू उपचार में समय न गंवाएं।',
    ],
    redFlagsEn: 'Call 112 / 108 immediately and go directly to the nearest District Hospital or CHC equipped with Anti-Snake Venom (ASV).',
    redFlagsHi: 'तुरंत 112 / 108 पर कॉल करें और एंटी-स्नेक वेनम (ASV) वाले नजदीकी जिला अस्पताल या CHC जाएं।',
  },
];

export interface ClinicalMedicineReference {
  genericName: string;
  commonBrandsIndia: string[];
  category: string;
  commonUsesEn: string;
  commonUsesHi: string;
  generalPrecautionsEn: string;
  generalPrecautionsHi: string;
  source: string;
}

/**
 * Curated offline clinical reference aligned with WHO Essential Medicines List & India NLEM.
 * Used alongside live OpenFDA & NLM MedlinePlus queries on the server.
 */
export const ESSENTIAL_MEDICINES_REFERENCE: ClinicalMedicineReference[] = [
  {
    genericName: 'Paracetamol (Acetaminophen)',
    commonBrandsIndia: ['Dolo', 'Crocin', 'Calpol', 'P-500', 'Pacimol'],
    category: 'Analgesic & Antipyretic (Pain reliever and fever reducer)',
    commonUsesEn: 'Commonly used under healthcare guidance for reducing fever and relieving mild-to-moderate pain such as headache or body aches.',
    commonUsesHi: 'डॉक्टर या फार्मासिस्ट के मार्गदर्शन में बुखार कम करने और सिरदर्द या शरीर दर्द जैसे हल्के-मध्यम दर्द से राहत के लिए सामान्यतः उपयोग किया जाता है।',
    generalPrecautionsEn: 'Avoid duplicating multiple cold/flu products containing paracetamol, as excess intake can harm the liver. People with liver conditions or chronic alcohol use must consult a doctor first.',
    generalPrecautionsHi: 'पैरासिटामोल युक्त एक से अधिक सर्दी/जुकाम की दवाएं साथ न लें, क्योंकि अधिक मात्रा लिवर को नुकसान पहुंचा सकती है। लिवर की समस्या होने पर पहले डॉक्टर से सलाह लें।',
    source: 'WHO Essential Medicines List / NLEM India / NLM MedlinePlus',
  },
  {
    genericName: 'Ibuprofen',
    commonBrandsIndia: ['Brufen', 'Combiflam (combination)', 'Ibugesic'],
    category: 'NSAID (Non-Steroidal Anti-Inflammatory Drug)',
    commonUsesEn: 'Generally used to reduce inflammation, fever, and mild-to-moderate musculoskeletal or dental pain.',
    commonUsesHi: 'सूजन, बुखार और मांसपेशियों या दांत के दर्द को कम करने के लिए सामान्यतः उपयोग किया जाता है।',
    generalPrecautionsEn: 'May irritate the stomach lining or affect kidneys. Caution is required in asthma, stomach ulcers, kidney/heart disease, dengue-suspected fever, or pregnancy. Confirm suitability with a doctor.',
    generalPrecautionsHi: 'यह पेट या गुर्दे को प्रभावित कर सकता है। अस्थमा, पेट के अल्सर, किडनी/हृदय रोग, संभावित डेंगू बुखार या गर्भावस्था में डॉक्टर से पूछे बिना उपयोग न करें।',
    source: 'WHO Essential Medicines List / NLM MedlinePlus',
  },
  {
    genericName: 'Amoxicillin',
    commonBrandsIndia: ['Mox', 'Augmentin (with Clavulanate)', 'Novamox'],
    category: 'Penicillin-class Antibiotic (Prescription Only)',
    commonUsesEn: 'A prescription antibiotic used to treat confirmed bacterial infections such as certain ear, throat, respiratory, or urinary tract infections. Does not treat viral infections like common colds.',
    commonUsesHi: 'यह डॉक्टर के पर्चे पर मिलने वाली एंटीबायोटिक है जो कुछ बैक्टीरियल संक्रमणों के इलाज में उपयोग होती है। यह सामान्य जुकाम जैसे वायरल संक्रमण पर असर नहीं करती।',
    generalPrecautionsEn: 'Never take antibiotics without a prescription. Severe allergic reactions can occur in people allergic to penicillin. Do not stop a prescribed course early without consulting the prescribing doctor.',
    generalPrecautionsHi: 'बिना डॉक्टर की सलाह के एंटीबायोटिक न लें। पेनिसिलिन से एलर्जी होने पर गंभीर प्रतिक्रिया हो सकती है। डॉक्टर द्वारा निर्धारित कोर्स बीच में न छोड़ें।',
    source: 'WHO Essential Medicines List / ICMR Antimicrobial Guidelines',
  },
  {
    genericName: 'Cetirizine',
    commonBrandsIndia: ['Cetzine', 'Okacet', 'Alerid', 'Zyrtec'],
    category: 'Second-Generation Antihistamine',
    commonUsesEn: 'Commonly used for allergy symptoms such as sneezing, runny nose, itchy eyes, and mild hives.',
    commonUsesHi: 'छींक आना, नाक बहना, आंखों में खुजली और हल्की एलर्जी के लक्षणों में सामान्यतः उपयोग किया जाता है।',
    generalPrecautionsEn: 'Can cause drowsiness in some individuals — exercise caution when driving. Not a substitute for emergency care during severe allergic reactions (throat swelling or breathing difficulty).',
    generalPrecautionsHi: 'कुछ लोगों में नींद आ सकती है। गंभीर एलर्जी (गले में सूजन या सांस लेने में तकलीफ) में यह आपातकालीन इलाज का विकल्प नहीं है — तुरंत 112 पर कॉल करें।',
    source: 'NLEM India / NLM MedlinePlus',
  },
  {
    genericName: 'Oral Rehydration Salts (ORS)',
    commonBrandsIndia: ['Electral', 'ORS-WHO', 'Prolyte'],
    category: 'Electrolyte & Fluid Replacement Solution',
    commonUsesEn: 'Used to prevent and manage mild-to-moderate dehydration caused by diarrhea, vomiting, or heat exhaustion.',
    commonUsesHi: 'दस्त, उल्टी या गर्मी से होने वाली पानी और नमक की कमी (निर्जलीकरण) की रोकथाम के लिए उपयोग किया जाता है।',
    generalPrecautionsEn: 'Prepare using the exact volume of clean drinking water stated on the packet. Seek urgent medical care if unable to keep fluids down or if signs of severe dehydration appear.',
    generalPrecautionsHi: 'पैकेट पर लिखी सटीक मात्रा के अनुसार साफ पानी में ही घोलें। तरल न पचने या गंभीर निर्जलीकरण के लक्षणों पर तुरंत अस्पताल जाएं।',
    source: 'WHO / UNICEF / NHM India Guidelines',
  },
  {
    genericName: 'Metformin',
    commonBrandsIndia: ['Glycomet', 'Gluconorm', 'Obimet'],
    category: 'Antidiabetic (Biguanide — Prescription Only)',
    commonUsesEn: 'A prescription medication commonly prescribed to help manage blood glucose levels in Type 2 diabetes alongside diet and lifestyle measures.',
    commonUsesHi: 'टाइप 2 मधुमेह में रक्त शर्करा (ब्लड शुगर) नियंत्रित करने के लिए डॉक्टर द्वारा निर्धारित दवा।',
    generalPrecautionsEn: 'Prescription-only medication requiring regular medical monitoring of kidney function and blood sugar. Never start, stop, or adjust dosage without consulting a physician.',
    generalPrecautionsHi: 'यह केवल डॉक्टर के पर्चे पर दी जाती है और नियमित किडनी व शुगर जांच आवश्यक होती है। डॉक्टर की सलाह के बिना खुराक न बदलें या बंद न करें।',
    source: 'WHO Essential Medicines List / NLEM India / OpenFDA',
  },
  {
    genericName: 'Omeprazole / Pantoprazole',
    commonBrandsIndia: ['Omez', 'Pan-40', 'Pantocid'],
    category: 'Proton Pump Inhibitor (Acid Reducer)',
    commonUsesEn: 'Commonly used under clinical guidance for acid reflux (GERD), heartburn, and certain stomach ulcers.',
    commonUsesHi: 'एसिड रिफ्लक्स, सीने में जलन और कुछ पेट के अल्सर के लिए चिकित्सकीय मार्गदर्शन में उपयोग की जाती है।',
    generalPrecautionsEn: 'Long-term use requires physician review. Persistent chest pain or severe upper abdominal pain should be evaluated by a doctor to rule out cardiac or urgent causes.',
    generalPrecautionsHi: 'लंबे समय तक उपयोग के लिए डॉक्टर की समीक्षा आवश्यक है। लगातार सीने में दर्द को केवल एसिडिटी न मानें और डॉक्टर से जांच कराएं।',
    source: 'WHO Essential Medicines List / NLM MedlinePlus',
  },
  {
    genericName: 'Azithromycin',
    commonBrandsIndia: ['Azee', 'Azithral', 'Zithromax'],
    category: 'Macrolide Antibiotic (Prescription Only)',
    commonUsesEn: 'A prescription antibiotic used for specific bacterial respiratory, skin, or throat infections when determined necessary by a physician.',
    commonUsesHi: 'डॉक्टर द्वारा आवश्यक समझे जाने पर कुछ बैक्टीरियल श्वसन, त्वचा या गले के संक्रमण में उपयोग होने वाली एंटीबायोटिक।',
    generalPrecautionsEn: 'Strict prescription-only antibiotic. May interact with heart-rhythm medications. Inappropriate use contributes to antimicrobial resistance.',
    generalPrecautionsHi: 'केवल डॉक्टर के पर्चे पर उपयोग करें। हृदय की लय से जुड़ी दवाओं के साथ परस्पर क्रिया हो सकती है। अनावश्यक उपयोग से बचें।',
    source: 'WHO Essential Medicines List / ICMR Guidelines',
  },
];

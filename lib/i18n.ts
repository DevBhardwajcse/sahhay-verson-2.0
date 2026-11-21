import type { Language } from './triage-engine';

export const INITIAL_GREETING: Record<Language, string> = {
  en: 'Namaste! I am SAHAAY AI Health Assistant. You can ask me general health questions, upload an image of medicine packaging, or share an appropriate injury image for limited visual observations. You can communicate in Hindi or English. I provide general information and help you understand when professional medical care may be necessary.',
  hi: 'नमस्ते! मैं SAHAAY AI स्वास्थ्य सहायक हूँ। आप मुझसे सामान्य स्वास्थ्य प्रश्न पूछ सकते हैं, दवा की पैकेजिंग की तस्वीर अपलोड कर सकते हैं, या सीमित दृश्य अवलोकन के लिए चोट की उपयुक्त तस्वीर साझा कर सकते हैं। आप हिंदी या अंग्रेज़ी में संवाद कर सकते हैं। मैं सामान्य जानकारी प्रदान करता हूँ और यह समझने में मदद करता हूँ कि कब पेशेवर चिकित्सा देखभाल आवश्यक हो सकती है।',
};

export interface UiStrings {
  brandTagline: string;
  emergency112: string;
  navHome: string;
  navAssistant: string;
  navTriage: string;
  navMap: string;
  navHelplines: string;
  navOffline: string;
  navSaved: string;
  navProfile: string;
  navAdmin: string;
  onlineLabel: string;
  offlineLabel: string;
  disclaimerBanner: string;
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingPrivacyTitle: string;
  onboardingPrivacyBody: string;
  onboardingLocationTitle: string;
  onboardingLocationBody: string;
  onboardingStart: string;
  detectLocation: string;
  findHospital: string;
  scanMedicine: string;
  analyzeInjury: string;
  voiceChat: string;
  saveSessionBtn: string;
  signInGoogle: string;
  signOut: string;
}

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    brandTagline: 'Live AI Medical Assistant & Emergency Navigation',
    emergency112: 'Emergency 112',
    navHome: 'Overview',
    navAssistant: 'AI Medical Assistant',
    navTriage: 'Guided Triage',
    navMap: 'Live Hospital Map',
    navHelplines: 'Govt. Helplines',
    navOffline: 'Safety Directory',
    navSaved: 'Saved Sessions',
    navProfile: 'Profile & Privacy',
    navAdmin: 'Admin Portal',
    onlineLabel: 'Live Online',
    offlineLabel: 'Network Unavailable',
    disclaimerBanner:
      'SAHAAY provides general health information and live resource navigation — not medical diagnosis, prescriptions, or emergency dispatch. In an emergency, call 112 immediately.',
    onboardingTitle: 'Ask AI. Understand the concern. Find the right help. Navigate there.',
    onboardingSubtitle:
      'SAHAAY combines a bilingual Gemini medical assistant grounded in clinician-reviewed references, medicine label scanning, live Google Maps hospital & specialist discovery, and verified India emergency helplines.',
    onboardingPrivacyTitle: 'Privacy & Consent (DPDP Act 2023)',
    onboardingPrivacyBody:
      'Conversations and uploaded images are not permanently stored by default. You stay in full control of saving session summaries or optional medical history.',
    onboardingLocationTitle: 'Explicit Live Location Permission',
    onboardingLocationBody:
      'Live GPS location is requested only when you tap "Detect My Current Location". Manual city, district, or PIN code search is always available.',
    onboardingStart: 'Open SAHAAY Assistant',
    detectLocation: 'Detect My Current Location',
    findHospital: 'Find Nearby Hospitals',
    scanMedicine: 'Scan Medicine',
    analyzeInjury: 'Analyze Visible Injury',
    voiceChat: 'Voice Conversation',
    saveSessionBtn: 'Save Session Summary',
    signInGoogle: 'Sign in with Google',
    signOut: 'Sign out',
  },
  hi: {
    brandTagline: 'लाइव AI चिकित्सा सहायक एवं आपातकालीन नेविगेशन',
    emergency112: 'आपातकाल 112',
    navHome: 'मुख्य डैशबोर्ड',
    navAssistant: 'AI चिकित्सा सहायक',
    navTriage: 'निर्देशित ट्राइएज',
    navMap: 'लाइव अस्पताल मानचित्र',
    navHelplines: 'सरकारी हेल्पलाइन',
    navOffline: 'सुरक्षा निर्देशिका',
    navSaved: 'सहेजे गए सत्र',
    navProfile: 'प्रोफ़ाइल और गोपनीयता',
    navAdmin: 'एडमिन पोर्टल',
    onlineLabel: 'लाइव ऑनलाइन',
    offlineLabel: 'इंटरनेट अनुपलब्ध',
    disclaimerBanner:
      'SAHAAY सामान्य स्वास्थ्य जानकारी और लाइव संसाधन मार्गदर्शन देता है — यह चिकित्सा निदान, दवा का पर्चा या आपातकालीन डिस्पैच नहीं है। आपात स्थिति में तुरंत 112 पर कॉल करें।',
    onboardingTitle: 'AI से पूछें। स्थिति समझें। सही सहायता खोजें। वहां तक पहुंचें।',
    onboardingSubtitle:
      'SAHAAY द्विभाषी AI चिकित्सा मार्गदर्शन, दवा पैकेजिंग स्कैन, लाइव Google Maps अस्पताल व विशेषज्ञ खोज, और सत्यापित भारतीय सरकारी हेल्पलाइन को एक साथ जोड़ता है।',
    onboardingPrivacyTitle: 'गोपनीयता और सहमति (DPDP अधिनियम 2023)',
    onboardingPrivacyBody:
      'बातचीत और अपलोड की गई तस्वीरें डिफ़ॉल्ट रूप से स्थायी रूप से सहेजी नहीं जातीं। सत्र सारांश या चिकित्सा इतिहास सहेजने पर आपका पूरा नियंत्रण रहता है।',
    onboardingLocationTitle: 'स्पष्ट लाइव लोकेशन अनुमति',
    onboardingLocationBody:
      'लाइव GPS लोकेशन तभी मांगी जाती है जब आप "मेरी वर्तमान लोकेशन खोजें" दबाते हैं। शहर, जिला या पिन कोड द्वारा खोज हमेशा उपलब्ध है।',
    onboardingStart: 'SAHAAY सहायक शुरू करें',
    detectLocation: 'मेरी वर्तमान लोकेशन खोजें',
    findHospital: 'नजदीकी अस्पताल खोजें',
    scanMedicine: 'दवा स्कैन करें',
    analyzeInjury: 'चोट की जांच करें',
    voiceChat: 'वॉइस बातचीत',
    saveSessionBtn: 'सत्र सारांश सहेजें',
    signInGoogle: 'Google से साइन इन करें',
    signOut: 'साइन आउट',
  },
};

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import {
  ArrowRight,
  BookmarkPlus,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import { blobToBase64, type VoiceTurn } from '@/lib/assistant-types';

interface MedicalHistoryContext {
  ageGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
}

interface VoiceConsultationPanelProps {
  language: Language;
  medicalHistoryContext?: MedicalHistoryContext;
  onSwitchToChat: () => void;
  onSaveSession: (
    sessionType: 'general_chat' | 'medicine_scan' | 'injury_analysis' | 'voice_session',
    title: string,
    summary: string,
    urgency?: 'routine' | 'soon' | 'urgent' | 'emergency',
    consentedTranscript?: string
  ) => Promise<void>;
}

export function VoiceConsultationPanel({
  language,
  medicalHistoryContext,
  onSwitchToChat,
  onSaveSession,
}: VoiceConsultationPanelProps) {
  const [voiceLang, setVoiceLang] = useState<'auto' | 'en' | 'hi'>('auto');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [lastSpokenLang, setLastSpokenLang] = useState<Language>(language);
  const [voiceTurns, setVoiceTurns] = useState<VoiceTurn[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopAudioPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  const playTtsAudio = async (text: string, lang: Language) => {
    if (voiceMuted || !text.trim()) return;
    stopAudioPlayback();
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.audioBase64) return;
      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
      audioPlayerRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  };

  const processVoiceBlob = async (blob: Blob, mimeType: string) => {
    setVoiceBusy(true);
    setVoiceError(null);
    try {
      const audioBase64 = await blobToBase64(blob);
      const transRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          preferredLanguage: voiceLang,
        }),
      });
      const transData = await transRes.json();
      if (!transRes.ok || !transData.transcript) {
        setVoiceError(
          transData.error ||
            (language === 'hi'
              ? 'स्पष्ट आवाज़ सुनाई नहीं दी। कृपया शांत वातावरण में दोबारा बोलें।'
              : 'Could not hear clear speech. Please try speaking again or use Text Chat.')
        );
        return;
      }

      const detectedLang: Language =
        voiceLang === 'auto' ? (transData.detectedLanguage === 'hi' ? 'hi' : 'en') : voiceLang;

      setVoiceTurns((prev) => [
        ...prev,
        { role: 'user', text: transData.transcript, lang: detectedLang },
      ]);

      const chatRes = await fetch('/api/medical/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transData.transcript,
          language: detectedLang,
          isVoice: true,
          useSearchGrounding: true,
          history: voiceTurns.slice(-6).map((v) => ({ role: v.role, text: v.text })),
          medicalHistoryContext,
        }),
      });
      const chatData = await chatRes.json();
      if (!chatRes.ok) {
        setVoiceError(chatData.error || 'Could not generate response.');
        return;
      }

      setVoiceTurns((prev) => [
        ...prev,
        {
          role: 'model',
          text: chatData.reply,
          lang: detectedLang,
          emergency: chatData.emergency,
        },
      ]);
      setLastSpokenText(chatData.reply);
      setLastSpokenLang(detectedLang);
      if (!voiceMuted) {
        await playTtsAudio(chatData.reply, detectedLang);
      }
    } catch {
      setVoiceError('Voice processing failed. Please retry or switch to Text Chat.');
    } finally {
      setVoiceBusy(false);
    }
  };

  const startVoiceRecording = async () => {
    setVoiceError(null);
    stopAudioPlayback();
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError(
        language === 'hi'
          ? 'इस ब्राउज़र में माइक्रोफ़ोन रिकॉर्डिंग उपलब्ध नहीं है। कृपया टेक्स्ट चैट का उपयोग करें।'
          : 'Microphone recording is not supported in this browser. Please switch to Text Chat.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        void processVoiceBlob(blob, mimeType);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setVoiceError(
        language === 'hi'
          ? 'माइक्रोफ़ोन अनुमति अस्वीकृत हुई। आप ब्राउज़र सेटिंग में अनुमति दे सकते हैं या टेक्स्ट चैट में स्विच कर सकते हैं।'
          : 'Microphone permission was denied or unavailable. You can grant microphone access or switch to Text Chat below.'
      );
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {language === 'hi'
              ? 'द्विभाषी वॉइस स्वास्थ्य बातचीत (हिन्दी / English)'
              : 'Bilingual Voice Health Conversation (Hindi / English)'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            {language === 'hi'
              ? 'माइक्रोफ़ोन दबाकर बोलें। SAHAAY आपकी आवाज़ को समझेगा, टेक्स्ट दिखाएगा और शांत आवाज़ में उत्तर देगा।'
              : 'Tap the microphone to speak naturally in Hindi or English. SAHAAY transcribes your speech and responds in voice and text.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Voice recognition language"
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value as 'auto' | 'en' | 'hi')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
          >
            <option value="auto">Auto (Hindi / English)</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (!voiceMuted) stopAudioPlayback();
              setVoiceMuted(!voiceMuted);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {voiceMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>Audio On</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSwitchToChat}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span>{language === 'hi' ? 'टेक्स्ट चैट पर जाएं' : 'Switch to Text'}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Primary Microphone Control */}
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <button
          type="button"
          disabled={voiceBusy}
          onClick={() => (isRecording ? stopVoiceRecording() : void startVoiceRecording())}
          aria-label={isRecording ? 'Stop recording' : 'Start speaking'}
          className={`flex h-20 w-20 items-center justify-center rounded-full shadow-md transition ${
            isRecording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-teal-700 text-white hover:bg-teal-800'
          } disabled:opacity-50`}
        >
          {voiceBusy ? (
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          ) : isRecording ? (
            <Square className="h-7 w-7" aria-hidden="true" />
          ) : (
            <Mic className="h-8 w-8" aria-hidden="true" />
          )}
        </button>

        <div className="mt-3 text-sm font-bold text-slate-900">
          {voiceBusy
            ? language === 'hi'
              ? 'प्रोसेस हो रहा है...'
              : 'Transcribing and preparing response...'
            : isRecording
              ? language === 'hi'
                ? 'सुन रहा हूँ — समाप्त करने के लिए दबाएं'
                : 'Listening — tap again when finished'
              : language === 'hi'
                ? 'बोलने के लिए माइक्रोफ़ोन दबाएं'
                : 'Tap microphone to speak in Hindi or English'}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {isSpeaking && (
            <button
              type="button"
              onClick={stopAudioPlayback}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{language === 'hi' ? 'आवाज़ रोकें' : 'Interrupt / Stop Speech'}</span>
            </button>
          )}
          {lastSpokenText && !isSpeaking && (
            <button
              type="button"
              onClick={() => void playTtsAudio(lastSpokenText, lastSpokenLang)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{language === 'hi' ? 'उत्तर दोबारा सुनें' : 'Repeat Last Response'}</span>
            </button>
          )}
          {voiceTurns.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const transcript = voiceTurns
                  .map((v) => `${v.role === 'user' ? 'User' : 'SAHAAY'}: ${v.text}`)
                  .join('\n\n');
                void onSaveSession(
                  'voice_session',
                  `Voice Session — ${voiceTurns[0].text.slice(0, 70)}`,
                  voiceTurns[voiceTurns.length - 1].text.slice(0, 1200),
                  voiceTurns.some((v) => v.emergency?.isEmergency) ? 'emergency' : 'routine',
                  transcript
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {language === 'hi' ? 'सहमति से ट्रांसक्रिप्ट सहेजें' : 'Save Consented Transcript'}
              </span>
            </button>
          )}
        </div>

        {voiceError && (
          <div className="mt-4 max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            {voiceError}
          </div>
        )}
      </div>

      {/* Live Transcript Display */}
      {voiceTurns.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Live Conversation Transcript
          </h3>
          {voiceTurns.map((turn, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                turn.role === 'user'
                  ? 'border-slate-200 bg-slate-50 text-slate-900'
                  : turn.emergency?.isEmergency
                    ? 'border-red-300 bg-red-50 text-red-950'
                    : 'border-teal-100 bg-teal-50/40 text-slate-800'
              }`}
            >
              <div className="mb-1 font-bold text-slate-700">
                {turn.role === 'user' ? 'You (Transcribed)' : 'SAHAAY Assistant'}
              </div>
              <div className="markdown-clinical">
                <Markdown>{turn.text}</Markdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

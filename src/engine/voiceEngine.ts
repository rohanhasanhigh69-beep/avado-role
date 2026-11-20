import {
  CharacterMood,
  CustomEmotionDefinition,
  VoiceGender,
  VoiceSettings,
} from '../types/roleplay';
import { computeEmotionalVoiceAdjustment } from './localIntelligence';

export interface ResolvedVoiceProfile {
  gender: VoiceGender;
  pitch: number;
  rate: number;
  baseFrequencyHz: number;
  formant1Hz: number;
  formant2Hz: number;
}

export interface BrowserVoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  inferredGender: VoiceGender;
  isBengali: boolean;
}

const FEMALE_HINT_REGEX =
  /female|woman|tanisha|nabanita|kalpana|heera|lekha|samantha|victoria|karen|zira|aria|jenny|priya|aditi|raveena|neural.*f/i;
const MALE_HINT_REGEX =
  /\bmale\b|man\b|pradeep|bashkar|ravi|hemant|daniel|alex|david|mark|guy|ryan|arjun|neural.*m/i;

export function classifySystemVoiceGender(voiceName: string): VoiceGender {
  if (FEMALE_HINT_REGEX.test(voiceName)) return 'female';
  if (MALE_HINT_REGEX.test(voiceName)) return 'male';
  return 'female';
}

/**
 * Computes pure acoustic and Web Speech parameters for Female vs Male voices,
 * dynamically shaped by the character's emotional mood.
 */
export function computeVoiceProfile(
  characterGender: VoiceGender,
  settings: VoiceSettings,
  mood?: CharacterMood,
  customEmotions: CustomEmotionDefinition[] = []
): ResolvedVoiceProfile {
  const effectiveGender: VoiceGender =
    settings.genderOverride === 'character' ? characterGender : settings.genderOverride;

  const emotionMod = computeEmotionalVoiceAdjustment(mood, customEmotions);
  const basePitch = effectiveGender === 'female' ? 1.18 : 0.78;
  const pitchOffset = settings.pitch - 1.0;
  const pitch = Number(
    Math.max(0.55, Math.min(1.75, basePitch + pitchOffset + emotionMod.pitchDelta)).toFixed(2)
  );
  const rate = Number(
    Math.max(0.7, Math.min(1.45, settings.rate * emotionMod.rateFactor)).toFixed(2)
  );

  const baseFrequencyHz =
    effectiveGender === 'female'
      ? Math.round(232 * (0.85 + (settings.pitch - 0.7) * 0.35) + emotionMod.pitchDelta * 120)
      : Math.round(118 * (0.85 + (settings.pitch - 0.7) * 0.35) + emotionMod.pitchDelta * 70);

  return {
    gender: effectiveGender,
    pitch,
    rate,
    baseFrequencyHz,
    formant1Hz: effectiveGender === 'female' ? 760 : 520,
    formant2Hz: effectiveGender === 'female' ? 1850 : 1280,
  };
}

export function listAvailableBrowserVoices(): BrowserVoiceInfo[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.map((v) => ({
    voiceURI: v.voiceURI,
    name: v.name,
    lang: v.lang,
    inferredGender: classifySystemVoiceGender(v.name),
    isBengali: v.lang.toLowerCase().startsWith('bn'),
  }));
}

export function pickBestSystemVoice(
  gender: VoiceGender,
  selectedURI?: string
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (selectedURI) {
    const exact = voices.find((v) => v.voiceURI === selectedURI);
    if (exact) return exact;
  }

  const bengaliVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('bn'));
  if (bengaliVoices.length > 0) {
    const genderMatch = bengaliVoices.find(
      (v) => classifySystemVoiceGender(v.name) === gender
    );
    return genderMatch || bengaliVoices[0];
  }

  return null;
}

class LocalVoicePlayer {
  private audioCtx: AudioContext | null = null;
  private activeTimerIds: number[] = [];
  private activeOscillators: OscillatorNode[] = [];
  private isPlayingState = false;
  private stopCallback: (() => void) | null = null;

  public stop(): void {
    this.isPlayingState = false;

    for (const id of this.activeTimerIds) {
      window.clearTimeout(id);
    }
    this.activeTimerIds = [];

    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    }
    this.activeOscillators = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speechSynthesis cancel errors in restricted environments
      }
    }

    if (this.stopCallback) {
      const cb = this.stopCallback;
      this.stopCallback = null;
      cb();
    }
  }

  public isSpeaking(): boolean {
    return this.isPlayingState;
  }

  public speak(
    text: string,
    characterGender: VoiceGender,
    settings: VoiceSettings,
    callbacks: {
      mood?: CharacterMood;
      customEmotions?: CustomEmotionDefinition[];
      onStart?: (engineUsed: 'speech' | 'synth', profile: ResolvedVoiceProfile) => void;
      onEnd?: () => void;
    }
  ): void {
    this.stop();
    const profile = computeVoiceProfile(
      characterGender,
      settings,
      callbacks.mood,
      callbacks.customEmotions || []
    );
    const hasSpeechAPI = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const bengaliSystemVoice = hasSpeechAPI
      ? pickBestSystemVoice(profile.gender, settings.selectedSpeechVoiceURI)
      : null;

    const shouldUseSpeech =
      hasSpeechAPI &&
      (settings.engineMode === 'speech' ||
        (settings.engineMode === 'auto' && bengaliSystemVoice !== null));

    if (shouldUseSpeech) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        if (bengaliSystemVoice) {
          utterance.voice = bengaliSystemVoice;
          utterance.lang = bengaliSystemVoice.lang;
        } else {
          utterance.lang = 'bn-BD';
        }
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = 1;

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          this.isPlayingState = false;
          this.stopCallback = null;
          callbacks.onEnd?.();
        };

        utterance.onend = finish;
        utterance.onerror = () => {
          // Gracefully fall back to built-in acoustic formant synth if OS speech fails
          if (!settled && settings.engineMode === 'auto') {
            settled = true;
            this.playAcousticProsody(text, profile, callbacks);
          } else {
            finish();
          }
        };

        this.isPlayingState = true;
        this.stopCallback = () => {
          settled = true;
          callbacks.onEnd?.();
        };
        callbacks.onStart?.('speech', profile);
        window.speechSynthesis.speak(utterance);

        // Safety timeout in case browser speechSynthesis stalls without firing onend
        const estimatedMs = Math.max(2500, Math.min(25000, text.length * 95));
        const guardId = window.setTimeout(() => {
          if (this.isPlayingState && !window.speechSynthesis.speaking) {
            finish();
          }
        }, estimatedMs);
        this.activeTimerIds.push(guardId);
        return;
      } catch {
        // Fallback to built-in acoustic synth below
      }
    }

    this.playAcousticProsody(text, profile, callbacks);
  }

  /**
   * 100% self-contained Web Audio API Bengali syllable-cadence formant synthesizer.
   * Produces distinct warm female (soprano/alto) and male (baritone) vocal contours
   * matching Bengali punctuation and word rhythm without any external APIs.
   */
  private playAcousticProsody(
    text: string,
    profile: ResolvedVoiceProfile,
    callbacks: {
      onStart?: (engineUsed: 'speech' | 'synth', profile: ResolvedVoiceProfile) => void;
      onEnd?: () => void;
    }
  ): void {
    this.isPlayingState = true;
    this.stopCallback = () => callbacks.onEnd?.();
    callbacks.onStart?.('synth', profile);

    const words = text
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean)
      .slice(0, 28); // Keep acoustic preview crisp and pleasant

    const stepMs = Math.round(170 / profile.rate);
    const totalDurationMs = Math.max(900, words.length * stepMs + 280);

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      if (ctx) {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.08, now);
        masterGain.connect(ctx.destination);

        words.forEach((word, index) => {
          const startTime = now + (index * stepMs) / 1000;
          const dur = (stepMs * 0.72) / 1000;

          // Subtle Bengali intonation contour (rising on questions, falling at '।')
          const isQuestion = word.includes('?') || word.includes('কী');
          const isSentenceEnd = word.includes('।') || word.includes('!');
          const phraseContour =
            isQuestion ? 1.14 : isSentenceEnd ? 0.91 : 1 + Math.sin(index * 0.85) * 0.06;

          const freq = profile.baseFrequencyHz * phraseContour;

          const osc = ctx.createOscillator();
          const subOsc = ctx.createOscillator();
          const formantFilter = ctx.createBiquadFilter();
          const env = ctx.createGain();

          osc.type = profile.gender === 'female' ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, startTime);

          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(freq * (profile.gender === 'female' ? 2 : 0.5), startTime);

          formantFilter.type = 'bandpass';
          formantFilter.frequency.setValueAtTime(
            profile.formant1Hz + (index % 3) * 140,
            startTime
          );
          formantFilter.Q.setValueAtTime(2.6, startTime);

          env.gain.setValueAtTime(0.001, startTime);
          env.gain.exponentialRampToValueAtTime(0.32, startTime + 0.025);
          env.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

          osc.connect(formantFilter);
          subOsc.connect(formantFilter);
          formantFilter.connect(env);
          env.connect(masterGain);

          osc.start(startTime);
          subOsc.start(startTime);
          osc.stop(startTime + dur + 0.02);
          subOsc.stop(startTime + dur + 0.02);

          this.activeOscillators.push(osc, subOsc);
        });
      }
    } catch {
      // Even if AudioContext is blocked, keep visual speaking timer accurate
    }

    const endTimer = window.setTimeout(() => {
      this.isPlayingState = false;
      this.activeOscillators = [];
      this.stopCallback = null;
      callbacks.onEnd?.();
    }, totalDurationMs);
    this.activeTimerIds.push(endTimer);
  }
}

export const voicePlayer = new LocalVoicePlayer();

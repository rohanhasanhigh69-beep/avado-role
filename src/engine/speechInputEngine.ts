export interface SpeechRecognitionResultCallback {
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
  onStateChange?: (isListening: boolean) => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export type SpeechLangCode = 'bn-BD' | 'bn-IN' | 'en-US';

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSpeechInputSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

/**
 * Checks whether microphone permission is allowed in browser without holding
 * an open audio stream lock that would collide with Android SpeechRecognition.
 */
export async function probeMicrophonePermission(): Promise<
  'granted' | 'denied' | 'prompt' | 'unknown'
> {
  if (typeof navigator === 'undefined') return 'unknown';
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        return status.state;
      }
    }
  } catch {
    // Safari / some mobile WebViews do not support querying 'microphone'
  }
  return 'unknown';
}

class LocalSpeechInputManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListeningState = false;
  private latestInterim = '';
  private emittedFinalThisSession = false;
  private flushTimerId: number | null = null;
  private activeCallbacks: SpeechRecognitionResultCallback | null = null;

  public isListening(): boolean {
    return this.isListeningState;
  }

  private clearFlushTimer(): void {
    if (this.flushTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.flushTimerId);
      this.flushTimerId = null;
    }
  }

  public stop(): void {
    this.clearFlushTimer();
    this.isListeningState = false;
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      try {
        rec.onend = null;
        rec.onerror = null;
        rec.onresult = null;
        rec.stop();
      } catch {
        // Ignore stop errors
      }
    }

    // Flush any pending interim speech on manual stop so PC Chrome never drops captured words
    if (!this.emittedFinalThisSession && this.latestInterim.trim()) {
      const pending = this.latestInterim.trim();
      this.latestInterim = '';
      this.emittedFinalThisSession = true;
      this.activeCallbacks?.onFinal?.(pending);
    }
  }

  public start(
    lang: SpeechLangCode = 'bn-BD',
    callbacks: SpeechRecognitionResultCallback,
    isFallbackAttempt = false
  ): boolean {
    this.stop();
    this.latestInterim = '';
    this.emittedFinalThisSession = false;
    this.activeCallbacks = callbacks;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      callbacks.onError?.(
        'Voice input (Web Speech API) is not available in this mobile WebView/browser. Try opening in Chrome, or type in Banglish/Bengali below — character voice replies still play aloud!'
      );
      callbacks.onStateChange?.(false);
      return false;
    }

    const launchRecognition = (activeLang: SpeechLangCode) => {
      try {
        const rec = new Ctor();
        rec.lang = activeLang;
        // continuous = true prevents premature cutoff on PC before sentence finishes
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          this.isListeningState = true;
          callbacks.onStateChange?.(true);
        };

        rec.onresult = (event) => {
          this.clearFlushTimer();
          let interim = '';
          let finalChunk = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const transcript = res[0]?.transcript || '';
            if (res.isFinal) {
              finalChunk += `${transcript} `;
            } else {
              interim += `${transcript} `;
            }
          }

          if (finalChunk.trim()) {
            this.latestInterim = '';
            this.emittedFinalThisSession = true;
            const cleanFinal = finalChunk.trim();
            // Stop cleanly before invoking reply so speaker output doesn't echo back into mic
            this.recognition = null;
            this.isListeningState = false;
            try {
              rec.onend = null;
              rec.stop();
            } catch {
              // Ignore
            }
            callbacks.onStateChange?.(false);
            callbacks.onFinal?.(cleanFinal);
            return;
          }

          if (interim.trim()) {
            this.latestInterim = interim.trim();
            callbacks.onInterim?.(this.latestInterim);

            // PC Chrome fix: if user stops speaking and Chrome holds interim text without firing isFinal,
            // auto-commit after 1.5s of silence so the character replies reliably!
            this.flushTimerId = window.setTimeout(() => {
              if (this.isListeningState && this.latestInterim.trim() && !this.emittedFinalThisSession) {
                const committed = this.latestInterim.trim();
                this.latestInterim = '';
                this.emittedFinalThisSession = true;
                this.recognition = null;
                this.isListeningState = false;
                try {
                  rec.onend = null;
                  rec.stop();
                } catch {
                  // Ignore
                }
                callbacks.onStateChange?.(false);
                callbacks.onFinal?.(committed);
              }
            }, 1500);
          }
        };

        rec.onerror = (event) => {
          this.clearFlushTimer();
          this.isListeningState = false;
          this.recognition = null;

          // Automatic fallback if bn-BD isn't supported on mobile/OS speech service
          if (
            !isFallbackAttempt &&
            (event.error === 'language-not-supported' || event.error === 'service-not-allowed')
          ) {
            const nextLang: SpeechLangCode = activeLang === 'bn-BD' ? 'en-US' : 'bn-IN';
            this.start(nextLang, callbacks, true);
            return;
          }

          callbacks.onStateChange?.(false);

          if (event.error === 'not-allowed') {
            callbacks.onError?.(
              'Microphone access is blocked by this embedded preview or browser. Open the app directly in Chrome (new tab) or enable Microphone in site settings, or type in Banglish/Bengali below.'
            );
          } else if (event.error === 'service-not-allowed') {
            callbacks.onError?.(
              'Mobile browser speech service is unavailable inside this view. Open in Chrome or type in Banglish/Bengali below.'
            );
          } else if (event.error === 'audio-capture') {
            callbacks.onError?.(
              'No active microphone device was detected or another app is using the mic.'
            );
          } else if (event.error === 'no-speech') {
            // If interim text existed, commit it instead of failing!
            if (this.latestInterim.trim() && !this.emittedFinalThisSession) {
              const committed = this.latestInterim.trim();
              this.latestInterim = '';
              this.emittedFinalThisSession = true;
              callbacks.onFinal?.(committed);
            } else {
              callbacks.onError?.(
                'No speech heard. Speak closer to the mic (or switch Mic Language between Bangla / Banglish-EN) or type below.'
              );
            }
          } else if (event.error === 'network') {
            callbacks.onError?.(
              'Browser speech-to-text needs an active speech service connection. Text chat works 100% offline anytime.'
            );
          } else if (event.error !== 'aborted') {
            callbacks.onError?.(
              `Voice capture stopped (${event.error}). You can keep chatting via text below.`
            );
          }
        };

        rec.onend = () => {
          this.clearFlushTimer();
          this.isListeningState = false;
          this.recognition = null;
          callbacks.onStateChange?.(false);

          if (!this.emittedFinalThisSession && this.latestInterim.trim()) {
            const committed = this.latestInterim.trim();
            this.latestInterim = '';
            this.emittedFinalThisSession = true;
            callbacks.onFinal?.(committed);
          }
        };

        this.recognition = rec;
        rec.start();
        return true;
      } catch {
        this.isListeningState = false;
        callbacks.onStateChange?.(false);
        callbacks.onError?.(
          'Could not start microphone recognition in this view. Try opening in a new tab or use text chat below.'
        );
        return false;
      }
    };

    // Preflight permission check without blocking user gesture or locking audio stream
    void probeMicrophonePermission().then((perm) => {
      if (perm === 'denied' && this.isListeningState) {
        this.stop();
        callbacks.onError?.(
          'Microphone permission is blocked in browser site settings. Allow Microphone access and reload.'
        );
      }
    });

    return launchRecognition(lang);
  }
}

export const speechInput = new LocalSpeechInputManager();

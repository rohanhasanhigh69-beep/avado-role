import { useEffect, useState } from 'react';
import { Volume2, Square, CheckCircle2 } from 'lucide-react';
import {
  BrowserVoiceInfo,
  computeVoiceProfile,
  listAvailableBrowserVoices,
  voicePlayer,
} from '../engine/voiceEngine';
import { SpeechLangCode } from '../engine/speechInputEngine';
import { VoiceEngineMode, VoiceGender, VoiceSettings } from '../types/roleplay';

interface VoiceLabProps {
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (patch: Partial<VoiceSettings>) => void;
}

export function VoiceLab({ voiceSettings, onUpdateVoiceSettings }: VoiceLabProps) {
  const [browserVoices, setBrowserVoices] = useState<BrowserVoiceInfo[]>([]);
  const [femaleSample, setFemaleSample] = useState(
    'বৃষ্টিভেজা সন্ধ্যায় এক কাপ গরম চা আর প্রিয় গল্পের চেয়ে সুন্দর আর কী হতে পারে?'
  );
  const [maleSample, setMaleSample] = useState(
    'রাত গভীর হয়েছে, শহরের কোলাহল থেমে গেছে—এখন শুধু সুর আর আমাদের মনের কথা।'
  );
  const [testingGender, setTestingGender] = useState<VoiceGender | null>(null);
  const [lastEngineUsed, setLastEngineUsed] = useState<'speech' | 'synth' | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      setBrowserVoices(listAvailableBrowserVoices());
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
    return undefined;
  }, []);

  const bengaliVoices = browserVoices.filter((v) => v.isBengali);
  const femaleProfile = computeVoiceProfile('female', {
    ...voiceSettings,
    genderOverride: 'female',
  });
  const maleProfile = computeVoiceProfile('male', {
    ...voiceSettings,
    genderOverride: 'male',
  });

  const handleAudition = (gender: VoiceGender) => {
    if (testingGender === gender) {
      voicePlayer.stop();
      setTestingGender(null);
      return;
    }

    const text = gender === 'female' ? femaleSample : maleSample;
    voicePlayer.speak(
      text,
      gender,
      { ...voiceSettings, genderOverride: gender },
      {
        onStart: (engine) => {
          setTestingGender(gender);
          setLastEngineUsed(engine);
        },
        onEnd: () => {
          setTestingGender(null);
        },
      }
    );
  };

  return (
    <section aria-labelledby="voicelab-heading" className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-xs font-medium text-slate-500">
          API-Free Dual Voice Engine · Browser Speech & Web Audio Formant Synth
        </p>
        <h1
          id="voicelab-heading"
          className="font-editorial mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          Female & Male Voice Studio
        </h1>
      </div>

      {/* Female vs Male Side-by-Side Audition */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-editorial text-xl font-bold text-slate-900">Female Voice</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Pitch: <span className="font-tabular">{femaleProfile.pitch}</span> · Formant:{' '}
                <span className="font-tabular">{femaleProfile.baseFrequencyHz} Hz</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateVoiceSettings({ genderOverride: 'female' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                voiceSettings.genderOverride === 'female'
                  ? 'bg-rose-600 text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {voiceSettings.genderOverride === 'female' ? 'Active Global Voice' : 'Use for All Characters'}
            </button>
          </div>

          <label htmlFor="female-sample-text" className="mt-4 block text-xs font-medium text-slate-700">
            Sample Bengali / Banglish Line (Female)
          </label>
          <textarea
            id="female-sample-text"
            rows={3}
            value={femaleSample}
            onChange={(e) => setFemaleSample(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
          />

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleAudition('female')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                testingGender === 'female' ? 'bg-rose-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {testingGender === 'female' ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>Test Female Voice</span>
                </>
              )}
            </button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-editorial text-xl font-bold text-slate-900">Male Voice</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Pitch: <span className="font-tabular">{maleProfile.pitch}</span> · Formant:{' '}
                <span className="font-tabular">{maleProfile.baseFrequencyHz} Hz</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateVoiceSettings({ genderOverride: 'male' })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                voiceSettings.genderOverride === 'male'
                  ? 'bg-blue-700 text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {voiceSettings.genderOverride === 'male' ? 'Active Global Voice' : 'Use for All Characters'}
            </button>
          </div>

          <label htmlFor="male-sample-text" className="mt-4 block text-xs font-medium text-slate-700">
            Sample Bengali / Banglish Line (Male)
          </label>
          <textarea
            id="male-sample-text"
            rows={3}
            value={maleSample}
            onChange={(e) => setMaleSample(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
          />

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleAudition('male')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                testingGender === 'male' ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {testingGender === 'male' ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>Test Male Voice</span>
                </>
              )}
            </button>
          </div>
        </article>
      </div>

      {/* Engine Configuration & Mic Recognition Language */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Voice & Microphone Engine Tuning</h2>
          <p className="mt-1 text-xs text-slate-600">
            Runs locally inside your browser using native Speech Synthesis, Web Audio Synth, and Web Speech Recognition.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="engine-mode-select" className="block text-xs font-medium text-slate-700">
                Output Engine
              </label>
              <select
                id="engine-mode-select"
                value={voiceSettings.engineMode}
                onChange={(e) =>
                  onUpdateVoiceSettings({ engineMode: e.target.value as VoiceEngineMode })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="auto">Auto (OS Voice / Built-in Synth)</option>
                <option value="speech">Browser Speech API (OS Voice)</option>
                <option value="synth">Built-in Acoustic Synth</option>
              </select>
            </div>

            <div>
              <label htmlFor="default-gender-select" className="block text-xs font-medium text-slate-700">
                Voice Gender Rule
              </label>
              <select
                id="default-gender-select"
                value={voiceSettings.genderOverride}
                onChange={(e) =>
                  onUpdateVoiceSettings({
                    genderOverride: e.target.value as 'character' | VoiceGender,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="character">Match Character (Female / Male)</option>
                <option value="female">Always Female Voice</option>
                <option value="male">Always Male Voice</option>
              </select>
            </div>

            <div>
              <label htmlFor="mic-lang-select" className="block text-xs font-medium text-slate-700">
                Live Mic Language
              </label>
              <select
                id="mic-lang-select"
                value={voiceSettings.speechLang || 'bn-BD'}
                onChange={(e) =>
                  onUpdateVoiceSettings({ speechLang: e.target.value as SpeechLangCode })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="bn-BD">Bangla (bn-BD)</option>
                <option value="bn-IN">Bengali (bn-IN)</option>
                <option value="en-US">Banglish / English (en-US)</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="lab-rate" className="font-medium text-slate-700">
                  Speaking Speed
                </label>
                <span className="font-tabular text-slate-600">{voiceSettings.rate.toFixed(2)}x</span>
              </div>
              <input
                id="lab-rate"
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={voiceSettings.rate}
                onChange={(e) => onUpdateVoiceSettings({ rate: parseFloat(e.target.value) })}
                className="mt-1.5 w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="lab-pitch" className="font-medium text-slate-700">
                  Voice Pitch
                </label>
                <span className="font-tabular text-slate-600">{voiceSettings.pitch.toFixed(2)}</span>
              </div>
              <input
                id="lab-pitch"
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={voiceSettings.pitch}
                onChange={(e) => onUpdateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                className="mt-1.5 w-full accent-blue-600"
              />
            </div>
          </div>

          {lastEngineUsed && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>
                Last played via:{' '}
                {lastEngineUsed === 'speech'
                  ? 'Browser Bengali Speech Voice'
                  : 'Built-in Acoustic Formant Synth'}
              </span>
            </p>
          )}
        </div>

        {/* Detected Local Voices */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Device Speech Voices</h2>
          <p className="mt-1 text-xs text-slate-600">
            Detected Bengali Voices: <span className="font-tabular font-semibold">{bengaliVoices.length}</span>
            {' · '}Total OS Voices: <span className="font-tabular font-semibold">{browserVoices.length}</span>
          </p>

          {bengaliVoices.length > 0 ? (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto studio-scroll">
              {bengaliVoices.map((voice) => {
                const isSelected = voiceSettings.selectedSpeechVoiceURI === voice.voiceURI;
                return (
                  <button
                    key={voice.voiceURI}
                    type="button"
                    onClick={() =>
                      onUpdateVoiceSettings({
                        selectedSpeechVoiceURI: isSelected ? undefined : voice.voiceURI,
                      })
                    }
                    className={`w-full rounded-lg border p-2.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold text-slate-900 truncate">{voice.name}</p>
                    <p className="mt-0.5 text-slate-500">
                      {voice.lang} · Inferred:{' '}
                      {voice.inferredGender === 'female' ? 'Female Voice' : 'Male Voice'}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
              No dedicated Bengali OS voice (`bn-BD` / `bn-IN`) is installed in this browser. No worries — the built-in Acoustic Formant Synthesizer automatically generates distinct Female and Male vocal tones. On Windows/Android Chrome with Bengali TTS voices installed, natural spoken Bengali plays automatically.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

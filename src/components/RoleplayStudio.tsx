import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Send,
  Volume2,
  VolumeX,
  Square,
  RotateCcw,
  Settings,
  Sparkles,
  SlidersHorizontal,
  Download,
  Mic,
  MicOff,
  Wand2,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  ChatMessage,
  RoleplayCharacter,
  RoleplaySetupDraft,
  SessionMemory,
  VoiceGender,
  VoiceSettings,
} from '../types/roleplay';
import { SpeechLangCode } from '../engine/speechInputEngine';
import { CharacterAvatar } from './CharacterAvatar';

export interface SetupChatMessage {
  id: string;
  sender: 'user' | 'director';
  text: string;
}

interface RoleplayStudioProps {
  characters: RoleplayCharacter[];
  activeCharacter: RoleplayCharacter;
  messages: ChatMessage[];
  memory: SessionMemory;
  followUps: string[];
  voiceSettings: VoiceSettings;
  speakingMessageId: string | null;
  activeVoiceEngineLabel: string | null;
  isLiveTalkOn: boolean;
  isMicListening: boolean;
  liveTranscript: string;
  micError: string | null;
  isSetupMode: boolean;
  setupMessages: SetupChatMessage[];
  setupDraft: RoleplaySetupDraft | null;
  onSendSetupMessage: (text: string) => void;
  onOpenSetupChat: () => void;
  onCloseSetupChat: () => void;
  onToggleLiveTalk: () => void;
  onDismissMicError: () => void;
  onSelectCharacter: (characterId: string) => void;
  onSendMessage: (text: string) => void;
  onSpeakMessage: (message: ChatMessage) => void;
  onRateMessage?: (message: ChatMessage, reward: 1 | -1) => void;
  onStopSpeaking: () => void;
  onUpdateVoiceSettings: (patch: Partial<VoiceSettings>) => void;
  onResetSession: () => void;
}

const CHARACTER_STARTERS = [
  'amar nam Rohan, tumi amar mayer roleplay korbe. tomar nam Rabeya, boyosh 38, choritro khub adorer kintu shashon koro',
  'amar nam Rafi, tomar nam Nila, amar gf roleplay korbe. boyosh 22, khub abhimani ar care kore',
  'amar nam Tanvir, tomar nam Sadman, amar best friend roleplay korbe',
];

const SCENARIO_STARTERS = [
  'shuru hobe sokale nasta niye, tarpor ami phone e busy thakbo ar tumi bokba, tarpor sorry bole milbo',
  'ratre derite bashay firbo, tumi chinta korba ar shashon korba, tarpor eksathe bhat khabo',
];

export function RoleplayStudio({
  characters,
  activeCharacter,
  messages,
  memory,
  followUps,
  voiceSettings,
  speakingMessageId,
  activeVoiceEngineLabel,
  isLiveTalkOn,
  isMicListening,
  liveTranscript,
  micError,
  isSetupMode,
  setupMessages,
  setupDraft,
  onSendSetupMessage,
  onOpenSetupChat,
  onCloseSetupChat,
  onToggleLiveTalk,
  onDismissMicError,
  onSelectCharacter,
  onSendMessage,
  onSpeakMessage,
  onRateMessage,
  onStopSpeaking,
  onUpdateVoiceSettings,
  onResetSession,
}: RoleplayStudioProps) {
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsText, setSettingsText] = useState('');
  const [setupInputText, setSetupInputText] = useState('');
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [ratedIds, setRatedIds] = useState<Record<string, 1 | -1>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const setupEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setupInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSetupMode) {
      setupEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, setupMessages.length, activeCharacter.id, isSetupMode]);

  const effectiveGender: VoiceGender =
    voiceSettings.genderOverride === 'character'
      ? activeCharacter.gender
      : voiceSettings.genderOverride;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleSetupSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = setupInputText.trim();
    if (!trimmed) return;
    onSendSetupMessage(trimmed);
    setSetupInputText('');
    setupInputRef.current?.focus();
  };

  const handleExportTranscript = () => {
    const lines = messages.map((m) => {
      const who = m.sender === 'user' ? memory.userName || 'You' : activeCharacter.name;
      const actionLine = m.action ? ` [${m.action}]` : '';
      return `${who}${actionLine}: ${m.text}`;
    });
    const content = `Kothamala — Offline Bengali & Banglish Roleplay Transcript\nCharacter: ${activeCharacter.name} (${activeCharacter.role})\nSetting: ${activeCharacter.setting}\n\n${lines.join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeCharacter.id}-roleplay-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const phaseLabel =
    memory.scenarioArc?.currentPhase === 'opening'
      ? 'Opening'
      : memory.scenarioArc?.currentPhase === 'developing'
        ? 'Developing'
        : memory.scenarioArc?.currentPhase === 'resolution'
          ? 'Resolution'
          : null;

  return (
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 overflow-x-hidden">
      {/* Left Sidebar: Character Roster */}
      <aside
        aria-label="Character Roster"
        className="w-full max-w-full min-w-0 lg:col-span-3 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
      >
        <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Roleplay Characters</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              100% offline instant reply · {characters.length} personas
            </p>
          </div>
          {!isSetupMode && (
            <button
              type="button"
              onClick={onOpenSetupChat}
              className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 whitespace-nowrap shrink-0"
            >
              + Setup Chat
            </button>
          )}
        </div>

        {/* Horizontal scroll on mobile, vertical list on desktop */}
        <div className="flex w-full max-w-full min-w-0 lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto p-2.5 lg:p-3 lg:max-h-[680px] studio-scroll">
          {characters.map((char) => {
            const isSelected = !isSetupMode && char.id === activeCharacter.id;
            const voiceText = char.gender === 'female' ? 'Female Voice' : 'Male Voice';

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char.id)}
                aria-pressed={isSelected}
                className={`flex min-w-[210px] lg:min-w-0 items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <CharacterAvatar
                  src={char.avatarUrl}
                  alt={char.name}
                  name={char.name}
                  accentHex={char.accentHex}
                  className="h-11 w-11 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{char.name}</p>
                  <p className="truncate text-xs text-slate-500">{char.role}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                    {voiceText}
                    {char.isCustom ? ' · Custom' : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Center Column: Setup Director Chat OR Active Roleplay Dialogue Stage */}
      <section
        aria-label={isSetupMode ? 'Roleplay Setup Director' : 'Roleplay Dialogue Stage'}
        className="w-full max-w-full min-w-0 lg:col-span-6 flex h-[560px] sm:h-[640px] lg:h-[740px] flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
      >
        {isSetupMode ? (
          <>
            {/* Setup Director Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0">
                  <Wand2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-editorial truncate text-lg font-bold text-slate-900">
                    Roleplay Setup Director
                  </h1>
                  <p className="truncate text-xs text-slate-600">
                    Banglish, Bengali & English supported · Define character, age, traits & scenario
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseSetupChat}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <span>Open Character Chat</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Setup Chat Stream */}
            <div
              data-testid="setup-message-list"
              className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 studio-scroll"
            >
              {setupMessages.map((msg) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[84%] rounded-2xl rounded-br-xs bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white">
                        <p>{msg.text}</p>
                        <p className="mt-1 text-[11px] text-slate-300 text-right">You</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <article key={msg.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-tl-xs border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                      <p className="text-[14px] leading-relaxed text-slate-900">{msg.text}</p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Roleplay Setup Director · Offline Local Parser
                      </p>
                    </div>
                  </article>
                );
              })}
              <div ref={setupEndRef} />
            </div>

            {/* Live Talk strip in Setup Mode */}
            {(isLiveTalkOn || isMicListening || micError) && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-center justify-between gap-2 border-t px-4 py-2 text-xs ${
                  micError
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-rose-100 bg-rose-50/70 text-rose-900'
                }`}
              >
                {micError ? (
                  <>
                    <span>{micError}</span>
                    <button
                      type="button"
                      onClick={onDismissMicError}
                      className="font-semibold underline shrink-0"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium">
                      {isMicListening
                        ? liveTranscript
                          ? `Listening: "${liveTranscript}"`
                          : 'Microphone listening — speak clearly or type below...'
                        : 'Live Mic active'}
                    </span>
                    <button
                      type="button"
                      onClick={onToggleLiveTalk}
                      className="font-semibold text-rose-800 hover:underline shrink-0"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Quick Setup / Scenario Starter Chips */}
            <div className="min-w-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap shrink-0">
                  {setupDraft?.step === 'awaiting_scenario' ? 'Sample scenarios:' : 'Quick examples:'}
                </span>
                {(setupDraft?.step === 'awaiting_scenario'
                  ? SCENARIO_STARTERS
                  : CHARACTER_STARTERS
                ).map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => onSendSetupMessage(example)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-700 whitespace-nowrap shrink-0"
                  >
                    {example.length > 54 ? `${example.slice(0, 54)}...` : example}
                  </button>
                ))}
              </div>
            </div>

            {/* Setup Composer */}
            <form
              onSubmit={handleSetupSubmit}
              className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 sm:px-5"
            >
              <button
                type="button"
                onClick={onToggleLiveTalk}
                aria-label={isLiveTalkOn ? 'Stop Live Mic' : 'Speak setup prompt using microphone'}
                title={isLiveTalkOn ? 'Stop Live Mic' : 'Speak setup prompt using microphone'}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                  isLiveTalkOn
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isLiveTalkOn ? (
                  <MicOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Mic className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <label htmlFor="setup-chat-input" className="sr-only">
                Describe roleplay character or scenario in Banglish, Bengali, or English
              </label>
              <input
                id="setup-chat-input"
                ref={setupInputRef}
                type="text"
                value={setupInputText}
                onChange={(e) => setSetupInputText(e.target.value)}
                placeholder={
                  setupDraft?.step === 'awaiting_scenario'
                    ? 'Tell me the scenario (how it starts, develops, and ends)...'
                    : 'e.g. amar nam Rohan, tumi amar mayer roleplay korbe, tomar nam Rabeya...'
                }
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!setupInputText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shrink-0"
              >
                <span>{setupDraft?.step === 'awaiting_scenario' ? 'Start Roleplay' : 'Next'}</span>
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Active Character Stage Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <CharacterAvatar
                  src={activeCharacter.avatarUrl}
                  alt={activeCharacter.name}
                  name={activeCharacter.name}
                  accentHex={activeCharacter.accentHex}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-editorial truncate text-lg font-bold text-slate-900">
                      {activeCharacter.name}
                    </h1>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      · {memory.currentMood}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-600">
                    {activeCharacter.role} ·{' '}
                    {effectiveGender === 'female' ? 'Female Voice Active' : 'Male Voice Active'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onToggleLiveTalk}
                  aria-pressed={isLiveTalkOn}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isLiveTalkOn
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {isLiveTalkOn ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Stop Live</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Live Talk</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateVoiceSettings({ autoSpeak: !voiceSettings.autoSpeak })
                  }
                  aria-pressed={voiceSettings.autoSpeak}
                  aria-label={
                    voiceSettings.autoSpeak ? 'Mute auto voice' : 'Enable auto voice'
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    voiceSettings.autoSpeak
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {voiceSettings.autoSpeak ? (
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{voiceSettings.autoSpeak ? 'Voice On' : 'Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMobileControls((prev) => !prev)}
                  className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  aria-expanded={showMobileControls}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Voice & Story</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  aria-label="Open roleplay settings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={onResetSession}
                  aria-label="Reset conversation with this character"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Collapsible Mobile/Tablet Inspector Drawer */}
            {showMobileControls && (
              <div className="lg:hidden border-b border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">Voice Gender:</span>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateVoiceSettings({ genderOverride: 'female' })}
                      className={`rounded px-2.5 py-1 text-xs font-medium ${
                        effectiveGender === 'female'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Female Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateVoiceSettings({ genderOverride: 'male' })}
                      className={`rounded px-2.5 py-1 text-xs font-medium ${
                        effectiveGender === 'male'
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Male Voice
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="mobile-mic-lang" className="text-xs font-semibold text-slate-700">
                    Mic Language:
                  </label>
                  <select
                    id="mobile-mic-lang"
                    value={voiceSettings.speechLang || 'bn-BD'}
                    onChange={(e) =>
                      onUpdateVoiceSettings({ speechLang: e.target.value as SpeechLangCode })
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
                  >
                    <option value="bn-BD">Bangla (bn-BD)</option>
                    <option value="bn-IN">Bengali (bn-IN)</option>
                    <option value="en-US">Banglish / English (en-US)</option>
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                  <p>
                    Mood: <span className="font-semibold text-slate-900">{memory.currentMood}</span>
                    {memory.lastUserEmotion ? (
                      <>
                        {' '}
                        · Detected Emotion:{' '}
                        <span className="font-semibold text-slate-900">{memory.lastUserEmotion}</span>
                      </>
                    ) : null}
                  </p>
                  {memory.lastUnderstoodWords && memory.lastUnderstoodWords.length > 0 && (
                    <p className="mt-1 truncate">
                      Understood Words: {memory.lastUnderstoodWords.slice(0, 5).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCharacter.storyBranches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        onSendMessage(branch.promptText);
                        setShowMobileControls(false);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-blue-500"
                    >
                      {branch.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Stream */}
            <div
              data-testid="message-list"
              className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 studio-scroll"
            >
              {messages.map((msg) => {
                const isChar = msg.sender === 'character';
                const isSpeakingThis = speakingMessageId === msg.id;

                if (!isChar) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[82%] rounded-2xl rounded-br-xs bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white">
                        <p>{msg.text}</p>
                        <p className="mt-1.5 text-[11px] text-slate-300 text-right">
                          {memory.userName || 'You'}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <article key={msg.id} className="flex items-start gap-3">
                    <CharacterAvatar
                      src={activeCharacter.avatarUrl}
                      alt={activeCharacter.name}
                      name={activeCharacter.name}
                      accentHex={activeCharacter.accentHex}
                      className="mt-0.5 h-9 w-9 rounded-lg"
                    />
                    <div className="max-w-[85%] rounded-2xl rounded-tl-xs border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                      {msg.action && (
                        <p className="font-editorial mb-1.5 text-xs italic text-slate-500">
                          * {msg.action} *
                        </p>
                      )}
                      <p className="text-[15px] leading-relaxed text-slate-900">{msg.text}</p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-2.5">
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-500">
                            <span>{activeCharacter.name}</span>
                            <span aria-hidden="true"> · </span>
                            <span>
                              {effectiveGender === 'female' ? 'Female Voice' : 'Male Voice'}
                            </span>
                            {msg.mood ? (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>Mood: {msg.mood}</span>
                              </>
                            ) : null}
                            {msg.matchedTopic ? (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>{msg.matchedTopic}</span>
                              </>
                            ) : null}
                          </p>
                          {msg.understoodWords && msg.understoodWords.length > 0 && (
                            <p className="mt-0.5 truncate text-[11px] text-slate-400">
                              Understood: {msg.understoodWords.slice(0, 5).join(', ')}
                              {msg.detectedUserEmotion ? ` · Emotion: ${msg.detectedUserEmotion}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onRateMessage && msg.id !== `msg-${activeCharacter.id}-greeting` && (
                            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (ratedIds[msg.id] === 1) return;
                                  setRatedIds((prev) => ({ ...prev, [msg.id]: 1 }));
                                  onRateMessage(msg, 1);
                                }}
                                aria-label="Train AI: Helpful realistic reply"
                                title="Reinforce realistic reply in Local ML"
                                className={`rounded p-1 transition-colors ${
                                  ratedIds[msg.id] === 1
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'text-slate-400 hover:text-emerald-700'
                                }`}
                              >
                                <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (ratedIds[msg.id] === -1) return;
                                  setRatedIds((prev) => ({ ...prev, [msg.id]: -1 }));
                                  onRateMessage(msg, -1);
                                }}
                                aria-label="Train AI: Downrank reply"
                                title="Adjust tone in Local ML"
                                className={`rounded p-1 transition-colors ${
                                  ratedIds[msg.id] === -1
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'text-slate-400 hover:text-rose-700'
                                }`}
                              >
                                <ThumbsDown className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => (isSpeakingThis ? onStopSpeaking() : onSpeakMessage(msg))}
                            aria-label={
                              isSpeakingThis
                                ? `Stop speaking for ${activeCharacter.name}`
                                : `Listen to ${activeCharacter.name}`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                              isSpeakingThis
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSpeakingThis ? (
                              <>
                                <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Live Talk Listening / Interim Speech Strip */}
            {(isLiveTalkOn || isMicListening || micError) && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-center justify-between gap-2 border-t px-4 py-2 text-xs ${
                  micError
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-rose-100 bg-rose-50/70 text-rose-900'
                }`}
              >
                {micError ? (
                  <>
                    <span>{micError}</span>
                    <button
                      type="button"
                      onClick={onDismissMicError}
                      className="font-semibold underline shrink-0"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium">
                      {isMicListening
                        ? liveTranscript
                          ? `Listening: "${liveTranscript}"`
                          : `Mic listening (${voiceSettings.speechLang || 'bn-BD'}) — speak now or type below...`
                        : speakingMessageId
                          ? 'Resuming mic automatically after reply finishes...'
                          : 'Live Talk Active'}
                    </span>
                    <button
                      type="button"
                      onClick={onToggleLiveTalk}
                      className="font-semibold text-rose-800 hover:underline shrink-0"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Active Voice Feedback Strip */}
            {speakingMessageId && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-between border-t border-blue-100 bg-blue-50/70 px-4 py-2 text-xs text-blue-900"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {effectiveGender === 'female' ? 'Female Voice' : 'Male Voice'} speaking...
                  </span>
                  {activeVoiceEngineLabel && (
                    <span className="text-blue-700">({activeVoiceEngineLabel})</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onStopSpeaking}
                  className="font-semibold text-blue-800 hover:underline"
                >
                  Stop
                </button>
              </div>
            )}

            {/* Quick Reply / Follow-up Chips */}
            {followUps.length > 0 && (
              <div className="min-w-0 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap shrink-0">
                    Suggested replies:
                  </span>
                  {followUps.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => onSendMessage(choice)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-700 whitespace-nowrap shrink-0"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer Form: Live Mic + Text Input Together */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 sm:px-5"
            >
              <button
                type="button"
                onClick={onToggleLiveTalk}
                aria-label={isLiveTalkOn ? 'Stop Live Talk' : 'Start Live Microphone Talk'}
                title={isLiveTalkOn ? 'Stop Live Talk' : 'Start Live Microphone Talk'}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                  isLiveTalkOn
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isLiveTalkOn ? (
                  <MicOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Mic className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <label htmlFor="roleplay-chat-input" className="sr-only">
                Type in Bengali or Banglish
              </label>
              <input
                id="roleplay-chat-input"
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type in Bengali or Banglish (e.g. ki koro ammu), or tap the mic..."
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shrink-0"
              >
                <span>Send</span>
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </>
        )}
      </section>

      {/* Right Inspector: Voice Settings, Story Branches, and Memory */}
      <aside
        aria-label="Voice & Story Controls"
        className="hidden lg:flex lg:col-span-3 flex-col gap-5"
      >
        {/* Voice & Mic Controls */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Voice & Mic Controls</h2>
            <span className="text-xs font-medium text-slate-500">
              {effectiveGender === 'female' ? 'Female Voice' : 'Male Voice'}
            </span>
          </div>

          <div
            role="group"
            aria-label="Select voice gender"
            className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => onUpdateVoiceSettings({ genderOverride: 'character' })}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                voiceSettings.genderOverride === 'character'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => onUpdateVoiceSettings({ genderOverride: 'female' })}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                voiceSettings.genderOverride === 'female'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Female
            </button>
            <button
              type="button"
              onClick={() => onUpdateVoiceSettings({ genderOverride: 'male' })}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                voiceSettings.genderOverride === 'male'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Male
            </button>
          </div>

          <div className="mt-3">
            <label htmlFor="studio-mic-lang-select" className="block text-xs font-medium text-slate-700">
              Live Mic Language
            </label>
            <select
              id="studio-mic-lang-select"
              value={voiceSettings.speechLang || 'bn-BD'}
              onChange={(e) =>
                onUpdateVoiceSettings({ speechLang: e.target.value as SpeechLangCode })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="bn-BD">Bangla (bn-BD)</option>
              <option value="bn-IN">Bengali (bn-IN)</option>
              <option value="en-US">Banglish / English (en-US)</option>
            </select>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="studio-rate-slider" className="font-medium text-slate-700">
                  Speaking Speed
                </label>
                <span className="font-tabular text-slate-500">{voiceSettings.rate.toFixed(2)}x</span>
              </div>
              <input
                id="studio-rate-slider"
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={voiceSettings.rate}
                onChange={(e) => onUpdateVoiceSettings({ rate: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="studio-pitch-slider" className="font-medium text-slate-700">
                  Voice Pitch
                </label>
                <span className="font-tabular text-slate-500">{voiceSettings.pitch.toFixed(2)}</span>
              </div>
              <input
                id="studio-pitch-slider"
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={voiceSettings.pitch}
                onChange={(e) => onUpdateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-blue-600"
              />
            </div>

            <label className="flex items-center justify-between gap-2 pt-1 text-xs font-medium text-slate-700 cursor-pointer">
              <span>Auto-speak every reply</span>
              <input
                type="checkbox"
                checked={voiceSettings.autoSpeak}
                onChange={(e) => onUpdateVoiceSettings({ autoSpeak: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>

            {!isSetupMode && messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const lastCharMsg = [...messages]
                    .reverse()
                    .find((m) => m.sender === 'character');
                  if (lastCharMsg) {
                    if (speakingMessageId === lastCharMsg.id) {
                      onStopSpeaking();
                    } else {
                      onSpeakMessage(lastCharMsg);
                    }
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Replay Latest Reply</span>
              </button>
            )}
          </div>
        </div>

        {isSetupMode ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">How Setup Director Works</h2>
            <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
              <li>
                <span className="font-semibold text-slate-900">1. Define Persona:</span> Share your
                name, who the AI plays (mother, gf, friend, spouse, sibling), name, age, and traits
                in Banglish, Bengali, or English.
              </li>
              <li>
                <span className="font-semibold text-slate-900">2. Set Scenario Arc:</span> Describe
                how the scene should start, develop in the middle, and end.
              </li>
              <li>
                <span className="font-semibold text-slate-900">3. Realistic Emotion:</span> The
                engine responds in Bengali with natural tone, memory, and boundary reactions.
              </li>
            </ol>
          </div>
        ) : (
          <>
            {/* Memory & Scenario Arc Status */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Memory & Story Status</h2>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Bond Affinity</span>
                  <span className="font-tabular font-semibold text-slate-900">
                    {memory.affinity}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${memory.affinity}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600">Turns</span>
                  <span className="font-tabular font-medium text-slate-800">{memory.turnCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Your Name</span>
                  <span className="font-medium text-slate-800">
                    {memory.userName ? memory.userName : 'Unknown (say "amar nam ...")'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Character Mood</span>
                  <span className="font-medium text-slate-900">{memory.currentMood}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Detected Emotion</span>
                  <span className="font-medium text-slate-800">
                    {memory.lastUserEmotion || 'Normal'}
                  </span>
                </div>

                {memory.scenarioArc && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Scenario Arc</span>
                      <span className="font-semibold text-blue-700">{phaseLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Start:</span>{' '}
                      {memory.scenarioArc.openingBeat}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Middle:</span>{' '}
                      {memory.scenarioArc.middleBeat}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">End:</span>{' '}
                      {memory.scenarioArc.endingBeat}
                    </p>
                  </div>
                )}

                <div className="pt-1 border-t border-slate-100">
                  <span className="block text-slate-600">Understood Words</span>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-800">
                    {memory.lastUnderstoodWords && memory.lastUnderstoodWords.length > 0
                      ? memory.lastUnderstoodWords.slice(0, 6).join(', ')
                      : 'Speak or write in Banglish/Bengali to analyze words'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportTranscript}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Transcript (.txt)</span>
              </button>
            </div>

            {/* Story Branches */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-900">Story Branches</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Trigger a natural plot twist or scene progression:
              </p>

              <div className="mt-3 space-y-2">
                {activeCharacter.storyBranches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => onSendMessage(branch.promptText)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-left transition-colors hover:border-blue-500 hover:bg-blue-50/40"
                  >
                    <p className="text-xs font-semibold text-slate-900">{branch.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600">
                      {branch.promptText}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>
    
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Roleplay Settings (Banglish)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Example: Ami Rohan, tumi Rahela. Amar boyosh 18, tomar boyosh 38, tumi amar ammu. Character: snhei but hot. Scenario: shuru te nighty pore door lock, majhe special care, end e creampie.
            </p>
            <textarea
              value={settingsText}
              onChange={(e) => setSettingsText(e.target.value)}
              placeholder="Ami Rohan, tumi Rahela. Amar boyosh 18, tomar boyosh 38, tumi amar ammu. Scenario: ..."
              className="mt-3 h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg border px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (settingsText.trim()) {
                    onSendSetupMessage(settingsText.trim());
                    setShowSettings(false);
                  }
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUILTIN_CHARACTERS } from './data/characters';
import { parseRoleplaySetupPrompt } from './engine/localIntelligence';
import { LocalMLModel, runSelfLearningSynthesis } from './engine/localML';
import {
  buildCharacterFromSetup,
  buildCharacterFromTrainedScenario,
  createInitialMemory,
  generateRoleplayReply,
} from './engine/roleplayEngine';
import { speechInput } from './engine/speechInputEngine';
import { voicePlayer } from './engine/voiceEngine';
import {
  ActiveTab,
  ChatMessage,
  CustomEmotionDefinition,
  LexiconEntry,
  MLFeedbackSample,
  MLSelfLearnedPattern,
  RoleplayCharacter,
  RoleplaySetupDraft,
  SessionMemory,
  TrainedConversationItem,
  TrainedScenario,
  VoiceSettings,
} from './types/roleplay';
import { TopBar } from './components/TopBar';
import { RoleplayStudio, SetupChatMessage } from './components/RoleplayStudio';
import { CharacterGallery } from './components/CharacterGallery';
import { TheatreStage } from './components/TheatreStage';
import { LocalTrainer } from './components/LocalTrainer';
import { VoiceLab } from './components/VoiceLab';
import { CustomCharacterBuilder } from './components/CustomCharacterBuilder';

const STORAGE_KEYS = {
  CUSTOM_CHARS: 'kothamala_custom_chars_v1',
  MESSAGES_BY_CHAR: 'kothamala_messages_v1',
  MEMORY_BY_CHAR: 'kothamala_memory_v1',
  FOLLOWUPS_BY_CHAR: 'kothamala_followups_v1',
  ACTIVE_CHAR: 'kothamala_active_char_v1',
  VOICE_SETTINGS: 'kothamala_voice_settings_v2',
  USER_LEXICON: 'kothamala_user_lexicon_v1',
  TRAINED_CONVS: 'kothamala_trained_conv_v1',
  TRAINED_SCENARIOS: 'kothamala_trained_scenarios_v1',
  ML_FEEDBACK: 'kothamala_ml_feedback_v1',
  ML_PATTERNS: 'kothamala_ml_patterns_v1',
  CUSTOM_EMOTIONS: 'kothamala_custom_emotions_v1',
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  genderOverride: 'character',
  rate: 1.0,
  pitch: 1.0,
  autoSpeak: true,
  engineMode: 'auto',
  speechLang: 'bn-BD',
};

const INITIAL_DIRECTOR_MESSAGE: SetupChatMessage = {
  id: 'director-welcome',
  sender: 'director',
  text: 'Welcome to Kothamala! Tell me who you want to roleplay with — your name, the character relation (mother, girlfriend, best friend, wife, sibling), their name, age, and personality. You can write in Banglish, Bengali, or English (or click any preset character on the left).',
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hasSavedSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return true;
    const raw = window.localStorage.getItem(STORAGE_KEYS.MESSAGES_BY_CHAR);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}

function createGreetingMessage(character: RoleplayCharacter): ChatMessage {
  return {
    id: `msg-${character.id}-greeting`,
    sender: 'character',
    text: character.greeting,
    action: character.greetingAction,
    mood: character.relation === 'mother' || character.relation === 'father' ? 'স্নেহশীল' : 'শান্ত',
    timestamp: Date.now(),
    voiceGender: character.gender,
    characterId: character.id,
    matchedTopic: 'শুরু',
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [isSetupMode, setIsSetupMode] = useState<boolean>(() => !hasSavedSession());
  const [setupMessages, setSetupMessages] = useState<SetupChatMessage[]>([INITIAL_DIRECTOR_MESSAGE]);
  const [setupDraft, setSetupDraft] = useState<RoleplaySetupDraft | null>(null);

  const [customCharacters, setCustomCharacters] = useState<RoleplayCharacter[]>(() =>
    readStorage<RoleplayCharacter[]>(STORAGE_KEYS.CUSTOM_CHARS, [])
  );

  const allCharacters = useMemo(
    () => [...BUILTIN_CHARACTERS, ...customCharacters],
    [customCharacters]
  );

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    const saved = readStorage<string>(STORAGE_KEYS.ACTIVE_CHAR, 'ammu-rahela');
    return saved || 'ammu-rahela';
  });

  const activeCharacter = useMemo(
    () => allCharacters.find((c) => c.id === activeCharacterId) || allCharacters[0],
    [allCharacters, activeCharacterId]
  );

  const [messagesByChar, setMessagesByChar] = useState<Record<string, ChatMessage[]>>(() =>
    readStorage<Record<string, ChatMessage[]>>(STORAGE_KEYS.MESSAGES_BY_CHAR, {})
  );

  const [memoryByChar, setMemoryByChar] = useState<Record<string, SessionMemory>>(() =>
    readStorage<Record<string, SessionMemory>>(STORAGE_KEYS.MEMORY_BY_CHAR, {})
  );

  const [followUpsByChar, setFollowUpsByChar] = useState<Record<string, string[]>>(() =>
    readStorage<Record<string, string[]>>(STORAGE_KEYS.FOLLOWUPS_BY_CHAR, {})
  );

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() =>
    readStorage<VoiceSettings>(STORAGE_KEYS.VOICE_SETTINGS, DEFAULT_VOICE_SETTINGS)
  );

  const [userLexicon, setUserLexicon] = useState<LexiconEntry[]>(() =>
    readStorage<LexiconEntry[]>(STORAGE_KEYS.USER_LEXICON, [])
  );

  const [trainedConversations, setTrainedConversations] = useState<TrainedConversationItem[]>(() =>
    readStorage<TrainedConversationItem[]>(STORAGE_KEYS.TRAINED_CONVS, [])
  );

  const [trainedScenarios, setTrainedScenarios] = useState<TrainedScenario[]>(() =>
    readStorage<TrainedScenario[]>(STORAGE_KEYS.TRAINED_SCENARIOS, [])
  );

  const [mlFeedbackSamples, setMlFeedbackSamples] = useState<MLFeedbackSample[]>(() =>
    readStorage<MLFeedbackSample[]>(STORAGE_KEYS.ML_FEEDBACK, [])
  );

  const [selfLearnedPatterns, setSelfLearnedPatterns] = useState<MLSelfLearnedPattern[]>(() =>
    readStorage<MLSelfLearnedPattern[]>(STORAGE_KEYS.ML_PATTERNS, [])
  );

  const [customEmotions, setCustomEmotions] = useState<CustomEmotionDefinition[]>(() =>
    readStorage<CustomEmotionDefinition[]>(STORAGE_KEYS.CUSTOM_EMOTIONS, [])
  );

  const mlStats = useMemo(() => {
    const model = new LocalMLModel(
      userLexicon,
      trainedConversations,
      trainedScenarios,
      selfLearnedPatterns,
      mlFeedbackSamples,
      customEmotions
    );
    return model.getStats(selfLearnedPatterns.length);
  }, [
    userLexicon,
    trainedConversations,
    trainedScenarios,
    selfLearnedPatterns,
    mlFeedbackSamples,
    customEmotions,
  ]);

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeVoiceEngineLabel, setActiveVoiceEngineLabel] = useState<string | null>(null);

  // Live Talking state (Microphone Speech-to-Text + Auto Voice Reply + Text Chat)
  const [isLiveTalkOn, setIsLiveTalkOn] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const liveTalkOnRef = useRef(false);
  const speechLangRef = useRef(voiceSettings.speechLang || 'bn-BD');
  const sendMessageRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    liveTalkOnRef.current = isLiveTalkOn;
  }, [isLiveTalkOn]);

  useEffect(() => {
    speechLangRef.current = voiceSettings.speechLang || 'bn-BD';
  }, [voiceSettings.speechLang]);

  // Respect ?autostart=1 by jumping straight to studio character chat
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setActiveTab('studio');
      setIsSetupMode(false);
    }
  }, []);

  // Persist states cleanly in localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOM_CHARS, JSON.stringify(customCharacters));
    } catch {
      // Ignore storage quota errors
    }
  }, [customCharacters]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.MESSAGES_BY_CHAR, JSON.stringify(messagesByChar));
    } catch {
      // Ignore
    }
  }, [messagesByChar]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.MEMORY_BY_CHAR, JSON.stringify(memoryByChar));
    } catch {
      // Ignore
    }
  }, [memoryByChar]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.FOLLOWUPS_BY_CHAR, JSON.stringify(followUpsByChar));
    } catch {
      // Ignore
    }
  }, [followUpsByChar]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAR, JSON.stringify(activeCharacter.id));
    } catch {
      // Ignore
    }
  }, [activeCharacter.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(voiceSettings));
    } catch {
      // Ignore
    }
  }, [voiceSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.USER_LEXICON, JSON.stringify(userLexicon));
    } catch {
      // Ignore
    }
  }, [userLexicon]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.TRAINED_CONVS,
        JSON.stringify(trainedConversations)
      );
    } catch {
      // Ignore
    }
  }, [trainedConversations]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.TRAINED_SCENARIOS,
        JSON.stringify(trainedScenarios)
      );
    } catch {
      // Ignore
    }
  }, [trainedScenarios]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.ML_FEEDBACK,
        JSON.stringify(mlFeedbackSamples)
      );
    } catch {
      // Ignore
    }
  }, [mlFeedbackSamples]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.ML_PATTERNS,
        JSON.stringify(selfLearnedPatterns)
      );
    } catch {
      // Ignore
    }
  }, [selfLearnedPatterns]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.CUSTOM_EMOTIONS,
        JSON.stringify(customEmotions)
      );
    } catch {
      // Ignore
    }
  }, [customEmotions]);

  const currentMessages = useMemo(() => {
    const existing = messagesByChar[activeCharacter.id];
    if (existing && existing.length > 0) return existing;
    return [createGreetingMessage(activeCharacter)];
  }, [messagesByChar, activeCharacter]);

  const currentMemory = useMemo(() => {
    return memoryByChar[activeCharacter.id] || createInitialMemory(activeCharacter);
  }, [memoryByChar, activeCharacter]);

  const currentFollowUps = useMemo(() => {
    return followUpsByChar[activeCharacter.id] || activeCharacter.initialFollowUps;
  }, [followUpsByChar, activeCharacter]);

  const beginListeningSession = useCallback(() => {
    setMicError(null);
    setLiveTranscript('');
    const started = speechInput.start(speechLangRef.current, {
      onStateChange: (listening) => {
        setIsMicListening(listening);
      },
      onInterim: (interimText) => {
        setLiveTranscript(interimText);
      },
      onFinal: (finalText) => {
        setLiveTranscript('');
        if (finalText.trim()) {
          sendMessageRef.current(finalText.trim());
        }
      },
      onError: (errMsg) => {
        setMicError(errMsg);
        setIsLiveTalkOn(false);
        liveTalkOnRef.current = false;
      },
    });
    if (!started) {
      setIsLiveTalkOn(false);
      liveTalkOnRef.current = false;
    }
  }, []);

  const handleStopLiveTalk = useCallback(() => {
    liveTalkOnRef.current = false;
    setIsLiveTalkOn(false);
    setIsMicListening(false);
    setLiveTranscript('');
    speechInput.stop();
  }, []);

  const handleToggleLiveTalk = useCallback(() => {
    if (isLiveTalkOn || isMicListening) {
      handleStopLiveTalk();
      return;
    }
    voicePlayer.stop();
    setSpeakingMessageId(null);
    setVoiceSettings((prev) => ({ ...prev, autoSpeak: true }));
    liveTalkOnRef.current = true;
    setIsLiveTalkOn(true);
    beginListeningSession();
  }, [isLiveTalkOn, isMicListening, handleStopLiveTalk, beginListeningSession]);

  const handleStopSpeaking = useCallback(() => {
    voicePlayer.stop();
    setSpeakingMessageId(null);
    setActiveVoiceEngineLabel(null);
  }, []);

  const handleSpeakMessage = useCallback(
    (msg: ChatMessage) => {
      const targetChar = allCharacters.find((c) => c.id === msg.characterId) || activeCharacter;
      // Pause microphone while character speaks so mic doesn't echo speaker output
      if (speechInput.isListening()) {
        speechInput.stop();
      }
      voicePlayer.speak(msg.text, targetChar.gender, voiceSettings, {
        mood: msg.mood,
        customEmotions,
        onStart: (engineUsed) => {
          setSpeakingMessageId(msg.id);
          setActiveVoiceEngineLabel(
            engineUsed === 'speech' ? 'Browser Speech' : 'Acoustic Formant Synth'
          );
        },
        onEnd: () => {
          setSpeakingMessageId(null);
          setActiveVoiceEngineLabel(null);
          // In Live Talk mode, automatically resume listening after character finishes talking
          if (liveTalkOnRef.current) {
            beginListeningSession();
          }
        },
      });
    },
    [allCharacters, activeCharacter, voiceSettings, customEmotions, beginListeningSession]
  );

  const launchSetupCharacter = useCallback(
    (draft: RoleplaySetupDraft, scenarioText?: string) => {
      const { character, initialMemory } = buildCharacterFromSetup(draft, scenarioText);
      const greetingMsg = createGreetingMessage(character);

      setCustomCharacters((prev) => [character, ...prev]);
      setActiveCharacterId(character.id);
      setMessagesByChar((prev) => ({
        ...prev,
        [character.id]: [greetingMsg],
      }));
      setMemoryByChar((prev) => ({
        ...prev,
        [character.id]: initialMemory,
      }));
      setFollowUpsByChar((prev) => ({
        ...prev,
        [character.id]: character.initialFollowUps,
      }));
      setSetupDraft(null);
      setIsSetupMode(false);
      setActiveTab('studio');

      if (voiceSettings.autoSpeak || liveTalkOnRef.current) {
        voicePlayer.speak(greetingMsg.text, character.gender, voiceSettings, {
          mood: greetingMsg.mood,
          onStart: (engineUsed) => {
            setSpeakingMessageId(greetingMsg.id);
            setActiveVoiceEngineLabel(
              engineUsed === 'speech' ? 'Browser Speech' : 'Acoustic Formant Synth'
            );
          },
          onEnd: () => {
            setSpeakingMessageId(null);
            setActiveVoiceEngineLabel(null);
            if (liveTalkOnRef.current) {
              beginListeningSession();
            }
          },
        });
      }
    },
    [voiceSettings, beginListeningSession]
  );

  const handleSendSetupMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      const userMsg: SetupChatMessage = {
        id: `setup-user-${Date.now()}`,
        sender: 'user',
        text,
      };

      if (!setupDraft || setupDraft.step === 'awaiting_character') {
        const { draft, scenarioText } = parseRoleplaySetupPrompt(text);

        if (scenarioText) {
          setSetupMessages((prev) => [
            ...prev,
            userMsg,
            {
              id: `setup-dir-${Date.now() + 1}`,
              sender: 'director',
              text: `Awesome${draft.userName ? `, ${draft.userName}` : ''}! Starting roleplay with ${draft.characterName} (${draft.relation}) using your scenario right now...`,
            },
          ]);
          launchSetupCharacter(draft, scenarioText);
          return;
        }

        const nextDraft: RoleplaySetupDraft = {
          ...draft,
          step: 'awaiting_scenario',
        };
        setSetupDraft(nextDraft);

        const ageInfo = draft.characterAge ? `, Age ${draft.characterAge}` : '';
        const voiceInfo = draft.gender === 'female' ? 'Female Voice' : 'Male Voice';
        setSetupMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: `setup-dir-${Date.now() + 1}`,
            sender: 'director',
            text: `Got it${draft.userName ? `, ${draft.userName}` : ''}! I'll play ${draft.characterName} (${draft.relation}${ageInfo}, ${voiceInfo}). Tell me the scenario — how should the story start, develop in the middle, and end? (Banglish, Bengali, or English)`,
          },
        ]);
        return;
      }

      // Second step: user provided the scenario arc
      setSetupMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `setup-dir-${Date.now() + 1}`,
          sender: 'director',
          text: `Scenario locked in! Launching ${setupDraft.characterName} from your opening scene...`,
        },
      ]);
      launchSetupCharacter(setupDraft, text);
    },
    [setupDraft, launchSetupCharacter]
  );

  const handleSendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'user',
        text,
        timestamp: Date.now(),
        voiceGender: activeCharacter.gender,
        characterId: activeCharacter.id,
      };

      const reply = generateRoleplayReply(text, activeCharacter, currentMemory, {
        extraLexicon: userLexicon,
        trainedConversations,
        trainedScenarios,
        selfLearnedPatterns,
        feedbackSamples: mlFeedbackSamples,
        customEmotions,
      });
      const charMsg: ChatMessage = {
        id: `char-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'character',
        text: reply.replyText,
        replyKey: reply.replyKey,
        action: reply.action,
        mood: reply.mood,
        timestamp: Date.now() + 1,
        voiceGender: activeCharacter.gender,
        characterId: activeCharacter.id,
        matchedTopic: reply.matchedTopic,
        detectedUserEmotion: reply.detectedUserEmotion,
        understoodWords: reply.understoodWords,
      };

      setMessagesByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: [...currentMessages, userMsg, charMsg],
      }));
      setMemoryByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: reply.updatedMemory,
      }));
      setFollowUpsByChar((prev) => ({
        ...prev,
        [activeCharacter.id]: reply.followUps,
      }));

      if (voiceSettings.autoSpeak || liveTalkOnRef.current) {
        handleSpeakMessage(charMsg);
      }
    },
    [
      activeCharacter,
      currentMemory,
      currentMessages,
      userLexicon,
      trainedConversations,
      trainedScenarios,
      selfLearnedPatterns,
      mlFeedbackSamples,
      customEmotions,
      voiceSettings.autoSpeak,
      handleSpeakMessage,
    ]
  );

  useEffect(() => {
    sendMessageRef.current = isSetupMode ? handleSendSetupMessage : handleSendMessage;
  }, [isSetupMode, handleSendSetupMessage, handleSendMessage]);

  useEffect(() => {
    return () => {
      speechInput.stop();
      voicePlayer.stop();
    };
  }, []);

  const handleSelectCharacter = (characterId: string) => {
    handleStopLiveTalk();
    handleStopSpeaking();
    setActiveCharacterId(characterId);
    setIsSetupMode(false);
    setActiveTab('studio');
  };

  const handleOpenSetupChat = () => {
    handleStopLiveTalk();
    handleStopSpeaking();
    setSetupDraft(null);
    setSetupMessages([INITIAL_DIRECTOR_MESSAGE]);
    setIsSetupMode(true);
    setActiveTab('studio');
  };

  const handleResetActiveSession = () => {
    handleStopLiveTalk();
    handleStopSpeaking();
    setMessagesByChar((prev) => ({
      ...prev,
      [activeCharacter.id]: [createGreetingMessage(activeCharacter)],
    }));
    setMemoryByChar((prev) => ({
      ...prev,
      [activeCharacter.id]: createInitialMemory(activeCharacter),
    }));
    setFollowUpsByChar((prev) => ({
      ...prev,
      [activeCharacter.id]: activeCharacter.initialFollowUps,
    }));
    setIsSetupMode(false);
    setActiveTab('studio');
  };

  const handleUpdateVoiceSettings = (patch: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => ({ ...prev, ...patch }));
  };

  const handlePreviewCharacterVoice = (char: RoleplayCharacter) => {
    voicePlayer.speak(
      char.greeting,
      char.gender,
      { ...voiceSettings, genderOverride: 'character' },
      {
        onStart: (engineUsed) => {
          setSpeakingMessageId(`preview-${char.id}`);
          setActiveVoiceEngineLabel(
            engineUsed === 'speech' ? 'Browser Speech' : 'Acoustic Formant Synth'
          );
        },
        onEnd: () => {
          setSpeakingMessageId(null);
          setActiveVoiceEngineLabel(null);
        },
      }
    );
  };

  const handleCreateCustomCharacter = (char: RoleplayCharacter) => {
    setCustomCharacters((prev) => [...prev, char]);
    setActiveCharacterId(char.id);
    setMessagesByChar((prev) => ({
      ...prev,
      [char.id]: [createGreetingMessage(char)],
    }));
    setMemoryByChar((prev) => ({
      ...prev,
      [char.id]: createInitialMemory(char),
    }));
    setFollowUpsByChar((prev) => ({
      ...prev,
      [char.id]: char.initialFollowUps,
    }));
    setIsSetupMode(false);
    setActiveTab('studio');
  };

  const handleDeleteCustomCharacter = (charId: string) => {
    setCustomCharacters((prev) => prev.filter((c) => c.id !== charId));
    if (activeCharacterId === charId) {
      setActiveCharacterId(BUILTIN_CHARACTERS[0].id);
    }
  };

  const handleAddLexiconEntry = (entry: LexiconEntry) => {
    setUserLexicon((prev) => [entry, ...prev]);
  };

  const handleAddLexiconBatch = (entries: LexiconEntry[]) => {
    if (entries.length > 0) {
      setUserLexicon((prev) => [...entries, ...prev]);
    }
  };

  const handleRemoveLexiconEntry = (id: string) => {
    setUserLexicon((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCustomEmotion = (emotion: CustomEmotionDefinition) => {
    setCustomEmotions((prev) => {
      const exists = prev.some(
        (e) => e.signal.toLowerCase() === emotion.signal.toLowerCase()
      );
      if (exists) return prev;
      return [emotion, ...prev];
    });
  };

  const handleAddCustomEmotionsBatch = (emotions: CustomEmotionDefinition[]) => {
    if (emotions.length === 0) return;
    setCustomEmotions((prev) => {
      const existingSignals = new Set(prev.map((e) => e.signal.toLowerCase()));
      const fresh = emotions.filter((e) => !existingSignals.has(e.signal.toLowerCase()));
      if (fresh.length === 0) return prev;
      return [...fresh, ...prev];
    });
  };

  const handleRemoveCustomEmotion = (id: string) => {
    setCustomEmotions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddTrainedBatch = (
    items: TrainedConversationItem[],
    words: LexiconEntry[],
    scenarios: TrainedScenario[] = [],
    characters: RoleplayCharacter[] = [],
    importedEmotions: CustomEmotionDefinition[] = []
  ) => {
    const nextConversations = items.length > 0 ? [...items, ...trainedConversations] : trainedConversations;
    const nextLexicon = words.length > 0 ? [...words, ...userLexicon] : userLexicon;
    const nextScenarios = scenarios.length > 0 ? [...scenarios, ...trainedScenarios] : trainedScenarios;

    let nextEmotions = customEmotions;
    if (importedEmotions.length > 0) {
      const existingSignals = new Set(customEmotions.map((e) => e.signal.toLowerCase()));
      const freshEmotions = importedEmotions.filter(
        (e) => !existingSignals.has(e.signal.toLowerCase())
      );
      if (freshEmotions.length > 0) {
        nextEmotions = [...freshEmotions, ...customEmotions];
        setCustomEmotions(nextEmotions);
      }
    }

    if (items.length > 0) {
      setTrainedConversations(nextConversations);
    }
    if (scenarios.length > 0) {
      setTrainedScenarios(nextScenarios);
    }
    if (characters.length > 0) {
      setCustomCharacters((prev) => [...characters, ...prev]);
    }

    // Autonomous ML Self-Learning: immediately synthesize patterns & discover vocabulary
    const { newPatterns, newLexiconWords } = runSelfLearningSynthesis({
      trainedConversations: nextConversations,
      trainedScenarios: nextScenarios,
      feedbackSamples: mlFeedbackSamples,
      existingPatterns: selfLearnedPatterns,
      existingLexicon: nextLexicon,
      customEmotions: nextEmotions,
    });
    if (newPatterns.length > 0) {
      setSelfLearnedPatterns((prev) => [...newPatterns, ...prev]);
    }
    if (words.length > 0 || newLexiconWords.length > 0) {
      setUserLexicon([...newLexiconWords, ...nextLexicon]);
    }
  };

  const handleRemoveTrainedConversation = (id: string) => {
    setTrainedConversations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveTrainedScenario = (id: string) => {
    setTrainedScenarios((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveSelfLearnedPattern = (id: string) => {
    setSelfLearnedPatterns((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRateMessage = useCallback(
    (charMsg: ChatMessage, reward: 1 | -1) => {
      const charHistory = messagesByChar[charMsg.characterId] || [];
      const msgIdx = charHistory.findIndex((m) => m.id === charMsg.id);
      const precedingUserMsg =
        msgIdx > 0
          ? [...charHistory.slice(0, msgIdx)].reverse().find((m) => m.sender === 'user')
          : undefined;
      const sample: MLFeedbackSample = {
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        input: precedingUserMsg?.text || charMsg.matchedTopic || charMsg.text.slice(0, 40),
        replyKey: charMsg.replyKey || `msg:${charMsg.id}`,
        replyText: charMsg.text,
        emotion: charMsg.detectedUserEmotion || 'শান্ত',
        mood: charMsg.mood || 'শান্ত',
        reward,
        timestamp: Date.now(),
      };
      const nextSamples = [sample, ...mlFeedbackSamples.slice(0, 199)];
      setMlFeedbackSamples(nextSamples);

      if (reward > 0) {
        const { newPatterns, newLexiconWords } = runSelfLearningSynthesis({
          trainedConversations,
          trainedScenarios,
          feedbackSamples: nextSamples,
          existingPatterns: selfLearnedPatterns,
          existingLexicon: userLexicon,
          customEmotions,
        });
        if (newPatterns.length > 0) {
          setSelfLearnedPatterns((prev) => [...newPatterns, ...prev]);
        }
        if (newLexiconWords.length > 0) {
          setUserLexicon((prev) => [...newLexiconWords, ...prev]);
        }
      }
    },
    [
      messagesByChar,
      mlFeedbackSamples,
      trainedConversations,
      trainedScenarios,
      selfLearnedPatterns,
      userLexicon,
      customEmotions,
    ]
  );

  const handleRunSelfLearning = useCallback(() => {
    const { newPatterns, newLexiconWords } = runSelfLearningSynthesis({
      trainedConversations,
      trainedScenarios,
      feedbackSamples: mlFeedbackSamples,
      existingPatterns: selfLearnedPatterns,
      existingLexicon: userLexicon,
      customEmotions,
    });
    if (newPatterns.length > 0) {
      setSelfLearnedPatterns((prev) => [...newPatterns, ...prev]);
    }
    if (newLexiconWords.length > 0) {
      setUserLexicon((prev) => [...newLexiconWords, ...prev]);
    }
    return {
      addedPatterns: newPatterns.length,
      addedWords: newLexiconWords.length,
    };
  }, [
    trainedConversations,
    trainedScenarios,
    mlFeedbackSamples,
    selfLearnedPatterns,
    userLexicon,
    customEmotions,
  ]);

  const handleLaunchScenario = (scenario: TrainedScenario) => {
    handleStopLiveTalk();
    handleStopSpeaking();
    const { character, initialMemory } = buildCharacterFromTrainedScenario(scenario);
    const greetingMsg = createGreetingMessage(character);

    setCustomCharacters((prev) => [character, ...prev]);
    setActiveCharacterId(character.id);
    setMessagesByChar((prev) => ({
      ...prev,
      [character.id]: [greetingMsg],
    }));
    setMemoryByChar((prev) => ({
      ...prev,
      [character.id]: initialMemory,
    }));
    setFollowUpsByChar((prev) => ({
      ...prev,
      [character.id]: character.initialFollowUps,
    }));
    setIsSetupMode(false);
    setActiveTab('studio');

    if (voiceSettings.autoSpeak) {
      voicePlayer.speak(greetingMsg.text, character.gender, voiceSettings, {
        mood: greetingMsg.mood,
        onStart: (engineUsed) => {
          setSpeakingMessageId(greetingMsg.id);
          setActiveVoiceEngineLabel(
            engineUsed === 'speech' ? 'Browser Speech' : 'Acoustic Formant Synth'
          );
        },
        onEnd: () => {
          setSpeakingMessageId(null);
          setActiveVoiceEngineLabel(null);
        },
      });
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#F8F9FA] text-[#111827]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== activeTab) {
            handleStopLiveTalk();
            handleStopSpeaking();
          }
          setActiveTab(tab);
        }}
        onOpenSetupChat={handleOpenSetupChat}
      />

      <main className="flex-1 min-w-0 w-full">
        {activeTab === 'studio' && (
          <RoleplayStudio
            characters={allCharacters}
            activeCharacter={activeCharacter}
            messages={currentMessages}
            memory={currentMemory}
            followUps={currentFollowUps}
            voiceSettings={voiceSettings}
            speakingMessageId={speakingMessageId}
            activeVoiceEngineLabel={activeVoiceEngineLabel}
            isLiveTalkOn={isLiveTalkOn}
            isMicListening={isMicListening}
            liveTranscript={liveTranscript}
            micError={micError}
            isSetupMode={isSetupMode}
            setupMessages={setupMessages}
            setupDraft={setupDraft}
            onSendSetupMessage={handleSendSetupMessage}
            onOpenSetupChat={handleOpenSetupChat}
            onCloseSetupChat={() => setIsSetupMode(false)}
            onToggleLiveTalk={handleToggleLiveTalk}
            onDismissMicError={() => setMicError(null)}
            onSelectCharacter={handleSelectCharacter}
            onSendMessage={handleSendMessage}
            onSpeakMessage={handleSpeakMessage}
            onRateMessage={handleRateMessage}
            onStopSpeaking={handleStopSpeaking}
            onUpdateVoiceSettings={handleUpdateVoiceSettings}
            onResetSession={handleResetActiveSession}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterGallery
            characters={allCharacters}
            activeCharacterId={activeCharacter.id}
            onSelectCharacter={handleSelectCharacter}
            onPreviewVoice={handlePreviewCharacterVoice}
            onDeleteCustomCharacter={handleDeleteCustomCharacter}
          />
        )}

        {activeTab === 'theatre' && (
          <TheatreStage
            voiceSettings={voiceSettings}
            onStartChatWithCharacter={handleSelectCharacter}
          />
        )}

        {activeTab === 'trainer' && (
          <LocalTrainer
            userLexicon={userLexicon}
            trainedConversations={trainedConversations}
            trainedScenarios={trainedScenarios}
            trainedCharacters={customCharacters}
            selfLearnedPatterns={selfLearnedPatterns}
            customEmotions={customEmotions}
            mlStats={mlStats}
            onAddLexiconEntry={handleAddLexiconEntry}
            onAddLexiconBatch={handleAddLexiconBatch}
            onRemoveLexiconEntry={handleRemoveLexiconEntry}
            onAddTrainedBatch={handleAddTrainedBatch}
            onRemoveTrainedConversation={handleRemoveTrainedConversation}
            onRemoveTrainedScenario={handleRemoveTrainedScenario}
            onRemoveSelfLearnedPattern={handleRemoveSelfLearnedPattern}
            onAddCustomEmotion={handleAddCustomEmotion}
            onAddCustomEmotionsBatch={handleAddCustomEmotionsBatch}
            onRemoveCustomEmotion={handleRemoveCustomEmotion}
            onLaunchScenario={handleLaunchScenario}
            onSelectCharacter={handleSelectCharacter}
            onRunSelfLearning={handleRunSelfLearning}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceLab
            voiceSettings={voiceSettings}
            onUpdateVoiceSettings={handleUpdateVoiceSettings}
          />
        )}

        {activeTab === 'builder' && (
          <CustomCharacterBuilder onCreateCharacter={handleCreateCustomCharacter} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:px-6">
          <p>Kothamala · 100% Offline Bengali & Banglish Roleplay & Dual-Voice Studio</p>
          <p>Powered completely inside the browser with zero external APIs</p>
        </div>
      </footer>
    </div>
  );
}

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Cpu,
  Download,
  FileJson,
  Heart,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { BENGALI_LEXICON } from '../data/bengaliLexicon';
import { BUILTIN_EMOTIONS } from '../data/builtinEmotions';
import {
  detectSensitiveOrInappropriateInput,
  normalizeBengaliText,
  parseEmotionsJson,
  parseJsonDataset,
  parseLexiconJson,
} from '../engine/localIntelligence';
import { exportTrainedBrainJson } from '../engine/localML';
import {
  CustomEmotionDefinition,
  EmotionSignal,
  EmotionVoiceTone,
  LexiconEntry,
  MLModelStats,
  MLSelfLearnedPattern,
  RoleplayCharacter,
  TrainedConversationItem,
  TrainedScenario,
} from '../types/roleplay';

interface LocalTrainerProps {
  userLexicon: LexiconEntry[];
  trainedConversations: TrainedConversationItem[];
  trainedScenarios: TrainedScenario[];
  trainedCharacters: RoleplayCharacter[];
  selfLearnedPatterns: MLSelfLearnedPattern[];
  customEmotions: CustomEmotionDefinition[];
  mlStats: MLModelStats;
  onAddLexiconEntry: (entry: LexiconEntry) => void;
  onAddLexiconBatch: (entries: LexiconEntry[]) => void;
  onRemoveLexiconEntry: (id: string) => void;
  onAddTrainedBatch: (
    items: TrainedConversationItem[],
    words: LexiconEntry[],
    scenarios?: TrainedScenario[],
    characters?: RoleplayCharacter[],
    emotions?: CustomEmotionDefinition[],
    selfLearnedPatterns?: MLSelfLearnedPattern[]
  ) => void;
  onRemoveTrainedConversation: (id: string) => void;
  onRemoveTrainedScenario: (id: string) => void;
  onRemoveSelfLearnedPattern: (id: string) => void;
  onAddCustomEmotion: (emotion: CustomEmotionDefinition) => void;
  onAddCustomEmotionsBatch: (emotions: CustomEmotionDefinition[]) => void;
  onRemoveCustomEmotion: (id: string) => void;
  onLaunchScenario: (scenario: TrainedScenario) => void;
  onSelectCharacter: (characterId: string) => void;
  onRunSelfLearning: () => { addedPatterns: number; addedWords: number };
}

const EMOTIONAL_ARC_JSON_TEMPLATE = JSON.stringify(
  {
    lexicon: [
      {
        root: 'অনুনয়',
        emotion: 'অনুনয়',
        forms: ['অনুনয়', 'প্লিজ', 'please ma', 'convince', 'কথা দিচ্ছি'],
        meaningBn: 'কাউকে নরম করে রাজি করানোর জন্য বিনীত অনুরোধ',
        category: 'আবেগ ও সম্পর্ক',
        intensity: 4,
      },
    ],
    characters: [
      {
        name: 'রাবেয়া (কঠোর আম্মু)',
        relation: 'mother',
        gender: 'female',
        age: 39,
        setting: 'বাসার পড়ার ঘরে',
        personalitySummary:
          'পড়াশোনার বিষয়ে প্রথমে রাগী ও কঠোর, চাপ বা শর্ত দেয়, কিন্তু মন দিয়ে কথা শুনলে নরম হয়ে যায়।',
        greeting: 'এই খোকা! সারাদিন বইয়ের নাম নেই, এখন আবার খেলতে যাওয়ার কথা বলছিস?',
        greetingAction: 'হাতে চায়ের কাপ রেখে কড়া চোখে তাকালো',
      },
    ],
    scenarios: [
      {
        title: 'Study vs Playtime: Anger to Persuasion Arc (রাগ, শর্ত ও রাজি হওয়ার গল্প)',
        relation: 'mother',
        characterName: 'রাবেয়া',
        characterAge: 39,
        setting: 'বাসার পড়ার ঘরে',
        summary:
          'ছেলে খেলতে যেতে চাইলে মা প্রথমে রাগ করে ও বাবাকে বলে দেওয়ার ভয় দেখায়; পরে ছেলে বুঝিয়ে পড়ার কথা দিলে মা নরম হয়ে রাজি হয়।',
        greeting: 'পড়াশোনা শেষ না করে এক পাও ঘরের বাইরে যাবে না—বলো আজ কতক্ষণ পড়েছো?',
        greetingAction: 'বইয়ের টেবিলের পাশে দাঁড়িয়ে গম্ভীর স্বরে বললো',
        phases: [
          {
            phase: 'opening',
            beat: 'খেলার বায়না শুনে মায়ের প্রাথমিক রাগ ও আপত্তি',
            emotion: 'রাগান্বিত',
            phaseTrigger: 'refusal',
            keywords: ['খেলতে', 'পড়বো না', 'যাবো', 'khelte', 'porbo na'],
            variants: [
              {
                text: 'কেন পড়বি না? তোর পরীক্ষা সামনে আর তুই এখন খেলতে যাবি? একদম না—আজ ছয় ঘণ্টা টেবিল থেকে উঠবি না!',
                action: 'রাগে ভুরু কুঁচকে কড়া গলায় ধমক দিল',
                mood: 'রাগান্বিত',
                followUps: ['না আম্মু, আজ খেলতে যেতেই হবে', 'ছয় ঘণ্টা পারবো না আম্মু'],
              },
            ],
          },
          {
            phase: 'developing',
            beat: 'শর্ত ও বাবাকে বলে দেওয়ার চাপ (ভয় দেখানো)',
            emotion: 'চাপ ও শর্ত',
            phaseTrigger: 'pressure',
            keywords: ['পারবো না', 'বাজে লাগে', 'ছয় ঘণ্টা', 'কেন', 'না'],
            variants: [
              {
                text: 'তুমি যদি আজ না পড়ো, সন্ধ্যায় তোমার বাবা ফিরলেই সব বলে দেবো কিন্তু! তখন বুঝবে খেলতে যাওয়া কাকে বলে।',
                action: 'দৃঢ় চোখে তাকিয়ে স্পষ্ট শর্ত দিল',
                mood: 'চাপ ও শর্ত',
                followUps: [
                  'প্লিজ আম্মু আব্বুকে বলো না, এসে পড়ে নেবো',
                  'সরি আম্মু, কথা দিচ্ছি রাতে পুরো পড়া শেষ করবো',
                ],
              },
            ],
          },
          {
            phase: 'resolution',
            beat: 'অনুনয়ে মায়ের মন গলা ও শর্তসাপেক্ষে সম্মতি',
            emotion: 'সম্মত ও খুশি',
            phaseTrigger: 'persuasion',
            keywords: ['প্লিজ', 'সরি', 'কথা দিচ্ছি', 'পড়ে নেবো', 'আব্বুকে বলো না', 'please', 'sorry'],
            variants: [
              {
                text: 'উফ, তোকে নিয়ে আর পারি না {userName}! আচ্ছা ঠিক আছে, এক ঘণ্টার জন্য যা—তবে ফিরে এসেই বই নিয়ে বসবি, কথা রাখবি কিন্তু!',
                action: 'দীর্ঘ নিশ্বাস ফেলে নরম হাসি দিল',
                mood: 'সম্মত ও খুশি',
                followUps: ['থ্যাংক ইউ আম্মু! কথা দিচ্ছি', 'এক ঘণ্টার মধ্যেই ফিরবো'],
              },
            ],
          },
        ],
      },
    ],
    conversations: [
      {
        relation: 'mother',
        phase: 'opening',
        prompt: 'মা আজকে আমি খেলতে যাবো পড়বো না',
        keywords: ['খেলতে', 'পড়বো না', 'মা'],
        response: 'কেন পড়বি না? তোর পড়তে হবে আজকে! আগে দুই অধ্যায় শেষ কর, তারপর খেলার নাম নিবি।',
        emotion: 'রাগান্বিত',
        action: 'বই খুলে টেবিলের সামনে রাখলো',
        followUps: ['প্লিজ মা, এসে পড়ে নেবো'],
      },
      {
        relation: 'mother',
        phase: 'developing',
        prompt: 'না আমি পড়বো না',
        keywords: ['পড়বো না', 'না', 'কষ্ট'],
        response: 'তুমি যদি না পড়ো, তোমার বাবাকে বলে দিবো কিন্তু! এখনই বই নিয়ে বসো বলছি।',
        emotion: 'চাপ ও শর্ত',
        action: 'কড়া দৃষ্টিতে তাকিয়ে সতর্ক করলো',
        followUps: ['আব্বুকে বলো না মা, আমি পড়বো'],
      },
      {
        relation: 'mother',
        phase: 'resolution',
        prompt: 'সরি মা কথা দিচ্ছি ফিরে এসে পড়বো প্লিজ যেতে দাও',
        keywords: ['সরি', 'কথা দিচ্ছি', 'প্লিজ', 'ফিরে এসে'],
        response: 'আচ্ছা ঠিক আছে {userName}, এত করে বলছিস যখন যা—তবে সন্ধ্যা নামার আগেই বাসায় ফিরবি!',
        emotion: 'নরম হওয়া',
        action: 'স্নেহভরা দৃষ্টিতে মাথা নেড়ে সম্মতি দিল',
        followUps: ['ঠিক আছে আম্মু, তাড়াতাড়ি ফিরবো'],
      },
    ],
  },
  null,
  2
);

const STORY_MODULES_JSON_TEMPLATE = JSON.stringify(
  {
    scenarios: [
      {
        title: 'Late Night Return Worry & Relief (রাতে দেরি করে ফেরার দৃশ্যপট)',
        relation: 'mother',
        characterName: 'রাবেয়া',
        setting: 'দরজার সামনে',
        summary: 'দেরি হওয়ায় মায়ের উদ্বেগ ও শাসন, শেষে যত্ন নিয়ে খাবার দেওয়া',
        phases: [
          {
            phase: 'opening',
            beat: 'দেরিতে ফেরায় উদ্বেগ ও বকা',
            emotion: 'উদ্বিগ্ন',
            keywords: ['দেরি', 'রাত', 'ফিরলাম'],
            variants: [
              {
                text: 'এত রাত হলো কেন {userName}? কতবার ফোন দিয়েছি—টেনশনে আমার বুক ধড়ফড় করছিল!',
                action: 'দরজা খুলেই উদ্বিগ্ন স্বরে বললো',
                mood: 'উদ্বিগ্ন',
              },
            ],
          },
          {
            phase: 'resolution',
            beat: 'রাগ ভেঙে যত্ন',
            emotion: 'স্নেহশীল',
            keywords: ['সরি', 'ট্রাফিক', 'ভালোবাসি'],
            variants: [
              {
                text: 'আচ্ছা সরি বলতে হবে না, হাত-মুখ ধুয়ে নে—গরম ভাত বেড়ে দিচ্ছি।',
                action: 'স্নেহভরে খাবার টেবিলের দিকে এগোলো',
                mood: 'স্নেহশীল',
              },
            ],
          },
        ],
      },
    ],
    characters: [
      {
        name: 'তানভীর',
        relation: 'friend',
        gender: 'male',
        age: 24,
        setting: 'টিএসসি চায়ের দোকান',
        personalitySummary: 'আড্ডাবাজ, রসিক কিন্তু বিপদে পাশে থাকে এমন প্রাণখোলা বন্ধু।',
        greeting: 'কিরে দোস্ত! এতদিন পর ক্যাম্পাসে চেহারা দেখালি, ট্রিট দিবি না?',
      },
    ],
    conversations: [
      {
        relation: 'friend',
        prompt: 'দোস্ত মনটা আজ ভালো নেই',
        keywords: ['মন ভালো নেই', 'কষ্ট', 'দোস্ত'],
        response: 'আরে মামা, কী হয়েছে খুলে বল তো! বন্ধুর কাছে মন খারাপ লুকানোর কী আছে?',
        emotion: 'উদ্বিগ্ন',
        action: 'কাঁধে হাত রেখে মনোযোগ দিয়ে তাকালো',
      },
    ],
  },
  null,
  2
);

const LEXICON_JSON_TEMPLATE = JSON.stringify(
  [
    {
      root: 'আহ্লাদ',
      emotion: 'খুশি',
      forms: ['আহ্লাদ', 'আহ্লাদী', 'ahlad', 'joyful pamper'],
      meaningBn: 'অতিরিক্ত আদরের কারণে সৃষ্ট আনন্দ বা মিষ্টি আবদার',
      category: 'অনুভূতি',
      intensity: 4,
    },
    {
      root: 'অনুতাপ',
      emotion: 'অনুনয়',
      forms: ['অনুতাপ', 'অনুশোচনা', 'onutap', 'regret', 'remorse'],
      meaningBn: 'নিজের ভুল বুঝতে পেরে মন থেকে দুঃখবোধ ও ক্ষমা চাওয়ার ভাব',
      category: 'অনুভূতি',
      intensity: 4,
    },
  ],
  null,
  2
);

const EMOTIONS_JSON_TEMPLATE = JSON.stringify(
  [
    {
      signal: 'বিস্ময়',
      mood: 'বিস্মিত',
      keywords: ['অবাক', 'বিস্ময়', 'obak', 'surprise', 'wow'],
      voiceTone: 'bright',
      descriptionBn: 'অপ্রত্যাশিত কোনো খবর বা ঘটনা শুনে অবাক হওয়ার অনুভূতি',
      replyTemplate: 'সত্যি নাকি {userName}! "{word}" শুনে আমি তো দারুণ অবাক হলাম!',
      actionText: 'চোখ বড় বড় করে অবাক হয়ে তাকালো',
    },
    {
      signal: 'গর্ব',
      mood: 'গর্বিত',
      keywords: ['গর্ব', 'সাফল্য', 'gorbo', 'proud', 'achievement'],
      voiceTone: 'bright',
      descriptionBn: 'নিজের বা কাছের মানুষের অর্জনে আনন্দ ও গর্ববোধ',
      replyTemplate: 'দারুণ করেছো {userName}! তোমার এই "{word}" দেখে আমার সত্যিই খুব গর্ব হচ্ছে!',
      actionText: 'গর্বভরা হাসি নিয়ে পিঠ চাপড়ে দিল',
    },
  ],
  null,
  2
);

export function LocalTrainer({
  userLexicon,
  trainedConversations,
  trainedScenarios,
  trainedCharacters,
  selfLearnedPatterns,
  customEmotions,
  mlStats,
  onAddLexiconEntry,
  onAddLexiconBatch,
  onRemoveLexiconEntry,
  onAddTrainedBatch,
  onRemoveTrainedConversation,
  onRemoveTrainedScenario,
  onRemoveSelfLearnedPattern,
  onAddCustomEmotion,
  onAddCustomEmotionsBatch,
  onRemoveCustomEmotion,
  onLaunchScenario,
  onSelectCharacter,
  onRunSelfLearning,
}: LocalTrainerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [emotionSearch, setEmotionSearch] = useState('');
  const [emotionMode, setEmotionMode] = useState<'form' | 'json'>('form');
  const [emotionJsonInput, setEmotionJsonInput] = useState('');
  const [newEmoSignal, setNewEmoSignal] = useState('');
  const [newEmoMood, setNewEmoMood] = useState('');
  const [newEmoKeywords, setNewEmoKeywords] = useState('');
  const [newEmoDesc, setNewEmoDesc] = useState('');
  const [newEmoTemplate, setNewEmoTemplate] = useState('');
  const [newEmoAction, setNewEmoAction] = useState('');
  const [newEmoVoiceTone, setNewEmoVoiceTone] = useState<EmotionVoiceTone>('calm');

  const [wordMode, setWordMode] = useState<'json' | 'form'>('json');
  const [wordRoot, setWordRoot] = useState('');
  const [wordForms, setWordForms] = useState('');
  const [wordMeaning, setWordMeaning] = useState('');
  const [wordEmotion, setWordEmotion] = useState<EmotionSignal>('ভালোবাসা');
  const [wordJsonInput, setWordJsonInput] = useState('');

  const [jsonInput, setJsonInput] = useState('');
  const [storyJsonInput, setStoryJsonInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allLexicon = useMemo(() => [...userLexicon, ...BENGALI_LEXICON], [userLexicon]);

  const allEmotionOptions = useMemo(
    () => [
      ...BUILTIN_EMOTIONS.map((e) => e.signal),
      ...customEmotions.map((e) => e.signal),
    ],
    [customEmotions]
  );

  useEffect(() => {
    if (!allEmotionOptions.includes(wordEmotion)) {
      setWordEmotion('ভালোবাসা');
    }
  }, [allEmotionOptions, wordEmotion]);

  const allEmotionsCatalog = useMemo(() => {
    const customItems = customEmotions.map((ce) => ({
      id: ce.id,
      signal: ce.signal,
      mood: ce.mood,
      descriptionBn: ce.descriptionBn,
      voiceTone: ce.voiceTone,
      cues: ce.keywords,
      isCustom: true as const,
      replyTemplate: ce.replyTemplate,
    }));
    const builtinItems = BUILTIN_EMOTIONS.map((be) => ({
      id: `builtin-${be.signal}`,
      signal: be.signal,
      mood: be.mood,
      descriptionBn: be.descriptionBn,
      voiceTone: be.voiceTone,
      cues: be.sampleCues,
      isCustom: false as const,
      replyTemplate: '',
    }));
    return [...customItems, ...builtinItems];
  }, [customEmotions]);

  const emotionWordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of allLexicon) {
      const key = String(entry.emotion).toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [allLexicon]);

  const filteredEmotions = useMemo(() => {
    const q = emotionSearch.trim().toLowerCase();
    const normQ = normalizeBengaliText(emotionSearch);
    if (!q) return allEmotionsCatalog;
    return allEmotionsCatalog.filter(
      (emo) =>
        emo.signal.toLowerCase().includes(q) ||
        emo.mood.toLowerCase().includes(q) ||
        emo.descriptionBn.toLowerCase().includes(q) ||
        emo.cues.some(
          (c) => c.toLowerCase().includes(q) || normalizeBengaliText(c).includes(normQ)
        )
    );
  }, [allEmotionsCatalog, emotionSearch]);

  const filteredLexicon = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const normQ = normalizeBengaliText(searchTerm);
    if (!q) return allLexicon;
    return allLexicon.filter(
      (item) =>
        item.root.toLowerCase().includes(q) ||
        item.meaningBn.toLowerCase().includes(q) ||
        item.forms.some((f) => f.toLowerCase().includes(q) || normalizeBengaliText(f).includes(normQ)) ||
        item.emotion.toLowerCase().includes(q)
    );
  }, [allLexicon, searchTerm]);

  const downloadJsonFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddCustomEmotionSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanSignal = newEmoSignal.trim();
    const cleanMood = newEmoMood.trim();
    const parsedKeywords = Array.from(
      new Set(
        newEmoKeywords
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    if (!cleanSignal || !cleanMood || parsedKeywords.length === 0) {
      setErrorMsg('Please enter Emotion Name, Character Mood, and at least one Trigger Word.');
      return;
    }

    const isDuplicate = allEmotionsCatalog.some(
      (emo) => emo.signal.toLowerCase() === cleanSignal.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg(`Emotion "${cleanSignal}" already exists in the catalog.`);
      return;
    }

    const newEmotion: CustomEmotionDefinition = {
      id: `custom-emo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      signal: cleanSignal,
      mood: cleanMood,
      descriptionBn:
        newEmoDesc.trim() || `${cleanSignal} (${cleanMood}) — কাস্টম রোলপ্লে অনুভূতি`,
      keywords: Array.from(new Set([cleanSignal, ...parsedKeywords])),
      replyTemplate:
        newEmoTemplate.trim() ||
        `তোমার কথার ভেতর "{word}" আর ${cleanSignal}-এর অনুভূতিটা স্পষ্ট বুঝতে পারছি {userName}!`,
      actionText: newEmoAction.trim() || `${cleanMood} ভঙ্গিতে তাকালো`,
      voiceTone: newEmoVoiceTone,
    };

    onAddCustomEmotion(newEmotion);
    setNewEmoSignal('');
    setNewEmoMood('');
    setNewEmoKeywords('');
    setNewEmoDesc('');
    setNewEmoTemplate('');
    setNewEmoAction('');
    setNewEmoVoiceTone('calm');
    setStatusMessage(
      `Added custom emotion "${cleanSignal}" (${cleanMood}) with ${newEmotion.keywords.length} triggers to Local ML & Roleplay Studio!`
    );
  };

  const handleEmotionJsonImport = (rawJson: string, clearTextarea = false) => {
    setErrorMsg(null);
    const { emotions, skippedUnsafeCount, skippedDuplicateCount, error } = parseEmotionsJson(
      rawJson,
      customEmotions
    );
    if (error) {
      setErrorMsg(error);
      return;
    }
    if (emotions.length === 0) {
      if (skippedDuplicateCount > 0) {
        setErrorMsg(
          `Skipped ${skippedDuplicateCount} duplicate emotion(s) that already exist in the catalog.`
        );
      } else {
        setErrorMsg(
          'No valid emotion entries found. Each item needs "signal" (or "name"), "mood", and "keywords".'
        );
      }
      return;
    }

    onAddCustomEmotionsBatch(emotions);
    if (clearTextarea) setEmotionJsonInput('');
    const notes: string[] = [];
    if (skippedDuplicateCount > 0) notes.push(`${skippedDuplicateCount} duplicate skipped`);
    if (skippedUnsafeCount > 0) notes.push(`${skippedUnsafeCount} unsafe skipped`);
    const suffix = notes.length > 0 ? ` (${notes.join(', ')})` : '';
    setStatusMessage(
      `Imported ${emotions.length} emotion(s) from JSON into Local ML & Roleplay Studio${suffix}!`
    );
  };

  const handleEmotionJsonFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleEmotionJsonImport(reader.result, false);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleJsonImport = (rawJson: string, clearSource: 'main' | 'story' | 'file') => {
    setErrorMsg(null);
    const {
      conversations,
      extractedWords,
      scenarios,
      characters,
      customEmotions: importedEmotions,
      selfLearnedPatterns: importedPatterns,
      skippedUnsafeCount,
      error,
    } = parseJsonDataset(rawJson, customEmotions);
    if (error) {
      setErrorMsg(error);
      return;
    }
    if (
      conversations.length === 0 &&
      extractedWords.length === 0 &&
      scenarios.length === 0 &&
      characters.length === 0 &&
      importedEmotions.length === 0 &&
      importedPatterns.length === 0
    ) {
      setErrorMsg(
        skippedUnsafeCount > 0
          ? 'No valid entries found in JSON dataset.'
          : 'JSON had no valid scenarios, characters, conversations, customEmotions, selfLearnedPatterns, naturalPairs, or lexicon items.'
      );
      return;
    }
    onAddTrainedBatch(
      conversations,
      extractedWords,
      scenarios,
      characters,
      importedEmotions,
      importedPatterns
    );
    if (clearSource === 'main') setJsonInput('');
    if (clearSource === 'story') setStoryJsonInput('');

    const skipNote =
      skippedUnsafeCount > 0 ? ` (${skippedUnsafeCount} skipped)` : '';
    const emoNote =
      importedEmotions.length > 0 ? ` · ${importedEmotions.length} custom emotions` : '';
    const patNote =
      importedPatterns.length > 0 ? ` · ${importedPatterns.length} self-learned rules` : '';
    setStatusMessage(
      `Auto-trained locally: ${scenarios.length} scenarios · ${characters.length} characters · ${conversations.length} emotion dialogues · ${extractedWords.length} lexicon words${emoNote}${patNote}${skipNote}!`
    );
  };

  const handleJsonFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleJsonImport(reader.result, 'file');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleWordJsonImport = (rawJson: string) => {
    setErrorMsg(null);
    const { extractedWords, skippedUnsafeCount, error } = parseLexiconJson(rawJson, customEmotions);
    if (error) {
      setErrorMsg(error);
      return;
    }
    if (extractedWords.length === 0) {
      setErrorMsg(
        skippedUnsafeCount > 0
          ? 'All entries were filtered out. Please use non-explicit Bengali/Banglish words.'
          : 'No valid word entries found. Each item needs "root", "emotion", "forms", and "meaningBn".'
      );
      return;
    }
    onAddLexiconBatch(extractedWords);
    setWordJsonInput('');
    setStatusMessage(
      `Trained ${extractedWords.length} Bengali/Banglish word & emotion entries into Local ML Vocabulary!`
    );
  };

  const handleWordJsonFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleWordJsonImport(reader.result);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleTeachWordForm = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanRoot = wordRoot.trim();
    const cleanMeaning = wordMeaning.trim();
    if (!cleanRoot || !cleanMeaning) return;

    const formsList = Array.from(
      new Set([
        cleanRoot,
        ...wordForms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ])
    );

    const newEntry: LexiconEntry = {
      id: `user-word-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      root: cleanRoot,
      forms: formsList,
      meaningBn: cleanMeaning,
      category: 'User Trained',
      emotion: wordEmotion,
      intensity: 4,
      isUserTrained: true,
    };

    onAddLexiconEntry(newEntry);
    setWordRoot('');
    setWordForms('');
    setWordMeaning('');
    setStatusMessage(
      `Added "${cleanRoot}" with meaning & "${wordEmotion}" emotion to Local Intelligence!`
    );
  };

  const handleSelfLearnClick = () => {
    setErrorMsg(null);
    const res = onRunSelfLearning();
    setStatusMessage(
      `Self-Learning Cycle Complete: synthesized ${res.addedPatterns} new behavioral patterns & auto-discovered ${res.addedWords} recurring vocabulary words!`
    );
  };

  return (
    <section
      aria-labelledby="trainer-heading"
      className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6"
    >
      <div className="mb-6 border-b border-slate-200 pb-6">
        <p className="text-xs font-medium text-slate-500">
          100% In-Browser Machine Learning · Zero External APIs · Expert JSON Dataset Auto-Trainer
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              id="trainer-heading"
              className="font-editorial text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              Expert Local AI & ML Training Studio
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Train multi-phase scenarios, emotional arcs (anger, strict pressure, persuasion, agreement), characters, dialogues, and Bengali/Banglish word emotions via structured JSON — backed by an in-browser TF-IDF &amp; Naive Bayes self-learning engine.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                downloadJsonFile(
                  exportTrainedBrainJson({
                    lexicon: userLexicon,
                    scenarios: trainedScenarios,
                    conversations: trainedConversations,
                    selfLearnedPatterns,
                    customEmotions,
                  }),
                  'kothamala-trained-brain.json'
                );
                setStatusMessage(
                  'Exported complete Trained Brain JSON (scenarios, dialogues, lexicon & self-learned ML rules)!'
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Export Brain JSON</span>
            </button>
            <button
              type="button"
              onClick={handleSelfLearnClick}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Cpu className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span>Run Self-Learning Cycle</span>
            </button>
          </div>
        </div>

        {/* Live Local ML Telemetry Bar */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">ML Vocab Vectors</p>
            <p className="font-tabular mt-0.5 text-lg font-bold text-slate-900">
              {mlStats.vocabularySize}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Trained N-Grams</p>
            <p className="font-tabular mt-0.5 text-lg font-bold text-slate-900">
              {mlStats.trainedNgrams}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Emotion Classes</p>
            <p className="font-tabular mt-0.5 text-lg font-bold text-slate-900">
              {mlStats.emotionClasses}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Trained Scenarios</p>
            <p className="font-tabular mt-0.5 text-lg font-bold text-slate-900">
              {trainedScenarios.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Self-Learned Rules</p>
            <p className="font-tabular mt-0.5 text-lg font-bold text-blue-700">
              {mlStats.selfLearnedCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">Feedback Signals</p>
            <p className="font-tabular mt-0.5 text-lg font-bold text-slate-900">
              {mlStats.feedbackCount}
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-900"
        >
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* All Emotions & Custom Emotion Studio */}
      <div
        aria-labelledby="emotion-studio-heading"
        className="mb-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 id="emotion-studio-heading" className="text-base font-semibold text-slate-900">
                All Emotions &amp; Custom Emotion Studio
              </h2>
              <p className="text-xs text-slate-500">
                Browse every built-in and custom emotion supported by the AI, or add new emotions via form or JSON file.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-tabular text-xs font-semibold text-slate-700 mr-1">
              {BUILTIN_EMOTIONS.length} Built-in + {customEmotions.length} Custom ({allEmotionsCatalog.length} Total)
            </p>
            <button
              type="button"
              onClick={() => downloadJsonFile(EMOTIONS_JSON_TEMPLATE, 'kothamala-emotions.json')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sample Emotions JSON</span>
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload Emotions .json</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleEmotionJsonFileUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Searchable All Emotions Directory */}
          <div className="min-w-0 lg:col-span-7 space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="emotion-search" className="sr-only">
                Search all emotions
              </label>
              <input
                id="emotion-search"
                type="search"
                value={emotionSearch}
                onChange={(e) => setEmotionSearch(e.target.value)}
                placeholder="Search emotions by name, mood, or trigger word (e.g. রাগ, অভিমান, বিস্ময়)..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50/40 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid max-h-[380px] grid-cols-1 gap-2.5 overflow-y-auto studio-scroll pr-1 sm:grid-cols-2">
              {filteredEmotions.map((emo) => {
                const wordCount = emotionWordCounts.get(emo.signal.toLowerCase()) || 0;
                return (
                  <article
                    key={emo.id}
                    className={`rounded-lg border p-3 text-xs ${
                      emo.isCustom
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-editorial text-sm font-bold text-slate-900 truncate">
                          {emo.signal}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-600">
                          Mood: {emo.mood} · {emo.isCustom ? 'Custom' : 'Built-in'}
                        </p>
                      </div>
                      {emo.isCustom && (
                        <button
                          type="button"
                          onClick={() => onRemoveCustomEmotion(emo.id)}
                          aria-label={`Delete emotion ${emo.signal}`}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-slate-700 line-clamp-2">{emo.descriptionBn}</p>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Cues: {emo.cues.slice(0, 4).join(', ')}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Voice: {emo.voiceTone} · {wordCount} lexicon words
                    </p>
                  </article>
                );
              })}

              {filteredEmotions.length === 0 && (
                <p className="col-span-full py-6 text-center text-xs text-slate-500">
                  No emotions match your search — add it on the right!
                </p>
              )}
            </div>
          </div>

          {/* Right: Add New Custom Emotion (Single Form or JSON) */}
          <div className="min-w-0 lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900">Add New Emotion</h3>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setEmotionMode('form')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    emotionMode === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Single Form
                </button>
                <button
                  type="button"
                  onClick={() => setEmotionMode('json')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    emotionMode === 'json' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Emotion JSON
                </button>
              </div>
            </div>

            {emotionMode === 'json' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Paste an array of emotions or upload a <code className="font-mono text-slate-700">.json</code> file with{' '}
                  <code className="font-mono text-slate-700">signal</code>,{' '}
                  <code className="font-mono text-slate-700">mood</code>,{' '}
                  <code className="font-mono text-slate-700">keywords</code>,{' '}
                  <code className="font-mono text-slate-700">voiceTone</code>, and{' '}
                  <code className="font-mono text-slate-700">replyTemplate</code>.
                </p>
                <textarea
                  aria-label="Paste Emotions JSON"
                  rows={8}
                  value={emotionJsonInput}
                  onChange={(e) => setEmotionJsonInput(e.target.value)}
                  placeholder='[{"signal": "বিস্ময়", "mood": "বিস্মিত", "keywords": ["অবাক", "obak"], "voiceTone": "bright", "replyTemplate": "সত্যি নাকি {userName}!"}]'
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!emotionJsonInput.trim()}
                    onClick={() => handleEmotionJsonImport(emotionJsonInput, true)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
                  >
                    Import Emotions JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmotionJsonInput(EMOTIONS_JSON_TEMPLATE)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Load Emotion JSON Example
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddCustomEmotionSubmit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-emotion-signal" className="block text-xs font-semibold text-slate-700">
                      Emotion Name *
                    </label>
                    <input
                      id="new-emotion-signal"
                      type="text"
                      value={newEmoSignal}
                      onChange={(e) => setNewEmoSignal(e.target.value)}
                      placeholder="e.g. বিস্ময় or গর্ব"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-emotion-mood" className="block text-xs font-semibold text-slate-700">
                      Character Mood *
                    </label>
                    <input
                      id="new-emotion-mood"
                      type="text"
                      value={newEmoMood}
                      onChange={(e) => setNewEmoMood(e.target.value)}
                      placeholder="e.g. বিস্মিত or গর্বিত"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="new-emotion-keywords" className="block text-xs font-semibold text-slate-700">
                      Trigger Words (comma-separated) *
                    </label>
                    <input
                      id="new-emotion-keywords"
                      type="text"
                      value={newEmoKeywords}
                      onChange={(e) => setNewEmoKeywords(e.target.value)}
                      placeholder="e.g. অবাক, বিস্ময়, obak, wow"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-emotion-tone" className="block text-xs font-semibold text-slate-700">
                      Voice Tone
                    </label>
                    <select
                      id="new-emotion-tone"
                      value={newEmoVoiceTone}
                      onChange={(e) => setNewEmoVoiceTone(e.target.value as EmotionVoiceTone)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="calm">Calm</option>
                      <option value="bright">Bright</option>
                      <option value="gentle">Gentle</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="new-emotion-desc" className="block text-xs font-semibold text-slate-700">
                    Meaning / Description
                  </label>
                  <input
                    id="new-emotion-desc"
                    type="text"
                    value={newEmoDesc}
                    onChange={(e) => setNewEmoDesc(e.target.value)}
                    placeholder="e.g. অপ্রত্যাশিত কিছু দেখে বা শুনে অবাক হওয়ার অনুভূতি"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-emotion-template" className="block text-xs font-semibold text-slate-700">
                    AI Reply Template (optional, uses {'{userName}'}, {'{word}'})
                  </label>
                  <input
                    id="new-emotion-template"
                    type="text"
                    value={newEmoTemplate}
                    onChange={(e) => setNewEmoTemplate(e.target.value)}
                    placeholder='e.g. সত্যি নাকি {userName}! "{word}" শুনে আমি তো দারুণ অবাক হলাম!'
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-emotion-action" className="block text-xs font-semibold text-slate-700">
                    Scene Action / Expression (optional)
                  </label>
                  <input
                    id="new-emotion-action"
                    type="text"
                    value={newEmoAction}
                    onChange={(e) => setNewEmoAction(e.target.value)}
                    placeholder="e.g. চোখ বড় বড় করে অবাক হয়ে তাকালো"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newEmoSignal.trim() || !newEmoMood.trim() || !newEmoKeywords.trim()}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
                >
                  Add Emotion
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: 3 Expert JSON Training Systems */}
        <div className="min-w-0 lg:col-span-6 space-y-6">
          {/* 1. Auto-Train JSON Dataset (Scenarios, Phases, Emotional Progression & Dialogues) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-900">
                  Auto-Train JSON Dataset (Scenarios, Phases &amp; Emotions)
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadJsonFile(EMOTIONAL_ARC_JSON_TEMPLATE, 'kothamala-emotional-arc-dataset.json')
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sample JSON</span>
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Upload .json File</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Supports <code className="font-mono text-slate-700">scenarios</code> with{' '}
              <code className="font-mono text-slate-700">phases</code> (opening / developing / resolution), explicit per-dialogue{' '}
              <code className="font-mono text-slate-700">emotion</code> (e.g. রাগান্বিত, চাপ ও শর্ত, নরম হওয়া, সম্মত ও খুশি),{' '}
              <code className="font-mono text-slate-700">characters</code>, and{' '}
              <code className="font-mono text-slate-700">conversations</code>.
            </p>
            <textarea
              aria-label="Paste Auto-Train JSON Dataset"
              rows={5}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"scenarios": [{"title": "...", "phases": [{"phase": "opening", "emotion": "রাগান্বিত", "variants": [...]}]}], "characters": [...], "conversations": [...]}'
              className="w-full rounded-lg border border-slate-300 bg-slate-50/40 p-3 font-mono text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!jsonInput.trim()}
                onClick={() => handleJsonImport(jsonInput, 'main')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
              >
                Auto-Train from JSON
              </button>
              <button
                type="button"
                onClick={() => setJsonInput(EMOTIONAL_ARC_JSON_TEMPLATE)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Load Example Schema
              </button>
            </div>

            {trainedScenarios.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  Trained Multi-Phase Scenarios ({trainedScenarios.length})
                </p>
                <div className="max-h-52 space-y-2 overflow-y-auto studio-scroll">
                  {trainedScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{sc.title}</p>
                        <p className="mt-0.5 text-slate-600 line-clamp-2">{sc.summary}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Relation: {sc.relation} · Phases: {sc.phases.length}
                          {sc.phases.some((p) => p.emotion)
                            ? ` · Arc: ${sc.phases
                                .map((p) => p.emotion)
                                .filter(Boolean)
                                .join(' → ')}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onLaunchScenario(sc)}
                          aria-label={`Play scenario ${sc.title}`}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                        >
                          <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                          <span>Play Scene</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveTrainedScenario(sc.id)}
                          aria-label={`Delete scenario ${sc.title}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Train Conversations & Blog Stories (Dedicated JSON System: Scenarios + Characters + Conversations) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-900">
                  Train Conversations &amp; Blog Stories (JSON)
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadJsonFile(STORY_MODULES_JSON_TEMPLATE, 'kothamala-stories-modules.json')
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Template JSON</span>
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Upload Stories .json</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">1. scenarios</p>
                <p className="text-slate-500">Multi-phase beats &amp; triggers</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">2. characters</p>
                <p className="text-slate-500">Auto-adds playable personas</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">3. conversations</p>
                <p className="text-slate-500">Prompt, reply &amp; emotion</p>
              </div>
            </div>

            <div>
              <label htmlFor="story-json-textarea" className="block text-xs font-semibold text-slate-700">
                Paste JSON with Scenarios, Characters &amp; Conversations
              </label>
              <textarea
                id="story-json-textarea"
                rows={5}
                value={storyJsonInput}
                onChange={(e) => setStoryJsonInput(e.target.value)}
                placeholder='{"scenarios": [...], "characters": [{"name": "...", "relation": "mother"}], "conversations": [{"prompt": "...", "response": "...", "emotion": "রাগান্বিত"}]}'
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/40 p-3 font-mono text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!storyJsonInput.trim()}
                onClick={() => handleJsonImport(storyJsonInput, 'story')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
              >
                Train Stories &amp; Characters JSON
              </button>
              <button
                type="button"
                onClick={() => setStoryJsonInput(STORY_MODULES_JSON_TEMPLATE)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Load 3-Module JSON
              </button>
            </div>

            {trainedCharacters.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-700">
                  Trained &amp; Custom Characters ({trainedCharacters.length})
                </p>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto studio-scroll">
                  {trainedCharacters.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {ch.name}{' '}
                          <span className="font-normal text-slate-500">· {ch.role}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-600 truncate">
                          {ch.personalitySummary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectCharacter(ch.id)}
                        className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 shrink-0"
                      >
                        Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trainedConversations.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-700">
                  Trained Emotion Dialogues ({trainedConversations.length})
                </p>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto studio-scroll">
                  {trainedConversations.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          Trigger: {item.prompt}{' '}
                          <span className="font-medium text-blue-700">· Emotion: {item.emotion}</span>
                        </p>
                        <p className="mt-0.5 text-slate-600 line-clamp-2">
                          Reply: {item.response}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveTrainedConversation(item.id)}
                        aria-label="Delete trained dialogue"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Teach New Bengali / Banglish Word & Emotion (JSON System + Single Form) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-800 shrink-0" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-900">
                  Teach New Bengali / Banglish Word &amp; Emotion
                </h2>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setWordMode('json')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    wordMode === 'json' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  JSON System
                </button>
                <button
                  type="button"
                  onClick={() => setWordMode('form')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    wordMode === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Single Form
                </button>
              </div>
            </div>

            {wordMode === 'json' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Each entry includes <code className="font-mono text-slate-700">root</code>,{' '}
                    <code className="font-mono text-slate-700">emotion</code>,{' '}
                    <code className="font-mono text-slate-700">forms</code> (English &amp; variants), and{' '}
                    <code className="font-mono text-slate-700">meaningBn</code> (definition).
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadJsonFile(LEXICON_JSON_TEMPLATE, 'kothamala-lexicon-words.json')
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      <span>Word Sample</span>
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-100">
                      <Upload className="h-3 w-3" aria-hidden="true" />
                      <span>Upload Words .json</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleWordJsonFileUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <textarea
                  aria-label="Paste Word & Emotion JSON"
                  rows={5}
                  value={wordJsonInput}
                  onChange={(e) => setWordJsonInput(e.target.value)}
                  placeholder='[{"root": "আহ্লাদ", "emotion": "খুশি", "forms": ["আহ্লাদ", "ahlad", "joy"], "meaningBn": "আদরের মিষ্টি আবদার"}]'
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/40 p-3 font-mono text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!wordJsonInput.trim()}
                    onClick={() => handleWordJsonImport(wordJsonInput)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
                  >
                    Train Word Lexicon JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordJsonInput(LEXICON_JSON_TEMPLATE)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Load Word JSON Example
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTeachWordForm} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="teach-word-root" className="block text-xs font-semibold text-slate-700">
                      Root Word *
                    </label>
                    <input
                      id="teach-word-root"
                      type="text"
                      value={wordRoot}
                      onChange={(e) => setWordRoot(e.target.value)}
                      placeholder="e.g. অভিমান or আহ্লাদ"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="teach-word-emotion"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Associated Emotion
                    </label>
                    <select
                      id="teach-word-emotion"
                      value={wordEmotion}
                      onChange={(e) => setWordEmotion(e.target.value as EmotionSignal)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      {allEmotionOptions.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="teach-word-forms" className="block text-xs font-semibold text-slate-700">
                    English &amp; Variant Forms (comma-separated, optional)
                  </label>
                  <input
                    id="teach-word-forms"
                    type="text"
                    value={wordForms}
                    onChange={(e) => setWordForms(e.target.value)}
                    placeholder="e.g. অভিমানী, obhiman, sulking"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="teach-word-meaning"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Meaning &amp; Definition *
                  </label>
                  <input
                    id="teach-word-meaning"
                    type="text"
                    value={wordMeaning}
                    onChange={(e) => setWordMeaning(e.target.value)}
                    placeholder="e.g. কাছের মানুষের প্রতি জমে থাকা আদুরে রাগ বা কষ্ট"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!wordRoot.trim() || !wordMeaning.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
                >
                  Add to Lexicon
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Browsable Lexicon + Self-Learned ML Patterns */}
        <div className="min-w-0 lg:col-span-6 space-y-6">
          {/* Self-Learned ML Patterns */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-900">
                  Self-Learned ML Patterns ({selfLearnedPatterns.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Auto-synthesized locally</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Patterns automatically generalized by the TF-IDF &amp; Reinforcement Learner from uploaded scenarios, dialogues, and your 👍 feedback in chat.
            </p>

            {selfLearnedPatterns.length > 0 ? (
              <div className="mt-3 max-h-52 space-y-2 overflow-y-auto studio-scroll pr-1">
                {selfLearnedPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">
                        Cues: {pat.triggerTokens.join(', ')} · Emotion: {pat.emotion}
                      </p>
                      <p className="mt-0.5 text-slate-600 line-clamp-2">{pat.response}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveSelfLearnedPattern(pat.id)}
                      aria-label="Delete self-learned pattern"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500">
                Train a JSON dataset or rate replies with 👍 in Roleplay Studio, then click{' '}
                <strong className="text-slate-700">Run Self-Learning Cycle</strong> to synthesize generalized behavioral patterns.
              </div>
            )}
          </div>

          {/* Browsable Bengali & Banglish Lexicon */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Trained Bengali &amp; Banglish Lexicon ({allLexicon.length} word groups)
                </h2>
                <p className="text-xs text-slate-500">
                  Ask &ldquo;[word] mane ki?&rdquo; or &ldquo;[শব্দ] মানে কী?&rdquo; in chat to test word meaning recall.
                </p>
              </div>
            </div>

            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="lexicon-search" className="sr-only">
                Search words or Banglish terms
              </label>
              <input
                id="lexicon-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search in Bengali or Banglish (e.g. khoka, obhiman, ranna)..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50/40 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-4 flex-1 space-y-2.5 max-h-[640px] overflow-y-auto studio-scroll pr-1">
              {filteredLexicon.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-editorial text-base font-bold text-slate-900">
                        {entry.root}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500">
                        Category: {entry.category} · Emotion: {entry.emotion}
                      </p>
                    </div>
                    {entry.isUserTrained && (
                      <button
                        type="button"
                        onClick={() => onRemoveLexiconEntry(entry.id)}
                        aria-label={`Delete ${entry.root}`}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">{entry.meaningBn}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Forms / English &amp; Variants: {entry.forms.slice(0, 6).join(', ')}
                  </p>
                </article>
              ))}

              {filteredLexicon.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No matching words found — train it using the JSON system on the left!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { RELATIONSHIP_KNOWLEDGE } from '../data/relationshipKnowledge';
import { SHARED_BENGALI_TOPICS } from '../data/sharedBengaliKnowledge';
import { DATASET_NATURAL_PAIRS } from '../data/trainedNaturalDataset';
import { NSFW_BANGLISH_PAIRS } from '../data/nsfwBanglishDataset';
import { NSFW_MEGA_PAIRS } from '../data/nsfwMegaDataset';
import { PROGRESSIVE_SCENARIOS } from '../data/progressiveScenarios';
import {
  analyzeSentenceSemantics,
  composeEmotionAwareReply,
  mapEmotionToMood,
  normalizeBengaliText,
  parseScenarioArc,
  stemBengaliWord,
} from './localIntelligence';
import { LocalMLModel } from './localML';
import {
  composeContextualContinuityReply,
  composeDynamicContextualReply,
  composeMetaFeedbackReply,
  extractQuestionFromReply,
} from './contextualComposer';
import {
  CharacterMood,
  ConversationTurnSnapshot,
  CustomEmotionDefinition,
  DialogueTopic,
  DialogueVariant,
  EmotionSignal,
  LexiconEntry,
  MLFeedbackSample,
  MLSelfLearnedPattern,
  PersonaRelation,
  RoleplayCharacter,
  RoleplaySetupDraft,
  ScenarioArc,
  SentenceAnalysis,
  SessionMemory,
  TrainedConversationItem,
  TrainedScenario,
  TrainedScenarioPhase,
} from '../types/roleplay';

export interface LocalIntelligenceContext {
  extraLexicon?: LexiconEntry[];
  trainedConversations?: TrainedConversationItem[];
  trainedScenarios?: TrainedScenario[];
  selfLearnedPatterns?: MLSelfLearnedPattern[];
  feedbackSamples?: MLFeedbackSample[];
  customEmotions?: CustomEmotionDefinition[];
}

export interface RoleplayReplyResult {
  replyText: string;
  replyKey?: string;
  action: string;
  mood: CharacterMood;
  followUps: string[];
  matchedTopic: string;
  detectedUserEmotion: EmotionSignal;
  understoodWords: string[];
  updatedMemory: SessionMemory;
}

export const normalizeBengaliInput = normalizeBengaliText;

export function formatBengaliLocation(setting: string): string {
  const trimmed = setting.trim();
  if (!trimmed) return 'এখানে';
  if (/(?:য়|য়|তে|য়ে|য়ে|ে|র|এ|\))$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}-এ`;
}

export function inferCharacterRelation(
  character: RoleplayCharacter,
  userInput: string,
  memory: SessionMemory
): PersonaRelation {
  const normalizedInput = normalizeBengaliText(userInput);
  const metaText = normalizeBengaliText(
    `${character.role} ${character.name} ${character.greeting} ${character.personalitySummary}`
  );

  if (/(?:^|\s)(আম্মু|আম্মা|মা গো|মায়ের)(?:\s|$)/.test(normalizedInput)) {
    return 'mother';
  }
  if (/(?:^|\s)(আব্বু|আব্বা|বাবা)(?:\s|$)/.test(normalizedInput)) {
    return 'father';
  }
  if (/(?:^|\s)(বউ|স্ত্রী|জামাই|স্বামী|গিন্নি|বেগম|ওগো)(?:\s|$)/.test(normalizedInput)) {
    return 'spouse';
  }
  if (/(?:^|\s)(গার্লফ্রেন্ড|বয়ফ্রেন্ড|প্রেমিকা|প্রেমিক|বেবি|জান|gf|bf)(?:\s|$)/.test(normalizedInput)) {
    return 'romantic';
  }
  if (/(?:^|\s)(ভাইয়া|ভাইয়া|আপু|বোন)(?:\s|$)/.test(normalizedInput)) {
    return 'sibling';
  }
  if (/(?:^|\s)(স্যার|ম্যাম|গুরু|উস্তাদ)(?:\s|$)/.test(normalizedInput)) {
    return 'mentor';
  }
  if (/(?:^|\s)(দোস্ত|মামা|ব্রো)(?:\s|$)/.test(normalizedInput)) {
    return 'friend';
  }

  if (character.relation && character.relation !== 'story') {
    return character.relation;
  }

  if (memory.detectedRelation && memory.detectedRelation !== 'story') {
    return memory.detectedRelation;
  }

  if (/(আম্মু|আম্মা|মা|জননী|mother|mom)/.test(metaText)) {
    return 'mother';
  }
  if (/(আব্বু|আব্বা|বাবা|পিতা|father|dad)/.test(metaText)) {
    return 'father';
  }
  if (/(বউ|স্ত্রী|জামাই|স্বামী|গিন্নি|দাম্পত্য|সংসার|wife|husband)/.test(metaText)) {
    return 'spouse';
  }
  if (/(গার্লফ্রেন্ড|বয়ফ্রেন্ড|প্রেমিকা|প্রেমিক|ভালোবাসার মানুষ|gf|bf|girlfriend|boyfriend)/.test(metaText)) {
    return 'romantic';
  }
  if (/(ভাইয়া|ভাইয়া|আপু|বড় ভাই|বড় বোন|sibling|brother|sister)/.test(metaText)) {
    return 'sibling';
  }
  if (/(শিক্ষক|অধ্যাপক|গুরু|মেন্টর|teacher|mentor)/.test(metaText)) {
    return 'mentor';
  }
  if (/(বন্ধু|দোস্ত|আড্ডা|friend)/.test(metaText)) {
    return 'friend';
  }

  return character.relation || 'story';
}

export function extractUserName(rawInput: string): string | undefined {
  const cleaned = rawInput.trim();
  const patterns: RegExp[] = [
    /(?:আমার\s+নাম|আমি\s+হলাম|আমাকে\s+ডাকতে\s+পারো)\s+([^\s।,!?]{2,20})/i,
    /(?:amar\s+naam|amar\s+nam|my\s+name\s+is|i\s+am)\s+([a-zA-Z\u0980-\u09FF]{2,20})/i,
  ];

  const stopWords = new Set([
    'ভালো',
    'খারাপ',
    'কী',
    'কেমন',
    'একজন',
    'তোমার',
    'ভাল',
    'valobashi',
    'fine',
    'good',
    'sad',
  ]);

  for (const regex of patterns) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const candidate = match[1].replace(/[।,!?.]/g, '').trim();
      if (candidate.length >= 2 && !stopWords.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }
  return undefined;
}

function getDefaultAddressTerm(relation: PersonaRelation): string {
  const pack = RELATIONSHIP_KNOWLEDGE[relation];
  if (pack) return pack.defaultTerm;
  return 'বন্ধু';
}

function interpolateTemplate(
  template: string,
  character: RoleplayCharacter,
  relation: PersonaRelation,
  userName?: string
): string {
  const friendlyName = userName ? userName : getDefaultAddressTerm(relation);
  const locativeSetting = formatBengaliLocation(character.setting);

  return template
    .replace(/\{userName\}/g, friendlyName)
    .replace(/\{charName\}/g, character.name)
    .replace(/\{charRole\}/g, character.role)
    .replace(/\{charSettingLoc\}/g, locativeSetting)
    .replace(/\{charSetting\}/g, character.setting)
    .replace(/\s+([।,!?])/g, '$1');
}

function pickNonRepeatingVariant(
  variants: DialogueVariant[],
  topicKey: string,
  recentKeys: string[]
): { variant: DialogueVariant; key: string } {
  for (let i = 0; i < variants.length; i++) {
    const key = `${topicKey}:${i}`;
    if (!recentKeys.includes(key)) {
      return { variant: variants[i], key };
    }
  }
  const fallbackIndex = variants.length > 1 ? recentKeys.length % variants.length : 0;
  return {
    variant: variants[fallbackIndex],
    key: `${topicKey}:${fallbackIndex}`,
  };
}

const WEAK_VOCATIVE_OR_TIME_TOKENS = new Set([
  'আম্মু',
  'আম্মা',
  'মা',
  'আব্বু',
  'আব্বা',
  'বাবা',
  'দোস্ত',
  'মামা',
  'ব্রো',
  'ভাই',
  'ভাইয়া',
  'আপু',
  'বউ',
  'জামাই',
  'ওগো',
  'জান',
  'সোনা',
  'রাত',
  'সকাল',
  'বিকাল',
  'আজ',
  'আজকে',
  'কাল',
]);

function scoreTopicMatch(
  normalizedInput: string,
  stemmedTokens: string[],
  topic: DialogueTopic,
  priorityBonus: number,
  analysis?: SentenceAnalysis,
  mlModel?: LocalMLModel
): number {
  const inputTokens = normalizedInput.split(/\s+/).filter(Boolean);
  let contentScore = 0;
  let weakHits = 0;

  for (const kw of topic.keywords) {
    const normKw = normalizeBengaliText(kw);
    if (!normKw) continue;

    if (!normKw.includes(' ') && WEAK_VOCATIVE_OR_TIME_TOKENS.has(normKw)) {
      if (inputTokens.includes(normKw)) {
        weakHits += 1;
      }
      continue;
    }

    if (normalizedInput === normKw) {
      contentScore += 24;
    } else if (!normKw.includes(' ') && normKw.length <= 3) {
      if (inputTokens.includes(normKw) || stemmedTokens.includes(normKw)) {
        contentScore += 10;
      }
    } else if (normalizedInput.includes(normKw)) {
      contentScore += 10 + Math.min(normKw.length, 10);
    } else {
      const stemKw = stemBengaliWord(normKw);
      if (stemKw.length >= 3 && stemmedTokens.includes(stemKw)) {
        contentScore += 8;
      }
    }
  }

  if (contentScore === 0) {
    return 0;
  }

  // Prevent negated inputs from accidentally firing positive opposing topics
  if (analysis?.isNegated) {
    if (topic.topic === 'user_wellbeing') {
      return 0;
    }
    if (
      topic.topic === 'tea_coffee_food' &&
      /(?:খাবো না|খাই না|খাবার খাবো না)/.test(normalizedInput)
    ) {
      return 0;
    }
    if (
      topic.topic === 'love_friendship' &&
      /(?:ভালোবাসি না|বন্ধু না)/.test(normalizedInput)
    ) {
      return 0;
    }
  }

  // Greeting topics should yield when user brings substantial real-world problem/subject tokens
  const isGreetingTopic =
    topic.topic === 'greeting' ||
    topic.topic.endsWith('_greeting') ||
    topic.topic === 'friend_greeting_adda' ||
    topic.topic === 'romantic_greeting_miss' ||
    topic.topic === 'spouse_greeting_home';

  if (
    isGreetingTopic &&
    (analysis?.intent === 'complaint_vent' ||
      (analysis?.subjectKeywords && analysis.subjectKeywords.length >= 2 && contentScore < 20))
  ) {
    contentScore = Math.max(0, contentScore - 14);
    if (contentScore === 0) return 0;
  }

  let totalScore = contentScore + Math.min(weakHits, 2);

  // Only award relation priority bonus and semantic ML similarity boost once a real topic cue matched
  if (contentScore >= 8) {
    totalScore += priorityBonus;
    if (mlModel && topic.responses[0]?.text) {
      const sim = mlModel.scoreSimilarity(
        normalizedInput,
        `${topic.labelBn} ${topic.responses[0].text}`
      );
      totalScore += Math.round(sim * 8);
    }
  }

  return totalScore;
}

const TRAINED_STOP_STEMS = new Set([
  'কী',
  'কি',
  'কেন',
  'কোথায়',
  'কোথায়',
  'কেমন',
  'করে',
  'কর',
  'করো',
  'করছ',
  'করছিস',
  'আজ',
  'আজকে',
  'থেকে',
  'আমার',
  'তোমার',
  'তোর',
  'তুই',
  'তুমি',
  'আমি',
  'আম্মু',
  'মা',
  'ভাই',
  'বন্ধু',
  'দোস্ত',
]);

function matchTrainedConversations(
  normalizedInput: string,
  stemmedTokens: string[],
  relation: PersonaRelation,
  trainedItems: TrainedConversationItem[],
  currentPhase?: 'opening' | 'developing' | 'resolution',
  recentKeys: string[] = [],
  mlModel?: LocalMLModel
): TrainedConversationItem | null {
  const inputTokens = normalizedInput.split(/\s+/).filter(Boolean);
  const meaningfulInputStems = stemmedTokens.filter(
    (s) => s.length >= 2 && !TRAINED_STOP_STEMS.has(s)
  );

  const candidates: Array<{ item: TrainedConversationItem; score: number }> = [];

  for (const item of trainedItems) {
    if (item.relation !== 'any' && item.relation !== relation) continue;

    let score = 0;

    if (item.keywords && item.keywords.length > 0) {
      for (const kw of item.keywords) {
        const normKw = normalizeBengaliText(kw);
        if (!normKw) continue;
        if (normalizedInput === normKw) {
          score += 32;
        } else if (!normKw.includes(' ') && normKw.length <= 3) {
          if (inputTokens.includes(normKw) || stemmedTokens.includes(normKw)) {
            score += 18;
          }
        } else if (normalizedInput.includes(normKw)) {
          score += 18 + Math.min(normKw.length, 10);
        } else {
          const stemKw = stemBengaliWord(normKw);
          if (stemKw.length >= 3 && meaningfulInputStems.includes(stemKw)) {
            score += 16;
          }
        }
      }
    } else {
      const normPrompt = normalizeBengaliText(item.prompt);
      if (!normPrompt) continue;

      if (normalizedInput === normPrompt) {
        score = 40;
      } else if (
        normPrompt.length >= 8 &&
        (normalizedInput.includes(normPrompt) || normPrompt.includes(normalizedInput))
      ) {
        score = 24;
      } else {
        const promptStems = normPrompt
          .split(/\s+/)
          .map(stemBengaliWord)
          .filter((s) => s.length >= 2 && !TRAINED_STOP_STEMS.has(s));

        if (promptStems.length > 0) {
          const overlap = promptStems.filter((ps) => meaningfulInputStems.includes(ps)).length;
          const coverage = overlap / promptStems.length;
          if (overlap >= 2 && coverage >= 0.6) {
            score = overlap * 10;
          } else if (promptStems.length === 1 && overlap === 1 && meaningfulInputStems.length <= 3) {
            score = 16;
          }
        }
      }
    }

    // ML TF-IDF semantic similarity rescue for paraphrased inputs on user-trained items
    if (score === 0 && mlModel && !item.id.startsWith('np-')) {
      const sim = mlModel.scoreSimilarity(
        normalizedInput,
        `${item.prompt} ${(item.keywords || []).join(' ')}`
      );
      if (sim >= 0.42) {
        score = Math.round(sim * 30);
      }
    }

    if (score > 0) {
      if (item.relation === relation) score += 6;
      if (currentPhase && item.phase === currentPhase) score += 10;
      if (mlModel) {
        score += mlModel.getFeedbackBoost(`trained:${item.id}`);
      }
      if (score >= 14) {
        candidates.push({ item, score });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const topScore = candidates[0].score;
  const topBand = candidates.filter((c) => c.score >= topScore - 4);
  const fresh = topBand.find((c) => !recentKeys.includes(`trained:${c.item.id}`));
  return (fresh || topBand[0]).item;
}


/**
 * Builds a complete live RoleplayCharacter from an interactive Opening Setup prompt + Scenario Arc.
 */
export function buildCharacterFromSetup(
  draft: RoleplaySetupDraft,
  rawScenarioText?: string
): { character: RoleplayCharacter; initialMemory: SessionMemory } {
  const relationLabels: Record<PersonaRelation, string> = {
    mother: 'স্নেহময়ী মা (Mother)',
    father: 'দায়িত্বশীল বাবা (Father)',
    sibling: draft.gender === 'female' ? 'বোন / আপু (Sibling)' : 'ভাই (Sibling)',
    friend: 'প্রিয় বন্ধু (Best Friend)',
    romantic: draft.gender === 'female' ? 'প্রেমিকা (Girlfriend)' : 'প্রেমিক (Boyfriend)',
    spouse: draft.gender === 'female' ? 'স্ত্রী / বউ (Wife)' : 'স্বামী / জামাই (Husband)',
    mentor: 'শিক্ষক / মেন্টর (Mentor)',
    story: 'রোলপ্লে চরিত্র (Story Role)',
  };

  const arc: ScenarioArc = rawScenarioText
    ? parseScenarioArc(rawScenarioText, draft.relation)
    : {
        summary: 'বাস্তবসম্মত দৈনন্দিন কথোপকথন ও সম্পর্কের গল্প',
        openingBeat: 'দৈনন্দিন কুশল ও দৃশ্যপটের সূচনা',
        middleBeat: 'কথার ভেতর দিয়ে অনুভূতি, খুনসুটি বা মূল ঘটনার বিকাশ',
        endingBeat: 'আন্তরিকতা ও সমঝোতায় সুন্দর পরিণতি',
        currentPhase: 'opening',
      };

  const agePart = draft.characterAge ? `, বয়স ${draft.characterAge}` : '';
  const userTerm = draft.userName || getDefaultAddressTerm(draft.relation);
  const setting = draft.setting || 'আমাদের বাসায়';

  let openingGreeting = '';
  let greetingAction = 'দৃশ্যপটে এসে স্বাভাবিকভাবে তাকালো';
  let followUps: string[] = [];

  if (draft.relation === 'mother') {
    openingGreeting = rawScenarioText
      ? `এই যে ${userTerm}, আয় এদিকে। (${arc.openingBeat}) — বল, এখন কেমন আছিস আর কী করছিস?`
      : `আয় ${userTerm}, হাত-মুখ ধুয়ে নে! আমি ${draft.characterName}—তোর আম্মু। সকাল থেকে তোর কোনো খোঁজ নেই কেন, খেয়েছিস তো?`;
    greetingAction = 'স্নেহময় চোখে তাকিয়ে কাছে ডাকলো';
    followUps = ['কি কর আম্মু?', 'আজ কী রান্না করেছো?', 'একটু মন খারাপ আম্মু'];
  } else if (draft.relation === 'romantic') {
    openingGreeting = rawScenarioText
      ? `এই ${userTerm}, অবশেষে এলে! (${arc.openingBeat}) — বলো না, কেমন আছো?`
      : `অবশেষে সময় হলো কথা বলার ${userTerm}? আমি ${draft.characterName}। সারাদিন তোমার মেসেজের অপেক্ষায় ছিলাম!`;
    greetingAction = 'হালকা অভিমান মিশ্রিত হাসিতে তাকালো';
    followUps = ['সরি জান, অনেক মিস করছিলাম!', 'রাগ করেছো নাকি?', 'ki koro?'];
  } else if (draft.relation === 'spouse') {
    openingGreeting = rawScenarioText
      ? `এই যে ${userTerm}, ঘরে এলে? (${arc.openingBeat}) — বসো, চা নিয়ে আসছি।`
      : `বাসায় ফিরলে ${userTerm}? আমি ${draft.characterName}। সারাদিনের কাজের পর একটু বসো—আজ কী বাজার এনেছো দেখি?`;
    greetingAction = 'হাতে চায়ের কাপ নিয়ে দরজার পাশে দাঁড়ালো';
    followUps = ['বাজার থেকে ইলিশ এনেছি', 'ajke khub klanto lagche', 'ki ranna korcho?'];
  } else if (draft.relation === 'friend') {
    openingGreeting = rawScenarioText
      ? `কিরে ${userTerm}! (${arc.openingBeat}) — কী অবস্থা তোর?`
      : `কিরে ${userTerm} মামা! আমি ${draft.characterName}। এতদিন পর দেখা—চল টং-এ বসে এক কাপ চা আর আড্ডা দেই!`;
    greetingAction = 'হেসে কাঁধে চাপড় দিল';
    followUps = ['ki khobor dost?', 'চল আড্ডা মারি', 'treat de ajke!'];
  } else if (draft.relation === 'sibling') {
    openingGreeting = rawScenarioText
      ? `এই ${userTerm}! (${arc.openingBeat}) — তুই কি করছিস এখন?`
      : `কিরে ${userTerm}! আমি ${draft.characterName}। তুই কি আমার হেডফোন নিয়েছিস নাকি?`;
    greetingAction = 'দুষ্টুমি ভরা চোখে তাকালো';
    followUps = ['tui ki korchis?', 'amar headphone koi?', 'chol cha khai'];
  } else {
    openingGreeting = rawScenarioText
      ? `হ্যালো ${userTerm}, আমি ${draft.characterName}${agePart}। (${arc.openingBeat}) — চলো শুরু করি!`
      : `কেমন আছো ${userTerm}? আমি ${draft.characterName}${agePart}। চলো আমাদের গল্প শুরু করা যাক!`;
    followUps = ['kemon acho?', 'ki koro?', 'golpo shuru kori'];
  }

  const mood: CharacterMood =
    draft.relation === 'mother' || draft.relation === 'father'
      ? 'স্নেহশীল'
      : draft.relation === 'romantic' || draft.relation === 'spouse'
        ? 'ভালোবাসাময়'
        : draft.relation === 'friend' || draft.relation === 'sibling'
          ? 'উৎফুল্ল'
          : 'শান্ত';

  const character: RoleplayCharacter = {
    id: `setup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: draft.characterName,
    englishName: draft.characterName,
    role: `${relationLabels[draft.relation]}${agePart}`,
    setting,
    eraOrVibe: arc.summary,
    gender: draft.gender,
    age: draft.characterAge,
    relation: draft.relation,
    scenarioArc: arc,
    avatarUrl: '',
    accentHex: draft.gender === 'female' ? '#E11D48' : '#2563EB',
    personalitySummary:
      draft.personality ||
      `${draft.characterName} (${relationLabels[draft.relation]}${agePart}) — কাস্টম সিনারিও রোলপ্লে চরিত্র।`,
    greeting: openingGreeting,
    greetingAction,
    initialFollowUps: followUps,
    voiceDefaults:
      draft.gender === 'female'
        ? { pitch: 1.18, rate: 0.96, timbreHz: 242 }
        : { pitch: 0.8, rate: 0.96, timbreHz: 118 },
    storyBranches: [
      {
        id: 'arc-middle',
        title: 'Next Scene: Story Twist',
        promptText: arc.middleBeat,
        sceneAction: 'পরিস্থিতির পরিবর্তন দেখে গলা ও দৃষ্টি বদলে তাকালো',
        characterReply:
          draft.relation === 'mother'
            ? `শোন ${userTerm}, এই ব্যাপারটা (${arc.middleBeat}) কিন্তু আমি একদমই সহজভাবে নিচ্ছি না। এখন কী করতে চাচ্ছিস স্পষ্ট করে বল তো!`
            : `আচ্ছা ${userTerm}, বিষয়টা (${arc.middleBeat}) বেশ গভীর দিকে যাচ্ছে! এখন আমাদের পরের পদক্ষেপ কী হবে বলো?`,
        mood: draft.relation === 'mother' ? 'শাসনমিশ্রিত স্নেহ' : 'আবেগপ্রবণ',
        nextChoices: followUps,
      },
      {
        id: 'arc-ending',
        title: 'Climax & Ending Scene',
        promptText: arc.endingBeat,
        sceneAction: 'দীর্ঘ নিশ্বাস ফেলে নরম অথচ স্পষ্ট সুরে কথা বললো',
        characterReply:
          draft.relation === 'mother'
            ? `সব শেষে (${arc.endingBeat})—আমার কাছে তোর ভালো থাকাটাই সবচেয়ে জরুরি ${userTerm}। যা, আর মন খারাপ করে থাকিস না।`
            : `অবশেষে (${arc.endingBeat})। আজকের এই মুহূর্তটা সত্যিই মনে রাখার মতো হয়ে রইলো ${userTerm}।`,
        mood: 'আবেগপ্রবণ',
        nextChoices: followUps,
      },
    ],
    topics: [],
    fallbacks: [
      {
        text: `হুম, বুঝতে পারছি ${userTerm}—(${arc.openingBeat}) এই পরিস্থিতিতে তোর কথাটা গুরুত্ব দিয়ে শুনছি। এরপর কী হলো বল?`,
        action: 'দৃশ্যপটের সাথে তাল মিলিয়ে মনোযোগ দিল',
        mood,
        followUps,
      },
    ],
    isCustom: true,
  };

  const initialMemory: SessionMemory = {
    userName: draft.userName,
    detectedRelation: draft.relation,
    affinity: 35,
    turnCount: 0,
    recentResponseKeys: [],
    currentMood: mood,
    lastTopic: character.id,
    scenarioArc: arc,
  };

  return { character, initialMemory };
}

/**
 * Builds a complete playable RoleplayCharacter + SessionMemory from an imported JSON TrainedScenario
 * containing multi-phase beats (opening, developing, resolution) and phase-specific dialogues.
 */
export function buildCharacterFromTrainedScenario(
  scenario: TrainedScenario
): { character: RoleplayCharacter; initialMemory: SessionMemory } {
  const relation = scenario.relation || 'story';
  const gender =
    scenario.gender || (relation === 'mother' ? 'female' : relation === 'father' ? 'male' : 'female');
  const name = scenario.characterName || scenario.title;

  const findBeat = (phase: 'opening' | 'developing' | 'resolution', fallback: string) =>
    scenario.phases.find((p) => p.phase === phase)?.beat || fallback;

  const arc: ScenarioArc = {
    summary: scenario.summary,
    openingBeat: findBeat('opening', 'দৃশ্যপটের সূচনা'),
    middleBeat: findBeat('developing', 'মূল ঘটনার বিকাশ'),
    endingBeat: findBeat('resolution', 'আন্তরিক সমাপ্তি'),
    currentPhase: 'opening',
  };

  const openingPhase = scenario.phases.find((p) => p.phase === 'opening') || scenario.phases[0];
  const openingVariant = openingPhase?.responses[0];
  const greeting =
    scenario.greeting ||
    openingVariant?.text ||
    `হ্যালো, আমি ${name}। (${arc.openingBeat}) — চলো আমাদের দৃশ্যপট শুরু করি!`;
  const greetingAction =
    scenario.greetingAction || openingVariant?.action || 'স্বাভাবিক ভঙ্গিতে সামনে তাকালো';
  const followUps =
    openingVariant?.followUps?.length
      ? openingVariant.followUps
      : ['তারপর কী হলো?', 'এখন কী করবে?', 'চল কথা বলি'];

  const mood: CharacterMood =
    openingVariant?.mood ||
    openingPhase?.emotion ||
    (relation === 'mother' || relation === 'father' ? 'স্নেহশীল' : 'শান্ত');

  const ageSuffix = scenario.characterAge ? `, বয়স ${scenario.characterAge}` : '';
  const character: RoleplayCharacter = {
    id: `scenario-${scenario.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    name,
    englishName: scenario.title,
    role: `${scenario.title}${ageSuffix}`,
    setting: scenario.setting || 'আমাদের বাসায়',
    eraOrVibe: scenario.summary,
    gender,
    age: scenario.characterAge,
    relation,
    scenarioArc: arc,
    scenarioPhases: scenario.phases,
    avatarUrl: '',
    accentHex: gender === 'female' ? '#E11D48' : '#2563EB',
    personalitySummary: scenario.summary,
    greeting,
    greetingAction,
    initialFollowUps: followUps,
    voiceDefaults:
      gender === 'female'
        ? { pitch: 1.18, rate: 0.96, timbreHz: 242 }
        : { pitch: 0.8, rate: 0.96, timbreHz: 118 },
    storyBranches: scenario.phases
      .filter((p) => p.phase !== 'opening')
      .map((p, idx) => {
        const rep = p.responses[0];
        return {
          id: `trained-phase-${p.phase}-${idx}`,
          title: p.phase === 'developing' ? `Phase 2: ${p.beat}` : `Phase 3: ${p.beat}`,
          promptText: p.keywords?.[0] || p.beat,
          sceneAction: rep?.action || 'পরিস্থিতি অনুযায়ী ভঙ্গি বদলে তাকালো',
          characterReply: rep?.text || `এখন (${p.beat}) — চলো এই অংশে এগিয়ে যাই!`,
          mood: rep?.mood || mood,
          nextChoices: rep?.followUps?.length ? rep.followUps : followUps,
        };
      }),
    topics: [],
    fallbacks: [
      {
        text: `হুম, (${arc.openingBeat}) — বলো, এই অবস্থায় কী বলতে চাচ্ছো?`,
        action: 'মনোযোগ দিয়ে শুনছে',
        mood,
        followUps,
      },
    ],
    isCustom: true,
  };

  const initialMemory: SessionMemory = {
    detectedRelation: relation,
    affinity: 35,
    turnCount: 0,
    recentResponseKeys: [],
    currentMood: mood,
    lastTopic: character.id,
    scenarioArc: arc,
  };

  return { character, initialMemory };
}

function detectPersuasionOrResolutionSignal(normalized: string): {
  isPersuasive: boolean;
  isDefiantOrRefusal: boolean;
} {
  const isPersuasive =
    /(সরি|ক্ষমা|মাফ|কথা দিচ্ছি|পড়ে নেবো|পড়বো|মানছি|প্লিজ|অনুরোধ|ঠিক আছে|রাজি|বুঝেছি|রাগ করো না|please|sorry|promise)/.test(
      normalized
    );
  const isDefiantOrRefusal =
    /(পড়বো না|খেলতে যাবো|যাবই|ভালো লাগে না|না এখন|করবো না|parbo na|khelte jabo|porbo na)/.test(
      normalized
    );
  return { isPersuasive, isDefiantOrRefusal };
}

function advanceScenarioArc(
  arc: ScenarioArc | undefined,
  nextTurn: number,
  normalizedInput = ''
): ScenarioArc | undefined {
  if (!arc) return undefined;
  const { isPersuasive } = detectPersuasionOrResolutionSignal(normalizedInput);
  let currentPhase: ScenarioArc['currentPhase'] =
    nextTurn <= 2 ? 'opening' : nextTurn <= 5 ? 'developing' : 'resolution';
  if (isPersuasive && nextTurn >= 2) {
    currentPhase = nextTurn >= 3 ? 'resolution' : 'developing';
  }
  return { ...arc, currentPhase };
}

export function createInitialMemory(character: RoleplayCharacter): SessionMemory {
  const initialRelation = inferCharacterRelation(character, '', {
    affinity: 25,
    turnCount: 0,
    recentResponseKeys: [],
    currentMood: 'শান্ত',
  });
  const initialMood: CharacterMood =
    initialRelation === 'mother' || initialRelation === 'father'
      ? 'স্নেহশীল'
      : initialRelation === 'romantic' || initialRelation === 'spouse'
        ? 'ভালোবাসাময়'
        : 'শান্ত';

  return {
    affinity: 25,
    turnCount: 0,
    recentResponseKeys: [],
    currentMood: initialMood,
    lastTopic: character.id,
    detectedRelation: initialRelation,
    scenarioArc: character.scenarioArc,
    recentTurns: [],
    mentionedSubjects: [],
  };
}

function appendTurnMemory(
  memory: SessionMemory,
  params: {
    userText: string;
    normalizedUserText: string;
    replyText: string;
    lastTopic: string;
    mood: CharacterMood;
    relation: PersonaRelation;
    effectiveUserName?: string;
    nextTurn: number;
    affinityDelta: number;
    analysis: SentenceAnalysis;
    understoodWords: string[];
    updatedArc?: ScenarioArc;
    recentKey?: string;
    overridePhase?: ScenarioArc['currentPhase'];
  }
): SessionMemory {
  const botQuestion = extractQuestionFromReply(params.replyText);
  const turnSubjects = params.analysis.subjectKeywords || [];
  const mergedSubjects = Array.from(
    new Set([...(memory.mentionedSubjects || []), ...turnSubjects])
  ).slice(-10);

  const snapshot: ConversationTurnSnapshot = {
    userText: params.userText,
    normalizedUserText: params.normalizedUserText,
    botReply: params.replyText,
    botQuestion,
    topic: params.lastTopic,
    intent: params.analysis.intent,
    subjects: turnSubjects,
  };

  return {
    ...memory,
    userName: params.effectiveUserName,
    detectedRelation: params.relation,
    turnCount: params.nextTurn,
    affinity: Math.min(100, memory.affinity + params.affinityDelta),
    lastTopic: params.lastTopic,
    recentResponseKeys: params.recentKey
      ? [...memory.recentResponseKeys.slice(-8), params.recentKey]
      : memory.recentResponseKeys,
    currentMood: params.mood,
    lastUserEmotion: params.analysis.dominantEmotion,
    lastUnderstoodWords: params.understoodWords,
    scenarioArc:
      params.overridePhase && params.updatedArc
        ? { ...params.updatedArc, currentPhase: params.overridePhase }
        : params.updatedArc,
    recentTurns: [...(memory.recentTurns || []).slice(-5), snapshot],
    pendingQuestion: botQuestion,
    pendingTopic: params.lastTopic,
    mentionedSubjects: mergedSubjects,
  };
}

export function generateRoleplayReply(
  userInput: string,
  character: RoleplayCharacter,
  memory: SessionMemory,
  intelligenceContext?: LocalIntelligenceContext
): RoleplayReplyResult {
  const trimmed = userInput.trim();
  const customEmotions = intelligenceContext?.customEmotions || [];
  const analysis = analyzeSentenceSemantics(
    trimmed,
    intelligenceContext?.extraLexicon || [],
    customEmotions
  );
  const mlModel = new LocalMLModel(
    intelligenceContext?.extraLexicon || [],
    intelligenceContext?.trainedConversations || [],
    intelligenceContext?.trainedScenarios || [],
    intelligenceContext?.selfLearnedPatterns || [],
    intelligenceContext?.feedbackSamples || [],
    customEmotions
  );

  // If rule-based lexicon didn't detect a strong emotion, let Naive Bayes ML predict it!
  if (!analysis.isSensitiveOrInappropriate && analysis.emotionIntensity === 0) {
    const mlPred = mlModel.predictEmotion(trimmed);
    if (mlPred.confidence >= 0.55) {
      analysis.dominantEmotion = mlPred.emotion;
      analysis.emotionIntensity = 3;
    }
  }

  const normalized = analysis.normalizedText;
  const detectedName = extractUserName(trimmed);
  const effectiveUserName = detectedName || memory.userName;
  const relation = inferCharacterRelation(character, trimmed, memory);
  const nextTurn = memory.turnCount + 1;
  const understoodWords = Array.from(
    new Set([
      ...analysis.matchedLexicon.map((w) => w.root),
      ...(analysis.subjectKeywords || []).slice(0, 3),
    ])
  );
  const updatedArc = advanceScenarioArc(
    memory.scenarioArc || character.scenarioArc,
    nextTurn,
    normalized
  );
  const displayUser = effectiveUserName || getDefaultAddressTerm(relation);

  const buildResult = (payload: {
    replyText: string;
    replyKey?: string;
    action: string;
    mood: CharacterMood;
    followUps: string[];
    matchedTopic: string;
    lastTopic: string;
    affinityDelta?: number;
    recentKey?: string;
    overridePhase?: ScenarioArc['currentPhase'];
  }): RoleplayReplyResult => ({
    replyText: payload.replyText,
    replyKey: payload.replyKey,
    action: payload.action,
    mood: payload.mood,
    followUps: payload.followUps,
    matchedTopic: payload.matchedTopic,
    detectedUserEmotion: analysis.dominantEmotion,
    understoodWords,
    updatedMemory: appendTurnMemory(memory, {
      userText: trimmed,
      normalizedUserText: normalized,
      replyText: payload.replyText,
      lastTopic: payload.lastTopic,
      mood: payload.mood,
      relation,
      effectiveUserName,
      nextTurn,
      affinityDelta: payload.affinityDelta ?? 3,
      analysis,
      understoodWords,
      updatedArc,
      recentKey: payload.recentKey,
      overridePhase: payload.overridePhase,
    }),
  });

  // 1. User introduced their name
  if (detectedName && trimmed.split(/\s+/).length <= 5) {
    const mood: CharacterMood =
      relation === 'mother' || relation === 'father'
        ? 'স্নেহশীল'
        : relation === 'romantic' || relation === 'spouse'
          ? 'ভালোবাসাময়'
          : 'উৎফুল্ল';

    const replyText =
      relation === 'mother'
        ? `বাহ, ${detectedName} নামটা তো ভীষণ মিষ্টি! আমার সোনা ${detectedName}—আয়, আম্মুর কাছে এসে একটু বস তো। আজ কেমন কেটেছে দিনটা?`
        : relation === 'father'
          ? `বেশ সুন্দর নাম তো ${detectedName}! ভালো আছো তো? বলো, আজ কী নিয়ে কথা বলবে আব্বুর সাথে?`
          : relation === 'romantic' || relation === 'spouse'
            ? `${detectedName}! নামটা উচ্চারণ করতেই কী ভালো লাগে আমার! এখন বলো তো, কেমন আছো তুমি?`
            : `বাহ, ${detectedName} নামটা তো ভীষণ সুন্দর! আমি ${character.name}। এখন থেকে আমাদের প্রতিটি গল্পে আমি তোমাকে ${detectedName} বলেই ডাকবো। বলো ${detectedName}, আজ কোন গল্প দিয়ে শুরু করবো?`;

    return buildResult({
      replyText,
      action:
        relation === 'mother' || relation === 'father'
          ? 'স্নেহভরা হাসি দিয়ে কাছে ডাকলো'
          : 'নামের প্রশংসা করে আন্তরিকভাবে হাসলো',
      mood,
      followUps: character.initialFollowUps,
      matchedTopic: 'পরিচিতি',
      lastTopic: 'name_introduction',
      affinityDelta: 6,
    });
  }

  // 2. Direct word-meaning query ("অভিমান মানে কী?" / "obhiman mane ki?")
  if (analysis.meaningQueryTarget) {
    const meaningReply = composeEmotionAwareReply(
      analysis,
      character,
      relation,
      displayUser,
      customEmotions
    );
    if (meaningReply) {
      return buildResult({
        ...meaningReply,
        followUps: character.initialFollowUps,
        lastTopic: 'word_meaning',
        affinityDelta: 4,
      });
    }
  }

  // 3. Name recall check
  if (
    normalized.includes('আমার নাম মনে') ||
    normalized.includes('amar naam mone') ||
    normalized.includes('নাম কী')
  ) {
    const reply = effectiveUserName
      ? `অবশ্যই মনে আছে! তোমার নাম ${effectiveUserName}। নিজের কাছের মানুষের নাম কি সহজে ভোলা যায় নাকি?`
      : 'তুমি তো এখনো তোমার সুন্দর নামটা বলোনি! বলো না, কী নামে ডাকলে তোমার ভালো লাগবে?';
    const mood = effectiveUserName ? 'উৎফুল্ল' : 'কৌতূহলী';
    return buildResult({
      replyText: reply,
      action: effectiveUserName ? 'চোখ উজ্জ্বল করে হেসে উত্তর দিল' : 'কৌতূহলী হয়ে তাকালো',
      mood,
      followUps: effectiveUserName
        ? ['দারুণ! এবার একটা গল্প বলো', 'চলো অন্য কথা বলি']
        : ['আমার নাম রাফি', 'আমার নাম অনন্যা'],
      matchedTopic: 'স্মৃতি',
      lastTopic: memory.lastTopic || 'memory_recall',
      affinityDelta: 3,
    });
  }

  // 4. Custom rules defined on character
  if (character.customRules && character.customRules.length > 0) {
    for (const rule of character.customRules) {
      const matched = rule.keywords.some((kw) => {
        const normKw = normalizeBengaliText(kw);
        return normKw.length > 0 && normalized.includes(normKw);
      });
      if (matched) {
        const mood = mapEmotionToMood(analysis.dominantEmotion, relation, customEmotions);
        return buildResult({
          replyText: interpolateTemplate(rule.response, character, relation, effectiveUserName),
          action: rule.action || 'আন্তরিকভাবে তাকিয়ে উত্তর দিল',
          mood,
          followUps: rule.followUps?.length ? rule.followUps : character.initialFollowUps,
          matchedTopic: 'কাস্টম সংলাপ',
          lastTopic: 'custom_rule',
          affinityDelta: 4,
        });
      }
    }
  }

  // 4.3 Meta-feedback recovery ("tumi oprashongik ans dichho" / "kisu bujho na")
  if (analysis.isMetaFeedback) {
    const recovery = composeMetaFeedbackReply(character, relation, displayUser, memory);
    return buildResult({
      ...recovery,
      lastTopic: 'meta_recovery',
      affinityDelta: 2,
    });
  }

  // 4.5 Scenario Phases defined on character (from JSON-imported scenarios)
  if (character.scenarioPhases && character.scenarioPhases.length > 0) {
    const activePhase = updatedArc?.currentPhase || 'opening';
    const { isPersuasive, isDefiantOrRefusal } = detectPersuasionOrResolutionSignal(normalized);
    let bestPhase: TrainedScenarioPhase | null = null;
    let bestPhaseScore = 0;

    for (const p of character.scenarioPhases) {
      if (p.responses.length === 0) continue;
      let score = p.phase === activePhase ? 6 : 0;
      if (isPersuasive && (p.phase === 'resolution' || p.phaseTrigger === 'persuasion' || p.phaseTrigger === 'apology')) {
        score += 12;
      }
      if (isDefiantOrRefusal && (p.phase === 'opening' || p.phase === 'developing' || p.phaseTrigger === 'refusal' || p.phaseTrigger === 'pressure')) {
        score += 10;
      }
      if (p.keywords && p.keywords.length > 0) {
        const kwScore = scoreTopicMatch(
          normalized,
          analysis.stemmedTokens,
          { topic: p.phase, labelBn: p.beat, keywords: p.keywords, responses: p.responses },
          0,
          analysis,
          mlModel
        );
        score += kwScore;
      }
      const sim = mlModel.scoreSimilarity(normalized, `${p.beat} ${(p.keywords || []).join(' ')}`);
      if (sim >= 0.35) {
        score += Math.round(sim * 18);
      }
      if (score > bestPhaseScore) {
        bestPhaseScore = score;
        bestPhase = p;
      }
    }

    if (bestPhase && bestPhaseScore >= 12) {
      const { variant, key } = pickNonRepeatingVariant(
        bestPhase.responses,
        `phase:${bestPhase.phase}`,
        memory.recentResponseKeys
      );
      const replyMood = variant.mood || bestPhase.emotion || 'শান্ত';
      return buildResult({
        replyText: interpolateTemplate(variant.text, character, relation, effectiveUserName),
        replyKey: key,
        action: variant.action,
        mood: replyMood,
        followUps: variant.followUps.length > 0 ? variant.followUps : character.initialFollowUps,
        matchedTopic: `দৃশ্যপট (${bestPhase.phase})`,
        lastTopic: `scenario_${bestPhase.phase}`,
        affinityDelta: 5,
        recentKey: key,
        overridePhase: bestPhase.phase,
      });
    }
  }

  // 4.8 ML Self-Learned Patterns synthesized from previous feedback & datasets
  if (intelligenceContext?.selfLearnedPatterns && intelligenceContext.selfLearnedPatterns.length > 0) {
    let bestPattern: MLSelfLearnedPattern | null = null;
    let bestPatScore = 0;

    for (const pat of intelligenceContext.selfLearnedPatterns) {
      if (pat.relation !== 'any' && pat.relation !== relation) continue;
      const sim = mlModel.scoreSimilarity(normalized, `${pat.prompt} ${pat.triggerTokens.join(' ')}`);
      const boost = mlModel.getFeedbackBoost(`ml:${pat.id}`);
      const score = sim * 35 + pat.score * 2 + boost;
      if (sim >= 0.48 && score > bestPatScore && !memory.recentResponseKeys.includes(`ml:${pat.id}`)) {
        bestPatScore = score;
        bestPattern = pat;
      }
    }

    if (bestPattern) {
      const key = `ml:${bestPattern.id}`;
      return buildResult({
        replyText: interpolateTemplate(bestPattern.response, character, relation, effectiveUserName),
        replyKey: key,
        action: bestPattern.action,
        mood: bestPattern.emotion,
        followUps: character.initialFollowUps,
        matchedTopic: 'স্ব-শিক্ষিত ML প্যাটার্ন',
        lastTopic: 'ml_self_learned',
        affinityDelta: 5,
        recentKey: key,
      });
    }
  }

  // 5. User-trained + Built-in Natural Dataset + NSFW Banglish Conversation Pairs
  const isExplicitContext =
    relation === 'romantic' ||
    relation === 'spouse' ||
    relation === 'mother' ||
    relation === 'sibling' ||
    relation === 'friend' ||
    relation === 'mentor' ||
    /(?:fuck|pussy|cock|suck|cum|sex|hard|wet|ride|bend|throat|ass|tits|nude|naked|chut|lund|chod|choode|gaand|bhosda|maal|horny|moan|deep|fill|creampie|bdsm|spank|bondage|force|dark|fantasy|ammu|bon|nurse|girlfriend|beta|ma|nighty|door|lock|blackmail|cheat|cuck|bull|kneel|caught|stroke|clean)/i.test(normalized);

  const combinedTrained = [
    ...(isExplicitContext ? PROGRESSIVE_SCENARIOS : []),
    ...(intelligenceContext?.trainedConversations || []),
    ...DATASET_NATURAL_PAIRS,
    ...(isExplicitContext ? [...NSFW_BANGLISH_PAIRS, ...NSFW_MEGA_PAIRS] : []),
  ];
  const trainedHit = matchTrainedConversations(
    normalized,
    analysis.stemmedTokens,
    relation,
    combinedTrained,
    updatedArc?.currentPhase,
    memory.recentResponseKeys,
    mlModel
  );
  if (trainedHit) {
    const key = `trained:${trainedHit.id}`;
    return buildResult({
      replyText: interpolateTemplate(trainedHit.response, character, relation, effectiveUserName),
      replyKey: key,
      action: trainedHit.action || 'স্বাভাবিক ভঙ্গিতে উত্তর দিল',
      mood: trainedHit.emotion,
      followUps: trainedHit.followUps?.length ? trainedHit.followUps : character.initialFollowUps,
      matchedTopic: trainedHit.source || 'প্রশিক্ষিত সংলাপ',
      lastTopic: 'trained_corpus',
      affinityDelta: 5,
      recentKey: key,
    });
  }

  // 6. Story branches
  for (const branch of character.storyBranches) {
    const normPrompt = normalizeBengaliText(branch.promptText);
    const normTitle = normalizeBengaliText(branch.title);
    if (
      normalized === normPrompt ||
      normalized.includes(normTitle) ||
      (normPrompt.length > 8 &&
        normalized.includes(normPrompt.slice(0, Math.min(18, normPrompt.length))))
    ) {
      const key = `branch:${branch.id}`;
      return buildResult({
        replyText: interpolateTemplate(branch.characterReply, character, relation, effectiveUserName),
        action: branch.sceneAction,
        mood: branch.mood,
        followUps: branch.nextChoices,
        matchedTopic: branch.title,
        lastTopic: branch.id,
        affinityDelta: 5,
        recentKey: key,
      });
    }
  }

  // 7. Context-Aware Short Reply, Q->A Answer, & Story Continuation Handler
  const continuityReply = composeContextualContinuityReply(
    trimmed,
    analysis,
    character,
    relation,
    displayUser,
    memory
  );
  if (continuityReply) {
    return buildResult({
      ...continuityReply,
      lastTopic: memory.lastTopic || 'continuity',
      affinityDelta: 3,
    });
  }

  // 8. Relationship Knowledge + Character Topics + Shared Topics (Confidence-Gated & Negation-Safe)
  let bestScore = 0;
  let bestTopic: DialogueTopic | null = null;
  let topicScope = character.id;

  const relationPack = RELATIONSHIP_KNOWLEDGE[relation];
  if (relationPack) {
    for (const topic of relationPack.topics) {
      const score = scoreTopicMatch(
        normalized,
        analysis.stemmedTokens,
        topic,
        12,
        analysis,
        mlModel
      );
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
        topicScope = `${character.id}:${relation}`;
      }
    }
  }

  for (const topic of character.topics) {
    const score = scoreTopicMatch(
      normalized,
      analysis.stemmedTokens,
      topic,
      8,
      analysis,
      mlModel
    );
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
      topicScope = character.id;
    }
  }

  for (const topic of SHARED_BENGALI_TOPICS) {
    const score = scoreTopicMatch(
      normalized,
      analysis.stemmedTokens,
      topic,
      0,
      analysis,
      mlModel
    );
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
      topicScope = `${character.id}:shared`;
    }
  }

  const hasCustomEmotionHit = analysis.matchedLexicon.some(
    (m) => m.category === 'Custom Emotion'
  );

  // Confidence gate (>= 10): only accept genuine topic matches, never weak noisy collisions
  if (bestTopic && bestScore >= 10 && !(hasCustomEmotionHit && topicScope.endsWith(':shared'))) {
    const { variant, key } = pickNonRepeatingVariant(
      bestTopic.responses,
      `${topicScope}:${bestTopic.topic}`,
      memory.recentResponseKeys
    );
    const replyText = interpolateTemplate(variant.text, character, relation, effectiveUserName);
    return buildResult({
      replyText,
      action: variant.action,
      mood: variant.mood,
      followUps: variant.followUps,
      matchedTopic: bestTopic.labelBn,
      lastTopic: bestTopic.topic,
      affinityDelta: 4,
      recentKey: key,
    });
  }

  // 9. Dynamic Emotional & Word-Meaning Reaction from Local Intelligence
  const emotionalReaction = composeEmotionAwareReply(
    analysis,
    character,
    relation,
    displayUser,
    customEmotions
  );
  if (emotionalReaction) {
    return buildResult({
      ...emotionalReaction,
      followUps: relationPack?.fallbacks[0]?.followUps || character.initialFollowUps,
      lastTopic: 'emotional_intelligence',
      affinityDelta: 4,
    });
  }

  // 9.5 Dynamic Subject-Grounded & Intent-Aware Bengali NLG Synthesizer
  const dynamicReply = composeDynamicContextualReply(
    trimmed,
    analysis,
    character,
    relation,
    displayUser,
    memory
  );
  if (dynamicReply) {
    return buildResult({
      ...dynamicReply,
      lastTopic: `dynamic:${dynamicReply.matchedTopic}`,
      affinityDelta: 3,
    });
  }

  // 10. Scenario-Aware + Relationship-Aware Contextual Fallback (last resort)
  if (updatedArc && (updatedArc.currentPhase === 'developing' || updatedArc.currentPhase === 'resolution')) {
    const arcPrompt =
      updatedArc.currentPhase === 'developing' ? updatedArc.middleBeat : updatedArc.endingBeat;
    return buildResult({
      replyText:
        relation === 'mother'
          ? `হুম বুঝলাম ${displayUser}। কিন্তু এখন যে পরিস্থিতির ভেতর দিয়ে যাচ্ছি (${arcPrompt})—এটা নিয়ে তুই কী ভাবছিস বল তো আমায়?`
          : `শোনো ${displayUser}, আমাদের গল্পের এই পর্যায়ে এসে (${arcPrompt})—বিষয়টা নিয়ে তুমি কী সিদ্ধান্ত নিচ্ছো?`,
      action: 'পরিস্থিতি বুঝে চিন্তাশীল দৃষ্টিতে তাকালো',
      mood: relation === 'mother' ? 'শাসনমিশ্রিত স্নেহ' : 'চিন্তাশীল',
      followUps: character.initialFollowUps,
      matchedTopic:
        updatedArc.currentPhase === 'developing' ? 'গল্পের মাঝখান' : 'গল্পের পরিণতি',
      lastTopic: 'scenario_progression',
      affinityDelta: 3,
    });
  }

  const fallbackPool =
    relationPack && (character.isCustom || relation !== 'story')
      ? relationPack.fallbacks
      : character.fallbacks;

  const { variant, key } = pickNonRepeatingVariant(
    fallbackPool,
    `${character.id}:${relation}:fallback`,
    memory.recentResponseKeys
  );

  return buildResult({
    replyText: interpolateTemplate(variant.text, character, relation, effectiveUserName),
    action: variant.action,
    mood: variant.mood,
    followUps: variant.followUps,
    matchedTopic:
      relation === 'mother'
        ? 'মায়ের স্নেহ'
        : relation === 'romantic'
          ? 'হৃদয়ের কথা'
          : relation === 'spouse'
            ? 'দাম্পত্য আলাপ'
            : relation === 'friend'
              ? 'বন্ধু আড্ডা'
              : 'স্বতঃস্ফূর্ত আলাপ',
    lastTopic: 'contextual_dialogue',
    affinityDelta: 2,
    recentKey: key,
  });
}

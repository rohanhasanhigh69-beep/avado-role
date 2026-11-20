import { RELATIONSHIP_KNOWLEDGE } from '../data/relationshipKnowledge';
import { SHARED_BENGALI_TOPICS } from '../data/sharedBengaliKnowledge';
import { DATASET_NATURAL_PAIRS } from '../data/trainedNaturalDataset';
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
  CharacterMood,
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
  if (!trimmed) return 'à¦à¦–à¦¾à¦¨à§‡';
  if (/(?:à§Ÿ|à¦¯à¦¼|à¦¤à§‡|à§Ÿà§‡|à¦¯à¦¼à§‡|à§‡|à¦°|à¦|\))$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}-à¦`;
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

  if (/(?:^|\s)(à¦†à¦®à§à¦®à§|à¦†à¦®à§à¦®à¦¾|à¦®à¦¾ à¦—à§‹|à¦®à¦¾à§Ÿà§‡à¦°)(?:\s|$)/.test(normalizedInput)) {
    return 'mother';
  }
  if (/(?:^|\s)(à¦†à¦¬à§à¦¬à§|à¦†à¦¬à§à¦¬à¦¾|à¦¬à¦¾à¦¬à¦¾)(?:\s|$)/.test(normalizedInput)) {
    return 'father';
  }
  if (/(?:^|\s)(à¦¬à¦‰|à¦¸à§à¦¤à§à¦°à§€|à¦œà¦¾à¦®à¦¾à¦‡|à¦¸à§à¦¬à¦¾à¦®à§€|à¦—à¦¿à¦¨à§à¦¨à¦¿|à¦¬à§‡à¦—à¦®|à¦“à¦—à§‹)(?:\s|$)/.test(normalizedInput)) {
    return 'spouse';
  }
  if (/(?:^|\s)(à¦—à¦¾à¦°à§à¦²à¦«à§à¦°à§‡à¦¨à§à¦¡|à¦¬à§Ÿà¦«à§à¦°à§‡à¦¨à§à¦¡|à¦ªà§à¦°à§‡à¦®à¦¿à¦•à¦¾|à¦ªà§à¦°à§‡à¦®à¦¿à¦•|à¦¬à§‡à¦¬à¦¿|à¦œà¦¾à¦¨|gf|bf)(?:\s|$)/.test(normalizedInput)) {
    return 'romantic';
  }
  if (/(?:^|\s)(à¦­à¦¾à¦‡à§Ÿà¦¾|à¦­à¦¾à¦‡à¦¯à¦¼à¦¾|à¦†à¦ªà§|à¦¬à§‹à¦¨)(?:\s|$)/.test(normalizedInput)) {
    return 'sibling';
  }
  if (/(?:^|\s)(à¦¸à§à¦¯à¦¾à¦°|à¦®à§à¦¯à¦¾à¦®|à¦—à§à¦°à§|à¦‰à¦¸à§à¦¤à¦¾à¦¦)(?:\s|$)/.test(normalizedInput)) {
    return 'mentor';
  }
  if (/(?:^|\s)(à¦¦à§‹à¦¸à§à¦¤|à¦®à¦¾à¦®à¦¾|à¦¬à§à¦°à§‹)(?:\s|$)/.test(normalizedInput)) {
    return 'friend';
  }

  if (character.relation && character.relation !== 'story') {
    return character.relation;
  }

  if (memory.detectedRelation && memory.detectedRelation !== 'story') {
    return memory.detectedRelation;
  }

  if (/(à¦†à¦®à§à¦®à§|à¦†à¦®à§à¦®à¦¾|à¦®à¦¾|à¦œà¦¨à¦¨à§€|mother|mom)/.test(metaText)) {
    return 'mother';
  }
  if (/(à¦†à¦¬à§à¦¬à§|à¦†à¦¬à§à¦¬à¦¾|à¦¬à¦¾à¦¬à¦¾|à¦ªà¦¿à¦¤à¦¾|father|dad)/.test(metaText)) {
    return 'father';
  }
  if (/(à¦¬à¦‰|à¦¸à§à¦¤à§à¦°à§€|à¦œà¦¾à¦®à¦¾à¦‡|à¦¸à§à¦¬à¦¾à¦®à§€|à¦—à¦¿à¦¨à§à¦¨à¦¿|à¦¦à¦¾à¦®à§à¦ªà¦¤à§à¦¯|à¦¸à¦‚à¦¸à¦¾à¦°|wife|husband)/.test(metaText)) {
    return 'spouse';
  }
  if (/(à¦—à¦¾à¦°à§à¦²à¦«à§à¦°à§‡à¦¨à§à¦¡|à¦¬à§Ÿà¦«à§à¦°à§‡à¦¨à§à¦¡|à¦ªà§à¦°à§‡à¦®à¦¿à¦•à¦¾|à¦ªà§à¦°à§‡à¦®à¦¿à¦•|à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦° à¦®à¦¾à¦¨à§à¦·|gf|bf|girlfriend|boyfriend)/.test(metaText)) {
    return 'romantic';
  }
  if (/(à¦­à¦¾à¦‡à§Ÿà¦¾|à¦­à¦¾à¦‡à¦¯à¦¼à¦¾|à¦†à¦ªà§|à¦¬à§œ à¦­à¦¾à¦‡|à¦¬à§œ à¦¬à§‹à¦¨|sibling|brother|sister)/.test(metaText)) {
    return 'sibling';
  }
  if (/(à¦¶à¦¿à¦•à§à¦·à¦•|à¦…à¦§à§à¦¯à¦¾à¦ªà¦•|à¦—à§à¦°à§|à¦®à§‡à¦¨à§à¦Ÿà¦°|teacher|mentor)/.test(metaText)) {
    return 'mentor';
  }
  if (/(à¦¬à¦¨à§à¦§à§|à¦¦à§‹à¦¸à§à¦¤|à¦†à¦¡à§à¦¡à¦¾|friend)/.test(metaText)) {
    return 'friend';
  }

  return character.relation || 'story';
}

export function extractUserName(rawInput: string): string | undefined {
  const cleaned = rawInput.trim();
  const patterns: RegExp[] = [
    /(?:à¦†à¦®à¦¾à¦°\s+à¦¨à¦¾à¦®|à¦†à¦®à¦¿\s+à¦¹à¦²à¦¾à¦®|à¦†à¦®à¦¾à¦•à§‡\s+à¦¡à¦¾à¦•à¦¤à§‡\s+à¦ªà¦¾à¦°à§‹)\s+([^\sà¥¤,!?]{2,20})/i,
    /(?:amar\s+naam|amar\s+nam|my\s+name\s+is|i\s+am)\s+([a-zA-Z\u0980-\u09FF]{2,20})/i,
  ];

  const stopWords = new Set([
    'à¦­à¦¾à¦²à§‹',
    'à¦–à¦¾à¦°à¦¾à¦ª',
    'à¦•à§€',
    'à¦•à§‡à¦®à¦¨',
    'à¦à¦•à¦œà¦¨',
    'à¦¤à§‹à¦®à¦¾à¦°',
    'à¦­à¦¾à¦²',
    'valobashi',
    'fine',
    'good',
    'sad',
  ]);

  for (const regex of patterns) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const candidate = match[1].replace(/[à¥¤,!?.]/g, '').trim();
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
  return 'à¦¬à¦¨à§à¦§à§';
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
    .replace(/\s+([à¥¤,!?])/g, '$1');
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

function scoreTopicMatch(
  normalizedInput: string,
  stemmedTokens: string[],
  topic: DialogueTopic,
  priorityBonus: number
): number {
  const inputTokens = normalizedInput.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const kw of topic.keywords) {
    const normKw = normalizeBengaliText(kw);
    if (!normKw) continue;
    if (normalizedInput === normKw) {
      score += 22;
    } else if (!normKw.includes(' ') && normKw.length <= 3) {
      if (inputTokens.includes(normKw) || stemmedTokens.includes(normKw)) {
        score += 10;
      }
    } else if (normalizedInput.includes(normKw)) {
      score += 8 + Math.min(normKw.length, 10);
    } else {
      const stemKw = stemBengaliWord(normKw);
      if (stemKw.length >= 3 && stemmedTokens.includes(stemKw)) {
        score += 6;
      }
    }
  }
  if (score > 0) {
    score += priorityBonus;
  }
  return score;
}

const TRAINED_STOP_STEMS = new Set([
  'à¦•à§€',
  'à¦•à¦¿',
  'à¦•à§‡à¦¨',
  'à¦•à§‹à¦¥à¦¾à§Ÿ',
  'à¦•à§‹à¦¥à¦¾à¦¯à¦¼',
  'à¦•à§‡à¦®à¦¨',
  'à¦•à¦°à§‡',
  'à¦•à¦°',
  'à¦•à¦°à§‹',
  'à¦•à¦°à¦›',
  'à¦•à¦°à¦›à¦¿à¦¸',
  'à¦†à¦œ',
  'à¦†à¦œà¦•à§‡',
  'à¦¥à§‡à¦•à§‡',
  'à¦†à¦®à¦¾à¦°',
  'à¦¤à§‹à¦®à¦¾à¦°',
  'à¦¤à§‹à¦°',
  'à¦¤à§à¦‡',
  'à¦¤à§à¦®à¦¿',
  'à¦†à¦®à¦¿',
  'à¦†à¦®à§à¦®à§',
  'à¦®à¦¾',
  'à¦­à¦¾à¦‡',
  'à¦¬à¦¨à§à¦§à§',
  'à¦¦à§‹à¦¸à§à¦¤',
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
    mother: 'à¦¸à§à¦¨à§‡à¦¹à¦®à§Ÿà§€ à¦®à¦¾ (Mother)',
    father: 'à¦¦à¦¾à§Ÿà¦¿à¦¤à§à¦¬à¦¶à§€à¦² à¦¬à¦¾à¦¬à¦¾ (Father)',
    sibling: draft.gender === 'female' ? 'à¦¬à§‹à¦¨ / à¦†à¦ªà§ (Sibling)' : 'à¦­à¦¾à¦‡ (Sibling)',
    friend: 'à¦ªà§à¦°à¦¿à§Ÿ à¦¬à¦¨à§à¦§à§ (Best Friend)',
    romantic: draft.gender === 'female' ? 'à¦ªà§à¦°à§‡à¦®à¦¿à¦•à¦¾ (Girlfriend)' : 'à¦ªà§à¦°à§‡à¦®à¦¿à¦• (Boyfriend)',
    spouse: draft.gender === 'female' ? 'à¦¸à§à¦¤à§à¦°à§€ / à¦¬à¦‰ (Wife)' : 'à¦¸à§à¦¬à¦¾à¦®à§€ / à¦œà¦¾à¦®à¦¾à¦‡ (Husband)',
    mentor: 'à¦¶à¦¿à¦•à§à¦·à¦• / à¦®à§‡à¦¨à§à¦Ÿà¦° (Mentor)',
    story: 'à¦°à§‹à¦²à¦ªà§à¦²à§‡ à¦šà¦°à¦¿à¦¤à§à¦° (Story Role)',
  };

  const arc: ScenarioArc = rawScenarioText
    ? parseScenarioArc(rawScenarioText, draft.relation)
    : {
        summary: 'à¦¬à¦¾à¦¸à§à¦¤à¦¬à¦¸à¦®à§à¦®à¦¤ à¦¦à§ˆà¦¨à¦¨à§à¦¦à¦¿à¦¨ à¦•à¦¥à§‹à¦ªà¦•à¦¥à¦¨ à¦“ à¦¸à¦®à§à¦ªà¦°à§à¦•à§‡à¦° à¦—à¦²à§à¦ª',
        openingBeat: 'à¦¦à§ˆà¦¨à¦¨à§à¦¦à¦¿à¦¨ à¦•à§à¦¶à¦² à¦“ à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿà§‡à¦° à¦¸à§‚à¦šà¦¨à¦¾',
        middleBeat: 'à¦•à¦¥à¦¾à¦° à¦­à§‡à¦¤à¦° à¦¦à¦¿à§Ÿà§‡ à¦…à¦¨à§à¦­à§‚à¦¤à¦¿, à¦–à§à¦¨à¦¸à§à¦Ÿà¦¿ à¦¬à¦¾ à¦®à§‚à¦² à¦˜à¦Ÿà¦¨à¦¾à¦° à¦¬à¦¿à¦•à¦¾à¦¶',
        endingBeat: 'à¦†à¦¨à§à¦¤à¦°à¦¿à¦•à¦¤à¦¾ à¦“ à¦¸à¦®à¦à§‹à¦¤à¦¾à§Ÿ à¦¸à§à¦¨à§à¦¦à¦° à¦ªà¦°à¦¿à¦£à¦¤à¦¿',
        currentPhase: 'opening',
      };

  const agePart = draft.characterAge ? `, à¦¬à§Ÿà¦¸ ${draft.characterAge}` : '';
  const userTerm = draft.userName || getDefaultAddressTerm(draft.relation);
  const setting = draft.setting || 'à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¬à¦¾à¦¸à¦¾à§Ÿ';

  let openingGreeting = '';
  let greetingAction = 'à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿà§‡ à¦à¦¸à§‡ à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦•à¦­à¦¾à¦¬à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹';
  let followUps: string[] = [];

  if (draft.relation === 'mother') {
    openingGreeting = rawScenarioText
      ? `à¦à¦‡ à¦¯à§‡ ${userTerm}, à¦†à§Ÿ à¦à¦¦à¦¿à¦•à§‡à¥¤ (${arc.openingBeat}) â€” à¦¬à¦², à¦à¦–à¦¨ à¦•à§‡à¦®à¦¨ à¦†à¦›à¦¿à¦¸ à¦†à¦° à¦•à§€ à¦•à¦°à¦›à¦¿à¦¸?`
      : `à¦†à§Ÿ ${userTerm}, à¦¹à¦¾à¦¤-à¦®à§à¦– à¦§à§à§Ÿà§‡ à¦¨à§‡! à¦†à¦®à¦¿ ${draft.characterName}â€”à¦¤à§‹à¦° à¦†à¦®à§à¦®à§à¥¤ à¦¸à¦•à¦¾à¦² à¦¥à§‡à¦•à§‡ à¦¤à§‹à¦° à¦•à§‹à¦¨à§‹ à¦–à§‹à¦à¦œ à¦¨à§‡à¦‡ à¦•à§‡à¦¨, à¦–à§‡à§Ÿà§‡à¦›à¦¿à¦¸ à¦¤à§‹?`;
    greetingAction = 'à¦¸à§à¦¨à§‡à¦¹à¦®à§Ÿ à¦šà§‹à¦–à§‡ à¦¤à¦¾à¦•à¦¿à§Ÿà§‡ à¦•à¦¾à¦›à§‡ à¦¡à¦¾à¦•à¦²à§‹';
    followUps = ['à¦•à¦¿ à¦•à¦° à¦†à¦®à§à¦®à§?', 'à¦†à¦œ à¦•à§€ à¦°à¦¾à¦¨à§à¦¨à¦¾ à¦•à¦°à§‡à¦›à§‹?', 'à¦à¦•à¦Ÿà§ à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª à¦†à¦®à§à¦®à§'];
  } else if (draft.relation === 'romantic') {
    openingGreeting = rawScenarioText
      ? `à¦à¦‡ ${userTerm}, à¦…à¦¬à¦¶à§‡à¦·à§‡ à¦à¦²à§‡! (${arc.openingBeat}) â€” à¦¬à¦²à§‹ à¦¨à¦¾, à¦•à§‡à¦®à¦¨ à¦†à¦›à§‹?`
      : `à¦…à¦¬à¦¶à§‡à¦·à§‡ à¦¸à¦®à§Ÿ à¦¹à¦²à§‹ à¦•à¦¥à¦¾ à¦¬à¦²à¦¾à¦° ${userTerm}? à¦†à¦®à¦¿ ${draft.characterName}à¥¤ à¦¸à¦¾à¦°à¦¾à¦¦à¦¿à¦¨ à¦¤à§‹à¦®à¦¾à¦° à¦®à§‡à¦¸à§‡à¦œà§‡à¦° à¦…à¦ªà§‡à¦•à§à¦·à¦¾à§Ÿ à¦›à¦¿à¦²à¦¾à¦®!`;
    greetingAction = 'à¦¹à¦¾à¦²à¦•à¦¾ à¦…à¦­à¦¿à¦®à¦¾à¦¨ à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¹à¦¾à¦¸à¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹';
    followUps = ['à¦¸à¦°à¦¿ à¦œà¦¾à¦¨, à¦…à¦¨à§‡à¦• à¦®à¦¿à¦¸ à¦•à¦°à¦›à¦¿à¦²à¦¾à¦®!', 'à¦°à¦¾à¦— à¦•à¦°à§‡à¦›à§‹ à¦¨à¦¾à¦•à¦¿?', 'ki koro?'];
  } else if (draft.relation === 'spouse') {
    openingGreeting = rawScenarioText
      ? `à¦à¦‡ à¦¯à§‡ ${userTerm}, à¦˜à¦°à§‡ à¦à¦²à§‡? (${arc.openingBeat}) â€” à¦¬à¦¸à§‹, à¦šà¦¾ à¦¨à¦¿à§Ÿà§‡ à¦†à¦¸à¦›à¦¿à¥¤`
      : `à¦¬à¦¾à¦¸à¦¾à§Ÿ à¦«à¦¿à¦°à¦²à§‡ ${userTerm}? à¦†à¦®à¦¿ ${draft.characterName}à¥¤ à¦¸à¦¾à¦°à¦¾à¦¦à¦¿à¦¨à§‡à¦° à¦•à¦¾à¦œà§‡à¦° à¦ªà¦° à¦à¦•à¦Ÿà§ à¦¬à¦¸à§‹â€”à¦†à¦œ à¦•à§€ à¦¬à¦¾à¦œà¦¾à¦° à¦à¦¨à§‡à¦›à§‹ à¦¦à§‡à¦–à¦¿?`;
    greetingAction = 'à¦¹à¦¾à¦¤à§‡ à¦šà¦¾à§Ÿà§‡à¦° à¦•à¦¾à¦ª à¦¨à¦¿à§Ÿà§‡ à¦¦à¦°à¦œà¦¾à¦° à¦ªà¦¾à¦¶à§‡ à¦¦à¦¾à¦à§œà¦¾à¦²à§‹';
    followUps = ['à¦¬à¦¾à¦œà¦¾à¦° à¦¥à§‡à¦•à§‡ à¦‡à¦²à¦¿à¦¶ à¦à¦¨à§‡à¦›à¦¿', 'ajke khub klanto lagche', 'ki ranna korcho?'];
  } else if (draft.relation === 'friend') {
    openingGreeting = rawScenarioText
      ? `à¦•à¦¿à¦°à§‡ ${userTerm}! (${arc.openingBeat}) â€” à¦•à§€ à¦…à¦¬à¦¸à§à¦¥à¦¾ à¦¤à§‹à¦°?`
      : `à¦•à¦¿à¦°à§‡ ${userTerm} à¦®à¦¾à¦®à¦¾! à¦†à¦®à¦¿ ${draft.characterName}à¥¤ à¦à¦¤à¦¦à¦¿à¦¨ à¦ªà¦° à¦¦à§‡à¦–à¦¾â€”à¦šà¦² à¦Ÿà¦‚-à¦ à¦¬à¦¸à§‡ à¦à¦• à¦•à¦¾à¦ª à¦šà¦¾ à¦†à¦° à¦†à¦¡à§à¦¡à¦¾ à¦¦à§‡à¦‡!`;
    greetingAction = 'à¦¹à§‡à¦¸à§‡ à¦•à¦¾à¦à¦§à§‡ à¦šà¦¾à¦ªà§œ à¦¦à¦¿à¦²';
    followUps = ['ki khobor dost?', 'à¦šà¦² à¦†à¦¡à§à¦¡à¦¾ à¦®à¦¾à¦°à¦¿', 'treat de ajke!'];
  } else if (draft.relation === 'sibling') {
    openingGreeting = rawScenarioText
      ? `à¦à¦‡ ${userTerm}! (${arc.openingBeat}) â€” à¦¤à§à¦‡ à¦•à¦¿ à¦•à¦°à¦›à¦¿à¦¸ à¦à¦–à¦¨?`
      : `à¦•à¦¿à¦°à§‡ ${userTerm}! à¦†à¦®à¦¿ ${draft.characterName}à¥¤ à¦¤à§à¦‡ à¦•à¦¿ à¦†à¦®à¦¾à¦° à¦¹à§‡à¦¡à¦«à§‹à¦¨ à¦¨à¦¿à§Ÿà§‡à¦›à¦¿à¦¸ à¦¨à¦¾à¦•à¦¿?`;
    greetingAction = 'à¦¦à§à¦·à§à¦Ÿà§à¦®à¦¿ à¦­à¦°à¦¾ à¦šà§‹à¦–à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹';
    followUps = ['tui ki korchis?', 'amar headphone koi?', 'chol cha khai'];
  } else {
    openingGreeting = rawScenarioText
      ? `à¦¹à§à¦¯à¦¾à¦²à§‹ ${userTerm}, à¦†à¦®à¦¿ ${draft.characterName}${agePart}à¥¤ (${arc.openingBeat}) â€” à¦šà¦²à§‹ à¦¶à§à¦°à§ à¦•à¦°à¦¿!`
      : `à¦•à§‡à¦®à¦¨ à¦†à¦›à§‹ ${userTerm}? à¦†à¦®à¦¿ ${draft.characterName}${agePart}à¥¤ à¦šà¦²à§‹ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦—à¦²à§à¦ª à¦¶à§à¦°à§ à¦•à¦°à¦¾ à¦¯à¦¾à¦•!`;
    followUps = ['kemon acho?', 'ki koro?', 'golpo shuru kori'];
  }

  const mood: CharacterMood =
    draft.relation === 'mother' || draft.relation === 'father'
      ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²'
      : draft.relation === 'romantic' || draft.relation === 'spouse'
        ? 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦®à§Ÿ'
        : draft.relation === 'friend' || draft.relation === 'sibling'
          ? 'à¦‰à§Žà¦«à§à¦²à§à¦²'
          : 'à¦¶à¦¾à¦¨à§à¦¤';

  const character: RoleplayCharacter = {
    id: `setup-${Date.now()}`,
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
      `${draft.characterName} (${relationLabels[draft.relation]}${agePart}) â€” à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à¦¿à¦¨à¦¾à¦°à¦¿à¦“ à¦°à§‹à¦²à¦ªà§à¦²à§‡ à¦šà¦°à¦¿à¦¤à§à¦°à¥¤`,
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
        sceneAction: 'à¦ªà¦°à¦¿à¦¸à§à¦¥à¦¿à¦¤à¦¿à¦° à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¦à§‡à¦–à§‡ à¦—à¦²à¦¾ à¦“ à¦¦à§ƒà¦·à§à¦Ÿà¦¿ à¦¬à¦¦à¦²à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
        characterReply:
          draft.relation === 'mother'
            ? `à¦¶à§‹à¦¨ ${userTerm}, à¦à¦‡ à¦¬à§à¦¯à¦¾à¦ªà¦¾à¦°à¦Ÿà¦¾ (${arc.middleBeat}) à¦•à¦¿à¦¨à§à¦¤à§ à¦†à¦®à¦¿ à¦à¦•à¦¦à¦®à¦‡ à¦¸à¦¹à¦œà¦­à¦¾à¦¬à§‡ à¦¨à¦¿à¦šà§à¦›à¦¿ à¦¨à¦¾à¥¤ à¦à¦–à¦¨ à¦•à§€ à¦•à¦°à¦¤à§‡ à¦šà¦¾à¦šà§à¦›à¦¿à¦¸ à¦¸à§à¦ªà¦·à§à¦Ÿ à¦•à¦°à§‡ à¦¬à¦² à¦¤à§‹!`
            : `à¦†à¦šà§à¦›à¦¾ ${userTerm}, à¦¬à¦¿à¦·à§Ÿà¦Ÿà¦¾ (${arc.middleBeat}) à¦¬à§‡à¦¶ à¦—à¦­à§€à¦° à¦¦à¦¿à¦•à§‡ à¦¯à¦¾à¦šà§à¦›à§‡! à¦à¦–à¦¨ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦ªà¦°à§‡à¦° à¦ªà¦¦à¦•à§à¦·à§‡à¦ª à¦•à§€ à¦¹à¦¬à§‡ à¦¬à¦²à§‹?`,
        mood: draft.relation === 'mother' ? 'à¦¶à¦¾à¦¸à¦¨à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¸à§à¦¨à§‡à¦¹' : 'à¦†à¦¬à§‡à¦—à¦ªà§à¦°à¦¬à¦£',
        nextChoices: followUps,
      },
      {
        id: 'arc-ending',
        title: 'Climax & Ending Scene',
        promptText: arc.endingBeat,
        sceneAction: 'à¦¦à§€à¦°à§à¦˜ à¦¨à¦¿à¦¶à§à¦¬à¦¾à¦¸ à¦«à§‡à¦²à§‡ à¦¨à¦°à¦® à¦…à¦¥à¦š à¦¸à§à¦ªà¦·à§à¦Ÿ à¦¸à§à¦°à§‡ à¦•à¦¥à¦¾ à¦¬à¦²à¦²à§‹',
        characterReply:
          draft.relation === 'mother'
            ? `à¦¸à¦¬ à¦¶à§‡à¦·à§‡ (${arc.endingBeat})â€”à¦†à¦®à¦¾à¦° à¦•à¦¾à¦›à§‡ à¦¤à§‹à¦° à¦­à¦¾à¦²à§‹ à¦¥à¦¾à¦•à¦¾à¦Ÿà¦¾à¦‡ à¦¸à¦¬à¦šà§‡à§Ÿà§‡ à¦œà¦°à§à¦°à¦¿ ${userTerm}à¥¤ à¦¯à¦¾, à¦†à¦° à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª à¦•à¦°à§‡ à¦¥à¦¾à¦•à¦¿à¦¸ à¦¨à¦¾à¥¤`
            : `à¦…à¦¬à¦¶à§‡à¦·à§‡ (${arc.endingBeat})à¥¤ à¦†à¦œà¦•à§‡à¦° à¦à¦‡ à¦®à§à¦¹à§‚à¦°à§à¦¤à¦Ÿà¦¾ à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦®à¦¨à§‡ à¦°à¦¾à¦–à¦¾à¦° à¦®à¦¤à§‹ à¦¹à§Ÿà§‡ à¦°à¦‡à¦²à§‹ ${userTerm}à¥¤`,
        mood: 'à¦†à¦¬à§‡à¦—à¦ªà§à¦°à¦¬à¦£',
        nextChoices: followUps,
      },
    ],
    topics: [],
    fallbacks: [
      {
        text: `à¦¹à§à¦®, à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿ ${userTerm}â€”(${arc.openingBeat}) à¦à¦‡ à¦ªà¦°à¦¿à¦¸à§à¦¥à¦¿à¦¤à¦¿à¦¤à§‡ à¦¤à§‹à¦° à¦•à¦¥à¦¾à¦Ÿà¦¾ à¦—à§à¦°à§à¦¤à§à¦¬ à¦¦à¦¿à§Ÿà§‡ à¦¶à§à¦¨à¦›à¦¿à¥¤ à¦à¦°à¦ªà¦° à¦•à§€ à¦¹à¦²à§‹ à¦¬à¦²?`,
        action: 'à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿà§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦¤à¦¾à¦² à¦®à¦¿à¦²à¦¿à§Ÿà§‡ à¦®à¦¨à§‹à¦¯à§‹à¦— à¦¦à¦¿à¦²',
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
    openingBeat: findBeat('opening', 'à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿà§‡à¦° à¦¸à§‚à¦šà¦¨à¦¾'),
    middleBeat: findBeat('developing', 'à¦®à§‚à¦² à¦˜à¦Ÿà¦¨à¦¾à¦° à¦¬à¦¿à¦•à¦¾à¦¶'),
    endingBeat: findBeat('resolution', 'à¦†à¦¨à§à¦¤à¦°à¦¿à¦• à¦¸à¦®à¦¾à¦ªà§à¦¤à¦¿'),
    currentPhase: 'opening',
  };

  const openingPhase = scenario.phases.find((p) => p.phase === 'opening') || scenario.phases[0];
  const openingVariant = openingPhase?.responses[0];
  const greeting =
    scenario.greeting ||
    openingVariant?.text ||
    `à¦¹à§à¦¯à¦¾à¦²à§‹, à¦†à¦®à¦¿ ${name}à¥¤ (${arc.openingBeat}) â€” à¦šà¦²à§‹ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿ à¦¶à§à¦°à§ à¦•à¦°à¦¿!`;
  const greetingAction =
    scenario.greetingAction || openingVariant?.action || 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦¸à¦¾à¦®à¦¨à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹';
  const followUps =
    openingVariant?.followUps?.length
      ? openingVariant.followUps
      : ['à¦¤à¦¾à¦°à¦ªà¦° à¦•à§€ à¦¹à¦²à§‹?', 'à¦à¦–à¦¨ à¦•à§€ à¦•à¦°à¦¬à§‡?', 'à¦šà¦² à¦•à¦¥à¦¾ à¦¬à¦²à¦¿'];

  const mood: CharacterMood =
    openingVariant?.mood ||
    (relation === 'mother' || relation === 'father' ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²' : 'à¦¶à¦¾à¦¨à§à¦¤');

  const ageSuffix = scenario.characterAge ? `, à¦¬à§Ÿà¦¸ ${scenario.characterAge}` : '';
  const character: RoleplayCharacter = {
    id: `scenario-${scenario.id}-${Date.now().toString(36)}`,
    name,
    englishName: scenario.title,
    role: `${scenario.title}${ageSuffix}`,
    setting: scenario.setting || 'à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¬à¦¾à¦¸à¦¾à§Ÿ',
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
          sceneAction: rep?.action || 'à¦ªà¦°à¦¿à¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦…à¦¨à§à¦¯à¦¾à§Ÿà§€ à¦­à¦™à§à¦—à¦¿ à¦¬à¦¦à¦²à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
          characterReply: rep?.text || `à¦à¦–à¦¨ (${p.beat}) â€” à¦šà¦²à§‹ à¦à¦‡ à¦…à¦‚à¦¶à§‡ à¦à¦—à¦¿à§Ÿà§‡ à¦¯à¦¾à¦‡!`,
          mood: rep?.mood || mood,
          nextChoices: rep?.followUps?.length ? rep.followUps : followUps,
        };
      }),
    topics: [],
    fallbacks: [
      {
        text: `à¦¹à§à¦®, (${arc.openingBeat}) â€” à¦¬à¦²à§‹, à¦à¦‡ à¦…à¦¬à¦¸à§à¦¥à¦¾à§Ÿ à¦•à§€ à¦¬à¦²à¦¤à§‡ à¦šà¦¾à¦šà§à¦›à§‹?`,
        action: 'à¦®à¦¨à§‹à¦¯à§‹à¦— à¦¦à¦¿à§Ÿà§‡ à¦¶à§à¦¨à¦›à§‡',
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
    /(à¦¸à¦°à¦¿|à¦•à§à¦·à¦®à¦¾|à¦®à¦¾à¦«|à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿|à¦ªà§œà§‡ à¦¨à§‡à¦¬à§‹|à¦ªà§œà¦¬à§‹|à¦®à¦¾à¦¨à¦›à¦¿|à¦ªà§à¦²à¦¿à¦œ|à¦…à¦¨à§à¦°à§‹à¦§|à¦ à¦¿à¦• à¦†à¦›à§‡|à¦°à¦¾à¦œà¦¿|à¦¬à§à¦à§‡à¦›à¦¿|à¦°à¦¾à¦— à¦•à¦°à§‹ à¦¨à¦¾|please|sorry|promise)/.test(
      normalized
    );
  const isDefiantOrRefusal =
    /(à¦ªà§œà¦¬à§‹ à¦¨à¦¾|à¦–à§‡à¦²à¦¤à§‡ à¦¯à¦¾à¦¬à§‹|à¦¯à¦¾à¦¬à¦‡|à¦­à¦¾à¦²à§‹ à¦²à¦¾à¦—à§‡ à¦¨à¦¾|à¦¨à¦¾ à¦à¦–à¦¨|à¦•à¦°à¦¬à§‹ à¦¨à¦¾|parbo na|khelte jabo|porbo na)/.test(
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
    currentMood: 'à¦¶à¦¾à¦¨à§à¦¤',
  });
  const initialMood: CharacterMood =
    initialRelation === 'mother' || initialRelation === 'father'
      ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²'
      : initialRelation === 'romantic' || initialRelation === 'spouse'
        ? 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦®à§Ÿ'
        : 'à¦¶à¦¾à¦¨à§à¦¤';

  return {
    affinity: 25,
    turnCount: 0,
    recentResponseKeys: [],
    currentMood: initialMood,
    lastTopic: character.id,
    detectedRelation: initialRelation,
    scenarioArc: character.scenarioArc,
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
  const understoodWords = analysis.matchedLexicon.map((w) => w.root);
  const updatedArc = advanceScenarioArc(
    memory.scenarioArc || character.scenarioArc,
    nextTurn,
    normalized
  );
  const displayUser = effectiveUserName || getDefaultAddressTerm(relation);

  // 1. User introduced their name
  if (detectedName && trimmed.split(/\s+/).length <= 5) {
    const mood: CharacterMood =
      relation === 'mother' || relation === 'father'
        ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²'
        : relation === 'romantic' || relation === 'spouse'
          ? 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦®à§Ÿ'
          : 'à¦‰à§Žà¦«à§à¦²à§à¦²';

    const replyText =
      relation === 'mother'
        ? `à¦¬à¦¾à¦¹, ${detectedName} à¦¨à¦¾à¦®à¦Ÿà¦¾ à¦¤à§‹ à¦­à§€à¦·à¦£ à¦®à¦¿à¦·à§à¦Ÿà¦¿! à¦†à¦®à¦¾à¦° à¦¸à§‹à¦¨à¦¾ ${detectedName}â€”à¦†à§Ÿ, à¦†à¦®à§à¦®à§à¦° à¦•à¦¾à¦›à§‡ à¦à¦¸à§‡ à¦à¦•à¦Ÿà§ à¦¬à¦¸ à¦¤à§‹à¥¤ à¦†à¦œ à¦•à§‡à¦®à¦¨ à¦•à§‡à¦Ÿà§‡à¦›à§‡ à¦¦à¦¿à¦¨à¦Ÿà¦¾?`
        : relation === 'father'
          ? `à¦¬à§‡à¦¶ à¦¸à§à¦¨à§à¦¦à¦° à¦¨à¦¾à¦® à¦¤à§‹ ${detectedName}! à¦­à¦¾à¦²à§‹ à¦†à¦›à§‹ à¦¤à§‹? à¦¬à¦²à§‹, à¦†à¦œ à¦•à§€ à¦¨à¦¿à§Ÿà§‡ à¦•à¦¥à¦¾ à¦¬à¦²à¦¬à§‡ à¦†à¦¬à§à¦¬à§à¦° à¦¸à¦¾à¦¥à§‡?`
          : relation === 'romantic' || relation === 'spouse'
            ? `${detectedName}! à¦¨à¦¾à¦®à¦Ÿà¦¾ à¦‰à¦šà§à¦šà¦¾à¦°à¦£ à¦•à¦°à¦¤à§‡à¦‡ à¦•à§€ à¦­à¦¾à¦²à§‹ à¦²à¦¾à¦—à§‡ à¦†à¦®à¦¾à¦°! à¦à¦–à¦¨ à¦¬à¦²à§‹ à¦¤à§‹, à¦•à§‡à¦®à¦¨ à¦†à¦›à§‹ à¦¤à§à¦®à¦¿?`
            : `à¦¬à¦¾à¦¹, ${detectedName} à¦¨à¦¾à¦®à¦Ÿà¦¾ à¦¤à§‹ à¦­à§€à¦·à¦£ à¦¸à§à¦¨à§à¦¦à¦°! à¦†à¦®à¦¿ ${character.name}à¥¤ à¦à¦–à¦¨ à¦¥à§‡à¦•à§‡ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦ªà§à¦°à¦¤à¦¿à¦Ÿà¦¿ à¦—à¦²à§à¦ªà§‡ à¦†à¦®à¦¿ à¦¤à§‹à¦®à¦¾à¦•à§‡ ${detectedName} à¦¬à¦²à§‡à¦‡ à¦¡à¦¾à¦•à¦¬à§‹à¥¤ à¦¬à¦²à§‹ ${detectedName}, à¦†à¦œ à¦•à§‹à¦¨ à¦—à¦²à§à¦ª à¦¦à¦¿à§Ÿà§‡ à¦¶à§à¦°à§ à¦•à¦°à¦¬à§‹?`;

    return {
      replyText,
      action:
        relation === 'mother' || relation === 'father'
          ? 'à¦¸à§à¦¨à§‡à¦¹à¦­à¦°à¦¾ à¦¹à¦¾à¦¸à¦¿ à¦¦à¦¿à§Ÿà§‡ à¦•à¦¾à¦›à§‡ à¦¡à¦¾à¦•à¦²à§‹'
          : 'à¦¨à¦¾à¦®à§‡à¦° à¦ªà§à¦°à¦¶à¦‚à¦¸à¦¾ à¦•à¦°à§‡ à¦†à¦¨à§à¦¤à¦°à¦¿à¦•à¦­à¦¾à¦¬à§‡ à¦¹à¦¾à¦¸à¦²à§‹',
      mood,
      followUps: character.initialFollowUps,
      matchedTopic: 'à¦ªà¦°à¦¿à¦šà¦¿à¦¤à¦¿',
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: detectedName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 6),
        lastTopic: 'name_introduction',
        currentMood: mood,
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
  }

  // 2. Direct word-meaning query ("à¦…à¦­à¦¿à¦®à¦¾à¦¨ à¦®à¦¾à¦¨à§‡ à¦•à§€?" / "obhiman mane ki?")
  if (analysis.meaningQueryTarget) {
    const meaningReply = composeEmotionAwareReply(
      analysis,
      character,
      relation,
      displayUser,
      customEmotions
    );
    if (meaningReply) {
      return {
        ...meaningReply,
        followUps: character.initialFollowUps,
        detectedUserEmotion: analysis.dominantEmotion,
        understoodWords,
        updatedMemory: {
          ...memory,
          userName: effectiveUserName,
          detectedRelation: relation,
          turnCount: nextTurn,
          affinity: Math.min(100, memory.affinity + 4),
          lastTopic: 'word_meaning',
          currentMood: meaningReply.mood,
          lastUserEmotion: analysis.dominantEmotion,
          lastUnderstoodWords: understoodWords,
          scenarioArc: updatedArc,
        },
      };
    }
  }

  // 3. Name recall check
  if (
    normalized.includes('à¦†à¦®à¦¾à¦° à¦¨à¦¾à¦® à¦®à¦¨à§‡') ||
    normalized.includes('amar naam mone') ||
    normalized.includes('à¦¨à¦¾à¦® à¦•à§€')
  ) {
    const reply = effectiveUserName
      ? `à¦…à¦¬à¦¶à§à¦¯à¦‡ à¦®à¦¨à§‡ à¦†à¦›à§‡! à¦¤à§‹à¦®à¦¾à¦° à¦¨à¦¾à¦® ${effectiveUserName}à¥¤ à¦¨à¦¿à¦œà§‡à¦° à¦•à¦¾à¦›à§‡à¦° à¦®à¦¾à¦¨à§à¦·à§‡à¦° à¦¨à¦¾à¦® à¦•à¦¿ à¦¸à¦¹à¦œà§‡ à¦­à§‹à¦²à¦¾ à¦¯à¦¾à§Ÿ à¦¨à¦¾à¦•à¦¿?`
      : 'à¦¤à§à¦®à¦¿ à¦¤à§‹ à¦à¦–à¦¨à§‹ à¦¤à§‹à¦®à¦¾à¦° à¦¸à§à¦¨à§à¦¦à¦° à¦¨à¦¾à¦®à¦Ÿà¦¾ à¦¬à¦²à§‹à¦¨à¦¿! à¦¬à¦²à§‹ à¦¨à¦¾, à¦•à§€ à¦¨à¦¾à¦®à§‡ à¦¡à¦¾à¦•à¦²à§‡ à¦¤à§‹à¦®à¦¾à¦° à¦­à¦¾à¦²à§‹ à¦²à¦¾à¦—à¦¬à§‡?';
    const mood = effectiveUserName ? 'à¦‰à§Žà¦«à§à¦²à§à¦²' : 'à¦•à§Œà¦¤à§‚à¦¹à¦²à§€';
    return {
      replyText: reply,
      action: effectiveUserName ? 'à¦šà§‹à¦– à¦‰à¦œà§à¦œà§à¦¬à¦² à¦•à¦°à§‡ à¦¹à§‡à¦¸à§‡ à¦‰à¦¤à§à¦¤à¦° à¦¦à¦¿à¦²' : 'à¦•à§Œà¦¤à§‚à¦¹à¦²à§€ à¦¹à§Ÿà§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
      mood,
      followUps: effectiveUserName
        ? ['à¦¦à¦¾à¦°à§à¦£! à¦à¦¬à¦¾à¦° à¦à¦•à¦Ÿà¦¾ à¦—à¦²à§à¦ª à¦¬à¦²à§‹', 'à¦šà¦²à§‹ à¦…à¦¨à§à¦¯ à¦•à¦¥à¦¾ à¦¬à¦²à¦¿']
        : ['à¦†à¦®à¦¾à¦° à¦¨à¦¾à¦® à¦°à¦¾à¦«à¦¿', 'à¦†à¦®à¦¾à¦° à¦¨à¦¾à¦® à¦…à¦¨à¦¨à§à¦¯à¦¾'],
      matchedTopic: 'à¦¸à§à¦®à§ƒà¦¤à¦¿',
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: effectiveUserName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 3),
        currentMood: mood,
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
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
        return {
          replyText: interpolateTemplate(rule.response, character, relation, effectiveUserName),
          action: rule.action || 'à¦†à¦¨à§à¦¤à¦°à¦¿à¦•à¦­à¦¾à¦¬à§‡ à¦¤à¦¾à¦•à¦¿à§Ÿà§‡ à¦‰à¦¤à§à¦¤à¦° à¦¦à¦¿à¦²',
          mood,
          followUps: rule.followUps?.length ? rule.followUps : character.initialFollowUps,
          matchedTopic: 'à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à¦‚à¦²à¦¾à¦ª',
          detectedUserEmotion: analysis.dominantEmotion,
          understoodWords,
          updatedMemory: {
            ...memory,
            userName: effectiveUserName,
            detectedRelation: relation,
            turnCount: nextTurn,
            affinity: Math.min(100, memory.affinity + 4),
            lastTopic: 'custom_rule',
            currentMood: mood,
            lastUserEmotion: analysis.dominantEmotion,
            lastUnderstoodWords: understoodWords,
            scenarioArc: updatedArc,
          },
        };
      }
    }
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
          0
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
      const replyMood = variant.mood || bestPhase.emotion || 'à¦¶à¦¾à¦¨à§à¦¤';
      return {
        replyText: interpolateTemplate(variant.text, character, relation, effectiveUserName),
        replyKey: key,
        action: variant.action,
        mood: replyMood,
        followUps: variant.followUps.length > 0 ? variant.followUps : character.initialFollowUps,
        matchedTopic: `à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿ (${bestPhase.phase})`,
        detectedUserEmotion: analysis.dominantEmotion,
        understoodWords,
        updatedMemory: {
          ...memory,
          userName: effectiveUserName,
          detectedRelation: relation,
          turnCount: nextTurn,
          affinity: Math.min(100, memory.affinity + 5),
          lastTopic: `scenario_${bestPhase.phase}`,
          recentResponseKeys: [...memory.recentResponseKeys.slice(-8), key],
          currentMood: replyMood,
          lastUserEmotion: analysis.dominantEmotion,
          lastUnderstoodWords: understoodWords,
          scenarioArc: updatedArc ? { ...updatedArc, currentPhase: bestPhase.phase } : undefined,
        },
      };
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
      return {
        replyText: interpolateTemplate(bestPattern.response, character, relation, effectiveUserName),
        replyKey: key,
        action: bestPattern.action,
        mood: bestPattern.emotion,
        followUps: character.initialFollowUps,
        matchedTopic: 'à¦¸à§à¦¬-à¦¶à¦¿à¦•à§à¦·à¦¿à¦¤ ML à¦ªà§à¦¯à¦¾à¦Ÿà¦¾à¦°à§à¦¨',
        detectedUserEmotion: analysis.dominantEmotion,
        understoodWords,
        updatedMemory: {
          ...memory,
          userName: effectiveUserName,
          detectedRelation: relation,
          turnCount: nextTurn,
          affinity: Math.min(100, memory.affinity + 5),
          lastTopic: 'ml_self_learned',
          recentResponseKeys: [...memory.recentResponseKeys.slice(-8), key],
          currentMood: bestPattern.emotion,
          lastUserEmotion: analysis.dominantEmotion,
          lastUnderstoodWords: understoodWords,
          scenarioArc: updatedArc,
        },
      };
    }
  }

  // 5. User-trained + Built-in Natural Dataset Conversation Pairs
  const combinedTrained = [
    ...(intelligenceContext?.trainedConversations || []),
    ...DATASET_NATURAL_PAIRS,
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
    return {
      replyText: interpolateTemplate(trainedHit.response, character, relation, effectiveUserName),
      replyKey: key,
      action: trainedHit.action || 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦‰à¦¤à§à¦¤à¦° à¦¦à¦¿à¦²',
      mood: trainedHit.emotion,
      followUps: trainedHit.followUps?.length ? trainedHit.followUps : character.initialFollowUps,
      matchedTopic: trainedHit.source || 'à¦ªà§à¦°à¦¶à¦¿à¦•à§à¦·à¦¿à¦¤ à¦¸à¦‚à¦²à¦¾à¦ª',
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: effectiveUserName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 5),
        lastTopic: 'trained_corpus',
        recentResponseKeys: [...memory.recentResponseKeys.slice(-8), key],
        currentMood: trainedHit.emotion,
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
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
      return {
        replyText: interpolateTemplate(branch.characterReply, character, relation, effectiveUserName),
        action: branch.sceneAction,
        mood: branch.mood,
        followUps: branch.nextChoices,
        matchedTopic: branch.title,
        detectedUserEmotion: analysis.dominantEmotion,
        understoodWords,
        updatedMemory: {
          ...memory,
          userName: effectiveUserName,
          detectedRelation: relation,
          turnCount: nextTurn,
          affinity: Math.min(100, memory.affinity + 5),
          lastTopic: branch.id,
          recentResponseKeys: [...memory.recentResponseKeys.slice(-8), key],
          currentMood: branch.mood,
          lastUserEmotion: analysis.dominantEmotion,
          lastUnderstoodWords: understoodWords,
          scenarioArc: updatedArc,
        },
      };
    }
  }

  // 7. Short / Hesitant Reply Handler ("à¦¹à§à¦®", "à¦†à¦šà§à¦›à¦¾", "à¦•à¦¿à¦›à§ à¦¨à¦¾", "hmm", "ok", "kisu na")
  if (/^(à¦¹à§à¦®|à¦†à¦šà§à¦›à¦¾|à¦¹à§à¦¯à¦¾à¦|à¦¨à¦¾|à¦•à¦¿à¦›à§ à¦¨à¦¾|à¦ à¦¿à¦• à¦†à¦›à§‡|ok|yes|no)$/.test(normalized)) {
    const shortReplyText =
      relation === 'mother'
        ? `à¦•à§€ à¦¹à¦²à§‹ ${displayUser}, à¦¶à§à¦§à§ "${trimmed}" à¦¬à¦²à¦²à¦¿ à¦¯à§‡? à¦•à§‹à¦¨à§‹ à¦•à¦¥à¦¾ à¦²à§à¦•à¦¾à¦šà§à¦›à¦¿à¦¸ à¦¨à¦¾ à¦¤à§‹ à¦†à¦®à¦¾à¦° à¦•à¦¾à¦›à§‡?`
        : relation === 'romantic' || relation === 'spouse'
          ? `à¦à¦¤ à¦›à§‹à¦Ÿ à¦•à¦°à§‡ "${trimmed}" à¦¬à¦²à¦²à§‡ à¦†à¦®à¦¾à¦° à¦­à¦¾à¦²à§‹ à¦²à¦¾à¦—à§‡ à¦¨à¦¾ ${displayUser}! à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª à¦¨à¦¾à¦•à¦¿ à¦•à§‹à¦¨à§‹ à¦•à¦¾à¦°à¦£à§‡?`
          : relation === 'friend'
            ? `à¦•à¦¿à¦°à§‡ à¦®à¦¾à¦®à¦¾, "${trimmed}" à¦¬à¦²à§‡à¦‡ à¦¶à§‡à¦·? à¦˜à¦Ÿà¦¨à¦¾ à¦•à§€ à¦–à§à¦²à§‡ à¦¬à¦² à¦¤à§‹!`
            : `à¦¹à§à¦®, à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦²à¦¾à¦® ${displayUser}à¥¤ à¦¤à¦¾à¦°à¦ªà¦° à¦•à§€ à¦¹à¦²à§‹ à¦¬à¦²à§‹?`;

    return {
      replyText: shortReplyText,
      action: 'à¦®à§à¦–à§‡à¦° à¦­à¦¾à¦¬ à¦²à¦•à§à¦· à¦•à¦°à§‡ à¦•à§Œà¦¤à§‚à¦¹à¦²à§€ à¦¹à§Ÿà§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
      mood: 'à¦•à§Œà¦¤à§‚à¦¹à¦²à§€',
      followUps: character.initialFollowUps,
      matchedTopic: 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦ªà§à¦°à¦¤à¦¿à¦•à§à¦°à¦¿à§Ÿà¦¾',
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: effectiveUserName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 2),
        currentMood: 'à¦•à§Œà¦¤à§‚à¦¹à¦²à§€',
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
  }

  // 8. Relationship Knowledge + Character Topics + Shared Topics
  let bestScore = 0;
  let bestTopic: DialogueTopic | null = null;
  let topicScope = character.id;

  const relationPack = RELATIONSHIP_KNOWLEDGE[relation];
  if (relationPack) {
    for (const topic of relationPack.topics) {
      const score = scoreTopicMatch(normalized, analysis.stemmedTokens, topic, 12);
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
        topicScope = `${character.id}:${relation}`;
      }
    }
  }

  for (const topic of character.topics) {
    const score = scoreTopicMatch(normalized, analysis.stemmedTokens, topic, 8);
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
      topicScope = character.id;
    }
  }

  for (const topic of SHARED_BENGALI_TOPICS) {
    const score = scoreTopicMatch(normalized, analysis.stemmedTokens, topic, 0);
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
      topicScope = `${character.id}:shared`;
    }
  }

  if (bestTopic && bestScore > 0) {
    const { variant, key } = pickNonRepeatingVariant(
      bestTopic.responses,
      `${topicScope}:${bestTopic.topic}`,
      memory.recentResponseKeys
    );
    const replyText = interpolateTemplate(variant.text, character, relation, effectiveUserName);
    return {
      replyText,
      action: variant.action,
      mood: variant.mood,
      followUps: variant.followUps,
      matchedTopic: bestTopic.labelBn,
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: effectiveUserName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 4),
        lastTopic: bestTopic.topic,
        recentResponseKeys: [...memory.recentResponseKeys.slice(-8), key],
        currentMood: variant.mood,
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
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
    return {
      ...emotionalReaction,
      followUps: relationPack?.fallbacks[0]?.followUps || character.initialFollowUps,
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: effectiveUserName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 4),
        lastTopic: 'emotional_intelligence',
        currentMood: emotionalReaction.mood,
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
  }

  // 10. Scenario-Aware + Relationship-Aware Contextual Fallback
  if (updatedArc && (updatedArc.currentPhase === 'developing' || updatedArc.currentPhase === 'resolution')) {
    const arcPrompt =
      updatedArc.currentPhase === 'developing' ? updatedArc.middleBeat : updatedArc.endingBeat;
    return {
      replyText:
        relation === 'mother'
          ? `à¦¹à§à¦® à¦¬à§à¦à¦²à¦¾à¦® ${displayUser}à¥¤ à¦•à¦¿à¦¨à§à¦¤à§ à¦à¦–à¦¨ à¦¯à§‡ à¦ªà¦°à¦¿à¦¸à§à¦¥à¦¿à¦¤à¦¿à¦° à¦­à§‡à¦¤à¦° à¦¦à¦¿à§Ÿà§‡ à¦¯à¦¾à¦šà§à¦›à¦¿ (${arcPrompt})â€”à¦à¦Ÿà¦¾ à¦¨à¦¿à§Ÿà§‡ à¦¤à§à¦‡ à¦•à§€ à¦­à¦¾à¦¬à¦›à¦¿à¦¸ à¦¬à¦² à¦¤à§‹ à¦†à¦®à¦¾à§Ÿ?`
          : `à¦¶à§‹à¦¨à§‹ ${displayUser}, à¦†à¦®à¦¾à¦¦à§‡à¦° à¦—à¦²à§à¦ªà§‡à¦° à¦à¦‡ à¦ªà¦°à§à¦¯à¦¾à§Ÿà§‡ à¦à¦¸à§‡ (${arcPrompt})â€”à¦¬à¦¿à¦·à§Ÿà¦Ÿà¦¾ à¦¨à¦¿à§Ÿà§‡ à¦¤à§à¦®à¦¿ à¦•à§€ à¦¸à¦¿à¦¦à§à¦§à¦¾à¦¨à§à¦¤ à¦¨à¦¿à¦šà§à¦›à§‹?`,
      action: 'à¦ªà¦°à¦¿à¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦¬à§à¦à§‡ à¦šà¦¿à¦¨à§à¦¤à¦¾à¦¶à§€à¦² à¦¦à§ƒà¦·à§à¦Ÿà¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
      mood: relation === 'mother' ? 'à¦¶à¦¾à¦¸à¦¨à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¸à§à¦¨à§‡à¦¹' : 'à¦šà¦¿à¦¨à§à¦¤à¦¾à¦¶à§€à¦²',
      followUps: character.initialFollowUps,
      matchedTopic:
        updatedArc.currentPhase === 'developing' ? 'à¦—à¦²à§à¦ªà§‡à¦° à¦®à¦¾à¦à¦–à¦¾à¦¨' : 'à¦—à¦²à§à¦ªà§‡à¦° à¦ªà¦°à¦¿à¦£à¦¤à¦¿',
      detectedUserEmotion: analysis.dominantEmotion,
      understoodWords,
      updatedMemory: {
        ...memory,
        userName: effectiveUserName,
        detectedRelation: relation,
        turnCount: nextTurn,
        affinity: Math.min(100, memory.affinity + 3),
        lastTopic: 'scenario_progression',
        currentMood: relation === 'mother' ? 'à¦¶à¦¾à¦¸à¦¨à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¸à§à¦¨à§‡à¦¹' : 'à¦šà¦¿à¦¨à§à¦¤à¦¾à¦¶à§€à¦²',
        lastUserEmotion: analysis.dominantEmotion,
        lastUnderstoodWords: understoodWords,
        scenarioArc: updatedArc,
      },
    };
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

  return {
    replyText: interpolateTemplate(variant.text, character, relation, effectiveUserName),
    action: variant.action,
    mood: variant.mood,
    followUps: variant.followUps,
    matchedTopic:
      relation === 'mother'
        ? 'à¦®à¦¾à§Ÿà§‡à¦° à¦¸à§à¦¨à§‡à¦¹'
        : relation === 'romantic'
          ? 'à¦¹à§ƒà¦¦à§Ÿà§‡à¦° à¦•à¦¥à¦¾'
          : relation === 'spouse'
            ? 'à¦¦à¦¾à¦®à§à¦ªà¦¤à§à¦¯ à¦†à¦²à¦¾à¦ª'
            : relation === 'friend'
              ? 'à¦¬à¦¨à§à¦§à§ à¦†à¦¡à§à¦¡à¦¾'
              : 'à¦¸à§à¦¬à¦¤à¦ƒà¦¸à§à¦«à§‚à¦°à§à¦¤ à¦†à¦²à¦¾à¦ª',
    detectedUserEmotion: analysis.dominantEmotion,
    understoodWords,
    updatedMemory: {
      ...memory,
      userName: effectiveUserName,
      detectedRelation: relation,
      turnCount: nextTurn,
      affinity: Math.min(100, memory.affinity + 2),
      lastTopic: 'contextual_dialogue',
      recentResponseKeys: [...memory.recentResponseKeys.slice(-8), key],
      currentMood: variant.mood,
      lastUserEmotion: analysis.dominantEmotion,
      lastUnderstoodWords: understoodWords,
      scenarioArc: updatedArc,
    },
  };
}

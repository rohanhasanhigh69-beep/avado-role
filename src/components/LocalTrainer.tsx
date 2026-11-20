import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
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
    emotions?: CustomEmotionDefinition[]
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
        root: 'à¦…à¦¨à§à¦¨à§Ÿ',
        emotion: 'à¦…à¦¨à§à¦¨à§Ÿ',
        forms: ['à¦…à¦¨à§à¦¨à§Ÿ', 'à¦ªà§à¦²à¦¿à¦œ', 'please ma', 'convince', 'à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿'],
        meaningBn: 'à¦•à¦¾à¦‰à¦•à§‡ à¦¨à¦°à¦® à¦•à¦°à§‡ à¦°à¦¾à¦œà¦¿ à¦•à¦°à¦¾à¦¨à§‹à¦° à¦œà¦¨à§à¦¯ à¦¬à¦¿à¦¨à§€à¦¤ à¦…à¦¨à§à¦°à§‹à¦§',
        category: 'à¦†à¦¬à§‡à¦— à¦“ à¦¸à¦®à§à¦ªà¦°à§à¦•',
        intensity: 4,
      },
    ],
    characters: [
      {
        name: 'à¦°à¦¾à¦¬à§‡à§Ÿà¦¾ (à¦•à¦ à§‹à¦° à¦†à¦®à§à¦®à§)',
        relation: 'mother',
        gender: 'female',
        age: 39,
        setting: 'à¦¬à¦¾à¦¸à¦¾à¦° à¦ªà§œà¦¾à¦° à¦˜à¦°à§‡',
        personalitySummary:
          'à¦ªà§œà¦¾à¦¶à§‹à¦¨à¦¾à¦° à¦¬à¦¿à¦·à§Ÿà§‡ à¦ªà§à¦°à¦¥à¦®à§‡ à¦°à¦¾à¦—à§€ à¦“ à¦•à¦ à§‹à¦°, à¦šà¦¾à¦ª à¦¬à¦¾ à¦¶à¦°à§à¦¤ à¦¦à§‡à§Ÿ, à¦•à¦¿à¦¨à§à¦¤à§ à¦®à¦¨ à¦¦à¦¿à§Ÿà§‡ à¦•à¦¥à¦¾ à¦¶à§à¦¨à¦²à§‡ à¦¨à¦°à¦® à¦¹à§Ÿà§‡ à¦¯à¦¾à§Ÿà¥¤',
        greeting: 'à¦à¦‡ à¦–à§‹à¦•à¦¾! à¦¸à¦¾à¦°à¦¾à¦¦à¦¿à¦¨ à¦¬à¦‡à§Ÿà§‡à¦° à¦¨à¦¾à¦® à¦¨à§‡à¦‡, à¦à¦–à¦¨ à¦†à¦¬à¦¾à¦° à¦–à§‡à¦²à¦¤à§‡ à¦¯à¦¾à¦“à§Ÿà¦¾à¦° à¦•à¦¥à¦¾ à¦¬à¦²à¦›à¦¿à¦¸?',
        greetingAction: 'à¦¹à¦¾à¦¤à§‡ à¦šà¦¾à§Ÿà§‡à¦° à¦•à¦¾à¦ª à¦°à§‡à¦–à§‡ à¦•à§œà¦¾ à¦šà§‹à¦–à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
      },
    ],
    scenarios: [
      {
        title: 'Study vs Playtime: Anger to Persuasion Arc (à¦°à¦¾à¦—, à¦¶à¦°à§à¦¤ à¦“ à¦°à¦¾à¦œà¦¿ à¦¹à¦“à§Ÿà¦¾à¦° à¦—à¦²à§à¦ª)',
        relation: 'mother',
        characterName: 'à¦°à¦¾à¦¬à§‡à§Ÿà¦¾',
        characterAge: 39,
        setting: 'à¦¬à¦¾à¦¸à¦¾à¦° à¦ªà§œà¦¾à¦° à¦˜à¦°à§‡',
        summary:
          'à¦›à§‡à¦²à§‡ à¦–à§‡à¦²à¦¤à§‡ à¦¯à§‡à¦¤à§‡ à¦šà¦¾à¦‡à¦²à§‡ à¦®à¦¾ à¦ªà§à¦°à¦¥à¦®à§‡ à¦°à¦¾à¦— à¦•à¦°à§‡ à¦“ à¦¬à¦¾à¦¬à¦¾à¦•à§‡ à¦¬à¦²à§‡ à¦¦à§‡à¦“à§Ÿà¦¾à¦° à¦­à§Ÿ à¦¦à§‡à¦–à¦¾à§Ÿ; à¦ªà¦°à§‡ à¦›à§‡à¦²à§‡ à¦¬à§à¦à¦¿à§Ÿà§‡ à¦ªà§œà¦¾à¦° à¦•à¦¥à¦¾ à¦¦à¦¿à¦²à§‡ à¦®à¦¾ à¦¨à¦°à¦® à¦¹à§Ÿà§‡ à¦°à¦¾à¦œà¦¿ à¦¹à§Ÿà¥¤',
        greeting: 'à¦ªà§œà¦¾à¦¶à§‹à¦¨à¦¾ à¦¶à§‡à¦· à¦¨à¦¾ à¦•à¦°à§‡ à¦à¦• à¦ªà¦¾à¦“ à¦˜à¦°à§‡à¦° à¦¬à¦¾à¦‡à¦°à§‡ à¦¯à¦¾à¦¬à§‡ à¦¨à¦¾â€”à¦¬à¦²à§‹ à¦†à¦œ à¦•à¦¤à¦•à§à¦·à¦£ à¦ªà§œà§‡à¦›à§‹?',
        greetingAction: 'à¦¬à¦‡à§Ÿà§‡à¦° à¦Ÿà§‡à¦¬à¦¿à¦²à§‡à¦° à¦ªà¦¾à¦¶à§‡ à¦¦à¦¾à¦à§œà¦¿à§Ÿà§‡ à¦—à¦®à§à¦­à§€à¦° à¦¸à§à¦¬à¦°à§‡ à¦¬à¦²à¦²à§‹',
        phases: [
          {
            phase: 'opening',
            beat: 'à¦–à§‡à¦²à¦¾à¦° à¦¬à¦¾à§Ÿà¦¨à¦¾ à¦¶à§à¦¨à§‡ à¦®à¦¾à§Ÿà§‡à¦° à¦ªà§à¦°à¦¾à¦¥à¦®à¦¿à¦• à¦°à¦¾à¦— à¦“ à¦†à¦ªà¦¤à§à¦¤à¦¿',
            emotion: 'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤',
            phaseTrigger: 'refusal',
            keywords: ['à¦–à§‡à¦²à¦¤à§‡', 'à¦ªà§œà¦¬à§‹ à¦¨à¦¾', 'à¦¯à¦¾à¦¬à§‹', 'khelte', 'porbo na'],
            variants: [
              {
                text: 'à¦•à§‡à¦¨ à¦ªà§œà¦¬à¦¿ à¦¨à¦¾? à¦¤à§‹à¦° à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦¸à¦¾à¦®à¦¨à§‡ à¦†à¦° à¦¤à§à¦‡ à¦à¦–à¦¨ à¦–à§‡à¦²à¦¤à§‡ à¦¯à¦¾à¦¬à¦¿? à¦à¦•à¦¦à¦® à¦¨à¦¾â€”à¦†à¦œ à¦›à§Ÿ à¦˜à¦£à§à¦Ÿà¦¾ à¦Ÿà§‡à¦¬à¦¿à¦² à¦¥à§‡à¦•à§‡ à¦‰à¦ à¦¬à¦¿ à¦¨à¦¾!',
                action: 'à¦°à¦¾à¦—à§‡ à¦­à§à¦°à§ à¦•à§à¦à¦šà¦•à§‡ à¦•à§œà¦¾ à¦—à¦²à¦¾à§Ÿ à¦§à¦®à¦• à¦¦à¦¿à¦²',
                mood: 'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤',
                followUps: ['à¦¨à¦¾ à¦†à¦®à§à¦®à§, à¦†à¦œ à¦–à§‡à¦²à¦¤à§‡ à¦¯à§‡à¦¤à§‡à¦‡ à¦¹à¦¬à§‡', 'à¦›à§Ÿ à¦˜à¦£à§à¦Ÿà¦¾ à¦ªà¦¾à¦°à¦¬à§‹ à¦¨à¦¾ à¦†à¦®à§à¦®à§'],
              },
            ],
          },
          {
            phase: 'developing',
            beat: 'à¦¶à¦°à§à¦¤ à¦“ à¦¬à¦¾à¦¬à¦¾à¦•à§‡ à¦¬à¦²à§‡ à¦¦à§‡à¦“à§Ÿà¦¾à¦° à¦šà¦¾à¦ª (à¦­à§Ÿ à¦¦à§‡à¦–à¦¾à¦¨à§‹)',
            emotion: 'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤',
            phaseTrigger: 'pressure',
            keywords: ['à¦ªà¦¾à¦°à¦¬à§‹ à¦¨à¦¾', 'à¦¬à¦¾à¦œà§‡ à¦²à¦¾à¦—à§‡', 'à¦›à§Ÿ à¦˜à¦£à§à¦Ÿà¦¾', 'à¦•à§‡à¦¨', 'à¦¨à¦¾'],
            variants: [
              {
                text: 'à¦¤à§à¦®à¦¿ à¦¯à¦¦à¦¿ à¦†à¦œ à¦¨à¦¾ à¦ªà§œà§‹, à¦¸à¦¨à§à¦§à§à¦¯à¦¾à§Ÿ à¦¤à§‹à¦®à¦¾à¦° à¦¬à¦¾à¦¬à¦¾ à¦«à¦¿à¦°à¦²à§‡à¦‡ à¦¸à¦¬ à¦¬à¦²à§‡ à¦¦à§‡à¦¬à§‹ à¦•à¦¿à¦¨à§à¦¤à§! à¦¤à¦–à¦¨ à¦¬à§à¦à¦¬à§‡ à¦–à§‡à¦²à¦¤à§‡ à¦¯à¦¾à¦“à§Ÿà¦¾ à¦•à¦¾à¦•à§‡ à¦¬à¦²à§‡à¥¤',
                action: 'à¦¦à§ƒà§ à¦šà§‹à¦–à§‡ à¦¤à¦¾à¦•à¦¿à§Ÿà§‡ à¦¸à§à¦ªà¦·à§à¦Ÿ à¦¶à¦°à§à¦¤ à¦¦à¦¿à¦²',
                mood: 'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤',
                followUps: [
                  'à¦ªà§à¦²à¦¿à¦œ à¦†à¦®à§à¦®à§ à¦†à¦¬à§à¦¬à§à¦•à§‡ à¦¬à¦²à§‹ à¦¨à¦¾, à¦à¦¸à§‡ à¦ªà§œà§‡ à¦¨à§‡à¦¬à§‹',
                  'à¦¸à¦°à¦¿ à¦†à¦®à§à¦®à§, à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿ à¦°à¦¾à¦¤à§‡ à¦ªà§à¦°à§‹ à¦ªà§œà¦¾ à¦¶à§‡à¦· à¦•à¦°à¦¬à§‹',
                ],
              },
            ],
          },
          {
            phase: 'resolution',
            beat: 'à¦…à¦¨à§à¦¨à§Ÿà§‡ à¦®à¦¾à§Ÿà§‡à¦° à¦®à¦¨ à¦—à¦²à¦¾ à¦“ à¦¶à¦°à§à¦¤à¦¸à¦¾à¦ªà§‡à¦•à§à¦·à§‡ à¦¸à¦®à§à¦®à¦¤à¦¿',
            emotion: 'à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿',
            phaseTrigger: 'persuasion',
            keywords: ['à¦ªà§à¦²à¦¿à¦œ', 'à¦¸à¦°à¦¿', 'à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿', 'à¦ªà§œà§‡ à¦¨à§‡à¦¬à§‹', 'à¦†à¦¬à§à¦¬à§à¦•à§‡ à¦¬à¦²à§‹ à¦¨à¦¾', 'please', 'sorry'],
            variants: [
              {
                text: 'à¦‰à¦«, à¦¤à§‹à¦•à§‡ à¦¨à¦¿à§Ÿà§‡ à¦†à¦° à¦ªà¦¾à¦°à¦¿ à¦¨à¦¾ {userName}! à¦†à¦šà§à¦›à¦¾ à¦ à¦¿à¦• à¦†à¦›à§‡, à¦à¦• à¦˜à¦£à§à¦Ÿà¦¾à¦° à¦œà¦¨à§à¦¯ à¦¯à¦¾â€”à¦¤à¦¬à§‡ à¦«à¦¿à¦°à§‡ à¦à¦¸à§‡à¦‡ à¦¬à¦‡ à¦¨à¦¿à§Ÿà§‡ à¦¬à¦¸à¦¬à¦¿, à¦•à¦¥à¦¾ à¦°à¦¾à¦–à¦¬à¦¿ à¦•à¦¿à¦¨à§à¦¤à§!',
                action: 'à¦¦à§€à¦°à§à¦˜ à¦¨à¦¿à¦¶à§à¦¬à¦¾à¦¸ à¦«à§‡à¦²à§‡ à¦¨à¦°à¦® à¦¹à¦¾à¦¸à¦¿ à¦¦à¦¿à¦²',
                mood: 'à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿',
                followUps: ['à¦¥à§à¦¯à¦¾à¦‚à¦• à¦‡à¦‰ à¦†à¦®à§à¦®à§! à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿', 'à¦à¦• à¦˜à¦£à§à¦Ÿà¦¾à¦° à¦®à¦§à§à¦¯à§‡à¦‡ à¦«à¦¿à¦°à¦¬à§‹'],
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
        prompt: 'à¦®à¦¾ à¦†à¦œà¦•à§‡ à¦†à¦®à¦¿ à¦–à§‡à¦²à¦¤à§‡ à¦¯à¦¾à¦¬à§‹ à¦ªà§œà¦¬à§‹ à¦¨à¦¾',
        keywords: ['à¦–à§‡à¦²à¦¤à§‡', 'à¦ªà§œà¦¬à§‹ à¦¨à¦¾', 'à¦®à¦¾'],
        response: 'à¦•à§‡à¦¨ à¦ªà§œà¦¬à¦¿ à¦¨à¦¾? à¦¤à§‹à¦° à¦ªà§œà¦¤à§‡ à¦¹à¦¬à§‡ à¦†à¦œà¦•à§‡! à¦†à¦—à§‡ à¦¦à§à¦‡ à¦…à¦§à§à¦¯à¦¾à§Ÿ à¦¶à§‡à¦· à¦•à¦°, à¦¤à¦¾à¦°à¦ªà¦° à¦–à§‡à¦²à¦¾à¦° à¦¨à¦¾à¦® à¦¨à¦¿à¦¬à¦¿à¥¤',
        emotion: 'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤',
        action: 'à¦¬à¦‡ à¦–à§à¦²à§‡ à¦Ÿà§‡à¦¬à¦¿à¦²à§‡à¦° à¦¸à¦¾à¦®à¦¨à§‡ à¦°à¦¾à¦–à¦²à§‹',
        followUps: ['à¦ªà§à¦²à¦¿à¦œ à¦®à¦¾, à¦à¦¸à§‡ à¦ªà§œà§‡ à¦¨à§‡à¦¬à§‹'],
      },
      {
        relation: 'mother',
        phase: 'developing',
        prompt: 'à¦¨à¦¾ à¦†à¦®à¦¿ à¦ªà§œà¦¬à§‹ à¦¨à¦¾',
        keywords: ['à¦ªà§œà¦¬à§‹ à¦¨à¦¾', 'à¦¨à¦¾', 'à¦•à¦·à§à¦Ÿ'],
        response: 'à¦¤à§à¦®à¦¿ à¦¯à¦¦à¦¿ à¦¨à¦¾ à¦ªà§œà§‹, à¦¤à§‹à¦®à¦¾à¦° à¦¬à¦¾à¦¬à¦¾à¦•à§‡ à¦¬à¦²à§‡ à¦¦à¦¿à¦¬à§‹ à¦•à¦¿à¦¨à§à¦¤à§! à¦à¦–à¦¨à¦‡ à¦¬à¦‡ à¦¨à¦¿à§Ÿà§‡ à¦¬à¦¸à§‹ à¦¬à¦²à¦›à¦¿à¥¤',
        emotion: 'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤',
        action: 'à¦•à§œà¦¾ à¦¦à§ƒà¦·à§à¦Ÿà¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¿à§Ÿà§‡ à¦¸à¦¤à¦°à§à¦• à¦•à¦°à¦²à§‹',
        followUps: ['à¦†à¦¬à§à¦¬à§à¦•à§‡ à¦¬à¦²à§‹ à¦¨à¦¾ à¦®à¦¾, à¦†à¦®à¦¿ à¦ªà§œà¦¬à§‹'],
      },
      {
        relation: 'mother',
        phase: 'resolution',
        prompt: 'à¦¸à¦°à¦¿ à¦®à¦¾ à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿ à¦«à¦¿à¦°à§‡ à¦à¦¸à§‡ à¦ªà§œà¦¬à§‹ à¦ªà§à¦²à¦¿à¦œ à¦¯à§‡à¦¤à§‡ à¦¦à¦¾à¦“',
        keywords: ['à¦¸à¦°à¦¿', 'à¦•à¦¥à¦¾ à¦¦à¦¿à¦šà§à¦›à¦¿', 'à¦ªà§à¦²à¦¿à¦œ', 'à¦«à¦¿à¦°à§‡ à¦à¦¸à§‡'],
        response: 'à¦†à¦šà§à¦›à¦¾ à¦ à¦¿à¦• à¦†à¦›à§‡ {userName}, à¦à¦¤ à¦•à¦°à§‡ à¦¬à¦²à¦›à¦¿à¦¸ à¦¯à¦–à¦¨ à¦¯à¦¾â€”à¦¤à¦¬à§‡ à¦¸à¦¨à§à¦§à§à¦¯à¦¾ à¦¨à¦¾à¦®à¦¾à¦° à¦†à¦—à§‡à¦‡ à¦¬à¦¾à¦¸à¦¾à§Ÿ à¦«à¦¿à¦°à¦¬à¦¿!',
        emotion: 'à¦¨à¦°à¦® à¦¹à¦“à§Ÿà¦¾',
        action: 'à¦¸à§à¦¨à§‡à¦¹à¦­à¦°à¦¾ à¦¦à§ƒà¦·à§à¦Ÿà¦¿à¦¤à§‡ à¦®à¦¾à¦¥à¦¾ à¦¨à§‡à§œà§‡ à¦¸à¦®à§à¦®à¦¤à¦¿ à¦¦à¦¿à¦²',
        followUps: ['à¦ à¦¿à¦• à¦†à¦›à§‡ à¦†à¦®à§à¦®à§, à¦¤à¦¾à§œà¦¾à¦¤à¦¾à§œà¦¿ à¦«à¦¿à¦°à¦¬à§‹'],
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
        title: 'Late Night Return Worry & Relief (à¦°à¦¾à¦¤à§‡ à¦¦à§‡à¦°à¦¿ à¦•à¦°à§‡ à¦«à§‡à¦°à¦¾à¦° à¦¦à§ƒà¦¶à§à¦¯à¦ªà¦Ÿ)',
        relation: 'mother',
        characterName: 'à¦°à¦¾à¦¬à§‡à§Ÿà¦¾',
        setting: 'à¦¦à¦°à¦œà¦¾à¦° à¦¸à¦¾à¦®à¦¨à§‡',
        summary: 'à¦¦à§‡à¦°à¦¿ à¦¹à¦“à§Ÿà¦¾à§Ÿ à¦®à¦¾à§Ÿà§‡à¦° à¦‰à¦¦à§à¦¬à§‡à¦— à¦“ à¦¶à¦¾à¦¸à¦¨, à¦¶à§‡à¦·à§‡ à¦¯à¦¤à§à¦¨ à¦¨à¦¿à§Ÿà§‡ à¦–à¦¾à¦¬à¦¾à¦° à¦¦à§‡à¦“à§Ÿà¦¾',
        phases: [
          {
            phase: 'opening',
            beat: 'à¦¦à§‡à¦°à¦¿à¦¤à§‡ à¦«à§‡à¦°à¦¾à§Ÿ à¦‰à¦¦à§à¦¬à§‡à¦— à¦“ à¦¬à¦•à¦¾',
            emotion: 'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨',
            keywords: ['à¦¦à§‡à¦°à¦¿', 'à¦°à¦¾à¦¤', 'à¦«à¦¿à¦°à¦²à¦¾à¦®'],
            variants: [
              {
                text: 'à¦à¦¤ à¦°à¦¾à¦¤ à¦¹à¦²à§‹ à¦•à§‡à¦¨ {userName}? à¦•à¦¤à¦¬à¦¾à¦° à¦«à§‹à¦¨ à¦¦à¦¿à§Ÿà§‡à¦›à¦¿â€”à¦Ÿà§‡à¦¨à¦¶à¦¨à§‡ à¦†à¦®à¦¾à¦° à¦¬à§à¦• à¦§à§œà¦«à§œ à¦•à¦°à¦›à¦¿à¦²!',
                action: 'à¦¦à¦°à¦œà¦¾ à¦–à§à¦²à§‡à¦‡ à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨ à¦¸à§à¦¬à¦°à§‡ à¦¬à¦²à¦²à§‹',
                mood: 'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨',
              },
            ],
          },
          {
            phase: 'resolution',
            beat: 'à¦°à¦¾à¦— à¦­à§‡à¦™à§‡ à¦¯à¦¤à§à¦¨',
            emotion: 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²',
            keywords: ['à¦¸à¦°à¦¿', 'à¦Ÿà§à¦°à¦¾à¦«à¦¿à¦•', 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¿'],
            variants: [
              {
                text: 'à¦†à¦šà§à¦›à¦¾ à¦¸à¦°à¦¿ à¦¬à¦²à¦¤à§‡ à¦¹à¦¬à§‡ à¦¨à¦¾, à¦¹à¦¾à¦¤-à¦®à§à¦– à¦§à§à§Ÿà§‡ à¦¨à§‡â€”à¦—à¦°à¦® à¦­à¦¾à¦¤ à¦¬à§‡à§œà§‡ à¦¦à¦¿à¦šà§à¦›à¦¿à¥¤',
                action: 'à¦¸à§à¦¨à§‡à¦¹à¦­à¦°à§‡ à¦–à¦¾à¦¬à¦¾à¦° à¦Ÿà§‡à¦¬à¦¿à¦²à§‡à¦° à¦¦à¦¿à¦•à§‡ à¦à¦—à§‹à¦²à§‹',
                mood: 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²',
              },
            ],
          },
        ],
      },
    ],
    characters: [
      {
        name: 'à¦¤à¦¾à¦¨à¦­à§€à¦°',
        relation: 'friend',
        gender: 'male',
        age: 24,
        setting: 'à¦Ÿà¦¿à¦à¦¸à¦¸à¦¿ à¦šà¦¾à§Ÿà§‡à¦° à¦¦à§‹à¦•à¦¾à¦¨',
        personalitySummary: 'à¦†à¦¡à§à¦¡à¦¾à¦¬à¦¾à¦œ, à¦°à¦¸à¦¿à¦• à¦•à¦¿à¦¨à§à¦¤à§ à¦¬à¦¿à¦ªà¦¦à§‡ à¦ªà¦¾à¦¶à§‡ à¦¥à¦¾à¦•à§‡ à¦à¦®à¦¨ à¦ªà§à¦°à¦¾à¦£à¦–à§‹à¦²à¦¾ à¦¬à¦¨à§à¦§à§à¥¤',
        greeting: 'à¦•à¦¿à¦°à§‡ à¦¦à§‹à¦¸à§à¦¤! à¦à¦¤à¦¦à¦¿à¦¨ à¦ªà¦° à¦•à§à¦¯à¦¾à¦®à§à¦ªà¦¾à¦¸à§‡ à¦šà§‡à¦¹à¦¾à¦°à¦¾ à¦¦à§‡à¦–à¦¾à¦²à¦¿, à¦Ÿà§à¦°à¦¿à¦Ÿ à¦¦à¦¿à¦¬à¦¿ à¦¨à¦¾?',
      },
    ],
    conversations: [
      {
        relation: 'friend',
        prompt: 'à¦¦à§‹à¦¸à§à¦¤ à¦®à¦¨à¦Ÿà¦¾ à¦†à¦œ à¦­à¦¾à¦²à§‹ à¦¨à§‡à¦‡',
        keywords: ['à¦®à¦¨ à¦­à¦¾à¦²à§‹ à¦¨à§‡à¦‡', 'à¦•à¦·à§à¦Ÿ', 'à¦¦à§‹à¦¸à§à¦¤'],
        response: 'à¦†à¦°à§‡ à¦®à¦¾à¦®à¦¾, à¦•à§€ à¦¹à§Ÿà§‡à¦›à§‡ à¦–à§à¦²à§‡ à¦¬à¦² à¦¤à§‹! à¦¬à¦¨à§à¦§à§à¦° à¦•à¦¾à¦›à§‡ à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª à¦²à§à¦•à¦¾à¦¨à§‹à¦° à¦•à§€ à¦†à¦›à§‡?',
        emotion: 'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨',
        action: 'à¦•à¦¾à¦à¦§à§‡ à¦¹à¦¾à¦¤ à¦°à§‡à¦–à§‡ à¦®à¦¨à§‹à¦¯à§‹à¦— à¦¦à¦¿à§Ÿà§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
      },
    ],
  },
  null,
  2
);

const LEXICON_JSON_TEMPLATE = JSON.stringify(
  [
    {
      root: 'à¦†à¦¹à§à¦²à¦¾à¦¦',
      emotion: 'à¦–à§à¦¶à¦¿',
      forms: ['à¦†à¦¹à§à¦²à¦¾à¦¦', 'à¦†à¦¹à§à¦²à¦¾à¦¦à§€', 'ahlad', 'joyful pamper'],
      meaningBn: 'à¦…à¦¤à¦¿à¦°à¦¿à¦•à§à¦¤ à¦†à¦¦à¦°à§‡à¦° à¦•à¦¾à¦°à¦£à§‡ à¦¸à§ƒà¦·à§à¦Ÿ à¦†à¦¨à¦¨à§à¦¦ à¦¬à¦¾ à¦®à¦¿à¦·à§à¦Ÿà¦¿ à¦†à¦¬à¦¦à¦¾à¦°',
      category: 'à¦…à¦¨à§à¦­à§‚à¦¤à¦¿',
      intensity: 4,
    },
    {
      root: 'à¦…à¦¨à§à¦¤à¦¾à¦ª',
      emotion: 'à¦…à¦¨à§à¦¨à§Ÿ',
      forms: ['à¦…à¦¨à§à¦¤à¦¾à¦ª', 'à¦…à¦¨à§à¦¶à§‹à¦šà¦¨à¦¾', 'onutap', 'regret', 'remorse'],
      meaningBn: 'à¦¨à¦¿à¦œà§‡à¦° à¦­à§à¦² à¦¬à§à¦à¦¤à§‡ à¦ªà§‡à¦°à§‡ à¦®à¦¨ à¦¥à§‡à¦•à§‡ à¦¦à§à¦ƒà¦–à¦¬à§‹à¦§ à¦“ à¦•à§à¦·à¦®à¦¾ à¦šà¦¾à¦“à§Ÿà¦¾à¦° à¦­à¦¾à¦¬',
      category: 'à¦…à¦¨à§à¦­à§‚à¦¤à¦¿',
      intensity: 4,
    },
  ],
  null,
  2
);

const EMOTIONS_JSON_TEMPLATE = JSON.stringify(
  [
    {
      signal: 'à¦¬à¦¿à¦¸à§à¦®à§Ÿ',
      mood: 'à¦¬à¦¿à¦¸à§à¦®à¦¿à¦¤',
      keywords: ['à¦…à¦¬à¦¾à¦•', 'à¦¬à¦¿à¦¸à§à¦®à§Ÿ', 'obak', 'surprise', 'wow'],
      voiceTone: 'bright',
      descriptionBn: 'à¦…à¦ªà§à¦°à¦¤à§à¦¯à¦¾à¦¶à¦¿à¦¤ à¦•à§‹à¦¨à§‹ à¦–à¦¬à¦° à¦¬à¦¾ à¦˜à¦Ÿà¦¨à¦¾ à¦¶à§à¦¨à§‡ à¦…à¦¬à¦¾à¦• à¦¹à¦“à§Ÿà¦¾à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿',
      replyTemplate: 'à¦¸à¦¤à§à¦¯à¦¿ à¦¨à¦¾à¦•à¦¿ {userName}! "{word}" à¦¶à§à¦¨à§‡ à¦†à¦®à¦¿ à¦¤à§‹ à¦¦à¦¾à¦°à§à¦£ à¦…à¦¬à¦¾à¦• à¦¹à¦²à¦¾à¦®!',
      actionText: 'à¦šà§‹à¦– à¦¬à§œ à¦¬à§œ à¦•à¦°à§‡ à¦…à¦¬à¦¾à¦• à¦¹à§Ÿà§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
    },
    {
      signal: 'à¦—à¦°à§à¦¬',
      mood: 'à¦—à¦°à§à¦¬à¦¿à¦¤',
      keywords: ['à¦—à¦°à§à¦¬', 'à¦¸à¦¾à¦«à¦²à§à¦¯', 'gorbo', 'proud', 'achievement'],
      voiceTone: 'bright',
      descriptionBn: 'à¦¨à¦¿à¦œà§‡à¦° à¦¬à¦¾ à¦•à¦¾à¦›à§‡à¦° à¦®à¦¾à¦¨à§à¦·à§‡à¦° à¦…à¦°à§à¦œà¦¨à§‡ à¦†à¦¨à¦¨à§à¦¦ à¦“ à¦—à¦°à§à¦¬à¦¬à§‹à¦§',
      replyTemplate: 'à¦¦à¦¾à¦°à§à¦£ à¦•à¦°à§‡à¦›à§‹ {userName}! à¦¤à§‹à¦®à¦¾à¦° à¦à¦‡ "{word}" à¦¦à§‡à¦–à§‡ à¦†à¦®à¦¾à¦° à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦–à§à¦¬ à¦—à¦°à§à¦¬ à¦¹à¦šà§à¦›à§‡!',
      actionText: 'à¦—à¦°à§à¦¬à¦­à¦°à¦¾ à¦¹à¦¾à¦¸à¦¿ à¦¨à¦¿à§Ÿà§‡ à¦ªà¦¿à¦  à¦šà¦¾à¦ªà§œà§‡ à¦¦à¦¿à¦²',
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
  const [wordEmotion, setWordEmotion] = useState<EmotionSignal>('à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾');
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
      id: `custom-emo-${Date.now()}`,
      signal: cleanSignal,
      mood: cleanMood,
      descriptionBn:
        newEmoDesc.trim() || `${cleanSignal} (${cleanMood}) â€” à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦°à§‹à¦²à¦ªà§à¦²à§‡ à¦…à¦¨à§à¦­à§‚à¦¤à¦¿`,
      keywords: Array.from(new Set([cleanSignal, ...parsedKeywords])),
      replyTemplate:
        newEmoTemplate.trim() ||
        `à¦¤à§‹à¦®à¦¾à¦° à¦•à¦¥à¦¾à¦° à¦­à§‡à¦¤à¦° "{word}" à¦†à¦° ${cleanSignal}-à¦à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿à¦Ÿà¦¾ à¦¸à§à¦ªà¦·à§à¦Ÿ à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿ {userName}!`,
      actionText: newEmoAction.trim() || `${cleanMood} à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹`,
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
      importedEmotions.length === 0
    ) {
      setErrorMsg(
        skippedUnsafeCount > 0
          ? 'No valid non-explicit entries found in JSON. Only safe dramatic scenarios, characters, dialogues, emotions, and lexicon can be trained.'
          : 'JSON had no valid scenarios, characters, conversations, customEmotions, naturalPairs, or lexicon items.'
      );
      return;
    }
    onAddTrainedBatch(conversations, extractedWords, scenarios, characters, importedEmotions);
    if (clearSource === 'main') setJsonInput('');
    if (clearSource === 'story') setStoryJsonInput('');

    const skipNote =
      skippedUnsafeCount > 0 ? ` (${skippedUnsafeCount} unsafe entries skipped)` : '';
    const emoNote =
      importedEmotions.length > 0 ? ` Â· ${importedEmotions.length} custom emotions` : '';
    setStatusMessage(
      `Auto-trained locally: ${scenarios.length} scenarios Â· ${characters.length} characters Â· ${conversations.length} emotion dialogues Â· ${extractedWords.length} lexicon words${emoNote}${skipNote}!`
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
      id: `user-word-${Date.now()}`,
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
          100% In-Browser Machine Learning Â· Zero External APIs Â· Expert JSON Dataset Auto-Trainer
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
              Train multi-phase scenarios, emotional arcs (anger, strict pressure, persuasion, agreement), characters, dialogues, and Bengali/Banglish word emotions via structured JSON â€” backed by an in-browser TF-IDF &amp; Naive Bayes self-learning engine.
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
                placeholder="Search emotions by name, mood, or trigger word (e.g. à¦°à¦¾à¦—, à¦…à¦­à¦¿à¦®à¦¾à¦¨, à¦¬à¦¿à¦¸à§à¦®à§Ÿ)..."
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
                          Mood: {emo.mood} Â· {emo.isCustom ? 'Custom' : 'Built-in'}
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
                      Voice: {emo.voiceTone} Â· {wordCount} lexicon words
                    </p>
                  </article>
                );
              })}

              {filteredEmotions.length === 0 && (
                <p className="col-span-full py-6 text-center text-xs text-slate-500">
                  No emotions match your search â€” add it on the right!
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
                  placeholder='[{"signal": "à¦¬à¦¿à¦¸à§à¦®à§Ÿ", "mood": "à¦¬à¦¿à¦¸à§à¦®à¦¿à¦¤", "keywords": ["à¦…à¦¬à¦¾à¦•", "obak"], "voiceTone": "bright", "replyTemplate": "à¦¸à¦¤à§à¦¯à¦¿ à¦¨à¦¾à¦•à¦¿ {userName}!"}]'
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
                      placeholder="e.g. à¦¬à¦¿à¦¸à§à¦®à§Ÿ or à¦—à¦°à§à¦¬"
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
                      placeholder="e.g. à¦¬à¦¿à¦¸à§à¦®à¦¿à¦¤ or à¦—à¦°à§à¦¬à¦¿à¦¤"
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
                      placeholder="e.g. à¦…à¦¬à¦¾à¦•, à¦¬à¦¿à¦¸à§à¦®à§Ÿ, obak, wow"
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
                    placeholder="e.g. à¦…à¦ªà§à¦°à¦¤à§à¦¯à¦¾à¦¶à¦¿à¦¤ à¦•à¦¿à¦›à§ à¦¦à§‡à¦–à§‡ à¦¬à¦¾ à¦¶à§à¦¨à§‡ à¦…à¦¬à¦¾à¦• à¦¹à¦“à§Ÿà¦¾à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿"
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
                    placeholder='e.g. à¦¸à¦¤à§à¦¯à¦¿ à¦¨à¦¾à¦•à¦¿ {userName}! "{word}" à¦¶à§à¦¨à§‡ à¦†à¦®à¦¿ à¦¤à§‹ à¦¦à¦¾à¦°à§à¦£ à¦…à¦¬à¦¾à¦• à¦¹à¦²à¦¾à¦®!'
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
                    placeholder="e.g. à¦šà§‹à¦– à¦¬à§œ à¦¬à§œ à¦•à¦°à§‡ à¦…à¦¬à¦¾à¦• à¦¹à§Ÿà§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹"
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
              <code className="font-mono text-slate-700">emotion</code> (e.g. à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤, à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤, à¦¨à¦°à¦® à¦¹à¦“à§Ÿà¦¾, à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿),{' '}
              <code className="font-mono text-slate-700">characters</code>, and{' '}
              <code className="font-mono text-slate-700">conversations</code>.
            </p>
            <textarea
              aria-label="Paste Auto-Train JSON Dataset"
              rows={5}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"scenarios": [{"title": "...", "phases": [{"phase": "opening", "emotion": "à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤", "variants": [...]}]}], "characters": [...], "conversations": [...]}'
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
                          Relation: {sc.relation} Â· Phases: {sc.phases.length}
                          {sc.phases.some((p) => p.emotion)
                            ? ` Â· Arc: ${sc.phases
                                .map((p) => p.emotion)
                                .filter(Boolean)
                                .join(' â†’ ')}`
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
                placeholder='{"scenarios": [...], "characters": [{"name": "...", "relation": "mother"}], "conversations": [{"prompt": "...", "response": "...", "emotion": "à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤"}]}'
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
                          <span className="font-normal text-slate-500">Â· {ch.role}</span>
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
                          <span className="font-medium text-blue-700">Â· Emotion: {item.emotion}</span>
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
                  placeholder='[{"root": "à¦†à¦¹à§à¦²à¦¾à¦¦", "emotion": "à¦–à§à¦¶à¦¿", "forms": ["à¦†à¦¹à§à¦²à¦¾à¦¦", "ahlad", "joy"], "meaningBn": "à¦†à¦¦à¦°à§‡à¦° à¦®à¦¿à¦·à§à¦Ÿà¦¿ à¦†à¦¬à¦¦à¦¾à¦°"}]'
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
                      placeholder="e.g. à¦…à¦­à¦¿à¦®à¦¾à¦¨ or à¦†à¦¹à§à¦²à¦¾à¦¦"
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
                    placeholder="e.g. à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€, obhiman, sulking"
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
                    placeholder="e.g. à¦•à¦¾à¦›à§‡à¦° à¦®à¦¾à¦¨à§à¦·à§‡à¦° à¦ªà§à¦°à¦¤à¦¿ à¦œà¦®à§‡ à¦¥à¦¾à¦•à¦¾ à¦†à¦¦à§à¦°à§‡ à¦°à¦¾à¦— à¦¬à¦¾ à¦•à¦·à§à¦Ÿ"
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
              Patterns automatically generalized by the TF-IDF &amp; Reinforcement Learner from uploaded scenarios, dialogues, and your ðŸ‘ feedback in chat.
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
                        Cues: {pat.triggerTokens.join(', ')} Â· Emotion: {pat.emotion}
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
                Train a JSON dataset or rate replies with ðŸ‘ in Roleplay Studio, then click{' '}
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
                  Ask &ldquo;[word] mane ki?&rdquo; or &ldquo;[à¦¶à¦¬à§à¦¦] à¦®à¦¾à¦¨à§‡ à¦•à§€?&rdquo; in chat to test word meaning recall.
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
                        Category: {entry.category} Â· Emotion: {entry.emotion}
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
                  No matching words found â€” train it using the JSON system on the left!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

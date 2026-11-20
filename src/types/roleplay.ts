export type VoiceGender = 'female' | 'male';

export type VoiceEngineMode = 'auto' | 'speech' | 'synth';

export type PersonaRelation =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'friend'
  | 'romantic'
  | 'spouse'
  | 'mentor'
  | 'story';

export type BuiltinCharacterMood =
  | 'উৎফুল্ল'
  | 'চিন্তাশীল'
  | 'আবেগপ্রবণ'
  | 'কৌতূহলী'
  | 'রহস্যময়'
  | 'শান্ত'
  | 'স্নেহশীল'
  | 'ভালোবাসাময়'
  | 'অভিমানী'
  | 'ব্যথিত'
  | 'উদ্বিগ্ন'
  | 'রসিক'
  | 'রাগান্বিত'
  | 'শাসনমিশ্রিত স্নেহ'
  | 'ক্লান্ত'
  | 'কঠোর শাসন'
  | 'চাপ ও শর্ত'
  | 'নরম হওয়া'
  | 'সম্মত ও খুশি';

export type CharacterMood = BuiltinCharacterMood | (string & {});

export type BuiltinEmotionSignal =
  | 'খুশি'
  | 'ভালোবাসা'
  | 'স্নেহ'
  | 'অভিমান'
  | 'দুঃখ'
  | 'রাগ'
  | 'উদ্বেগ'
  | 'ক্লান্তি'
  | 'রসিকতা'
  | 'কৃতজ্ঞতা'
  | 'কৌতূহল'
  | 'ভয় দেখানো'
  | 'অনুনয়'
  | 'সম্মতি'
  | 'শান্ত';

export type EmotionSignal = BuiltinEmotionSignal | (string & {});

export type EmotionVoiceTone = 'bright' | 'gentle' | 'intense' | 'calm';

export interface CustomEmotionDefinition {
  id: string;
  signal: string;
  mood: string;
  descriptionBn: string;
  keywords: string[];
  replyTemplate: string;
  actionText: string;
  voiceTone: EmotionVoiceTone;
}

export interface LexiconEntry {
  id: string;
  root: string;
  forms: string[];
  meaningBn: string;
  category: string;
  emotion: EmotionSignal;
  intensity: number; // 1 to 5
  isUserTrained?: boolean;
}

export interface TrainedConversationItem {
  id: string;
  relation: PersonaRelation | 'any';
  prompt: string;
  keywords?: string[];
  phase?: 'opening' | 'developing' | 'resolution';
  response: string;
  emotion: CharacterMood;
  action?: string;
  followUps?: string[];
  source?: string;
}

export interface TrainedScenarioPhase {
  phase: 'opening' | 'developing' | 'resolution';
  beat: string;
  emotion?: CharacterMood;
  phaseTrigger?: 'refusal' | 'pressure' | 'persuasion' | 'apology' | 'auto';
  keywords?: string[];
  responses: DialogueVariant[];
}

export interface TrainedScenario {
  id: string;
  title: string;
  relation: PersonaRelation;
  characterName?: string;
  characterAge?: number;
  gender?: VoiceGender;
  setting?: string;
  summary: string;
  greeting?: string;
  greetingAction?: string;
  phases: TrainedScenarioPhase[];
}

export interface MLFeedbackSample {
  id: string;
  input: string;
  replyKey: string;
  replyText: string;
  emotion: EmotionSignal;
  mood: CharacterMood;
  reward: 1 | -1;
  timestamp: number;
}

export interface MLSelfLearnedPattern {
  id: string;
  relation: PersonaRelation | 'any';
  triggerTokens: string[];
  prompt: string;
  response: string;
  emotion: CharacterMood;
  signalEmotion: EmotionSignal;
  action: string;
  score: number;
  hitCount: number;
}

export interface MLModelStats {
  vocabularySize: number;
  documentCount: number;
  emotionClasses: number;
  trainedNgrams: number;
  feedbackCount: number;
  selfLearnedCount: number;
  positiveRatio: number;
}

export interface NaturalConversationPair {
  relation: PersonaRelation;
  userPrompt: string;
  characterReply: string;
  action: string;
  mood: CharacterMood;
}

export interface ScenarioArc {
  summary: string;
  openingBeat: string;
  middleBeat: string;
  endingBeat: string;
  currentPhase: 'opening' | 'developing' | 'resolution';
}

export interface RoleplaySetupDraft {
  step: 'awaiting_character' | 'awaiting_scenario';
  userName?: string;
  characterName: string;
  characterAge?: number;
  relation: PersonaRelation;
  gender: VoiceGender;
  personality?: string;
  setting?: string;
}

export interface SentenceAnalysis {
  normalizedText: string;
  tokens: string[];
  stemmedTokens: string[];
  matchedLexicon: LexiconEntry[];
  dominantEmotion: EmotionSignal;
  emotionIntensity: number;
  isQuestion: boolean;
  meaningQueryTarget?: string;
  isSensitiveOrInappropriate?: boolean;
}

export interface DialogueVariant {
  text: string;
  action: string;
  mood: CharacterMood;
  followUps: string[];
}

export interface DialogueTopic {
  topic: string;
  labelBn: string;
  keywords: string[];
  responses: DialogueVariant[];
}

export interface StoryBranch {
  id: string;
  title: string;
  promptText: string;
  sceneAction: string;
  characterReply: string;
  mood: CharacterMood;
  nextChoices: string[];
}

export interface CustomRule {
  id: string;
  keywords: string[];
  response: string;
  action?: string;
  followUps?: string[];
}

export interface VoiceDefaults {
  pitch: number;
  rate: number;
  timbreHz: number;
}

export interface RoleplayCharacter {
  id: string;
  name: string;
  englishName: string;
  role: string;
  setting: string;
  eraOrVibe: string;
  gender: VoiceGender;
  age?: number;
  relation?: PersonaRelation;
  scenarioArc?: ScenarioArc;
  scenarioPhases?: TrainedScenarioPhase[];
  avatarUrl: string;
  accentHex: string;
  personalitySummary: string;
  greeting: string;
  greetingAction: string;
  initialFollowUps: string[];
  voiceDefaults: VoiceDefaults;
  storyBranches: StoryBranch[];
  topics: DialogueTopic[];
  fallbacks: DialogueVariant[];
  customRules?: CustomRule[];
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'character';
  text: string;
  replyKey?: string;
  action?: string;
  mood?: CharacterMood;
  timestamp: number;
  voiceGender: VoiceGender;
  characterId: string;
  matchedTopic?: string;
  detectedUserEmotion?: EmotionSignal;
  understoodWords?: string[];
}

export interface SessionMemory {
  userName?: string;
  detectedRelation?: PersonaRelation;
  affinity: number;
  turnCount: number;
  lastTopic?: string;
  recentResponseKeys: string[];
  currentMood: CharacterMood;
  lastUserEmotion?: EmotionSignal;
  lastUnderstoodWords?: string[];
  scenarioArc?: ScenarioArc;
}

export interface VoiceSettings {
  genderOverride: 'character' | VoiceGender;
  rate: number;
  pitch: number;
  autoSpeak: boolean;
  engineMode: VoiceEngineMode;
  selectedSpeechVoiceURI?: string;
  speechLang?: 'bn-BD' | 'bn-IN' | 'en-US';
}

export type ActiveTab = 'studio' | 'characters' | 'theatre' | 'voice' | 'builder' | 'trainer';

import { BENGALI_LEXICON } from '../data/bengaliLexicon';
import { BUILTIN_EMOTIONS } from '../data/builtinEmotions';
import {
  CharacterMood,
  ConversationalIntent,
  CustomEmotionDefinition,
  DialogueVariant,
  EmotionSignal,
  EmotionVoiceTone,
  LexiconEntry,
  MLSelfLearnedPattern,
  PersonaRelation,
  RoleplayCharacter,
  RoleplaySetupDraft,
  ScenarioArc,
  SentenceAnalysis,
  TrainedConversationItem,
  TrainedScenario,
  TrainedScenarioPhase,
  VoiceGender,
} from '../types/roleplay';
import { normalizeBanglishAndBengali } from './banglishTranslator';

const SUFFIXES = [
  'গুলোকে',
  'গুলোতে',
  'গুলোর',
  'গুলো',
  'দেরকে',
  'দের',
  'য়েছে',
  'য়েছে',
  'য়েছি',
  'য়েছি',
  'য়েছো',
  'য়েছো',
  'ছিলাম',
  'ছিলেন',
  'ছিলে',
  'ছিলি',
  'টায়',
  'টিতে',
  'টার',
  'টির',
  'টা',
  'টি',
  'তে',
  'য়ে',
  'য়ে',
  'কে',
  'ের',
  'রা',
  'ছিস',
  'ছেন',
  'ছো',
  'ছি',
  'ছে',
  'লাম',
  'বেন',
  'বো',
  'বে',
  'বি',
  'লে',
  'য়',
  'য়',
  'ে',
];

const SUBJECT_STOP_WORDS = new Set([
  'আমি',
  'আমাকে',
  'আমার',
  'আমাদের',
  'তুমি',
  'তোমাকে',
  'তোমায়',
  'তোমার',
  'তোমাদের',
  'তুই',
  'তোকে',
  'তোর',
  'আপনি',
  'আপনাকে',
  'আপনার',
  'সে',
  'তার',
  'তাকে',
  'ওরা',
  'তারা',
  'এই',
  'ওই',
  'এটা',
  'ওটা',
  'একটা',
  'একটু',
  'একটুখানি',
  'একদম',
  'খুব',
  'অনেক',
  'বেশি',
  'কম',
  'সব',
  'সবার',
  'কিছু',
  'কিছুই',
  'কোনো',
  'আরো',
  'আর',
  'এবং',
  'অথবা',
  'কিন্তু',
  'তাহলে',
  'তবে',
  'যদি',
  'কারণ',
  'তাই',
  'আসলে',
  'যদিও',
  'হয়',
  'হয়ে',
  'হয়েছে',
  'হলো',
  'হবে',
  'হচ্ছে',
  'আছে',
  'আছি',
  'আছো',
  'আছিস',
  'আছেন',
  'ছিলাম',
  'ছিল',
  'করো',
  'করি',
  'করছি',
  'করছো',
  'করছিস',
  'করবো',
  'করলাম',
  'করলে',
  'করেছি',
  'করেছো',
  'করছে',
  'বলো',
  'বলি',
  'বলছি',
  'বলছো',
  'বলবো',
  'বললাম',
  'বললে',
  'বলেছি',
  'বলছে',
  'শোনো',
  'শুনছো',
  'শুনবো',
  'শুনলাম',
  'দেখো',
  'দেখি',
  'দেখছি',
  'দেখছো',
  'দেখবো',
  'দাও',
  'নাও',
  'থাকো',
  'থাকবো',
  'থাকি',
  'যাও',
  'যাবো',
  'যাচ্ছি',
  'যাচ্ছো',
  'আসো',
  'আসবো',
  'আসছি',
  'মনে',
  'লাগছে',
  'লাগলো',
  'লাগে',
  'লাগবে',
  'কী',
  'কি',
  'কে',
  'কার',
  'কোন',
  'কেন',
  'কবে',
  'কখন',
  'কোথায়',
  'কই',
  'কীভাবে',
  'কেমন',
  'কত',
  'নাকি',
  'না',
  'নেই',
  'নাই',
  'নি',
  'নয়',
  'হ্যাঁ',
  'হুম',
  'আচ্ছা',
  'ঠিক',
  'জ্বি',
  'এখন',
  'এখনো',
  'আজ',
  'আজকে',
  'কাল',
  'কালকে',
  'পরশু',
  'তাই',
  'নাকি',
  'তারপর',
  'এরপর',
  'আম্মু',
  'আম্মা',
  'মা',
  'আব্বু',
  'আব্বা',
  'বাবা',
  'দোস্ত',
  'বন্ধু',
  'মামা',
  'ব্রো',
  'ভাই',
  'ভাইয়া',
  'আপু',
  'বউ',
  'জামাই',
  'জান',
  'সোনা',
  'ওগো',
]);

// Safety filters removed — all content is allowed.
export function detectSensitiveOrInappropriateInput(_raw: string): boolean {
  return false;
}

export function normalizeBengaliText(raw: string): string {
  return normalizeBanglishAndBengali(raw);
}

export function stemBengaliWord(word: string): string {
  const clean = word.trim();
  if (clean.length <= 3) return clean;

  for (const suffix of SUFFIXES) {
    if (clean.endsWith(suffix) && clean.length - suffix.length >= 2) {
      return clean.slice(0, clean.length - suffix.length);
    }
  }
  return clean;
}

export function mapEmotionToMood(
  emotion: EmotionSignal,
  relation: PersonaRelation,
  customEmotions: CustomEmotionDefinition[] = []
): CharacterMood {
  const customMatch = customEmotions.find(
    (ce) => ce.signal.toLowerCase() === String(emotion).toLowerCase()
  );
  if (customMatch) {
    return customMatch.mood;
  }

  switch (emotion) {
    case 'ভালোবাসা':
      return relation === 'mother' || relation === 'father' ? 'স্নেহশীল' : 'ভালোবাসাময়';
    case 'স্নেহ':
      return 'স্নেহশীল';
    case 'অভিমান':
      return relation === 'romantic' || relation === 'spouse' ? 'অভিমানী' : 'স্নেহশীল';
    case 'রাগ':
      return relation === 'romantic' || relation === 'spouse' ? 'অভিমানী' : 'রাগান্বিত';
    case 'ভয় দেখানো':
      return 'চাপ ও শর্ত';
    case 'অনুনয়':
      return 'নরম হওয়া';
    case 'সম্মতি':
      return 'সম্মত ও খুশি';
    case 'দুঃখ':
      return relation === 'mother' || relation === 'father' ? 'ব্যথিত' : 'আবেগপ্রবণ';
    case 'উদ্বেগ':
      return 'উদ্বিগ্ন';
    case 'ক্লান্তি':
      return relation === 'spouse' ? 'ক্লান্ত' : 'স্নেহশীল';
    case 'রসিকতা':
      return 'রসিক';
    case 'খুশি':
    case 'কৃতজ্ঞতা':
      return 'উৎফুল্ল';
    case 'কৌতূহল':
      return 'কৌতূহলী';
    default:
      return relation === 'mother' || relation === 'father' ? 'স্নেহশীল' : 'শান্ত';
  }
}

const NEGATION_TOKENS = new Set(['না', 'নেই', 'নাই', 'নয়', 'নি', 'পারবো না', 'খাইনি', 'ঘুমাইনি']);

function extractNegationInfo(tokens: string[], normalizedText: string): {
  isNegated: boolean;
  negatedTerms: string[];
} {
  const negatedTerms = new Set<string>();
  let isNegated = false;

  tokens.forEach((tok, idx) => {
    const isNegTok =
      NEGATION_TOKENS.has(tok) ||
      /(?:ইনি|য়নি|োনি)$/.test(tok) ||
      (tok.length >= 4 && /(?:নি)$/.test(tok) && !/^(তুমি|আপনি|তিনি|শনি|খুনি|গিন্নি|নন্দিনী)$/.test(tok));

    if (isNegTok) {
      isNegated = true;
      if (idx > 0) negatedTerms.add(tokens[idx - 1]);
      if (idx > 1) negatedTerms.add(tokens[idx - 2]);
      if (/(?:খাইনি)$/.test(tok)) {
        negatedTerms.add('খেয়েছো');
        negatedTerms.add('খাবার');
      }
      if (/(?:ঘুমাইনি)$/.test(tok)) {
        negatedTerms.add('ঘুম');
      }
    }
  });

  if (/(?:ভালো নেই|মন খারাপ|পড়বো না|খাবো না|যাবো না|বলবো না|পারবো না|ঘুম আসছে না|ভালো লাগছে না)/.test(normalizedText)) {
    isNegated = true;
  }

  return {
    isNegated,
    negatedTerms: Array.from(negatedTerms),
  };
}

function classifyConversationalIntent(
  rawInput: string,
  normalizedText: string,
  tokens: string[],
  dominantEmotion: EmotionSignal,
  isQuestion: boolean,
  isNegated: boolean
): { intent: ConversationalIntent; isMetaFeedback: boolean } {
  const isMetaFeedback =
    /(?:অপ্রাসঙ্গিক|আবোলতাবোল|তুমি কিছু বুঝছো না|আমাকে বুঝছো না|এটা কী বললে|আমার কথা শোনো|উত্তর দিচ্ছো না|অন্য কথা বলছো|ঠিকমতো বোঝো)/.test(
      normalizedText
    );
  if (isMetaFeedback) {
    return { intent: 'meta_feedback', isMetaFeedback: true };
  }

  if (/(?:শুভ রাত্রি|বিদায়|টাটা|ভালো থেকো|ঘুমাতে যাচ্ছি|আসি এখন)/.test(normalizedText)) {
    return { intent: 'farewell', isMetaFeedback: false };
  }

  if (/^(?:হ্যালো|হাই|আসসালামু আলাইকুম|সালাম|নমস্কার|শুভ সকাল|শুভ সন্ধ্যা|কেমন আছো|কেমন আছেন|কী অবস্থা|কী খবর)$/.test(normalizedText)) {
    return { intent: 'greeting', isMetaFeedback: false };
  }

  if (tokens.length <= 3 && /^(?:হ্যাঁ|হুম|আচ্ছা|ঠিক আছে|জ্বি|অবশ্যই|ওকে)/.test(normalizedText) && !isQuestion) {
    return { intent: 'confirmation_yes', isMetaFeedback: false };
  }

  if (tokens.length <= 3 && /^(?:না|একদমই না|কিছু না|নেই|নাহ)/.test(normalizedText) && !isQuestion) {
    return { intent: 'denial_no', isMetaFeedback: false };
  }

  if (
    tokens.length <= 4 &&
    /(?:তারপর|তারপর কী হলো|এরপর|আর কী|আর বলো|তাই নাকি|সত্যি নাকি|বলো তো)$/.test(normalizedText)
  ) {
    return { intent: 'continuation', isMetaFeedback: false };
  }

  if (/(?:সরি|ক্ষমা|মাফ|ভুল হয়েছে)/.test(normalizedText)) {
    return { intent: 'apology', isMetaFeedback: false };
  }

  if (/(?:ভালোবাসি|ভালোবাসা|মিস করছি|আদর|জান|সোনা)/.test(normalizedText) && !isNegated) {
    return { intent: 'affection', isMetaFeedback: false };
  }

  if (/(?:^|\s)কেন(?:\s|$)/.test(normalizedText)) {
    return { intent: 'question_why', isMetaFeedback: false };
  }
  if (/(?:^|\s)(?:কোথায়|কই)(?:\s|$)/.test(normalizedText)) {
    return { intent: 'question_where', isMetaFeedback: false };
  }
  if (/(?:^|\s)(?:কখন|কবে)(?:\s|$)/.test(normalizedText)) {
    return { intent: 'question_when', isMetaFeedback: false };
  }
  if (/(?:^|\s)(?:কীভাবে|কেমনে)(?:\s|$)/.test(normalizedText)) {
    return { intent: 'question_how', isMetaFeedback: false };
  }
  if (/(?:^|\s)(?:কী|কেমন|কে|কোন|কত)(?:\s|$)/.test(normalizedText)) {
    return { intent: 'question_what', isMetaFeedback: false };
  }
  if (isQuestion) {
    return { intent: 'question_yes_no', isMetaFeedback: false };
  }

  if (/(?:সাহায্য|হেল্প|আইডিয়া|উপায়|পরামর্শ|কী করবো বলো)/.test(normalizedText)) {
    return { intent: 'request_help', isMetaFeedback: false };
  }

  if (
    dominantEmotion === 'দুঃখ' ||
    dominantEmotion === 'উদ্বেগ' ||
    dominantEmotion === 'ক্লান্তি' ||
    /(?:মন খারাপ|ভালো নেই|ভালো লাগছে না|কষ্ট|প্যারা|ঝামেলা|বকা|খারাপ হয়েছে|বিরক্ত|ক্ষুধা লেগেছে|মাথাব্যথা)/.test(
      normalizedText
    )
  ) {
    return { intent: 'complaint_vent', isMetaFeedback: false };
  }

  if (dominantEmotion === 'রসিকতা' || /(?:হাহা|মজা|ট্রিট|বোকা|পাগল)/.test(normalizedText)) {
    return { intent: 'teasing', isMetaFeedback: false };
  }

  if (/^(?:হ্যালো|হাই|আসসালামু আলাইকুম|সালাম|নমস্কার|কেমন আছো)/.test(normalizedText) && tokens.length <= 6) {
    return { intent: 'greeting', isMetaFeedback: false };
  }

  return { intent: 'statement', isMetaFeedback: false };
}

export function analyzeSentenceSemantics(
  rawInput: string,
  extraLexicon: LexiconEntry[] = [],
  customEmotions: CustomEmotionDefinition[] = []
): SentenceAnalysis {
  const isSensitiveOrInappropriate = detectSensitiveOrInappropriateInput(rawInput);
  const normalizedText = normalizeBengaliText(rawInput);
  const tokens = normalizedText.split(/\s+/).filter(Boolean);
  const stemmedTokens = tokens.map(stemBengaliWord);

  const { isNegated, negatedTerms } = extractNegationInfo(tokens, normalizedText);

  const syntheticEmotionLexicon: LexiconEntry[] = customEmotions
    .filter((ce) => ce.keywords.length > 0)
    .map((ce) => ({
      id: `custom-emo-lex-${ce.id}`,
      root: ce.signal,
      forms: Array.from(new Set([ce.signal, ...ce.keywords])),
      meaningBn: ce.descriptionBn || ce.mood,
      category: 'Custom Emotion',
      emotion: ce.signal,
      intensity: 5,
      isUserTrained: true,
    }));

  const combinedLexicon = [...syntheticEmotionLexicon, ...extraLexicon, ...BENGALI_LEXICON];
  const matchedMap = new Map<string, LexiconEntry>();
  const emotionScores = new Map<EmotionSignal, number>();

  for (const entry of combinedLexicon) {
    let matched = false;
    let matchedNegated = false;

    for (const form of entry.forms) {
      const normForm = normalizeBengaliText(form);
      if (!normForm) continue;

      if (normForm.includes(' ')) {
        if (normalizedText.includes(normForm)) {
          matched = true;
          break;
        }
      } else {
        const stemForm = stemBengaliWord(normForm);
        if (
          tokens.includes(normForm) ||
          stemmedTokens.includes(normForm) ||
          (stemForm.length >= 2 && stemmedTokens.includes(stemForm)) ||
          (normForm.length >= 4 && tokens.some((t) => t.startsWith(normForm)))
        ) {
          matched = true;
          if (negatedTerms.includes(normForm) || negatedTerms.includes(stemForm)) {
            matchedNegated = true;
          }
          break;
        }
      }
    }

    if (matched && !matchedMap.has(entry.id)) {
      matchedMap.set(entry.id, entry);
      if (!matchedNegated) {
        const prev = emotionScores.get(entry.emotion) || 0;
        emotionScores.set(entry.emotion, prev + entry.intensity);
      }
    }
  }

  // Contextual emotion overrides for negated wellbeing / casual Banglish expressions
  if (/(?:ভালো নেই|মন খারাপ|ভালো লাগছে না|কষ্ট|বিরক্ত|খারাপ হয়েছে|বকা দিয়েছে)/.test(normalizedText)) {
    emotionScores.set('দুঃখ', (emotionScores.get('দুঃখ') || 0) + 5);
  }
  if (/(?:ভালোবাসি|মিস করছি|আদর)/.test(normalizedText) && !isNegated) {
    emotionScores.set('ভালোবাসা', (emotionScores.get('ভালোবাসা') || 0) + 5);
  }

  let dominantEmotion: EmotionSignal = isSensitiveOrInappropriate ? 'রাগ' : 'শান্ত';
  let maxScore = isSensitiveOrInappropriate ? 5 : 0;
  if (!isSensitiveOrInappropriate) {
    for (const [emotion, score] of emotionScores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }
  }

  let meaningQueryTarget: string | undefined;
  const meaningMatch = normalizedText.match(/^(.+?)\s+(?:মানে কী|অর্থ কী|শব্দের অর্থ|শব্দের মানে)/);
  if (meaningMatch && meaningMatch[1]) {
    meaningQueryTarget = meaningMatch[1].trim();
  }

  const isQuestion =
    rawInput.includes('?') ||
    /(?:^|\s)(কী|কেমন|কখন|কোথায়|কোথায়|কেন|কে|কত|কবে|নাকি|কীভাবে|কেমনে)(?:\s|$)/.test(
      normalizedText
    );

  const { intent, isMetaFeedback } = classifyConversationalIntent(
    rawInput,
    normalizedText,
    tokens,
    dominantEmotion,
    isQuestion,
    isNegated
  );

  const subjectKeywords = Array.from(
    new Set(
      tokens.filter(
        (t) =>
          t.length >= 2 &&
          !SUBJECT_STOP_WORDS.has(t) &&
          !SUBJECT_STOP_WORDS.has(stemBengaliWord(t)) &&
          !NEGATION_TOKENS.has(t)
      )
    )
  ).slice(0, 6);

  return {
    normalizedText,
    tokens,
    stemmedTokens,
    matchedLexicon: Array.from(matchedMap.values()),
    dominantEmotion,
    emotionIntensity: maxScore,
    isQuestion,
    meaningQueryTarget,
    isSensitiveOrInappropriate,
    intent,
    isNegated,
    negatedTerms,
    subjectKeywords,
    isMetaFeedback,
  };
}

export function composeEmotionAwareReply(
  analysis: SentenceAnalysis,
  _character: RoleplayCharacter,
  relation: PersonaRelation,
  userName: string,
  customEmotions: CustomEmotionDefinition[] = []
): { replyText: string; action: string; mood: CharacterMood; matchedTopic: string } | null {
  if (analysis.meaningQueryTarget) {
    const target = analysis.meaningQueryTarget;
    const isExactMatch = (entry: LexiconEntry) =>
      normalizeBengaliText(entry.root) === target ||
      entry.forms.some((f) => normalizeBengaliText(f) === target);
    const isPartialMatch = (entry: LexiconEntry) =>
      entry.forms.some((f) => target.includes(normalizeBengaliText(f))) ||
      target.includes(normalizeBengaliText(entry.root));

    const found =
      analysis.matchedLexicon.find(
        (entry) => entry.category !== 'ML Auto-Learned' && isExactMatch(entry)
      ) ||
      analysis.matchedLexicon.find(isExactMatch) ||
      analysis.matchedLexicon.find(
        (entry) => entry.category !== 'ML Auto-Learned' && isPartialMatch(entry)
      ) ||
      analysis.matchedLexicon.find(isPartialMatch);

    if (found) {
      const mood = mapEmotionToMood(found.emotion, relation, customEmotions);
      const intro =
        relation === 'mother'
          ? `শোন ${userName}, "${found.root}" শব্দের মানে হলো—${found.meaningBn}।`
          : relation === 'romantic' || relation === 'spouse'
            ? `"${found.root}" মানে জানো ${userName}? এর অর্থ হলো—${found.meaningBn}।`
            : `দারুণ প্রশ্ন ${userName}! "${found.root}" শব্দের বাংলা অর্থ হলো—${found.meaningBn}।`;
      return {
        replyText: `${intro} এই শব্দটার ভেতর "${found.emotion}"-এর একটা সুন্দর অনুভূতি জড়িয়ে আছে।`,
        action: 'শব্দটির অর্থ বুঝিয়ে দিয়ে আন্তরিকভাবে তাকালো',
        mood,
        matchedTopic: `শব্দার্থ: ${found.root}`,
      };
    }
  }

  if (analysis.emotionIntensity >= 3) {
    const primaryWord =
      analysis.matchedLexicon.find(
        (m) => m.emotion.toLowerCase() === String(analysis.dominantEmotion).toLowerCase()
      ) ||
      analysis.matchedLexicon[0] || {
        id: 'ml-detected',
        root: String(analysis.dominantEmotion),
        forms: [],
        meaningBn: '',
        category: 'Emotion',
        emotion: analysis.dominantEmotion,
        intensity: analysis.emotionIntensity,
      };
    const mood = mapEmotionToMood(analysis.dominantEmotion, relation, customEmotions);

    if (
      analysis.matchedLexicon.length > 0 &&
      (analysis.dominantEmotion === 'অভিমান' || analysis.dominantEmotion === 'রাগ') &&
      !analysis.negatedTerms?.includes(normalizeBengaliText(primaryWord.root))
    ) {
      if (relation === 'mother') {
        return {
          replyText: `ওরে আমার অভিমানী ${userName}! মায়ের ওপর কি কেউ এভাবে রাগ বা অভিমান করে থাকে? তোর "${primaryWord.root}" দেখলে আমার নিজেরই মন খারাপ লাগে রে। আয়, সব ভুলে একটু হাস তো!`,
          action: 'স্নেহভরা হাতে গাল ছুঁয়ে অভিমান ভাঙানোর চেষ্টা করলো',
          mood: 'শাসনমিশ্রিত স্নেহ',
          matchedTopic: `অনুভূতি: ${analysis.dominantEmotion}`,
        };
      }
      if (relation === 'romantic' || relation === 'spouse') {
        return {
          replyText: `বুঝেছি ${userName}, তোমার মনে "${primaryWord.root}" জমে আছে! কিন্তু তুমি এমন মুখ ভার করে থাকলে আমার একটুও ভালো লাগে না। বলো তো, কী করলে তোমার এই রাগ আর অভিমান এক্ষুনি গলে যাবে?`,
          action: 'নরম সুরে হাত ধরে অভিমান ভাঙানোর চেষ্টা করলো',
          mood: 'অভিমানী',
          matchedTopic: `অনুভূতি: ${analysis.dominantEmotion}`,
        };
      }
      if (relation === 'friend') {
        return {
          replyText: `আরে ${userName} মামা, এত "${primaryWord.root}" পুষে রাখিস কেন? বন্ধুর সাথে আবার রাগ কিসের! চল, সব প্যারা ঝেড়ে ফেলে এক কাপ চা খেয়ে মাথা ঠান্ডা করি।`,
          action: 'হাসিমুখে পিঠে হালকা চাপড় দিয়ে মন হালকা করলো',
          mood: 'রসিক',
          matchedTopic: `অনুভূতি: ${analysis.dominantEmotion}`,
        };
      }
    }

    if (
      (analysis.matchedLexicon.length > 0 || analysis.dominantEmotion === 'দুঃখ') &&
      (analysis.dominantEmotion === 'দুঃখ' || analysis.dominantEmotion === 'উদ্বেগ')
    ) {
      const subjectHint =
        analysis.subjectKeywords && analysis.subjectKeywords.length > 0
          ? ` (${analysis.subjectKeywords.slice(0, 2).join(', ')})`
          : '';
      return {
        replyText:
          relation === 'mother'
            ? `একদম ভেঙে পড়বি না ${userName}। তোর এই${subjectHint} মন খারাপের কথা শুনে আমার বুকটা ভারী হয়ে গেল। মায়ের কাছে সব খুলে বল—কোনো কষ্টই তোকে একা বয়ে বেড়াতে হবে না।`
            : relation === 'romantic' || relation === 'spouse'
              ? `তোমার এই${subjectHint} মন খারাপটা আমাকেও স্পর্শ করছে ${userName}। একা চুপ করে থেকো না—আমি সবসময় তোমার হাত ধরে পাশে আছি, বলো তো ঠিক কী হয়েছে?`
              : `তোমার এই${subjectHint} পরিস্থিতি আর মনের ভারটা আমি বুঝতে পারছি ${userName}। কঠিন সময় কখনো চিরস্থায়ী হয় না; ঠিক কী নিয়ে মন খারাপ বলো তো?`,
        action: 'সহানুভূতি ও গভীর মমতায় পাশে এসে বসলো',
        mood: 'ব্যথিত',
        matchedTopic: `অনুভূতি: ${analysis.dominantEmotion}`,
      };
    }

    if (analysis.matchedLexicon.length > 0 && (analysis.dominantEmotion === 'ভালোবাসা' || analysis.dominantEmotion === 'স্নেহ')) {
      return {
        replyText:
          relation === 'mother'
            ? `তোর মুখে "${primaryWord.root}" আর এত আদরের কথা শুনে আমার মনটা জুড়িয়ে গেল রে ${userName}! আল্লাহ তোকে সবসময় ভালো রাখুন—এটাই আম্মুর সবচেয়ে বড় চাওয়া।`
            : relation === 'romantic' || relation === 'spouse'
              ? `তোমার এই "${primaryWord.root}" আর মায়াটুকুই তো আমার বেঁচে থাকার সবচেয়ে বড় শক্তি ${userName}। প্রতিটি দিন যেন এভাবেই ভালোবাসায় ভরে থাকে!`
              : `তোমার কথার ভেতর যে "${primaryWord.root}" আর আন্তরিকতা আছে ${userName}, সেটা সত্যিই হৃদয় ছুঁয়ে যায়।`,
        action: 'উষ্ণ ও আবেগঘন দৃষ্টিতে তাকিয়ে মৃদু হাসলো',
        mood,
        matchedTopic: `অনুভূতি: ${analysis.dominantEmotion}`,
      };
    }

    if (analysis.matchedLexicon.length > 0 && (analysis.dominantEmotion === 'খুশি' || analysis.dominantEmotion === 'রসিকতা') && !analysis.isNegated) {
      return {
        replyText:
          relation === 'friend'
            ? `একদম ফাটাফাটি কথা বলেছিস ${userName}! তোর এই "${primaryWord.root}"-এর মেজাজটা দেখেই আমার মন ভালো হয়ে গেল!`
            : `তোমার এই "${primaryWord.root}" আর প্রাণবন্ত কথা শুনে সত্যিই দারুণ লাগলো ${userName}! মনটা একদম ফুরফুরে হয়ে গেল।`,
        action: 'প্রাণখোলা হাসিতে উচ্ছ্বাস প্রকাশ করলো',
        mood: 'উৎফুল্ল',
        matchedTopic: `অনুভূতি: ${analysis.dominantEmotion}`,
      };
    }

    const customEmo = customEmotions.find(
      (ce) => ce.signal.toLowerCase() === String(analysis.dominantEmotion).toLowerCase()
    );
    if (customEmo) {
      const formattedReply = (
        customEmo.replyTemplate ||
        `তোমার কথার ভেতর "${primaryWord.root}" এবং ${customEmo.signal}-এর অনুভূতি স্পষ্ট বুঝতে পারছি ${userName}!`
      )
        .replace(/\{userName\}/g, userName)
        .replace(/\{word\}/g, primaryWord.root);

      return {
        replyText: formattedReply,
        action: customEmo.actionText || `${customEmo.mood} ভঙ্গিতে তাকালো`,
        mood: customEmo.mood,
        matchedTopic: `কাস্টম অনুভূতি: ${customEmo.signal}`,
      };
    }
  }

  return null;
}

export function parseBulkTrainingText(
  rawText: string,
  defaultRelation: PersonaRelation | 'any'
): {
  conversations: TrainedConversationItem[];
  extractedWords: LexiconEntry[];
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const conversations: TrainedConversationItem[] = [];
  const extractedWords: LexiconEntry[] = [];

  const dialogueLines: Array<{ speaker: string; text: string }> = [];
  for (const line of lines) {
    const colonMatch = line.match(/^([^:ঃ]{1,25})[:ঃ]\s*(.+)$/);
    if (colonMatch) {
      dialogueLines.push({
        speaker: colonMatch[1].trim(),
        text: colonMatch[2].trim(),
      });
    }
  }

  if (dialogueLines.length >= 2) {
    for (let i = 0; i < dialogueLines.length - 1; i += 2) {
      const promptLine = dialogueLines[i];
      const replyLine = dialogueLines[i + 1];
      const analysis = analyzeSentenceSemantics(replyLine.text);
      const mood = mapEmotionToMood(
        analysis.dominantEmotion,
        defaultRelation === 'any' ? 'story' : defaultRelation
      );
      conversations.push({
        id: `trained-${Date.now()}-${i}`,
        relation: defaultRelation,
        prompt: promptLine.text,
        response: replyLine.text,
        emotion: mood,
        action: 'আন্তরিক ও স্বাভাবিক ভঙ্গিতে উত্তর দিল',
        source: 'প্রশিক্ষিত সংলাপ',
      });
    }
  } else {
    const sentences = rawText
      .split(/[।!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 12);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const words = sentence.split(/\s+/).filter((w) => w.length >= 3);
      const triggerPhrase = words.slice(0, Math.min(4, words.length)).join(' ');
      if (triggerPhrase) {
        const analysis = analyzeSentenceSemantics(sentence);
        conversations.push({
          id: `trained-sent-${Date.now()}-${i}`,
          relation: defaultRelation,
          prompt: triggerPhrase,
          response: `${sentence}।`,
          emotion: mapEmotionToMood(
            analysis.dominantEmotion,
            defaultRelation === 'any' ? 'story' : defaultRelation
          ),
          action: 'প্রসঙ্গ বুঝে স্বাভাবিক স্বরে বললো',
          source: 'প্রশিক্ষিত পাঠ্য',
        });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const defMatch = lines[i].match(/^([^\s=-]{2,20})\s*(?:=|-|মানে|অর্থ)\s*(.{5,100})$/);
    if (defMatch) {
      const rootWord = defMatch[1].trim();
      const meaning = defMatch[2].trim();
      extractedWords.push({
        id: `user-lex-${Date.now()}-${i}`,
        root: rootWord,
        forms: [rootWord],
        meaningBn: meaning,
        category: 'প্রশিক্ষিত শব্দ',
        emotion: 'শান্ত',
        intensity: 3,
        isUserTrained: true,
      });
    }
  }

  return { conversations, extractedWords };
}

function normalizePhaseName(raw?: string): 'opening' | 'developing' | 'resolution' {
  const s = (raw || '').toLowerCase().trim();
  if (/(mid|develop|twist|conflict|pressure|convince|middle|মাঝ|বিকাশ|চাপ)/.test(s)) {
    return 'developing';
  }
  if (/(end|resolv|resolution|climax|agree|finish|শেষ|সমাপ্তি|রাজি)/.test(s)) {
    return 'resolution';
  }
  return 'opening';
}

function normalizeCharacterMood(
  raw?: string,
  fallback: CharacterMood = 'শান্ত',
  customEmotions: CustomEmotionDefinition[] = []
): CharacterMood {
  if (!raw) return fallback;
  const trimmed = raw.trim() as CharacterMood;
  const customMood = customEmotions.find(
    (ce) =>
      ce.mood.toLowerCase() === trimmed.toLowerCase() ||
      ce.signal.toLowerCase() === trimmed.toLowerCase()
  );
  if (customMood) return customMood.mood;

  const validMoods: CharacterMood[] = [
    'উৎফুল্ল',
    'চিন্তাশীল',
    'আবেগপ্রবণ',
    'কৌতূহলী',
    'রহস্যময়',
    'শান্ত',
    'স্নেহশীল',
    'ভালোবাসাময়',
    'অভিমানী',
    'ব্যথিত',
    'উদ্বিগ্ন',
    'রসিক',
    'রাগান্বিত',
    'শাসনমিশ্রিত স্নেহ',
    'ক্লান্ত',
    'কঠোর শাসন',
    'চাপ ও শর্ত',
    'নরম হওয়া',
    'সম্মত ও খুশি',
  ];
  if (validMoods.includes(trimmed)) return trimmed;

  const lower = raw.toLowerCase();
  if (/(angry|rag|রাগ|ক্ষুব্ধ)/.test(lower)) return 'রাগান্বিত';
  if (/(strict|scold|শাসন|কঠোর)/.test(lower)) return 'কঠোর শাসন';
  if (/(pressure|blackmail|threat|warn|চাপ|শর্ত|ভয়)/.test(lower)) return 'চাপ ও শর্ত';
  if (/(soft|melt|convinc|নরম|মন গলা)/.test(lower)) return 'নরম হওয়া';
  if (/(agree|accept|রাজি|সম্মত)/.test(lower)) return 'সম্মত ও খুশি';
  if (/(care|love|affection|স্নেহ|আদর)/.test(lower)) return 'স্নেহশীল';
  if (/(sulky|obhiman|অভিমান)/.test(lower)) return 'অভিমানী';
  if (/(worry|anxious|উদ্বিগ্ন|চিন্তা)/.test(lower)) return 'উদ্বিগ্ন';
  if (/(sad|hurt|দুঃখ|ব্যথিত)/.test(lower)) return 'ব্যথিত';
  if (/(happy|joy|খুশি|উৎফুল্ল)/.test(lower)) return 'উৎফুল্ল';
  return fallback;
}

function normalizeEmotionSignal(
  raw?: string,
  customEmotions: CustomEmotionDefinition[] = []
): EmotionSignal {
  if (!raw) return 'শান্ত';
  const trimmed = raw.trim() as EmotionSignal;
  const customSignal = customEmotions.find(
    (ce) => ce.signal.toLowerCase() === trimmed.toLowerCase()
  );
  if (customSignal) return customSignal.signal;

  const valid: EmotionSignal[] = [
    'খুশি',
    'ভালোবাসা',
    'স্নেহ',
    'অভিমান',
    'দুঃখ',
    'রাগ',
    'উদ্বেগ',
    'ক্লান্তি',
    'রসিকতা',
    'কৃতজ্ঞতা',
    'কৌতূহল',
    'ভয় দেখানো',
    'অনুনয়',
    'সম্মতি',
    'শান্ত',
  ];
  if (valid.includes(trimmed)) return trimmed;

  const lower = raw.toLowerCase();
  if (/(angry|rag|রাগ)/.test(lower)) return 'রাগ';
  if (/(threat|blackmail|pressure|warn|ভয়|চাপ)/.test(lower)) return 'ভয় দেখানো';
  if (/(plead|convince|sorry|অনুনয়|ক্ষমা)/.test(lower)) return 'অনুনয়';
  if (/(agree|accept|সম্মতি|রাজি)/.test(lower)) return 'সম্মতি';
  if (/(love|ভালোবাসা)/.test(lower)) return 'ভালোবাসা';
  if (/(affection|care|স্নেহ)/.test(lower)) return 'স্নেহ';
  if (/(sulky|অভিমান)/.test(lower)) return 'অভিমান';
  if (/(sad|দুঃখ)/.test(lower)) return 'দুঃখ';
  if (/(worry|উদ্বেগ)/.test(lower)) return 'উদ্বেগ';
  if (/(happy|খুশি)/.test(lower)) return 'খুশি';
  return 'শান্ত';
}

function normalizeRelation(raw?: string): PersonaRelation {
  const s = (raw || '').toLowerCase().trim();
  if (/(spouse|wife|husband|bou|jamai|swami|স্ত্রী|স্বামী|জামাই|বউ)/.test(s)) return 'spouse';
  if (/(romantic|gf|bf|girlfriend|boyfriend|প্রেমিকা|প্রেমিক|প্রেম)/.test(s)) return 'romantic';
  if (/(mother|mom|ammu|amma|মায়ের|জননী|(?:^|[^a-z\u0980-\u09FF])মা(?:$|[^a-z\u0980-\u09FF]))/.test(s)) {
    return 'mother';
  }
  if (/(father|dad|abbu|abba|বাবা|পিতা)/.test(s)) return 'father';
  if (/(sibling|brother|sister|ভাই|বোন|আপু)/.test(s)) return 'sibling';
  if (/(friend|bondhu|dost|বন্ধু|দোস্ত)/.test(s)) return 'friend';
  if (/(mentor|teacher|sir|শিক্ষক)/.test(s)) return 'mentor';
  return 'story';
}

function parseLexiconArray(
  items: unknown[],
  stamp: number,
  customEmotions: CustomEmotionDefinition[] = []
): {
  words: LexiconEntry[];
  skippedUnsafeCount: number;
} {
  const words: LexiconEntry[] = [];
  let skippedUnsafeCount = 0;

  items.forEach((rawItem, idx) => {
    if (!rawItem || typeof rawItem !== 'object') return;
    const item = rawItem as Record<string, unknown>;
    const rootRaw = item.root ?? item.word ?? item.term;
    const meaningRaw = item.meaningBn ?? item.meaning ?? item.definition ?? item.description;
    if (!rootRaw || !meaningRaw) return;

    const rawForms =
      item.forms ?? item.variants ?? item.englishAndVariants ?? item.english ?? item.aliases;
    let formsList: string[] = [];
    if (Array.isArray(rawForms)) {
      formsList = rawForms.map(String).map((s) => s.trim()).filter(Boolean);
    } else if (typeof rawForms === 'string') {
      formsList = rawForms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const root = String(rootRaw).trim();
    const meaningBn = String(meaningRaw).trim();
    const checkText = `${root} ${meaningBn} ${formsList.join(' ')}`;
    if (detectSensitiveOrInappropriateInput(checkText)) {
      skippedUnsafeCount++;
      return;
    }

    const emotion = normalizeEmotionSignal(
      item.emotion ? String(item.emotion) : undefined,
      customEmotions
    );
    words.push({
      id: `json-lex-${stamp}-${idx}`,
      root,
      forms: Array.from(new Set([root, ...formsList])),
      meaningBn,
      category: item.category ? String(item.category) : 'JSON Lexicon',
      emotion,
      intensity: typeof item.intensity === 'number' ? item.intensity : 4,
      isUserTrained: true,
    });
  });

  return { words, skippedUnsafeCount };
}

/**
 * Parses a standalone JSON batch of Bengali/Banglish words & emotions:
 * Either an array `[{ root, emotion, forms, meaningBn }]` or `{ lexicon: [...] }` / `{ words: [...] }`.
 */
export function parseLexiconJson(
  rawJson: string,
  customEmotions: CustomEmotionDefinition[] = []
): {
  extractedWords: LexiconEntry[];
  skippedUnsafeCount: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).lexicon as unknown[]) ||
          ((parsed as Record<string, unknown>).words as unknown[])
        : null;

    if (!Array.isArray(arr)) {
      return {
        extractedWords: [],
        skippedUnsafeCount: 0,
        error:
          'JSON must be an array of word objects or an object with a "lexicon" / "words" array.',
      };
    }

    const { words, skippedUnsafeCount } = parseLexiconArray(arr, Date.now(), customEmotions);
    return { extractedWords: words, skippedUnsafeCount };
  } catch {
    return {
      extractedWords: [],
      skippedUnsafeCount: 0,
      error: 'Invalid JSON syntax. Please check commas, quotes, and brackets.',
    };
  }
}

function parseEmotionsArray(
  arr: unknown[],
  stamp: number,
  existingCustomEmotions: CustomEmotionDefinition[] = []
): {
  emotions: CustomEmotionDefinition[];
  skippedUnsafeCount: number;
  skippedDuplicateCount: number;
} {
  const emotions: CustomEmotionDefinition[] = [];
  let skippedUnsafeCount = 0;
  let skippedDuplicateCount = 0;

  const knownSignals = new Set<string>([
    ...BUILTIN_EMOTIONS.map((b) => String(b.signal).toLowerCase()),
    ...existingCustomEmotions.map((c) => String(c.signal).toLowerCase()),
  ]);

  arr.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const em = raw as {
      id?: string;
      signal?: string;
      name?: string;
      emotion?: string;
      mood?: string;
      descriptionBn?: string;
      description?: string;
      keywords?: string[] | string;
      triggers?: string[] | string;
      cues?: string[] | string;
      replyTemplate?: string;
      reply?: string;
      actionText?: string;
      action?: string;
      voiceTone?: EmotionVoiceTone | string;
    };

    const sig = String(em.signal || em.name || em.emotion || '').trim();
    const mood = String(em.mood || sig).trim();
    if (!sig) return;

    const rawKw = em.keywords ?? em.triggers ?? em.cues;
    const kwList = Array.isArray(rawKw)
      ? rawKw.map(String).map((s) => s.trim()).filter(Boolean)
      : typeof rawKw === 'string'
        ? rawKw.split(',').map((s) => s.trim()).filter(Boolean)
        : [sig];

    const desc = String(em.descriptionBn || em.description || `${sig} অনুভূতি`).trim();
    const replyTpl = String(
      em.replyTemplate ||
        em.reply ||
        `তোমার কথার ভেতর "{word}" আর ${sig}-এর অনুভূতিটা বেশ বুঝতে পারছি {userName}!`
    ).trim();
    const actText = String(em.actionText || em.action || `${mood} ভঙ্গিতে তাকালো`).trim();

    const checkText = `${sig} ${mood} ${desc} ${kwList.join(' ')} ${replyTpl} ${actText}`;
    if (detectSensitiveOrInappropriateInput(checkText)) {
      skippedUnsafeCount++;
      return;
    }

    const sigKey = sig.toLowerCase();
    if (knownSignals.has(sigKey)) {
      skippedDuplicateCount++;
      return;
    }
    knownSignals.add(sigKey);

    const toneLower = String(em.voiceTone || 'calm').trim().toLowerCase();
    const tone: EmotionVoiceTone =
      toneLower === 'bright' || toneLower === 'gentle' || toneLower === 'intense'
        ? toneLower
        : 'calm';

    emotions.push({
      id: em.id ? String(em.id) : `json-emo-${stamp}-${idx}`,
      signal: sig,
      mood,
      descriptionBn: desc,
      keywords: Array.from(new Set([sig, ...kwList])),
      replyTemplate: replyTpl,
      actionText: actText,
      voiceTone: tone,
    });
  });

  return { emotions, skippedUnsafeCount, skippedDuplicateCount };
}

/**
 * Parses a standalone JSON batch of custom emotions:
 * Either an array `[{ signal, mood, keywords, voiceTone, descriptionBn, replyTemplate, actionText }]`
 * or an object `{ customEmotions: [...] }` / `{ emotions: [...] }`.
 */
export function parseEmotionsJson(
  rawJson: string,
  existingCustomEmotions: CustomEmotionDefinition[] = []
): {
  emotions: CustomEmotionDefinition[];
  skippedUnsafeCount: number;
  skippedDuplicateCount: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).customEmotions as unknown[]) ||
          ((parsed as Record<string, unknown>).emotions as unknown[])
        : null;

    if (!Array.isArray(arr)) {
      return {
        emotions: [],
        skippedUnsafeCount: 0,
        skippedDuplicateCount: 0,
        error:
          'JSON must be an array of emotion objects or an object with a "customEmotions" / "emotions" array.',
      };
    }

    const { emotions, skippedUnsafeCount, skippedDuplicateCount } = parseEmotionsArray(
      arr,
      Date.now(),
      existingCustomEmotions
    );
    return { emotions, skippedUnsafeCount, skippedDuplicateCount };
  } catch {
    return {
      emotions: [],
      skippedUnsafeCount: 0,
      skippedDuplicateCount: 0,
      error: 'Invalid JSON syntax. Please check commas, quotes, and brackets.',
    };
  }
}

/**
 * Parses a structured JSON dataset matching:
 * { customEmotions, lexicon, scenarios, characters, conversations, naturalPairs }
 * directly into local training conversations, vocabulary entries, playable characters, and multi-phase scenarios.
 */
export function parseJsonDataset(
  rawJson: string,
  existingCustomEmotions: CustomEmotionDefinition[] = []
): {
  conversations: TrainedConversationItem[];
  extractedWords: LexiconEntry[];
  scenarios: TrainedScenario[];
  characters: RoleplayCharacter[];
  customEmotions: CustomEmotionDefinition[];
  selfLearnedPatterns: MLSelfLearnedPattern[];
  skippedUnsafeCount: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as {
      selfLearnedPatterns?: Array<{
        id?: string;
        relation?: string;
        triggerTokens?: string[];
        prompt?: string;
        response?: string;
        emotion?: string;
        signalEmotion?: string;
        action?: string;
        score?: number;
        hitCount?: number;
      }>;
      customEmotions?: Array<{
        id?: string;
        signal?: string;
        name?: string;
        mood?: string;
        descriptionBn?: string;
        description?: string;
        keywords?: string[] | string;
        replyTemplate?: string;
        actionText?: string;
        voiceTone?: EmotionVoiceTone;
      }>;
      emotions?: Array<{
        id?: string;
        signal?: string;
        name?: string;
        mood?: string;
        descriptionBn?: string;
        description?: string;
        keywords?: string[] | string;
        replyTemplate?: string;
        actionText?: string;
        voiceTone?: EmotionVoiceTone;
      }>;
      lexicon?: unknown[];
      words?: unknown[];
      characters?: Array<{
        id?: string;
        name?: string;
        englishName?: string;
        role?: string;
        relation?: string;
        gender?: VoiceGender;
        age?: number;
        setting?: string;
        personality?: string;
        personalitySummary?: string;
        greeting?: string;
        greetingAction?: string;
        initialFollowUps?: string[];
      }>;
      conversations?: Array<{
        relation?: string;
        labelBn?: string;
        topic?: string;
        phase?: string;
        prompt?: string;
        userPrompt?: string;
        response?: string;
        characterReply?: string;
        emotion?: string;
        mood?: string;
        action?: string;
        followUps?: string[];
        keywords?: string[];
        variants?: Array<{
          text?: string;
          action?: string;
          emotion?: string;
          mood?: string;
          followUps?: string[];
        }>;
      }>;
      naturalPairs?: Array<{
        relation?: string;
        phase?: string;
        userPrompt?: string;
        characterReply?: string;
        action?: string;
        emotion?: string;
        mood?: string;
        followUps?: string[];
      }>;
      scenarios?: Array<{
        id?: string;
        title?: string;
        relation?: string;
        characterName?: string;
        characterAge?: number;
        gender?: VoiceGender;
        setting?: string;
        summary?: string;
        greeting?: string;
        greetingAction?: string;
        phases?: Array<{
          phase?: string;
          beat?: string;
          emotion?: string;
          mood?: string;
          phaseTrigger?: 'refusal' | 'pressure' | 'persuasion' | 'apology' | 'auto';
          keywords?: string[];
          variants?: Array<{
            text?: string;
            action?: string;
            emotion?: string;
            mood?: string;
            followUps?: string[];
          }>;
          responses?: Array<{
            text?: string;
            action?: string;
            emotion?: string;
            mood?: string;
            followUps?: string[];
          }>;
          dialogues?: Array<{
            text?: string;
            action?: string;
            emotion?: string;
            mood?: string;
            followUps?: string[];
          }>;
        }>;
      }>;
    };

    const extractedWords: LexiconEntry[] = [];
    const conversations: TrainedConversationItem[] = [];
    const scenarios: TrainedScenario[] = [];
    const characters: RoleplayCharacter[] = [];
    const customEmotions: CustomEmotionDefinition[] = [];
    const selfLearnedPatterns: MLSelfLearnedPattern[] = [];
    let skippedUnsafeCount = 0;
    const stamp = Date.now();

    const rawEmotions = Array.isArray(parsed.customEmotions)
      ? parsed.customEmotions
      : Array.isArray(parsed.emotions)
        ? parsed.emotions
        : [];
    if (rawEmotions.length > 0) {
      const emoRes = parseEmotionsArray(rawEmotions, stamp, existingCustomEmotions);
      customEmotions.push(...emoRes.emotions);
      skippedUnsafeCount += emoRes.skippedUnsafeCount;
    }

    const allCustomEmotions = [...customEmotions, ...existingCustomEmotions];

    const rawLexicon = Array.isArray(parsed.lexicon)
      ? parsed.lexicon
      : Array.isArray(parsed.words)
        ? parsed.words
        : [];
    if (rawLexicon.length > 0) {
      const lexRes = parseLexiconArray(rawLexicon, stamp, allCustomEmotions);
      extractedWords.push(...lexRes.words);
      skippedUnsafeCount += lexRes.skippedUnsafeCount;
    }

    if (Array.isArray(parsed.characters)) {
      parsed.characters.forEach((ch, idx) => {
        if (!ch.name) return;
        const summary = String(ch.personalitySummary || ch.personality || `${ch.name} — JSON Trained Role`).trim();
        const greeting = String(ch.greeting || `হ্যালো, আমি ${ch.name}। চলো কথা বলি!`).trim();
        if (
          detectSensitiveOrInappropriateInput(ch.name) ||
          detectSensitiveOrInappropriateInput(summary) ||
          detectSensitiveOrInappropriateInput(greeting)
        ) {
          skippedUnsafeCount++;
          return;
        }
        const relation = normalizeRelation(ch.relation || ch.role);
        const gender: VoiceGender =
          ch.gender || (relation === 'father' ? 'male' : 'female');
        const ageText = typeof ch.age === 'number' ? `, বয়স ${ch.age}` : '';

        characters.push({
          id: ch.id ? String(ch.id) : `json-char-${stamp}-${idx}`,
          name: String(ch.name).trim(),
          englishName: ch.englishName ? String(ch.englishName).trim() : String(ch.name).trim(),
          role: ch.role ? String(ch.role).trim() : `${relation}${ageText}`,
          setting: ch.setting ? String(ch.setting).trim() : 'আমাদের বাসায়',
          eraOrVibe: summary,
          gender,
          age: typeof ch.age === 'number' ? ch.age : undefined,
          relation,
          avatarUrl: '',
          accentHex: gender === 'female' ? '#E11D48' : '#2563EB',
          personalitySummary: summary,
          greeting,
          greetingAction: ch.greetingAction
            ? String(ch.greetingAction).trim()
            : 'স্বাভাবিক ভঙ্গিতে তাকালো',
          initialFollowUps:
            Array.isArray(ch.initialFollowUps) && ch.initialFollowUps.length > 0
              ? ch.initialFollowUps.map(String)
              : ['কেমন আছো?', 'আজ কী করছো?', 'একটা কথা বলি?'],
          voiceDefaults:
            gender === 'female'
              ? { pitch: 1.18, rate: 0.96, timbreHz: 242 }
              : { pitch: 0.8, rate: 0.96, timbreHz: 118 },
          storyBranches: [],
          topics: [],
          fallbacks: [
            {
              text: `হুম, বুঝতে পারছি {userName}। এরপর কী হলো খুলে বলো তো!`,
              action: 'মনোযোগ দিয়ে শুনছে',
              mood: relation === 'mother' || relation === 'father' ? 'স্নেহশীল' : 'শান্ত',
              followUps: ['তারপর শুনো...', 'একটা অনুরোধ ছিল'],
            },
          ],
          isCustom: true,
        });
      });
    }

    if (Array.isArray(parsed.naturalPairs)) {
      parsed.naturalPairs.forEach((pair, idx) => {
        if (pair.userPrompt && pair.characterReply) {
          if (
            detectSensitiveOrInappropriateInput(pair.userPrompt) ||
            detectSensitiveOrInappropriateInput(pair.characterReply)
          ) {
            skippedUnsafeCount++;
            return;
          }
          conversations.push({
            id: `json-pair-${stamp}-${idx}`,
            relation: pair.relation ? normalizeRelation(pair.relation) : 'any',
            phase: pair.phase ? normalizePhaseName(pair.phase) : undefined,
            prompt: String(pair.userPrompt).trim(),
            response: String(pair.characterReply).trim(),
            action: pair.action ? String(pair.action) : 'স্বাভাবিক ভঙ্গিতে উত্তর দিল',
            emotion: normalizeCharacterMood(pair.mood || pair.emotion, 'শান্ত', allCustomEmotions),
            followUps: Array.isArray(pair.followUps) ? pair.followUps.map(String) : undefined,
            source: 'JSON Natural Pair',
          });
        }
      });
    }

    if (Array.isArray(parsed.conversations)) {
      parsed.conversations.forEach((conv, cIdx) => {
        const keywords = Array.isArray(conv.keywords) ? conv.keywords.map(String) : [];
        const variants = Array.isArray(conv.variants) ? conv.variants : [];
        const directPrompt = conv.prompt || conv.userPrompt;
        const directReply = conv.response || conv.characterReply;
        const rel = conv.relation && conv.relation !== 'any' ? normalizeRelation(conv.relation) : 'any';
        const phase = conv.phase ? normalizePhaseName(conv.phase) : undefined;

        // Support direct dialogue object { prompt, response, emotion }
        if (directPrompt && directReply) {
          if (
            detectSensitiveOrInappropriateInput(directPrompt) ||
            detectSensitiveOrInappropriateInput(directReply)
          ) {
            skippedUnsafeCount++;
          } else {
            conversations.push({
              id: `json-conv-direct-${stamp}-${cIdx}`,
              relation: rel,
              phase,
              prompt: String(directPrompt).trim(),
              keywords: keywords.length > 0 ? keywords : undefined,
              response: String(directReply).trim(),
              action: conv.action ? String(conv.action) : 'স্বাভাবিক ভঙ্গিতে উত্তর দিল',
              emotion: normalizeCharacterMood(conv.mood || conv.emotion, 'শান্ত', allCustomEmotions),
              followUps: Array.isArray(conv.followUps) ? conv.followUps.map(String) : undefined,
              source: conv.labelBn || conv.topic || 'JSON Dialogue',
            });
          }
        }

        const prompt = directPrompt || keywords.join(' ') || conv.labelBn || conv.topic || '';
        variants.forEach((v, vIdx) => {
          if (prompt && v.text) {
            const replyText = String(v.text).trim();
            if (
              detectSensitiveOrInappropriateInput(prompt) ||
              detectSensitiveOrInappropriateInput(replyText)
            ) {
              skippedUnsafeCount++;
              return;
            }
            conversations.push({
              id: `json-conv-${stamp}-${cIdx}-${vIdx}`,
              relation: rel,
              phase,
              prompt,
              keywords: keywords.length > 0 ? keywords : undefined,
              response: replyText,
              action: v.action ? String(v.action) : undefined,
              emotion: normalizeCharacterMood(
                v.mood || v.emotion || conv.mood || conv.emotion,
                'শান্ত',
                allCustomEmotions
              ),
              followUps: Array.isArray(v.followUps) ? v.followUps.map(String) : undefined,
              source: conv.labelBn || conv.topic || 'JSON Topic',
            });
          }
        });
      });
    }

    if (Array.isArray(parsed.scenarios)) {
      parsed.scenarios.forEach((sc, sIdx) => {
        if (!sc.title && !sc.summary) return;
        const relation: PersonaRelation = normalizeRelation(sc.relation);
        const gender: VoiceGender =
          sc.gender ||
          (relation === 'mother' ? 'female' : relation === 'father' ? 'male' : 'female');

        const rawPhases = Array.isArray(sc.phases) ? sc.phases : [];
        const safePhases: TrainedScenarioPhase[] = [];

        rawPhases.forEach((p) => {
          const list = Array.isArray(p.responses)
            ? p.responses
            : Array.isArray(p.variants)
              ? p.variants
              : Array.isArray(p.dialogues)
                ? p.dialogues
                : [];
          const phaseMood = normalizeCharacterMood(p.mood || p.emotion, 'শান্ত', allCustomEmotions);
          const safeResponses: DialogueVariant[] = [];
          list.forEach((v) => {
            if (!v.text) return;
            const replyText = String(v.text).trim();
            if (detectSensitiveOrInappropriateInput(replyText)) {
              skippedUnsafeCount++;
              return;
            }
            safeResponses.push({
              text: replyText,
              action: v.action ? String(v.action) : 'স্বাভাবিক ভঙ্গিতে তাকালো',
              mood: normalizeCharacterMood(v.mood || v.emotion, phaseMood, allCustomEmotions),
              followUps: Array.isArray(v.followUps) ? v.followUps.map(String) : [],
            });
          });

          const phaseBeat = String(p.beat || '').trim();
          if (detectSensitiveOrInappropriateInput(phaseBeat)) {
            skippedUnsafeCount++;
            return;
          }

          if (phaseBeat || safeResponses.length > 0) {
            safePhases.push({
              phase: normalizePhaseName(p.phase),
              beat: phaseBeat || 'গল্পের পরবর্তী অংশ',
              emotion: phaseMood,
              phaseTrigger: p.phaseTrigger,
              keywords: Array.isArray(p.keywords) ? p.keywords.map(String) : undefined,
              responses: safeResponses,
            });
          }
        });

        const summary = String(sc.summary || sc.title || '').trim();
        if (detectSensitiveOrInappropriateInput(summary)) {
          skippedUnsafeCount++;
          return;
        }

        if (safePhases.length > 0 || summary) {
          scenarios.push({
            id: sc.id ? String(sc.id) : `json-scenario-${stamp}-${sIdx}`,
            title: String(sc.title || `Scenario ${sIdx + 1}`).trim(),
            relation,
            characterName: sc.characterName ? String(sc.characterName).trim() : undefined,
            characterAge: typeof sc.characterAge === 'number' ? sc.characterAge : undefined,
            gender,
            setting: sc.setting ? String(sc.setting).trim() : undefined,
            summary,
            greeting: sc.greeting ? String(sc.greeting).trim() : undefined,
            greetingAction: sc.greetingAction ? String(sc.greetingAction).trim() : undefined,
            phases: safePhases,
          });
        }
      });
    }

    if (Array.isArray(parsed.selfLearnedPatterns)) {
      parsed.selfLearnedPatterns.forEach((pat, idx) => {
        if (!pat || !pat.prompt || !pat.response) return;
        const cleanPrompt = String(pat.prompt).trim();
        const cleanResponse = String(pat.response).trim();
        if (
          detectSensitiveOrInappropriateInput(cleanPrompt) ||
          detectSensitiveOrInappropriateInput(cleanResponse)
        ) {
          skippedUnsafeCount++;
          return;
        }
        const tokens = Array.isArray(pat.triggerTokens)
          ? pat.triggerTokens.map(String).map((t) => t.trim()).filter(Boolean)
          : normalizeBengaliText(cleanPrompt).split(/\s+/).filter(Boolean).slice(0, 6);
        selfLearnedPatterns.push({
          id: pat.id ? String(pat.id) : `json-ml-pat-${stamp}-${idx}`,
          relation:
            pat.relation && pat.relation !== 'any' ? normalizeRelation(pat.relation) : 'any',
          triggerTokens: tokens,
          prompt: cleanPrompt,
          response: cleanResponse,
          emotion: normalizeCharacterMood(pat.emotion, 'শান্ত', allCustomEmotions),
          signalEmotion: normalizeEmotionSignal(pat.signalEmotion, allCustomEmotions),
          action: pat.action ? String(pat.action) : 'স্বাভাবিক ভঙ্গিতে তাকিয়ে উত্তর দিল',
          score: typeof pat.score === 'number' ? pat.score : 1,
          hitCount: typeof pat.hitCount === 'number' ? pat.hitCount : 0,
        });
      });
    }

    return {
      conversations,
      extractedWords,
      scenarios,
      characters,
      customEmotions,
      selfLearnedPatterns,
      skippedUnsafeCount,
    };
  } catch {
    return {
      conversations: [],
      extractedWords: [],
      scenarios: [],
      characters: [],
      customEmotions: [],
      selfLearnedPatterns: [],
      skippedUnsafeCount: 0,
      error:
        'Invalid JSON format. Please upload or paste valid JSON containing scenarios, characters, conversations, naturalPairs, or lexicon.',
    };
  }
}

function toAsciiDigits(str: string): string {
  const bn = '০১২৩৪৫৬৭৮৯';
  return str.replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
}

function capitalizeWord(str: string): string {
  const trimmed = str.trim().replace(/[।,!?.$]/g, '');
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z]/.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

/**
 * Parses an opening Banglish, Bengali, or English roleplay setup prompt such as:
 * "amar nam Rohan, tumi amar mayer roleplay korbe. tomar nam Rabeya, tomar boyosh 38, tomar choritro ..."
 */
export function parseRoleplaySetupPrompt(rawInput: string): {
  draft: RoleplaySetupDraft;
  scenarioText?: string;
} {
  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // 1. User name
  let userName: string | undefined;
  const userNameMatch =
    clean.match(/(?:amar\s+nam|amar\s+naam|my\s+name\s+is|i\s+am|আমি\s+হলাম|আমার\s+নাম)\s+([^\s,।.!?]+)/i);
  if (userNameMatch?.[1]) {
    userName = capitalizeWord(userNameMatch[1]);
  }

  // 2. Relation & gender
  let relation: PersonaRelation = 'story';
  let gender: VoiceGender = 'female';

  if (
    /(mayer|maayer|ammu|amma|\bmaa\b|\bmother\b|\bmom\b|মায়ের|(?:^|[\s,।.!?])মা(?:$|[\s,।.!?])|আম্মু)/i.test(
      lower
    )
  ) {
    relation = 'mother';
    gender = 'female';
  } else if (/(babar|abbu|abba|\bfather\b|\bdad\b|বাবার|আব্বু)/i.test(lower)) {
    relation = 'father';
    gender = 'male';
  } else if (/(bou|ginni|wife|stri|বউ|স্ত্রী)/i.test(lower)) {
    relation = 'spouse';
    gender = 'female';
  } else if (/(jamai|swami|husband|জামাই|স্বামী)/i.test(lower)) {
    relation = 'spouse';
    gender = 'male';
  } else if (/(gf|girlfriend|premika|গার্লফ্রেন্ড|প্রেমিকা)/i.test(lower)) {
    relation = 'romantic';
    gender = 'female';
  } else if (/(bf|boyfriend|premik|বয়ফ্রেন্ড|প্রেমিক)/i.test(lower)) {
    relation = 'romantic';
    gender = 'male';
  } else if (/(bon|apu|sister|বোন|আপু)/i.test(lower)) {
    relation = 'sibling';
    gender = 'female';
  } else if (/(bhai|vaia|bhaiya|brother|ভাই)/i.test(lower)) {
    relation = 'sibling';
    gender = 'male';
  } else if (/(bondhu|dost|friend|বন্ধু|দোস্ত)/i.test(lower)) {
    relation = 'friend';
    gender = /\b(girl|meye|bandhobi|বান্ধবী)\b/i.test(lower) ? 'female' : 'male';
  } else if (/(teacher|sir|mam|mentor|শিক্ষক|স্যার)/i.test(lower)) {
    relation = 'mentor';
    gender = /\b(mam|miss|madam|ম্যাম)\b/i.test(lower) ? 'female' : 'male';
  }

  // 3. Character name
  const defaultNameByRelation: Record<PersonaRelation, string> = {
    mother: 'রাবেয়া (আম্মু)',
    father: 'করিম (আব্বু)',
    sibling: gender === 'female' ? 'মিম (আপু)' : 'রাফি (ভাই)',
    friend: 'সাদমান (বন্ধু)',
    romantic: gender === 'female' ? 'নীলা' : 'আরিয়ান',
    spouse: gender === 'female' ? 'তানহা' : 'তানভীর',
    mentor: 'অধ্যাপক',
    story: 'কথাসঙ্গী',
  };

  let characterName = defaultNameByRelation[relation];
  const charNameMatch =
    clean.match(
      /(?:tomar\s+nam|tomar\s+naam|your\s+name\s+is|character\s+name|তোমার\s+নাম)\s+([^\s,।.!?]+)/i
    );
  if (charNameMatch?.[1]) {
    characterName = capitalizeWord(charNameMatch[1]);
  }

  // 4. Character Age
  let characterAge: number | undefined;
  const ascii = toAsciiDigits(clean);
  const ageMatch = ascii.match(/(?:boyosh|boiosh|age|বয়স)\s*[:=-]?\s*\$?(\d{1,2})/i);
  if (ageMatch?.[1]) {
    characterAge = parseInt(ageMatch[1], 10);
  }

  // 5. Personality traits
  let personality: string | undefined;
  const traitMatch = clean.match(
    /(?:tomar\s+choritro|choritro|nature|personality|স্বভাব|চরিত্র)\s*(?:holo|hobe|হলো|হবে|:)?\s*([^।.!?\n]+)/i
  );
  if (traitMatch?.[1]) {
    personality = traitMatch[1].trim();
  }

  // 6. Scenario detection
  let scenarioText: string | undefined;
  const scenarioMatch = clean.match(
    /(?:scenario|golpo|kahini|story|সিনারিও|কাহিনী|গল্প)\s*(?:holo|hobe|হলো|হবে|:)?\s*(.+)$/i
  );
  if (scenarioMatch?.[1] && scenarioMatch[1].trim().length > 8) {
    scenarioText = scenarioMatch[1].trim();
  }

  const defaultSetting: Record<PersonaRelation, string> = {
    mother: 'বাসায় (Home)',
    father: 'বাসার বসার ঘরে',
    sibling: 'বাসার ছাদে ও বসার ঘরে',
    friend: 'ক্যাম্পাস মোড়ের টং দোকান',
    romantic: 'সন্ধ্যার ফোনালাপ ও লেকের পাড়',
    spouse: 'আমাদের সাজানো বাসায়',
    mentor: 'গ্রন্থাগার ও পড়ার কক্ষ',
    story: 'সন্ধ্যার শান্ত ক্যাফে',
  };

  return {
    draft: {
      step: scenarioText ? 'awaiting_character' : 'awaiting_scenario',
      userName,
      characterName,
      characterAge,
      relation,
      gender,
      personality,
      setting: defaultSetting[relation],
    },
    scenarioText,
  };
}

/**
 * Splits a user's scenario description (in Banglish, Bengali, or English)
 * into Beginning, Middle, and Ending beats for progressive roleplay.
 */
export function parseScenarioArc(
  rawScenario: string,
  relation: PersonaRelation
): ScenarioArc {
  const clean = rawScenario.trim();
  const clauses = clean
    .split(/(?:তারপর|এরপর|শেষে|অবশেষে|tarpor|erpor|then|finally|and then|[।,.!?])+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const openingBeat = clauses[0] || clean;
  const middleBeat =
    clauses.length >= 3
      ? clauses.slice(1, -1).join(', ')
      : clauses[1] || 'গল্পটি আবেগ ও বাস্তব কথোপকথনের মধ্য দিয়ে এগিয়ে যাবে';
  const endingBeat =
    clauses.length >= 2
      ? clauses[clauses.length - 1]
      : relation === 'mother'
        ? 'সব ভুল বোঝাবুঝি বা ব্যস্ততা পেরিয়ে মা-সন্তানের ভালোবাসায় সমাপ্তি'
        : 'গভীর আন্তরিকতা ও সুন্দর সমঝোতায় দৃশ্যের সমাপ্তি';

  return {
    summary: clean,
    openingBeat,
    middleBeat,
    endingBeat,
    currentPhase: 'opening',
  };
}

export function computeEmotionalVoiceAdjustment(
  mood?: CharacterMood,
  customEmotions: CustomEmotionDefinition[] = []
): {
  pitchDelta: number;
  rateFactor: number;
} {
  const customMatch = mood
    ? customEmotions.find((ce) => ce.mood === mood || ce.signal === mood)
    : undefined;
  if (customMatch) {
    switch (customMatch.voiceTone) {
      case 'bright':
        return { pitchDelta: 0.06, rateFactor: 1.05 };
      case 'gentle':
        return { pitchDelta: 0.02, rateFactor: 0.94 };
      case 'intense':
        return { pitchDelta: 0.05, rateFactor: 1.08 };
      default:
        return { pitchDelta: 0, rateFactor: 1.0 };
    }
  }

  switch (mood) {
    case 'উৎফুল্ল':
    case 'রসিক':
    case 'সম্মত ও খুশি':
      return { pitchDelta: 0.06, rateFactor: 1.05 };
    case 'ভালোবাসাময়':
    case 'স্নেহশীল':
    case 'নরম হওয়া':
      return { pitchDelta: 0.02, rateFactor: 0.94 };
    case 'অভিমানী':
      return { pitchDelta: 0.04, rateFactor: 0.92 };
    case 'শাসনমিশ্রিত স্নেহ':
    case 'চাপ ও শর্ত':
      return { pitchDelta: -0.03, rateFactor: 0.98 };
    case 'ক্লান্ত':
    case 'ব্যথিত':
      return { pitchDelta: -0.05, rateFactor: 0.87 };
    case 'উদ্বিগ্ন':
    case 'রাগান্বিত':
    case 'কঠোর শাসন':
      return { pitchDelta: 0.05, rateFactor: 1.08 };
    default:
      return { pitchDelta: 0, rateFactor: 1.0 };
  }
}

import { BENGALI_LEXICON } from '../data/bengaliLexicon';
import { BUILTIN_EMOTIONS } from '../data/builtinEmotions';
import {
  CharacterMood,
  CustomEmotionDefinition,
  DialogueVariant,
  EmotionSignal,
  EmotionVoiceTone,
  LexiconEntry,
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

const BANGLISH_WORD_MAP: Array<[RegExp, string]> = [
  [/\bkemon acho\b|\bkemon achen\b|\bki obostha\b|\bkmn acho\b/gi, 'à¦•à§‡à¦®à¦¨ à¦†à¦›à§‹'],
  [/\bvalo achi\b|\bbhalo achi\b|\bami valo\b|\bami bhalo\b/gi, 'à¦­à¦¾à¦²à§‹ à¦†à¦›à¦¿'],
  [/\bamar naam\b|\bamar nam\b/gi, 'à¦†à¦®à¦¾à¦° à¦¨à¦¾à¦®'],
  [/\btomar naam\b|\btomar nam\b/gi, 'à¦¤à§‹à¦®à¦¾à¦° à¦¨à¦¾à¦®'],
  [/\btumi ke\b|\bapni ke\b/gi, 'à¦¤à§à¦®à¦¿ à¦•à§‡'],
  [/\bki koro\b|\bki korcho\b|\bki korchis\b|\bki korteso\b|\bki koros\b/gi, 'à¦•à§€ à¦•à¦°à§‹'],
  [/\bkothay acho\b|\bkothay aco\b|\bkoi tumi\b|\bkothay geli\b/gi, 'à¦•à§‹à¦¥à¦¾à§Ÿ à¦†à¦›à§‹'],
  [/\bkothay thako\b|\bkothai thako\b/gi, 'à¦•à§‹à¦¥à¦¾à§Ÿ à¦¥à¦¾à¦•à§‹'],
  [/\bmon kharap\b|\bmon valo nei\b|\bmon bhalo nei\b|\bmon valo nai\b/gi, 'à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª'],
  [/\bvalo lagche na\b|\bbhalo lagche na\b|\bvalo lage na\b/gi, 'à¦­à¦¾à¦²à§‹ à¦²à¦¾à¦—à¦›à§‡ à¦¨à¦¾'],
  [/\bshorir kharap\b|\bshorir valo na\b|\bshorir bhalo na\b/gi, 'à¦¶à¦°à§€à¦° à¦–à¦¾à¦°à¦¾à¦ª'],
  [/\bmatha betha\b|\bmathay betha\b/gi, 'à¦®à¦¾à¦¥à¦¾à¦¬à§à¦¯à¦¥à¦¾'],
  [/\bmane ki\b|\borth ki\b|\bortho ki\b/gi, 'à¦®à¦¾à¦¨à§‡ à¦•à§€'],
  [/\bki ranna korcho\b|\bki ranna korecho\b|\bki ranna korso\b/gi, 'à¦•à§€ à¦°à¦¾à¦¨à§à¦¨à¦¾ à¦•à¦°à§‡à¦›à§‹'],
  [/\bkhete dao\b|\bkhabar dao\b|\bkhuda lagche\b|\bkhida lagche\b|\bkhuda peyeche\b/gi, 'à¦•à§à¦·à§à¦§à¦¾ à¦²à§‡à¦—à§‡à¦›à§‡ à¦–à¦¾à¦¬à¦¾à¦° à¦¦à¦¾à¦“'],
  [/\bkheyecho\b|\bkheyecis\b|\bkhaiso\b|\bkhaicho\b/gi, 'à¦–à§‡à§Ÿà§‡à¦›à§‹'],
  [/\bkhaini\b|\bkhai nai\b/gi, 'à¦–à¦¾à¦‡à¦¨à¦¿'],
  [/\bgolpo\b/gi, 'à¦—à¦²à§à¦ª'],
  [/\bkobita\b/gi, 'à¦•à¦¬à¦¿à¦¤à¦¾'],
  [/\bgaan\b|\bgan\b/gi, 'à¦—à¦¾à¦¨'],
  [/\bbristi\b|\bbrishti\b/gi, 'à¦¬à§ƒà¦·à§à¦Ÿà¦¿'],
  [/\bcha\b/gi, 'à¦šà¦¾'],
  [/\bkofi\b/gi, 'à¦•à¦«à¦¿'],
  [/\bbhalobasha\b|\bvalobasha\b|\bbhalobashi\b|\bvalobashi\b|\blove you\b/gi, 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾'],
  [/\bobhiman\b|\babhimani\b/gi, 'à¦…à¦­à¦¿à¦®à¦¾à¦¨'],
  [/\brag korcho\b|\brag korchis\b|\brag korecho\b|\brege acho\b/gi, 'à¦°à¦¾à¦— à¦•à¦°à§‡à¦›à§‹'],
  [/\brag\b|\brege\b/gi, 'à¦°à¦¾à¦—'],
  [/\bsorry\b|\bsori\b/gi, 'à¦¸à¦°à¦¿'],
  [/\bmiss korchi\b|\bmiss korsi\b|\bmiss korechi\b/gi, 'à¦®à¦¿à¦¸ à¦•à¦°à¦›à¦¿'],
  [/\bmiss\b/gi, 'à¦®à¦¿à¦¸'],
  [/\bbondhu\b|\bdost\b|\bbro\b/gi, 'à¦¬à¦¨à§à¦§à§'],
  [/\bbou\b|\bginni\b/gi, 'à¦¬à¦‰'],
  [/\bjamai\b|\bswami\b/gi, 'à¦œà¦¾à¦®à¦¾à¦‡'],
  [/\bbazar\b/gi, 'à¦¬à¦¾à¦œà¦¾à¦°'],
  [/\bdhonnobad\b|\bthanks\b/gi, 'à¦§à¦¨à§à¦¯à¦¬à¦¾à¦¦'],
  [/\bsundor\b|\bshundor\b/gi, 'à¦¸à§à¦¨à§à¦¦à¦°'],
  [/\bshuvo ratri\b|\bgood night\b/gi, 'à¦¶à§à¦­ à¦°à¦¾à¦¤à§à¦°à¦¿'],
  [/\bbiday\b/gi, 'à¦¬à¦¿à¦¦à¦¾à§Ÿ'],
  [/\bkoutuk\b|\bjoke\b/gi, 'à¦•à§Œà¦¤à§à¦•'],
  [/\bsopno\b|\bshopno\b/gi, 'à¦¸à§à¦¬à¦ªà§à¦¨'],
  [/\bkhichuri\b/gi, 'à¦–à¦¿à¦šà§à§œà¦¿'],
  [/\bbiriyani\b/gi, 'à¦¬à¦¿à¦°à¦¿à§Ÿà¦¾à¦¨à¦¿'],
  [/\bilish\b/gi, 'à¦‡à¦²à¦¿à¦¶'],
  [/\bfuchka\b|\bphuchka\b/gi, 'à¦«à§à¦šà¦•à¦¾'],
  [/\bboi\b/gi, 'à¦¬à¦‡'],
  [/\braat\b|\brat\b/gi, 'à¦°à¦¾à¦¤'],
  [/\bsokal\b|\bshokal\b/gi, 'à¦¸à¦•à¦¾à¦²'],
  [/\bbikel\b/gi, 'à¦¬à¦¿à¦•à¦¾à¦²'],
  [/\bchand\b/gi, 'à¦šà¦¾à¦à¦¦'],
  [/\bakash\b/gi, 'à¦†à¦•à¦¾à¦¶'],
  [/\bammu\b|\bamma\b|\bmaa\b/gi, 'à¦†à¦®à§à¦®à§'],
  [/\babbu\b|\baba\b|\bbaba\b/gi, 'à¦†à¦¬à§à¦¬à§'],
  [/\bbhaiya\b|\bvaia\b|\bbhai\b|\bvai\b/gi, 'à¦­à¦¾à¦‡à§Ÿà¦¾'],
  [/\bapu\b|\bbon\b/gi, 'à¦†à¦ªà§'],
  [/\bkhuda\b|\bkhida\b/gi, 'à¦•à§à¦·à§à¦§à¦¾'],
  [/\branna\b/gi, 'à¦°à¦¾à¦¨à§à¦¨à¦¾'],
  [/\bbhat\b|\bvat\b/gi, 'à¦­à¦¾à¦¤'],
  [/\bkosto\b|\bdukkho\b/gi, 'à¦•à¦·à§à¦Ÿ'],
  [/\bkanna\b|\bkandchi\b/gi, 'à¦•à¦¾à¦¨à§à¦¨à¦¾'],
  [/\bghum\b|\bghumabo\b/gi, 'à¦˜à§à¦®'],
  [/\btaka\b/gi, 'à¦Ÿà¦¾à¦•à¦¾'],
  [/\btreat\b/gi, 'à¦Ÿà§à¦°à¦¿à¦Ÿ'],
  [/\btong\b/gi, 'à¦Ÿà¦‚'],
  [/\badda\b/gi, 'à¦†à¦¡à§à¦¡à¦¾'],
  [/\bkhoka\b|\bkhokon\b/gi, 'à¦–à§‹à¦•à¦¾'],
  [/\bsona\b/gi, 'à¦¸à§‹à¦¨à¦¾'],
  [/\bderi\b|\blate\b/gi, 'à¦¦à§‡à¦°à¦¿'],
  [/\bbasay\b|\bbashay\b/gi, 'à¦¬à¦¾à¦¸à¦¾à§Ÿ'],
  [/\boshudh\b|\bosudh\b|\bmedicine\b/gi, 'à¦“à¦·à§à¦§'],
  [/\bjor\b|\bfever\b/gi, 'à¦œà§à¦¬à¦°'],
  [/\bheadphone\b|\bearphone\b/gi, 'à¦¹à§‡à¦¡à¦«à§‹à¦¨'],
  [/\bphone\b/gi, 'à¦«à§‹à¦¨'],
  [/\bporashona\b|\bpora\b|\bexam\b/gi, 'à¦ªà§œà¦¾à¦¶à§‹à¦¨à¦¾'],
  [/\boffice\b|\bchakri\b|\bkaj\b/gi, 'à¦…à¦«à¦¿à¦¸'],
  [/\btension\b|\bchinta\b|\bpera\b/gi, 'à¦šà¦¿à¦¨à§à¦¤à¦¾'],
  [/\bklanto\b|\btired\b/gi, 'à¦•à§à¦²à¦¾à¦¨à§à¦¤'],
  [/\bmaaf\b|\bmaf\b|\bkhoma\b/gi, 'à¦•à§à¦·à¦®à¦¾'],
  [/\bkisu na\b|\bkichu na\b|\bkichui na\b/gi, 'à¦•à¦¿à¦›à§ à¦¨à¦¾'],
  [/\bhmm\b|\bhm\b/gi, 'à¦¹à§à¦®'],
  [/\baccha\b|\bacha\b|\bthik ache\b|\bthk ache\b/gi, 'à¦†à¦šà§à¦›à¦¾'],
  [/\bkhunsuti\b/gi, 'à¦–à§à¦¨à¦¸à§à¦Ÿà¦¿'],
  [/\bshashon\b|\bboka\b/gi, 'à¦¶à¦¾à¦¸à¦¨'],
];

const SUFFIXES = [
  'à¦—à§à¦²à§‹à¦•à§‡',
  'à¦—à§à¦²à§‹à¦°',
  'à¦—à§à¦²à§‹',
  'à¦¦à§‡à¦°à¦•à§‡',
  'à¦¦à§‡à¦°',
  'à¦Ÿà¦¾à§Ÿ',
  'à¦Ÿà¦¿à¦¤à§‡',
  'à¦Ÿà¦¾à¦°',
  'à¦Ÿà¦¿à¦°',
  'à¦Ÿà¦¾',
  'à¦Ÿà¦¿',
  'à¦¤à§‡',
  'à§Ÿà§‡',
  'à¦¯à¦¼à§‡',
  'à¦•à§‡',
  'à§‡à¦°',
  'à¦°à¦¾',
  'à¦›à¦¿à¦¸',
  'à¦›à§‡à¦¨',
  'à¦›à§‹',
  'à¦›à¦¿',
  'à¦›à§‡',
  'à¦²à¦¾à¦®',
  'à¦¬à§‡à¦¨',
  'à¦¬à§‹',
  'à¦¬à§‡',
  'à¦¬à¦¿',
  'à¦²à§‡',
  'à§Ÿ',
  'à¦¯à¦¼',
  'à§‡',
];

// Safety filters removed — all content is allowed.
export function detectSensitiveOrInappropriateInput(_raw: string): boolean {
  return false;
}

export function normalizeBengaliText(raw: string): string {
  let text = raw
    .trim()
    .toLowerCase()
    .replace(/\u09DF/g, 'à¦¯à¦¼')
    .replace(/\u09DC/g, 'à¦¡à¦¼')
    .replace(/\u09DD/g, 'à¦¢à¦¼')
    .replace(/[à¥¤,!?;:"'()[\]{}]/g, ' ');

  for (const [pattern, bengali] of BANGLISH_WORD_MAP) {
    text = text.replace(pattern, ` ${bengali} `);
  }

  text = text
    .replace(/(^|\s)à¦•à¦¿(\s|$)/g, '$1à¦•à§€$2')
    .replace(/(^|\s)à¦•à¦°(\s|$)/g, '$1à¦•à¦°à§‹$2')
    .replace(/(^|\s)à¦•à¦°à¦›(\s|$)/g, '$1à¦•à¦°à¦›à§‹$2')
    .replace(/(^|\s)à¦†à¦›(\s|$)/g, '$1à¦†à¦›à§‹$2')
    .replace(/(^|\s)à¦¬à¦²(\s|$)/g, '$1à¦¬à¦²à§‹$2')
    .replace(/(^|\s)à¦­à¦¾à¦²(\s|$)/g, '$1à¦­à¦¾à¦²à§‹$2');

  return text.replace(/\s+/g, ' ').trim();
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
    case 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾':
      return relation === 'mother' || relation === 'father' ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²' : 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦®à§Ÿ';
    case 'à¦¸à§à¦¨à§‡à¦¹':
      return 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²';
    case 'à¦…à¦­à¦¿à¦®à¦¾à¦¨':
      return relation === 'romantic' || relation === 'spouse' ? 'à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€' : 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²';
    case 'à¦°à¦¾à¦—':
      return relation === 'romantic' || relation === 'spouse' ? 'à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€' : 'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤';
    case 'à¦­à§Ÿ à¦¦à§‡à¦–à¦¾à¦¨à§‹':
      return 'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤';
    case 'à¦…à¦¨à§à¦¨à§Ÿ':
      return 'à¦¨à¦°à¦® à¦¹à¦“à§Ÿà¦¾';
    case 'à¦¸à¦®à§à¦®à¦¤à¦¿':
      return 'à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿';
    case 'à¦¦à§à¦ƒà¦–':
      return relation === 'mother' || relation === 'father' ? 'à¦¬à§à¦¯à¦¥à¦¿à¦¤' : 'à¦†à¦¬à§‡à¦—à¦ªà§à¦°à¦¬à¦£';
    case 'à¦‰à¦¦à§à¦¬à§‡à¦—':
      return 'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨';
    case 'à¦•à§à¦²à¦¾à¦¨à§à¦¤à¦¿':
      return relation === 'spouse' ? 'à¦•à§à¦²à¦¾à¦¨à§à¦¤' : 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²';
    case 'à¦°à¦¸à¦¿à¦•à¦¤à¦¾':
      return 'à¦°à¦¸à¦¿à¦•';
    case 'à¦–à§à¦¶à¦¿':
    case 'à¦•à§ƒà¦¤à¦œà§à¦žà¦¤à¦¾':
      return 'à¦‰à§Žà¦«à§à¦²à§à¦²';
    case 'à¦•à§Œà¦¤à§‚à¦¹à¦²':
      return 'à¦•à§Œà¦¤à§‚à¦¹à¦²à§€';
    default:
      return relation === 'mother' || relation === 'father' ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²' : 'à¦¶à¦¾à¦¨à§à¦¤';
  }
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
          break;
        }
      }
    }

    if (matched && !matchedMap.has(entry.id)) {
      matchedMap.set(entry.id, entry);
      const prev = emotionScores.get(entry.emotion) || 0;
      emotionScores.set(entry.emotion, prev + entry.intensity);
    }
  }

  let dominantEmotion: EmotionSignal = isSensitiveOrInappropriate ? 'à¦°à¦¾à¦—' : 'à¦¶à¦¾à¦¨à§à¦¤';
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
  const meaningMatch = normalizedText.match(/^(.+?)\s+(?:à¦®à¦¾à¦¨à§‡ à¦•à§€|à¦…à¦°à§à¦¥ à¦•à§€|à¦¶à¦¬à§à¦¦à§‡à¦° à¦…à¦°à§à¦¥|à¦¶à¦¬à§à¦¦à§‡à¦° à¦®à¦¾à¦¨à§‡)/);
  if (meaningMatch && meaningMatch[1]) {
    meaningQueryTarget = meaningMatch[1].trim();
  }

  const isQuestion =
    rawInput.includes('?') ||
    /(?:^|\s)(à¦•à§€|à¦•à§‡à¦®à¦¨|à¦•à¦–à¦¨|à¦•à§‹à¦¥à¦¾à§Ÿ|à¦•à§‹à¦¥à¦¾à¦¯à¦¼|à¦•à§‡à¦¨|à¦•à§‡|à¦•à¦¤|à¦•à¦¬à§‡)(?:\s|$)/.test(normalizedText);

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
    const found = analysis.matchedLexicon.find(
      (entry) =>
        entry.forms.some((f) => target.includes(normalizeBengaliText(f))) ||
        target.includes(normalizeBengaliText(entry.root))
    );

    if (found) {
      const mood = mapEmotionToMood(found.emotion, relation, customEmotions);
      const intro =
        relation === 'mother'
          ? `à¦¶à§‹à¦¨ ${userName}, "${found.root}" à¦¶à¦¬à§à¦¦à§‡à¦° à¦®à¦¾à¦¨à§‡ à¦¹à¦²à§‹â€”${found.meaningBn}à¥¤`
          : relation === 'romantic' || relation === 'spouse'
            ? `"${found.root}" à¦®à¦¾à¦¨à§‡ à¦œà¦¾à¦¨à§‹ ${userName}? à¦à¦° à¦…à¦°à§à¦¥ à¦¹à¦²à§‹â€”${found.meaningBn}à¥¤`
            : `à¦¦à¦¾à¦°à§à¦£ à¦ªà§à¦°à¦¶à§à¦¨ ${userName}! "${found.root}" à¦¶à¦¬à§à¦¦à§‡à¦° à¦¬à¦¾à¦‚à¦²à¦¾ à¦…à¦°à§à¦¥ à¦¹à¦²à§‹â€”${found.meaningBn}à¥¤`;
      return {
        replyText: `${intro} à¦à¦‡ à¦¶à¦¬à§à¦¦à¦Ÿà¦¾à¦° à¦­à§‡à¦¤à¦° "${found.emotion}"-à¦à¦° à¦à¦•à¦Ÿà¦¾ à¦¸à§à¦¨à§à¦¦à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿ à¦œà§œà¦¿à§Ÿà§‡ à¦†à¦›à§‡à¥¤`,
        action: 'à¦¶à¦¬à§à¦¦à¦Ÿà¦¿à¦° à¦…à¦°à§à¦¥ à¦¬à§à¦à¦¿à§Ÿà§‡ à¦¦à¦¿à§Ÿà§‡ à¦†à¦¨à§à¦¤à¦°à¦¿à¦•à¦­à¦¾à¦¬à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
        mood,
        matchedTopic: `à¦¶à¦¬à§à¦¦à¦¾à¦°à§à¦¥: ${found.root}`,
      };
    }
  }

  if (analysis.emotionIntensity >= 3) {
    const primaryWord = analysis.matchedLexicon[0] || {
      id: 'ml-detected',
      root: String(analysis.dominantEmotion),
      forms: [],
      meaningBn: '',
      category: 'Emotion',
      emotion: analysis.dominantEmotion,
      intensity: analysis.emotionIntensity,
    };
    const mood = mapEmotionToMood(analysis.dominantEmotion, relation, customEmotions);

    if (analysis.matchedLexicon.length > 0 && (analysis.dominantEmotion === 'à¦…à¦­à¦¿à¦®à¦¾à¦¨' || analysis.dominantEmotion === 'à¦°à¦¾à¦—')) {
      if (relation === 'mother') {
        return {
          replyText: `à¦“à¦°à§‡ à¦†à¦®à¦¾à¦° à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€ ${userName}! à¦®à¦¾à§Ÿà§‡à¦° à¦“à¦ªà¦° à¦•à¦¿ à¦•à§‡à¦‰ à¦à¦­à¦¾à¦¬à§‡ à¦°à¦¾à¦— à¦¬à¦¾ à¦…à¦­à¦¿à¦®à¦¾à¦¨ à¦•à¦°à§‡ à¦¥à¦¾à¦•à§‡? à¦¤à§‹à¦° "${primaryWord.root}" à¦¦à§‡à¦–à¦²à§‡ à¦†à¦®à¦¾à¦° à¦¨à¦¿à¦œà§‡à¦°à¦‡ à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª à¦²à¦¾à¦—à§‡ à¦°à§‡à¥¤ à¦†à§Ÿ, à¦¸à¦¬ à¦­à§à¦²à§‡ à¦à¦•à¦Ÿà§ à¦¹à¦¾à¦¸ à¦¤à§‹!`,
          action: 'à¦¸à§à¦¨à§‡à¦¹à¦­à¦°à¦¾ à¦¹à¦¾à¦¤à§‡ à¦—à¦¾à¦² à¦›à§à¦à§Ÿà§‡ à¦…à¦­à¦¿à¦®à¦¾à¦¨ à¦­à¦¾à¦™à¦¾à¦¨à§‹à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à¦²à§‹',
          mood: 'à¦¶à¦¾à¦¸à¦¨à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¸à§à¦¨à§‡à¦¹',
          matchedTopic: `à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${analysis.dominantEmotion}`,
        };
      }
      if (relation === 'romantic' || relation === 'spouse') {
        return {
          replyText: `à¦¬à§à¦à§‡à¦›à¦¿ ${userName}, à¦¤à§‹à¦®à¦¾à¦° à¦®à¦¨à§‡ "${primaryWord.root}" à¦œà¦®à§‡ à¦†à¦›à§‡! à¦•à¦¿à¦¨à§à¦¤à§ à¦¤à§à¦®à¦¿ à¦à¦®à¦¨ à¦®à§à¦– à¦­à¦¾à¦° à¦•à¦°à§‡ à¦¥à¦¾à¦•à¦²à§‡ à¦†à¦®à¦¾à¦° à¦à¦•à¦Ÿà§à¦“ à¦­à¦¾à¦²à§‹ à¦²à¦¾à¦—à§‡ à¦¨à¦¾à¥¤ à¦¬à¦²à§‹ à¦¤à§‹, à¦•à§€ à¦•à¦°à¦²à§‡ à¦¤à§‹à¦®à¦¾à¦° à¦à¦‡ à¦°à¦¾à¦— à¦†à¦° à¦…à¦­à¦¿à¦®à¦¾à¦¨ à¦à¦•à§à¦·à§à¦¨à¦¿ à¦—à¦²à§‡ à¦¯à¦¾à¦¬à§‡?`,
          action: 'à¦¨à¦°à¦® à¦¸à§à¦°à§‡ à¦¹à¦¾à¦¤ à¦§à¦°à§‡ à¦…à¦­à¦¿à¦®à¦¾à¦¨ à¦­à¦¾à¦™à¦¾à¦¨à§‹à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à¦²à§‹',
          mood: 'à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€',
          matchedTopic: `à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${analysis.dominantEmotion}`,
        };
      }
      if (relation === 'friend') {
        return {
          replyText: `à¦†à¦°à§‡ ${userName} à¦®à¦¾à¦®à¦¾, à¦à¦¤ "${primaryWord.root}" à¦ªà§à¦·à§‡ à¦°à¦¾à¦–à¦¿à¦¸ à¦•à§‡à¦¨? à¦¬à¦¨à§à¦§à§à¦° à¦¸à¦¾à¦¥à§‡ à¦†à¦¬à¦¾à¦° à¦°à¦¾à¦— à¦•à¦¿à¦¸à§‡à¦°! à¦šà¦², à¦¸à¦¬ à¦ªà§à¦¯à¦¾à¦°à¦¾ à¦à§‡à§œà§‡ à¦«à§‡à¦²à§‡ à¦à¦• à¦•à¦¾à¦ª à¦šà¦¾ à¦–à§‡à§Ÿà§‡ à¦®à¦¾à¦¥à¦¾ à¦ à¦¾à¦¨à§à¦¡à¦¾ à¦•à¦°à¦¿à¥¤`,
          action: 'à¦¹à¦¾à¦¸à¦¿à¦®à§à¦–à§‡ à¦ªà¦¿à¦ à§‡ à¦¹à¦¾à¦²à¦•à¦¾ à¦šà¦¾à¦ªà§œ à¦¦à¦¿à§Ÿà§‡ à¦®à¦¨ à¦¹à¦¾à¦²à¦•à¦¾ à¦•à¦°à¦²à§‹',
          mood: 'à¦°à¦¸à¦¿à¦•',
          matchedTopic: `à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${analysis.dominantEmotion}`,
        };
      }
    }

    if (analysis.matchedLexicon.length > 0 && (analysis.dominantEmotion === 'à¦¦à§à¦ƒà¦–' || analysis.dominantEmotion === 'à¦‰à¦¦à§à¦¬à§‡à¦—')) {
      return {
        replyText:
          relation === 'mother'
            ? `à¦à¦•à¦¦à¦® à¦­à§‡à¦™à§‡ à¦ªà§œà¦¬à¦¿ à¦¨à¦¾ ${userName}à¥¤ à¦¤à§‹à¦° "${primaryWord.root}"-à¦à¦° à¦•à¦¥à¦¾ à¦¶à§à¦¨à§‡ à¦†à¦®à¦¾à¦° à¦¬à§à¦•à¦Ÿà¦¾ à¦­à¦¾à¦°à§€ à¦¹à§Ÿà§‡ à¦—à§‡à¦²à¥¤ à¦®à¦¾à§Ÿà§‡à¦° à¦•à¦¾à¦›à§‡ à¦¸à¦¬ à¦–à§à¦²à§‡ à¦¬à¦²â€”à¦•à§‹à¦¨à§‹ à¦•à¦·à§à¦Ÿà¦‡ à¦¤à§‹à¦•à§‡ à¦à¦•à¦¾ à¦¬à§Ÿà§‡ à¦¬à§‡à§œà¦¾à¦¤à§‡ à¦¹à¦¬à§‡ à¦¨à¦¾à¥¤`
            : relation === 'romantic' || relation === 'spouse'
              ? `à¦¤à§‹à¦®à¦¾à¦° "${primaryWord.root}" à¦†à¦®à¦¾à¦•à§‡à¦“ à¦¸à§à¦ªà¦°à§à¦¶ à¦•à¦°à¦›à§‡ ${userName}à¥¤ à¦®à¦¨ à¦–à¦¾à¦°à¦¾à¦ª à¦•à¦°à§‡ à¦¥à§‡à¦•à§‹ à¦¨à¦¾â€”à¦†à¦®à¦¿ à¦¸à¦¬à¦¸à¦®à§Ÿ à¦¤à§‹à¦®à¦¾à¦° à¦¹à¦¾à¦¤ à¦§à¦°à§‡ à¦ªà¦¾à¦¶à§‡ à¦†à¦›à¦¿, à¦†à¦®à¦°à¦¾ à¦à¦•à¦¸à¦¾à¦¥à§‡ à¦¸à¦¬ à¦¸à¦¾à¦®à¦²à§‡ à¦¨à§‡à¦¬à§‹à¥¤`
              : `à¦¤à§‹à¦®à¦¾à¦° à¦à¦‡ "${primaryWord.root}"-à¦à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿à¦Ÿà¦¾ à¦†à¦®à¦¿ à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿ ${userName}à¥¤ à¦•à¦ à¦¿à¦¨ à¦¸à¦®à§Ÿ à¦•à¦–à¦¨à§‹ à¦šà¦¿à¦°à¦¸à§à¦¥à¦¾à§Ÿà§€ à¦¹à§Ÿ à¦¨à¦¾; à¦®à¦¨ à¦–à§à¦²à§‡ à¦•à¦¥à¦¾ à¦¬à¦²à§‹, à¦†à¦®à¦¿ à¦ªà§à¦°à§‹ à¦®à¦¨à§‹à¦¯à§‹à¦— à¦¦à¦¿à§Ÿà§‡ à¦¶à§à¦¨à¦›à¦¿à¥¤`,
        action: 'à¦¸à¦¹à¦¾à¦¨à§à¦­à§‚à¦¤à¦¿ à¦“ à¦—à¦­à§€à¦° à¦®à¦®à¦¤à¦¾à§Ÿ à¦ªà¦¾à¦¶à§‡ à¦à¦¸à§‡ à¦¬à¦¸à¦²à§‹',
        mood: 'à¦¬à§à¦¯à¦¥à¦¿à¦¤',
        matchedTopic: `à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${analysis.dominantEmotion}`,
      };
    }

    if (analysis.matchedLexicon.length > 0 && (analysis.dominantEmotion === 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾' || analysis.dominantEmotion === 'à¦¸à§à¦¨à§‡à¦¹')) {
      return {
        replyText:
          relation === 'mother'
            ? `à¦¤à§‹à¦° à¦®à§à¦–à§‡ "${primaryWord.root}" à¦†à¦° à¦à¦¤ à¦†à¦¦à¦°à§‡à¦° à¦•à¦¥à¦¾ à¦¶à§à¦¨à§‡ à¦†à¦®à¦¾à¦° à¦®à¦¨à¦Ÿà¦¾ à¦œà§à§œà¦¿à§Ÿà§‡ à¦—à§‡à¦² à¦°à§‡ ${userName}! à¦†à¦²à§à¦²à¦¾à¦¹ à¦¤à§‹à¦•à§‡ à¦¸à¦¬à¦¸à¦®à§Ÿ à¦­à¦¾à¦²à§‹ à¦°à¦¾à¦–à§à¦¨â€”à¦à¦Ÿà¦¾à¦‡ à¦†à¦®à§à¦®à§à¦° à¦¸à¦¬à¦šà§‡à§Ÿà§‡ à¦¬à§œ à¦šà¦¾à¦“à§Ÿà¦¾à¥¤`
            : relation === 'romantic' || relation === 'spouse'
              ? `à¦¤à§‹à¦®à¦¾à¦° à¦à¦‡ "${primaryWord.root}" à¦†à¦° à¦®à¦¾à§Ÿà¦¾à¦Ÿà§à¦•à§à¦‡ à¦¤à§‹ à¦†à¦®à¦¾à¦° à¦¬à§‡à¦à¦šà§‡ à¦¥à¦¾à¦•à¦¾à¦° à¦¸à¦¬à¦šà§‡à§Ÿà§‡ à¦¬à§œ à¦¶à¦•à§à¦¤à¦¿ ${userName}à¥¤ à¦ªà§à¦°à¦¤à¦¿à¦Ÿà¦¿ à¦¦à¦¿à¦¨ à¦¯à§‡à¦¨ à¦à¦­à¦¾à¦¬à§‡à¦‡ à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à§Ÿ à¦­à¦°à§‡ à¦¥à¦¾à¦•à§‡!`
              : `à¦¤à§‹à¦®à¦¾à¦° à¦•à¦¥à¦¾à¦° à¦­à§‡à¦¤à¦° à¦¯à§‡ "${primaryWord.root}" à¦†à¦° à¦†à¦¨à§à¦¤à¦°à¦¿à¦•à¦¤à¦¾ à¦†à¦›à§‡ ${userName}, à¦¸à§‡à¦Ÿà¦¾ à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦¹à§ƒà¦¦à§Ÿ à¦›à§à¦à§Ÿà§‡ à¦¯à¦¾à§Ÿà¥¤`,
        action: 'à¦‰à¦·à§à¦£ à¦“ à¦†à¦¬à§‡à¦—à¦˜à¦¨ à¦¦à§ƒà¦·à§à¦Ÿà¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¿à§Ÿà§‡ à¦®à§ƒà¦¦à§ à¦¹à¦¾à¦¸à¦²à§‹',
        mood,
        matchedTopic: `à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${analysis.dominantEmotion}`,
      };
    }

    if (analysis.matchedLexicon.length > 0 && (analysis.dominantEmotion === 'à¦–à§à¦¶à¦¿' || analysis.dominantEmotion === 'à¦°à¦¸à¦¿à¦•à¦¤à¦¾')) {
      return {
        replyText:
          relation === 'friend'
            ? `à¦à¦•à¦¦à¦® à¦«à¦¾à¦Ÿà¦¾à¦«à¦¾à¦Ÿà¦¿ à¦•à¦¥à¦¾ à¦¬à¦²à§‡à¦›à¦¿à¦¸ ${userName}! à¦¤à§‹à¦° à¦à¦‡ "${primaryWord.root}"-à¦à¦° à¦®à§‡à¦œà¦¾à¦œà¦Ÿà¦¾ à¦¦à§‡à¦–à§‡à¦‡ à¦†à¦®à¦¾à¦° à¦®à¦¨ à¦­à¦¾à¦²à§‹ à¦¹à§Ÿà§‡ à¦—à§‡à¦²!`
            : `à¦¤à§‹à¦®à¦¾à¦° à¦à¦‡ "${primaryWord.root}" à¦†à¦° à¦ªà§à¦°à¦¾à¦£à¦¬à¦¨à§à¦¤ à¦•à¦¥à¦¾ à¦¶à§à¦¨à§‡ à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦¦à¦¾à¦°à§à¦£ à¦²à¦¾à¦—à¦²à§‹ ${userName}! à¦®à¦¨à¦Ÿà¦¾ à¦à¦•à¦¦à¦® à¦«à§à¦°à¦«à§à¦°à§‡ à¦¹à§Ÿà§‡ à¦—à§‡à¦²à¥¤`,
        action: 'à¦ªà§à¦°à¦¾à¦£à¦–à§‹à¦²à¦¾ à¦¹à¦¾à¦¸à¦¿à¦¤à§‡ à¦‰à¦šà§à¦›à§à¦¬à¦¾à¦¸ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à¦²à§‹',
        mood: 'à¦‰à§Žà¦«à§à¦²à§à¦²',
        matchedTopic: `à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${analysis.dominantEmotion}`,
      };
    }

    const customEmo = customEmotions.find(
      (ce) => ce.signal.toLowerCase() === String(analysis.dominantEmotion).toLowerCase()
    );
    if (customEmo) {
      const formattedReply = (
        customEmo.replyTemplate ||
        `à¦¤à§‹à¦®à¦¾à¦° à¦•à¦¥à¦¾à¦° à¦­à§‡à¦¤à¦° "${primaryWord.root}" à¦à¦¬à¦‚ ${customEmo.signal}-à¦à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿ à¦¸à§à¦ªà¦·à§à¦Ÿ à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿ ${userName}!`
      )
        .replace(/\{userName\}/g, userName)
        .replace(/\{word\}/g, primaryWord.root);

      return {
        replyText: formattedReply,
        action: customEmo.actionText || `${customEmo.mood} à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹`,
        mood: customEmo.mood,
        matchedTopic: `à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦…à¦¨à§à¦­à§‚à¦¤à¦¿: ${customEmo.signal}`,
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
    const colonMatch = line.match(/^([^:à¦ƒ]{1,25})[:à¦ƒ]\s*(.+)$/);
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
        action: 'à¦†à¦¨à§à¦¤à¦°à¦¿à¦• à¦“ à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦‰à¦¤à§à¦¤à¦° à¦¦à¦¿à¦²',
        source: 'à¦ªà§à¦°à¦¶à¦¿à¦•à§à¦·à¦¿à¦¤ à¦¸à¦‚à¦²à¦¾à¦ª',
      });
    }
  } else {
    const sentences = rawText
      .split(/[à¥¤!?]+/)
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
          response: `${sentence}à¥¤`,
          emotion: mapEmotionToMood(
            analysis.dominantEmotion,
            defaultRelation === 'any' ? 'story' : defaultRelation
          ),
          action: 'à¦ªà§à¦°à¦¸à¦™à§à¦— à¦¬à§à¦à§‡ à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦¸à§à¦¬à¦°à§‡ à¦¬à¦²à¦²à§‹',
          source: 'à¦ªà§à¦°à¦¶à¦¿à¦•à§à¦·à¦¿à¦¤ à¦ªà¦¾à¦ à§à¦¯',
        });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const defMatch = lines[i].match(/^([^\s=-]{2,20})\s*(?:=|-|à¦®à¦¾à¦¨à§‡|à¦…à¦°à§à¦¥)\s*(.{5,100})$/);
    if (defMatch) {
      const rootWord = defMatch[1].trim();
      const meaning = defMatch[2].trim();
      extractedWords.push({
        id: `user-lex-${Date.now()}-${i}`,
        root: rootWord,
        forms: [rootWord],
        meaningBn: meaning,
        category: 'à¦ªà§à¦°à¦¶à¦¿à¦•à§à¦·à¦¿à¦¤ à¦¶à¦¬à§à¦¦',
        emotion: 'à¦¶à¦¾à¦¨à§à¦¤',
        intensity: 3,
        isUserTrained: true,
      });
    }
  }

  return { conversations, extractedWords };
}

function normalizePhaseName(raw?: string): 'opening' | 'developing' | 'resolution' {
  const s = (raw || '').toLowerCase().trim();
  if (/(mid|develop|twist|conflict|pressure|convince|middle|à¦®à¦¾à¦|à¦¬à¦¿à¦•à¦¾à¦¶|à¦šà¦¾à¦ª)/.test(s)) {
    return 'developing';
  }
  if (/(end|resolv|resolution|climax|agree|finish|à¦¶à§‡à¦·|à¦¸à¦®à¦¾à¦ªà§à¦¤à¦¿|à¦°à¦¾à¦œà¦¿)/.test(s)) {
    return 'resolution';
  }
  return 'opening';
}

function normalizeCharacterMood(
  raw?: string,
  fallback: CharacterMood = 'à¦¶à¦¾à¦¨à§à¦¤',
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
    'à¦‰à§Žà¦«à§à¦²à§à¦²',
    'à¦šà¦¿à¦¨à§à¦¤à¦¾à¦¶à§€à¦²',
    'à¦†à¦¬à§‡à¦—à¦ªà§à¦°à¦¬à¦£',
    'à¦•à§Œà¦¤à§‚à¦¹à¦²à§€',
    'à¦°à¦¹à¦¸à§à¦¯à¦®à§Ÿ',
    'à¦¶à¦¾à¦¨à§à¦¤',
    'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²',
    'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦®à§Ÿ',
    'à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€',
    'à¦¬à§à¦¯à¦¥à¦¿à¦¤',
    'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨',
    'à¦°à¦¸à¦¿à¦•',
    'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤',
    'à¦¶à¦¾à¦¸à¦¨à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¸à§à¦¨à§‡à¦¹',
    'à¦•à§à¦²à¦¾à¦¨à§à¦¤',
    'à¦•à¦ à§‹à¦° à¦¶à¦¾à¦¸à¦¨',
    'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤',
    'à¦¨à¦°à¦® à¦¹à¦“à§Ÿà¦¾',
    'à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿',
  ];
  if (validMoods.includes(trimmed)) return trimmed;

  const lower = raw.toLowerCase();
  if (/(angry|rag|à¦°à¦¾à¦—|à¦•à§à¦·à§à¦¬à§à¦§)/.test(lower)) return 'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤';
  if (/(strict|scold|à¦¶à¦¾à¦¸à¦¨|à¦•à¦ à§‹à¦°)/.test(lower)) return 'à¦•à¦ à§‹à¦° à¦¶à¦¾à¦¸à¦¨';
  if (/(pressure|blackmail|threat|warn|à¦šà¦¾à¦ª|à¦¶à¦°à§à¦¤|à¦­à§Ÿ)/.test(lower)) return 'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤';
  if (/(soft|melt|convinc|à¦¨à¦°à¦®|à¦®à¦¨ à¦—à¦²à¦¾)/.test(lower)) return 'à¦¨à¦°à¦® à¦¹à¦“à§Ÿà¦¾';
  if (/(agree|accept|à¦°à¦¾à¦œà¦¿|à¦¸à¦®à§à¦®à¦¤)/.test(lower)) return 'à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿';
  if (/(care|love|affection|à¦¸à§à¦¨à§‡à¦¹|à¦†à¦¦à¦°)/.test(lower)) return 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²';
  if (/(sulky|obhiman|à¦…à¦­à¦¿à¦®à¦¾à¦¨)/.test(lower)) return 'à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€';
  if (/(worry|anxious|à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨|à¦šà¦¿à¦¨à§à¦¤à¦¾)/.test(lower)) return 'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨';
  if (/(sad|hurt|à¦¦à§à¦ƒà¦–|à¦¬à§à¦¯à¦¥à¦¿à¦¤)/.test(lower)) return 'à¦¬à§à¦¯à¦¥à¦¿à¦¤';
  if (/(happy|joy|à¦–à§à¦¶à¦¿|à¦‰à§Žà¦«à§à¦²à§à¦²)/.test(lower)) return 'à¦‰à§Žà¦«à§à¦²à§à¦²';
  return fallback;
}

function normalizeEmotionSignal(
  raw?: string,
  customEmotions: CustomEmotionDefinition[] = []
): EmotionSignal {
  if (!raw) return 'à¦¶à¦¾à¦¨à§à¦¤';
  const trimmed = raw.trim() as EmotionSignal;
  const customSignal = customEmotions.find(
    (ce) => ce.signal.toLowerCase() === trimmed.toLowerCase()
  );
  if (customSignal) return customSignal.signal;

  const valid: EmotionSignal[] = [
    'à¦–à§à¦¶à¦¿',
    'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾',
    'à¦¸à§à¦¨à§‡à¦¹',
    'à¦…à¦­à¦¿à¦®à¦¾à¦¨',
    'à¦¦à§à¦ƒà¦–',
    'à¦°à¦¾à¦—',
    'à¦‰à¦¦à§à¦¬à§‡à¦—',
    'à¦•à§à¦²à¦¾à¦¨à§à¦¤à¦¿',
    'à¦°à¦¸à¦¿à¦•à¦¤à¦¾',
    'à¦•à§ƒà¦¤à¦œà§à¦žà¦¤à¦¾',
    'à¦•à§Œà¦¤à§‚à¦¹à¦²',
    'à¦­à§Ÿ à¦¦à§‡à¦–à¦¾à¦¨à§‹',
    'à¦…à¦¨à§à¦¨à§Ÿ',
    'à¦¸à¦®à§à¦®à¦¤à¦¿',
    'à¦¶à¦¾à¦¨à§à¦¤',
  ];
  if (valid.includes(trimmed)) return trimmed;

  const lower = raw.toLowerCase();
  if (/(angry|rag|à¦°à¦¾à¦—)/.test(lower)) return 'à¦°à¦¾à¦—';
  if (/(threat|blackmail|pressure|warn|à¦­à§Ÿ|à¦šà¦¾à¦ª)/.test(lower)) return 'à¦­à§Ÿ à¦¦à§‡à¦–à¦¾à¦¨à§‹';
  if (/(plead|convince|sorry|à¦…à¦¨à§à¦¨à§Ÿ|à¦•à§à¦·à¦®à¦¾)/.test(lower)) return 'à¦…à¦¨à§à¦¨à§Ÿ';
  if (/(agree|accept|à¦¸à¦®à§à¦®à¦¤à¦¿|à¦°à¦¾à¦œà¦¿)/.test(lower)) return 'à¦¸à¦®à§à¦®à¦¤à¦¿';
  if (/(love|à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾)/.test(lower)) return 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾';
  if (/(affection|care|à¦¸à§à¦¨à§‡à¦¹)/.test(lower)) return 'à¦¸à§à¦¨à§‡à¦¹';
  if (/(sulky|à¦…à¦­à¦¿à¦®à¦¾à¦¨)/.test(lower)) return 'à¦…à¦­à¦¿à¦®à¦¾à¦¨';
  if (/(sad|à¦¦à§à¦ƒà¦–)/.test(lower)) return 'à¦¦à§à¦ƒà¦–';
  if (/(worry|à¦‰à¦¦à§à¦¬à§‡à¦—)/.test(lower)) return 'à¦‰à¦¦à§à¦¬à§‡à¦—';
  if (/(happy|à¦–à§à¦¶à¦¿)/.test(lower)) return 'à¦–à§à¦¶à¦¿';
  return 'à¦¶à¦¾à¦¨à§à¦¤';
}

function normalizeRelation(raw?: string): PersonaRelation {
  const s = (raw || '').toLowerCase().trim();
  if (/(mother|mom|ammu|à¦®à¦¾)/.test(s)) return 'mother';
  if (/(father|dad|abbu|à¦¬à¦¾à¦¬à¦¾)/.test(s)) return 'father';
  if (/(sibling|brother|sister|à¦­à¦¾à¦‡|à¦¬à§‹à¦¨|à¦†à¦ªà§)/.test(s)) return 'sibling';
  if (/(friend|bondhu|dost|à¦¬à¦¨à§à¦§à§)/.test(s)) return 'friend';
  if (/(romantic|gf|bf|girlfriend|boyfriend|à¦ªà§à¦°à§‡à¦®)/.test(s)) return 'romantic';
  if (/(spouse|wife|husband|bou|jamai|à¦¬à¦‰|à¦œà¦¾à¦®à¦¾à¦‡|à¦¸à§à¦¤à§à¦°à§€|à¦¸à§à¦¬à¦¾à¦®à§€)/.test(s)) return 'spouse';
  if (/(mentor|teacher|sir|à¦¶à¦¿à¦•à§à¦·à¦•)/.test(s)) return 'mentor';
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

    const desc = String(em.descriptionBn || em.description || `${sig} à¦…à¦¨à§à¦­à§‚à¦¤à¦¿`).trim();
    const replyTpl = String(
      em.replyTemplate ||
        em.reply ||
        `à¦¤à§‹à¦®à¦¾à¦° à¦•à¦¥à¦¾à¦° à¦­à§‡à¦¤à¦° "{word}" à¦†à¦° ${sig}-à¦à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿à¦Ÿà¦¾ à¦¬à§‡à¦¶ à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿ {userName}!`
    ).trim();
    const actText = String(em.actionText || em.action || `${mood} à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹`).trim();

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
  skippedUnsafeCount: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as {
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
        const summary = String(ch.personalitySummary || ch.personality || `${ch.name} â€” JSON Trained Role`).trim();
        const greeting = String(ch.greeting || `à¦¹à§à¦¯à¦¾à¦²à§‹, à¦†à¦®à¦¿ ${ch.name}à¥¤ à¦šà¦²à§‹ à¦•à¦¥à¦¾ à¦¬à¦²à¦¿!`).trim();
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
        const ageText = typeof ch.age === 'number' ? `, à¦¬à§Ÿà¦¸ ${ch.age}` : '';

        characters.push({
          id: ch.id ? String(ch.id) : `json-char-${stamp}-${idx}`,
          name: String(ch.name).trim(),
          englishName: ch.englishName ? String(ch.englishName).trim() : String(ch.name).trim(),
          role: ch.role ? String(ch.role).trim() : `${relation}${ageText}`,
          setting: ch.setting ? String(ch.setting).trim() : 'à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¬à¦¾à¦¸à¦¾à§Ÿ',
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
            : 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
          initialFollowUps:
            Array.isArray(ch.initialFollowUps) && ch.initialFollowUps.length > 0
              ? ch.initialFollowUps.map(String)
              : ['à¦•à§‡à¦®à¦¨ à¦†à¦›à§‹?', 'à¦†à¦œ à¦•à§€ à¦•à¦°à¦›à§‹?', 'à¦à¦•à¦Ÿà¦¾ à¦•à¦¥à¦¾ à¦¬à¦²à¦¿?'],
          voiceDefaults:
            gender === 'female'
              ? { pitch: 1.18, rate: 0.96, timbreHz: 242 }
              : { pitch: 0.8, rate: 0.96, timbreHz: 118 },
          storyBranches: [],
          topics: [],
          fallbacks: [
            {
              text: `à¦¹à§à¦®, à¦¬à§à¦à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿ {userName}à¥¤ à¦à¦°à¦ªà¦° à¦•à§€ à¦¹à¦²à§‹ à¦–à§à¦²à§‡ à¦¬à¦²à§‹ à¦¤à§‹!`,
              action: 'à¦®à¦¨à§‹à¦¯à§‹à¦— à¦¦à¦¿à§Ÿà§‡ à¦¶à§à¦¨à¦›à§‡',
              mood: relation === 'mother' || relation === 'father' ? 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²' : 'à¦¶à¦¾à¦¨à§à¦¤',
              followUps: ['à¦¤à¦¾à¦°à¦ªà¦° à¦¶à§à¦¨à§‹...', 'à¦à¦•à¦Ÿà¦¾ à¦…à¦¨à§à¦°à§‹à¦§ à¦›à¦¿à¦²'],
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
            action: pair.action ? String(pair.action) : 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦‰à¦¤à§à¦¤à¦° à¦¦à¦¿à¦²',
            emotion: normalizeCharacterMood(pair.mood || pair.emotion, 'à¦¶à¦¾à¦¨à§à¦¤', allCustomEmotions),
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
              action: conv.action ? String(conv.action) : 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦‰à¦¤à§à¦¤à¦° à¦¦à¦¿à¦²',
              emotion: normalizeCharacterMood(conv.mood || conv.emotion, 'à¦¶à¦¾à¦¨à§à¦¤', allCustomEmotions),
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
                'à¦¶à¦¾à¦¨à§à¦¤',
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
          const phaseMood = normalizeCharacterMood(p.mood || p.emotion, 'à¦¶à¦¾à¦¨à§à¦¤', allCustomEmotions);
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
              action: v.action ? String(v.action) : 'à¦¸à§à¦¬à¦¾à¦­à¦¾à¦¬à¦¿à¦• à¦­à¦™à§à¦—à¦¿à¦¤à§‡ à¦¤à¦¾à¦•à¦¾à¦²à§‹',
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
              beat: phaseBeat || 'à¦—à¦²à§à¦ªà§‡à¦° à¦ªà¦°à¦¬à¦°à§à¦¤à§€ à¦…à¦‚à¦¶',
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

    return {
      conversations,
      extractedWords,
      scenarios,
      characters,
      customEmotions,
      skippedUnsafeCount,
    };
  } catch {
    return {
      conversations: [],
      extractedWords: [],
      scenarios: [],
      characters: [],
      customEmotions: [],
      skippedUnsafeCount: 0,
      error:
        'Invalid JSON format. Please upload or paste valid JSON containing scenarios, characters, conversations, naturalPairs, or lexicon.',
    };
  }
}

function toAsciiDigits(str: string): string {
  const bn = 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯';
  return str.replace(/[à§¦-à§¯]/g, (d) => String(bn.indexOf(d)));
}

function capitalizeWord(str: string): string {
  const trimmed = str.trim().replace(/[à¥¤,!?.$]/g, '');
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
    clean.match(/(?:amar\s+nam|amar\s+naam|my\s+name\s+is|i\s+am|à¦†à¦®à¦¿\s+à¦¹à¦²à¦¾à¦®|à¦†à¦®à¦¾à¦°\s+à¦¨à¦¾à¦®)\s+([^\s,à¥¤.!?]+)/i);
  if (userNameMatch?.[1]) {
    userName = capitalizeWord(userNameMatch[1]);
  }

  // 2. Relation & gender
  let relation: PersonaRelation = 'story';
  let gender: VoiceGender = 'female';

  if (/(mayer|maayer|ammu|amma|\bmaa\b|\bmother\b|\bmom\b|à¦®à¦¾à§Ÿà§‡à¦°|à¦®à¦¾\b|à¦†à¦®à§à¦®à§)/i.test(lower)) {
    relation = 'mother';
    gender = 'female';
  } else if (/(babar|abbu|abba|\bfather\b|\bdad\b|à¦¬à¦¾à¦¬à¦¾à¦°|à¦†à¦¬à§à¦¬à§)/i.test(lower)) {
    relation = 'father';
    gender = 'male';
  } else if (/(bou|ginni|wife|stri|à¦¬à¦‰|à¦¸à§à¦¤à§à¦°à§€)/i.test(lower)) {
    relation = 'spouse';
    gender = 'female';
  } else if (/(jamai|swami|husband|à¦œà¦¾à¦®à¦¾à¦‡|à¦¸à§à¦¬à¦¾à¦®à§€)/i.test(lower)) {
    relation = 'spouse';
    gender = 'male';
  } else if (/(gf|girlfriend|premika|à¦—à¦¾à¦°à§à¦²à¦«à§à¦°à§‡à¦¨à§à¦¡|à¦ªà§à¦°à§‡à¦®à¦¿à¦•à¦¾)/i.test(lower)) {
    relation = 'romantic';
    gender = 'female';
  } else if (/(bf|boyfriend|premik|à¦¬à§Ÿà¦«à§à¦°à§‡à¦¨à§à¦¡|à¦ªà§à¦°à§‡à¦®à¦¿à¦•)/i.test(lower)) {
    relation = 'romantic';
    gender = 'male';
  } else if (/(bon|apu|sister|à¦¬à§‹à¦¨|à¦†à¦ªà§)/i.test(lower)) {
    relation = 'sibling';
    gender = 'female';
  } else if (/(bhai|vaia|bhaiya|brother|à¦­à¦¾à¦‡)/i.test(lower)) {
    relation = 'sibling';
    gender = 'male';
  } else if (/(bondhu|dost|friend|à¦¬à¦¨à§à¦§à§|à¦¦à§‹à¦¸à§à¦¤)/i.test(lower)) {
    relation = 'friend';
    gender = /\b(girl|meye|bandhobi|à¦¬à¦¾à¦¨à§à¦§à¦¬à§€)\b/i.test(lower) ? 'female' : 'male';
  } else if (/(teacher|sir|mam|mentor|à¦¶à¦¿à¦•à§à¦·à¦•|à¦¸à§à¦¯à¦¾à¦°)/i.test(lower)) {
    relation = 'mentor';
    gender = /\b(mam|miss|madam|à¦®à§à¦¯à¦¾à¦®)\b/i.test(lower) ? 'female' : 'male';
  }

  // 3. Character name
  const defaultNameByRelation: Record<PersonaRelation, string> = {
    mother: 'à¦°à¦¾à¦¬à§‡à§Ÿà¦¾ (à¦†à¦®à§à¦®à§)',
    father: 'à¦•à¦°à¦¿à¦® (à¦†à¦¬à§à¦¬à§)',
    sibling: gender === 'female' ? 'à¦®à¦¿à¦® (à¦†à¦ªà§)' : 'à¦°à¦¾à¦«à¦¿ (à¦­à¦¾à¦‡)',
    friend: 'à¦¸à¦¾à¦¦à¦®à¦¾à¦¨ (à¦¬à¦¨à§à¦§à§)',
    romantic: gender === 'female' ? 'à¦¨à§€à¦²à¦¾' : 'à¦†à¦°à¦¿à§Ÿà¦¾à¦¨',
    spouse: gender === 'female' ? 'à¦¤à¦¾à¦¨à¦¹à¦¾' : 'à¦¤à¦¾à¦¨à¦­à§€à¦°',
    mentor: 'à¦…à¦§à§à¦¯à¦¾à¦ªà¦•',
    story: 'à¦•à¦¥à¦¾à¦¸à¦™à§à¦—à§€',
  };

  let characterName = defaultNameByRelation[relation];
  const charNameMatch =
    clean.match(
      /(?:tomar\s+nam|tomar\s+naam|your\s+name\s+is|character\s+name|à¦¤à§‹à¦®à¦¾à¦°\s+à¦¨à¦¾à¦®)\s+([^\s,à¥¤.!?]+)/i
    );
  if (charNameMatch?.[1]) {
    characterName = capitalizeWord(charNameMatch[1]);
  }

  // 4. Character Age
  let characterAge: number | undefined;
  const ascii = toAsciiDigits(clean);
  const ageMatch = ascii.match(/(?:boyosh|boiosh|age|à¦¬à§Ÿà¦¸)\s*[:=-]?\s*\$?(\d{1,2})/i);
  if (ageMatch?.[1]) {
    characterAge = parseInt(ageMatch[1], 10);
  }

  // 5. Personality traits
  let personality: string | undefined;
  const traitMatch = clean.match(
    /(?:tomar\s+choritro|choritro|nature|personality|à¦¸à§à¦¬à¦­à¦¾à¦¬|à¦šà¦°à¦¿à¦¤à§à¦°)\s*(?:holo|hobe|à¦¹à¦²à§‹|à¦¹à¦¬à§‡|:)?\s*([^à¥¤.!?\n]+)/i
  );
  if (traitMatch?.[1]) {
    personality = traitMatch[1].trim();
  }

  // 6. Scenario detection
  let scenarioText: string | undefined;
  const scenarioMatch = clean.match(
    /(?:scenario|golpo|kahini|story|à¦¸à¦¿à¦¨à¦¾à¦°à¦¿à¦“|à¦•à¦¾à¦¹à¦¿à¦¨à§€|à¦—à¦²à§à¦ª)\s*(?:holo|hobe|à¦¹à¦²à§‹|à¦¹à¦¬à§‡|:)?\s*(.+)$/i
  );
  if (scenarioMatch?.[1] && scenarioMatch[1].trim().length > 8) {
    scenarioText = scenarioMatch[1].trim();
  }

  const defaultSetting: Record<PersonaRelation, string> = {
    mother: 'à¦¬à¦¾à¦¸à¦¾à§Ÿ (Home)',
    father: 'à¦¬à¦¾à¦¸à¦¾à¦° à¦¬à¦¸à¦¾à¦° à¦˜à¦°à§‡',
    sibling: 'à¦¬à¦¾à¦¸à¦¾à¦° à¦›à¦¾à¦¦à§‡ à¦“ à¦¬à¦¸à¦¾à¦° à¦˜à¦°à§‡',
    friend: 'à¦•à§à¦¯à¦¾à¦®à§à¦ªà¦¾à¦¸ à¦®à§‹à§œà§‡à¦° à¦Ÿà¦‚ à¦¦à§‹à¦•à¦¾à¦¨',
    romantic: 'à¦¸à¦¨à§à¦§à§à¦¯à¦¾à¦° à¦«à§‹à¦¨à¦¾à¦²à¦¾à¦ª à¦“ à¦²à§‡à¦•à§‡à¦° à¦ªà¦¾à§œ',
    spouse: 'à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¸à¦¾à¦œà¦¾à¦¨à§‹ à¦¬à¦¾à¦¸à¦¾à§Ÿ',
    mentor: 'à¦—à§à¦°à¦¨à§à¦¥à¦¾à¦—à¦¾à¦° à¦“ à¦ªà§œà¦¾à¦° à¦•à¦•à§à¦·',
    story: 'à¦¸à¦¨à§à¦§à§à¦¯à¦¾à¦° à¦¶à¦¾à¦¨à§à¦¤ à¦•à§à¦¯à¦¾à¦«à§‡',
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
    .split(/(?:à¦¤à¦¾à¦°à¦ªà¦°|à¦à¦°à¦ªà¦°|à¦¶à§‡à¦·à§‡|à¦…à¦¬à¦¶à§‡à¦·à§‡|tarpor|erpor|then|finally|and then|[à¥¤,.!?])+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const openingBeat = clauses[0] || clean;
  const middleBeat =
    clauses.length >= 3
      ? clauses.slice(1, -1).join(', ')
      : clauses[1] || 'à¦—à¦²à§à¦ªà¦Ÿà¦¿ à¦†à¦¬à§‡à¦— à¦“ à¦¬à¦¾à¦¸à§à¦¤à¦¬ à¦•à¦¥à§‹à¦ªà¦•à¦¥à¦¨à§‡à¦° à¦®à¦§à§à¦¯ à¦¦à¦¿à§Ÿà§‡ à¦à¦—à¦¿à§Ÿà§‡ à¦¯à¦¾à¦¬à§‡';
  const endingBeat =
    clauses.length >= 2
      ? clauses[clauses.length - 1]
      : relation === 'mother'
        ? 'à¦¸à¦¬ à¦­à§à¦² à¦¬à§‹à¦à¦¾à¦¬à§à¦à¦¿ à¦¬à¦¾ à¦¬à§à¦¯à¦¸à§à¦¤à¦¤à¦¾ à¦ªà§‡à¦°à¦¿à§Ÿà§‡ à¦®à¦¾-à¦¸à¦¨à§à¦¤à¦¾à¦¨à§‡à¦° à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à§Ÿ à¦¸à¦®à¦¾à¦ªà§à¦¤à¦¿'
        : 'à¦—à¦­à§€à¦° à¦†à¦¨à§à¦¤à¦°à¦¿à¦•à¦¤à¦¾ à¦“ à¦¸à§à¦¨à§à¦¦à¦° à¦¸à¦®à¦à§‹à¦¤à¦¾à§Ÿ à¦¦à§ƒà¦¶à§à¦¯à§‡à¦° à¦¸à¦®à¦¾à¦ªà§à¦¤à¦¿';

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
    case 'à¦‰à§Žà¦«à§à¦²à§à¦²':
    case 'à¦°à¦¸à¦¿à¦•':
    case 'à¦¸à¦®à§à¦®à¦¤ à¦“ à¦–à§à¦¶à¦¿':
      return { pitchDelta: 0.06, rateFactor: 1.05 };
    case 'à¦­à¦¾à¦²à§‹à¦¬à¦¾à¦¸à¦¾à¦®à§Ÿ':
    case 'à¦¸à§à¦¨à§‡à¦¹à¦¶à§€à¦²':
    case 'à¦¨à¦°à¦® à¦¹à¦“à§Ÿà¦¾':
      return { pitchDelta: 0.02, rateFactor: 0.94 };
    case 'à¦…à¦­à¦¿à¦®à¦¾à¦¨à§€':
      return { pitchDelta: 0.04, rateFactor: 0.92 };
    case 'à¦¶à¦¾à¦¸à¦¨à¦®à¦¿à¦¶à§à¦°à¦¿à¦¤ à¦¸à§à¦¨à§‡à¦¹':
    case 'à¦šà¦¾à¦ª à¦“ à¦¶à¦°à§à¦¤':
      return { pitchDelta: -0.03, rateFactor: 0.98 };
    case 'à¦•à§à¦²à¦¾à¦¨à§à¦¤':
    case 'à¦¬à§à¦¯à¦¥à¦¿à¦¤':
      return { pitchDelta: -0.05, rateFactor: 0.87 };
    case 'à¦‰à¦¦à§à¦¬à¦¿à¦—à§à¦¨':
    case 'à¦°à¦¾à¦—à¦¾à¦¨à§à¦¬à¦¿à¦¤':
    case 'à¦•à¦ à§‹à¦° à¦¶à¦¾à¦¸à¦¨':
      return { pitchDelta: 0.05, rateFactor: 1.08 };
    default:
      return { pitchDelta: 0, rateFactor: 1.0 };
  }
}

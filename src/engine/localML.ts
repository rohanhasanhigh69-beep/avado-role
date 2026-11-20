import { BENGALI_LEXICON } from '../data/bengaliLexicon';
import { DATASET_NATURAL_PAIRS } from '../data/trainedNaturalDataset';
import {
  CharacterMood,
  CustomEmotionDefinition,
  EmotionSignal,
  LexiconEntry,
  MLFeedbackSample,
  MLModelStats,
  MLSelfLearnedPattern,
  TrainedConversationItem,
  TrainedScenario,
} from '../types/roleplay';
import {
  mapEmotionToMood,
  normalizeBengaliText,
  stemBengaliWord,
} from './localIntelligence';

const ML_STOP_WORDS = new Set([
  'আমি',
  'তুমি',
  'তুই',
  'আপনি',
  'আমার',
  'তোমার',
  'তোর',
  'এই',
  'ওই',
  'একটা',
  'একটু',
  'কী',
  'কি',
  'হয়',
  'হয়ে',
  'আছে',
  'আছি',
  'আর',
  'ও',
  'না',
  'তো',
  'যে',
  'এর',
  'কে',
  'আজকে',
  'কালকে',
  'কথা',
  'দিচ্ছি',
  'যাবো',
  'নেবো',
  'করবো',
  'আসবো',
  'থাকবো',
  'বলবো',
  'পড়ে',
  'এসে',
  'ফিরে',
  'নিয়ে',
  'দিয়ে',
  'থেকে',
  'জন্য',
  'কিন্তু',
  'তবে',
  'এখন',
]);

export function extractMLFeatures(rawText: string): string[] {
  const norm = normalizeBengaliText(rawText);
  if (!norm) return [];
  const words = norm
    .split(/\s+/)
    .map((w) => stemBengaliWord(w))
    .filter((w) => w.length >= 2 && !ML_STOP_WORDS.has(w));

  const features: string[] = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    features.push(`${words[i]}_${words[i + 1]}`);
  }
  return features;
}

export function moodToEmotionSignal(
  mood: CharacterMood,
  customEmotions: CustomEmotionDefinition[] = []
): EmotionSignal {
  const customMatch = customEmotions.find(
    (ce) =>
      ce.mood.toLowerCase() === String(mood).toLowerCase() ||
      ce.signal.toLowerCase() === String(mood).toLowerCase()
  );
  if (customMatch) {
    return customMatch.signal;
  }

  switch (mood) {
    case 'রাগান্বিত':
    case 'কঠোর শাসন':
      return 'রাগ';
    case 'চাপ ও শর্ত':
      return 'ভয় দেখানো';
    case 'শাসনমিশ্রিত স্নেহ':
    case 'স্নেহশীল':
      return 'স্নেহ';
    case 'ভালোবাসাময়':
      return 'ভালোবাসা';
    case 'অভিমানী':
      return 'অভিমান';
    case 'ব্যথিত':
      return 'দুঃখ';
    case 'উদ্বিগ্ন':
      return 'উদ্বেগ';
    case 'ক্লান্ত':
      return 'ক্লান্তি';
    case 'নরম হওয়া':
    case 'সম্মত ও খুশি':
      return 'সম্মতি';
    case 'উৎফুল্ল':
      return 'খুশি';
    case 'রসিক':
      return 'রসিকতা';
    case 'কৌতূহলী':
      return 'কৌতূহল';
    default:
      return 'শান্ত';
  }
}

export interface NaiveBayesPrediction {
  emotion: EmotionSignal;
  confidence: number;
  runnerUp?: EmotionSignal;
}

export class LocalMLModel {
  private classDocCounts = new Map<EmotionSignal, number>();
  private classTokenCounts = new Map<EmotionSignal, Map<string, number>>();
  private classTotalTokens = new Map<EmotionSignal, number>();
  private vocab = new Set<string>();
  private docFreq = new Map<string, number>();
  private totalDocs = 0;
  private totalNgrams = 0;
  private feedbackWeights = new Map<string, number>();
  private positiveFeedbackCount = 0;
  private totalFeedbackCount = 0;

  constructor(
    userLexicon: LexiconEntry[] = [],
    trainedConversations: TrainedConversationItem[] = [],
    trainedScenarios: TrainedScenario[] = [],
    selfLearnedPatterns: MLSelfLearnedPattern[] = [],
    feedbackSamples: MLFeedbackSample[] = [],
    customEmotions: CustomEmotionDefinition[] = []
  ) {
    this.train(
      userLexicon,
      trainedConversations,
      trainedScenarios,
      selfLearnedPatterns,
      feedbackSamples,
      customEmotions
    );
  }

  private addDocument(text: string, emotion: EmotionSignal, weight = 1) {
    const features = extractMLFeatures(text);
    if (features.length === 0) return;

    this.totalDocs += 1;
    this.totalNgrams += features.filter((f) => f.includes('_')).length;

    const prevDocs = this.classDocCounts.get(emotion) || 0;
    this.classDocCounts.set(emotion, prevDocs + weight);

    let tokenMap = this.classTokenCounts.get(emotion);
    if (!tokenMap) {
      tokenMap = new Map<string, number>();
      this.classTokenCounts.set(emotion, tokenMap);
    }

    const uniqueInDoc = new Set<string>();
    let totalTok = this.classTotalTokens.get(emotion) || 0;

    for (const feat of features) {
      this.vocab.add(feat);
      uniqueInDoc.add(feat);
      tokenMap.set(feat, (tokenMap.get(feat) || 0) + weight);
      totalTok += weight;
    }
    this.classTotalTokens.set(emotion, totalTok);

    for (const feat of uniqueInDoc) {
      this.docFreq.set(feat, (this.docFreq.get(feat) || 0) + 1);
    }
  }

  public train(
    userLexicon: LexiconEntry[],
    trainedConversations: TrainedConversationItem[],
    trainedScenarios: TrainedScenario[],
    selfLearnedPatterns: MLSelfLearnedPattern[],
    feedbackSamples: MLFeedbackSample[],
    customEmotions: CustomEmotionDefinition[] = []
  ) {
    // 1. Seed from built-in + user-trained Lexicon
    for (const lex of [...BENGALI_LEXICON, ...userLexicon]) {
      const sampleText = `${lex.root} ${lex.forms.join(' ')} ${lex.meaningBn}`;
      this.addDocument(sampleText, lex.emotion, lex.isUserTrained ? 2 : 1);
    }

    // 1.5 Seed from user-defined Custom Emotions
    for (const ce of customEmotions) {
      const sampleText = `${ce.signal} ${ce.mood} ${ce.descriptionBn} ${ce.keywords.join(' ')} ${ce.replyTemplate}`;
      this.addDocument(sampleText, ce.signal, 2);
    }

    // 2. Built-in realistic emotional progression seeds (anger -> pressure/threat -> persuasion -> agreement)
    const builtInEmotionalSeeds: Array<{ text: string; emotion: EmotionSignal }> = [
      { text: 'পড়বো না খেলতে যাবো আজকে যাবই', emotion: 'রাগ' },
      { text: 'কেন পড়বি না তোর পড়তে হবে এখনই বকা', emotion: 'রাগ' },
      { text: 'তুমি যদি না পড়ো তোমার বাবাকে বলে দিবো শর্ত চাপ', emotion: 'ভয় দেখানো' },
      { text: 'আব্বুকে বলে দিলে বিপদ শাস্তি শর্ত মানতে হবে', emotion: 'ভয় দেখানো' },
      { text: 'প্লিজ মা কথা দিচ্ছি এসে পড়ে নেবো আর দেরি হবে না সরি', emotion: 'অনুনয়' },
      { text: 'কষ্ট করে মানিয়ে নেওয়া কনভিন্স প্লিজ আর রাগ করো না', emotion: 'অনুনয়' },
      { text: 'আচ্ছা ঠিক আছে রাজি হলাম সাবধানে যাও তবে কথা রাখবি', emotion: 'সম্মতি' },
      { text: 'মেনে নিলাম ঠিক আছে মন গলেছে যাও তাহলে', emotion: 'সম্মতি' },
    ];
    for (const seed of builtInEmotionalSeeds) {
      this.addDocument(seed.text, seed.emotion, 2);
    }

    // 3. Built-in & user-trained conversations
    for (const item of [...DATASET_NATURAL_PAIRS, ...trainedConversations]) {
      const emotion = moodToEmotionSignal(item.emotion, customEmotions);
      this.addDocument(`${item.prompt} ${(item.keywords || []).join(' ')} ${item.response}`, emotion, 2);
    }

    // 4. Scenario phases
    for (const sc of trainedScenarios) {
      for (const ph of sc.phases) {
        const phaseEmotion = ph.emotion ? moodToEmotionSignal(ph.emotion, customEmotions) : 'শান্ত';
        const kwText = (ph.keywords || []).join(' ');
        const respText = ph.responses.map((r) => r.text).join(' ');
        this.addDocument(`${ph.beat} ${kwText} ${respText}`, phaseEmotion, 2);
      }
    }

    // 5. Self-learned patterns
    for (const pat of selfLearnedPatterns) {
      this.addDocument(`${pat.prompt} ${pat.triggerTokens.join(' ')}`, pat.signalEmotion, 2);
    }

    // 6. Reinforcement feedback samples
    this.totalFeedbackCount = feedbackSamples.length;
    this.positiveFeedbackCount = feedbackSamples.filter((f) => f.reward > 0).length;
    for (const fb of feedbackSamples) {
      const prev = this.feedbackWeights.get(fb.replyKey) || 0;
      this.feedbackWeights.set(fb.replyKey, prev + fb.reward);
      if (fb.reward > 0) {
        this.addDocument(fb.input, fb.emotion, 2);
      }
    }
  }

  public predictEmotion(rawText: string): NaiveBayesPrediction {
    const features = extractMLFeatures(rawText);
    if (features.length === 0 || this.classDocCounts.size === 0) {
      return { emotion: 'শান্ত', confidence: 0 };
    }

    const vocabSize = Math.max(1, this.vocab.size);
    const totalClassWeight = Array.from(this.classDocCounts.values()).reduce((a, b) => a + b, 0);
    const scores: Array<{ emotion: EmotionSignal; logProb: number }> = [];

    for (const [emotion, docCount] of this.classDocCounts.entries()) {
      let logProb = Math.log(docCount / totalClassWeight);
      const tokenMap = this.classTokenCounts.get(emotion)!;
      const classTokTotal = this.classTotalTokens.get(emotion) || 0;

      for (const feat of features) {
        const count = tokenMap.get(feat) || 0;
        logProb += Math.log((count + 1) / (classTokTotal + vocabSize));
      }
      scores.push({ emotion, logProb });
    }

    scores.sort((a, b) => b.logProb - a.logProb);
    const best = scores[0];
    const second = scores[1];
    const margin = second ? best.logProb - second.logProb : 1.0;
    const confidence = Math.min(0.99, Math.max(0.25, 1 / (1 + Math.exp(-margin))));

    return {
      emotion: best.emotion,
      confidence,
      runnerUp: second?.emotion,
    };
  }

  public scoreSimilarity(queryText: string, candidateText: string): number {
    const qFeats = extractMLFeatures(queryText);
    const cFeats = extractMLFeatures(candidateText);
    if (qFeats.length === 0 || cFeats.length === 0) return 0;

    const qVec = new Map<string, number>();
    const cVec = new Map<string, number>();

    const idf = (term: string) => {
      const df = this.docFreq.get(term) || 0;
      return Math.log((this.totalDocs + 1) / (df + 1)) + 1;
    };

    for (const f of qFeats) qVec.set(f, (qVec.get(f) || 0) + idf(f));
    for (const f of cFeats) cVec.set(f, (cVec.get(f) || 0) + idf(f));

    let dot = 0;
    let qNorm = 0;
    let cNorm = 0;

    for (const [k, v] of qVec.entries()) {
      qNorm += v * v;
      if (cVec.has(k)) {
        dot += v * cVec.get(k)!;
      }
    }
    for (const v of cVec.values()) {
      cNorm += v * v;
    }

    if (qNorm === 0 || cNorm === 0) return 0;
    return dot / (Math.sqrt(qNorm) * Math.sqrt(cNorm));
  }

  public getFeedbackBoost(replyKey: string): number {
    const w = this.feedbackWeights.get(replyKey) || 0;
    return Math.max(-12, Math.min(18, w * 4));
  }

  public getStats(selfLearnedCount: number): MLModelStats {
    return {
      vocabularySize: this.vocab.size,
      documentCount: this.totalDocs,
      emotionClasses: this.classDocCounts.size,
      trainedNgrams: this.totalNgrams,
      feedbackCount: this.totalFeedbackCount,
      selfLearnedCount,
      positiveRatio:
        this.totalFeedbackCount > 0
          ? Math.round((this.positiveFeedbackCount / this.totalFeedbackCount) * 100)
          : 100,
    };
  }
}

/**
 * Self-Improvement Synthesizer:
 * Mines positive user feedback + trained scenarios/dialogues + base natural dataset
 * to synthesize reusable generalizable trigger patterns + automatic vocabulary expansion
 * without external APIs.
 */
export function runSelfLearningSynthesis(params: {
  trainedConversations: TrainedConversationItem[];
  trainedScenarios: TrainedScenario[];
  feedbackSamples: MLFeedbackSample[];
  existingPatterns: MLSelfLearnedPattern[];
  existingLexicon: LexiconEntry[];
  customEmotions?: CustomEmotionDefinition[];
}): {
  newPatterns: MLSelfLearnedPattern[];
  newLexiconWords: LexiconEntry[];
} {
  const customEmotions = params.customEmotions || [];
  const newPatterns: MLSelfLearnedPattern[] = [];
  const existingPromptKeys = new Set(
    params.existingPatterns.map((p) => normalizeBengaliText(p.prompt))
  );

  // 1. Convert positive feedback interactions into reusable generalized patterns
  for (const fb of params.feedbackSamples) {
    if (fb.reward <= 0) continue;
    const normPrompt = normalizeBengaliText(fb.input);
    if (!normPrompt || existingPromptKeys.has(normPrompt)) continue;
    const triggerTokens = extractMLFeatures(fb.input)
      .filter((t) => !t.includes('_'))
      .slice(0, 6);
    if (triggerTokens.length === 0) continue;

    existingPromptKeys.add(normPrompt);
    newPatterns.push({
      id: `ml-pat-fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      relation: 'any',
      triggerTokens,
      prompt: fb.input,
      response: fb.replyText,
      emotion: fb.mood,
      signalEmotion: fb.emotion,
      action: 'শেখা অভিজ্ঞতা থেকে স্বাভাবিক ভঙ্গিতে তাকিয়ে উত্তর দিল',
      score: 2,
      hitCount: 1,
    });
  }

  // 2. Synthesize cross-phase patterns from trained scenarios
  for (const sc of params.trainedScenarios) {
    for (const ph of sc.phases) {
      if (ph.responses.length === 0) continue;
      const cue = (ph.keywords && ph.keywords.join(' ')) || ph.beat;
      const normCue = normalizeBengaliText(cue);
      if (!normCue || existingPromptKeys.has(normCue)) continue;
      const triggerTokens = extractMLFeatures(cue)
        .filter((t) => !t.includes('_'))
        .slice(0, 6);
      if (triggerTokens.length === 0) continue;

      const rep = ph.responses[0];
      existingPromptKeys.add(normCue);
      newPatterns.push({
        id: `ml-pat-sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        relation: sc.relation,
        triggerTokens,
        prompt: cue,
        response: rep.text,
        emotion: ph.emotion || rep.mood,
        signalEmotion: moodToEmotionSignal(ph.emotion || rep.mood, customEmotions),
        action: rep.action,
        score: 2,
        hitCount: 0,
      });
    }
  }

  // 3. Synthesize generalized cues from user-trained conversations & emotional transitions
  for (const conv of params.trainedConversations) {
    const cueText = `${conv.prompt} ${(conv.keywords || []).join(' ')}`.trim();
    const normCue = normalizeBengaliText(cueText);
    if (!normCue || existingPromptKeys.has(normCue)) continue;
    const triggerTokens = extractMLFeatures(cueText)
      .filter((t) => !t.includes('_'))
      .slice(0, 6);
    if (triggerTokens.length < 2) continue;

    existingPromptKeys.add(normCue);
    newPatterns.push({
      id: `ml-pat-conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      relation: conv.relation,
      triggerTokens,
      prompt: conv.prompt,
      response: conv.response,
      emotion: conv.emotion,
      signalEmotion: moodToEmotionSignal(conv.emotion, customEmotions),
      action: conv.action || 'শেখা সংলাপের আবেগ অনুযায়ী স্বাভাবিক ভঙ্গিতে উত্তর দিল',
      score: 1,
      hitCount: 0,
    });
  }

  // 4. Auto-discover recurring Bengali/Banglish root words from conversations, scenarios & feedback
  const knownRoots = new Set<string>(
    [...BENGALI_LEXICON, ...params.existingLexicon].flatMap((e) => [
      normalizeBengaliText(e.root),
      ...e.forms.map((f) => normalizeBengaliText(f)),
    ])
  );

  const tokenStats = new Map<
    string,
    { count: number; emotionVotes: Map<EmotionSignal, number> }
  >();
  const recordWords = (text: string, emotion: EmotionSignal) => {
    const words = normalizeBengaliText(text)
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !ML_STOP_WORDS.has(w) && !knownRoots.has(w));
    for (const w of words) {
      const cur = tokenStats.get(w) || { count: 0, emotionVotes: new Map<EmotionSignal, number>() };
      cur.count += 1;
      cur.emotionVotes.set(emotion, (cur.emotionVotes.get(emotion) || 0) + 1);
      tokenStats.set(w, cur);
    }
  };

  for (const conv of params.trainedConversations) {
    recordWords(
      `${conv.prompt} ${(conv.keywords || []).join(' ')}`,
      moodToEmotionSignal(conv.emotion, customEmotions)
    );
  }
  for (const sc of params.trainedScenarios) {
    for (const ph of sc.phases) {
      const sig = moodToEmotionSignal(ph.emotion || 'শান্ত', customEmotions);
      recordWords(`${ph.beat} ${(ph.keywords || []).join(' ')}`, sig);
    }
  }
  for (const fb of params.feedbackSamples) {
    if (fb.reward > 0) {
      recordWords(fb.input, fb.emotion);
    }
  }

  const newLexiconWords: LexiconEntry[] = [];
  const addedNormSet = new Set<string>();
  let addedCount = 0;
  for (const [word, info] of tokenStats.entries()) {
    if (info.count >= 2 && addedCount < 10 && !addedNormSet.has(word)) {
      addedCount++;
      addedNormSet.add(word);
      let topEmotion: EmotionSignal = 'শান্ত';
      let topVotes = -1;
      for (const [em, votes] of info.emotionVotes.entries()) {
        if (votes > topVotes || (votes === topVotes && em !== 'শান্ত')) {
          topVotes = votes;
          topEmotion = em;
        }
      }
      const mood = mapEmotionToMood(topEmotion, 'story', customEmotions);
      newLexiconWords.push({
        id: `ml-lex-${Date.now()}-${addedCount}`,
        root: word,
        forms: Array.from(new Set([word, stemBengaliWord(word)])),
        meaningBn: `প্রশিক্ষিত সংলাপ ও দৃশ্যপট থেকে স্বয়ংক্রিয়ভাবে শেখা শব্দ (${mood} প্রসঙ্গে ব্যবহৃত)`,
        category: 'ML Auto-Learned',
        emotion: topEmotion,
        intensity: 1,
        isUserTrained: true,
      });
    }
  }

  return { newPatterns, newLexiconWords };
}

export function exportTrainedBrainJson(params: {
  lexicon: LexiconEntry[];
  scenarios: TrainedScenario[];
  conversations: TrainedConversationItem[];
  selfLearnedPatterns: MLSelfLearnedPattern[];
  customEmotions?: CustomEmotionDefinition[];
}): string {
  return JSON.stringify(
    {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      customEmotions: (params.customEmotions || []).map((ce) => ({
        id: ce.id,
        signal: ce.signal,
        mood: ce.mood,
        descriptionBn: ce.descriptionBn,
        keywords: ce.keywords,
        replyTemplate: ce.replyTemplate,
        actionText: ce.actionText,
        voiceTone: ce.voiceTone,
      })),
      lexicon: params.lexicon.map((w) => ({
        root: w.root,
        emotion: w.emotion,
        forms: w.forms,
        meaningBn: w.meaningBn,
        category: w.category,
        intensity: w.intensity,
      })),
      scenarios: params.scenarios.map((sc) => ({
        id: sc.id,
        title: sc.title,
        relation: sc.relation,
        characterName: sc.characterName,
        characterAge: sc.characterAge,
        gender: sc.gender,
        setting: sc.setting,
        summary: sc.summary,
        greeting: sc.greeting,
        greetingAction: sc.greetingAction,
        phases: sc.phases.map((ph) => ({
          phase: ph.phase,
          beat: ph.beat,
          emotion: ph.emotion,
          phaseTrigger: ph.phaseTrigger,
          keywords: ph.keywords,
          variants: ph.responses,
        })),
      })),
      conversations: params.conversations.map((c) => ({
        relation: c.relation,
        phase: c.phase,
        prompt: c.prompt,
        keywords: c.keywords,
        response: c.response,
        emotion: c.emotion,
        action: c.action,
        followUps: c.followUps,
      })),
      selfLearnedPatterns: params.selfLearnedPatterns,
    },
    null,
    2
  );
}


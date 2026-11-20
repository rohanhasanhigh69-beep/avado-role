import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_CHARACTERS } from '../data/characters';
import {
  createInitialMemory,
  extractUserName,
  formatBengaliLocation,
  generateRoleplayReply,
  inferCharacterRelation,
  normalizeBengaliInput,
} from './roleplayEngine';
import { classifySystemVoiceGender, computeVoiceProfile } from './voiceEngine';
import { RoleplayCharacter, VoiceSettings } from '../types/roleplay';

const arunima = BUILTIN_CHARACTERS.find((c) => c.id === 'arunima')!;
const abir = BUILTIN_CHARACTERS.find((c) => c.id === 'abir')!;

test('normalizeBengaliInput translates Banglish and colloquial Bengali verbs', () => {
  const normalized = normalizeBengaliInput('Kemon acho? Bristi ar cha!');
  assert.ok(normalized.includes('কেমন আছো'));
  assert.ok(normalized.includes('বৃষ্টি'));
  assert.ok(normalized.includes('চা'));

  const colloquial = normalizeBengaliInput('কি কর আম্মু');
  assert.equal(colloquial, 'কী করো আম্মু');
});

test('formatBengaliLocation prevents double case suffixes like বাসায়-এ', () => {
  assert.equal(formatBengaliLocation('আমাদের বাসায়'), 'আমাদের বাসায়');
  assert.equal(formatBengaliLocation('ঢাকায়'), 'ঢাকায়');
  assert.equal(formatBengaliLocation('চায়ের দোকান'), 'চায়ের দোকান-এ');
});

test('mother character Rabeya never talks like a friend when addressed as আম্মু', () => {
  const rabeya: RoleplayCharacter = {
    ...arunima,
    id: 'custom-rabeya',
    name: 'রাবেয়া',
    role: 'আম্মু',
    setting: 'আমাদের বাসায়',
    personalitySummary: 'রাবেয়া আমার আম্মু',
    greeting: 'আয় বাবা, খেয়েছিস?',
    topics: [],
    storyBranches: [],
    fallbacks: [
      {
        text: 'খুব সুন্দর কথা বলেছো {userName}! আমি রাবেয়া—{charSettingLoc} বসে তোমার কথা মন দিয়ে শুনছি।',
        action: 'মনোযোগ দিয়ে মাথা নেড়ে সায় দিল',
        mood: 'কৌতূহলী',
        followUps: ['একটা গল্প বলো'],
      },
    ],
    isCustom: true,
  };

  const mem = createInitialMemory(rabeya);
  assert.equal(inferCharacterRelation(rabeya, 'কি কর আম্মু', mem), 'mother');

  const res = generateRoleplayReply('কি কর আম্মু', rabeya, mem);
  assert.equal(res.mood, 'স্নেহশীল');
  assert.ok(!res.replyText.includes('বন্ধু'), 'Mother should never call user বন্ধু');
  assert.ok(!res.replyText.includes('বাসায়-এ'), 'Location should not have double suffix');

  // Even on a subsequent message that falls back, she remembers she is Ammu and never says বন্ধু
  const res2 = generateRoleplayReply('আজ আকাশটা খুব সুন্দর লাগছে', rabeya, res.updatedMemory);
  assert.ok(!res2.replyText.includes('বন্ধু'), 'Mother fallback should never call user বন্ধু');
});

test('extractUserName captures Bengali and Banglish introductions accurately', () => {
  assert.equal(extractUserName('আমার নাম তানভীর।'), 'তানভীর');
  assert.equal(extractUserName('amar naam Rafi'), 'Rafi');
  assert.equal(extractUserName('আমি ভালো আছি'), undefined);
});

test('generateRoleplayReply responds fluently in Bengali and updates memory', () => {
  const initialMemory = createInitialMemory(arunima);
  const res1 = generateRoleplayReply('আমার নাম মীরা', arunima, initialMemory);
  assert.ok(res1.replyText.includes('মীরা'));
  assert.equal(res1.updatedMemory.userName, 'মীরা');
  assert.ok(res1.updatedMemory.affinity > initialMemory.affinity);

  const res2 = generateRoleplayReply('বৃষ্টি আর চা নিয়ে বলো', arunima, res1.updatedMemory);
  assert.ok(res2.replyText.length > 20);
  assert.equal(res2.matchedTopic, 'বৃষ্টি ও মাটির ভাঁড়ে চা');
});

test('generateRoleplayReply cycles variants to avoid immediate repetition', () => {
  const mem = createInitialMemory(abir);
  const first = generateRoleplayReply('হ্যালো কেমন আছো?', abir, mem);
  const second = generateRoleplayReply('হ্যালো কেমন আছো?', abir, first.updatedMemory);
  assert.notEqual(first.replyText, second.replyText);
});

test('custom character rules take priority over generic topics', () => {
  const customChar: RoleplayCharacter = {
    ...arunima,
    id: 'custom-test',
    name: 'পরীক্ষা',
    customRules: [
      {
        id: 'rule-1',
        keywords: ['গোপন সংকেত'],
        response: 'গোপন সংকেত মিলে গেছে {userName}!',
        action: 'চোখ টিপে সম্মতি দিল',
      },
    ],
  };
  const mem = createInitialMemory(customChar);
  const res = generateRoleplayReply('আজকের গোপন সংকেত কী?', customChar, mem);
  assert.equal(res.matchedTopic, 'কাস্টম সংলাপ');
  assert.ok(res.replyText.includes('গোপন সংকেত মিলে গেছে'));
});

test('computeVoiceProfile differentiates Female and Male acoustic parameters cleanly', () => {
  const baseSettings: VoiceSettings = {
    genderOverride: 'character',
    rate: 1.0,
    pitch: 1.0,
    autoSpeak: true,
    engineMode: 'auto',
  };

  const femaleProfile = computeVoiceProfile('female', baseSettings);
  const maleProfile = computeVoiceProfile('male', baseSettings);

  assert.equal(femaleProfile.gender, 'female');
  assert.equal(maleProfile.gender, 'male');
  assert.ok(femaleProfile.pitch > maleProfile.pitch);
  assert.ok(femaleProfile.baseFrequencyHz > maleProfile.baseFrequencyHz);

  const forcedMale = computeVoiceProfile('female', {
    ...baseSettings,
    genderOverride: 'male',
  });
  assert.equal(forcedMale.gender, 'male');
  assert.equal(forcedMale.baseFrequencyHz, maleProfile.baseFrequencyHz);
});

test('classifySystemVoiceGender identifies Bengali female and male OS voices', () => {
  assert.equal(classifySystemVoiceGender('Microsoft Tanisha Online (Natural) - Bengali'), 'female');
  assert.equal(classifySystemVoiceGender('Microsoft Pradeep Online (Natural) - Bengali'), 'male');
});

test('Local Intelligence understands word meanings, stems Bengali words, and detects emotions', async () => {
  const { analyzeSentenceSemantics, parseBulkTrainingText, stemBengaliWord } = await import(
    './localIntelligence'
  );

  assert.equal(stemBengaliWord('অভিমানগুলো'), 'অভিমান');

  const analysis = analyzeSentenceSemantics('আজ আমার খুব অভিমান হচ্ছে আর মনটা একটু কষ্টে আছে');
  assert.ok(analysis.matchedLexicon.some((w) => w.root === 'অভিমান'));
  assert.ok(analysis.matchedLexicon.some((w) => w.root === 'কষ্ট'));

  const meaningQuery = analyzeSentenceSemantics('অভিমান মানে কী?');
  assert.equal(meaningQuery.meaningQueryTarget, 'অভিমান');

  const gf = BUILTIN_CHARACTERS.find((c) => c.id === 'gf-nila')!;
  const gfMem = createInitialMemory(gf);
  const meaningRes = generateRoleplayReply('অভিমান মানে কী?', gf, gfMem);
  assert.ok(meaningRes.replyText.includes('অভিমান'));
  assert.ok(meaningRes.matchedTopic.includes('শব্দার্থ'));

  const emotionRes = generateRoleplayReply('তুমি কি আমার ওপর অভিমান করেছো?', gf, gfMem);
  assert.equal(emotionRes.detectedUserEmotion, 'অভিমান');
  assert.ok(emotionRes.understoodWords.includes('অভিমান'));
  assert.ok(emotionRes.replyText.length > 25);

  const spouse = BUILTIN_CHARACTERS.find((c) => c.id === 'spouse-tanha')!;
  const spouseRes = generateRoleplayReply(
    'আজ বাজারে ইলিশ মাছ দেখেছি, আনবো নাকি?',
    spouse,
    createInitialMemory(spouse)
  );
  assert.ok(spouseRes.replyText.includes('ইলিশ') || spouseRes.replyText.includes('বাজার'));

  const friend = BUILTIN_CHARACTERS.find((c) => c.id === 'bondhu-sadman')!;
  const friendRes = generateRoleplayReply(
    'দোস্ত আজকে বিরিয়ানি ট্রিট দে!',
    friend,
    createInitialMemory(friend)
  );
  assert.ok(friendRes.replyText.includes('ট্রিট') || friendRes.replyText.includes('মামা'));

  const bulk = parseBulkTrainingText(
    'ছেলে: আম্মু আমি ছাদে যাচ্ছি।\nমা: সাবধানে থাকিস বাবা, রোদে মাথা গরম করিস না।\nপ্রত্যয় = দৃঢ় বিশ্বাস ও আস্থা',
    'mother'
  );
  assert.equal(bulk.conversations.length, 1);
  assert.equal(bulk.extractedWords.length, 1);
  assert.equal(bulk.extractedWords[0].root, 'প্রত্যয়');

  const ammu = BUILTIN_CHARACTERS.find((c) => c.id === 'ammu-rahela')!;
  const trainedReply = generateRoleplayReply(
    'আম্মু আমি ছাদে যাচ্ছি',
    ammu,
    createInitialMemory(ammu),
    { extraLexicon: bulk.extractedWords, trainedConversations: bulk.conversations }
  );
  assert.ok(trainedReply.replyText.includes('রোদে মাথা গরম করিস না'));

  const baseSettings: VoiceSettings = {
    genderOverride: 'character',
    rate: 1.0,
    pitch: 1.0,
    autoSpeak: true,
    engineMode: 'auto',
  };
  const happyProfile = computeVoiceProfile('female', baseSettings, 'উৎফুল্ল');
  const sadProfile = computeVoiceProfile('female', baseSettings, 'ব্যথিত');
  assert.ok(happyProfile.pitch > sadProfile.pitch);
  assert.ok(happyProfile.rate > sadProfile.rate);
});

test('Trained bangla_roleplay_dataset lexicon, naturalPairs, conversations, and JSON importer work seamlessly', async () => {
  const { parseJsonDataset } = await import('./localIntelligence');

  const ammu = BUILTIN_CHARACTERS.find((c) => c.id === 'ammu-rahela')!;
  const brother = BUILTIN_CHARACTERS.find((c) => c.id === 'sibling-rafi')!;
  const friend = BUILTIN_CHARACTERS.find((c) => c.id === 'bondhu-sadman')!;
  const gf = BUILTIN_CHARACTERS.find((c) => c.id === 'gf-nila')!;
  const spouse = BUILTIN_CHARACTERS.find((c) => c.id === 'spouse-tanha')!;

  // 1. Lexicon word meaning query from uploaded dataset
  const khokaMeaning = generateRoleplayReply('খোকা মানে কী?', ammu, createInitialMemory(ammu));
  assert.ok(khokaMeaning.replyText.includes('ছেলেকে স্নেহ করে ডাকার কথ্য শব্দ'));

  // 2. Natural pairs exact realistic dialogues across all 5 relationships
  const rMother = generateRoleplayReply('আম্মু আজকে কী রান্না করেছো?', ammu, createInitialMemory(ammu));
  assert.ok(rMother.replyText.includes('মাছ ভাজা আর ভাত') && rMother.replyText.includes('খোকা'));

  const rSibling = generateRoleplayReply('ভাই, আমার হেডফোন কোথায়?', brother, createInitialMemory(brother));
  assert.ok(rSibling.replyText.includes('নিজের জিনিস নিজে খুঁজ'));

  const rFriend = generateRoleplayReply('কিরে বন্ধু, আজকে আড্ডা মারবি?', friend, createInitialMemory(friend));
  assert.ok(rFriend.replyText.includes('চায়ের দোকানে বসে গপ্পো মারি'));

  const rRomantic = generateRoleplayReply('তুই কেন ফোন ধরছিস না?', gf, createInitialMemory(gf));
  assert.equal(rRomantic.mood, 'অভিমানী');
  assert.ok(rRomantic.replyText.includes('অভিমান হয়েছিল'));

  const rSpouse = generateRoleplayReply('আজকে বাজার থেকে কী এনেছ?', spouse, createInitialMemory(spouse));
  assert.equal(rSpouse.mood, 'ক্লান্ত');
  assert.ok(rSpouse.replyText.includes('মাছ, সবজি আর দুধ এনেছি'));

  // 3. JSON importer works dynamically for future user JSON datasets
  const sampleJson = JSON.stringify({
    lexicon: [
      {
        root: 'টইটম্বুর',
        forms: ['টইটম্বুর'],
        meaningBn: 'কানায় কানায় পরিপূর্ণ অবস্থা',
        category: 'প্রকৃতি',
        emotion: 'খুশি',
        intensity: 4,
      },
    ],
    naturalPairs: [
      {
        relation: 'friend',
        userPrompt: 'দোস্ত পুকুরটা তো টইটম্বুর!',
        characterReply: 'বৃষ্টিতে ভরে একদম টইটম্বুর হয়ে গেছে রে!',
        action: 'উচ্ছ্বসিত হয়ে তাকালো',
        mood: 'উৎফুল্ল',
      },
    ],
  });
  const imported = parseJsonDataset(sampleJson);
  assert.equal(imported.extractedWords.length, 1);
  assert.equal(imported.conversations.length, 1);
});

test('Sensitive or vulgar input triggers realistic scolding boundary reaction instead of praise', () => {
  const ammu = BUILTIN_CHARACTERS.find((c) => c.id === 'ammu-rahela')!;
  const mem = createInitialMemory(ammu);
  const res = generateRoleplayReply('হস্তমৈথুন করছিলাম', ammu, mem);

  assert.equal(res.mood, 'রাগান্বিত');
  assert.ok(res.updatedMemory.affinity < mem.affinity);
  assert.ok(res.replyText.includes('লজ্জা') || res.replyText.includes('অসভ্য'));
  assert.ok(!res.replyText.includes('শান্তি') && !res.replyText.includes('ভালো লাগে'));
});

test('Banglish everyday inputs and Opening Setup Director + Scenario Arc builder work end-to-end', async () => {
  const { parseRoleplaySetupPrompt, parseScenarioArc } = await import('./localIntelligence');
  const { buildCharacterFromSetup } = await import('./roleplayEngine');

  // 1. Two-step Banglish setup without scenario first
  const parsed1 = parseRoleplaySetupPrompt(
    'amar nam Rohan, tumi amar mayer roleplay korbe. tomar nam Rabeya, tomar boyosh 38, tomar choritro khub adorer kintu shashon koro'
  );
  assert.equal(parsed1.draft.userName, 'Rohan');
  assert.equal(parsed1.draft.characterName, 'Rabeya');
  assert.equal(parsed1.draft.characterAge, 38);
  assert.equal(parsed1.draft.relation, 'mother');
  assert.equal(parsed1.draft.gender, 'female');
  assert.equal(parsed1.draft.step, 'awaiting_scenario');
  assert.equal(parsed1.scenarioText, undefined);

  // 2. Scenario arc parsing & progressive character build
  const scenario =
    'shuru hobe sokale nasta niye, tarpor ami phone e busy thakbo ar tumi bokba, tarpor sorry bole milbo';
  const arc = parseScenarioArc(scenario, parsed1.draft.relation);
  assert.equal(arc.currentPhase, 'opening');
  assert.ok(arc.openingBeat.includes('sokale nasta niye'));
  assert.ok(arc.endingBeat.includes('sorry bole milbo'));

  const { character, initialMemory } = buildCharacterFromSetup(parsed1.draft, scenario);
  assert.equal(character.name, 'Rabeya');
  assert.equal(character.age, 38);
  assert.equal(initialMemory.userName, 'Rohan');
  assert.equal(initialMemory.scenarioArc?.currentPhase, 'opening');

  // 3. Banglish follow-up replies update memory and progress scenario arc
  const r1 = generateRoleplayReply('ki koro ammu', character, initialMemory);
  assert.ok(r1.replyText.includes('Rohan'));
  assert.equal(r1.updatedMemory.detectedRelation, 'mother');

  const r2 = generateRoleplayReply('ajke amar mon kharap, khuda lagche', character, r1.updatedMemory);
  assert.ok(r2.replyText.length > 20);
  assert.ok(r2.understoodWords.length > 0);
});

test('JSON Dataset Auto-Trainer parses scenarios, phases, and keyword conversations cleanly', async () => {
  const { parseJsonDataset } = await import('./localIntelligence');
  const { buildCharacterFromTrainedScenario } = await import('./roleplayEngine');

  const json = JSON.stringify({
    lexicon: [
      {
        root: 'ঝুমবৃষ্টি',
        forms: ['ঝুমবৃষ্টি', 'jhum bristi'],
        meaningBn: 'টানা প্রবল বর্ষণ',
        emotion: 'খুশি',
        intensity: 4,
      },
    ],
    conversations: [
      {
        relation: 'friend',
        labelBn: 'বৃষ্টি ও গরম চা',
        keywords: ['ঝুমবৃষ্টি', 'সিঙ্গারা'],
        variants: [
          {
            text: 'দোস্ত এই ঝুমবৃষ্টিতে টং-এ বসে সিঙ্গারা না খেলে জীবন বৃথা!',
            action: 'জানালা দিয়ে বাইরে তাকিয়ে বললো',
            mood: 'উৎফুল্ল',
            followUps: ['চল বের হই'],
          },
          {
            text: 'আরে মামা, বৃষ্টি দেখে মনটা ভালো হয়ে গেল—সিঙ্গারা আর চা আমি খাওয়াবো আজ!',
            action: 'হেসে হাতে তালি দিল',
            mood: 'রসিক',
            followUps: ['সত্যি খাওয়াবি?'],
          },
        ],
      },
    ],
    scenarios: [
      {
        title: 'Rainy Evening Tea',
        relation: 'mother',
        characterName: 'রাবেয়া',
        characterAge: 40,
        summary: 'বৃষ্টিতে চা ও কাজের চাপ নিয়ে মায়ের আদর',
        phases: [
          {
            phase: 'opening',
            beat: 'বৃষ্টির সন্ধ্যায় চা',
            keywords: ['চা', 'বৃষ্টি'],
            variants: [
              {
                text: 'নে গরম চা-টা ধর {userName}, বাইরে কী সুন্দর বৃষ্টি!',
                action: 'চায়ের কাপ এগিয়ে দিল',
                mood: 'স্নেহশীল',
                followUps: ['চা দারুণ হয়েছে'],
              },
            ],
          },
          {
            phase: 'developing',
            beat: 'কাজের চাপ নিয়ে শাসন',
            keywords: ['ক্লান্ত', 'চাপ'],
            variants: [
              {
                text: 'রোজ এত চাপ নিস কেন? আগে খেয়ে নে তো!',
                action: 'ভুরু কুঁচকে তাকালো',
                mood: 'শাসনমিশ্রিত স্নেহ',
                followUps: ['সরি আম্মু'],
              },
            ],
          },
          {
            phase: 'resolution',
            beat: 'শান্ত সমাপ্তি',
            keywords: ['সরি', 'ঘুমা'],
            variants: [
              {
                text: 'আচ্ছা বাবা, এখন আর চিন্তা করিস না, একটু বিশ্রাম নে।',
                action: 'মাথায় হাত বুলিয়ে দিল',
                mood: 'স্নেহশীল',
                followUps: ['গুড নাইট'],
              },
            ],
          },
        ],
      },
    ],
  });

  const parsed = parseJsonDataset(json);
  assert.equal(parsed.extractedWords.length, 1);
  assert.equal(parsed.conversations.length, 2);
  assert.equal(parsed.scenarios.length, 1);
  assert.equal(parsed.scenarios[0].phases.length, 3);

  // Build character directly from imported JSON scenario
  const { character, initialMemory } = buildCharacterFromTrainedScenario(parsed.scenarios[0]);
  assert.equal(character.name, 'রাবেয়া');
  assert.equal(character.scenarioPhases?.length, 3);

  const step1 = generateRoleplayReply('বৃষ্টি আর চা দারুণ', character, initialMemory);
  assert.ok(step1.replyText.includes('গরম চা'));
  assert.equal(step1.matchedTopic, 'দৃশ্যপট (opening)');

  // Trigger developing phase keyword cleanly
  const step2 = generateRoleplayReply('কাজের অনেক চাপ আম্মু, ক্লান্ত', character, step1.updatedMemory);
  assert.ok(step2.replyText.includes('এত চাপ নিস কেন'));
  assert.equal(step2.mood, 'শাসনমিশ্রিত স্নেহ');

  // Keyword-list JSON conversations cycle variants cleanly without repeating
  const friend = BUILTIN_CHARACTERS.find((c) => c.id === 'bondhu-sadman')!;
  const fMem = createInitialMemory(friend);
  const fRes1 = generateRoleplayReply('দোস্ত বাইরে ঝুমবৃষ্টি!', friend, fMem, {
    extraLexicon: parsed.extractedWords,
    trainedConversations: parsed.conversations,
  });
  const fRes2 = generateRoleplayReply('দোস্ত বাইরে ঝুমবৃষ্টি!', friend, fRes1.updatedMemory, {
    extraLexicon: parsed.extractedWords,
    trainedConversations: parsed.conversations,
  });
  assert.notEqual(fRes1.replyText, fRes2.replyText);
});

test('LocalMLModel predicts emotions, scores TF-IDF similarity, and synthesizes self-learned patterns', async () => {
  const { LocalMLModel, runSelfLearningSynthesis } = await import('./localML');
  const { parseJsonDataset, parseLexiconJson } = await import('./localIntelligence');
  const { buildCharacterFromTrainedScenario } = await import('./roleplayEngine');

  // 1. Parse Lexicon JSON batch with root, emotion, English & variant forms, and meaning
  const lexRes = parseLexiconJson(
    JSON.stringify([
      {
        root: 'অনুনয়',
        emotion: 'অনুনয়',
        forms: ['অনুনয়', 'প্লিজ', 'please', 'convince'],
        meaningBn: 'কাউকে নরম করে রাজি করানোর বিনীত অনুরোধ',
      },
    ])
  );
  assert.equal(lexRes.extractedWords.length, 1);
  assert.equal(lexRes.extractedWords[0].emotion, 'অনুনয়');

  // 2. Parse 3-module JSON (scenarios + characters + conversations with explicit emotion)
  const fullJson = JSON.stringify({
    characters: [
      {
        name: 'রাবেয়া (কঠোর মা)',
        relation: 'mother',
        gender: 'female',
        age: 39,
        greeting: 'পড়াশোনা শেষ না করে কোথাও যাওয়া যাবে না!',
      },
    ],
    scenarios: [
      {
        title: 'Study vs Playtime Arc',
        relation: 'mother',
        characterName: 'রাবেয়া',
        summary: 'খেলার বায়নায় মায়ের রাগ, বাবাকে বলে দেওয়ার চাপ ও শেষে রাজি হওয়া',
        phases: [
          {
            phase: 'opening',
            beat: 'খেলার বায়নায় রাগ',
            emotion: 'রাগান্বিত',
            phaseTrigger: 'refusal',
            keywords: ['খেলতে', 'পড়বো না'],
            variants: [
              {
                text: 'কেন পড়বি না? তোর পড়তে হবে আজকে!',
                action: 'রাগে তাকালো',
                mood: 'রাগান্বিত',
              },
            ],
          },
          {
            phase: 'developing',
            beat: 'বাবাকে বলে দেওয়ার চাপ',
            emotion: 'চাপ ও শর্ত',
            phaseTrigger: 'pressure',
            keywords: ['ছয় ঘণ্টা', 'না পড়বো না'],
            variants: [
              {
                text: 'তুমি যদি না পড়ো, তোমার বাবাকে বলে দিবো!',
                action: 'কড়া শর্ত দিল',
                mood: 'চাপ ও শর্ত',
              },
            ],
          },
          {
            phase: 'resolution',
            beat: 'অনুনয়ে রাজি হওয়া',
            emotion: 'সম্মত ও খুশি',
            phaseTrigger: 'persuasion',
            keywords: ['সরি', 'কথা দিচ্ছি', 'প্লিজ'],
            variants: [
              {
                text: 'আচ্ছা ঠিক আছে {userName}, ফিরে এসে পড়বি কিন্তু!',
                action: 'নরম হয়ে হাসলো',
                mood: 'সম্মত ও খুশি',
              },
            ],
          },
        ],
      },
    ],
    conversations: [
      {
        relation: 'mother',
        prompt: 'মা আজকে আমি খেলতে যাবো',
        response: 'আগে পড়া শেষ করো, তারপর খেলার কথা ভাববে।',
        emotion: 'কঠোর শাসন',
      },
    ],
  });

  const ds = parseJsonDataset(fullJson);
  assert.equal(ds.characters.length, 1);
  assert.equal(ds.scenarios.length, 1);
  assert.equal(ds.conversations.length, 1);
  assert.equal(ds.conversations[0].emotion, 'কঠোর শাসন');

  // 3. Test Naive Bayes emotion prediction + TF-IDF similarity
  const model = new LocalMLModel(lexRes.extractedWords, ds.conversations, ds.scenarios);
  const pred = model.predictEmotion('তুমি যদি না পড়ো তোমার বাবাকে বলে দিবো');
  assert.equal(pred.emotion, 'ভয় দেখানো');
  assert.ok(model.scoreSimilarity('মা খেলতে যাবো পড়বো না', 'খেলতে পড়বো না') > 0.3);

  // 4. Test Self-Learning Synthesis
  const synth = runSelfLearningSynthesis({
    trainedConversations: [...ds.conversations, ...ds.conversations],
    trainedScenarios: ds.scenarios,
    feedbackSamples: [
      {
        id: 'fb1',
        input: 'সরি আম্মু এসে পড়ে নেবো',
        replyKey: 'phase:resolution:0',
        replyText: 'আচ্ছা ঠিক আছে, ফিরে এসে পড়বি!',
        emotion: 'সম্মতি',
        mood: 'সম্মত ও খুশি',
        reward: 1,
        timestamp: Date.now(),
      },
    ],
    existingPatterns: [],
    existingLexicon: lexRes.extractedWords,
  });
  assert.ok(synth.newPatterns.length >= 2);

  // 5. Test Emotional Arc transitions in Scenario Roleplay
  const { character, initialMemory } = buildCharacterFromTrainedScenario(ds.scenarios[0]);
  const r1 = generateRoleplayReply('মা আজকে আমি খেলতে যাবো পড়বো না', character, initialMemory);
  assert.equal(r1.mood, 'রাগান্বিত');

  const r2 = generateRoleplayReply('না ছয় ঘণ্টা পড়বো না', character, r1.updatedMemory);
  assert.equal(r2.mood, 'চাপ ও শর্ত');
  assert.ok(r2.replyText.includes('বাবাকে বলে দিবো'));

  const r3 = generateRoleplayReply('প্লিজ মা সরি কথা দিচ্ছি পড়ে নেবো', character, r2.updatedMemory);
  assert.equal(r3.mood, 'সম্মত ও খুশি');
});

test('Autonomous ML synthesis mines conversations & scenarios, round-trips Brain JSON, and blocks explicit entries', async () => {
  const { exportTrainedBrainJson, runSelfLearningSynthesis } = await import('./localML');
  const { parseJsonDataset, parseLexiconJson } = await import('./localIntelligence');

  const safeDataset = parseJsonDataset(
    JSON.stringify({
      lexicon: [
        {
          root: 'অনুনয়',
          emotion: 'অনুনয়',
          forms: ['অনুনয়', 'প্লিজ', 'convince'],
          meaningBn: 'কাউকে রাজি করানোর বিনীত অনুরোধ',
        },
      ],
      scenarios: [
        {
          title: 'Blackmail to Convince Study Arc',
          relation: 'mother',
          characterName: 'রাবেয়া',
          summary: 'পড়ার চাপ ও শেষে রাজি হওয়া',
          phases: [
            {
              phase: 'opening',
              beat: 'টিউশন পরীক্ষার পড়াশোনা',
              emotion: 'রাগান্বিত',
              keywords: ['টিউশন', 'পরীক্ষা'],
              variants: [{ text: 'আগে টিউশন পড়া শেষ করো!', action: 'তাকালো', mood: 'রাগান্বিত' }],
            },
            {
              phase: 'developing',
              beat: 'বাবাকে জানানোর চাপ',
              emotion: 'চাপ ও শর্ত',
              keywords: ['টিউশন', 'শাস্তি'],
              variants: [{ text: 'না পড়লে বাবাকে বলবো!', action: 'সতর্ক করলো', mood: 'চাপ ও শর্ত' }],
            },
          ],
        },
      ],
      conversations: [
        {
          relation: 'mother',
          prompt: 'আম্মু আজকে একটু খেলতে যাই প্লিজ',
          keywords: ['খেলতে', 'প্লিজ'],
          response: 'আগে আধাঘণ্টা পড়ো, তারপর যাও।',
          emotion: 'শাসনমিশ্রিত স্নেহ',
        },
      ],
    })
  );

  const synth = runSelfLearningSynthesis({
    trainedConversations: safeDataset.conversations,
    trainedScenarios: safeDataset.scenarios,
    feedbackSamples: [],
    existingPatterns: [],
    existingLexicon: safeDataset.extractedWords,
  });

  // Synthesizes patterns from both scenarios and conversations, and auto-discovers 'টিউশন'
  assert.ok(synth.newPatterns.length >= 3);
  assert.ok(synth.newLexiconWords.some((w) => w.root === 'টিউশন'));

  // Brain export round-trip
  const exported = exportTrainedBrainJson({
    lexicon: [...safeDataset.extractedWords, ...synth.newLexiconWords],
    scenarios: safeDataset.scenarios,
    conversations: safeDataset.conversations,
    selfLearnedPatterns: synth.newPatterns,
  });
  const reimported = parseJsonDataset(exported);
  assert.equal(reimported.scenarios.length, 1);
  assert.equal(reimported.conversations.length, 1);
  assert.ok(reimported.extractedWords.length >= 2);

  // Explicit sexual terms remain blocked in JSON training
  const unsafeLex = parseLexiconJson(
    JSON.stringify([
      {
        root: 'horny',
        emotion: 'ভালোবাসা',
        forms: ['horny', 'যৌন', 'সেক্স'],
        meaningBn: 'explicit test',
      },
    ])
  );
  assert.equal(unsafeLex.extractedWords.length, 0);
  assert.equal(unsafeLex.skippedUnsafeCount, 1);
});

test('Custom emotions catalog, detection, ML classes, voice modulation, JSON round-trip, and safety filtering work end-to-end', async () => {
  const { BUILTIN_EMOTIONS } = await import('../data/builtinEmotions');
  const { analyzeSentenceSemantics, parseJsonDataset, computeEmotionalVoiceAdjustment } =
    await import('./localIntelligence');
  const { LocalMLModel, exportTrainedBrainJson, moodToEmotionSignal } = await import('./localML');

  assert.equal(BUILTIN_EMOTIONS.length, 15);

  const surpriseEmotion = {
    id: 'custom-emo-surprise',
    signal: 'বিস্ময়',
    mood: 'বিস্মিত',
    descriptionBn: 'অপ্রত্যাশিত কিছু শুনে অবাক হওয়ার অনুভূতি',
    keywords: ['অবাক', 'বিস্ময়', 'obak'],
    replyTemplate: 'সত্যি নাকি {userName}! "{word}" শুনে আমি তো দারুণ অবাক হলাম!',
    actionText: 'চোখ বড় বড় করে অবাক হয়ে তাকালো',
    voiceTone: 'bright' as const,
  };

  // 1. Semantic detection picks up custom emotion keywords (including Banglish)
  const sem = analyzeSentenceSemantics('আমি তো একদম obak হয়ে গেলাম!', [], [surpriseEmotion]);
  assert.equal(sem.dominantEmotion, 'বিস্ময়');

  // 2. ML model seeds custom emotion and expands emotionClasses
  const baseModel = new LocalMLModel();
  const customModel = new LocalMLModel([], [], [], [], [], [surpriseEmotion]);
  assert.equal(
    customModel.getStats(0).emotionClasses,
    baseModel.getStats(0).emotionClasses + 1
  );
  assert.equal(moodToEmotionSignal('বিস্মিত', [surpriseEmotion]), 'বিস্ময়');

  // 3. Roleplay reply uses custom emotion replyTemplate, mood, and action
  const friend = BUILTIN_CHARACTERS.find((c) => c.id === 'bondhu-sadman')!;
  const mem = { ...createInitialMemory(friend), userName: 'রাফি' };
  const reply = generateRoleplayReply('অবাক করা খবর শুনেছো?', friend, mem, {
    customEmotions: [surpriseEmotion],
  });
  assert.equal(reply.detectedUserEmotion, 'বিস্ময়');
  assert.equal(reply.mood, 'বিস্মিত');
  assert.ok(reply.replyText.includes('রাফি'));
  assert.ok(reply.replyText.includes('বিস্ময়') || reply.replyText.includes('অবাক'));

  // 4. Voice adjustment uses custom emotion voiceTone
  const voiceAdj = computeEmotionalVoiceAdjustment('বিস্মিত', [surpriseEmotion]);
  assert.equal(voiceAdj.pitchDelta, 0.06);
  assert.equal(voiceAdj.rateFactor, 1.05);

  const brightProfile = computeVoiceProfile('female', {
    genderOverride: 'character',
    rate: 1.0,
    pitch: 1.0,
    autoSpeak: true,
    engineMode: 'auto',
  }, 'বিস্মিত', [surpriseEmotion]);
  const calmProfile = computeVoiceProfile('female', {
    genderOverride: 'character',
    rate: 1.0,
    pitch: 1.0,
    autoSpeak: true,
    engineMode: 'auto',
  }, 'শান্ত');
  assert.ok(brightProfile.pitch > calmProfile.pitch);

  // 5. JSON export/import round-trip preserves customEmotions & blocks unsafe emotions
  const exported = exportTrainedBrainJson({
    lexicon: [],
    scenarios: [],
    conversations: [],
    selfLearnedPatterns: [],
    customEmotions: [surpriseEmotion],
  });
  const parsedBack = parseJsonDataset(exported);
  assert.equal(parsedBack.customEmotions.length, 1);
  assert.equal(parsedBack.customEmotions[0].signal, 'বিস্ময়');

  const unsafeEmotionJson = parseJsonDataset(
    JSON.stringify({
      customEmotions: [
        {
          signal: 'horny',
          mood: 'যৌন',
          keywords: ['সেক্স', 'horny'],
        },
      ],
    })
  );
  assert.equal(unsafeEmotionJson.customEmotions.length, 0);
  assert.equal(unsafeEmotionJson.skippedUnsafeCount, 1);
});

test('parseEmotionsJson imports standalone JSON arrays and wrapper objects safely while filtering duplicates and explicit items', async () => {
  const { parseEmotionsJson } = await import('./localIntelligence');

  // 1. Top-level array format
  const arrRes = parseEmotionsJson(
    JSON.stringify([
      {
        signal: 'গর্ব',
        mood: 'গর্বিত',
        keywords: ['গর্ব', 'সাফল্য', 'proud'],
        voiceTone: 'bright',
        descriptionBn: 'সাফল্যে গর্ববোধ',
        replyTemplate: 'তোমার "{word}" দেখে সত্যিই গর্ব হচ্ছে {userName}!',
        actionText: 'গর্বভরা হাসি দিল',
      },
      {
        // Duplicate of built-in emotion 'রাগ'
        signal: 'রাগ',
        mood: 'রাগান্বিত',
        keywords: ['রাগ'],
      },
      {
        // Unsafe explicit entry should be skipped
        signal: 'horny',
        mood: 'যৌন',
        keywords: ['horny', 'সেক্স'],
      },
    ])
  );
  assert.equal(arrRes.emotions.length, 1);
  assert.equal(arrRes.emotions[0].signal, 'গর্ব');
  assert.equal(arrRes.emotions[0].mood, 'গর্বিত');
  assert.equal(arrRes.emotions[0].voiceTone, 'bright');
  assert.equal(arrRes.skippedDuplicateCount, 1);
  assert.equal(arrRes.skippedUnsafeCount, 1);

  // 2. Object wrapper { emotions: [...] } with flexible field aliases & existing duplicate check
  const objRes = parseEmotionsJson(
    JSON.stringify({
      emotions: [
        {
          name: 'নস্টালজিক',
          mood: 'স্মৃতিকাতর',
          triggers: 'পুরনো দিন, শৈশব, nostalgic',
          action: 'দূর আকাশের দিকে তাকিয়ে হাসলো',
          reply: 'সেই পুরনো দিনের কথা মনে পড়লে মনটা কেমন যেন হয়ে যায় {userName}!',
          voiceTone: 'gentle',
        },
        {
          signal: 'গর্ব',
          mood: 'গর্বিত',
          keywords: ['গর্ব'],
        },
      ],
    }),
    arrRes.emotions
  );
  assert.equal(objRes.emotions.length, 1);
  assert.equal(objRes.emotions[0].signal, 'নস্টালজিক');
  assert.equal(objRes.emotions[0].voiceTone, 'gentle');
  assert.ok(objRes.emotions[0].keywords.includes('শৈশব'));
  assert.equal(objRes.skippedDuplicateCount, 1);

  // 3. Invalid JSON syntax returns clean error
  const badRes = parseEmotionsJson('{bad json');
  assert.ok(badRes.error);
  assert.equal(badRes.emotions.length, 0);
});




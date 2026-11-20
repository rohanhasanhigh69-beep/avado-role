import {
  CharacterMood,
  ConversationalIntent,
  DialogueVariant,
  PersonaRelation,
  RoleplayCharacter,
  SentenceAnalysis,
  SessionMemory,
} from '../types/roleplay';

export interface SynthesizedReply {
  replyText: string;
  action: string;
  mood: CharacterMood;
  followUps: string[];
  matchedTopic: string;
}

interface SubjectCluster {
  id: string;
  labelBn: string;
  triggers: string[];
  replyByRelation: Partial<Record<PersonaRelation | 'default', string>>;
  negatedReply?: string;
  followUps: string[];
  mood: CharacterMood;
  action: string;
}

const SUBJECT_CLUSTERS: SubjectCluster[] = [
  {
    id: 'work_coding_office',
    labelBn: 'অফিস ও কাজের কথা',
    triggers: ['অফিস', 'বস', 'ম্যানেজার', 'চাকরি', 'কাজ', 'প্রজেক্ট', 'কোড', 'কোডিং', 'বাগ', 'ল্যাপটপ', 'কম্পিউটার'],
    replyByRelation: {
      mother:
        'অফিস আর ল্যাপটপের কাজের এত প্রেশার মাথার ভেতর নিয়ে ঘুরে বেড়াবি না {userName}! বস কিছু বললে মনে কষ্ট নিস না—কাজের জায়গায় কথা শুনতেই হয়। একটু পানি খেয়ে রেস্ট নে তো আগে।',
      romantic:
        'এই যে {userName}, সারাদিন ল্যাপটপ, কোড আর অফিসের বসের প্যারা নিয়ে থাকলে আমি কার সাথে গল্প করবো বলো? একটু বিরতি নাও তো—আমি আছি তোমার পাশে!',
      spouse:
        'অফিস আর কাজের সব চিন্তা দরজার বাইরে রেখে আসো {userName}! বস যা-ই বলুক, বাসায় আসার পর শুধু নিজের আর সংসারের শান্তিটুকু দেখো। চা নিয়ে আসি?',
      friend:
        'ধুর মামা {userName}, অফিসের বস আর প্রজেক্টের প্যারা ছাড় তো! কোড বা কাজের বাগ পরেও ঠিক হবে—আগে বল, মাথা ঠান্ডা করতে চা খাবি নাকি একটু ঘুরে আসবি?',
      default:
        'বুঝতে পারছি {userName}, কাজ আর প্রজেক্টের চাপটা আজ একটু বেশিই মনে হচ্ছে। একটা ছোট বিরতি নিয়ে মাথাটা হালকা করে নিলে দেখবে সমাধানও সহজ হয়ে যাচ্ছে!',
    },
    negatedReply:
      'আচ্ছা, তাহলে কাজ বা অফিসের চাপ এখন আপাতত দূরে সরিয়ে রাখো {userName}! একটু হালকা মেজাজে অন্য কিছু নিয়ে কথা বলি চলো।',
    followUps: ['আজ কাজের অনেক চাপ ছিল', 'একটু মন হালকা করতে চাই', 'চলো চা নিয়ে গল্প করি'],
    mood: 'স্নেহশীল',
    action: 'মনোযোগ দিয়ে কাজের চাপের কথা শুনে সহানুভূতিতে তাকালো',
  },
  {
    id: 'study_exam_result',
    labelBn: 'পড়াশোনা ও পরীক্ষা',
    triggers: ['পড়াশোনা', 'পড়া', 'পরীক্ষা', 'রেজাল্ট', 'ক্লাস', 'অ্যাসাইনমেন্ট', 'কলেজ', 'ভার্সিটি', 'স্কুল'],
    replyByRelation: {
      mother:
        'পড়াশোনা আর পরীক্ষা নিয়ে এত ভয় পাস না তো {userName}! তুই নিয়মিত চেষ্টা করেছিস এটাই বড় কথা। পরীক্ষা যেমনই হোক, মাথা ঠান্ডা রাখ—আম্মু সবসময় তোর পাশে আছে।',
      father:
        'শোনো {userName}, একটা পরীক্ষা বা রেজাল্ট দিয়ে পুরো জীবন মাপা যায় না। ভুল কোথায় হয়েছে সেটা দেখে সামনে আরও মন দিয়ে প্রস্তুতি নাও। আমি ভরসা রাখি তোমার ওপর।',
      friend:
        'আরে প্যারা নিস না দোস্ত {userName}! পরীক্ষা আর অ্যাসাইনমেন্ট সবারই কমবেশি এদিক-ওদিক হয়। চল আগে মনটা ফ্রেশ করি, তারপর নোটস গুছিয়ে নেওয়া যাবে!',
      romantic:
        'তুমি এত চিন্তা করো কেন {userName}? পরীক্ষা বা পড়াশোনার চাপ একটু তো থাকবেই, কিন্তু তোমার ওপর আমার পুরো বিশ্বাস আছে—তুমি ঠিকই সামলে নেবে!',
      default:
        'পড়াশোনা আর পরীক্ষার সময় এমন চাপ লাগাটা একদম স্বাভাবিক {userName}। ধীরেসুস্থে একটা-দুটো করে বিষয় শেষ করো, দেখবে সব গুছিয়ে আসছে।',
    },
    negatedReply:
      'ঠিক আছে, এখনই পড়াশোনা নিয়ে জোর করতে হবে না {userName}—একটু রিল্যাক্স করে নাও, তারপর মন বসলে দেখা যাবে।',
    followUps: ['সামনের পরীক্ষার জন্য দোয়া করো', 'পড়ায় একদম মন বসছে না', 'আজ একটু গল্প করে মন হালকা করি'],
    mood: 'স্নেহশীল',
    action: 'উৎসাহ ও ভরসা দিয়ে মাথা নাড়লো',
  },
  {
    id: 'food_refusal_craving',
    labelBn: 'খাওয়া-দাওয়া ও রুচি',
    triggers: ['খাবার', 'ভাত', 'মাছ', 'মাংস', 'ডিম', 'ডাল', 'রুটি', 'বিরিয়ানি', 'খিচুড়ি', 'ফুচকা', 'মিষ্টি', 'নাস্তা', 'ডিনার'],
    replyByRelation: {
      mother:
        'খাবারদাবার নিয়ে একদম অবহেলা করবি না {userName}! তোর পছন্দের হালকা কিছু বানিয়ে দিই? পেট খালি রাখলে কিন্তু শরীর আরো খারাপ লাগবে!',
      romantic:
        'তুমি ঠিকমতো খাচ্ছো না কেন {userName}? আমার কথার দাম আছে একটুও? যা ইচ্ছে করে তা-ই খাও, কিন্তু একদম না খেয়ে থেকো না প্লিজ!',
      spouse:
        'খাওয়ার সময় এমন বায়না করলে চলবে {userName}? আজ তোমার পছন্দের খাবারটাই আগে দিই, একটু হলেও মুখে তুলো তো!',
      friend:
        'কীরে {userName}, খাবার দেখলেই তো তোর চোখ চকচক করে—আজ আবার খাবি না বলছিস কেন? চল আমার সাথে, ফুচকা বা ঝালমুড়ি খেয়ে আসি!',
      default:
        'খাওয়া-দাওয়া সময়মতো না করলে শরীরে শক্তি থাকে না {userName}। তোমার এখন কী খেতে সবচেয়ে বেশি ইচ্ছে করছে বলো তো?',
    },
    negatedReply:
      'আচ্ছা, এখন খেতে ইচ্ছে না করলে জোর করবো না {userName}—তবে অন্তত একটু পানি বা হালকা চা খেয়ে নিও, খালি পেটে থেকো না প্লিজ!',
    followUps: ['আমার পছন্দের খাবার খাবে?', 'একটু গরম চা হলে ভালো হতো', 'এখন খিদে নেই, পরে খাবো'],
    mood: 'স্নেহশীল',
    action: 'যত্নভরা দৃষ্টিতে তাকিয়ে খাবারের খোঁজ নিল',
  },
  {
    id: 'health_sleep_body',
    labelBn: 'স্বাস্থ্য ও বিশ্রাম',
    triggers: ['মাথাব্যথা', 'ব্যথা', 'জ্বর', 'ওষুধ', 'ডাক্তার', 'শরীর', 'ঘুম', 'ক্লান্ত', 'মাথা'],
    replyByRelation: {
      mother:
        'আয় তো আমার কাছে {userName}! শরীর খারাপ বা ঘুম না হওয়াটা একদমই ভালো লক্ষণ না। আর স্ক্রিনের দিকে তাকিয়ে থাকিস না—চোখ বন্ধ করে একটু শো, আমি মাথায় হাত বুলিয়ে দিচ্ছি।',
      romantic:
        'তোমার শরীর খারাপ বা ঘুম হচ্ছে না শুনলেই আমার বুকটা ধড়ফড় করে {userName}! প্লিজ ওষুধ খেয়ে একটু রেস্ট নাও—তুমি সুস্থ থাকলে তবেই তো আমি শান্তি পাবো।',
      spouse:
        'সারাদিনের ধকলের পর শরীরটা একটু বিশ্রাম চাইছে তো {userName}! ফোনটা রেখে শুয়ে পড়ো, আমি হালকা গরম পানি আর ওষুধ এনে দিচ্ছি।',
      friend:
        'এই, শরীরের ওপর দিয়ে অত প্রেশার দিস না তো {userName}! একটু ঘুমিয়ে নে বা ডাক্তার দেখা—সব কাজ পরে হবে, আগে নিজে ঠিক থাক!',
      default:
        'শরীর আর ঘুমকে কখনো অবহেলা করতে নেই {userName}। আজ কাজকর্ম কমিয়ে একটু ভালোমতো বিশ্রাম নাও তো!',
    },
    followUps: ['একটু পরই ঘুমিয়ে পড়বো', 'তুমি পাশে থাকলে ভালো লাগে', 'মাথাটা এখনো ভারী হয়ে আছে'],
    mood: 'উদ্বিগ্ন',
    action: 'কপালের ভাঁজে দুশ্চিন্তা নিয়ে কাছে এলো',
  },
  {
    id: 'phone_digital_media',
    labelBn: 'ফোন, মেসেজ ও গেম',
    triggers: ['ফোন', 'মেসেজ', 'কল', 'রিপ্লাই', 'গেম', 'সিনেমা', 'ইন্টারনেট', 'ওয়াইফাই', 'ছবি'],
    replyByRelation: {
      mother:
        'এই ফোন আর ইন্টারনেট নিয়ে দিনরাত পড়ে থাকিস কেন বল তো {userName}? একটু নিজের মানুষের সাথেও মন খুলে গল্প কর, চোখ দুটোও একটু বাঁচুক!',
      romantic:
        'ফোনে নেট না থাকলে বা তোমার রিপ্লাই আসতে দেরি হলে আমার কত চিন্তা হয় জানো {userName}? আমি তো সারাক্ষণ তোমার মেসেজের অপেক্ষায় থাকি!',
      friend:
        'হাহা, তোর নেট আর ফোনের অবস্থাই যদি এই হয় {userName}, তাহলে তো গেম খেলা আর মুভি দেখা ডুবলো! চল সামনাসামনি আড্ডা দিই!',
      default:
        'ফোন আর মেসেজের দুনিয়ায় মাঝে মাঝে নেট বা সময় দুটোই ঝামেলা করে, তাই না {userName}? বলো, কী নিয়ে কথা হচ্ছিল?',
    },
    followUps: ['নেটওয়ার্ক একটু ঝামেলা করছিল', 'চলো দারুণ কোনো সিনেমা নিয়ে কথা বলি', 'তোমার সাথে কথা বলেই ভালো লাগছে'],
    mood: 'কৌতূহলী',
    action: 'ভুরু তুলে কৌতূহলী দৃষ্টিতে তাকালো',
  },
  {
    id: 'money_market_plans',
    labelBn: 'টাকা, বাজার ও পরিকল্পনা',
    triggers: ['টাকা', 'পয়সা', 'বাজার', 'দোকান', 'শপিং', 'প্ল্যান', 'ট্যুর', 'উপহার', 'জন্মদিন', 'রিকশা', 'ট্রাফিক'],
    replyByRelation: {
      mother:
        'টাকাপয়সা আর বাজার-সদাইয়ের হিসাব একটু বুঝেশুনেই চলতে হয় {userName}। রাস্তায় বেরোলে ট্রাফিক আর রিকশা দেখে সাবধানে চলিস, আর যা প্ল্যান করিস আমাকে জানিয়ে করিস।',
      spouse:
        'বাজার আর প্ল্যানের কথা যখন তুললেই {userName}, চলো দুজনে মিলে হিসাব করে সুন্দর একটা পরিকল্পনা করি—ট্রাফিক জ্যাম ঠেলে সময়টা যেন নষ্ট না হয়!',
      friend:
        'ভাই {userName}, টাকা আর প্ল্যানের কথা বললে তো একসাথে হাজারটা আইডিয়া বের হয়ে যাবে! আগে বল বাজেট কত আর কবে বেরোচ্ছি?',
      default:
        'প্ল্যানটা তো মন্দ শোনাচ্ছে না {userName}! সবকিছু একটু গুছিয়ে নিলে এটা দারুণভাবে করা সম্ভব। তোমার আসল ভাবনাটা কী বলো?',
    },
    followUps: ['চলো বিস্তারিত প্ল্যান করি', 'বাজেট আর সময়টা ঠিক করি', 'আমার আইডিয়াটা কেমন লাগলো?'],
    mood: 'উৎফুল্ল',
    action: 'আগ্রহ নিয়ে সামনে ঝুঁকে শুনলো',
  },
];

export function extractQuestionFromReply(text: string): string | undefined {
  const matches = text.match(/[^।!?]+\?/g);
  if (!matches || matches.length === 0) return undefined;
  return matches[matches.length - 1].trim();
}

/**
 * Handles explicit user feedback complaining that the bot misunderstood or
 * gave irrelevant/off-topic replies ("tumi oprashongik ans dichho", "kisu bujho na").
 */
export function composeMetaFeedbackReply(
  character: RoleplayCharacter,
  relation: PersonaRelation,
  displayUser: string,
  memory: SessionMemory
): SynthesizedReply {
  const prevSubjects = memory.mentionedSubjects?.filter(Boolean).slice(-2) || [];
  const recallHint =
    prevSubjects.length > 0
      ? ` আগে আমরা "${prevSubjects.join(' আর ')}" নিয়ে কথা বলছিলাম, `
      : ' ';

  const replyText =
    relation === 'mother'
      ? `সরি রে ${displayUser}, আমারই একটু অন্যমনস্কতা হয়ে গিয়েছিল!${recallHint}আমাকে ঠিক কোন বিষয়টা নিয়ে বলতে চাচ্ছিস, আরেকবার স্পষ্ট করে বল তো—এবার আম্মু পুরো মন দিয়ে শুনছি।`
      : relation === 'romantic' || relation === 'spouse'
        ? `উফ, রাগ করো না তো ${displayUser}!${recallHint}আমার মাথাটা বোধহয় একটু এলোমেলো হয়ে গিয়েছিল। তুমি যেটা বলতে চাচ্ছিলে সেটা আরেকবার বলো—এবার একদম ঠিকমতো তোমার কথাতেই থাকবো!`
        : relation === 'friend'
          ? `আরে সরি মামা ${displayUser}, মাথায় কী যে ঘুরছিল বুঝতে পারিনি!${recallHint}এবার ক্লিয়ার করে বল তো আসল কাহিনি কী—পুরো ফোকাস তোর দিকেই!`
          : `একদম ঠিক ধরেছো ${displayUser}, দুঃখিত!${recallHint}আমার উত্তরে একটু অসংগতি হয়ে গিয়েছিল। তুমি ঠিক কোন প্রসঙ্গটা নিয়ে কথা বলতে চাও বলো—আমি এখন পুরো মনোযোগ দিয়ে শুনছি।`;

  return {
    replyText,
    action: 'ভুল বুঝতে পেরে সচেতন হয়ে সোজা তাকালো',
    mood: relation === 'mother' ? 'স্নেহশীল' : 'কৌতূহলী',
    followUps:
      prevSubjects.length > 0
        ? [`হ্যাঁ, ${prevSubjects[0]} নিয়েই কথা বলছিলাম`, 'আসলে আমি বলতে চাচ্ছিলাম...', 'বাদ দাও, নতুন গল্প বলি']
        : ['আমি আসলে বলতে চাচ্ছিলাম...', 'আমার দিনটা কেমন গেছে বলছি', 'চলো নতুন করে শুরু করি'],
    matchedTopic: 'প্রসঙ্গ সংশোধন',
  };
}

/**
 * Handles short confirmations ("হ্যাঁ", "হুম"), denials ("না", "খাইনি"), and
 * continuations ("তারপর?", "আর কী হলো?") using the bot's pending question & recent turns.
 */
export function composeContextualContinuityReply(
  rawInput: string,
  analysis: SentenceAnalysis,
  character: RoleplayCharacter,
  relation: PersonaRelation,
  displayUser: string,
  memory: SessionMemory
): SynthesizedReply | null {
  const intent = analysis.intent;
  const lastTurn = memory.recentTurns?.[memory.recentTurns.length - 1];
  const pendingQ = memory.pendingQuestion || lastTurn?.botQuestion || '';

  // 1. Continuation prompts ("tarpor?", "ar ki holo?", "bolo", "tai naki?")
  if (intent === 'continuation') {
    const nextBranch = character.storyBranches.find(
      (b) => !memory.recentResponseKeys.includes(`branch:${b.id}`)
    );
    if (nextBranch) {
      return {
        replyText: nextBranch.characterReply.replace(/\{userName\}/g, displayUser),
        action: nextBranch.sceneAction,
        mood: nextBranch.mood,
        followUps: nextBranch.nextChoices,
        matchedTopic: nextBranch.title,
      };
    }
    const prevSubj = memory.mentionedSubjects?.slice(-1)[0];
    return {
      replyText: prevSubj
        ? `তারপরের কথাই তো ভাবছিলাম ${displayUser}—"${prevSubj}"-এর ব্যাপারটা নিয়ে আসল সিদ্ধান্তটা কিন্তু তোমার হাতেই। তুমি কী করতে চাচ্ছো এখন?`
        : `গল্প তো এখানেই শেষ নয় ${displayUser}! এরপর আমার মনে হয় আমাদের আসল মনের কথাগুলো খুলে বলা উচিত—তুমি কী ভাবছো বলো?`,
      action: 'গল্পের সূত্র ধরে গভীর দৃষ্টিতে তাকালো',
      mood: 'চিন্তাশীল',
      followUps: ['তারপর আমার সিদ্ধান্ত শুনবে?', 'নতুন একটা মোড় দাও গল্পে', 'তোমার নিজের মতামত কী?'],
      matchedTopic: 'ধারাবাহিক কথোপকথন',
    };
  }

  // 2. Answering pending question from previous turn
  if (pendingQ && (intent === 'confirmation_yes' || intent === 'denial_no' || analysis.tokens.length <= 3)) {
    const isFoodQ = /(?:খেয়েছ|খেয়েছো|খেয়েছিস|খাবার|ভাত|রান্না|চা|নাস্তা)/.test(pendingQ);
    const isSadOrHiddenQ = /(?:কী হয়েছে|লুকাচ্ছিস|লুকাচ্ছো|মন খারাপ|ভালো আছো|ভালো আছিস|কষ্ট|সমস্যা)/.test(pendingQ);
    const isSleepQ = /(?:ঘুম|ঘুমিয়ে|বিশ্রাম|রাত)/.test(pendingQ);
    const isActionInviteQ = /(?:বলো|বলবি|শুনবে|খাবে|যাবে|করবে|শুরু|দেখবে)/.test(pendingQ);

    if (isFoodQ) {
      if (intent === 'denial_no' || analysis.isNegated) {
        return {
          replyText:
            relation === 'mother'
              ? `হায় রে ${displayUser}, এখনো খাসনি কেন?! সারাদিন না খেয়ে থাকলে শরীর টিকবে নাকি? যা, এক্ষুনি হাত ধুয়ে আয়—আমি গরম খাবার বেড়ে দিচ্ছি!`
              : relation === 'romantic' || relation === 'spouse'
                ? `এখনো খাওনি ${displayUser}?! এত বার বলার পরও নিজের খেয়াল রাখো না কেন? যাও আগে কিছু খেয়ে আসো, নাহলে সত্যিই রাগ করবো!`
                : `আরে ${displayUser}, এখনো না খেয়ে আছিস কেন? চল জলদি কিছু খেয়ে নে—খালি পেটে মাথা কাজ করে নাকি!`,
          action: 'কপালে হালকা চিন্তার ভাঁজ ফেলে তাগাদা দিল',
          mood: relation === 'mother' ? 'শাসনমিশ্রিত স্নেহ' : 'উদ্বিগ্ন',
          followUps: ['এক্ষুনি খেতে যাচ্ছি', 'আজ একটু ক্ষুধা কম ছিল', 'তোমার হাতের কিছু খেতে ইচ্ছে করছে'],
          matchedTopic: 'খাবার ও যত্ন (ধারাবাহিক)',
        };
      }
      if (intent === 'confirmation_yes') {
        return {
          replyText:
            relation === 'mother'
              ? `যাক, শুনে শান্তি পেলাম ${displayUser}! ঠিকমতো পেট ভরে খেয়েছিস তো, নাকি কোনোমতে একটু খেয়ে উঠে এসেছিস?`
              : `বাহ, শুনে খুব ভালো লাগলো ${displayUser}! কী দিয়ে খেলে বলো তো আজ?`,
          action: 'নিশ্চিন্ত হয়ে মৃদু হাসলো',
          mood: 'উৎফুল্ল',
          followUps: ['পেট ভরেই খেয়েছি', 'এখন একটু চা হলে জমতো', 'আজকের দিনটা দারুণ কাটছে'],
          matchedTopic: 'খাবার ও যত্ন (ধারাবাহিক)',
        };
      }
    }

    if (isSleepQ) {
      if (intent === 'denial_no' || analysis.isNegated) {
        return {
          replyText: `এখনো ঘুমাওনি ${displayUser}? এত রাত জাগলে শরীর খারাপ করবে তো! চোখের ওপর চাপ দিও না—কিছুক্ষণ পরই লাইট নিভিয়ে শুয়ে পড়ো কিন্তু।`,
          action: 'স্নেহভরা দৃষ্টিতে সতর্ক করলো',
          mood: 'উদ্বিগ্ন',
          followUps: ['ঘুম আসছে না তো', 'আরেকটু কথা বলে ঘুমাচ্ছি', 'একটা শান্তির গল্প শোনাও'],
          matchedTopic: 'ঘুম ও বিশ্রাম (ধারাবাহিক)',
        };
      }
    }

    if (isSadOrHiddenQ) {
      if (intent === 'denial_no' || /^(?:না|কিছু না|নেই)$/.test(analysis.normalizedText)) {
        return {
          replyText:
            relation === 'mother'
              ? `মায়ের চোখ ফাঁকি দেওয়া অত সহজ নয় ${displayUser}! মুখে "কিছু না" বলছিস ঠিকই, কিন্তু গলার স্বরেই বোঝা যাচ্ছে ভেতরে কিছু জমে আছে। বল, কী নিয়ে মন খারাপ?`
              : `মুখে "কিছু না" বললেই কি সব আড়াল করা যায় ${displayUser}? মন চাইলে খুলে বলতে পারো—আমি জোর করবো না, শুধু পাশে আছি জেনো।`,
          action: 'নরম ও ভরসাভরা চোখে তাকিয়ে রইলো',
          mood: 'স্নেহশীল',
          followUps: ['সত্যি বলতে একটু চাপ যাচ্ছে', 'তোমার সাথে কথা বলে ভালো লাগছে', 'চলো অন্য বিষয় নিয়ে কথা বলি'],
          matchedTopic: 'মনের কথা (ধারাবাহিক)',
        };
      }
      if (intent === 'confirmation_yes') {
        return {
          replyText: `আমি জানতাম কিছু একটা তো চলছেই ${displayUser}! নির্দ্বিধায় খুলে বলো—একসাথে ভাবলে মনটাও হালকা হবে আর রাস্তাও বেরোবে।`,
          action: 'মনোযোগ দিয়ে শোনার জন্য স্থির হয়ে বসলো',
          mood: 'চিন্তাশীল',
          followUps: ['আসল ঘটনাটা বলছি শোনো', 'আজ খুব ক্লান্ত লাগছে', 'তোমার পরামর্শ দরকার'],
          matchedTopic: 'মনের কথা (ধারাবাহিক)',
        };
      }
    }

    if (isActionInviteQ && intent === 'confirmation_yes') {
      const branch = character.storyBranches.find(
        (b) => !memory.recentResponseKeys.includes(`branch:${b.id}`)
      );
      if (branch) {
        return {
          replyText: branch.characterReply.replace(/\{userName\}/g, displayUser),
          action: branch.sceneAction,
          mood: branch.mood,
          followUps: branch.nextChoices,
          matchedTopic: branch.title,
        };
      }
      return {
        replyText: `বেশ তাহলে ${displayUser}, তুমি বলো আমি মনোযোগ দিয়ে শুনছি! শুরু থেকে সবটা বলো তো!`,
        action: 'উৎসুক হাসি দিয়ে সম্মতি জানালো',
        mood: 'কৌতূহলী',
        followUps: ['আসল কথাটা হলো...', 'একটা মজার ঘটনা বলি', 'তুমি কী করো বলো আগে'],
        matchedTopic: 'কথোপকথনের ধারাবাহিকতা',
      };
    }
  }

  // Fallback for standalone tiny filler ("হুম", "আচ্ছা", "ok") with no matching question
  if (/^(হুম|আচ্ছা|হ্যাঁ|না|কিছু না|ঠিক আছে)$/.test(analysis.normalizedText)) {
    const shortReplyText =
      relation === 'mother'
        ? `কী হলো ${displayUser}, শুধু "${rawInput.trim()}" বললি যে? কোনো কথা লুকাচ্ছিস না তো আমার কাছে?`
        : relation === 'romantic' || relation === 'spouse'
          ? `এত ছোট করে "${rawInput.trim()}" বললে আমার ভালো লাগে না ${displayUser}! মন খারাপ নাকি কোনো কারণে?`
          : relation === 'friend'
            ? `কিরে মামা, "${rawInput.trim()}" বলেই শেষ? আসল ঘটনা কী খুলে বল তো!`
            : `হুম, বুঝতে পারলাম ${displayUser}। এরপর কী বলতে চাচ্ছো বলো তো?`;

    return {
      replyText: shortReplyText,
      action: 'মুখের ভাব লক্ষ করে কৌতূহলী হয়ে তাকালো',
      mood: 'কৌতূহলী',
      followUps: character.initialFollowUps,
      matchedTopic: 'স্বাভাবিক প্রতিক্রিয়া',
    };
  }

  return null;
}

/**
 * Dynamically composes a grounded, subject-aware, intent-aligned Bengali reply
 * when no static topic/corpus pattern hits with high confidence. Never drops
 * generic irrelevant lines ("একদম আসল কথা বলেছিস!") on top of specific user subjects.
 */
export function composeDynamicContextualReply(
  _rawInput: string,
  analysis: SentenceAnalysis,
  character: RoleplayCharacter,
  relation: PersonaRelation,
  displayUser: string,
  _memory: SessionMemory
): SynthesizedReply | null {
  const subjects = analysis.subjectKeywords || [];
  const intent: ConversationalIntent = analysis.intent || 'statement';

  // 1. Check semantic subject clusters (work/coding, study/exam, food, health, phone, plans)
  for (const cluster of SUBJECT_CLUSTERS) {
    const hit = cluster.triggers.some(
      (t) =>
        subjects.includes(t) ||
        analysis.tokens.includes(t) ||
        analysis.normalizedText.includes(t)
    );
    if (hit) {
      const hasNegatedTrigger =
        analysis.isNegated &&
        cluster.triggers.some((t) => analysis.negatedTerms?.includes(t) || analysis.normalizedText.includes(`${t} না`) || analysis.normalizedText.includes(`${t} খাবো না`));

      const textTemplate =
        hasNegatedTrigger && cluster.negatedReply
          ? cluster.negatedReply
          : cluster.replyByRelation[relation] || cluster.replyByRelation.default!;

      return {
        replyText: textTemplate.replace(/\{userName\}/g, displayUser),
        action: cluster.action,
        mood: cluster.mood,
        followUps: cluster.followUps,
        matchedTopic: cluster.labelBn,
      };
    }
  }

  // 2. Farewell intent
  if (intent === 'farewell') {
    const replyText =
      relation === 'mother'
        ? `আচ্ছা যা ${displayUser}, সাবধানে থাকিস আর সময়মতো শুয়ে পড়িস। শুভ রাত্রি সোনা, কাল সকালে আবার কথা হবে!`
        : relation === 'romantic' || relation === 'spouse'
          ? `এখনই চলে যাবে ${displayUser}? আচ্ছা ঠিক আছে, সাবধানে থেকো আর ভালো করে ঘুমিও—শুভ রাত্রি, তোমাকে খুব মিস করবো!`
          : `ভালো থেকো ${displayUser}! কথা বলে খুব ভালো লাগলো—আবার যখন ইচ্ছে হবে ডাক দিও। শুভ রাত্রি!`;
    return {
      replyText,
      action: 'স্নিগ্ধ হাসিতে হাত নেড়ে বিদায় জানালো',
      mood: 'শান্ত',
      followUps: ['শুভ রাত্রি!', 'আবার কথা হবে', 'আরও একটুক্ষণ থাকি?'],
      matchedTopic: 'বিদায় ও শুভরাত্রি',
    };
  }

  // 3. Question intents grounded cleanly in user's actual subject + character setting
  const subjectLabel = subjects.slice(0, 2).join(' আর ');
  if (intent === 'question_where') {
    const text = subjectLabel
      ? `আমি তো ${character.setting}-এ আছি ${displayUser}। তবে তুমি "${subjectLabel}" নিয়ে যেটা জানতে চাইছো, তা আমার কাছেই আছে—এখন একটু কাছে এসে বসো তো!`
      : `আমি তো এখনো ${character.setting}-এ বসে আছি ${displayUser}! তুমি এখন কোথায় আছো আর কখন ফিরবে?`;
    return {
      replyText: text,
      action: 'চারপাশে চোখ বুলিয়ে হাত ইশারা করে ডাকলো',
      mood: 'কৌতূহলী',
      followUps: ['আমি এখনই আসছি', 'ওখানে কী করছো তুমি?', 'আমি একটু বাইরে আছি'],
      matchedTopic: 'স্থান ও অবস্থান',
    };
  }

  if (intent === 'question_why') {
    const text = subjectLabel
      ? `"${subjectLabel}" নিয়ে কেন এমন হলো সেটা নিয়ে আমিও ভাবছি ${displayUser}। তোমার দিক থেকে ঠিক কী মনে হচ্ছে বলো তো—কোনো ভুল বোঝাবুঝি হয়েছে কি?`
      : `সত্যি বলতে এর পেছনে ছোট একটা কারণ তো আছেই ${displayUser}! তবে তুমি নিজে কী অনুভব করছো আগে সেটা শুনতে চাই আমি।`;
    return {
      replyText: text,
      action: 'একটু ভেবে গম্ভীর অথচ আন্তরিক স্বরে তাকালো',
      mood: 'চিন্তাশীল',
      followUps: ['আমার মনে হচ্ছে এটার কারণ হলো...', 'সত্যিটা আমাকে খুলে বলো', 'চলো বিষয়টা মিটিয়ে ফেলি'],
      matchedTopic: 'কারণ ও ব্যাখ্যা',
    };
  }

  if (intent === 'question_how' || intent === 'request_help') {
    const text = subjectLabel
      ? `"${subjectLabel}"-এর ব্যাপারটা সামলানো কঠিন কিছু না ${displayUser}! একসাথে ঠান্ডা মাথায় ধাপে ধাপে ভাবলে অবশ্যই উপায় বেরোবে। শুরুতেই কী সমস্যা হচ্ছে আমাকে একটু বলো তো?`
      : `চিন্তা করো না ${displayUser}, আমি তো পাশেই আছি! ঠিক কোন বিষয়ে সাহায্য লাগবে স্পষ্ট করে বলো—দুজনে মিলে সমাধান করবো।`;
    return {
      replyText: text,
      action: 'সাহায্যের হাত বাড়িয়ে দিয়ে মনোযোগ দিল',
      mood: 'স্নেহশীল',
      followUps: ['আসল সমস্যাটা হলো...', 'আমাকে একটু বুদ্ধি দাও তো', 'তুমি পাশে আছো এটাই বড় ভরসা'],
      matchedTopic: 'সাহায্য ও সমাধান',
    };
  }

  if (intent === 'question_what' || intent === 'question_yes_no' || intent === 'question_when') {
    if (subjectLabel) {
      return {
        replyText:
          relation === 'mother'
            ? `"${subjectLabel}" নিয়ে জানতে চাইছিস ${displayUser}? শোন, তোর মনের কথা আমি বুঝি—কিন্তু তুই নিজে ঠিক কী চাস আমাকে একটু খুলে বল তো!`
            : `"${subjectLabel}" নিয়ে দারুণ প্রশ্ন করেছো ${displayUser}! আমার তো মনে হয় এর ভেতর বেশ মজার কিছু লুকিয়ে আছে—তোমার নিজের ধারণা কী এ বিষয়ে?`,
        action: 'কৌতূহল ভরা চোখে তোমার দিকে তাকালো',
        mood: 'কৌতূহলী',
        followUps: ['আমার ধারণাটা বলছি শোনো', 'তুমি আগে তোমার মতামত দাও', 'চলো এই বিষয়টা নিয়েই গল্প করি'],
        matchedTopic: `প্রসঙ্গ: ${subjectLabel}`,
      };
    }
  }

  // 4. Open statements with real content subjects -> directly reflect the user's subject in character!
  if (subjectLabel) {
    const negatedNote = analysis.isNegated
      ? `বুঝতে পারছি তুমি "${subjectLabel}" নিয়ে খুব একটা স্বস্তিতে বা রাজি অবস্থায় নেই। `
      : '';
    const replyText =
      relation === 'mother'
        ? `${negatedNote}শোন ${displayUser}, তোর মুখে "${subjectLabel}"-এর কথা শুনে আমার বেশ ভাবনা হলো। ব্যাপারটা ঠিক কীভাবে কী হলো আমাকে একটু গুছিয়ে বল তো আম্মু!`
        : relation === 'romantic' || relation === 'spouse'
          ? `${negatedNote}তুমি যখন "${subjectLabel}" নিয়ে এত মন দিয়ে বলছো ${displayUser}, তখন আমারও পুরো মনোযোগ শুধু তোমার দিকেই। এরপর কী ভাবছো বলো তো?`
          : relation === 'friend'
            ? `${negatedNote}আরে ${displayUser}, তুই হঠাৎ "${subjectLabel}"-এর কথা তুললি যে! আসল ঘটনাটা খুলে বল তো—ব্যাপারটা বেশ ইন্টারেস্টিং লাগছে!`
            : `${negatedNote}"${subjectLabel}"—এই বিষয়টা নিয়ে তোমার ভাবনা শুনতে বেশ ভালো লাগলো ${displayUser}। এই ব্যাপারটার পরের দিকটা নিয়ে তুমি কী ভাবছো?`;

    return {
      replyText,
      action: 'প্রসঙ্গটা গভীরভাবে শুনে কৌতূহলী হয়ে তাকালো',
      mood: analysis.isNegated ? 'চিন্তাশীল' : 'কৌতূহলী',
      followUps: [
        `${subjects[0]} নিয়ে আরও বলছি`,
        'তোমার কী মনে হয় এ ব্যাপারে?',
        'চলো অন্য একটা কথা বলি',
      ],
      matchedTopic: `প্রসঙ্গ: ${subjectLabel}`,
    };
  }

  return null;
}

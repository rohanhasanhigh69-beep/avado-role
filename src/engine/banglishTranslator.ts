/**
 * Comprehensive Offline Banglish -> Bengali NLU & Phonetic Normalization Engine.
 * Handles casual Romanized Bengali, Dhaka/Kolkata colloquial conjugations,
 * SMS shorthands, repeated-character elongation, and bounded fuzzy matching
 * without any external APIs.
 */

export interface BanglishLexiconItem {
  key: string;
  bn: string;
}

/**
 * Multi-word Banglish phrases matched longest-first before single-token pass.
 */
const BANGLISH_PHRASES: Array<[RegExp, string]> = [
  // Meta-feedback / misunderstanding
  [/\b(?:oprashongik|oprasongik|abaltabal|ulot palot|olotpalt|ulopalo)\s+(?:ans|answer|uttor|kotha|reply)\b/gi, 'অপ্রাসঙ্গিক উত্তর'],
  [/\b(?:tumi|tmi|tui|apni)\s+(?:kisu|kichu|kisui|kichui)\s+(?:bujho\s*na|bujhona|bujhcho\s*na|bujhteso\s*na|bujhchis\s*na|bujhoni|bujho)\b/gi, 'তুমি কিছু বুঝছো না'],
  [/\b(?:bujhte|bujhe)\s+(?:parchi\s*na|parsi\s*na|partesi\s*na|parchina|parsina|parchi|parsi|partesi)\b/gi, 'বুঝতে পারছি না'],
  [/\b(?:amake|amk|moke)\s+(?:bujho|bujhcho|bujhchis)\s+(?:na|nah)\b/gi, 'আমাকে বুঝছো না'],
  [/\b(?:eta|eita|ota|oita)\s+(?:ki|k)\s+(?:bolla|bolle|bolcho|bolso|answer|uttor)\b/gi, 'এটা কী বললে'],
  [/\b(?:amar|amr)\s+(?:kotha|ktha)\s+(?:shuno|shono|suncho|shunso)\b/gi, 'আমার কথা শোনো'],

  // Greetings & wellbeing
  [/\b(?:kemon|kmn|kmon)\s+(?:acho|aso|asos|asish|achish|achen|acho tumi|aso tumi)\b/gi, 'কেমন আছো'],
  [/\b(?:ki|k)\s+(?:obostha|obosta|hal|khobor|khbr)\b/gi, 'কী অবস্থা'],
  [/\b(?:valo|bhalo|vlo|bhlo)\s+(?:achi|asi|achhi|achilam|chilam)\b/gi, 'ভালো আছি'],
  [/\b(?:valo|bhalo|vlo|bhlo)\s+(?:nei|nai|na|lagche na|lagse na|lage na|lagtese na)\b/gi, 'ভালো নেই'],
  [/\b(?:mon|mn)\s+(?:kharap|khrp|baje|valo nei|bhalo nei|valo nai|bhalo nai|bhenge geche|vhange gese)\b/gi, 'মন খারাপ'],
  [/\b(?:mon|mn)\s+(?:ta|tao)\s+(?:ekdom|khub|onek|onk)?\s*(?:kharap|baje|valo nei|valo nai)\b/gi, 'মন খারাপ'],
  [/\b(?:good|shuvo|shubho)\s+(?:morning|sokal|shokal)\b/gi, 'শুভ সকাল'],
  [/\b(?:good|shuvo|shubho)\s+(?:night|rat|raat|ratri)\b/gi, 'শুভ রাত্রি'],
  [/\b(?:good|shuvo|shubho)\s+(?:evening|shondha|sondha)\b/gi, 'শুভ সন্ধ্যা'],
  [/\b(?:assalamu|salam)\s*(?:alaikum|walaikum)?\b/gi, 'আসসালামু আলাইকুম'],

  // Identity & activity questions
  [/\b(?:amar|amr)\s+(?:naam|nam|name)\b/gi, 'আমার নাম'],
  [/\b(?:tomar|tmr|tor)\s+(?:naam|nam|name)\b/gi, 'তোমার নাম'],
  [/\b(?:tumi|tmi|tui|apni)\s+(?:ke|k)\b/gi, 'তুমি কে'],
  [/\b(?:ki|k)\s+(?:koro|korcho|korso|korteso|korchis|koros|korsos|korchen|koren)\b/gi, 'কী করছো'],
  [/\b(?:kothay|kothai|koi)\s+(?:acho|aso|asos|asish|tumi|tui|geli|gela|geso|gecho)\b/gi, 'কোথায় আছো'],
  [/\b(?:kothay|kothai|koi)\s+(?:thako|thaken|jacho|jas|jasso|jabo)\b/gi, 'কোথায় থাকো'],
  [/\b(?:keno|kno|kn)\s+(?:emon|emne|erokom|emni)\s+(?:korcho|korso|korteso|koro|bolcho|bolso)\b/gi, 'কেন এমন করছো'],

  // Eating, hunger, cooking
  [/\b(?:khete|khawar|khabar)\s+(?:dao|de|debe|diba|lagbe|ichhe|icche)\b/gi, 'খাবার দাও'],
  [/\b(?:khuda|khida|khidha)\s+(?:lagche|lagse|lagtese|peyeche|pese|laglo|lage)\b/gi, 'ক্ষুধা লেগেছে'],
  [/\b(?:ki|k)\s+(?:ranna|randha)\s+(?:korcho|korecho|korso|korla|korle)\b/gi, 'কী রান্না করেছো'],
  [/\b(?:kheyecho|kheyecis|kheyechis|khaiso|khaicho|khaisos|kheyechen)\b/gi, 'খেয়েছো'],
  [/\b(?:akhono|ekhono|akhno|ekhno)?\s*(?:khai\s*nai|khaini|khai\s*ni|khabo\s*na|khamu\s*na)\b/gi, 'এখনো খাইনি'],
  [/\b(?:bhat|vat|khabar|biriyani|khichuri|cha|coffee)\s+(?:khabo\s*na|khamu\s*na|khai\s*na)\b/gi, 'খাবার খাবো না'],

  // Study, work, exams, pressure
  [/\b(?:boss|sir|manager)\s+(?:onek|khub)?\s*(?:boka|jhari|shashon|rag)\s*(?:dise|diyeche|dilo|korche|korse)\b/gi, 'বস বকা দিয়েছে'],
  [/\b(?:exam|porikkha|test|quiz|result)\s+(?:kharap|baje|valona|valo hoy nai)\s*(?:hoise|hoyeche|holo|gese)?\b/gi, 'পরীক্ষা খারাপ হয়েছে'],
  [/\b(?:khelte|ghurte|baire)\s+(?:jabo|jamu|jabi|jaite)\s+(?:na|nai)\b/gi, 'খেলতে যাবো না'],
  [/\b(?:khelte|ghurte|baire)\s+(?:jabo|jamu|jacchi|jachi|jassi)\b/gi, 'খেলতে যাবো'],
  [/\b(?:porbo|porbona|poramu|porbo na|porte)\s+(?:na|parbo na|valoge na)\b/gi, 'পড়বো না'],
  [/\b(?:porte|pora|porashona)\s+(?:boshbo|bosi|korbo|shuru)\b/gi, 'পড়াশোনা করবো'],

  // Health & sleep
  [/\b(?:shorir|shoril)\s+(?:kharap|valo na|bhalo na|baje|khub kharap)\b/gi, 'শরীর খারাপ'],
  [/\b(?:matha|mathay|matha-ta)\s+(?:betha|byatha|ghurche|ghurse|dhorche|dhorse|noshto)\b/gi, 'মাথাব্যথা'],
  [/\b(?:akhono|ekhono)\s+(?:ghumao\s*ni|ghumaoni|ghumai\s*ni|ghumaini|jago|jege)\b/gi, 'এখনো ঘুমাইনি'],
  [/\b(?:ghum|ghumaite)\s+(?:asche|ashche|asse|jabo|jamu|lagche|lagse)\b/gi, 'ঘুম আসছে'],
  [/\b(?:ghum|ghumaite)\s+(?:asche\s*na|ashche\s*na|asse\s*na|parchi\s*na|nai)\b/gi, 'ঘুম আসছে না'],

  // Relationship & emotion phrases
  [/\b(?:rag|raag|gussa)\s+(?:korcho|korchis|korecho|korso|koro|koris|rege acho|kore acho)\b/gi, 'রাগ করেছো'],
  [/\b(?:rag|raag|obhiman|obiman)\s+(?:koro\s*na|koriona|korbi\s*na|korish\s*na|korini|kori\s*nai)\b/gi, 'রাগ করো না'],
  [/\b(?:kotha|ktha)\s+(?:bolbo|bolmu|blbo)\s+(?:na|nah)\b/gi, 'কথা বলবো না'],
  [/\b(?:miss|mis)\s+(?:korchi|korsi|kortesi|korechi|korbo|korchis|koro)\b/gi, 'মিস করছি'],
  [/\b(?:i\s+love\s+you|love\s+you|valobashi|bhalobashi|valobasi|bhalobasi)\b/gi, 'ভালোবাসি'],
  [/\b(?:bhalobasha|valobasha|valobasa|bhalobasa)\b/gi, 'ভালোবাসা'],
  [/\b(?:bhul|vul)\s+(?:hoyeche|hoise|korechi|korsi|holo)\b/gi, 'ভুল হয়েছে'],
  [/\b(?:kotha|ktha)\s+(?:dicchi|dissi|dilam|diya|rakhbo)\b/gi, 'কথা দিচ্ছি'],
  [/\b(?:maaf|maf|khoma)\s+(?:kore|koro|koren|koris)\s*(?:dao|de|din)?\b/gi, 'ক্ষমা করো'],

  // Word meanings & questions
  [/\b(?:mane|meaning|ortho|orth)\s+(?:ki|k|what)\b/gi, 'মানে কী'],
  [/\b(?:mane|ortho)\s+(?:holo|ki|bujhao)\b/gi, 'মানে কী'],
  [/\b(?:tarpor|erpor|then)\s+(?:ki|k)\s+(?:holo|hoilo|hobe|hoyeche|hoise)\b/gi, 'তারপর কী হলো'],
  [/\b(?:tai|taina|tai\s+naki|shotti|sotti)\s*(?:naki|na ki|to)?\b/gi, 'তাই নাকি'],
  [/\b(?:kisu|kichu|kisui|kichui)\s+(?:na|nai|hoy\s*ni|hoyni)\b/gi, 'কিছু না'],
  [/\b(?:thik|thk|tk)\s+(?:ache|ase|aso|bolcho|bolso)\b/gi, 'ঠিক আছে'],
  [/\b(?:amar|amr)\s+(?:sathe|shathe|shate|songe)\b/gi, 'আমার সাথে'],
  [/\b(?:tomar|tmr)\s+(?:kache|kase|sathe|shathe|jonyo|jonno)\b/gi, 'তোমার কাছে'],
  [/\b(?:onek|onk)\s+(?:beshi|besi|boro|valo|bhalo|sundor|kharap|baje)\b/gi, 'অনেক বেশি'],
  [/\b(?:ki|k)\s+(?:kore|vabe|bhabe)\s+(?:korbo|hobe|bujhbo|jabo)\b/gi, 'কীভাবে করবো'],
  [/\b(?:parbo|pari|parchi|parsi)\s+(?:na|nah)\b/gi, 'পারবো না'],
  [/\b(?:jani|jano)\s+(?:na|nai|nah)\b/gi, 'জানি না'],
  [/\b(?:mone|mne)\s+(?:hoy|hoi|hocche|hose|porche|porse|nai|nei|ache|ase)\b/gi, 'মনে হয়'],
];

/**
 * Single-word Banglish -> Bengali dictionary (canonical forms).
 * Used both for direct replacement and as targets for phonetic/edit-distance matching.
 */
export const BANGLISH_SINGLE_WORD_MAP: Record<string, string> = {
  // Pronouns & people
  ami: 'আমি',
  am: 'আমি',
  amake: 'আমাকে',
  amk: 'আমাকে',
  moke: 'আমাকে',
  amar: 'আমার',
  amr: 'আমার',
  amader: 'আমাদের',
  tumi: 'তুমি',
  tmi: 'তুমি',
  tomake: 'তোমাকে',
  tmk: 'তোমাকে',
  tomay: 'তোমায়',
  tomar: 'তোমার',
  tmr: 'তোমার',
  tomader: 'তোমাদের',
  tui: 'তুই',
  toke: 'তোকে',
  tor: 'তোর',
  apni: 'আপনি',
  apnake: 'আপনাকে',
  apnar: 'আপনার',
  se: 'সে',
  she: 'সে',
  tar: 'তার',
  take: 'তাকে',
  ora: 'ওরা',
  tara: 'তারা',
  ammu: 'আম্মু',
  amma: 'আম্মা',
  maa: 'মা',
  ma: 'মা',
  abbu: 'আব্বু',
  abba: 'আব্বা',
  baba: 'বাবা',
  bhaiya: 'ভাইয়া',
  vaia: 'ভাইয়া',
  bhai: 'ভাই',
  vai: 'ভাই',
  apu: 'আপু',
  bon: 'বোন',
  bondhu: 'বন্ধু',
  dost: 'দোস্ত',
  bro: 'ব্রো',
  mama: 'মামা',
  bou: 'বউ',
  ginni: 'গিন্নি',
  jamai: 'জামাই',
  swami: 'স্বামী',
  gf: 'গার্লফ্রেন্ড',
  bf: 'বয়ফ্রেন্ড',
  girlfriend: 'গার্লফ্রেন্ড',
  boyfriend: 'বয়ফ্রেন্ড',
  premik: 'প্রেমিক',
  premika: 'প্রেমিকা',
  crush: 'ক্রাশ',
  jaanu: 'জান',
  jaan: 'জান',
  jan: 'জান',
  baby: 'বেবি',
  sona: 'সোনা',
  shona: 'সোনা',
  khoka: 'খোকা',
  khokon: 'খোকন',
  sir: 'স্যার',
  madam: 'ম্যাডাম',
  mam: 'ম্যাম',
  boss: 'বস',
  manager: 'ম্যানেজার',
  teacher: 'শিক্ষক',
  daktar: 'ডাক্তার',
  doctor: 'ডাক্তার',

  // Question words & connectors
  ki: 'কী',
  k: 'কী',
  keno: 'কেন',
  kno: 'কেন',
  kn: 'কেন',
  kobe: 'কবে',
  kokhon: 'কখন',
  kothay: 'কোথায়',
  kothai: 'কোথায়',
  koi: 'কই',
  kivabe: 'কীভাবে',
  kibhabe: 'কীভাবে',
  kemne: 'কেমনে',
  kemon: 'কেমন',
  kmn: 'কেমন',
  kmon: 'কেমন',
  koto: 'কত',
  kon: 'কোন',
  kar: 'কার',
  kader: 'কাদের',
  ke: 'কে',
  naki: 'নাকি',
  ar: 'আর',
  aar: 'আর',
  r: 'আর',
  kintu: 'কিন্তু',
  kntu: 'কিন্তু',
  tahole: 'তাহলে',
  taile: 'তাহলে',
  tobe: 'তবে',
  jodi: 'যদি',
  karon: 'কারণ',
  tai: 'তাই',
  asole: 'আসলে',
  ashole: 'আসলে',
  ebong: 'এবং',
  othoba: 'অথবা',
  mane: 'মানে',
  ortho: 'অর্থ',
  tarpor: 'তারপর',
  erpor: 'এরপর',
  jodio: 'যদিও',

  // Negations, affirmations & conversational fillers
  na: 'না',
  nah: 'না',
  nai: 'নাই',
  nei: 'নেই',
  ni: 'নি',
  ha: 'হ্যাঁ',
  haa: 'হ্যাঁ',
  han: 'হ্যাঁ',
  hyan: 'হ্যাঁ',
  ji: 'জ্বি',
  jee: 'জ্বি',
  hmm: 'হুম',
  hm: 'হুম',
  humm: 'হুম',
  accha: 'আচ্ছা',
  acha: 'আচ্ছা',
  achha: 'আচ্ছা',
  thik: 'ঠিক',
  thk: 'ঠিক',
  ok: 'ঠিক আছে',
  okay: 'ঠিক আছে',
  okey: 'ঠিক আছে',
  yes: 'হ্যাঁ',
  no: 'না',
  please: 'প্লিজ',
  plz: 'প্লিজ',
  pls: 'প্লিজ',
  sorry: 'সরি',
  sori: 'সরি',
  thanks: 'ধন্যবাদ',
  thx: 'ধন্যবাদ',
  dhonnobad: 'ধন্যবাদ',

  // Time & frequency
  ekhon: 'এখন',
  akhon: 'এখন',
  ekhn: 'এখন',
  akhn: 'এখন',
  ekhono: 'এখনো',
  akhono: 'এখনো',
  akhno: 'এখনো',
  aj: 'আজ',
  aaj: 'আজ',
  ajke: 'আজকে',
  aajke: 'আজকে',
  ajk: 'আজকে',
  kal: 'কাল',
  kalke: 'কালকে',
  porshu: 'পরশু',
  sokal: 'সকাল',
  shokal: 'সকাল',
  sokale: 'সকালে',
  dupur: 'দুপুর',
  dupure: 'দুপুরে',
  bikel: 'বিকাল',
  bikale: 'বিকালে',
  sondha: 'সন্ধ্যা',
  shondha: 'সন্ধ্যা',
  sondhay: 'সন্ধ্যায়',
  raat: 'রাত',
  rat: 'রাত',
  ratre: 'রাতে',
  rate: 'রাতে',
  shobshomoy: 'সবসময়',
  sobsomoy: 'সবসময়',
  kokhono: 'কখনো',
  abar: 'আবার',
  aabar: 'আবার',
  age: 'আগে',
  agay: 'আগে',
  pore: 'পরে',
  deri: 'দেরি',
  late: 'দেরি',
  taratari: 'তাড়াতাড়ি',
  jaldi: 'জলদি',
  shigghir: 'শিগগির',

  // Quantifiers & adjectives
  onek: 'অনেক',
  onk: 'অনেক',
  beshi: 'বেশি',
  besi: 'বেশি',
  bsi: 'বেশি',
  khub: 'খুব',
  ekdom: 'একদম',
  ekdm: 'একদম',
  ektu: 'একটু',
  ektukhani: 'একটুখানি',
  kom: 'কম',
  shob: 'সব',
  sob: 'সব',
  shobar: 'সবার',
  sobar: 'সবার',
  kichu: 'কিছু',
  kisu: 'কিছু',
  kichui: 'কিছুই',
  kisui: 'কিছুই',
  kono: 'কোনো',
  ekta: 'একটা',
  akta: 'একটা',
  duita: 'দুইটা',
  aro: 'আরো',
  valo: 'ভালো',
  bhalo: 'ভালো',
  vlo: 'ভালো',
  bhlo: 'ভালো',
  kharap: 'খারাপ',
  khrp: 'খারাপ',
  baje: 'বাজে',
  sundor: 'সুন্দর',
  shundor: 'সুন্দর',
  darun: 'দারুণ',
  osadharon: 'অসাধারণ',
  joss: 'জোস',
  osthir: 'অস্থির',
  maja: 'মজা',
  moja: 'মজা',
  boka: 'বোকা',
  pagol: 'পাগল',
  pagli: 'পাগলি',
  shotti: 'সত্যি',
  sotti: 'সত্যি',
  mittha: 'মিথ্যা',
  mitha: 'মিথ্যা',
  notun: 'নতুন',
  purono: 'পুরনো',
  boro: 'বড়',
  choto: 'ছোট',
  shanto: 'শান্ত',
  klanto: 'ক্লান্ত',
  tired: 'ক্লান্ত',
  happy: 'খুশি',
  sad: 'দুঃখ',
  angry: 'রাগান্বিত',
  busy: 'ব্যস্ত',
  besto: 'ব্যস্ত',
  byasto: 'ব্যস্ত',
  oprashongik: 'অপ্রাসঙ্গিক',
  oprasongik: 'অপ্রাসঙ্গিক',
  prashongik: 'প্রাসঙ্গিক',
  abaltabal: 'আবোলতাবোল',
  birokto: 'বিরক্ত',
  obak: 'অবাক',
  eka: 'একা',
  gorom: 'গরম',
  thanda: 'ঠান্ডা',
  meghla: 'মেঘলা',

  // Verbs & common inflections (present, continuous, past, future, imperative)
  achi: 'আছি',
  asi: 'আছি',
  acho: 'আছো',
  aso: 'আছো',
  achis: 'আছিস',
  asos: 'আছিস',
  achen: 'আছেন',
  ache: 'আছে',
  ase: 'আছে',
  chilam: 'ছিলাম',
  chilo: 'ছিল',
  silo: 'ছিল',
  hobe: 'হবে',
  hbe: 'হবে',
  hocche: 'হচ্ছে',
  hoche: 'হচ্ছে',
  hose: 'হচ্ছে',
  hoyeche: 'হয়েছে',
  hoise: 'হয়েছে',
  hoyechilo: 'হয়েছিল',
  hoisilo: 'হয়েছিল',
  holo: 'হলো',
  hoilo: 'হলো',
  hoy: 'হয়',
  hoi: 'হয়',
  koro: 'করো',
  kor: 'করো',
  kori: 'করি',
  korchi: 'করছি',
  korsi: 'করছি',
  kortesi: 'করছি',
  korcho: 'করছো',
  korso: 'করছো',
  korteso: 'করছো',
  korchis: 'করছিস',
  koros: 'করছিস',
  korbo: 'করবো',
  kormu: 'করবো',
  korbi: 'করবি',
  korlam: 'করলাম',
  korle: 'করলে',
  korla: 'করলে',
  korechi: 'করেছি',
  koresi: 'করেছি',
  korecho: 'করেছো',
  koreso: 'করেছো',
  korche: 'করছে',
  korse: 'করছে',
  bolo: 'বলো',
  bol: 'বলো',
  boli: 'বলি',
  bolchi: 'বলছি',
  bolsi: 'বলছি',
  boltesi: 'বলছি',
  bolcho: 'বলছো',
  bolso: 'বলছো',
  bolteso: 'বলছো',
  bolbo: 'বলবো',
  bolmu: 'বলবো',
  bollam: 'বললাম',
  bolle: 'বললে',
  bolla: 'বললে',
  bolechi: 'বলেছি',
  bolesi: 'বলেছি',
  bolche: 'বলছে',
  bolse: 'বলছে',
  shuno: 'শোনো',
  shono: 'শোনো',
  suno: 'শোনো',
  shun: 'শোনো',
  shuncho: 'শুনছো',
  shunso: 'শুনছো',
  shunlam: 'শুনলাম',
  shunbo: 'শুনবো',
  shuni: 'শুনি',
  dekho: 'দেখো',
  dekhi: 'দেখি',
  dekhcho: 'দেখছো',
  dekhso: 'দেখছো',
  dekhchi: 'দেখছি',
  dekhsi: 'দেখছি',
  dekhbo: 'দেখবো',
  dekhlam: 'দেখলাম',
  dekhechi: 'দেখেছি',
  bujhi: 'বুঝি',
  bujho: 'বুঝো',
  bujhcho: 'বুঝছো',
  bujhso: 'বুঝছো',
  bujhteso: 'বুঝছো',
  bujhchi: 'বুঝছি',
  bujhsi: 'বুঝছি',
  bujhlam: 'বুঝলাম',
  bujhechi: 'বুঝেছি',
  bujhesi: 'বুঝেছি',
  bujhe: 'বুঝে',
  bujhte: 'বুঝতে',
  bujhao: 'বোঝাও',
  jani: 'জানি',
  jano: 'জানো',
  janlam: 'জানলাম',
  janao: 'জানাও',
  janabo: 'জানাবো',
  jabo: 'যাবো',
  jamu: 'যাবো',
  jacchi: 'যাচ্ছি',
  jachi: 'যাচ্ছি',
  jassi: 'যাচ্ছি',
  jacho: 'যাচ্ছো',
  jao: 'যাও',
  gelo: 'গেল',
  geche: 'গেছে',
  gese: 'গেছে',
  gechi: 'গেছি',
  gesi: 'গেছি',
  geli: 'গেলি',
  asbo: 'আসবো',
  ashbo: 'আসবো',
  aschi: 'আসছি',
  ashchi: 'আসছি',
  asho: 'আসো',
  ay: 'আয়',
  eshechi: 'এসেছি',
  ashlam: 'আসলাম',
  esheche: 'এসেছে',
  ashse: 'এসেছে',
  khabo: 'খাবো',
  khamu: 'খাবো',
  khacchi: 'খাচ্ছি',
  khassi: 'খাচ্ছি',
  khao: 'খাও',
  kha: 'খা',
  kheyechi: 'খেয়েছি',
  khaisi: 'খেয়েছি',
  kheyecho: 'খেয়েছো',
  khaiso: 'খেয়েছো',
  kheyechis: 'খেয়েছিস',
  khaisos: 'খেয়েছিস',
  khai: 'খাই',
  khailam: 'খেলাম',
  thako: 'থাকো',
  thaki: 'থাকি',
  thakbo: 'থাকবো',
  thakmu: 'থাকবো',
  thak: 'থাক',
  thakcho: 'থাকছো',
  dao: 'দাও',
  de: 'দে',
  dibo: 'দিবো',
  dimu: 'দিবো',
  dichho: 'দিচ্ছো',
  diso: 'দিয়েছো',
  diyeche: 'দিয়েছে',
  dise: 'দিয়েছে',
  dilo: 'দিলো',
  dilam: 'দিলাম',
  nao: 'নাও',
  ne: 'নে',
  nibo: 'নিবো',
  niche: 'নিচ্ছে',
  nilo: 'নিলো',
  pari: 'পারে',
  paro: 'পারো',
  parbo: 'পারবো',
  parchi: 'পারছি',
  parsi: 'পারছি',
  parlam: 'পারলাম',
  chai: 'চাই',
  chao: 'চাও',
  chaichi: 'চাইছি',
  lagche: 'লাগছে',
  lagse: 'লাগছে',
  lagtese: 'লাগছে',
  lagbe: 'লাগবে',
  lage: 'লাগে',
  laglo: 'লাগলো',
  bosho: 'বসো',
  boso: 'বসো',
  boshe: 'বসে',
  ghumao: 'ঘুমাও',
  ghumabo: 'ঘুমাবো',
  ghumacchi: 'ঘুমাচ্ছি',
  ghumaisi: 'ঘুমিয়েছি',
  ghum: 'ঘুম',
  utho: 'উঠো',
  uthe: 'উঠে',
  hasho: 'হাসো',
  hashi: 'হাসি',
  kando: 'কাঁদো',
  kandchi: 'কাঁদছি',
  kanna: 'কান্না',
  poro: 'পড়ো',
  porchi: 'পড়ছি',
  porsi: 'পড়ছি',
  porbo: 'পড়বো',
  porte: 'পড়তে',
  likhchi: 'লিখছি',
  likho: 'লিখো',
  ans: 'উত্তর',
  answer: 'উত্তর',
  uttor: 'উত্তর',
  proshno: 'প্রশ্ন',
  question: 'প্রশ্ন',

  // Emotions, feelings & relationship nouns
  bhalobasha: 'ভালোবাসা',
  valobasha: 'ভালোবাসা',
  bhalobashi: 'ভালোবাসি',
  valobashi: 'ভালোবাসি',
  prem: 'প্রেম',
  obhiman: 'অভিমান',
  abhimani: 'অভিমানী',
  obiman: 'অভিমান',
  rag: 'রাগ',
  raag: 'রাগ',
  rege: 'রেগে',
  miss: 'মিস',
  kosto: 'কষ্ট',
  dukkho: 'দুঃখ',
  khushi: 'খুশি',
  anondo: 'আনন্দ',
  chinta: 'চিন্তা',
  tension: 'চিন্তা',
  pera: 'প্যারা',
  voy: 'ভয়',
  bhoy: 'ভয়',
  bhul: 'ভুল',
  vul: 'ভুল',
  maaf: 'ক্ষমা',
  maf: 'ক্ষমা',
  khoma: 'ক্ষমা',
  ador: 'আদর',
  maya: 'মায়া',
  bissash: 'বিশ্বাস',
  bishwas: 'বিশ্বাস',
  shopno: 'স্বপ্ন',
  sopno: 'স্বপ্ন',
  asha: 'আশা',
  khunsuti: 'খুনসুটি',
  shashon: 'শাসন',
  jhogra: 'ঝগড়া',
  jhamela: 'ঝামেলা',

  // Daily life, food, weather, tech, study, work
  bristi: 'বৃষ্টি',
  brishti: 'বৃষ্টি',
  megh: 'মেঘ',
  akash: 'আকাশ',
  aakash: 'আকাশ',
  batash: 'বাতাস',
  chand: 'চাঁদ',
  tara: 'তারা',
  surjo: 'সূর্য',
  nodi: 'নদী',
  pahar: 'পাহাড়',
  somudro: 'সমুদ্র',
  golpo: 'গল্প',
  kobita: 'কবিতা',
  gaan: 'গান',
  gan: 'গান',
  boi: 'বই',
  koutuk: 'কৌতুক',
  joke: 'কৌতুক',
  cha: 'চা',
  kofi: 'কফি',
  coffee: 'কফি',
  khichuri: 'খিচুড়ি',
  biriyani: 'বিরিয়ানি',
  biryani: 'বিরিয়ানি',
  ilish: 'ইলিশ',
  fuchka: 'ফুচকা',
  phuchka: 'ফুচকা',
  singara: 'সিঙ্গারা',
  misti: 'মিষ্টি',
  mishti: 'মিষ্টি',
  bhat: 'ভাত',
  vat: 'ভাত',
  mach: 'মাছ',
  maach: 'মাছ',
  mangsho: 'মাংস',
  dim: 'ডিম',
  dal: 'ডাল',
  ruti: 'রুটি',
  pani: 'পানি',
  jol: 'জল',
  ranna: 'রান্না',
  khabar: 'খাবার',
  khuda: 'ক্ষুধা',
  khida: 'ক্ষুধা',
  nasta: 'নাস্তা',
  dinner: 'ডিনার',
  lunch: 'দুপুরের খাবার',
  bazar: 'বাজার',
  dokan: 'দোকান',
  shopping: 'শপিং',
  taka: 'টাকা',
  poisha: 'পয়সা',
  salary: 'বেতন',
  beton: 'বেতন',
  gift: 'উপহার',
  upohar: 'উপহার',
  birthday: 'জন্মদিন',
  jonmodin: 'জন্মদিন',
  treat: 'ট্রিট',
  tong: 'টং',
  adda: 'আড্ডা',
  basha: 'বাসা',
  basay: 'বাসায়',
  bashay: 'বাসায়',
  bari: 'বাড়ি',
  barite: 'বাড়িতে',
  ghor: 'ঘর',
  ghore: 'ঘরে',
  chad: 'ছাদ',
  chade: 'ছাদে',
  rasta: 'রাস্তা',
  rastay: 'রাস্তায়',
  rickshaw: 'রিকশা',
  traffic: 'ট্রাফিক',
  oshudh: 'ওষুধ',
  osudh: 'ওষুধ',
  medicine: 'ওষুধ',
  jor: 'জ্বর',
  fever: 'জ্বর',
  matha: 'মাথা',
  betha: 'ব্যথা',
  headphone: 'হেডফোন',
  earphone: 'হেডফোন',
  phone: 'ফোন',
  laptop: 'ল্যাপটপ',
  computer: 'কম্পিউটার',
  internet: 'ইন্টারনেট',
  wifi: 'ওয়াইফাই',
  game: 'গেম',
  movie: 'সিনেমা',
  cinema: 'সিনেমা',
  message: 'মেসেজ',
  msg: 'মেসেজ',
  reply: 'রিপ্লাই',
  call: 'কল',
  porashona: 'পড়াশোনা',
  pora: 'পড়া',
  exam: 'পরীক্ষা',
  porikkha: 'পরীক্ষা',
  result: 'রেজাল্ট',
  assignment: 'অ্যাসাইনমেন্ট',
  class: 'ক্লাস',
  school: 'স্কুল',
  college: 'কলেজ',
  varsity: 'ভার্সিটি',
  university: 'ভার্সিটি',
  office: 'অফিস',
  ofis: 'অফিস',
  chakri: 'চাকরি',
  kaj: 'কাজ',
  kaaj: 'কাজ',
  code: 'কোড',
  coding: 'কোডিং',
  project: 'প্রজেক্ট',
  bug: 'বাগ',
  tour: 'ট্যুর',
  biye: 'বিয়ে',
  doa: 'দোয়া',
  biday: 'বিদায়',
  bye: 'বিদায়',
  tata: 'টাটা',
  hello: 'হ্যালো',
  hi: 'হাই',
  hey: 'হাই',
  kotha: 'কথা',
  din: 'দিন',
  shomoy: 'সময়',
  somoy: 'সময়',
  jibon: 'জীবন',
  manush: 'মানুষ',
  prithibi: 'পৃথিবী',
  chobi: 'ছবি',
  pic: 'ছবি',
  plan: 'প্ল্যান',
  problem: 'সমস্যা',
  somossa: 'সমস্যা',
  shomossa: 'সমস্যা',
  help: 'সাহায্য',
  sahajjo: 'সাহায্য',
  idea: 'আইডিয়া',
  story: 'গল্প',
  poem: 'কবিতা',
  song: 'গান',
  music: 'গান',
  book: 'বই',
  rain: 'বৃষ্টি',
  night: 'রাত',
  friend: 'বন্ধু',
  love: 'ভালোবাসা',
  feeling: 'অনুভূতি',
};

/**
 * Computes a phonetic canonical key for Romanized Banglish tokens so spelling
 * variants (valobasi / bhalobashi / valobashi, khabar / khabr, kemon / kmon)
 * map to the same skeleton.
 */
export function banglishPhoneticKey(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/([a-z])\1+/g, '$1') // collapse repeated chars: sooorry -> sory, valobashiii -> valobashi
    .replace(/bh/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/sh/g, 's')
    .replace(/chh/g, 'c')
    .replace(/ch/g, 'c')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/oo/g, 'u')
    .replace(/ee/g, 'i')
    .replace(/ou/g, 'o')
    .replace(/ow/g, 'o')
    .replace(/y/g, 'i')
    .replace(/w/g, 'o')
    .replace(/z/g, 'j')
    .replace(/q/g, 'k');
}

function boundedEditDistance(a: string, b: string, maxDist: number): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  if (a === b) return 0;

  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    let rowMin = dp[0];
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
      if (dp[j] < rowMin) rowMin = dp[j];
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return dp[n];
}

// Precomputed phonetic index & entry list for fast fuzzy Banglish lookup
const PHONETIC_INDEX = new Map<string, string>();
const BANGLISH_ENTRIES = Object.entries(BANGLISH_SINGLE_WORD_MAP);

for (const [roman, bn] of BANGLISH_ENTRIES) {
  const pKey = banglishPhoneticKey(roman);
  if (!PHONETIC_INDEX.has(pKey)) {
    PHONETIC_INDEX.set(pKey, bn);
  }
}

/**
 * Strips common colloquial Banglish suffixes (-ta, -ti, -teo, -o, -e, -r, -er, -ke, -te)
 * when matching unknown ASCII tokens.
 */
function stripBanglishSuffix(token: string): string {
  if (token.length <= 4) return token;
  const suffixes = ['gulo', 'ta', 'ti', 'teo', 'der', 'ke', 'te', 'er', 're'];
  for (const s of suffixes) {
    if (token.endsWith(s) && token.length - s.length >= 3) {
      return token.slice(0, token.length - s.length);
    }
  }
  return token;
}

/**
 * Resolves an ASCII Banglish token into its canonical Bengali equivalent using:
 * 1) Exact match
 * 2) Character-elongation collapse ("valobashiiii" -> "valobashi", "soorrrry" -> "sorry")
 * 3) Suffix stripping ("mon-ta" / "monta" -> "mon", "officete" -> "office")
 * 4) Phonetic skeleton lookup ("bhalobasi" == "valobashi", "oprashongik" == "oprasongik")
 * 5) Bounded typo distance lookup (max 1 edit for >=4 chars, max 2 for >=7 chars)
 */
export function translateBanglishToken(rawToken: string): string | null {
  const lower = rawToken.toLowerCase().trim();
  if (!lower || !/^[a-z]+$/.test(lower)) return null;

  if (BANGLISH_SINGLE_WORD_MAP[lower]) {
    return BANGLISH_SINGLE_WORD_MAP[lower];
  }

  // Collapse exaggerated repetitions: "sooorrrryyyy" -> "sorry", "plzzzz" -> "plz"
  const collapsed = lower.replace(/([a-z])\1{2,}/g, '$1$1');
  if (BANGLISH_SINGLE_WORD_MAP[collapsed]) {
    return BANGLISH_SINGLE_WORD_MAP[collapsed];
  }
  const singleCollapsed = lower.replace(/([a-z])\1+/g, '$1');
  if (BANGLISH_SINGLE_WORD_MAP[singleCollapsed]) {
    return BANGLISH_SINGLE_WORD_MAP[singleCollapsed];
  }

  // Suffix stripped form
  const stripped = stripBanglishSuffix(collapsed);
  if (stripped !== collapsed && BANGLISH_SINGLE_WORD_MAP[stripped]) {
    return BANGLISH_SINGLE_WORD_MAP[stripped];
  }

  // Phonetic skeleton match (handles v/bh, s/sh, c/ch, o/oo, i/ee, etc.)
  const pKey = banglishPhoneticKey(collapsed);
  if (pKey.length >= 2 && PHONETIC_INDEX.has(pKey)) {
    return PHONETIC_INDEX.get(pKey)!;
  }
  const pKeyStripped = banglishPhoneticKey(stripped);
  if (pKeyStripped.length >= 3 && PHONETIC_INDEX.has(pKeyStripped)) {
    return PHONETIC_INDEX.get(pKeyStripped)!;
  }

  // Bounded fuzzy typo rescue for longer Banglish words (>= 4 chars)
  if (collapsed.length >= 4) {
    const maxDist = collapsed.length >= 7 ? 2 : 1;
    let bestBn: string | null = null;
    let bestDist = maxDist + 1;

    for (const [candRoman, candBn] of BANGLISH_ENTRIES) {
      if (Math.abs(candRoman.length - collapsed.length) > maxDist) continue;
      if (candRoman[0] !== collapsed[0] && banglishPhoneticKey(candRoman[0]) !== banglishPhoneticKey(collapsed[0])) {
        continue;
      }
      const d = boundedEditDistance(collapsed, candRoman, maxDist);
      if (d < bestDist) {
        bestDist = d;
        bestBn = candBn;
        if (d === 1 && collapsed.length >= 6) break;
      }
    }
    if (bestBn) return bestBn;
  }

  return null;
}

/**
 * Normalizes a full Banglish / mixed / Bengali string into clean canonical Bengali.
 * Preserves unrecognized proper nouns/English words cleanly for downstream matching.
 */
export function normalizeBanglishAndBengali(raw: string): string {
  let text = raw
    .trim()
    .toLowerCase()
    .replace(/\u09DF/g, 'য়')
    .replace(/\u09DC/g, 'ড়')
    .replace(/\u09DD/g, 'ঢ়')
    .replace(/[।,!?;:"'()[\]{}\-–—]+/g, ' ')
    .replace(/\+/g, ' ');

  // Step 1: Apply multi-word Banglish phrase rules first
  for (const [pattern, bengali] of BANGLISH_PHRASES) {
    text = text.replace(pattern, ` ${bengali} `);
  }

  // Step 2: Token-by-token Banglish resolution (exact + elongation + suffix + phonetic + typo)
  const tokens = text.split(/\s+/).filter(Boolean);
  const resolved = tokens.map((tok) => {
    if (/^[a-z]+$/.test(tok)) {
      return translateBanglishToken(tok) || tok;
    }
    return tok;
  });

  text = resolved.join(' ');

  // Step 3: Canonicalize common colloquial Bengali variations
  text = text
    .replace(/(^|\s)কি(\s|$)/g, '$1কী$2')
    .replace(/(^|\s)কর(\s|$)/g, '$1করো$2')
    .replace(/(^|\s)করছ(\s|$)/g, '$1করছো$2')
    .replace(/(^|\s)আছ(\s|$)/g, '$1আছো$2')
    .replace(/(^|\s)বল(\s|$)/g, '$1বলো$2')
    .replace(/(^|\s)ভাল(\s|$)/g, '$1ভালো$2')
    .replace(/(^|\s)নাই(\s|$)/g, '$1নেই$2')
    .replace(/(^|\s)খাইনি(\s|$)/g, '$1খাইনি$2')
    .replace(/(^|\s)হইছে(\s|$)/g, '$1হয়েছে$2')
    .replace(/(^|\s)দিছে(\s|$)/g, '$1দিয়েছে$2')
    .replace(/(^|\s)গেছে(\s|$)/g, '$1গেছে$2')
    .replace(/(^|\s)করতেছো(\s|$)/g, '$1করছো$2')
    .replace(/(^|\s)বলতেছো(\s|$)/g, '$1বলছো$2')
    .replace(/(^|\s)কোথায়(\s|$)/g, '$1কোথায়$2');

  return text.replace(/\s+/g, ' ').trim();
}

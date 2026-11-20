import {
  BuiltinCharacterMood,
  BuiltinEmotionSignal,
  EmotionVoiceTone,
} from '../types/roleplay';

export interface BuiltinEmotionInfo {
  signal: BuiltinEmotionSignal;
  mood: BuiltinCharacterMood;
  descriptionBn: string;
  voiceTone: EmotionVoiceTone;
  sampleCues: string[];
}

export const BUILTIN_EMOTIONS: BuiltinEmotionInfo[] = [
  {
    signal: 'ভালোবাসা',
    mood: 'ভালোবাসাময়',
    descriptionBn: 'গভীর মায়া, ভালোবাসা ও হৃদয়ের উষ্ণ টান',
    voiceTone: 'gentle',
    sampleCues: ['ভালোবাসি', 'প্রিয়', 'মিস করছি', 'love you'],
  },
  {
    signal: 'স্নেহ',
    mood: 'স্নেহশীল',
    descriptionBn: 'মা-বাবা বা কাছের মানুষের আদর ও যত্নশীল অনুভূতি',
    voiceTone: 'gentle',
    sampleCues: ['খোকা', 'সোনা', 'খেয়েছিস', 'দোয়া'],
  },
  {
    signal: 'খুশি',
    mood: 'উৎফুল্ল',
    descriptionBn: 'আনন্দ, উচ্ছ্বাস ও মন ভালো থাকা',
    voiceTone: 'bright',
    sampleCues: ['দারুণ', 'আনন্দ', 'আহ্লাদ', 'খুশি'],
  },
  {
    signal: 'রাগ',
    mood: 'রাগান্বিত',
    descriptionBn: 'তীব্র অসন্তোষ, বকাঝকা বা কঠিন শাসনের মেজাজ',
    voiceTone: 'intense',
    sampleCues: ['রাগ', 'রেগে', 'পড়বো না', 'বিরক্ত'],
  },
  {
    signal: 'ভয় দেখানো',
    mood: 'চাপ ও শর্ত',
    descriptionBn: 'শর্ত দেওয়া, সতর্ক করা বা বাবাকে বলে দেওয়ার মতো চাপ',
    voiceTone: 'intense',
    sampleCues: ['বাবাকে বলে দিবো', 'শর্ত', 'সতর্ক', 'শাস্তি'],
  },
  {
    signal: 'অনুনয়',
    mood: 'নরম হওয়া',
    descriptionBn: 'ক্ষমা চাওয়া, প্লিজ বলা বা মন গলানোর বিনীত অনুরোধ',
    voiceTone: 'gentle',
    sampleCues: ['প্লিজ', 'অনুনয়', 'সরি', 'কথা দিচ্ছি'],
  },
  {
    signal: 'সম্মতি',
    mood: 'সম্মত ও খুশি',
    descriptionBn: 'বুঝিয়ে রাজি হওয়া, মেনে নেওয়া ও শর্তসাপেক্ষ সম্মতি',
    voiceTone: 'bright',
    sampleCues: ['ঠিক আছে', 'রাজি', 'মেনে নিলাম', 'যাও'],
  },
  {
    signal: 'অভিমান',
    mood: 'অভিমানী',
    descriptionBn: 'কাছের মানুষের অবহেলায় জমে থাকা আদুরে রাগ বা নীরব কষ্ট',
    voiceTone: 'gentle',
    sampleCues: ['অভিমান', 'মুখ ভার', 'অবহেলা', 'কথা বলবো না'],
  },
  {
    signal: 'দুঃখ',
    mood: 'ব্যথিত',
    descriptionBn: 'মন খারাপ, কান্না, একাকীত্ব বা হৃদয়ের ভারী বেদনা',
    voiceTone: 'gentle',
    sampleCues: ['কষ্ট', 'মন খারাপ', 'কান্না', 'দুঃখ'],
  },
  {
    signal: 'উদ্বেগ',
    mood: 'উদ্বিগ্ন',
    descriptionBn: 'অসুস্থতা, দেরি হওয়া বা কোনো বিপদ নিয়ে দুশ্চিন্তা',
    voiceTone: 'intense',
    sampleCues: ['চিন্তা', 'জ্বর', 'দেরি', 'টেনশন'],
  },
  {
    signal: 'ক্লান্তি',
    mood: 'ক্লান্ত',
    descriptionBn: 'কাজ বা পড়াশোনার চাপে শরীর ও মনের অবসাদ',
    voiceTone: 'gentle',
    sampleCues: ['ক্লান্ত', 'ঘুম', 'পরিশ্রম', 'tired'],
  },
  {
    signal: 'রসিকতা',
    mood: 'রসিক',
    descriptionBn: 'খুনসুটি, হাসি-ঠাট্টা ও প্রাণখোলা মজা',
    voiceTone: 'bright',
    sampleCues: ['খুনসুটি', 'মজা', 'হাসি', 'কৌতুক'],
  },
  {
    signal: 'কৃতজ্ঞতা',
    mood: 'উৎফুল্ল',
    descriptionBn: 'ধন্যবাদ, কৃতজ্ঞতা ও আন্তরিক স্বীকৃতি',
    voiceTone: 'bright',
    sampleCues: ['ধন্যবাদ', 'thanks', 'কৃতজ্ঞ', 'উপকার'],
  },
  {
    signal: 'কৌতূহল',
    mood: 'কৌতূহলী',
    descriptionBn: 'নতুন কিছু জানার আগ্রহ, প্রশ্ন ও গল্পের টান',
    voiceTone: 'calm',
    sampleCues: ['গল্প', 'কবিতা', 'কেন', 'মানে কী'],
  },
  {
    signal: 'শান্ত',
    mood: 'শান্ত',
    descriptionBn: 'স্বাভাবিক, স্থির ও সংযত কথোপকথনের মেজাজ',
    voiceTone: 'calm',
    sampleCues: ['স্বাভাবিক', 'সাবলীল', 'আচ্ছা', 'শান্ত'],
  },
];

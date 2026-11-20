import { FormEvent, useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { formatBengaliLocation } from '../engine/roleplayEngine';
import { CustomRule, PersonaRelation, RoleplayCharacter, VoiceGender } from '../types/roleplay';

interface CustomCharacterBuilderProps {
  onCreateCharacter: (character: RoleplayCharacter) => void;
}

const RELATION_OPTIONS: Array<{
  value: PersonaRelation;
  label: string;
  defaultRole: string;
  defaultFollowUps: string[];
}> = [
  {
    value: 'mother',
    label: 'Mother / Ammu (মা / আম্মু)',
    defaultRole: 'Snehomoyi Ammu',
    defaultFollowUps: ['Ki koro ammu?', 'Ajke ki ranna korecho?', 'Ammu khub khuda lagche'],
  },
  {
    value: 'romantic',
    label: 'Girlfriend / Boyfriend (GF / BF)',
    defaultRole: 'Bhalobashar Manush',
    defaultFollowUps: ['Ki koro jan?', 'Rag korcho naki?', 'Tomake onek miss korchi'],
  },
  {
    value: 'spouse',
    label: 'Husband / Wife (Jamai-Bou)',
    defaultRole: 'Life Partner',
    defaultFollowUps: ['Basay ki ranna korecho?', 'Bazar theke ki anbo?', 'Cholo aj baire dinner kori'],
  },
  {
    value: 'friend',
    label: 'Best Friend (Bondhu / Dost)',
    defaultRole: 'Close Friend',
    defaultFollowUps: ['Kemon achis dost?', 'Cholo tong e cha khai', 'Treat dibi kobe?'],
  },
  {
    value: 'father',
    label: 'Father / Abbu (বাবা / আব্বু)',
    defaultRole: 'Caring Abbu',
    defaultFollowUps: ['Kemon acho abbu?', 'Ki korcho ekhon?', 'Ekta poramorsho chai'],
  },
  {
    value: 'sibling',
    label: 'Brother / Sister (Bhaiya / Apu)',
    defaultRole: 'Sibling',
    defaultFollowUps: ['Tui ki korchis?', 'Amar headphone koi?', 'Cholo baire ghurte jai'],
  },
  {
    value: 'mentor',
    label: 'Teacher / Mentor',
    defaultRole: 'Wise Mentor',
    defaultFollowUps: ['Kemon achen?', 'Ekta upodesh din', 'Porashona niye kotha bolbo'],
  },
  {
    value: 'story',
    label: 'Story Character',
    defaultRole: 'Fictional Persona',
    defaultFollowUps: ['Tumi ke?', 'Tomar golpo bolo', 'Ekhane ki hocche?'],
  },
];

export function CustomCharacterBuilder({ onCreateCharacter }: CustomCharacterBuilderProps) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<PersonaRelation>('mother');
  const [role, setRole] = useState('');
  const [setting, setSetting] = useState('');
  const [gender, setGender] = useState<VoiceGender>('female');
  const [summary, setSummary] = useState('');
  const [greeting, setGreeting] = useState('');
  const [rules, setRules] = useState<Array<{ keywords: string; response: string }>>([
    { keywords: '', response: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  const handleRelationChange = (nextRelation: PersonaRelation) => {
    setRelation(nextRelation);
    if (nextRelation === 'mother') {
      setGender('female');
    } else if (nextRelation === 'father') {
      setGender('male');
    }
  };

  const handleAddRule = () => {
    setRules((prev) => [...prev, { keywords: '', response: '' }]);
  };

  const handleRemoveRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRuleChange = (idx: number, field: 'keywords' | 'response', value: string) => {
    setRules((prev) =>
      prev.map((rule, i) => (i === idx ? { ...rule, [field]: value } : rule))
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCreatedBanner(null);

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedSetting = setting.trim();
    const trimmedGreeting = greeting.trim();

    if (!trimmedName || !trimmedRole || !trimmedSetting || !trimmedGreeting) {
      setErrorMsg('Please fill in Character Name, Role, Setting, and Opening Greeting.');
      return;
    }

    const parsedRules: CustomRule[] = rules
      .map((r, idx) => ({
        id: `custom-rule-${Date.now()}-${idx}`,
        keywords: r.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        response: r.response.trim(),
        action: 'আন্তরিক ভঙ্গিতে তোমার দিকে তাকিয়ে উত্তর দিল',
      }))
      .filter((r) => r.keywords.length > 0 && r.response.length > 0);

    const relationMeta =
      RELATION_OPTIONS.find((opt) => opt.value === relation) || RELATION_OPTIONS[0];
    const locativeSetting = formatBengaliLocation(trimmedSetting);

    const fallbackText =
      relation === 'mother'
        ? `হুম, শুনছি তো {userName}—${locativeSetting} বসে তোর সব কথা মন দিয়ে শুনছি। শরীর ভালো আছে তো?`
        : relation === 'father'
          ? `ভালো বলেছো {userName}। ${locativeSetting} বসে তোমার সব কথা মন দিয়ে শুনছি। আরও বলো।`
          : `খুব সুন্দর কথা বলেছো {userName}! আমি ${trimmedName}—${locativeSetting} বসে তোমার কথা মন দিয়ে শুনছি। আরও বলো!`;

    const newChar: RoleplayCharacter = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      englishName: trimmedName,
      role: trimmedRole,
      setting: trimmedSetting,
      eraOrVibe: `Relation: ${relationMeta.label}`,
      gender,
      relation,
      avatarUrl: '',
      accentHex: gender === 'female' ? '#E11D48' : '#2563EB',
      personalitySummary:
        summary.trim() || `${trimmedName} (${trimmedRole}) — Custom Banglish/Bengali roleplay persona.`,
      greeting: trimmedGreeting,
      greetingAction:
        relation === 'mother' || relation === 'father'
          ? 'স্নেহভরা হাসি নিয়ে তোমার দিকে তাকালো'
          : 'নতুন দৃশ্যে এসে হাসিমুখে তোমাকে স্বাগত জানালো',
      initialFollowUps: [
        ...relationMeta.defaultFollowUps.slice(0, 3),
        ...(parsedRules[0]?.keywords[0] ? [parsedRules[0].keywords[0]] : []),
      ],
      voiceDefaults:
        gender === 'female'
          ? { pitch: 1.18, rate: 0.98, timbreHz: 245 }
          : { pitch: 0.78, rate: 0.94, timbreHz: 118 },
      storyBranches: [
        {
          id: `custom-branch-${Date.now()}`,
          title: relation === 'mother' ? 'Kitchen Tea & Talk' : 'First Scene',
          promptText:
            relation === 'mother'
              ? 'আম্মু, চলো একসাথে চা খাই আর গল্প করি!'
              : 'চলো আজ নতুন এক গল্পের শুরু করি!',
          sceneAction:
            relation === 'mother'
              ? 'স্নেহের হাসি নিয়ে দুটি কাপ হাতে এগিয়ে এলো'
              : 'চারপাশের পরিবেশ দেখে নিয়ে গভীর শ্বাস নিল',
          characterReply:
            relation === 'mother'
              ? `আয় {userName}, ${locativeSetting} বসে দুজনে মিলে আরাম করে চা খাই। বল, আজ সারাদিন কী কী করলি?`
              : `দারুণ প্রস্তাব! ${locativeSetting} বসে আমাদের এই নতুন যাত্রা দারুণ জমবে। কোন দিক থেকে শুরু করতে চাও?`,
          mood: relation === 'mother' ? 'স্নেহশীল' : 'উৎফুল্ল',
          nextChoices: relationMeta.defaultFollowUps,
        },
      ],
      topics: [],
      customRules: parsedRules,
      fallbacks: [
        {
          text: fallbackText,
          action: 'মনোযোগ দিয়ে মাথা নেড়ে সায় দিল',
          mood: relation === 'mother' || relation === 'father' ? 'স্নেহশীল' : 'কৌতূহলী',
          followUps: relationMeta.defaultFollowUps,
        },
      ],
      isCustom: true,
    };

    onCreateCharacter(newChar);
    setCreatedBanner(`${trimmedName} has been created and added to the Roleplay Studio!`);
    setName('');
    setRole('');
    setSetting('');
    setSummary('');
    setGreeting('');
    setRules([{ keywords: '', response: '' }]);
  };

  return (
    <section aria-labelledby="builder-heading" className="mx-auto max-w-[920px] px-4 py-8 sm:px-6">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-xs font-medium text-slate-500">
          100% Local Storage · Write in English, Banglish, or Bengali
        </p>
        <h1
          id="builder-heading"
          className="font-editorial mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          Create Custom Roleplay Character
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
      >
        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
          >
            {errorMsg}
          </div>
        )}

        {createdBanner && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{createdBanner}</span>
          </div>
        )}

        <div>
          <label htmlFor="char-relation-select" className="block text-xs font-semibold text-slate-800">
            Relationship & Speaking Tone
          </label>
          <select
            id="char-relation-select"
            value={relation}
            onChange={(e) => handleRelationChange(e.target.value as PersonaRelation)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            {RELATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Automatically activates realistic relationship knowledge (e.g. Ammu affection/scolding, GF obhiman, Friend adda).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="char-name-input" className="block text-xs font-semibold text-slate-800">
              Character Name *
            </label>
            <input
              id="char-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rabeya or রাবেয়া"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="char-role-input" className="block text-xs font-semibold text-slate-800">
              Role / Identity *
            </label>
            <input
              id="char-role-input"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Ammu, Elder Brother, GF"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="char-setting-input" className="block text-xs font-semibold text-slate-800">
              Setting / Location *
            </label>
            <input
              id="char-setting-input"
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="e.g. Amader basay or Home Kitchen"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-800">Character Voice</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${
                  gender === 'female'
                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Female Voice
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${
                  gender === 'male'
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Male Voice
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="char-summary-input" className="block text-xs font-semibold text-slate-800">
            Personality Summary (Optional)
          </label>
          <input
            id="char-summary-input"
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Describe their nature in English, Banglish, or Bengali..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="char-greeting-input" className="block text-xs font-semibold text-slate-800">
            Opening Greeting (What they say first) *
          </label>
          <textarea
            id="char-greeting-input"
            rows={2}
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="e.g. আয় খোকা, হাত-মুখ ধুয়ে খেয়ে নে! আজ সারাদিন কেমন কাটলো?"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Custom Trigger Words & Replies (Optional)
              </h2>
              <p className="text-xs text-slate-500">
                Supports both Banglish & Bengali keywords (comma-separated).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddRule}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-4">
                  <label htmlFor={`rule-kw-${idx}`} className="sr-only">
                    Keywords (comma-separated)
                  </label>
                  <input
                    id={`rule-kw-${idx}`}
                    type="text"
                    value={rule.keywords}
                    onChange={(e) => handleRuleChange(idx, 'keywords', e.target.value)}
                    placeholder="Keywords: e.g. khuda, ranna, cha"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-7">
                  <label htmlFor={`rule-res-${idx}`} className="sr-only">
                    Character Response
                  </label>
                  <input
                    id={`rule-res-${idx}`}
                    type="text"
                    value={rule.response}
                    onChange={(e) => handleRuleChange(idx, 'response', e.target.value)}
                    placeholder="Reply: e.g. এক্ষুনি গরম খাবার বেড়ে দিচ্ছি..."
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    aria-label="Remove rule"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Create & Save Character
          </button>
        </div>
      </form>
    </section>
  );
}

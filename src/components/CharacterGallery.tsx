import { useState } from 'react';
import { Volume2, MessageSquare, Trash2, Search } from 'lucide-react';
import { normalizeBengaliText } from '../engine/localIntelligence';
import { RoleplayCharacter, VoiceGender } from '../types/roleplay';
import { CharacterAvatar } from './CharacterAvatar';

interface CharacterGalleryProps {
  characters: RoleplayCharacter[];
  activeCharacterId: string;
  onSelectCharacter: (characterId: string) => void;
  onPreviewVoice: (character: RoleplayCharacter) => void;
  onDeleteCustomCharacter: (characterId: string) => void;
}

export function CharacterGallery({
  characters,
  activeCharacterId,
  onSelectCharacter,
  onPreviewVoice,
  onDeleteCustomCharacter,
}: CharacterGalleryProps) {
  const [filter, setFilter] = useState<'all' | VoiceGender>('all');
  const [query, setQuery] = useState('');

  const normQuery = normalizeBengaliText(query);
  const rawLower = query.trim().toLowerCase();

  const filtered = characters.filter((c) => {
    if (filter !== 'all' && c.gender !== filter) return false;
    if (!rawLower) return true;
    const haystack = `${c.name} ${c.englishName} ${c.role} ${c.setting} ${c.personalitySummary}`.toLowerCase();
    return (
      haystack.includes(rawLower) ||
      normalizeBengaliText(haystack).includes(normQuery)
    );
  });

  return (
    <section aria-labelledby="gallery-heading" className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            100% Offline Character Roster · Female & Male Voices · Bengali & Banglish
          </p>
          <h1
            id="gallery-heading"
            className="font-editorial mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Roleplay Characters & Custom Personas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="gallery-search" className="sr-only">
              Search characters in English, Banglish, or Bengali
            </label>
            <input
              id="gallery-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (e.g. ammu, gf, dost, bou)..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div
            role="group"
            aria-label="Filter by voice gender"
            className="flex items-center gap-1 self-start rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({characters.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('female')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === 'female'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Female Voice
            </button>
            <button
              type="button"
              onClick={() => setFilter('male')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === 'male'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Male Voice
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((char) => {
          const isCurrent = char.id === activeCharacterId;
          const voiceLabel = char.gender === 'female' ? 'Female Voice' : 'Male Voice';

          return (
            <article
              key={char.id}
              className={`flex flex-col justify-between rounded-xl border bg-white p-5 transition-shadow ${
                isCurrent ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-slate-200 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start gap-4">
                  <CharacterAvatar
                    src={char.avatarUrl}
                    alt={`${char.name} portrait`}
                    name={char.name}
                    accentHex={char.accentHex}
                    className="h-20 w-20 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-editorial truncate text-xl font-bold text-slate-900">
                        {char.name}
                      </h2>
                      {char.isCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomCharacter(char.id)}
                          aria-label={`Delete ${char.name}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{char.role}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span>{voiceLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{char.setting}</span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {char.personalitySummary}
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  Vibe: {char.eraOrVibe}
                  <span aria-hidden="true"> · </span>
                  Story Branches: {char.storyBranches.length}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => onSelectCharacter(char.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isCurrent ? 'Resume Chat' : 'Start Roleplay'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewVoice(char)}
                  aria-label={`Preview ${char.name} voice`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Preview Voice</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

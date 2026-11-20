import { useEffect, useRef, useState } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { BUILTIN_CHARACTERS, THEATRE_SCENES, TheatreScene } from '../data/characters';
import { voicePlayer } from '../engine/voiceEngine';
import { VoiceSettings } from '../types/roleplay';
import { CharacterAvatar } from './CharacterAvatar';

interface TheatreStageProps {
  voiceSettings: VoiceSettings;
  onStartChatWithCharacter: (characterId: string) => void;
}

export function TheatreStage({
  voiceSettings,
  onStartChatWithCharacter,
}: TheatreStageProps) {
  const [selectedScene, setSelectedScene] = useState<TheatreScene>(THEATRE_SCENES[0]);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      autoPlayCancelledRef.current = true;
      voicePlayer.stop();
    };
  }, []);

  const stopTheatreAudio = () => {
    autoPlayCancelledRef.current = true;
    setIsAutoPlaying(false);
    setActiveLineIndex(null);
    voicePlayer.stop();
  };

  const playLine = (index: number, continueAfter: boolean) => {
    const line = selectedScene.lines[index];
    if (!line) {
      setIsAutoPlaying(false);
      setActiveLineIndex(null);
      return;
    }

    setActiveLineIndex(index);
    voicePlayer.speak(
      line.text,
      line.gender,
      { ...voiceSettings, genderOverride: 'character' },
      {
        onEnd: () => {
          if (continueAfter && !autoPlayCancelledRef.current) {
            const nextIndex = index + 1;
            if (nextIndex < selectedScene.lines.length) {
              playLine(nextIndex, true);
            } else {
              setIsAutoPlaying(false);
              setActiveLineIndex(null);
            }
          } else {
            setActiveLineIndex(null);
          }
        },
      }
    );
  };

  const handlePlayAll = () => {
    if (isAutoPlaying) {
      stopTheatreAudio();
      return;
    }
    autoPlayCancelledRef.current = false;
    setIsAutoPlaying(true);
    playLine(0, true);
  };

  const femaleChar = BUILTIN_CHARACTERS.find((c) => c.id === selectedScene.femaleId)!;
  const maleChar = BUILTIN_CHARACTERS.find((c) => c.id === selectedScene.maleId)!;

  return (
    <section aria-labelledby="theatre-heading" className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Dual Female & Male Voices · 100% Offline Audio Drama
          </p>
          <h1
            id="theatre-heading"
            className="font-editorial mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Dual-Voice Audio Theatre Stage
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {THEATRE_SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => {
                stopTheatreAudio();
                setSelectedScene(scene);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedScene.id === scene.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {scene.title}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <CharacterAvatar
                src={femaleChar.avatarUrl}
                alt={femaleChar.name}
                name={femaleChar.name}
                className="h-14 w-14 rounded-full ring-2 ring-white"
              />
              <CharacterAvatar
                src={maleChar.avatarUrl}
                alt={maleChar.name}
                name={maleChar.name}
                className="h-14 w-14 rounded-full ring-2 ring-white"
              />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-slate-900">
                {selectedScene.title}
              </h2>
              <p className="text-xs text-slate-600">{selectedScene.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlayAll}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 ${
              isAutoPlaying ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isAutoPlaying ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Stop Scene</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Play Full Dialogue (Female & Male)</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {selectedScene.lines.map((line, index) => {
            const isPlaying = activeLineIndex === index;
            const charObj = line.gender === 'female' ? femaleChar : maleChar;

            return (
              <div
                key={`${selectedScene.id}-${index}`}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                  isPlaying
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200/80 bg-slate-50/40'
                }`}
              >
                <CharacterAvatar
                  src={charObj.avatarUrl}
                  alt={line.speakerName}
                  name={line.speakerName}
                  className="h-11 w-11 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {line.speakerName}{' '}
                      <span className="font-normal text-xs text-slate-500">
                        · {line.gender === 'female' ? 'Female Voice' : 'Male Voice'}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlaying) {
                          stopTheatreAudio();
                        } else {
                          autoPlayCancelledRef.current = true;
                          setIsAutoPlaying(false);
                          playLine(index, false);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                        isPlaying
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-editorial mt-1 text-xs italic text-slate-500">
                    * {line.action} *
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-800">{line.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">
            Jump straight into a 1-on-1 roleplay with either character:
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onStartChatWithCharacter(femaleChar.id)}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Chat with {femaleChar.englishName}
            </button>
            <button
              type="button"
              onClick={() => onStartChatWithCharacter(maleChar.id)}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Chat with {maleChar.englishName}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

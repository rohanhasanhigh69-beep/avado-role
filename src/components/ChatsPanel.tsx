import { ChatMessage } from '../types/roleplay';

interface ChatThread {
  id: string;
  title: string;
  characterName?: string;
  lastMessage?: string;
  updatedAt: number;
}

interface ChatsPanelProps {
  threads: ChatThread[];
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ChatsPanel({ threads, onSelect, onNewChat }: ChatsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <button
          onClick={onNewChat}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm"
        >
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {threads.length === 0 && (
          <p className="text-zinc-500 text-sm">No chats yet. Start a new one.</p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="w-full text-left p-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
          >
            <div className="font-medium text-sm truncate">{t.title || 'Untitled chat'}</div>
            {t.characterName && (
              <div className="text-xs text-rose-400">{t.characterName}</div>
            )}
            {t.lastMessage && (
              <div className="text-xs text-zinc-500 truncate mt-1">{t.lastMessage}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

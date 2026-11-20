import { ActiveTab } from '../types/roleplay';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSetupChat: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'studio', label: 'Roleplay Studio' },
  { id: 'chats', label: 'Chats' },
  { id: 'characters', label: 'Characters' },
  { id: 'theatre', label: 'Audio Theatre' },
  { id: 'trainer', label: 'AI Training' },
  { id: 'voice', label: 'Voice Lab' },
  { id: 'builder', label: 'Create Character' },
];

export function TopBar({ activeTab, onSelectTab, onOpenSetupChat }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('studio')}
          className="font-editorial text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Kothamala
        </button>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-blue-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenSetupChat}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            New Roleplay Setup
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-slate-100 px-3 py-1.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`text-[11px] font-medium whitespace-nowrap shrink-0 py-1 px-1 ${
                isActive ? 'text-blue-700 font-semibold border-b-2 border-blue-600' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

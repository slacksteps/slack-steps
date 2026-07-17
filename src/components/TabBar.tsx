import lockIcon from '../assets/icons/icn-lock.svg';

type Tab = 'Start' | 'Static' | 'Bounce';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isUnlocked: (tab: Tab) => boolean;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'Start', label: 'START' },
  { key: 'Static', label: 'STATIC' },
  { key: 'Bounce', label: 'BOUNCE' },
];

export function TabBar({ activeTab, onTabChange, isUnlocked }: TabBarProps) {
  return (
    <div className="rank-tabs flex border-b border-gray-200">
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        const unlocked = isUnlocked(tab.key);
        return (
          <button
            key={tab.key}
            onClick={() => { if (unlocked) onTabChange(tab.key); }}
            className={[
              'rank-tab flex-1 flex items-center justify-center py-3',
              active ? 'rank-tab-active border-b-2 border-black -mb-px' : '',
              unlocked ? 'rank-tab-unlocked' : 'rank-tab-locked rank-tab-disabled',
            ].join(' ')}
          >
            <span
              className={`font-jost font-bold leading-none ${
                active ? 'text-text-primary' : unlocked ? 'text-text-secondary' : 'text-gray-300'
              }`}
              style={{ fontSize: '16px' }}
            >
              {tab.label}
            </span>
            {!unlocked && (
              <img src={lockIcon} alt="locked" className="rank-tab-lock-icon w-6 h-6 opacity-50 ml-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

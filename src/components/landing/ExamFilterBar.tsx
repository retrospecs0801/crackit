import { ExamTag } from '@/types';

type FilterType = ExamTag | 'ALL';

interface ExamFilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function ExamFilterBar({ activeFilter, onFilterChange }: ExamFilterBarProps) {
  const tabs: FilterType[] = ['ALL', 'JEE', 'NEET', 'UPSC', 'CBSE', 'CAT'];

  return (
    <div className="w-full border-y border-ink bg-canvas sticky top-[56px] z-40">
      <div className="flex overflow-x-auto md:flex-wrap hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className={`flex-shrink-0 flex items-center font-mono text-[13px] px-[20px] py-[10px] transition-colors whitespace-nowrap ${
                isActive ? 'bg-ink text-white' : 'bg-transparent text-ink hover:bg-surface'
              }`}
            >
              {isActive && (
                <span className="w-[6px] h-[6px] rounded-full bg-ink-muted mr-2" />
              )}
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

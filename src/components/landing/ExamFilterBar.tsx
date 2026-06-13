import { ExamTag } from '@/types';

type FilterType = ExamTag | 'ALL';

interface ExamFilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function ExamFilterBar({ activeFilter, onFilterChange }: ExamFilterBarProps) {
  const tabs: FilterType[] = ['ALL', 'JEE', 'NEET', 'UPSC', 'CBSE', 'CAT'];

  return (
    <div className="w-full sticky top-[56px] z-40 py-2 border-b" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(12px)' }}>
      <div className="flex overflow-x-auto md:flex-wrap hide-scrollbar px-6 gap-2">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className="flex-shrink-0 flex items-center font-sans font-medium text-[13px] px-[16px] py-[6px] rounded-md transition-colors duration-150 whitespace-nowrap hover:opacity-80"
              style={isActive ? { backgroundColor: 'var(--tab-active-bg)', color: 'var(--tab-active-text)' } : { backgroundColor: 'transparent', color: 'var(--tab-inactive-text)' }}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

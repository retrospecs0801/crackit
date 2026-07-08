'use client';

import React, { useState, useMemo } from 'react';
import { formatLocalDate } from '@/lib/supabase/stats';

interface ContributionHeatmapProps {
  activityMap: Record<string, number>;
}

interface CellData {
  dateStr: string;
  dateObj: Date | null;
  count: number;
}

export function ContributionHeatmap({ activityMap }: ContributionHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    count: number;
    formattedDate: string;
  } | null>(null);

  const { cells, months } = useMemo(() => {
    const today = new Date();
    const resultCells: CellData[] = [];

    // 364 days ago up to today = 365 days
    const startDate = new Date(today.getTime() - 364 * 86400000);
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday

    // Pad leading empty cells so week starts on Sunday (row 0)
    for (let i = 0; i < startDayOfWeek; i++) {
      resultCells.push({
        dateStr: '',
        dateObj: null,
        count: 0,
      });
    }

    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const dateStr = formatLocalDate(d);
      resultCells.push({
        dateStr,
        dateObj: d,
        count: activityMap[dateStr] || 0,
      });
    }

    // Determine month labels across week columns
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    const totalWeeks = Math.ceil(resultCells.length / 7);
    for (let w = 0; w < totalWeeks; w++) {
      const cellInWeek = resultCells[w * 7];
      if (cellInWeek && cellInWeek.dateObj) {
        const m = cellInWeek.dateObj.getMonth();
        if (m !== lastMonth) {
          const shortMonth = cellInWeek.dateObj.toLocaleDateString('en-US', {
            month: 'short',
          });
          monthLabels.push({ label: shortMonth, weekIndex: w });
          lastMonth = m;
        }
      }
    }

    return { cells: resultCells, months: monthLabels };
  }, [activityMap]);

  const getCellColor = (count: number, isNull: boolean) => {
    if (isNull) return 'transparent';
    if (count === 0) return 'var(--heatmap-empty, #E0DBD5)';
    if (count === 1) return '#A3B89F';
    if (count <= 3) return '#7A9B76';
    return '#5C7A5A';
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Tooltip banner */}
      <div className="h-6 flex items-center justify-between font-mono text-xs text-text-secondary">
        {hoveredCell ? (
          <span className="text-text-primary font-medium">
            {hoveredCell.count === 0
              ? 'No study sessions'
              : `${hoveredCell.count} study ${
                  hoveredCell.count === 1 ? 'session' : 'sessions'
                }`}{' '}
            on {hoveredCell.formattedDate}
          </span>
        ) : (
          <span>Hover over a day to view activity</span>
        )}
        <div className="flex items-center gap-1.5 text-[10px] font-sans">
          <span>Less</span>
          <div
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ backgroundColor: 'var(--heatmap-empty, #E0DBD5)' }}
          />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#A3B89F' }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#7A9B76' }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#5C7A5A' }} />
          <span>More</span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-max flex flex-col gap-1.5">
          {/* Months header */}
          <div
            className="grid grid-flow-col gap-[3px] text-[10px] font-mono text-text-secondary pl-6"
            style={{
              gridTemplateColumns: `repeat(${Math.ceil(cells.length / 7)}, 12px)`,
            }}
          >
            {months.map((m, idx) => (
              <span
                key={idx}
                style={{ gridColumnStart: m.weekIndex + 1 }}
                className="col-span-3 truncate"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-2 items-start">
            {/* Day of Week Labels */}
            <div className="grid grid-rows-7 gap-[3px] text-[9px] font-mono text-text-secondary h-[102px] pr-1 pt-[1px]">
              <span className="h-3 flex items-center">Sun</span>
              <span className="h-3"></span>
              <span className="h-3 flex items-center">Tue</span>
              <span className="h-3"></span>
              <span className="h-3 flex items-center">Thu</span>
              <span className="h-3"></span>
              <span className="h-3 flex items-center">Sat</span>
            </div>

            {/* Heatmap 7x53 grid */}
            <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
              {cells.map((cell, idx) => {
                const isNull = !cell.dateObj;
                const formattedDate = cell.dateObj
                  ? cell.dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-[2.5px] transition-transform duration-100 ${
                      isNull ? 'pointer-events-none' : 'cursor-pointer hover:scale-125 hover:z-10'
                    }`}
                    style={{
                      backgroundColor: getCellColor(cell.count, isNull),
                    }}
                    onMouseEnter={() => {
                      if (!isNull) {
                        setHoveredCell({
                          dateStr: cell.dateStr,
                          count: cell.count,
                          formattedDate,
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { StudyStatsData } from '@/types';
import { ContributionHeatmap } from '@/components/profile/ContributionHeatmap';
import { Flame, Trophy, Calendar } from 'lucide-react';

interface StudyStatsProps {
  stats: StudyStatsData;
}

export function StudyStats({ stats }: StudyStatsProps) {
  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl p-7 border shadow-sm flex flex-col gap-6 mt-6"
      style={{
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        borderColor: 'var(--card-border, #E5E2DA)',
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-serif font-bold text-xl text-text-primary tracking-tight">
          Study Activity & Streaks
        </h2>
        <span className="font-sans text-xs text-text-secondary">
          Last 365 Days
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className="p-4 rounded-xl border border-border-default bg-canvas flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-accent-green mb-1">
            <Flame size={16} className="text-[#BC6C4F]" />
            <span className="font-sans font-semibold text-xs text-text-secondary uppercase tracking-wider">
              Current Streak
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-text-primary">
            {stats.currentStreak}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">
              days
            </span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-4 rounded-xl border border-border-default bg-canvas flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-text-secondary mb-1">
            <Trophy size={15} className="text-[#7A8B76]" />
            <span className="font-sans font-semibold text-xs uppercase tracking-wider">
              Longest Streak
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-text-primary">
            {stats.longestStreak}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">
              days
            </span>
          </div>
        </div>

        {/* Total Active Days */}
        <div className="p-4 rounded-xl border border-border-default bg-canvas flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-text-secondary mb-1">
            <Calendar size={15} />
            <span className="font-sans font-semibold text-xs uppercase tracking-wider">
              Active Days
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-text-primary">
            {stats.totalActiveDays}{' '}
            <span className="text-xs font-sans font-normal text-text-secondary">
              days
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="pt-2 border-t border-border-default">
        <ContributionHeatmap activityMap={stats.activityMap} />
      </div>
    </div>
  );
}

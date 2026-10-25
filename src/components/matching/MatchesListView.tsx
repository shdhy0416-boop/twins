import React from 'react';
import { MatchProfile, Language } from '../../types';
import { TwinMatchCard } from './TwinMatchCard';

interface MatchesListViewProps {
  matches: MatchProfile[];
  language: Language;
  onSelectMatch: (match: MatchProfile) => void;
  onCompareMatch: (match: MatchProfile) => void;
  onFindTwinCTA: () => void;
  savedProfileIds?: string[];
  onToggleSaveProfile?: (matchId: string) => void;
  onSendWave?: (match: MatchProfile) => void;
  onFilterByInterest?: () => void;
}

export const MatchesListView: React.FC<MatchesListViewProps> = ({
  matches,
  language,
  onSelectMatch,
  onCompareMatch,
  onFindTwinCTA,
  savedProfileIds = [],
  onToggleSaveProfile,
  onSendWave,
}) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-28 transition-colors">
      {/* Header */}
      <div className="bg-[#F8F7F2]/95 dark:bg-[#111813]/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-[#202923] dark:text-white flex items-center gap-1.5">
            <span>{language === 'ar' ? 'أقرب التوائم إليك' : 'Your Top Twin Matches'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#34D399] tabular-nums">
              {matches.length}
            </span>
          </h1>
          <p className="text-[11px] text-[#778078] dark:text-slate-400">
            {language === 'ar'
              ? 'مرتبين تصاعدياً حسب التوافق الذوقي الرياضي'
              : 'Ranked by mathematical taste synergy'}
          </p>
        </div>

        <button
          type="button"
          onClick={onFindTwinCTA}
          className="px-3 py-1.5 rounded-full bg-gradient-to-tr from-[#0B5D3B] to-[#10B981] text-white text-xs font-black shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          {language === 'ar' ? 'المطابقة الحية 🔥' : 'Live Twin 🔥'}
        </button>
      </div>

      {/* Ranked Twin Match Cards */}
      <div className="p-5 space-y-5">
        {matches.map((m, idx) => {
          const isSaved = savedProfileIds.includes(m.id);

          return (
            <TwinMatchCard
              key={m.id}
              match={m}
              rank={idx + 1}
              isSaved={isSaved}
              language={language}
              onSelect={() => onSelectMatch(m)}
              onCompare={() => onCompareMatch(m)}
              onWave={onSendWave ? () => onSendWave(m) : undefined}
              onToggleSave={onToggleSaveProfile ? () => onToggleSaveProfile(m.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

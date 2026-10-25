import React from 'react';
import { MatchProfile, Language } from '../../types';
import { TactilePillButton } from '../common/TactilePillButton';
import { TwinMatchCard } from '../matching/TwinMatchCard';
import {
  Bookmark,
  ArrowRight,
  ArrowLeft,
  Compass,
} from 'lucide-react';

interface SavedProfilesScreenProps {
  savedMatches: MatchProfile[];
  language: Language;
  onSelectMatch: (match: MatchProfile) => void;
  onCompareMatch: (match: MatchProfile) => void;
  onToggleSaveProfile: (matchId: string) => void;
  onDiscoverMore: () => void;
  onSendWave?: (match: MatchProfile) => void;
  onBack: () => void;
}

export const SavedProfilesScreen: React.FC<SavedProfilesScreenProps> = ({
  savedMatches,
  language,
  onSelectMatch,
  onCompareMatch,
  onToggleSaveProfile,
  onDiscoverMore,
  onSendWave,
  onBack,
}) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-28 transition-colors">
      {/* Header */}
      <div className="bg-[#F8F7F2]/95 dark:bg-[#111813]/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer active:scale-95"
          >
            {language === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          </button>
          <div>
            <h1 className="text-base font-black text-[#202923] dark:text-white flex items-center gap-1.5">
              <span>{language === 'ar' ? 'الملفات المحفوظة' : 'Saved Profiles'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF9E6] text-[#D4AF37] border border-[#D4AF37]/30 tabular-nums">
                {savedMatches.length}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        {savedMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFF9E6] dark:bg-[#2F2612] flex items-center justify-center text-[#D4AF37] mb-3">
              <Bookmark size={28} />
            </div>
            <h3 className="text-base font-black text-[#202923] dark:text-white">
              {language === 'ar' ? 'لا توجد ملفات محفوظة حالياً' : 'No Saved Profiles Yet'}
            </h3>
            <p className="text-xs text-[#778078] dark:text-slate-400 max-w-xs mt-1 mb-5">
              {language === 'ar'
                ? 'اضغط على زر النجمة أو الحفظ في أي بطاقة توأم لحفظها هنا والرجوع إليها ومقارنتها لاحقاً'
                : 'Bookmark your favorite twin profiles to revisit and compare them whenever you want'}
            </p>
            <TactilePillButton
              variant="primary"
              size="md"
              onClick={onDiscoverMore}
              icon={<Compass size={16} />}
            >
              {language === 'ar' ? 'استكشف التوائم الآن' : 'Discover Twins Now'}
            </TactilePillButton>
          </div>
        ) : (
          <div className="space-y-5">
            {savedMatches.map((m, idx) => (
              <TwinMatchCard
                key={m.id}
                match={m}
                rank={idx + 1}
                isSaved={true}
                language={language}
                onSelect={() => onSelectMatch(m)}
                onCompare={() => onCompareMatch(m)}
                onToggleSave={() => onToggleSaveProfile(m.id)}
                onWave={onSendWave ? () => onSendWave(m) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Language, MatchProfile } from '../../types';
import {
  VIBE_QUESTIONS,
  getDailyVibeAnswer,
  saveDailyVibeAnswer,
  getVibeStreak,
  getTodayDayInfo,
} from '../../data/vibeCheckData';
import { OrganicFloatingCard } from '../common/OrganicFloatingCard';
import { RealisticIcon } from '../common/RealisticIcon';
import {
  Sparkles,
  Flame,
  Share2,
  RefreshCw,
  Compass,
  Users,
  Zap,
  Check,
} from 'lucide-react';

interface VibeCheckCardProps {
  language: Language;
  userId?: string;
  topMatches?: MatchProfile[];
  onExploreDiscover?: () => void;
  onShareVibe?: (questionText: string, chosenOptionText: string) => void;
}

export const VibeCheckCard: React.FC<VibeCheckCardProps> = ({
  language,
  userId,
  topMatches = [],
  onExploreDiscover,
  onShareVibe,
}) => {
  const dayInfo = getTodayDayInfo(language);

  // The 1 primary daily vibe question
  const dailyQuestion = VIBE_QUESTIONS[0];
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState<number>(3);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'voting' | 'result'>('voting');

  // Load existing answer scoped to active userId on mount and user switch
  useEffect(() => {
    try {
      const stored = getDailyVibeAnswer(dailyQuestion.id, userId);
      if (stored) {
        setSelectedOptionId(stored);
        setViewMode('result');
      } else {
        setSelectedOptionId(null);
        setViewMode('voting');
      }
      setStreakCount(getVibeStreak(userId));
    } catch {
      // ignore
    }
  }, [dailyQuestion.id, userId]);

  // Single-select choice handler with soft-green interaction
  const handleSelectOption = (optionId: string) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([15, 20]);
      }
    } catch {
      // ignore
    }

    setSelectedOptionId(optionId);
    saveDailyVibeAnswer(dailyQuestion.id, optionId, userId);
    setStreakCount(getVibeStreak(userId));

    // In-place smooth flip into result mode
    setIsFlipping(true);
    setTimeout(() => {
      setViewMode('result');
      setIsFlipping(false);
    }, 180);
  };

  // Flip back to voting in-place
  const handleEditVote = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setViewMode('voting');
      setIsFlipping(false);
    }, 150);
  };

  // Calculations for big bold numbers in result view
  const selectedOption = dailyQuestion.options.find((o) => o.id === selectedOptionId);
  const selectedPercentage = selectedOption?.baseCommunityPercentage || 42;
  const totalBase = dailyQuestion.totalVotesBase || 3840;
  const countOfPeopleWithMood = Math.round((totalBase * selectedPercentage) / 100);

  const matchedTwin = topMatches[0];

  return (
    <OrganicFloatingCard
      className="p-3.5 sm:p-4 border-2 border-[#E2D9C8] dark:border-slate-800 shadow-md rounded-3xl bg-gradient-to-b from-[#FAF7F0] via-[#F5F1E8] to-[#EAE3D2] dark:from-[#1A241D] dark:via-[#151D18] dark:to-[#111713]"
      glowColor="rgba(16, 185, 129, 0.16)"
    >
      {/* 1. TOP HEADER: Day & Streak */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E7DFC9] dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#DDF3E7] to-[#FAF2D6] dark:from-[#0B5D3B]/40 dark:to-[#2F2612] flex items-center justify-center text-[#D4AF37] shadow-2xs">
            <Sparkles size={15} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bubble text-[11px] font-black uppercase tracking-wider text-[#D4AF37]">
                {language === 'ar' ? 'فحص المزاج اليومي' : 'Daily Vibe Check'}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="font-bubble text-[11px] text-[#0B5D3B] dark:text-[#34D399] font-black">
                {dayInfo.dayName}
              </span>
            </div>
          </div>
        </div>

        {/* Flame streak badge */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-b from-[#FFF5EB] to-[#FFE8D6] dark:from-[#331C0D] dark:to-[#241308] border border-[#FF9800]/40 shadow-2xs"
          title={language === 'ar' ? `حماس متواصل لـ ${streakCount} أيام!` : `${streakCount} Day Streak!`}
        >
          <Flame size={13} className="text-[#FF6B00] fill-[#FF6B00]" />
          <span className="font-bubble text-[11px] font-black text-[#C95100] dark:text-[#FFA726] leading-none">
            {streakCount} {language === 'ar' ? 'أيام' : 'd'}
          </span>
        </div>
      </div>

      {/* 2. HOOK TITLE COMPACT */}
      <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-[#0B5D3B]/10 via-[#D4AF37]/10 to-[#10B981]/15 dark:from-[#0B5D3B]/30 dark:via-[#1B271F] dark:to-[#2B2313] border border-[#0B5D3B]/25">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-[#D4AF37] animate-pulse" />
            <h3 className="font-bubble text-sm sm:text-base font-black text-[#202923] dark:text-white leading-tight">
              {language === 'ar'
                ? 'مين جوّه وموده نفس مودك اليوم؟ 🤔⚡'
                : 'Who shares your exact vibe today? 🤔⚡'}
            </h3>
          </div>
          <span className="text-[10px] text-[#778078] font-bold font-mono shrink-0">
            {dailyQuestion.totalVotesBase?.toLocaleString() || '3,840'} {language === 'ar' ? 'صوت' : 'votes'}
          </span>
        </div>
      </div>

      {/* 3. IN-PLACE FLIP: VOTING OR RESULT */}
      <div
        className={`mt-2.5 transition-all duration-200 ${
          isFlipping ? 'opacity-20 scale-98' : 'opacity-100 scale-100'
        }`}
      >
        {viewMode === 'voting' ? (
          /* ========================================================
             A. VOTING MODE: 1 Question, Pick 1 Option Only
             ======================================================== */
          <div className="space-y-2">
            {dailyQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option.id)}
                  className={`
                    group relative w-full rounded-xl p-2.5 text-start transition-all duration-150 cursor-pointer overflow-hidden border
                    bg-[#FAF7F0] dark:bg-[#1C261F]
                    hover:bg-[#E8F7EE] dark:hover:bg-[#0B5D3B]/30 hover:border-[#10B981] hover:shadow-xs
                    active:bg-[#DDF3E7] dark:active:bg-[#0B5D3B]/45 active:scale-[0.99]
                    ${
                      isSelected
                        ? 'bg-[#E8F7EE] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] dark:border-[#34D399] shadow-xs'
                        : 'border-[#E2D9C8] dark:border-slate-800'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                          isSelected
                            ? 'bg-[#0B5D3B] text-white dark:bg-[#34D399] dark:text-[#062618]'
                            : 'bg-[#F2ECE0] dark:bg-slate-800 text-[#778078] group-hover:bg-[#0B5D3B] group-hover:text-white'
                        }`}
                      >
                        <RealisticIcon name={option.icon || 'sparkles'} size={20} />
                      </div>

                      <div>
                        <span className="font-bubble text-xs sm:text-sm font-black text-[#202923] dark:text-white block leading-snug">
                          {language === 'ar' ? option.labelAr : option.labelEn}
                        </span>
                        <span className="font-bubble text-[10px] text-[#778078] dark:text-slate-400 block">
                          {language === 'ar' ? option.vibeTagAr : option.vibeTagEn}
                        </span>
                      </div>
                    </div>

                    {/* Radio Selector */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#0B5D3B] dark:border-[#34D399] bg-[#0B5D3B] dark:bg-[#34D399]'
                          : 'border-slate-300 dark:border-slate-700 group-hover:border-[#10B981] group-hover:bg-[#DDF3E7]'
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white dark:text-[#062618] stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="text-center pt-1">
              <span className="font-bubble text-[11px] text-[#0B5D3B] dark:text-[#34D399] font-black">
                {language === 'ar'
                  ? '👈 اختر واحداً لمعرفة نتيجتك فوراً في نفس المكان'
                  : '👈 Select one option to reveal your results in-place'}
              </span>
            </div>
          </div>
        ) : (
          /* ========================================================
             B. SHORTENED / COMPACT RESULT VIEW (قصرو شوي)
             Clean, space-efficient, big bold numbers without huge height!
             ======================================================== */
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-[#FAF7F0] via-[#F5F1E8] to-[#ECE5D8] dark:from-[#1A241D] dark:via-[#151D18] dark:to-[#111713] border-2 border-[#0B5D3B] shadow-sm animate-fade-in space-y-3">
            
            {/* COMPACT HERO: Percentage & Count */}
            <div className="flex items-center justify-between px-2 pt-1 pb-2.5 border-b border-[#E2D9C8] dark:border-slate-800">
              <div>
                <span className="font-bubble text-[10px] font-black uppercase tracking-wider text-[#D4AF37] block">
                  {language === 'ar' ? 'نتيجة تطابق المود مع المجتمع' : 'Community Vibe Match'}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-bubble text-3xl sm:text-4xl font-black text-[#0B5D3B] dark:text-[#34D399] tracking-tight leading-none">
                    {selectedPercentage}%
                  </span>
                  <span className="font-bubble text-sm sm:text-base font-black text-[#202923] dark:text-white">
                    +{countOfPeopleWithMood.toLocaleString()} {language === 'ar' ? 'شخص' : 'people'}
                  </span>
                </div>
                <span className="font-bubble text-[10px] font-bold text-[#778078] dark:text-slate-400 block mt-0.5">
                  {language === 'ar' ? 'مطابقين لنفس مودك وخيارك اليوم!' : 'share your exact mood today!'}
                </span>
              </div>

              {/* Selected Choice Pill */}
              {selectedOption && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#E8F7EE] dark:bg-[#1E2721] border border-[#0B5D3B]/40 shadow-2xs max-w-[140px] shrink-0">
                  <div className="w-5 h-5 rounded-lg bg-[#0B5D3B] text-white flex items-center justify-center shrink-0">
                    <RealisticIcon name={selectedOption.icon || 'sparkles'} size={12} />
                  </div>
                  <span className="font-bubble text-[11px] font-black text-[#0B5D3B] dark:text-[#34D399] truncate">
                    {language === 'ar' ? optionShortLabel(selectedOption.labelAr) : selectedOption.labelEn}
                  </span>
                </div>
              )}
            </div>

            {/* SLEEK SINGLE-LINE DISTRIBUTION BARS (شريط مدمج لكل خيار) */}
            <div className="space-y-1.5">
              <span className="font-bubble text-[10px] font-black uppercase text-[#778078] dark:text-slate-400 block px-0.5">
                {language === 'ar' ? 'توزيع تصويت المجتمع على الخيارات:' : 'Vote Distribution:'}
              </span>

              {dailyQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;

                return (
                  <div
                    key={option.id}
                    className={`relative h-8 rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-[#0B5D3B] dark:border-[#34D399] bg-[#E8F7EE]/80 dark:bg-[#0B5D3B]/30'
                        : 'border-[#E2D9C8]/80 dark:border-slate-800 bg-[#F2ECE0]/60 dark:bg-slate-800/40'
                    }`}
                  >
                    {/* Fill Progress */}
                    <div
                      className={`absolute top-0 bottom-0 start-0 rounded-xl transition-all duration-700 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#0B5D3B]/25 to-[#10B981]/30'
                          : 'bg-slate-300/40 dark:bg-slate-700/40'
                      }`}
                      style={{ width: `${option.baseCommunityPercentage}%` }}
                    />

                    {/* Text Row */}
                    <div className="relative z-10 h-full px-2.5 flex items-center justify-between text-xs font-bubble font-black">
                      <div className="flex items-center gap-1.5 truncate">
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#0B5D3B] text-white text-[8px] flex items-center justify-center shrink-0">
                            ✓
                          </span>
                        )}
                        <span className={isSelected ? 'text-[#0B5D3B] dark:text-[#34D399]' : 'text-[#202923] dark:text-slate-300'}>
                          {language === 'ar' ? option.labelAr : option.labelEn}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-[#0B5D3B] dark:text-[#34D399] shrink-0 font-mono">
                        {option.baseCommunityPercentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* COMPACT TWIN MATCH SPOTLIGHT */}
            {matchedTwin && (
              <div className="p-2 rounded-xl bg-gradient-to-r from-[#DDF3E7] to-[#FAF2D6] dark:from-[#0B5D3B]/25 dark:to-[#2B2313]/25 border border-[#0B5D3B]/30 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-bubble text-[11px] font-black text-[#0B5D3B] dark:text-[#34D399] truncate">
                  <Users size={14} className="shrink-0" />
                  <span className="truncate">
                    {language === 'ar' ? (
                      <>
                        شبيهك <span dir="ltr" className="underline font-black">@{matchedTwin.username}</span> صوّت لنفس خيارك!
                      </>
                    ) : (
                      <>
                        Your twin <span dir="ltr" className="underline font-black">@{matchedTwin.username}</span> voted the same!
                      </>
                    )}
                  </span>
                </div>
                <span className="font-bubble text-[10px] font-black text-[#D4AF37] px-2 py-0.5 rounded-full bg-[#FAF7F0] dark:bg-[#1E2721] border border-amber-300/40 shrink-0">
                  {matchedTwin.similarityScore}% توافق
                </span>
              </div>
            )}

            {/* COMPACT ACTION BUTTONS */}
            <div className="pt-2 border-t border-[#E2D9C8] dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={handleEditVote}
                className="flex-1 h-9 px-3 rounded-xl bg-[#F0EAE0] hover:bg-[#E8F7EE] dark:bg-slate-800 dark:hover:bg-[#0B5D3B]/30 text-[#202923] dark:text-white font-bubble text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 border border-[#E2D9C8] dark:border-slate-700"
              >
                <RefreshCw size={13} />
                <span>{language === 'ar' ? 'تعديل خياري' : 'Change'}</span>
              </button>

              {onShareVibe && selectedOption && (
                <button
                  type="button"
                  onClick={() =>
                    onShareVibe(
                      language === 'ar' ? dailyQuestion.titleAr : dailyQuestion.titleEn,
                      language === 'ar' ? selectedOption.labelAr : selectedOption.labelEn
                    )
                  }
                  className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white font-bubble text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-98"
                >
                  <Share2 size={13} />
                  <span>{language === 'ar' ? 'مشاركة' : 'Share'}</span>
                </button>
              )}

              {onExploreDiscover && (
                <button
                  type="button"
                  onClick={onExploreDiscover}
                  className="h-9 w-9 rounded-xl bg-[#F0EAE0] dark:bg-[#1E2721] border border-[#E2D9C8] dark:border-slate-800 text-[#0B5D3B] dark:text-[#34D399] font-bubble flex items-center justify-center cursor-pointer hover:bg-[#E8F7EE]"
                  title={language === 'ar' ? 'استكشف التوائم' : 'Explore Twins'}
                >
                  <Compass size={15} />
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </OrganicFloatingCard>
  );
};

// Quick helper to keep pill title short
function optionShortLabel(label: string): string {
  if (label.includes('/')) return label.split('/')[0].trim();
  return label;
}

import React, { useEffect, useState } from 'react';
import { Language, Question } from '../../types';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import { RealisticIcon } from '../common/RealisticIcon';
import { TactilePillButton } from '../common/TactilePillButton';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { playClickPop, playLightModeSound, playHighFiveSound } from '../../utils/soundEffects';
import { ArrowLeft, ArrowRight, Check, X, Sparkles, Flame, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveOnboardingProps {
  initialAnswers: Record<string, string | string[]>;
  language: Language;
  onComplete: (answers: Record<string, string | string[]>) => void;
  onExit: () => void;
  /** Optional explicit question list used by Admin Category Preview */
  questionsOverride?: Question[];
  /** Renders inside a bounded preview container instead of full viewport height */
  embeddedPreview?: boolean;
}

const MILESTONE_STAGE_INDEX = 9; // Index 9 = Question 10 (المرحلة العاشرة)

const MILESTONE_FACES = [
  { emoji: '🤩', labelAr: 'متحمس أشوف توأمي!', labelEn: 'Excited to meet my Twin!' },
  { emoji: '🥳', labelAr: 'قربنا نختم البصمة!', labelEn: 'Almost at the finish line!' },
  { emoji: '😎', labelAr: 'ذوقك فخم ومميز!', labelEn: 'Iconic taste profile!' },
  { emoji: '😉', labelAr: 'باقي خطوات خفيفة!', labelEn: 'Just a few quick taps!' },
];

export const GlowOptionCardButton: React.FC<{
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isSelected, onClick, children }) => {
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  return (
    <button
      type="button"
      onClick={onClick}
      data-custom-glow="true"
      data-fixed-size="true"
      {...glowHandlers}
      className={`
        relative overflow-hidden w-full h-[84px] min-h-[84px] max-h-[84px] px-4 py-2.5 rounded-3xl flex items-center justify-between gap-3 text-start transition-colors duration-200 select-none cursor-pointer border
        ${
          isSelected
            ? 'bg-gradient-to-b from-[#DDF3E7] to-[#CCEEDC] dark:from-[#0B5D3B]/40 dark:to-[#08422A] border-[#0B5D3B] text-[#07472B] dark:text-[#34D399] shadow-[0_4px_0_0_#0B5D3B/30]'
            : 'bg-white dark:bg-[#1E2721] border-slate-200/80 dark:border-slate-800 text-[#202923] dark:text-white hover:border-[#0B5D3B]/40 shadow-[0_4px_0_0_#D5CEBE] dark:shadow-[0_4px_0_0_#0D130F]'
        }
      `}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-400 ease-out z-0"
        style={{
          opacity: glowPos.active ? 1 : 0,
          background: `radial-gradient(220px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.32), rgba(212, 175, 55, 0.20) 50%, transparent 72%)`,
        }}
      />
      {children}
    </button>
  );
};

export const InteractiveOnboarding: React.FC<InteractiveOnboardingProps> = ({
  initialAnswers,
  language,
  onComplete,
  onExit,
  questionsOverride,
  embeddedPreview = false,
}) => {
  const { activeQuestions: catalogActiveQuestions } = useQuestionCatalog();
  const questionsList = questionsOverride ?? catalogActiveQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => ({
    ...(initialAnswers || {}),
  }));
  const [showMilestone10, setShowMilestone10] = useState(false);
  const [hasShownMilestone10, setHasShownMilestone10] = useState(false);
  const [faceMoodIndex, setFaceMoodIndex] = useState(0);
  const [faceBouncing, setFaceBouncing] = useState(false);

  const totalQuestions = questionsList.length;

  useEffect(() => {
    if (totalQuestions > 0 && currentIndex >= totalQuestions) {
      setCurrentIndex(totalQuestions - 1);
    }
  }, [totalQuestions, currentIndex]);

  const containerHeightClass = embeddedPreview
    ? 'min-h-[560px] rounded-3xl pb-6'
    : 'min-h-screen pb-24';

  if (totalQuestions === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${containerHeightClass} max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] p-6 text-center transition-colors`}
      >
        <Sparkles size={34} className="text-[#D4AF37] mb-3" />
        <h2 className="text-lg font-black text-[#202923] dark:text-white">
          {language === 'ar'
            ? 'لا توجد أسئلة مفعّلة حالياً في هذا العرض'
            : 'No Active Questions Currently Enabled'}
        </h2>
        <p className="text-xs text-[#778078] dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          {language === 'ar'
            ? 'يمكن للمسؤول تفعيل الفئات والأسئلة من لوحة إدارة الاستبيان، مع بقاء جميع الإجابات السابقة محفوظة بأمان.'
            : 'Enable at least one category and question with 2+ active options in Question Management. Existing user answers remain safely preserved.'}
        </p>
        <div className="mt-5 w-full max-w-[220px]">
          <TactilePillButton variant="primary" size="md" className="w-full" onClick={onExit}>
            {language === 'ar' ? 'العودة' : 'Go Back'}
          </TactilePillButton>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, totalQuestions - 1);
  const currentQ = questionsList[safeIndex];
  const progressPercent = Math.round(((safeIndex + 1) / totalQuestions) * 100);

  const currentVal = answers[currentQ.id];
  const isExclusiveOption = (id: string) => id.endsWith('_none') || id.endsWith('_na');

  const handleSelectOption = (optId: string) => {
    playClickPop();
    const visibleOptionIds = new Set(currentQ.options.map((o) => o.id));
    if (currentQ.isMultiSelect) {
      const existingRaw = Array.isArray(currentVal)
        ? [...currentVal]
        : currentVal
        ? [currentVal]
        : [];
      // Filter to active visible options when modifying multi-select choices in current session
      const existing = existingRaw.filter((id) => visibleOptionIds.has(id));
      let updated: string[];

      if (isExclusiveOption(optId)) {
        updated = existing.includes(optId) ? [] : [optId];
      } else {
        const withoutExclusive = existing.filter((x) => !isExclusiveOption(x));
        if (withoutExclusive.includes(optId)) {
          updated = withoutExclusive.filter((x) => x !== optId);
        } else {
          const max = currentQ.maxSelect || 3;
          if (withoutExclusive.length >= max) {
            updated = [...withoutExclusive.slice(1), optId];
          } else {
            updated = [...withoutExclusive, optId];
          }
        }
      }
      setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optId }));
    }
  };

  const triggerMilestoneCelebration = () => {
    playLightModeSound();
    if (embeddedPreview) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([25, 35, 50]);
      }
      confetti({
        particleCount: 42,
        spread: 68,
        origin: { y: 0.45 },
        colors: ['#0B5D3B', '#10B981', '#D4AF37', '#34D399'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore
    }
  };

  const handleNext = () => {
    const nextIndex = safeIndex + 1;

    // When reaching Stage 10 (Question 10) and at least one question remains, show motivational milestone screen
    if (
      !embeddedPreview &&
      nextIndex === MILESTONE_STAGE_INDEX &&
      nextIndex < totalQuestions &&
      !hasShownMilestone10
    ) {
      setCurrentIndex(nextIndex);
      setHasShownMilestone10(true);
      setShowMilestone10(true);
      triggerMilestoneCelebration();
      return;
    }

    if (safeIndex < totalQuestions - 1) {
      setCurrentIndex(nextIndex);
    } else {
      playHighFiveSound();
      if (!embeddedPreview) {
        try {
          confetti({
            particleCount: 55,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#0B5D3B', '#10B981', '#D4AF37'],
          });
        } catch {
          // ignore
        }
      }
      // Merge into initialAnswers so any historical answers on disabled questions are never lost
      onComplete({
        ...(initialAnswers || {}),
        ...answers,
      });
    }
  };

  const handlePrev = () => {
    if (showMilestone10) {
      setShowMilestone10(false);
      setCurrentIndex(MILESTONE_STAGE_INDEX - 1);
      return;
    }

    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    } else {
      onExit();
    }
  };

  const handleTapFace = () => {
    playClickPop();
    setFaceMoodIndex((prev) => (prev + 1) % MILESTONE_FACES.length);
    setFaceBouncing(true);
    setTimeout(() => setFaceBouncing(false), 320);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(18);
      }
      confetti({
        particleCount: 16,
        spread: 45,
        origin: { y: 0.38 },
        colors: ['#D4AF37', '#10B981', '#0B5D3B'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore
    }
  };

  const remainingQuestions = totalQuestions - MILESTONE_STAGE_INDEX; // 5 questions left (10..15 -> 6 incl Q10, or 5 after Q10; let's display exact accurate numbers!)
  const completedCount = MILESTONE_STAGE_INDEX; // 9 answered, now entering stage 10 of 15
  const milestonePercent = Math.round((completedCount / totalQuestions) * 100);
  const currentFace = MILESTONE_FACES[faceMoodIndex];

  // ============================================================================
  // STAGE 10 MOTIVATIONAL MILESTONE SCREEN (عند الوصول للمرحلة العاشرة)
  // ============================================================================
  if (showMilestone10) {
    return (
      <div className="flex flex-col justify-between min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] p-5 pb-24 transition-colors select-none animate-fade-in">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label={language === 'ar' ? 'رجوع' : 'Back'}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer"
          >
            {language === 'ar' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </button>

          <span className="text-xs font-black text-[#0B5D3B] dark:text-[#34D399]">
            {language === 'ar'
              ? `المحطة 10 من ${totalQuestions}`
              : `Milestone 10 of ${totalQuestions}`}
          </span>

          <button
            type="button"
            onClick={onExit}
            aria-label={language === 'ar' ? 'إغلاق' : 'Exit'}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Motivational Card & Interactive Expressive Face */}
        <div className="my-auto py-4 flex flex-col items-center text-center">
          {/* Interactive Tappable Expressive Face Medal */}
          <div className="relative mb-5">
            {/* Soft warm emerald-gold aura */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#10B981]/25 via-[#D4AF37]/25 to-[#0B5D3B]/20 blur-xl pointer-events-none" />

            <button
              type="button"
              onClick={handleTapFace}
              aria-label={language === 'ar' ? 'اضغط لتغيير التعبير' : 'Tap to react'}
              className={`
                relative w-32 h-32 rounded-full
                bg-gradient-to-b from-white via-[#FFFDF7] to-[#E9F7F0]
                dark:from-[#233128] dark:via-[#1A241E] dark:to-[#131C16]
                border-4 border-[#10B981] dark:border-[#34D399]
                shadow-[0_10px_0_0_#CBE8D8,0_18px_32px_rgba(11,93,59,0.2)]
                dark:shadow-[0_10px_0_0_#0A140E,0_18px_32px_rgba(0,0,0,0.5)]
                flex flex-col items-center justify-center cursor-pointer
                active:translate-y-1.5 transition-transform duration-200
                ${faceBouncing ? 'scale-110 -rotate-3' : 'hover:scale-105'}
              `}
            >
              <span className="text-6xl leading-none select-none drop-shadow-xs">
                {currentFace.emoji}
              </span>
            </button>

            {/* Floating Gold Progress Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9E6] dark:bg-[#2B2312] border border-[#D4AF37]/50 text-[#92400E] dark:text-[#FBBF24] text-[11px] font-black shadow-2xs">
              <Flame size={13} className="fill-[#D4AF37] text-[#D4AF37]" />
              <span>{language === 'ar' ? currentFace.labelAr : currentFace.labelEn}</span>
            </div>
          </div>

          {/* Warm Encouraging Headline */}
          <h2
            className="text-2xl font-black tracking-tight text-[#202923] dark:text-white leading-snug max-w-xs"
            style={{ textWrap: 'balance' }}
          >
            {language === 'ar'
              ? 'يا سلام عليك.. قرّبت تنتهي! ✨'
              : 'You’re So Close — Almost Done! ✨'}
          </h2>

          <p className="text-sm font-semibold text-[#5C665E] dark:text-slate-300 mt-2.5 max-w-xs leading-relaxed">
            {language === 'ar'
              ? `أنجزت ${completedCount} أسئلة بنجاح وما بقى قد اللي راح! كمّل آخر ${remainingQuestions} أسئلة سريعة وشوف توأمك اللي يشبهك بانتظارك 👀💚`
              : `You've answered ${completedCount} questions — only ${remainingQuestions} quick ones left! Finish up now and see the Twin waiting for you 👀💚`}
          </p>

          {/* Visual Twin Convergence Progress Teaser */}
          <div className="w-full mt-6 p-4 rounded-3xl bg-white dark:bg-[#18221C] border border-slate-200/90 dark:border-slate-800 shadow-[0_5px_0_0_#D5CEBE] dark:shadow-[0_5px_0_0_#0D130F]">
            <div className="flex items-center justify-between text-xs font-black mb-2">
              <span className="text-[#0B5D3B] dark:text-[#34D399]">
                {language === 'ar' ? 'اكتمال ملامح توأمك' : 'Twin Signal Strength'}
              </span>
              <span className="text-[#D4AF37] tabular-nums">{milestonePercent}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/70 dark:border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0B5D3B] via-[#10B981] to-[#D4AF37] transition-all duration-500"
                style={{ width: `${milestonePercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#778078] dark:text-slate-400">
              <span>{language === 'ar' ? 'أنت ✨' : 'You ✨'}</span>
              <span className="inline-flex items-center gap-1 text-[#0B5D3B] dark:text-[#34D399] font-black">
                <Zap size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                {language === 'ar' ? 'باقي خطوات بسيطة للقاء!' : 'Seconds away from matching!'}
              </span>
              <span>{language === 'ar' ? 'توأمك 🤝' : 'Your Twin 🤝'}</span>
            </div>
          </div>
        </div>

        {/* Sticky Continue CTA */}
        <div className="sticky bottom-0 pt-4 bg-[#F8F7F2]/95 dark:bg-[#111813]/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800">
          <TactilePillButton
            variant="gold"
            size="lg"
            className="w-full"
            onClick={() => {
              playClickPop();
              setShowMilestone10(false);
            }}
            icon={<Sparkles size={18} className="text-[#1E293B]" />}
          >
            {language === 'ar'
              ? 'يلا نكمّل ونشوف توأمي! 🚀'
              : 'Keep Going & See My Twin! 🚀'}
          </TactilePillButton>
        </div>
      </div>
    );
  }

  const visibleOptIds = new Set(currentQ.options.map((o) => o.id));
  const selectedCount = Array.isArray(currentVal)
    ? currentVal.filter((id) => visibleOptIds.has(id)).length
    : currentVal && visibleOptIds.has(String(currentVal))
    ? 1
    : 0;

  const isCurrentAnswered = selectedCount > 0;

  return (
    <div className={`flex flex-col ${containerHeightClass} max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] p-5 transition-colors`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={handlePrev}
          aria-label={language === 'ar' ? 'السؤال السابق' : 'Previous Question'}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer"
        >
          {language === 'ar' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black tracking-widest text-[#0B5D3B] dark:text-[#34D399] uppercase tabular-nums">
            {language === 'ar'
              ? `السؤال ${safeIndex + 1} من ${totalQuestions}`
              : `Question ${safeIndex + 1} of ${totalQuestions}`}
          </span>
          <div className="w-32 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-[#0B5D3B] via-[#10B981] to-[#D4AF37] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          aria-label={language === 'ar' ? 'إغلاق' : 'Exit'}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Question Title & Subtitle */}
      <div className="my-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-black px-3 py-0.5 rounded-full bg-[#DDF3E7] dark:bg-[#0B5D3B]/30 text-[#0B5D3B] dark:text-[#34D399] tabular-nums">
            {currentQ.isMultiSelect
              ? language === 'ar'
                ? `اختيار حتى ${currentQ.maxSelect || 3} • (${selectedCount}/${currentQ.maxSelect || 3})`
                : `Pick up to ${currentQ.maxSelect || 3} • (${selectedCount}/${currentQ.maxSelect || 3})`
              : language === 'ar'
              ? 'اختيار واحد'
              : 'Single choice'}
          </span>
        </div>
        <h2 className="text-xl font-black tracking-tight text-[#202923] dark:text-white leading-snug">
          {language === 'ar' ? currentQ.titleAr : currentQ.titleEn}
        </h2>
        {(currentQ.subtitleAr || currentQ.subtitleEn) && (
          <p className="text-xs text-[#778078] dark:text-slate-400 mt-1">
            {language === 'ar' ? currentQ.subtitleAr : currentQ.subtitleEn}
          </p>
        )}
      </div>

      {/* Options List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar py-2">
        {currentQ.options.map((opt) => {
          const isSelected = Array.isArray(currentVal)
            ? currentVal.includes(opt.id)
            : currentVal === opt.id;

          return (
            <GlowOptionCardButton
              key={opt.id}
              isSelected={isSelected}
              onClick={() => handleSelectOption(opt.id)}
            >
              <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <RealisticIcon iconKey={opt.iconKey} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14.5px] sm:text-[15.5px] font-black leading-snug line-clamp-2">
                    {language === 'ar' ? opt.labelAr : opt.labelEn}
                  </h4>
                  {(opt.descriptionAr || opt.descriptionEn) && (
                    <span className="text-xs text-[#778078] dark:text-slate-400 block mt-0.5 truncate">
                      {language === 'ar' ? opt.descriptionAr : opt.descriptionEn}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                  isSelected
                    ? 'bg-[#0B5D3B] border-[#0B5D3B] text-white'
                    : 'border-slate-300 dark:border-slate-700 bg-transparent'
                }`}
              >
                {isSelected && <Check size={14} />}
              </div>
            </GlowOptionCardButton>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div className="sticky bottom-0 pt-4 bg-[#F8F7F2]/95 dark:bg-[#111813]/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800">
        <TactilePillButton
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!isCurrentAnswered}
          onClick={handleNext}
        >
          {safeIndex === totalQuestions - 1
            ? (language === 'ar' ? 'إتمام البصمة والبحث عن توأمي ✨' : 'Complete Fingerprint & Find Twin ✨')
            : (language === 'ar' ? 'السؤال التالي' : 'Next Question')}
        </TactilePillButton>
      </div>
    </div>
  );
};

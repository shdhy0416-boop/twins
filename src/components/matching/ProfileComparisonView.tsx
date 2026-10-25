import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, MatchProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import { resolveCatalogOptionLabel } from '../../services/questionCatalogService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { RealisticIcon } from '../common/RealisticIcon';
import { VibePolarOverlapChart } from './VibePolarOverlapChart';
import { formatCity } from '../../utils/localization';
import {
  calculatePairwiseSimilarity,
  getSharedOptionIds,
  normalizeOptionKey,
  isNotApplicableOption,
} from '../../services/matchingService';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import {
  playClickPop,
  playWaveSound,
  playHighFiveSound,
  playLightModeSound,
} from '../../utils/soundEffects';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Heart,
  Zap,
  Flame,
  X,
  Bookmark,
  Share2,
  ListChecks,
  Radar,
} from 'lucide-react';

interface ProfileComparisonViewProps {
  userProfile: UserProfile;
  match: MatchProfile;
  language: Language;
  onBack: () => void;
  onReturnHome?: () => void;
  onLaunchCollisionExperience?: () => void;
  isSaved?: boolean;
  onToggleSave?: (matchId: string) => void;
  onShareComparison?: () => void;
}

type MatchReactionStage = 0 | 1 | 2 | 3;

const GlowBox: React.FC<{
  children: React.ReactNode;
  className?: string;
  radius?: number;
  bright?: boolean;
}> = ({ children, className = '', radius = 200, bright = false }) => {
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  return (
    <div
      data-custom-glow="true"
      data-luxury-bezel="true"
      data-fixed-size="true"
      {...glowHandlers}
      className={`relative overflow-hidden shadow-[0_7px_0_0_#BFD5C8,0_16px_32px_-6px_rgba(11,93,59,0.18)] dark:shadow-[0_7px_0_0_#07120C,0_18px_36px_rgba(0,0,0,0.68)] ${className}`}
    >
      {/* Top Luminous Right-to-Left Crown Ribbon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-[2.5px] overflow-hidden z-20"
      >
        <div
          className="w-full h-full animate-rtl-bezel-glow"
          style={{
            background:
              'linear-gradient(270deg, transparent 5%, #10B981 35%, #FBBF24 50%, #0B5D3B 68%, transparent 95%)',
          }}
        />
      </div>

      {/* Soft Satin Right-to-Left Ambient Glow Wave */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 animate-rtl-surface-glow"
        style={{
          background:
            'linear-gradient(270deg, transparent 12%, rgba(16,185,129,0.08) 42%, rgba(212,175,55,0.14) 52%, rgba(16,185,129,0.06) 64%, transparent 88%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-400 ease-out z-0"
        style={{
          opacity: glowPos.active ? 1 : 0,
          background: bright
            ? `radial-gradient(${radius}px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.34), rgba(212, 175, 55, 0.22) 50%, transparent 72%)`
            : `radial-gradient(${radius}px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.28), rgba(212, 175, 55, 0.16) 50%, transparent 72%)`,
        }}
      />
      {children}
    </div>
  );
};

const GlowActionBtn: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
  title?: string;
  darkSurface?: boolean;
}> = ({ children, onClick, className = '', ariaLabel, title, darkSurface = false }) => {
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      data-custom-glow="true"
      {...glowHandlers}
      className={`relative overflow-hidden ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-400 ease-out z-0"
        style={{
          opacity: glowPos.active ? 1 : 0,
          background: darkSurface
            ? `radial-gradient(200px circle at ${glowPos.x}% ${glowPos.y}%, rgba(52, 211, 153, 0.50), rgba(212, 175, 55, 0.32) 50%, transparent 72%)`
            : `radial-gradient(180px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.36), rgba(212, 175, 55, 0.24) 50%, transparent 72%)`,
        }}
      />
      {children}
    </button>
  );
};

export const ProfileComparisonView: React.FC<ProfileComparisonViewProps> = ({
  userProfile,
  match,
  language,
  onBack,
  onReturnHome,
  isSaved = false,
  onToggleSave,
  onShareComparison,
}) => {
  const t = TRANSLATIONS[language];
  const [activeViewTab, setActiveViewTab] = useState<'confrontation' | 'radar'>('confrontation');
  const [showCollisionModal, setShowCollisionModal] = useState(false);
  const [collisionFilter, setCollisionFilter] = useState<'all' | 'exact' | 'different'>('all');
  // Interactive states per matched question ID (0: default match, 1: spark, 2: high-five, 3: soul twin)
  const [matchReactions, setMatchReactions] = useState<Record<string, MatchReactionStage>>({});
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const { activeQuestions, allDisplayQuestions } = useQuestionCatalog();

  // Helper to format answers using live & archived catalog labels (preserving historical answers)
  const getAnswerLabel = (questionId: string, answerVal: string | string[] | undefined) => {
    if (!answerVal) return null;

    if (Array.isArray(answerVal)) {
      if (answerVal.length === 0) return null;
      return answerVal
        .map((id) => resolveCatalogOptionLabel(questionId, id, language))
        .filter(Boolean)
        .join(' • ');
    }

    return resolveCatalogOptionLabel(questionId, String(answerVal), language);
  };

  // Check relationship type and extract exact shared option IDs so both sides match 100%
  const getComparisonStatus = (
    questionId: string,
    userAns: string | string[] | undefined,
    matchAns: string | string[] | undefined
  ): {
    type: 'exact' | 'different' | 'missing';
    label: string;
    sharedCount: number;
    commonIds: string[];
  } => {
    const toList = (val: string | string[] | undefined) => {
      if (!val) return [];
      const arr = Array.isArray(val) ? val : [val];
      return arr.map((x) => normalizeOptionKey(String(x).trim())).filter(Boolean);
    };

    const listA = toList(userAns);
    const listB = toList(matchAns);

    if (listA.length === 0 || listB.length === 0) {
      return { type: 'missing', label: t.emptyNotice, sharedCount: 0, commonIds: [] };
    }

    if (listA.some(isNotApplicableOption) || listB.some(isNotApplicableOption)) {
      return {
        type: 'missing',
        label: language === 'ar' ? 'غير منطبق' : 'Not applicable',
        sharedCount: 0,
        commonIds: [],
      };
    }

    const commonIds = getSharedOptionIds(questionId, userAns, matchAns);
    if (commonIds.length > 0) {
      return {
        type: 'exact',
        label: language === 'ar' ? 'تطابق تام' : 'Exact Match',
        sharedCount: commonIds.length,
        commonIds,
      };
    }

    return {
      type: 'different',
      label: language === 'ar' ? 'تفضيل مختلف' : 'Unique Flavor',
      sharedCount: 0,
      commonIds: [],
    };
  };

  // Include all active catalog questions plus any disabled/archived questions that either user has answered
  const comparisonQuestions = useMemo(() => {
    const activeIds = new Set(activeQuestions.map((q) => q.id));
    return allDisplayQuestions.filter((q) => {
      if (activeIds.has(q.id)) return true;
      const uAns = userProfile.answers[q.id];
      const mAns = match.answers[q.id];
      const hasU = Array.isArray(uAns) ? uAns.length > 0 : Boolean(uAns);
      const hasM = Array.isArray(mAns) ? mAns.length > 0 : Boolean(mAns);
      return hasU && hasM;
    });
  }, [activeQuestions, allDisplayQuestions, userProfile.answers, match.answers]);

  // Sort questions so matched items ALWAYS come first, followed by different, then missing/N/A
  const sortedQuestionsWithStatus = useMemo(() => {
    const rankMap: Record<'exact' | 'different' | 'missing', number> = {
      exact: 0,
      different: 1,
      missing: 2,
    };

    return comparisonQuestions.map((question, originalIndex) => {
      const userAns = userProfile.answers[question.id];
      const matchAns = match.answers[question.id];
      const status = getComparisonStatus(question.id, userAns, matchAns);
      return { question, status, originalIndex };
    }).sort((a, b) => {
      if (rankMap[a.status.type] !== rankMap[b.status.type]) {
        return rankMap[a.status.type] - rankMap[b.status.type];
      }
      if (a.status.type === 'exact' && b.status.sharedCount !== a.status.sharedCount) {
        return b.status.sharedCount - a.status.sharedCount;
      }
      return a.originalIndex - b.originalIndex;
    });
  }, [comparisonQuestions, userProfile.answers, match.answers, language]);

  const exactMatchesCount = useMemo(
    () => sortedQuestionsWithStatus.filter((item) => item.status.type === 'exact').length,
    [sortedQuestionsWithStatus]
  );

  // Trigger or set interactive reaction state on a matched item's badge/node
  const triggerMatchReaction = (
    questionId: string,
    e: React.MouseEvent<HTMLButtonElement>,
    explicitStage?: MatchReactionStage
  ) => {
    e.stopPropagation();
    const current = matchReactions[questionId] || 0;
    const next: MatchReactionStage =
      explicitStage !== undefined
        ? explicitStage === current
          ? 0
          : explicitStage
        : (((current + 1) % 4) as MatchReactionStage);

    setMatchReactions((prev) => ({ ...prev, [questionId]: next }));
    setAnimatingId(questionId);
    setTimeout(() => {
      setAnimatingId((prev) => (prev === questionId ? null : prev));
    }, 380);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(next === 0 ? 12 : [20, 25, 35]);
      }
    } catch {
      // ignore vibration error
    }

    if (next === 0) {
      playClickPop();
    } else if (next === 1) {
      playWaveSound();
    } else if (next === 2) {
      playHighFiveSound();
    } else if (next === 3) {
      playLightModeSound();
    }

    if (next >= 2) {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
          particleCount: next === 3 ? 26 : 16,
          spread: 52,
          startVelocity: 22,
          origin: { x: originX, y: originY },
          colors: ['#0B5D3B', '#10B981', '#D4AF37', '#34D399'],
          disableForReducedMotion: true,
        });
      } catch {
        // ignore confetti error
      }
    }
  };

  // Visual metadata for each interactive match state
  const getMatchReactionMeta = (stage: MatchReactionStage, defaultLabel: string) => {
    switch (stage) {
      case 1:
        return {
          badgeLabel: language === 'ar' ? 'شرارة التوافق ⚡' : 'Twin Spark ⚡',
          badgeClass:
            'bg-gradient-to-r from-[#FEF3C7] to-[#DDF3E7] dark:from-[#3D2E14] dark:to-[#0B3D26] text-[#92400E] dark:text-[#FBBF24] border-[#F59E0B] shadow-[0_3px_0_0_#D97706/35]',
          nodeSymbol: '⚡',
          nodeClass:
            'bg-gradient-to-tr from-[#D4AF37] to-[#10B981] text-white shadow-[#D4AF37]/40 ring-4 ring-[#D4AF37]/25 scale-110',
          cardRing: 'border-[#D4AF37]/70 dark:border-[#D4AF37]/60 shadow-[0_6px_18px_rgba(212,175,55,0.16)]',
          footerText:
            language === 'ar'
              ? 'شرارة ذوقية مشتركة تجمعكما ⚡✨'
              : 'Shared taste spark! ⚡✨',
        };
      case 2:
        return {
          badgeLabel: language === 'ar' ? 'هاي فايف! 🙌' : 'High-Five! 🙌',
          badgeClass:
            'bg-gradient-to-r from-[#0B5D3B] to-[#10B981] text-white border-[#052E1C] shadow-[0_3px_0_0_#052E1C]',
          nodeSymbol: '🙌',
          nodeClass:
            'bg-gradient-to-tr from-[#0B5D3B] to-[#10B981] text-white shadow-[#10B981]/45 ring-4 ring-[#10B981]/30 scale-110',
          cardRing: 'border-[#10B981] dark:border-[#34D399] shadow-[0_8px_20px_rgba(16,185,129,0.2)]',
          footerText:
            language === 'ar'
              ? 'هاي فايف! على نفس الموجة تماماً 🙌🔥'
              : 'Taste High-Five! Same wavelength 🙌🔥',
        };
      case 3:
        return {
          badgeLabel: language === 'ar' ? 'توأمة 100% 💚' : 'Soul Taste 💚',
          badgeClass:
            'bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#10B981] text-white border-[#B45309] shadow-[0_3px_0_0_#92400E/40]',
          nodeSymbol: '💚',
          nodeClass:
            'bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#D4AF37] text-white shadow-[#10B981]/50 ring-4 ring-[#34D399]/40 scale-115',
          cardRing: 'border-[#0B5D3B] dark:border-[#34D399] shadow-[0_8px_24px_rgba(11,93,59,0.24)]',
          footerText:
            language === 'ar'
              ? 'توأمة ذوقية مطابقة 100%! 💚👑'
              : 'Signature 100% taste match! 💚👑',
        };
      default:
        return {
          badgeLabel: defaultLabel,
          badgeClass:
            'bg-[#E6F8EF] dark:bg-[#0B3D26] text-[#0B5D3B] dark:text-[#34D399] border-[#6EE7B7] dark:border-[#10B981]/60 shadow-[0_2px_0_0_#A7F3D0] dark:shadow-[0_2px_0_0_#062A1A] hover:brightness-98',
          nodeSymbol: '★',
          nodeClass:
            'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/35 ring-2 ring-[#A7F3D0] dark:ring-[#0E5C38]',
          cardRing: 'border-slate-200/90 dark:border-slate-800 shadow-sm',
          footerText:
            language === 'ar'
              ? 'تطابق 100% • تفاعل مع العلامة ✨'
              : '100% Match • Tap to react ✨',
        };
    }
  };

  const pairwiseCalc = calculatePairwiseSimilarity(userProfile.answers, match.answers);
  const calculatedScore = pairwiseCalc.similarityScore > 0 ? pairwiseCalc.similarityScore : match.similarityScore;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-28 transition-colors select-none">
      
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-[#F8F7F2]/95 dark:bg-[#111813]/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          aria-label="Back"
        >
          {language === 'ar' ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
        </button>

        <h1 className="text-sm font-black text-[#202923] dark:text-white truncate">
          {t.comparisonTitle}
        </h1>

        <div className="flex items-center gap-2">
          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(match.id)}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer
                ${
                  isSaved
                    ? 'bg-[#FFF9E6] dark:bg-[#2F2612] text-[#D4AF37] border-[#D4AF37]/50 shadow-xs'
                    : 'bg-white dark:bg-[#1E2721] text-slate-500 border-slate-200 dark:border-slate-800'
                }
              `}
              title={isSaved ? t.unsaveProfile : t.saveProfile}
            >
              <Bookmark size={16} className={isSaved ? 'fill-[#D4AF37]' : ''} />
            </button>
          )}

          {onShareComparison && (
            <button
              type="button"
              onClick={onShareComparison}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-[#0B5D3B] transition-colors cursor-pointer"
              title={t.shareTwinComparison}
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* 2. FACING PROFILES HERO CARD + 2-TAB SWITCHER (المواجهة | رادار الهالة — WITHOUT 3D HEAT) */}
      <div className="px-4 pt-4 pb-2 space-y-3.5">
        {/* Top Facing Summary Card with Soft Emerald Halo */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-2 rounded-[32px] bg-[#10B981]/20 dark:bg-[#10B981]/14 blur-xl" />

          <GlowBox
            radius={260}
            className="relative z-10 w-full rounded-[28px] bg-white dark:bg-[#18221C] border-2 border-[#E3DAC6] dark:border-slate-700/90 p-3.5 sm:p-4 shadow-[0_8px_24px_rgba(11,93,59,0.10)]"
          >
            <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)] items-stretch gap-2.5">
              {/* Person 1: YOU (Locked 180px Height) */}
              <GlowBox
                radius={160}
                bright
                className="w-full min-w-0 h-[180px] min-h-[180px] max-h-[180px] rounded-2xl p-3 bg-white dark:bg-[#142019] border border-[#DCE8E1] dark:border-[#1E4D34] shadow-2xs flex flex-col items-center justify-center text-center"
              >
                <div className="relative z-10 flex items-center justify-center bg-transparent shrink-0">
                  <AvatarRenderer
                    avatar={userProfile.avatar}
                    size={98}
                    direction="right"
                    showBackdrop={false}
                    interactive={false}
                  />
                  <span className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-[#0B5D3B] text-[#FBBF24] border-2 border-white dark:border-[#142019] flex items-center justify-center shadow-xs">
                    <Zap size={10} className="fill-current" />
                  </span>
                </div>

                <span className="relative z-10 text-sm font-black text-[#0B5D3B] dark:text-[#34D399] mt-1.5 leading-tight truncate max-w-full">
                  {language === 'ar' ? 'أنت' : 'YOU'}
                </span>
                <span className="relative z-10 text-[11px] font-bold text-[#8A928C] dark:text-slate-400 mt-0.5 truncate max-w-full">
                  {formatCity(userProfile.city, language)}
                </span>
              </GlowBox>

              {/* Center Match Score Column */}
              <div className="flex flex-col items-center justify-center text-center px-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#0B5D3B] dark:text-[#34D399] leading-none tabular-nums">
                  {calculatedScore}%
                </span>
                <span className="text-[11px] font-black text-[#C99B2C] dark:text-[#FBBF24] mt-1 whitespace-nowrap">
                  {language === 'ar' ? 'تطابق' : 'Match'}
                </span>
                <div className="w-12 h-1 rounded-full bg-[#CFA128] dark:bg-[#D4AF37] mt-1.5" />
              </div>

              {/* Person 2: MATCH (Locked 180px Height) */}
              <GlowBox
                radius={160}
                bright
                className="w-full min-w-0 h-[180px] min-h-[180px] max-h-[180px] rounded-2xl p-3 bg-[#EAE3D5] dark:bg-[#2A2318] border border-[#D3C5AF] dark:border-[#524430] shadow-2xs flex flex-col items-center justify-center text-center"
              >
                <div className="relative z-10 flex items-center justify-center bg-transparent shrink-0">
                  <AvatarRenderer
                    avatar={match.avatar}
                    size={98}
                    direction="left"
                    showBackdrop={false}
                    interactive={false}
                  />
                </div>

                <span
                  dir="ltr"
                  className="relative z-10 text-xs sm:text-[13px] font-black text-[#7C5826] dark:text-[#FBBF24] mt-1.5 leading-tight truncate max-w-full block"
                >
                  @{match.username.replace(/^@+/, '')}
                </span>
                <span className="relative z-10 text-[11px] font-bold text-[#8A8275] dark:text-slate-400 mt-0.5 truncate max-w-full">
                  {formatCity(match.city, language)}
                </span>
              </GlowBox>
            </div>
          </GlowBox>
        </div>

        {/* 2-Tab Segmented Switcher: المواجهة | رادار الهالة */}
        <div className="p-1.5 rounded-2xl bg-[#E7ECE9] dark:bg-[#18221C] border border-slate-200/70 dark:border-slate-800 grid grid-cols-2 gap-1.5">
          <GlowActionBtn
            onClick={() => {
              playClickPop();
              setActiveViewTab('confrontation');
            }}
            darkSurface={activeViewTab === 'confrontation'}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeViewTab === 'confrontation'
                ? 'bg-[#0B5D3B] text-white shadow-[0_3px_10px_rgba(11,93,59,0.28)]'
                : 'bg-transparent text-[#5A655E] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white'
            }`}
          >
            <ListChecks size={16} className="relative z-10 shrink-0" />
            <span className="relative z-10">
              {language === 'ar' ? 'المواجهة' : 'Head-to-Head'}
            </span>
          </GlowActionBtn>

          <GlowActionBtn
            onClick={() => {
              playClickPop();
              setActiveViewTab('radar');
            }}
            darkSurface={activeViewTab === 'radar'}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeViewTab === 'radar'
                ? 'bg-[#0B5D3B] text-white shadow-[0_3px_10px_rgba(11,93,59,0.28)]'
                : 'bg-transparent text-[#5A655E] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white'
            }`}
          >
            <Radar size={16} className="relative z-10 shrink-0" />
            <span className="relative z-10">
              {language === 'ar' ? 'رادار الهالة' : 'Aura Radar'}
            </span>
          </GlowActionBtn>
        </div>

        {/* 3D TACTILE "WATCH COMMON INTERESTS COLLISION" CAPSULE BUTTON WITH TOUCH GLOW */}
        <div className="relative group w-full select-none">
          <div className="absolute inset-x-4 bottom-0 h-4 rounded-full bg-[#0B5D3B]/25 blur-md pointer-events-none" />

          <GlowActionBtn
            onClick={() => setShowCollisionModal(true)}
            className="
              w-full min-h-[50px] px-4 py-2.5 rounded-full
              bg-gradient-to-b from-[#E6F8EF] via-[#DDF3E7] to-[#C9EBD7]
              dark:from-[#0B5D3B]/40 dark:via-[#0B5D3B]/30 dark:to-[#08422A]/45
              border-2 border-[#0B5D3B]/50 dark:border-[#10b981]/50
              shadow-[0_5px_0_0_#9DCDB6,0_10px_18px_rgba(11,93,59,0.2)]
              dark:shadow-[0_5px_0_0_#062A1A]
              active:translate-y-1 active:shadow-[0_1px_0_0_#9DCDB6]
              dark:active:shadow-[0_1px_0_0_#062A1A]
              text-[#0B5D3B] dark:text-[#DDF3E7] text-sm font-black
              flex items-center justify-center gap-2 cursor-pointer
              transition-all duration-150 transform-gpu whitespace-nowrap
            "
          >
            <div className="absolute inset-x-3 top-0.5 h-[40%] rounded-full bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none z-10" />
            <Zap size={16} className="text-[#D4AF37] fill-[#D4AF37] relative z-10 shrink-0" />
            <span className="relative z-10">
              {language === 'ar'
                ? 'شاهد مواجهة الاهتمامات المشتركة'
                : 'Watch Common Interests Collision'}
            </span>
          </GlowActionBtn>
        </div>
      </div>

      {/* 3. TABBED CONTENT AREA: CONFRONTATION FEED OR AURA RADAR */}
      {activeViewTab === 'radar' ? (
        <main className="flex-1 px-4 py-2 space-y-4 overflow-y-auto no-scrollbar animate-fade-in">
          <VibePolarOverlapChart
            userProfile={userProfile}
            match={match}
            language={language}
          />
        </main>
      ) : (
        <main className="flex-1 px-4 py-2 space-y-4 overflow-y-auto no-scrollbar animate-fade-in">
        {/* Section lead-in showing matched items come first */}
        {exactMatchesCount > 0 && (
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs font-black text-[#0B5D3B] dark:text-[#34D399]">
              {language === 'ar'
                ? `الأشياء المطابقة أولاً (${exactMatchesCount})`
                : `Matched Interests First (${exactMatchesCount})`}
            </span>
            <span className="text-[11px] font-semibold text-[#778078] dark:text-slate-400">
              {language === 'ar' ? 'اضغط علامة المطابقة للتفاعل' : 'Tap match badge to react'}
            </span>
          </div>
        )}

        {sortedQuestionsWithStatus.map(({ question, status }, idx) => {
          const userAns = userProfile.answers[question.id];
          const matchAns = match.answers[question.id];
          const isExact = status.type === 'exact';
          const isMissing = status.type === 'missing';

          // Guarantee both sides show the exact same identical matched choice(s) when matched
          const sharedIdenticalLabel =
            isExact && status.commonIds.length > 0
              ? getAnswerLabel(question.id, status.commonIds)
              : null;
          const userLabel = sharedIdenticalLabel || getAnswerLabel(question.id, userAns) || t.emptyNotice;
          const matchLabel = sharedIdenticalLabel || getAnswerLabel(question.id, matchAns) || t.emptyNotice;
          const prevType = idx > 0 ? sortedQuestionsWithStatus[idx - 1].status.type : null;
          const showDifferentDivider = status.type === 'different' && prevType === 'exact';

          const reactionStage = matchReactions[question.id] || 0;
          const reactionMeta = getMatchReactionMeta(reactionStage, status.label);
          const isAnimating = animatingId === question.id;

          return (
            <React.Fragment key={question.id}>
              {showDifferentDivider && (
                <div className="flex items-center gap-3 pt-3 pb-1 px-1">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[11px] font-bold text-[#778078] dark:text-slate-400">
                    {language === 'ar' ? 'تفضيلات متنوعة ومكملة' : 'Complementary Differences'}
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
              )}

              <div className="relative group">
                {/* Floor Shadow Underneath Comparison Card */}
                <div className="absolute inset-x-4 -bottom-2 h-4 rounded-full bg-[#0B5D3B]/14 dark:bg-black/60 blur-md pointer-events-none transition-all group-hover:blur-lg" />

                <GlowBox
                  radius={260}
                  className={`w-full h-[312px] min-h-[312px] max-h-[312px] flex flex-col justify-between rounded-3xl bg-white dark:bg-[#18221C] border-2 transition-colors duration-200 ${
                    isExact
                      ? reactionMeta.cardRing
                      : 'border-slate-200/90 dark:border-slate-800 shadow-[0_6px_0_0_#E2DDD0,0_12px_22px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_0_0_#0D130F]'
                  }`}
                >
                  {/* Question Header — Fixed 64px Height */}
                  <div className="relative z-10 h-[64px] min-h-[64px] max-h-[64px] shrink-0 px-4 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 bg-white/85 dark:bg-[#18221C]/85">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#121814] border border-slate-200/70 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-2xs">
                        <RealisticIcon name={question.options[0]?.iconKey || 'coffee'} size={21} />
                      </div>
                      <h3 className="text-[13.5px] sm:text-[15px] font-black tracking-tight text-[#202923] dark:text-white leading-tight line-clamp-2">
                        {language === 'ar' ? question.titleAr : question.titleEn}
                      </h3>
                    </div>

                    {/* Interactive Match Badge (when matched) or Status Label — Fixed 32px Height */}
                    {isExact ? (
                      <GlowActionBtn
                        onClick={(e) => triggerMatchReaction(question.id, e)}
                        ariaLabel={language === 'ar' ? 'تفاعل مع علامة المطابقة' : 'React to match'}
                        className={`
                          shrink-0 h-8 min-h-[32px] max-h-[32px] inline-flex items-center gap-1.5 px-3 rounded-full
                          text-[11px] font-black border cursor-pointer select-none
                          transition-colors duration-150
                          whitespace-nowrap ${reactionMeta.badgeClass}
                        `}
                      >
                        <span className="relative z-10 inline-flex items-center gap-1.5">
                          {reactionStage === 0 ? (
                            <CheckCircle2 size={13} className="stroke-[3] shrink-0" />
                          ) : reactionStage === 1 ? (
                            <Zap size={13} className="fill-current shrink-0" />
                          ) : reactionStage === 2 ? (
                            <Sparkles size={13} className="shrink-0" />
                          ) : (
                            <Flame size={13} className="fill-current shrink-0" />
                          )}
                          <span>{reactionMeta.badgeLabel}</span>
                        </span>
                      </GlowActionBtn>
                    ) : isMissing ? (
                      <span className="shrink-0 h-8 min-h-[32px] max-h-[32px] inline-flex items-center gap-1 px-2.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <span>{status.label}</span>
                      </span>
                    ) : (
                      <span className="shrink-0 h-8 min-h-[32px] max-h-[32px] inline-flex items-center gap-1 px-3 rounded-full text-[11px] font-black bg-[#FFF6E5] dark:bg-[#3D2E14] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#785412] whitespace-nowrap">
                        <span>{status.label}</span>
                      </span>
                    )}
                  </div>

                  {/* EQUALIZED CONFRONTATION GRID: Strictly Locked Identical Width & 168px Height on Every Card */}
                  <div className="relative z-10 h-[196px] min-h-[196px] max-h-[196px] shrink-0 p-3.5 grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] items-stretch gap-2.5">
                    {/* Person 1: YOU (Locked 1fr width & 168px exact height, never resizes) */}
                    <GlowBox
                      radius={170}
                      bright
                      className="w-full min-w-0 h-[168px] min-h-[168px] max-h-[168px] shrink-0 rounded-2xl p-3 bg-[#F2FAF6] dark:bg-[#12241A] border-2 border-[#A7D7C1] dark:border-[#1E4D34] shadow-[0_4px_0_0_#C5E8D8] dark:shadow-[0_4px_0_0_#0A1D13] flex flex-col transition-colors"
                    >
                      <div className="relative z-10 h-8 min-h-[32px] max-h-[32px] shrink-0 flex items-center justify-between gap-1.5 pb-2 border-b border-[#A7D7C1]/60 dark:border-[#1E4D34]/60 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="shrink-0">
                            <AvatarRenderer avatar={userProfile.avatar} size={22} direction="right" interactive={false} />
                          </div>
                          <span className="text-xs font-black text-[#0B5D3B] dark:text-[#34D399] uppercase tracking-wide truncate">
                            {language === 'ar' ? 'أنت' : 'YOU'}
                          </span>
                        </div>
                        {language === 'ar' ? (
                          <ArrowLeft size={14} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                        ) : (
                          <ArrowRight size={14} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                        )}
                      </div>

                      <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex items-center justify-center text-center pt-2 px-1">
                        <p className="w-full text-[14px] sm:text-[15px] font-black text-[#0F2F21] dark:text-[#E8F8F0] leading-snug line-clamp-4 break-words">
                          {userLabel}
                        </p>
                      </div>
                    </GlowBox>

                    {/* Center Connecting Spine & Interactive Match Node — Locked 40px Width */}
                    <div className="flex flex-col items-center justify-center relative w-10 min-w-[40px] max-w-[40px] shrink-0">
                      <div className="w-[2px] absolute top-1 bottom-1 bg-slate-300 dark:bg-slate-700/80 rounded-full" />
                      {isExact ? (
                        <button
                          type="button"
                          data-fixed-size="true"
                          onClick={(e) => triggerMatchReaction(question.id, e)}
                          aria-label={language === 'ar' ? 'تغيير حالة علامة المطابقة' : 'Toggle match mark reaction'}
                          title={language === 'ar' ? 'اضغط للتفاعل مع التطابق' : 'Tap to react to match'}
                          className="relative z-10 w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer group focus:outline-none"
                        >
                          <span
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                              shadow-md border-2 border-white dark:border-[#18221C]
                              transition-all duration-200
                              ${reactionMeta.nodeClass}
                              ${isAnimating ? 'scale-115 rotate-6' : ''}
                            `}
                          >
                            {reactionMeta.nodeSymbol}
                          </span>
                        </button>
                      ) : (
                        <div className="relative z-10 w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-white dark:border-[#18221C] ${
                              isMissing
                                ? 'bg-slate-400 text-white shadow-slate-400/20'
                                : 'bg-[#EAB308] text-white shadow-[#EAB308]/30'
                            }`}
                          >
                            {isMissing ? '•' : '⚡'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Person 2: MATCH (Locked 1fr width & 168px exact height, never resizes) */}
                    <GlowBox
                      radius={170}
                      bright
                      className="w-full min-w-0 h-[168px] min-h-[168px] max-h-[168px] shrink-0 rounded-2xl p-3 bg-[#E2D4BE] dark:bg-[#2A2318] border-2 border-[#C6B198] dark:border-[#524430] shadow-[0_4px_0_0_#BAA58B] dark:shadow-[0_4px_0_0_#15110B] flex flex-col transition-colors"
                    >
                      <div className="relative z-10 h-8 min-h-[32px] max-h-[32px] shrink-0 flex items-center justify-between gap-1.5 pb-2 border-b border-[#C6B198]/70 dark:border-[#524430]/70 min-w-0">
                        {language === 'ar' ? (
                          <ArrowRight size={14} className="text-[#785412] dark:text-[#FBBF24] shrink-0" />
                        ) : (
                          <ArrowLeft size={14} className="text-[#785412] dark:text-[#FBBF24] shrink-0" />
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span dir="ltr" className="text-[11px] font-black text-[#452A08] dark:text-[#FBBF24] tracking-tight truncate">
                            @{match.username.toUpperCase()}
                          </span>
                          <div className="shrink-0">
                            <AvatarRenderer avatar={match.avatar} size={22} direction="left" interactive={false} />
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex items-center justify-center text-center pt-2 px-1">
                        <p className="w-full text-[14px] sm:text-[15px] font-black text-[#2E1C06] dark:text-[#FDF8EE] leading-snug line-clamp-4 break-words">
                          {matchLabel}
                        </p>
                      </div>
                    </GlowBox>
                  </div>

                  {/* Card Bottom Footer Strip — Locked 48px Height Across All 3 States */}
                  {isExact ? (
                    <div className="relative z-10 h-[48px] min-h-[48px] max-h-[48px] shrink-0 px-3.5 bg-[#E6F8EF] dark:bg-[#0B3D26]/60 border-t border-[#A7F3D0] dark:border-[#0E5C38] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#0B5D3B] dark:text-[#34D399] min-w-0">
                        <Heart size={13} className="fill-[#0B5D3B] dark:fill-[#34D399] text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                        <span className="truncate">{reactionMeta.footerText}</span>
                      </div>

                      {/* Direct Interactive State Switcher Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(
                          [
                            { stage: 1 as MatchReactionStage, emoji: '⚡', titleAr: 'شرارة توافق', titleEn: 'Spark' },
                            { stage: 2 as MatchReactionStage, emoji: '🙌', titleAr: 'هاي فايف', titleEn: 'High-Five' },
                            { stage: 3 as MatchReactionStage, emoji: '💚', titleAr: 'توأمة 100%', titleEn: 'Soul Match' },
                          ]
                        ).map((btn) => {
                          const active = reactionStage === btn.stage;
                          return (
                            <button
                              key={btn.stage}
                              type="button"
                              data-fixed-size="true"
                              onClick={(e) => triggerMatchReaction(question.id, e, btn.stage)}
                              title={language === 'ar' ? btn.titleAr : btn.titleEn}
                              className={`
                                w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors duration-150 cursor-pointer
                                ${
                                  active
                                    ? 'bg-[#0B5D3B] dark:bg-[#10B981] text-white shadow-xs ring-2 ring-white dark:ring-[#18221C]'
                                    : 'bg-white/80 dark:bg-[#18221C]/80 hover:bg-white text-slate-700 dark:text-slate-200 border border-[#A7F3D0] dark:border-[#1E4D34]'
                                }
                              `}
                            >
                              {btn.emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : isMissing ? (
                    <div className="relative z-10 h-[48px] min-h-[48px] max-h-[48px] shrink-0 px-3.5 bg-slate-50 dark:bg-[#141A16] border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="truncate">
                        {language === 'ar'
                          ? 'مستبعد من حساب النسبة (اختياري / غير منطبق)'
                          : 'Excluded from score calculation (optional / N/A)'}
                      </span>
                    </div>
                  ) : (
                    <div className="relative z-10 h-[48px] min-h-[48px] max-h-[48px] shrink-0 px-3.5 bg-[#FAF7F0] dark:bg-[#1A1813] border-t border-[#EAE3D2] dark:border-[#2D281E] flex items-center justify-center gap-1.5 text-xs font-black text-[#92400E] dark:text-[#FBBF24]">
                      <span className="shrink-0">⚡ ⚡</span>
                      <span className="truncate">
                        {language === 'ar'
                          ? 'ذوق متنوع يفتح بينكما أحاديث ممتعة وتوافق مكمل'
                          : 'Unique diverse taste to spark conversations'}
                      </span>
                    </div>
                  )}
                </GlowBox>
              </div>
            </React.Fragment>
          );
        })}
        </main>
      )}

      {/* 4. FIXED BOTTOM ACTION (Return to Home / العودة للرئيسية) WITH DYNAMIC TOUCH GLOW */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[#F8F7F2] via-[#F8F7F2]/95 to-transparent dark:from-[#111813] dark:via-[#111813]/95 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <GlowActionBtn
            onClick={onReturnHome || onBack}
            darkSurface
            className="
              w-full h-13 rounded-full
              bg-gradient-to-r from-[#0B5D3B] via-[#0E7047] to-[#0B5D3B]
              hover:brightness-110 text-white font-black text-base
              border-2 border-white/25
              shadow-[0_6px_0_0_#052E1C,0_12px_22px_rgba(11,93,59,0.35)]
              active:translate-y-1 active:shadow-[0_1px_0_0_#052E1C]
              flex items-center justify-center gap-2 cursor-pointer
            "
          >
            <div className="absolute inset-x-2 top-0.5 h-[40%] rounded-full bg-gradient-to-b from-white/60 via-white/15 to-transparent pointer-events-none z-10" />
            <span className="relative z-10">{language === 'ar' ? 'العودة للرئيسية' : 'Return to Home'}</span>
          </GlowActionBtn>
        </div>
      </footer>

      {/* 5. INTERACTIVE COLLISION OVERLAY ARENA MODAL (ALSO MATCHED-FIRST + INTERACTIVE) */}
      {showCollisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-[#18221C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#D4AF37]" />
                <h3 className="text-sm font-black text-[#202923] dark:text-white">
                  {t.collisionArena}
                </h3>
              </div>
              <button
                onClick={() => setShowCollisionModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#778078] dark:text-slate-400 mt-2 text-center shrink-0">
              {t.collisionArenaSubtitle}
            </p>

            {/* Facing Avatars at Top */}
            <div className="flex items-center justify-between px-5 py-3 my-2.5 bg-[#F8F7F2] dark:bg-[#111813] rounded-2xl border border-slate-200/60 dark:border-slate-800 shrink-0">
              <div className="flex flex-col items-center">
                <AvatarRenderer avatar={userProfile.avatar} size={52} direction="right" />
                <span className="text-[11px] font-black text-[#0B5D3B] dark:text-[#DDF3E7] mt-1">{t.youLabel}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-[#D4AF37]">⚡ VS ⚡</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#778078] tabular-nums">{calculatedScore}% Match</span>
              </div>

              <div className="flex flex-col items-center">
                <AvatarRenderer avatar={match.avatar} size={52} direction="left" />
                <span className="text-[11px] font-black text-[#202923] dark:text-white mt-1">
                  <span dir="ltr" className="inline-block font-black">@{match.username}</span>
                </span>
              </div>
            </div>

            {/* Filter Tabs inside Arena */}
            <div className="flex items-center gap-1.5 py-1 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => setCollisionFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  collisionFilter === 'all'
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#111813] text-slate-600 dark:text-slate-300'
                }`}
              >
                {language === 'ar' ? 'الكل (المطابق أولاً)' : 'All (Matched First)'}
              </button>
              <button
                type="button"
                onClick={() => setCollisionFilter('exact')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  collisionFilter === 'exact'
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#111813] text-slate-600 dark:text-slate-300'
                }`}
              >
                {language === 'ar' ? 'مطابق ⭐' : 'Matched ⭐'}
              </button>
              <button
                type="button"
                onClick={() => setCollisionFilter('different')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  collisionFilter === 'different'
                    ? 'bg-[#EAB308] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#111813] text-slate-600 dark:text-slate-300'
                }`}
              >
                {language === 'ar' ? 'مختلف ⚡' : 'Unique ⚡'}
              </button>
            </div>

            {/* Collision Confrontation Cards Stream (Sorted Matched First) */}
            <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-1">
              {sortedQuestionsWithStatus
                .filter(({ status }) => {
                  if (collisionFilter === 'exact') return status.type === 'exact';
                  if (collisionFilter === 'different') return status.type === 'different';
                  return status.type !== 'missing';
                })
                .map(({ question, status }) => {
                  const userAns = userProfile.answers[question.id];
                  const matchAns = match.answers[question.id];
                  const isExact = status.type === 'exact';
                  const sharedIdenticalLabel =
                    isExact && status.commonIds.length > 0
                      ? getAnswerLabel(question.id, status.commonIds)
                      : null;
                  const userLabel = sharedIdenticalLabel || getAnswerLabel(question.id, userAns) || t.emptyNotice;
                  const matchLabel = sharedIdenticalLabel || getAnswerLabel(question.id, matchAns) || t.emptyNotice;
                  const reactionStage = matchReactions[question.id] || 0;
                  const reactionMeta = getMatchReactionMeta(reactionStage, status.label);

                  return (
                    <GlowBox
                      key={question.id}
                      radius={200}
                      className="w-full h-[182px] min-h-[182px] max-h-[182px] p-3 rounded-2xl bg-white dark:bg-[#131915] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="relative z-10 h-8 min-h-[32px] max-h-[32px] shrink-0 flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs sm:text-[13px] font-black text-[#202923] dark:text-white truncate">
                          {language === 'ar' ? question.titleAr : question.titleEn}
                        </span>
                        {isExact ? (
                          <button
                            type="button"
                            data-fixed-size="true"
                            onClick={(e) => triggerMatchReaction(question.id, e)}
                            className={`shrink-0 text-[10px] font-black px-2.5 py-0.5 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${reactionMeta.badgeClass}`}
                          >
                            {reactionMeta.badgeLabel}
                          </button>
                        ) : (
                          <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFF6E5] text-[#B45309] whitespace-nowrap">
                            {status.label}
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 h-[116px] min-h-[116px] max-h-[116px] shrink-0 grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-stretch gap-2">
                        <GlowBox
                          radius={140}
                          bright
                          className="w-full min-w-0 h-[116px] min-h-[116px] max-h-[116px] shrink-0 p-2.5 rounded-xl bg-[#F2FAF6] dark:bg-[#12241A] border border-[#A7D7C1] flex flex-col"
                        >
                          <span className="relative z-10 h-5 shrink-0 text-[10px] font-black text-[#0B5D3B] dark:text-[#34D399] block pb-1 border-b border-[#A7D7C1]/40 text-center truncate">
                            {language === 'ar' ? 'أنت' : 'YOU'}
                          </span>
                          <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex items-center justify-center text-center pt-1">
                            <p className="w-full text-[13px] sm:text-sm font-black text-[#0F2F21] dark:text-[#E8F8F0] leading-snug line-clamp-3 break-words">
                              {userLabel}
                            </p>
                          </div>
                        </GlowBox>

                        <div className="w-8 min-w-[32px] max-w-[32px] shrink-0 flex items-center justify-center">
                          {isExact ? (
                            <button
                              type="button"
                              data-fixed-size="true"
                              onClick={(e) => triggerMatchReaction(question.id, e)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black cursor-pointer transition-colors ${reactionMeta.nodeClass}`}
                            >
                              {reactionMeta.nodeSymbol}
                            </button>
                          ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-[#EAB308]">
                              ⚡
                            </div>
                          )}
                        </div>

                        <GlowBox
                          radius={140}
                          bright
                          className="w-full min-w-0 h-[116px] min-h-[116px] max-h-[116px] shrink-0 p-2.5 rounded-xl bg-[#E2D4BE] dark:bg-[#2A2318] border border-[#C6B198] flex flex-col"
                        >
                          <span dir="ltr" className="relative z-10 h-5 shrink-0 text-[10px] font-black text-[#785412] dark:text-[#FBBF24] block pb-1 border-b border-[#C6B198]/50 text-center truncate">
                            @{match.username.toUpperCase()}
                          </span>
                          <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex items-center justify-center text-center pt-1">
                            <p className="w-full text-[13px] sm:text-sm font-black text-[#2E1C06] dark:text-[#FDF8EE] leading-snug line-clamp-3 break-words">
                              {matchLabel}
                            </p>
                          </div>
                        </GlowBox>
                      </div>
                    </GlowBox>
                  );
                })}
            </div>

            <GlowActionBtn
              onClick={() => setShowCollisionModal(false)}
              darkSurface
              className="mt-3 w-full py-3 rounded-full bg-[#0B5D3B] text-white text-sm font-black shadow-md cursor-pointer active:scale-98"
            >
              <span className="relative z-10">{language === 'ar' ? 'إغلاق المواجهة' : 'Close'}</span>
            </GlowActionBtn>
          </div>
        </div>
      )}

    </div>
  );
};

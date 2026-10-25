import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, MatchProfile, Language } from '../../types';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import { resolveCatalogOptionLabel } from '../../services/questionCatalogService';
import { getSharedOptionIds, calculatePairwiseSimilarity } from '../../services/matchingService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { RealisticIcon } from '../common/RealisticIcon';
import { formatCity } from '../../utils/localization';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  Heart,
  Bookmark,
} from 'lucide-react';
import { playHighFiveSound } from '../../utils/soundEffects';
import { InteractiveSharedPointsShowcase } from './InteractiveSharedPointsShowcase';

interface FindMyTwinExperienceProps {
  userProfile: UserProfile;
  match: MatchProfile | null;
  language: Language;
  reducedMotion?: boolean;
  onOpenComparison: (match: MatchProfile) => void;
  onClose: () => void;
  onNextMatch?: () => void;
  savedProfileIds?: string[];
  onToggleSaveProfile?: (matchId: string) => void;
  onSendHighFive?: (match: MatchProfile) => void;
}

interface CollidingItem {
  id: string;
  category: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

export const FindMyTwinExperience: React.FC<FindMyTwinExperienceProps> = ({
  userProfile,
  match,
  language,
  reducedMotion = false,
  onOpenComparison,
  onClose,
  savedProfileIds = [],
  onToggleSaveProfile,
  onSendHighFive,
}) => {
  // 3-Stage Experience matching the video:
  // 1. 'collision' -> Sequential colliding cards
  // 2. 'highfive'  -> High-five celebration with confetti
  // 3. 'reveal'    -> Final twin profile overview
  const [stage, setStage] = useState<'collision' | 'highfive' | 'reveal'>('collision');
  const [mergedCount, setMergedCount] = useState<number>(0);

  const { allDisplayQuestions } = useQuestionCatalog();

  // Real verified identical matches between user and twin
  const verifiedMatchedItems = useMemo<CollidingItem[]>(() => {
    if (!match) return [];
    const items: CollidingItem[] = [];
    for (const q of allDisplayQuestions) {
      const sharedIds = getSharedOptionIds(q.id, userProfile.answers[q.id], match.answers[q.id]);
      if (sharedIds.length > 0) {
        const matchedOpts = sharedIds.map((id) => {
          const found = q.options.find((o) => o.id === id);
          return {
            id,
            labelAr: found?.labelAr || resolveCatalogOptionLabel(q.id, id, 'ar'),
            labelEn: found?.labelEn || resolveCatalogOptionLabel(q.id, id, 'en'),
            iconKey: found?.iconKey || q.options[0]?.iconKey || 'sparkles',
          };
        });

        if (matchedOpts.length > 0) {
          items.push({
            id: q.id,
            category: language === 'ar' ? q.titleAr : q.titleEn,
            labelAr: matchedOpts.map((o) => o.labelAr).join(' • '),
            labelEn: matchedOpts.map((o) => o.labelEn).join(' • '),
            icon: matchedOpts[0].iconKey,
          });
        }
      }
    }
    return items;
  }, [allDisplayQuestions, userProfile.answers, match, language]);

  // Common ground items to collide into the center (up to 4 real matched items, with safe fallback)
  const collisionItems: CollidingItem[] = useMemo(() => {
    if (verifiedMatchedItems.length > 0) {
      return verifiedMatchedItems.slice(0, 4);
    }
    return [
      {
        id: 'c1',
        category: language === 'ar' ? 'طاقة ومود' : 'Energy & Vibe',
        labelAr: 'طموح وبناء عالي',
        labelEn: 'High Ambition & Energy',
        icon: 'trending-up',
      },
      {
        id: 'c2',
        category: language === 'ar' ? 'عالم القهوة' : 'Coffee Ritual',
        labelAr: 'قهوة مقطرة مختصة (V60 / كيمكس)',
        labelEn: 'Specialty Pour-Over (V60 / Chemex)',
        icon: 'coffee',
      },
    ];
  }, [verifiedMatchedItems, language]);

  // Sequential collision animation in Stage 1
  useEffect(() => {
    if (stage !== 'collision') return;

    setMergedCount(0);
    const timers: NodeJS.Timeout[] = [];

    collisionItems.forEach((_, index) => {
      const timer = setTimeout(() => {
        setMergedCount((prev) => {
          const next = Math.min(prev + 1, collisionItems.length);
          try {
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(25);
            }
          } catch {
            // ignore
          }
          return next;
        });
      }, (index + 1) * 700);
      timers.push(timer);
    });

    // When all items merge, transition to High-Five stage
    const transitionTimer = setTimeout(() => {
      triggerHighFive();
    }, collisionItems.length * 700 + 900);
    timers.push(transitionTimer);

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [stage]);

  const triggerHighFive = () => {
    setStage('highfive');
    playHighFiveSound();
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.45 },
        colors: ['#0B5D3B', '#10B981', '#D4AF37', '#FAF7F0'],
      });
    } catch {
      // ignore
    }

    // Auto-advance to final reveal stage after high-five animation
    setTimeout(() => {
      setStage('reveal');
    }, 2200);
  };

  const handleSkip = () => {
    setStage('reveal');
  };

  const handleRestart = () => {
    setMergedCount(0);
    setStage('collision');
  };

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-md mx-auto">
        <Sparkles size={40} className="text-[#D4AF37] mb-3 animate-pulse" />
        <h3 className="text-base font-black">
          {language === 'ar' ? 'جاري البحث عن توأمك الذوقي...' : 'Finding your taste twin...'}
        </h3>
        <button
          onClick={onClose}
          className="mt-4 px-5 py-2 bg-[#0B5D3B] text-white rounded-full text-xs font-bold"
        >
          {language === 'ar' ? 'العودة' : 'Back'}
        </button>
      </div>
    );
  }

  const isSaved = savedProfileIds.includes(match.id);
  const pairwise = calculatePairwiseSimilarity(userProfile.answers, match.answers);
  const score = pairwise.coverageScore > 0 ? pairwise.similarityScore : (match.similarityScore || 95);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-24 transition-colors select-none">
      
      {/* ============================================================== */}
      {/* 1. STAGE: COLLISION ARENA (مواجهة الاهتمامات المشتركة) */}
      {/* ============================================================== */}
      {stage === 'collision' && (
        <div className="flex flex-col min-h-screen justify-between p-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>

            <div className="flex items-center gap-1.5 font-bubble font-black text-xs sm:text-sm text-[#0B5D3B] dark:text-[#34D399]">
              <Sparkles size={16} className="text-[#D4AF37]" />
              <span>{language === 'ar' ? 'مواجهة الاهتمامات المشتركة' : 'Common Interests Collision'}</span>
            </div>

            <button
              onClick={handleSkip}
              className="text-xs font-black text-[#778078] hover:text-[#0B5D3B] dark:hover:text-white px-2 py-1 rounded-lg cursor-pointer"
            >
              {language === 'ar' ? 'تخطي' : 'Skip'}
            </button>
          </div>

          {/* Top Facing Avatars Row */}
          <div className="flex items-center justify-between px-6 py-4 my-2">
            {/* User */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center bg-transparent">
                <AvatarRenderer avatar={userProfile.avatar} size={88} direction="right" showBackdrop={false} />
              </div>
              <span className="font-bubble text-xs font-black text-[#0B5D3B] dark:text-[#34D399] mt-1.5">
                {language === 'ar' ? 'أنت' : 'YOU'}
              </span>
              <span className="text-[10px] text-[#778078] font-bold">
                {formatCity(userProfile.city, language)}
              </span>
            </div>

            {/* Central Meeting Tag */}
            <div className="flex flex-col items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-[#DDF3E7] via-white to-[#FAF2D6] dark:from-[#0B5D3B]/30 dark:via-[#18221C] dark:to-[#2B2313] border border-[#0B5D3B]/30 shadow-xs">
              <span className="font-bubble text-[11px] font-black text-[#D4AF37] flex items-center gap-1">
                <Zap size={12} className="animate-pulse" />
                <span>{language === 'ar' ? 'لقاء' : 'Encounter'}</span>
                <Zap size={12} className="animate-pulse" />
              </span>
            </div>

            {/* Match */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center bg-transparent">
                <AvatarRenderer avatar={match.avatar} size={88} direction="left" showBackdrop={false} />
              </div>
              <span className="font-bubble text-xs font-black text-[#202923] dark:text-white mt-1.5">
                <span dir="ltr">@{match.username.replace(/^@+/, '')}</span>
              </span>
              <span className="text-[10px] text-[#778078] font-bold">
                {formatCity(match.city, language)}
              </span>
            </div>
          </div>

          {/* Central Colliding Cards Arena */}
          <div className="flex-1 flex flex-col justify-center my-2">
            <div className="luxury-card-shimmer relative overflow-hidden p-4 rounded-3xl bg-gradient-to-b from-white via-[#FAF8F2] to-[#EFEAD9] dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713] border-2 border-[#0B5D3B]/25 dark:border-[#10B981]/30 shadow-[0_9px_0_0_#BFD5C8,0_20px_40px_-6px_rgba(11,93,59,0.22)] dark:shadow-[0_9px_0_0_#07120C,0_22px_44px_rgba(0,0,0,0.75)]">
              <div className="text-center mb-3">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F8EF] dark:bg-[#0B3D26] text-[#0B5D3B] dark:text-[#34D399] text-xs font-black mb-1">
                  <Sparkles size={13} className="text-[#D4AF37]" />
                  <span>{language === 'ar' ? 'مواجهة الاهتمامات المشتركة' : 'Common Ground Stream'}</span>
                </div>
                <p className="text-[11px] text-[#778078] dark:text-slate-400 font-bold leading-relaxed">
                  {language === 'ar'
                    ? 'الأشياء التي تدريجياً تتطابق من الطرفين وتلتقي في المركز'
                    : 'Aesthetic points colliding and merging into the center'}
                </p>
              </div>

              {/* Items Stream */}
              <div className="space-y-2.5">
                {collisionItems.map((item, index) => {
                  const isMerged = mergedCount > index;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border-2 transition-all duration-500 flex items-center justify-between ${
                        isMerged
                          ? 'bg-[#E8F8F0] dark:bg-[#0B5D3B]/30 border-[#0B5D3B] dark:border-[#34D399] shadow-sm scale-100 opacity-100'
                          : 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 scale-95 opacity-30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isMerged
                              ? 'bg-[#0B5D3B] text-white dark:bg-[#34D399] dark:text-[#062618]'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <RealisticIcon name={item.icon} size={18} />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#D4AF37] block">
                            ★ {language === 'ar' ? 'نقطة التقاء مشتركة' : 'Shared Point'}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-[#202923] dark:text-white block">
                            {language === 'ar' ? item.labelAr : item.labelEn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-black text-[#0B5D3B] dark:text-[#34D399] font-mono">
                          100%
                        </span>
                        <CheckCircle2 size={16} className="text-[#0B5D3B] dark:text-[#10B981] stroke-[2.5]" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Merger Tracker */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] font-black text-[#0B5D3B] dark:text-[#34D399]">
                  🎉 {language === 'ar' ? `تم دمج ${mergedCount} من ${collisionItems.length} نقاط مشتركة` : `${mergedCount} of ${collisionItems.length} points merged`}
                </span>
              </div>
            </div>
          </div>

          {/* Skip CTA */}
          <div className="pt-2 text-center">
            <button
              onClick={handleSkip}
              className="text-xs font-bold text-[#778078] hover:text-[#0B5D3B] dark:hover:text-white"
            >
              {language === 'ar' ? 'اضغط للمتابعة الفورية' : 'Click to proceed immediately'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STAGE: HIGH-FIVE MOMENT (لحظة الهاي فايف!) */}
      {/* ============================================================== */}
      {stage === 'highfive' && (
        <div
          onClick={() => setStage('reveal')}
          className="flex flex-col min-h-screen justify-between p-5 animate-fade-in cursor-pointer"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>
            <span className="font-bubble font-black text-sm text-[#0B5D3B] dark:text-[#34D399]">
              🎉 {language === 'ar' ? 'لحظة الهاي فايف!' : 'High-Five Moment!'}
            </span>
            <button onClick={handleSkip} className="text-xs font-black text-[#778078]">
              {language === 'ar' ? 'تخطي' : 'Skip'}
            </button>
          </div>

          {/* Central High-Five Animation */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Touching Backgroundless Cutout Avatars */}
            <div className="relative flex items-center justify-center -space-x-2 rtl:space-x-reverse mb-6">
              <div className="z-10 animate-bounce bg-transparent">
                <AvatarRenderer avatar={userProfile.avatar} size={118} direction="right" showBackdrop={false} />
              </div>

              {/* Sparkle High Five Impact */}
              <div className="z-20 w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFD700] to-[#FF8C00] text-white flex items-center justify-center shadow-lg animate-ping">
                <Zap size={22} className="fill-current" />
              </div>

              <div className="z-10 animate-bounce bg-transparent">
                <AvatarRenderer avatar={match.avatar} size={118} direction="left" showBackdrop={false} />
              </div>
            </div>

            {/* Title & Subtitle */}
            <h2 className="font-bubble text-2xl sm:text-3xl font-black text-[#202923] dark:text-white leading-tight">
              {language === 'ar' ? 'لحظة الهاي فايف! 🤝' : 'High-Five Moment! 🤝'}
            </h2>
            <p className="font-bubble text-xs sm:text-sm font-bold text-[#0B5D3B] dark:text-[#34D399] mt-2 max-w-xs leading-relaxed">
              {language === 'ar'
                ? 'التقت التفضيلات واكتملت نقطة التواصل!'
                : 'Aesthetic preferences aligned and connected!'}
            </p>
          </div>

          <div className="text-center pb-4 text-xs font-bold text-[#778078]">
            {language === 'ar' ? 'اضغط للمتابعة إلى البروفايل' : 'Tap anywhere to view profile'}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. STAGE: FINAL REVEAL (تم العثور على شبيهك!) */}
      {/* ============================================================== */}
      {stage === 'reveal' && (
        <div className="flex flex-col min-h-screen p-4 animate-fade-in space-y-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>

            <span className="font-bubble font-black text-sm text-[#0B5D3B] dark:text-[#34D399]">
              🎉 {language === 'ar' ? 'تم العثور على شبيهك!' : 'Twin Found!'}
            </span>

            <button
              onClick={handleRestart}
              className="flex items-center gap-1 text-xs font-black text-[#D4AF37] hover:underline cursor-pointer"
              title="Watch collision again"
            >
              <RotateCcw size={13} />
              <span>{language === 'ar' ? 'إعادة' : 'Replay'}</span>
            </button>
          </div>

          {/* Top Avatars Row */}
          <div className="flex items-center justify-between px-6 py-2">
            <div className="flex flex-col items-center">
              <AvatarRenderer avatar={userProfile.avatar} size={92} direction="right" showBackdrop={false} />
              <span className="font-bubble text-xs font-black text-[#0B5D3B] mt-1">{language === 'ar' ? 'أنت' : 'YOU'}</span>
              <span className="text-[10px] text-[#778078]">{formatCity(userProfile.city, language)}</span>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0B5D3B] via-[#10B981] to-[#D4AF37] text-white flex items-center justify-center shadow-sm">
              <Zap size={18} className="fill-current" />
            </div>

            <div className="flex flex-col items-center">
              <AvatarRenderer avatar={match.avatar} size={92} direction="left" showBackdrop={false} />
              <span className="font-bubble text-xs font-black text-[#202923] dark:text-white mt-1">
                <span dir="ltr">@{match.username.replace(/^@+/, '')}</span>
              </span>
              <span className="text-[10px] text-[#778078]">{formatCity(match.city, language)}</span>
            </div>
          </div>

          {/* Compatibility Hero Card */}
          <div className="luxury-card-shimmer relative overflow-hidden p-4 rounded-3xl bg-gradient-to-b from-white via-[#FAF8F2] to-[#EFEAD9] dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713] border-2 border-[#0B5D3B]/25 dark:border-[#10B981]/30 shadow-[0_9px_0_0_#BFD5C8,0_20px_40px_-6px_rgba(11,93,59,0.22),0_6px_18px_rgba(212,175,55,0.16)] dark:shadow-[0_9px_0_0_#07120C,0_22px_44px_rgba(0,0,0,0.75)] text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#778078] block">
              {language === 'ar' ? 'نسبة التطابق' : 'Match Score'}
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span className="font-bubble text-4xl sm:text-5xl font-black text-[#0B5D3B] dark:text-[#34D399]">
                {score}%
              </span>
              <span className="font-bubble text-xs font-black text-[#D4AF37]">
                ⭐ {language === 'ar' ? 'شبه استثنائي' : 'Exceptional Twin'}
              </span>
            </div>

            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#778078]">
              <span>📍 {formatCity(match.city, language)}</span>
            </div>

            {/* Replay Collision Button */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#DDF3E7] via-white to-[#DDF3E7] dark:from-[#0B5D3B]/30 dark:via-[#18221C] dark:to-[#0B5D3B]/30 border border-[#0B5D3B]/30 text-[#0B5D3B] dark:text-[#34D399] font-bubble text-xs font-black flex items-center justify-center gap-2 shadow-2xs hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-[#D4AF37]" />
                <span>{language === 'ar' ? '✨ شاهد التصادم ثانية' : '✨ Watch Collision Again'}</span>
              </button>
            </div>
          </div>

          {/* Luxury Progressive Shared Common Points Showcase (No Bio Here) */}
          <InteractiveSharedPointsShowcase
            items={verifiedMatchedItems.length > 0 ? verifiedMatchedItems : collisionItems}
            username={match.username.replace(/^@+/, '')}
            language={language}
            reducedMotion={reducedMotion}
          />

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onOpenComparison(match)}
              className="w-full h-12 rounded-full bg-[#0B5D3B] hover:bg-[#08422A] text-white font-bubble text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#0B5D3B]/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{language === 'ar' ? 'مقارنة التفاصيل الكاملة 📊' : 'Compare Full Profiles 📊'}</span>
            </button>

            <div className="flex gap-2">
              {onSendHighFive && (
                <button
                  onClick={() => onSendHighFive(match)}
                  className="flex-1 h-11 rounded-full bg-white dark:bg-[#1E2721] border-2 border-[#D4AF37] text-[#D4AF37] font-bubble text-xs font-black flex items-center justify-center gap-1.5 shadow-xs hover:bg-amber-50 cursor-pointer active:scale-95"
                >
                  <Zap size={14} className="fill-[#D4AF37]" />
                  <span>{language === 'ar' ? 'هاي فايف 🙌' : 'High-Five 🙌'}</span>
                </button>
              )}

              {onToggleSaveProfile && (
                <button
                  onClick={() => onToggleSaveProfile(match.id)}
                  className={`h-11 px-4 rounded-full border-2 font-bubble text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                    isSaved
                      ? 'bg-[#FFF9E6] border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-white dark:bg-[#1E2721] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
                  <span>{isSaved ? (language === 'ar' ? 'محفوظ' : 'Saved') : (language === 'ar' ? 'حفظ' : 'Save')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

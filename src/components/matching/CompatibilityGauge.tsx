import React, { useState } from 'react';
import { Language, UserProfile, MatchProfile } from '../../types';
import { calculatePairwiseSimilarity, DetailedMatchCalculation } from '../../services/matchingService';
import { ONBOARDING_QUESTIONS } from '../../data/questions';
import { RealisticIcon } from '../common/RealisticIcon';
import { CheckCircle2, Sparkles, ChevronDown, ChevronUp, Zap, Heart } from 'lucide-react';

interface CompatibilityGaugeProps {
  userProfile: UserProfile;
  match: MatchProfile;
  language: Language;
}

export const CompatibilityGauge: React.FC<CompatibilityGaugeProps> = ({
  userProfile,
  match,
  language,
}) => {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Calculate deep mathematical pairwise similarity
  const calcResult: DetailedMatchCalculation = calculatePairwiseSimilarity(
    userProfile.answers,
    match.answers
  );

  // Use calculated score if available, otherwise match.similarityScore
  const rawScore = calcResult.similarityScore > 0 ? calcResult.similarityScore : match.similarityScore;
  const score = Math.min(100, Math.max(0, rawScore));

  // Count how many questions overlap
  let overlappingCount = 0;
  const totalQuestions = ONBOARDING_QUESTIONS.length;

  ONBOARDING_QUESTIONS.forEach((q) => {
    const u = userProfile.answers[q.id];
    const m = match.answers[q.id];
    if (!u || !m) return;
    if (Array.isArray(u) && Array.isArray(m)) {
      if (u.some((item) => m.includes(item) && item !== 'sport_none')) {
        overlappingCount++;
      }
    } else if (u === m) {
      overlappingCount++;
    }
  });

  // Gauge Tier classification
  const getTier = (val: number) => {
    if (val >= 90) {
      return {
        labelEn: 'Cosmic Twin Synergy',
        labelAr: 'تطابق توأم استثنائي',
        badgeColor: 'bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#34D399] border-[#0B5D3B]/30',
        strokeColor: '#10B981',
      };
    }
    if (val >= 75) {
      return {
        labelEn: 'High Vibe Alignment',
        labelAr: 'تناغم عالي جداً',
        badgeColor: 'bg-[#FFF9E6] text-[#B8860B] dark:bg-[#2F2612] dark:text-[#F3BA2F] border-[#D4AF37]/30',
        strokeColor: '#D4AF37',
      };
    }
    if (val >= 60) {
      return {
        labelEn: 'Harmonious Chemistry',
        labelAr: 'كيمياء مشتركة واعدة',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200',
        strokeColor: '#10b981',
      };
    }
    return {
      labelEn: 'Complementary Dynamics',
      labelAr: 'تنوع مكمل ومثير',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
      strokeColor: '#64748b',
    };
  };

  const tier = getTier(score);

  // SVG Gauge calculations (Semi-circle meter from 180deg to 360deg)
  const radius = 78;
  const circumference = Math.PI * radius; // Half-circle circumference: ~245
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4] dark:from-[#1E2721] dark:via-[#18211B] dark:to-[#131915] border border-white/90 dark:border-white/10 p-5 shadow-[0_8px_0_0_#D5CEBE,0_16px_28px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_0_0_#0D130F,0_16px_28px_rgba(0,0,0,0.5)] overflow-hidden">
      
      {/* Top Glossy Highlight Specular */}
      <div className="absolute inset-x-4 top-0.5 h-[35%] rounded-t-2xl bg-gradient-to-b from-white/90 via-white/20 to-transparent dark:from-white/10 dark:via-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399] shadow-2xs">
            <Zap size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wide text-[#202923] dark:text-white uppercase">
              {language === 'ar' ? 'مؤشر التوافق الحسابي' : 'Compatibility Score Meter'}
            </h3>
            <span className="text-[10px] text-[#778078] dark:text-slate-400 block">
              {language === 'ar'
                ? `${overlappingCount} من ${totalQuestions} أبعاد متطابقة ومتقاربة`
                : `${overlappingCount} of ${totalQuestions} Dimensions Overlapping`}
            </span>
          </div>
        </div>

        {/* Tier Badge */}
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-wide shadow-2xs ${tier.badgeColor}`}
        >
          {language === 'ar' ? tier.labelAr : tier.labelEn}
        </span>
      </div>

      {/* ============================================================== */}
      {/* SEMI-CIRCULAR RADIAL GAUGE DISPLAY */}
      {/* ============================================================== */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-4 pb-1">
        <div className="relative w-[210px] h-[120px] flex items-center justify-center">
          <svg
            className="w-[210px] h-[120px] overflow-visible"
            viewBox="0 0 200 115"
          >
            <defs>
              {/* Vibrant Emerald to Gold Gradient */}
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="65%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>

              {/* Shadow Filter for Meter Track Glow */}
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Arc Track (Semi-circle from 10,105 to 190,105) */}
            <path
              d="M 22 105 A 78 78 0 0 1 178 105"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Secondary subtle dash markers */}
            <path
              d="M 22 105 A 78 78 0 0 1 178 105"
              fill="none"
              stroke="currentColor"
              className="text-slate-300/40 dark:text-slate-700/50"
              strokeWidth="14"
              strokeDasharray="2 12"
              strokeLinecap="round"
            />

            {/* Dynamic Animated Meter Fill Path */}
            <path
              d="M 22 105 A 78 78 0 0 1 178 105"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#gaugeGlow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Central Percentage & Label Hub */}
          <div className="absolute bottom-1 flex flex-col items-center justify-center text-center select-none">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-4xl font-black tracking-tight text-[#0B5D3B] dark:text-[#10b981] font-mono leading-none drop-shadow-xs">
                {score}
              </span>
              <span className="text-xl font-black text-[#D4AF37] leading-none">%</span>
            </div>

            <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-[#778078] dark:text-slate-400">
              {language === 'ar' ? 'نسبة التوافق التوأمي' : 'OVERALL ALIGNMENT'}
            </span>
          </div>
        </div>

        {/* Linear Progress Bar with Mini Scale Markers */}
        <div className="w-full mt-3 px-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#778078] dark:text-slate-400 mb-1">
            <span>0%</span>
            <span className="text-[#0B5D3B] dark:text-[#34D399] font-black">
              {score >= 80 ? (language === 'ar' ? '🎯 تطابق مرتفع جداً' : '🎯 Very High Match') : (language === 'ar' ? '✨ تقارب ملموس' : '✨ Strong Affinity')}
            </span>
            <span>100%</span>
          </div>

          <div className="relative h-2.5 w-full rounded-full bg-slate-200/90 dark:bg-slate-800 overflow-hidden shadow-inner p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#D4AF37] shadow-xs transition-all duration-1000 ease-out"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Quick Highlights Summary Pill */}
        <div className="mt-3 w-full grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#151D18] border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[#0B5D3B] dark:text-[#34D399] text-xs font-black">
              <CheckCircle2 size={13} />
              <span>{overlappingCount} / {totalQuestions}</span>
            </div>
            <span className="text-[9px] text-[#778078] dark:text-slate-400 font-medium">
              {language === 'ar' ? 'أبعاد متوافقة' : 'Shared Dimensions'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#151D18] border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[#D4AF37] text-xs font-black">
              <Heart size={13} className="fill-[#D4AF37]" />
              <span>{calcResult.sharedInterests.length || overlappingCount}</span>
            </div>
            <span className="text-[9px] text-[#778078] dark:text-slate-400 font-medium">
              {language === 'ar' ? 'نقاط التقاء مركزية' : 'Core Resonance Points'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* INTERACTIVE EXPANDABLE DIMENSION BREAKDOWN */}
      {/* ============================================================== */}
      <div className="relative z-10 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          className="w-full flex items-center justify-between text-xs font-bold text-[#0B5D3B] dark:text-[#34D399] py-1 px-1 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#D4AF37]" />
            {language === 'ar'
              ? (showDetailedBreakdown ? 'إخفاء تفاصيل نسب الأبعاد' : 'عرض تفاصيل توافق الأبعاد التسعة')
              : (showDetailedBreakdown ? 'Hide Dimension Breakdown' : 'View 9-Dimension Breakdown')}
          </span>
          {showDetailedBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetailedBreakdown && (
          <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto no-scrollbar animate-fade-in pr-0.5">
            {ONBOARDING_QUESTIONS.map((q) => {
              const u = userProfile.answers[q.id];
              const m = match.answers[q.id];

              let dimensionSim = 0;
              let isExact = false;

              if (u && m) {
                if (Array.isArray(u) && Array.isArray(m)) {
                  const common = u.filter((item) => m.includes(item) && item !== 'sport_none');
                  const union = new Set([...u, ...m]);
                  dimensionSim = union.size > 0 ? Math.round((common.length / union.size) * 100) : 0;
                  isExact = common.length > 0;
                } else if (u === m) {
                  dimensionSim = 100;
                  isExact = true;
                } else {
                  dimensionSim = 20; // different flavor
                  isExact = false;
                }
              }

              return (
                <div
                  key={q.id}
                  className="p-2.5 rounded-xl bg-white/70 dark:bg-[#151D18] border border-slate-200/60 dark:border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#DDF3E7]/60 dark:bg-[#0B5D3B]/20 flex items-center justify-center shrink-0">
                        <RealisticIcon name={q.options[0]?.iconKey || 'coffee'} size={14} />
                      </div>
                      <span className="font-bold text-[#202923] dark:text-slate-200">
                        {language === 'ar' ? q.titleAr : q.titleEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px] font-black">
                      <span className={isExact ? 'text-[#0B5D3B] dark:text-[#34D399]' : 'text-slate-500'}>
                        {dimensionSim}%
                      </span>
                      {isExact && <CheckCircle2 size={11} className="text-[#0B5D3B] dark:text-[#34D399]" />}
                    </div>
                  </div>

                  {/* Dimension Mini Progress Track */}
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExact
                          ? 'bg-gradient-to-r from-[#10B981] to-[#D4AF37]'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${dimensionSim}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

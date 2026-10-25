import React, { useMemo, useState } from 'react';
import { MatchProfile, Language } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { getCatalogQuestionById } from '../../services/questionCatalogService';
import { playPersonChime } from '../../utils/soundEffects';
import { InteractiveBioShowcase } from '../common/InteractiveBioShowcase';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Hand,
  Layers,
  MapPin,
} from 'lucide-react';

export interface TwinMatchCardProps {
  match: MatchProfile;
  rank?: number;
  isSaved: boolean;
  language: Language;
  onSelect: () => void;
  onCompare: () => void;
  onWave?: () => void;
  onToggleSave?: () => void;
}

const QUESTION_SHORT_LABELS: Record<string, { ar: string; en: string }> = {
  q_coffee: { ar: 'مقاهي مختصة', en: 'Specialty Coffee' },
  q_food: { ar: 'المأكولات المفضلة', en: 'Favorite Food' },
  q_lifestyle: { ar: 'الطابع اليومي', en: 'Daily Vibe' },
  q_vibe: { ar: 'الطبع الاجتماعي', en: 'Social Vibe' },
  q_sports: { ar: 'رياضة البادل', en: 'Padel & Sports' },
  q_sports_watch: { ar: 'متابعة الرياضة', en: 'Sports Fan' },
  q_drinks: { ar: 'المشروبات المنعشة', en: 'Refreshing Drinks' },
  q_hobbies: { ar: 'الهوايات الإبداعية', en: 'Creative Hobbies' },
  q_entertainment: { ar: 'الترفيه والمحتوى', en: 'Entertainment' },
  q_places: { ar: 'الأماكن المفضلة', en: 'Favorite Places' },
  q_leisure: { ar: 'طلعات الأسبوع', en: 'Weekend Vibes' },
  q_events: { ar: 'الفعاليات الحية', en: 'Live Events' },
  q_travel: { ar: 'أسلوب السفر', en: 'Travel Style' },
  q_tech: { ar: 'الشغف التقني', en: 'Tech Habits' },
  q_apps: { ar: 'التطبيق المفضل', en: 'Favorite App' },
  q_cars: { ar: 'ذوق السيارات', en: 'Car Style' },
};

const DEFAULT_FALLBACK_CHIPS: { ar: string; en: string }[] = [
  { ar: 'المأكولات المفضلة', en: 'Favorite Food' },
  { ar: 'مقاهي مختصة', en: 'Specialty Coffee' },
];

export const TwinMatchCard: React.FC<TwinMatchCardProps> = ({
  match,
  rank,
  isSaved,
  language,
  onSelect,
  onCompare,
  onWave,
  onToggleSave,
}) => {
  const { glowPos, handleTouchMove, handleTouchEnd } = useTouchGlow({ haptic: true });
  const [isBioOpen, setIsBioOpen] = useState(false);

  const resolvedChips = useMemo(() => {
    const rawIds =
      Array.isArray(match.sharedInterests) && match.sharedInterests.length > 0
        ? match.sharedInterests
        : ['q_food', 'q_coffee', 'q_sports'];

    const uniqueIds = Array.from(new Set(rawIds));
    const labels = uniqueIds.map((qid) => {
      const preset = QUESTION_SHORT_LABELS[qid];
      if (preset) {
        return language === 'ar' ? preset.ar : preset.en;
      }
      const catalogQ = getCatalogQuestionById(qid);
      if (catalogQ) {
        return language === 'ar' ? catalogQ.titleAr : catalogQ.titleEn;
      }
      return language === 'ar' ? 'اهتمام مشترك' : 'Shared Interest';
    });

    if (labels.length === 0) {
      return {
        visible: DEFAULT_FALLBACK_CHIPS.map((c) => (language === 'ar' ? c.ar : c.en)),
        extraCount: 0,
      };
    }

    return {
      visible: labels.slice(0, 2),
      extraCount: Math.max(0, labels.length - 2),
    };
  }, [match.sharedInterests, language]);

  const cleanUsername = useMemo(() => match.username.replace(/^@+/, ''), [match.username]);

  const bioText =
    match.bio?.trim() ||
    (language === 'ar'
      ? 'يشاركك حب التفاصيل اليومية المميزة، أجواء القهوة المختصة، والطلعات الهادئة مع الأصدقاء.'
      : 'Shares your appreciation for specialty coffee rituals, active weekends, and authentic conversations.');

  return (
    <div className="relative group">
      {/* Outer Sculpted Shadow Frame / Pedestal Bezel with Sweeping Right-to-Left Emerald-Gold Glow */}
      <div
        data-custom-glow="true"
        data-luxury-bezel="true"
        onClick={() => {
          playPersonChime(match.id);
          onSelect();
        }}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleTouchMove}
        onMouseLeave={handleTouchEnd}
        className="
          relative w-full rounded-[30px] p-[2.5px] overflow-hidden
          bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
          dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
          shadow-[0_10px_0_0_#BFD5C8,0_22px_44px_-6px_rgba(11,93,59,0.24),0_6px_18px_rgba(212,175,55,0.18)]
          dark:shadow-[0_10px_0_0_#07120C,0_24px_48px_rgba(0,0,0,0.82),0_0_32px_rgba(16,185,129,0.18)]
          cursor-pointer select-none transition-shadow duration-300
        "
      >
        {/* Layer 1: Luminous Right-to-Left Sweeping Bezel Rim Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -inset-x-6 z-0 animate-rtl-bezel-glow"
          style={{
            background:
              'linear-gradient(270deg, transparent 0%, rgba(16,185,129,0.85) 35%, rgba(250,204,21,0.98) 50%, rgba(16,185,129,0.85) 65%, transparent 100%)',
          }}
        />

        {/* Inner Luxury Tactile Card Surface */}
        <div
          className="
            relative z-10 w-full p-4 sm:p-5 rounded-[27.5px]
            bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9]
            dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713]
            flex flex-col justify-between overflow-hidden
          "
        >
          {/* Top Luminous Right-to-Left Crown Ribbon */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 inset-x-0 h-[3px] overflow-hidden z-20"
          >
            <div
              className="w-full h-full animate-rtl-bezel-glow"
              style={{
                background:
                  'linear-gradient(270deg, transparent 5%, #10B981 35%, #FBBF24 50%, #0B5D3B 68%, transparent 95%)',
              }}
            />
          </div>

          {/* Layer 2: Soft Satin Right-to-Left Ambient Glow Wave across the card body */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 animate-rtl-surface-glow"
            style={{
              background:
                'linear-gradient(270deg, transparent 10%, rgba(16,185,129,0.09) 42%, rgba(212,175,55,0.15) 52%, rgba(16,185,129,0.07) 64%, transparent 90%)',
            }}
          />

          {/* Dynamic Touch Glow Halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-[27.5px] z-0"
            style={{
              opacity: glowPos.active ? 1 : 0,
              background: `radial-gradient(240px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.26), rgba(212, 175, 55, 0.16), transparent 72%)`,
            }}
          />

          {/* Top Specular Gloss Highlight */}
          <div
            aria-hidden="true"
            className="absolute inset-x-5 top-1 h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/85 to-transparent pointer-events-none opacity-80 z-0"
          />

        {/* ============================================================== */}
        {/* 1. UPPER SHOWCASE: Large Backgroundless Character + Info/Chips */}
        {/*    Matches maya_alrashid@ layout in reference image            */}
        {/* ============================================================== */}
        <div className="relative z-10 flex items-stretch justify-between gap-3.5 min-h-[142px]">
          {/* Start Side (Right in RTL): Large Prominent Backgroundless Cutout Character */}
          <div className="relative w-[124px] sm:w-[138px] min-h-[138px] shrink-0 flex items-center justify-center bg-transparent">
            <div className="relative flex items-center justify-center bg-transparent transition-transform duration-200 group-hover:scale-108 group-hover:-translate-y-0.5">
              <AvatarRenderer avatar={match.avatar} size={134} showBackdrop={false} />
              <span
                className="absolute bottom-1.5 right-2 w-4 h-4 rounded-full bg-[#10B981] ring-2 ring-white dark:ring-[#18211B] shadow-2xs"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Beside Character (Left in RTL): Top Identity/Score Row + Bottom Shared Pills */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Upper Row: Username + City/Age on Start | Score Pill + Bookmark on End */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-[15px] sm:text-base font-black text-[#18221C] dark:text-white truncate max-w-[135px] sm:max-w-[155px]">
                    <span dir="ltr" className="inline-block font-black tracking-tight">
                      @{cleanUsername}
                    </span>
                  </h3>

                  {typeof rank === 'number' && rank > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF1D6] dark:bg-[#2F2612] border border-[#E6CE84] dark:border-[#D4AF37]/40 text-[#9B7716] dark:text-[#F3CE5A] text-[10px] font-black leading-none shrink-0 tabular-nums">
                      {language === 'ar' ? `شبيهك #${rank}` : `Twin #${rank}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-[#6C766F] dark:text-slate-400 mt-1 truncate">
                  <MapPin size={12} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                  <span className="truncate">{formatCity(match.city, language)}</span>
                  <span aria-hidden="true">·</span>
                  <span dir="ltr" className="tabular-nums shrink-0">
                    {match.ageRange || '24-29'}
                  </span>
                </div>
              </div>

              {/* Score Pill + Bookmark Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className="
                    px-3 py-1.5 rounded-full
                    bg-[#D6F1E3] dark:bg-[#123826]
                    border border-[#A7DFC3] dark:border-[#34D399]/35
                    text-[#085334] dark:text-[#34D399]
                    text-xs font-black leading-none tabular-nums shadow-2xs
                  "
                >
                  {match.similarityScore}%
                </div>

                {onToggleSave && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave();
                    }}
                    aria-label={
                      isSaved
                        ? language === 'ar'
                          ? 'إزالة من المحفوظات'
                          : 'Remove from saved'
                        : language === 'ar'
                        ? 'حفظ الملف'
                        : 'Save profile'
                    }
                    className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center
                      border transition-all cursor-pointer active:translate-y-0.5 shrink-0
                      ${
                        isSaved
                          ? 'bg-gradient-to-b from-[#FFF6D1] to-[#F5DE93] dark:from-[#3B3014] dark:to-[#28200B] border-[#DAB853] dark:border-[#D4AF37]/60 shadow-[0_3px_0_0_#C9A43F] dark:shadow-[0_3px_0_0_#171206] text-[#B88E1E] dark:text-[#F4CF5B]'
                          : 'bg-white dark:bg-[#1D251F] border-[#E2E6E3] dark:border-slate-700 shadow-[0_3px_0_0_#DCE0DD] dark:shadow-[0_3px_0_0_#0D130F] text-[#7A847D] dark:text-slate-300 hover:border-[#D4AF37] hover:text-[#C29A2B]'
                      }
                    `}
                  >
                    <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
                  </button>
                )}
              </div>
            </div>

            {/* Lower Row: Shared Interest Pills aligned cleanly beside the character */}
            <div className="flex flex-wrap items-center justify-end rtl:justify-end ltr:justify-start gap-1.5 mt-3">
              {resolvedChips.visible.map((chipLabel, idx) => (
                <span
                  key={`${match.id}_chip_${idx}`}
                  className="
                    px-3 py-1 rounded-full
                    bg-[#EFFAF4] dark:bg-[#122C20]
                    border border-[#9FD0B7] dark:border-[#246347]
                    text-[11px] font-black text-[#084D30] dark:text-[#6EE7B7]
                    whitespace-nowrap shadow-2xs
                  "
                >
                  {chipLabel}
                </span>
              ))}

              {resolvedChips.extraCount > 0 && (
                <span
                  dir="ltr"
                  className="px-1.5 py-0.5 text-[11px] font-black text-[#085334] dark:text-[#34D399] tabular-nums"
                >
                  +{resolvedChips.extraCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. INTERACTIVE PROGRESSIVE BIO SHOWCASE (Toggled by "عرض النبذة") */}
        {/* ============================================================== */}
        {isBioOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 mt-3.5 animate-fade-in"
          >
            <InteractiveBioShowcase
              bio={bioText}
              username={cleanUsername}
              language={language}
              variant="card"
              titleAr="نبذة الشخصية"
              titleEn="Personality Bio"
              onClose={() => setIsBioOpen(false)}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. BOTTOM ACTION BAR: لوّح وسلّم | عرض النبذة | مقارنة تفاصيل */}
        {/* ============================================================== */}
        <div className="relative z-10 mt-3.5 pt-3 border-t border-[#ECE8DD] dark:border-slate-800/90 flex items-center justify-between gap-2">
          {/* 1. Wave Button (لوّح وسلّم) */}
          {onWave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWave();
              }}
              className="
                min-h-[48px] px-3 sm:px-3.5 py-1.5 rounded-2xl
                bg-white dark:bg-[#19231D]
                hover:bg-[#F3FBF7] dark:hover:bg-[#1E2C24]
                border border-[#DCE2DE] dark:border-slate-700
                shadow-2xs active:scale-95
                flex items-center justify-center gap-1.5
                cursor-pointer transition-all shrink-0
              "
            >
              <Hand size={15} className="text-[#C9A227] shrink-0" />
              <span className="text-xs font-black text-[#084D30] dark:text-[#6EE7B7] leading-[1.15] text-center">
                {language === 'ar' ? (
                  <>
                    <span className="block">لوّح</span>
                    <span className="block">وسلّم</span>
                  </>
                ) : (
                  <>
                    <span className="block">Wave</span>
                    <span className="block">&amp; Hi</span>
                  </>
                )}
              </span>
            </button>
          )}

          {/* 2. Center Trigger: عرض النبذة (View Bio) */}
          <button
            type="button"
            aria-expanded={isBioOpen}
            onClick={(e) => {
              e.stopPropagation();
              setIsBioOpen((prev) => !prev);
            }}
            className={`
              min-h-[46px] px-2.5 py-1.5 rounded-2xl
              text-xs font-black leading-[1.18] text-center
              transition-all cursor-pointer shrink-0 active:scale-95
              ${
                isBioOpen
                  ? 'bg-[#E3F6EC] dark:bg-[#0B5D3B]/40 text-[#085334] dark:text-[#34D399] border border-[#9FD0B7] dark:border-[#34D399]/40'
                  : 'text-[#085334] dark:text-[#6EE7B7] hover:bg-[#EEF8F2] dark:hover:bg-[#182820]'
              }
            `}
          >
            {language === 'ar' ? (
              isBioOpen ? (
                <>
                  <span className="block">إخفاء</span>
                  <span className="block">النبذة</span>
                </>
              ) : (
                <>
                  <span className="block">عرض</span>
                  <span className="block">النبذة</span>
                </>
              )
            ) : isBioOpen ? (
              <>
                <span className="block">Hide</span>
                <span className="block">Bio</span>
              </>
            ) : (
              <>
                <span className="block">View</span>
                <span className="block">Bio</span>
              </>
            )}
          </button>

          {/* 3. Glossy 3D Emerald Compare CTA (مقارنة تفاصيل الشخصية) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCompare();
            }}
            className="
              relative flex-1 min-h-[50px] px-3.5 py-2 rounded-2xl
              bg-gradient-to-b from-[#178A59] via-[#0B5D3B] to-[#063A24]
              dark:from-[#199863] dark:via-[#0E6D46] dark:to-[#063A24]
              text-white font-black text-xs sm:text-[13px] leading-[1.18]
              border-2 border-[#2AB278]/75 dark:border-[#34D399]/60
              shadow-[0_5px_0_0_#042617,0_10px_18px_rgba(11,93,59,0.28)]
              dark:shadow-[0_5px_0_0_#031C11,0_10px_18px_rgba(16,185,129,0.22)]
              hover:brightness-105
              active:translate-y-1 active:shadow-[0_1px_0_0_#042617]
              flex items-center justify-between gap-1.5
              cursor-pointer overflow-hidden transition-all
            "
          >
            {/* Top Specular Gloss Reflection */}
            <div className="absolute inset-x-2 top-1 h-[42%] rounded-xl bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none" />

            <Layers size={15} className="text-white/95 shrink-0 relative z-10" />

            <span className="relative z-10 text-center flex-1">
              {language === 'ar' ? (
                <>
                  <span className="block">مقارنة تفاصيل</span>
                  <span className="block">الشخصية</span>
                </>
              ) : (
                <>
                  <span className="block">Compare</span>
                  <span className="block">Personality</span>
                </>
              )}
            </span>

            {language === 'ar' ? (
              <ArrowLeft size={14} className="text-white shrink-0 relative z-10" />
            ) : (
              <ArrowRight size={14} className="text-white shrink-0 relative z-10" />
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

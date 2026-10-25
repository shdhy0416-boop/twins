import React, { useMemo, useState } from 'react';
import { MatchProfile, Language } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { getCatalogQuestionById } from '../../services/questionCatalogService';
import {
  X,
  Bookmark,
  Share2,
  Hand,
  Sparkles,
  MapPin,
  ShieldCheck,
  Zap,
  Heart,
  Layers,
} from 'lucide-react';
import { playPersonChime, playClickPop } from '../../utils/soundEffects';
import { InteractiveBioShowcase } from '../common/InteractiveBioShowcase';

interface MatchDetailModalProps {
  match: MatchProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onCompare: (match: MatchProfile) => void;
  language: Language;
  reducedMotion?: boolean;
  isSaved?: boolean;
  onToggleSave?: (matchId: string) => void;
  onSendWave?: (match: MatchProfile) => void;
  onShareProfile?: (match: MatchProfile) => void;
}

const SHARED_POINT_LABELS: Record<string, { ar: string; en: string }> = {
  q_coffee: { ar: 'قهوة V60 مختصة', en: 'Specialty V60 Drip' },
  q_food: { ar: 'المأكولات المفضلة', en: 'Favorite Dining' },
  q_sports: { ar: 'رياضة البادل', en: 'Padel Tennis' },
  q_lifestyle: { ar: 'الطابع العصري المتجدد', en: 'Clean Aesthetics' },
  q_vibe: { ar: 'الطبع الاجتماعي الرايق', en: 'Warm Social Vibe' },
  q_places: { ar: 'الواجهات البحرية والمقاهي', en: 'Beach & Coastline' },
  q_drinks: { ar: 'المشروبات المنعشة', en: 'Refreshing Drinks' },
  q_hobbies: { ar: 'الفنون والتصوير', en: 'Creative Hobbies' },
  q_entertainment: { ar: 'البودكاست والأفلام', en: 'Podcasts & Cinema' },
  q_leisure: { ar: 'جلسات ولاونجات هادئة', en: 'Boutique Lounges' },
  q_events: { ar: 'المعارض والفعاليات', en: 'Live Exhibitions' },
  q_travel: { ar: 'استكشاف المدن والسفر', en: 'Urban Travel' },
  q_tech: { ar: 'الشغف التقني', en: 'Tech Enthusiast' },
  q_cars: { ar: 'ذوق السيارات الفاخرة', en: 'Luxury Cars' },
  q_apps: { ar: 'التطبيق المفضل يومياً', en: 'Top Daily App' },
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  isOpen,
  onClose,
  onCompare,
  language,
  reducedMotion = false,
  isSaved = false,
  onToggleSave,
  onSendWave,
  onShareProfile,
}) => {
  const [liked, setLiked] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [burstHeart, setBurstHeart] = useState(false);

  const baseLikes = useMemo(() => {
    if (!match) return 27;
    let hash = 0;
    for (let i = 0; i < match.id.length; i++) {
      hash = (hash * 31 + match.id.charCodeAt(i)) % 45;
    }
    return 18 + hash;
  }, [match]);

  const sharedTags = useMemo(() => {
    if (!match) return [];
    const ids =
      Array.isArray(match.sharedInterests) && match.sharedInterests.length > 0
        ? match.sharedInterests
        : ['q_coffee', 'q_sports', 'q_places', 'q_lifestyle'];

    return Array.from(new Set(ids))
      .slice(0, 4)
      .map((qid) => {
        const preset = SHARED_POINT_LABELS[qid];
        if (preset) return language === 'ar' ? preset.ar : preset.en;
        const q = getCatalogQuestionById(qid);
        if (q) return language === 'ar' ? q.titleAr : q.titleEn;
        return language === 'ar' ? 'اهتمام مشترك' : 'Shared Point';
      });
  }, [match, language]);

  if (!isOpen || !match) return null;

  const cleanHandle = match.username.replace(/^@+/, '');

  const handleDoubleTapCharacter = () => {
    playPersonChime(match.id);
    setLiked(true);
    setBurstHeart(true);
    setTimeout(() => setBurstHeart(false), 750);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md sm:max-w-lg bg-gradient-to-b from-[#FAF9F4] via-[#F6F3EB] to-[#EFECE2] dark:from-[#1A241E] dark:via-[#151D18] dark:to-[#111713] rounded-t-[34px] sm:rounded-[34px] border border-white/90 dark:border-slate-800 px-5 sm:px-6 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar select-none"
      >
        {/* Top Sheet Handle + Interactive Hint */}
        <div className="flex flex-col items-center mb-3">
          <div className="w-11 h-1 rounded-full bg-slate-300/80 dark:bg-slate-700 mb-1.5" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-[#0B5D3B]/30 border border-[#C6E5D3] dark:border-[#10B981]/30 text-[10px] font-bold text-[#0B5D3B] dark:text-[#6EE7B7]">
            <Sparkles size={11} className="text-[#D4AF37]" />
            <span>
              {language === 'ar'
                ? 'اضغط مرتين على الشخصية للإعجاب أو مرة للتكبير 💗'
                : 'Double-tap character to like or tap to zoom 💗'}
            </span>
          </div>
        </div>

        {/* Top Action Bar: Like + Bookmark + Share | Close */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Interactive Like Counter Pill */}
            <button
              type="button"
              onClick={() => {
                playClickPop();
                setLiked((prev) => !prev);
              }}
              className={`h-10 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 ${
                liked
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                  : 'bg-white dark:bg-[#1E2721] border-[#E4DFD1] dark:border-slate-700 text-[#4A544E] dark:text-slate-200'
              }`}
            >
              <Heart size={15} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
              <span className="tabular-nums">{baseLikes + (liked ? 1 : 0)}</span>
            </button>

            {/* Bookmark Circle Button */}
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(match.id)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 ${
                  isSaved
                    ? 'bg-[#FFF7DC] dark:bg-[#332910] border-[#D4AF37] text-[#C89B22]'
                    : 'bg-white dark:bg-[#1E2721] border-[#E4DFD1] dark:border-slate-700 text-[#4A544E] dark:text-slate-200 hover:text-[#D4AF37]'
                }`}
                aria-label="Save profile"
              >
                <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
              </button>
            )}

            {/* Share Circle Button */}
            {onShareProfile && (
              <button
                type="button"
                onClick={() => onShareProfile(match)}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#1E2721] border border-[#E4DFD1] dark:border-slate-700 flex items-center justify-center text-[#4A544E] dark:text-slate-200 shadow-xs hover:text-[#0B5D3B] transition-all cursor-pointer active:scale-95"
                aria-label="Share profile"
              >
                <Share2 size={16} />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1E2721] border border-[#E4DFD1] dark:border-slate-700 flex items-center justify-center text-[#4A544E] dark:text-slate-200 shadow-xs hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ============================================================== */}
        {/* HERO CUTOUT CHARACTER (100% Backgroundless — Zero White Box!)  */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center text-center my-2">
          <div
            onClick={() => setZoomed((z) => !z)}
            onDoubleClick={handleDoubleTapCharacter}
            className={`relative flex items-center justify-center bg-transparent cursor-pointer transition-transform duration-300 ${
              zoomed ? 'scale-115 my-2' : 'scale-100'
            }`}
          >
            {/* Soft floor shadow beneath the floating character */}
            <div className="absolute -bottom-1.5 inset-x-6 h-4 rounded-full bg-[#0B5D3B]/15 dark:bg-black/55 blur-md pointer-events-none" />

            <AvatarRenderer avatar={match.avatar} size={178} showBackdrop={false} />

            {/* Online / Verified Emerald Dot */}
            {match.verifiedPersonality && (
              <span className="absolute bottom-2.5 right-3.5 w-4.5 h-4.5 rounded-full bg-[#10B981] ring-3 ring-[#FAF9F4] dark:ring-[#18211B] shadow-xs" />
            )}

            {/* Double-tap floating heart burst */}
            {burstHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                <Heart size={42} className="fill-rose-500 text-rose-500 drop-shadow-md" />
              </div>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black text-[#18221C] dark:text-white mt-3">
            <span dir="ltr" className="inline-block font-black tracking-tight">
              @{cleanHandle}
            </span>
          </h2>

          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0B5D3B] dark:text-[#6EE7B7] mt-1">
            <MapPin size={13} className="text-[#0B5D3B] dark:text-[#34D399]" />
            <span>{formatCity(match.city, language)}</span>
            <span className="text-slate-400">·</span>
            <span dir="ltr" className="text-[#6C766F] dark:text-slate-400 tabular-nums">
              {match.ageRange || '24-29'}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COMPATIBILITY SCORE BANNER CARD                                */}
        {/* ============================================================== */}
        <div className="mt-4 px-5 py-3.5 rounded-2xl bg-gradient-to-b from-white to-[#F2FAF5] dark:from-[#16261E] dark:to-[#111E17] border-2 border-[#B3DFC8] dark:border-[#1E563B] shadow-xs flex items-center justify-between">
          <span className="text-2xl font-black text-[#085334] dark:text-[#34D399] tabular-nums">
            {match.similarityScore}%
          </span>

          <div className="flex items-center gap-1.5 text-sm font-black text-[#085334] dark:text-[#6EE7B7]">
            <span>{language === 'ar' ? 'نسبة التطابق' : 'Compatibility Score'}</span>
            <Zap size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* PROMINENT INTERACTIVE PERSONALITY BIO SHOWCASE                  */}
        {/* ============================================================== */}
        <div className="mt-5">
          <InteractiveBioShowcase
            bio={match.bio}
            username={cleanHandle}
            language={language}
            variant="hero"
            reducedMotion={reducedMotion}
            titleAr="نبذة الشخصية"
            titleEn="Personality Bio"
          />
        </div>

        {/* ============================================================== */}
        {/* STRONGEST SHARED POINTS                                        */}
        {/* ============================================================== */}
        <div className="mt-4">
          <h4 className="text-xs font-black text-[#5C665F] dark:text-slate-400 mb-2 px-1">
            {language === 'ar' ? 'أقوى النقاط المشتركة' : 'Strongest Shared Points'}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            {sharedTags.map((tag, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-full bg-[#EAF8F0] dark:bg-[#122C20] border border-[#A5D9BE] dark:border-[#246347] text-xs font-black text-[#085334] dark:text-[#6EE7B7] shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM ACTION ROW: لوّح وسلّم | مقارنة تفاصيل الشخصية          */}
        {/* ============================================================== */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {onSendWave && (
            <button
              type="button"
              onClick={() => onSendWave(match)}
              className="min-h-[52px] px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1B251F] hover:bg-[#F3FBF7] border border-[#E0DCD0] dark:border-slate-700 shadow-[0_4px_0_0_#D8D2C3] dark:shadow-[0_4px_0_0_#0D130F] active:translate-y-0.5 text-sm font-black text-[#085334] dark:text-[#6EE7B7] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Hand size={17} className="text-[#D4AF37]" />
              <span>{language === 'ar' ? 'لوّح وسلّم' : 'Wave & Hi'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onCompare(match);
            }}
            className={`relative min-h-[52px] px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#178A59] via-[#0B5D3B] to-[#063A24] text-white font-black text-xs sm:text-sm leading-tight border-2 border-[#2AB278]/75 shadow-[0_5px_0_0_#042617,0_10px_18px_rgba(11,93,59,0.28)] hover:brightness-105 active:translate-y-1 flex items-center justify-center gap-2 cursor-pointer overflow-hidden transition-all ${
              onSendWave ? '' : 'col-span-2'
            }`}
          >
            <div className="absolute inset-x-2 top-1 h-[42%] rounded-xl bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none" />
            <Layers size={16} className="text-white/95 shrink-0 relative z-10" />
            <span className="relative z-10 text-center">
              {language === 'ar' ? 'مقارنة تفاصيل الشخصية' : 'Compare Personality'}
            </span>
          </button>
        </div>

        {/* Privacy Assurance */}
        <div className="mt-4 pt-3 border-t border-[#E6E1D5] dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#778078] dark:text-slate-400">
          <ShieldCheck size={12} className="text-[#0B5D3B] dark:text-[#34D399]" />
          <span>
            {language === 'ar'
              ? 'ملف شخصي محمي ومطابق لمعايير الخصوصية'
              : 'Protected profile under privacy guidelines'}
          </span>
        </div>
      </div>
    </div>
  );
};

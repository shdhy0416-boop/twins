import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Language } from '../../types';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { playClickPop } from '../../utils/soundEffects';
import {
  Check,
  Copy,
  Heart,
  PencilLine,
  Quote,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';

export interface InteractiveBioShowcaseProps {
  bio: string;
  language: Language;
  username?: string;
  variant?: 'hero' | 'card';
  reducedMotion?: boolean;
  titleAr?: string;
  titleEn?: string;
  onEditClick?: () => void;
  onClose?: () => void;
}

const HIGHLIGHT_KEYWORDS = [
  'القهوة المقطرة',
  'القهوة المختصة',
  'قهوة مقطرة',
  'قهوة مختصة',
  'فلات وايت',
  'سبانش لاتيه',
  'السيارات الألمانية',
  'سيارات الدفع الرباعي',
  'الجبل الأخضر',
  'الفنون المعاصرة',
  'الألعاب التنافسية',
  'بناء الأجسام',
  'البيتزا الإيطالية',
  'الطلعات البرية',
  'المغامرات الصحراوية',
  'البادل',
  'بادل',
  'التقنية',
  'البحر',
  'الغروب',
  'الكورنيش',
  'الهايكنج',
  'التصوير',
  'المعارض',
  'الدرعية',
  'الكبسة',
  'عسير',
  'الضباب',
  'مبرمج',
  'مصمم',
  'V60',
  'Specialty coffee',
  'specialty coffee',
  'padel',
  'Padel',
  'architecture',
  'espresso',
  'hiking',
  'photography',
  'design',
  'tech',
];

const SORTED_KEYWORDS = [...HIGHLIGHT_KEYWORDS].sort((a, b) => b.length - a.length);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KEYWORD_REGEX = new RegExp(
  `(${SORTED_KEYWORDS.map(escapeRegExp).join('|')})`,
  'gi'
);

export const InteractiveBioShowcase: React.FC<InteractiveBioShowcaseProps> = ({
  bio,
  language,
  username,
  variant = 'hero',
  reducedMotion = false,
  titleAr = 'نبذة الشخصية',
  titleEn = 'Personality Bio',
  onEditClick,
  onClose,
}) => {
  const isAr = language === 'ar';
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  const normalizedBio = useMemo(() => {
    const trimmed = (bio || '').trim();
    if (trimmed) return trimmed;
    return isAr
      ? 'محب للقهوة المختصة والتفاصيل الهادئة، أستمتع باللقاءات الملهمة وتجربة الأماكن الجديدة في نهاية الأسبوع.'
      : 'Specialty coffee enthusiast who enjoys inspiring conversations, active weekends, and discovering hidden city gems.';
  }, [bio, isAr]);

  const prefersReducedMotion = useMemo(() => {
    if (reducedMotion) return true;
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [reducedMotion]);

  const [visibleLength, setVisibleLength] = useState<number>(() =>
    prefersReducedMotion ? normalizedBio.length : 0
  );
  const [replaySeed, setReplaySeed] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [bioLiked, setBioLiked] = useState<boolean>(false);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseResonanceCount = useMemo(() => {
    const seedSource = username || normalizedBio;
    let hash = 0;
    for (let i = 0; i < seedSource.length; i++) {
      hash = (hash * 31 + seedSource.charCodeAt(i)) % 29;
    }
    return 12 + hash;
  }, [username, normalizedBio]);

  // Progressive human-cadence character reveal
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (prefersReducedMotion) {
      setVisibleLength(normalizedBio.length);
      return;
    }

    setVisibleLength(0);
    let currentIndex = 0;
    let cancelled = false;

    const stepReveal = () => {
      if (cancelled) return;
      if (currentIndex >= normalizedBio.length) {
        setVisibleLength(normalizedBio.length);
        return;
      }

      // Advance smoothly (1–2 chars per frame for crisp, fluid reading rhythm)
      const currentChar = normalizedBio[currentIndex];
      const stepSize = currentChar === ' ' ? 2 : 1;
      currentIndex = Math.min(normalizedBio.length, currentIndex + stepSize);
      setVisibleLength(currentIndex);

      if (currentIndex < normalizedBio.length) {
        const justRevealed = normalizedBio[currentIndex - 1];
        const isPausePunctuation =
          justRevealed === '،' ||
          justRevealed === ',' ||
          justRevealed === '.' ||
          justRevealed === '!' ||
          justRevealed === '؟' ||
          justRevealed === '—';
        const nextDelay = isPausePunctuation ? 95 : 22;
        timerRef.current = setTimeout(stepReveal, nextDelay);
      }
    };

    timerRef.current = setTimeout(stepReveal, 90);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [normalizedBio, prefersReducedMotion, replaySeed]);

  const isStreaming = visibleLength < normalizedBio.length;
  const progressRatio =
    normalizedBio.length > 0 ? Math.min(1, visibleLength / normalizedBio.length) : 1;

  const visibleSlice = normalizedBio.slice(0, visibleLength);

  // Tokenize visible slice to highlight signature taste keywords interactively
  const renderedSegments = useMemo(() => {
    if (!visibleSlice) return [];
    const parts = visibleSlice.split(KEYWORD_REGEX);
    return parts.filter(Boolean).map((part, idx) => {
      const isKeyword = SORTED_KEYWORDS.some(
        (kw) => kw.toLowerCase() === part.toLowerCase()
      );
      return { id: `${idx}_${part}`, text: part, isKeyword };
    });
  }, [visibleSlice]);

  const handleStageTap = () => {
    playClickPop();
    if (isStreaming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setVisibleLength(normalizedBio.length);
    } else {
      setActiveKeyword(null);
      setReplaySeed((prev) => prev + 1);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickPop();
    setActiveKeyword(null);
    setReplaySeed((prev) => prev + 1);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickPop();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(normalizedBio);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickPop();
    setBioLiked((prev) => !prev);
  };

  const isHero = variant === 'hero';

  return (
    <section
      aria-label={isAr ? titleAr : titleEn}
      onClick={(e) => e.stopPropagation()}
      className="w-full select-none"
    >
      {/* Top Section Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0B5D3B] to-[#10B981] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Quote size={14} className="text-[#FDE68A]" />
          </div>
          <h4
            className={`${
              isHero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            } font-black text-[#18221C] dark:text-white tracking-tight truncate`}
          >
            {isAr ? titleAr : titleEn}
          </h4>
        </div>

        {/* Interactive Header Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Replay Progressive Reveal */}
          <button
            type="button"
            onClick={handleReplay}
            title={isAr ? 'إعادة العرض التدريجي' : 'Replay progressive reveal'}
            aria-label={isAr ? 'إعادة العرض التدريجي' : 'Replay progressive reveal'}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white dark:bg-[#19241D] hover:bg-[#EAF8F0] dark:hover:bg-[#1F3126] border border-[#DCE5DF] dark:border-slate-700 text-[11px] font-black text-[#0B5D3B] dark:text-[#6EE7B7] inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer active:scale-95"
          >
            <RotateCcw size={12} className="text-[#D4AF37] shrink-0" />
            <span>{isAr ? 'إعادة العرض' : 'Replay'}</span>
          </button>

          {/* Copy Bio */}
          <button
            type="button"
            onClick={handleCopy}
            title={isAr ? 'نسخ النبذة' : 'Copy bio'}
            aria-label={isAr ? 'نسخ النبذة' : 'Copy bio'}
            className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-[11px] font-black inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
              copied
                ? 'bg-[#E6F8EE] dark:bg-[#123524] border-[#10B981] text-[#085334] dark:text-[#34D399]'
                : 'bg-white dark:bg-[#19241D] hover:bg-[#FAF8F2] dark:hover:bg-[#1F2C24] border-[#DCE5DF] dark:border-slate-700 text-[#4A544E] dark:text-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check size={12} className="text-[#10B981] shrink-0" />
                <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy size={12} className="shrink-0" />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </>
            )}
          </button>

          {/* Optional Edit Button for Owner Profile */}
          {onEditClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playClickPop();
                onEditClick();
              }}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-gradient-to-b from-[#158456] to-[#084B2F] text-white border border-[#2AB278]/70 text-[11px] font-black inline-flex items-center gap-1 whitespace-nowrap shadow-2xs hover:brightness-105 cursor-pointer active:scale-95"
            >
              <PencilLine size={12} className="shrink-0" />
              <span>{isAr ? 'تعديل نبذتي' : 'Edit Bio'}</span>
            </button>
          )}

          {/* Optional Close Button for Inline Card Drawer */}
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playClickPop();
                onClose();
              }}
              aria-label={isAr ? 'إغلاق النبذة' : 'Close bio'}
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#19241D] border border-[#DCE5DF] dark:border-slate-700 flex items-center justify-center text-[#5C665F] dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-95"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Outer Sculpted Shadow Frame / Pedestal Bezel with Sweeping Right-to-Left Glow */}
      <div
        data-luxury-bezel="true"
        className={`
          relative w-full p-[2.5px] overflow-hidden
          ${isHero ? 'rounded-[30px]' : 'rounded-[18px]'}
          bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
          dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
          shadow-[0_9px_0_0_#BFD5C8,0_20px_40px_-6px_rgba(11,93,59,0.22),0_6px_18px_rgba(212,175,55,0.16)]
          dark:shadow-[0_9px_0_0_#07120C,0_22px_44px_rgba(0,0,0,0.78),0_0_28px_rgba(16,185,129,0.18)]
        `}
      >
        {!prefersReducedMotion && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -inset-x-6 z-0 animate-rtl-bezel-glow"
            style={{
              background:
                'linear-gradient(270deg, transparent 0%, rgba(16,185,129,0.85) 35%, rgba(250,204,21,0.98) 50%, rgba(16,185,129,0.85) 65%, transparent 100%)',
            }}
          />
        )}

        {/* Main Prominent Interactive Bio Stage */}
        <div
          data-custom-glow="true"
          role="button"
          tabIndex={0}
          onClick={handleStageTap}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStageTap();
            }
          }}
          {...glowHandlers}
          className={`
            relative z-10 w-full overflow-hidden cursor-pointer transition-all duration-200
            ${
              isHero
                ? 'min-h-[164px] sm:min-h-[184px] p-5 sm:p-7 rounded-[27.5px]'
                : 'min-h-[126px] p-4 sm:p-5 rounded-[15.5px]'
            }
            bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9]
            dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713]
            flex flex-col justify-between
          `}
        >
          {/* Top Luminous Right-to-Left Crown Ribbon */}
          {!prefersReducedMotion && (
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
          )}

          {/* Soft Satin Right-to-Left Ambient Glow Wave */}
          {!prefersReducedMotion && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 animate-rtl-surface-glow"
              style={{
                background:
                  'linear-gradient(270deg, transparent 10%, rgba(16,185,129,0.09) 42%, rgba(212,175,55,0.15) 52%, rgba(16,185,129,0.07) 64%, transparent 90%)',
              }}
            />
          )}

          {/* Dynamic Touch & Cursor Spotlight */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-[inherit]"
            style={{
              opacity: glowPos.active ? 1 : 0,
              background: `radial-gradient(260px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.24), rgba(212, 175, 55, 0.16), transparent 72%)`,
            }}
          />

          {/* Top Specular Highlight */}
          <div className="pointer-events-none absolute inset-x-6 top-1 h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/90 dark:via-white/15 to-transparent" />

        {/* Subtle Decorative Corner Quote Mark (Clean SVG Icon, Zero Text Clutter) */}
        <Quote
          size={isHero ? 42 : 30}
          className={`pointer-events-none absolute ${
            isAr ? 'left-4 top-4' : 'right-4 top-4'
          } text-[#0B5D3B]/[0.07] dark:text-[#34D399]/[0.08]`}
          aria-hidden="true"
        />

        {/* Progressive Text Body */}
        <div className="relative z-10 my-auto py-1">
          <p
            aria-live="polite"
            className={`${
              isHero
                ? 'text-lg sm:text-xl md:text-[21px] leading-[1.8]'
                : 'text-sm sm:text-base leading-[1.72]'
            } font-black text-[#16211A] dark:text-[#F8F7F2] tracking-tight`}
          >
            <span className="text-[#D4AF37] font-black me-1 select-none">&ldquo;</span>

            {renderedSegments.map((seg) =>
              seg.isKeyword ? (
                <span
                  key={seg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickPop();
                    setActiveKeyword((prev) => (prev === seg.text ? null : seg.text));
                  }}
                  className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-lg transition-transform duration-150 ${
                    activeKeyword === seg.text
                      ? 'bg-[#0B5D3B] text-white dark:bg-[#34D399] dark:text-[#082618] scale-105 shadow-xs'
                      : 'bg-[#E5F7ED] dark:bg-[#123323] text-[#085334] dark:text-[#6EE7B7] border border-[#9FD6B9]/70 dark:border-[#2A6F4E]/60 hover:scale-105'
                  }`}
                >
                  {seg.text}
                </span>
              ) : (
                <React.Fragment key={seg.id}>{seg.text}</React.Fragment>
              )
            )}

            {/* Live Typing Caret while Progressive Reveal is Streaming */}
            {isStreaming ? (
              <span
                aria-hidden="true"
                className="inline-block align-middle w-[3px] h-[1.1em] ms-1 rounded-full bg-gradient-to-b from-[#10B981] to-[#D4AF37] animate-bio-caret"
              />
            ) : (
              <span className="text-[#D4AF37] font-black ms-1 select-none">&rdquo;</span>
            )}
          </p>

          {/* Keyword Spark Feedback Banner when User Taps a Highlighted Taste Word */}
          {activeKeyword && !isStreaming && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF8E1] dark:bg-[#2B2310] border border-[#E6C96B] dark:border-[#D4AF37]/45 text-xs font-black text-[#8F6B10] dark:text-[#F7D569] animate-fade-in">
              <Sparkles size={13} className="text-[#D4AF37] shrink-0" />
              <span>
                {isAr
                  ? `سمة بارزة في الشخصية: ${activeKeyword}`
                  : `Signature vibe trait: ${activeKeyword}`}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Footer Meta + Resonance Reaction */}
        <div className="relative z-10 mt-4 pt-3 border-t border-[#DCEADF]/80 dark:border-slate-800/90 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#5A675F] dark:text-slate-400 truncate">
            {isStreaming
              ? isAr
                ? 'اضغط لإظهار النبذة كاملة فوراً...'
                : 'Tap to reveal full bio instantly...'
              : isAr
              ? 'اضغط على الكلمات الملونة أو الخانة للتفاعل ✨'
              : 'Tap highlighted traits or card to replay ✨'}
          </span>

          {/* Vibe Resonance Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`min-h-[36px] px-3 py-1 rounded-xl border text-xs font-black inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0 ${
              bioLiked
                ? 'bg-rose-50 dark:bg-rose-950/45 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                : 'bg-white/90 dark:bg-[#19241D] border-[#DCE5DF] dark:border-slate-700 text-[#3F4A43] dark:text-slate-200 hover:border-rose-300'
            }`}
          >
            <Heart
              size={13}
              className={bioLiked ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}
            />
            <span>{isAr ? 'نبذة ملهمة' : 'Love Vibe'}</span>
            <span className="tabular-nums text-[11px] opacity-85">
              {baseResonanceCount + (bioLiked ? 1 : 0)}
            </span>
          </button>
        </div>

        {/* Smooth GPU-Composited Bottom Progress Hairline */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[#E5EFE9] dark:bg-slate-800/80 overflow-hidden">
          <div
            className={`h-full w-full bg-gradient-to-r from-[#0B5D3B] via-[#10B981] to-[#D4AF37] transition-transform duration-100 ease-out ${
              isAr ? 'origin-right' : 'origin-left'
            }`}
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>
        </div>
      </div>
    </section>
  );
};

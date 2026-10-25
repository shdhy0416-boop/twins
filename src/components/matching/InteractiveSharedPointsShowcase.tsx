import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Language } from '../../types';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { playClickPop } from '../../utils/soundEffects';
import { RealisticIcon } from '../common/RealisticIcon';
import {
  Check,
  Copy,
  Crown,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface SharedHarmonyItem {
  id: string;
  category: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

export interface InteractiveSharedPointsShowcaseProps {
  items: SharedHarmonyItem[];
  language: Language;
  username?: string;
  reducedMotion?: boolean;
}

export const InteractiveSharedPointsShowcase: React.FC<InteractiveSharedPointsShowcaseProps> = ({
  items,
  language,
  username,
  reducedMotion = false,
}) => {
  const isAr = language === 'ar';
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  const prefersReducedMotion = useMemo(() => {
    if (reducedMotion) return true;
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [reducedMotion]);

  const introLine = useMemo(() => {
    const count = items.length;
    if (isAr) {
      return `التقت ذائقتكما بتناغم استثنائي في ${count} تفاصيل مشتركة تميّز شخصيتكما:`;
    }
    return `Your tastes aligned in remarkable harmony across ${count} signature traits:`;
  }, [items.length, isAr]);

  // Build deterministic character timeline across intro + each item's full text
  const timeline = useMemo(() => {
    let cursor = introLine.length;
    const entries = items.map((item, index) => {
      const fullText = isAr ? item.labelAr : item.labelEn;
      const start = cursor;
      const end = start + fullText.length;
      cursor = end;
      return {
        item,
        index,
        fullText,
        start,
        end,
      };
    });
    return {
      totalChars: cursor,
      introLength: introLine.length,
      entries,
    };
  }, [items, introLine, isAr]);

  const [visibleChars, setVisibleChars] = useState<number>(() =>
    prefersReducedMotion ? timeline.totalChars : 0
  );
  const [replaySeed, setReplaySeed] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [harmonyLiked, setHarmonyLiked] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseHarmonyCount = useMemo(() => {
    const seed = `${username || 'twin'}_${items.length}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 34;
    }
    return 18 + hash;
  }, [username, items.length]);

  // Progressive human-cadence character streaming across intro + shared traits
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (prefersReducedMotion) {
      setVisibleChars(timeline.totalChars);
      return;
    }

    setVisibleChars(0);
    let current = 0;
    let cancelled = false;

    const itemBoundaries = new Set<number>([
      timeline.introLength,
      ...timeline.entries.map((entry) => entry.end),
    ]);

    const stepReveal = () => {
      if (cancelled) return;
      if (current >= timeline.totalChars) {
        setVisibleChars(timeline.totalChars);
        return;
      }

      const stepSize = 2;
      const nextValue = Math.min(timeline.totalChars, current + stepSize);

      // Snap cleanly onto item boundary if crossing one so pause feels crisp
      let hitBoundary = false;
      for (const boundary of itemBoundaries) {
        if (current < boundary && nextValue >= boundary) {
          current = boundary;
          hitBoundary = true;
          break;
        }
      }
      if (!hitBoundary) {
        current = nextValue;
      }

      setVisibleChars(current);

      if (current < timeline.totalChars) {
        const delay = hitBoundary ? 115 : 20;
        timerRef.current = setTimeout(stepReveal, delay);
      }
    };

    timerRef.current = setTimeout(stepReveal, 85);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeline, prefersReducedMotion, replaySeed]);

  const isStreaming = visibleChars < timeline.totalChars;
  const progressRatio =
    timeline.totalChars > 0 ? Math.min(1, visibleChars / timeline.totalChars) : 1;

  const visibleIntro = introLine.slice(0, Math.min(visibleChars, timeline.introLength));
  const isTypingIntro = visibleChars < timeline.introLength;

  const selectedEntry = useMemo(
    () => timeline.entries.find((e) => e.item.id === selectedId) || null,
    [timeline.entries, selectedId]
  );

  const handleStageTap = () => {
    playClickPop();
    if (isStreaming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setVisibleChars(timeline.totalChars);
    } else {
      setSelectedId(null);
      setReplaySeed((prev) => prev + 1);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickPop();
    setSelectedId(null);
    setReplaySeed((prev) => prev + 1);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickPop();
    const formattedList = [
      isAr ? 'النقاط المشتركة التي التقت:' : 'Shared Points of Harmony:',
      ...timeline.entries.map(
        (entry, idx) => `${idx + 1}. ${entry.item.category}: ${entry.fullText}`
      ),
    ].join('\n');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(formattedList);
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
    setHarmonyLiked((prev) => !prev);
  };

  return (
    <section
      aria-label={isAr ? 'النقاط المشتركة التي التقت' : 'Shared Points of Harmony'}
      onClick={(e) => e.stopPropagation()}
      className="w-full select-none"
    >
      {/* Top Luxury Section Header & Interactive Controls */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0B5D3B] via-[#138556] to-[#D4AF37] text-white flex items-center justify-center shadow-sm shrink-0">
            <Crown size={15} className="text-[#FFF3B0]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-black text-[#16211A] dark:text-white tracking-tight truncate">
              {isAr ? 'النقاط المشتركة التي التقت' : 'Shared Points of Harmony'}
            </h4>
            <p className="text-[11px] font-bold text-[#5E6B63] dark:text-slate-400 tabular-nums truncate">
              {isAr
                ? `${items.length} قواسم متطابقة · توافق ذوقي أصيل`
                : `${items.length} identical traits · Authentic taste match`}
            </p>
          </div>
        </div>

        {/* Replay & Copy Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleReplay}
            title={isAr ? 'إعادة العرض التدريجي' : 'Replay progressive reveal'}
            aria-label={isAr ? 'إعادة العرض التدريجي' : 'Replay progressive reveal'}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#19241D] hover:bg-[#EAF8F0] dark:hover:bg-[#1F3126] border border-[#CFE2D7] dark:border-slate-700 text-[11px] font-black text-[#0B5D3B] dark:text-[#6EE7B7] inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer active:scale-95"
          >
            <RotateCcw size={12} className="text-[#D4AF37] shrink-0" />
            <span>{isAr ? 'إعادة العرض' : 'Replay'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title={isAr ? 'نسخ النقاط المشتركة' : 'Copy shared points'}
            aria-label={isAr ? 'نسخ النقاط المشتركة' : 'Copy shared points'}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-[11px] font-black inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
              copied
                ? 'bg-[#E6F8EE] dark:bg-[#123524] border-[#10B981] text-[#085334] dark:text-[#34D399]'
                : 'bg-white dark:bg-[#19241D] hover:bg-[#FAF8F2] dark:hover:bg-[#1F2C24] border-[#CFE2D7] dark:border-slate-700 text-[#4A544E] dark:text-slate-200'
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
        </div>
      </div>

      {/* Outer Luxury Illuminated Bezel Frame */}
      <div
        data-luxury-bezel="true"
        className="
          relative p-[2.5px] rounded-[30px] overflow-hidden
          bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
          dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
          shadow-[0_10px_0_0_#BFD5C8,0_22px_44px_-6px_rgba(11,93,59,0.24),0_6px_18px_rgba(212,175,55,0.18)]
          dark:shadow-[0_10px_0_0_#07120C,0_24px_48px_rgba(0,0,0,0.82),0_0_32px_rgba(16,185,129,0.18)]
        "
      >
        {/* Smooth Right-to-Left Shimmer Sweep Along Bezel */}
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

        {/* Inner Interactive Showcase Surface */}
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
          className="relative z-10 w-full overflow-hidden cursor-pointer rounded-[27.5px] p-5 sm:p-6 bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9] dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713] flex flex-col justify-between transition-all duration-200"
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

          {/* Dynamic Touch & Cursor Emerald-Gold Spotlight */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-[inherit]"
            style={{
              opacity: glowPos.active ? 1 : 0,
              background: `radial-gradient(280px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.22), rgba(212, 175, 55, 0.16), transparent 74%)`,
            }}
          />

          {/* Top Specular Glass Sheen */}
          <div className="pointer-events-none absolute inset-x-8 top-1 h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/95 dark:via-white/15 to-transparent" />

          {/* Subtle Decorative Royal Watermark */}
          <Sparkles
            size={44}
            aria-hidden="true"
            className={`pointer-events-none absolute ${
              isAr ? 'left-4 top-4' : 'right-4 top-4'
            } text-[#D4AF37]/[0.13] dark:text-[#FDE68A]/[0.09]`}
          />

          {/* Progressive Editorial Lead-in Line */}
          <div className="relative z-10 mb-3.5">
            <p
              aria-live="polite"
              className="text-sm sm:text-base font-black text-[#1A2920] dark:text-[#F6F5EE] leading-[1.75] tracking-tight"
            >
              <span className="text-[#D4AF37] font-black me-1 select-none">&ldquo;</span>
              <span>{visibleIntro}</span>
              {isTypingIntro && (
                <span
                  aria-hidden="true"
                  className="inline-block align-middle w-[3px] h-[1.1em] ms-1 rounded-full bg-gradient-to-b from-[#10B981] to-[#D4AF37] animate-bio-caret"
                />
              )}
              {!isStreaming && (
                <span className="text-[#D4AF37] font-black ms-1 select-none">&rdquo;</span>
              )}
            </p>
          </div>

          {/* Progressive Typewriter List of Shared Harmony Cards (Full Untruncated Text) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {timeline.entries.map((entry, idx) => {
              const charsIntoItem = visibleChars - entry.start;
              if (charsIntoItem <= 0) {
                return null;
              }

              const visibleItemText = entry.fullText.slice(
                0,
                Math.min(entry.fullText.length, charsIntoItem)
              );
              const isCurrentlyTypingItem =
                visibleChars > entry.start && visibleChars < entry.end;
              const isItemComplete = visibleChars >= entry.end;
              const isSelected = selectedId === entry.item.id;

              return (
                <button
                  key={entry.item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickPop();
                    if (isStreaming) {
                      if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                      }
                      setVisibleChars(timeline.totalChars);
                      setSelectedId(entry.item.id);
                    } else {
                      setSelectedId((prev) => (prev === entry.item.id ? null : entry.item.id));
                    }
                  }}
                  className={`group text-start w-full min-h-[58px] p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3 animate-fade-in cursor-pointer active:scale-[0.985] ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#0B5D3B] via-[#0F7248] to-[#08462C] border-[#D4AF37] text-white shadow-[0_6px_18px_rgba(11,93,59,0.28)]'
                      : 'bg-white/95 dark:bg-[#1B2B22]/95 hover:bg-[#F2FBF6] dark:hover:bg-[#21362A] border-[#B6E2CA] dark:border-[#2B6B4D] text-[#13241B] dark:text-[#F3F8F5] shadow-[0_3px_10px_rgba(11,93,59,0.06)]'
                  }`}
                >
                  {/* Luxury Icon Crest */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isSelected
                        ? 'bg-white/15 border border-[#FDE68A]/50 text-[#FDE68A]'
                        : 'bg-gradient-to-br from-[#E6F7EE] to-[#FFF9E6] dark:from-[#123826] dark:to-[#2B2512] border border-[#A9DBC0]/80 dark:border-[#2E7353] text-[#0B5D3B] dark:text-[#6EE7B7]'
                    }`}
                  >
                    <RealisticIcon iconKey={entry.item.icon} size={20} />
                  </div>

                  {/* Category Kicker + Progressive Full Answer Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span
                        className={`text-[11px] font-bold tracking-tight ${
                          isSelected
                            ? 'text-[#FDE68A]'
                            : 'text-[#5A6D62] dark:text-[#9CB7A8]'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}. {entry.item.category}
                      </span>

                      {isItemComplete && (
                        <span
                          className={`text-[10px] font-black tabular-nums ${
                            isSelected
                              ? 'text-[#FDE68A]'
                              : 'text-[#0E7A4D] dark:text-[#34D399]'
                          }`}
                        >
                          100%
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-sm sm:text-[15px] font-black leading-snug break-words ${
                        isSelected
                          ? 'text-white'
                          : 'text-[#0B4A30] dark:text-[#ECFDF5]'
                      }`}
                    >
                      <span>{visibleItemText}</span>
                      {isCurrentlyTypingItem && (
                        <span
                          aria-hidden="true"
                          className="inline-block align-middle w-[3px] h-[1.05em] ms-1 rounded-full bg-gradient-to-b from-[#10B981] to-[#D4AF37] animate-bio-caret"
                        />
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Selected Trait Spotlight Banner */}
          {selectedEntry && !isStreaming && (
            <div className="relative z-10 mt-3.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFFDF5] via-[#FFF8E1] to-[#ECFDF5] dark:from-[#292210] dark:via-[#222B1A] dark:to-[#132E21] border border-[#E5C665] dark:border-[#D4AF37]/50 flex items-center gap-2 text-xs font-black text-[#7C5B0B] dark:text-[#FDE68A] animate-fade-in">
              <Sparkles size={14} className="text-[#D4AF37] shrink-0" />
              <span className="leading-relaxed">
                {isAr
                  ? `قاسم مشترك متطابق بالكامل في «${selectedEntry.item.category}»: ${selectedEntry.fullText}`
                  : `Identical 100% harmony in "${selectedEntry.item.category}": ${selectedEntry.fullText}`}
              </span>
            </div>
          )}

          {/* Interactive Footer Meta + Luxury Harmony Reaction Button */}
          <div className="relative z-10 mt-4 pt-3 border-t border-[#D8E9DF]/85 dark:border-slate-800/90 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#5A675F] dark:text-slate-400 truncate">
              {isStreaming
                ? isAr
                  ? 'اضغط لإظهار جميع النقاط المشتركة فوراً...'
                  : 'Tap to reveal all shared points instantly...'
                : isAr
                ? 'اضغط على أي نقطة مشتركة لإبراز تفاصيل التناغم'
                : 'Tap any shared trait to spotlight harmony details'}
            </span>

            <button
              type="button"
              onClick={handleToggleLike}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-black inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0 ${
                harmonyLiked
                  ? 'bg-gradient-to-r from-[#0B5D3B] to-[#138556] border-[#D4AF37] text-white shadow-sm'
                  : 'bg-white/95 dark:bg-[#19241D] border-[#CFE2D7] dark:border-slate-700 text-[#1E3328] dark:text-slate-200 hover:border-[#10B981]'
              }`}
            >
              <Heart
                size={13}
                className={
                  harmonyLiked
                    ? 'fill-[#FDE68A] text-[#FDE68A]'
                    : 'fill-rose-500/85 text-rose-500'
                }
              />
              <span>{isAr ? 'تناغم فخم' : 'Pure Harmony'}</span>
              <span className="tabular-nums text-[11px] opacity-90">
                {baseHarmonyCount + (harmonyLiked ? 1 : 0)}
              </span>
            </button>
          </div>

          {/* Smooth GPU-Composited Bottom Progress Hairline */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-[#E3EFE8] dark:bg-slate-800/80 overflow-hidden">
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

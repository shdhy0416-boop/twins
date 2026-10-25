import React from 'react';
import { MatchProfile, Language } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { Bookmark, Sparkles, MapPin, Zap } from 'lucide-react';
import { playPersonChime } from '../../utils/soundEffects';
import { useTouchGlow } from '../../hooks/useTouchGlow';

interface FloatingMatchCardProps {
  match: MatchProfile;
  language: Language;
  index: number;
  onClick: () => void;
  isSaved?: boolean;
  onToggleSave?: (matchId: string) => void;
}

export const FloatingMatchCard: React.FC<FloatingMatchCardProps> = ({
  match,
  language,
  onClick,
  isSaved = false,
  onToggleSave,
}) => {
  const { glowPos, handleTouchMove, handleTouchEnd } = useTouchGlow({ haptic: true });
  const cleanHandle = match.username.replace(/^@+/, '');

  return (
    <div
      data-custom-glow="true"
      data-luxury-bezel="true"
      data-fixed-size="true"
      onClick={() => {
        playPersonChime(match.id);
        onClick();
      }}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleTouchMove}
      onMouseLeave={handleTouchEnd}
      className="
        relative w-[186px] min-w-[186px] max-w-[186px] h-[272px] min-h-[272px] max-h-[272px] shrink-0 p-[2px] rounded-[26px] overflow-hidden
        bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
        dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
        shadow-[0_8px_0_0_#BFD5C8,0_18px_32px_-4px_rgba(11,93,59,0.22),0_4px_14px_rgba(212,175,55,0.16)]
        dark:shadow-[0_8px_0_0_#07120C,0_18px_36px_rgba(0,0,0,0.75),0_0_24px_rgba(16,185,129,0.16)]
        cursor-pointer transition-shadow duration-200 select-none group
      "
    >
      {/* Sweeping Right-to-Left Bezel Rim Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -inset-x-6 z-0 animate-rtl-bezel-glow"
        style={{
          background:
            'linear-gradient(270deg, transparent 0%, rgba(16,185,129,0.85) 35%, rgba(250,204,21,0.98) 50%, rgba(16,185,129,0.85) 65%, transparent 100%)',
        }}
      />

      {/* Inner Luxury Card Surface */}
      <div className="relative z-10 w-full h-full p-3.5 rounded-[24px] overflow-hidden flex flex-col justify-between bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9] dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713]">
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
              'linear-gradient(270deg, transparent 10%, rgba(16,185,129,0.09) 42%, rgba(212,175,55,0.15) 52%, rgba(16,185,129,0.07) 64%, transparent 90%)',
          }}
        />

        {/* Dynamic interactive touch halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-400 ease-out z-0"
          style={{
            opacity: glowPos.active ? 1 : 0,
            background: `radial-gradient(190px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.28), rgba(212, 175, 55, 0.16), transparent 70%)`,
          }}
        />

        {/* Top Gloss Highlight */}
        <div
          aria-hidden="true"
          className="absolute inset-x-3 top-0.5 h-[26%] rounded-t-2xl bg-gradient-to-b from-white/85 via-white/15 to-transparent dark:from-white/10 dark:via-transparent pointer-events-none z-10"
        />

        {/* Top Bar with Similarity Badge & Save Button */}
        <div className="relative z-10 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DDF3E7] dark:bg-[#0B5D3B]/45 text-[#0B5D3B] dark:text-[#34D399] border border-[#0B5D3B]/20 font-black text-[11px] shadow-2xs tabular-nums">
            <Zap size={11} className="fill-current" />
            <span>{match.similarityScore}%</span>
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(match.id);
              }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer
                ${
                  isSaved
                    ? 'bg-[#FFF6DA] dark:bg-[#332910] border-[#D4AF37] text-[#C99B24]'
                    : 'bg-[#FFFDF5] dark:bg-[#1E2721] border-[#E4D5A7] dark:border-slate-700 text-[#C9A227] hover:border-[#D4AF37]'
                }
              `}
              title={isSaved ? 'إزالة من المحفوظات' : 'حفظ البروفايل'}
            >
              <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
            </button>
          )}
        </div>

        {/* Centered Large Prominent Backgroundless Cutout Character */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center bg-transparent transition-transform duration-200 group-hover:scale-108 group-hover:-translate-y-0.5">
            <AvatarRenderer avatar={match.avatar} size={130} showBackdrop={false} />
            <span className="absolute bottom-1.5 right-2 w-4 h-4 rounded-full bg-[#10B981] ring-2 ring-white dark:ring-[#18211B] shadow-2xs" />
          </div>

          <span className="text-[13px] font-black text-[#202923] dark:text-white mt-1.5 truncate max-w-[156px]">
            <span dir="ltr" className="inline-block font-black tracking-tight">
              @{cleanHandle}
            </span>
          </span>

          <span className="text-[10.5px] text-[#778078] dark:text-slate-400 font-bold flex items-center gap-0.5 mt-0.5">
            <MapPin size={10} className="text-[#0B5D3B] dark:text-[#34D399]" />
            <span>{formatCity(match.city, language)}</span>
          </span>
        </div>

        {/* Shared Interest Pill */}
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] dark:bg-[#0B5D3B]/30 text-[#0B5D3B] dark:text-[#34D399] font-black text-[9.5px] border border-[#0B5D3B]/20 truncate max-w-full">
            <Sparkles size={10} />
            <span className="truncate">
              {language === 'ar' ? 'اهتمامات متطابقة' : 'Shared Interests'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

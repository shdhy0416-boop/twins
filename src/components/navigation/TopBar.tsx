import React from 'react';
import { Language, ThemeMode } from '../../types';
import { formatCity } from '../../utils/localization';
import { Globe, Moon, Sun, Bookmark, MapPin, Lightbulb, Volume2, VolumeX } from 'lucide-react';

interface TopBarControlsProps {
  language: Language;
  onToggleLanguage: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  simulateNoMatch: boolean;
  onToggleSimulateNoMatch: () => void;
  savedCount?: number;
  onOpenSaved?: () => void;
  currentCity?: string;
  onOpenNearbyModal?: () => void;
  onOpenFeedbackModal?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const TopBarControls: React.FC<TopBarControlsProps> = ({
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  simulateNoMatch,
  onToggleSimulateNoMatch,
  savedCount = 0,
  onOpenSaved,
  currentCity = 'Riyadh',
  onOpenNearbyModal,
  onOpenFeedbackModal,
  soundEnabled = true,
  onToggleSound,
}) => {
  return (
    // dir="ltr" keeps the header elements perfectly stable on the left/right,
    // avoiding horizontal element flipping when switching languages
    <div
      dir="ltr"
      className="sticky top-0 z-50 flex items-center justify-between px-3.5 sm:px-5 py-2.5 text-xs bg-[#F8F7F2]/95 dark:bg-[#080D0A]/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 text-[#778078] max-w-md mx-auto w-full transition-colors gap-2 select-none shadow-2xs"
    >
      {/* Left side items: Language switcher & Region indicator */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 1. Dynamic 3D Tactile Language Switcher */}
        <button
          onClick={onToggleLanguage}
          className="
            relative min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-full
            bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
            dark:from-[#1E2721] dark:to-[#121814]
            border border-white/90 dark:border-white/10
            shadow-[0_2px_0_0_#D5CEBE,0_4px_8px_rgba(0,0,0,0.06)]
            dark:shadow-[0_2px_0_0_#0D130F]
            active:translate-y-0.5
            hover:text-[#0B5D3B] transition-all cursor-pointer overflow-hidden shrink-0
          "
          aria-label="Toggle language"
          title={language === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
        >
          <div className="absolute inset-x-2 top-0.5 h-[35%] rounded-full bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
          <Globe size={14} className="text-[#0B5D3B] dark:text-[#10b981] relative z-10" />
          <span className="font-extrabold text-[#202923] dark:text-white relative z-10 text-[11px]">
            {language === 'en' ? 'العربية' : 'EN'}
          </span>
        </button>

        {/* 2. Interactive Clickable Region Pill Button */}
        {onOpenNearbyModal && (
          <button
            type="button"
            onClick={onOpenNearbyModal}
            className="
              relative min-h-[36px] px-3 py-1 rounded-full flex items-center gap-1.5
              bg-[#CCEEDC] hover:bg-[#BFE8D2] dark:bg-[#0B5D3B]/40 dark:hover:bg-[#0B5D3B]/60
              text-[#08422A] dark:text-[#6EE7B7] font-black text-xs
              border border-[#A8DFC2] dark:border-[#0B5D3B]/50
              shadow-[0_2px_0_0_#9ED7B9,0_4px_8px_rgba(11,93,59,0.12)]
              dark:shadow-[0_2px_0_0_#052E1C]
              active:translate-y-0.5 active:shadow-none
              transition-all cursor-pointer shrink-0
            "
            title={language === 'ar' ? `اضغط لمعرفة من موجود في ${formatCity(currentCity, language)} قريب منك` : `Click to see who is nearby in ${formatCity(currentCity, language)}`}
          >
            <span className="text-[12px]">{formatCity(currentCity, language)}</span>
            <MapPin size={13} className="text-[#08422A] dark:text-[#34D399]" />
          </button>
        )}
      </div>

      {/* Right side items: Audio Sound toggle, Feedback, Saved Bookmarks, Match Simulator & Dark Mode */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Sound FX Toggle Button */}
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            className={`
              relative min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full
              bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
              dark:from-[#1E2721] dark:to-[#121814]
              border border-white/90 dark:border-white/10
              shadow-[0_2px_0_0_#D5CEBE] dark:shadow-[0_2px_0_0_#0D130F]
              active:translate-y-0.5 transition-all cursor-pointer
              ${soundEnabled ? 'text-[#0B5D3B] dark:text-[#10B981]' : 'text-slate-400 dark:text-slate-600'}
            `}
            title={soundEnabled ? (language === 'ar' ? 'كتم النغمات والأصوات 🔇' : 'Mute Sounds 🔇') : (language === 'ar' ? 'تفعيل النغمات المميزة 🔊' : 'Enable Melodies & Sounds 🔊')}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        )}

        {/* Suggestion / Feedback Box Shortcut */}
        {onOpenFeedbackModal && (
          <button
            type="button"
            onClick={onOpenFeedbackModal}
            className="
              relative min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full
              bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
              dark:from-[#1E2721] dark:to-[#121814]
              border border-white/90 dark:border-white/10
              shadow-[0_2px_0_0_#D5CEBE] dark:shadow-[0_2px_0_0_#0D130F]
              active:translate-y-0.5
              hover:text-[#D4AF37] transition-all cursor-pointer
            "
            title={language === 'ar' ? 'اقترح ميزة لملاك الموقع 💡' : 'Suggest a Feature to Owners 💡'}
            aria-label="Site feedback"
          >
            <Lightbulb size={14} className="text-[#D4AF37]" />
          </button>
        )}

        {/* Saved Profiles Quick Link */}
        {onOpenSaved && (
          <button
            type="button"
            onClick={onOpenSaved}
            className="
              relative min-h-[36px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all cursor-pointer
              bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
              dark:from-[#1E2721] dark:to-[#121814]
              border-white/90 dark:border-white/10
              shadow-[0_2px_0_0_#D5CEBE] dark:shadow-[0_2px_0_0_#0D130F]
              active:translate-y-0.5
            "
            title={language === 'ar' ? 'الملفات المحفوظة' : 'Saved Profiles'}
            aria-label={language === 'ar' ? 'الملفات المحفوظة' : 'Saved Profiles'}
          >
            <Bookmark size={13} className={`${savedCount > 0 ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#778078]'}`} />
            <span className="text-[10px] font-extrabold font-mono text-[#202923] dark:text-white">
              {savedCount}
            </span>
          </button>
        )}

        {/* Empty state simulation toggle */}
        <button
          onClick={onToggleSimulateNoMatch}
          title="Toggle Empty Match State for Testing"
          className={`
            relative px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer
            ${
              simulateNoMatch
                ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-[0_2px_0_0_#052E1C]'
                : 'bg-white dark:bg-[#1E2721] border-slate-200 dark:border-slate-800 text-[#778078]'
            }
          `}
        >
          {language === 'ar'
            ? (simulateNoMatch ? 'وضع: فارغ' : 'وضع: تطابق')
            : (simulateNoMatch ? 'Empty ON' : 'Matches ON')}
        </button>

        {/* Mysterious Dark Mode Toggle Button (3D tactile embossed with emerald glow) */}
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          className="
            relative min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full
            bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
            dark:from-[#1E2E24] dark:to-[#101A14]
            border border-white/90 dark:border-[#10B981]/40
            shadow-[0_3px_0_0_#D5CEBE,0_6px_10px_rgba(0,0,0,0.06)]
            dark:shadow-[0_3px_0_0_#062316,0_0_12px_rgba(16,185,129,0.2)]
            active:translate-y-1 active:shadow-none
            text-slate-700 dark:text-[#D4AF37] hover:text-[#0B5D3B] dark:hover:text-[#10B981] transition-all cursor-pointer overflow-hidden
          "
          aria-label="Toggle mysterious dark mode"
          title={theme === 'dark' ? (language === 'ar' ? 'Light Mode activated ☀️' : 'Light Mode activated ☀️') : (language === 'ar' ? 'Mysterious Dark Mode activated 🌙' : 'Mysterious Dark Mode activated 🌙')}
        >
          <div className="absolute inset-x-1.5 top-0.5 h-[35%] rounded-full bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
          {theme === 'dark' ? (
            <Sun size={17} className="text-[#D4AF37] relative z-10 drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]" />
          ) : (
            <Moon size={16} className="text-slate-700 hover:text-[#0B5D3B] relative z-10" />
          )}
        </button>
      </div>
    </div>
  );
};

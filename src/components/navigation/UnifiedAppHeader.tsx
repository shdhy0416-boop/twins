import React, { useState } from 'react';
import { Language, ThemeMode, UserProfile } from '../../types';
import { formatCity } from '../../utils/localization';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { BrandLogo } from '../common/BrandLogo';
import {
  Globe,
  Moon,
  Sun,
  Bookmark,
  MapPin,
  Lightbulb,
  Volume2,
  VolumeX,
  Bell,
  Zap,
  X,
  Sparkles,
} from 'lucide-react';

interface UnifiedAppHeaderProps {
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
  userProfile: UserProfile;
  onEditProfile: () => void;
  onViewMatches?: () => void;
  onLogoClick?: () => void;
}

export const UnifiedAppHeader: React.FC<UnifiedAppHeaderProps> = ({
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
  userProfile,
  onEditProfile,
  onViewMatches,
  onLogoClick,
}) => {
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full max-w-md mx-auto bg-[#F8F7F2]/95 dark:bg-[#080D0A]/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs select-none transition-colors">
      
      {/* ============================================================== */}
      {/* ROW 1: TOPBAR CONTROLS (Language, City, Sound, Bulb, Saved, Matches, Theme) */}
      {/* ============================================================== */}
      <div
        dir="ltr"
        className="flex items-center justify-between px-3 sm:px-4 py-2 text-xs border-b border-slate-200/40 dark:border-slate-800/60 text-[#778078] gap-1.5 overflow-x-auto no-scrollbar"
      >
        {/* Left Side: Language & City */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="
              relative min-h-[34px] flex items-center gap-1.5 px-2.5 py-1 rounded-full
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
            <Globe size={13} className="text-[#0B5D3B] dark:text-[#10b981] relative z-10" />
            <span className="font-extrabold text-[#202923] dark:text-white relative z-10 text-[11px]">
              {language === 'en' ? 'العربية' : 'EN'}
            </span>
          </button>

          {/* City Location Button */}
          {onOpenNearbyModal && (
            <button
              type="button"
              onClick={onOpenNearbyModal}
              className="
                relative min-h-[34px] px-2.5 py-1 rounded-full flex items-center gap-1
                bg-[#CCEEDC] hover:bg-[#BFE8D2] dark:bg-[#0B5D3B]/40 dark:hover:bg-[#0B5D3B]/60
                text-[#08422A] dark:text-[#6EE7B7] font-black text-xs
                border border-[#A8DFC2] dark:border-[#0B5D3B]/50
                shadow-[0_2px_0_0_#9ED7B9,0_4px_8px_rgba(11,93,59,0.12)]
                dark:shadow-[0_2px_0_0_#052E1C]
                active:translate-y-0.5
                transition-all cursor-pointer shrink-0
              "
              title={language === 'ar' ? `اضغط لمعرفة من موجود في ${formatCity(currentCity, language)} قريب منك` : `Click to see who is nearby in ${formatCity(currentCity, language)}`}
            >
              <span className="text-[11px] font-black">{formatCity(currentCity, language)}</span>
              <MapPin size={12} className="text-[#08422A] dark:text-[#34D399]" />
            </button>
          )}
        </div>

        {/* Right Side: Sound, Bulb, Saved, Simulation Toggle, Theme */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Sound FX Toggle */}
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs hover:text-[#0B5D3B] cursor-pointer"
              title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
              aria-label="Sound Toggle"
            >
              {soundEnabled ? (
                <Volume2 size={13} className="text-[#0B5D3B] dark:text-[#34D399]" />
              ) : (
                <VolumeX size={13} className="text-slate-400" />
              )}
            </button>
          )}

          {/* Feedback Bulb */}
          {onOpenFeedbackModal && (
            <button
              type="button"
              onClick={onOpenFeedbackModal}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200/80 dark:border-slate-800 text-[#D4AF37] shadow-2xs hover:scale-105 cursor-pointer"
              title={language === 'ar' ? 'صندوق مقترحات الموقع' : 'Feedback box'}
              aria-label="Feedback"
            >
              <Lightbulb size={13} />
            </button>
          )}

          {/* Saved Bookmarks Shortcut */}
          {onOpenSaved && (
            <button
              type="button"
              onClick={onOpenSaved}
              className="min-h-[32px] px-2 py-0.5 rounded-full flex items-center gap-1 bg-white dark:bg-[#1E2721] border border-slate-200/80 dark:border-slate-800 shadow-2xs text-slate-700 dark:text-slate-200 hover:text-[#D4AF37] cursor-pointer"
              title="Saved profiles"
            >
              <Bookmark size={12} className={`${savedCount > 0 ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
              <span className="text-[11px] font-black font-mono text-[#0B5D3B] dark:text-[#DDF3E7]">
                {savedCount}
              </span>
            </button>
          )}

          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={onToggleSimulateNoMatch}
            className={`
              min-h-[32px] px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer
              ${
                simulateNoMatch
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                  : 'bg-white dark:bg-[#1E2721] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-400'
              }
            `}
            title="Simulation State"
          >
            {simulateNoMatch
              ? language === 'ar' ? 'تطابق: متوقف' : 'Sim: None'
              : language === 'ar' ? 'وضع: تطابق' : 'Matches ON'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#1E2721] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs hover:text-[#0B5D3B] cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun size={13} className="text-[#D4AF37]" />
            ) : (
              <Moon size={13} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: BRAND & ACTIONS BAR (TWIN Logo, Saved Count, Bell, Avatar) */}
      {/* Exactly matching image_a59ba0de.png */}
      {/* ============================================================== */}
      <div className="px-3.5 sm:px-5 py-2.5 flex items-center justify-between">
        
        {/* Brand Logo with TWIN & توأم */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0B5D3B] via-[#10B981] to-[#34D399] flex items-center justify-center text-white shadow-sm">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bubble text-base font-black tracking-tight text-[#0B5D3B] dark:text-[#34D399]">
              TWIN
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#DDF3E7] border border-[#0B5D3B]/20">
              توأم
            </span>
          </div>
        </div>

        {/* Action Group: Saved Counter, Notification Bell, User Avatar */}
        <div className="flex items-center gap-2">
          
          {/* Saved Bookmarks Pill Button */}
          {onOpenSaved && (
            <button
              type="button"
              onClick={onOpenSaved}
              className="
                relative min-h-[38px] px-3 py-1 flex items-center gap-1.5 rounded-full
                bg-gradient-to-b from-white to-[#F2EFE8] dark:from-[#243028] dark:to-[#18221C]
                border border-white/80 dark:border-white/10
                shadow-[0_3px_0_0_#D3CBB9,0_6px_10px_rgba(0,0,0,0.06)]
                dark:shadow-[0_3px_0_0_#0F1511]
                active:translate-y-0.5
                text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] transition-all cursor-pointer
              "
              title="Saved profiles"
            >
              <Bookmark size={15} className={`${savedCount > 0 ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
              <span className="text-xs font-black font-mono text-[#0B5D3B] dark:text-[#DDF3E7]">
                {savedCount}
              </span>
            </button>
          )}

          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
            className="
              relative min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full
              bg-gradient-to-b from-white to-[#F2EFE8] dark:from-[#243028] dark:to-[#18221C]
              border border-white/80 dark:border-white/10
              shadow-[0_3px_0_0_#D3CBB9,0_6px_10px_rgba(0,0,0,0.06)]
              dark:shadow-[0_3px_0_0_#0F1511]
              active:translate-y-0.5
              text-slate-700 dark:text-slate-300 hover:text-[#0B5D3B] transition-all cursor-pointer
            "
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E73A2A] ring-2 ring-white animate-pulse" />
          </button>

          {/* User Profile Avatar Thumbnail */}
          <button
            type="button"
            onClick={onEditProfile}
            className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-[#0B5D3B]/40 active:scale-95 transition-all cursor-pointer shadow-xs"
            aria-label="My Profile"
          >
            <AvatarRenderer avatar={userProfile.avatar} size={38} direction="center" />
          </button>
        </div>

      </div>

      {/* Notification Toast Panel Dropdown */}
      {showNotificationDrawer && (
        <div className="mx-4 mb-2 p-3.5 bg-gradient-to-b from-white to-[#FAF9F5] dark:from-[#1E2721] dark:to-[#151D18] border border-[#0B5D3B]/30 rounded-2xl shadow-xl text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between font-bold text-[#0B5D3B] dark:text-[#DDF3E7]">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#D4AF37]" />
              <span>{language === 'ar' ? 'تنبيهات توأم الذكية' : 'Twin Smart Alerts'}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowNotificationDrawer(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            {language === 'ar'
              ? 'انضم 3 أشخاص جدد في مدينتك يشاركونك حب القهوة المقطرة V60 ولعب البادل بنسبة تطابق 95%!'
              : '3 new members in your city share your passion for V60 drip coffee and Padel at 95% match!'}
          </p>

          {onViewMatches && (
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationDrawer(false);
                  onViewMatches();
                }}
                className="px-3 py-1 rounded-xl bg-[#0B5D3B] text-white text-[11px] font-bold cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ar' ? 'عرض المتطابقين' : 'View Matches'}
              </button>
            </div>
          )}
        </div>
      )}

    </header>
  );
};

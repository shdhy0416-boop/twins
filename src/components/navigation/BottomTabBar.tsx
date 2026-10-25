import React, { useState } from 'react';
import { ActiveScreen, Language } from '../../types';
import { playClickPop } from '../../utils/soundEffects';
import { Home, Users, Sparkles, Compass, User } from 'lucide-react';

interface BottomTabBarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  language: Language;
  savedCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeScreen,
  onNavigate,
  language,
  savedCount = 0,
}) => {
  const [pressedTab, setPressedTab] = useState<ActiveScreen | null>(null);
  const isAr = language === 'ar';

  const triggerTabPress = (id: ActiveScreen) => {
    setPressedTab(id);
    window.setTimeout(() => {
      setPressedTab((prev) => (prev === id ? null : prev));
    }, 260);
  };

  const handleSelectTab = (id: ActiveScreen) => {
    playClickPop();
    triggerTabPress(id);
    onNavigate(id);
  };

  const tabs: {
    id: ActiveScreen;
    labelEn: string;
    labelAr: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    isPrimary?: boolean;
  }[] = [
    {
      id: 'home',
      labelEn: 'Home',
      labelAr: 'الرئيسية',
      Icon: Home,
    },
    {
      id: 'matches',
      labelEn: 'Twins',
      labelAr: 'التوائم',
      Icon: Users,
    },
    {
      id: 'find_twin',
      labelEn: 'Find Twin',
      labelAr: 'جد توأمي',
      Icon: Sparkles,
      isPrimary: true,
    },
    {
      id: 'discover',
      labelEn: 'Discover',
      labelAr: 'استكشاف',
      Icon: Compass,
    },
    {
      id: 'profile',
      labelEn: 'Profile',
      labelAr: 'ملفي',
      Icon: User,
    },
  ];

  return (
    <nav
      dir="ltr"
      className="
        fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto
        bg-gradient-to-b from-[#FCFBF7]/96 via-[#F5F1E6]/98 to-[#EAE3D2]/98
        dark:from-[#18231C]/96 dark:via-[#121B15]/98 dark:to-[#0C120E]/98
        backdrop-blur-xl
        border-t-2 border-[#D4AF37]/45 dark:border-[#34D399]/30
        shadow-[0_-10px_28px_rgba(11,93,59,0.12),0_-2px_10px_rgba(212,175,55,0.12)]
        dark:shadow-[0_-12px_32px_rgba(0,0,0,0.68),0_-2px_14px_rgba(16,185,129,0.14)]
        px-2.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]
      "
    >
      {/* Subtle Top Specular Gold-Pearl Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/75 to-transparent"
      />

      <div className="grid grid-cols-5 items-center gap-1.5 relative">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          const isPressed = pressedTab === tab.id;
          const IconComponent = tab.Icon;

          if (tab.isPrimary) {
            return (
              <div key={tab.id} className="flex items-center justify-center">
                <button
                  type="button"
                  onPointerDown={() => triggerTabPress(tab.id)}
                  onClick={() => handleSelectTab(tab.id)}
                  aria-label={isAr ? tab.labelAr : tab.labelEn}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    relative -top-3.5 w-14 h-14 rounded-full flex flex-col items-center justify-center
                    border-2 transition-all duration-200 cursor-pointer group overflow-hidden
                    ${
                      isPressed
                        ? 'bg-gradient-to-tr from-[#D4AF37] via-[#15935E] to-[#FBBF24] border-[#FEF08A] translate-y-1 shadow-[0_2px_0_0_#052E1C,0_0_28px_rgba(212,175,55,0.75)] scale-95'
                        : isActive
                        ? 'bg-gradient-to-tr from-[#084C30] via-[#128756] to-[#D4AF37] border-[#FDE68A] shadow-[0_5px_0_0_#052B1B,0_12px_26px_rgba(16,185,129,0.45),0_0_20px_rgba(212,175,55,0.45)]'
                        : 'bg-gradient-to-tr from-[#0B5D3B] via-[#10B981] to-[#D4AF37] border-[#FFFDF7] dark:border-[#1B2A21] shadow-[0_5px_0_0_#063320,0_10px_22px_rgba(11,93,59,0.38)] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#063320]'
                    }
                  `}
                >
                  {/* Specular Jewel Crown Sheen */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-2 top-0.5 h-[42%] rounded-full bg-gradient-to-b from-white/60 via-white/15 to-transparent"
                  />
                  <IconComponent
                    size={23}
                    strokeWidth={2.4}
                    className={`relative z-10 transition-transform duration-200 ${
                      isPressed || isActive
                        ? 'text-[#FFFBEB] scale-110 drop-shadow-[0_0_8px_rgba(254,240,138,0.85)]'
                        : 'text-[#FFF9E6] group-hover:scale-110'
                    }`}
                  />
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onPointerDown={() => triggerTabPress(tab.id)}
              onClick={() => handleSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                relative min-h-[48px] py-1.5 px-1.5 rounded-2xl
                flex flex-col items-center justify-center gap-0.5
                border transition-all duration-200 cursor-pointer overflow-hidden select-none
                ${
                  isPressed
                    ? 'bg-gradient-to-b from-[#D4AF37] via-[#138253] to-[#07442A] text-white border-[#FEF08A] translate-y-[2px] shadow-[0_1px_0_0_#042617,0_0_22px_rgba(212,175,55,0.60)]'
                    : isActive
                    ? 'bg-gradient-to-b from-[#158556] via-[#0B5D3B] to-[#063B24] text-white border-[#D4AF37]/90 shadow-[0_3px_0_0_#042617,0_8px_18px_rgba(11,93,59,0.34),0_0_12px_rgba(212,175,55,0.24)]'
                    : 'bg-gradient-to-b from-white via-[#FAF8F2] to-[#ECE5D5] dark:from-[#1D2820] dark:via-[#162019] dark:to-[#101712] text-[#35443B] dark:text-slate-300 border-[#DDD3C0] dark:border-white/10 shadow-[0_3px_0_0_#CFC5B1,0_4px_10px_rgba(11,93,59,0.05)] dark:shadow-[0_3px_0_0_#080D0A,0_4px_10px_rgba(0,0,0,0.35)] hover:border-[#0B5D3B]/45 dark:hover:border-[#34D399]/40 hover:text-[#0B5D3B] dark:hover:text-[#6EE7B7] active:bg-gradient-to-b active:from-[#D4AF37] active:via-[#138253] active:to-[#07442A] active:text-white active:border-[#FEF08A] active:translate-y-[2px]'
                }
              `}
            >
              {/* Top Specular Gloss on Every Luxury Keycap */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-2 top-0.5 h-[36%] rounded-t-xl bg-gradient-to-b ${
                  isActive || isPressed
                    ? 'from-white/40 via-white/10 to-transparent'
                    : 'from-white/85 via-white/20 to-transparent dark:from-white/12 dark:via-transparent'
                }`}
              />

              {/* Active Gold Crown Accent Bar */}
              {(isActive || isPressed) && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#FDE68A] to-transparent"
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <IconComponent
                  size={19}
                  strokeWidth={isActive || isPressed ? 2.5 : 2.1}
                  className={`transition-all duration-200 ${
                    isPressed
                      ? 'text-[#FEF08A] scale-110'
                      : isActive
                      ? 'text-[#FDE68A] drop-shadow-[0_1px_4px_rgba(253,230,138,0.45)]'
                      : 'text-[#49584F] dark:text-slate-300'
                  }`}
                />
                {tab.id === 'discover' && savedCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-[#D4AF37] text-[#142019] text-[9px] font-black tabular-nums flex items-center justify-center shadow-2xs">
                    {savedCount}
                  </span>
                )}
              </div>

              <span
                className={`relative z-10 text-[11px] leading-tight whitespace-nowrap tracking-tight transition-colors duration-200 ${
                  isActive || isPressed
                    ? 'font-black text-[#FFFDF6]'
                    : 'font-extrabold text-[#2A3830] dark:text-slate-200'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

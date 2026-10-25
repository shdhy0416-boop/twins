import React from 'react';
import { useTouchGlow } from '../../hooks/useTouchGlow';

export interface OrganicFloatingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  interactive?: boolean;
  enableParallax?: boolean;
  floatDelay?: boolean;
}

export const OrganicFloatingCard: React.FC<OrganicFloatingCardProps> = ({
  children,
  className = '',
  glowColor,
  onClick,
  interactive = false,
}) => {
  const { glowPos, handleTouchMove, handleTouchEnd } = useTouchGlow({ haptic: true });

  return (
    /* Outer Sculpted Pedestal Bezel with Sweeping Right-to-Left Emerald-Gold Glow */
    <div
      data-custom-glow="true"
      data-luxury-bezel="true"
      onClick={onClick}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleTouchMove}
      onMouseLeave={handleTouchEnd}
      className={`
        card-interactive relative rounded-[30px] p-[2.5px] overflow-hidden transition-all duration-300
        bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
        dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
        shadow-[0_10px_0_0_#BFD5C8,0_22px_44px_-6px_rgba(11,93,59,0.24),0_6px_18px_rgba(212,175,55,0.18)]
        dark:shadow-[0_10px_0_0_#07120C,0_24px_48px_rgba(0,0,0,0.82),0_0_32px_rgba(16,185,129,0.18)]
        ${interactive || onClick ? 'cursor-pointer active:scale-[0.985]' : ''}
      `}
      style={
        glowColor
          ? {
              boxShadow: `0 10px 0 0 #BFD5C8, 0 22px 44px -6px rgba(11,93,59,0.24), 0 8px 24px ${glowColor}`,
            }
          : undefined
      }
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

      {/* Inner Luxury Card Surface */}
      <div
        className={`
          relative z-10 rounded-[27.5px] overflow-hidden
          bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9]
          dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713]
          ${interactive || onClick ? 'active:bg-[#E8F7EE] dark:active:bg-[#0B5D3B]/20' : ''}
          ${className}
        `}
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

        {/* Interactive Pointer / Finger Touch Halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-400 ease-out z-0"
          style={{
            opacity: glowPos.active ? 1 : 0,
            background: `radial-gradient(240px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.26), rgba(212, 175, 55, 0.16), transparent 70%)`,
          }}
        />

        {/* Specular Top Sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0.5 h-[26%] rounded-t-2xl bg-gradient-to-b from-white/80 via-white/15 to-transparent dark:from-white/10 dark:via-transparent z-0"
        />

        {/* Internal Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};

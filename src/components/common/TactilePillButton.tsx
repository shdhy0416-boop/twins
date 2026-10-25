import React from 'react';
import { useTouchGlow } from '../../hooks/useTouchGlow';

interface TactilePillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold' | 'outline';
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export const TactilePillButton: React.FC<TactilePillButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  size = 'md',
  icon,
  type = 'button',
}) => {
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-5 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3.5 text-base min-h-[52px]',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-b from-[#0B5D3B] via-[#0D6D45] to-[#084A2E] text-white border border-[#0B5D3B]/40 shadow-[0_5px_0_0_#063320,0_10px_20px_rgba(11,93,59,0.3)] active:translate-y-1 active:shadow-[0_1px_0_0_#063320]',
    gold:
      'bg-gradient-to-b from-[#F3BA2F] via-[#D4AF37] to-[#B8860B] text-[#1E293B] font-black border border-[#D4AF37]/50 shadow-[0_5px_0_0_#8C6705,0_10px_20px_rgba(212,175,55,0.35)] active:translate-y-1 active:shadow-[0_1px_0_0_#8C6705]',
    secondary:
      'bg-gradient-to-b from-white to-[#F2EFE8] dark:from-[#243028] dark:to-[#18221C] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-[0_4px_0_0_#D3CBB9,0_8px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_0_0_#0F1511] active:translate-y-1 active:shadow-[0_1px_0_0_#D3CBB9]',
    outline:
      'bg-transparent text-[#0B5D3B] dark:text-[#34D399] border-2 border-[#0B5D3B] dark:border-[#34D399] hover:bg-[#0B5D3B]/10 active:translate-y-0.5',
  };

  const glowGradient =
    variant === 'primary'
      ? `radial-gradient(180px circle at ${glowPos.x}% ${glowPos.y}%, rgba(52, 211, 153, 0.45), rgba(212, 175, 55, 0.28) 50%, transparent 72%)`
      : `radial-gradient(180px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.34), rgba(212, 175, 55, 0.24) 50%, transparent 72%)`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-custom-glow="true"
      {...(!disabled ? glowHandlers : {})}
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-full font-bold overflow-hidden
        transition-all duration-150 select-none cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {/* Dynamic Touch Glow Halo */}
      {!disabled && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-400 ease-out z-0"
          style={{
            opacity: glowPos.active ? 1 : 0,
            background: glowGradient,
          }}
        />
      )}

      {icon && <span className="shrink-0 relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

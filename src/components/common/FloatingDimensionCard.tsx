import React from 'react';
import { RealisticIcon } from './RealisticIcon';
import { useTouchGlow } from '../../hooks/useTouchGlow';

interface FloatingDimensionCardProps {
  iconKey: string;
  label: string;
  index: number;
  isSelected?: boolean;
  onClick: () => void;
}

export const FloatingDimensionCard: React.FC<FloatingDimensionCardProps> = ({
  iconKey,
  label,
  isSelected = false,
  onClick,
}) => {
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });

  return (
    <button
      type="button"
      onClick={onClick}
      data-custom-glow="true"
      data-fixed-size="true"
      {...glowHandlers}
      className={`
        relative w-full h-[80px] min-h-[80px] max-h-[80px] p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center overflow-hidden
        transition-colors duration-200 cursor-pointer select-none
        border
        ${
          isSelected
            ? 'bg-gradient-to-b from-[#DDF3E7] to-[#CCEEDC] dark:from-[#0B5D3B]/40 dark:to-[#08422A] border-[#0B5D3B] text-[#0B5D3B] dark:text-[#34D399] shadow-[0_3px_0_0_#0B5D3B/40]'
            : 'bg-white dark:bg-[#18211B] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0B5D3B]/40 shadow-[0_3px_0_0_#D5CEBE] dark:shadow-[0_3px_0_0_#0D130F]'
        }
      `}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400 ease-out z-0"
        style={{
          opacity: glowPos.active ? 1 : 0,
          background: `radial-gradient(120px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.32), rgba(212, 175, 55, 0.2), transparent 72%)`,
        }}
      />

      <div
        className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center ${
          isSelected
            ? 'bg-[#0B5D3B] text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}
      >
        <RealisticIcon iconKey={iconKey} size={16} />
      </div>
      <span className="relative z-10 text-[10px] font-bold line-clamp-1 leading-tight">{label}</span>
    </button>
  );
};

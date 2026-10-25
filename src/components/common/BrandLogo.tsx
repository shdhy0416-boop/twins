import React from 'react';
import { Sparkles } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`
          relative rounded-2xl flex items-center justify-center
          bg-gradient-to-tr from-[#0B5D3B] via-[#10B981] to-[#D4AF37]
          shadow-[0_4px_12px_rgba(11,93,59,0.3)]
          ${size === 'sm' ? 'w-8 h-8 rounded-xl' : size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-10 h-10'}
        `}
      >
        <span className="text-white font-black text-sm tracking-tighter flex items-center">
          <Sparkles size={size === 'sm' ? 14 : size === 'lg' ? 24 : 18} className="text-[#FFF9E6]" />
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-[#0B5D3B] dark:text-[#34D399] ${textSizes[size]}`}>
            TWIN
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#34D399] border border-[#0B5D3B]/20">
            توأم
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-[#778078] dark:text-slate-400 font-medium">
            تطابق الأذواق ونمط الحياة
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';
import { RealisticIcon } from '../common/RealisticIcon';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';

interface WelcomeScreenProps {
  language: Language;
  onStart: () => void;
  onExplore: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  onStart,
  onExplore,
}) => {
  const t = TRANSLATIONS[language];

  const sampleAvatarA = {
    id: 'av_demo_1',
    baseGender: 'masculine' as const,
    skinTone: '#E0AC69',
    hairStyle: 'traditional' as const,
    hairColor: '#1A1816',
    clothingStyle: 'thobe' as const,
    clothingColor: '#F8F7F2',
    accessory: 'sunglasses' as const,
    expression: 'smile' as const,
  };

  const sampleAvatarB = {
    id: 'av_demo_2',
    baseGender: 'feminine' as const,
    skinTone: '#F3C59D',
    hairStyle: 'hijab' as const,
    hairColor: '#202923',
    clothingStyle: 'blazer' as const,
    clothingColor: '#0B5D3B',
    accessory: 'glasses' as const,
    expression: 'cheerful' as const,
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] px-6 py-6 justify-between transition-colors">
      {/* Top Brand Lockup */}
      <div className="flex items-center justify-between pt-2">
        <BrandLogo size="md" showTagline={true} />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF3E7] dark:bg-[#0B5D3B]/25 text-[#0B5D3B] dark:text-[#DDF3E7] text-xs font-bold">
          <Sparkles size={13} className="text-[#D4AF37]" />
          <span>98% Twin Match</span>
        </div>
      </div>

      {/* Hero Visual Stage: Two Avatars Approaching Each Other */}
      <div className="my-auto py-6 flex flex-col items-center">
        {/* Animated Avatar Pair */}
        <div className="relative w-full h-44 flex items-center justify-center">
          <div className="absolute left-[12%] animate-high-five-left">
            <AvatarRenderer avatar={sampleAvatarA} size={92} direction="right" highFivePose={true} />
          </div>

          {/* Central High-Five Sparkle */}
          <div className="z-10 w-12 h-12 rounded-full bg-white dark:bg-[#18221C] shadow-lg flex items-center justify-center border border-[#0B5D3B]/20">
            <Sparkles size={24} className="text-[#D4AF37] animate-spin" />
          </div>

          <div className="absolute right-[12%] animate-high-five-right">
            <AvatarRenderer avatar={sampleAvatarB} size={92} direction="left" highFivePose={true} />
          </div>
        </div>

        {/* Floating Category Icons Banner */}
        <div className="flex items-center gap-3 my-4 py-2 px-4 rounded-2xl bg-white/80 dark:bg-[#18221C]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <RealisticIcon name="coffee_v60" size={32} />
          <RealisticIcon name="food_burger" size={32} />
          <RealisticIcon name="sport_padel" size={32} />
          <RealisticIcon name="car_luxury_sedan" size={32} />
        </div>

        {/* Main Headline */}
        <div className="text-center mt-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#202923] dark:text-white leading-tight">
            {t.tagline}
          </h1>
          <p className="mt-3 text-sm text-[#778078] dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Security badge reassurance */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-[#0B5D3B] dark:text-[#DDF3E7] font-medium">
          <ShieldCheck size={14} />
          <span>{t.privacyBadge}</span>
        </div>
      </div>

      {/* Bottom CTAs */}
      <div className="space-y-3 pt-4">
        <button
          onClick={onStart}
          className="w-full h-14 rounded-2xl bg-[#0B5D3B] hover:bg-[#08422A] text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-[#0B5D3B]/25 active:scale-[0.98] transition-all"
        >
          <Sparkles size={18} className="text-[#D4AF37]" />
          <span>{t.getStarted}</span>
          {language === 'ar' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
        </button>

        <button
          onClick={onExplore}
          className="w-full h-12 rounded-2xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-800 text-[#202923] dark:text-white font-bold text-xs flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          <span>{t.previewMatches}</span>
        </button>
      </div>
    </div>
  );
};

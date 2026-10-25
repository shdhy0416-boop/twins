import React from 'react';
import { UserProfile, Language } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { TactilePillButton } from '../common/TactilePillButton';
import { Sparkles, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

interface ProfileCompletionScreenProps {
  userProfile: UserProfile;
  language: Language;
  onFindTwin: () => void;
  onGoHome: () => void;
}

export const ProfileCompletionScreen: React.FC<ProfileCompletionScreenProps> = ({
  userProfile,
  language,
  onFindTwin,
  onGoHome,
}) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] p-6 pb-12 transition-colors text-center">
      {/* Top Badge */}
      <div className="pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 text-[#0B5D3B] dark:text-[#34D399] border border-[#0B5D3B]/20 text-xs font-black">
          <Sparkles size={14} className="text-[#D4AF37]" />
          <span>{language === 'ar' ? 'اكتملت البصمة الذوقية 100%' : 'Fingerprint 100% Complete'}</span>
        </div>
      </div>

      {/* Main Backgroundless Avatar Hero */}
      <div className="my-8 flex flex-col items-center">
        <div className="relative flex items-center justify-center bg-transparent">
          <div className="absolute -bottom-2 inset-x-6 h-4 rounded-full bg-[#0B5D3B]/15 dark:bg-black/50 blur-md pointer-events-none" />
          <AvatarRenderer avatar={userProfile.avatar} size={148} showBackdrop={false} />
        </div>

        <h1 className="text-2xl font-black mt-4 text-[#202923] dark:text-white">
          <span dir="ltr" className="inline-block font-bold">@{userProfile.username}</span>
        </h1>
        <p className="text-xs text-[#778078] dark:text-slate-400 max-w-xs mt-1">
          {language === 'ar'
            ? 'تم حفظ تفضيلاتك في خوارزمية التوأمة الرياضية بدقة. أنت جاهز الآن لمشاهدة التوائم المتطابقين معك!'
            : 'Your tastes and lifestyle choices are deterministically indexed. You are ready to meet your true twin!'}
        </p>

        {/* Security Assurance */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#0B5D3B] dark:text-[#34D399] font-bold">
          <ShieldCheck size={14} />
          <span>{language === 'ar' ? 'حسابك محمي بدون تسريب أي أرقام هواتف' : 'Protected zero-leak identity'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <TactilePillButton
          variant="gold"
          size="lg"
          className="w-full"
          onClick={onFindTwin}
          icon={<Flame size={18} className="fill-current text-[#1E293B]" />}
        >
          {language === 'ar' ? 'البحث عن توأمي المطابق الآن 🔥' : 'Find My Twin Now 🔥'}
        </TactilePillButton>

        <button
          type="button"
          onClick={onGoHome}
          className="w-full py-2.5 text-xs font-bold text-[#778078] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {language === 'ar' ? 'الذهاب إلى الشاشة الرئيسية' : 'Go to Home Screen'}
        </button>
      </div>
    </div>
  );
};

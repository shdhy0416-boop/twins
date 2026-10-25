import React, { useState } from 'react';
import { UserProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import { resolveCatalogOptionLabel } from '../../services/questionCatalogService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { RealisticIcon } from '../common/RealisticIcon';
import { OrganicFloatingCard } from '../common/OrganicFloatingCard';
import { VibeHistoryChart } from './VibeHistoryChart';
import { SiteFeedbackCard } from '../common/SiteFeedbackCard';
import { InteractiveBioShowcase } from '../common/InteractiveBioShowcase';
import { formatCity } from '../../utils/localization';
import { playClickPop } from '../../utils/soundEffects';
import { SiteFeedbackItem } from '../../types';
import {
  ShieldCheck,
  Eye,
  Sparkles,
  MapPin,
  Lock,
  Paintbrush,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react';

interface MyProfileScreenProps {
  userProfile: UserProfile;
  language: Language;
  reducedMotion?: boolean;
  onUpdateBio?: (nextBio: string) => void;
  onOpenAvatarCustomizer: () => void;
  onOpenPrivacySettings: () => void;
  onRetakeOnboarding: () => void;
  savedCount?: number;
  onOpenSaved?: () => void;
  onOpenNearbyModal?: () => void;
  onFeedbackSubmitted?: (item: SiteFeedbackItem) => void;
}

const BIO_STARTER_PRESETS: { labelAr: string; labelEn: string; textAr: string; textEn: string }[] = [
  {
    labelAr: 'قهوة وبادل ☕🎾',
    labelEn: 'Coffee & Padel ☕🎾',
    textAr: 'عاشق للقهوة المقطرة V60 ولعبة البادل في عطلات نهاية الأسبوع، ومحب للتقنية والطلعات الهادئة.',
    textEn: 'Specialty V60 pour-over fan, weekend padel player, and lover of clean design & chill lounges.',
  },
  {
    labelAr: 'فن وتصوير 🎨📸',
    labelEn: 'Art & Photo 🎨📸',
    textAr: 'مهتم بالفنون المعاصرة والتصوير والمعارض الثقافية، أحب استكشاف الكافيهات المميزة والحوارات الملهمة.',
    textEn: 'Passionate about contemporary art, street photography, gallery nights, and inspiring coffee talks.',
  },
  {
    labelAr: 'سفر ومغامرات 🌊🏔️',
    labelEn: 'Travel & Outdoors 🌊🏔️',
    textAr: 'أعشق السفر واستكشاف الطبيعة والهايكنج وقت الغروب، مع فلات وايت رايق وصحبة إيجابية.',
    textEn: 'Sunset hiker and urban traveler chasing scenic coastlines, flat whites, and authentic company.',
  },
];

export const MyProfileScreen: React.FC<MyProfileScreenProps> = ({
  userProfile,
  language,
  reducedMotion = false,
  onUpdateBio,
  onOpenAvatarCustomizer,
  onOpenPrivacySettings,
  onRetakeOnboarding,
  savedCount = 0,
  onOpenSaved,
  onOpenNearbyModal,
  onFeedbackSubmitted,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';
  const [isPublicPreview, setIsPublicPreview] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(userProfile.bio || '');
  const { allDisplayQuestions } = useQuestionCatalog();

  const resolvedOwnerBio =
    userProfile.bio &&
    userProfile.bio !== 'Specialty coffee aficionado, padel enthusiast, and urban architecture fan.'
      ? userProfile.bio
      : userProfile.bio
      ? isAr
        ? 'عاشق للقهوة المختصة V60، وممارس لرياضة البادل، ومهتم بالعمارة العصرية والتفاصيل الملهمة.'
        : userProfile.bio
      : isAr
      ? 'اكتب نبذتك الشخصية هنا لتظهر لتوائمك بأسلوب تدريجي وتفاعلي جذاب يعكس ذوقك الحقيقي.'
      : 'Write your personality bio here so your matches experience it with an interactive progressive reveal.';

  const handleOpenBioEditor = () => {
    setBioDraft(
      userProfile.bio &&
        userProfile.bio !==
          'Specialty coffee aficionado, padel enthusiast, and urban architecture fan.'
        ? userProfile.bio
        : resolvedOwnerBio
    );
    setIsEditingBio(true);
  };

  const handleSaveBioDraft = () => {
    playClickPop();
    const cleaned = bioDraft.trim();
    if (onUpdateBio) {
      onUpdateBio(cleaned);
    }
    setIsEditingBio(false);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-28 transition-colors">
      
      {/* 1. Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202923] dark:text-white">
            {t.navProfile}
          </h1>
          <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
            {language === 'ar' ? 'إدارة هويتك وبصمة شخصيتك' : 'Manage your identity and fingerprint'}
          </p>
        </div>

        {/* 3D Tactile Public/Private View Mode Switcher */}
        <button
          onClick={() => setIsPublicPreview(!isPublicPreview)}
          className={`
            relative min-h-[42px] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5
            transition-all duration-150 transform-gpu active:translate-y-1 cursor-pointer overflow-hidden
            ${
              isPublicPreview
                ? 'bg-gradient-to-b from-[#137A4F] via-[#0B5D3B] to-[#073D26] text-white border border-[#229D68]/50 shadow-[0_4px_0_0_#052E1C,0_8px_14px_rgba(11,93,59,0.3)] active:shadow-[0_1px_0_0_#052E1C]'
                : 'bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4] dark:from-[#243028] dark:to-[#18221C] text-[#202923] dark:text-[#F8F7F2] border border-white/80 dark:border-white/10 shadow-[0_4px_0_0_#D3CBB9,0_8px_14px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_0_0_#0F1511] active:shadow-[0_1px_0_0_#D3CBB9]'
            }
          `}
        >
          {/* Top specular glossy highlight */}
          <div className="absolute inset-x-2 top-0.5 h-[40%] rounded-full bg-gradient-to-b from-white/70 via-white/20 to-transparent pointer-events-none" />
          <Eye size={14} className="relative z-10" />
          <span className="relative z-10">
            {isPublicPreview
              ? (language === 'ar' ? 'معاينة عامة' : 'Public View')
              : (language === 'ar' ? 'عرض خاص' : 'Private View')}
          </span>
        </button>
      </div>

      {/* 2. Main Profile Identity Card (OrganicFloatingCard with 3D Parallax Tilt) */}
      <div className="px-5 mt-2">
        <OrganicFloatingCard
          className="p-5 text-center flex flex-col items-center relative overflow-hidden"
          glowColor="rgba(11, 93, 59, 0.15)"
        >
          {/* Avatar with 3D tactile edit button */}
          <div className="relative group cursor-pointer" onClick={onOpenAvatarCustomizer}>
            <div className="relative flex items-center justify-center bg-transparent">
              <AvatarRenderer avatar={userProfile.avatar} size={132} direction="center" showBackdrop={false} />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAvatarCustomizer();
              }}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-b from-[#137A4F] to-[#073D26] text-white flex items-center justify-center border-2 border-white dark:border-[#18221C] shadow-[0_3px_0_0_#052E1C,0_6px_10px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#052E1C] cursor-pointer"
              aria-label="Customize avatar"
              title={language === 'ar' ? 'تعديل الأفاتار والحركة' : 'Customize Avatar & Motion'}
            >
              <Paintbrush size={15} />
            </button>
          </div>

          <h2 className="mt-3 text-lg font-bold text-[#202923] dark:text-white">
            <span dir="ltr" className="inline-block font-bold">@{userProfile.username}</span>
          </h2>

          {/* Current Motion Badge */}
          <button
            type="button"
            onClick={onOpenAvatarCustomizer}
            className="mt-1 px-3 py-1 rounded-full bg-[#DDF3E7] dark:bg-[#0B5D3B]/30 border border-[#0B5D3B]/20 text-[11px] font-bold text-[#0B5D3B] dark:text-[#DDF3E7] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles size={12} className="text-[#D4AF37]" />
            <span>
              {language === 'ar'
                ? `الحركة: ${
                    userProfile.avatar.motionStyle === 'peace'
                      ? 'علامة النصر ✌️'
                      : userProfile.avatar.motionStyle === 'thumbs-up'
                      ? 'إبهام للأعلى 👍'
                      : userProfile.avatar.motionStyle === 'hand-raised'
                      ? 'يرفع يده ✋'
                      : userProfile.avatar.motionStyle === 'smiling'
                      ? 'يبتسم ويتألق 😊'
                      : userProfile.avatar.motionStyle === 'bouncing'
                      ? 'يقفز بمرح 🎉'
                      : userProfile.avatar.motionStyle === 'nodding'
                      ? 'إيماءة واثقة 😎'
                      : userProfile.avatar.motionStyle === 'cool-sway'
                      ? 'تمايل رايق ✨'
                      : userProfile.avatar.motionStyle === 'wink'
                      ? 'غمزة مرحة 😉'
                      : 'يلوح ويرحب 👋'
                  }`
                : `Motion: ${
                    userProfile.avatar.motionStyle === 'peace'
                      ? 'Victory Sign ✌️'
                      : userProfile.avatar.motionStyle === 'thumbs-up'
                      ? 'Thumbs Up 👍'
                      : userProfile.avatar.motionStyle === 'hand-raised'
                      ? 'Hand Raised ✋'
                      : userProfile.avatar.motionStyle === 'smiling'
                      ? 'Gentle Smile 😊'
                      : userProfile.avatar.motionStyle === 'bouncing'
                      ? 'Joyful Bounce 🎉'
                      : userProfile.avatar.motionStyle === 'nodding'
                      ? 'Confident Nod 😎'
                      : userProfile.avatar.motionStyle === 'cool-sway'
                      ? 'Chill Sway ✨'
                      : userProfile.avatar.motionStyle === 'wink'
                      ? 'Playful Wink 😉'
                      : 'Friendly Wave 👋'
                  }`}
            </span>
          </button>

          {/* Interactive Clickable City & Region Badge (كما في الصورة المرفقة) */}
          <div className="flex items-center gap-2 text-xs text-[#778078] dark:text-slate-400 mt-2">
            <button
              type="button"
              onClick={onOpenNearbyModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7EE] dark:bg-[#0B5D3B]/30 hover:bg-[#DDF3E7] text-[#0B5D3B] dark:text-[#34D399] font-black border border-[#0B5D3B]/30 shadow-2xs cursor-pointer active:scale-95 transition-all"
              title={language === 'ar' ? 'اضغط لمعرفة من موجود في منطقتك' : 'Click to see who is nearby in your city'}
            >
              <MapPin size={13} />
              <span>{formatCity(userProfile.city, language)}</span>
              <span className="text-[9px] bg-[#0B5D3B] text-white px-1.5 py-0.2 rounded-full">
                {language === 'ar' ? 'استكشف' : 'Nearby'}
              </span>
            </button>
            <span>·</span>
            <span>{language === 'ar' ? 'عضو موثق' : 'Verified Twin'}</span>
          </div>

          {/* Strict Privacy Safety Assurance Note */}
          <div className="mt-4 w-full p-2.5 rounded-2xl bg-gradient-to-b from-[#DDF3E7]/80 to-[#D5EFE0]/60 dark:bg-[#0B5D3B]/20 border border-[#0B5D3B]/20 flex items-center justify-center gap-1.5 text-xs text-[#0B5D3B] dark:text-[#DDF3E7] font-bold shadow-2xs">
            <ShieldCheck size={14} className="shrink-0" />
            <span className="text-[11px]">{t.guaranteeTitle}</span>
          </div>
        </OrganicFloatingCard>
      </div>

      {/* 2.5 Prominent Interactive Personality Bio Showcase + Large Bio Composer */}
      <div className="px-5 mt-4">
        {!isEditingBio ? (
          <InteractiveBioShowcase
            bio={resolvedOwnerBio}
            username={userProfile.username}
            language={language}
            variant="hero"
            reducedMotion={reducedMotion}
            titleAr="نبذة الشخصية"
            titleEn="Personality Bio"
            onEditClick={isPublicPreview ? undefined : handleOpenBioEditor}
          />
        ) : (
          <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-white via-[#FCFBF7] to-[#EAF8F0] dark:from-[#18261E] dark:via-[#141F19] dark:to-[#1D2518] border-2 border-[#10B981] dark:border-[#34D399] shadow-[0_6px_0_0_#CFE6D9,0_16px_32px_rgba(11,93,59,0.12)] dark:shadow-[0_6px_0_0_#0A120E] space-y-4 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-[#18221C] dark:text-white">
                  {isAr ? 'مساحة كتابة نبذة الشخصية' : 'Personality Bio Studio'}
                </h3>
                <p className="text-xs font-bold text-[#5C665F] dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'اكتب بأسلوبك أو اختر قالباً سريعاً — ستظهر تدريجياً بشكل تفاعلي لزوار ملفك'
                    : 'Write in your own voice or pick a starter — reveals progressively to visitors'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBio(false)}
                aria-label={isAr ? 'إلغاء' : 'Cancel'}
                className="w-9 h-9 rounded-xl bg-white dark:bg-[#19241D] border border-[#DCE5DF] dark:border-slate-700 flex items-center justify-center text-[#5C665F] dark:text-slate-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* One-Tap Smart Lifestyle Templates */}
            <div className="flex flex-wrap gap-2">
              {BIO_STARTER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    playClickPop();
                    setBioDraft(isAr ? preset.textAr : preset.textEn);
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A261F] hover:bg-[#E7F7EE] dark:hover:bg-[#1F3327] border border-[#B5DFC9] dark:border-[#2A684B] text-xs font-black text-[#085334] dark:text-[#6EE7B7] whitespace-nowrap transition-colors cursor-pointer active:scale-95"
                >
                  {isAr ? preset.labelAr : preset.labelEn}
                </button>
              ))}
            </div>

            {/* Large Prominent Bio Textarea */}
            <div>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value.slice(0, 260))}
                rows={4}
                placeholder={
                  isAr
                    ? 'مثال: عاشق للقهوة المقطرة V60 ولعبة البادل في نهاية الأسبوع، ومحب للتقنية والسفر...'
                    : 'Example: Specialty V60 coffee lover, weekend padel player, and design enthusiast...'
                }
                className="w-full min-h-[164px] p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111914] border-2 border-[#C8E6D6] dark:border-slate-700 text-base sm:text-lg font-black text-[#18221C] dark:text-white leading-relaxed resize-y placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between mt-1.5 px-1 text-xs font-bold text-[#6C766F] dark:text-slate-400">
                <span>
                  {isAr
                    ? 'تُبرز الكلمات المفتاحية تلقائياً عند العرض التدريجي'
                    : 'Keywords highlight automatically during progressive reveal'}
                </span>
                <span className="tabular-nums font-mono">{bioDraft.length}/260</span>
              </div>
            </div>

            {/* Save / Cancel Row */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingBio(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-[#19241D] border border-[#DCE5DF] dark:border-slate-700 text-xs font-black text-[#4A544E] dark:text-slate-300 whitespace-nowrap cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveBioDraft}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-b from-[#178A59] via-[#0B5D3B] to-[#063A24] text-white border border-[#2AB278]/80 text-xs sm:text-sm font-black inline-flex items-center gap-1.5 whitespace-nowrap shadow-[0_4px_0_0_#042617] active:translate-y-0.5 cursor-pointer"
              >
                <Check size={15} />
                <span>{isAr ? 'حفظ وعرض تدريجياً' : 'Save & Reveal Live'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 
        3. RECHARTS VIBE HISTORY VISUALIZATION 
        (7-Day personality & mood trend line chart)
      */}
      <div className="px-5 mt-4">
        <VibeHistoryChart language={language} />
      </div>

      {/* 3. Saved Profiles Shortcut Card */}
      {onOpenSaved && (
        <div className="px-5 mt-3">
          <button
            type="button"
            onClick={onOpenSaved}
            className="
              luxury-card-shimmer
              relative w-full p-4 rounded-2xl
              bg-gradient-to-b from-[#FFFDF8] via-[#FAF6EC] to-[#F3ECD8]
              dark:from-[#252219] dark:via-[#1D1A13] dark:to-[#17140E]
              border border-[#D4AF37]/45 dark:border-[#D4AF37]/30
              shadow-[0_6px_0_0_#BFD5C8,0_14px_24px_-4px_rgba(11,93,59,0.16),0_6px_14px_rgba(212,175,55,0.14)]
              dark:shadow-[0_6px_0_0_#07120C,0_14px_28px_rgba(0,0,0,0.65)]
              active:translate-y-1 active:shadow-[0_1px_0_0_#BFD5C8]
              flex items-center justify-between
              transition-all duration-150 cursor-pointer overflow-hidden
            "
          >
            <div className="absolute inset-x-2 top-0.5 h-[40%] rounded-xl bg-gradient-to-b from-white/90 via-white/20 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <Bookmark size={20} className="fill-[#D4AF37]" />
              </div>
              <div className="text-start">
                <span className="text-xs font-bold text-[#202923] dark:text-white block">
                  {t.savedProfilesTitle}
                </span>
                <span className="text-[11px] text-[#778078] dark:text-slate-400">
                  {language === 'ar' ? `${savedCount} ملفات محفوظة في قائمتك` : `${savedCount} profiles bookmarked in your list`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 relative z-10 text-[#0B5D3B] dark:text-[#DDF3E7]">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-[#0B5D3B]/10 dark:bg-white/10">
                {savedCount}
              </span>
              {language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
        </div>
      )}

      {/* 4. Action Controls: 3D Tactile Capsule Buttons */}
      <div className="px-5 mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={onOpenPrivacySettings}
          className="
            relative min-h-[50px] p-3.5 rounded-2xl
            bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
            dark:from-[#222C24] dark:via-[#1B231D] dark:to-[#151C17]
            border border-white/90 dark:border-white/10
            shadow-[0_5px_0_0_#D3CBB9,0_10px_16px_rgba(32,41,35,0.08)]
            dark:shadow-[0_5px_0_0_#0D130F,0_10px_16px_rgba(0,0,0,0.4)]
            active:translate-y-1 active:shadow-[0_1px_0_0_#D3CBB9]
            dark:active:shadow-[0_1px_0_0_#0D130F]
            text-xs font-bold text-[#202923] dark:text-[#F8F7F2]
            flex items-center justify-center gap-2
            transition-all duration-150 cursor-pointer overflow-hidden
          "
        >
          {/* Top specular glossy sheen */}
          <div className="absolute inset-x-2 top-0.5 h-[40%] rounded-xl bg-gradient-to-b from-white/90 via-white/20 to-transparent pointer-events-none" />
          <Lock size={15} className="text-[#0B5D3B] relative z-10 shrink-0" />
          <span className="relative z-10 truncate">{t.privacyTitle}</span>
        </button>

        <button
          onClick={onRetakeOnboarding}
          className="
            relative min-h-[50px] p-3.5 rounded-2xl
            bg-gradient-to-b from-white via-[#FAF9F5] to-[#EFECE4]
            dark:from-[#222C24] dark:via-[#1B231D] dark:to-[#151C17]
            border border-white/90 dark:border-white/10
            shadow-[0_5px_0_0_#D3CBB9,0_10px_16px_rgba(32,41,35,0.08)]
            dark:shadow-[0_5px_0_0_#0D130F,0_10px_16px_rgba(0,0,0,0.4)]
            active:translate-y-1 active:shadow-[0_1px_0_0_#D3CBB9]
            dark:active:shadow-[0_1px_0_0_#0D130F]
            text-xs font-bold text-[#202923] dark:text-[#F8F7F2]
            flex items-center justify-center gap-2
            transition-all duration-150 cursor-pointer overflow-hidden
          "
        >
          {/* Top specular glossy sheen */}
          <div className="absolute inset-x-2 top-0.5 h-[40%] rounded-xl bg-gradient-to-b from-white/90 via-white/20 to-transparent pointer-events-none" />
          <Sparkles size={15} className="text-[#D4AF37] relative z-10 shrink-0" />
          <span className="relative z-10 truncate">
            {language === 'ar' ? 'إعادة ضبط الإجابات' : 'Update Taste Profile'}
          </span>
        </button>
      </div>

      {/* 4. Feedback & Feature Suggestion Box for Site Owners (وحط خانة ملاحظة يقدر يسال ان لو عنده اقتراح لنا او ميزة) */}
      <div className="px-5 mt-4">
        <SiteFeedbackCard
          language={language}
          userId={userProfile.id}
          username={userProfile.username}
          onFeedbackSubmitted={onFeedbackSubmitted}
        />
      </div>

      {/* 5. Personality Fingerprint Breakdown with 3D Tactile Cards */}
      <div className="px-5 mt-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#778078] uppercase tracking-wider px-1">
          <span>{language === 'ar' ? 'سماتك وأبعاد شخصيتك' : 'Your Personality Attributes'}</span>
        </div>

        {allDisplayQuestions.map((question) => {
          const ans = userProfile.answers[question.id];
          if (!ans || (Array.isArray(ans) && ans.length === 0)) return null;

          const displayVal = Array.isArray(ans)
            ? ans
                .map((id) => resolveCatalogOptionLabel(question.id, id, language))
                .filter(Boolean)
                .join(' • ')
            : resolveCatalogOptionLabel(question.id, String(ans), language);

          return (
            <div key={question.id} className="relative group select-none py-0.5">
              {/* Ambient decoupled shadow */}
              <div className="absolute inset-x-3 bottom-0 h-3 rounded-2xl bg-black/10 dark:bg-black/35 blur-md pointer-events-none" />

              <div
                className="
                  luxury-card-shimmer
                  relative p-4 rounded-2xl
                  bg-gradient-to-b from-white via-[#FAF8F2] to-[#EFEAD9]
                  dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713]
                  border border-[#0B5D3B]/20 dark:border-[#10B981]/25
                  shadow-[0_6px_0_0_#BFD5C8,0_14px_24px_-4px_rgba(11,93,59,0.16)]
                  dark:shadow-[0_6px_0_0_#07120C,0_14px_28px_rgba(0,0,0,0.65)]
                  flex items-center justify-between gap-3
                  overflow-hidden
                "
              >
                {/* Top specular highlight sheen */}
                <div className="absolute inset-x-2 top-0.5 h-[38%] rounded-xl bg-gradient-to-b from-white/90 via-white/20 to-transparent dark:from-white/10 dark:via-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#F8F7F2] dark:bg-[#111813] shadow-xs flex items-center justify-center shrink-0">
                    <RealisticIcon name={question.options[0]?.iconKey || 'coffee'} size={28} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#778078] block truncate">
                      {language === 'ar' ? question.titleAr : question.titleEn}
                    </span>
                    <span className="text-xs font-bold text-[#0B5D3B] dark:text-[#DDF3E7] truncate block">
                      {displayVal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

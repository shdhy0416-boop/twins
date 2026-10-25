import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile, MatchProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrganicFloatingCard } from '../common/OrganicFloatingCard';
import { FloatingMatchCard } from '../common/FloatingMatchCard';
import { VibeCheckCard } from './VibeCheckCard';
import { formatCity } from '../../utils/localization';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { getCatalogQuestionById } from '../../services/questionCatalogService';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Heart,
  Eye,
} from 'lucide-react';

interface HomeScreenProps {
  userProfile: UserProfile;
  topMatches: MatchProfile[];
  language: Language;
  onFindTwin: () => void;
  onViewMatches: () => void;
  onEditProfile: () => void;
  onSelectMatch: (match: MatchProfile) => void;
  savedProfileIds?: string[];
  onToggleSave?: (matchId: string) => void;
  onOpenSaved?: () => void;
  onExploreDiscover?: () => void;
  onShareVibe?: (question: string, answer: string) => void;
  onOpenNearbyModal?: () => void;
  onOpenFeedbackModal?: () => void;
}

const SHORT_CATEGORY_NAMES: Record<string, { ar: string; en: string }> = {
  q_coffee: { ar: 'طقس القهوة المختصة', en: 'Specialty Coffee Ritual' },
  q_food: { ar: 'المأكولات المفضلة', en: 'Favorite Dining' },
  q_sports: { ar: 'الحماس الرياضي والبادل', en: 'Padel & Active Sports' },
  q_lifestyle: { ar: 'الطابع والروتين اليومي', en: 'Daily Rhythm & Vibe' },
  q_vibe: { ar: 'طاقة التواصل الاجتماعي', en: 'Social Connection Energy' },
  q_cars: { ar: 'ذوق السيارات الفاخرة', en: 'Automotive Style' },
  q_places: { ar: 'الأماكن المفضلة بالمدينة', en: 'Favorite City Spots' },
  q_travel: { ar: 'أسلوب السفر والرحلات', en: 'Travel & Getaways' },
  q_leisure: { ar: 'طلعة الويكند المثالية', en: 'Weekend Outings' },
  q_apps: { ar: 'التطبيق الأكثر استخداماً', en: 'Favorite Daily App' },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  topMatches,
  language,
  onFindTwin,
  onViewMatches,
  onSelectMatch,
  savedProfileIds = [],
  onToggleSave,
  onExploreDiscover,
  onShareVibe,
  onOpenNearbyModal,
  onOpenFeedbackModal,
}) => {
  const t = TRANSLATIONS[language];
  const [curiositySlide, setCuriositySlide] = useState(0);
  const [isCuriosityExpanded, setIsCuriosityExpanded] = useState(false);
  const { glowPos, handleTouchMove, handleTouchEnd } = useTouchGlow({ haptic: true });

  const hour = new Date().getHours();
  const greeting = hour > 16 || hour < 4 ? t.greetingEvening : t.greetingDay;

  // Compute real shared categories across top matches for interactive curiosity reveal
  const sharedHighlightsList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of topMatches) {
      for (const qid of match.sharedInterests || []) {
        counts.set(qid, (counts.get(qid) || 0) + 1);
      }
    }
    const sortedIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([qid]) => qid);

    const effectiveIds =
      sortedIds.length >= 3
        ? sortedIds
        : ['q_coffee', 'q_sports', 'q_food', 'q_lifestyle', 'q_places'];

    return effectiveIds.slice(0, 4).map((qid) => {
      const preset = SHORT_CATEGORY_NAMES[qid];
      if (preset) {
        return language === 'ar' ? preset.ar : preset.en;
      }
      const catQ = getCatalogQuestionById(qid);
      return catQ
        ? language === 'ar'
          ? catQ.titleAr
          : catQ.titleEn
        : language === 'ar'
        ? 'اهتمامات يومية مشتركة'
        : 'Shared Daily Interests';
    });
  }, [topMatches, language]);

  const matchedPeopleDisplayCount = Math.max(10, topMatches.length * 2);

  const curiosityTeasers = useMemo(
    () =>
      language === 'ar'
        ? [
            `أنت وأكثر من ${matchedPeopleDisplayCount} من أقرب المتطابقين معك تشتركون في حب أشياء كثيرة.`,
            `تشتركون في ${sharedHighlightsList[0]} و${sharedHighlightsList[1]} وتفاصيل أخرى مفاجئة.. من الأقرب لك؟`,
            `هناك قواسم ذوقية دقيقة تجمعك مع شبيهك الأول — اضغط الآن لكشف الأشياء المشتركة بينكم!`,
          ]
        : [
            `You and ${matchedPeopleDisplayCount}+ of your closest matches share a love for so many things.`,
            `You align on ${sharedHighlightsList[0]}, ${sharedHighlightsList[1]}, and surprising daily details — guess who's #1?`,
            `Hidden taste overlaps connect you with your top twin — tap now to uncover what you share!`,
          ],
    [language, matchedPeopleDisplayCount, sharedHighlightsList]
  );

  useEffect(() => {
    if (isCuriosityExpanded) return;
    const interval = window.setInterval(() => {
      setCuriositySlide((prev) => (prev + 1) % curiosityTeasers.length);
    }, 3800);
    return () => window.clearInterval(interval);
  }, [curiosityTeasers.length, isCuriosityExpanded]);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-24 transition-colors">
      {/* Main Content Feed */}
      <main className="px-5 pt-3 space-y-4">
        {/* User Greeting & City */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-[#778078] block">
              {greeting}
            </span>
            <h1 className="text-xl font-black tracking-tight text-[#202923] dark:text-white">
              <span dir="ltr" className="inline-block font-bold">
                @{userProfile.username}
              </span>
            </h1>
          </div>

          {/* Interactive City Pill Button */}
          <button
            type="button"
            onClick={onOpenNearbyModal}
            className="flex items-center gap-1.5 text-xs text-[#0B5D3B] dark:text-[#DDF3E7] font-bold bg-gradient-to-b from-[#DDF3E7] to-[#CCEEDC] dark:from-[#0B5D3B]/30 dark:to-[#08422A]/40 px-3.5 py-1.5 rounded-full border border-white/60 dark:border-[#0B5D3B]/30 shadow-[0_3px_0_0_#B6E0C9,0_6px_10px_rgba(11,93,59,0.12)] active:translate-y-0.5 cursor-pointer hover:scale-105 transition-all select-none"
            title={
              language === 'ar'
                ? 'اضغط لمعرفة من موجود في منطقتك'
                : 'Click to see who is nearby in this region'
            }
          >
            <MapPin size={13} className="text-[#0B5D3B]" />
            <span>{formatCity(userProfile.city, language)}</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* HERO FEATURE: Personality Fingerprint + Curiosity Shared Card  */}
        {/* ============================================================== */}
        <OrganicFloatingCard
          className="p-5 border border-[#0B5D3B]/25"
          glowColor="rgba(212, 175, 55, 0.18)"
        >
          {/* Top Row: Fingerprint & Status */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#D4AF37]" />
                <h2 className="text-sm font-black text-[#202923] dark:text-white">
                  {t.myFingerprint}
                </h2>
              </div>
              <p className="text-xs font-bold text-[#778078] dark:text-slate-400 mt-0.5">
                {t.fingerprintSubtitle}
              </p>
            </div>

            {/* Profile ready badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-black text-white bg-[#0B5D3B] dark:bg-[#10B981] dark:text-[#062618] px-3.5 py-1 rounded-full shadow-sm border border-[#168858] dark:border-[#34D399] shrink-0">
              <CheckCircle2
                size={13}
                strokeWidth={3}
                className="text-[#D4AF37] dark:text-[#062618]"
              />
              <span className="tracking-wide">{t.profileComplete}</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* INTERACTIVE BOLD CURIOSITY SHARED-INTERESTS CARD               */}
          {/* Replaces the old 4-sparkle dimension tiles with kinetic card   */}
          {/* ============================================================== */}
          <div className="my-3.5">
            <div
              role="button"
              tabIndex={0}
              data-custom-glow="true"
              aria-expanded={isCuriosityExpanded}
              onClick={() => setIsCuriosityExpanded((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCuriosityExpanded((prev) => !prev);
                }
              }}
              onTouchStart={handleTouchMove}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseMove={handleTouchMove}
              onMouseLeave={handleTouchEnd}
              className="
                relative w-full p-4 rounded-[26px]
                bg-gradient-to-r from-[#D5F1E2] via-[#F2FBF6] to-[#D5F1E2]
                dark:from-[#0E3925] dark:via-[#16271F] dark:to-[#0E3925]
                border-2 border-[#9FD5B8] dark:border-[#10B981]/35
                shadow-[0_8px_24px_rgba(11,93,59,0.12)]
                dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                hover:border-[#0B5D3B]/45 dark:hover:border-[#34D399]/60
                active:scale-[0.99]
                transition-all duration-200 cursor-pointer overflow-hidden select-none group
              "
            >
              {/* Specular Curiosity Shimmer Sweep */}
              <div className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/65 dark:via-white/12 to-transparent animate-curiosity-shimmer" />

              {/* Touch / Pointer Dynamic Glow */}
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-[26px]"
                style={{
                  opacity: glowPos.active ? 1 : 0,
                  background: `radial-gradient(200px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.28), rgba(212, 175, 55, 0.16), transparent 72%)`,
                }}
              />

              <div className="relative z-10 flex items-center justify-between gap-3">
                {/* Start Cluster (Right in RTL): White Rounded Heart Box + Bold Kinetic Copy */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* White Rounded Square with Beating Solid Emerald Heart */}
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#101914] border border-[#CDE9DA] dark:border-[#10B981]/30 shadow-sm flex items-center justify-center shrink-0">
                    <Heart
                      size={22}
                      className="fill-[#0B5D3B] text-[#0B5D3B] dark:fill-[#34D399] dark:text-[#34D399] animate-curiosity-heartbeat"
                    />
                  </div>

                  {/* Bold Title + Animated Curiosity Copy */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-[15px] font-black text-[#0B5D3B] dark:text-[#34D399] tracking-tight">
                        {t.sharedHighlights}
                      </h3>
                    </div>

                    <p
                      key={curiositySlide}
                      className="text-[13px] sm:text-sm font-black text-[#18241D] dark:text-white mt-1 leading-relaxed animate-fade-in"
                    >
                      {curiosityTeasers[curiositySlide]}
                    </p>

                    {/* Interactive Slide Dots + Curiosity Prompt */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0B5D3B] dark:text-[#6EE7B7]">
                        <Eye size={12} className="shrink-0" />
                        <span>
                          {isCuriosityExpanded
                            ? language === 'ar'
                              ? 'إخفاء اللمحة السريعة'
                              : 'Hide quick peek'
                            : language === 'ar'
                            ? 'اضغط لتكتشف ما يجمعكم!'
                            : 'Tap to peek at what you share!'}
                        </span>
                      </span>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {curiosityTeasers.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCuriositySlide(idx)}
                            aria-label={
                              language === 'ar'
                                ? `عرض اللمحة ${idx + 1}`
                                : `Show teaser ${idx + 1}`
                            }
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              curiositySlide === idx
                                ? 'w-4 bg-[#0B5D3B] dark:bg-[#34D399]'
                                : 'w-1.5 bg-[#0B5D3B]/30 dark:bg-white/25'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* End Arrow Button (Left in RTL) -> Direct jump to Matches */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMatches();
                  }}
                  aria-label={t.viewAllMatches}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-[#111B15]/80 hover:bg-white dark:hover:bg-[#18261E] border border-[#B7E1CA] dark:border-[#10B981]/30 flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399] shadow-2xs shrink-0 transition-transform group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5 active:scale-95 cursor-pointer"
                >
                  {language === 'ar' ? (
                    <ArrowLeft size={18} strokeWidth={2.5} />
                  ) : (
                    <ArrowRight size={18} strokeWidth={2.5} />
                  )}
                </button>
              </div>

              {/* Interactive Curiosity Expanded Drawer */}
              {isCuriosityExpanded && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative z-10 mt-3.5 pt-3 border-t border-[#0B5D3B]/15 dark:border-white/10 animate-fade-in"
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {sharedHighlightsList.map((label, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-white/95 dark:bg-[#101914] border border-[#9FD0B7] dark:border-[#246347] text-[11px] font-black text-[#084D30] dark:text-[#6EE7B7] shadow-2xs"
                      >
                        {label}
                      </span>
                    ))}
                    <span className="px-2 py-1 text-[11px] font-black text-[#0B5D3B] dark:text-[#34D399]">
                      {language === 'ar' ? '+6 أشياء أخرى..' : '+6 more..'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onViewMatches}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#0B5D3B] hover:bg-[#08462C] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>
                      {language === 'ar'
                        ? `اكشف هويات الـ +${matchedPeopleDisplayCount} المتطابقين معك الآن`
                        : `Reveal your ${matchedPeopleDisplayCount}+ matching twins now`}
                    </span>
                    {language === 'ar' ? (
                      <ArrowLeft size={15} />
                    ) : (
                      <ArrowRight size={15} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GRAND 3D TACTILE SKEUOMORPHIC "FIND MY TWIN" ACTION BUTTON */}
          <div className="relative group w-full pt-1 z-30">
            <div className="absolute inset-x-6 bottom-1 h-5 rounded-full bg-[#0B5D3B]/50 dark:bg-[#10B981]/30 blur-lg pointer-events-none transition-all group-hover:scale-105 group-hover:opacity-100" />

            <button
              type="button"
              id="find-twin-primary-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate([35, 45]);
                  }
                } catch {
                  // ignore
                }
                onFindTwin();
              }}
              className="
                relative z-30 w-full h-15 rounded-2xl
                bg-gradient-to-b from-[#168858] via-[#0B5D3B] to-[#073D26]
                dark:from-[#199863] dark:via-[#0E6D46] dark:to-[#073D26]
                text-white font-black text-base tracking-wide
                flex items-center justify-center gap-3
                border-2 border-[#29B076]/70 dark:border-[#34D399]/60
                shadow-[0_8px_0_0_#052E1C,0_18px_26px_rgba(11,93,59,0.45)]
                dark:shadow-[0_8px_0_0_#031E12,0_18px_28px_rgba(16,185,129,0.3)]
                hover:brightness-105
                active:translate-y-2 active:shadow-[0_0px_0_0_#052E1C,0_4px_10px_rgba(11,93,59,0.25)]
                active:scale-[0.985]
                transition-all duration-100 cursor-pointer overflow-hidden select-none
              "
              aria-label={t.findTwinCTA}
            >
              {/* Top specular glossy highlight sheen */}
              <div className="absolute inset-x-3 top-1 h-[42%] rounded-xl bg-gradient-to-b from-white/55 via-white/15 to-transparent pointer-events-none" />

              <Sparkles size={20} className="text-[#D4AF37] relative z-10" />
              <span className="relative z-10 drop-shadow-xs">{t.findTwinCTA}</span>
              {language === 'ar' ? (
                <ArrowLeft size={18} className="text-white relative z-10" />
              ) : (
                <ArrowRight size={18} className="text-white relative z-10" />
              )}
            </button>
          </div>

          <span className="block text-center text-[11px] font-bold text-[#778078] dark:text-slate-400 mt-2.5">
            {t.findTwinSub}
          </span>
        </OrganicFloatingCard>

        {/* ============================================================== */}
        {/* TOP MATCHES CAROUSEL WITH ORGANIC FLOATING CARDS & BOOKMARKS   */}
        {/* ============================================================== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-[#202923] dark:text-white">
              {t.topMatchesTitle}
            </h3>
            <button
              type="button"
              onClick={onViewMatches}
              className="text-xs font-bold text-[#0B5D3B] dark:text-[#DDF3E7] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t.viewAllMatches}</span>
              {language === 'ar' ? (
                <ArrowLeft size={12} />
              ) : (
                <ArrowRight size={12} />
              )}
            </button>
          </div>

          <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-2 px-1">
            {topMatches.map((m, idx) => (
              <FloatingMatchCard
                key={m.id}
                match={m}
                language={language}
                index={idx}
                onClick={() => onSelectMatch(m)}
                isSaved={savedProfileIds.includes(m.id)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* DAILY VIBE CHECK                                               */}
        {/* ============================================================== */}
        <VibeCheckCard
          language={language}
          userId={userProfile.id}
          topMatches={topMatches}
          onExploreDiscover={onExploreDiscover}
          onShareVibe={onShareVibe}
        />

        {/* ============================================================== */}
        {/* SUGGESTION / FEATURE REQUEST BOX FOR SITE OWNERS               */}
        {/* ============================================================== */}
        {onOpenFeedbackModal && (
          <button
            type="button"
            onClick={onOpenFeedbackModal}
            className="
              w-full p-4 rounded-2xl
              bg-gradient-to-r from-amber-50 via-white to-emerald-50
              dark:from-[#211E14] dark:via-[#18221C] dark:to-[#14231A]
              border border-[#D4AF37]/35 dark:border-[#D4AF37]/25
              shadow-[0_4px_0_0_#D5C69E,0_8px_14px_rgba(212,175,55,0.08)]
              dark:shadow-[0_4px_0_0_#0F0E0A]
              active:translate-y-0.5 active:shadow-[0_1px_0_0_#D5C69E]
              flex items-center justify-between text-start
              transition-all cursor-pointer select-none group
            "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-lg shrink-0 group-hover:scale-110 transition-transform">
                💡
              </div>
              <div>
                <span className="text-xs font-black text-[#202923] dark:text-white block">
                  {language === 'ar'
                    ? 'عندك اقتراح أو ميزة نضيفها؟'
                    : 'Have a feature idea or suggestion?'}
                </span>
                <span className="text-[10px] text-[#778078] dark:text-slate-400 block mt-0.5">
                  {language === 'ar'
                    ? 'تواصل مباشرة مع ملاك الموقع واطلب أي ميزة أو فكرة تريدها!'
                    : 'Message the site owners directly to suggest anything!'}
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#0B5D3B] text-white text-[10px] font-bold shrink-0 shadow-2xs">
              {language === 'ar' ? 'شاركنا فكرتك' : 'Send'}
            </div>
          </button>
        )}
      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Language, SiteFeedbackItem } from '../../types';
import {
  loadUserFeedbackItems,
  submitUserFeedbackItem,
} from '../../services/profileService';
import { getActiveSessionUserId } from '../../services/authService';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { playClickPop } from '../../utils/soundEffects';
import {
  MessageSquarePlus,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Shirt,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SiteFeedbackCardProps {
  language: Language;
  userId?: string;
  username?: string;
  onFeedbackSubmitted?: (item: SiteFeedbackItem) => void;
}

export const SiteFeedbackCard: React.FC<SiteFeedbackCardProps> = ({
  language,
  userId,
  username,
  onFeedbackSubmitted,
}) => {
  const effectiveUserId = userId || getActiveSessionUserId();
  const isAr = language === 'ar';
  const [category, setCategory] = useState<SiteFeedbackItem['category']>('feature');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastSuggestions, setPastSuggestions] = useState<SiteFeedbackItem[]>(() =>
    loadUserFeedbackItems(effectiveUserId)
  );
  const { glowPos, handleTouchMove, handleTouchEnd } = useTouchGlow({ haptic: true });

  useEffect(() => {
    setPastSuggestions(loadUserFeedbackItems(effectiveUserId));
  }, [effectiveUserId]);

  const categories: {
    id: SiteFeedbackItem['category'];
    labelEn: string;
    labelAr: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'feature',
      labelEn: 'New Feature Idea',
      labelAr: 'فكرة ميزة جديدة',
      icon: <Lightbulb size={15} />,
    },
    {
      id: 'avatar',
      labelEn: 'Avatar & Style',
      labelAr: 'إضافة أزياء أو أفاتار',
      icon: <Shirt size={15} />,
    },
    {
      id: 'question',
      labelEn: 'Vibe Check Question',
      labelAr: 'اقتراح سؤال مزاج',
      icon: <HelpCircle size={15} />,
    },
    {
      id: 'general',
      labelEn: 'General Note',
      labelAr: 'ملاحظة عامة للإدارة',
      icon: <MessageSquarePlus size={15} />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) return;

    playClickPop();

    const newItem: SiteFeedbackItem = {
      id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: effectiveUserId,
      accountMode: 'demo',
      category,
      message: message.trim(),
      contact: username ? `@${username}` : undefined,
      createdAt: Date.now(),
      status: 'pending',
    };

    const updated = await submitUserFeedbackItem(effectiveUserId, newItem);
    setPastSuggestions(updated);

    try {
      confetti({
        particleCount: 38,
        spread: 62,
        origin: { y: 0.72 },
        colors: ['#0B5D3B', '#10B981', '#D4AF37'],
      });
    } catch {
      // ignore
    }

    onFeedbackSubmitted?.(newItem);
    setMessage('');
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
    }, 4500);
  };

  return (
    /* Outer Sculpted Shadow Frame / Pedestal Bezel (برواز ظل فخم مع توهج متحرك من اليمين لليسار) */
    <div
      data-custom-glow="true"
      data-luxury-bezel="true"
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleTouchMove}
      onMouseLeave={handleTouchEnd}
      className="
        relative rounded-[30px] p-[2.5px] overflow-hidden
        bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
        dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
        shadow-[0_11px_0_0_#BFD5C8,0_24px_48px_-6px_rgba(11,93,59,0.28),0_8px_22px_rgba(212,175,55,0.20)]
        dark:shadow-[0_11px_0_0_#07120C,0_26px_54px_rgba(0,0,0,0.82),0_0_34px_rgba(16,185,129,0.20)]
        transition-shadow duration-300
      "
    >
      {/* Layer 1: Luminous Right-to-Left Sweeping Bezel Rim Glow (توهج البرواز من اليمين لليسار) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -inset-x-6 z-0 animate-rtl-bezel-glow"
        style={{
          background:
            'linear-gradient(270deg, transparent 0%, rgba(16,185,129,0.85) 35%, rgba(250,204,21,0.98) 50%, rgba(16,185,129,0.85) 65%, transparent 100%)',
        }}
      />

      {/* Inner Luxury Card Surface */}
      <div className="relative z-10 rounded-[27.5px] overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9] dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713] p-5">
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
              'linear-gradient(270deg, transparent 10%, rgba(16,185,129,0.09) 42%, rgba(212,175,55,0.16) 52%, rgba(16,185,129,0.07) 64%, transparent 90%)',
          }}
        />

        {/* Interactive Pointer / Finger Touch Halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-400 ease-out z-0"
          style={{
            opacity: glowPos.active ? 1 : 0,
            background: `radial-gradient(240px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.24), rgba(212, 175, 55, 0.16), transparent 70%)`,
          }}
        />

        {/* Specular Top Sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0.5 h-[24%] rounded-t-2xl bg-gradient-to-b from-white/80 via-white/15 to-transparent dark:from-white/10 dark:via-transparent z-0"
        />

        {/* Content Wrapper */}
        <div className="relative z-10">
          {/* 1. Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E5DEC9] dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0B5D3B] via-[#128052] to-[#D4AF37] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(11,93,59,0.28)] shrink-0">
                <MessageSquarePlus size={19} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-[#142019] dark:text-white leading-snug">
                  {isAr ? 'صندوق اقتراحات وملاحظات لملاك الموقع' : 'Feedback & Ideas for Site Owners'}
                </h3>
                <span className="text-xs font-bold text-[#55625A] dark:text-slate-300 block leading-snug mt-0.5">
                  {isAr
                    ? 'شاركنا أي فكرة أو ميزة ترغب بإضافتها — ملاك الموقع يقرأون كل اقتراح باهتمام!'
                    : 'Suggest any feature or improvement directly to the founders & site owners'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Success Banner */}
          {isSubmitted && (
            <div className="my-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#DDF3E7] to-[#FFF6DA] dark:from-[#0B5D3B]/45 dark:to-[#292211] border border-[#0B5D3B]/35 dark:border-[#34D399]/40 text-[#0B5D3B] dark:text-[#6EE7B7] text-xs font-black flex items-center gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 size={18} className="shrink-0 text-[#0B5D3B] dark:text-[#34D399]" />
              <span>
                {isAr
                  ? 'شكراً لك! وصل اقتراحك بنجاح إلى ملاك ومطوري الموقع وهو قيد المراجعة والاهتمام ✨'
                  : 'Thank you! Your feedback has been received by the site owners and is under review ✨'}
              </span>
            </div>
          )}

          {/* 3. Form */}
          <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
            {/* Luxury Tactile Category Selector Buttons */}
            <div>
              <label className="text-xs font-extrabold text-[#4D5A52] dark:text-slate-300 block mb-2">
                {isAr ? 'تصنيف الاقتراح أو الملاحظة' : 'Suggestion Category'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => {
                  const isSelected = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playClickPop();
                        setCategory(c.id);
                      }}
                      className={`
                        min-h-[44px] px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-2
                        transition-all duration-150 cursor-pointer overflow-hidden
                        ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#148354] via-[#0B5D3B] to-[#073D26] text-white border border-[#D4AF37]/85 shadow-[0_3px_0_0_#042818,0_8px_18px_rgba(11,93,59,0.30)] active:translate-y-0.5'
                            : 'bg-gradient-to-b from-white via-[#FBF9F4] to-[#EFEAE0] dark:from-[#212D25] dark:via-[#19231C] dark:to-[#131B16] text-[#26332B] dark:text-slate-200 border border-[#DCD4C3] dark:border-slate-700/80 shadow-[0_3px_0_0_#D5CCBA] dark:shadow-[0_3px_0_0_#0A100D] hover:border-[#0B5D3B]/45 active:bg-gradient-to-b active:from-[#0F6E46] active:to-[#08452B] active:text-white active:border-[#D4AF37] active:translate-y-0.5'
                        }
                      `}
                    >
                      <span
                        className={`shrink-0 transition-colors ${
                          isSelected ? 'text-[#FDE68A]' : 'text-[#0B5D3B] dark:text-[#34D399]'
                        }`}
                      >
                        {c.icon}
                      </span>
                      <span className="truncate">{isAr ? c.labelAr : c.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="text-xs font-extrabold text-[#4D5A52] dark:text-slate-300 block mb-1.5">
                {isAr ? 'نص الاقتراح أو الفكرة' : 'Your Suggestion or Feature Request'}
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب اقتراحك بالتفصيل هنا... مثل: ميزة جديدة في التطابق، أزياء للأفاتار، سؤال مزاج...'
                    : 'Write your suggestion here... e.g. a new matching mechanic, new avatar outfit, daily question...'
                }
                className="w-full rounded-2xl p-3.5 text-xs sm:text-sm font-bold bg-white dark:bg-[#131B16] border-2 border-[#DFD7C6] dark:border-slate-800 text-[#18221C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B5D3B]/50 transition-all resize-none shadow-inner"
                maxLength={600}
              />
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5C665F] dark:text-slate-400 px-1 mt-1">
                <span>{isAr ? 'نقرأ كل فكرة بعناية' : 'We review every submission'}</span>
                <span className="tabular-nums font-extrabold">{message.length} / 600</span>
              </div>
            </div>

            {/* Automatic Registered Account Attribution */}
            {username && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F4F9F6] dark:bg-[#131C17] border border-[#CCE4D6] dark:border-[#1E382A] text-xs font-bold text-[#4A5850] dark:text-slate-300">
                <CheckCircle2 size={15} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                <span>
                  {isAr ? (
                    <>
                      يتم إرسال الاقتراح مباشرة عبر حسابك الموثق{' '}
                      <span dir="ltr" className="font-black text-[#0B5D3B] dark:text-[#6EE7B7]">
                        @{username}
                      </span>
                    </>
                  ) : (
                    <>
                      Feedback submitted from your verified account{' '}
                      <span dir="ltr" className="font-black text-[#0B5D3B] dark:text-[#6EE7B7]">
                        @{username}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Luxury 3D Royal Emerald-Gold Submit CTA */}
            <button
              type="submit"
              disabled={!message.trim() || message.trim().length < 5}
              className="
                relative w-full min-h-[48px] rounded-2xl
                bg-gradient-to-r from-[#0B5D3B] via-[#138253] to-[#0B5D3B]
                hover:from-[#0E6D45] hover:via-[#169660] hover:to-[#B88917]
                active:from-[#D4AF37] active:via-[#127C4F] active:to-[#08452B]
                disabled:opacity-50 disabled:pointer-events-none
                text-white text-sm font-black
                border border-[#D4AF37]/75
                shadow-[0_5px_0_0_#052E1C,0_10px_22px_rgba(11,93,59,0.32)]
                active:translate-y-1 active:shadow-[0_1px_0_0_#052E1C,0_0_24px_rgba(212,175,55,0.45)]
                flex items-center justify-center gap-2 cursor-pointer
                transition-all duration-150 overflow-hidden
              "
            >
              <div className="absolute inset-x-3 top-0.5 h-[38%] rounded-xl bg-gradient-to-b from-white/55 via-white/10 to-transparent pointer-events-none" />
              <Send size={16} className="relative z-10 text-[#FDE68A]" />
              <span className="relative z-10 whitespace-nowrap">
                {isAr ? 'إرسال الاقتراح لملاك الموقع' : 'Submit Feedback to Site Owners'}
              </span>
            </button>
          </form>

          {/* 4. Past Suggestions Drawer (if any) */}
          {pastSuggestions.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-[#E5DEC9] dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  playClickPop();
                  setShowHistory(!showHistory);
                }}
                className="w-full min-h-[38px] flex items-center justify-between text-xs font-extrabold text-[#4D5A52] dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Clock size={14} />
                  {isAr
                    ? `اقتراحاتك السابقة (${pastSuggestions.length})`
                    : `Your past suggestions (${pastSuggestions.length})`}
                </span>
                {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showHistory && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto no-scrollbar animate-fade-in pr-0.5">
                  {pastSuggestions.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white/85 dark:bg-[#141D17] border border-[#DDD4C2] dark:border-slate-800 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-[#647067] dark:text-slate-400">
                        <span className="capitalize">{item.category}</span>
                        <span className="text-[#0B5D3B] dark:text-[#34D399] flex items-center gap-1">
                          <Sparkles size={10} />
                          {isAr ? 'قيد المراجعة من المطورين' : 'Under Review by Owners'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#1C2620] dark:text-slate-200 leading-snug">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

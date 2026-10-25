import React, { useMemo, useState } from 'react';
import { Language, Question, QuestionCategory } from '../../types';
import { buildPreviewQuestionsForCategoryDraft } from '../../services/questionCatalogService';
import { InteractiveOnboarding } from '../onboarding/InteractiveOnboarding';
import { RealisticIcon } from '../common/RealisticIcon';
import { X, Eye, RotateCcw, CheckCircle2, Globe } from 'lucide-react';

interface AdminCategoryPreviewModalProps {
  isOpen: boolean;
  category: QuestionCategory;
  questions: Question[];
  initialLanguage: Language;
  onClose: () => void;
}

export const AdminCategoryPreviewModal: React.FC<AdminCategoryPreviewModalProps> = ({
  isOpen,
  category,
  questions,
  initialLanguage,
  onClose,
}) => {
  const [previewLang, setPreviewLang] = useState<Language>(initialLanguage);
  const [previewSessionKey, setPreviewSessionKey] = useState(0);
  const [completedPreviewAnswers, setCompletedPreviewAnswers] = useState<
    Record<string, string | string[]> | null
  >(null);

  const isAr = previewLang === 'ar';

  const playableQuestions = useMemo(
    () =>
      buildPreviewQuestionsForCategoryDraft({
        category,
        questions,
      }),
    [category, questions]
  );

  if (!isOpen) return null;

  const totalDraftQuestions = questions.length;
  const disabledQuestionsCount = questions.filter((q) => q.isEnabled === false).length;
  const totalOptionsCount = questions.reduce((s, q) => s + q.options.length, 0);
  const enabledOptionsCount = questions.reduce(
    (s, q) => s + q.options.filter((o) => o.isEnabled !== false).length,
    0
  );

  const handleResetPreview = () => {
    setCompletedPreviewAnswers(null);
    setPreviewSessionKey((k) => k + 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'معاينة الفئة كما يراها المستخدم' : 'Category User Experience Preview'}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] bg-[#FAF9F5] dark:bg-[#121A15] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Modal Header */}
        <header className="px-5 py-4 bg-white dark:bg-[#162019] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EEF8F2] dark:bg-[#0B5D3B]/30 border border-[#0B5D3B]/20 flex items-center justify-center shrink-0">
              <Eye size={18} className="text-[#0B5D3B] dark:text-[#34D399]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
                <span>{isAr ? 'معاينة حية لواجهة المستخدم' : 'LIVE USER ONBOARDING PREVIEW'}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span dir="ltr">{category.id}</span>
              </div>
              <h3 className="text-base font-extrabold text-[#202923] dark:text-white truncate">
                {isAr ? category.nameAr || category.nameEn : category.nameEn || category.nameAr}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Switch Preview Language */}
            <button
              type="button"
              onClick={() => setPreviewLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
              className="h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-white inline-flex items-center gap-1.5 hover:border-[#0B5D3B] transition-colors cursor-pointer"
            >
              <Globe size={14} className="text-[#0B5D3B] dark:text-[#34D399]" />
              <span>{isAr ? 'Preview in English' : 'المعاينة بالعربية'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetPreview}
              className="h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-white inline-flex items-center gap-1.5 hover:border-[#0B5D3B] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>{isAr ? 'إعادة التجربة' : 'Restart'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق المعاينة' : 'Close preview'}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Preview Content Split: Category Context + Authentic Mobile User Screen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Summary Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/70 dark:border-slate-800 flex items-center justify-center shrink-0">
                  <RealisticIcon iconKey={category.iconKey} size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-[#202923] dark:text-white truncate">
                    {isAr ? category.nameAr : category.nameEn}
                  </div>
                  <div className="text-xs text-[#778078] dark:text-slate-400">
                    {category.isEnabled
                      ? isAr
                        ? 'الفئة مفعّلة للمستخدمين'
                        : 'Category enabled for users'
                      : isAr
                      ? 'الفئة معطّلة (مخفية من الاستبيان الجديد)'
                      : 'Category disabled (hidden from new sessions)'}
                  </div>
                </div>
              </div>

              {(category.descriptionAr || category.descriptionEn) && (
                <p className="text-xs text-[#5C665E] dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isAr
                    ? category.descriptionAr || category.descriptionEn
                    : category.descriptionEn || category.descriptionAr}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums space-y-1">
                <div>
                  {isAr ? 'الأسئلة المعروضة للمستخدم:' : 'Visible user questions:'}{' '}
                  <strong className="text-[#202923] dark:text-white">
                    {playableQuestions.length} / {totalDraftQuestions}
                  </strong>
                </div>
                {disabledQuestionsCount > 0 && (
                  <div>
                    {isAr ? 'أسئلة معطّلة مخفية:' : 'Disabled questions hidden:'}{' '}
                    <strong className="text-[#B45309] dark:text-[#FBBF24]">
                      {disabledQuestionsCount}
                    </strong>
                  </div>
                )}
                <div>
                  {isAr ? 'الخيارات المفعّلة:' : 'Enabled answer options:'}{' '}
                  <strong className="text-[#202923] dark:text-white">
                    {enabledOptionsCount} / {totalOptionsCount}
                  </strong>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EEF8F2] dark:bg-[#13251B] border border-[#0B5D3B]/20 dark:border-[#10B981]/25 text-xs text-[#08422A] dark:text-[#DDF3E7] leading-relaxed">
              {isAr
                ? 'تعرض شاشة الهاتف المقابلة المسودة الحالية لهذه الفئة تماماً بنفس بطاقات اللمس المتوهجة وأبعاد الاستبيان الفعلية للمستخدم، دون تعديل أي بيانات مستخدم حقيقية أثناء التجربة.'
                : 'The interactive phone viewport renders your current draft using the exact TWIN onboarding component, 84px tactile cards, and single/multi-select rules without modifying any stored user answers.'}
            </div>
          </div>

          {/* Right Authentic User Onboarding Frame */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[420px] rounded-[32px] border-4 border-slate-800/90 dark:border-slate-700 bg-[#F8F7F2] dark:bg-[#111813] shadow-xl overflow-hidden">
              {completedPreviewAnswers ? (
                <div className="min-h-[560px] p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 text-[#0B5D3B] dark:text-[#34D399] flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="text-lg font-extrabold text-[#202923] dark:text-white">
                    {isAr
                      ? 'اكتملت معاينة أسئلة هذه الفئة بنجاح'
                      : 'Category Preview Completed'}
                  </h4>
                  <p className="text-xs text-[#778078] dark:text-slate-400 max-w-xs leading-relaxed">
                    {isAr
                      ? `قمت بتجربة ${Object.keys(completedPreviewAnswers).length} سؤال في هذه الفئة كما سيراها المستخدم تماماً.`
                      : `You stepped through ${Object.keys(completedPreviewAnswers).length} question(s) in this category exactly as users experience them.`}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPreview}
                    className="px-5 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>{isAr ? 'إعادة تجربة المعاينة' : 'Preview Again'}</span>
                  </button>
                </div>
              ) : (
                <InteractiveOnboarding
                  key={`${previewSessionKey}_${previewLang}`}
                  initialAnswers={{}}
                  language={previewLang}
                  questionsOverride={playableQuestions}
                  embeddedPreview={true}
                  onComplete={(ans) => setCompletedPreviewAnswers(ans)}
                  onExit={onClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

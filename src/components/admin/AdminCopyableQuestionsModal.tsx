import React, { useMemo, useState } from 'react';
import { Language } from '../../types';
import { CategoryPartition } from '../../services/contracts';
import { VIBE_QUESTIONS } from '../../data/vibeCheckData';
import { Copy, Check, X, FileText } from 'lucide-react';

interface AdminCopyableQuestionsModalProps {
  isOpen: boolean;
  partitions: CategoryPartition[];
  language: Language;
  onClose: () => void;
}

type CopyLangFilter = 'both' | 'ar' | 'en';
type CopyScopeFilter = 'all' | 'onboarding' | 'vibe';

function copyTextSafely(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopyText(text));
  }
  return Promise.resolve(fallbackCopyText(text));
}

function fallbackCopyText(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export const AdminCopyableQuestionsModal: React.FC<AdminCopyableQuestionsModalProps> = ({
  isOpen,
  partitions,
  language,
  onClose,
}) => {
  const isAr = language === 'ar';
  const [langFilter, setLangFilter] = useState<CopyLangFilter>('both');
  const [scopeFilter, setScopeFilter] = useState<CopyScopeFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formattedDocument = useMemo(() => {
    const sections: string[] = [];

    if (scopeFilter === 'all' || scopeFilter === 'onboarding') {
      if (langFilter === 'ar') {
        sections.push('=== أولاً: أسئلة الاستبيان الأساسي للتوافق (TWIN Core Questionnaire) ===');
      } else if (langFilter === 'en') {
        sections.push('=== PART 1: TWIN Core Compatibility Questionnaire ===');
      } else {
        sections.push(
          '=== أولاً: أسئلة الاستبيان الأساسي للتوافق | PART 1: Core Compatibility Questionnaire ==='
        );
      }

      let qCounter = 1;
      for (const part of partitions) {
        const cat = part.category;
        for (const q of part.questions) {
          const lines: string[] = [];
          const typeAr = q.isMultiSelect
            ? `اختيار حتى ${q.maxSelect || 3}`
            : 'اختيار واحد';
          const typeEn = q.isMultiSelect
            ? `Pick up to ${q.maxSelect || 3}`
            : 'Single choice';

          if (langFilter === 'ar') {
            lines.push(`${qCounter}. ${q.titleAr}`);
            if (q.subtitleAr) lines.push(`الوصف: ${q.subtitleAr}`);
            lines.push(`نوع السؤال: ${typeAr}`);
            q.options.forEach((opt, idx) => {
              const desc = opt.descriptionAr ? ` — ${opt.descriptionAr}` : '';
              lines.push(`${idx + 1}. ${opt.labelAr}${desc}`);
            });
          } else if (langFilter === 'en') {
            lines.push(`${qCounter}. [${cat.nameEn}] ${q.titleEn} (${typeEn})`);
            if (q.subtitleEn) lines.push(`   Subtitle: ${q.subtitleEn}`);
            q.options.forEach((opt, idx) => {
              const desc = opt.descriptionEn ? ` — ${opt.descriptionEn}` : '';
              lines.push(`   ${idx + 1}) ${opt.labelEn}${desc}`);
            });
          } else {
            lines.push(
              `${qCounter}. الفئة / Category: ${cat.nameAr} | ${cat.nameEn}`
            );
            lines.push(`   السؤال (AR): ${q.titleAr} (${typeAr})`);
            lines.push(`   Question (EN): ${q.titleEn} (${typeEn})`);
            if (q.subtitleAr || q.subtitleEn) {
              lines.push(
                `   الوصف / Subtitle: ${q.subtitleAr || '-'} | ${q.subtitleEn || '-'}`
              );
            }
            lines.push('   الخيارات / Options:');
            q.options.forEach((opt, idx) => {
              lines.push(`   ${idx + 1}) ${opt.labelAr}  |  ${opt.labelEn}`);
            });
          }

          sections.push(lines.join('\n'));
          qCounter += 1;
        }
      }
    }

    if (scopeFilter === 'all' || scopeFilter === 'vibe') {
      if (langFilter === 'ar') {
        sections.push('\n=== ثانياً: أسئلة نبض ومود اليوم التفاعلية (Daily Vibe Check) ===');
      } else if (langFilter === 'en') {
        sections.push('\n=== PART 2: Daily Vibe Check Interactive Questions ===');
      } else {
        sections.push(
          '\n=== ثانياً: أسئلة نبض ومود اليوم التفاعلية | PART 2: Daily Vibe Check Questions ==='
        );
      }

      VIBE_QUESTIONS.forEach((vq, idx) => {
        const lines: string[] = [];
        if (langFilter === 'ar') {
          lines.push(`${idx + 1}. ${vq.titleAr}`);
          if (vq.subtitleAr) lines.push(`   الوصف: ${vq.subtitleAr}`);
          vq.options.forEach((opt, oIdx) => {
            lines.push(`   ${oIdx + 1}) ${opt.labelAr}`);
          });
        } else if (langFilter === 'en') {
          lines.push(`${idx + 1}. ${vq.titleEn}`);
          if (vq.subtitleEn) lines.push(`   Subtitle: ${vq.subtitleEn}`);
          vq.options.forEach((opt, oIdx) => {
            lines.push(`   ${oIdx + 1}) ${opt.labelEn}`);
          });
        } else {
          lines.push(`${idx + 1}. السؤال (AR): ${vq.titleAr}`);
          lines.push(`   Question (EN): ${vq.titleEn}`);
          if (vq.subtitleAr || vq.subtitleEn) {
            lines.push(`   الوصف / Subtitle: ${vq.subtitleAr} | ${vq.subtitleEn}`);
          }
          lines.push('   الخيارات / Options:');
          vq.options.forEach((opt, oIdx) => {
            lines.push(`   ${oIdx + 1}) ${opt.labelAr}  |  ${opt.labelEn}`);
          });
        }
        sections.push(lines.join('\n'));
      });
    }

    return sections.join('\n\n');
  }, [partitions, langFilter, scopeFilter]);

  if (!isOpen) return null;

  const triggerCopy = async (id: string, text: string) => {
    await copyTextSafely(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-[#FAF9F5] dark:bg-[#121A15]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EEF8F2] dark:bg-[#0B5D3B]/30 flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399] shrink-0">
              <FileText size={19} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-[#202923] dark:text-white truncate">
                {isAr
                  ? 'جميع الأسئلة والخيارات قابلة للنسخ (عربي / إنجليزي)'
                  : 'All Copyable Questions & Options (Arabic & English)'}
              </h3>
              <p className="text-xs text-[#778078] dark:text-slate-400">
                {isAr
                  ? 'انسخ القائمة الكاملة بضغطة واحدة أو حدد اللغة والقسم المطلوب'
                  : 'One-click copy for all onboarding & daily vibe questions in Arabic, English, or both'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-[#0B5D3B] cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#162019]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Language Filter */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/80 dark:border-slate-800">
              {(
                [
                  { id: 'both' as const, ar: 'عربي + إنجليزي', en: 'Arabic + English' },
                  { id: 'ar' as const, ar: 'العربية فقط', en: 'Arabic Only' },
                  { id: 'en' as const, ar: 'الإنجليزية فقط', en: 'English Only' },
                ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLangFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    langFilter === tab.id
                      ? 'bg-[#0B5D3B] text-white'
                      : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
                  }`}
                >
                  {isAr ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            {/* Scope Filter */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/80 dark:border-slate-800">
              {(
                [
                  { id: 'all' as const, ar: 'كل الأسئلة', en: 'All Sets' },
                  { id: 'onboarding' as const, ar: 'الاستبيان الأساسي', en: 'Core Questionnaire' },
                  { id: 'vibe' as const, ar: 'أسئلة مود اليوم', en: 'Daily Vibe' },
                ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScopeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    scopeFilter === tab.id
                      ? 'bg-[#0B5D3B] text-white'
                      : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
                  }`}
                >
                  {isAr ? tab.ar : tab.en}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerCopy('all_doc', formattedDocument)}
            className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            {copiedId === 'all_doc' ? (
              <>
                <Check size={14} className="text-[#D4AF37]" />
                <span>{isAr ? 'تم نسخ النص بالكامل!' : 'Copied Full Text!'}</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-[#D4AF37]" />
                <span>{isAr ? 'نسخ الكل الآن' : 'Copy All Now'}</span>
              </>
            )}
          </button>
        </div>

        {/* Copyable Read-Only Textarea */}
        <div className="flex-1 min-h-0 p-5 overflow-y-auto bg-[#FAF9F5] dark:bg-[#111813]">
          <textarea
            readOnly
            value={formattedDocument}
            dir={langFilter === 'en' ? 'ltr' : 'rtl'}
            onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
            className="w-full h-[55vh] p-4 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm leading-relaxed text-[#202923] dark:text-slate-100 font-sans select-text focus:outline-none focus:border-[#0B5D3B] resize-none"
          />
        </div>
      </div>
    </div>
  );
};

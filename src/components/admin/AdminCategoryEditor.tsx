import React, { useEffect, useMemo, useState } from 'react';
import {
  Language,
  Question,
  QuestionCategory,
  QuestionOption,
} from '../../types';
import {
  CatalogDependencyReport,
  CatalogValidationIssue,
  CategoryPartition,
} from '../../services/contracts';
import {
  AVAILABLE_QUESTION_ICONS,
  generateStableOptionId,
  generateStableQuestionId,
  getQuestionCatalogRepository,
  inspectOptionDependency,
  inspectQuestionDependency,
  isCategoryCustomizedInStorage,
  validateCategoryPartitionDraft,
} from '../../services/questionCatalogService';
import { RealisticIcon } from '../common/RealisticIcon';
import { AdminCategoryPreviewModal } from './AdminCategoryPreviewModal';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminCategoryEditorProps {
  partition: CategoryPartition;
  allQuestionIdsInCatalog: string[];
  language: Language;
  onBack: () => void;
  onSaved: (updatedPartition: CategoryPartition, message: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

function serializeDraftState(category: QuestionCategory, questions: Question[]): string {
  return JSON.stringify({
    category: {
      id: category.id,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      iconKey: category.iconKey,
      isEnabled: category.isEnabled,
    },
    questions: questions.map((q, qIdx) => ({
      id: q.id,
      titleEn: q.titleEn,
      titleAr: q.titleAr,
      subtitleEn: q.subtitleEn || '',
      subtitleAr: q.subtitleAr || '',
      isMultiSelect: Boolean(q.isMultiSelect),
      maxSelect: q.isMultiSelect ? q.maxSelect || 3 : null,
      isEnabled: q.isEnabled !== false,
      order: qIdx,
      options: q.options.map((o, oIdx) => ({
        id: o.id,
        labelEn: o.labelEn,
        labelAr: o.labelAr,
        iconKey: o.iconKey,
        descriptionEn: o.descriptionEn || '',
        descriptionAr: o.descriptionAr || '',
        isEnabled: o.isEnabled !== false,
        order: oIdx,
      })),
    })),
  });
}

function deepCloneDraftQuestions(questions: Question[], categoryId: string): Question[] {
  return questions.map((q, qIdx) => ({
    ...q,
    category: categoryId,
    categoryId,
    isEnabled: q.isEnabled !== false,
    order: qIdx,
    options: q.options.map((o, oIdx) => ({
      ...o,
      isEnabled: o.isEnabled !== false,
      order: oIdx,
    })),
  }));
}

export const AdminCategoryEditor: React.FC<AdminCategoryEditorProps> = ({
  partition,
  allQuestionIdsInCatalog,
  language,
  onBack,
  onSaved,
  onDirtyChange,
}) => {
  const isAr = language === 'ar';

  const [categoryDraft, setCategoryDraft] = useState<QuestionCategory>(() => ({
    ...partition.category,
  }));
  const [questionsDraft, setQuestionsDraft] = useState<Question[]>(() =>
    deepCloneDraftQuestions(partition.questions, partition.category.id)
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    () => partition.questions[0]?.id || ''
  );
  const [questionSearch, setQuestionSearch] = useState('');
  const [expandedOptionDescIds, setExpandedOptionDescIds] = useState<Record<string, boolean>>({});
  const [openIconPickerTarget, setOpenIconPickerTarget] = useState<string | null>(null);

  // Modals & Validation States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [confirmDiscardAction, setConfirmDiscardAction] = useState<'back' | 'reset_draft' | null>(
    null
  );
  const [confirmRestoreDefaultOpen, setConfirmRestoreDefaultOpen] = useState(false);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<{
    kind: 'question' | 'option';
    questionId: string;
    optionId?: string;
    label: string;
    report: CatalogDependencyReport;
  } | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    tone: 'error' | 'info' | 'success';
    text: string;
  } | null>(null);

  // Reset local draft only when switching to a different category ID or after restore
  useEffect(() => {
    setCategoryDraft({ ...partition.category });
    const clonedQs = deepCloneDraftQuestions(partition.questions, partition.category.id);
    setQuestionsDraft(clonedQs);
    setSelectedQuestionId((prev) =>
      clonedQs.some((q) => q.id === prev) ? prev : clonedQs[0]?.id || ''
    );
    setShowValidationErrors(false);
    setInlineNotice(null);
  }, [partition.category.id, partition.updatedAt]);

  const baselineSignature = useMemo(
    () => serializeDraftState(partition.category, partition.questions),
    [partition]
  );

  const currentSignature = useMemo(
    () => serializeDraftState(categoryDraft, questionsDraft),
    [categoryDraft, questionsDraft]
  );

  const isDirty = baselineSignature !== currentSignature;

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [isDirty, onDirtyChange]);

  // Warn browser tab unload if administrator has unsaved category changes
  useEffect(() => {
    if (!isDirty || typeof window === 'undefined') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validationIssues: CatalogValidationIssue[] = useMemo(
    () =>
      validateCategoryPartitionDraft(partition.category.id, {
        category: categoryDraft,
        questions: questionsDraft,
      }),
    [partition.category.id, categoryDraft, questionsDraft]
  );

  const selectedQuestionIndex = questionsDraft.findIndex((q) => q.id === selectedQuestionId);
  const selectedQuestion =
    selectedQuestionIndex >= 0 ? questionsDraft[selectedQuestionIndex] : questionsDraft[0] || null;

  const filteredQuestions = useMemo(() => {
    const qLower = questionSearch.trim().toLowerCase();
    if (!qLower) return questionsDraft;
    return questionsDraft.filter(
      (q) =>
        q.id.toLowerCase().includes(qLower) ||
        q.titleEn.toLowerCase().includes(qLower) ||
        q.titleAr.toLowerCase().includes(qLower) ||
        q.options.some(
          (o) =>
            o.labelEn.toLowerCase().includes(qLower) ||
            o.labelAr.toLowerCase().includes(qLower) ||
            o.id.toLowerCase().includes(qLower)
        )
    );
  }, [questionsDraft, questionSearch]);

  const isCustomizedInBrowser = isCategoryCustomizedInStorage(partition.category.id);

  // ============================================================================
  // Question & Option Mutators (Strictly Scoped to This Category Draft)
  // ============================================================================

  const updateSelectedQuestion = (updater: (q: Question) => Question) => {
    if (!selectedQuestion) return;
    setQuestionsDraft((prev) =>
      prev.map((q) => (q.id === selectedQuestion.id ? updater(q) : q))
    );
  };

  const handleAddQuestion = () => {
    const usedIds = new Set<string>([
      ...allQuestionIdsInCatalog,
      ...questionsDraft.map((q) => q.id),
    ]);
    const newQId = generateStableQuestionId(partition.category.id, usedIds);
    const opt1Id = generateStableOptionId(newQId, []);
    const opt2Id = generateStableOptionId(newQId, [opt1Id]);

    const newQuestion: Question = {
      id: newQId,
      category: partition.category.id,
      categoryId: partition.category.id,
      titleEn: '',
      titleAr: '',
      subtitleEn: '',
      subtitleAr: '',
      isMultiSelect: false,
      isEnabled: true,
      order: questionsDraft.length,
      isSystemDefault: false,
      options: [
        {
          id: opt1Id,
          labelEn: '',
          labelAr: '',
          iconKey: categoryDraft.iconKey || 'sparkles',
          isEnabled: true,
          order: 0,
        },
        {
          id: opt2Id,
          labelEn: '',
          labelAr: '',
          iconKey: 'heart',
          isEnabled: true,
          order: 1,
        },
      ],
    };

    setQuestionsDraft((prev) => [...prev, newQuestion]);
    setSelectedQuestionId(newQId);
    setQuestionSearch('');
    setInlineNotice({
      tone: 'info',
      text: isAr
        ? `تم إنشاء سؤال جديد بمعرّف ثابت (${newQId}). أدخل النص بالعربية والإنجليزية ثم احفظ التغييرات.`
        : `Added new question with stable ID (${newQId}). Fill in Arabic & English text, then click Save.`,
    });
  };

  const handleMoveQuestion = (questionId: string, direction: -1 | 1) => {
    setQuestionsDraft((prev) => {
      const idx = prev.findIndex((q) => q.id === questionId);
      const targetIdx = idx + direction;
      if (idx < 0 || targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((q, i) => ({ ...q, order: i }));
    });
  };

  const handleToggleQuestionEnabled = (questionId: string) => {
    setQuestionsDraft((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, isEnabled: q.isEnabled === false ? true : false } : q
      )
    );
  };

  const handleRequestRemoveQuestion = (question: Question) => {
    const report = inspectQuestionDependency(question.id);
    setPendingDeleteTarget({
      kind: 'question',
      questionId: question.id,
      label: isAr
        ? question.titleAr || question.titleEn || question.id
        : question.titleEn || question.titleAr || question.id,
      report,
    });
  };

  const handleConfirmRemoveQuestion = () => {
    if (!pendingDeleteTarget || pendingDeleteTarget.kind !== 'question') return;
    const targetQId = pendingDeleteTarget.questionId;
    setQuestionsDraft((prev) => {
      const remaining = prev
        .filter((q) => q.id !== targetQId)
        .map((q, idx) => ({ ...q, order: idx }));
      if (selectedQuestionId === targetQId) {
        setSelectedQuestionId(remaining[0]?.id || '');
      }
      return remaining;
    });
    setPendingDeleteTarget(null);
    setInlineNotice({
      tone: 'info',
      text: isAr
        ? 'تمت إزالة السؤال من مسودة الفئة. اضغط "حفظ تغييرات الفئة" لتأكيد التحديث مع حفظ أرشيف الإجابات السابقة.'
        : 'Question removed from draft. Click "Save Category Changes" to persist while keeping historical answers archived.',
    });
  };

  const handleAddOption = () => {
    if (!selectedQuestion) return;
    const existingOptIds = selectedQuestion.options.map((o) => o.id);
    const newOptId = generateStableOptionId(selectedQuestion.id, existingOptIds);
    const nextOption: QuestionOption = {
      id: newOptId,
      labelEn: '',
      labelAr: '',
      iconKey: categoryDraft.iconKey || 'sparkles',
      isEnabled: true,
      order: selectedQuestion.options.length,
    };

    updateSelectedQuestion((q) => ({
      ...q,
      options: [...q.options, nextOption],
    }));
  };

  const handleUpdateOption = (
    optionId: string,
    patch: Partial<Omit<QuestionOption, 'id'>>
  ) => {
    updateSelectedQuestion((q) => ({
      ...q,
      options: q.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    }));
  };

  const handleMoveOption = (optionId: string, direction: -1 | 1) => {
    updateSelectedQuestion((q) => {
      const idx = q.options.findIndex((o) => o.id === optionId);
      const targetIdx = idx + direction;
      if (idx < 0 || targetIdx < 0 || targetIdx >= q.options.length) return q;
      const copy = [...q.options];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return {
        ...q,
        options: copy.map((o, i) => ({ ...o, order: i })),
      };
    });
  };

  const handleRequestRemoveOption = (question: Question, option: QuestionOption) => {
    if (question.options.length <= 2) {
      setInlineNotice({
        tone: 'error',
        text: isAr
          ? 'يجب أن يحتوي كل سؤال على خيارين اثنين على الأقل. يمكنك تعديل نص الخيار بدلاً من حذفه.'
          : 'Every question requires at least 2 answer options. Edit this option’s text instead of removing it.',
      });
      return;
    }

    const report = inspectOptionDependency(question.id, option.id);
    setPendingDeleteTarget({
      kind: 'option',
      questionId: question.id,
      optionId: option.id,
      label: isAr
        ? option.labelAr || option.labelEn || option.id
        : option.labelEn || option.labelAr || option.id,
      report,
    });
  };

  const handleConfirmRemoveOption = () => {
    if (
      !pendingDeleteTarget ||
      pendingDeleteTarget.kind !== 'option' ||
      !pendingDeleteTarget.optionId
    ) {
      return;
    }
    const { questionId, optionId } = pendingDeleteTarget;
    setQuestionsDraft((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const nextOpts = q.options
          .filter((o) => o.id !== optionId)
          .map((o, idx) => ({ ...o, order: idx }));
        return {
          ...q,
          maxSelect: q.isMultiSelect
            ? Math.max(2, Math.min(q.maxSelect || 3, nextOpts.length))
            : undefined,
          options: nextOpts,
        };
      })
    );
    setPendingDeleteTarget(null);
  };

  // ============================================================================
  // Save, Cancel & Per-Category Restore Handlers
  // ============================================================================

  const handleSaveCategory = () => {
    if (validationIssues.length > 0) {
      setShowValidationErrors(true);
      const firstIssueWithQ = validationIssues.find((iss) => iss.questionId);
      if (firstIssueWithQ?.questionId) {
        setSelectedQuestionId(firstIssueWithQ.questionId);
      }
      setInlineNotice({
        tone: 'error',
        text: isAr ? validationIssues[0].messageAr : validationIssues[0].messageEn,
      });
      return;
    }

    const result = getQuestionCatalogRepository().saveCategoryPartition(
      partition.category.id,
      {
        category: categoryDraft,
        questions: questionsDraft,
        archivedQuestions: partition.archivedQuestions,
        archivedOptions: partition.archivedOptions,
      }
    );

    if (!result.success || !result.partition) {
      setShowValidationErrors(true);
      setInlineNotice({
        tone: 'error',
        text: isAr
          ? result.errorAr || 'تعذر حفظ الفئة.'
          : result.errorEn || 'Could not save category.',
      });
      return;
    }

    setShowValidationErrors(false);
    setInlineNotice({
      tone: 'success',
      text: isAr
        ? `تم حفظ تغييرات فئة "${result.partition.category.nameAr}" محلياً بشكل مستقل تماماً دون المساس بأي فئة أخرى.`
        : `Saved "${result.partition.category.nameEn}" locally in its isolated partition without affecting any other category.`,
    });

    onSaved(
      result.partition,
      isAr
        ? `تم حفظ فئة "${result.partition.category.nameAr}" بنجاح`
        : `Saved category "${result.partition.category.nameEn}"`
    );
  };

  const handleRequestBack = () => {
    if (isDirty) {
      setConfirmDiscardAction('back');
    } else {
      onBack();
    }
  };

  const handleRequestCancelDraft = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    setConfirmDiscardAction('reset_draft');
  };

  const handleConfirmDiscard = () => {
    const action = confirmDiscardAction;
    setConfirmDiscardAction(null);
    if (action === 'back') {
      onBack();
    } else if (action === 'reset_draft') {
      setCategoryDraft({ ...partition.category });
      const resetQs = deepCloneDraftQuestions(partition.questions, partition.category.id);
      setQuestionsDraft(resetQs);
      setSelectedQuestionId(resetQs[0]?.id || '');
      setShowValidationErrors(false);
      setInlineNotice({
        tone: 'info',
        text: isAr
          ? 'تم التراجع عن التعديلات غير المحفوظة واستعادة آخر نسخة محفوظة.'
          : 'Discarded unsaved edits and reverted to last saved state.',
      });
    }
  };

  const handleConfirmRestoreCategoryDefault = () => {
    const res = getQuestionCatalogRepository().restoreCategoryToDefault(partition.category.id);
    setConfirmRestoreDefaultOpen(false);
    if (res.success && res.partition) {
      setCategoryDraft({ ...res.partition.category });
      const restoredQs = deepCloneDraftQuestions(
        res.partition.questions,
        res.partition.category.id
      );
      setQuestionsDraft(restoredQs);
      setSelectedQuestionId(restoredQs[0]?.id || '');
      setShowValidationErrors(false);
      setInlineNotice({
        tone: 'success',
        text: isAr
          ? `تمت استعادة الإعدادات الافتراضية الأصلية لفئة "${res.partition.category.nameAr}" فقط.`
          : `Restored original seed defaults for "${res.partition.category.nameEn}" only.`,
      });
      onSaved(
        res.partition,
        isAr
          ? `تمت استعادة الافتراضي لفئة "${res.partition.category.nameAr}"`
          : `Restored defaults for "${res.partition.category.nameEn}"`
      );
    }
  };

  const enabledQuestionsCount = questionsDraft.filter((q) => q.isEnabled !== false).length;

  return (
    <div className="space-y-6">
      {/* Sticky Category Workspace Action Header */}
      <div className="sticky top-[61px] z-20 p-4 rounded-2xl bg-white/95 dark:bg-[#162019]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleRequestBack}
            className="h-10 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-white inline-flex items-center gap-1.5 hover:border-[#0B5D3B] transition-colors shrink-0 cursor-pointer"
          >
            {isAr ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{isAr ? 'كل الفئات' : 'All Categories'}</span>
          </button>

          <div className="min-w-0">
            <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums flex flex-wrap items-center gap-x-1.5">
              <span>{isAr ? 'مساحة إدارة فئة مستقلة' : 'Isolated Category Workspace'}</span>
              <span aria-hidden="true">·</span>
              <span dir="ltr">{categoryDraft.id}</span>
              <span aria-hidden="true">·</span>
              <span>
                {enabledQuestionsCount}/{questionsDraft.length}{' '}
                {isAr ? 'سؤال مفعّل' : 'active questions'}
              </span>
              {isDirty && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans font-bold text-[#B45309] dark:text-[#FBBF24]">
                    {isAr ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#202923] dark:text-white truncate mt-0.5">
              {isAr
                ? categoryDraft.nameAr || categoryDraft.nameEn || categoryDraft.id
                : categoryDraft.nameEn || categoryDraft.nameAr || categoryDraft.id}
            </h2>
          </div>
        </div>

        {/* Action Toolbar: Preview, Restore Category Default, Cancel, Save */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-white inline-flex items-center gap-1.5 hover:border-[#0B5D3B] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Eye size={14} className="text-[#0B5D3B] dark:text-[#34D399]" />
            <span>{isAr ? 'معاينة الفئة للمستخدم' : 'Preview as User'}</span>
          </button>

          {categoryDraft.isBuiltIn && (isCustomizedInBrowser || isDirty) && (
            <button
              type="button"
              onClick={() => setConfirmRestoreDefaultOpen(true)}
              className="h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 hover:text-[#B45309] hover:border-[#D4AF37] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>{isAr ? 'استعادة افتراضي الفئة' : 'Restore Category Default'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRequestCancelDraft}
            className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            {isDirty ? (isAr ? 'إلغاء التعديلات' : 'Cancel Edits') : isAr ? 'رجوع' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleSaveCategory}
            className="h-10 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            <Save size={14} className="text-[#D4AF37]" />
            <span>{isAr ? 'حفظ تغييرات الفئة' : 'Save Category Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status / Validation Notice */}
      {inlineNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            inlineNotice.tone === 'error'
              ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : inlineNotice.tone === 'success'
              ? 'bg-[#EEF8F2] dark:bg-[#13251B] border-[#0B5D3B]/30 dark:border-[#10B981]/30 text-[#08422A] dark:text-[#DDF3E7]'
              : 'bg-white dark:bg-[#162019] border-slate-200 dark:border-slate-700 text-[#202923] dark:text-slate-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {inlineNotice.tone === 'error' ? (
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-[#0B5D3B] dark:text-[#34D399]" />
            )}
            <span className="leading-relaxed">{inlineNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setInlineNotice(null)}
            className="text-[11px] font-bold underline shrink-0 cursor-pointer"
          >
            {isAr ? 'إخفاء' : 'Dismiss'}
          </button>
        </div>
      )}

      {showValidationErrors && validationIssues.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>
              {isAr
                ? `يرجى مراجعة ${validationIssues.length} ملاحظة قبل الحفظ:`
                : `Please resolve ${validationIssues.length} validation issue(s) before saving:`}
            </span>
          </div>
          <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300 ps-5 list-disc">
            {validationIssues.map((issue, idx) => (
              <li key={`${issue.field}_${idx}`}>
                {isAr ? issue.messageAr : issue.messageEn}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Category Details & Bilingual Metadata Panel */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-[#202923] dark:text-white">
              {isAr ? 'بيانات الفئة (العربية والإنجليزية)' : 'Category Details (Arabic & English)'}
            </h3>
            <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
              {isAr
                ? `يُحفظ هذا القسم في مفتاح تخزين مستقل خاص بالفئة (${categoryDraft.id}) ولا يؤثر مطلقاً على بقية الفئات.`
                : `Persisted strictly under partition "${categoryDraft.id}". Editing this category never alters Sports, Coffee, Drinks, or any other category.`}
            </p>
          </div>

          {/* Category Enabled / Disabled Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setCategoryDraft((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))
              }
              className={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                categoryDraft.isEnabled
                  ? 'bg-[#EEF8F2] dark:bg-[#0B5D3B]/30 border-[#0B5D3B]/40 text-[#0B5D3B] dark:text-[#34D399]'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {categoryDraft.isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>
                {categoryDraft.isEnabled
                  ? isAr
                    ? 'الفئة مفعّلة'
                    : 'Category Enabled'
                  : isAr
                  ? 'الفئة معطّلة'
                  : 'Category Disabled'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Arabic Category Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
              {isAr ? 'اسم الفئة بالعربية *' : 'Category Name (Arabic) *'}
            </label>
            <input
              type="text"
              dir="rtl"
              value={categoryDraft.nameAr}
              onChange={(e) =>
                setCategoryDraft((prev) => ({ ...prev, nameAr: e.target.value }))
              }
              placeholder="مثال: طقوس القهوة اليومية"
              className="w-full h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-sm text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
            />
          </div>

          {/* English Category Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
              {isAr ? 'اسم الفئة بالإنجليزية *' : 'Category Name (English) *'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={categoryDraft.nameEn}
              onChange={(e) =>
                setCategoryDraft((prev) => ({ ...prev, nameEn: e.target.value }))
              }
              placeholder="e.g. Your Daily Coffee Ritual"
              className="w-full h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-sm text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
            />
          </div>

          {/* Arabic Category Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
              {isAr ? 'وصف الفئة بالعربية' : 'Description (Arabic)'}
            </label>
            <textarea
              rows={2}
              dir="rtl"
              value={categoryDraft.descriptionAr}
              onChange={(e) =>
                setCategoryDraft((prev) => ({ ...prev, descriptionAr: e.target.value }))
              }
              placeholder="وصف مختصر يوضح هدف هذه الفئة للمسؤول..."
              className="w-full p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B] resize-none"
            />
          </div>

          {/* English Category Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
              {isAr ? 'وصف الفئة بالإنجليزية' : 'Description (English)'}
            </label>
            <textarea
              rows={2}
              dir="ltr"
              value={categoryDraft.descriptionEn}
              onChange={(e) =>
                setCategoryDraft((prev) => ({ ...prev, descriptionEn: e.target.value }))
              }
              placeholder="Concise summary of what this category measures..."
              className="w-full p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B] resize-none"
            />
          </div>
        </div>

        {/* Category Icon Selector & Stable ID Readout */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenIconPickerTarget((prev) =>
                  prev === 'category_icon' ? null : 'category_icon'
                )
              }
              className="h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-white inline-flex items-center gap-2 hover:border-[#0B5D3B] cursor-pointer"
            >
              <RealisticIcon iconKey={categoryDraft.iconKey} size={16} />
              <span>{isAr ? 'تغيير أيقونة الفئة' : 'Category Icon'}</span>
              <span className="font-mono text-[11px] text-[#778078]">
                ({categoryDraft.iconKey})
              </span>
            </button>

            {openIconPickerTarget === 'category_icon' && (
              <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 shadow-xl grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-56 overflow-y-auto z-30">
                {AVAILABLE_QUESTION_ICONS.map((ic) => (
                  <button
                    key={ic.key}
                    type="button"
                    onClick={() => {
                      setCategoryDraft((prev) => ({ ...prev, iconKey: ic.key }));
                      setOpenIconPickerTarget(null);
                    }}
                    className={`p-2 rounded-xl border text-[11px] flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      categoryDraft.iconKey === ic.key
                        ? 'bg-[#EEF8F2] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#34D399] font-bold'
                        : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#202923] dark:text-slate-300'
                    }`}
                  >
                    <RealisticIcon iconKey={ic.key} size={16} />
                    <span className="truncate w-full text-center">
                      {isAr ? ic.labelAr : ic.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
            <span>{isAr ? 'المعرّف الثابت:' : 'Stable Category ID:'}</span>{' '}
            <strong className="text-[#202923] dark:text-white" dir="ltr">
              {categoryDraft.id}
            </strong>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>
              {categoryDraft.isBuiltIn
                ? isAr
                  ? 'فئة أساسية'
                  : 'Built-in category'
                : isAr
                ? 'فئة مخصصة'
                : 'Custom category'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Split Question List + Selected Question & Options Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Questions inside THIS Category Only */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#202923] dark:text-white">
                {isAr ? 'أسئلة هذه الفئة' : 'Questions in Category'}
              </h3>
              <span className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
                {enabledQuestionsCount} {isAr ? 'مفعّل من' : 'enabled of'}{' '}
                {questionsDraft.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="h-9 px-3 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus size={14} />
              <span>{isAr ? 'إضافة سؤال' : 'Add Question'}</span>
            </button>
          </div>

          {questionsDraft.length > 1 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute top-1/2 -translate-y-1/2 start-3 text-[#778078]"
              />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder={
                  isAr ? 'بحث داخل أسئلة الفئة...' : 'Search category questions...'
                }
                className="w-full h-9 ps-9 pe-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
              />
            </div>
          )}

          {filteredQuestions.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <p className="text-xs text-[#778078] dark:text-slate-400">
                {questionsDraft.length === 0
                  ? isAr
                    ? 'لا توجد أسئلة في هذه الفئة بعد.'
                    : 'No questions in this category yet.'
                  : isAr
                  ? 'لا توجد نتائج مطابقة للبحث.'
                  : 'No questions match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuestions.map((q) => {
                const realIdx = questionsDraft.findIndex((item) => item.id === q.id);
                const isSelected = selectedQuestion?.id === q.id;
                const qEnabled = q.isEnabled !== false;
                const activeOptCount = q.options.filter((o) => o.isEnabled !== false).length;

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-[#EEF8F2] dark:bg-[#0B5D3B]/25 border-[#0B5D3B] dark:border-[#34D399]'
                        : 'bg-[#FAF9F5] dark:bg-[#111813] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedQuestionId(q.id)}
                      className="w-full text-start cursor-pointer"
                    >
                      <div className="text-[11px] font-mono tabular-nums text-[#778078] dark:text-slate-400">
                        <span>{String(realIdx + 1).padStart(2, '0')}.</span>
                        <span className="mx-1" aria-hidden="true">·</span>
                        <span dir="ltr">{q.id}</span>
                        <span className="mx-1" aria-hidden="true">·</span>
                        <span>
                          {qEnabled
                            ? isAr
                              ? 'مفعّل'
                              : 'Enabled'
                            : isAr
                            ? 'معطّل'
                            : 'Disabled'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#202923] dark:text-white mt-1 line-clamp-2">
                        {isAr
                          ? q.titleAr || q.titleEn || '(سؤال جديد بدون عنوان)'
                          : q.titleEn || q.titleAr || '(Untitled new question)'}
                      </div>

                      <div className="text-[11px] text-[#778078] dark:text-slate-400 mt-1">
                        <span>
                          {q.isMultiSelect
                            ? isAr
                              ? `متعدد (حتى ${q.maxSelect || 3})`
                              : `Multi-select (max ${q.maxSelect || 3})`
                            : isAr
                            ? 'اختيار فردي'
                            : 'Single-select'}
                        </span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {activeOptCount}/{q.options.length}{' '}
                          {isAr ? 'خيارات' : 'options'}
                        </span>
                      </div>
                    </button>

                    {/* Per-Question Reorder, Enable/Disable, Delete Controls */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={realIdx <= 0}
                          onClick={() => handleMoveQuestion(q.id, -1)}
                          title={isAr ? 'تحريك السؤال للأعلى' : 'Move question up'}
                          aria-label={isAr ? 'تحريك السؤال للأعلى' : 'Move question up'}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#162019] flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={realIdx < 0 || realIdx >= questionsDraft.length - 1}
                          onClick={() => handleMoveQuestion(q.id, 1)}
                          title={isAr ? 'تحريك السؤال للأسفل' : 'Move question down'}
                          aria-label={isAr ? 'تحريك السؤال للأسفل' : 'Move question down'}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#162019] flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleQuestionEnabled(q.id)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#162019] text-[11px] font-bold text-[#202923] dark:text-slate-200 hover:border-[#0B5D3B] cursor-pointer"
                        >
                          {qEnabled
                            ? isAr
                              ? 'تعطيل'
                              : 'Disable'
                            : isAr
                            ? 'تفعيل'
                            : 'Enable'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestRemoveQuestion(q)}
                          title={isAr ? 'حذف السؤال من الفئة' : 'Remove question'}
                          aria-label={isAr ? 'حذف السؤال من الفئة' : 'Remove question'}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#162019] flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-300 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (8 cols): Selected Question & Answer Options Editor */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedQuestion ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-bold text-[#202923] dark:text-white">
                {isAr
                  ? 'لا يوجد سؤال محدد في هذه الفئة حالياً'
                  : 'No question selected in this category'}
              </p>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isAr ? 'إضافة أول سؤال لهذه الفئة' : 'Add First Question'}</span>
              </button>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-6">
              {/* Question Editor Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400">
                    <span>
                      {isAr
                        ? `تحرير السؤال ${selectedQuestionIndex + 1} من ${questionsDraft.length}`
                        : `Editing Question ${selectedQuestionIndex + 1} of ${questionsDraft.length}`}
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span dir="ltr">{selectedQuestion.id}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#202923] dark:text-white mt-0.5">
                    {isAr
                      ? 'نص السؤال، نوع الاختيار، والخيارات المتاحة'
                      : 'Question Wording, Selection Mode & Answer Options'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleQuestionEnabled(selectedQuestion.id)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors self-start sm:self-center cursor-pointer ${
                    selectedQuestion.isEnabled !== false
                      ? 'bg-[#EEF8F2] dark:bg-[#0B5D3B]/30 border-[#0B5D3B]/40 text-[#0B5D3B] dark:text-[#34D399]'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {selectedQuestion.isEnabled !== false ? (
                    <Eye size={13} />
                  ) : (
                    <EyeOff size={13} />
                  )}
                  <span>
                    {selectedQuestion.isEnabled !== false
                      ? isAr
                        ? 'السؤال مفعّل'
                        : 'Question Enabled'
                      : isAr
                      ? 'السؤال معطّل'
                      : 'Question Disabled'}
                  </span>
                </button>
              </div>

              {/* Bilingual Question Titles & Subtitles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
                    {isAr ? 'نص السؤال بالعربية *' : 'Question Text (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={selectedQuestion.titleAr}
                    onChange={(e) =>
                      updateSelectedQuestion((q) => ({ ...q, titleAr: e.target.value }))
                    }
                    placeholder="اكتب السؤال باللغة العربية..."
                    className="w-full h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-sm text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
                    {isAr ? 'نص السؤال بالإنجليزية *' : 'Question Text (English) *'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={selectedQuestion.titleEn}
                    onChange={(e) =>
                      updateSelectedQuestion((q) => ({ ...q, titleEn: e.target.value }))
                    }
                    placeholder="Write the question in English..."
                    className="w-full h-10 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-sm text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#778078] dark:text-slate-300">
                    {isAr ? 'وصف إرشادي فرعي بالعربية (اختياري)' : 'Helper Subtitle (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={selectedQuestion.subtitleAr || ''}
                    onChange={(e) =>
                      updateSelectedQuestion((q) => ({
                        ...q,
                        subtitleAr: e.target.value,
                      }))
                    }
                    placeholder="مثال: اختر إجابة واحدة تعبر عن ذوقك"
                    className="w-full h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#778078] dark:text-slate-300">
                    {isAr ? 'وصف إرشادي فرعي بالإنجليزية (اختياري)' : 'Helper Subtitle (English)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={selectedQuestion.subtitleEn || ''}
                    onChange={(e) =>
                      updateSelectedQuestion((q) => ({
                        ...q,
                        subtitleEn: e.target.value,
                      }))
                    }
                    placeholder="e.g. Select up to 3 favorites"
                    className="w-full h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              {/* Single-Select vs Multi-Select Configuration */}
              <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#202923] dark:text-white">
                    {isAr ? 'نظام اختيار الإجابات' : 'Answer Selection Mode'}
                  </div>
                  <div className="text-[11px] text-[#778078] dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'حدد ما إذا كان المستخدم يختار خياراً واحداً فقط أو عدة خيارات'
                      : 'Choose whether users pick a single answer or multiple answers'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedQuestion((q) => ({
                          ...q,
                          isMultiSelect: false,
                          maxSelect: undefined,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        !selectedQuestion.isMultiSelect
                          ? 'bg-[#0B5D3B] text-white'
                          : 'text-[#778078] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'اختيار فردي (واحد)' : 'Single-Select'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedQuestion((q) => ({
                          ...q,
                          isMultiSelect: true,
                          maxSelect: Math.max(
                            2,
                            Math.min(q.maxSelect || 3, Math.max(2, q.options.length))
                          ),
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        selectedQuestion.isMultiSelect
                          ? 'bg-[#0B5D3B] text-white'
                          : 'text-[#778078] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'متعدد الاختيارات' : 'Multi-Select'}
                    </button>
                  </div>

                  {selectedQuestion.isMultiSelect && (
                    <div className="flex items-center gap-2 text-xs">
                      <label className="font-bold text-[#202923] dark:text-slate-200">
                        {isAr ? 'الحد الأقصى:' : 'Max choices:'}
                      </label>
                      <select
                        value={selectedQuestion.maxSelect || 3}
                        onChange={(e) =>
                          updateSelectedQuestion((q) => ({
                            ...q,
                            maxSelect: Number(e.target.value),
                          }))
                        }
                        className="h-9 px-2.5 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-[#202923] dark:text-white cursor-pointer"
                      >
                        {Array.from(
                          { length: Math.max(1, selectedQuestion.options.length - 1) },
                          (_, idx) => idx + 2
                        ).map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer Options List & Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#202923] dark:text-white">
                      {isAr ? 'خيارات الإجابة لهذا السؤال' : 'Answer Options'}
                    </h4>
                    <span className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
                      {selectedQuestion.options.filter((o) => o.isEnabled !== false).length}{' '}
                      {isAr ? 'مفعّل من أصل' : 'active of'}{' '}
                      {selectedQuestion.options.length} ·{' '}
                      {isAr
                        ? 'تعديل النص لا يغيّر معرّف الخيار الثابت'
                        : 'Editing labels preserves stable option IDs'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors self-start sm:self-center cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{isAr ? 'إضافة خيار جديد' : 'Add Option'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedQuestion.options.map((opt, optIdx) => {
                    const optEnabled = opt.isEnabled !== false;
                    const descOpen = Boolean(
                      expandedOptionDescIds[opt.id] || opt.descriptionAr || opt.descriptionEn
                    );
                    const iconPickerKey = `opt_icon_${opt.id}`;

                    return (
                      <div
                        key={opt.id}
                        className={`p-4 rounded-xl border transition-colors space-y-3 ${
                          optEnabled
                            ? 'bg-[#FAF9F5] dark:bg-[#111813] border-slate-200/90 dark:border-slate-800'
                            : 'bg-slate-100/70 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700 opacity-80'
                        }`}
                      >
                        {/* Option Row Top Metadata & Action Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenIconPickerTarget((prev) =>
                                  prev === iconPickerKey ? null : iconPickerKey
                                )
                              }
                              title={isAr ? 'تغيير أيقونة الخيار' : 'Change option icon'}
                              className="w-9 h-9 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399] hover:border-[#0B5D3B] shrink-0 cursor-pointer"
                            >
                              <RealisticIcon iconKey={opt.iconKey} size={17} />
                            </button>

                            <div className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400 truncate">
                              <span>#{optIdx + 1}</span>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span dir="ltr">{opt.id}</span>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span>
                                {optEnabled
                                  ? isAr
                                    ? 'مفعّل'
                                    : 'Active'
                                  : isAr
                                  ? 'معطّل (مخفي للجديد)'
                                  : 'Disabled'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={optIdx === 0}
                              onClick={() => handleMoveOption(opt.id, -1)}
                              title={isAr ? 'تحريك الخيار للأعلى' : 'Move option up'}
                              aria-label={isAr ? 'تحريك الخيار للأعلى' : 'Move option up'}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowUp size={13} />
                            </button>

                            <button
                              type="button"
                              disabled={optIdx === selectedQuestion.options.length - 1}
                              onClick={() => handleMoveOption(opt.id, 1)}
                              title={isAr ? 'تحريك الخيار للأسفل' : 'Move option down'}
                              aria-label={isAr ? 'تحريك الخيار للأسفل' : 'Move option down'}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowDown size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOption(opt.id, { isEnabled: !optEnabled })
                              }
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-[#202923] dark:text-slate-200 hover:border-[#0B5D3B] cursor-pointer"
                            >
                              {optEnabled
                                ? isAr
                                  ? 'تعطيل'
                                  : 'Disable'
                                : isAr
                                ? 'تفعيل'
                                : 'Enable'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOptionDescIds((prev) => ({
                                  ...prev,
                                  [opt.id]: !descOpen,
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-[#778078] dark:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAr ? 'وصف' : 'Subtext'}</span>
                              {descOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestRemoveOption(selectedQuestion, opt)}
                              title={isAr ? 'حذف الخيار بعد فحص الارتباطات' : 'Remove option'}
                              aria-label={isAr ? 'حذف الخيار' : 'Remove option'}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-300 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Inline Icon Picker for This Option */}
                        {openIconPickerTarget === iconPickerKey && (
                          <div className="p-3 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                            {AVAILABLE_QUESTION_ICONS.map((ic) => (
                              <button
                                key={ic.key}
                                type="button"
                                onClick={() => {
                                  handleUpdateOption(opt.id, { iconKey: ic.key });
                                  setOpenIconPickerTarget(null);
                                }}
                                className={`p-2 rounded-lg border text-[11px] flex flex-col items-center gap-1 cursor-pointer ${
                                  opt.iconKey === ic.key
                                    ? 'bg-[#EEF8F2] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#34D399] font-bold'
                                    : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#202923] dark:text-slate-300'
                                }`}
                              >
                                <RealisticIcon iconKey={ic.key} size={15} />
                                <span className="truncate w-full text-center">
                                  {isAr ? ic.labelAr : ic.labelEn}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Arabic & English Option Labels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-[#778078] dark:text-slate-400">
                              {isAr ? 'نص الخيار بالعربية *' : 'Option Label (Arabic) *'}
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              value={opt.labelAr}
                              onChange={(e) =>
                                handleUpdateOption(opt.id, { labelAr: e.target.value })
                              }
                              placeholder="النص العربي للخيار..."
                              className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-[#778078] dark:text-slate-400">
                              {isAr ? 'نص الخيار بالإنجليزية *' : 'Option Label (English) *'}
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              value={opt.labelEn}
                              onChange={(e) =>
                                handleUpdateOption(opt.id, { labelEn: e.target.value })
                              }
                              placeholder="English option label..."
                              className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                            />
                          </div>
                        </div>

                        {/* Optional Option Subtext / Descriptions */}
                        {descOpen && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <div className="space-y-1">
                              <label className="block text-[11px] text-[#778078] dark:text-slate-400">
                                {isAr ? 'وصف إضافي بالعربية (اختياري)' : 'Optional Subtext (AR)'}
                              </label>
                              <input
                                type="text"
                                dir="rtl"
                                value={opt.descriptionAr || ''}
                                onChange={(e) =>
                                  handleUpdateOption(opt.id, {
                                    descriptionAr: e.target.value,
                                  })
                                }
                                placeholder="وصف مختصر تحت الخيار..."
                                className="w-full h-8 px-3 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[11px] text-[#778078] dark:text-slate-400">
                                {isAr ? 'وصف إضافي بالإنجليزية (اختياري)' : 'Optional Subtext (EN)'}
                              </label>
                              <input
                                type="text"
                                dir="ltr"
                                value={opt.descriptionEn || ''}
                                onChange={(e) =>
                                  handleUpdateOption(opt.id, {
                                    descriptionEn: e.target.value,
                                  })
                                }
                                placeholder="Short secondary line..."
                                className="w-full h-8 px-3 rounded-lg bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Category Preview Modal */}
      <AdminCategoryPreviewModal
        isOpen={isPreviewOpen}
        category={categoryDraft}
        questions={questionsDraft}
        initialLanguage={language}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Dependency Check & Safe Removal Confirmation Modal (Question or Option) */}
      {pendingDeleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPendingDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-[#202923] dark:text-white">
                  {pendingDeleteTarget.kind === 'option'
                    ? isAr
                      ? 'تأكيد إزالة خيار الإجابة وفحص الارتباطات'
                      : 'Confirm Option Removal & Dependency Check'
                    : isAr
                    ? 'تأكيد إزالة السؤال وفحص الإجابات المرتبطة'
                    : 'Confirm Question Removal & Dependency Check'}
                </h4>
                <div className="text-xs font-mono text-[#778078] dark:text-slate-400">
                  {pendingDeleteTarget.label} (
                  {pendingDeleteTarget.optionId || pendingDeleteTarget.questionId})
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200/80 dark:border-slate-800 text-xs text-[#202923] dark:text-slate-200 leading-relaxed space-y-2">
              <p>
                {isAr
                  ? pendingDeleteTarget.report.warningAr
                  : pendingDeleteTarget.report.warningEn}
              </p>
              {pendingDeleteTarget.report.referencedByCount > 0 && (
                <div className="font-mono text-[11px] text-[#778078] dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                  {isAr ? 'الحسابات المرتبطة:' : 'Referenced accounts:'}{' '}
                  <span dir="ltr">
                    {pendingDeleteTarget.report.referencedUserHandles.join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 hover:text-[#202923] cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Keep It'}
              </button>

              {pendingDeleteTarget.report.referencedByCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      pendingDeleteTarget.kind === 'option' &&
                      pendingDeleteTarget.optionId
                    ) {
                      handleUpdateOption(pendingDeleteTarget.optionId, {
                        isEnabled: false,
                      });
                    } else {
                      handleToggleQuestionEnabled(pendingDeleteTarget.questionId);
                    }
                    setPendingDeleteTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'تعطيل فقط (موصى به)' : 'Disable Instead (Recommended)'}
                </button>
              )}

              <button
                type="button"
                onClick={
                  pendingDeleteTarget.kind === 'option'
                    ? handleConfirmRemoveOption
                    : handleConfirmRemoveQuestion
                }
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                {pendingDeleteTarget.report.referencedByCount > 0
                  ? isAr
                    ? 'إزالة من النشط مع حفظ الأرشيف'
                    : 'Remove & Archive Historical Label'
                  : isAr
                  ? 'حذف الآن'
                  : 'Remove Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {confirmDiscardAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmDiscardAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-extrabold text-[#202923] dark:text-white">
              {isAr ? 'لديك تعديلات غير محفوظة في هذه الفئة' : 'Unsaved Changes in Category'}
            </h4>
            <p className="text-xs text-[#778078] dark:text-slate-300 leading-relaxed">
              {isAr
                ? 'إذا غادرت الآن أو ألغيت التعديلات فسيتم تجاهل التغييرات الأخيرة التي لم تقم بحفظها على هذه الفئة.'
                : 'Leaving or canceling now will discard your unsaved edits for this category. Would you like to keep editing or discard changes?'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDiscardAction(null)}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'مواصلة التحرير' : 'Keep Editing'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                {isAr ? 'تجاهل التغييرات' : 'Discard Unsaved Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Single Category Default Confirmation Modal */}
      {confirmRestoreDefaultOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmRestoreDefaultOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-extrabold text-[#202923] dark:text-white">
              {isAr
                ? 'استعادة الإعدادات الافتراضية لهذه الفئة فقط؟'
                : 'Restore Defaults for This Category Only?'}
            </h4>
            <p className="text-xs text-[#778078] dark:text-slate-300 leading-relaxed">
              {isAr
                ? `سيتم إرجاع فئة "${categoryDraft.nameAr}" وأسئلتها وخياراتها الأصلية إلى حالتها الافتراضية دون المساس بأي فئة أخرى أو حذف إجابات المستخدمين.`
                : `This resets "${categoryDraft.nameEn}" back to its immutable original questions and options without touching any other category or user answers.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreDefaultOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreCategoryDefault}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'نعم، استعادة افتراضي الفئة' : 'Restore Category Default'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { CategoryKey, Language } from '../../types';
import { AdminDashboardSnapshot } from '../../services/adminService';
import { CatalogDependencyReport, CategoryPartition } from '../../services/contracts';
import {
  AVAILABLE_QUESTION_ICONS,
  getQuestionCatalogRepository,
  inspectCategoryDependency,
  isCategoryCustomizedInStorage,
} from '../../services/questionCatalogService';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import { RealisticIcon } from '../common/RealisticIcon';
import { AdminCategoryEditor } from './AdminCategoryEditor';
import { AdminCategoryPreviewModal } from './AdminCategoryPreviewModal';
import { AdminCopyableQuestionsModal } from './AdminCopyableQuestionsModal';
import {
  Plus,
  Search,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Copy,
} from 'lucide-react';

interface AdminQuestionnaireSectionProps {
  snapshot: AdminDashboardSnapshot;
  language: Language;
  onCatalogChanged?: () => void;
  onDirtyStateChange?: (isDirty: boolean) => void;
}

type SubViewMode = 'management' | 'analytics';
type CategoryFilterMode = 'all' | 'enabled' | 'disabled' | 'modified';

export const AdminQuestionnaireSection: React.FC<AdminQuestionnaireSectionProps> = ({
  snapshot,
  language,
  onCatalogChanged,
  onDirtyStateChange,
}) => {
  const isAr = language === 'ar';
  const { partitions, modificationSummary, refresh } = useQuestionCatalog();

  const [viewMode, setViewMode] = useState<SubViewMode>('management');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<CategoryFilterMode>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>('q_coffee');

  // Action Modals & Banner Feedback
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [previewPartition, setPreviewPartition] = useState<CategoryPartition | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [confirmRestoreAllOpen, setConfirmRestoreAllOpen] = useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState<{
    partition: CategoryPartition;
    report: CatalogDependencyReport;
  } | null>(null);

  // Add New Category Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatDescAr, setNewCatDescAr] = useState('');
  const [newCatDescEn, setNewCatDescEn] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('sparkles');
  const [newCatQTitleAr, setNewCatQTitleAr] = useState('');
  const [newCatQTitleEn, setNewCatQTitleEn] = useState('');
  const [newCatError, setNewCatError] = useState<string | null>(null);

  const selectedPartition = useMemo(
    () =>
      selectedCategoryId
        ? partitions.find((p) => p.category.id === selectedCategoryId) || null
        : null,
    [partitions, selectedCategoryId]
  );

  const allQuestionIdsInCatalog = useMemo(
    () => partitions.flatMap((p) => p.questions.map((q) => q.id)),
    [partitions]
  );

  const notifyParentAndRefresh = (bannerMsg?: string) => {
    refresh();
    onCatalogChanged?.();
    if (bannerMsg) {
      setStatusBanner(bannerMsg);
    }
  };

  // Filtered Category Partitions
  const filteredPartitions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return partitions.filter((part) => {
      const cat = part.category;
      const isModified =
        !cat.isBuiltIn || isCategoryCustomizedInStorage(cat.id);

      if (filterMode === 'enabled' && !cat.isEnabled) return false;
      if (filterMode === 'disabled' && cat.isEnabled) return false;
      if (filterMode === 'modified' && !isModified) return false;

      if (!qLower) return true;

      const matchesCat =
        cat.id.toLowerCase().includes(qLower) ||
        cat.nameEn.toLowerCase().includes(qLower) ||
        cat.nameAr.toLowerCase().includes(qLower) ||
        cat.descriptionEn.toLowerCase().includes(qLower) ||
        cat.descriptionAr.toLowerCase().includes(qLower);

      if (matchesCat) return true;

      return part.questions.some(
        (q) =>
          q.id.toLowerCase().includes(qLower) ||
          q.titleEn.toLowerCase().includes(qLower) ||
          q.titleAr.toLowerCase().includes(qLower) ||
          q.options.some(
            (o) =>
              o.labelEn.toLowerCase().includes(qLower) ||
              o.labelAr.toLowerCase().includes(qLower)
          )
      );
    });
  }, [partitions, searchQuery, filterMode]);

  // Aggregate Catalog Metrics
  const catalogMetrics = useMemo(() => {
    const totalCategories = partitions.length;
    const enabledCategories = partitions.filter((p) => p.category.isEnabled).length;
    let totalQuestions = 0;
    let activeQuestions = 0;
    let activeOptions = 0;

    for (const part of partitions) {
      totalQuestions += part.questions.length;
      for (const q of part.questions) {
        const qActive = part.category.isEnabled && q.isEnabled !== false;
        if (qActive) {
          activeQuestions += 1;
          activeOptions += q.options.filter((o) => o.isEnabled !== false).length;
        }
      }
    }

    const modifiedCount =
      modificationSummary.customizedCategoryIds.length +
      modificationSummary.customAddedCategoryIds.length;

    return {
      totalCategories,
      enabledCategories,
      totalQuestions,
      activeQuestions,
      activeOptions,
      modifiedCount,
    };
  }, [partitions, modificationSummary]);

  // ============================================================================
  // Directory-Level Category Actions
  // ============================================================================

  const handleMoveCategory = (categoryId: CategoryKey, direction: -1 | 1) => {
    const currentOrder = partitions.map((p) => p.category.id);
    const idx = currentOrder.indexOf(categoryId);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= currentOrder.length) return;

    const reordered = [...currentOrder];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(nextIdx, 0, moved);

    getQuestionCatalogRepository().reorderCategories(reordered);
    notifyParentAndRefresh(
      isAr ? 'تم تحديث ترتيب عرض الفئات محلياً.' : 'Updated category display order locally.'
    );
  };

  const handleToggleCategoryEnabled = (part: CategoryPartition) => {
    const nextState = !part.category.isEnabled;
    const res = getQuestionCatalogRepository().setCategoryEnabled(
      part.category.id,
      nextState
    );
    if (res.success) {
      notifyParentAndRefresh(
        nextState
          ? isAr
            ? `تم تفعيل فئة "${part.category.nameAr}" في الاستبيان.`
            : `Enabled category "${part.category.nameEn}".`
          : isAr
          ? `تم تعطيل فئة "${part.category.nameAr}" من الاستبيانات الجديدة مع حفظ الإجابات السابقة.`
          : `Disabled category "${part.category.nameEn}" for new sessions; historical answers remain intact.`
      );
    }
  };

  const handleRequestDeleteCategory = (part: CategoryPartition) => {
    const report = inspectCategoryDependency(part.category.id);
    setPendingCategoryDelete({ partition: part, report });
  };

  const handleConfirmDeleteCategory = () => {
    if (!pendingCategoryDelete) return;
    const { partition } = pendingCategoryDelete;
    const res = getQuestionCatalogRepository().deleteCategory(partition.category.id, {
      confirmed: true,
      forceArchiveIfReferenced: true,
    });
    setPendingCategoryDelete(null);

    if (res.success) {
      if (selectedCategoryId === partition.category.id) {
        setSelectedCategoryId(null);
      }
      notifyParentAndRefresh(
        isAr
          ? `تم حذف الفئة المخصصة "${partition.category.nameAr}" بأمان.`
          : `Deleted custom category "${partition.category.nameEn}" safely.`
      );
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameAr.trim() || !newCatNameEn.trim()) {
      setNewCatError(
        isAr
          ? 'يرجى إدخال اسم الفئة بالعربية والإنجليزية.'
          : 'Please enter the category name in both Arabic and English.'
      );
      return;
    }

    const res = getQuestionCatalogRepository().createCategory({
      nameAr: newCatNameAr.trim(),
      nameEn: newCatNameEn.trim(),
      descriptionAr: newCatDescAr.trim(),
      descriptionEn: newCatDescEn.trim(),
      iconKey: newCatIcon,
      initialQuestion: {
        titleAr: newCatQTitleAr.trim() || `ما هو تفضيلك في ${newCatNameAr.trim()}؟`,
        titleEn: newCatQTitleEn.trim() || `What is your favorite ${newCatNameEn.trim()} choice?`,
      },
    });

    if (!res.success || !res.partition) {
      setNewCatError(
        isAr
          ? res.errorAr || 'تعذر إنشاء الفئة الجديدة.'
          : res.errorEn || 'Could not create new category.'
      );
      return;
    }

    setIsAddCategoryOpen(false);
    setNewCatNameAr('');
    setNewCatNameEn('');
    setNewCatDescAr('');
    setNewCatDescEn('');
    setNewCatQTitleAr('');
    setNewCatQTitleEn('');
    setNewCatIcon('sparkles');
    setNewCatError(null);

    notifyParentAndRefresh(
      isAr
        ? `تم إنشاء فئة "${res.partition.category.nameAr}" بمعرّف ثابت (${res.partition.category.id}).`
        : `Created category "${res.partition.category.nameEn}" (${res.partition.category.id}).`
    );
    setSelectedCategoryId(res.partition.category.id);
  };

  const handleConfirmRestoreAllDefaults = () => {
    getQuestionCatalogRepository().restoreAllDefaults();
    setConfirmRestoreAllOpen(false);
    setSelectedCategoryId(null);
    onDirtyStateChange?.(false);
    notifyParentAndRefresh(
      isAr
        ? 'تمت استعادة جميع الفئات والأسئلة الـ 15 الافتراضية بنجاح دون حذف إجابات المستخدمين.'
        : 'Restored all 15 original seed categories, questions, and options without altering user answers.'
    );
  };

  // ============================================================================
  // Dedicated Single-Category Management Workspace
  // ============================================================================
  if (selectedPartition) {
    return (
      <AdminCategoryEditor
        partition={selectedPartition}
        allQuestionIdsInCatalog={allQuestionIdsInCatalog}
        language={language}
        onBack={() => {
          onDirtyStateChange?.(false);
          setSelectedCategoryId(null);
        }}
        onSaved={(_updated, msg) => {
          notifyParentAndRefresh(msg);
        }}
        onDirtyChange={onDirtyStateChange}
      />
    );
  }

  const { questionnaire } = snapshot;

  return (
    <div className="space-y-8">
      {/* Section Header + Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold text-[#778078] dark:text-slate-400">
            {isAr
              ? 'إدارة مرنة ومستقلة لكل فئة من فئات الاستبيان بدون تعديل الكود ودون التأثير على الفئات الأخرى'
              : 'Manage every questionnaire category, question, and option independently without touching code or other categories'}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#202923] dark:text-white mt-1">
            {isAr
              ? 'إدارة الفئات وأسئلة الاستبيان'
              : 'Category-Based Question Management'}
          </h2>
        </div>

        {/* Mode Switcher: Category Management vs Response Analytics */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/80 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setViewMode('management')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'management'
                ? 'bg-[#0B5D3B] text-white'
                : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
            }`}
          >
            {isAr ? 'إدارة الفئات والأسئلة' : 'Manage Categories'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-[#0B5D3B] text-white'
                : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
            }`}
          >
            {isAr ? 'إحصاءات الإجابات والأوزان' : 'Response Analytics'}
          </button>
        </div>
      </div>

      {/* Honest Browser-Local Demo Persistence Notice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 text-[#202923] dark:text-slate-200">
          <HardDrive size={16} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">
              {isAr
                ? 'التخزين التجريبي المحلي في المتصفح (Browser-Local Demo Persistence): '
                : 'Browser-Local Demo Persistence: '}
            </strong>
            <span className="text-[#778078] dark:text-slate-400">
              {isAr
                ? 'تُحفظ تعديلات كل فئة في مفتاح مستقل داخل متصفحك وتستمر بعد التحديث والتنقل، لكنها لا تتزامن عبر الأجهزة الأخرى حتى ربط قاعدة البيانات الإنتاجية. تبقى الأسئلة الأصلية محفوظة دائماً ويمكن استعادتها في أي وقت.'
                : 'Changes are saved per category in this browser’s localStorage across navigation and page reloads, and are not synced across devices or external users yet. Original defaults remain untouched and restorable.'}
            </span>
          </div>
        </div>

        {modificationSummary.hasAnyLocalChanges && (
          <button
            type="button"
            onClick={() => setConfirmRestoreAllOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#B45309] dark:text-[#FBBF24] hover:border-[#D4AF37] inline-flex items-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>{isAr ? 'استعادة كل الإعدادات الافتراضية' : 'Restore All Defaults'}</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {statusBanner && (
        <div className="p-3.5 rounded-xl bg-[#EEF8F2] dark:bg-[#13251B] border border-[#0B5D3B]/30 dark:border-[#10B981]/30 flex items-center justify-between gap-3 text-xs text-[#08422A] dark:text-[#DDF3E7]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-[11px] font-bold underline shrink-0 cursor-pointer"
          >
            {isAr ? 'إخفاء' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 1: FLEXIBLE CATEGORY-BASED QUESTION MANAGEMENT                       */}
      {/* ======================================================================== */}
      {viewMode === 'management' && (
        <div className="space-y-6">
          {/* Catalog KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'إجمالي الفئات المستقلة' : 'Total Categories'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {catalogMetrics.totalCategories}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'الفئات المفعّلة' : 'Enabled Categories'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#0B5D3B] dark:text-[#34D399] mt-1 block">
                {catalogMetrics.enabledCategories} / {catalogMetrics.totalCategories}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'الأسئلة النشطة للمستخدم' : 'Active User Questions'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {catalogMetrics.activeQuestions} / {catalogMetrics.totalQuestions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'الخيارات النشطة' : 'Active Options'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {catalogMetrics.activeOptions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 col-span-2 lg:col-span-1">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'فئات معدلة محلياً' : 'Locally Customized'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {catalogMetrics.modifiedCount}
              </span>
            </div>
          </div>

          {/* Search, Status Filter & Add Category Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={15}
                  className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[#778078]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث عن فئة أو سؤال أو خيار (عربي / إنجليزي)...'
                      : 'Search category, question, or option (AR / EN)...'
                  }
                  className="w-full h-10 ps-10 pe-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200/80 dark:border-slate-800 self-start">
                {(
                  [
                    { id: 'all' as const, labelAr: 'الكل', labelEn: 'All' },
                    { id: 'enabled' as const, labelAr: 'مفعّل', labelEn: 'Enabled' },
                    { id: 'disabled' as const, labelAr: 'معطّل', labelEn: 'Disabled' },
                    { id: 'modified' as const, labelAr: 'معدّل', labelEn: 'Modified' },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      filterMode === tab.id
                        ? 'bg-[#0B5D3B] text-white'
                        : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
                    }`}
                  >
                    {isAr ? tab.labelAr : tab.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                className="h-10 px-3.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EEF8F2] dark:bg-[#111813] dark:hover:bg-[#1B271F] border border-[#0B5D3B]/30 dark:border-[#34D399]/35 text-[#0B5D3B] dark:text-[#34D399] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Copy size={14} />
                <span>{isAr ? 'نسخ جميع الأسئلة (AR / EN)' : 'Copy All Questions (AR / EN)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewCatError(null);
                  setIsAddCategoryOpen(true);
                }}
                className="h-10 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus size={15} className="text-[#D4AF37]" />
                <span>{isAr ? 'إضافة فئة جديدة' : 'Add Category'}</span>
              </button>
            </div>
          </div>

          {/* Independent Category Cards Directory */}
          {filteredPartitions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-bold text-[#202923] dark:text-white">
                {isAr
                  ? 'لا توجد فئات مطابقة لخيارات البحث أو التصفية الحالية.'
                  : 'No categories match your current search or filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
                className="text-xs font-bold text-[#0B5D3B] dark:text-[#34D399] underline cursor-pointer"
              >
                {isAr ? 'إظهار جميع الفئات' : 'Show all categories'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPartitions.map((part) => {
                const { category, questions } = part;
                const globalIdx = partitions.findIndex(
                  (p) => p.category.id === category.id
                );
                const enabledQCount = questions.filter((q) => q.isEnabled !== false).length;
                const totalOptsCount = questions.reduce(
                  (sum, q) => sum + q.options.length,
                  0
                );
                const isModified =
                  !category.isBuiltIn || isCategoryCustomizedInStorage(category.id);

                return (
                  <div
                    key={category.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      category.isEnabled
                        ? 'bg-white dark:bg-[#162019] border-slate-200/90 dark:border-slate-800'
                        : 'bg-[#FAF8F2] dark:bg-[#121814] border-dashed border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {/* Left Info Block */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/70 dark:border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <RealisticIcon iconKey={category.iconKey} size={22} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Clean Unboxed Metadata Line (Zero Static Pills) */}
                        <div className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400 flex flex-wrap items-center gap-x-1.5">
                          <span>{String(globalIdx + 1).padStart(2, '0')}.</span>
                          <span aria-hidden="true">·</span>
                          <span dir="ltr">{category.id}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              category.isEnabled
                                ? 'text-[#0B5D3B] dark:text-[#34D399] font-sans font-bold'
                                : 'text-slate-500 font-sans font-bold'
                            }
                          >
                            {category.isEnabled
                              ? isAr
                                ? 'مفعّلة'
                                : 'Enabled'
                              : isAr
                              ? 'معطّلة'
                              : 'Disabled'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {enabledQCount}/{questions.length}{' '}
                            {isAr ? 'أسئلة' : 'questions'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {totalOptsCount} {isAr ? 'خيارات' : 'options'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {category.isBuiltIn
                              ? isAr
                                ? 'فئة أساسية'
                                : 'Built-in'
                              : isAr
                              ? 'فئة مخصصة'
                              : 'Custom'}
                          </span>
                          {isModified && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans font-bold text-[#B45309] dark:text-[#FBBF24]">
                                {isAr ? 'معدّلة محلياً' : 'Modified locally'}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="text-base font-extrabold text-[#202923] dark:text-white">
                            {isAr ? category.nameAr : category.nameEn}
                          </h3>
                          <span className="text-xs text-[#778078] dark:text-slate-400">
                            ({isAr ? category.nameEn : category.nameAr})
                          </span>
                        </div>

                        {(category.descriptionAr || category.descriptionEn) && (
                          <p className="text-xs text-[#5C665E] dark:text-slate-400 leading-relaxed line-clamp-2">
                            {isAr
                              ? category.descriptionAr || category.descriptionEn
                              : category.descriptionEn || category.descriptionAr}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Action Controls: Reorder, Preview, Enable/Disable, Delete, Manage */}
                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Reorder Controls */}
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={globalIdx <= 0}
                          onClick={() => handleMoveCategory(category.id, -1)}
                          title={isAr ? 'تحريك الفئة للأعلى' : 'Move category up'}
                          aria-label={isAr ? 'تحريك الفئة للأعلى' : 'Move category up'}
                          className="w-8 h-8 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={globalIdx < 0 || globalIdx >= partitions.length - 1}
                          onClick={() => handleMoveCategory(category.id, 1)}
                          title={isAr ? 'تحريك الفئة للأسفل' : 'Move category down'}
                          aria-label={isAr ? 'تحريك الفئة للأسفل' : 'Move category down'}
                          className="w-8 h-8 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Quick Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewPartition(part)}
                        className="h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-slate-200 hover:border-[#0B5D3B] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} className="text-[#0B5D3B] dark:text-[#34D399]" />
                        <span>{isAr ? 'معاينة' : 'Preview'}</span>
                      </button>

                      {/* Enable / Disable */}
                      <button
                        type="button"
                        onClick={() => handleToggleCategoryEnabled(part)}
                        className="h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-slate-200 hover:border-[#0B5D3B] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {category.isEnabled ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>
                          {category.isEnabled
                            ? isAr
                              ? 'تعطيل'
                              : 'Disable'
                            : isAr
                            ? 'تفعيل'
                            : 'Enable'}
                        </span>
                      </button>

                      {/* Delete / Dependency Check */}
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteCategory(part)}
                        title={
                          category.isBuiltIn
                            ? isAr
                              ? 'فحص ارتباطات الفئة الأساسية'
                              : 'Inspect built-in category dependencies'
                            : isAr
                            ? 'حذف الفئة المخصصة'
                            : 'Delete custom category'
                        }
                        aria-label={isAr ? 'حذف الفئة' : 'Delete category'}
                        className="w-9 h-9 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-300 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Open Dedicated Category Panel */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className="h-9 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <SlidersHorizontal size={13} className="text-[#D4AF37]" />
                        <span>{isAr ? 'إدارة الفئة' : 'Manage Category'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 2: RESPONSE & WEIGHT ANALYTICS (PRESERVING EXISTING ANALYTICS VIEW)  */}
      {/* ======================================================================== */}
      {viewMode === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'إجمالي الأسئلة النشطة' : 'Active Questions'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {questionnaire.totalQuestions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'فئات الاهتمامات' : 'Question Categories'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {questionnaire.totalCategories}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'إجمالي الخيارات المتاحة' : 'Total Answer Options'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {questionnaire.totalOptionsAvailable}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'فردي مقابل متعدد' : 'Single / Multi-Select'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white mt-1 block">
                {questionnaire.singleSelectCount} / {questionnaire.multiSelectCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 col-span-2 lg:col-span-1">
              <span className="text-xs text-[#778078] dark:text-slate-400 block">
                {isAr ? 'معدل الإجابة التجريبي' : 'Demo Completion Rate'}
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#0B5D3B] dark:text-[#34D399] mt-1 block">
                {questionnaire.overallCompletionRatePercent}%
              </span>
            </div>
          </div>

          {/* Category Summary Matrix */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#202923] dark:text-white">
                {isAr
                  ? 'توزيع الفئات وأوزان خوارزمية التطابق'
                  : 'Category Weights & Response Coverage'}
              </h3>
              <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'الأوزان المعتمدة في matchingService.ts عبر الفئات النشطة'
                  : 'Authoritative compatibility weights across active categories'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {questionnaire.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#121A15] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#202923] dark:text-white truncate">
                      {isAr ? cat.labelAr : cat.labelEn}
                    </div>
                    <div className="text-[11px] text-[#778078] dark:text-slate-400 font-mono tabular-nums mt-0.5">
                      <span>{cat.category}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>
                        {cat.totalOptionsCount} {isAr ? 'خيارات' : 'opts'}
                      </span>
                    </div>
                  </div>

                  <div className="text-end font-mono tabular-nums shrink-0">
                    <div className="text-xs font-extrabold text-[#0B5D3B] dark:text-[#34D399]">
                      {cat.responseRatePercent}% {isAr ? 'مُجاب' : 'answered'}
                    </div>
                    <div className="text-[11px] text-[#778078] dark:text-slate-400">
                      {isAr ? 'الوزن:' : 'Weight:'} {cat.weightPercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Per-Question Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-[#202923] dark:text-white">
                {isAr
                  ? 'تفاصيل الأسئلة وتوزيع اختيارات الحسابات التجريبية'
                  : 'Question-by-Question Demo Option Distribution'}
              </h3>
              <span className="text-xs text-[#778078] dark:text-slate-400">
                {isAr
                  ? 'اضغط على أي سؤال لعرض خياراته'
                  : 'Select a question to inspect options'}
              </span>
            </div>

            {questionnaire.questions.map((qs) => {
              const isOpen = expandedQuestionId === qs.question.id;
              return (
                <div
                  key={qs.question.id}
                  className="rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestionId(isOpen ? null : qs.question.id)
                    }
                    className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start hover:bg-[#FAF9F5] dark:hover:bg-[#1B271F] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/70 dark:border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <RealisticIcon
                          name={qs.question.options[0]?.iconKey || 'coffee'}
                          size={22}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-[#202923] dark:text-white">
                          <span className="font-mono tabular-nums text-[#778078] me-1.5">
                            {String(qs.index).padStart(2, '0')}.
                          </span>
                          {isAr ? qs.question.titleAr : qs.question.titleEn}
                        </div>
                        <div className="text-xs text-[#778078] dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                          <span>{qs.question.id}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>
                            {qs.isMultiSelect
                              ? isAr
                                ? `متعدد (حتى ${qs.maxSelect})`
                                : `Multi-select (max ${qs.maxSelect})`
                              : isAr
                              ? 'اختيار فردي'
                              : 'Single-select'}
                          </span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>
                            {qs.optionsCount} {isAr ? 'خيارات متاحة' : 'options'}
                          </span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>
                            {isAr ? 'الوزن' : 'Weight'} {qs.weightPercent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center shrink-0 font-mono tabular-nums">
                      <div className="text-end">
                        <div className="text-sm font-extrabold text-[#0B5D3B] dark:text-[#34D399]">
                          {qs.respondedUsersCount}/{qs.totalDemoUsers} (
                          {qs.responseRatePercent}%)
                        </div>
                        <div className="text-[11px] text-[#778078] dark:text-slate-400">
                          {isAr ? 'معدل استجابة تجريبي' : 'demo responses'}
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-[#778078]" />
                      ) : (
                        <ChevronDown size={18} className="text-[#778078]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 bg-[#FAF9F5]/60 dark:bg-[#121A15]/60">
                      {qs.optionStats.map((opt) => (
                        <div
                          key={opt.optionId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1.5"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-[#202923] dark:text-white">
                              {isAr ? opt.labelAr : opt.labelEn}
                            </span>
                            <span className="text-[#778078] dark:text-slate-400 font-mono ms-2">
                              ({opt.optionId})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                            <div className="w-28 h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  opt.isNoneOrNa
                                    ? 'bg-slate-400'
                                    : 'bg-[#0B5D3B] dark:bg-[#10B981]'
                                }`}
                                style={{
                                  width: `${Math.min(100, opt.selectionPercent)}%`,
                                }}
                              />
                            </div>
                            <span className="font-bold text-[#202923] dark:text-white min-w-[78px] text-end">
                              {opt.selectionCount} ({opt.selectionPercent}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Category Preview Modal */}
      {previewPartition && (
        <AdminCategoryPreviewModal
          isOpen={Boolean(previewPartition)}
          category={previewPartition.category}
          questions={previewPartition.questions}
          initialLanguage={language}
          onClose={() => setPreviewPartition(null)}
        />
      )}

      {/* Copyable All Questions Modal (Arabic & English) */}
      <AdminCopyableQuestionsModal
        isOpen={isCopyModalOpen}
        partitions={partitions}
        language={language}
        onClose={() => setIsCopyModalOpen(false)}
      />

      {/* Create New Category Modal */}
      {isAddCategoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAddCategoryOpen(false)}
        >
          <form
            onSubmit={handleCreateCategory}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-extrabold text-[#202923] dark:text-white">
                {isAr ? 'إضافة فئة استبيان جديدة مستقلة' : 'Add New Questionnaire Category'}
              </h3>
              <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'سيتم تخصيص معرّف ثابت ومفتاح تخزين مستقل لهذه الفئة مع سؤال ابتدائي جاهز للتحرير.'
                  : 'Creates an isolated category partition with a stable unique ID and a starter question ready to customize.'}
              </p>
            </div>

            {newCatError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                {newCatError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
                  {isAr ? 'اسم الفئة بالعربية *' : 'Category Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newCatNameAr}
                  onChange={(e) => setNewCatNameAr(e.target.value)}
                  placeholder="مثال: القراءة والبودكاست"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#202923] dark:text-slate-200">
                  {isAr ? 'اسم الفئة بالإنجليزية *' : 'Category Name (English) *'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="e.g. Reading & Podcasts"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#778078] dark:text-slate-300">
                  {isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newCatDescAr}
                  onChange={(e) => setNewCatDescAr(e.target.value)}
                  placeholder="وصف مختصر للفئة..."
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#778078] dark:text-slate-300">
                  {isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newCatDescEn}
                  onChange={(e) => setNewCatDescEn(e.target.value)}
                  placeholder="Short category description..."
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#778078] dark:text-slate-300">
                  {isAr ? 'السؤال الأول بالعربية (اختياري)' : 'Starter Question (Arabic)'}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newCatQTitleAr}
                  onChange={(e) => setNewCatQTitleAr(e.target.value)}
                  placeholder="يُنشأ تلقائياً إن تُرك فارغاً"
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#778078] dark:text-slate-300">
                  {isAr ? 'السؤال الأول بالإنجليزية (اختياري)' : 'Starter Question (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newCatQTitleEn}
                  onChange={(e) => setNewCatQTitleEn(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700 text-xs text-[#202923] dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#202923] dark:text-slate-200">
                {isAr ? 'أيقونة الفئة' : 'Category Icon'}
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200 dark:border-slate-700">
                {AVAILABLE_QUESTION_ICONS.slice(0, 24).map((ic) => (
                  <button
                    key={ic.key}
                    type="button"
                    onClick={() => setNewCatIcon(ic.key)}
                    title={isAr ? ic.labelAr : ic.labelEn}
                    className={`h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                      newCatIcon === ic.key
                        ? 'bg-[#EEF8F2] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#34D399]'
                        : 'border-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <RealisticIcon iconKey={ic.key} size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إنشاء الفئة وفتح المحرر' : 'Create & Open Editor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Dependency & Deletion Confirmation Modal */}
      {pendingCategoryDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPendingCategoryDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#202923] dark:text-white">
                  {pendingCategoryDelete.report.isBuiltIn
                    ? isAr
                      ? 'فئة أساسية محمية من الحذف النهائي'
                      : 'Built-In Category Dependency Protection'
                    : isAr
                    ? 'تأكيد حذف الفئة المخصصة'
                    : 'Confirm Custom Category Deletion'}
                </h4>
                <div className="text-xs font-mono text-[#778078] dark:text-slate-400">
                  {isAr
                    ? pendingCategoryDelete.partition.category.nameAr
                    : pendingCategoryDelete.partition.category.nameEn}{' '}
                  ({pendingCategoryDelete.partition.category.id})
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#111813] border border-slate-200/80 dark:border-slate-800 text-xs text-[#202923] dark:text-slate-200 leading-relaxed">
              {isAr
                ? pendingCategoryDelete.report.warningAr
                : pendingCategoryDelete.report.warningEn}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingCategoryDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              {pendingCategoryDelete.partition.category.isEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCategoryEnabled(pendingCategoryDelete.partition);
                    setPendingCategoryDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'تعطيل الفئة بدلاً من الحذف' : 'Disable Category Instead'}
                </button>
              )}

              {!pendingCategoryDelete.report.isBuiltIn && (
                <button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'تأكيد حذف الفئة' : 'Delete Custom Category'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore All Defaults Confirmation Modal */}
      {confirmRestoreAllOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmRestoreAllOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-extrabold text-[#202923] dark:text-white">
              {isAr
                ? 'استعادة جميع الفئات والأسئلة الافتراضية؟'
                : 'Restore All Default Categories & Questions?'}
            </h4>
            <p className="text-xs text-[#778078] dark:text-slate-300 leading-relaxed">
              {isAr
                ? 'سيؤدي هذا الإجراء إلى مسح التعديلات المحلية على الفئات وإعادة جميع الفئات والأسئلة الـ 15 الأصلية إلى حالتها الافتراضية المعتمدة، دون حذف أو تعديل ملفات وإجابات المستخدمين التجريبيين.'
                : 'This clears local catalog customizations and restores all 15 original categories, questions, and options to their seed defaults. Existing user profiles and answers remain untouched.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreAllOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#778078] dark:text-slate-300 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreAllDefaults}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'نعم، استعادة الافتراضي الكامل' : 'Restore All Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import {
  AccountMode,
  CategoryKey,
  Language,
  Question,
  QuestionCategory,
  QuestionOption,
} from '../types';
import {
  cloneCategory,
  cloneQuestion,
  DEFAULT_QUESTION_CATEGORIES,
  ONBOARDING_QUESTIONS,
} from '../data/questions';
import { MOCK_MATCHES } from '../data/mockMatches';
import { getActiveAccountMode } from '../lib/supabase';
import { getAuthService } from './authService';
import {
  ArchivedOptionRecord,
  CatalogDependencyReport,
  CatalogValidationIssue,
  CategoryPartition,
  IQuestionCatalogRepository,
  SaveCategoryResult,
} from './contracts';
import { DEFAULT_DEMO_PROFILE, loadUserProfileOrDefault } from './profileService';
import { buildSystemKey, DEFAULT_DEMO_USER_ID } from './storageNamespace';

/**
 * Category-Based Question Catalog Management Service (TWIN)
 *
 * Key Architectural Guarantees:
 * 1. Strict Category Isolation: Every category is persisted in its own scoped
 *    localStorage partition (`twin:v2:demo:sys:question_catalog:cat:<categoryId>`).
 *    Editing Sports never touches Coffee, Refreshing Drinks, or any other category.
 * 2. Immutable Seed Defaults: Original categories, questions, and options from
 *    `src/data/questions.ts` remain deeply frozen in memory and can always be restored
 *    per-category or globally after confirmation.
 * 3. Stable Unique IDs: Category, question, and option IDs are assigned once and
 *    never regenerated when wording, descriptions, icons, or display order change.
 * 4. Historical Answer Safety: Dependency checks inspect local demo sessions,
 *    mock candidates, and the 90%/95% benchmark scenarios before removal. Removed
 *    questions/options are retained in per-category archive metadata so existing
 *    user/demo answers are never deleted, corrupted, or left with broken raw IDs.
 */

export const QUESTION_CATALOG_SCHEMA_VERSION = 2;

export const CATALOG_INDEX_STORAGE_KEY = buildSystemKey(
  'demo',
  'question_catalog:index'
);

export function getCategoryPartitionStorageKey(categoryId: CategoryKey): string {
  const cleanId = String(categoryId || '').trim();
  if (!cleanId) {
    throw new Error('Cannot build category partition key without a valid categoryId');
  }
  return buildSystemKey('demo', `question_catalog:cat:${cleanId}`);
}

export interface CatalogIndexRecord {
  schemaVersion: number;
  orderedCategoryIds: CategoryKey[];
  customCategoryIds: CategoryKey[];
  deletedCustomCategoryIds: CategoryKey[];
  archivedCategorySnapshots?: CategoryPartition[];
  updatedAt: string;
}

export const AVAILABLE_QUESTION_ICONS: {
  key: string;
  labelEn: string;
  labelAr: string;
}[] = [
  { key: 'coffee', labelEn: 'Coffee', labelAr: 'قهوة' },
  { key: 'glass-water', labelEn: 'Cold Drink', labelAr: 'مشروب بارد' },
  { key: 'cup-soda', labelEn: 'Tea / Cup', labelAr: 'كوب / شاي' },
  { key: 'citrus', labelEn: 'Juice / Citrus', labelAr: 'عصير طازج' },
  { key: 'utensils', labelEn: 'Dining', labelAr: 'مطاعم وأطباق' },
  { key: 'pizza', labelEn: 'Pizza', labelAr: 'بيتزا' },
  { key: 'fish', labelEn: 'Sushi / Seafood', labelAr: 'سوشي وبحريات' },
  { key: 'salad', labelEn: 'Healthy Bowl', labelAr: 'طعام صحي' },
  { key: 'activity', labelEn: 'Racket / Padel', labelAr: 'بادل ونشاط' },
  { key: 'dumbbell', labelEn: 'Gym & Fitness', labelAr: 'نادي ولياقة' },
  { key: 'trophy', labelEn: 'Trophy / League', labelAr: 'بطولات وكأس' },
  { key: 'footprints', labelEn: 'Running', labelAr: 'جري ومشي' },
  { key: 'waves', labelEn: 'Sea & Swimming', labelAr: 'بحر وسباحة' },
  { key: 'compass', labelEn: 'Explore / Trails', labelAr: 'استكشاف' },
  { key: 'mountain', labelEn: 'Mountains', labelAr: 'جبال وطبيعة' },
  { key: 'plane', labelEn: 'Travel', labelAr: 'سفر وطيران' },
  { key: 'globe', labelEn: 'Global Cities', labelAr: 'مدن عالمية' },
  { key: 'landmark', labelEn: 'Heritage', labelAr: 'تراث ومعالم' },
  { key: 'camera', labelEn: 'Photography', labelAr: 'تصوير' },
  { key: 'book', labelEn: 'Reading', labelAr: 'قراءة وكتب' },
  { key: 'code', labelEn: 'Coding', labelAr: 'برمجة' },
  { key: 'puzzle', labelEn: 'Strategy / Chess', labelAr: 'شطرنج وألغاز' },
  { key: 'palette', labelEn: 'Art & Design', labelAr: 'فنون وتصميم' },
  { key: 'film', labelEn: 'Cinema', labelAr: 'سينما وأفلام' },
  { key: 'gamepad', labelEn: 'Gaming', labelAr: 'ألعاب فيديو' },
  { key: 'headphones', labelEn: 'Podcasts', labelAr: 'بودكاست وصوتيات' },
  { key: 'music', labelEn: 'Music', labelAr: 'موسيقى' },
  { key: 'tv', labelEn: 'Series & TV', labelAr: 'مسلسلات وشاشة' },
  { key: 'ticket', labelEn: 'Events', labelAr: 'تذاكر وفعاليات' },
  { key: 'car', labelEn: 'Cars', labelAr: 'سيارات' },
  { key: 'cpu', labelEn: 'Tech & AI', labelAr: 'تقنية وذكاء' },
  { key: 'smartphone', labelEn: 'Mobile App', labelAr: 'تطبيق جوال' },
  { key: 'laptop', labelEn: 'Work & Creator', labelAr: 'لابتوب وإنتاجية' },
  { key: 'sun', labelEn: 'Morning / Sun', labelAr: 'صباح وشمس' },
  { key: 'moon', labelEn: 'Night / Calm', labelAr: 'مساء وهدوء' },
  { key: 'clock', labelEn: 'Routine', labelAr: 'توقيت وروتين' },
  { key: 'sparkles', labelEn: 'Sparkles', labelAr: 'تألق وإلهام' },
  { key: 'flame', labelEn: 'Flame / Energy', labelAr: 'حماس وشبة نار' },
  { key: 'zap', labelEn: 'Energy Kick', labelAr: 'طاقة سريعة' },
  { key: 'leaf', labelEn: 'Nature / Matcha', labelAr: 'طبيعة وماتشا' },
  { key: 'users', labelEn: 'Social Group', labelAr: 'اجتماعي وجمعات' },
  { key: 'smile', labelEn: 'Chill Vibe', labelAr: 'رايق وابتسامة' },
  { key: 'heart', labelEn: 'Favorite', labelAr: 'مفضل وقلب' },
  { key: 'trending-up', labelEn: 'Ambition', labelAr: 'طموح وتطور' },
  { key: 'message-circle', labelEn: 'Conversations', labelAr: 'حوارات' },
  { key: 'shield', labelEn: 'Strength / 4x4', labelAr: 'قوة وحماية' },
  { key: 'battery-charging', labelEn: 'Electric / EV', labelAr: 'كهربائي وذكي' },
  { key: 'navigation', labelEn: 'City Practical', labelAr: 'عملي للمدينة' },
  { key: 'award', labelEn: 'Specialty', labelAr: 'تميز' },
  { key: 'ban', labelEn: 'None / N/A', labelAr: 'لا يوجد / غير منطبق' },
];

const LEGACY_OPTION_KEY_MAP: Record<string, string> = {
  leisure_cafe: 'leisure_boutique_lounge',
  place_cozycafe: 'place_modern_walk',
  lifestyle_nightowl: 'rhythm_night_owl',
  drink_mojito: 'drink_iced_tea',
  drink_sparkling: 'drink_mint_lemon',
};

const LEGACY_OPTION_FALLBACK_LABELS: Record<string, { en: string; ar: string }> = {
  leisure_cafe: {
    en: 'Cafe Hangout & Deep Talks with Friends',
    ar: 'جلسة مقهى وحوارات مع الأصحاب',
  },
  place_cozycafe: {
    en: 'Walkways & Lively Boulevards',
    ar: 'المماشي والأماكن الحيوية',
  },
  lifestyle_nightowl: {
    en: 'Night Owl — Love Quiet Late Nights',
    ar: 'شخص ليلي أحب هدوء الليل والسهر',
  },
  drink_mojito: {
    en: 'Iced Tea',
    ar: 'شاي مثلج أو آيس تي',
  },
  drink_sparkling: {
    en: 'Lemon Mint & Refreshing Drinks',
    ar: 'ليمون بالنعناع ومشروبات منعشة',
  },
  coffee_matcha: {
    en: 'Ceremonial Matcha Latte',
    ar: 'ماتشا احتفالية باردة',
  },
  sport_home_movies: {
    en: 'Cozy Home & Movies',
    ar: 'جلسة بيت وأفلام',
  },
  sport_sleep: {
    en: 'Pure Sleeping & Rest 😴',
    ar: 'ولا نووووووم 😴',
  },
  sport_gaming: {
    en: 'Competitive E-Sports',
    ar: 'ألعاب فيديو وبطولات إلكترونية',
  },
};

function normalizeAnswerOptionId(rawKey: string): string {
  const trimmed = String(rawKey || '').trim();
  return LEGACY_OPTION_KEY_MAP[trimmed] || trimmed;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

type CatalogChangeListener = () => void;
const catalogListeners = new Set<CatalogChangeListener>();

export function subscribeQuestionCatalog(listener: CatalogChangeListener): () => void {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

function notifyCatalogChanged(): void {
  for (const listener of catalogListeners) {
    try {
      listener();
    } catch (err) {
      console.error('Question catalog listener error:', err);
    }
  }
}

function slugifyIdSegment(input: string, fallback = 'item'): string {
  const clean = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 22);
  return clean || fallback;
}

function generateShortUniqueToken(): string {
  const timePart = Date.now().toString(36).slice(-4);
  const randPart = Math.random().toString(36).substring(2, 6);
  return `${timePart}${randPart}`;
}

export function generateStableCategoryId(
  nameEn: string,
  existingIds?: Iterable<string>
): CategoryKey {
  const used = new Set<string>(
    existingIds
      ? Array.from(existingIds)
      : DEFAULT_QUESTION_CATEGORIES.map((c) => c.id)
  );
  const slug = slugifyIdSegment(nameEn, 'category');
  let candidate = `cat_${slug}`;
  if (!used.has(candidate)) {
    return candidate;
  }
  candidate = `cat_${slug}_${generateShortUniqueToken()}`;
  while (used.has(candidate)) {
    candidate = `cat_${slug}_${generateShortUniqueToken()}`;
  }
  return candidate;
}

export function generateStableQuestionId(
  categoryId: CategoryKey,
  existingQuestionIds?: Iterable<string>
): string {
  const used = new Set<string>(existingQuestionIds ? Array.from(existingQuestionIds) : []);
  for (const q of ONBOARDING_QUESTIONS) {
    used.add(q.id);
  }
  const catSlug = slugifyIdSegment(String(categoryId).replace(/^cat_/, ''), 'custom');
  let candidate = `q_${catSlug}_${generateShortUniqueToken()}`;
  while (used.has(candidate)) {
    candidate = `q_${catSlug}_${generateShortUniqueToken()}`;
  }
  return candidate;
}

export function generateStableOptionId(
  questionId: string,
  existingOptionIds?: Iterable<string>
): string {
  const used = new Set<string>(existingOptionIds ? Array.from(existingOptionIds) : []);
  const qSlug = slugifyIdSegment(questionId.replace(/^q_/, ''), 'opt');
  let candidate = `${qSlug}_opt_${generateShortUniqueToken()}`;
  while (used.has(candidate)) {
    candidate = `${qSlug}_opt_${generateShortUniqueToken()}`;
  }
  return candidate;
}

function buildDefaultPartitionForCategory(
  category: QuestionCategory,
  orderOverride?: number
): CategoryPartition {
  const catClone = cloneCategory(category);
  if (typeof orderOverride === 'number') {
    catClone.order = orderOverride;
  }

  const questionsForCat = ONBOARDING_QUESTIONS.filter(
    (q) => (q.categoryId || q.category) === category.id
  ).map((q, idx) => {
    const cloned = cloneQuestion(q);
    cloned.category = category.id;
    cloned.categoryId = category.id;
    cloned.order = idx;
    cloned.isEnabled = true;
    cloned.isSystemDefault = true;
    return cloned;
  });

  return {
    schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
    category: catClone,
    questions: questionsForCat,
    archivedQuestions: [],
    archivedOptions: [],
    updatedAt: catClone.updatedAt || 'default_seed',
  };
}

function cloneOption(opt: QuestionOption, idx: number): QuestionOption {
  return {
    id: String(opt.id).trim(),
    labelEn: String(opt.labelEn ?? ''),
    labelAr: String(opt.labelAr ?? ''),
    iconKey: String(opt.iconKey || 'sparkles'),
    descriptionEn: opt.descriptionEn !== undefined ? String(opt.descriptionEn) : undefined,
    descriptionAr: opt.descriptionAr !== undefined ? String(opt.descriptionAr) : undefined,
    isEnabled: opt.isEnabled !== false,
    order: typeof opt.order === 'number' ? opt.order : idx,
  };
}

function clonePartition(partition: CategoryPartition): CategoryPartition {
  return {
    schemaVersion: partition.schemaVersion || QUESTION_CATALOG_SCHEMA_VERSION,
    category: { ...partition.category },
    questions: (partition.questions || []).map((q, qIdx) => ({
      ...q,
      category: partition.category.id,
      categoryId: partition.category.id,
      isEnabled: q.isEnabled !== false,
      order: typeof q.order === 'number' ? q.order : qIdx,
      options: (q.options || []).map((o, oIdx) => cloneOption(o, oIdx)),
    })),
    archivedQuestions: (partition.archivedQuestions || []).map((aq, qIdx) => ({
      ...aq,
      category: partition.category.id,
      categoryId: partition.category.id,
      order: typeof aq.order === 'number' ? aq.order : qIdx,
      options: (aq.options || []).map((o, oIdx) => cloneOption(o, oIdx)),
    })),
    archivedOptions: (partition.archivedOptions || []).map((ao) => ({
      questionId: ao.questionId,
      option: cloneOption(ao.option, 0),
      archivedAt: ao.archivedAt,
    })),
    updatedAt: partition.updatedAt,
  };
}

export function validateCategoryPartitionDraft(
  targetCategoryId: CategoryKey,
  draft: {
    category: QuestionCategory;
    questions: Question[];
  }
): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const cleanCatId = String(targetCategoryId || '').trim();

  if (!cleanCatId || !draft || !draft.category) {
    issues.push({
      field: 'category',
      messageEn: 'Category data is missing or invalid.',
      messageAr: 'بيانات الفئة غير مكتملة أو غير صالحة.',
    });
    return issues;
  }

  if (draft.category.id !== cleanCatId) {
    issues.push({
      field: 'category.id',
      messageEn: `Category ID cannot be changed (expected "${cleanCatId}").`,
      messageAr: `لا يمكن تغيير المعرّف الثابت للفئة (${cleanCatId}).`,
    });
  }

  if (!String(draft.category.nameEn || '').trim()) {
    issues.push({
      field: 'category.nameEn',
      messageEn: 'Category name in English is required.',
      messageAr: 'اسم الفئة باللغة الإنجليزية مطلوب.',
    });
  }

  if (!String(draft.category.nameAr || '').trim()) {
    issues.push({
      field: 'category.nameAr',
      messageEn: 'Category name in Arabic is required.',
      messageAr: 'اسم الفئة باللغة العربية مطلوب.',
    });
  }

  const seenQuestionIds = new Set<string>();

  (draft.questions || []).forEach((q, qIdx) => {
    const qId = String(q.id || '').trim();
    const qCatId = String(q.categoryId || q.category || '').trim();

    if (!qId) {
      issues.push({
        field: `questions[${qIdx}].id`,
        messageEn: `Question #${qIdx + 1} is missing a stable ID.`,
        messageAr: `السؤال رقم ${qIdx + 1} يفتقد المعرّف الثابت.`,
      });
    } else if (seenQuestionIds.has(qId)) {
      issues.push({
        field: `questions[${qIdx}].id`,
        questionId: qId,
        messageEn: `Duplicate question ID "${qId}" inside category.`,
        messageAr: `معرّف السؤال "${qId}" مكرر داخل نفس الفئة.`,
      });
    } else {
      seenQuestionIds.add(qId);
    }

    if (qCatId !== cleanCatId || q.category !== cleanCatId) {
      issues.push({
        field: `questions[${qIdx}].categoryId`,
        questionId: qId,
        messageEn: `Question "${qId}" belongs to "${qCatId}" and cannot be saved inside "${cleanCatId}".`,
        messageAr: `السؤال "${qId}" ينتمي لفئة أخرى ولا يمكن خلطه مع الفئة "${cleanCatId}".`,
      });
    }

    if (!String(q.titleEn || '').trim()) {
      issues.push({
        field: `questions[${qIdx}].titleEn`,
        questionId: qId,
        messageEn: `Question #${qIdx + 1}: English question text is required.`,
        messageAr: `السؤال رقم ${qIdx + 1}: نص السؤال بالإنجليزية مطلوب.`,
      });
    }

    if (!String(q.titleAr || '').trim()) {
      issues.push({
        field: `questions[${qIdx}].titleAr`,
        questionId: qId,
        messageEn: `Question #${qIdx + 1}: Arabic question text is required.`,
        messageAr: `السؤال رقم ${qIdx + 1}: نص السؤال بالعربية مطلوب.`,
      });
    }

    const opts = q.options || [];
    if (opts.length < 2) {
      issues.push({
        field: `questions[${qIdx}].options`,
        questionId: qId,
        messageEn: `Question #${qIdx + 1} must have at least 2 answer options.`,
        messageAr: `يجب أن يحتوي السؤال رقم ${qIdx + 1} على خيارين على الأقل.`,
      });
    }

    const enabledOpts = opts.filter((o) => o.isEnabled !== false);
    if (q.isEnabled !== false && enabledOpts.length < 2) {
      issues.push({
        field: `questions[${qIdx}].options`,
        questionId: qId,
        messageEn: `Enabled question #${qIdx + 1} must keep at least 2 enabled answer options.`,
        messageAr: `السؤال المفعّل رقم ${qIdx + 1} يجب أن يتضمن خيارين مفعّلين على الأقل.`,
      });
    }

    if (q.isMultiSelect) {
      const maxSel = Number(q.maxSelect ?? 2);
      if (!Number.isInteger(maxSel) || maxSel < 2) {
        issues.push({
          field: `questions[${qIdx}].maxSelect`,
          questionId: qId,
          messageEn: `Multi-select question #${qIdx + 1} must allow at least 2 selections.`,
          messageAr: `السؤال متعدد الاختيارات رقم ${qIdx + 1} يجب أن يسمح باختيارين على الأقل.`,
        });
      }
    }

    const seenOptionIds = new Set<string>();
    opts.forEach((opt, oIdx) => {
      const oId = String(opt.id || '').trim();
      if (!oId) {
        issues.push({
          field: `questions[${qIdx}].options[${oIdx}].id`,
          questionId: qId,
          messageEn: `Option #${oIdx + 1} in Question #${qIdx + 1} is missing a stable ID.`,
          messageAr: `الخيار رقم ${oIdx + 1} في السؤال رقم ${qIdx + 1} يفتقد المعرّف الثابت.`,
        });
      } else if (seenOptionIds.has(oId)) {
        issues.push({
          field: `questions[${qIdx}].options[${oIdx}].id`,
          questionId: qId,
          optionId: oId,
          messageEn: `Duplicate option ID "${oId}" in Question #${qIdx + 1}.`,
          messageAr: `معرّف الخيار "${oId}" مكرر في السؤال رقم ${qIdx + 1}.`,
        });
      } else {
        seenOptionIds.add(oId);
      }

      if (!String(opt.labelEn || '').trim()) {
        issues.push({
          field: `questions[${qIdx}].options[${oIdx}].labelEn`,
          questionId: qId,
          optionId: oId,
          messageEn: `Option #${oIdx + 1} (Question #${qIdx + 1}): English label is required.`,
          messageAr: `الخيار رقم ${oIdx + 1} (السؤال ${qIdx + 1}): النص الإنجليزي مطلوب.`,
        });
      }

      if (!String(opt.labelAr || '').trim()) {
        issues.push({
          field: `questions[${qIdx}].options[${oIdx}].labelAr`,
          questionId: qId,
          optionId: oId,
          messageEn: `Option #${oIdx + 1} (Question #${qIdx + 1}): Arabic label is required.`,
          messageAr: `الخيار رقم ${oIdx + 1} (السؤال ${qIdx + 1}): النص العربي مطلوب.`,
        });
      }
    });
  });

  return issues;
}

// ============================================================================
// Demo / User Answer Dependency Inspector
// ============================================================================

interface CollectedAnswerSource {
  id: string;
  handle: string;
  sourceKind: 'local_user' | 'mock_pool';
  answers: Record<string, string | string[]>;
}

function collectAllAnswerSources(): CollectedAnswerSource[] {
  const sources: CollectedAnswerSource[] = [];
  const seenIds = new Set<string>();

  try {
    const localAccounts = getAuthService().listDemoAccounts();
    for (const identity of localAccounts) {
      if (!identity.id || seenIds.has(identity.id)) continue;
      seenIds.add(identity.id);
      const profile = loadUserProfileOrDefault(identity.id);
      sources.push({
        id: profile.id,
        handle: `@${profile.username}`,
        sourceKind: 'local_user',
        answers: profile.answers || {},
      });
    }
  } catch {
    // Fallback to default demo user if auth listing fails
  }

  if (!seenIds.has(DEFAULT_DEMO_USER_ID)) {
    seenIds.add(DEFAULT_DEMO_USER_ID);
    const defaultProfile = loadUserProfileOrDefault(DEFAULT_DEMO_USER_ID);
    sources.push({
      id: defaultProfile.id,
      handle: `@${defaultProfile.username}`,
      sourceKind: 'local_user',
      answers: defaultProfile.answers || DEFAULT_DEMO_PROFILE.answers,
    });
  }

  for (const mock of MOCK_MATCHES) {
    if (seenIds.has(mock.id)) continue;
    seenIds.add(mock.id);
    sources.push({
      id: mock.id,
      handle: `@${mock.username}`,
      sourceKind: 'mock_pool',
      answers: mock.answers || {},
    });
  }

  return sources;
}

function extractNormalizedAnswerOptionIds(
  val: string | string[] | undefined
): string[] {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [String(val)];
  return arr
    .map((item) => normalizeAnswerOptionId(item))
    .filter((item) => item.length > 0);
}

const BUILT_IN_CATEGORY_IDS = new Set<string>(
  DEFAULT_QUESTION_CATEGORIES.map((c) => c.id)
);
const BUILT_IN_QUESTION_IDS = new Set<string>(
  ONBOARDING_QUESTIONS.map((q) => q.id)
);

export function inspectOptionDependency(
  questionId: string,
  optionId: string
): CatalogDependencyReport {
  const normalizedTarget = normalizeAnswerOptionId(optionId);
  const sources = collectAllAnswerSources();

  let localUserCount = 0;
  let mockPoolCount = 0;
  const handles: string[] = [];

  for (const src of sources) {
    const rawAns = src.answers[questionId];
    const rawList = Array.isArray(rawAns)
      ? rawAns.map((x) => String(x).trim())
      : rawAns
      ? [String(rawAns).trim()]
      : [];
    const normalizedList = extractNormalizedAnswerOptionIds(rawAns);

    if (rawList.includes(optionId) || normalizedList.includes(normalizedTarget)) {
      handles.push(src.handle);
      if (src.sourceKind === 'local_user') localUserCount += 1;
      else mockPoolCount += 1;
    }
  }

  const defaultQ = ONBOARDING_QUESTIONS.find((q) => q.id === questionId);
  const isBuiltIn = Boolean(defaultQ?.options.some((o) => o.id === optionId));
  const defaultAns = extractNormalizedAnswerOptionIds(
    DEFAULT_DEMO_PROFILE.answers[questionId]
  );
  const affectsBenchmarkScenarios =
    BUILT_IN_QUESTION_IDS.has(questionId) &&
    (defaultAns.includes(normalizedTarget) ||
      optionId === 'tech_creative' ||
      optionId === 'watch_racket');

  const totalCount = localUserCount + mockPoolCount;

  const warningEn =
    totalCount > 0
      ? `This option ("${optionId}") is currently selected in ${totalCount} existing user/demo profile(s) (${handles.slice(0, 4).join(', ')}${handles.length > 4 ? '…' : ''}). Removing it hides it from new questionnaires, while historical answers remain safely preserved and are never deleted or reinterpreted.`
      : `No existing user or demo profiles currently reference option "${optionId}".`;

  const warningAr =
    totalCount > 0
      ? `هذا الخيار ("${optionId}") مستخدم حالياً في إجابات ${totalCount} من الحسابات التجريبية/المحلية (${handles.slice(0, 4).join('، ')}${handles.length > 4 ? '…' : ''}). إزالته تخفيه من الاستبيانات الجديدة فقط، بينما تُحفظ الإجابات السابقة بأمان دون حذف أو إعادة تفسير.`
      : `لا توجد أي إجابات حالية مرتبطة بالخيار "${optionId}".`;

  return {
    targetKind: 'option',
    targetId: optionId,
    parentQuestionId: questionId,
    isBuiltIn,
    referencedByCount: totalCount,
    referencedUserHandles: handles,
    localUserCount,
    mockPoolCount,
    affectsBenchmarkScenarios,
    canHardDelete: totalCount === 0 && !affectsBenchmarkScenarios,
    warningEn,
    warningAr,
  };
}

export function inspectQuestionDependency(
  questionId: string
): CatalogDependencyReport {
  const sources = collectAllAnswerSources();
  let localUserCount = 0;
  let mockPoolCount = 0;
  const handles: string[] = [];

  for (const src of sources) {
    const selected = extractNormalizedAnswerOptionIds(src.answers[questionId]);
    if (selected.length > 0) {
      handles.push(src.handle);
      if (src.sourceKind === 'local_user') localUserCount += 1;
      else mockPoolCount += 1;
    }
  }

  const isBuiltIn = BUILT_IN_QUESTION_IDS.has(questionId);
  const affectsBenchmarkScenarios = isBuiltIn;
  const totalCount = localUserCount + mockPoolCount;

  const warningEn =
    totalCount > 0
      ? `Question "${questionId}" has ${totalCount} recorded user/demo answer(s) (${handles.slice(0, 4).join(', ')}${handles.length > 4 ? '…' : ''})${affectsBenchmarkScenarios ? ' and participates in the 90%/95% compatibility benchmarks' : ''}. Disabling is recommended; if removed, existing answers remain untouched in profile storage and archived metadata preserves historical labels.`
      : `Question "${questionId}" has 0 recorded answers and can be safely removed.`;

  const warningAr =
    totalCount > 0
      ? `السؤال "${questionId}" مرتبط بـ ${totalCount} من إجابات المستخدمين/الحسابات التجريبية (${handles.slice(0, 4).join('، ')}${handles.length > 4 ? '…' : ''})${affectsBenchmarkScenarios ? ' ويدخل في سيناريوهات التوافق المرجعية 90% و95%' : ''}. يُنصح بتعطيل السؤال بدلاً من إزالته؛ وعند الإزالة تظل الإجابات المخزنة محفوظة دون تغيير.`
      : `لا توجد أي إجابات مسجلة على السؤال "${questionId}" ويمكن حذفه بأمان.`;

  return {
    targetKind: 'question',
    targetId: questionId,
    isBuiltIn,
    referencedByCount: totalCount,
    referencedUserHandles: handles,
    localUserCount,
    mockPoolCount,
    affectsBenchmarkScenarios,
    canHardDelete: totalCount === 0 && !isBuiltIn,
    warningEn,
    warningAr,
  };
}

export function inspectCategoryDependency(
  categoryId: CategoryKey
): CatalogDependencyReport {
  const repo = getQuestionCatalogRepository();
  const partition = repo.getCategoryPartition(categoryId);
  const isBuiltIn = BUILT_IN_CATEGORY_IDS.has(categoryId);

  const questionIds = new Set<string>();
  if (partition) {
    for (const q of partition.questions) questionIds.add(q.id);
    for (const aq of partition.archivedQuestions) questionIds.add(aq.id);
  }
  for (const dq of ONBOARDING_QUESTIONS) {
    if ((dq.categoryId || dq.category) === categoryId) {
      questionIds.add(dq.id);
    }
  }

  const sources = collectAllAnswerSources();
  let localUserCount = 0;
  let mockPoolCount = 0;
  const handles: string[] = [];

  for (const src of sources) {
    let userHasAnyInCat = false;
    for (const qid of questionIds) {
      if (extractNormalizedAnswerOptionIds(src.answers[qid]).length > 0) {
        userHasAnyInCat = true;
        break;
      }
    }
    if (userHasAnyInCat) {
      handles.push(src.handle);
      if (src.sourceKind === 'local_user') localUserCount += 1;
      else mockPoolCount += 1;
    }
  }

  const totalCount = localUserCount + mockPoolCount;
  const affectsBenchmarkScenarios = isBuiltIn;
  const canHardDelete = !isBuiltIn;

  let warningEn: string;
  let warningAr: string;

  if (isBuiltIn) {
    warningEn = `Built-in category "${categoryId}" is referenced by ${totalCount} demo/user profile(s) and underpins the core 90% & 95% compatibility scenarios. Built-in categories cannot be permanently destroyed; disable this category instead to hide it from new user questionnaires while keeping historical compatibility data intact.`;
    warningAr = `الفئة الأساسية "${categoryId}" مرتبطة بـ ${totalCount} من الحسابات التجريبية وتدخل في حسابات التوافق المرجعية (90% و95%). لحماية البيانات الحالية لا يتم حذف الفئات الأساسية نهائياً؛ يمكنك تعطيل الفئة لإخفائها من الاستبيانات الجديدة مع الحفاظ الكامل على سجل الإجابات.`;
  } else if (totalCount > 0) {
    warningEn = `Custom category "${categoryId}" has ${totalCount} local user profile(s) with recorded answers (${handles.slice(0, 4).join(', ')}). Deleting this category removes it from active questionnaires, while historical user answers and archived labels are preserved without data loss.`;
    warningAr = `الفئة المخصصة "${categoryId}" تحتوي على إجابات مسجلة لدى ${totalCount} من المستخدمين المحليين (${handles.slice(0, 4).join('، ')}). حذف الفئة يزيلها من الاستبيانات الجديدة مع الاحتفاظ بالإجابات السابقة في أرشيف آمن دون فقدان للبيانات.`;
  } else {
    warningEn = `Custom category "${categoryId}" has 0 recorded user or demo answers and is safe to delete.`;
    warningAr = `الفئة المخصصة "${categoryId}" لا تحتوي على أي إجابات مسجلة لدى المستخدمين ويمكن حذفها بأمان.`;
  }

  return {
    targetKind: 'category',
    targetId: categoryId,
    isBuiltIn,
    referencedByCount: totalCount,
    referencedUserHandles: handles,
    localUserCount,
    mockPoolCount,
    affectsBenchmarkScenarios,
    canHardDelete,
    warningEn,
    warningAr,
  };
}

// ============================================================================
// Browser-Local Demo Repository Implementation (Strictly Isolated Per Category)
// ============================================================================

class DemoLocalQuestionCatalogRepository implements IQuestionCatalogRepository {
  readonly mode: AccountMode = 'demo';
  readonly persistenceScope = 'browser_local_demo' as const;

  private readIndex(): CatalogIndexRecord {
    const defaultIds = DEFAULT_QUESTION_CATEGORIES.map((c) => c.id);
    const storage = getStorage();
    if (!storage) {
      return {
        schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
        orderedCategoryIds: [...defaultIds],
        customCategoryIds: [],
        deletedCustomCategoryIds: [],
        archivedCategorySnapshots: [],
        updatedAt: 'default_seed',
      };
    }

    try {
      const raw = storage.getItem(CATALOG_INDEX_STORAGE_KEY);
      if (!raw) {
        return {
          schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
          orderedCategoryIds: [...defaultIds],
          customCategoryIds: [],
          deletedCustomCategoryIds: [],
          archivedCategorySnapshots: [],
          updatedAt: 'default_seed',
        };
      }

      const parsed = JSON.parse(raw) as Partial<CatalogIndexRecord>;
      const customIds = Array.isArray(parsed.customCategoryIds)
        ? parsed.customCategoryIds.map((id) => String(id).trim()).filter(Boolean)
        : [];
      const deletedCustomIds = new Set(
        Array.isArray(parsed.deletedCustomCategoryIds)
          ? parsed.deletedCustomCategoryIds.map((id) => String(id).trim()).filter(Boolean)
          : []
      );

      // Evict stale pre-v2 built-in catalog index so new 16-question order loads immediately
      if ((parsed.schemaVersion || 1) < QUESTION_CATALOG_SCHEMA_VERSION) {
        const activeCustomIds = customIds.filter((id) => !deletedCustomIds.has(id));
        if (activeCustomIds.length === 0) {
          storage.removeItem(CATALOG_INDEX_STORAGE_KEY);
          return {
            schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
            orderedCategoryIds: [...defaultIds],
            customCategoryIds: [],
            deletedCustomCategoryIds: [],
            archivedCategorySnapshots: [],
            updatedAt: 'default_seed',
          };
        }
      }

      const validKnownIds = new Set<string>([
        ...defaultIds,
        ...customIds.filter((id) => !deletedCustomIds.has(id)),
      ]);

      const ordered: CategoryKey[] = [];
      const seen = new Set<string>();

      if (Array.isArray(parsed.orderedCategoryIds)) {
        for (const id of parsed.orderedCategoryIds) {
          const clean = String(id || '').trim();
          if (clean && validKnownIds.has(clean) && !seen.has(clean)) {
            seen.add(clean);
            ordered.push(clean);
          }
        }
      }

      // Ensure every built-in category and active custom category is always present
      for (const id of validKnownIds) {
        if (!seen.has(id)) {
          seen.add(id);
          ordered.push(id);
        }
      }

      return {
        schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
        orderedCategoryIds: ordered,
        customCategoryIds: customIds.filter((id) => !deletedCustomIds.has(id)),
        deletedCustomCategoryIds: Array.from(deletedCustomIds),
        archivedCategorySnapshots: Array.isArray(parsed.archivedCategorySnapshots)
          ? parsed.archivedCategorySnapshots
          : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    } catch {
      return {
        schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
        orderedCategoryIds: [...defaultIds],
        customCategoryIds: [],
        deletedCustomCategoryIds: [],
        archivedCategorySnapshots: [],
        updatedAt: 'default_seed',
      };
    }
  }

  private writeIndex(index: CatalogIndexRecord): boolean {
    const storage = getStorage();
    if (!storage) return false;
    try {
      storage.setItem(CATALOG_INDEX_STORAGE_KEY, JSON.stringify(index));
      return true;
    } catch (err) {
      console.error('Failed to persist question catalog index:', err);
      return false;
    }
  }

  private readStoredPartitionRaw(categoryId: CategoryKey): CategoryPartition | null {
    const storage = getStorage();
    if (!storage) return null;

    try {
      const key = getCategoryPartitionStorageKey(categoryId);
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CategoryPartition>;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.category ||
        parsed.category.id !== categoryId ||
        !Array.isArray(parsed.questions)
      ) {
        return null;
      }

      // Evict stale pre-v2 built-in partition cache so updated seed wording & options take effect immediately
      if (
        BUILT_IN_CATEGORY_IDS.has(categoryId) &&
        (parsed.schemaVersion || 1) < QUESTION_CATALOG_SCHEMA_VERSION
      ) {
        storage.removeItem(key);
        return null;
      }

      // Enforce invariant on read: strip any foreign question that doesn't match categoryId
      const strictlyOwnedQuestions = parsed.questions.filter(
        (q) => (q.categoryId || q.category) === categoryId
      );

      return clonePartition({
        schemaVersion: parsed.schemaVersion || QUESTION_CATALOG_SCHEMA_VERSION,
        category: parsed.category,
        questions: strictlyOwnedQuestions,
        archivedQuestions: Array.isArray(parsed.archivedQuestions)
          ? parsed.archivedQuestions.filter(
              (aq) => (aq.categoryId || aq.category) === categoryId
            )
          : [],
        archivedOptions: Array.isArray(parsed.archivedOptions)
          ? parsed.archivedOptions
          : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      });
    } catch {
      return null;
    }
  }

  getCategoryPartition(categoryId: CategoryKey): CategoryPartition | null {
    const cleanId = String(categoryId || '').trim();
    if (!cleanId) return null;

    const index = this.readIndex();
    const orderIdx = index.orderedCategoryIds.indexOf(cleanId);

    const stored = this.readStoredPartitionRaw(cleanId);
    if (stored) {
      if (orderIdx >= 0) {
        stored.category.order = orderIdx;
      }
      return stored;
    }

    const seedCat = DEFAULT_QUESTION_CATEGORIES.find((c) => c.id === cleanId);
    if (seedCat) {
      return buildDefaultPartitionForCategory(
        seedCat,
        orderIdx >= 0 ? orderIdx : seedCat.order
      );
    }

    return null;
  }

  listCategoryPartitions(): CategoryPartition[] {
    const index = this.readIndex();
    const partitions: CategoryPartition[] = [];

    index.orderedCategoryIds.forEach((catId, orderIdx) => {
      const part = this.getCategoryPartition(catId);
      if (part) {
        part.category.order = orderIdx;
        partitions.push(part);
      }
    });

    return partitions;
  }

  saveCategoryPartition(
    categoryId: CategoryKey,
    draft: {
      category: QuestionCategory;
      questions: Question[];
      archivedQuestions?: Question[];
      archivedOptions?: ArchivedOptionRecord[];
    }
  ): SaveCategoryResult {
    const cleanId = String(categoryId || '').trim();
    const issues = validateCategoryPartitionDraft(cleanId, draft);
    if (issues.length > 0) {
      return {
        success: false,
        validationIssues: issues,
        errorEn: issues[0].messageEn,
        errorAr: issues[0].messageAr,
      };
    }

    const storage = getStorage();
    if (!storage) {
      return {
        success: false,
        validationIssues: [],
        errorEn: 'Browser localStorage is unavailable.',
        errorAr: 'التخزين المحلي للمتصفح غير متاح حالياً.',
      };
    }

    const existing = this.getCategoryPartition(cleanId);
    const seedCat = DEFAULT_QUESTION_CATEGORIES.find((c) => c.id === cleanId);
    const now = new Date().toISOString();

    // Preserve archived questions & options automatically if anything was removed from active list
    const mergedArchivedQuestions = new Map<string, Question>();
    for (const aq of existing?.archivedQuestions || []) {
      mergedArchivedQuestions.set(aq.id, cloneQuestion(aq));
    }
    for (const aq of draft.archivedQuestions || []) {
      if ((aq.categoryId || aq.category) === cleanId) {
        mergedArchivedQuestions.set(aq.id, cloneQuestion(aq));
      }
    }

    const nextActiveQuestionIds = new Set(draft.questions.map((q) => q.id));
    for (const prevQ of existing?.questions || []) {
      if (!nextActiveQuestionIds.has(prevQ.id)) {
        mergedArchivedQuestions.set(prevQ.id, cloneQuestion(prevQ));
      }
    }
    // If an archived question was re-added, remove it from archived list
    for (const activeId of nextActiveQuestionIds) {
      mergedArchivedQuestions.delete(activeId);
    }

    const mergedArchivedOptions = new Map<string, ArchivedOptionRecord>();
    const makeOptArchiveKey = (qId: string, optId: string) => `${qId}::${optId}`;

    for (const ao of existing?.archivedOptions || []) {
      mergedArchivedOptions.set(makeOptArchiveKey(ao.questionId, ao.option.id), {
        questionId: ao.questionId,
        option: cloneOption(ao.option, 0),
        archivedAt: ao.archivedAt,
      });
    }
    for (const ao of draft.archivedOptions || []) {
      mergedArchivedOptions.set(makeOptArchiveKey(ao.questionId, ao.option.id), {
        questionId: ao.questionId,
        option: cloneOption(ao.option, 0),
        archivedAt: ao.archivedAt,
      });
    }

    // Detect any removed options on remaining questions and archive their labels safely
    for (const prevQ of existing?.questions || []) {
      const nextQ = draft.questions.find((nq) => nq.id === prevQ.id);
      if (!nextQ) continue;
      const nextOptIds = new Set(nextQ.options.map((o) => o.id));
      for (const prevOpt of prevQ.options) {
        if (!nextOptIds.has(prevOpt.id)) {
          mergedArchivedOptions.set(makeOptArchiveKey(prevQ.id, prevOpt.id), {
            questionId: prevQ.id,
            option: cloneOption(prevOpt, 0),
            archivedAt: now,
          });
        }
      }
      for (const activeOptId of nextOptIds) {
        mergedArchivedOptions.delete(makeOptArchiveKey(prevQ.id, activeOptId));
      }
    }

    const index = this.readIndex();
    const orderIdx = index.orderedCategoryIds.indexOf(cleanId);

    const normalizedCategory: QuestionCategory = {
      id: cleanId,
      nameEn: draft.category.nameEn.trim(),
      nameAr: draft.category.nameAr.trim(),
      descriptionEn: (draft.category.descriptionEn || '').trim(),
      descriptionAr: (draft.category.descriptionAr || '').trim(),
      iconKey: draft.category.iconKey || seedCat?.iconKey || 'sparkles',
      order: orderIdx >= 0 ? orderIdx : draft.category.order ?? index.orderedCategoryIds.length,
      isEnabled: draft.category.isEnabled !== false,
      isBuiltIn: Boolean(seedCat),
      defaultWeight: seedCat?.defaultWeight ?? draft.category.defaultWeight,
      updatedAt: now,
    };

    const normalizedQuestions: Question[] = draft.questions.map((q, qIdx) => {
      const isMulti = Boolean(q.isMultiSelect);
      const cleanOpts = q.options.map((opt, oIdx) => ({
        id: opt.id.trim(),
        labelEn: opt.labelEn.trim(),
        labelAr: opt.labelAr.trim(),
        iconKey: opt.iconKey || normalizedCategory.iconKey || 'sparkles',
        descriptionEn: opt.descriptionEn?.trim() || undefined,
        descriptionAr: opt.descriptionAr?.trim() || undefined,
        isEnabled: opt.isEnabled !== false,
        order: oIdx,
      }));

      const maxSel = isMulti
        ? Math.max(2, Math.min(Number(q.maxSelect) || 3, cleanOpts.length))
        : undefined;

      return {
        id: q.id.trim(),
        category: cleanId,
        categoryId: cleanId,
        titleEn: q.titleEn.trim(),
        titleAr: q.titleAr.trim(),
        subtitleEn: q.subtitleEn?.trim() || undefined,
        subtitleAr: q.subtitleAr?.trim() || undefined,
        isMultiSelect: isMulti,
        maxSelect: maxSel,
        isEnabled: q.isEnabled !== false,
        order: qIdx,
        isSystemDefault: BUILT_IN_QUESTION_IDS.has(q.id.trim()),
        updatedAt: now,
        options: cleanOpts,
      };
    });

    const partitionToSave: CategoryPartition = {
      schemaVersion: QUESTION_CATALOG_SCHEMA_VERSION,
      category: normalizedCategory,
      questions: normalizedQuestions,
      archivedQuestions: Array.from(mergedArchivedQuestions.values()),
      archivedOptions: Array.from(mergedArchivedOptions.values()),
      updatedAt: now,
    };

    try {
      // CRITICAL ISOLATION GUARANTEE:
      // Write ONLY the storage key belonging to `cleanId`. No other category key is touched.
      storage.setItem(
        getCategoryPartitionStorageKey(cleanId),
        JSON.stringify(partitionToSave)
      );

      // Register in index ONLY if it's a brand-new custom category not yet listed
      if (!index.orderedCategoryIds.includes(cleanId)) {
        const nextIndex: CatalogIndexRecord = {
          ...index,
          orderedCategoryIds: [...index.orderedCategoryIds, cleanId],
          customCategoryIds: Array.from(new Set([...index.customCategoryIds, cleanId])),
          deletedCustomCategoryIds: index.deletedCustomCategoryIds.filter((id) => id !== cleanId),
          updatedAt: now,
        };
        this.writeIndex(nextIndex);
      }

      notifyCatalogChanged();
      return {
        success: true,
        partition: clonePartition(partitionToSave),
        validationIssues: [],
      };
    } catch (err) {
      console.error(`Failed to save category partition "${cleanId}":`, err);
      return {
        success: false,
        validationIssues: [],
        errorEn: 'Failed to write category data to local storage.',
        errorAr: 'تعذر حفظ تغييرات الفئة في التخزين المحلي.',
      };
    }
  }

  createCategory(input: {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    iconKey?: string;
    initialQuestion?: Partial<Question>;
  }): SaveCategoryResult {
    const index = this.readIndex();
    const allIds = new Set<string>([
      ...index.orderedCategoryIds,
      ...index.customCategoryIds,
      ...index.deletedCustomCategoryIds,
      ...DEFAULT_QUESTION_CATEGORIES.map((c) => c.id),
    ]);

    const newCatId = generateStableCategoryId(input.nameEn || 'custom', allIds);
    const iconKey = input.iconKey || 'sparkles';
    const now = new Date().toISOString();

    const newCategory: QuestionCategory = {
      id: newCatId,
      nameEn: (input.nameEn || '').trim(),
      nameAr: (input.nameAr || '').trim(),
      descriptionEn: (input.descriptionEn || '').trim(),
      descriptionAr: (input.descriptionAr || '').trim(),
      iconKey,
      order: index.orderedCategoryIds.length,
      isEnabled: true,
      isBuiltIn: false,
      updatedAt: now,
    };

    const allExistingQuestionIds = this.listCategoryPartitions().flatMap((p) =>
      p.questions.map((q) => q.id)
    );
    const initialQId =
      input.initialQuestion?.id?.trim() ||
      generateStableQuestionId(newCatId, allExistingQuestionIds);

    const starterOptions: QuestionOption[] =
      input.initialQuestion?.options && input.initialQuestion.options.length >= 2
        ? input.initialQuestion.options
        : [
            {
              id: generateStableOptionId(initialQId, []),
              labelEn: 'First Preference Option',
              labelAr: 'الخيار الأول المفضل',
              iconKey,
              isEnabled: true,
              order: 0,
            },
            {
              id: generateStableOptionId(initialQId, []),
              labelEn: 'Second Preference Option',
              labelAr: 'الخيار الثاني المفضل',
              iconKey: 'heart',
              isEnabled: true,
              order: 1,
            },
          ];

    const starterQuestion: Question = {
      id: initialQId,
      category: newCatId,
      categoryId: newCatId,
      titleEn:
        input.initialQuestion?.titleEn?.trim() ||
        `${newCategory.nameEn} Preference`,
      titleAr:
        input.initialQuestion?.titleAr?.trim() ||
        `تفضيلك في ${newCategory.nameAr}`,
      subtitleEn:
        input.initialQuestion?.subtitleEn?.trim() ||
        'Choose the option that best matches your taste',
      subtitleAr:
        input.initialQuestion?.subtitleAr?.trim() ||
        'اختر الإجابة الأقرب لذوقك وشخصيتك',
      isMultiSelect: Boolean(input.initialQuestion?.isMultiSelect),
      maxSelect: input.initialQuestion?.isMultiSelect
        ? input.initialQuestion.maxSelect || 2
        : undefined,
      isEnabled: true,
      order: 0,
      isSystemDefault: false,
      updatedAt: now,
      options: starterOptions,
    };

    return this.saveCategoryPartition(newCatId, {
      category: newCategory,
      questions: [starterQuestion],
    });
  }

  reorderCategories(orderedCategoryIds: CategoryKey[]): boolean {
    const index = this.readIndex();
    const currentSet = new Set<string>(index.orderedCategoryIds);
    const nextOrder: CategoryKey[] = [];
    const seen = new Set<string>();

    for (const id of orderedCategoryIds) {
      const clean = String(id || '').trim();
      if (clean && currentSet.has(clean) && !seen.has(clean)) {
        seen.add(clean);
        nextOrder.push(clean);
      }
    }
    for (const id of index.orderedCategoryIds) {
      if (!seen.has(id)) {
        seen.add(id);
        nextOrder.push(id);
      }
    }

    const ok = this.writeIndex({
      ...index,
      orderedCategoryIds: nextOrder,
      updatedAt: new Date().toISOString(),
    });
    if (ok) notifyCatalogChanged();
    return ok;
  }

  setCategoryEnabled(categoryId: CategoryKey, isEnabled: boolean): SaveCategoryResult {
    const partition = this.getCategoryPartition(categoryId);
    if (!partition) {
      return {
        success: false,
        validationIssues: [],
        errorEn: `Category "${categoryId}" was not found.`,
        errorAr: `لم يتم العثور على الفئة "${categoryId}".`,
      };
    }

    return this.saveCategoryPartition(categoryId, {
      category: {
        ...partition.category,
        isEnabled,
      },
      questions: partition.questions,
      archivedQuestions: partition.archivedQuestions,
      archivedOptions: partition.archivedOptions,
    });
  }

  deleteCategory(
    categoryId: CategoryKey,
    options?: { confirmed?: boolean; forceArchiveIfReferenced?: boolean }
  ): {
    success: boolean;
    dependencyReport: CatalogDependencyReport;
    errorEn?: string;
    errorAr?: string;
  } {
    const cleanId = String(categoryId || '').trim();
    const report = inspectCategoryDependency(cleanId);

    if (!options?.confirmed) {
      return {
        success: false,
        dependencyReport: report,
        errorEn: 'Deletion requires explicit administrator confirmation.',
        errorAr: 'يتطلب حذف الفئة تأكيداً صريحاً من المسؤول بعد مراجعة الاعتماديات.',
      };
    }

    if (report.isBuiltIn) {
      return {
        success: false,
        dependencyReport: report,
        errorEn:
          'Built-in categories underpin core demo compatibility scenarios and cannot be permanently deleted. Disable the category instead.',
        errorAr:
          'الفئات الأساسية مرتبطة بسيناريوهات التوافق المرجعية ولا يمكن حذفها نهائياً؛ يمكنك تعطيلها لإخفائها من الاستبيان.',
      };
    }

    if (report.referencedByCount > 0 && !options?.forceArchiveIfReferenced) {
      return {
        success: false,
        dependencyReport: report,
        errorEn:
          'This custom category has recorded user answers. Confirm archive-safe removal or disable it instead.',
        errorAr:
          'هذه الفئة المخصصة مرتبطة بإجابات مستخدمين مسجلة. يرجى تأكيد الحذف الآمن مع الأرشفة أو تعطيل الفئة بدلاً من ذلك.',
      };
    }

    const storage = getStorage();
    if (!storage) {
      return {
        success: false,
        dependencyReport: report,
        errorEn: 'Browser localStorage is unavailable.',
        errorAr: 'التخزين المحلي غير متاح.',
      };
    }

    const existingPartition = this.getCategoryPartition(cleanId);
    const index = this.readIndex();
    const archivedSnapshots = [...(index.archivedCategorySnapshots || [])];
    if (existingPartition && report.referencedByCount > 0) {
      archivedSnapshots.push(existingPartition);
    }

    storage.removeItem(getCategoryPartitionStorageKey(cleanId));

    const nextIndex: CatalogIndexRecord = {
      ...index,
      orderedCategoryIds: index.orderedCategoryIds.filter((id) => id !== cleanId),
      customCategoryIds: index.customCategoryIds.filter((id) => id !== cleanId),
      deletedCustomCategoryIds: Array.from(
        new Set([...index.deletedCustomCategoryIds, cleanId])
      ),
      archivedCategorySnapshots: archivedSnapshots,
      updatedAt: new Date().toISOString(),
    };

    this.writeIndex(nextIndex);
    notifyCatalogChanged();
    return {
      success: true,
      dependencyReport: report,
    };
  }

  restoreCategoryToDefault(categoryId: CategoryKey): SaveCategoryResult {
    const cleanId = String(categoryId || '').trim();
    const seedCat = DEFAULT_QUESTION_CATEGORIES.find((c) => c.id === cleanId);
    if (!seedCat) {
      return {
        success: false,
        validationIssues: [],
        errorEn: `Category "${cleanId}" is a custom category and has no built-in default.`,
        errorAr: `الفئة "${cleanId}" فئة مخصصة مضافة محلياً وليس لها إعداد افتراضي أصلي.`,
      };
    }

    const storage = getStorage();
    if (storage) {
      storage.removeItem(getCategoryPartitionStorageKey(cleanId));
    }

    const restored = this.getCategoryPartition(cleanId)!;
    notifyCatalogChanged();
    return {
      success: true,
      partition: restored,
      validationIssues: [],
    };
  }

  restoreAllDefaults(): void {
    const storage = getStorage();
    if (!storage) return;

    const index = this.readIndex();
    const allKnownCategoryIds = new Set<string>([
      ...DEFAULT_QUESTION_CATEGORIES.map((c) => c.id),
      ...index.orderedCategoryIds,
      ...index.customCategoryIds,
      ...index.deletedCustomCategoryIds,
    ]);

    for (const catId of allKnownCategoryIds) {
      storage.removeItem(getCategoryPartitionStorageKey(catId));
    }
    storage.removeItem(CATALOG_INDEX_STORAGE_KEY);
    notifyCatalogChanged();
  }
}

/**
 * Unactivated Production PostgreSQL Question Catalog Repository Placeholder.
 * Maps cleanly to `public.question_categories`, `public.questions`, and
 * `public.question_options` with server-enforced Admin RBAC for writes.
 */
class SupabaseQuestionCatalogRepositoryPlaceholder extends DemoLocalQuestionCatalogRepository {
  override readonly mode: AccountMode = 'authenticated';
}

const demoCatalogRepo = new DemoLocalQuestionCatalogRepository();
const supabaseCatalogRepoPlaceholder = new SupabaseQuestionCatalogRepositoryPlaceholder();

export function getQuestionCatalogRepository(): IQuestionCatalogRepository {
  return getActiveAccountMode() === 'authenticated'
    ? supabaseCatalogRepoPlaceholder
    : demoCatalogRepo;
}

// ============================================================================
// High-Level Catalog Read Helpers for User Questionnaire, Matching & Admin UI
// ============================================================================

export function isCategoryCustomizedInStorage(categoryId: CategoryKey): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(getCategoryPartitionStorageKey(categoryId)) !== null;
}

export function getCatalogModificationSummary(): {
  hasAnyLocalChanges: boolean;
  customizedCategoryIds: CategoryKey[];
  customAddedCategoryIds: CategoryKey[];
} {
  const storage = getStorage();
  if (!storage) {
    return {
      hasAnyLocalChanges: false,
      customizedCategoryIds: [],
      customAddedCategoryIds: [],
    };
  }

  const partitions = getQuestionCatalogRepository().listCategoryPartitions();
  const customizedCategoryIds: CategoryKey[] = [];
  const customAddedCategoryIds: CategoryKey[] = [];

  for (const p of partitions) {
    if (!p.category.isBuiltIn) {
      customAddedCategoryIds.push(p.category.id);
    } else if (isCategoryCustomizedInStorage(p.category.id)) {
      customizedCategoryIds.push(p.category.id);
    }
  }

  const hasIndexOverride = storage.getItem(CATALOG_INDEX_STORAGE_KEY) !== null;

  return {
    hasAnyLocalChanges:
      hasIndexOverride ||
      customizedCategoryIds.length > 0 ||
      customAddedCategoryIds.length > 0,
    customizedCategoryIds,
    customAddedCategoryIds,
  };
}

/**
 * Returns ONLY enabled questions (with ONLY enabled options) inside enabled categories,
 * sorted strictly by category order and per-category question order.
 * Used by the live User Onboarding Questionnaire (`InteractiveOnboarding`).
 */
export function getActiveQuestionnaireQuestions(): Question[] {
  const partitions = getQuestionCatalogRepository().listCategoryPartitions();
  const activeQuestions: Question[] = [];

  for (const part of partitions) {
    if (!part.category.isEnabled) continue;

    const sortedQuestions = [...part.questions].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    for (const q of sortedQuestions) {
      if (q.isEnabled === false) continue;

      const enabledOptions = [...q.options]
        .filter((opt) => opt.isEnabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (enabledOptions.length < 2) continue;

      const clampedMaxSelect = q.isMultiSelect
        ? Math.max(2, Math.min(q.maxSelect || 3, enabledOptions.length))
        : undefined;

      activeQuestions.push({
        ...q,
        category: part.category.id,
        categoryId: part.category.id,
        maxSelect: clampedMaxSelect,
        options: enabledOptions,
      });
    }
  }

  return activeQuestions;
}

/**
 * Builds a playable preview list of questions for a single category draft
 * exactly as end users will experience them in `InteractiveOnboarding`.
 */
export function buildPreviewQuestionsForCategoryDraft(draft: {
  category: QuestionCategory;
  questions: Question[];
}): Question[] {
  if (!draft.category.isEnabled) return [];
  return [...draft.questions]
    .filter((q) => q.isEnabled !== false)
    .map((q) => {
      const enabledOptions = q.options.filter((o) => o.isEnabled !== false);
      return {
        ...q,
        category: draft.category.id,
        categoryId: draft.category.id,
        maxSelect: q.isMultiSelect
          ? Math.max(2, Math.min(q.maxSelect || 3, Math.max(2, enabledOptions.length)))
          : undefined,
        options: enabledOptions,
      };
    })
    .filter((q) => q.options.length >= 2);
}

/**
 * Returns all active + disabled + archived questions across all categories,
 * merging any archived options so historical user/demo answers can ALWAYS
 * be displayed and compared without losing labels.
 */
export function getAllCatalogQuestionsForDisplay(options?: {
  includeDisabled?: boolean;
  includeArchived?: boolean;
}): Question[] {
  const includeDisabled = options?.includeDisabled ?? true;
  const includeArchived = options?.includeArchived ?? true;

  const partitions = getQuestionCatalogRepository().listCategoryPartitions();
  const result: Question[] = [];
  const seenIds = new Set<string>();

  for (const part of partitions) {
    if (!includeDisabled && !part.category.isEnabled) continue;

    const archivedOptsByQ = new Map<string, QuestionOption[]>();
    for (const ao of part.archivedOptions) {
      const list = archivedOptsByQ.get(ao.questionId) || [];
      list.push(ao.option);
      archivedOptsByQ.set(ao.questionId, list);
    }

    for (const q of part.questions) {
      if (!includeDisabled && q.isEnabled === false) continue;
      if (seenIds.has(q.id)) continue;
      seenIds.add(q.id);

      const mergedOptions = [...q.options];
      if (includeArchived) {
        const extra = archivedOptsByQ.get(q.id) || [];
        const existingOptIds = new Set(mergedOptions.map((o) => o.id));
        for (const archOpt of extra) {
          if (!existingOptIds.has(archOpt.id)) {
            existingOptIds.add(archOpt.id);
            mergedOptions.push(archOpt);
          }
        }
      }

      result.push({
        ...q,
        options: mergedOptions,
      });
    }

    if (includeArchived) {
      for (const aq of part.archivedQuestions) {
        if (seenIds.has(aq.id)) continue;
        seenIds.add(aq.id);
        result.push(cloneQuestion(aq));
      }
    }
  }

  if (includeArchived) {
    // Also check archived custom category snapshots or immutable seed defaults
    const storage = getStorage();
    if (storage) {
      try {
        const rawIdx = storage.getItem(CATALOG_INDEX_STORAGE_KEY);
        if (rawIdx) {
          const parsed = JSON.parse(rawIdx) as Partial<CatalogIndexRecord>;
          for (const snap of parsed.archivedCategorySnapshots || []) {
            for (const q of [...(snap.questions || []), ...(snap.archivedQuestions || [])]) {
              if (!seenIds.has(q.id)) {
                seenIds.add(q.id);
                result.push(cloneQuestion(q));
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    for (const seedQ of ONBOARDING_QUESTIONS) {
      if (!seenIds.has(seedQ.id)) {
        seenIds.add(seedQ.id);
        result.push(cloneQuestion(seedQ));
      }
    }
  }

  return result;
}

export function getCatalogQuestionById(questionId: string): Question | undefined {
  const all = getAllCatalogQuestionsForDisplay({
    includeDisabled: true,
    includeArchived: true,
  });
  return all.find((q) => q.id === questionId);
}

export function getCatalogCategoryById(
  categoryId: CategoryKey
): QuestionCategory | undefined {
  const part = getQuestionCatalogRepository().getCategoryPartition(categoryId);
  return part?.category;
}

export function resolveCatalogOptionLabel(
  questionId: string,
  rawOptionId: string,
  language: Language
): string {
  const clean = String(rawOptionId || '').trim();
  if (!clean) return '';
  const normalized = normalizeAnswerOptionId(clean);

  const q = getCatalogQuestionById(questionId);
  if (q) {
    const found = q.options.find((o) => o.id === clean || o.id === normalized);
    if (found) {
      return language === 'ar' ? found.labelAr : found.labelEn;
    }
  }

  // Fallback to immutable seed default options if ever needed
  const seedQ = ONBOARDING_QUESTIONS.find((item) => item.id === questionId);
  if (seedQ) {
    const seedOpt = seedQ.options.find(
      (o) => o.id === clean || o.id === normalized
    );
    if (seedOpt) {
      return language === 'ar' ? seedOpt.labelAr : seedOpt.labelEn;
    }
  }

  if (LEGACY_OPTION_FALLBACK_LABELS[clean]) {
    return language === 'ar'
      ? LEGACY_OPTION_FALLBACK_LABELS[clean].ar
      : LEGACY_OPTION_FALLBACK_LABELS[clean].en;
  }

  return clean;
}

/**
 * Returns weights for custom-added questions so that when two users both answer
 * a newly created admin question, it participates cleanly in similarity scoring
 * without changing weights or scores for the 15 built-in questions or existing demo users.
 */
export function getCustomCatalogQuestionWeights(): Record<string, number> {
  const partitions = getQuestionCatalogRepository().listCategoryPartitions();
  const customWeights: Record<string, number> = {};

  for (const part of partitions) {
    for (const q of part.questions) {
      if (!BUILT_IN_QUESTION_IDS.has(q.id)) {
        customWeights[q.id] = 0.05;
      }
    }
  }
  return customWeights;
}

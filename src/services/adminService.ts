import {
  AccountMode,
  AvatarConfig,
  CategoryKey,
  Language,
  PrivacySettings,
  Question,
  UserProfile,
} from '../types';
import { MOCK_MATCHES } from '../data/mockMatches';
import { ONBOARDING_QUESTIONS } from '../data/questions';
import {
  DEMO_MODE_ONLY_LOCK,
  getActiveAccountMode,
  hasSupabaseEnvVars,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';
import { getAuthService } from './authService';
import {
  calculatePairwiseSimilarity,
  CATEGORY_WEIGHTS,
  DetailedMatchCalculation,
  normalizeOptionKey,
  isNoneOption,
  isNotApplicableOption,
} from './matchingService';
import {
  DEFAULT_DEMO_PRIVACY,
  DEFAULT_DEMO_PROFILE,
  loadSavedProfileIds,
  loadUserFeedbackItems,
  loadUserProfileOrDefault,
} from './profileService';
import { DEFAULT_DEMO_USER_ID } from './storageNamespace';
import {
  getActiveQuestionnaireQuestions,
  getAllCatalogQuestionsForDisplay,
  getQuestionCatalogRepository,
  resolveCatalogOptionLabel,
} from './questionCatalogService';

export type AdminSectionId =
  | 'overview'
  | 'users'
  | 'compatibility'
  | 'questionnaire'
  | 'settings';

export type ProfileCompletionFilter = 'all' | 'completed' | 'incomplete';
export type DemoRecordSourceFilter = 'all' | 'local_session' | 'mock_pool';

export interface AdminDemoUserRecord {
  id: string;
  username: string;
  city: string;
  gender: string;
  ageRange: string;
  bio: string;
  avatar: AvatarConfig;
  answers: Record<string, string | string[]>;
  answeredCount: number;
  totalQuestions: number;
  questionnaireCompletionRate: number; // 0 - 100
  isProfileCompleted: boolean;
  completionStatus: 'completed' | 'partial' | 'not_started';
  privacy: PrivacySettings;
  savedBookmarksCount: number;
  feedbackCount: number;
  sourceKind: 'local_session' | 'mock_pool';
  isActiveSessionUser: boolean;
  isDemo: true;
  accountMode: 'demo';
  createdAt: string | null;
  updatedAt: string | null;
}

export type ScoreRangeBucketId = '90_100' | '80_89' | '70_79' | '50_69' | '0_49';

export interface AdminScoreRangeBucket {
  id: ScoreRangeBucketId;
  rangeLabel: string;
  tierEn: string;
  tierAr: string;
  minScore: number;
  maxScore: number;
  count: number;
  percentage: number;
  colorHex: string;
}

export interface AdminCompatibilityPair {
  id: string;
  userAId: string;
  userAUsername: string;
  userACity: string;
  userAAvatar: AvatarConfig;
  userBId: string;
  userBUsername: string;
  userBCity: string;
  userBAvatar: AvatarConfig;
  similarityScore: number;
  seedReferenceScore?: number;
  coverageScore: number;
  sharedInterests: string[];
  divergentInterests: string[];
  comparedDimensionsCount: number;
  bucketId: ScoreRangeBucketId;
  dataOrigin: 'simulated_demo';
  isVerifiedRealWorld: false;
}

export interface AdminCompatibilityScenario {
  id: string;
  targetBadgeScore: number;
  computedScore: number;
  coverageScore: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  personaAHandle: string;
  personaBHandle: string;
  matchedDimensionsCount: number;
  comparedDimensionsCount: number;
  matchedQuestionIds: string[];
  divergentQuestionIds: string[];
  dataOrigin: 'simulated_demo_scenario';
  isVerifiedRealWorld: false;
}

export interface AdminQuestionOptionStat {
  optionId: string;
  labelEn: string;
  labelAr: string;
  selectionCount: number;
  selectionPercent: number;
  isNoneOrNa: boolean;
}

export interface AdminQuestionStat {
  index: number;
  question: Question;
  category: CategoryKey;
  isEnabled: boolean;
  weightPercent: number;
  isMultiSelect: boolean;
  maxSelect: number;
  optionsCount: number;
  respondedUsersCount: number;
  totalDemoUsers: number;
  responseRatePercent: number;
  noneOrNaResponsesCount: number;
  optionStats: AdminQuestionOptionStat[];
}

export interface AdminCategorySummary {
  category: CategoryKey;
  labelEn: string;
  labelAr: string;
  isEnabled: boolean;
  isBuiltIn: boolean;
  questionCount: number;
  enabledQuestionCount: number;
  totalOptionsCount: number;
  weightPercent: number;
  responseRatePercent: number;
}

export interface AdminSystemStatus {
  applicationMode: 'DEMO';
  activeAccountMode: AccountMode;
  demoModeLockEnabled: boolean;
  realBackendConnected: boolean;
  supabaseClientInitialized: boolean;
  hasSupabaseEnvConfigured: boolean;
  authProviderLabelEn: string;
  authProviderLabelAr: string;
  storageLayerLabelEn: string;
  storageLayerLabelAr: string;
  verifiedRealAccountsCount: null; // Unavailable without live DB
  liveServerRlsActive: false;
}

export interface AdminDashboardSnapshot {
  generatedAtIso: string;
  activeSessionUserId: string;
  overview: {
    totalDemoUsers: number;
    localSessionUsersCount: number;
    mockPoolUsersCount: number;
    completedProfilesCount: number;
    incompleteProfilesCount: number;
    partialProfilesCount: number;
    notStartedProfilesCount: number;
    questionnaireCompletionRate: number; // total answered slots / (totalUsers * 15)
    fullQuestionnaireUsersRate: number; // users with 15/15 / totalUsers
    totalAnsweredSlots: number;
    totalPossibleQuestionSlots: number;
    activeUserCompatibilityCount: number;
    allPairsCompatibilityCount: number;
    averageActiveCompatibilityScore: number | null;
    averageAllPairsCompatibilityScore: number | null;
    highestDemoCompatibilityScore: number | null;
    totalDemoFeedbackSubmissions: number;
    verifiedRealWorldMatchesCount: null; // Explicitly unavailable in demo mode
  };
  users: AdminDemoUserRecord[];
  compatibility: {
    activeUserPairs: AdminCompatibilityPair[];
    allCommunityPairs: AdminCompatibilityPair[];
    activeUserDistribution: AdminScoreRangeBucket[];
    allPairsDistribution: AdminScoreRangeBucket[];
    benchmarkScenarios: AdminCompatibilityScenario[];
  };
  questionnaire: {
    totalQuestions: number;
    totalCategories: number;
    totalCatalogQuestions: number;
    totalCatalogCategories: number;
    singleSelectCount: number;
    multiSelectCount: number;
    totalOptionsAvailable: number;
    overallCompletionRatePercent: number;
    questions: AdminQuestionStat[];
    categories: AdminCategorySummary[];
  };
  systemStatus: AdminSystemStatus;
}

const CATEGORY_LABELS: Record<CategoryKey, { en: string; ar: string }> = {
  coffee: { en: 'Coffee Rituals', ar: 'طقوس القهوة' },
  drinks: { en: 'Refreshing Drinks', ar: 'المشروبات المنعشة' },
  food: { en: 'Cuisines & Dining', ar: 'الأطباق والمطابخ' },
  sports: { en: 'Active Sports', ar: 'الرياضة الممارسة' },
  sports_watch: { en: 'Spectator Sports', ar: 'متابعة البطولات' },
  hobbies: { en: 'Hands-On Hobbies', ar: 'الهوايات الإبداعية' },
  entertainment: { en: 'Entertainment & Media', ar: 'الترفيه والمحتوى' },
  places: { en: 'Favorite Places', ar: 'الأماكن المفضلة' },
  leisure: { en: 'Weekend Outings', ar: 'طلعات نهاية الأسبوع' },
  events: { en: 'Live Events', ar: 'الفعاليات والتجارب' },
  travel: { en: 'Travel Style', ar: 'أسلوب السفر' },
  lifestyle: { en: 'Daily Routine', ar: 'الروتين اليومي' },
  vibe: { en: 'Social Energy', ar: 'الطاقة الاجتماعية' },
  tech: { en: 'Technology Habits', ar: 'العلاقة بالتقنية' },
  cars: { en: 'Car Design Taste', ar: 'ذوق فئات السيارات' },
  apps: { en: 'Most-Used App', ar: 'التطبيق الأكثر استخداماً' },
};

const LEGACY_OPTION_LABELS: Record<string, { en: string; ar: string }> = {
  leisure_cafe: {
    en: 'Aesthetic Cafe & Deep Conversations',
    ar: 'كافيه هادئ وجلسة حوارات رايقة',
  },
  place_cozycafe: {
    en: 'Vibrant Open-Air Boulevards & Plazas',
    ar: 'بوليفارد وممشى عصري مفتوح ومضاء',
  },
  lifestyle_nightowl: {
    en: 'Night Owl Thinker (9 PM – Late)',
    ar: 'كائن ليلي • الإلهام والروقان في هدوء الليل',
  },
  drink_mojito: {
    en: 'Passion Fruit / Hibiscus Iced Tea',
    ar: 'آيس تي باشن فروت أو كركديه بارد منعش',
  },
};

function hasValidAnswer(val: string | string[] | undefined): boolean {
  if (!val) return false;
  if (Array.isArray(val)) {
    return val.some((item) => String(item).trim().length > 0);
  }
  return String(val).trim().length > 0;
}

export function countAnsweredQuestions(
  answers: Record<string, string | string[]> | undefined,
  questionsList?: Question[]
): number {
  if (!answers) return 0;
  const activeList = questionsList || getActiveQuestionnaireQuestions();
  let count = 0;
  for (const q of activeList) {
    if (hasValidAnswer(answers[q.id])) {
      count += 1;
    }
  }
  return count;
}

export function formatQuestionAnswerForAdmin(
  questionId: string,
  answerVal: string | string[] | undefined,
  language: Language
): string | null {
  if (!hasValidAnswer(answerVal)) return null;
  const rawList = Array.isArray(answerVal) ? answerVal : [String(answerVal)];

  const labels = rawList
    .map((rawId) => {
      const clean = String(rawId).trim();
      if (!clean) return null;
      return resolveCatalogOptionLabel(questionId, clean, language);
    })
    .filter((item): item is string => Boolean(item));

  return labels.length > 0 ? labels.join(' · ') : null;
}

export function getScoreBucketId(score: number): ScoreRangeBucketId {
  if (score >= 90) return '90_100';
  if (score >= 80) return '80_89';
  if (score >= 70) return '70_79';
  if (score >= 50) return '50_69';
  return '0_49';
}

function buildDistributionBuckets(scores: number[]): AdminScoreRangeBucket[] {
  const definitions: Omit<AdminScoreRangeBucket, 'count' | 'percentage'>[] = [
    {
      id: '90_100',
      rangeLabel: '90% – 100%',
      tierEn: 'Exceptional Twin',
      tierAr: 'تطابق استثنائي',
      minScore: 90,
      maxScore: 100,
      colorHex: '#10B981',
    },
    {
      id: '80_89',
      rangeLabel: '80% – 89%',
      tierEn: 'Very Good Alignment',
      tierAr: 'توافق جيد جداً',
      minScore: 80,
      maxScore: 89,
      colorHex: '#0B5D3B',
    },
    {
      id: '70_79',
      rangeLabel: '70% – 79%',
      tierEn: 'Good Chemistry',
      tierAr: 'كيمياء مشتركة',
      minScore: 70,
      maxScore: 79,
      colorHex: '#D4AF37',
    },
    {
      id: '50_69',
      rangeLabel: '50% – 69%',
      tierEn: 'Balanced Overlap',
      tierAr: 'توافق متوازن',
      minScore: 50,
      maxScore: 69,
      colorHex: '#64748B',
    },
    {
      id: '0_49',
      rangeLabel: '0% – 49%',
      tierEn: 'Low Overlap',
      tierAr: 'تقاطع منخفض',
      minScore: 0,
      maxScore: 49,
      colorHex: '#94A3B8',
    },
  ];

  const counts: Record<ScoreRangeBucketId, number> = {
    '90_100': 0,
    '80_89': 0,
    '70_79': 0,
    '50_69': 0,
    '0_49': 0,
  };

  for (const s of scores) {
    counts[getScoreBucketId(s)] += 1;
  }

  const total = scores.length;
  return definitions.map((def) => ({
    ...def,
    count: counts[def.id],
    percentage: total > 0 ? Math.round((counts[def.id] / total) * 100) : 0,
  }));
}

function buildPairRecord(
  userA: AdminDemoUserRecord,
  userB: AdminDemoUserRecord,
  calc: DetailedMatchCalculation,
  seedReferenceScore?: number
): AdminCompatibilityPair {
  const comparedDimensionsCount = Object.keys(calc.dimensionBreakdown).length;
  return {
    id: `${userA.id}__${userB.id}`,
    userAId: userA.id,
    userAUsername: userA.username,
    userACity: userA.city,
    userAAvatar: userA.avatar,
    userBId: userB.id,
    userBUsername: userB.username,
    userBCity: userB.city,
    userBAvatar: userB.avatar,
    similarityScore: calc.similarityScore,
    seedReferenceScore,
    coverageScore: calc.coverageScore,
    sharedInterests: calc.sharedInterests,
    divergentInterests: calc.divergentInterests,
    comparedDimensionsCount,
    bucketId: getScoreBucketId(calc.similarityScore),
    dataOrigin: 'simulated_demo',
    isVerifiedRealWorld: false,
  };
}

/**
 * Computes deterministic 95% and 90% demo compatibility benchmark scenarios
 * using the exact production `calculatePairwiseSimilarity` engine, alongside
 * the built-in top twin scenario (`@rayan_riyadh` × `@faisal_riyadh`).
 */
function buildBenchmarkScenarios(): AdminCompatibilityScenario[] {
  const baseAnswers = DEFAULT_DEMO_PROFILE.answers;

  // 1. 95% Demo Compatibility Scenario:
  // Aligns across 14 of 15 taste/lifestyle questions (95% weight) including V60 coffee,
  // Padel sport, smash burgers, luxury sedan, and ambitious vibe; differs only on q_tech (5% weight).
  const answers95: Record<string, string | string[]> = {
    ...baseAnswers,
    q_tech: 'tech_creative',
  };
  const calc95 = calculatePairwiseSimilarity(baseAnswers, answers95);

  // 2. 90% Demo Compatibility Scenario:
  // Aligns across 13 of 15 questions (90% weight — exact threshold for "Exceptional Twin");
  // differs on q_tech (5% weight) and q_sports_watch (5% weight).
  const answers90: Record<string, string | string[]> = {
    ...baseAnswers,
    q_tech: 'tech_creative',
    q_sports_watch: ['watch_racket'],
  };
  const calc90 = calculatePairwiseSimilarity(baseAnswers, answers90);

  // 3. Built-in Top Mock Candidate Scenario (@rayan_riyadh × @faisal_riyadh)
  const faisal = MOCK_MATCHES[0];
  const calcFaisal = calculatePairwiseSimilarity(baseAnswers, faisal.answers);

  return [
    {
      id: 'scenario_demo_95',
      targetBadgeScore: 95,
      computedScore: calc95.similarityScore,
      coverageScore: calc95.coverageScore,
      titleEn: '95% Demo Compatibility Scenario (Near-Identical Taste Twin)',
      titleAr: 'سيناريو توافق تجريبي 95% (تطابق ذوقي شبه متكامل)',
      descriptionEn:
        'Deterministic demo benchmark matching 15 of 16 questions (V60 coffee, Padel, food, places, travel, rhythm, social vibe, and apps), differing only on technology style (5% weight).',
      descriptionAr:
        'سيناريو مرجعي تجريبي يتطابق في 15 من أصل 16 سؤالاً (قهوة V60، البادل، الأكل، الأماكن، السفر، الروتين، الطاقة، والتطبيقات)، ويختلف فقط في علاقة التقنية (وزن 5%).',
      personaAHandle: DEFAULT_DEMO_PROFILE.username,
      personaBHandle: 'demo_benchmark_95',
      matchedDimensionsCount: calc95.sharedInterests.length,
      comparedDimensionsCount: Object.keys(calc95.dimensionBreakdown).length,
      matchedQuestionIds: calc95.sharedInterests,
      divergentQuestionIds: calc95.divergentInterests,
      dataOrigin: 'simulated_demo_scenario',
      isVerifiedRealWorld: false,
    },
    {
      id: 'scenario_demo_90',
      targetBadgeScore: 90,
      computedScore: calc90.similarityScore,
      coverageScore: calc90.coverageScore,
      titleEn: '90% Demo Compatibility Scenario (Exceptional Tier Threshold)',
      titleAr: 'سيناريو توافق تجريبي 90% (عتبة فئة التوأم الاستثنائي)',
      descriptionEn:
        'Deterministic demo benchmark at the 90% Exceptional tier boundary: 14 of 16 dimensions aligned (90% weight), differing on spectator sports (5%) and technology habits (5%).',
      descriptionAr:
        'سيناريو مرجعي تجريبي عند عتبة 90% لفئة التطابق الاستثنائي: تطابق في 14 من 16 بُعداً (وزن 90%)، مع اختلاف في متابعة البطولات (5%) والتقنية (5%).',
      personaAHandle: DEFAULT_DEMO_PROFILE.username,
      personaBHandle: 'demo_benchmark_90',
      matchedDimensionsCount: calc90.sharedInterests.length,
      comparedDimensionsCount: Object.keys(calc90.dimensionBreakdown).length,
      matchedQuestionIds: calc90.sharedInterests,
      divergentQuestionIds: calc90.divergentInterests,
      dataOrigin: 'simulated_demo_scenario',
      isVerifiedRealWorld: false,
    },
    {
      id: 'scenario_seed_faisal',
      targetBadgeScore: faisal.similarityScore,
      computedScore: calcFaisal.similarityScore,
      coverageScore: calcFaisal.coverageScore,
      titleEn: `Primary Mock Pair (@${DEFAULT_DEMO_PROFILE.username} × @${faisal.username})`,
      titleAr: `الثنائي التجريبي الأول (@${DEFAULT_DEMO_PROFILE.username} × @${faisal.username})`,
      descriptionEn:
        'Live pairwise evaluation between the default demo persona and top community mock candidate Faisal (15/16 shared categories; differs only on morning vs night routine, 7% weight).',
      descriptionAr:
        'حساب توافق مباشر بين الحساب التجريبي الافتراضي والمرشح الأول فيصل (15 من 16 فئة متطابقة؛ يختلفان فقط في الروتين الصباحي مقابل المسائي بوزن 7%).',
      personaAHandle: DEFAULT_DEMO_PROFILE.username,
      personaBHandle: faisal.username,
      matchedDimensionsCount: calcFaisal.sharedInterests.length,
      comparedDimensionsCount: Object.keys(calcFaisal.dimensionBreakdown).length,
      matchedQuestionIds: calcFaisal.sharedInterests,
      divergentQuestionIds: calcFaisal.divergentInterests,
      dataOrigin: 'simulated_demo_scenario',
      isVerifiedRealWorld: false,
    },
  ];
}

export function getAdminDashboardSnapshot(
  overrideActiveUserId?: string
): AdminDashboardSnapshot {
  const authService = getAuthService();
  const currentSession = authService.getCurrentSession();
  const activeUserId =
    overrideActiveUserId || currentSession?.user.id || DEFAULT_DEMO_USER_ID;

  const catalogPartitions = getQuestionCatalogRepository().listCategoryPartitions();
  const activeOnboardingQuestions = getActiveQuestionnaireQuestions();
  const totalQuestions = activeOnboardingQuestions.length;
  const seenIds = new Set<string>();
  const users: AdminDemoUserRecord[] = [];

  // 1. Collect all registered local demo session personas (never exposing tokens/secrets/phones)
  const localAccounts = authService.listDemoAccounts();
  for (const identity of localAccounts) {
    if (!identity.id || seenIds.has(identity.id)) continue;
    seenIds.add(identity.id);

    const profile: UserProfile = loadUserProfileOrDefault(identity.id);
    const answeredCount = countAnsweredQuestions(
      profile.answers,
      activeOnboardingQuestions
    );
    const questionnaireCompletionRate =
      totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    const isProfileCompleted =
      Boolean(profile.isCompleted) &&
      (totalQuestions === 0 || answeredCount === totalQuestions);
    const completionStatus: AdminDemoUserRecord['completionStatus'] =
      isProfileCompleted
        ? 'completed'
        : answeredCount > 0
        ? 'partial'
        : 'not_started';

    users.push({
      id: profile.id,
      username: profile.username,
      city: profile.city || 'Riyadh',
      gender: profile.gender || 'prefer_not_to_say',
      ageRange: profile.ageRange || '25-29',
      bio: profile.bio || '',
      avatar: profile.avatar,
      answers: { ...(profile.answers || {}) },
      answeredCount,
      totalQuestions,
      questionnaireCompletionRate,
      isProfileCompleted,
      completionStatus,
      privacy: profile.privacy ? { ...profile.privacy } : { ...DEFAULT_DEMO_PRIVACY },
      savedBookmarksCount: loadSavedProfileIds(profile.id).length,
      feedbackCount: loadUserFeedbackItems(profile.id).length,
      sourceKind: 'local_session',
      isActiveSessionUser: profile.id === activeUserId,
      isDemo: true,
      accountMode: 'demo',
      createdAt: profile.createdAt || identity.createdAt || null,
      updatedAt: profile.updatedAt || identity.lastSignInAt || null,
    });
  }

  // 2. Collect built-in MOCK_MATCHES community demo pool
  const seedScoreByCandidateId = new Map<string, number>();
  for (const mock of MOCK_MATCHES) {
    seedScoreByCandidateId.set(mock.id, mock.similarityScore);
    if (seenIds.has(mock.id)) continue;
    seenIds.add(mock.id);

    const answeredCount = countAnsweredQuestions(
      mock.answers,
      activeOnboardingQuestions
    );
    const questionnaireCompletionRate =
      totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const isProfileCompleted =
      totalQuestions > 0 ? answeredCount === totalQuestions : true;
    const completionStatus: AdminDemoUserRecord['completionStatus'] =
      isProfileCompleted
        ? 'completed'
        : answeredCount > 0
        ? 'partial'
        : 'not_started';

    users.push({
      id: mock.id,
      username: mock.username,
      city: mock.city,
      gender: mock.gender || 'prefer_not_to_say',
      ageRange: mock.ageRange || '24-28',
      bio: mock.bio || '',
      avatar: mock.avatar,
      answers: { ...(mock.answers || {}) },
      answeredCount,
      totalQuestions,
      questionnaireCompletionRate,
      isProfileCompleted,
      completionStatus,
      privacy: { ...DEFAULT_DEMO_PRIVACY },
      savedBookmarksCount: 0,
      feedbackCount: 0,
      sourceKind: 'mock_pool',
      isActiveSessionUser: mock.id === activeUserId,
      isDemo: true,
      accountMode: 'demo',
      createdAt: null,
      updatedAt: null,
    });
  }

  // 3. Compute Overview & Completion Counts
  const totalDemoUsers = users.length;
  const localSessionUsersCount = users.filter((u) => u.sourceKind === 'local_session').length;
  const mockPoolUsersCount = users.filter((u) => u.sourceKind === 'mock_pool').length;
  const completedProfilesCount = users.filter((u) => u.isProfileCompleted).length;
  const incompleteProfilesCount = totalDemoUsers - completedProfilesCount;
  const partialProfilesCount = users.filter((u) => u.completionStatus === 'partial').length;
  const notStartedProfilesCount = users.filter((u) => u.completionStatus === 'not_started').length;

  const totalAnsweredSlots = users.reduce((sum, u) => sum + u.answeredCount, 0);
  const totalPossibleQuestionSlots = totalDemoUsers * totalQuestions;
  const questionnaireCompletionRate =
    totalPossibleQuestionSlots > 0
      ? Math.round((totalAnsweredSlots / totalPossibleQuestionSlots) * 100)
      : 0;
  const fullQuestionnaireUsersRate =
    totalDemoUsers > 0
      ? Math.round((completedProfilesCount / totalDemoUsers) * 100)
      : 0;

  const totalDemoFeedbackSubmissions = users.reduce(
    (sum, u) => sum + u.feedbackCount,
    0
  );

  // 4. Compute Compatibility Pairs & Score Distributions from real demo records
  const activeUserRecord =
    users.find((u) => u.id === activeUserId) || users[0] || null;

  const activeUserPairs: AdminCompatibilityPair[] = [];
  if (activeUserRecord && activeUserRecord.answeredCount > 0) {
    for (const candidate of users) {
      if (candidate.id === activeUserRecord.id) continue;
      if (candidate.answeredCount === 0) continue;
      const calc = calculatePairwiseSimilarity(
        activeUserRecord.answers,
        candidate.answers
      );
      if (calc.coverageScore > 0) {
        activeUserPairs.push(
          buildPairRecord(
            activeUserRecord,
            candidate,
            calc,
            seedScoreByCandidateId.get(candidate.id)
          )
        );
      }
    }
    activeUserPairs.sort(
      (a, b) =>
        b.similarityScore - a.similarityScore || a.id.localeCompare(b.id)
    );
  }

  const allCommunityPairs: AdminCompatibilityPair[] = [];
  const eligibleUsers = users.filter((u) => u.answeredCount > 0);
  for (let i = 0; i < eligibleUsers.length; i++) {
    for (let j = i + 1; j < eligibleUsers.length; j++) {
      const userA = eligibleUsers[i];
      const userB = eligibleUsers[j];
      const calc = calculatePairwiseSimilarity(userA.answers, userB.answers);
      if (calc.coverageScore > 0) {
        allCommunityPairs.push(
          buildPairRecord(
            userA,
            userB,
            calc,
            userA.id === DEFAULT_DEMO_USER_ID
              ? seedScoreByCandidateId.get(userB.id)
              : undefined
          )
        );
      }
    }
  }
  allCommunityPairs.sort(
    (a, b) =>
      b.similarityScore - a.similarityScore || a.id.localeCompare(b.id)
  );

  const activeScores = activeUserPairs.map((p) => p.similarityScore);
  const allPairScores = allCommunityPairs.map((p) => p.similarityScore);

  const averageActiveCompatibilityScore =
    activeScores.length > 0
      ? Math.round(
          activeScores.reduce((acc, s) => acc + s, 0) / activeScores.length
        )
      : null;

  const averageAllPairsCompatibilityScore =
    allPairScores.length > 0
      ? Math.round(
          allPairScores.reduce((acc, s) => acc + s, 0) / allPairScores.length
        )
      : null;

  const highestDemoCompatibilityScore =
    allPairScores.length > 0 ? Math.max(...allPairScores) : null;

  // 5. Compute Questionnaire & Category Breakdown from shared Question Catalog
  const allCatalogQuestions = getAllCatalogQuestionsForDisplay({
    includeDisabled: true,
    includeArchived: false,
  });

  const questionsStats: AdminQuestionStat[] = allCatalogQuestions.map(
    (q, idx) => {
      const parentPartition = catalogPartitions.find(
        (p) => p.category.id === (q.categoryId || q.category)
      );
      const isQuestionActive =
        (parentPartition ? parentPartition.category.isEnabled : true) &&
        q.isEnabled !== false;
      const weight = CATEGORY_WEIGHTS[q.id] ?? (q.isSystemDefault ? 0 : 0.05);
      const optionCounts = new Map<string, number>();
      for (const opt of q.options) {
        optionCounts.set(opt.id, 0);
      }

      let respondedUsersCount = 0;
      let noneOrNaResponsesCount = 0;

      for (const u of users) {
        const rawAns = u.answers[q.id];
        if (!hasValidAnswer(rawAns)) continue;
        respondedUsersCount += 1;

        const normalizedSelections = (
          Array.isArray(rawAns) ? rawAns : [String(rawAns)]
        )
          .map((item) => normalizeOptionKey(String(item).trim()))
          .filter(Boolean);

        if (
          normalizedSelections.some(
            (id) => isNoneOption(id) || isNotApplicableOption(id)
          )
        ) {
          noneOrNaResponsesCount += 1;
        }

        const uniqueSelections = new Set(normalizedSelections);
        for (const selId of uniqueSelections) {
          optionCounts.set(selId, (optionCounts.get(selId) ?? 0) + 1);
        }
      }

      const optionStats: AdminQuestionOptionStat[] = q.options
        .map((opt) => {
          const count = optionCounts.get(opt.id) ?? 0;
          return {
            optionId: opt.id,
            labelEn: opt.labelEn,
            labelAr: opt.labelAr,
            selectionCount: count,
            selectionPercent:
              respondedUsersCount > 0
                ? Math.round((count / respondedUsersCount) * 100)
                : 0,
            isNoneOrNa: isNoneOption(opt.id) || isNotApplicableOption(opt.id),
          };
        })
        .sort((a, b) => b.selectionCount - a.selectionCount);

      return {
        index: idx + 1,
        question: q,
        category: q.categoryId || q.category,
        isEnabled: isQuestionActive,
        weightPercent: Math.round(weight * 100),
        isMultiSelect: Boolean(q.isMultiSelect),
        maxSelect: q.maxSelect ?? 1,
        optionsCount: q.options.filter((o) => o.isEnabled !== false).length,
        respondedUsersCount,
        totalDemoUsers,
        responseRatePercent:
          totalDemoUsers > 0
            ? Math.round((respondedUsersCount / totalDemoUsers) * 100)
            : 0,
        noneOrNaResponsesCount,
        optionStats,
      };
    }
  );

  const categoriesSummary: AdminCategorySummary[] = catalogPartitions.map(
    (part) => {
      const catQuestions = questionsStats.filter(
        (qs) => qs.category === part.category.id
      );
      const fallbackMeta = CATEGORY_LABELS[part.category.id as keyof typeof CATEGORY_LABELS];
      const totalOpts = catQuestions.reduce((s, qs) => s + qs.optionsCount, 0);
      const weightSum = catQuestions.reduce(
        (s, qs) => s + (CATEGORY_WEIGHTS[qs.question.id] ? Math.round(CATEGORY_WEIGHTS[qs.question.id] * 100) : 0),
        0
      );
      const avgResponseRate =
        catQuestions.length > 0
          ? Math.round(
              catQuestions.reduce((s, qs) => s + qs.responseRatePercent, 0) /
                catQuestions.length
            )
          : 0;

      return {
        category: part.category.id,
        labelEn: part.category.nameEn || fallbackMeta?.en || String(part.category.id),
        labelAr: part.category.nameAr || fallbackMeta?.ar || String(part.category.id),
        isEnabled: part.category.isEnabled,
        isBuiltIn: part.category.isBuiltIn,
        questionCount: catQuestions.length,
        enabledQuestionCount: part.category.isEnabled
          ? catQuestions.filter((qs) => qs.question.isEnabled !== false).length
          : 0,
        totalOptionsCount: totalOpts,
        weightPercent: weightSum,
        responseRatePercent: avgResponseRate,
      };
    }
  );

  const activeQuestionStats = questionsStats.filter((q) => q.isEnabled);
  const singleSelectCount = activeQuestionStats.filter(
    (q) => !q.isMultiSelect
  ).length;
  const multiSelectCount = activeQuestionStats.filter((q) => q.isMultiSelect).length;
  const totalOptionsAvailable = activeQuestionStats.reduce(
    (sum, q) => sum + q.optionsCount,
    0
  );
  const enabledCategoriesCount = categoriesSummary.filter((c) => c.isEnabled).length;

  // 6. Inspect Actual Project Backend & Mode Configuration
  const activeAccountMode = getActiveAccountMode();
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseClientInitialized = Boolean(supabase !== null);
  const realBackendConnected = supabaseConfigured && supabaseClientInitialized;

  const systemStatus: AdminSystemStatus = {
    applicationMode: 'DEMO',
    activeAccountMode,
    demoModeLockEnabled: DEMO_MODE_ONLY_LOCK,
    realBackendConnected,
    supabaseClientInitialized,
    hasSupabaseEnvConfigured: hasSupabaseEnvVars(),
    authProviderLabelEn:
      activeAccountMode === 'demo'
        ? 'Mock Local Session (DemoAuthService)'
        : 'Supabase Auth Placeholder (Unverified)',
    authProviderLabelAr:
      activeAccountMode === 'demo'
        ? 'جلسة محلية تجريبية (DemoAuthService)'
        : 'مُهيئ مصادقة مستقبلي (غير مفعّل)',
    storageLayerLabelEn:
      'Browser localStorage (twin:v2:demo:* scoped envelopes) + static MOCK_MATCHES',
    storageLayerLabelAr:
      'التخزين المحلي للمتصفح (twin:v2:demo:*) + بيانات المرشحين التجريبية الثابتة',
    verifiedRealAccountsCount: null,
    liveServerRlsActive: false,
  };

  return {
    generatedAtIso: new Date().toISOString(),
    activeSessionUserId: activeUserId,
    overview: {
      totalDemoUsers,
      localSessionUsersCount,
      mockPoolUsersCount,
      completedProfilesCount,
      incompleteProfilesCount,
      partialProfilesCount,
      notStartedProfilesCount,
      questionnaireCompletionRate,
      fullQuestionnaireUsersRate,
      totalAnsweredSlots,
      totalPossibleQuestionSlots,
      activeUserCompatibilityCount: activeUserPairs.length,
      allPairsCompatibilityCount: allCommunityPairs.length,
      averageActiveCompatibilityScore,
      averageAllPairsCompatibilityScore,
      highestDemoCompatibilityScore,
      totalDemoFeedbackSubmissions,
      verifiedRealWorldMatchesCount: null,
    },
    users,
    compatibility: {
      activeUserPairs,
      allCommunityPairs,
      activeUserDistribution: buildDistributionBuckets(activeScores),
      allPairsDistribution: buildDistributionBuckets(allPairScores),
      benchmarkScenarios: buildBenchmarkScenarios(),
    },
    questionnaire: {
      totalQuestions,
      totalCategories: enabledCategoriesCount,
      totalCatalogQuestions: questionsStats.length,
      totalCatalogCategories: categoriesSummary.length,
      singleSelectCount,
      multiSelectCount,
      totalOptionsAvailable,
      overallCompletionRatePercent: questionnaireCompletionRate,
      questions: questionsStats,
      categories: categoriesSummary,
    },
    systemStatus,
  };
}

export function filterAdminDemoUsers(
  users: AdminDemoUserRecord[],
  filters: {
    searchQuery?: string;
    completionFilter?: ProfileCompletionFilter;
    sourceFilter?: DemoRecordSourceFilter;
  }
): AdminDemoUserRecord[] {
  const query = (filters.searchQuery || '').trim().toLowerCase();
  const completionFilter = filters.completionFilter || 'all';
  const sourceFilter = filters.sourceFilter || 'all';

  return users.filter((u) => {
    if (completionFilter === 'completed' && !u.isProfileCompleted) {
      return false;
    }
    if (completionFilter === 'incomplete' && u.isProfileCompleted) {
      return false;
    }
    if (sourceFilter === 'local_session' && u.sourceKind !== 'local_session') {
      return false;
    }
    if (sourceFilter === 'mock_pool' && u.sourceKind !== 'mock_pool') {
      return false;
    }

    if (query.length > 0) {
      const cleanQuery = query.replace(/^@/, '');
      const matchesUsername = u.username.toLowerCase().includes(cleanQuery);
      const matchesId = u.id.toLowerCase().includes(cleanQuery);
      const matchesCity = u.city.toLowerCase().includes(cleanQuery);
      if (!matchesUsername && !matchesId && !matchesCity) {
        return false;
      }
    }

    return true;
  });
}

export function getDemoUserTopMatches(
  targetUser: AdminDemoUserRecord,
  allUsers: AdminDemoUserRecord[],
  limit = 4
): AdminCompatibilityPair[] {
  if (targetUser.answeredCount === 0) return [];
  const pairs: AdminCompatibilityPair[] = [];

  for (const other of allUsers) {
    if (other.id === targetUser.id || other.answeredCount === 0) continue;
    const calc = calculatePairwiseSimilarity(targetUser.answers, other.answers);
    if (calc.coverageScore > 0) {
      pairs.push(buildPairRecord(targetUser, other, calc));
    }
  }

  return pairs
    .sort(
      (a, b) =>
        b.similarityScore - a.similarityScore || a.id.localeCompare(b.id)
    )
    .slice(0, limit);
}

import { AccountMode, MatchProfile, UserProfile } from '../types';
import { MOCK_MATCHES } from '../data/mockMatches';
import { ONBOARDING_QUESTIONS } from '../data/questions';
import { getActiveAccountMode } from '../lib/supabase';
import {
  CandidateQueryOptions,
  IMatchingRepository,
  PaginatedMatchResult,
} from './contracts';
import {
  getCatalogQuestionById,
  getCustomCatalogQuestionWeights,
} from './questionCatalogService';

export interface DetailedMatchCalculation {
  similarityScore: number;
  coverageScore: number;
  sharedInterests: string[];
  divergentInterests: string[];
  dimensionBreakdown: Record<
    string,
    {
      weight: number;
      score: number;
      matched: boolean;
      userValue: string | string[];
      matchValue: string | string[];
    }
  >;
}

export const CATEGORY_WEIGHTS: Record<string, number> = {
  q_coffee: 0.07,
  q_drinks: 0.05,
  q_food: 0.07,
  q_sports: 0.07,
  q_sports_watch: 0.05,
  q_hobbies: 0.07,
  q_entertainment: 0.06,
  q_places: 0.07,
  q_leisure: 0.07,
  q_events: 0.06,
  q_travel: 0.06,
  q_lifestyle: 0.07,
  q_vibe: 0.07,
  q_tech: 0.05,
  q_cars: 0.05,
  q_apps: 0.06,
};

const MULTI_SELECT_IDS = new Set(
  ONBOARDING_QUESTIONS.filter((q) => q.isMultiSelect).map((q) => q.id)
);

export function normalizeOptionKey(rawKey: string): string {
  if (rawKey === 'leisure_cafe') return 'leisure_boutique_lounge';
  if (rawKey === 'place_cozycafe') return 'place_modern_walk';
  if (rawKey === 'lifestyle_nightowl') return 'rhythm_night_owl';
  if (rawKey === 'drink_mojito') return 'drink_iced_tea';
  if (rawKey === 'drink_sparkling') return 'drink_mint_lemon';
  return rawKey;
}

export function isNoneOption(id: string): boolean {
  return id.endsWith('_none');
}

export function isNotApplicableOption(id: string): boolean {
  return id.endsWith('_na');
}

function toNormalizedList(val: string | string[] | undefined): string[] {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr
    .map((item) => normalizeOptionKey(String(item).trim()))
    .filter((item) => item.length > 0);
}

export function getSharedOptionIds(
  questionId: string,
  userVal: string | string[] | undefined,
  matchVal: string | string[] | undefined
): string[] {
  const listA = toNormalizedList(userVal);
  const listB = toNormalizedList(matchVal);

  if (listA.length === 0 || listB.length === 0) return [];
  if (listA.some(isNotApplicableOption) || listB.some(isNotApplicableOption)) return [];

  const aHasNone = listA.some(isNoneOption);
  const bHasNone = listB.some(isNoneOption);
  if (aHasNone || bHasNone) {
    if (aHasNone && bHasNone) {
      const noneId = listA.find(isNoneOption) || listB.find(isNoneOption);
      return noneId ? [noneId] : [];
    }
    return [];
  }

  const question =
    getCatalogQuestionById(questionId) ||
    ONBOARDING_QUESTIONS.find((q) => q.id === questionId);
  const isMulti =
    Boolean(question?.isMultiSelect) ||
    (!question && MULTI_SELECT_IDS.has(questionId)) ||
    Array.isArray(userVal) ||
    Array.isArray(matchVal);

  if (isMulti) {
    const setB = new Set(listB.filter((x) => !isNoneOption(x) && !isNotApplicableOption(x)));
    const rawCommon = Array.from(
      new Set(listA.filter((x) => !isNoneOption(x) && !isNotApplicableOption(x) && setB.has(x)))
    );
    if (question) {
      const orderMap = new Map(question.options.map((opt, idx) => [opt.id, idx]));
      rawCommon.sort((a, b) => (orderMap.get(a) ?? 999) - (orderMap.get(b) ?? 999));
    }
    return rawCommon;
  }

  return listA[0] === listB[0] ? [listA[0]] : [];
}

export function calculatePairwiseSimilarity(
  userAnswers: Record<string, string | string[]>,
  matchAnswers: Record<string, string | string[]>
): DetailedMatchCalculation {
  let observedWeightSum = 0;
  let earnedScoreSum = 0;
  const sharedInterests: string[] = [];
  const divergentInterests: string[] = [];
  const dimensionBreakdown: DetailedMatchCalculation['dimensionBreakdown'] = {};

  const effectiveWeights: Record<string, number> = {
    ...CATEGORY_WEIGHTS,
    ...getCustomCatalogQuestionWeights(),
  };

  for (const [qid, weight] of Object.entries(effectiveWeights)) {
    const userVal = userAnswers[qid];
    const matchVal = matchAnswers[qid];

    const listA = toNormalizedList(userVal);
    const listB = toNormalizedList(matchVal);

    // Exclude unanswered questions from the comparison denominator
    if (listA.length === 0 || listB.length === 0) {
      continue;
    }

    // Exclude "Not applicable" (*_na) answers from the comparison denominator
    if (listA.some(isNotApplicableOption) || listB.some(isNotApplicableOption)) {
      continue;
    }

    observedWeightSum += weight;

    const sharedIds = getSharedOptionIds(qid, userVal, matchVal);
    const matched = sharedIds.length > 0;
    const ratio = matched ? 1.0 : 0.0;

    earnedScoreSum += weight * ratio;

    if (matched) {
      sharedInterests.push(qid);
    } else {
      divergentInterests.push(qid);
    }

    dimensionBreakdown[qid] = {
      weight,
      score: matched ? 100 : 0,
      matched,
      userValue: matched ? (sharedIds.length === 1 ? sharedIds[0] : sharedIds) : userVal,
      matchValue: matched ? (sharedIds.length === 1 ? sharedIds[0] : sharedIds) : matchVal,
    };
  }

  const coverageScore = Math.min(100, Math.round(observedWeightSum * 100));
  const similarityScore =
    observedWeightSum > 0 ? Math.round((earnedScoreSum / observedWeightSum) * 100) : 0;

  return {
    similarityScore,
    coverageScore,
    sharedInterests,
    divergentInterests,
    dimensionBreakdown,
  };
}

export async function getTopTwinMatches(
  userProfileOrAnswers: UserProfile | Record<string, string | string[]>,
  limitOrCandidates?: number | MatchProfile[],
  candidatesList?: MatchProfile[]
): Promise<MatchProfile[]> {
  const isFullProfile =
    Boolean(userProfileOrAnswers) &&
    typeof userProfileOrAnswers === 'object' &&
    'answers' in userProfileOrAnswers &&
    'id' in userProfileOrAnswers;

  const requestingProfile = isFullProfile ? (userProfileOrAnswers as UserProfile) : null;
  const requestingUserId = requestingProfile?.id ?? null;
  const requestingUsername = requestingProfile?.username?.toLowerCase() ?? null;
  const requestingAccountMode = requestingProfile?.accountMode ?? 'demo';

  const answers: Record<string, string | string[]> = requestingProfile
    ? requestingProfile.answers
    : (userProfileOrAnswers as Record<string, string | string[]>);

  // Strict demo vs real account pool boundary:
  // MOCK_MATCHES are exclusively demo candidates and are never mixed into an authenticated pool.
  let candidates: MatchProfile[] = requestingAccountMode === 'demo' ? MOCK_MATCHES : [];
  let limit = 5;

  if (Array.isArray(limitOrCandidates)) {
    candidates = limitOrCandidates;
  } else if (typeof limitOrCandidates === 'number') {
    limit = limitOrCandidates;
  }

  if (Array.isArray(candidatesList)) {
    candidates = candidatesList;
  }

  // Filter out self-matches and cross-mode leaks before scoring
  const eligibleCandidates = candidates.filter((candidate) => {
    if (!candidate || !candidate.id) return false;
    if (requestingUserId && candidate.id === requestingUserId) return false;
    if (requestingUsername && candidate.username?.toLowerCase() === requestingUsername) {
      return false;
    }
    if (requestingAccountMode === 'authenticated' && candidate.isDemo === true) {
      return false;
    }
    return true;
  });

  const scored = eligibleCandidates.map((candidate) => {
    const calc = calculatePairwiseSimilarity(answers, candidate.answers);
    const score = observedHasValidComparison(calc) ? calc.similarityScore : candidate.similarityScore;
    return {
      ...candidate,
      similarityScore: score,
      sharedInterests: calc.sharedInterests.length > 0 ? calc.sharedInterests : candidate.sharedInterests,
    };
  });

  return scored
    .sort((a, b) => {
      if (b.similarityScore !== a.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      return a.id.localeCompare(b.id);
    })
    .slice(0, limit);
}

function observedHasValidComparison(calc: DetailedMatchCalculation): boolean {
  return calc.coverageScore > 0;
}

// ============================================================================
// Service Boundary Adapter for 10,000+ Account Discovery & Paginated Queries
// ============================================================================

class DemoMatchingRepository implements IMatchingRepository {
  readonly mode: AccountMode = 'demo';

  async getTopMatchesForUser(
    userProfile: UserProfile,
    options?: Partial<CandidateQueryOptions>
  ): Promise<MatchProfile[]> {
    const limit = options?.limit ?? 5;
    return getTopTwinMatches(userProfile, limit, options?.candidatesOverride);
  }

  async queryDiscoverableCandidates(
    userProfile: UserProfile,
    options?: Partial<CandidateQueryOptions>
  ): Promise<PaginatedMatchResult> {
    const pageSize = Math.max(1, Math.min(options?.limit ?? 20, 50));
    const pool = options?.candidatesOverride ?? (this.mode === 'demo' ? MOCK_MATCHES : []);

    // Score & rank eligible candidates excluding requesting user
    const allScored = await getTopTwinMatches(userProfile, pool.length || 1, pool);

    const cityFilter = options?.city && options.city !== 'all' ? options.city.toLowerCase() : null;
    const queryFilter = options?.searchQuery?.trim().toLowerCase() || null;

    const filtered = allScored.filter((m) => {
      if (cityFilter && m.city.toLowerCase() !== cityFilter) return false;
      if (queryFilter) {
        const inUsername = m.username.toLowerCase().includes(queryFilter);
        const inBio = Boolean(m.bio && m.bio.toLowerCase().includes(queryFilter));
        if (!inUsername && !inBio) return false;
      }
      return true;
    });

    let startIndex = 0;
    if (options?.cursor) {
      const idx = filtered.findIndex((item) => item.id === options.cursor);
      if (idx >= 0) {
        startIndex = idx + 1;
      }
    }

    const items = filtered.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < filtered.length;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}

class SupabaseMatchingRepositoryPlaceholder extends DemoMatchingRepository {
  override readonly mode: AccountMode = 'authenticated';
}

const demoMatchingRepo = new DemoMatchingRepository();
const supabaseMatchingRepoPlaceholder = new SupabaseMatchingRepositoryPlaceholder();

export function getMatchingRepository(): IMatchingRepository {
  return getActiveAccountMode() === 'authenticated'
    ? supabaseMatchingRepoPlaceholder
    : demoMatchingRepo;
}


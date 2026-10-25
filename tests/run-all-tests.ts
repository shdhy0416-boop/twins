/**
 * Automated Verification Suite — TWIN Multi-Account Demo Preparation
 *
 * Verifies local demo-mode invariants:
 * 1. Every built-in and newly registered demo user has a stable, unique user ID.
 * 2. Profiles, 15-question onboarding answers, privacy settings, saved bookmarks,
 *    daily vibe votes/streaks, and feedback items strictly belong to their owner user ID.
 * 3. Switching or creating demo users never leaks profile or preference data across sessions.
 * 4. Legacy v1 unscoped localStorage keys migrate non-destructively to the legacy owner
 *    (normalizing legacy 'user_faisal' -> 'twin_1_faisal') without leaking to new demo users.
 * 5. Demo accounts and mock candidates are strictly separated from 'authenticated' namespaces.
 * 6. Matching service excludes self-matches while preserving deterministic similarity scores.
 */

import assert from 'node:assert/strict';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
  writable: true,
});

import { MOCK_MATCHES } from '../src/data/mockMatches';
import { ONBOARDING_QUESTIONS } from '../src/data/questions';
import {
  getDailyVibeAnswer,
  getVibeStreak,
  saveDailyVibeAnswer,
} from '../src/data/vibeCheckData';
import { DEMO_MODE_ONLY_LOCK, getActiveAccountMode, isSupabaseConfigured } from '../src/lib/supabase';
import {
  getAuthService,
  isUsernameAvailable,
  maskPhoneNumber,
  registerOrSwitchDemoAccount,
} from '../src/services/authService';
import {
  calculatePairwiseSimilarity,
  getMatchingRepository,
  getTopTwinMatches,
} from '../src/services/matchingService';
import {
  createFreshDemoProfile,
  loadSavedProfileIds,
  loadUserFeedbackItems,
  loadUserProfile,
  loadUserProfileOrDefault,
  saveSavedProfileIds,
  saveUserProfile,
  submitUserFeedbackItem,
} from '../src/services/profileService';
import {
  buildUserResourceKey,
  DEFAULT_DEMO_USER_ID,
  deriveStableDemoUserId,
  LEGACY_KEYS,
  migrateLegacyDemoStorageIfNeeded,
  readUserScopedRecord,
  writeUserScopedRecord,
} from '../src/services/storageNamespace';
import {
  filterAdminDemoUsers,
  formatQuestionAnswerForAdmin,
  getAdminDashboardSnapshot,
  getDemoUserTopMatches,
} from '../src/services/adminService';
import {
  buildPreviewQuestionsForCategoryDraft,
  getActiveQuestionnaireQuestions,
  getCatalogModificationSummary,
  getCategoryPartitionStorageKey,
  getQuestionCatalogRepository,
  inspectCategoryDependency,
  inspectOptionDependency,
  inspectQuestionDependency,
  resolveCatalogOptionLabel,
} from '../src/services/questionCatalogService';
import { UserProfile } from '../src/types';

async function runTests(): Promise<void> {
  let passed = 0;

  async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
    memoryStorage.clear();
    await fn();
    passed += 1;
    console.log(`✓ ${name}`);
  }

  // Test 1: Preparation safety lock & mock user ID uniqueness
  await test('Demo preparation lock is active and all mock users have stable unique demo IDs', () => {
    assert.equal(DEMO_MODE_ONLY_LOCK, true);
    assert.equal(isSupabaseConfigured(), false);
    assert.equal(getActiveAccountMode(), 'demo');

    const ids = MOCK_MATCHES.map((m) => m.id);
    const usernames = MOCK_MATCHES.map((m) => m.username.toLowerCase());
    assert.equal(new Set(ids).size, MOCK_MATCHES.length, 'Mock match IDs must be unique');
    assert.equal(new Set(usernames).size, MOCK_MATCHES.length, 'Mock usernames must be unique');

    for (const match of MOCK_MATCHES) {
      assert.equal(match.isDemo, true);
      assert.equal(match.accountMode, 'demo');
    }

    assert.equal(deriveStableDemoUserId('rayan_riyadh'), 'usr_me');
    assert.equal(deriveStableDemoUserId('Omar_Jeddah'), 'demo_usr_omar_jeddah');
    assert.equal(deriveStableDemoUserId('omar_jeddah'), 'demo_usr_omar_jeddah');
  });

  // Test 2: Non-destructive migration of v1 unscoped demo storage + bookmark ID normalization
  await test('Legacy unscoped v1 storage migrates cleanly to legacy owner without data loss', () => {
    const legacyCustomProfile: UserProfile = {
      ...loadUserProfileOrDefault(DEFAULT_DEMO_USER_ID),
      id: 'usr_me',
      username: 'rayan_riyadh',
      city: 'Jeddah',
      bio: 'Migrated bio from v1 localStorage',
      answers: {
        q_coffee: 'coffee_spanish',
        q_vibe: 'vibe_creative',
      },
    };
    memoryStorage.clear();

    memoryStorage.setItem(LEGACY_KEYS.PROFILE_PRIMARY, JSON.stringify(legacyCustomProfile));
    memoryStorage.setItem(
      LEGACY_KEYS.SAVED_PROFILES,
      JSON.stringify(['user_faisal', 'user_noura', 'twin_3_saad'])
    );
    memoryStorage.setItem(
      LEGACY_KEYS.VIBE_STREAK,
      JSON.stringify({ count: 9, lastDate: '2026-10-22' })
    );
    memoryStorage.setItem(
      LEGACY_KEYS.SITE_SUGGESTIONS,
      JSON.stringify([
        {
          id: 'sug_legacy_1',
          category: 'feature',
          message: 'Add regional padel clubs filter',
          createdAt: 1700000000000,
          status: 'pending',
        },
      ])
    );

    const migration = migrateLegacyDemoStorageIfNeeded();
    assert.equal(migration.migrated, true);
    assert.equal(migration.legacyOwnerUserId, 'usr_me');

    const loadedRayan = loadUserProfile('usr_me');
    assert.ok(loadedRayan, 'Migrated profile must load for usr_me');
    assert.equal(loadedRayan.city, 'Jeddah');
    assert.equal(loadedRayan.bio, 'Migrated bio from v1 localStorage');
    assert.equal(loadedRayan.answers.q_coffee, 'coffee_spanish');

    // Legacy 'user_faisal' and 'user_noura' must normalize to canonical MOCK_MATCHES IDs
    const savedForRayan = loadSavedProfileIds('usr_me');
    assert.deepEqual(savedForRayan, ['twin_1_faisal', 'twin_2_noura', 'twin_3_saad']);
    const resolvedMatches = MOCK_MATCHES.filter((m) => savedForRayan.includes(m.id));
    assert.equal(resolvedMatches.length, 3);

    assert.equal(getVibeStreak('usr_me'), 9);
    assert.equal(loadUserFeedbackItems('usr_me').length, 1);

    // Crucial check: a brand-new demo user must NOT inherit usr_me's migrated data!
    assert.equal(loadUserProfile('demo_usr_sara_khobar'), null);
    assert.deepEqual(loadSavedProfileIds('demo_usr_sara_khobar'), []);
    assert.equal(loadUserFeedbackItems('demo_usr_sara_khobar').length, 0);
  });

  // Test 3: Strict multi-account demo session isolation across profiles, answers, bookmarks, vibe & feedback
  await test('Multiple demo accounts remain strictly isolated across sessions', async () => {
    // Session A: Default user usr_me saves custom answers, bookmarks, vibe vote, and feedback
    const sessionA = getAuthService().getCurrentSession();
    assert.equal(sessionA?.user.id, 'usr_me');

    const profileA = loadUserProfileOrDefault('usr_me');
    profileA.bio = 'User A private bio';
    profileA.privacy.showGenderPublicly = true;
    profileA.answers = { ...profileA.answers, q_coffee: 'coffee_v60' };
    await saveUserProfile(profileA, 'usr_me');
    await saveSavedProfileIds('usr_me', ['twin_1_faisal']);
    saveDailyVibeAnswer('vibe_q_today_mood_and_plan', 'opt_mood_going_out', 'usr_me');
    await submitUserFeedbackItem('usr_me', {
      id: 'sug_a',
      category: 'avatar',
      message: 'User A feedback item',
      createdAt: Date.now(),
      status: 'pending',
    });

    // Session B: Register a second demo user via authService
    const sessionB = await registerOrSwitchDemoAccount({
      username: 'khaled_abudhabi',
      city: 'Abu Dhabi',
      phone: '+971 50 999 8877',
    });

    assert.equal(sessionB.user.id, 'demo_usr_khaled_abudhabi');
    assert.notEqual(sessionB.user.id, 'usr_me');
    assert.equal(sessionB.user.phoneMasked, maskPhoneNumber('+971 50 999 8877'));
    // Raw phone number must not be stored in localStorage
    const rawSessionJson = JSON.stringify(sessionB);
    assert.equal(rawSessionJson.includes('999 8877'), false);

    // Verify User B starts clean with zero leakage from User A
    assert.equal(loadUserProfile(sessionB.user.id), null);
    const freshB = createFreshDemoProfile({
      id: sessionB.user.id,
      username: sessionB.user.username,
      city: 'Abu Dhabi',
    });
    assert.deepEqual(freshB.answers, {});
    assert.equal(freshB.isCompleted, false);
    assert.deepEqual(loadSavedProfileIds(sessionB.user.id), []);
    assert.equal(getDailyVibeAnswer('vibe_q_today_mood_and_plan', sessionB.user.id), null);
    assert.equal(loadUserFeedbackItems(sessionB.user.id).length, 0);

    // Save distinct data for User B
    freshB.answers = { q_coffee: 'coffee_matcha', q_travel: 'travel_nature' };
    freshB.isCompleted = true;
    await saveUserProfile(freshB, sessionB.user.id);
    await saveSavedProfileIds(sessionB.user.id, ['twin_6_reem']);
    saveDailyVibeAnswer('vibe_q_today_mood_and_plan', 'opt_mood_chill_home', sessionB.user.id);

    // Verify User A's stored state was completely untouched by User B
    const reloadedA = loadUserProfile('usr_me');
    const reloadedB = loadUserProfile(sessionB.user.id);
    assert.equal(reloadedA?.answers.q_coffee, 'coffee_v60');
    assert.equal(reloadedB?.answers.q_coffee, 'coffee_matcha');
    assert.deepEqual(loadSavedProfileIds('usr_me'), ['twin_1_faisal']);
    assert.deepEqual(loadSavedProfileIds(sessionB.user.id), ['twin_6_reem']);
    assert.equal(
      getDailyVibeAnswer('vibe_q_today_mood_and_plan', 'usr_me'),
      'opt_mood_going_out'
    );
    assert.equal(
      getDailyVibeAnswer('vibe_q_today_mood_and_plan', sessionB.user.id),
      'opt_mood_chill_home'
    );
  });

  // Test 4: Tampered cross-user envelope protection & demo/authenticated separation
  await test('Tampered cross-user storage envelopes and cross-mode writes are rejected', async () => {
    const profileA = loadUserProfileOrDefault('usr_me');

    // Attempt to save profileA (id='usr_me') into User B's slot -> must fail
    const mismatchedSave = await saveUserProfile(profileA, 'demo_usr_intruder');
    assert.equal(mismatchedSave, false);

    // Manually tamper with localStorage to put usr_me's envelope under demo_usr_victim's key
    const victimKey = buildUserResourceKey('demo', 'demo_usr_victim', 'profile');
    memoryStorage.setItem(
      victimKey,
      JSON.stringify({
        schemaVersion: 2,
        accountMode: 'demo',
        userId: 'usr_me', // mismatched owner!
        updatedAt: new Date().toISOString(),
        data: profileA,
      })
    );
    assert.equal(readUserScopedRecord('demo', 'demo_usr_victim', 'profile'), null);
    assert.equal(loadUserProfile('demo_usr_victim'), null);

    // Attempt to write a demo user ID into the 'authenticated' namespace -> must be blocked
    const crossModeWrite = writeUserScopedRecord(
      'authenticated',
      'demo_usr_victim',
      'profile',
      profileA
    );
    assert.equal(crossModeWrite, false);
  });

  // Test 5: Username validation & mock collision protection
  await test('Username availability blocks reserved names and mock candidate collisions', async () => {
    assert.equal(await isUsernameAvailable('admin'), false);
    assert.equal(await isUsernameAvailable('faisal_riyadh'), false);
    assert.equal(await isUsernameAvailable('noura_jeddah'), false);
    assert.equal(await isUsernameAvailable('new_unique_twin'), true);
  });

  // Test 6: Self-match exclusion, authenticated pool separation, and cursor pagination
  await test('Matching service prevents self-matching, separates demo pool, and supports cursor pagination', async () => {
    assert.equal(ONBOARDING_QUESTIONS.length, 16);

    const userAsCandidate: UserProfile = {
      ...loadUserProfileOrDefault('usr_me'),
      id: 'twin_1_faisal', // Simulate active user being present in candidate pool
      username: 'faisal_riyadh',
    };

    const topMatches = await getTopTwinMatches(userAsCandidate, 6, MOCK_MATCHES);
    assert.equal(
      topMatches.some((m) => m.id === 'twin_1_faisal'),
      false,
      'User must never be matched with themselves'
    );

    // Authenticated profile must NOT receive demo MOCK_MATCHES
    const futureRealUser: UserProfile = {
      ...loadUserProfileOrDefault('usr_me'),
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'real_auth_user',
      isDemo: false,
      accountMode: 'authenticated',
    };
    const authMatchesWithoutRealDB = await getTopTwinMatches(futureRealUser, 5);
    assert.equal(
      authMatchesWithoutRealDB.length,
      0,
      'Demo mock profiles must never leak into authenticated user match results'
    );

    // Cursor pagination contract check
    const repo = getMatchingRepository();
    const page1 = await repo.queryDiscoverableCandidates(loadUserProfileOrDefault('usr_me'), {
      limit: 2,
    });
    assert.equal(page1.items.length, 2);
    assert.equal(page1.hasMore, true);
    assert.ok(page1.nextCursor);

    const page2 = await repo.queryDiscoverableCandidates(loadUserProfileOrDefault('usr_me'), {
      limit: 2,
      cursor: page1.nextCursor,
    });
    assert.equal(page2.items.length, 2);
    assert.notEqual(page1.items[0].id, page2.items[0].id);

    // Verify deterministic scoring remains intact
    const calc = calculatePairwiseSimilarity(
      loadUserProfileOrDefault('usr_me').answers,
      MOCK_MATCHES[0].answers
    );
    assert.ok(calc.similarityScore > 0 && calc.similarityScore <= 100);
    assert.equal(calc.coverageScore, 100);
  });

  // Test 7: Admin Dashboard Overview, Questionnaire & System Status accuracy
  await test('Admin dashboard computes accurate metrics from real demo records and reports honest DEMO status', () => {
    const snap = getAdminDashboardSnapshot('usr_me');

    // System status must report DEMO and disconnected live backend
    assert.equal(snap.systemStatus.applicationMode, 'DEMO');
    assert.equal(snap.systemStatus.realBackendConnected, false);
    assert.equal(snap.systemStatus.supabaseClientInitialized, false);
    assert.equal(snap.systemStatus.verifiedRealAccountsCount, null);
    assert.equal(snap.overview.verifiedRealWorldMatchesCount, null);

    // Initial demo records: 1 local session ('usr_me') + 6 MOCK_MATCHES = 7 demo users
    assert.equal(snap.overview.totalDemoUsers, 1 + MOCK_MATCHES.length);
    assert.equal(snap.overview.localSessionUsersCount, 1);
    assert.equal(snap.overview.mockPoolUsersCount, MOCK_MATCHES.length);
    assert.equal(snap.overview.completedProfilesCount, 7);
    assert.equal(snap.overview.incompleteProfilesCount, 0);
    assert.equal(snap.overview.questionnaireCompletionRate, 100);
    assert.equal(snap.overview.totalAnsweredSlots, 7 * ONBOARDING_QUESTIONS.length);

    // Pairwise compatibility counts: 6 active-user pairs, C(7, 2) = 21 unique pairs
    assert.equal(snap.overview.activeUserCompatibilityCount, 6);
    assert.equal(snap.overview.allPairsCompatibilityCount, 21);

    // Distribution bucket counts must sum to exact pair counts
    const sumActiveBuckets = snap.compatibility.activeUserDistribution.reduce(
      (s, b) => s + b.count,
      0
    );
    const sumAllBuckets = snap.compatibility.allPairsDistribution.reduce(
      (s, b) => s + b.count,
      0
    );
    assert.equal(sumActiveBuckets, 6);
    assert.equal(sumAllBuckets, 21);

    // Questionnaire overview matches ONBOARDING_QUESTIONS exactly
    assert.equal(snap.questionnaire.totalQuestions, 16);
    assert.equal(snap.questionnaire.totalCategories, 16);
    const totalWeight = snap.questionnaire.categories.reduce(
      (sum, c) => sum + c.weightPercent,
      0
    );
    assert.equal(totalWeight, 100);
  });

  // Test 8: Admin User Search, Completion Filtering (Completed vs Incomplete), & Secret Redaction
  await test('Admin user search, completion filtering, and secret redaction work across completed and incomplete demo users', async () => {
    // Register two additional demo accounts: one unstarted (0/15) and one partial (3/15)
    const unstartedSession = await registerOrSwitchDemoAccount({
      username: 'tariq_tabuk',
      city: 'Tabuk',
      phone: '+966 55 123 9876',
    });
    const partialSession = await registerOrSwitchDemoAccount({
      username: 'hana_jeddah',
      city: 'Jeddah',
      phone: '+966 50 765 4321',
    });
    const partialProfile = createFreshDemoProfile({
      id: partialSession.user.id,
      username: partialSession.user.username,
      city: 'Jeddah',
    });
    partialProfile.answers = {
      q_coffee: 'coffee_v60',
      q_sports: ['sport_padel'],
      q_vibe: 'vibe_ambitious',
    };
    await saveUserProfile(partialProfile, partialSession.user.id);

    const snap = getAdminDashboardSnapshot('usr_me');
    assert.equal(snap.overview.totalDemoUsers, 9);
    assert.equal(snap.overview.completedProfilesCount, 7);
    assert.equal(snap.overview.incompleteProfilesCount, 2);
    assert.equal(snap.overview.partialProfilesCount, 1);
    assert.equal(snap.overview.notStartedProfilesCount, 1);

    // Filter by completion status
    const completedOnly = filterAdminDemoUsers(snap.users, {
      completionFilter: 'completed',
    });
    const incompleteOnly = filterAdminDemoUsers(snap.users, {
      completionFilter: 'incomplete',
    });
    assert.equal(completedOnly.length, 7);
    assert.equal(incompleteOnly.length, 2);

    // Search by username, @handle, userId, and city
    assert.equal(
      filterAdminDemoUsers(snap.users, { searchQuery: '@faisal_riyadh' }).length,
      1
    );
    assert.equal(
      filterAdminDemoUsers(snap.users, { searchQuery: unstartedSession.user.id }).length,
      1
    );
    assert.equal(
      filterAdminDemoUsers(snap.users, {
        searchQuery: 'hana',
        completionFilter: 'incomplete',
      }).length,
      1
    );

    // Verify all admin user records are tagged as demo data and never expose raw phone numbers or tokens
    const serializedUsers = JSON.stringify(snap.users);
    assert.equal(serializedUsers.includes('123 9876'), false);
    assert.equal(serializedUsers.includes('765 4321'), false);
    assert.equal(serializedUsers.includes('phoneMasked'), false);
    for (const u of snap.users) {
      assert.equal(u.isDemo, true);
      assert.equal(u.accountMode, 'demo');
    }

    // Verify answer formatting and top matches inspection helper
    const hanaRecord = snap.users.find((u) => u.id === partialSession.user.id)!;
    assert.ok(formatQuestionAnswerForAdmin('q_coffee', hanaRecord.answers.q_coffee, 'en')?.includes('V60'));
    assert.ok(formatQuestionAnswerForAdmin('q_coffee', hanaRecord.answers.q_coffee, 'ar')?.includes('V60'));
    assert.equal(formatQuestionAnswerForAdmin('q_cars', hanaRecord.answers.q_cars, 'en'), null);
    assert.ok(getDemoUserTopMatches(hanaRecord, snap.users, 3).length > 0);
  });

  // Test 9: 95% & 90% Compatibility Benchmark Scenarios & Simulated vs Real-World Distinction
  await test('Admin compatibility analytics include deterministic 95% and 90% demo scenarios marked as simulated', () => {
    const snap = getAdminDashboardSnapshot('usr_me');
    const scenario95 = snap.compatibility.benchmarkScenarios.find(
      (s) => s.id === 'scenario_demo_95'
    );
    const scenario90 = snap.compatibility.benchmarkScenarios.find(
      (s) => s.id === 'scenario_demo_90'
    );

    assert.ok(scenario95, '95% demo compatibility scenario must exist');
    assert.equal(scenario95.computedScore, 95);
    assert.equal(scenario95.coverageScore, 100);
    assert.equal(scenario95.isVerifiedRealWorld, false);

    assert.ok(scenario90, '90% demo compatibility scenario must exist');
    assert.equal(scenario90.computedScore, 90);
    assert.equal(scenario90.coverageScore, 100);
    assert.equal(scenario90.isVerifiedRealWorld, false);

    for (const pair of snap.compatibility.allCommunityPairs) {
      assert.equal(pair.dataOrigin, 'simulated_demo');
      assert.equal(pair.isVerifiedRealWorld, false);
    }
  });

  // Test 10: Strict Category Independence (Sports vs Coffee vs Refreshing Drinks) & Stable IDs
  await test('Editing Sports, Refreshing Drinks, or Coffee categories is strictly isolated with stable IDs', () => {
    const repo = getQuestionCatalogRepository();

    const initialCoffee = repo.getCategoryPartition('coffee')!;
    const initialDrinks = repo.getCategoryPartition('drinks')!;
    const sportsPart = repo.getCategoryPartition('sports')!;

    assert.equal(memoryStorage.getItem(getCategoryPartitionStorageKey('coffee')), null);
    assert.equal(memoryStorage.getItem(getCategoryPartitionStorageKey('drinks')), null);
    assert.equal(memoryStorage.getItem(getCategoryPartitionStorageKey('sports')), null);

    // 1. Edit Sports category wording, question text, and option label
    const originalSportsQId = sportsPart.questions[0].id;
    const originalPadelOptId = sportsPart.questions[0].options[0].id;

    const sportsSave = repo.saveCategoryPartition('sports', {
      category: {
        ...sportsPart.category,
        nameEn: 'Favorite Active Sports (Updated)',
        nameAr: 'الرياضات الحركية المفضلة (محدث)',
      },
      questions: sportsPart.questions.map((q) => ({
        ...q,
        titleEn: 'Which active sports energize your week?',
        titleAr: 'ما الرياضات التي تجدد طاقتك أسبوعياً؟',
        options: q.options.map((o, idx) =>
          idx === 0
            ? { ...o, labelEn: 'Padel Championship', labelAr: 'بطولات البادل' }
            : o
        ),
      })),
    });

    assert.equal(sportsSave.success, true);
    // Stable IDs must NEVER change when wording changes
    assert.equal(sportsSave.partition?.questions[0].id, originalSportsQId);
    assert.equal(sportsSave.partition?.questions[0].options[0].id, originalPadelOptId);

    // CRITICAL: Coffee and Refreshing Drinks storage keys must remain completely untouched!
    assert.notEqual(memoryStorage.getItem(getCategoryPartitionStorageKey('sports')), null);
    assert.equal(memoryStorage.getItem(getCategoryPartitionStorageKey('coffee')), null);
    assert.equal(memoryStorage.getItem(getCategoryPartitionStorageKey('drinks')), null);
    assert.deepEqual(repo.getCategoryPartition('coffee'), initialCoffee);
    assert.deepEqual(repo.getCategoryPartition('drinks'), initialDrinks);

    // 2. Edit Refreshing Drinks (Excluding Coffee) -> must NOT touch Coffee or overwrite Sports
    const drinksPart = repo.getCategoryPartition('drinks')!;
    const drinksSave = repo.saveCategoryPartition('drinks', {
      category: {
        ...drinksPart.category,
        nameEn: 'Refreshing Drinks — Excluding Coffee (Edited)',
      },
      questions: drinksPart.questions,
    });
    assert.equal(drinksSave.success, true);
    assert.equal(memoryStorage.getItem(getCategoryPartitionStorageKey('coffee')), null);
    assert.deepEqual(repo.getCategoryPartition('coffee'), initialCoffee);
    assert.equal(
      repo.getCategoryPartition('sports')?.category.nameEn,
      'Favorite Active Sports (Updated)'
    );

    // 3. Edit Coffee -> must NOT touch Sports or Refreshing Drinks
    const coffeePart = repo.getCategoryPartition('coffee')!;
    const coffeeSave = repo.saveCategoryPartition('coffee', {
      category: {
        ...coffeePart.category,
        descriptionEn: 'Updated specialty coffee ritual description',
      },
      questions: coffeePart.questions,
    });
    assert.equal(coffeeSave.success, true);
    assert.equal(
      repo.getCategoryPartition('sports')?.questions[0].options[0].labelEn,
      'Padel Championship'
    );
    assert.equal(
      repo.getCategoryPartition('drinks')?.category.nameEn,
      'Refreshing Drinks — Excluding Coffee (Edited)'
    );

    // 4. Attempting to mix a Coffee question into Sports must be rejected by validation
    const crossContaminatedSave = repo.saveCategoryPartition('sports', {
      category: sportsSave.partition!.category,
      questions: [
        ...sportsSave.partition!.questions,
        initialCoffee.questions[0], // belongs to 'coffee'!
      ],
    });
    assert.equal(crossContaminatedSave.success, false);
    assert.ok(crossContaminatedSave.validationIssues.length > 0);
  });

  // Test 11: Custom Category Creation, Reordering, Enable/Disable Filtering & Preview Builder
  await test('Custom category creation, reordering, enable/disable filtering, and preview builder work cleanly', () => {
    const repo = getQuestionCatalogRepository();

    const created = repo.createCategory({
      nameEn: 'Reading & Podcasts',
      nameAr: 'القراءة والبودكاست',
      descriptionEn: 'Books and audio shows you enjoy',
      descriptionAr: 'الكتب والبرامج الصوتية المفضلة',
      iconKey: 'book',
      initialQuestion: {
        titleEn: 'What do you listen to or read most?',
        titleAr: 'ماذا تقرأ أو تستمع إليه غالباً؟',
      },
    });
    assert.equal(created.success, true);
    const customCatId = created.partition!.category.id;
    assert.equal(created.partition!.category.isBuiltIn, false);
    assert.equal(getActiveQuestionnaireQuestions().length, 17);

    // Move custom category to position 0 (first in onboarding)
    const allIds = repo.listCategoryPartitions().map((p) => p.category.id);
    const reorderedIds = [customCatId, ...allIds.filter((id) => id !== customCatId)];
    assert.equal(repo.reorderCategories(reorderedIds), true);
    assert.equal(getActiveQuestionnaireQuestions()[0].categoryId, customCatId);

    // Disable 'cars' category -> excluded from new user questionnaire sessions
    const disableRes = repo.setCategoryEnabled('cars', false);
    assert.equal(disableRes.success, true);
    assert.equal(
      getActiveQuestionnaireQuestions().some((q) => q.categoryId === 'cars'),
      false
    );
    assert.equal(getActiveQuestionnaireQuestions().length, 16);

    // Preview builder respects enabled flags on category, questions, and options
    const previewDisabledCat = buildPreviewQuestionsForCategoryDraft(
      repo.getCategoryPartition('cars')!
    );
    assert.equal(previewDisabledCat.length, 0);

    // Delete unreferenced custom category after confirmation
    const unconfirmedDelete = repo.deleteCategory(customCatId, { confirmed: false });
    assert.equal(unconfirmedDelete.success, false);
    const confirmedDelete = repo.deleteCategory(customCatId, { confirmed: true });
    assert.equal(confirmedDelete.success, true);
    assert.equal(repo.getCategoryPartition(customCatId), null);
  });

  // Test 12: Dependency Warnings, Historical User Answer Safety & Archive Label Resolution
  await test('Removing referenced options or questions warns dependencies and never deletes or breaks stored user answers', async () => {
    const repo = getQuestionCatalogRepository();
    const userBefore = loadUserProfileOrDefault('usr_me');
    assert.equal(userBefore.answers.q_coffee, 'coffee_v60');

    // Dependency checks must detect existing demo/user answers
    const optDep = inspectOptionDependency('q_coffee', 'coffee_v60');
    assert.ok(optDep.referencedByCount > 0, 'coffee_v60 must report active answer references');
    assert.equal(optDep.affectsBenchmarkScenarios, true);

    const qDep = inspectQuestionDependency('q_coffee');
    assert.ok(qDep.referencedByCount > 0);

    const catDep = inspectCategoryDependency('coffee');
    assert.equal(catDep.isBuiltIn, true);
    // Built-in categories cannot be hard-deleted even if confirmed
    const builtInDelete = repo.deleteCategory('coffee', { confirmed: true });
    assert.equal(builtInDelete.success, false);

    // Add a custom option, assign it to a local user, then remove it from active options
    const coffeePart = repo.getCategoryPartition('coffee')!;
    const coffeeQ = coffeePart.questions[0];
    const customOptId = 'coffee_opt_cold_drip_archive_test';

    repo.saveCategoryPartition('coffee', {
      category: coffeePart.category,
      questions: [
        {
          ...coffeeQ,
          options: [
            ...coffeeQ.options,
            {
              id: customOptId,
              labelEn: 'Kyoto Slow Cold Drip',
              labelAr: 'تقطير بارد بطيء كيوتو',
              iconKey: 'coffee',
              isEnabled: true,
              order: coffeeQ.options.length,
            },
          ],
        },
      ],
    });

    // Save a local user who selected this custom option
    const sessionCustom = await registerOrSwitchDemoAccount({
      username: 'archive_tester',
      city: 'Riyadh',
    });
    const customUser = createFreshDemoProfile({
      id: sessionCustom.user.id,
      username: 'archive_tester',
      city: 'Riyadh',
    });
    customUser.answers = { q_coffee: customOptId };
    await saveUserProfile(customUser, sessionCustom.user.id);

    // Dependency check detects @archive_tester
    const customOptDep = inspectOptionDependency('q_coffee', customOptId);
    assert.equal(customOptDep.referencedByCount, 1);
    assert.ok(customOptDep.referencedUserHandles.includes('@archive_tester'));

    // Remove the custom option from active question options
    const updatedPart = repo.getCategoryPartition('coffee')!;
    repo.saveCategoryPartition('coffee', {
      category: updatedPart.category,
      questions: [
        {
          ...updatedPart.questions[0],
          options: updatedPart.questions[0].options.filter((o) => o.id !== customOptId),
        },
      ],
    });

    // Stored user answer must remain untouched, and archived option label must still resolve!
    const reloadedCustomUser = loadUserProfile(sessionCustom.user.id)!;
    assert.equal(reloadedCustomUser.answers.q_coffee, customOptId);
    assert.equal(
      resolveCatalogOptionLabel('q_coffee', customOptId, 'en'),
      'Kyoto Slow Cold Drip'
    );
    assert.equal(
      resolveCatalogOptionLabel('q_coffee', customOptId, 'ar'),
      'تقطير بارد بطيء كيوتو'
    );
  });

  // Test 13: Per-Category & Global Restore Defaults + Preservation of 95% and 90% Scenarios
  await test('Restore defaults works per-category and globally while preserving 95% and 90% compatibility scenarios', () => {
    const repo = getQuestionCatalogRepository();

    const coffeePart = repo.getCategoryPartition('coffee')!;
    const sportsPart = repo.getCategoryPartition('sports')!;

    repo.saveCategoryPartition('coffee', {
      category: { ...coffeePart.category, nameEn: 'Modified Coffee Title' },
      questions: coffeePart.questions,
    });
    repo.saveCategoryPartition('sports', {
      category: { ...sportsPart.category, nameEn: 'Modified Sports Title' },
      questions: sportsPart.questions,
    });
    assert.equal(getCatalogModificationSummary().hasAnyLocalChanges, true);

    // Restore ONLY coffee -> sports must keep its custom title
    const singleRestore = repo.restoreCategoryToDefault('coffee');
    assert.equal(singleRestore.success, true);
    assert.equal(
      repo.getCategoryPartition('coffee')?.category.nameEn,
      'Your Daily Coffee Ritual'
    );
    assert.equal(
      repo.getCategoryPartition('sports')?.category.nameEn,
      'Modified Sports Title'
    );

    // Restore ALL defaults -> everything returns to immutable seed state
    repo.restoreAllDefaults();
    assert.equal(getCatalogModificationSummary().hasAnyLocalChanges, false);
    assert.equal(getActiveQuestionnaireQuestions().length, 16);

    // Verify 95% and 90% compatibility scenarios remain 100% deterministic
    const snap = getAdminDashboardSnapshot('usr_me');
    const scenario95 = snap.compatibility.benchmarkScenarios.find(
      (s) => s.id === 'scenario_demo_95'
    );
    const scenario90 = snap.compatibility.benchmarkScenarios.find(
      (s) => s.id === 'scenario_demo_90'
    );
    assert.equal(scenario95?.computedScore, 95);
    assert.equal(scenario90?.computedScore, 90);
  });

  console.log(`\nAll ${passed} TWIN verification test suites passed.`);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

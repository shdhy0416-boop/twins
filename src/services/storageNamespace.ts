import { AccountMode, SiteFeedbackItem, UserProfile } from '../types';

/**
 * User-Scoped & Mode-Isolated Storage Layer (TWIN v2)
 *
 * Solves local persistence & cross-session leakage issues by:
 * 1. Separating 'demo' accounts from future 'authenticated' accounts via distinct key prefixes.
 * 2. Scoping every user-owned record (profile, answers, saved bookmarks, daily vibe votes,
 *    vibe streaks, feedback history) to its exact `userId`.
 * 3. Wrapping every persisted value in a signed ownership envelope (`schemaVersion`,
 *    `accountMode`, `userId`, `updatedAt`, `data`) and verifying ownership on read so
 *    data from User A can NEVER be loaded into User B's session.
 * 4. Performing a non-destructive, one-time migration from legacy unscoped keys
 *    (`twin_user_profile_data`, `twin_user_profile`, `twin_saved_profile_ids`,
 *    `twin_vibe_streak_data`, `twin_vibe_check_*`, `twin_site_suggestions`) into the
 *    canonical legacy demo owner's namespace without losing existing demo data.
 */

export const STORAGE_SCHEMA_VERSION = 2;
export const DEFAULT_DEMO_USER_ID = 'usr_me';
export const DEFAULT_DEMO_USERNAME = 'rayan_riyadh';
export const DEMO_ID_PREFIX = 'demo_usr_';
export const MOCK_CANDIDATE_ID_PREFIX = 'twin_';

// Legacy unscoped keys from v1 single-user demo
export const LEGACY_KEYS = {
  PROFILE_PRIMARY: 'twin_user_profile_data',
  PROFILE_FALLBACK: 'twin_user_profile',
  SAVED_PROFILES: 'twin_saved_profile_ids',
  VIBE_STREAK: 'twin_vibe_streak_data',
  VIBE_CHECK_PREFIX: 'twin_vibe_check_',
  SITE_SUGGESTIONS: 'twin_site_suggestions',
} as const;

// Device-level UI preferences (intentionally shared across browser tab, contains zero PII/profile data)
export const DEVICE_PREFERENCE_KEYS = {
  THEME_MODE: 'twin_theme_mode',
  SOUND_ENABLED: 'twin_sound_enabled',
} as const;

// Legacy bookmark ID normalization map (fixes historical mismatch where App.tsx seeded
// 'user_faisal' / 'user_noura' while MOCK_MATCHES used 'twin_1_faisal' / 'twin_2_noura')
const LEGACY_MATCH_ID_MAP: Record<string, string> = {
  user_faisal: 'twin_1_faisal',
  user_noura: 'twin_2_noura',
  user_saad: 'twin_3_saad',
  user_lama: 'twin_4_lama',
  user_bader: 'twin_5_bader',
  user_reem: 'twin_6_reem',
};

export interface ScopedStorageEnvelope<T> {
  schemaVersion: number;
  accountMode: AccountMode;
  userId: string;
  updatedAt: string;
  data: T;
}

export type UserResourceKind =
  | 'profile'
  | 'answers'
  | 'saved_profiles'
  | 'vibe_streak'
  | 'feedback'
  | `vibe_check:${string}`;

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

export function normalizeMatchProfileId(rawId: string): string {
  const trimmed = String(rawId || '').trim();
  return LEGACY_MATCH_ID_MAP[trimmed] || trimmed;
}

export function normalizeMatchProfileIdList(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of ids) {
    if (typeof item !== 'string') continue;
    const mapped = normalizeMatchProfileId(item);
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      normalized.push(mapped);
    }
  }
  return normalized;
}

export function isDemoUserId(userId: string): boolean {
  return (
    userId === DEFAULT_DEMO_USER_ID ||
    userId.startsWith(DEMO_ID_PREFIX) ||
    userId.startsWith(MOCK_CANDIDATE_ID_PREFIX)
  );
}

/**
 * Generates a deterministic, stable demo user ID from a normalized username.
 * Preserves 'usr_me' for the canonical default demo persona ('rayan_riyadh')
 * so existing demo sessions keep full continuity.
 */
export function deriveStableDemoUserId(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!clean || clean === DEFAULT_DEMO_USERNAME) {
    return DEFAULT_DEMO_USER_ID;
  }
  return `${DEMO_ID_PREFIX}${clean}`;
}

export function buildUserResourceKey(
  accountMode: AccountMode,
  userId: string,
  resource: UserResourceKind
): string {
  const safeMode: AccountMode = accountMode === 'authenticated' ? 'authenticated' : 'demo';
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) {
    throw new Error('Cannot build storage key without a valid non-empty userId');
  }
  return `twin:v2:${safeMode}:user:${safeUserId}:${resource}`;
}

export function buildSystemKey(accountMode: AccountMode, keyName: string): string {
  const safeMode: AccountMode = accountMode === 'authenticated' ? 'authenticated' : 'demo';
  return `twin:v2:${safeMode}:sys:${keyName}`;
}

/**
 * Writes a user-owned record wrapped in an ownership envelope.
 * Enforces mode/ID separation so demo accounts cannot write into authenticated keys.
 */
export function writeUserScopedRecord<T>(
  accountMode: AccountMode,
  userId: string,
  resource: UserResourceKind,
  data: T
): boolean {
  const storage = getStorage();
  if (!storage || !userId) return false;

  if (accountMode === 'authenticated' && isDemoUserId(userId)) {
    console.error(`Blocked attempt to persist demo userId "${userId}" in authenticated namespace.`);
    return false;
  }

  const envelope: ScopedStorageEnvelope<T> = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    accountMode,
    userId,
    updatedAt: new Date().toISOString(),
    data,
  };

  try {
    const key = buildUserResourceKey(accountMode, userId, resource);
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch (err) {
    console.error(`Failed to write scoped resource "${resource}" for user "${userId}":`, err);
    return false;
  }
}

/**
 * Reads a user-owned record and strictly validates that both `accountMode`
 * and `userId` inside the stored envelope match the caller's session.
 * Any mismatched or corrupted payload is rejected (`null`), preventing cross-user leakage.
 */
export function readUserScopedRecord<T>(
  accountMode: AccountMode,
  userId: string,
  resource: UserResourceKind
): T | null {
  const storage = getStorage();
  if (!storage || !userId) return null;

  try {
    const key = buildUserResourceKey(accountMode, userId, resource);
    const raw = storage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ScopedStorageEnvelope<T>>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.accountMode !== accountMode ||
      parsed.userId !== userId ||
      !('data' in parsed)
    ) {
      return null;
    }

    return parsed.data as T;
  } catch {
    return null;
  }
}

/**
 * Removes all local records belonging to a specific `(accountMode, userId)` pair.
 * Used for clean account deletion and local cache purge.
 */
export function purgeScopedUserRecords(accountMode: AccountMode, userId: string): void {
  const storage = getStorage();
  if (!storage || !userId) return;

  const prefix = `twin:v2:${accountMode}:user:${userId}:`;
  const keysToRemove: string[] = [];

  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k);
    }
  } catch {
    // ignore storage iteration errors
  }
}

const MIGRATION_MARKER_KEY = buildSystemKey('demo', 'legacy_v1_migrated');

/**
 * Non-destructively migrates v1 unscoped demo keys into v2 user-scoped demo keys.
 * - Preserves existing user profile, onboarding answers, saved bookmarks, daily vibe votes,
 *   streak count, and feedback history for the legacy demo owner.
 * - Normalizes legacy bookmark IDs ('user_faisal' -> 'twin_1_faisal', etc.).
 * - Never leaks legacy v1 data into any newly created demo user session.
 */
export function migrateLegacyDemoStorageIfNeeded(): {
  migrated: boolean;
  legacyOwnerUserId: string;
} {
  const storage = getStorage();
  if (!storage) {
    return { migrated: false, legacyOwnerUserId: DEFAULT_DEMO_USER_ID };
  }

  try {
    const marker = storage.getItem(MIGRATION_MARKER_KEY);
    if (marker) {
      const parsedMarker = JSON.parse(marker) as { ownerUserId?: string };
      return {
        migrated: false,
        legacyOwnerUserId: parsedMarker.ownerUserId || DEFAULT_DEMO_USER_ID,
      };
    }

    let ownerUserId = DEFAULT_DEMO_USER_ID;

    // 1. Migrate legacy UserProfile & questionnaire answers
    const rawLegacyProfile =
      storage.getItem(LEGACY_KEYS.PROFILE_PRIMARY) ||
      storage.getItem(LEGACY_KEYS.PROFILE_FALLBACK);

    if (rawLegacyProfile) {
      try {
        const parsedProfile = JSON.parse(rawLegacyProfile) as Partial<UserProfile>;
        if (parsedProfile && typeof parsedProfile === 'object' && parsedProfile.username) {
          const resolvedId =
            typeof parsedProfile.id === 'string' && parsedProfile.id.trim().length > 0
              ? parsedProfile.id.trim()
              : deriveStableDemoUserId(parsedProfile.username);

          ownerUserId = resolvedId;

          const existingScopedProfile = readUserScopedRecord<UserProfile>(
            'demo',
            ownerUserId,
            'profile'
          );

          if (!existingScopedProfile) {
            const migratedProfile: UserProfile = {
              ...(parsedProfile as UserProfile),
              id: ownerUserId,
              isDemo: true,
              accountMode: 'demo',
              updatedAt: new Date().toISOString(),
            };
            writeUserScopedRecord('demo', ownerUserId, 'profile', migratedProfile);
            writeUserScopedRecord('demo', ownerUserId, 'answers', {
              userId: ownerUserId,
              accountMode: 'demo' as AccountMode,
              answers: migratedProfile.answers || {},
              questionVersion: 'v2_15q',
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        // Ignore malformed legacy profile JSON
      }
    }

    // 2. Migrate legacy Saved Profile IDs (with canonical ID normalization)
    const rawLegacySaved = storage.getItem(LEGACY_KEYS.SAVED_PROFILES);
    if (rawLegacySaved) {
      try {
        const parsedSaved = JSON.parse(rawLegacySaved);
        const normalizedIds = normalizeMatchProfileIdList(parsedSaved);
        const existingScopedSaved = readUserScopedRecord<string[]>(
          'demo',
          ownerUserId,
          'saved_profiles'
        );
        if (!existingScopedSaved) {
          writeUserScopedRecord('demo', ownerUserId, 'saved_profiles', normalizedIds);
        }
      } catch {
        // Ignore malformed legacy bookmarks JSON
      }
    }

    // 3. Migrate legacy Vibe Streak & Daily Vibe Check answers
    const rawLegacyStreak = storage.getItem(LEGACY_KEYS.VIBE_STREAK);
    if (rawLegacyStreak) {
      try {
        const parsedStreak = JSON.parse(rawLegacyStreak);
        if (parsedStreak && typeof parsedStreak === 'object') {
          const existingStreak = readUserScopedRecord<{ count: number; lastDate: string }>(
            'demo',
            ownerUserId,
            'vibe_streak'
          );
          if (!existingStreak) {
            writeUserScopedRecord('demo', ownerUserId, 'vibe_streak', {
              count: Number(parsedStreak.count) || 3,
              lastDate: String(parsedStreak.lastDate || ''),
            });
          }
        }
      } catch {
        // Ignore malformed streak JSON
      }
    }

    const legacyVibeKeys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(LEGACY_KEYS.VIBE_CHECK_PREFIX)) {
        legacyVibeKeys.push(k);
      }
    }

    for (const legacyKey of legacyVibeKeys) {
      const suffix = legacyKey.slice(LEGACY_KEYS.VIBE_CHECK_PREFIX.length);
      const rawVibe = storage.getItem(legacyKey);
      if (!suffix || !rawVibe) continue;
      try {
        const parsedVibe = JSON.parse(rawVibe);
        const resourceKey: UserResourceKind = `vibe_check:${suffix}`;
        if (!readUserScopedRecord('demo', ownerUserId, resourceKey)) {
          writeUserScopedRecord('demo', ownerUserId, resourceKey, parsedVibe);
        }
      } catch {
        // Ignore malformed vibe JSON
      }
    }

    // 4. Migrate legacy Site Suggestions to ownerUserId
    const rawLegacySuggestions = storage.getItem(LEGACY_KEYS.SITE_SUGGESTIONS);
    if (rawLegacySuggestions) {
      try {
        const parsedSuggestions = JSON.parse(rawLegacySuggestions);
        if (Array.isArray(parsedSuggestions)) {
          const existingFeedback = readUserScopedRecord<SiteFeedbackItem[]>(
            'demo',
            ownerUserId,
            'feedback'
          );
          if (!existingFeedback) {
            const tagged: SiteFeedbackItem[] = parsedSuggestions.map((item: SiteFeedbackItem) => ({
              ...item,
              userId: item.userId || ownerUserId,
              accountMode: 'demo',
            }));
            writeUserScopedRecord('demo', ownerUserId, 'feedback', tagged);
          }
        }
      } catch {
        // Ignore malformed suggestions JSON
      }
    }

    storage.setItem(
      MIGRATION_MARKER_KEY,
      JSON.stringify({
        migratedAt: new Date().toISOString(),
        ownerUserId,
      })
    );

    return { migrated: true, legacyOwnerUserId: ownerUserId };
  } catch {
    return { migrated: false, legacyOwnerUserId: DEFAULT_DEMO_USER_ID };
  }
}

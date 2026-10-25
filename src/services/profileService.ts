import {
  AccountMode,
  AvatarConfig,
  PrivacySettings,
  SiteFeedbackItem,
  UserProfile,
} from '../types';
import { getActiveAccountMode } from '../lib/supabase';
import { getActiveSessionUserId } from './authService';
import { IProfileRepository, QuestionnaireResponseRecord } from './contracts';
import {
  DEFAULT_DEMO_USERNAME,
  DEFAULT_DEMO_USER_ID,
  isDemoUserId,
  migrateLegacyDemoStorageIfNeeded,
  normalizeMatchProfileIdList,
  purgeScopedUserRecords,
  readUserScopedRecord,
  writeUserScopedRecord,
} from './storageNamespace';

export const DEFAULT_DEMO_AVATAR: AvatarConfig = {
  id: 'av_usr_me',
  baseGender: 'neutral',
  skinTone: '#E0AC69',
  hairStyle: 'traditional',
  hairColor: '#1A1816',
  clothingStyle: 'thobe',
  clothingColor: '#0B5D3B',
  accessory: 'sunglasses',
  expression: 'smile',
  direction: 'center',
  motionStyle: 'waving',
  stickerId: 'sticker_stay_warm',
  stickerMotion: 'sway',
};

export const DEFAULT_DEMO_PRIVACY: PrivacySettings = {
  showCityPublicly: true,
  showGenderPublicly: false,
  showAgeRangePublicly: true,
  allowDiscoverability: true,
};

export const DEFAULT_DEMO_PROFILE: UserProfile = {
  id: DEFAULT_DEMO_USER_ID,
  username: DEFAULT_DEMO_USERNAME,
  city: 'Riyadh',
  gender: 'male',
  ageRange: '25-29',
  avatar: DEFAULT_DEMO_AVATAR,
  answers: {
    q_vibe: 'vibe_ambitious',
    q_coffee: 'coffee_v60',
    q_food: ['food_burger', 'food_sushi'],
    q_drinks: ['drink_iced_tea', 'drink_mint_lemon'],
    q_sports: ['sport_football', 'sport_padel'],
    q_sports_watch: ['watch_football', 'watch_motorsport'],
    q_hobbies: ['hobby_photo_art', 'hobby_tech_diy'],
    q_entertainment: ['ent_podcasts', 'ent_movies'],
    q_leisure: ['leisure_boutique_lounge', 'leisure_roadtrip'],
    q_events: ['event_exhibitions', 'event_food_markets'],
    q_travel: 'travel_city',
    q_tech: 'tech_enthusiast',
    q_cars: 'car_luxury_sedan',
    q_places: ['place_modern_walk', 'place_historic'],
    q_lifestyle: 'rhythm_night_owl',
    q_apps: 'app_youtube',
  },
  bio: 'Specialty coffee aficionado, padel enthusiast, and urban architecture fan.',
  isCompleted: true,
  privacy: DEFAULT_DEMO_PRIVACY,
  isDemo: true,
  accountMode: 'demo',
};

export const DEFAULT_DEMO_SAVED_IDS: string[] = ['twin_1_faisal', 'twin_2_noura'];

/**
 * Creates a clean, isolated starter profile for a newly registered demo user.
 * Never copies answers, bio, bookmarks, or privacy settings from another demo user.
 */
export function createFreshDemoProfile(params: {
  id: string;
  username: string;
  city: string;
}): UserProfile {
  const now = new Date().toISOString();
  return {
    id: params.id,
    username: params.username.trim().toLowerCase(),
    city: params.city || 'Riyadh',
    gender: 'prefer_not_to_say',
    ageRange: '25-29',
    avatar: {
      ...DEFAULT_DEMO_AVATAR,
      id: `av_${params.id}`,
    },
    answers: {},
    bio: '',
    isCompleted: false,
    privacy: { ...DEFAULT_DEMO_PRIVACY },
    isDemo: true,
    accountMode: 'demo',
    createdAt: now,
    updatedAt: now,
  };
}

class DemoProfileRepository implements IProfileRepository {
  readonly mode: AccountMode = 'demo';

  private ensureMigrated(): void {
    migrateLegacyDemoStorageIfNeeded();
  }

  getProfile(userId: string): UserProfile | null {
    if (!userId) return null;
    this.ensureMigrated();

    const stored = readUserScopedRecord<UserProfile>('demo', userId, 'profile');
    if (!stored) {
      return null;
    }

    // Strict ownership & account-mode guard: reject any cross-user or non-demo record
    if (stored.id !== userId || stored.accountMode === 'authenticated') {
      console.warn(
        `Rejected mismatched profile load: expected user "${userId}", found "${stored.id}".`
      );
      return null;
    }

    // Reconcile standalone questionnaire answers record if present
    const storedAnswers = this.getQuestionnaireAnswers(userId);
    const mergedAnswers =
      storedAnswers && storedAnswers.userId === userId
        ? storedAnswers.answers
        : stored.answers || {};

    const upgradedAvatar: AvatarConfig =
      userId === DEFAULT_DEMO_USER_ID &&
      stored.avatar?.id === 'av_usr_me' &&
      !stored.avatar.stickerId &&
      stored.avatar.hairStyle === 'traditional' &&
      stored.avatar.clothingStyle === 'thobe'
        ? {
            ...stored.avatar,
            stickerId: 'sticker_stay_warm',
            stickerMotion: 'sway',
          }
        : stored.avatar;

    return {
      ...stored,
      id: userId,
      avatar: upgradedAvatar,
      answers: mergedAnswers,
      privacy: stored.privacy ? { ...stored.privacy } : { ...DEFAULT_DEMO_PRIVACY },
      isDemo: true,
      accountMode: 'demo',
    };
  }

  async saveProfile(userId: string, profile: UserProfile): Promise<boolean> {
    if (!userId || !profile || profile.id !== userId) {
      console.error(
        `Blocked profile save due to userId mismatch (target="${userId}", profile.id="${profile?.id}").`
      );
      return false;
    }

    if (profile.accountMode === 'authenticated' || !isDemoUserId(userId)) {
      // Allow custom legacy demo IDs only if explicitly marked demo, never authenticated UUIDs
      if (profile.accountMode === 'authenticated') {
        console.error('Blocked saving authenticated profile inside DemoProfileRepository.');
        return false;
      }
    }

    this.ensureMigrated();
    const now = new Date().toISOString();
    const normalizedProfile: UserProfile = {
      ...profile,
      id: userId,
      isDemo: true,
      accountMode: 'demo',
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    const profileSaved = writeUserScopedRecord('demo', userId, 'profile', normalizedProfile);
    const answersSaved = await this.saveQuestionnaireAnswers(userId, normalizedProfile.answers);
    return profileSaved && answersSaved;
  }

  getQuestionnaireAnswers(userId: string): QuestionnaireResponseRecord | null {
    if (!userId) return null;
    this.ensureMigrated();
    const record = readUserScopedRecord<QuestionnaireResponseRecord>('demo', userId, 'answers');
    if (!record || record.userId !== userId || record.accountMode !== 'demo') {
      return null;
    }
    return record;
  }

  async saveQuestionnaireAnswers(
    userId: string,
    answers: Record<string, string | string[]>
  ): Promise<boolean> {
    if (!userId) return false;
    this.ensureMigrated();

    const record: QuestionnaireResponseRecord = {
      userId,
      accountMode: 'demo',
      answers: { ...(answers || {}) },
      questionVersion: 'v2_16q',
      updatedAt: new Date().toISOString(),
    };
    return writeUserScopedRecord('demo', userId, 'answers', record);
  }

  getSavedProfileIds(userId: string): string[] {
    if (!userId) return [];
    this.ensureMigrated();

    const stored = readUserScopedRecord<string[]>('demo', userId, 'saved_profiles');
    if (stored) {
      return normalizeMatchProfileIdList(stored).filter((id) => id !== userId);
    }

    // Only the primary default demo persona gets starter sample bookmarks;
    // any newly created demo user starts with an empty, isolated bookmark list.
    if (userId === DEFAULT_DEMO_USER_ID) {
      return [...DEFAULT_DEMO_SAVED_IDS];
    }
    return [];
  }

  async saveSavedProfileIds(userId: string, targetIds: string[]): Promise<boolean> {
    if (!userId) return false;
    this.ensureMigrated();

    const normalized = normalizeMatchProfileIdList(targetIds).filter((id) => id !== userId);
    return writeUserScopedRecord('demo', userId, 'saved_profiles', normalized);
  }

  getUserFeedback(userId: string): SiteFeedbackItem[] {
    if (!userId) return [];
    this.ensureMigrated();

    const stored = readUserScopedRecord<SiteFeedbackItem[]>('demo', userId, 'feedback');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => !item.userId || item.userId === userId);
  }

  async appendUserFeedback(
    userId: string,
    item: SiteFeedbackItem
  ): Promise<SiteFeedbackItem[]> {
    if (!userId) return [];
    this.ensureMigrated();

    const existing = this.getUserFeedback(userId);
    const ownedItem: SiteFeedbackItem = {
      ...item,
      userId,
      accountMode: 'demo',
    };
    const updated = [ownedItem, ...existing];
    writeUserScopedRecord('demo', userId, 'feedback', updated);
    return updated;
  }

  async purgeUserData(userId: string): Promise<void> {
    if (!userId) return;
    purgeScopedUserRecords('demo', userId);
  }
}

/**
 * Unactivated Production Supabase + PostgreSQL Profile Repository Boundary.
 * Designed to map 1:1 to `public.profiles`, `public.privacy_settings`,
 * `public.user_question_answers`, `public.saved_profiles`, and `public.site_feedback`
 * once live Supabase Auth and RLS are enabled.
 */
class SupabaseProfileRepositoryPlaceholder extends DemoProfileRepository {
  override readonly mode: AccountMode = 'authenticated';
}

const demoProfileRepo = new DemoProfileRepository();
const supabaseProfileRepoPlaceholder = new SupabaseProfileRepositoryPlaceholder();

export function getProfileRepository(): IProfileRepository {
  return getActiveAccountMode() === 'authenticated'
    ? supabaseProfileRepoPlaceholder
    : demoProfileRepo;
}

// ============================================================================
// Public convenience helpers (preserving existing imports + adding userId scope)
// ============================================================================

export async function saveUserProfile(
  profile: UserProfile,
  expectedUserId?: string
): Promise<boolean> {
  const targetUserId = expectedUserId || profile.id;
  if (!targetUserId) return false;
  return getProfileRepository().saveProfile(targetUserId, profile);
}

export function loadUserProfile(userId?: string): UserProfile | null {
  const targetUserId = userId || getActiveSessionUserId();
  if (!targetUserId) return null;
  return getProfileRepository().getProfile(targetUserId);
}

export function loadUserProfileOrDefault(userId?: string): UserProfile {
  const targetUserId = userId || getActiveSessionUserId();
  const loaded = loadUserProfile(targetUserId);
  if (loaded) {
    return loaded;
  }
  if (targetUserId === DEFAULT_DEMO_USER_ID) {
    return {
      ...DEFAULT_DEMO_PROFILE,
      avatar: { ...DEFAULT_DEMO_AVATAR },
      privacy: { ...DEFAULT_DEMO_PRIVACY },
      answers: { ...DEFAULT_DEMO_PROFILE.answers },
    };
  }
  const usernameFromId = targetUserId.replace(/^demo_usr_/, '') || 'twin_explorer';
  return createFreshDemoProfile({
    id: targetUserId,
    username: usernameFromId,
    city: 'Riyadh',
  });
}

export function loadSavedProfileIds(userId?: string): string[] {
  const targetUserId = userId || getActiveSessionUserId();
  return getProfileRepository().getSavedProfileIds(targetUserId);
}

export async function saveSavedProfileIds(
  userId: string,
  targetIds: string[]
): Promise<boolean> {
  return getProfileRepository().saveSavedProfileIds(userId, targetIds);
}

export function loadUserFeedbackItems(userId?: string): SiteFeedbackItem[] {
  const targetUserId = userId || getActiveSessionUserId();
  return getProfileRepository().getUserFeedback(targetUserId);
}

export async function submitUserFeedbackItem(
  userId: string,
  item: SiteFeedbackItem
): Promise<SiteFeedbackItem[]> {
  return getProfileRepository().appendUserFeedback(userId, item);
}


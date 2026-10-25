export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';

export type BuiltInCategoryKey =
  | 'vibe'
  | 'coffee'
  | 'food'
  | 'drinks'
  | 'sports'
  | 'sports_watch'
  | 'hobbies'
  | 'entertainment'
  | 'leisure'
  | 'events'
  | 'travel'
  | 'tech'
  | 'cars'
  | 'places'
  | 'lifestyle'
  | 'apps';

export type CategoryKey = BuiltInCategoryKey | (string & {});

export interface QuestionCategory {
  id: CategoryKey;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconKey: string;
  order: number;
  isEnabled: boolean;
  isBuiltIn: boolean;
  defaultWeight?: number;
  updatedAt?: string;
}

export interface QuestionOption {
  id: string;
  labelEn: string;
  labelAr: string;
  iconKey: string;
  descriptionEn?: string;
  descriptionAr?: string;
  isEnabled?: boolean;
  order?: number;
}

export interface Question {
  id: string;
  category: CategoryKey;
  categoryId?: CategoryKey;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  isMultiSelect?: boolean;
  maxSelect?: number;
  isEnabled?: boolean;
  order?: number;
  isSystemDefault?: boolean;
  updatedAt?: string;
  options: QuestionOption[];
}

export interface AvatarConfig {
  id: string;
  baseGender: 'neutral' | 'masculine' | 'feminine';
  skinTone: string; // hex
  hairStyle:
    | 'short-fade'
    | 'textured-crop'
    | 'curly'
    | 'wavy'
    | 'sleek'
    | 'hijab'
    | 'traditional'
    | 'cap'
    | 'backward-cap'
    | 'beanie'
    | 'bucket-hat'
    | 'buzz';
  hairColor: string; // hex
  capColor?: string; // hex for cap, beanie, bucket-hat
  clothingStyle:
    | 'hoodie'
    | 'street-tee'
    | 'varsity'
    | 'denim'
    | 'linen-shirt'
    | 'tshirt'
    | 'blazer'
    | 'thobe';
  clothingColor: string; // hex
  accessory:
    | 'none'
    | 'glasses'
    | 'sunglasses'
    | 'retro-shades'
    | 'gold-wire'
    | 'sports-wrap'
    | 'clear-optical'
    | 'cyber-tint'
    | 'headphones';
  expression: 'smile' | 'cool' | 'wink' | 'cheerful';
  direction?: 'left' | 'right' | 'center';
  motionStyle?:
    | 'waving'
    | 'peace'
    | 'thumbs-up'
    | 'hand-raised'
    | 'double-raise'
    | 'finger-point'
    | 'smiling'
    | 'bouncing'
    | 'nodding'
    | 'cool-sway'
    | 'wink';
  stickerId?: string;
  stickerMotion?: 'sway' | 'bounce' | 'pulse';
}

export type AccountMode = 'demo' | 'authenticated';

export interface SiteFeedbackItem {
  id: string;
  userId?: string;
  accountMode?: AccountMode;
  category: 'feature' | 'avatar' | 'question' | 'general';
  message: string;
  contact?: string;
  createdAt: number;
  status: 'pending' | 'reviewed';
}

export interface UserProfile {
  id: string;
  username: string;
  city: string;
  gender?: 'prefer_not_to_say' | 'male' | 'female';
  ageRange?: string;
  avatar: AvatarConfig;
  answers: Record<string, string | string[]>;
  bio?: string;
  isCompleted: boolean;
  privacy: PrivacySettings;
  isDemo?: boolean;
  accountMode?: AccountMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrivacySettings {
  showCityPublicly: boolean;
  showGenderPublicly: boolean;
  showAgeRangePublicly: boolean;
  allowDiscoverability: boolean;
  // Security invariants: Phone number and exact location are NEVER public
}

export interface MatchProfile {
  id: string;
  username: string;
  city: string;
  gender?: string;
  ageRange?: string;
  similarityScore: number; // 0 - 100
  avatar: AvatarConfig;
  answers: Record<string, string | string[]>;
  sharedInterests: string[];
  bio: string;
  verifiedPersonality: boolean;
  isDemo?: boolean;
  accountMode?: AccountMode;
}

export type ActiveScreen =
  | 'welcome'
  | 'signup_preview'
  | 'username_setup'
  | 'onboarding'
  | 'profile_completion'
  | 'home'
  | 'find_twin'
  | 'matches'
  | 'comparison'
  | 'discover'
  | 'saved'
  | 'profile'
  | 'settings';

export interface VibeOption {
  id: string;
  labelEn: string;
  labelAr: string;
  icon?: string;
  baseCommunityPercentage: number; // e.g. 64%
  vibeTagEn: string;
  vibeTagAr: string;
}

export interface VibeQuestion {
  id: string;
  category: CategoryKey;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  options: VibeOption[];
  totalVotesBase?: number;
}

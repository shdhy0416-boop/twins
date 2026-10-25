import {
  AccountMode,
  CategoryKey,
  MatchProfile,
  PrivacySettings,
  Question,
  QuestionCategory,
  QuestionOption,
  SiteFeedbackItem,
  UserProfile,
} from '../types';

/**
 * Clean Service Boundary Contracts for TWIN (10,000+ User Accounts Preparation)
 *
 * All UI screens interact with authentication, profile persistence, questionnaire
 * responses, saved bookmarks, and candidate matching through these provider-agnostic
 * contracts. In Demo Mode, local user-scoped adapters implement these interfaces;
 * in Production, Supabase Auth + PostgreSQL adapters implement the exact same contracts.
 */

export type AuthProviderKind = 'phone_otp' | 'email_password' | 'google_oauth' | 'demo_preview';

export interface AuthUserIdentity {
  id: string;
  username: string;
  accountMode: AccountMode;
  isDemo: boolean;
  email?: string;
  emailVerified?: boolean;
  phoneMasked?: string;
  phoneVerified?: boolean;
  provider: AuthProviderKind;
  createdAt: string;
  lastSignInAt: string;
}

export interface AuthSession {
  user: AuthUserIdentity;
  accountMode: AccountMode;
  sessionId: string;
  issuedAt: string;
  expiresAt: string | null;
}

export interface AuthOperationResult {
  success: boolean;
  session?: AuthSession;
  requiresEmailVerification?: boolean;
  message?: string;
  error?: string;
}

export interface UsernameValidationResult {
  valid: boolean;
  isValid: boolean;
  normalizedUsername: string;
  error?: string;
}

export interface DemoRegistrationInput {
  username: string;
  city: string;
  phone?: string;
}

export interface EmailSignUpInput {
  email: string;
  password: string;
  username: string;
  city: string;
}

export type AuthStateListener = (session: AuthSession | null) => void;

export interface IAuthService {
  readonly mode: AccountMode;
  getCurrentSession(): AuthSession | null;
  onAuthStateChange(listener: AuthStateListener): () => void;

  // Phone OTP flow (currently previewed in SignUpPreviewModal)
  sendPhoneOtp(phone: string): Promise<AuthOperationResult>;
  verifyPhoneOtp(phone: string, token: string): Promise<AuthOperationResult>;

  // Demo account session management (strictly isolated from authenticated accounts)
  registerOrSwitchDemoUser(input: DemoRegistrationInput): Promise<AuthSession>;
  listDemoAccounts(): AuthUserIdentity[];

  // Future Production Auth flows (Supabase Auth boundary)
  signUpWithEmail(input: EmailSignUpInput): Promise<AuthOperationResult>;
  signInWithEmail(email: string, password: string): Promise<AuthOperationResult>;
  verifyEmailToken(email: string, token: string): Promise<AuthOperationResult>;
  requestPasswordReset(email: string): Promise<AuthOperationResult>;
  updatePassword(newPassword: string): Promise<AuthOperationResult>;
  signInWithGoogle(redirectTo?: string): Promise<AuthOperationResult>;

  // Handle & lifecycle operations
  validateUsername(username: string): UsernameValidationResult;
  isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean>;
  signOut(): Promise<void>;
  deleteAccount(userId: string): Promise<{ success: boolean; error?: string }>;
}

export interface QuestionnaireResponseRecord {
  userId: string;
  accountMode: AccountMode;
  answers: Record<string, string | string[]>;
  questionVersion: string;
  updatedAt: string;
}

export interface UserPreferencesRecord {
  userId: string;
  accountMode: AccountMode;
  privacy: PrivacySettings;
  savedProfileIds: string[];
  updatedAt: string;
}

export interface IProfileRepository {
  readonly mode: AccountMode;
  getProfile(userId: string): UserProfile | null;
  saveProfile(userId: string, profile: UserProfile): Promise<boolean>;
  getQuestionnaireAnswers(userId: string): QuestionnaireResponseRecord | null;
  saveQuestionnaireAnswers(
    userId: string,
    answers: Record<string, string | string[]>
  ): Promise<boolean>;
  getSavedProfileIds(userId: string): string[];
  saveSavedProfileIds(userId: string, targetIds: string[]): Promise<boolean>;
  getUserFeedback(userId: string): SiteFeedbackItem[];
  appendUserFeedback(userId: string, item: SiteFeedbackItem): Promise<SiteFeedbackItem[]>;
  purgeUserData(userId: string): Promise<void>;
}

export interface CandidateQueryOptions {
  requestingUserId: string;
  accountMode?: AccountMode;
  city?: string;
  searchQuery?: string;
  limit?: number;
  cursor?: string | null;
  candidatesOverride?: MatchProfile[];
}

export interface PaginatedMatchResult {
  items: MatchProfile[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface IMatchingRepository {
  readonly mode: AccountMode;
  getTopMatchesForUser(
    userProfile: UserProfile,
    options?: Partial<CandidateQueryOptions>
  ): Promise<MatchProfile[]>;
  queryDiscoverableCandidates(
    userProfile: UserProfile,
    options?: Partial<CandidateQueryOptions>
  ): Promise<PaginatedMatchResult>;
}

// ============================================================================
// Category-Based Question Catalog Management Contracts
// (Browser-local demo partitions now; maps 1:1 to PostgreSQL tables later)
// ============================================================================

export interface ArchivedOptionRecord {
  questionId: string;
  option: QuestionOption;
  archivedAt: string;
}

export interface CategoryPartition {
  schemaVersion: number;
  category: QuestionCategory;
  questions: Question[];
  archivedQuestions: Question[];
  archivedOptions: ArchivedOptionRecord[];
  updatedAt: string;
}

export interface CatalogValidationIssue {
  field: string;
  questionId?: string;
  optionId?: string;
  messageEn: string;
  messageAr: string;
}

export interface CatalogDependencyReport {
  targetKind: 'category' | 'question' | 'option';
  targetId: string;
  parentQuestionId?: string;
  isBuiltIn: boolean;
  referencedByCount: number;
  referencedUserHandles: string[];
  localUserCount: number;
  mockPoolCount: number;
  affectsBenchmarkScenarios: boolean;
  canHardDelete: boolean;
  warningEn: string;
  warningAr: string;
}

export interface SaveCategoryResult {
  success: boolean;
  partition?: CategoryPartition;
  validationIssues: CatalogValidationIssue[];
  errorEn?: string;
  errorAr?: string;
}

export interface IQuestionCatalogRepository {
  readonly mode: AccountMode;
  readonly persistenceScope: 'browser_local_demo' | 'remote_database';
  listCategoryPartitions(): CategoryPartition[];
  getCategoryPartition(categoryId: CategoryKey): CategoryPartition | null;
  saveCategoryPartition(
    categoryId: CategoryKey,
    draft: {
      category: QuestionCategory;
      questions: Question[];
      archivedQuestions?: Question[];
      archivedOptions?: ArchivedOptionRecord[];
    }
  ): SaveCategoryResult;
  createCategory(input: {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    iconKey?: string;
    initialQuestion?: Partial<Question>;
  }): SaveCategoryResult;
  reorderCategories(orderedCategoryIds: CategoryKey[]): boolean;
  setCategoryEnabled(categoryId: CategoryKey, isEnabled: boolean): SaveCategoryResult;
  deleteCategory(
    categoryId: CategoryKey,
    options?: { confirmed?: boolean; forceArchiveIfReferenced?: boolean }
  ): {
    success: boolean;
    dependencyReport: CatalogDependencyReport;
    errorEn?: string;
    errorAr?: string;
  };
  restoreCategoryToDefault(categoryId: CategoryKey): SaveCategoryResult;
  restoreAllDefaults(): void;
}

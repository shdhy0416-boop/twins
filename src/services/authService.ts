import { AccountMode } from '../types';
import { MOCK_MATCHES } from '../data/mockMatches';
import { getActiveAccountMode } from '../lib/supabase';
import {
  AuthOperationResult,
  AuthSession,
  AuthStateListener,
  AuthUserIdentity,
  DemoRegistrationInput,
  EmailSignUpInput,
  IAuthService,
  UsernameValidationResult,
} from './contracts';
import {
  buildSystemKey,
  DEFAULT_DEMO_USERNAME,
  DEFAULT_DEMO_USER_ID,
  deriveStableDemoUserId,
  migrateLegacyDemoStorageIfNeeded,
  purgeScopedUserRecords,
} from './storageNamespace';

const RESERVED_USERNAMES = new Set([
  'admin',
  'twin',
  'root',
  'support',
  'system',
  'moderator',
  'api',
  'auth',
  'null',
  'undefined',
]);

const DEMO_ACCOUNTS_INDEX_KEY = buildSystemKey('demo', 'accounts_index');
const DEMO_ACTIVE_SESSION_KEY = buildSystemKey('demo', 'active_session');

function getBrowserStorage(): Storage | null {
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

/**
 * Masks E.164 phone numbers so raw phone digits are never persisted in client storage.
 */
export function maskPhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length < 6) return '•••';
  const prefix = digits.slice(0, 4);
  const suffix = digits.slice(-3);
  return `${prefix} ••• ••${suffix}`;
}

function buildDefaultDemoIdentity(): AuthUserIdentity {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id: DEFAULT_DEMO_USER_ID,
    username: DEFAULT_DEMO_USERNAME,
    accountMode: 'demo',
    isDemo: true,
    phoneMasked: '+966 ••• ••172',
    phoneVerified: true,
    provider: 'demo_preview',
    createdAt: now,
    lastSignInAt: now,
  };
}

class DemoAuthService implements IAuthService {
  readonly mode: AccountMode = 'demo';
  private listeners = new Set<AuthStateListener>();

  private ensureInitialized(): void {
    migrateLegacyDemoStorageIfNeeded();
    const accounts = this.readAccountsMap();
    if (!accounts[DEFAULT_DEMO_USER_ID]) {
      accounts[DEFAULT_DEMO_USER_ID] = buildDefaultDemoIdentity();
      this.writeAccountsMap(accounts);
    }
  }

  private readAccountsMap(): Record<string, AuthUserIdentity> {
    const storage = getBrowserStorage();
    if (!storage) {
      return { [DEFAULT_DEMO_USER_ID]: buildDefaultDemoIdentity() };
    }
    try {
      const raw = storage.getItem(DEMO_ACCOUNTS_INDEX_KEY);
      if (!raw) {
        return { [DEFAULT_DEMO_USER_ID]: buildDefaultDemoIdentity() };
      }
      const parsed = JSON.parse(raw) as Record<string, AuthUserIdentity>;
      if (!parsed || typeof parsed !== 'object') {
        return { [DEFAULT_DEMO_USER_ID]: buildDefaultDemoIdentity() };
      }
      return parsed;
    } catch {
      return { [DEFAULT_DEMO_USER_ID]: buildDefaultDemoIdentity() };
    }
  }

  private writeAccountsMap(map: Record<string, AuthUserIdentity>): void {
    const storage = getBrowserStorage();
    if (!storage) return;
    try {
      storage.setItem(DEMO_ACCOUNTS_INDEX_KEY, JSON.stringify(map));
    } catch {
      // ignore storage errors
    }
  }

  private createSessionForIdentity(identity: AuthUserIdentity): AuthSession {
    return {
      user: identity,
      accountMode: 'demo',
      sessionId: `demo_sess_${identity.id}`,
      issuedAt: new Date().toISOString(),
      expiresAt: null,
    };
  }

  private persistActiveSession(session: AuthSession | null): void {
    const storage = getBrowserStorage();
    if (!storage) return;
    try {
      if (!session) {
        storage.removeItem(DEMO_ACTIVE_SESSION_KEY);
      } else {
        storage.setItem(DEMO_ACTIVE_SESSION_KEY, JSON.stringify(session));
      }
    } catch {
      // ignore
    }
    for (const listener of this.listeners) {
      listener(session);
    }
  }

  getCurrentSession(): AuthSession | null {
    this.ensureInitialized();
    const storage = getBrowserStorage();
    const accounts = this.readAccountsMap();

    if (storage) {
      try {
        const raw = storage.getItem(DEMO_ACTIVE_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AuthSession;
          if (
            parsed &&
            parsed.accountMode === 'demo' &&
            parsed.user?.id &&
            parsed.user.isDemo === true
          ) {
            const canonical = accounts[parsed.user.id] || parsed.user;
            return {
              ...parsed,
              user: canonical,
            };
          }
        }
      } catch {
        // fall through to default demo session
      }
    }

    const fallbackUser = accounts[DEFAULT_DEMO_USER_ID] || buildDefaultDemoIdentity();
    const defaultSession = this.createSessionForIdentity(fallbackUser);
    if (storage) {
      try {
        storage.setItem(DEMO_ACTIVE_SESSION_KEY, JSON.stringify(defaultSession));
      } catch {
        // ignore
      }
    }
    return defaultSession;
  }

  onAuthStateChange(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async sendPhoneOtp(phone: string): Promise<AuthOperationResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!phone || phone.replace(/[^\d]/g, '').length < 8) {
      return {
        success: false,
        error: 'Please enter a valid mobile number.',
      };
    }
    return {
      success: true,
      message: 'Demo verification code ready.',
    };
  }

  async verifyPhoneOtp(_phone: string, token: string): Promise<AuthOperationResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const trimmed = token.trim();
    if (trimmed === '1234' || trimmed.length >= 4) {
      return { success: true };
    }
    return { success: false, error: 'Invalid verification code' };
  }

  validateUsername(username: string): UsernameValidationResult {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      return {
        valid: false,
        isValid: false,
        normalizedUsername: trimmed,
        error: 'Username must be at least 3 characters',
      };
    }
    if (trimmed.length > 20) {
      return {
        valid: false,
        isValid: false,
        normalizedUsername: trimmed,
        error: 'Username must be 20 characters or fewer',
      };
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return {
        valid: false,
        isValid: false,
        normalizedUsername: trimmed,
        error: 'Only letters, numbers, and underscores allowed',
      };
    }
    if (RESERVED_USERNAMES.has(trimmed)) {
      return {
        valid: false,
        isValid: false,
        normalizedUsername: trimmed,
        error: 'This username is reserved',
      };
    }
    return { valid: true, isValid: true, normalizedUsername: trimmed };
  }

  async isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
    this.ensureInitialized();
    await new Promise((resolve) => setTimeout(resolve, 150));

    const validation = this.validateUsername(username);
    if (!validation.isValid) return false;

    const candidate = validation.normalizedUsername;
    const activeUserId = currentUserId ?? this.getCurrentSession()?.user.id;

    // Disallow collision with built-in mock community candidates
    const collidesWithMockCandidate = MOCK_MATCHES.some(
      (m) => m.username.toLowerCase() === candidate && m.id !== activeUserId
    );
    if (collidesWithMockCandidate) {
      return false;
    }

    // Disallow collision with another registered demo account
    const accounts = this.readAccountsMap();
    for (const account of Object.values(accounts)) {
      if (account.username.toLowerCase() === candidate && account.id !== activeUserId) {
        // In demo mode, allow signing back into a demo persona or warn if owned by another user;
        // if currentUserId is explicitly passed (profile rename check), block collisions strictly.
        if (currentUserId) {
          return false;
        }
      }
    }

    return true;
  }

  async registerOrSwitchDemoUser(input: DemoRegistrationInput): Promise<AuthSession> {
    this.ensureInitialized();
    const validation = this.validateUsername(input.username);
    const normalizedUsername = validation.normalizedUsername || DEFAULT_DEMO_USERNAME;
    const stableId = deriveStableDemoUserId(normalizedUsername);
    const now = new Date().toISOString();

    const accounts = this.readAccountsMap();
    const existing = accounts[stableId];

    const identity: AuthUserIdentity = existing
      ? {
          ...existing,
          username: normalizedUsername,
          phoneMasked: maskPhoneNumber(input.phone) || existing.phoneMasked,
          lastSignInAt: now,
        }
      : {
          id: stableId,
          username: normalizedUsername,
          accountMode: 'demo',
          isDemo: true,
          phoneMasked: maskPhoneNumber(input.phone),
          phoneVerified: Boolean(input.phone),
          provider: 'demo_preview',
          createdAt: now,
          lastSignInAt: now,
        };

    accounts[stableId] = identity;
    this.writeAccountsMap(accounts);

    const session = this.createSessionForIdentity(identity);
    this.persistActiveSession(session);
    return session;
  }

  listDemoAccounts(): AuthUserIdentity[] {
    this.ensureInitialized();
    return Object.values(this.readAccountsMap()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }

  // Production Auth Boundary Methods (documented & guarded while in demo preparation mode)
  async signUpWithEmail(_input: EmailSignUpInput): Promise<AuthOperationResult> {
    return {
      success: false,
      error: 'Live email sign-up is disabled while TWIN is running in demo preparation mode.',
    };
  }

  async signInWithEmail(_email: string, _password: string): Promise<AuthOperationResult> {
    return {
      success: false,
      error: 'Live email sign-in is disabled while TWIN is running in demo preparation mode.',
    };
  }

  async verifyEmailToken(_email: string, _token: string): Promise<AuthOperationResult> {
    return {
      success: false,
      error: 'Live email verification is disabled in demo preparation mode.',
    };
  }

  async requestPasswordReset(_email: string): Promise<AuthOperationResult> {
    return {
      success: false,
      error: 'Live password recovery is disabled in demo preparation mode.',
    };
  }

  async updatePassword(_newPassword: string): Promise<AuthOperationResult> {
    return {
      success: false,
      error: 'Password updates require an authenticated production session.',
    };
  }

  async signInWithGoogle(_redirectTo?: string): Promise<AuthOperationResult> {
    return {
      success: false,
      error: 'Google OAuth sign-in is disabled while TWIN is in demo preparation mode.',
    };
  }

  async signOut(): Promise<void> {
    this.ensureInitialized();
    const accounts = this.readAccountsMap();
    const defaultUser = accounts[DEFAULT_DEMO_USER_ID] || buildDefaultDemoIdentity();
    const fallbackSession = this.createSessionForIdentity(defaultUser);
    this.persistActiveSession(fallbackSession);
  }

  async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    this.ensureInitialized();
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }
    purgeScopedUserRecords('demo', userId);

    const accounts = this.readAccountsMap();
    if (userId !== DEFAULT_DEMO_USER_ID) {
      delete accounts[userId];
      this.writeAccountsMap(accounts);
    }

    const current = this.getCurrentSession();
    if (current?.user.id === userId) {
      await this.signOut();
    }
    return { success: true };
  }
}

/**
 * Unactivated Production Supabase Auth Boundary
 * Ready to be wired to `supabase.auth.*` in the production activation phase
 * without requiring changes to React UI components.
 */
class SupabaseAuthServicePlaceholder extends DemoAuthService {
  override readonly mode: AccountMode = 'authenticated';
}

const demoAuthServiceInstance = new DemoAuthService();
const supabaseAuthPlaceholderInstance = new SupabaseAuthServicePlaceholder();

export function getAuthService(): IAuthService {
  return getActiveAccountMode() === 'authenticated'
    ? supabaseAuthPlaceholderInstance
    : demoAuthServiceInstance;
}

export function getActiveSessionUserId(): string {
  return getAuthService().getCurrentSession()?.user.id || DEFAULT_DEMO_USER_ID;
}

// ============================================================================
// Backward-compatible named exports used by existing UI components
// ============================================================================

export async function sendPhoneOtp(
  phone: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return getAuthService().sendPhoneOtp(phone);
}

export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return getAuthService().verifyPhoneOtp(phone, token);
}

export function validateUsername(username: string): {
  valid: boolean;
  isValid: boolean;
  error?: string;
} {
  const res = getAuthService().validateUsername(username);
  return {
    valid: res.valid,
    isValid: res.isValid,
    error: res.error,
  };
}

export async function isUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  return getAuthService().isUsernameAvailable(username, currentUserId);
}

export async function registerOrSwitchDemoAccount(
  input: DemoRegistrationInput
): Promise<AuthSession> {
  return getAuthService().registerOrSwitchDemoUser(input);
}


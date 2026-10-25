import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveScreen,
  UserProfile,
  MatchProfile,
  Language,
  ThemeMode,
  PrivacySettings,
} from './types';
import { TRANSLATIONS } from './i18n/translations';
import { getTopTwinMatches } from './services/matchingService';
import {
  getAuthService,
  registerOrSwitchDemoAccount,
} from './services/authService';
import {
  saveUserProfile,
  loadUserProfile,
  loadUserProfileOrDefault,
  loadSavedProfileIds,
  saveSavedProfileIds,
  createFreshDemoProfile,
} from './services/profileService';
import { MOCK_MATCHES } from './data/mockMatches';
import { STICKERS_3D_COLLECTION } from './data/stickersData';
import { preloadCutoutStickers } from './components/avatar/CutoutStickerImage';
import { subscribeQuestionCatalog } from './services/questionCatalogService';
import {
  playPersonChime,
  playHighFiveSound,
  playWaveSound,
  playMysteriousDarkSound,
  playLightModeSound,
  playClickPop,
  isSoundEnabled,
  toggleSound,
} from './utils/soundEffects';

// Hooks & Components
import { useGlobalTouchGlow } from './hooks/useTouchGlow';
import { UnifiedAppHeader } from './components/navigation/UnifiedAppHeader';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { SignUpPreviewModal } from './components/auth/SignUpPreviewModal';
import { InteractiveOnboarding } from './components/onboarding/InteractiveOnboarding';
import { ProfileCompletionScreen } from './components/onboarding/ProfileCompletionScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { FindMyTwinExperience } from './components/matching/FindMyTwinExperience';
import { MatchesListView } from './components/matching/MatchesListView';
import { MatchDetailModal } from './components/matching/MatchDetailModal';
import { ProfileComparisonView } from './components/matching/ProfileComparisonView';
import { DiscoverScreen } from './components/discover/DiscoverScreen';
import { SavedProfilesScreen } from './components/saved/SavedProfilesScreen';
import { MyProfileScreen } from './components/profile/MyProfileScreen';
import { AvatarCustomizerModal } from './components/avatar/AvatarCustomizerModal';
import { PrivacySettingsModal } from './components/settings/PrivacySettingsModal';
import { NearbyMembersModal } from './components/home/NearbyMembersModal';
import { SiteFeedbackCard } from './components/common/SiteFeedbackCard';
import { ToastNotification, ToastMessage } from './components/common/ToastNotification';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { X, Shield } from 'lucide-react';

export default function App() {
  // Active Demo Auth Session (strictly isolated per unique user ID)
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const session = getAuthService().getCurrentSession();
    return session?.user.id || 'usr_me';
  });

  // App Core States
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  // Isolated Development-Only Demo Admin Mode (kept separate from ordinary user navigation)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return hash === '#admin' || hash === '#/admin' || params.get('admin') === 'demo';
  });
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('twin_language_mode');
      return saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('twin_theme_mode');
      return saved === 'dark' || saved === 'light' ? saved : 'light';
    } catch {
      return 'light';
    }
  });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [simulateNoMatch, setSimulateNoMatch] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  // Activate dynamic emerald-gold touch glow across all buttons & cards
  useGlobalTouchGlow(!reducedMotion);

  // User Profile State (strictly owned by activeUserId)
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    loadUserProfileOrDefault(activeUserId)
  );

  // Saved Profiles State (strictly scoped per activeUserId)
  const [savedProfileIds, setSavedProfileIds] = useState<string[]>(() =>
    loadSavedProfileIds(activeUserId)
  );

  // Dynamic Matches State calculated by real matching engine
  const [calculatedMatches, setCalculatedMatches] = useState<MatchProfile[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Modals & Navigation Sub-states
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isAvatarCustomizerOpen, setIsAvatarCustomizerOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<MatchProfile | null>(null);
  const [activeComparisonMatch, setActiveComparisonMatch] = useState<MatchProfile | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist bookmarked IDs scoped strictly to activeUserId
  useEffect(() => {
    if (!activeUserId || userProfile.id !== activeUserId) return;
    saveSavedProfileIds(activeUserId, savedProfileIds);
  }, [activeUserId, userProfile.id, savedProfileIds]);

  // Preload all 3D cutout stickers immediately on launch for zero-flicker rendering
  useEffect(() => {
    preloadCutoutStickers(STICKERS_3D_COLLECTION.map((s) => s.image));
  }, []);

  // Refresh matches deterministically based on current user answers and preferences
  const refreshMatches = useCallback(async (profile: UserProfile) => {
    setIsLoadingMatches(true);
    try {
      const matches = await getTopTwinMatches(profile, 6);
      setCalculatedMatches(matches);
    } catch (e) {
      console.error('Error calculating top matches:', e);
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  // Compute matches on mount, whenever active user/answers change, or when catalog updates
  useEffect(() => {
    refreshMatches(userProfile);
  }, [userProfile.id, userProfile.answers, refreshMatches]);

  useEffect(() => {
    return subscribeQuestionCatalog(() => {
      refreshMatches(userProfile);
    });
  }, [userProfile, refreshMatches]);

  // Save profile updates strictly under activeUserId (never overwriting another user's record)
  useEffect(() => {
    if (!activeUserId || userProfile.id !== activeUserId) return;
    saveUserProfile(userProfile, activeUserId);
  }, [activeUserId, userProfile]);

  // Handle HTML dir & font syncing for True RTL / LTR + persist preference
  useEffect(() => {
    try {
      localStorage.setItem('twin_language_mode', language);
    } catch {
      // ignore storage error
    }
    const html = document.documentElement;
    html.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', language);
  }, [language]);

  // Sync isolated Demo-Admin view with URL hash (#admin) and Alt+Shift+A dev shortcut
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      setIsAdminMode(hash === '#admin' || hash === '#/admin');
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminMode((prev) => {
          const next = !prev;
          window.history.replaceState(
            null,
            '',
            next ? '#admin' : window.location.pathname + window.location.search
          );
          return next;
        });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenDemoAdmin = () => {
    window.history.replaceState(null, '', '#admin');
    setIsAdminMode(true);
  };

  const handleExitDemoAdmin = () => {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
    setIsAdminMode(false);
  };

  // Handle Dark Mode Class and persistence
  useEffect(() => {
    try {
      localStorage.setItem('twin_theme_mode', theme);
    } catch {
      // ignore
    }
    const html = document.documentElement;
    html.style.colorScheme = theme;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.body.classList.remove('bg-[#F8F7F2]', 'text-[#202923]');
      document.body.classList.add('bg-[#111813]', 'text-[#F8F7F2]');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      document.body.classList.remove('bg-[#111813]', 'text-[#F8F7F2]');
      document.body.classList.add('bg-[#F8F7F2]', 'text-[#202923]');
    }
  }, [theme]);

  // All available matches combining calculated + mock pool for bookmark resolution
  const allAvailableMatches = Array.from(
    new Map([...calculatedMatches, ...MOCK_MATCHES].map((m) => [m.id, m])).values()
  );

  // Resolved list of saved match profiles
  const savedMatchesList = allAvailableMatches.filter((m) => savedProfileIds.includes(m.id));

  // Current active twin match for the high-five reveal
  const currentTwinMatch = simulateNoMatch
    ? null
    : calculatedMatches.length > 0
    ? calculatedMatches[currentMatchIndex % calculatedMatches.length]
    : MOCK_MATCHES[0];

  const t = TRANSLATIONS[language];

  // Handlers
  const handleToggleLanguage = () => {
    playClickPop();
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
    addToast(
      'info',
      next
        ? (language === 'ar' ? 'تم تفعيل النغمات المميزة 🔊' : 'Melodies & Sound Effects Enabled 🔊')
        : (language === 'ar' ? 'تم كتم الصوت 🔇' : 'Sound Effects Muted 🔇')
    );
  };

  const handleToggleTheme = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {
      // ignore
    }
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      if (nextTheme === 'dark') {
        playMysteriousDarkSound();
        addToast('info', 'Mysterious Dark Mode activated 🌙');
      } else {
        playLightModeSound();
        addToast('info', 'Light Mode activated ☀️');
      }
      return nextTheme;
    });
  };

  const handleToggleSaveProfile = (matchId: string) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } catch {
      // Ignore vibration error
    }

    setSavedProfileIds((prev) => {
      if (prev.includes(matchId)) {
        addToast('bookmark', t.bookmarkRemovedToast);
        return prev.filter((id) => id !== matchId);
      } else {
        addToast('bookmark', t.bookmarkSavedToast);
        try {
          confetti({
            particleCount: 22,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#D4AF37', '#0B5D3B', '#FFFFFF'],
            disableForReducedMotion: true,
          });
        } catch {
          // ignore confetti
        }
        return [...prev, matchId];
      }
    });
  };

  const handleSendWave = (match: MatchProfile) => {
    playWaveSound();
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 30, 40]);
      }
      confetti({
        particleCount: 28,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0B5D3B', '#DDF3E7', '#D4AF37'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore
    }
    const msg = t.waveSentToast.replace('{user}', match.username);
    addToast('action', msg);
  };

  const handleSendHighFive = (match: MatchProfile) => {
    playHighFiveSound();
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 40, 90, 50, 140]);
      }
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#0B5D3B', '#DDF3E7', '#D4AF37', '#FFFFFF'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore
    }
    addToast('success', t.highFiveSentToast);
  };

  const handleShareProfile = (match: MatchProfile) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${window.location.origin}/#profile/${match.username}`);
      }
    } catch {
      // ignore
    }
    addToast('info', t.linkCopiedToast);
  };

  const handleShareComparison = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${window.location.origin}/#compare/${userProfile.username}`);
      }
    } catch {
      // ignore
    }
    addToast('info', t.linkCopiedToast);
  };

  const handleShareVibe = (question: string, answer: string) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`✨ Twin Daily Vibe Check: "${question}" — My Choice: ${answer}`);
      }
    } catch {
      // ignore
    }
    addToast('info', language === 'ar' ? 'تم نسخ نتيجة فحص المزاج إلى الحافظة! ✨' : 'Vibe Check answer copied to clipboard! ✨');
  };

  const handleOnboardingComplete = (answers: Record<string, string | string[]>) => {
    const updated = {
      ...userProfile,
      answers,
      isCompleted: true,
    };
    setUserProfile(updated);
    refreshMatches(updated);
    setActiveScreen('profile_completion');
  };

  const handleStartSignUpFlow = () => {
    setIsSignUpModalOpen(true);
  };

  const handleSignUpComplete = async (username: string, city: string, phone?: string) => {
    const session = await registerOrSwitchDemoAccount({ username, city, phone });
    const nextUserId = session.user.id;

    // Load existing isolated profile for this demo user ID if they already registered previously,
    // or create a brand-new isolated profile without copying another user's data.
    const existingForUser = loadUserProfile(nextUserId);
    const nextProfile: UserProfile = existingForUser
      ? {
          ...existingForUser,
          id: nextUserId,
          username: session.user.username,
          city,
        }
      : nextUserId === 'usr_me'
      ? {
          ...loadUserProfileOrDefault('usr_me'),
          username: session.user.username,
          city,
        }
      : createFreshDemoProfile({
          id: nextUserId,
          username: session.user.username,
          city,
        });

    const nextSavedIds = loadSavedProfileIds(nextUserId);

    setActiveUserId(nextUserId);
    setUserProfile(nextProfile);
    setSavedProfileIds(nextSavedIds);
    setSelectedMatchForDetail(null);
    setActiveComparisonMatch(null);
    setCurrentMatchIndex(0);
    setIsSignUpModalOpen(false);
    setActiveScreen('onboarding');
  };

  const handleOpenComparison = (match: MatchProfile) => {
    setActiveComparisonMatch(match);
    setActiveScreen('comparison');
  };

  const handleNextTwinMatch = () => {
    if (calculatedMatches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % calculatedMatches.length);
    }
  };

  // Determine if bottom navigation should be visible
  const showBottomNav =
    activeScreen === 'home' ||
    activeScreen === 'discover' ||
    activeScreen === 'saved' ||
    activeScreen === 'matches' ||
    activeScreen === 'profile';

  // Render dedicated Demo Admin Workspace when isolated dev-admin mode is active
  if (isAdminMode) {
    return (
      <AdminDashboard
        activeUserId={activeUserId}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onExitAdmin={handleExitDemoAdmin}
      />
    );
  }

  return (
    <div className={`relative min-h-screen ambient-wavy-bg ${theme === 'dark' ? 'dark text-[#F8F7F2]' : 'text-[#202923]'} transition-colors flex flex-col justify-between overflow-x-clip`}>
      {/* Undulating Animated Wave Backdrop (كل المشروع مموج يتحرك) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-50 dark:opacity-30">
        <svg
          className="absolute -top-[10%] -left-[10%] w-[130%] h-[60%] wave-element-1"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,150 C200,300 400,50 650,220 C850,350 950,180 1000,240 L1000,0 L0,0 Z"
            fill="url(#waveGrad1)"
          />
          <defs>
            <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0B5D3B" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          className="absolute -bottom-[15%] -right-[10%] w-[130%] h-[70%] wave-element-2"
          viewBox="0 0 1000 450"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,280 C250,120 450,380 700,200 C880,80 950,260 1000,180 L1000,450 L0,450 Z"
            fill="url(#waveGrad2)"
          />
          <defs>
            <linearGradient id="waveGrad2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#0B5D3B" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.08" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Toast Alert Notifications */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* Unified Sticky Header (Row 1 Controls + Row 2 Brand, Notifications, Saved & Avatar) */}
      <UnifiedAppHeader
        language={language}
        onToggleLanguage={handleToggleLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion(!reducedMotion)}
        simulateNoMatch={simulateNoMatch}
        onToggleSimulateNoMatch={() => setSimulateNoMatch(!simulateNoMatch)}
        savedCount={savedProfileIds.length}
        onOpenSaved={() => setActiveScreen('saved')}
        currentCity={userProfile.city}
        onOpenNearbyModal={() => setIsNearbyModalOpen(true)}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        userProfile={userProfile}
        onEditProfile={() => setActiveScreen('profile')}
        onViewMatches={() => setActiveScreen('matches')}
        onLogoClick={() => setActiveScreen('home')}
      />

      {/* Main Screen Switcher */}
      <div className="flex-1 w-full max-w-md mx-auto">
        {/* 1. Welcome Screen */}
        {activeScreen === 'welcome' && (
          <WelcomeScreen
            language={language}
            onStart={handleStartSignUpFlow}
            onExplore={() => setActiveScreen('discover')}
          />
        )}

        {/* 2. Interactive Personality Onboarding */}
        {activeScreen === 'onboarding' && (
          <InteractiveOnboarding
            initialAnswers={userProfile.answers}
            language={language}
            onComplete={handleOnboardingComplete}
            onExit={() => setActiveScreen('home')}
          />
        )}

        {/* 3. Profile Completion Celebration Milestone */}
        {activeScreen === 'profile_completion' && (
          <ProfileCompletionScreen
            userProfile={userProfile}
            language={language}
            onFindTwin={() => setActiveScreen('find_twin')}
            onGoHome={() => setActiveScreen('home')}
          />
        )}

        {/* 4. Home Screen */}
        {activeScreen === 'home' && (
          <HomeScreen
            userProfile={userProfile}
            topMatches={calculatedMatches.length > 0 ? calculatedMatches : MOCK_MATCHES}
            language={language}
            onFindTwin={() => setActiveScreen('find_twin')}
            onViewMatches={() => setActiveScreen('matches')}
            onEditProfile={() => setActiveScreen('profile')}
            onSelectMatch={(m) => setSelectedMatchForDetail(m)}
            savedProfileIds={savedProfileIds}
            onToggleSave={handleToggleSaveProfile}
            onOpenSaved={() => setActiveScreen('saved')}
            onExploreDiscover={() => setActiveScreen('discover')}
            onShareVibe={handleShareVibe}
            onOpenNearbyModal={() => setIsNearbyModalOpen(true)}
            onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
          />
        )}

        {/* 5. The Signature Experience: FIND MY TWIN */}
        {activeScreen === 'find_twin' && (
          <FindMyTwinExperience
            userProfile={userProfile}
            match={currentTwinMatch}
            language={language}
            reducedMotion={reducedMotion}
            onOpenComparison={handleOpenComparison}
            onClose={() => setActiveScreen('home')}
            onNextMatch={handleNextTwinMatch}
            savedProfileIds={savedProfileIds}
            onToggleSaveProfile={handleToggleSaveProfile}
            onSendHighFive={handleSendHighFive}
          />
        )}

        {/* 6. Top 5 Matches Screen */}
        {activeScreen === 'matches' && (
          <MatchesListView
            matches={calculatedMatches.length > 0 ? calculatedMatches : MOCK_MATCHES}
            language={language}
            onSelectMatch={(m: MatchProfile) => setSelectedMatchForDetail(m)}
            onCompareMatch={handleOpenComparison}
            onFindTwinCTA={() => setActiveScreen('find_twin')}
            savedProfileIds={savedProfileIds}
            onToggleSaveProfile={handleToggleSaveProfile}
            onSendWave={handleSendWave}
            onFilterByInterest={() => setActiveScreen('discover')}
          />
        )}

        {/* 7. Dedicated Profile Comparison Screen */}
        {activeScreen === 'comparison' && activeComparisonMatch && (
          <ProfileComparisonView
            userProfile={userProfile}
            match={activeComparisonMatch}
            language={language}
            onBack={() => setActiveScreen('matches')}
            onReturnHome={() => setActiveScreen('home')}
            isSaved={savedProfileIds.includes(activeComparisonMatch.id)}
            onToggleSave={handleToggleSaveProfile}
            onShareComparison={handleShareComparison}
          />
        )}

        {/* 8. Discover Screen (with All vs Saved tabs) */}
        {activeScreen === 'discover' && (
          <DiscoverScreen
            matches={allAvailableMatches}
            language={language}
            onSelectMatch={(m: MatchProfile) => setSelectedMatchForDetail(m)}
            onCompareMatch={handleOpenComparison}
            savedProfileIds={savedProfileIds}
            onToggleSaveProfile={handleToggleSaveProfile}
            onSendWave={handleSendWave}
            initialTab="all"
          />
        )}

        {/* 9. Dedicated Saved Profiles Screen */}
        {activeScreen === 'saved' && (
          <SavedProfilesScreen
            savedMatches={savedMatchesList}
            language={language}
            onSelectMatch={(m: MatchProfile) => setSelectedMatchForDetail(m)}
            onCompareMatch={handleOpenComparison}
            onToggleSaveProfile={handleToggleSaveProfile}
            onDiscoverMore={() => setActiveScreen('discover')}
            onSendWave={handleSendWave}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {/* 10. My Profile Screen */}
        {activeScreen === 'profile' && (
          <MyProfileScreen
            userProfile={userProfile}
            language={language}
            reducedMotion={reducedMotion}
            onUpdateBio={(nextBio) => {
              setUserProfile((prev) => ({ ...prev, bio: nextBio }));
              addToast(
                'success',
                language === 'ar'
                  ? 'تم تحديث نبذة الشخصية وتفعيل العرض التدريجي! ✨'
                  : 'Personality bio updated with live progressive reveal! ✨'
              );
            }}
            onOpenAvatarCustomizer={() => setIsAvatarCustomizerOpen(true)}
            onOpenPrivacySettings={() => setIsPrivacyModalOpen(true)}
            onRetakeOnboarding={() => setActiveScreen('onboarding')}
            savedCount={savedProfileIds.length}
            onOpenSaved={() => setActiveScreen('saved')}
            onOpenNearbyModal={() => setIsNearbyModalOpen(true)}
            onFeedbackSubmitted={() => {
              addToast('success', language === 'ar' ? 'تم استلام اقتراحك لملاك الموقع بنجاح! ✨' : 'Feedback submitted to site owners! ✨');
            }}
          />
        )}
        {/* Isolated Dev-Only Demo Admin Access Footer Link (Mobile / Narrow Viewports — non-sticky, separate from user nav) */}
        <div className="md:hidden px-5 pb-28 pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleOpenDemoAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#18221C]/90 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-[#778078] dark:text-slate-400 hover:text-[#0B5D3B] dark:hover:text-[#34D399] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield size={12} className="text-[#D4AF37]" />
            <span>
              {language === 'ar'
                ? 'لوحة الإدارة التجريبية (للتطوير فقط)'
                : 'Demo Admin Console (Dev Only)'}
            </span>
          </button>
        </div>
      </div>

      {/* Isolated Dev-Only Demo Admin Launcher (Desktop / Tablet — outside max-w-md user frame) */}
      <div className="hidden md:block fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={handleOpenDemoAdmin}
          title={
            language === 'ar'
              ? 'فتح لوحة تحكم المالك التجريبية (للتطوير فقط)'
              : 'Open Isolated Demo Admin Dashboard (Dev Only · Alt+Shift+A)'
          }
          className="px-3.5 py-2 rounded-xl bg-white/95 dark:bg-[#18221C]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-md text-xs font-bold text-[#202923] dark:text-[#F8F7F2] hover:border-[#0B5D3B] dark:hover:border-[#34D399] inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Shield size={14} className="text-[#D4AF37] shrink-0" />
          <span>
            {language === 'ar' ? 'لوحة الإدارة (تجريبي)' : 'Demo Admin (Dev)'}
          </span>
        </button>
      </div>

      {/* Persistent Bottom Tab Bar */}
      {showBottomNav && (
        <BottomTabBar
          activeScreen={activeScreen}
          onNavigate={(screen: ActiveScreen) => {
            if (screen === 'find_twin') {
              setActiveScreen('find_twin');
            } else {
              setActiveScreen(screen);
            }
          }}
          language={language}
          savedCount={savedProfileIds.length}
        />
      )}

      {/* Global Modals */}
      {/* Sign-Up & Phone Preview Modal */}
      <SignUpPreviewModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onComplete={handleSignUpComplete}
        language={language}
      />

      {/* Avatar Customizer Modal */}
      <AvatarCustomizerModal
        avatar={userProfile.avatar}
        isOpen={isAvatarCustomizerOpen}
        onClose={() => setIsAvatarCustomizerOpen(false)}
        onSave={(newAvatar) => {
          setUserProfile((prev) => ({ ...prev, avatar: newAvatar }));
          addToast('success', language === 'ar' ? 'تم تحديث مظهر الأفاتار بنجاح! ✨' : 'Avatar updated successfully! ✨');
        }}
        language={language}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        privacy={userProfile.privacy}
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onSave={(newPrivacy: PrivacySettings) => {
          setUserProfile((prev) => ({ ...prev, privacy: newPrivacy }));
          addToast('success', language === 'ar' ? 'تم حفظ إعدادات الخصوصية بنجاح 🔒' : 'Privacy settings saved successfully 🔒');
        }}
        language={language}
      />

      {/* Match Detail Quick Modal */}
      <MatchDetailModal
        match={selectedMatchForDetail}
        isOpen={Boolean(selectedMatchForDetail)}
        onClose={() => setSelectedMatchForDetail(null)}
        onCompare={handleOpenComparison}
        language={language}
        reducedMotion={reducedMotion}
        isSaved={selectedMatchForDetail ? savedProfileIds.includes(selectedMatchForDetail.id) : false}
        onToggleSave={handleToggleSaveProfile}
        onSendWave={handleSendWave}
        onShareProfile={handleShareProfile}
      />

      {/* Nearby Regional Members Modal (when user clicks on region / city) */}
      <NearbyMembersModal
        isOpen={isNearbyModalOpen}
        onClose={() => setIsNearbyModalOpen(false)}
        currentCity={userProfile.city}
        language={language}
        matches={calculatedMatches.length > 0 ? calculatedMatches : MOCK_MATCHES}
        onSelectMatch={(m) => setSelectedMatchForDetail(m)}
        onSendWave={handleSendWave}
        savedProfileIds={savedProfileIds}
        onToggleSave={handleToggleSaveProfile}
        onCompareMatch={handleOpenComparison}
      />

      {/* Suggestion / Feedback Modal for Site Owners (صندوق ملاحظات ومقترحات ملاك الموقع) */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md max-h-[92vh] bg-white dark:bg-[#18221C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <header className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#18221C]">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <div>
                  <h3 className="text-xs font-black text-[#202923] dark:text-white uppercase tracking-wider">
                    {language === 'ar' ? 'صندوق مقترحات ملاك الموقع' : 'Owners Suggestion Box'}
                  </h3>
                  <span className="text-[10px] text-[#778078] dark:text-slate-400 block">
                    {language === 'ar' ? 'اقتراح ميزة جديدة أو ملاحظة للتطوير' : 'Request new features or improvements'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              <SiteFeedbackCard
                language={language}
                userId={userProfile.id}
                username={userProfile.username}
                onFeedbackSubmitted={() => {
                  addToast('success', language === 'ar' ? 'تم استلام اقتراحك لملاك الموقع بنجاح! ✨' : 'Feedback submitted to site owners! ✨');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

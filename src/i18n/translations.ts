export interface TranslationDictionary {
  // Common & Navigation
  tagline: string;
  welcomeSubtitle: string;
  privacyBadge: string;
  getStarted: string;
  previewMatches: string;
  navHome: string;
  navMatches: string;
  navFindTwin: string;
  navDiscover: string;
  navSaved: string;
  navProfile: string;

  // Greetings & Home
  greetingDay: string;
  greetingEvening: string;
  savedProfilesTitle: string;
  myFingerprint: string;
  fingerprintSubtitle: string;
  profileComplete: string;
  findTwinCTA: string;
  findTwinSub: string;
  sharedHighlights: string;
  sharedHighlightText: string;
  topMatchesTitle: string;
  viewAllMatches: string;

  // Comparison & Matches
  comparisonTitle: string;
  unsaveProfile: string;
  saveProfile: string;
  shareTwinComparison: string;
  youLabel: string;
  watchCollision: string;
  emptyNotice: string;
  divergentBadge: string;
  matchBadge: string;
  doneBtn: string;
  collisionArena: string;
  collisionArenaSubtitle: string;

  // Auth & Onboarding
  signUpTitle: string;
  signUpSubtitle: string;
  phonePlaceholder: string;
  sendCode: string;
  otpTitle: string;
  otpSubtitle: string;
  demoCodeHint: string;
  verifyCode: string;
  chooseUsername: string;
  usernameHint: string;
  cityLabel: string;
  continueBtn: string;

  // Avatar Customizer
  customizeAvatar: string;
  uniqueLookBadge: string;
  skinTone: string;
  hairStyle: string;
  clothingStyle: string;
  outfitColor: string;
  expressionMood: string;
  avatarMotion: string;
  saveBtn: string;

  // Profile & Settings
  guaranteeTitle: string;
  privacyTitle: string;

  // Toasts
  bookmarkRemovedToast: string;
  bookmarkSavedToast: string;
  waveSentToast: string;
  highFiveSentToast: string;
  linkCopiedToast: string;
}

export const TRANSLATIONS: Record<'en' | 'ar', TranslationDictionary> = {
  ar: {
    // Common & Navigation
    tagline: 'اكتشف توأمك الروحي في الاهتمامات ونمط الحياة',
    welcomeSubtitle: 'منصة اجتماعية ذكية مبنية على أسس خوارزمية دقيقة لمطابقة الشخصيات والأذواق في السعودية والخليج',
    privacyBadge: 'خصوصية كاملة • بدون مشاركة أرقام الهواتف أو المواقع الدقيقة',
    getStarted: 'ابدأ تجربة المطابقة',
    previewMatches: 'استكشف لمحة من التوائم',
    navHome: 'الرئيسية',
    navMatches: 'التوائم',
    navFindTwin: 'جد توأمي',
    navDiscover: 'استكشاف',
    navSaved: 'المحفوظات',
    navProfile: 'ملفي',

    // Greetings & Home
    greetingDay: 'مساء الخير والروقان ✨',
    greetingEvening: 'مساء النور والأنوار 🌙',
    savedProfilesTitle: 'الملفات المحفوظة',
    myFingerprint: 'بصمتك الشخصية المتكاملة',
    fingerprintSubtitle: 'تفضيلاتك الذوقية ونمط يومك تحدد توأمك الدقيق',
    profileComplete: 'اكتملت البصمة',
    findTwinCTA: 'ابحث عن توأمي الآن 🔥',
    findTwinSub: 'مطابقة حية مبنية على 16 سمة من الاهتمامات ونمط الحياة',
    sharedHighlights: 'أبرز الاهتمامات المشتركة',
    sharedHighlightText: 'أنت وأكثر من 10 من أقرب المتطابقين معك تشتركون في حب أشياء كثيرة.',
    topMatchesTitle: 'أقرب التوائم إليك (Top 5)',
    viewAllMatches: 'عرض كافة النتائج',

    // Comparison & Matches
    comparisonTitle: 'مقارنة التوافق الذوقي',
    unsaveProfile: 'إلغاء الحفظ',
    saveProfile: 'حفظ الملف',
    shareTwinComparison: 'مشاركة بطاقة التوافق',
    youLabel: 'أنت',
    watchCollision: 'مشاهدة اصطدام التوافق',
    emptyNotice: 'لم يتم الاختيار بعد',
    divergentBadge: 'تفضيل مختلف',
    matchBadge: 'تطابق تام 🎯',
    doneBtn: 'تم',
    collisionArena: 'ساحة التوافق التفاعلية',
    collisionArenaSubtitle: 'نقاط الالتقاء والانسجام الذوقي بينكما',

    // Auth & Onboarding
    signUpTitle: 'تسجيل الدخول (الوضع التجريبي)',
    signUpSubtitle: 'أدخل رقم جوالك لتجربة خطوات الدخول واختيار اسم المستخدم في ثوانٍ',
    phonePlaceholder: '05X XXX XXXX',
    sendCode: 'إرسال رمز التحقق',
    otpTitle: 'أدخل رمز التحقق (OTP)',
    otpSubtitle: 'تم إرسال رمز تجريبي لجوالك للتأكيد',
    demoCodeHint: 'رمز التحقق التجريبي هو: 1234',
    verifyCode: 'تأكيد الرمز والدخول',
    chooseUsername: 'اختر اسم المستخدم',
    usernameHint: 'بالحروف الإنجليزية والأرقام بدون مسافات',
    cityLabel: 'مدينتك الحالية',
    continueBtn: 'متابعة الخطوة التالية',

    // Avatar Customizer
    customizeAvatar: 'تخصيص الأفاتار التعبيري',
    uniqueLookBadge: 'مظهر شبابي ثلاثي الأبعاد',
    skinTone: 'درجة البشرة',
    hairStyle: 'تسريحة الشعر وغطاء الرأس',
    clothingStyle: 'نمط اللباس والستايل',
    outfitColor: 'لون اللباس الرئيسي',
    expressionMood: 'تعبير الوجه والمزاج',
    avatarMotion: 'حركة اليد والوضعية التفاعلية',
    saveBtn: 'حفظ المظهر الجديد',

    // Profile & Settings
    guaranteeTitle: 'ضمانات الخصوصية والأمان',
    privacyTitle: 'إعدادات الخصوصية والظهور',

    // Toasts
    bookmarkRemovedToast: 'تمت إزالة الملف من المحفوظات',
    bookmarkSavedToast: 'تم حفظ الملف في قائمتك المفضلة ⭐',
    waveSentToast: 'تم إرسال تلويحة ترحيبية بنجاح 👋',
    highFiveSentToast: 'تم إرسال هاي فايف عالي الطاقة! 🙌',
    linkCopiedToast: 'تم نسخ الرابط بنجاح! 📋',
  },
  en: {
    // Common & Navigation
    tagline: 'Find your authentic taste & lifestyle twin',
    welcomeSubtitle: 'Algorithmic social matching engine designed for real aesthetic resonance across Saudi Arabia & GCC',
    privacyBadge: 'Zero-leak privacy • Phone numbers and exact coordinates are never shared',
    getStarted: 'Start Matching Experience',
    previewMatches: 'Explore Preview Twins',
    navHome: 'Home',
    navMatches: 'Twins',
    navFindTwin: 'Find Twin',
    navDiscover: 'Discover',
    navSaved: 'Saved',
    navProfile: 'Profile',

    // Greetings & Home
    greetingDay: 'Good day & positive vibes ✨',
    greetingEvening: 'Good evening & unwind 🌙',
    savedProfilesTitle: 'Saved Profiles',
    myFingerprint: 'Your Personality Fingerprint',
    fingerprintSubtitle: 'Your daily rituals and aesthetic tastes determine your true twin',
    profileComplete: 'Fingerprint Complete',
    findTwinCTA: 'Find My Twin Now 🔥',
    findTwinSub: 'Live deterministic calculation across 16 interest & lifestyle questions',
    sharedHighlights: 'Top Shared Interests',
    sharedHighlightText: 'You and 10+ of your closest matches share a love for so many things.',
    topMatchesTitle: 'Top 5 Twin Matches',
    viewAllMatches: 'View All Matches',

    // Comparison & Matches
    comparisonTitle: 'Profile Taste Comparison',
    unsaveProfile: 'Unsave Profile',
    saveProfile: 'Save Profile',
    shareTwinComparison: 'Share Comparison Card',
    youLabel: 'You',
    watchCollision: 'Watch Synergy Collision',
    emptyNotice: 'Not answered yet',
    divergentBadge: 'Different Taste',
    matchBadge: 'Exact Match 🎯',
    doneBtn: 'Done',
    collisionArena: 'Interactive Synergy Arena',
    collisionArenaSubtitle: 'Points of convergence and resonance between you two',

    // Auth & Onboarding
    signUpTitle: 'Quick Sign-In (Demo Mode)',
    signUpSubtitle: 'Enter a mobile number to preview the flow and choose your Twin username',
    phonePlaceholder: '+966 5X XXX XXXX',
    sendCode: 'Send Verification Code',
    otpTitle: 'Enter Verification Code (OTP)',
    otpSubtitle: 'A demo code was sent to verify your phone number',
    demoCodeHint: 'Demo verification code is: 1234',
    verifyCode: 'Verify & Continue',
    chooseUsername: 'Choose your username',
    usernameHint: 'Alphanumeric letters and numbers only',
    cityLabel: 'Current City',
    continueBtn: 'Continue to Next Step',

    // Avatar Customizer
    customizeAvatar: 'Customize Expressive Avatar',
    uniqueLookBadge: 'Youthful & Modern Aesthetic',
    skinTone: 'Skin Tone',
    hairStyle: 'Hair & Headwear',
    clothingStyle: 'Clothing Style',
    outfitColor: 'Primary Outfit Color',
    expressionMood: 'Facial Expression & Mood',
    avatarMotion: 'Hand Gesture & Interaction Pose',
    saveBtn: 'Save New Look',

    // Profile & Settings
    guaranteeTitle: 'Privacy & Security Guarantees',
    privacyTitle: 'Privacy & Visibility Settings',

    // Toasts
    bookmarkRemovedToast: 'Removed profile from saved list',
    bookmarkSavedToast: 'Saved profile to your favorites ⭐',
    waveSentToast: 'Sent a welcoming wave 👋',
    highFiveSentToast: 'High five delivered with high energy! 🙌',
    linkCopiedToast: 'Link copied to clipboard! 📋',
  },
};

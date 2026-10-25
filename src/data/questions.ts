import { Question, QuestionCategory } from '../types';

function deepFreezeSeed<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        deepFreezeSeed(value);
      }
    }
  }
  return obj;
}

const RAW_ONBOARDING_QUESTIONS: Question[] = [
  // 1. ☕ ذوقك في القهوة
  {
    id: 'q_coffee',
    category: 'coffee',
    titleEn: '☕ Your Coffee Taste',
    titleAr: '☕ ذوقك في القهوة',
    subtitleEn: 'Which coffee drink do you usually prefer?',
    subtitleAr: 'إيش مشروب القهوة اللي تفضله غالبًا؟',
    isMultiSelect: false,
    options: [
      {
        id: 'coffee_v60',
        labelEn: 'Black coffee like V60 or Americano',
        labelAr: 'قهوة سوداء مثل V60 أو أمريكانو',
        iconKey: 'coffee',
      },
      {
        id: 'coffee_flat_white',
        labelEn: 'Latte or Flat White',
        labelAr: 'لاتيه أو فلات وايت',
        iconKey: 'cup',
      },
      {
        id: 'coffee_spanish',
        labelEn: 'Iced Spanish Latte or Cold Coffee',
        labelAr: 'آيس سبانش لاتيه أو قهوة باردة',
        iconKey: 'glass-water',
      },
      {
        id: 'coffee_mocha',
        labelEn: 'Mocha or Sweet Flavored Coffee',
        labelAr: 'موكا أو قهوة بنكهات حلوة',
        iconKey: 'sparkles',
      },
      {
        id: 'coffee_saudi',
        labelEn: 'Saudi or Arabic Coffee',
        labelAr: 'قهوة سعودية أو عربية',
        iconKey: 'flame',
      },
      {
        id: 'coffee_espresso',
        labelEn: 'Espresso or Strong Coffee',
        labelAr: 'إسبريسو أو قهوة قوية',
        iconKey: 'zap',
      },
      {
        id: 'coffee_none',
        labelEn: "I don't drink coffee",
        labelAr: 'ما أشرب القهوة',
        iconKey: 'ban',
      },
    ],
  },

  // 2. 🧋 مشروباتك المفضلة
  {
    id: 'q_drinks',
    category: 'drinks',
    titleEn: '🧋 Your Favorite Drinks',
    titleAr: '🧋 مشروباتك المفضلة',
    subtitleEn: 'What do you enjoy drinking besides coffee?',
    subtitleAr: 'إيش تحب تشرب بعيدًا عن القهوة؟',
    isMultiSelect: true,
    maxSelect: 2,
    options: [
      {
        id: 'drink_iced_tea',
        labelEn: 'Iced Tea',
        labelAr: 'شاي مثلج أو آيس تي',
        iconKey: 'glass-water',
      },
      {
        id: 'drink_smoothie',
        labelEn: 'Fresh Juices & Smoothies',
        labelAr: 'عصائر طبيعية وسموذي',
        iconKey: 'citrus',
      },
      {
        id: 'drink_mint_lemon',
        labelEn: 'Lemon Mint & Refreshing Drinks',
        labelAr: 'ليمون بالنعناع ومشروبات منعشة',
        iconKey: 'sparkles',
      },
      {
        id: 'drink_karak',
        labelEn: 'Tea or Karak',
        labelAr: 'شاي أو كرك',
        iconKey: 'cup-soda',
      },
      {
        id: 'drink_matcha',
        labelEn: 'Matcha',
        labelAr: 'ماتشا',
        iconKey: 'leaf',
      },
      {
        id: 'drink_water',
        labelEn: 'Water & Simple Drinks',
        labelAr: 'ماء ومشروبات بسيطة',
        iconKey: 'waves',
      },
      {
        id: 'drink_other',
        labelEn: 'Other Drinks',
        labelAr: 'مشروبات أخرى',
        iconKey: 'heart',
      },
    ],
  },

  // 3. 🍔 ذوقك في الأكل
  {
    id: 'q_food',
    category: 'food',
    titleEn: '🍔 Your Food Taste',
    titleAr: '🍔 ذوقك في الأكل',
    subtitleEn: 'Which types of food do you enjoy the most?',
    subtitleAr: 'أي أنواع الأكل تستمتع فيها أكثر؟',
    isMultiSelect: true,
    maxSelect: 3,
    options: [
      {
        id: 'food_burger',
        labelEn: 'Burgers & Fast Food',
        labelAr: 'برجر ووجبات سريعة',
        iconKey: 'utensils',
      },
      {
        id: 'food_kabsa',
        labelEn: 'Saudi & Khaleeji Dishes',
        labelAr: 'أكلات سعودية وخليجية',
        iconKey: 'flame',
      },
      {
        id: 'food_sushi',
        labelEn: 'Asian Cuisine & Sushi',
        labelAr: 'أكلات آسيوية وسوشي',
        iconKey: 'fish',
      },
      {
        id: 'food_italian',
        labelEn: 'Pizza, Pasta & Italian Food',
        labelAr: 'بيتزا وباستا وأكل إيطالي',
        iconKey: 'pizza',
      },
      {
        id: 'food_grills',
        labelEn: 'Grills & Steaks',
        labelAr: 'مشويات وستيك',
        iconKey: 'flame',
      },
      {
        id: 'food_healthy',
        labelEn: 'Healthy Food & Salads',
        labelAr: 'أكل صحي وسلطات',
        iconKey: 'salad',
      },
      {
        id: 'food_other',
        labelEn: 'Diverse Traditional & Global Cuisines',
        labelAr: 'أكلات شعبية وعالمية متنوعة',
        iconKey: 'globe',
      },
      {
        id: 'food_sweets',
        labelEn: 'Sweets & Pastries',
        labelAr: 'حلويات ومخبوزات',
        iconKey: 'sparkles',
      },
    ],
  },

  // 4. 🏃 الرياضات اللي تمارسها
  {
    id: 'q_sports',
    category: 'sports',
    titleEn: '🏃 Sports You Practice',
    titleAr: '🏃 الرياضات اللي تمارسها',
    subtitleEn: 'Which physical sports or activities do you practice yourself?',
    subtitleAr: 'إيش الأنشطة الرياضية اللي تمارسها بنفسك؟',
    isMultiSelect: true,
    maxSelect: 3,
    options: [
      {
        id: 'sport_padel',
        labelEn: 'Padel',
        labelAr: 'بادل',
        iconKey: 'activity',
      },
      {
        id: 'sport_football',
        labelEn: 'Football',
        labelAr: 'كرة قدم',
        iconKey: 'trophy',
      },
      {
        id: 'sport_gym',
        labelEn: 'Gym & Weight Training',
        labelAr: 'نادي رياضي وتمارين حديد',
        iconKey: 'dumbbell',
      },
      {
        id: 'sport_running',
        labelEn: 'Walking',
        labelAr: 'مشي',
        iconKey: 'footprints',
      },
      {
        id: 'sport_swimming',
        labelEn: 'Swimming or Water Sports',
        labelAr: 'سباحة أو رياضات مائية',
        iconKey: 'waves',
      },
      {
        id: 'sport_hiking',
        labelEn: 'Hiking & Nature Walks',
        labelAr: 'هايكنج ومشي في الطبيعة',
        iconKey: 'compass',
      },
      {
        id: 'sport_other',
        labelEn: 'Martial Arts or Other Sports',
        labelAr: 'فنون قتالية أو رياضات أخرى',
        iconKey: 'shield',
      },
      {
        id: 'sport_none',
        labelEn: "I don't currently practice sports",
        labelAr: 'ما أمارس الرياضة حاليًا',
        iconKey: 'ban',
      },
    ],
  },

  // 5. 🏆 الرياضات اللي تحب تتابعها
  {
    id: 'q_sports_watch',
    category: 'sports_watch',
    titleEn: '🏆 Sports You Love Watching',
    titleAr: '🏆 الرياضات اللي تحب تتابعها',
    subtitleEn: 'Which competitions and sports do you enjoy watching?',
    subtitleAr: 'إيش المنافسات والرياضات اللي تستمتع بمشاهدتها؟',
    isMultiSelect: true,
    maxSelect: 3,
    options: [
      {
        id: 'watch_football',
        labelEn: 'Football',
        labelAr: 'كرة القدم',
        iconKey: 'trophy',
      },
      {
        id: 'watch_motorsport',
        labelEn: 'Motorsports & Formula 1',
        labelAr: 'سباقات السيارات وفورمولا 1',
        iconKey: 'car',
      },
      {
        id: 'watch_racket',
        labelEn: 'Tennis & Padel',
        labelAr: 'التنس والبادل',
        iconKey: 'activity',
      },
      {
        id: 'watch_combat',
        labelEn: 'Boxing & Martial Arts',
        labelAr: 'الملاكمة والفنون القتالية',
        iconKey: 'shield',
      },
      {
        id: 'watch_basketball',
        labelEn: 'Basketball & Other Sports',
        labelAr: 'كرة السلة والرياضات الأخرى',
        iconKey: 'award',
      },
      {
        id: 'watch_esports',
        labelEn: 'Esports',
        labelAr: 'الرياضات الإلكترونية',
        iconKey: 'gamepad',
      },
      {
        id: 'watch_none',
        labelEn: "I don't usually watch sports",
        labelAr: 'ما أتابع الرياضة عادةً',
        iconKey: 'ban',
      },
    ],
  },

  // 6. 🎨 هواياتك واهتماماتك
  {
    id: 'q_hobbies',
    category: 'hobbies',
    titleEn: '🎨 Your Hobbies & Interests',
    titleAr: '🎨 هواياتك واهتماماتك',
    subtitleEn: 'What do you love doing in your free time?',
    subtitleAr: 'إيش تحب تسوي في وقت فراغك؟',
    isMultiSelect: true,
    maxSelect: 3,
    options: [
      {
        id: 'hobby_photo_art',
        labelEn: 'Photography, Design & Drawing',
        labelAr: 'التصوير والتصميم والرسم',
        iconKey: 'camera',
      },
      {
        id: 'hobby_reading',
        labelEn: 'Reading & Writing',
        labelAr: 'القراءة والكتابة',
        iconKey: 'book',
      },
      {
        id: 'hobby_cooking',
        labelEn: 'Cooking & Trying New Recipes',
        labelAr: 'الطبخ وتجربة وصفات جديدة',
        iconKey: 'utensils',
      },
      {
        id: 'hobby_tech_diy',
        labelEn: 'Coding, Tech & Side Projects',
        labelAr: 'البرمجة والتقنية والمشاريع',
        iconKey: 'code',
      },
      {
        id: 'hobby_boardgames',
        labelEn: 'Chess, Puzzles & Mind Games',
        labelAr: 'الشطرنج والألغاز والألعاب الذهنية',
        iconKey: 'puzzle',
      },
      {
        id: 'hobby_gardening',
        labelEn: 'Gardening & Plant Care',
        labelAr: 'الزراعة والعناية بالنباتات',
        iconKey: 'leaf',
      },
      {
        id: 'hobby_exploring',
        labelEn: 'Exploring New Places & Experiences',
        labelAr: 'استكشاف أماكن وتجارب جديدة',
        iconKey: 'compass',
      },
      {
        id: 'hobby_other',
        labelEn: 'Other Hobbies',
        labelAr: 'هوايات أخرى',
        iconKey: 'palette',
      },
    ],
  },

  // 7. 🎬 الترفيه والمحتوى المفضل
  {
    id: 'q_entertainment',
    category: 'entertainment',
    titleEn: '🎬 Favorite Entertainment & Content',
    titleAr: '🎬 الترفيه والمحتوى المفضل',
    subtitleEn: 'How do you like spending your entertainment time?',
    subtitleAr: 'كيف تحب تقضي وقتك في الترفيه؟',
    isMultiSelect: true,
    maxSelect: 3,
    options: [
      {
        id: 'ent_movies',
        labelEn: 'Movies & Series',
        labelAr: 'أفلام ومسلسلات',
        iconKey: 'film',
      },
      {
        id: 'ent_gaming',
        labelEn: 'Video Games',
        labelAr: 'ألعاب فيديو',
        iconKey: 'gamepad',
      },
      {
        id: 'ent_podcasts',
        labelEn: 'Podcasts & Interviews',
        labelAr: 'بودكاست ومقابلات',
        iconKey: 'headphones',
      },
      {
        id: 'ent_music',
        labelEn: 'Music & Songs',
        labelAr: 'موسيقى وأغانٍ',
        iconKey: 'music',
      },
      {
        id: 'ent_anime',
        labelEn: 'Anime, Manga & Fantasy Worlds',
        labelAr: 'أنمي ومانجا وعوالم خيالية',
        iconKey: 'tv',
      },
      {
        id: 'ent_documentaries',
        labelEn: 'Documentaries & Educational Content',
        labelAr: 'وثائقيات ومحتوى تعليمي',
        iconKey: 'book',
      },
      {
        id: 'ent_social_clips',
        labelEn: 'Short Clips & Social Media Content',
        labelAr: 'مقاطع قصيرة ومحتوى السوشيال ميديا',
        iconKey: 'smartphone',
      },
      {
        id: 'ent_none',
        labelEn: 'Prefer Unplugged Entertainment Away from Screens',
        labelAr: 'أفضل الترفيه بعيدًا عن الشاشات',
        iconKey: 'moon',
      },
    ],
  },

  // 8. 🌊 الأماكن اللي ترتاح فيها
  {
    id: 'q_places',
    category: 'places',
    titleEn: '🌊 Places Where You Feel Most Relaxed',
    titleAr: '🌊 الأماكن اللي ترتاح فيها',
    subtitleEn: 'Where do you like to go when you need a change of scenery?',
    subtitleAr: 'وين تحب تروح إذا احتجت تغير جو؟',
    isMultiSelect: true,
    maxSelect: 2,
    options: [
      {
        id: 'place_sea_corniche',
        labelEn: 'Beach & Corniche',
        labelAr: 'البحر والكورنيش',
        iconKey: 'waves',
      },
      {
        id: 'place_nature_mountain',
        labelEn: 'Parks & Natural Spots',
        labelAr: 'الحدائق والأماكن الطبيعية',
        iconKey: 'mountain',
      },
      {
        id: 'place_quiet_cafe',
        labelEn: 'Cafes & Quiet Lounges',
        labelAr: 'المقاهي والجلسات الهادئة',
        iconKey: 'coffee',
      },
      {
        id: 'place_malls',
        labelEn: 'Malls & Shopping Districts',
        labelAr: 'المولات والأسواق',
        iconKey: 'sparkles',
      },
      {
        id: 'place_historic',
        labelEn: 'Heritage & Cultural Places',
        labelAr: 'الأماكن التراثية والثقافية',
        iconKey: 'landmark',
      },
      {
        id: 'place_modern_walk',
        labelEn: 'Walkways & Lively Boulevards',
        labelAr: 'المماشي والأماكن الحيوية',
        iconKey: 'compass',
      },
      {
        id: 'place_home',
        labelEn: 'Prefer Cozy Home Hangouts',
        labelAr: 'أفضل الجلسات المنزلية',
        iconKey: 'sun',
      },
    ],
  },

  // 9. 🚗 طلعتك المثالية في الويكند
  {
    id: 'q_leisure',
    category: 'leisure',
    titleEn: '🚗 Your Ideal Weekend Outing',
    titleAr: '🚗 طلعتك المثالية في الويكند',
    subtitleEn: 'How do you like spending your weekend?',
    subtitleAr: 'كيف تحب تقضي وقتك في الويكند؟',
    isMultiSelect: true,
    maxSelect: 2,
    options: [
      {
        id: 'leisure_boutique_lounge',
        labelEn: 'Cafe Hangout & Deep Talks with Friends',
        labelAr: 'جلسة مقهى وحوارات مع الأصحاب',
        iconKey: 'message-circle',
      },
      {
        id: 'leisure_roadtrip',
        labelEn: 'Night Drive & Great Audio Vibes',
        labelAr: 'فرّة بالسيارة مع صوتيات جميلة',
        iconKey: 'car',
      },
      {
        id: 'leisure_camping',
        labelEn: 'Desert Kashta, Camping & Bonfire',
        labelAr: 'طلعة بر أو تخييم وشبة نار',
        iconKey: 'flame',
      },
      {
        id: 'leisure_home_movie',
        labelEn: 'Cozy Home Night, Movies & Relaxation',
        labelAr: 'جلسة بيت وأفلام واسترخاء',
        iconKey: 'tv',
      },
      {
        id: 'leisure_social_event',
        labelEn: 'Trying New Restaurants & Spots',
        labelAr: 'تجربة مطاعم وأماكن جديدة',
        iconKey: 'utensils',
      },
      {
        id: 'leisure_family_friends',
        labelEn: 'Family or Friends Gatherings',
        labelAr: 'تجمعات عائلية أو مع الأصدقاء',
        iconKey: 'users',
      },
      {
        id: 'leisure_outdoor_activity',
        labelEn: 'Active Sports or Outdoor Adventure',
        labelAr: 'نشاط رياضي أو مغامرة خارجية',
        iconKey: 'activity',
      },
    ],
  },

  // 10. 🎟️ الفعاليات والتجارب اللي تحبها
  {
    id: 'q_events',
    category: 'events',
    titleEn: '🎟️ Events & Experiences You Enjoy',
    titleAr: '🎟️ الفعاليات والتجارب اللي تحبها',
    subtitleEn: 'Which live events and experiences do you enjoy attending?',
    subtitleAr: 'إيش الفعاليات اللي تستمتع بحضورها؟',
    isMultiSelect: true,
    maxSelect: 3,
    options: [
      {
        id: 'event_exhibitions',
        labelEn: 'Art, Cultural Exhibitions & Museums',
        labelAr: 'المعارض الفنية والثقافية والمتاحف',
        iconKey: 'palette',
      },
      {
        id: 'event_concerts',
        labelEn: 'Live Music Nights & Stage Shows',
        labelAr: 'الحفلات الموسيقية والعروض الحية',
        iconKey: 'music',
      },
      {
        id: 'event_food_markets',
        labelEn: 'Food & Coffee Festivals & Open Markets',
        labelAr: 'مهرجانات الأكل والقهوة والأسواق المفتوحة',
        iconKey: 'ticket',
      },
      {
        id: 'event_workshops',
        labelEn: 'Conferences, Workshops & Talks',
        labelAr: 'المؤتمرات وورش العمل واللقاءات المعرفية',
        iconKey: 'laptop',
      },
      {
        id: 'event_stadium',
        labelEn: 'Live Stadium Matches & Tournaments',
        labelAr: 'المباريات والبطولات الرياضية في الملعب',
        iconKey: 'trophy',
      },
      {
        id: 'event_seasons',
        labelEn: 'Entertainment Seasons & Interactive Experiences',
        labelAr: 'المواسم الترفيهية والتجارب التفاعلية',
        iconKey: 'sparkles',
      },
      {
        id: 'event_none',
        labelEn: 'Prefer Calm Vibes & Avoid Crowded Events',
        labelAr: 'أفضل الأجواء الهادئة وأتجنب الفعاليات المزدحمة',
        iconKey: 'ban',
      },
    ],
  },

  // 11. ✈️ أسلوبك المفضل في السفر
  {
    id: 'q_travel',
    category: 'travel',
    titleEn: '✈️ Your Preferred Travel Style',
    titleAr: '✈️ أسلوبك المفضل في السفر',
    subtitleEn: 'What kind of travel and vacations do you prefer most?',
    subtitleAr: 'إيش نوع السفر والإجازات اللي تفضله أكثر؟',
    isMultiSelect: false,
    options: [
      {
        id: 'travel_nature',
        labelEn: 'Green Nature, Mountains & Cool Weather',
        labelAr: 'طبيعة وجبال وأجواء باردة',
        iconKey: 'mountain',
      },
      {
        id: 'travel_city',
        labelEn: 'Global Cities, Shopping & Cafes',
        labelAr: 'مدن عالمية وتسوق ومقاهي',
        iconKey: 'globe',
      },
      {
        id: 'travel_culture',
        labelEn: 'History, Culture & Heritage Landmarks',
        labelAr: 'تاريخ وثقافة ومعالم تراثية',
        iconKey: 'landmark',
      },
      {
        id: 'travel_relax',
        labelEn: 'Beaches, Resorts & Peaceful Relaxation',
        labelAr: 'بحر ومنتجعات واستجمام هادئ',
        iconKey: 'waves',
      },
      {
        id: 'travel_roadtrip',
        labelEn: 'Road Trips, Adventure & Exploration',
        labelAr: 'رحلات برية ومغامرات واستكشاف',
        iconKey: 'plane',
      },
      {
        id: 'travel_domestic',
        labelEn: 'Domestic Tourism & Exploring Local Regions',
        labelAr: 'سياحة داخلية واستكشاف مناطق جديدة',
        iconKey: 'compass',
      },
      {
        id: 'travel_none',
        labelEn: 'Prefer Staycations in My City',
        labelAr: 'أفضل الإجازة في مدينتي',
        iconKey: 'sun',
      },
    ],
  },

  // 12. ⏰ روتينك اليومي ووقت نشاطك
  {
    id: 'q_lifestyle',
    category: 'lifestyle',
    titleEn: '⏰ Your Daily Routine & Peak Energy',
    titleAr: '⏰ روتينك اليومي ووقت نشاطك',
    subtitleEn: 'When do you usually feel most active and focused?',
    subtitleAr: 'متى تكون في قمة نشاطك وتركيزك غالبًا؟',
    isMultiSelect: false,
    options: [
      {
        id: 'rhythm_early_bird',
        labelEn: 'Morning Person — Love Early Starts',
        labelAr: 'شخص صباحي أحب البداية المبكرة',
        iconKey: 'sun',
      },
      {
        id: 'rhythm_afternoon',
        labelEn: 'Peak Energy in the Afternoon & Early Evening',
        labelAr: 'نشاطي يبدأ بعد الظهر والعصر',
        iconKey: 'clock',
      },
      {
        id: 'rhythm_night_owl',
        labelEn: 'Night Owl — Love Quiet Late Nights',
        labelAr: 'شخص ليلي أحب هدوء الليل والسهر',
        iconKey: 'moon',
      },
      {
        id: 'rhythm_flexible',
        labelEn: 'Flexible — Adapt to the Day’s Schedule',
        labelAr: 'مرن وأتكيف حسب جدول اليوم',
        iconKey: 'sparkles',
      },
    ],
  },

  // 13. ✨ طبعك الاجتماعي وطاقتك
  {
    id: 'q_vibe',
    category: 'vibe',
    titleEn: '✨ Your Social Vibe & Energy',
    titleAr: '✨ طبعك الاجتماعي وطاقتك',
    subtitleEn: 'How would you describe the way you connect with people?',
    subtitleAr: 'كيف توصف طريقتك في التواصل مع الناس؟',
    isMultiSelect: false,
    options: [
      {
        id: 'vibe_ambitious',
        labelEn: 'Ambitious, Practical & Goal-Driven',
        labelAr: 'طموح وعملي وأحب الإنجاز والتطور',
        iconKey: 'trending-up',
      },
      {
        id: 'vibe_chill',
        labelEn: 'Easygoing, Calm & Love Simple Hangouts',
        labelAr: 'رايق وهادئ وأحب الجلسات البسيطة',
        iconKey: 'smile',
      },
      {
        id: 'vibe_social',
        labelEn: 'Outgoing, Fun & Love Big Gatherings',
        labelAr: 'اجتماعي ومرح وأحب الجمعات الكبيرة',
        iconKey: 'users',
      },
      {
        id: 'vibe_creative',
        labelEn: 'Deep, Creative & Prefer 1-on-1 Conversations',
        labelAr: 'عميق ومبدع وأفضل الحوارات الثنائية',
        iconKey: 'sparkles',
      },
      {
        id: 'vibe_selective',
        labelEn: 'Prefer a Small Close Circle & Personal Space',
        labelAr: 'أفضل دائرة قريبة محدودة ووقتي الخاص',
        iconKey: 'heart',
      },
    ],
  },

  // 14. 💻 علاقتك بالتقنية
  {
    id: 'q_tech',
    category: 'tech',
    titleEn: '💻 Your Relationship with Tech',
    titleAr: '💻 علاقتك بالتقنية',
    subtitleEn: 'How involved are you with modern tech and digital tools?',
    subtitleAr: 'كيف تتعامل مع التقنية والأجهزة الحديثة في يومك؟',
    isMultiSelect: false,
    options: [
      {
        id: 'tech_enthusiast',
        labelEn: 'Passionate About Tech, AI & Everything New',
        labelAr: 'شغوف بالتقنية والذكاء الاصطناعي وكل جديد',
        iconKey: 'cpu',
      },
      {
        id: 'tech_creative',
        labelEn: 'Use Tech for Design, Productivity & Content Creation',
        labelAr: 'أستخدمها للتصميم والإنتاجية وصناعة المحتوى',
        iconKey: 'laptop',
      },
      {
        id: 'tech_gaming',
        labelEn: 'Into Gaming, Setups & Digital Entertainment',
        labelAr: 'مهتم بالألعاب والأجهزة والترفيه الرقمي',
        iconKey: 'gamepad',
      },
      {
        id: 'tech_practical',
        labelEn: 'Practical & Simple Everyday Usage',
        labelAr: 'استخدام عملي وبسيط لاحتياجاتي اليومية',
        iconKey: 'navigation',
      },
      {
        id: 'tech_minimalist',
        labelEn: 'Prefer Reducing Screen Time as Much as Possible',
        labelAr: 'أفضل تقليل الشاشات قدر الإمكان',
        iconKey: 'leaf',
      },
    ],
  },

  // 15. 🚘 ذوقك في السيارات
  {
    id: 'q_cars',
    category: 'cars',
    titleEn: '🚘 Your Car Taste',
    titleAr: '🚘 ذوقك في السيارات',
    subtitleEn: 'Which style of cars appeals to your taste and design sense most?',
    subtitleAr: 'أي نوع من السيارات يعجبك أكثر كذوق وتصميم؟',
    isMultiSelect: false,
    options: [
      {
        id: 'car_luxury_sedan',
        labelEn: '🚘 Sleek & Luxury Sedans',
        labelAr: '🚘 سيدان فاخرة وأنيقة',
        iconKey: 'car',
      },
      {
        id: 'car_suv_offroad',
        labelEn: '🚙 4x4 & Off-Road SUVs for Desert & Travel',
        labelAr: '🚙 دفع رباعي وجيوب للبر والسفر',
        iconKey: 'shield',
      },
      {
        id: 'car_sport_coupe',
        labelEn: '🏎️ Sports Cars & Coupes',
        labelAr: '🏎️ سيارات رياضية وكوبيه',
        iconKey: 'zap',
      },
      {
        id: 'car_electric',
        labelEn: '⚡ Modern Smart & Electric Cars',
        labelAr: '⚡ سيارات كهربائية وذكية حديثة',
        iconKey: 'battery-charging',
      },
      {
        id: 'car_practical',
        labelEn: '🚗 Practical & Economical City Cars',
        labelAr: '🚗 سيارات عملية واقتصادية للمدينة',
        iconKey: 'navigation',
      },
      {
        id: 'car_other',
        labelEn: '🛞 Classic & Rare Vintage Cars',
        labelAr: '🛞 سيارات كلاسيكية ونادرة',
        iconKey: 'sparkles',
      },
      {
        id: 'car_na',
        labelEn: "🤷 I'm not interested in cars",
        labelAr: '🤷 ما أهتم بالسيارات',
        iconKey: 'ban',
      },
    ],
  },

  // 16. 📱 أكثر تطبيق تقضي وقتك فيه
  {
    id: 'q_apps',
    category: 'apps',
    titleEn: '📱 App You Spend Most Time On',
    titleAr: '📱 أكثر تطبيق تقضي وقتك فيه',
    subtitleEn: 'Which app takes up most of your daily screen time?',
    subtitleAr: 'إيش التطبيق اللي ياخذ أغلب وقتك يوميًا؟',
    isMultiSelect: false,
    options: [
      {
        id: 'app_tiktok',
        labelEn: 'TikTok',
        labelAr: 'تيك توك (TikTok)',
        iconKey: 'smartphone',
      },
      {
        id: 'app_snapchat',
        labelEn: 'Snapchat',
        labelAr: 'سناب شات (Snapchat)',
        iconKey: 'camera',
      },
      {
        id: 'app_instagram',
        labelEn: 'Instagram',
        labelAr: 'إنستغرام (Instagram)',
        iconKey: 'sparkles',
      },
      {
        id: 'app_youtube',
        labelEn: 'YouTube',
        labelAr: 'يوتيوب (YouTube)',
        iconKey: 'tv',
      },
      {
        id: 'app_x',
        labelEn: 'X (Twitter)',
        labelAr: 'منصة إكس (X / تويتر)',
        iconKey: 'message-circle',
      },
      {
        id: 'app_whatsapp',
        labelEn: 'WhatsApp',
        labelAr: 'واتساب (WhatsApp)',
        iconKey: 'users',
      },
      {
        id: 'app_podcasts',
        labelEn: 'Podcast & Audio Apps',
        labelAr: 'تطبيقات البودكاست والصوتيات',
        iconKey: 'headphones',
      },
      {
        id: 'app_other',
        labelEn: 'Another App',
        labelAr: 'تطبيق آخر',
        iconKey: 'globe',
      },
      {
        id: 'app_none',
        labelEn: "I don't spend much time on a specific app",
        labelAr: 'ما أقضي وقتًا طويلًا على تطبيق محدد',
        iconKey: 'ban',
      },
    ],
  },
];

const RAW_DEFAULT_QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'coffee',
    nameEn: 'Your Daily Coffee Ritual',
    nameAr: '☕ ذوقك في القهوة',
    descriptionEn: 'Which coffee drink do you usually prefer?',
    descriptionAr: 'إيش مشروب القهوة اللي تفضله غالبًا؟',
    iconKey: 'coffee',
    order: 0,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'drinks',
    nameEn: 'Your Favorite Drinks',
    nameAr: '🧋 مشروباتك المفضلة',
    descriptionEn: 'What do you enjoy drinking besides coffee?',
    descriptionAr: 'إيش تحب تشرب بعيدًا عن القهوة؟',
    iconKey: 'glass-water',
    order: 1,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.05,
  },
  {
    id: 'food',
    nameEn: 'Your Food Taste',
    nameAr: '🍔 ذوقك في الأكل',
    descriptionEn: 'Which types of food do you enjoy the most?',
    descriptionAr: 'أي أنواع الأكل تستمتع فيها أكثر؟',
    iconKey: 'utensils',
    order: 2,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'sports',
    nameEn: 'Sports You Practice',
    nameAr: '🏃 الرياضات اللي تمارسها',
    descriptionEn: 'Which physical sports or activities do you practice yourself?',
    descriptionAr: 'إيش الأنشطة الرياضية اللي تمارسها بنفسك؟',
    iconKey: 'activity',
    order: 3,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'sports_watch',
    nameEn: 'Sports You Love Watching',
    nameAr: '🏆 الرياضات اللي تحب تتابعها',
    descriptionEn: 'Which competitions and sports do you enjoy watching?',
    descriptionAr: 'إيش المنافسات والرياضات اللي تستمتع بمشاهدتها؟',
    iconKey: 'trophy',
    order: 4,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.05,
  },
  {
    id: 'hobbies',
    nameEn: 'Your Hobbies & Interests',
    nameAr: '🎨 هواياتك واهتماماتك',
    descriptionEn: 'What do you love doing in your free time?',
    descriptionAr: 'إيش تحب تسوي في وقت فراغك؟',
    iconKey: 'camera',
    order: 5,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'entertainment',
    nameEn: 'Favorite Entertainment & Content',
    nameAr: '🎬 الترفيه والمحتوى المفضل',
    descriptionEn: 'How do you like spending your entertainment time?',
    descriptionAr: 'كيف تحب تقضي وقتك في الترفيه؟',
    iconKey: 'film',
    order: 6,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.06,
  },
  {
    id: 'places',
    nameEn: 'Places Where You Feel Most Relaxed',
    nameAr: '🌊 الأماكن اللي ترتاح فيها',
    descriptionEn: 'Where do you like to go when you need a change of scenery?',
    descriptionAr: 'وين تحب تروح إذا احتجت تغير جو؟',
    iconKey: 'waves',
    order: 7,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'leisure',
    nameEn: 'Your Ideal Weekend Outing',
    nameAr: '🚗 طلعتك المثالية في الويكند',
    descriptionEn: 'How do you like spending your weekend?',
    descriptionAr: 'كيف تحب تقضي وقتك في الويكند؟',
    iconKey: 'car',
    order: 8,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'events',
    nameEn: 'Events & Experiences You Enjoy',
    nameAr: '🎟️ الفعاليات والتجارب اللي تحبها',
    descriptionEn: 'Which live events and experiences do you enjoy attending?',
    descriptionAr: 'إيش الفعاليات اللي تستمتع بحضورها؟',
    iconKey: 'ticket',
    order: 9,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.06,
  },
  {
    id: 'travel',
    nameEn: 'Your Preferred Travel Style',
    nameAr: '✈️ أسلوبك المفضل في السفر',
    descriptionEn: 'What kind of travel and vacations do you prefer most?',
    descriptionAr: 'إيش نوع السفر والإجازات اللي تفضله أكثر؟',
    iconKey: 'plane',
    order: 10,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.06,
  },
  {
    id: 'lifestyle',
    nameEn: 'Your Daily Routine & Peak Energy',
    nameAr: '⏰ روتينك اليومي ووقت نشاطك',
    descriptionEn: 'When do you usually feel most active and focused?',
    descriptionAr: 'متى تكون في قمة نشاطك وتركيزك غالبًا؟',
    iconKey: 'sun',
    order: 11,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'vibe',
    nameEn: 'Your Social Vibe & Energy',
    nameAr: '✨ طبعك الاجتماعي وطاقتك',
    descriptionEn: 'How would you describe the way you connect with people?',
    descriptionAr: 'كيف توصف طريقتك في التواصل مع الناس؟',
    iconKey: 'sparkles',
    order: 12,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.07,
  },
  {
    id: 'tech',
    nameEn: 'Your Relationship with Tech',
    nameAr: '💻 علاقتك بالتقنية',
    descriptionEn: 'How involved are you with modern tech and digital tools?',
    descriptionAr: 'كيف تتعامل مع التقنية والأجهزة الحديثة في يومك؟',
    iconKey: 'cpu',
    order: 13,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.05,
  },
  {
    id: 'cars',
    nameEn: 'Your Car Taste',
    nameAr: '🚘 ذوقك في السيارات',
    descriptionEn: 'Which style of cars appeals to your taste and design sense most?',
    descriptionAr: 'أي نوع من السيارات يعجبك أكثر كذوق وتصميم؟',
    iconKey: 'car',
    order: 14,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.05,
  },
  {
    id: 'apps',
    nameEn: 'App You Spend Most Time On',
    nameAr: '📱 أكثر تطبيق تقضي وقتك فيه',
    descriptionEn: 'Which app takes up most of your daily screen time?',
    descriptionAr: 'إيش التطبيق اللي ياخذ أغلب وقتك يوميًا؟',
    iconKey: 'smartphone',
    order: 15,
    isEnabled: true,
    isBuiltIn: true,
    defaultWeight: 0.06,
  },
];

// Normalized & deeply frozen immutable seed copies so original defaults can NEVER be mutated
export const ONBOARDING_QUESTIONS: Question[] = deepFreezeSeed(
  RAW_ONBOARDING_QUESTIONS.map((q, qIdx) => ({
    ...q,
    categoryId: q.category,
    isEnabled: true,
    order: qIdx,
    isSystemDefault: true,
    options: q.options.map((opt, optIdx) => ({
      ...opt,
      isEnabled: true,
      order: optIdx,
    })),
  }))
);

export const DEFAULT_QUESTION_CATEGORIES: QuestionCategory[] = deepFreezeSeed(
  RAW_DEFAULT_QUESTION_CATEGORIES.map((c, idx) => ({
    ...c,
    order: idx,
  }))
);

export function cloneQuestion(q: Question): Question {
  return {
    ...q,
    categoryId: q.categoryId || q.category,
    isEnabled: q.isEnabled !== false,
    options: q.options.map((opt, idx) => ({
      ...opt,
      isEnabled: opt.isEnabled !== false,
      order: typeof opt.order === 'number' ? opt.order : idx,
    })),
  };
}

export function cloneCategory(cat: QuestionCategory): QuestionCategory {
  return { ...cat };
}

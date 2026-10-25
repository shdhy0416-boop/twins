import { VibeQuestion } from '../types';
import { getActiveAccountMode } from '../lib/supabase';
import { getActiveSessionUserId } from '../services/authService';
import {
  DEFAULT_DEMO_USER_ID,
  migrateLegacyDemoStorageIfNeeded,
  readUserScopedRecord,
  writeUserScopedRecord,
} from '../services/storageNamespace';

export interface PopularVibeTopic {
  id: string;
  questionId: string;
  iconEmoji: string;
  iconName: string;
  labelAr: string;
  labelEn: string;
  hookAr: string;
  hookEn: string;
}

export const POPULAR_VIBE_TOPICS: PopularVibeTopic[] = [
  {
    id: 'topic_mood',
    questionId: 'vibe_q_today_mood_and_plan',
    iconEmoji: '⚡',
    iconName: 'zap',
    labelAr: 'مود اليوم ⚡',
    labelEn: "Today's Mood",
    hookAr: 'كيف مودك وخطتك لليوم؟',
    hookEn: "What's your vibe & plan today?",
  },
  {
    id: 'topic_work',
    questionId: 'vibe_q_today_work_status',
    iconEmoji: '💼',
    iconName: 'activity',
    labelAr: 'دوام ولا إجازة 💼',
    labelEn: 'Work vs Off',
    hookAr: 'مداوم وشغال ولا مروّق بإجازة؟',
    hookEn: 'Working on duty or having a day off?',
  },
  {
    id: 'topic_coffee',
    questionId: 'vibe_q_coffee_order',
    iconEmoji: '☕',
    iconName: 'coffee',
    labelAr: 'الكوفي والروقان ☕',
    labelEn: 'Coffee Vibe',
    hookAr: 'وش مشروبك الأساسي لضبط المزاج؟',
    hookEn: "What's your go-to mood lifting coffee?",
  },
  {
    id: 'topic_sea',
    questionId: 'vibe_q_sea_corniche',
    iconEmoji: '🌊',
    iconName: 'waves',
    labelAr: 'البحر والكورنيش 🌊',
    labelEn: 'Sea & Corniche',
    hookAr: 'غروب البحر والممشى ولا كافيه بإطلالة؟',
    hookEn: 'Sunset sea chill or waterside cafe?',
  },
  {
    id: 'topic_homebody',
    questionId: 'vibe_q_homebody',
    iconEmoji: '🛋️',
    iconName: 'tv',
    labelAr: 'بيتوتي وأفلام 🛋️',
    labelEn: 'Homebody Chill',
    hookAr: 'أنا بيتوتي اليوم: أفلام وقيمينق ولا استكنان وراحة؟',
    hookEn: 'Homebody chill: movies, gaming or cozy rest?',
  },
];

export const VIBE_QUESTIONS: VibeQuestion[] = [
  // 1. مود اليوم وخطتك
  {
    id: 'vibe_q_today_mood_and_plan',
    category: 'lifestyle',
    titleEn: "Today's Mood & Plan",
    titleAr: 'كيف مودك وخطتك اليوم؟',
    subtitleEn: 'What is your current vibe and plan for today?',
    subtitleAr: 'كيف مودك ووش ناوي تسوي اليوم؟',
    totalVotesBase: 3840,
    options: [
      {
        id: 'opt_mood_going_out',
        labelEn: 'Thinking of going out 🚗',
        labelAr: 'شكلي خارج 🚗',
        icon: 'car',
        baseCommunityPercentage: 34,
        vibeTagEn: 'Out & About',
        vibeTagAr: 'طلعة وتغيير جو',
      },
      {
        id: 'opt_mood_crew',
        labelEn: 'Out with my crew / friends 👥',
        labelAr: 'طالع مع قروبي 👥',
        icon: 'sparkles',
        baseCommunityPercentage: 29,
        vibeTagEn: 'Squad Energy',
        vibeTagAr: 'جمعة وسوالف حماسية',
      },
      {
        id: 'opt_mood_chill_home',
        labelEn: 'Chill at home / Not in the mood 🛋️',
        labelAr: 'مالي خلق طفشان / مروق بالبيت 🛋️',
        icon: 'tv',
        baseCommunityPercentage: 21,
        vibeTagEn: 'Cozy Solitude',
        vibeTagAr: 'روقان وهدوء منزلي',
      },
      {
        id: 'opt_mood_happy_grateful',
        labelEn: 'Happy & Grateful / High energy ⚡',
        labelAr: 'مبسوط ولله الحمد وطاقة عالية ⚡',
        icon: 'zap',
        baseCommunityPercentage: 16,
        vibeTagEn: 'Radiant Joy',
        vibeTagAr: 'إيجابية وامتنان عالي',
      },
    ],
  },

  // 2. دوام ولا إجازة
  {
    id: 'vibe_q_today_work_status',
    category: 'lifestyle',
    titleEn: 'Work vs Day Off Today',
    titleAr: 'مداوم ولا إجازة اليوم؟',
    subtitleEn: 'Are you working, studying or having a day off today?',
    subtitleAr: 'هل أنت مداوم وشغال اليوم ولا مروق بإجازة؟',
    totalVotesBase: 2950,
    options: [
      {
        id: 'opt_work_duty',
        labelEn: 'Working / On duty 💼',
        labelAr: 'مداوم وشغال 💼',
        icon: 'activity',
        baseCommunityPercentage: 48,
        vibeTagEn: 'Active Hustler',
        vibeTagAr: 'إنجاز وعمل دؤوب',
      },
      {
        id: 'opt_work_off',
        labelEn: 'Day off / Relaxing 🏖️',
        labelAr: 'إجازة ومروّق 🏖️',
        icon: 'waves',
        baseCommunityPercentage: 36,
        vibeTagEn: 'Vacation Mode',
        vibeTagAr: 'استجمام وراحة تامة',
      },
      {
        id: 'opt_work_remote',
        labelEn: 'Remote / Flexible work 💻',
        labelAr: 'عن بعد / دوام مرن 💻',
        icon: 'compass',
        baseCommunityPercentage: 16,
        vibeTagEn: 'Flexible Nomad',
        vibeTagAr: 'مرونة بين العمل والراحة',
      },
    ],
  },

  // 3. الكوفي والروقان
  {
    id: 'vibe_q_coffee_order',
    category: 'coffee',
    titleEn: 'The Ultimate Coffee Order',
    titleAr: 'الكوفي وضبط المزاج',
    subtitleEn: 'What is your sacred drink to reset your energy?',
    subtitleAr: 'وش مشروبك الأساسي لضبط المزاج وتعديل الرأس؟',
    totalVotesBase: 3120,
    options: [
      {
        id: 'opt_iced_drip',
        labelEn: 'Iced V60 Floral Drip 🧊',
        labelAr: 'آيس V60 بإيحاءات فاكهية منعشة 🧊',
        icon: 'coffee',
        baseCommunityPercentage: 42,
        vibeTagEn: 'Purist Taste Connoisseur',
        vibeTagAr: 'ذواقة القهوة المقطرة',
      },
      {
        id: 'opt_velvet_flatwhite',
        labelEn: 'Hot Silky Flat White ☕',
        labelAr: 'فلات وايت ساخن بقوام حريري متزن ☕',
        icon: 'coffee',
        baseCommunityPercentage: 32,
        vibeTagEn: 'Comfort & Balance',
        vibeTagAr: 'توازن ونعومة النكهة',
      },
      {
        id: 'opt_spanish_sweet',
        labelEn: 'Chilled Sweet Spanish / Pistachio 🍯',
        labelAr: 'سبانش لاتيه بارد ولمسة حلاوة ممتعة 🍯',
        icon: 'coffee',
        baseCommunityPercentage: 16,
        vibeTagEn: 'Playful Indulgence',
        vibeTagAr: 'حب التدليل والانتعاش الحلو',
      },
      {
        id: 'opt_tea_mint',
        labelEn: 'Fresh Mint Karak / Moroccan Tea 🍃',
        labelAr: 'شاي نعناع منعش أو كرك مظبوط 🍃',
        icon: 'leaf',
        baseCommunityPercentage: 10,
        vibeTagEn: 'Classic Soul',
        vibeTagAr: 'أصالة واستكنان شاي',
      },
    ],
  },

  // 4. البحر والكورنيش
  {
    id: 'vibe_q_sea_corniche',
    category: 'leisure',
    titleEn: 'Sea & Corniche Escape',
    titleAr: 'أجواء البحر والكورنيش',
    subtitleEn: 'How do you like to enjoy the sea breeze?',
    subtitleAr: 'كيف تحب تقضي وقتك عند البحر ونسيم الساحل؟',
    totalVotesBase: 2680,
    options: [
      {
        id: 'opt_sea_sunset',
        labelEn: 'Sunset viewing with tea & deep thoughts 🌅',
        labelAr: 'جلسة هادئة وقت الغروب مع شاي وتأمل 🌅',
        icon: 'sun',
        baseCommunityPercentage: 45,
        vibeTagEn: 'Poetic Stargazer',
        vibeTagAr: 'شاعرية وهدوء وتأمل',
      },
      {
        id: 'opt_sea_walk',
        labelEn: 'Corniche walking, headphones & playlist 🏃',
        labelAr: 'ممشى الكورنيش وسماعاتي وخطوات سريعة 🏃',
        icon: 'footprints',
        baseCommunityPercentage: 27,
        vibeTagEn: 'Active Motion',
        vibeTagAr: 'نشاط وحرق طاقة وإيجابية',
      },
      {
        id: 'opt_sea_cafe',
        labelEn: 'Air-conditioned cafe with ocean view ☕',
        labelAr: 'كافيه راقي ومكيف بإطلالة مباشرة عالبحر ☕',
        icon: 'coffee',
        baseCommunityPercentage: 18,
        vibeTagEn: 'Aesthetic Comfort',
        vibeTagAr: 'روقان وفخامة بدون حر',
      },
      {
        id: 'opt_sea_boat',
        labelEn: 'Yacht ride, swimming & speed boat 🛥️',
        labelAr: 'رحلة يخت وقارب وسرعة وأمواج 🛥️',
        icon: 'waves',
        baseCommunityPercentage: 10,
        vibeTagEn: 'Adventurous Thrill',
        vibeTagAr: 'مغامرة وانطلاق بالبحر',
      },
    ],
  },

  // 5. المول والشوبينق
  {
    id: 'vibe_q_mall_shopping',
    category: 'places',
    titleEn: 'Mall & Shopping Vibe',
    titleAr: 'روحة المول والشوبينق',
    subtitleEn: 'What attracts you the most when visiting a mall?',
    subtitleAr: 'وش جوّك لما تروح المولات والمراكز التجارية؟',
    totalVotesBase: 2470,
    options: [
      {
        id: 'opt_mall_browse',
        labelEn: 'Leisurely shopping, perfumes & brands 🛍️',
        labelAr: 'شوبينق رايق، عطور وملابس وتجربة جديدة 🛍️',
        icon: 'sparkles',
        baseCommunityPercentage: 35,
        vibeTagEn: 'Chic Curator',
        vibeTagAr: 'أناقة وتجديد الستايل',
      },
      {
        id: 'opt_mall_cinema',
        labelEn: 'IMAX Cinema, latest blockbuster & popcorn 🍿',
        labelAr: 'سينما وآيماكس، فيلم جديد وبوب كورن مكس 🍿',
        icon: 'tv',
        baseCommunityPercentage: 31,
        vibeTagEn: 'Cinema Lover',
        vibeTagAr: 'عاشق للشاشة الكبيرة والقصص',
      },
      {
        id: 'opt_mall_dining',
        labelEn: 'Food courts & trendy cafes with friends 🍴',
        labelAr: 'كافيهات ومطاعم المول وجلسة حوارية رايقة 🍴',
        icon: 'utensils',
        baseCommunityPercentage: 20,
        vibeTagEn: 'Social Foodie',
        vibeTagAr: 'متعة الأكل والجلسات الحلوة',
      },
      {
        id: 'opt_mall_hater',
        labelEn: 'Hate crowds, avoid malls unless urgent 🙅‍♂️',
        labelAr: 'زحمة تطفش وما أحب المولات إلا للضرورة 🙅‍♂️',
        icon: 'shield',
        baseCommunityPercentage: 14,
        vibeTagEn: 'Open Air Rebel',
        vibeTagAr: 'عاشق للهواء الطلق والهدوء',
      },
    ],
  },

  // 6. بيتوتي اليوم
  {
    id: 'vibe_q_homebody',
    category: 'lifestyle',
    titleEn: 'Homebody Chill Today',
    titleAr: 'أنا بيتوتي اليوم 🛋️',
    subtitleEn: 'If staying home all day, how does your comfort look?',
    subtitleAr: 'لو قررت تكون بيتوتي اليوم وما تخرج، وش برنامجك؟',
    totalVotesBase: 3620,
    options: [
      {
        id: 'opt_home_netflix',
        labelEn: 'Binge-watching TV series & indie films 🎬',
        labelAr: 'ماراثون مسلسلات نتفلكس وأفلام مع سناكات 🎬',
        icon: 'tv',
        baseCommunityPercentage: 41,
        vibeTagEn: 'Couch Cinephile',
        vibeTagAr: 'غوص بالأحداث والقصص الممتعة',
      },
      {
        id: 'opt_home_sleep',
        labelEn: 'Pure sleep, relaxation & zero alarms 😴',
        labelAr: 'نوم عميق واستكنان وإلغاء كل المنبهات 😴',
        icon: 'moon',
        baseCommunityPercentage: 28,
        vibeTagEn: 'Recovery Master',
        vibeTagAr: 'إعادة شحن البطارية للصفر',
      },
      {
        id: 'opt_home_gaming',
        labelEn: 'PlayStation / PC gaming online with friends 🎮',
        labelAr: 'بلايستيشن وسوني وأونلاين مع الشباب 🎮',
        icon: 'gamepad',
        baseCommunityPercentage: 21,
        vibeTagEn: 'Competitive Gamer',
        vibeTagAr: 'تحديات وضحك وحماس ألعاب',
      },
      {
        id: 'opt_home_read_cook',
        labelEn: 'Reading, specialty cooking & cozy room scent 🍳',
        labelAr: 'طبخ أكلة حلوة وقراءة وتبخير الغرفة 🍳',
        icon: 'heart',
        baseCommunityPercentage: 10,
        vibeTagEn: 'Home Alchemist',
        vibeTagAr: 'صانع الأجواء الخاصة والألفة',
      },
    ],
  },

  // 7. دشرة وفرّة بالسيارة
  {
    id: 'vibe_q_cruising',
    category: 'cars',
    titleEn: 'Cruising & Driving Around',
    titleAr: 'دشرة وفرّة بالسيارة 🚗',
    subtitleEn: 'What is your driving vibe when hitting the roads?',
    subtitleAr: 'وش جوّك لما تمسك الدركسون وتنزل تفتر بالشوارع؟',
    totalVotesBase: 3380,
    options: [
      {
        id: 'opt_cruise_music',
        labelEn: 'Cruising with favorite playlist and no destination 🎵',
        labelAr: 'فرّة مع لستة أغانيك المفضلة بدون وجهة محددة 🎵',
        icon: 'car',
        baseCommunityPercentage: 46,
        vibeTagEn: 'Endless Highway Soul',
        vibeTagAr: 'مزاج عالي وسواقة حرة بالليل',
      },
      {
        id: 'opt_cruise_drivethru',
        labelEn: 'Drive-thru coffee and long talks with a friend ☕',
        labelAr: 'درايف ثرو كوفي وسوالف عميقة مع أعز خوي ☕',
        icon: 'coffee',
        baseCommunityPercentage: 30,
        vibeTagEn: 'Heart-to-Heart Commute',
        vibeTagAr: 'أنس وونس مع أوفى الناس',
      },
      {
        id: 'opt_cruise_highway',
        labelEn: 'Open highway, clear asphalt & night breeze 🛣️',
        labelAr: 'طريق سريع مفتوح بدون إشارات مع نسيم بارد 🛣️',
        icon: 'navigation',
        baseCommunityPercentage: 15,
        vibeTagEn: 'Open Speed Zen',
        vibeTagAr: 'راحة الخطوط والسرعة المتزنة',
      },
      {
        id: 'opt_cruise_traffic_hate',
        labelEn: 'Traffic exhausts me, rather stay parked 🛑',
        labelAr: 'زحمة ترفع الضغط وسواقة متعبة.. البيت أرحم 🛑',
        icon: 'shield',
        baseCommunityPercentage: 9,
        vibeTagEn: 'Peace Seeker',
        vibeTagAr: 'تجنب الزحام وحفظ الأعصاب',
      },
    ],
  },

  // 8. العشاء والمطاعم
  {
    id: 'vibe_q_dinner_spot',
    category: 'food',
    titleEn: 'The Ultimate Dinner Cravings',
    titleAr: 'العشاء والمطاعم اليوم 🍔',
    subtitleEn: 'When dinner time comes, what does your stomach scream for?',
    subtitleAr: 'لما يجي وقت العشاء، وش الأكلة اللي تنادي قلبك؟',
    totalVotesBase: 3050,
    options: [
      {
        id: 'opt_dinner_burger',
        labelEn: 'Artisanal smash burger with truffle & loaded fries 🍔',
        labelAr: 'سماش برجر ذواقة بالترفل وبطاطس لغوصة 🍔',
        icon: 'utensils',
        baseCommunityPercentage: 38,
        vibeTagEn: 'Savory Burger Lover',
        vibeTagAr: 'عاشق البرجر العصاري المقرمش',
      },
      {
        id: 'opt_dinner_shawarma',
        labelEn: 'Saucy garlic shawarma in saj bread 🌯',
        labelAr: 'شاورما صاج مليانة صوص وثوم زيادة مخلل 🌯',
        icon: 'utensils',
        baseCommunityPercentage: 33,
        vibeTagEn: 'Shawarma Devotee',
        vibeTagAr: 'عشق الشاورما الأصيل',
      },
      {
        id: 'opt_dinner_asian',
        labelEn: 'Sushi rolls or spicy ramen noodles 🍣',
        labelAr: 'سوشي رولز طازجة أو نودلز ورامن آسيوي 🍣',
        icon: 'fish',
        baseCommunityPercentage: 17,
        vibeTagEn: 'Asian Fusion Palette',
        vibeTagAr: 'ذواقة النكهات الآسيوية الدقيقة',
      },
      {
        id: 'opt_dinner_kabsa',
        labelEn: 'Rich authentic lamb kabsa / mandi 🍖',
        labelAr: 'كبسة لحم معتبرة ومندي أصيل يرم العظم 🍖',
        icon: 'utensils',
        baseCommunityPercentage: 12,
        vibeTagEn: 'Heritage Feast',
        vibeTagAr: 'أصالة المائدة الشعبية الدسمة',
      },
    ],
  },

  // 9. بادل ورياضة
  {
    id: 'vibe_q_sports_energy',
    category: 'sports',
    titleEn: 'Active Motion Preference',
    titleAr: 'بادل ورياضة وطاقة 🎾',
    subtitleEn: 'How do you prefer breaking a sweat and feeling alive?',
    subtitleAr: 'ما هو أسلوب التمارين الذي تشعر فيه بأعلى درجات الحماس؟',
    totalVotesBase: 2550,
    options: [
      {
        id: 'opt_competitive_games',
        labelEn: 'Padel match with friends, banter & adrenaline 🎾',
        labelAr: 'مباراة بادل حماسية مع الخويا وتحدي وضحك 🎾',
        icon: 'trophy',
        baseCommunityPercentage: 54,
        vibeTagEn: 'Dynamic Team Spirit',
        vibeTagAr: 'روح الفريق والمنافسة الودية',
      },
      {
        id: 'opt_solo_endurance',
        labelEn: 'Solo gym session: Heavy lifts & focused music 🏋️',
        labelAr: 'سماعاتك بأذنك: أوزان ثقيلة في الجيم وتحدي للذات 🏋️',
        icon: 'dumbbell',
        baseCommunityPercentage: 28,
        vibeTagEn: 'Focused Warrior Mode',
        vibeTagAr: 'تركيز فردي وبناء قوة',
      },
      {
        id: 'opt_night_run',
        labelEn: 'Night outdoor run or brisk walking 👟',
        labelAr: 'جري ليلي منعش في الهواء الطلق أو مشي سريع 👟',
        icon: 'footprints',
        baseCommunityPercentage: 12,
        vibeTagEn: 'Cardio Zen',
        vibeTagAr: 'صفاء ذهن وتنفس عميق',
      },
      {
        id: 'opt_rest_day',
        labelEn: 'Rest & recovery: Stretching & chill 🧘',
        labelAr: 'يوم راحة تام واستشفاء عضلي وكسل جميل 🧘',
        icon: 'sparkles',
        baseCommunityPercentage: 6,
        vibeTagEn: 'Mindful Recovery',
        vibeTagAr: 'احترام حاجة الجسد للراحة',
      },
    ],
  },

  // 10. كشتة وشبة نار
  {
    id: 'vibe_q_desert_kashta',
    category: 'leisure',
    titleEn: 'Kashta & Desert Campfire',
    titleAr: 'كشتة وشبة نار بالبر ⛺',
    subtitleEn: 'What is the peak moment of a desert getaway for you?',
    subtitleAr: 'وش أروع لحظة تعيشها لما تطلع كشتة أو مخيم بالبر؟',
    totalVotesBase: 2790,
    options: [
      {
        id: 'opt_kashta_fire',
        labelEn: 'Campfire with chai karak and soulful late-night stories 🔥',
        labelAr: 'شبة نار مع شاي كرك وسوالف دافية لين وجه الصبح 🔥',
        icon: 'flame',
        baseCommunityPercentage: 52,
        vibeTagEn: 'Cosmic Hearth Keeper',
        vibeTagAr: 'أصيل يعشق لهب النار ودفء الجلسات',
      },
      {
        id: 'opt_kashta_stars',
        labelEn: 'Lying under a million desert stars in dead silence 🌌',
        labelAr: 'تمدد تحت ملايين النجوم في صمت البر المهيب 🌌',
        icon: 'moon',
        baseCommunityPercentage: 26,
        vibeTagEn: 'Astral Dreamer',
        vibeTagAr: 'عاشق للسماء والكون والسكينة',
      },
      {
        id: 'opt_kashta_gathering',
        labelEn: 'Lively camp games, baloot & barbecue feasts 🏕️',
        labelAr: 'ألعاب وبلوت وشواء وضحك مع العيال 🏕️',
        icon: 'sparkles',
        baseCommunityPercentage: 15,
        vibeTagEn: 'High-Spirited Camaraderie',
        vibeTagAr: 'فلة حجاج ومنافسات بلوت وشواء',
      },
      {
        id: 'opt_kashta_quick',
        labelEn: 'Quick 3-hour afternoon sunset cruise & heading back 🌅',
        labelAr: 'كشتة سريعة للمغرب: قهوة وجلسة ورجعة للمدينة 🌅',
        icon: 'sun',
        baseCommunityPercentage: 7,
        vibeTagEn: 'Lighthearted Escapist',
        vibeTagAr: 'تغيير جو خفيف بدون التزام مبيت',
      },
    ],
  },

  // Extra lifestyle questions
  {
    id: 'vibe_q_morning_ritual',
    category: 'lifestyle',
    titleEn: 'Morning Rhythm',
    titleAr: 'طقسك الصباحي المعتاد',
    subtitleEn: 'How does your first hour of the day usually unfold?',
    subtitleAr: 'كيف تقضي أول ساعة في بداية يومك؟',
    totalVotesBase: 2410,
    options: [
      {
        id: 'opt_slow_morning',
        labelEn: 'Slow 45-min Coffee & Gentle Sunlight',
        labelAr: 'قهوة هادئة 45 دقيقة بدون شاشات مع شروق الشمس',
        icon: 'coffee',
        baseCommunityPercentage: 66,
        vibeTagEn: 'Mindful Morning Zen',
        vibeTagAr: 'روقان وهدوء صباحي',
      },
      {
        id: 'opt_speed_runner',
        labelEn: '10-min Grab-and-Go Rush into Action',
        labelAr: '10 دقائق سريعة وانطلاق فوري للعمل والمشاريع',
        icon: 'zap',
        baseCommunityPercentage: 34,
        vibeTagEn: 'High-Velocity Operator',
        vibeTagAr: 'طاقة عالية وإنجاز سريع',
      },
    ],
  },
  {
    id: 'vibe_q_social_battery',
    category: 'vibe',
    titleEn: 'Social Battery Recharge',
    titleAr: 'كيف تشحن طاقتك الاجتماعية؟',
    subtitleEn: 'After an intense, demanding week, what restores your soul?',
    subtitleAr: 'بعد أسبوع عمل حافل، كيف تستعيد نشاطك وسلامك الداخلي؟',
    totalVotesBase: 2890,
    options: [
      {
        id: 'opt_cozy_solitude',
        labelEn: 'Solo sanctuary: Films, books & zero notifications',
        labelAr: 'عزلة مريحة: أفلام، قراءة، وإيقاف الإشعارات',
        icon: 'tv',
        baseCommunityPercentage: 54,
        vibeTagEn: 'Reflective Hermit',
        vibeTagAr: 'هدوء ذاتي واستعادة صفاء الذهن',
      },
      {
        id: 'opt_inner_circle',
        labelEn: 'Intimate dinner with 2-3 trusted kindred spirits',
        labelAr: 'عشاء دافئ مع 2 إلى 3 من أقرب الأصدقاء',
        icon: 'sparkles',
        baseCommunityPercentage: 46,
        vibeTagEn: 'Heart-to-Heart Connector',
        vibeTagAr: 'تواصل عميق وونس مع الأحبة',
      },
    ],
  },
];

/**
 * Returns localized day of week name and calendar date
 */
export function getTodayDayInfo(lang: 'ar' | 'en' = 'ar'): {
  dayName: string;
  formattedDate: string;
  isWeekend: boolean;
} {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const isWeekend = dayIndex === 5 || dayIndex === 6;

  const formattedDate = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(now);

  return {
    dayName: lang === 'ar' ? dayNamesAr[dayIndex] : dayNamesEn[dayIndex],
    formattedDate,
    isWeekend,
  };
}

/**
 * Returns the daily deterministic question based on today's calendar date,
 * prioritizing today's mood and work status checks.
 */
export function getDailyVibeQuestion(offset: number = 0): VibeQuestion {
  const index = Math.abs(offset) % VIBE_QUESTIONS.length;
  return VIBE_QUESTIONS[index];
}

/**
 * Persists the user's daily vibe answer scoped strictly to `(accountMode, userId)`.
 */
export function saveDailyVibeAnswer(
  questionId: string,
  optionId: string,
  userId?: string
): void {
  try {
    migrateLegacyDemoStorageIfNeeded();
    const mode = getActiveAccountMode();
    const targetUserId = userId || getActiveSessionUserId();
    if (!targetUserId) return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const resourceKey = `vibe_check:${todayKey}_${questionId}` as const;

    writeUserScopedRecord(mode, targetUserId, resourceKey, {
      userId: targetUserId,
      questionId,
      optionId,
      answeredAt: Date.now(),
    });

    const existingStreak = readUserScopedRecord<{ count: number; lastDate: string }>(
      mode,
      targetUserId,
      'vibe_streak'
    );
    const baseStarter = targetUserId === DEFAULT_DEMO_USER_ID ? 3 : 0;
    let streakCount = baseStarter + 1;
    const lastDate = todayKey;

    if (existingStreak) {
      if (existingStreak.lastDate !== todayKey) {
        streakCount = (existingStreak.count || baseStarter) + 1;
      } else {
        streakCount = existingStreak.count || 1;
      }
    }

    writeUserScopedRecord(mode, targetUserId, 'vibe_streak', {
      count: streakCount,
      lastDate,
    });
  } catch {
    // ignore storage error
  }
}

/**
 * Retrieves the saved daily vibe answer for the specified user today, if any.
 */
export function getDailyVibeAnswer(questionId: string, userId?: string): string | null {
  try {
    migrateLegacyDemoStorageIfNeeded();
    const mode = getActiveAccountMode();
    const targetUserId = userId || getActiveSessionUserId();
    if (!targetUserId) return null;

    const todayKey = new Date().toISOString().slice(0, 10);
    const resourceKey = `vibe_check:${todayKey}_${questionId}` as const;
    const parsed = readUserScopedRecord<{ optionId?: string; userId?: string }>(
      mode,
      targetUserId,
      resourceKey
    );
    if (!parsed) return null;
    if (parsed.userId && parsed.userId !== targetUserId) return null;
    return parsed.optionId || null;
  } catch {
    return null;
  }
}

/**
 * Gets current daily vibe streak scoped strictly to the specified user ID.
 */
export function getVibeStreak(userId?: string): number {
  try {
    migrateLegacyDemoStorageIfNeeded();
    const mode = getActiveAccountMode();
    const targetUserId = userId || getActiveSessionUserId();
    if (!targetUserId) return 1;

    const existing = readUserScopedRecord<{ count?: number }>(
      mode,
      targetUserId,
      'vibe_streak'
    );
    if (!existing) {
      return targetUserId === DEFAULT_DEMO_USER_ID ? 3 : 1;
    }
    return existing.count || 1;
  } catch {
    return 1;
  }
}

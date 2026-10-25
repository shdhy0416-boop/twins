import React, { useEffect, useState } from 'react';
import { AvatarConfig, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { AvatarRenderer } from './AvatarRenderer';
import { CutoutStickerImage, preloadCutoutStickers } from './CutoutStickerImage';
import { STICKERS_3D_COLLECTION, StickerCategory } from '../../data/stickersData';
import { X, Check, Sparkles, Dices, RefreshCw, Zap, Flame, Smile, Heart } from 'lucide-react';

interface AvatarCustomizerModalProps {
  avatar: AvatarConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newAvatar: AvatarConfig) => void;
  language: Language;
}

const SKIN_TONES = ['#F5D0A9', '#F3C59D', '#E0AC69', '#C68642', '#8D5524'];
const CLOTHING_COLORS = [
  '#0B5D3B', // Emerald
  '#10B981', // Vivid Mint
  '#1E293B', // Obsidian Black
  '#D4AF37', // Royal Gold
  '#2563EB', // Electric Cobalt
  '#DC2626', // Ruby Red
  '#8B5CF6', // Lavender
  '#F8F7F2', // Pearl White
  '#92400E', // Desert Sand
];

const CAP_COLORS = [
  '#18181B', // Street Matte Black
  '#0B5D3B', // Saudi Emerald Green
  '#F8FAFC', // Classic Snow White
  '#1E3A8A', // Deep Navy
  '#D4B996', // Sand Desert Earth
  '#DC2626', // Street Crimson
  '#7C3AED', // Cyber Violet Neon
  '#0E7490', // Ocean Petrol Blue
  '#D4AF37', // Royal Gold
  '#F43F5E', // Modern Pastel Rose
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  avatar,
  isOpen,
  onClose,
  onSave,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'stickers' | 'avatar'>(
    avatar.stickerId ? 'stickers' : 'stickers'
  );
  const [config, setConfig] = useState<AvatarConfig>({
    ...avatar,
    stickerMotion: avatar.stickerMotion || 'sway',
  });
  const [popKey, setPopKey] = useState(0);
  const [capFilter, setCapFilter] = useState<'all' | 'caps' | 'nocap'>('all');
  const [stickerCategory, setStickerCategory] = useState<'all' | StickerCategory>('all');

  useEffect(() => {
    if (isOpen) {
      preloadCutoutStickers(STICKERS_3D_COLLECTION.map((s) => s.image));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerPop = () => {
    setPopKey((k) => k + 1);
  };

  const updateConfig = (patch: Partial<AvatarConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    triggerPop();
  };

  const hairOptions: { id: AvatarConfig['hairStyle']; labelEn: string; labelAr: string; isCap?: boolean }[] = [
    { id: 'cap', labelEn: 'Snapback Cap 🧢', labelAr: 'كاب رياضي (بي كاب) 🧢', isCap: true },
    { id: 'backward-cap', labelEn: 'Backward Cap 🧢', labelAr: 'كاب مقلوب شبابي 🧢', isCap: true },
    { id: 'beanie', labelEn: 'Street Beanie 🧢', labelAr: 'قبعة بيني شتوية 🧢', isCap: true },
    { id: 'bucket-hat', labelEn: 'Bucket Hat 🧢', labelAr: 'قبعة باكت هات شبابية 🧢', isCap: true },
    { id: 'short-fade', labelEn: 'Modern Fade (No Cap)', labelAr: 'تدريج عصري (بدون كاب)' },
    { id: 'textured-crop', labelEn: 'Textured Crop (No Cap)', labelAr: 'قصة تيكستشر شبابية (بدون كاب)' },
    { id: 'curly', labelEn: 'Curly Volume (No Cap)', labelAr: 'شعر كيرلي كثيف (بدون كاب)' },
    { id: 'wavy', labelEn: 'Wavy Layers (No Cap)', labelAr: 'مموج شبابي (بدون كاب)' },
    { id: 'buzz', labelEn: 'Clean Buzz Cut', labelAr: 'حلاقة خفيفة كلين باز' },
    { id: 'traditional', labelEn: 'Saudi Shemagh & Egal', labelAr: 'شماغ وعقال سعودي أصيل' },
    { id: 'hijab', labelEn: 'Modern Hijab', labelAr: 'حجاب أنيق' },
  ];

  const clothingOptions: { id: AvatarConfig['clothingStyle']; labelEn: string; labelAr: string }[] = [
    { id: 'hoodie', labelEn: 'Streetwear Hoodie', labelAr: 'هودي شبابي مريح' },
    { id: 'street-tee', labelEn: 'Graphic Street Tee', labelAr: 'تيشيرت ستريتوير عصري' },
    { id: 'varsity', labelEn: 'Varsity Jacket', labelAr: 'جاكيت بارسيتي كوليدج' },
    { id: 'denim', labelEn: 'Denim Jacket', labelAr: 'جاكيت جينز شبابي' },
    { id: 'linen-shirt', labelEn: 'Linen Resort Shirt', labelAr: 'قميص كتان صيفي' },
    { id: 'thobe', labelEn: 'Saudi Thobe', labelAr: 'ثوب سعودي مطرز' },
    { id: 'blazer', labelEn: 'Sharp Blazer', labelAr: 'بليزر رسمي كشخة' },
    { id: 'tshirt', labelEn: 'Minimal T-Shirt', labelAr: 'تيشيرت ناعم بسيط' },
  ];

  const accessoryOptions: { id: AvatarConfig['accessory']; labelEn: string; labelAr: string }[] = [
    { id: 'none', labelEn: 'None (No Glasses)', labelAr: 'بدون نظارة' },
    { id: 'sunglasses', labelEn: 'Dark Luxury Shades', labelAr: 'نظارة شمسية داكنة 🕶️' },
    { id: 'retro-shades', labelEn: 'Retro Street Shades', labelAr: 'نظارة ريترو شبابية 😎' },
    { id: 'gold-wire', labelEn: 'Gold Wire Aesthetic', labelAr: 'نظارة بإطار ذهبي راقي 👓' },
    { id: 'clear-optical', labelEn: 'Clear Modern Optical', labelAr: 'نظارة طبية شفافة عصرية 👓' },
    { id: 'cyber-tint', labelEn: 'Cyber Neon Street Shades', labelAr: 'نظارة سايبر ملونة شبابية 🕶️' },
    { id: 'sports-wrap', labelEn: 'Sports Wrap Athletic', labelAr: 'نظارة رياضية سريعة 🏃' },
    { id: 'glasses', labelEn: 'Classic Dark Optical', labelAr: 'نظارة كلاسيكية إطار أسود 👓' },
    { id: 'headphones', labelEn: 'Studio Headphones', labelAr: 'سماعات رأس ستوديو 🎧' },
  ];

  const expressionOptions: { id: AvatarConfig['expression']; labelEn: string; labelAr: string }[] = [
    { id: 'smile', labelEn: 'Gentle Smile', labelAr: 'ابتسامة هادئة' },
    { id: 'cheerful', labelEn: 'Wide Laugh', labelAr: 'ضحكة وفرحة' },
    { id: 'cool', labelEn: 'Cool & Chill', labelAr: 'نظرة واثقة' },
    { id: 'wink', labelEn: 'Playful Wink', labelAr: 'غمزة مرحة' },
  ];

  const motionOptions: {
    id: NonNullable<AvatarConfig['motionStyle']>;
    labelEn: string;
    labelAr: string;
    icon: string;
    descEn: string;
    descAr: string;
  }[] = [
    { id: 'waving', labelEn: 'Friendly Wave 👋', labelAr: 'يلوح ويرحب 👋', icon: '👋', descEn: 'Waves hand warmly to friends', descAr: 'يلوح بيده ويرحب بالأصدقاء' },
    { id: 'hand-raised', labelEn: 'High-Five Hand ✋', labelAr: 'يرفع يده بالكامل ✋', icon: '✋', descEn: 'Raises hand ready for high-five', descAr: 'يرفع يده ومستعد للهاي فايف والتحية' },
    { id: 'double-raise', labelEn: 'Double Raise 🙌', labelAr: 'يرفع كلتا يديه حماس 🙌', icon: '🙌', descEn: 'Both hands raised in celebration', descAr: 'يرفع كلتا يديه بحماس واحتفال شبابي' },
    { id: 'peace', labelEn: 'Victory Sign ✌️', labelAr: 'يرفع يده بعلامة النصر ✌️', icon: '✌️', descEn: 'Raises hand with peace sign', descAr: 'يرفع يده بعلامة النصر والسلام' },
    { id: 'finger-point', labelEn: 'Youth Finger Point 👈', labelAr: 'إشارة يد ترحيب شبابية 👈', icon: '👈', descEn: 'Cool welcoming finger gesture', descAr: 'إشارة يد ترحيبية رايقة وستايل' },
    { id: 'thumbs-up', labelEn: 'Thumbs Up 👍', labelAr: 'يرفع إبهامه بإعجاب 👍', icon: '👍', descEn: 'Approving thumbs up gesture', descAr: 'يرفع يده بإشارة الإعجاب والترحيب' },
    { id: 'smiling', labelEn: 'Gentle Smile 😊', labelAr: 'يبتسم ويتألق 😊', icon: '😊', descEn: 'Blushing smile with sparkles', descAr: 'ابتسامة متألقة مع وميض ذهبي' },
    { id: 'bouncing', labelEn: 'Joyful Bounce 🎉', labelAr: 'يقفز بمرح 🎉', icon: '🎉', descEn: 'Energetic happy bounce', descAr: 'قفزة حيوية وحماسية مرحة' },
    { id: 'nodding', labelEn: 'Confident Nod 😎', labelAr: 'إيماءة واثقة 😎', icon: '😎', descEn: 'Cool affirming nod', descAr: 'إيماءة رأس رايقة وواثقة' },
    { id: 'cool-sway', labelEn: 'Chill Sway ✨', labelAr: 'تمايل رايق ✨', icon: '✨', descEn: 'Smooth calm rhythm', descAr: 'تمايل انسيابي هادئ ومريح' },
    { id: 'wink', labelEn: 'Playful Wink 😉', labelAr: 'غمزة مرحة 😉', icon: '😉', descEn: 'Cheeky wink with star sparkle', descAr: 'غمزة مرحة مع نجمة براقة' },
  ];

  // Randomize button action
  const handleRandomize = () => {
    if (activeTab === 'stickers') {
      const randomSticker = STICKERS_3D_COLLECTION[Math.floor(Math.random() * STICKERS_3D_COLLECTION.length)];
      const motions: ('sway' | 'bounce' | 'pulse')[] = ['sway', 'bounce', 'pulse'];
      const randomMotion = motions[Math.floor(Math.random() * motions.length)];
      const dirs: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
      const randomDir = dirs[Math.floor(Math.random() * dirs.length)];

      setConfig((prev) => ({
        ...prev,
        stickerId: randomSticker.id,
        stickerMotion: randomMotion,
        direction: randomDir,
      }));
      triggerPop();
    } else {
      const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
      const randomHair = hairOptions[Math.floor(Math.random() * hairOptions.length)].id;
      const randomCloth = clothingOptions[Math.floor(Math.random() * clothingOptions.length)].id;
      const randomColor = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
      const randomCapColor = CAP_COLORS[Math.floor(Math.random() * CAP_COLORS.length)];
      const randomAcc = accessoryOptions[Math.floor(Math.random() * accessoryOptions.length)].id;
      const randomExp = expressionOptions[Math.floor(Math.random() * expressionOptions.length)].id;
      const randomMotion = motionOptions[Math.floor(Math.random() * motionOptions.length)].id;

      setConfig((prev) => ({
        ...prev,
        stickerId: undefined, // Clear sticker so avatar preview is shown
        skinTone: randomSkin,
        hairStyle: randomHair,
        capColor: randomCapColor,
        clothingStyle: randomCloth,
        clothingColor: randomColor,
        accessory: randomAcc,
        expression: randomExp,
        motionStyle: randomMotion,
      }));
      triggerPop();
    }
  };

  // Filter stickers
  const filteredStickers = STICKERS_3D_COLLECTION.filter((item) => {
    if (stickerCategory === 'all') return true;
    return item.category === stickerCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* 
        Fixed viewport frame:
        Pinned avatar at the top strictly stays fixed, options scroll below.
      */}
      <div className="relative w-full max-w-md h-[94vh] max-h-[860px] bg-white dark:bg-[#18221C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* 1. FIXED TOP MODAL HEADER */}
        <header className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#18221C] z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#DDF3E7] dark:bg-[#0B5D3B]/30 flex items-center justify-center text-[#0B5D3B] dark:text-[#DDF3E7] shadow-2xs">
              <Sparkles size={18} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#202923] dark:text-[#F8F7F2]">
                {language === 'ar' ? 'تخصيص الهوية والأفاتار' : 'Customize Identity & Avatar'}
              </h2>
              <span className="text-[11px] text-[#778078] dark:text-slate-400 block leading-tight font-medium">
                {language === 'ar'
                  ? 'ملصقات وإيموجي 3D تفاعلية للبنات والشباب'
                  : '3D Animated & Interactive Stickers for Girls & Guys'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {/* 2. TOP TAB SWITCHER (ملصقات وإيموجي 3D ✨ vs تخصيص الأفاتار 🎨) */}
        <div className="shrink-0 px-4 pt-3 pb-2 bg-slate-50/80 dark:bg-[#141C16] border-b border-slate-200/60 dark:border-slate-800">
          <div className="p-1 rounded-full bg-slate-200/70 dark:bg-[#1F2B22] flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('stickers');
                if (!config.stickerId) {
                  updateConfig({ stickerId: 'sticker_cat', stickerMotion: 'sway' });
                }
              }}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stickers'
                  ? 'bg-[#0B5D3B] text-white shadow-md'
                  : 'text-[#5C665E] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              <span className="text-sm">😊</span>
              <span>{language === 'ar' ? 'ملصقات وإيموجي 3D ✨' : '3D Stickers & Emojis ✨'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('avatar');
                updateConfig({ stickerId: undefined });
              }}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'avatar'
                  ? 'bg-[#0B5D3B] text-white shadow-md'
                  : 'text-[#5C665E] dark:text-slate-300 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              <span className="text-sm">🎨</span>
              <span>{language === 'ar' ? 'تخصيص الأفاتار 🎨' : 'Custom Avatar 🎨'}</span>
            </button>
          </div>
        </div>

        {/* 3. STRICTLY PINNED / FIXED SHOWCASE (الصورة ثابتة لا تتحرك أثناء تمرير الخيارات) */}
        <div className="shrink-0 sticky top-0 z-20 px-4 py-3 bg-gradient-to-b from-[#F8F7F2] via-[#EEF9F3]/90 to-[#F8F7F2] dark:from-[#111813] dark:via-[#151D18] dark:to-[#111813] border-b border-[#0B5D3B]/20 shadow-xs flex flex-col items-center justify-center">
          
          <div className="w-full flex items-center justify-between px-2">
            
            {/* Quick Face Direction Switcher (Facing Left, Center, Facing Right) */}
            <div className="flex items-center gap-1 bg-white/90 dark:bg-[#18221C]/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => updateConfig({ direction: 'right' })}
                className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                  (config.direction || 'center') === 'right'
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-[#778078] hover:text-[#202923] dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? 'يمين ➔' : 'Right ➔'}
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ direction: 'center' })}
                className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                  (config.direction || 'center') === 'center'
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-[#778078] hover:text-[#202923] dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? 'أمام' : 'Center'}
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ direction: 'left' })}
                className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                  (config.direction || 'center') === 'left'
                    ? 'bg-[#0B5D3B] text-white shadow-xs'
                    : 'text-[#778078] hover:text-[#202923] dark:hover:text-white'
                }`}
              >
                {language === 'ar' ? '🠔 يسار' : '🠔 Left'}
              </button>
            </div>

            {/* Main Interactive Avatar Icon (Pop Animation on edit) */}
            <div className="relative my-0.5">
              <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#0B5D3B]/20 via-[#D4AF37]/30 to-[#10B981]/25 blur-md pointer-events-none animate-pulse" />
              <div key={popKey} className="relative">
                <AvatarRenderer
                  avatar={config}
                  size={96}
                  direction={config.direction || 'center'}
                  animate={true}
                  interactive={true}
                />
              </div>
            </div>

            {/* Randomize Unique Combination Button */}
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-2 rounded-2xl bg-white/95 dark:bg-[#18221C]/95 hover:bg-[#DDF3E7] dark:hover:bg-[#0B5D3B]/30 border border-[#0B5D3B]/30 text-[#0B5D3B] dark:text-[#DDF3E7] text-[11px] font-black flex flex-col items-center gap-0.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Generate Unique Look"
            >
              <Dices size={18} className="text-[#D4AF37]" />
              <span>{language === 'ar' ? 'عشوائي' : 'Random'}</span>
            </button>

          </div>

          {/* Dynamic Status / Sway Badge Indicator */}
          <div className="mt-2.5 flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 dark:bg-[#18221C] border border-[#0B5D3B]/30 text-[11px] font-black text-[#0B5D3B] dark:text-[#DDF3E7] shadow-2xs">
            <Sparkles size={13} className="text-[#D4AF37] animate-pulse" />
            <span>
              {activeTab === 'stickers'
                ? language === 'ar'
                  ? '✨ ملصق 3D تفاعلي يتمايل يميناً ويساراً'
                  : '✨ Interactive 3D Sticker Swaying Left & Right'
                : t.uniqueLookBadge}
            </span>
          </div>
        </div>

        {/* 4. SCROLLING OPTIONS BODY */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 no-scrollbar">
          
          {/* ===================== TAB 1: 3D STICKERS & EMOJIS ===================== */}
          {activeTab === 'stickers' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Motion Control Strip (تمايل يمين ويسار، قفز مرح، نبض حماسي) */}
              <div className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-[#131915] border border-[#0B5D3B]/20">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black text-[#0B5D3B] dark:text-[#10B981] flex items-center gap-1.5 uppercase">
                    <Zap size={14} className="text-[#D4AF37]" />
                    <span>{language === 'ar' ? 'حركة التمايل والتفاعل' : 'Interactive Motion Style'}</span>
                  </span>
                  <span className="text-[10px] text-[#778078] dark:text-slate-400 font-bold">
                    {config.stickerMotion === 'sway'
                      ? language === 'ar' ? 'تمايل انسيابي مستمر' : 'Smooth Continuous Sway'
                      : config.stickerMotion === 'bounce'
                      ? language === 'ar' ? 'قفز مرح وحيوي' : 'Energetic Bounce'
                      : language === 'ar' ? 'نبض حماسي مضيء' : 'Pulse Glow'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateConfig({ stickerMotion: 'sway' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      (config.stickerMotion || 'sway') === 'sway'
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-sm'
                        : 'bg-white dark:bg-[#1E2721] text-[#202923] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <span>🌊</span>
                    <span>{language === 'ar' ? 'تمايل يمين ويسار' : 'Sway Motion'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConfig({ stickerMotion: 'bounce' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      config.stickerMotion === 'bounce'
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-sm'
                        : 'bg-white dark:bg-[#1E2721] text-[#202923] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <span>🎉</span>
                    <span>{language === 'ar' ? 'قفز مرح' : 'Bounce'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConfig({ stickerMotion: 'pulse' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      config.stickerMotion === 'pulse'
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-sm'
                        : 'bg-white dark:bg-[#1E2721] text-[#202923] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <span>⚡</span>
                    <span>{language === 'ar' ? 'نبض حماسي' : 'Pulse'}</span>
                  </button>
                </div>
              </div>

              {/* Header with Title and Count matching image_e3fa0c73.png */}
              <div className="flex items-center justify-between px-1">
                <span className="font-bubble text-xs font-black text-[#0B5D3B] dark:text-[#34D399] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#D4AF37]" />
                  <span>{language === 'ar' ? 'اختر ملصق أو إيموجي 3D' : 'Choose 3D Sticker or Emoji'}</span>
                </span>
                <span className="text-[11px] font-black text-[#778078] dark:text-slate-400 font-mono">
                  {filteredStickers.length} {language === 'ar' ? 'ملصقات حصرية' : 'exclusive stickers'}
                </span>
              </div>

              {/* Category Filter Pills (الكل، شباب وأصالة، بنات، نجوم الكرة، قهوة وعبارات، مرح وضحك) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setStickerCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                    stickerCategory === 'all'
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                      : 'bg-white dark:bg-[#1E2721] text-[#5C665E] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'الكل ✨' : 'All ✨'}
                </button>

                <button
                  type="button"
                  onClick={() => setStickerCategory('guys')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                    stickerCategory === 'guys'
                      ? 'bg-[#F97316] text-white border-[#F97316] shadow-xs'
                      : 'bg-white dark:bg-[#1E2721] text-[#F97316] border-slate-200 dark:border-slate-800 hover:border-[#F97316]/50'
                  }`}
                >
                  {language === 'ar' ? 'شباب وأصالة 🔥' : 'Guys & Chill 🔥'}
                </button>

                <button
                  type="button"
                  onClick={() => setStickerCategory('girls')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                    stickerCategory === 'girls'
                      ? 'bg-[#EC4899] text-white border-[#EC4899] shadow-xs'
                      : 'bg-white dark:bg-[#1E2721] text-[#EC4899] border-slate-200 dark:border-slate-800 hover:border-[#EC4899]/50'
                  }`}
                >
                  {language === 'ar' ? 'بنات 🌸' : 'Girls 🌸'}
                </button>

                <button
                  type="button"
                  onClick={() => setStickerCategory('stars')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                    stickerCategory === 'stars'
                      ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                      : 'bg-white dark:bg-[#1E2721] text-[#0284C7] dark:text-[#38BDF8] border-slate-200 dark:border-slate-800 hover:border-[#0284C7]/50'
                  }`}
                >
                  {language === 'ar' ? 'نجوم وكاريكاتير ⚽' : 'Stars & Art ⚽'}
                </button>

                <button
                  type="button"
                  onClick={() => setStickerCategory('quotes')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                    stickerCategory === 'quotes'
                      ? 'bg-[#B45309] text-white border-[#B45309] shadow-xs'
                      : 'bg-white dark:bg-[#1E2721] text-[#B45309] dark:text-[#FBBF24] border-slate-200 dark:border-slate-800 hover:border-[#B45309]/50'
                  }`}
                >
                  {language === 'ar' ? 'قهوة وعبارات ☕' : 'Coffee & Quotes ☕'}
                </button>

                <button
                  type="button"
                  onClick={() => setStickerCategory('fun')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                    stickerCategory === 'fun'
                      ? 'bg-[#EAB308] text-white border-[#EAB308] shadow-xs'
                      : 'bg-white dark:bg-[#1E2721] text-[#CA8A04] dark:text-[#EAB308] border-slate-200 dark:border-slate-800 hover:border-[#EAB308]/50'
                  }`}
                >
                  {language === 'ar' ? 'مرح وضحك 😂' : 'Fun & Joy 😂'}
                </button>
              </div>

              {/* 2-Column Grid of Animated Backgroundless 3D Stickers with Luxury Glow */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {filteredStickers.map((item) => {
                  const isSelected = config.stickerId === item.id;
                  const activeMotion = isSelected
                    ? config.stickerMotion || item.defaultMotion
                    : item.defaultMotion;
                  const animClass =
                    activeMotion === 'bounce'
                      ? 'animate-sticker-bounce'
                      : activeMotion === 'pulse'
                      ? 'animate-sticker-pulse'
                      : 'animate-sticker-sway';

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        updateConfig({
                          stickerId: item.id,
                          stickerMotion: config.stickerMotion || item.defaultMotion,
                        })
                      }
                      className={`luxury-card-shimmer relative p-3.5 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer transform-gpu overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#E8F8F0] via-[#E2F5EC] to-[#D5EFE3] dark:from-[#0B5D3B]/35 dark:via-[#0B5D3B]/25 dark:to-[#08422A]/45 border-2 border-[#10B981] shadow-[0_6px_0_0_#A7DFC3,0_14px_26px_rgba(11,93,59,0.22)] dark:shadow-[0_6px_0_0_#07120C] scale-[1.02]'
                          : 'bg-gradient-to-b from-white via-[#FCFBF7] to-[#F3EFE2] dark:from-[#1E2721] dark:via-[#17201B] dark:to-[#121915] border border-[#CBE0D3] dark:border-slate-800 shadow-[0_5px_0_0_#C7DDD0,0_12px_22px_rgba(11,93,59,0.10)] dark:shadow-[0_5px_0_0_#09120D] hover:border-[#10B981]/60'
                      }`}
                    >
                      {/* Backgroundless Continuously Animated Cutout Sticker Preview */}
                      <div className="relative z-10 w-24 h-24 flex items-center justify-center bg-transparent mb-2">
                        <CutoutStickerImage
                          src={item.image}
                          alt={item.titleEn}
                          className={`w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(11,93,59,0.18)] ${animClass}`}
                        />
                      </div>

                      {/* Badge */}
                      <span
                        className="relative z-10 px-2 py-0.5 rounded-full text-[10px] font-black mb-1.5 shadow-2xs"
                        style={{
                          backgroundColor: `${item.badgeColor}18`,
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}40`,
                        }}
                      >
                        {language === 'ar' ? item.badgeAr : item.badgeEn}
                      </span>

                      {/* Title */}
                      <h3 className="relative z-10 text-xs font-black text-[#202923] dark:text-white leading-tight">
                        {language === 'ar' ? item.titleAr : item.titleEn}
                      </h3>

                      {/* Subtitle */}
                      <p className="relative z-10 text-[10px] text-[#778078] dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                        {language === 'ar' ? item.subtitleAr : item.subtitleEn}
                      </p>

                      {/* Selected Status Indicator */}
                      {isSelected ? (
                        <div className="relative z-10 mt-2.5 flex items-center gap-1 text-[11px] font-black text-[#0B5D3B] dark:text-[#34D399]">
                          <Check size={14} className="stroke-[3]" />
                          <span>{language === 'ar' ? 'تم الاختيار' : 'Selected'}</span>
                        </div>
                      ) : (
                        <div className="mt-2.5 h-[18px]" />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ===================== TAB 2: CUSTOM AVATAR ===================== */}
          {activeTab === 'avatar' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Notice to switch back to custom avatar */}
              {config.stickerId && (
                <div className="p-3 rounded-2xl bg-[#DDF3E7]/60 dark:bg-[#0B5D3B]/20 border border-[#0B5D3B]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#0B5D3B] shrink-0" />
                    <span className="text-xs font-bold text-[#0B5D3B] dark:text-[#DDF3E7]">
                      {language === 'ar' ? 'أنت تستخدم ملصق 3D حالياً' : 'You are currently using a 3D sticker'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateConfig({ stickerId: undefined })}
                    className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#08422A] cursor-pointer"
                  >
                    {language === 'ar' ? 'تفعيل الأفاتار 🎨' : 'Activate Avatar 🎨'}
                  </button>
                </div>
              )}

              {/* Skin Tone */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#778078] uppercase tracking-wider">
                    {t.skinTone}
                  </label>
                  <span className="text-[10px] text-[#0B5D3B] font-semibold">
                    {SKIN_TONES.indexOf(config.skinTone) + 1} / {SKIN_TONES.length}
                  </span>
                </div>
                <div className="flex items-center gap-3.5">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => updateConfig({ skinTone: tone, stickerId: undefined })}
                      style={{ backgroundColor: tone }}
                      className={`w-10 h-10 rounded-full transition-all cursor-pointer ${
                        config.skinTone === tone
                          ? 'scale-115 ring-4 ring-[#0B5D3B] ring-offset-2 dark:ring-offset-[#18221C] shadow-md'
                          : 'hover:scale-105 opacity-80'
                      }`}
                      aria-label={`Skin tone ${tone}`}
                    />
                  ))}
                </div>
              </div>

              {/* Hair & Headwear (بي كاب او بدون كاب) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#778078] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'الرأس: بي كاب أو بدون' : 'Head: With Cap or Without'}</span>
                  </label>

                  {/* Cap vs No-Cap Filter Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111813] p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCapFilter('all')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        capFilter === 'all'
                          ? 'bg-white dark:bg-[#202923] text-[#0B5D3B] dark:text-[#34D399] shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {language === 'ar' ? 'الكل' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapFilter('caps')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        capFilter === 'caps'
                          ? 'bg-white dark:bg-[#202923] text-[#0B5D3B] dark:text-[#34D399] shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {language === 'ar' ? 'بي كاب 🧢' : 'Caps 🧢'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapFilter('nocap')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        capFilter === 'nocap'
                          ? 'bg-white dark:bg-[#202923] text-[#0B5D3B] dark:text-[#34D399] shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {language === 'ar' ? 'بدون كاب ✂️' : 'No Cap ✂️'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {hairOptions
                    .filter((opt) => {
                      if (capFilter === 'caps') return !!opt.isCap;
                      if (capFilter === 'nocap') return !opt.isCap;
                      return true;
                    })
                    .map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => updateConfig({ hairStyle: opt.id, stickerId: undefined })}
                        className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl text-start transition-all cursor-pointer border flex items-center justify-between ${
                          config.hairStyle === opt.id
                            ? 'bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#DDF3E7] font-bold shadow-2xs scale-[1.01]'
                            : 'bg-white dark:bg-[#202923] border-slate-200 dark:border-slate-700 text-[#202923] dark:text-[#F8F7F2] hover:border-slate-400'
                        }`}
                      >
                        <span>{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                        {config.hairStyle === opt.id && (
                          <Check size={14} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                        )}
                      </button>
                    ))}
                </div>
              </div>

              {/* CAP COLOR SELECTOR */}
              {['cap', 'backward-cap', 'beanie', 'bucket-hat'].includes(config.hairStyle) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#DDF3E7]/50 via-white to-[#FAF9F5] dark:from-[#0B5D3B]/20 dark:via-[#18221C] dark:to-[#131915] border border-[#0B5D3B]/30 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#0B5D3B] dark:text-[#34D399] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#D4AF37]" />
                      <span>{language === 'ar' ? 'لون الكاب والقبعة (خيارات شبابية)' : 'Cap & Headwear Color'}</span>
                    </label>
                    <span className="text-[10px] font-bold text-[#778078] font-mono">
                      {config.capColor || '#0B5D3B'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar">
                    {CAP_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateConfig({ capColor: color, stickerId: undefined })}
                        style={{ backgroundColor: color }}
                        className={`w-8 h-8 rounded-full shrink-0 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer ${
                          (config.capColor || '#0B5D3B') === color
                            ? 'scale-120 ring-3 ring-[#0B5D3B] ring-offset-2 dark:ring-offset-[#18221C] shadow-md'
                            : 'hover:scale-110 opacity-90'
                        }`}
                        aria-label={`Cap Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Accessories & Glasses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#778078] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'النظارات والإكسسوارات (يلبس نظارة)' : 'Glasses & Accessories'}</span>
                  </label>
                  <span className="text-[10px] text-[#0B5D3B] font-bold">
                    {language === 'ar' ? 'خيارات حديثة شبابية' : 'Modern Styles'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {accessoryOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateConfig({ accessory: opt.id, stickerId: undefined })}
                      className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl text-start transition-all cursor-pointer border flex items-center justify-between ${
                        config.accessory === opt.id
                          ? 'bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#DDF3E7] font-bold shadow-2xs scale-[1.01]'
                          : 'bg-white dark:bg-[#202923] border-slate-200 dark:border-slate-700 text-[#202923] dark:text-[#F8F7F2] hover:border-slate-400'
                      }`}
                    >
                      <span className="truncate">{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                      {config.accessory === opt.id && (
                        <Check size={14} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clothing Style */}
              <div>
                <label className="block text-xs font-bold text-[#778078] mb-2 uppercase tracking-wider">
                  {t.clothingStyle}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {clothingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateConfig({ clothingStyle: opt.id, stickerId: undefined })}
                      className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl text-start transition-all cursor-pointer border ${
                        config.clothingStyle === opt.id
                          ? 'bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#DDF3E7] font-bold shadow-2xs scale-[1.01]'
                          : 'bg-white dark:bg-[#202923] border-slate-200 dark:border-slate-700 text-[#202923] dark:text-[#F8F7F2] hover:border-slate-400'
                      }`}
                    >
                      {language === 'ar' ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clothing Color */}
              <div>
                <label className="block text-xs font-bold text-[#778078] mb-2 uppercase tracking-wider">
                  {t.outfitColor}
                </label>
                <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
                  {CLOTHING_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateConfig({ clothingColor: color, stickerId: undefined })}
                      style={{ backgroundColor: color }}
                      className={`w-9 h-9 rounded-full shrink-0 border border-slate-300 dark:border-slate-700 transition-transform cursor-pointer ${
                        config.clothingColor === color
                          ? 'scale-115 ring-3 ring-[#0B5D3B] ring-offset-2 dark:ring-offset-[#18221C] shadow-md'
                          : 'hover:scale-105'
                      }`}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Facial Expressions */}
              <div>
                <label className="block text-xs font-bold text-[#778078] mb-2 uppercase tracking-wider">
                  {t.expressionMood}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {expressionOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateConfig({ expression: opt.id, stickerId: undefined })}
                      className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl text-start transition-all cursor-pointer border ${
                        config.expression === opt.id
                          ? 'bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] text-[#0B5D3B] dark:text-[#DDF3E7] font-bold shadow-2xs scale-[1.01]'
                          : 'bg-white dark:bg-[#202923] border-slate-200 dark:border-slate-700 text-[#202923] dark:text-[#F8F7F2] hover:border-slate-400'
                      }`}
                    >
                      {language === 'ar' ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion & Interactive Animation Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#0B5D3B] dark:text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#D4AF37]" />
                    <span>{t.avatarMotion}</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                    {language === 'ar' ? 'حركة حية متفاعلة' : 'Live Motion'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {motionOptions.map((opt) => {
                    const isSelected = (config.motionStyle || 'waving') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateConfig({ motionStyle: opt.id, stickerId: undefined })}
                        className={`p-3 rounded-2xl text-start transition-all cursor-pointer border flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 border-[#0B5D3B] dark:border-[#10B981] shadow-md scale-[1.02]'
                            : 'bg-white dark:bg-[#202923] border-slate-200 dark:border-slate-700 hover:border-[#0B5D3B]/50'
                        }`}
                      >
                        <span className="text-2xl shrink-0 p-1 rounded-xl bg-white/80 dark:bg-black/20 shadow-2xs">
                          {opt.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-[#0B5D3B] dark:text-[#DDF3E7]' : 'text-[#202923] dark:text-white'}`}>
                              {language === 'ar' ? opt.labelAr : opt.labelEn}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#0B5D3B] dark:bg-[#10B981] animate-ping" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#778078] dark:text-slate-400 mt-0.5 line-clamp-1">
                            {language === 'ar' ? opt.descAr : opt.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* 5. FIXED BOTTOM SAVE ACTION BAR */}
        <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#18221C] z-30">
          <button
            onClick={() => {
              onSave(config);
              onClose();
            }}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#0B5D3B] via-[#0E7047] to-[#0B5D3B] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0B5D3B]/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check size={18} className="stroke-[3]" />
            <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MatchProfile, Language } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { getCatalogQuestionById } from '../../services/questionCatalogService';
import {
  MapPin,
  X,
  Sparkles,
  Heart,
  Bookmark,
  Share2,
  CheckCircle2,
  Zap,
  Navigation,
  Compass,
} from 'lucide-react';
import { playPersonChime } from '../../utils/soundEffects';

interface NearbyMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  language: Language;
  matches: MatchProfile[];
  onSelectMatch: (match: MatchProfile) => void;
  onSendWave: (match: MatchProfile) => void;
  savedProfileIds?: string[];
  onToggleSave?: (matchId: string) => void;
  onCompareMatch?: (match: MatchProfile) => void;
}

const SAUDI_NEIGHBORHOODS: Record<string, { en: string; ar: string }[]> = {
  Jeddah: [
    { en: 'Al Rawdah', ar: 'حي الروضة' },
    { en: 'Al Shati', ar: 'حي الشاطئ' },
    { en: 'Al Zahra', ar: 'حي الزهراء' },
    { en: 'North Obhur', ar: 'أبحر الشمالية' },
    { en: 'South Obhur', ar: 'أبحر الجنوبية' },
    { en: 'Al Hamra', ar: 'حي الحمراء' },
    { en: 'Al Salamah', ar: 'حي السلامة' },
    { en: 'Al Murjan', ar: 'حي المرجان' },
    { en: 'Al Basateen', ar: 'حي البساتين' },
    { en: 'Al Naeem', ar: 'حي النعيم' },
    { en: 'Al Andalus', ar: 'حي الأندلس' },
    { en: 'Al Khalidiyyah', ar: 'حي الخالدية' },
    { en: 'Al Mohammediah', ar: 'حي المحمدية' },
    { en: 'Al Balad Historic', ar: 'البلد التاريخي' },
    { en: 'Al Faisaliyah', ar: 'حي الفيصلية' },
    { en: 'Al Safa', ar: 'حي الصفا' },
    { en: 'Al Marwah', ar: 'حي المروة' },
    { en: 'North Corniche', ar: 'الكورنيش الشمالي' },
    { en: 'Al Samer', ar: 'حي السامر' },
    { en: 'Al Hamdaniyah', ar: 'حي الحمدانية' },
    { en: 'Al Rabwah', ar: 'حي الربوة' },
    { en: 'Al Rihaily', ar: 'حي الرحيلي' },
    { en: 'Al Bawadi', ar: 'حي البوادي' },
    { en: 'Al Rehab', ar: 'حي الرحاب' },
  ],
  Riyadh: [
    { en: 'Hittin', ar: 'حي حطين' },
    { en: 'Al Nakheel', ar: 'حي النخيل' },
    { en: 'Al Malqa', ar: 'حي الملقا' },
    { en: 'Al Yasmin', ar: 'حي الياسمين' },
    { en: 'Al Sahafa', ar: 'حي الصحافة' },
    { en: 'Al Olaya', ar: 'حي العليا' },
    { en: 'Al Sulaimaniyah', ar: 'حي السليمانية' },
    { en: 'Al Narjis', ar: 'حي النرجس' },
    { en: 'Al Ghadir', ar: 'حي الغدير' },
    { en: 'Al Arid', ar: 'حي العارض' },
    { en: 'Qurtubah', ar: 'حي قرطبة' },
    { en: 'Al Yarmouk', ar: 'حي اليرموك' },
    { en: 'Al Hamra', ar: 'حي الحمراء' },
    { en: 'Al Raid', ar: 'حي الرائد' },
    { en: 'Al Mathar', ar: 'حي المعذر' },
    { en: 'Diplomatic Quarter', ar: 'حي السفارات' },
    { en: 'Diriyah', ar: 'الدرعية التاريخية' },
    { en: 'Al Taawun', ar: 'حي التعاون' },
    { en: 'Al Murooj', ar: 'حي المروج' },
    { en: 'Al Nada', ar: 'حي الندا' },
    { en: 'Al Aqiq', ar: 'حي العقيق' },
    { en: 'Al Rabie', ar: 'حي الربيع' },
    { en: 'Al Falah', ar: 'حي الفلاح' },
  ],
  Dammam: [
    { en: 'Al Shatea West', ar: 'حي الشاطئ الغربي' },
    { en: 'Al Shatea East', ar: 'حي الشاطئ الشرقي' },
    { en: 'Al Mazrouiyah', ar: 'حي المزروعية' },
    { en: 'Al Faisaliyah', ar: 'حي الفيصلية' },
    { en: 'Al Fakhriyah', ar: 'حي الفاخرية' },
    { en: 'Dammam Corniche', ar: 'واجهة الدمام البحرية' },
    { en: 'Al Nawras', ar: 'حي النورس' },
    { en: 'Al Ittissalat', ar: 'حي الاتصالات' },
    { en: 'Al Jawharah', ar: 'حي الجوهرة' },
    { en: 'Al Manar', ar: 'حي المنار' },
    { en: 'Uhud', ar: 'حي أحد' },
  ],
  Khobar: [
    { en: 'Al Hizam Al Thahabi', ar: 'الحزام الذهبي' },
    { en: 'Al Hizam Al Akhdar', ar: 'الحزام الأخضر' },
    { en: 'Khobar Waterfront', ar: 'واجهة الخبر البحرية' },
    { en: 'Al Olaya', ar: 'حي العليا' },
    { en: 'Al Rakah', ar: 'حي الراكة' },
    { en: 'Al Yarmouk', ar: 'حي اليرموك' },
    { en: 'Al Aqrabiyah', ar: 'حي العقربية' },
    { en: 'Al Jisr', ar: 'حي الجسر' },
    { en: 'Al Shobily', ar: 'حي الشبيلي' },
    { en: 'Al Sawari', ar: 'حي الصواري والعزيزية' },
  ],
  Makkah: [
    { en: 'Al Awali', ar: 'حي العوالي' },
    { en: 'Al Shawqiyyah', ar: 'حي الشوقية' },
    { en: 'Batha Quraish', ar: 'بطحاء قريش' },
    { en: 'Al Naseem', ar: 'حي النسيم' },
    { en: 'Al Aziziyah', ar: 'حي العزيزية' },
    { en: 'Al Zaher', ar: 'حي الزاهر' },
    { en: 'Al Rusaifah', ar: 'حي الرصيفة' },
    { en: 'Central Area', ar: 'المنطقة المركزية' },
    { en: 'Al Hijrah', ar: 'حي الهجرة' },
  ],
  Madinah: [
    { en: 'Quba', ar: 'منطقة قباء' },
    { en: 'Al Sultana', ar: 'حي سلطانة' },
    { en: 'Al Khalidiyyah', ar: 'حي الخالدية' },
    { en: 'Mahzoor', ar: 'حي مهزور' },
    { en: 'Al Hijrah', ar: 'حي الهجرة' },
    { en: 'Baqdo', ar: 'حي باقدو' },
    { en: 'Al Aziziyah', ar: 'حي العزيزية' },
    { en: 'Sayed Al Shuhada', ar: 'سيد الشهداء' },
  ],
  Abha: [
    { en: 'Al Soudah Heights', ar: 'مرتفعات السودة' },
    { en: 'Al Dhabab Fog Walk', ar: 'ممشى الضباب' },
    { en: 'Al Muftaha Art Village', ar: 'قرية المفتاحة' },
    { en: 'Al Mansak', ar: 'حي المنسك' },
    { en: 'Al Khalidiyyah', ar: 'حي الخالدية' },
    { en: 'Al Dhabab', ar: 'حي الضباب' },
    { en: 'Abu Kheyal', ar: 'أبو خيال' },
  ],
  Taif: [
    { en: 'Al Hada', ar: 'الهدا' },
    { en: 'Al Shafa', ar: 'الشفا' },
    { en: 'Al Ruddaf', ar: 'حي الردف' },
    { en: 'Shahhar', ar: 'حي شهار' },
    { en: 'Al Faisaliyah', ar: 'حي الفيصلية' },
    { en: 'Al Qimriah', ar: 'حي القمرية' },
  ],
  Tabuk: [
    { en: 'Al Murooj', ar: 'حي المروج' },
    { en: 'Al Wurood', ar: 'حي الورود' },
    { en: 'Al Maseef', ar: 'حي المصيف' },
    { en: 'Al Olaya', ar: 'حي العليا' },
    { en: 'Al Andalus', ar: 'حي الأندلس' },
  ],
  Qassim: [
    { en: 'Al Safra', ar: 'حي الصفراء' },
    { en: 'Al Iskan', ar: 'حي الإسكان' },
    { en: 'Al Fayziyah', ar: 'حي الفايزية' },
    { en: 'Al Rayyan', ar: 'حي الريان' },
    { en: 'Al Nahdah', ar: 'حي النهضة' },
  ],
  Jazan: [
    { en: 'North Corniche', ar: 'الكورنيش الشمالي' },
    { en: 'South Corniche', ar: 'الكورنيش الجنوبي' },
    { en: 'Al Shati', ar: 'حي الشاطئ' },
    { en: 'Al Matar', ar: 'حي المطار' },
    { en: 'Al Suwais', ar: 'حي السويس' },
  ],
};

export const NearbyMembersModal: React.FC<NearbyMembersModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  language,
  matches,
  onSelectMatch,
  onSendWave,
  savedProfileIds = [],
  onToggleSave,
  onCompareMatch,
}) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [activeCity, setActiveCity] = useState<string>(currentCity || 'Riyadh');

  if (!isOpen) return null;

  // Filter matches in this city or general high-compatibility pool
  const cityMatches = matches.filter((m) => {
    if (activeCity) {
      return m.city.toLowerCase() === activeCity.toLowerCase();
    }
    return true;
  });

  const availableNeighborhoods = SAUDI_NEIGHBORHOODS[activeCity] || [
    { en: 'Central District', ar: 'الوسط التجاري' },
    { en: 'North District', ar: 'المنطقة الشمالية' },
    { en: 'Seafront Quarter', ar: 'الواجهة البحرية' },
  ];

  // Distribute mock neighborhoods deterministically
  const basePool = cityMatches.length > 0 ? cityMatches : matches;
  const nearbyMembersWithLocations = basePool.map((m, idx) => {
    const neighborhoodObj = availableNeighborhoods[idx % availableNeighborhoods.length];
    return {
      ...m,
      neighborhood: language === 'ar' ? neighborhoodObj.ar : neighborhoodObj.en,
      neighborhoodId: neighborhoodObj.en,
      distanceKm: ((idx * 1.8) + 1.2).toFixed(1),
    };
  });

  const selectedNeighborhoodObj = availableNeighborhoods.find((n) => n.en === selectedNeighborhood);

  const filteredMembers = selectedNeighborhood === 'all'
    ? nearbyMembersWithLocations
    : (() => {
        const direct = nearbyMembersWithLocations.filter((m) => m.neighborhoodId === selectedNeighborhood);
        if (direct.length > 0) return direct;
        return basePool.slice(0, 3).map((m, idx) => ({
          ...m,
          neighborhood: language === 'ar' ? (selectedNeighborhoodObj?.ar || selectedNeighborhood) : (selectedNeighborhoodObj?.en || selectedNeighborhood),
          neighborhoodId: selectedNeighborhood,
          distanceKm: ((idx * 0.7) + 0.6).toFixed(1),
        }));
      })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-[#18221C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* 1. Modal Top Header */}
        <header className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#18221C]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#DDF3E7] to-[#CCEEDC] dark:from-[#0B5D3B]/40 dark:to-[#08422A] flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399] shadow-2xs">
              <MapPin size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
                  {language === 'ar' ? 'استكشاف التوائم في المنطقة' : 'Nearby Regional Discovery'}
                </span>
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h2 className="text-sm font-black text-[#202923] dark:text-white flex items-center gap-1.5">
                <span>{language === 'ar' ? `مين موجود في ${formatCity(activeCity, language)}؟` : `Who is nearby in ${formatCity(activeCity, language)}?`}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {/* 2. City Switcher Tabs */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#131915] border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Khobar', 'Dammam', 'Abha', 'Taif', 'Tabuk', 'Qassim', 'Jazan'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setActiveCity(city);
                setSelectedNeighborhood('all');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                activeCity === city
                  ? 'bg-[#0B5D3B] text-white shadow-2xs scale-102'
                  : 'bg-white dark:bg-[#1E2721] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#0B5D3B]/40'
              }`}
            >
              {formatCity(city, language)}
            </button>
          ))}
        </div>

        {/* 3. Neighborhood Quick Filter Strip */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedNeighborhood('all')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
              selectedNeighborhood === 'all'
                ? 'bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#34D399] border border-[#0B5D3B]/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'كل الأحياء' : 'All Neighborhoods'}
          </button>

          {availableNeighborhoods.map((n) => (
            <button
              key={n.en}
              type="button"
              onClick={() => setSelectedNeighborhood(n.en)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
                selectedNeighborhood === n.en
                  ? 'bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#34D399] border border-[#0B5D3B]/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'ar' ? n.ar : n.en}
            </button>
          ))}
        </div>

        {/* 4. Active Members Feed */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#778078] dark:text-slate-400 font-bold px-1">
            <span>
              {language === 'ar'
                ? `${filteredMembers.length} توأم وشخص قريب منك جاهز للتواصل`
                : `${filteredMembers.length} twins & matches nearby in this zone`}
            </span>
            <span className="flex items-center gap-1 text-[#0B5D3B] dark:text-[#34D399]">
              <Navigation size={12} />
              {language === 'ar' ? 'مباشر وتفاعلي' : 'Live Region'}
            </span>
          </div>

          {filteredMembers.map((member) => {
            const isSaved = savedProfileIds.includes(member.id);

            return (
              <div
                key={member.id}
                className="relative p-3.5 rounded-2xl bg-gradient-to-b from-white to-[#FBF9F5] dark:from-[#1E2721] dark:to-[#171F1A] border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_0_0_#D3CBB9,0_8px_14px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_0_0_#0D130F] flex flex-col gap-2.5 transition-all"
              >
                {/* Upper row: Avatar, Info, Similarity Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => {
                      playPersonChime(member.id);
                      onClose();
                      onSelectMatch(member);
                    }}
                  >
                    <AvatarRenderer avatar={member.avatar} size={78} direction="center" showBackdrop={false} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#202923] dark:text-white truncate">
                          <span dir="ltr" className="inline-block font-bold">@{member.username.replace(/^@+/, '')}</span>
                        </span>
                        {member.verifiedPersonality && (
                          <CheckCircle2 size={12} className="text-[#0B5D3B] dark:text-[#34D399]" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[#778078] dark:text-slate-400 mt-0.5">
                        <MapPin size={11} className="text-[#0B5D3B]" />
                        <span className="font-bold text-[#202923] dark:text-slate-300">
                          {member.neighborhood}
                        </span>
                        <span>•</span>
                        <span>~{member.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Score */}
                  <div className="text-end shrink-0">
                    <span className="text-sm font-black font-mono text-[#0B5D3B] dark:text-[#34D399] leading-none block">
                      {member.similarityScore}%
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-[#D4AF37]">
                      {language === 'ar' ? 'تطابق' : 'Match'}
                    </span>
                  </div>
                </div>

                {/* Shared passions tags */}
                {member.sharedInterests && member.sharedInterests.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
                    <span className="text-[9px] text-[#778078] font-bold shrink-0">
                      {language === 'ar' ? 'مشترك:' : 'Shared:'}
                    </span>
                    {member.sharedInterests.slice(0, 3).map((item, i) => {
                      const q = getCatalogQuestionById(item);
                      const label = q ? (language === 'ar' ? q.titleAr : q.titleEn) : item;
                      return (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-[#DDF3E7] dark:bg-[#0B5D3B]/25 text-[#0B5D3B] dark:text-[#DDF3E7] font-semibold text-[9px] shrink-0"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Action buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Send Friendly Wave */}
                    <button
                      type="button"
                      onClick={() => onSendWave(member)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#E8F7EE] to-[#CCEEDC] dark:from-[#0B5D3B]/40 dark:to-[#08422A] text-[#0B5D3B] dark:text-[#34D399] text-[11px] font-black flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      <span>👋</span>
                      <span>{language === 'ar' ? 'لوّح وسلّم' : 'Say Hi'}</span>
                    </button>

                    {/* Compare Button */}
                    {onCompareMatch && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onCompareMatch(member);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 hover:text-[#0B5D3B] cursor-pointer active:scale-95 transition-all"
                      >
                        <Zap size={13} className="text-[#D4AF37]" />
                        <span>{language === 'ar' ? 'مقارنة' : 'Compare'}</span>
                      </button>
                    )}
                  </div>

                  {/* Bookmark Button */}
                  {onToggleSave && (
                    <button
                      type="button"
                      onClick={() => onToggleSave(member.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-[#FFF9E6] text-[#D4AF37] border-[#D4AF37]/50 shadow-2xs'
                          : 'bg-white dark:bg-[#1E2721] text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                      title={isSaved ? 'Bookmarked' : 'Bookmark'}
                    >
                      <Bookmark size={14} className={isSaved ? 'fill-[#D4AF37]' : ''} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151D18] flex items-center justify-between text-xs">
          <span className="text-[10px] text-[#778078] dark:text-slate-400">
            {language === 'ar'
              ? 'تعتمد القائمة على النطاق الجغرافي للمدينة مع حفظ الخصوصية'
              : 'Ranked by personality similarity within your city'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#0B5D3B] text-white text-xs font-bold cursor-pointer active:scale-95"
          >
            {language === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MatchProfile, Language } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import {
  Compass,
  Search,
  MapPin,
  Bookmark,
  Music,
} from 'lucide-react';
import { playPersonChime } from '../../utils/soundEffects';

interface DiscoverScreenProps {
  matches: MatchProfile[];
  language: Language;
  onSelectMatch: (match: MatchProfile) => void;
  onCompareMatch: (match: MatchProfile) => void;
  savedProfileIds?: string[];
  onToggleSaveProfile?: (matchId: string) => void;
  onSendWave?: (match: MatchProfile) => void;
  initialTab?: 'all' | 'saved';
}

/**
 * Interactive Discover Profile Card with dynamic touch glow,
 * physical 3D bevel depth, and tangible floor shadow underneath.
 */
interface DiscoverMatchCardProps {
  match: MatchProfile;
  isSaved: boolean;
  language: Language;
  onSelect: () => void;
  onToggleSave?: (matchId: string) => void;
}

const DiscoverMatchCard: React.FC<DiscoverMatchCardProps> = ({
  match,
  isSaved,
  language,
  onSelect,
  onToggleSave,
}) => {
  const { glowPos, handleTouchMove, handleTouchEnd } = useTouchGlow();

  return (
    <div className="relative group">
      {/* Outer Sculpted Shadow Frame / Pedestal Bezel with Sweeping Right-to-Left Glow */}
      <div
        data-custom-glow="true"
        data-luxury-bezel="true"
        data-fixed-size="true"
        onClick={onSelect}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleTouchMove}
        onMouseLeave={handleTouchEnd}
        className="
          relative w-full h-[248px] min-h-[248px] max-h-[248px] p-[2px] rounded-[26px]
          bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
          dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
          shadow-[0_8px_0_0_#BFD5C8,0_18px_32px_-4px_rgba(11,93,59,0.22),0_4px_14px_rgba(212,175,55,0.16)]
          dark:shadow-[0_8px_0_0_#07120C,0_18px_36px_rgba(0,0,0,0.75),0_0_24px_rgba(16,185,129,0.16)]
          cursor-pointer select-none overflow-hidden transition-shadow duration-200
        "
      >
        {/* Sweeping Right-to-Left Bezel Rim Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -inset-x-6 z-0 animate-rtl-bezel-glow"
          style={{
            background:
              'linear-gradient(270deg, transparent 0%, rgba(16,185,129,0.85) 35%, rgba(250,204,21,0.98) 50%, rgba(16,185,129,0.85) 65%, transparent 100%)',
          }}
        />

        {/* Inner Luxury Tactile Card Body */}
        <div
          className="
            relative z-10 w-full h-full p-3.5 rounded-[24px]
            bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9]
            dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713]
            flex flex-col items-center justify-between text-center overflow-hidden
          "
        >
          {/* Top Luminous Right-to-Left Crown Ribbon */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 inset-x-0 h-[2.5px] overflow-hidden z-20"
          >
            <div
              className="w-full h-full animate-rtl-bezel-glow"
              style={{
                background:
                  'linear-gradient(270deg, transparent 5%, #10B981 35%, #FBBF24 50%, #0B5D3B 68%, transparent 95%)',
              }}
            />
          </div>

          {/* Soft Satin Right-to-Left Ambient Glow Wave */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 animate-rtl-surface-glow"
            style={{
              background:
                'linear-gradient(270deg, transparent 10%, rgba(16,185,129,0.09) 42%, rgba(212,175,55,0.15) 52%, rgba(16,185,129,0.07) 64%, transparent 90%)',
            }}
          />

          {/* Dynamic Interactive Halo Glow (Emerald + Gold) Following Touch/Pointer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-[24px] z-0"
            style={{
              opacity: glowPos.active ? 1 : 0,
              background: `radial-gradient(180px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.28), rgba(212, 175, 55, 0.16), transparent 70%)`,
            }}
          />

          {/* Top Glossy Sheen Highlight */}
          <div
            aria-hidden="true"
            className="absolute inset-x-4 top-1 h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none opacity-80 z-0"
          />

          {/* Score badge & Bookmark button */}
          <div className="w-full flex items-center justify-between mb-1.5 relative z-10">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DDF3E7] text-[#0B5D3B] dark:bg-[#0B5D3B]/40 dark:text-[#34D399] border border-[#0B5D3B]/20 flex items-center gap-1 shadow-2xs tabular-nums">
              <Music size={9} className="opacity-70 group-hover:animate-bounce" />
              <span>{match.similarityScore}%</span>
            </span>
            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(match.id);
                }}
                className="text-slate-400 hover:text-[#D4AF37] p-1 cursor-pointer active:scale-90 transition-transform"
                aria-label="Bookmark Profile"
              >
                <Bookmark size={14} className={isSaved ? 'text-[#D4AF37] fill-[#D4AF37]' : ''} />
              </button>
            )}
          </div>

          {/* Large Prominent Backgroundless Floating Cutout Character */}
          <div className="relative flex items-center justify-center my-0.5 bg-transparent transition-transform duration-200 group-hover:scale-108 group-hover:-translate-y-0.5 z-10">
            <AvatarRenderer avatar={match.avatar} size={118} showBackdrop={false} />
            <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#10B981] ring-2 ring-white dark:ring-[#18211B]" />
          </div>

          {/* Username */}
          <h4 className="text-[13px] font-black text-[#202923] dark:text-white truncate max-w-full mt-0.5 relative z-10">
            <span dir="ltr" className="inline-block font-black tracking-tight">@{match.username.replace(/^@+/, '')}</span>
          </h4>

          {/* City Location */}
          <div className="flex items-center gap-1 text-[10px] text-[#778078] dark:text-slate-400 mt-0.5 relative z-10">
            <MapPin size={10} className="text-[#0B5D3B] dark:text-[#34D399]" />
            <span>{formatCity(match.city, language)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  matches,
  language,
  onSelectMatch,
  savedProfileIds = [],
  onToggleSaveProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const cities = ['all', 'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Abha'];

  const filteredMatches = matches.filter((m) => {
    const matchCity = selectedCity === 'all' || m.city.toLowerCase() === selectedCity.toLowerCase();
    const matchQuery =
      searchQuery.trim() === '' ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.bio && m.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCity && matchQuery;
  });

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#F8F7F2] dark:bg-[#111813] text-[#202923] dark:text-[#F8F7F2] pb-28 transition-colors">
      {/* Search & Filter Header */}
      <div className="bg-[#F8F7F2]/95 dark:bg-[#111813]/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <h1 className="text-lg font-black text-[#202923] dark:text-white mb-2">
          {language === 'ar' ? 'استكشف التوائم والأعضاء' : 'Discover Taste Twins'}
        </h1>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث بالاسم، الهواية، أو القهوة...' : 'Search username, hobbies, coffee...'}
            className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#18211B] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B5D3B] transition-colors shadow-2xs"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2.5 py-1">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`
                px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors cursor-pointer border
                ${
                  selectedCity === city
                    ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-xs'
                    : 'bg-white dark:bg-[#1E2721] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#0B5D3B]/40'
                }
              `}
            >
              {city === 'all'
                ? (language === 'ar' ? 'كافة المدن' : 'All Cities')
                : formatCity(city, language)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive Profile Cards with Shadows */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-[#778078] dark:text-slate-400">
            <Compass size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">
              {language === 'ar' ? 'لا توجد نتائج تطابق بحثك' : 'No matches found'}
            </p>
          </div>
        ) : (
          filteredMatches.map((m) => {
            const isSaved = savedProfileIds.includes(m.id);

            return (
              <DiscoverMatchCard
                key={m.id}
                match={m}
                isSaved={isSaved}
                language={language}
                onSelect={() => {
                  playPersonChime(m.id);
                  onSelectMatch(m);
                }}
                onToggleSave={onToggleSaveProfile}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

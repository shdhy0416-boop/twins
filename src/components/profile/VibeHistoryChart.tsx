import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
  LabelList,
} from 'recharts';
import { Language } from '../../types';
import { playClickPop } from '../../utils/soundEffects';
import { Sparkles, TrendingUp } from 'lucide-react';

interface VibeHistoryChartProps {
  language: Language;
}

interface VibeHistoryPoint {
  dayEn: string;
  dayAr: string;
  dateStr: string;
  score: number;
  vibeEn: string;
  vibeAr: string;
  chosenAnswerEn: string;
  chosenAnswerAr: string;
  majorityPercent: number;
}

export const VibeHistoryChart: React.FC<VibeHistoryChartProps> = ({ language }) => {
  const [activeView, setActiveView] = useState<'line' | 'area'>('area');
  const isAr = language === 'ar';

  // Generate 7-day calendar history relative to current date
  const generate7DayHistory = (): VibeHistoryPoint[] => {
    const points: VibeHistoryPoint[] = [];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const vibesEn = [
      'Mindful Zen 🧘',
      'High Velocity 🚀',
      'Reflective Soul 🌙',
      'Cosmic Night Owl ✨',
      'Social Kinetic 🎾',
      'Curious Explorer 🧭',
      'Harmonious Pulse ⚡',
    ];

    const vibesAr = [
      'روقان وهدوء 🧘',
      'طاقة وإنجاز 🚀',
      'تأمل وسكينة 🌙',
      'سهرة رايقة ✨',
      'حيوية ورياضة 🎾',
      'استكشاف وفضول 🧭',
      'تناغم توأمي ⚡',
    ];

    const answersEn = [
      'Slow 45-min Morning Coffee',
      'Artisanal Truffle Burger',
      'Solo Film & Sanctuary',
      'Desert Kashta & Stargazing',
      'Padel Doubles Match',
      'Hidden Boutique Cafe',
      'Iced Floral V60 Drip',
    ];

    const answersAr = [
      'قهوة صباحية هادئة 45 دقيقة',
      'برجر ذواقة بالترفل',
      'عزلة هادئة وأفلام',
      'كشتة ومراقبة النجوم في البر',
      'مباراة بادل حماسية',
      'مقهى صغير هادئ ومختبئ',
      'آيس V60 بإيحاءات فاكهية',
    ];

    const scores = [74, 86, 78, 95, 88, 83, 91];
    const majority = [66, 58, 54, 49, 61, 53, 57];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayIdx = d.getDay();
      const itemIdx = 6 - i;

      points.push({
        dayEn: daysEn[dayIdx],
        dayAr: daysAr[dayIdx],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        score: scores[itemIdx],
        vibeEn: vibesEn[itemIdx],
        vibeAr: vibesAr[itemIdx],
        chosenAnswerEn: answersEn[itemIdx],
        chosenAnswerAr: answersAr[itemIdx],
        majorityPercent: majority[itemIdx],
      });
    }

    return points;
  };

  const data = generate7DayHistory();
  const averageScore = Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length);
  const highestDay = data.reduce((max, curr) => (curr.score > max.score ? curr : max), data[0]);

  // Custom Glassmorphic Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: VibeHistoryPoint = payload[0].payload;
      return (
        <div className="bg-white/98 dark:bg-[#141E18]/98 backdrop-blur-md p-3.5 rounded-2xl border-2 border-[#0B5D3B]/35 dark:border-[#34D399]/40 shadow-2xl text-xs max-w-[225px] space-y-1.5 z-50">
          <div className="flex items-center justify-between font-black text-sm text-[#0B5D3B] dark:text-[#34D399] border-b border-slate-100 dark:border-slate-800 pb-1">
            <span>{isAr ? item.dayAr : item.dayEn}</span>
            <span className="tabular-nums text-xs text-[#647067] dark:text-slate-400">{item.dateStr}</span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-[#5A655D] dark:text-slate-300 font-extrabold">
              {isAr ? 'مؤشر التوافق:' : 'Vibe Index:'}
            </span>
            <span className="tabular-nums font-black text-base text-[#0B5D3B] dark:text-[#34D399]">
              {item.score}%
            </span>
          </div>

          <div className="text-xs font-extrabold text-[#18221C] dark:text-white">
            {isAr ? item.vibeAr : item.vibeEn}
          </div>

          <p className="text-[11px] font-bold text-[#5C665F] dark:text-slate-300 truncate">
            &ldquo;{isAr ? item.chosenAnswerAr : item.chosenAnswerEn}&rdquo;
          </p>

          <div className="text-[11px] font-black text-[#B8860B] dark:text-[#FBBF24] pt-0.5 flex items-center gap-1 tabular-nums">
            <Sparkles size={12} />
            <span>
              {isAr
                ? `توافق الأغلبية: ${item.majorityPercent}%`
                : `Community Avg: ${item.majorityPercent}%`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Large, crystal-clear SVG score labels with contrasting stroke halo
  const renderScoreLabel = (props: any) => {
    const { x, y, value } = props;
    if (x == null || y == null || value == null) return null;
    const isPeak = Number(value) === highestDay.score;
    return (
      <g>
        <text
          x={x}
          y={y - 11}
          textAnchor="middle"
          className={
            isPeak
              ? 'fill-[#B47800] dark:fill-[#FBBF24] stroke-white dark:stroke-[#141E18]'
              : 'fill-[#084C30] dark:fill-[#6EE7B7] stroke-white dark:stroke-[#141E18]'
          }
          style={{
            fontSize: isPeak ? 15 : 13.5,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            paintOrder: 'stroke',
            strokeWidth: 4,
            strokeLinejoin: 'round',
          }}
        >
          {`${value}%`}
        </text>
      </g>
    );
  };

  // Bold, high-contrast X-axis day names
  const renderDayTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload) return null;
    const peakLabel = isAr ? highestDay.dayAr : highestDay.dayEn;
    const isPeakDay = payload.value === peakLabel;
    return (
      <text
        x={x}
        y={y + 13}
        textAnchor="middle"
        className={
          isPeakDay
            ? 'fill-[#0B5D3B] dark:fill-[#FBBF24]'
            : 'fill-[#233028] dark:fill-[#DCE7E0]'
        }
        style={{
          fontSize: 12.5,
          fontWeight: isPeakDay ? 900 : 800,
        }}
      >
        {payload.value}
      </text>
    );
  };

  // Prominent jewel dots with special gold highlight on peak day
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return null;
    const isPeak = payload.score === highestDay.score;
    if (isPeak) {
      return (
        <g key={`dot-${payload.dateStr}`}>
          <circle cx={cx} cy={cy} r={8.5} fill="#D4AF37" fillOpacity={0.25} />
          <circle cx={cx} cy={cy} r={6} fill="#D4AF37" stroke="#FFFFFF" strokeWidth={2.5} />
        </g>
      );
    }
    return (
      <circle
        key={`dot-${payload.dateStr}`}
        cx={cx}
        cy={cy}
        r={5}
        fill="#0B5D3B"
        stroke="#FFFFFF"
        strokeWidth={2.2}
      />
    );
  };

  return (
    <div
      data-luxury-bezel="true"
      className="
        relative w-full rounded-[30px] p-[2.5px] overflow-hidden
        bg-gradient-to-br from-[#0B5D3B]/35 via-[#D4AF37]/45 to-[#10B981]/35
        dark:from-[#10B981]/45 dark:via-[#D4AF37]/55 dark:to-[#0B5D3B]/45
        shadow-[0_10px_0_0_#BFD5C8,0_22px_44px_-6px_rgba(11,93,59,0.24),0_6px_18px_rgba(212,175,55,0.18)]
        dark:shadow-[0_10px_0_0_#07120C,0_24px_48px_rgba(0,0,0,0.82),0_0_32px_rgba(16,185,129,0.18)]
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

      {/* Inner Luxury Card Surface */}
      <div className="relative z-10 w-full rounded-[27.5px] bg-gradient-to-b from-[#FFFFFF] via-[#FAF8F2] to-[#EFEAD9] dark:from-[#1B261F] dark:via-[#151F19] dark:to-[#101713] px-4 py-3.5 sm:px-5 sm:py-4 overflow-hidden">
        {/* Top Luminous Right-to-Left Crown Ribbon */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 h-[3px] overflow-hidden z-20"
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
              'linear-gradient(270deg, transparent 10%, rgba(16,185,129,0.08) 42%, rgba(212,175,55,0.14) 52%, rgba(16,185,129,0.06) 64%, transparent 90%)',
          }}
        />

        {/* Specular gloss top sheen */}
        <div className="absolute inset-x-4 top-0.5 h-[26%] rounded-t-2xl bg-gradient-to-b from-white/85 via-white/15 to-transparent dark:from-white/10 dark:via-transparent pointer-events-none z-0" />

        {/* 1. Compact Header with Bold Title & Crisp Single-Line Switcher */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-[#E6E1D5] dark:border-slate-800/90">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DDF3E7] via-[#EAF8F0] to-[#FFF6DA] dark:from-[#0B5D3B]/45 dark:to-[#2B2412] border border-[#0B5D3B]/20 dark:border-[#34D399]/25 flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399] shadow-2xs shrink-0">
            <TrendingUp size={20} className="text-[#0B5D3B] dark:text-[#34D399]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142019] dark:text-white leading-tight truncate">
              {isAr ? 'سجل المزاج الأسبوعي' : '7-Day Vibe History'}
            </h3>
            <span className="text-xs font-bold text-[#536058] dark:text-slate-300 block leading-snug truncate">
              {isAr
                ? 'معدل تطور مزاجك وتوافقك خلال آخر 7 أيام'
                : 'Your daily personality & vibe trend over 7 days'}
            </span>
          </div>
        </div>

        {/* View Mode Toggle — crisp single-line luxury switcher */}
        <div className="flex items-center gap-1 bg-[#F2EFE7] dark:bg-[#121915] p-1 rounded-2xl border border-[#DDD6C7] dark:border-slate-800 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickPop();
              setActiveView('line');
            }}
            className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeView === 'line'
                ? 'bg-gradient-to-b from-[#137A4F] to-[#0B5D3B] text-white shadow-[0_2px_6px_rgba(11,93,59,0.3)]'
                : 'text-[#55625A] dark:text-slate-300 hover:text-[#142019] dark:hover:text-white'
            }`}
          >
            {isAr ? 'خط بياني' : 'Line'}
          </button>
          <button
            type="button"
            onClick={() => {
              playClickPop();
              setActiveView('area');
            }}
            className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeView === 'area'
                ? 'bg-gradient-to-b from-[#137A4F] to-[#0B5D3B] text-white shadow-[0_2px_6px_rgba(11,93,59,0.3)]'
                : 'text-[#55625A] dark:text-slate-300 hover:text-[#142019] dark:hover:text-white'
            }`}
          >
            {isAr ? 'مساحة' : 'Area'}
          </button>
        </div>
      </div>

      {/* 2. Compact Vertical Chart Area (136px height + Tight Y-Domain [64, 104] = Zero Dead Space) */}
      <div className="relative z-10 w-full pt-1.5 pb-0.5" style={{ height: 136 }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'line' ? (
            <LineChart data={data} margin={{ top: 26, right: 22, left: 22, bottom: 4 }}>
              <defs>
                <linearGradient id="vibeLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0B5D3B" />
                  <stop offset="55%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.22} />
              <YAxis domain={[64, 104]} hide />
              <XAxis
                dataKey={isAr ? 'dayAr' : 'dayEn'}
                tick={renderDayTick}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#vibeLineGrad)"
                strokeWidth={4}
                dot={renderCustomDot}
                activeDot={{ r: 8, fill: '#D4AF37', stroke: '#FFFFFF', strokeWidth: 3 }}
                animationDuration={900}
              >
                <LabelList dataKey="score" content={renderScoreLabel} />
              </Line>
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 26, right: 22, left: 22, bottom: 4 }}>
              <defs>
                <linearGradient id="vibeAreaStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0B5D3B" />
                  <stop offset="55%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <linearGradient id="vibeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.38} />
                  <stop offset="65%" stopColor="#D4AF37" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.22} />
              <YAxis domain={[64, 104]} hide />
              <XAxis
                dataKey={isAr ? 'dayAr' : 'dayEn'}
                tick={renderDayTick}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="url(#vibeAreaStrokeGrad)"
                strokeWidth={4}
                fill="url(#vibeAreaGrad)"
                dot={renderCustomDot}
                activeDot={{ r: 8, fill: '#D4AF37', stroke: '#FFFFFF', strokeWidth: 3 }}
                animationDuration={900}
              >
                <LabelList dataKey="score" content={renderScoreLabel} />
              </Area>
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 3. Prominent High-Visibility KPI Highlights (Compact Height + Big Bold Numbers) */}
      <div className="relative z-10 grid grid-cols-3 gap-2 mt-1.5 pt-2.5 border-t border-[#E6E1D5] dark:border-slate-800/90">
        {/* Metric 1: Average Vibe Alignment */}
        <div className="py-2 px-2 rounded-2xl bg-gradient-to-b from-white to-[#F4FBF7] dark:from-[#19251E] dark:to-[#131C17] border border-[#CBE5D6] dark:border-[#1E3B2C] text-center shadow-2xs">
          <span className="text-[11px] sm:text-xs font-extrabold text-[#4A5850] dark:text-slate-300 block truncate">
            {isAr ? 'المتوسط الأسبوعي' : 'Weekly Avg'}
          </span>
          <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-[#0B5D3B] dark:text-[#34D399] leading-none block my-1">
            {averageScore}%
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#B47800] dark:text-[#FBBF24] font-black block truncate">
            {isAr ? 'تناغم عالي' : 'High Synergy'}
          </span>
        </div>

        {/* Metric 2: Peak Energy Day */}
        <div className="py-2 px-2 rounded-2xl bg-gradient-to-b from-[#FFFDF7] to-[#FDF6E2] dark:from-[#242015] dark:to-[#181712] border border-[#E9D49B] dark:border-[#D4AF37]/35 text-center shadow-2xs">
          <span className="text-[11px] sm:text-xs font-extrabold text-[#5A5035] dark:text-[#FDE68A] block truncate">
            {isAr ? 'أعلى يوم تطابق' : 'Peak Day'}
          </span>
          <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-[#B47800] dark:text-[#FBBF24] leading-none block my-1">
            {highestDay.score}%
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#3F4B43] dark:text-slate-200 font-black truncate block">
            {isAr ? highestDay.dayAr : highestDay.dayEn}
          </span>
        </div>

        {/* Metric 3: Consistency Streak */}
        <div className="py-2 px-2 rounded-2xl bg-gradient-to-b from-white to-[#F4FBF7] dark:from-[#19251E] dark:to-[#131C17] border border-[#CBE5D6] dark:border-[#1E3B2C] text-center shadow-2xs">
          <span className="text-[11px] sm:text-xs font-extrabold text-[#4A5850] dark:text-slate-300 block truncate">
            {isAr ? 'الالتزام اليومي' : 'Daily Streak'}
          </span>
          <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-[#0B5D3B] dark:text-[#34D399] leading-none block my-1">
            7/7
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#0B5D3B] dark:text-[#6EE7B7] font-black block truncate">
            {isAr ? 'مكتمل بنجاح' : '100% Active'}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
};

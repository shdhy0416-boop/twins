import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Language } from '../../types';
import { getCatalogQuestionById } from '../../services/questionCatalogService';
import { AdminDashboardSnapshot } from '../../services/adminService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminCompatibilitySectionProps {
  snapshot: AdminDashboardSnapshot;
  language: Language;
}

export const AdminCompatibilitySection: React.FC<AdminCompatibilitySectionProps> = ({
  snapshot,
  language,
}) => {
  const [pairScope, setPairScope] = useState<'all_pairs' | 'active_user'>('all_pairs');
  const [expandedScenarioId, setExpandedScenarioId] = useState<string>('scenario_demo_95');

  const isAr = language === 'ar';
  const { compatibility, overview } = snapshot;

  const activePairs =
    pairScope === 'all_pairs'
      ? compatibility.allCommunityPairs
      : compatibility.activeUserPairs;

  const activeBuckets =
    pairScope === 'all_pairs'
      ? compatibility.allPairsDistribution
      : compatibility.activeUserDistribution;

  const avgScore =
    pairScope === 'all_pairs'
      ? overview.averageAllPairsCompatibilityScore
      : overview.averageActiveCompatibilityScore;

  const getQuestionLabel = (qid: string) => {
    const q = getCatalogQuestionById(qid);
    if (!q) return qid;
    return isAr ? q.titleAr : q.titleEn;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-xs space-y-1">
        <div className="font-bold text-[#202923] dark:text-white font-mono tabular-nums">
          {item.rangeLabel}
        </div>
        <div className="text-[#778078] dark:text-slate-300">
          {isAr ? item.tierAr : item.tierEn}
        </div>
        <div className="font-mono tabular-nums font-bold text-[#0B5D3B] dark:text-[#34D399]">
          {item.count} {isAr ? 'زوج تجريبي' : 'simulated pairs'} ({item.percentage}%)
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold text-[#778078] dark:text-slate-400">
            {isAr
              ? 'تحليل التوافق الرياضي عبر الأبعاد الـ 15 — يميز بوضوح بين المحاكاة التجريبية والنتائج الواقعية'
              : 'Deterministic 15-dimension similarity analytics — explicitly separating simulated demo scores from real-world data'}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#202923] dark:text-white mt-1">
            {isAr ? 'تحليلات التوافق ونسب التطابق' : 'Compatibility Analytics'}
          </h2>
        </div>

        {/* Scope Switcher */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/80 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setPairScope('all_pairs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
              pairScope === 'all_pairs'
                ? 'bg-[#0B5D3B] text-white'
                : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
            }`}
          >
            {isAr
              ? `كل الأزواج التجريبية (${compatibility.allCommunityPairs.length})`
              : `All Demo Pairs (${compatibility.allCommunityPairs.length})`}
          </button>
          <button
            type="button"
            onClick={() => setPairScope('active_user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
              pairScope === 'active_user'
                ? 'bg-[#0B5D3B] text-white'
                : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
            }`}
          >
            {isAr
              ? `نتائج المستخدم النشط (${compatibility.activeUserPairs.length})`
              : `Active User Pairs (${compatibility.activeUserPairs.length})`}
          </button>
        </div>
      </div>

      {/* Simulated Demo vs Verified Real-World Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B5D3B] dark:text-[#34D399]">
              {isAr ? 'درجات محاكاة تجريبية (SIMULATED DEMO)' : 'Simulated Demo Scores (Active)'}
            </span>
            <span className="text-xs font-mono tabular-nums text-[#778078]">
              {activePairs.length} {isAr ? 'مقارنة' : 'comparisons'}
            </span>
          </div>
          <div className="flex items-baseline gap-4 font-mono tabular-nums">
            <div>
              <span className="text-2xl font-extrabold text-[#202923] dark:text-white">
                {avgScore !== null ? `${avgScore}%` : '—'}
              </span>
              <span className="text-xs text-[#778078] ms-1.5">
                {isAr ? 'متوسط التوافق' : 'mean score'}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <div>
              <span className="text-2xl font-extrabold text-[#0B5D3B] dark:text-[#34D399]">
                {overview.highestDemoCompatibilityScore !== null
                  ? `${overview.highestDemoCompatibilityScore}%`
                  : '—'}
              </span>
              <span className="text-xs text-[#778078] ms-1.5">
                {isAr ? 'أعلى نتيجة بالحزمة' : 'top pool pair'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#778078] dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'محسوبة محلياً باستخدام دالة calculatePairwiseSimilarity على إجابات الحسابات التجريبية فقط.'
              : 'Computed locally via calculatePairwiseSimilarity across mock and localStorage demo profiles.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#141C17] border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
              <AlertCircle size={14} className="text-slate-400" />
              <span>
                {isAr
                  ? 'النتائج الواقعية الموثقة (VERIFIED REAL-WORLD)'
                  : 'Verified Real-World Results'}
              </span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">0</span>
          </div>
          <div className="text-xl font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'غير متوفرة — لا توجد قاعدة بيانات إنتاجية متصلة' : 'Unavailable — No Live Production Backend'}
          </div>
          <p className="text-xs text-[#778078] dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'لن يتم عرض إحصاءات التوافق الواقعية إلا بعد تفعيل مصادقة المستخدمين الحقيقية وجدول match_scores_cache في PostgreSQL.'
              : 'Verified real-user compatibility metrics require live authentication and PostgreSQL match_scores_cache telemetry.'}
          </p>
        </div>
      </div>

      {/* Score Range Distribution Chart & Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#202923] dark:text-white">
            {isAr ? 'توزيع فئات درجات التوافق التجريبية' : 'Compatibility Score Range Distribution'}
          </h3>
          <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
            {isAr
              ? 'مقسمة وفق نفس شرائح مؤشر التوافق المعتمدة في واجهة المستخدم (VibeMatchGauge)'
              : 'Grouped by the exact compatibility tiers used in the user-facing VibeMatchGauge'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeBuckets}
                margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#CBD5E1"
                  strokeOpacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="rangeLabel"
                  tick={{ fontSize: 11, fill: '#778078', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#778078', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={52}>
                  {activeBuckets.map((entry) => (
                    <Cell key={entry.id} fill={entry.colorHex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 divide-y divide-slate-100 dark:divide-slate-800">
            {activeBuckets.map((bucket) => (
              <div
                key={bucket.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold font-mono tabular-nums text-[#202923] dark:text-white">
                    {bucket.rangeLabel}
                  </div>
                  <div className="text-[#778078] dark:text-slate-400">
                    {isAr ? bucket.tierAr : bucket.tierEn}
                  </div>
                </div>
                <div className="text-end font-mono tabular-nums">
                  <span className="font-extrabold text-sm text-[#202923] dark:text-white">
                    {bucket.count}
                  </span>
                  <span className="text-[#778078] ms-1.5">
                    ({bucket.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 95% & 90% Reference Demo Scenarios Inspector */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-[#202923] dark:text-white">
              {isAr
                ? 'سيناريوهات التوافق المرجعية (أمثلة 95% و90% التجريبية)'
                : 'Reference Compatibility Scenarios (95% & 90% Demo Examples)'}
            </h3>
            <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
              {isAr
                ? 'محسوبة مباشرة عبر محرك التطابق الفعلي لإثبات دقة الأوزان الرياضية في سيناريوهات 95% و90% والثنائي الافتراضي الأول'
                : 'Evaluated live by calculatePairwiseSimilarity to verify exact 95% and 90% demo thresholds alongside the primary mock candidate'}
            </p>
          </div>
          <span className="text-xs font-mono text-[#778078] whitespace-nowrap">
            SIMULATED DEMO SCENARIOS
          </span>
        </div>

        <div className="space-y-3">
          {compatibility.benchmarkScenarios.map((scenario) => {
            const isExpanded = expandedScenarioId === scenario.id;
            return (
              <div
                key={scenario.id}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#FAF9F5] dark:bg-[#121A15] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedScenarioId(isExpanded ? '' : scenario.id)
                  }
                  className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start cursor-pointer hover:bg-[#F3F0E7] dark:hover:bg-[#18231C] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400">
                      <span>SIMULATED DEMO</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span dir="ltr">
                        @{scenario.personaAHandle} × @{scenario.personaBHandle}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-[#202923] dark:text-white">
                      {isAr ? scenario.titleAr : scenario.titleEn}
                    </div>
                    <p className="text-xs text-[#778078] dark:text-slate-400 leading-relaxed">
                      {isAr ? scenario.descriptionAr : scenario.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-center font-mono tabular-nums">
                    <div className="text-end">
                      <div className="text-2xl font-extrabold text-[#0B5D3B] dark:text-[#34D399]">
                        {scenario.computedScore}%
                      </div>
                      <div className="text-[11px] text-[#778078] dark:text-slate-400">
                        {scenario.matchedDimensionsCount}/
                        {scenario.comparedDimensionsCount}{' '}
                        {isAr ? 'أبعاد متطابقة' : 'matched'}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-[#778078]" />
                    ) : (
                      <ChevronDown size={18} className="text-[#778078]" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-bold text-[#0B5D3B] dark:text-[#34D399] mb-2 inline-flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        <span>
                          {isAr
                            ? `الأبعاد المتطابقة (${scenario.matchedQuestionIds.length})`
                            : `Aligned Dimensions (${scenario.matchedQuestionIds.length})`}
                        </span>
                      </div>
                      <ul className="space-y-1 text-[#202923] dark:text-slate-300">
                        {scenario.matchedQuestionIds.map((qid) => (
                          <li key={qid} className="flex items-center justify-between gap-2">
                            <span className="truncate">{getQuestionLabel(qid)}</span>
                            <span className="font-mono text-[11px] text-[#778078] shrink-0">
                              {qid}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-bold text-[#B45309] dark:text-[#FBBF24] mb-2">
                        {isAr
                          ? `الأبعاد المختلفة (${scenario.divergentQuestionIds.length})`
                          : `Divergent Dimensions (${scenario.divergentQuestionIds.length})`}
                      </div>
                      {scenario.divergentQuestionIds.length === 0 ? (
                        <p className="text-[#778078]">
                          {isAr ? 'لا توجد اختلافات.' : 'Zero divergent dimensions.'}
                        </p>
                      ) : (
                        <ul className="space-y-1 text-[#202923] dark:text-slate-300">
                          {scenario.divergentQuestionIds.map((qid) => (
                            <li key={qid} className="flex items-center justify-between gap-2">
                              <span className="truncate">{getQuestionLabel(qid)}</span>
                              <span className="font-mono text-[11px] text-[#778078] shrink-0">
                                {qid}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-[#778078] font-mono tabular-nums">
                        {isAr ? 'تغطية البيانات:' : 'Data Coverage:'} {scenario.coverageScore}% ·{' '}
                        {isAr ? 'حالة التحقق الواقعي: محاكاة تجريبية فقط' : 'Origin: Simulated Demo'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranked Demo Pairwise Results Table */}
      <div className="rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-[#202923] dark:text-white">
            {isAr ? 'سجل نتائج التوافق التجريبية المحسوبة' : 'Calculated Demo Pairwise Compatibility Matrix'}
          </h3>
          <span className="text-xs font-mono tabular-nums text-[#778078]">
            {activePairs.length} {isAr ? 'سجل' : 'pairs'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-[#FAF9F5] dark:bg-[#121A15] text-xs font-bold text-[#778078] dark:text-slate-400">
                <th className="py-3 px-4 text-start whitespace-nowrap">
                  {isAr ? 'الطرف الأول' : 'Demo Persona A'}
                </th>
                <th className="py-3 px-4 text-start whitespace-nowrap">
                  {isAr ? 'الطرف الثاني' : 'Demo Persona B'}
                </th>
                <th className="py-3 px-4 text-start whitespace-nowrap">
                  {isAr ? 'نوع النتيجة' : 'Result Classification'}
                </th>
                <th className="py-3 px-4 text-end whitespace-nowrap">
                  {isAr ? 'النقاط المشتركة' : 'Shared Questions'}
                </th>
                <th className="py-3 px-4 text-end whitespace-nowrap">
                  {isAr ? 'التغطية' : 'Coverage'}
                </th>
                <th className="py-3 px-4 text-end whitespace-nowrap">
                  {isAr ? 'نسبة التوافق' : 'Calculated Score'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activePairs.map((pair) => (
                <tr
                  key={pair.id}
                  className="hover:bg-[#F7F5EE] dark:hover:bg-[#1B271F] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <AvatarRenderer
                        avatar={pair.userAAvatar}
                        size={30}
                        interactive={false}
                      />
                      <div>
                        <div className="text-xs font-bold text-[#202923] dark:text-white">
                          <span dir="ltr">@{pair.userAUsername}</span>
                        </div>
                        <div className="text-[11px] text-[#778078]">
                          {formatCity(pair.userACity, language)}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <AvatarRenderer
                        avatar={pair.userBAvatar}
                        size={30}
                        interactive={false}
                      />
                      <div>
                        <div className="text-xs font-bold text-[#202923] dark:text-white">
                          <span dir="ltr">@{pair.userBUsername}</span>
                        </div>
                        <div className="text-[11px] text-[#778078]">
                          {formatCity(pair.userBCity, language)}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-xs text-[#778078] dark:text-slate-400 whitespace-nowrap">
                    {isAr ? 'محاكاة تجريبية (غير واقعية)' : 'Simulated Demo Score'}
                  </td>

                  <td className="py-3 px-4 text-end font-mono tabular-nums text-xs text-[#202923] dark:text-slate-200 whitespace-nowrap">
                    {pair.sharedInterests.length} / {pair.comparedDimensionsCount}
                  </td>

                  <td className="py-3 px-4 text-end font-mono tabular-nums text-xs text-[#778078] dark:text-slate-400 whitespace-nowrap">
                    {pair.coverageScore}%
                  </td>

                  <td className="py-3 px-4 text-end font-mono tabular-nums whitespace-nowrap">
                    <span className="text-sm font-extrabold text-[#0B5D3B] dark:text-[#34D399]">
                      {pair.similarityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

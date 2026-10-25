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
import {
  AdminDashboardSnapshot,
  AdminDemoUserRecord,
  AdminSectionId,
} from '../../services/adminService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface AdminOverviewSectionProps {
  snapshot: AdminDashboardSnapshot;
  language: Language;
  onNavigateSection: (section: AdminSectionId) => void;
  onInspectUser: (user: AdminDemoUserRecord) => void;
}

export const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({
  snapshot,
  language,
  onNavigateSection,
  onInspectUser,
}) => {
  const [distributionScope, setDistributionScope] = useState<'all_pairs' | 'active_user'>('all_pairs');
  const isAr = language === 'ar';
  const { overview, compatibility, users } = snapshot;

  const chartBuckets =
    distributionScope === 'all_pairs'
      ? compatibility.allPairsDistribution
      : compatibility.activeUserDistribution;

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const bucket = payload[0].payload;
    return (
      <div className="bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-xs space-y-1">
        <div className="font-bold text-[#202923] dark:text-white font-mono tabular-nums">
          {bucket.rangeLabel}
        </div>
        <div className="text-[#778078] dark:text-slate-300">
          {isAr ? bucket.tierAr : bucket.tierEn}
        </div>
        <div className="font-mono tabular-nums font-bold text-[#0B5D3B] dark:text-[#34D399]">
          {bucket.count} {isAr ? 'نتيجة تجريبية' : 'demo pairs'} ({bucket.percentage}%)
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
              ? 'ملخص تنفيذي محسوب مباشرة من السجلات التجريبية المتوفرة'
              : 'Calculated directly from active local demo sessions and mock community profiles'}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#202923] dark:text-white mt-1">
            {isAr ? 'نظرة عامة على النظام التجريبي' : 'Demo Platform Overview'}
          </h2>
        </div>

        <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
          <span>{isAr ? 'الوضع: تجريبي محلي' : 'Mode: DEMO'}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>
            {isAr
              ? `قاعدة بيانات حقيقية: غير متصلة`
              : `Live DB: Not Connected`}
          </span>
        </div>
      </div>

      {/* Primary KPI Grid (6 Required Metrics + Honest Unavailable Real-World Comparison) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* KPI 1: Total Demo Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'إجمالي المستخدمين التجريبيين' : 'Total Demo Users'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection('users')}
              className="text-xs font-semibold text-[#0B5D3B] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View directory'}</span>
              {isAr ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
            </button>
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white">
            {overview.totalDemoUsers}
          </div>
          <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
            <span>
              {overview.localSessionUsersCount}{' '}
              {isAr ? 'جلسة محلية' : 'local session'}
            </span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>
              {overview.mockPoolUsersCount}{' '}
              {isAr ? 'ملفات مجتمع افتراضية' : 'mock pool'}
            </span>
          </div>
        </div>

        {/* KPI 2: Completed Profiles */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'الملفات المكتملة' : 'Completed Profiles'}
            </span>
            <CheckCircle2 size={16} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-[#0B5D3B] dark:text-[#34D399]">
            {overview.completedProfilesCount}
          </div>
          <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
            {isAr
              ? `${overview.fullQuestionnaireUsersRate}% من إجمالي الحسابات التجريبية (15/15 سؤال)`
              : `${overview.fullQuestionnaireUsersRate}% of demo accounts (15/15 answered)`}
          </div>
        </div>

        {/* KPI 3: Incomplete Profiles */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'الملفات غير المكتملة' : 'Incomplete Profiles'}
            </span>
            <Clock size={16} className="text-[#D4AF37] shrink-0" />
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white">
            {overview.incompleteProfilesCount}
          </div>
          <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
            <span>
              {overview.partialProfilesCount}{' '}
              {isAr ? 'مكتمل جزئياً' : 'in progress'}
            </span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>
              {overview.notStartedProfilesCount}{' '}
              {isAr ? 'لم يبدأ الأسئلة' : 'not started'}
            </span>
          </div>
        </div>

        {/* KPI 4: Questionnaire Completion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'معدل إكمال الاستبيان' : 'Questionnaire Completion Rate'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection('questionnaire')}
              className="text-xs font-semibold text-[#0B5D3B] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isAr ? 'تفاصيل الأسئلة' : 'Inspect 15 questions'}</span>
              {isAr ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
            </button>
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white">
            {overview.questionnaireCompletionRate}%
          </div>
          <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
            {isAr
              ? `${overview.totalAnsweredSlots} من ${overview.totalPossibleQuestionSlots} إجابة مسجلة`
              : `${overview.totalAnsweredSlots} of ${overview.totalPossibleQuestionSlots} question slots answered`}
          </div>
        </div>

        {/* KPI 5: Number of Demo Compatibility Results */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'نتائج التوافق التجريبية' : 'Demo Compatibility Results'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection('compatibility')}
              className="text-xs font-semibold text-[#0B5D3B] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isAr ? 'تحليل التوافق' : 'Open analytics'}</span>
              {isAr ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
            </button>
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-[#202923] dark:text-white">
            {overview.allPairsCompatibilityCount}
          </div>
          <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
            <span>
              {overview.activeUserCompatibilityCount}{' '}
              {isAr ? 'للمستخدم النشط' : 'active-user pairs'}
            </span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>
              {isAr ? 'أعلى توافق:' : 'Peak:'}{' '}
              {overview.highestDemoCompatibilityScore !== null
                ? `${overview.highestDemoCompatibilityScore}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* KPI 6: Verified Real-World Production Metrics (Explicitly Unavailable State) */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#141C17] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'نتائج مستخدمين حقيقيين موثقة' : 'Verified Real-World Matches'}
            </span>
            <AlertCircle size={16} className="text-slate-400 shrink-0" />
          </div>
          <div className="text-xl font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'غير متوفر (وضع تجريبي)' : 'Unavailable in Demo Mode'}
          </div>
          <div className="text-xs text-[#778078] dark:text-slate-400">
            {isAr
              ? 'لا يوجد اتصال بقاعدة بيانات حية؛ جميع الإحصاءات أعلاه من بيانات تجريبية فقط.'
              : 'No live backend connected. All metrics above reflect simulated demo records only.'}
          </div>
        </div>
      </div>

      {/* Distribution of Compatibility Scores + Quick Directory Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Distribution of Compatibility Scores Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-[#202923] dark:text-white">
                {isAr
                  ? 'توزيع نسب التوافق التجريبية'
                  : 'Distribution of Demo Compatibility Scores'}
              </h3>
              <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
                {distributionScope === 'all_pairs'
                  ? isAr
                    ? `توزيع جميع الأزواج التجريبية الممكنة (${overview.allPairsCompatibilityCount} زوجاً)`
                    : `All unique pairwise demo comparisons (${overview.allPairsCompatibilityCount} pairs)`
                  : isAr
                  ? `توزيع نتائج المستخدم النشط الحالي (${overview.activeUserCompatibilityCount} مرشحين)`
                  : `Active demo user vs candidate pool (${overview.activeUserCompatibilityCount} pairs)`}
              </p>
            </div>

            {/* Interactive Segmented Control */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/70 dark:border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setDistributionScope('all_pairs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  distributionScope === 'all_pairs'
                    ? 'bg-[#0B5D3B] text-white'
                    : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
                }`}
              >
                {isAr ? 'جميع الأزواج' : 'All Demo Pairs'}
              </button>
              <button
                type="button"
                onClick={() => setDistributionScope('active_user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  distributionScope === 'active_user'
                    ? 'bg-[#0B5D3B] text-white'
                    : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
                }`}
              >
                {isAr ? 'المستخدم النشط' : 'Active User'}
              </button>
            </div>
          </div>

          <div className="w-full h-60 pt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartBuckets}
                margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
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
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {chartBuckets.map((entry) => (
                    <Cell key={entry.id} fill={entry.colorHex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {chartBuckets.map((b) => (
              <div key={b.id} className="text-start">
                <div className="text-[11px] font-mono tabular-nums text-[#778078] dark:text-slate-400">
                  {b.rangeLabel}
                </div>
                <div className="text-sm font-extrabold font-mono tabular-nums text-[#202923] dark:text-white">
                  {b.count}{' '}
                  <span className="text-xs font-normal text-[#778078]">
                    ({b.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Demo Accounts Snapshot List */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#202923] dark:text-white">
                  {isAr ? 'عينة السجلات التجريبية' : 'Active Demo Records'}
                </h3>
                <p className="text-xs text-[#778078] dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'اضغط على أي مستخدم تجريبي لمعاينة إجاباته'
                    : 'Select any demo user to inspect profile & answers'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateSection('users')}
                className="text-xs font-bold text-[#0B5D3B] dark:text-[#34D399] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAr ? 'إدارة المستخدمين' : 'Manage all'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
              {users.slice(0, 6).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onInspectUser(user)}
                  className="w-full py-2.5 px-2 -mx-2 rounded-xl hover:bg-[#F4F2EC] dark:hover:bg-[#1D2921] flex items-center justify-between gap-3 transition-colors text-start cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      <AvatarRenderer
                        avatar={user.avatar}
                        size={36}
                        interactive={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#202923] dark:text-white truncate">
                        <span dir="ltr">@{user.username}</span>
                      </div>
                      <div className="text-xs text-[#778078] dark:text-slate-400 truncate">
                        <span>{formatCity(user.city, language)}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{isAr ? 'بيانات تجريبية' : 'Demo record'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-end shrink-0 font-mono tabular-nums">
                    <div className="text-xs font-bold text-[#0B5D3B] dark:text-[#34D399]">
                      {user.answeredCount}/{user.totalQuestions}
                    </div>
                    <div className="text-[11px] text-[#778078] dark:text-slate-400">
                      {user.isProfileCompleted
                        ? isAr
                          ? 'مكتمل'
                          : 'Complete'
                        : isAr
                        ? 'غير مكتمل'
                        : 'Incomplete'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-[#778078] dark:text-slate-400">
            <span>
              {isAr
                ? 'مقترحات المستخدمين المحلية المسجلة:'
                : 'Local demo feedback items:'}
            </span>
            <span className="font-mono tabular-nums font-bold text-[#202923] dark:text-white">
              {overview.totalDemoFeedbackSubmissions}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

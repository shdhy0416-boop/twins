import React, { useMemo, useState } from 'react';
import { Language } from '../../types';
import {
  AdminDemoUserRecord,
  DemoRecordSourceFilter,
  filterAdminDemoUsers,
  ProfileCompletionFilter,
} from '../../services/adminService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { formatCity } from '../../utils/localization';
import { Search, X, Eye, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface AdminUsersSectionProps {
  users: AdminDemoUserRecord[];
  language: Language;
  onInspectUser: (user: AdminDemoUserRecord) => void;
}

export const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({
  users,
  language,
  onInspectUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [completionFilter, setCompletionFilter] =
    useState<ProfileCompletionFilter>('all');
  const [sourceFilter, setSourceFilter] =
    useState<DemoRecordSourceFilter>('all');

  const isAr = language === 'ar';

  const completedCount = useMemo(
    () => users.filter((u) => u.isProfileCompleted).length,
    [users]
  );
  const incompleteCount = users.length - completedCount;

  const filteredUsers = useMemo(
    () =>
      filterAdminDemoUsers(users, {
        searchQuery,
        completionFilter,
        sourceFilter,
      }),
    [users, searchQuery, completionFilter, sourceFilter]
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setCompletionFilter('all');
    setSourceFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold text-[#778078] dark:text-slate-400">
            {isAr
              ? 'جميع السجلات أدناه تجريبية للقراءة فقط — لا توجد كلمات مرور أو رموز جلسات أو إجراءات حذف'
              : 'Read-only directory of simulated demo personas — passwords, tokens, and destructive actions are excluded'}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#202923] dark:text-white mt-1">
            {isAr ? 'إدارة المستخدمين التجريبيين' : 'Demo User Management'}
          </h2>
        </div>

        <div className="text-xs text-[#778078] dark:text-slate-400 font-mono tabular-nums">
          {isAr
            ? `عرض ${filteredUsers.length} من أصل ${users.length} سجل تجريبي`
            : `Showing ${filteredUsers.length} of ${users.length} demo records`}
        </div>
      </div>

      {/* Read-Only & Redaction Notice */}
      <div className="p-4 rounded-2xl bg-[#FAF8F2] dark:bg-[#141C17] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-xs text-[#202923] dark:text-slate-300">
        <ShieldAlert size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isAr
            ? 'تنبيه نطاق البيانات: جميع الحسابات في هذا الجدول مُصنفة صراحةً كبيانات تجريبية (DEMO DATA). لا يتم تخزين أو عرض أي كلمات مرور أو أرقام جوال خام أو مفاتيح مصادقة، وتم تعطيل إجراءات الحذف أو الإيقاف في هذه المرحلة.'
            : 'Data Scope Notice: Every record listed below is strictly DEMO DATA. Passwords, raw mobile numbers, OTP tokens, and private secrets are never stored or exposed. User deletion and suspension controls are intentionally excluded in this demo phase.'}
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search by Name / Handle / User ID / City */}
        <div className="relative flex-1 max-w-lg">
          <Search
            size={16}
            className={`absolute top-1/2 -translate-y-1/2 text-[#778078] pointer-events-none ${
              isAr ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث بالاسم (@username) أو المعرّف (ID) أو المدينة...'
                : 'Search demo users by username, user ID, or city...'
            }
            aria-label={
              isAr ? 'البحث عن مستخدم تجريبي' : 'Search demo users by name or ID'
            }
            className={`w-full h-11 rounded-xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 text-sm text-[#202923] dark:text-white placeholder:text-[#778078] ${
              isAr ? 'pr-10 pl-9' : 'pl-10 pr-9'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer ${
                isAr ? 'left-2.5' : 'right-2.5'
              }`}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Completion Status & Source Segmented Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Completion Status Filter */}
          <div
            role="group"
            aria-label={isAr ? 'تصفية حسب اكتمال الملف' : 'Filter by profile completion'}
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/80 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={() => setCompletionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                completionFilter === 'all'
                  ? 'bg-[#0B5D3B] text-white'
                  : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              {isAr ? `الكل (${users.length})` : `All (${users.length})`}
            </button>
            <button
              type="button"
              onClick={() => setCompletionFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                completionFilter === 'completed'
                  ? 'bg-[#0B5D3B] text-white'
                  : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              {isAr
                ? `مكتمل (${completedCount})`
                : `Completed (${completedCount})`}
            </button>
            <button
              type="button"
              onClick={() => setCompletionFilter('incomplete')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                completionFilter === 'incomplete'
                  ? 'bg-[#0B5D3B] text-white'
                  : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              {isAr
                ? `غير مكتمل (${incompleteCount})`
                : `Incomplete (${incompleteCount})`}
            </button>
          </div>

          {/* Source Filter */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4F2EC] dark:bg-[#101712] border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sourceFilter === 'all'
                  ? 'bg-white dark:bg-[#1E2B22] text-[#202923] dark:text-white shadow-2xs'
                  : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              {isAr ? 'كل المصادر' : 'All Sources'}
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('local_session')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sourceFilter === 'local_session'
                  ? 'bg-white dark:bg-[#1E2B22] text-[#202923] dark:text-white shadow-2xs'
                  : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              {isAr ? 'جلسة المتصفح' : 'Local Sessions'}
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('mock_pool')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sourceFilter === 'mock_pool'
                  ? 'bg-white dark:bg-[#1E2B22] text-[#202923] dark:text-white shadow-2xs'
                  : 'text-[#778078] dark:text-slate-400 hover:text-[#202923] dark:hover:text-white'
              }`}
            >
              {isAr ? 'مجتمع افتراضي' : 'Mock Pool'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table / Responsive Cards */}
      {filteredUsers.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 text-center space-y-3">
          <p className="text-base font-bold text-[#202923] dark:text-white">
            {isAr
              ? 'لا توجد سجلات تجريبية مطابقة لمعايير التصفية الحالية'
              : 'No demo user records match your active search or filter'}
          </p>
          <p className="text-xs text-[#778078] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {completionFilter === 'incomplete' && incompleteCount === 0
              ? isAr
                ? 'جميع الحسابات التجريبية السبعة المدمجة حالياً مكتملة (15/15 سؤال). عند إنشاء حساب تجريبي جديد عبر نافذة التسجيل التجريبي دون إنهاء الأسئلة، سيظهر هنا تلقائياً كملف غير مكتمل.'
                : 'All built-in demo personas currently have completed 15/15 profiles. If you register a new demo handle in the user app without completing onboarding, it will automatically appear here as Incomplete.'
              : isAr
              ? 'جرب تعديل عبارة البحث أو إعادة ضبط عوامل التصفية لعرض جميع السجلات التجريبية.'
              : 'Try adjusting your search query or resetting filters to view all available demo accounts.'}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
          >
            {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-[#FAF9F5] dark:bg-[#121A15] text-xs font-bold text-[#778078] dark:text-slate-400">
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">
                    {isAr ? 'المستخدم التجريبي' : 'Demo User'}
                  </th>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">
                    {isAr ? 'المعرّف الثابت (ID)' : 'Stable User ID'}
                  </th>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">
                    {isAr ? 'المدينة والمصدر' : 'City & Data Origin'}
                  </th>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">
                    {isAr ? 'حالة الملف' : 'Completion Status'}
                  </th>
                  <th className="py-3.5 px-4 text-end whitespace-nowrap">
                    {isAr ? 'إجابات الاستبيان' : 'Questionnaire'}
                  </th>
                  <th className="py-3.5 px-4 text-end whitespace-nowrap">
                    {isAr ? 'إجراء' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => onInspectUser(user)}
                    className="hover:bg-[#F7F5EE] dark:hover:bg-[#1B271F] transition-colors cursor-pointer"
                  >
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className="shrink-0">
                          <AvatarRenderer
                            avatar={user.avatar}
                            size={38}
                            interactive={false}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#202923] dark:text-white truncate">
                            <span dir="ltr">@{user.username}</span>
                          </div>
                          <div className="text-xs text-[#778078] dark:text-slate-400 truncate">
                            <span>DEMO DATA</span>
                            {user.isActiveSessionUser && (
                              <>
                                <span className="mx-1.5" aria-hidden="true">·</span>
                                <span className="text-[#0B5D3B] dark:text-[#34D399] font-semibold">
                                  {isAr ? 'الجلسة الحالية' : 'Active session'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stable ID */}
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#202923] dark:text-slate-300 whitespace-nowrap">
                      <span dir="ltr">{user.id}</span>
                    </td>

                    {/* City & Source */}
                    <td className="py-3 px-4 text-xs text-[#778078] dark:text-slate-300 whitespace-nowrap">
                      <span className="font-semibold text-[#202923] dark:text-white">
                        {formatCity(user.city, language)}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>
                        {user.sourceKind === 'local_session'
                          ? isAr
                            ? 'حساب جلسة محلية'
                            : 'Local session'
                          : isAr
                          ? 'مرشح افتراضي'
                          : 'Mock candidate'}
                      </span>
                    </td>

                    {/* Profile Completion Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {user.isProfileCompleted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5D3B] dark:text-[#34D399]">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span>{isAr ? 'مكتمل' : 'Completed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309] dark:text-[#FBBF24]">
                          <Clock size={14} className="shrink-0" />
                          <span>
                            {user.completionStatus === 'partial'
                              ? isAr
                                ? 'غير مكتمل (جزئي)'
                                : 'Incomplete (Partial)'
                              : isAr
                              ? 'غير مكتمل (جديد)'
                              : 'Incomplete (0/15)'}
                          </span>
                        </span>
                      )}
                    </td>

                    {/* Questionnaire Progress */}
                    <td className="py-3 px-4 text-end font-mono tabular-nums whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5 justify-end">
                        <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full bg-[#0B5D3B] dark:bg-[#10B981]"
                            style={{ width: `${user.questionnaireCompletionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#202923] dark:text-white">
                          {user.answeredCount}/{user.totalQuestions} (
                          {user.questionnaireCompletionRate}%)
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectUser(user);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F4F2EC] hover:bg-[#DDF3E7] dark:bg-[#1F2C24] dark:hover:bg-[#0B5D3B]/50 text-[#0B5D3B] dark:text-[#34D399] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>{isAr ? 'معاينة الملف' : 'Inspect'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

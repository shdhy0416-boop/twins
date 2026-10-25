import React, { useMemo } from 'react';
import { Language } from '../../types';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import {
  AdminDemoUserRecord,
  formatQuestionAnswerForAdmin,
  getDemoUserTopMatches,
} from '../../services/adminService';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { RealisticIcon } from '../common/RealisticIcon';
import { formatCity } from '../../utils/localization';
import { X, CheckCircle2, Clock, Lock, Eye, EyeOff } from 'lucide-react';

interface AdminUserDetailModalProps {
  user: AdminDemoUserRecord | null;
  allUsers: AdminDemoUserRecord[];
  language: Language;
  onClose: () => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  user,
  allUsers,
  language,
  onClose,
}) => {
  const isAr = language === 'ar';
  const { activeQuestions, allDisplayQuestions } = useQuestionCatalog();

  const topMatches = useMemo(() => {
    if (!user) return [];
    return getDemoUserTopMatches(user, allUsers, 4);
  }, [user, allUsers]);

  const inspectionQuestions = useMemo(() => {
    if (!user) return [];
    const activeIds = new Set(activeQuestions.map((q) => q.id));
    return allDisplayQuestions.filter((q) => {
      if (activeIds.has(q.id)) return true;
      const ans = user.answers[q.id];
      return Array.isArray(ans) ? ans.length > 0 : Boolean(ans);
    });
  }, [user, activeQuestions, allDisplayQuestions]);

  if (!user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'تفاصيل المستخدم التجريبي' : 'Demo user profile inspection'}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-full bg-[#F8F7F2] dark:bg-[#111813] border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Modal Header */}
        <header className="px-6 py-4 bg-white dark:bg-[#162019] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400">
              <span>DEMO DATA RECORD</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span dir="ltr">{user.id}</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#202923] dark:text-white truncate mt-0.5">
              {isAr ? 'معاينة ملف وإجابات المستخدم التجريبي' : 'Demo Profile & Questionnaire Inspection'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        {/* Scrollable Inspection Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Identity & Status Summary */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center bg-transparent shrink-0">
                  <AvatarRenderer avatar={user.avatar} size={62} showBackdrop={false} interactive={false} />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-[#202923] dark:text-white">
                    <span dir="ltr">@{user.username}</span>
                  </h4>
                  <div className="text-xs text-[#778078] dark:text-slate-400 mt-1">
                    <span>{formatCity(user.city, language)}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{user.ageRange}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>
                      {user.sourceKind === 'local_session'
                        ? isAr
                          ? 'جلسة تجريبية محلية'
                          : 'Local Demo Session'
                        : isAr
                        ? 'ملف مجتمع تجريبي ثابت'
                        : 'Static Mock Community Pool'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-start sm:text-end font-mono tabular-nums">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5D3B] dark:text-[#34D399]">
                  {user.isProfileCompleted ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>{isAr ? 'الملف مكتمل' : 'Profile Completed'}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={14} className="text-[#D4AF37]" />
                      <span className="text-[#B45309] dark:text-[#FBBF24]">
                        {isAr ? 'الملف غير مكتمل' : 'Profile Incomplete'}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm font-extrabold text-[#202923] dark:text-white mt-1">
                  {user.answeredCount} / {user.totalQuestions}{' '}
                  {isAr ? 'سؤال مجاب' : 'questions answered'} ({user.questionnaireCompletionRate}%)
                </div>
              </div>
            </div>

            {user.bio ? (
              <p className="text-xs text-[#202923] dark:text-slate-300 leading-relaxed pt-3 border-t border-slate-100 dark:border-slate-800">
                {user.bio}
              </p>
            ) : (
              <p className="text-xs italic text-[#778078] dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isAr ? 'لم يتم إدخال نبذة تعريفية لهذا الحساب التجريبي.' : 'No bio provided on this demo record.'}
              </p>
            )}
          </div>

          {/* 2. Security & Privacy Flags Inspection (Zero Secrets Exposed) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-[#202923] dark:text-white">
                {isAr ? 'إعدادات الخصوصية وحماية الأسرار' : 'Privacy Flags & Credential Redaction'}
              </h5>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B5D3B] dark:text-[#34D399]">
                <Lock size={13} />
                <span>{isAr ? 'بدون بيانات سرية' : 'Secrets Redacted'}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200/70 dark:border-slate-800">
                <div className="text-[#778078] dark:text-slate-400">
                  {isAr ? 'إظهار المدينة' : 'Public City'}
                </div>
                <div className="font-bold text-[#202923] dark:text-white mt-1 inline-flex items-center gap-1">
                  {user.privacy.showCityPublicly ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{user.privacy.showCityPublicly ? (isAr ? 'مفعل' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200/70 dark:border-slate-800">
                <div className="text-[#778078] dark:text-slate-400">
                  {isAr ? 'إظهار الجنس' : 'Public Gender'}
                </div>
                <div className="font-bold text-[#202923] dark:text-white mt-1 inline-flex items-center gap-1">
                  {user.privacy.showGenderPublicly ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{user.privacy.showGenderPublicly ? (isAr ? 'مفعل' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200/70 dark:border-slate-800">
                <div className="text-[#778078] dark:text-slate-400">
                  {isAr ? 'إظهار الفئة العمرية' : 'Public Age Range'}
                </div>
                <div className="font-bold text-[#202923] dark:text-white mt-1 inline-flex items-center gap-1">
                  {user.privacy.showAgeRangePublicly ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{user.privacy.showAgeRangePublicly ? (isAr ? 'مفعل' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200/70 dark:border-slate-800">
                <div className="text-[#778078] dark:text-slate-400">
                  {isAr ? 'الظهور في الاستكشاف' : 'Discoverable'}
                </div>
                <div className="font-bold text-[#202923] dark:text-white mt-1 inline-flex items-center gap-1">
                  {user.privacy.allowDiscoverability ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{user.privacy.allowDiscoverability ? (isAr ? 'مفعل' : 'Enabled') : (isAr ? 'متوقف' : 'Disabled')}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#778078] dark:text-slate-400 pt-1">
              {isAr
                ? 'كلمات المرور، رموز التحقق (OTP)، مفاتيح الجلسة، وأرقام الهواتف الخام غير متاحة ولا يتم تخزينها في سجل الإدارة.'
                : 'Passwords, OTP tokens, session JWTs, and raw phone numbers are excluded by design.'}
            </div>
          </div>

          {/* 3. Simulated Top Compatibility Matches for This Demo User */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-[#202923] dark:text-white">
                {isAr ? 'أقرب التوائم التجريبيين لهذا الحساب' : 'Simulated Demo Compatibility Matches'}
              </h5>
              <span className="text-xs text-[#778078] dark:text-slate-400">
                {isAr ? 'حساب تجريبي' : 'Simulated demo'}
              </span>
            </div>

            {topMatches.length === 0 ? (
              <p className="text-xs text-[#778078] dark:text-slate-400">
                {isAr
                  ? 'لا توجد نتائج توافق لأن هذا الحساب التجريبي لم يُجب على الاستبيان بعد.'
                  : 'No compatibility pairs calculated yet because this demo profile has 0 questionnaire answers.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topMatches.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarRenderer
                        avatar={pair.userBAvatar}
                        size={32}
                        interactive={false}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#202923] dark:text-white truncate">
                          <span dir="ltr">@{pair.userBUsername}</span>
                        </div>
                        <div className="text-[11px] text-[#778078] dark:text-slate-400 font-mono tabular-nums">
                          {pair.sharedInterests.length}/{pair.comparedDimensionsCount}{' '}
                          {isAr ? 'مشترك' : 'shared'}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold font-mono tabular-nums text-[#0B5D3B] dark:text-[#34D399]">
                      {pair.similarityScore}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Questionnaire Answers Inspection */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h5 className="text-sm font-bold text-[#202923] dark:text-white">
                {isAr
                  ? `إجابات الاستبيان (${inspectionQuestions.length} سؤالاً)`
                  : `Questionnaire Responses (${inspectionQuestions.length} Questions)`}
              </h5>
              <span className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400">
                {user.answeredCount}/{user.totalQuestions}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {inspectionQuestions.map((q, index) => {
                const formatted = formatQuestionAnswerForAdmin(
                  q.id,
                  user.answers[q.id],
                  language
                );
                return (
                  <div
                    key={q.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200/70 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <RealisticIcon
                          name={q.options[0]?.iconKey || 'coffee'}
                          size={18}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#202923] dark:text-white">
                          <span className="font-mono tabular-nums text-[#778078] me-1.5">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          {isAr ? q.titleAr : q.titleEn}
                        </div>
                        <div className="text-[11px] font-mono text-[#778078] dark:text-slate-400">
                          {q.id}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs sm:text-end sm:max-w-[52%]">
                      {formatted ? (
                        <span className="font-bold text-[#0B5D3B] dark:text-[#34D399]">
                          {formatted}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">
                          {isAr ? 'غير مُجاب بعد' : 'Unanswered'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-3.5 bg-white dark:bg-[#162019] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-[#778078] dark:text-slate-400">
            {isAr ? 'وضع القراءة فقط — بيانات تجريبية' : 'Read-only inspection · Demo data'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق المعاينة' : 'Close Inspection'}
          </button>
        </footer>
      </div>
    </div>
  );
};

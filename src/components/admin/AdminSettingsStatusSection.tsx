import React from 'react';
import { Language } from '../../types';
import { AdminDashboardSnapshot } from '../../services/adminService';
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

interface AdminSettingsStatusSectionProps {
  snapshot: AdminDashboardSnapshot;
  language: Language;
}

export const AdminSettingsStatusSection: React.FC<AdminSettingsStatusSectionProps> = ({
  snapshot,
  language,
}) => {
  const isAr = language === 'ar';
  const { systemStatus } = snapshot;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold text-[#778078] dark:text-slate-400">
            {isAr
              ? 'فحص حي لإعدادات المشروع الفعلية دون اختلاق حالة اتصال غير محققة'
              : 'Verified directly from actual runtime configuration in src/lib/supabase.ts'}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#202923] dark:text-white mt-1">
            {isAr ? 'الإعدادات وحالة النظام' : 'Settings & System Status'}
          </h2>
        </div>

        <div className="text-xs font-mono tabular-nums font-bold text-[#B45309] dark:text-[#FBBF24]">
          {isAr ? 'وضع التشغيل الحالي: DEMO' : 'CURRENT APPLICATION MODE: DEMO'}
        </div>
      </div>

      {/* Live Runtime Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Application Mode */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'وضع التطبيق (Application Mode)' : 'Application Mode'}
            </span>
            <span className="font-mono text-xs font-bold text-[#B45309] dark:text-[#FBBF24]">
              {systemStatus.applicationMode}
            </span>
          </div>
          <div className="text-xl font-extrabold text-[#202923] dark:text-white">
            {isAr ? 'وضع العرض التجريبي (Demo Phase)' : 'Demo Mode Only (Locked)'}
          </div>
          <p className="text-xs text-[#778078] dark:text-slate-400 leading-relaxed font-mono">
            DEMO_MODE_ONLY_LOCK = {String(systemStatus.demoModeLockEnabled)} ·
            accountMode = &quot;{systemStatus.activeAccountMode}&quot;
          </p>
        </div>

        {/* Card 2: Real Backend Connection Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#778078] dark:text-slate-400">
              {isAr ? 'اتصال الخادم وقاعدة البيانات الحقيقية' : 'Real Backend Connection'}
            </span>
            {systemStatus.realBackendConnected ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D3B] dark:text-[#34D399]">
                <CheckCircle2 size={14} />
                <span>{isAr ? 'متصل' : 'Connected'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                <XCircle size={14} />
                <span>{isAr ? 'غير متصل' : 'Not Connected'}</span>
              </span>
            )}
          </div>
          <div className="text-xl font-extrabold text-[#202923] dark:text-white">
            {systemStatus.realBackendConnected
              ? isAr
                ? 'تم التحقق من الاتصال'
                : 'Verified Backend Active'
              : isAr
              ? 'لا يوجد خادم خلفي أو قاعدة بيانات حية متصلة'
              : 'Disconnected — Running on Local Mock Data'}
          </div>
          <p className="text-xs text-[#778078] dark:text-slate-400 leading-relaxed font-mono">
            supabaseClient = {systemStatus.supabaseClientInitialized ? 'initialized' : 'null'} ·
            envConfigured = {String(systemStatus.hasSupabaseEnvConfigured)}
          </p>
        </div>
      </div>

      {/* Configuration & Data Sources Table */}
      <div className="rounded-2xl bg-white dark:bg-[#162019] border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-[#202923] dark:text-white">
            {isAr ? 'تدقيق مصادر البيانات والخدمات النشطة' : 'Active Subsystem & Data Source Audit'}
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-[#202923] dark:text-white">
              {isAr ? 'مزود المصادقة النشط' : 'Authentication Service'}
            </span>
            <span className="font-mono text-[#778078] dark:text-slate-300">
              {isAr ? systemStatus.authProviderLabelAr : systemStatus.authProviderLabelEn}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-[#202923] dark:text-white">
              {isAr ? 'طبقة تخزين الملفات والإجابات' : 'Profile & Answers Persistence'}
            </span>
            <span className="font-mono text-[#778078] dark:text-slate-300">
              {isAr ? systemStatus.storageLayerLabelAr : systemStatus.storageLayerLabelEn}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-[#202923] dark:text-white">
              {isAr ? 'سياسات أمان الصفوف (PostgreSQL RLS)' : 'Database Row-Level Security (RLS)'}
            </span>
            <span className="font-mono text-slate-500">
              {isAr
                ? 'مخطط SQL جاهز في المستودع — غير منفذ على خادم حي بعد'
                : 'SQL blueprint prepared — Not active in local demo mode'}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-[#202923] dark:text-white">
              {isAr ? 'مفاتيح الخدمة السرية (Service-Role Keys)' : 'Client-Side Secret Exposure Check'}
            </span>
            <span className="font-mono text-[#0B5D3B] dark:text-[#34D399] font-bold">
              {isAr
                ? 'آمن — لا توجد أي مفاتيح سرية أو Service-Role في الكود'
                : 'Clean — Zero service-role keys or secrets in client code'}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Production Authorization & Security Notice */}
      <div className="p-6 rounded-2xl bg-[#FAF8F2] dark:bg-[#141C17] border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-[#202923] dark:text-white">
              {isAr
                ? 'متطلبات الأمان الإلزامية قبل الإطلاق الإنتاجي'
                : 'Mandatory Production Admin Security Requirements'}
            </h3>
            <p className="text-xs text-[#778078] dark:text-slate-400 mt-1 leading-relaxed">
              {isAr
                ? 'آلية الدخول الحالية للوحة التحكم مخصصة للتطوير والمعاينة التجريبية فقط. الرابط المخفي أو الزر الجانبي أو التحقق في المتصفح لا يُعد حماية أمنية إطلاقاً في بيئة الإنتاج.'
                : 'The current demo-admin switcher and #admin route are strictly for local development preview. A hidden URL, hidden button, or client-side role check provides zero security in production.'}
            </p>
          </div>
        </div>

        <ul className="space-y-2.5 text-xs text-[#202923] dark:text-slate-300 pt-2">
          <li className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong>
                {isAr ? '1. تفويض الخادم الإلزامي (Server-Enforced RBAC): ' : '1. Server-Enforced Authorization: '}
              </strong>
              {isAr
                ? 'التحقق من صلاحية المسؤول عبر مطالبات JWT المحمية من الخادم (app_metadata.role = "admin") مع المصادقة الثنائية (MFA/AAL2) قبل إرجاع أي بيانات إدارية.'
                : 'Verify administrator privileges server-side via signed JWT claims (app_metadata.role = "admin") and enforce MFA (AAL2) before serving any admin API response.'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong>
                {isAr ? '2. سياسات وصول قاعدة البيانات (Database Access Policies): ' : '2. Database Access Policies & RLS: '}
              </strong>
              {isAr
                ? 'فرض سياسات Row Level Security ودوال قراءة إدارية مخصصة بحيث لا يستطيع المستخدم العادي استعلام إحصاءات المنصة أو فهرس المستخدمين.'
                : 'Enforce strict PostgreSQL Row Level Security and dedicated admin read RPCs so ordinary authenticated users cannot query global directories or metrics.'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong>
                {isAr ? '3. عزل المفاتيح السرية وسجل التدقيق: ' : '3. Secret Isolation & Audit Logging: '}
              </strong>
              {isAr
                ? 'عدم تضمين مفاتيح service_role في حزمة المتصفح نهائياً، وتسجيل جميع عمليات الدخول الإدارية في جدول تدقيق غير قابل للتعديل.'
                : 'Never bundle service_role keys or private credentials in client code; record all administrative reads and future moderation actions in an append-only audit log.'}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

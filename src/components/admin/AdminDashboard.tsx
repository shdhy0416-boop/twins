import React, { useMemo, useState } from 'react';
import { Language, ThemeMode } from '../../types';
import {
  AdminDemoUserRecord,
  AdminSectionId,
  getAdminDashboardSnapshot,
} from '../../services/adminService';
import { AdminOverviewSection } from './AdminOverviewSection';
import { AdminUsersSection } from './AdminUsersSection';
import { AdminCompatibilitySection } from './AdminCompatibilitySection';
import { AdminQuestionnaireSection } from './AdminQuestionnaireSection';
import { AdminSettingsStatusSection } from './AdminSettingsStatusSection';
import { AdminUserDetailModal } from './AdminUserDetailModal';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  ArrowLeft,
  ArrowRight,
  Globe,
  Moon,
  Sun,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  activeUserId: string;
  language: Language;
  onToggleLanguage: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeUserId,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  onExitAdmin,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [inspectedUser, setInspectedUser] = useState<AdminDemoUserRecord | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [hasUnsavedCatalogEdits, setHasUnsavedCatalogEdits] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<
    { type: 'section'; section: AdminSectionId } | { type: 'exit' } | null
  >(null);

  const isAr = language === 'ar';

  const snapshot = useMemo(
    () => getAdminDashboardSnapshot(activeUserId),
    [activeUserId, refreshTick]
  );

  const requestSectionChange = (nextSection: AdminSectionId) => {
    if (nextSection === activeSection) return;
    if (activeSection === 'questionnaire' && hasUnsavedCatalogEdits) {
      setPendingNavAction({ type: 'section', section: nextSection });
      return;
    }
    setActiveSection(nextSection);
  };

  const requestExitAdmin = () => {
    if (activeSection === 'questionnaire' && hasUnsavedCatalogEdits) {
      setPendingNavAction({ type: 'exit' });
      return;
    }
    onExitAdmin();
  };

  const navItems: {
    id: AdminSectionId;
    labelEn: string;
    labelAr: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'overview',
      labelEn: 'Overview',
      labelAr: 'نظرة عامة',
      icon: <LayoutDashboard size={17} />,
    },
    {
      id: 'users',
      labelEn: 'User Management',
      labelAr: 'إدارة المستخدمين',
      icon: <Users size={17} />,
    },
    {
      id: 'compatibility',
      labelEn: 'Compatibility',
      labelAr: 'تحليل التوافق',
      icon: <BarChart3 size={17} />,
    },
    {
      id: 'questionnaire',
      labelEn: 'Question Management',
      labelAr: 'إدارة الأسئلة والفئات',
      icon: <ClipboardList size={17} />,
    },
    {
      id: 'settings',
      labelEn: 'Settings & Status',
      labelAr: 'الإعدادات والحالة',
      icon: <Settings size={17} />,
    },
  ];

  const activeNavMeta =
    navItems.find((item) => item.id === activeSection) || navItems[0];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen w-full bg-[#F8F7F2] dark:bg-[#0E1511] text-[#202923] dark:text-[#F8F7F2] flex flex-col transition-colors"
    >
      {/* Top Administrative Bar (3-Zone Clean Workspace Contract) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#131C16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Title */}
          <button
            type="button"
            onClick={() => requestSectionChange('overview')}
            className="text-base sm:text-lg font-extrabold tracking-tight text-[#0B5D3B] dark:text-[#34D399] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAr ? 'لوحة إدارة توأم التجريبية' : 'TWIN Admin Console'}
          </button>

          {/* Zone 2: Desktop Horizontal Section Links (Clean Typography) */}
          <nav
            aria-label={isAr ? 'أقسام لوحة الإدارة' : 'Admin sections'}
            className="hidden xl:flex items-center gap-6 text-sm font-bold text-[#778078] dark:text-slate-400"
          >
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => requestSectionChange(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'text-[#0B5D3B] dark:text-[#34D399] border-[#0B5D3B] dark:border-[#34D399]'
                      : 'border-transparent hover:text-[#202923] dark:hover:text-white'
                  }`}
                >
                  {isAr ? item.labelAr : item.labelEn}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Language Switcher + Primary Return Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleLanguage}
              title={isAr ? 'التبديل إلى اللغة الإنجليزية (English)' : 'Switch language to Arabic (العربية)'}
              aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
              className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#EEF8F2] dark:bg-[#18221C] dark:hover:bg-[#1E2E24] border border-[#0B5D3B]/30 dark:border-[#34D399]/35 text-[#0B5D3B] dark:text-[#34D399] text-xs font-extrabold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <Globe size={15} className="text-[#0B5D3B] dark:text-[#34D399] shrink-0" />
              <span>{isAr ? 'English' : 'العربية'}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#0B5D3B]/10 dark:bg-[#34D399]/15 text-[10px] font-mono font-bold tracking-wider">
                {isAr ? 'EN' : 'AR'}
              </span>
            </button>

            <button
              type="button"
              onClick={requestExitAdmin}
              className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#08422A] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span>{isAr ? 'العودة لتطبيق المستخدم' : 'Return to User App'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Workspace (260px Sidebar on Desktop + Content Canvas) */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col justify-between p-5 border-e border-slate-200/90 dark:border-slate-800 bg-[#FAF9F5] dark:bg-[#121A15]">
          <div className="space-y-6">
            {/* Workspace Context */}
            <div className="px-2 space-y-1">
              <div className="text-xs font-mono tabular-nums text-[#778078] dark:text-slate-400">
                DEMO PHASE · LOCAL STORAGE
              </div>
              <div className="text-xs text-[#202923] dark:text-slate-300 leading-relaxed">
                {isAr
                  ? 'مراقبة الحسابات التجريبية، إدارة فئات الاستبيان، وإحصاءات التوافق.'
                  : 'Owner workspace for demo users, category question management, and compatibility.'}
              </div>
            </div>

            {/* Sidebar Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => requestSectionChange(item.id)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#0B5D3B] text-white'
                        : 'text-[#202923] dark:text-slate-300 hover:bg-[#EAE7DD] dark:hover:bg-[#1B271F]'
                    }`}
                  >
                    <span
                      className={
                        isActive ? 'text-[#D4AF37]' : 'text-[#778078] dark:text-slate-400'
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Workspace Preferences Controls (Language, Theme, Refresh) */}
          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleLanguage}
                className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#202923] dark:text-white inline-flex items-center justify-center gap-1.5 hover:border-[#0B5D3B] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Globe size={13} className="text-[#0B5D3B] dark:text-[#34D399]" />
                <span>{isAr ? 'English' : 'العربية'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isAr ? 'تبديل المظهر' : 'Toggle theme'}
                className="w-9 h-9 rounded-xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#202923] dark:text-white hover:border-[#0B5D3B] transition-colors cursor-pointer shrink-0"
              >
                {theme === 'dark' ? (
                  <Sun size={14} className="text-[#D4AF37]" />
                ) : (
                  <Moon size={14} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRefreshTick((t) => t + 1)}
                title={isAr ? 'تحديث البيانات المحلية' : 'Refresh local demo metrics'}
                aria-label={isAr ? 'تحديث البيانات المحلية' : 'Refresh local demo metrics'}
                className="w-9 h-9 rounded-xl bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#202923] dark:text-white hover:border-[#0B5D3B] transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile / Tablet Compact Toolbar & Section Tabs */}
        <div className="lg:hidden bg-[#FAF9F5] dark:bg-[#121A15] border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-[#778078] dark:text-slate-400">
              {isAr ? `القسم: ${activeNavMeta.labelAr}` : `Section: ${activeNavMeta.labelEn}`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleLanguage}
                className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Globe size={12} className="text-[#0B5D3B] dark:text-[#34D399]" />
                <span>{isAr ? 'EN' : 'العربية'}</span>
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isAr ? 'تبديل المظهر' : 'Toggle theme'}
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun size={13} className="text-[#D4AF37]" />
                ) : (
                  <Moon size={13} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setRefreshTick((t) => t + 1)}
                aria-label={isAr ? 'تحديث' : 'Refresh'}
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#18221C] border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => requestSectionChange(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0B5D3B] text-white'
                      : 'bg-white dark:bg-[#18221C] text-[#202923] dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {item.icon}
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Development-Only Demo Admin Access Banner */}
          <div className="p-3.5 sm:px-4 rounded-xl bg-[#EEF8F2] dark:bg-[#13251B] border border-[#0B5D3B]/25 dark:border-[#10B981]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2.5 text-[#08422A] dark:text-[#DDF3E7]">
              <ShieldAlert size={16} className="text-[#D4AF37] shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {isAr
                  ? 'بيئة إدارة تجريبية للتطوير فقط (DEMO MODE) — معزولة عن تنقل المستخدمين العاديين ولا تمثل مصادقة مسؤول إنتاجية.'
                  : 'Development-Only Demo Admin Workspace — Isolated from ordinary user navigation. Production requires server-enforced RBAC & RLS.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => requestSectionChange('settings')}
              className="text-xs font-bold text-[#0B5D3B] dark:text-[#34D399] hover:underline whitespace-nowrap shrink-0 self-end sm:self-center cursor-pointer"
            >
              {isAr ? 'مراجعة متطلبات الأمان' : 'Security requirements'}
            </button>
          </div>

          {/* Active Section View */}
          {activeSection === 'overview' && (
            <AdminOverviewSection
              snapshot={snapshot}
              language={language}
              onNavigateSection={requestSectionChange}
              onInspectUser={setInspectedUser}
            />
          )}

          {activeSection === 'users' && (
            <AdminUsersSection
              users={snapshot.users}
              language={language}
              onInspectUser={setInspectedUser}
            />
          )}

          {activeSection === 'compatibility' && (
            <AdminCompatibilitySection
              snapshot={snapshot}
              language={language}
            />
          )}

          {activeSection === 'questionnaire' && (
            <AdminQuestionnaireSection
              snapshot={snapshot}
              language={language}
              onCatalogChanged={() => setRefreshTick((t) => t + 1)}
              onDirtyStateChange={setHasUnsavedCatalogEdits}
            />
          )}

          {activeSection === 'settings' && (
            <AdminSettingsStatusSection
              snapshot={snapshot}
              language={language}
            />
          )}
        </main>
      </div>

      {/* Demo User Profile & Answers Slide-Over Modal */}
      <AdminUserDetailModal
        user={inspectedUser}
        allUsers={snapshot.users}
        language={language}
        onClose={() => setInspectedUser(null)}
      />

      {/* Unsaved Category Edits Navigation Guard Modal */}
      {pendingNavAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPendingNavAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#162019] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-extrabold text-[#202923] dark:text-white">
              {isAr
                ? 'لديك تغييرات غير محفوظة في إدارة الأسئلة'
                : 'Unsaved Category Edits'}
            </h4>
            <p className="text-xs text-[#778078] dark:text-slate-300 leading-relaxed">
              {isAr
                ? 'مغادرة هذا القسم الآن ستتجاهل التعديلات غير المحفوظة على الفئة المفتوحة.'
                : 'Leaving Question Management now will discard unsaved edits on the currently open category.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingNavAction(null)}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] text-white text-xs font-bold cursor-pointer"
              >
                {isAr ? 'البقاء وحفظ التغييرات' : 'Stay & Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingNavAction;
                  setPendingNavAction(null);
                  setHasUnsavedCatalogEdits(false);
                  if (action.type === 'exit') {
                    onExitAdmin();
                  } else {
                    setActiveSection(action.section);
                  }
                }}
                className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                {isAr ? 'مغادرة وتجاهل التغييرات' : 'Discard & Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

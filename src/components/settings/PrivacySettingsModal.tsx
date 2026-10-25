import React, { useState } from 'react';
import { PrivacySettings, Language } from '../../types';
import { TactilePillButton } from '../common/TactilePillButton';
import { ShieldCheck, Lock, Eye, X, Check } from 'lucide-react';

interface PrivacySettingsModalProps {
  privacy: PrivacySettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrivacy: PrivacySettings) => void;
  language: Language;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  privacy,
  isOpen,
  onClose,
  onSave,
  language,
}) => {
  const [settings, setSettings] = useState<PrivacySettings>({ ...privacy });

  if (!isOpen) return null;

  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const options: {
    key: keyof PrivacySettings;
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
  }[] = [
    {
      key: 'showCityPublicly',
      titleEn: 'Show City to Other Twins',
      titleAr: 'إظهار المدينة في ملفك للتوائم',
      descEn: 'Allows people from your city or neighborhood to see you in regional discovery',
      descAr: 'يسمح لأعضاء منطقتك أو حيك بمشاهدتك في استكشاف الأعضاء القريبين',
    },
    {
      key: 'showAgeRangePublicly',
      titleEn: 'Show Age Range',
      titleAr: 'إظهار الفئة العمرية',
      descEn: 'Displays approximate age bracket (e.g. 24-28) on your profile card',
      descAr: 'يعرض فئتك العمرية التقريبية لتقريب التوافق العمري',
    },
    {
      key: 'showGenderPublicly',
      titleEn: 'Show Gender',
      titleAr: 'إظهار الجنس',
      descEn: 'Optionally show your gender publicly',
      descAr: 'إمكانية إظهار أو إخفاء الجنس في ملفك الشخصي',
    },
    {
      key: 'allowDiscoverability',
      titleEn: 'Allow Discoverability in Search',
      titleAr: 'السماح بالظهور في البحث والاستكشاف',
      descEn: 'Keep your profile active in the twin matching pool',
      descAr: 'إبقاء ملفك نشطاً للمطابقة الحسابية وظهور التوائم',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#18211B] rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DDF3E7] dark:bg-[#0B5D3B]/40 flex items-center justify-center text-[#0B5D3B] dark:text-[#34D399]">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#202923] dark:text-white">
                {language === 'ar' ? 'إعدادات الخصوصية والظهور' : 'Privacy & Visibility'}
              </h3>
              <span className="text-[10px] text-[#778078] dark:text-slate-400">
                {language === 'ar' ? 'تحكم كامل في بياناتك وظهورك' : 'Full control over your visibility'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Invariant security badge */}
        <div className="my-4 p-3 rounded-2xl bg-[#E8F7EE] dark:bg-[#122A1E] border border-[#0B5D3B]/20 text-[#07472B] dark:text-[#34D399] text-xs flex items-center gap-2">
          <ShieldCheck size={16} className="shrink-0 text-[#10B981]" />
          <span className="text-[11px] font-bold">
            {language === 'ar'
              ? 'مبدأ الأمان الصارم: رقم الجوال والإحداثيات الدقيقة لا تُشارك إطلاقاً مع أي شخص.'
              : 'Zero-Leak Principle: Phone number and exact GPS coordinates are NEVER shared.'}
          </span>
        </div>

        {/* Toggles */}
        <div className="space-y-3 my-4">
          {options.map((opt) => {
            const enabled = Boolean(settings[opt.key]);

            return (
              <div
                key={opt.key}
                onClick={() => handleToggle(opt.key)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#131915] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="pr-3 rtl:pr-0 rtl:pl-3">
                  <h4 className="text-xs font-black text-[#202923] dark:text-white">
                    {language === 'ar' ? opt.titleAr : opt.titleEn}
                  </h4>
                  <p className="text-[10px] text-[#778078] dark:text-slate-400 mt-0.5">
                    {language === 'ar' ? opt.descAr : opt.descEn}
                  </p>
                </div>

                <div
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                    enabled ? 'bg-[#0B5D3B]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action */}
        <TactilePillButton
          variant="primary"
          size="md"
          className="w-full mt-2"
          onClick={() => {
            onSave(settings);
            onClose();
          }}
        >
          {language === 'ar' ? 'حفظ التعديلات' : 'Save Settings'}
        </TactilePillButton>
      </div>
    </div>
  );
};

import { Language } from '../types';

export const SAUDI_CITIES: Record<string, { en: string; ar: string }> = {
  Riyadh: { en: 'Riyadh', ar: 'الرياض' },
  Jeddah: { en: 'Jeddah', ar: 'جدة' },
  Makkah: { en: 'Makkah', ar: 'مكة المكرمة' },
  Madinah: { en: 'Madinah', ar: 'المدينة المنورة' },
  Dammam: { en: 'Dammam', ar: 'الدمام' },
  Khobar: { en: 'Khobar', ar: 'الخبر' },
  Abha: { en: 'Abha', ar: 'أبها' },
  Dhahran: { en: 'Dhahran', ar: 'الظهران' },
  Tabuk: { en: 'Tabuk', ar: 'تبوك' },
  Qassim: { en: 'Qassim', ar: 'القصيم' },
  Taif: { en: 'Taif', ar: 'الطائف' },
  Jazan: { en: 'Jazan', ar: 'جازان' },
  Dubai: { en: 'Dubai', ar: 'دبي' },
};

export function formatCity(cityKey: string, lang: Language): string {
  if (!cityKey) return lang === 'ar' ? 'الرياض' : 'Riyadh';
  const found = SAUDI_CITIES[cityKey];
  if (found) {
    return lang === 'ar' ? found.ar : found.en;
  }
  return cityKey;
}

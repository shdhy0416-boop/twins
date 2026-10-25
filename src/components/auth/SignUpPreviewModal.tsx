import React, { useState } from 'react';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  validateUsername,
  isUsernameAvailable,
} from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Lock, ShieldCheck, ArrowRight, ArrowLeft, Check, Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';

interface SignUpPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (username: string, city: string, phone?: string) => void;
  language: Language;
}

export const SignUpPreviewModal: React.FC<SignUpPreviewModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<'phone' | 'otp' | 'identity'>('phone');
  const [phone, setPhone] = useState('+966 50 492 8172');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('rayan_riyadh');
  const [city, setCity] = useState('Riyadh');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<{ checked: boolean; available: boolean; error?: string }>({
    checked: true,
    available: true,
  });

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await sendPhoneOtp(phone);
    setIsLoading(false);

    if (res.success) {
      setStep('otp');
    } else {
      setErrorMessage(res.error || 'Failed to send verification code. Please check your number.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await verifyPhoneOtp(phone, otp);
    setIsLoading(false);

    if (res.success) {
      setStep('identity');
    } else {
      setErrorMessage(res.error || 'Invalid code. Please check and try again.');
    }
  };

  const handleUsernameChange = async (val: string) => {
    const formatted = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(formatted);
    const validation = validateUsername(formatted);

    if (!validation.isValid) {
      setUsernameStatus({ checked: true, available: false, error: validation.error });
      return;
    }

    const available = await isUsernameAvailable(formatted);
    setUsernameStatus({
      checked: true,
      available,
      error: available ? undefined : 'This username is already taken by another Twin.',
    });
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameStatus.available) {
      setErrorMessage(usernameStatus.error || 'Please choose an available username.');
      return;
    }
    onComplete(username, city, phone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#18221C] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-2 text-xs text-red-700 dark:text-red-300 animate-shake">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone Entry with Security Guarantee */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#DDF3E7] dark:bg-[#0B5D3B]/25 text-[#0B5D3B] dark:text-[#DDF3E7] flex items-center justify-center mb-3">
                <Lock size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#202923] dark:text-white leading-tight">
                {t.signUpTitle}
              </h2>
              <p className="mt-1 text-xs text-[#778078] dark:text-slate-400 leading-relaxed">
                {t.signUpSubtitle}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#778078] mb-1.5">
                {language === 'ar' ? 'رقم الهاتف المتنقل (صيغة دولية)' : 'Mobile Phone (E.164)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200 dark:border-slate-800 text-sm font-medium text-[#202923] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B5D3B]"
                placeholder={t.phonePlaceholder}
              />
            </div>

            {/* Invariant guarantee banner */}
            <div className="p-3 rounded-2xl bg-[#DDF3E7]/50 dark:bg-[#0B5D3B]/20 border border-[#0B5D3B]/20 flex items-center gap-2 text-xs text-[#0B5D3B] dark:text-[#DDF3E7]">
              <ShieldCheck size={16} className="shrink-0" />
              <span className="text-[11px] font-semibold leading-tight">
                {language === 'ar'
                  ? 'رقمك سري ومحمي 100%. لن يظهر لأي مستخدم آخر.'
                  : 'Your phone number is completely private and never shown.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-[#0B5D3B] hover:bg-[#08422A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0B5D3B]/20 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <>
                  <span>{t.sendCode}</span>
                  {language === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
            <div>
              <h2 className="text-lg font-bold text-[#202923] dark:text-white leading-tight">
                {t.otpTitle}
              </h2>
              <p className="mt-1 text-xs text-[#778078] dark:text-slate-400">
                {t.otpSubtitle}
              </p>
            </div>

            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="w-full h-14 text-center tracking-widest text-2xl font-bold font-mono rounded-2xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200 dark:border-slate-800 text-[#0B5D3B] dark:text-[#DDF3E7] focus:outline-none focus:ring-2 focus:ring-[#0B5D3B]"
                placeholder="• • • •"
              />
              {!isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={() => setOtp('1234')}
                  className="mt-2 text-[11px] text-[#0B5D3B] dark:text-[#DDF3E7] font-semibold underline block mx-auto text-center"
                >
                  {t.demoCodeHint}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-[#0B5D3B] hover:bg-[#08422A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0B5D3B]/20 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <>
                  <Check size={18} />
                  <span>{t.verifyCode}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Username & City Setup */}
        {step === 'identity' && (
          <form onSubmit={handleFinish} className="space-y-4 pt-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] uppercase tracking-wide">
                <Sparkles size={14} />
                <span>{language === 'ar' ? 'هوية التوأم' : 'Twin Identity'}</span>
              </div>
              <h2 className="text-lg font-bold text-[#202923] dark:text-white leading-tight mt-1">
                {t.chooseUsername}
              </h2>
              <p className="text-xs text-[#778078] dark:text-slate-400">
                {t.usernameHint}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#778078]">
                  {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                </label>
                {usernameStatus.checked && (
                  <span
                    className={`text-[11px] font-semibold ${
                      usernameStatus.available ? 'text-[#0B5D3B]' : 'text-red-500'
                    }`}
                  >
                    {usernameStatus.available
                      ? language === 'ar' ? 'متاح ✓' : 'Available ✓'
                      : language === 'ar' ? 'غير متاح ✗' : 'Unavailable ✗'}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                className={`w-full h-12 px-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#111813] border text-sm font-semibold text-[#202923] dark:text-white focus:outline-none focus:ring-2 ${
                  usernameStatus.available
                    ? 'border-slate-200 dark:border-slate-800 focus:ring-[#0B5D3B]'
                    : 'border-red-400 focus:ring-red-400'
                }`}
              />
              {usernameStatus.error && (
                <span className="text-[11px] text-red-500 mt-1 block">
                  {usernameStatus.error}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#778078] mb-1">
                {t.cityLabel}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#F8F7F2] dark:bg-[#111813] border border-slate-200 dark:border-slate-800 text-sm font-semibold text-[#202923] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B5D3B]"
              >
                <option value="Riyadh">Riyadh (الرياض)</option>
                <option value="Jeddah">Jeddah (جدة)</option>
                <option value="Dubai">Dubai (دبي)</option>
                <option value="Khobar">Khobar (الخبر)</option>
                <option value="Doha">Doha (الدوحة)</option>
                <option value="Abu Dhabi">Abu Dhabi (أبوظبي)</option>
                <option value="Cairo">Cairo (القاهرة)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!usernameStatus.available}
              className="w-full h-12 rounded-2xl bg-[#0B5D3B] hover:bg-[#08422A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0B5D3B]/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span>{t.continueBtn}</span>
              {language === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

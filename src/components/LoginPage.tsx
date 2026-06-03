import React, { useState } from 'react';
import { ShieldCheck, Stethoscope, Users, KeyRound, Globe, ArrowRightLeft, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: { role: 'doctor' | 'assistant' | 'receptionist'; name: string }) => void;
  lang: 'ar' | 'fr';
  setLang: (lang: 'ar' | 'fr') => void;
}

export default function LoginPage({
  onLoginSuccess,
  lang,
  setLang
}: LoginPageProps) {
  const [role, setRole] = useState<'doctor' | 'assistant' | 'receptionist'>('doctor');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    // Hardcoded passwords
    const correctPasswords = {
      doctor: '1111',
      assistant: '2222',
      receptionist: '3333'
    };

    if (password === correctPasswords[role]) {
      const names = {
        doctor: lang === 'ar' ? 'طبيب (د. أحمد الصالح)' : 'Médecin (Dr. Ahmed Essaleh)',
        assistant: lang === 'ar' ? 'المساعد الطبي' : 'Assistant Médical',
        receptionist: lang === 'ar' ? 'موظف الاستقبال' : 'Réceptionniste / Accueil'
      };

      onLoginSuccess({
        role,
        name: names[role]
      });
    } else {
      setErrorText(
        lang === 'ar' 
          ? '❌ رمز المرور المدخل غير صحيح! يرجى الاستعانة بالبطاقة التوضيحية أدناه.' 
          : '❌ Mot de passe incorrect ! Veuillez vous référer à l\'aide ci-dessous.'
      );
    }
  };

  const rolesConfig = [
    {
      id: 'doctor' as const,
      titleAr: 'طبيب العيادة الأخصائي',
      titleFr: 'Médecin Praticien',
      icon: Stethoscope,
      bg: 'bg-teal-50 hover:bg-teal-100/60 dark:bg-teal-950/20 text-teal-800 dark:text-teal-400 border-teal-200 dark:border-teal-900',
      activeBg: 'bg-teal-600 text-white border-teal-600 dark:bg-teal-600 dark:border-teal-500',
      descAr: 'صلاحيات مطلقة: السجلات، الجلسات، دليل الأدوية، والتقارير المالية والتحليلات.',
      descFr: 'Accès total aux dossiers, prescriptions, pharmacopée et comptabilité clinique.'
    },
    {
      id: 'assistant' as const,
      titleAr: 'المساعد الطبي المعتمد',
      titleFr: 'Assistant Médical',
      icon: Users,
      bg: 'bg-blue-50 hover:bg-blue-100/60 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900',
      activeBg: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500',
      descAr: 'صلاحيات إدارة المرضى، المواعيد، تدوين الفواعل التشخيصية، والاطلاع على دليل الأدوية.',
      descFr: 'Accès de consultation patient, calendrier de consultations et encyclopédie dentaire.'
    },
    {
      id: 'receptionist' as const,
      titleAr: 'موظف الاستقبال والتنسيق',
      titleFr: 'Réceptionniste de l\'Accueil',
      icon: ShieldCheck,
      bg: 'bg-purple-50 hover:bg-purple-100/60 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-900',
      activeBg: 'bg-purple-600 text-white border-purple-600 dark:bg-purple-600 dark:border-purple-500',
      descAr: 'صلاحيات محصورة في برمجة وجدولة مواعيد المراجعين وتأكيدات الواتساب فقط.',
      descFr: 'Accès limité à la planification horaire et aux rappels WhatsApp patients.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between items-center p-4 md:p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top language selector option */}
      <div className="w-full max-w-4xl flex justify-between items-center pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-sm shadow-xs">
            🦷
          </div>
          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
            {lang === 'ar' ? 'بوابة إدارة عيادة الأسنان الحديثة' : 'Portail Clinique Dentaire'}
          </span>
        </div>

        <button
          onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 cursor-pointer h-8 transition-colors shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
        </button>
      </div>

      {/* Center login card */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-1.5">
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">
            {lang === 'ar' ? 'تسجيل الدخول للنظام الطبي الموحد' : 'Connexion à l\'Espace Clinique'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'يرجى اختيار هويتك الوظيفية وكتابة الرمز السري المصاحب للولوج للوحة التحكم' : 'Veuillez sélectionner votre profil et composer le code d\'accès requis.'}
          </p>
        </div>

        {/* Roles selections list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rolesConfig.map((item) => {
            const Icon = item.icon;
            const isSelected = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRole(item.id);
                  setPassword('');
                  setErrorText(null);
                }}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between text-xs font-bold h-36 relative cursor-pointer ${
                  isSelected ? item.activeBg : item.bg
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-white ring-2 ring-emerald-400 animate-ping"></span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-[12px] mb-1">
                    {lang === 'ar' ? item.titleAr : item.titleFr}
                  </h4>
                  <p className={`text-[10px] leading-tight font-medium opacity-85 ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                    {lang === 'ar' ? item.descAr : item.descFr}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* PIN/Password Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold">
              {errorText}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {lang === 'ar' ? `الرقم السري الخاص بـ (${role === 'doctor' ? 'الطبيب الطبيب' : role === 'assistant' ? 'المساعد المساعد' : 'الاستقبال الاستقبال'}):` : `Code PIN d'accès pour (${role}) :`}
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-sm p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-widest font-black"
                maxLength={8}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title={showPassword ? 'إخفاء الرمز' : 'عرض الرمز'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1a365d] hover:bg-indigo-950 text-white font-extrabold text-xs py-3 rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1"
          >
            <span>{lang === 'ar' ? 'تأكيد الرمز والدخول المنظومة' : 'Accéder au cabinet'}</span>
          </button>
        </form>

        {/* Credentials guide block */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <span>💡</span>
            <span>{lang === 'ar' ? 'فهرس الرموز الافتراضية للعيادة (الدليل الإرشادي)' : 'GUIDE DES CODES PIN PAR DÉFAUT'}</span>
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono font-bold">
            <div className="p-1.5 bg-white dark:bg-slate-900 border rounded-lg">
              <span className="text-teal-600 dark:text-teal-400">طبيب {lang === 'ar' ? '' : '(Doc)'}</span>
              <p className="text-slate-800 dark:text-slate-100 mt-0.5">1111</p>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-900 border rounded-lg">
              <span className="text-blue-600 dark:text-blue-400">مساعد {lang === 'ar' ? '' : '(Asst)'}</span>
              <p className="text-slate-800 dark:text-slate-100 mt-0.5">2222</p>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-900 border rounded-lg">
              <span className="text-purple-600 dark:text-purple-400">استقبال {lang === 'ar' ? '' : '(Rec)'}</span>
              <p className="text-slate-800 dark:text-slate-100 mt-0.5">3333</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-[10px] text-slate-400 font-medium">
        © {lang === 'ar' ? 'نظام عيادتي لإدارة جراحة وطب الأسنان الرقمي' : 'Solution Intégrée DentClinic v2.5'}
      </div>
    </div>
  );
}

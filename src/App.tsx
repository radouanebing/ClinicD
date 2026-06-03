/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ClinicData, Patient, Appointment, Prescription, DentalMedicationInfo, TodoTask, WhatsappSettings } from './types';
import Dashboard from './components/Dashboard';
import PatientsManager from './components/PatientsManager';
import AppointmentsManager from './components/AppointmentsManager';
import PrescriptionGenerator from './components/PrescriptionGenerator';
import MedsEncyclopedia from './components/MedsEncyclopedia';
import FinancialReports from './components/FinancialReports';
import LoginPage from './components/LoginPage';
import BackupSystem from './components/BackupSystem';
import WhatsappConfiguration from './components/WhatsappConfiguration';
import { LayoutDashboard, Users, Calendar, FileText, BookOpen, Menu, X, ShieldAlert, CheckCircle2, DollarSign, Globe, Moon, Sun, LogOut, MessageSquare } from 'lucide-react';
import { Language, getTranslation } from './translations';

export default function App() {
  const [data, setData] = useState<ClinicData>({
    patients: [],
    appointments: [],
    prescriptions: [],
    customMedications: [],
    doctorName: 'د. أحمد الصالح',
    doctorSpecialty: 'أخصائي جراحة الفك',
    clinicName: 'عيادتي الرقمية',
    todoTasks: [],
    currency: 'د.م'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User session state (طبيب، مساعد، استقبال)
  const [currentUser, setCurrentUser] = useState<{ role: 'doctor' | 'assistant' | 'receptionist'; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem('clinic_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'appointments' | 'prescriptions' | 'meds' | 'financials' | 'whatsapp_config'>('dashboard');

  // Mobile sidebar drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state notification
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  // Language & Dark/Night Mode persistent states
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('clinic_lang') as Language) || 'ar';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('clinic_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('clinic_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('clinic_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch full database loaded on boots
  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('خطأ في جلب بيانات العيادة');
        return res.json();
      })
      .then((fetchedData: ClinicData) => {
        if (!fetchedData.whatsappSettings) {
          fetchedData.whatsappSettings = {
            defaultTimingHoursBefore: 24,
            defaultTemplateType: 'standard',
            doctorSignatureAr: 'مع تحيات الطاقم الطبي للعيادة.',
            doctorSignatureFr: 'Cordialement, l’équipe du cabinet dentaire.',
            senderRoleAllowed: 'any',
            autoOpenWebAfterSend: true,
            clinicWhatsappPhone: '',
            globalRemindersEnabled: true,
            templatesAr: {
              standard: 'مرحباً {patientName}، 🌸\n\nنود تذكيركم بموعدكم المقرّر في عيادة الأسنان:\n📅 التاريخ: {dateFormatted}\n⏰ الوقت: {timeFormatted}\n🦷 المعالجة: {treatmentType}\n\nيرجى تأكيد حضوركم بالرد هنا. دمتم سالمين!',
              reschedule: 'مرحباً {patientName}، 🌸\n\nبناءً على جدول العيادة والمواعيد، نقترح تعديل وقت جلستكم السنية ليصبح:\n📅 التاريخ الجديد: {dateFormatted}\n⏰ الوقت الجديد: {timeFormatted}\n\nهل هذا التوقيت يناسبكم؟ يرجى الرد للتأكيد. شكراً لكم!',
              postop: 'مرحباً {patientName}، 🦷\n\nنطمئن على حالتكم بعد العلاج لـ ({treatmentType}).\n\n📌 إرشادات التعافي الرعاية:\n- تناول الأغذية والأشربة الدافئة أو الباردة فقط اليوم.\n- الالتزام بالوصفة العلاجية الموصى بها.\n\nنتمنى لكم شفاءً عاجلاً وراحة تامة!',
              warning: 'تنبيه عاجل لـ {patientName}، 🚨\n\nيرجى العلم أن جلستكم العلاجية ستبدأ في تمام الساعة: {timeFormatted}.\n\nالرجاء الحضور قبل الجلسة بـ 15 دقيقة تفادياً لإلغائها بسبب ضغط جدول الطبيب. شكراً لتعاونكم!'
            },
            templatesFr: {
              standard: 'Bonjour {patientName}, 🌸\n\nNous vous rappelons votre prochain RDV au cabinet dentaire :\n📅 Date : {dateFormatted}\n⏰ Heure : {timeFormatted}\n🦷 Acte : {treatmentType}\n\nMerci de confirmer votre présence. Bien à vous !',
              reschedule: 'Bonjour {patientName}, 🌸\n\nNous vous proposons de reporter votre rendez-vous de soins au :\n📅 Nouvelle Date : {dateFormatted}\n⏰ Nouvel Horaire : {timeFormatted}\n\nEst-ce que cela vous convient ? Merci de répondre.',
              postop: 'Bonjour {patientName}, 🦷\n\nNous espérons que vous vous portez bien après votre intervention de ({treatmentType}).\n\n📌 Rappel des consignes de soins :\n- Aliments tièdes ou froids aujourd’hui.\n- Suivez bien votre ordonnance de médicaments.\n\nBon rétablissement !',
              warning: 'IMPORTANT : Bonjour {patientName}, 🚨\n\nVotre rendez-vous de soins est fixé à {timeFormatted}.\n\nMerci d’arriver 10 minutes en avance pour éviter toute annulation. Merci de votre retour !'
            }
          };
        }
        setData(fetchedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('تعذر تحميل قاعدة البيانات الرئيسية للعيادة. يرجى تجربة إعادة تشغيل الخادم.');
        setLoading(false);
      });
  }, []);

  // Sync state back to disk
  const syncStore = async (updated: ClinicData) => {
    setSyncStatus('saving');
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('فشل تخزين البيانات على خادم العيادة');
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  // 1. Patient Operations
  const handleSavePatient = (p: Patient) => {
    const clone = [...data.patients];
    const index = clone.findIndex((item) => item.id === p.id);
    if (index >= 0) {
      clone[index] = p;
    } else {
      clone.push(p);
    }

    const updatedData = { ...data, patients: clone };
    
    // Auto-update cached patient names or details in appointments
    const updatedAppointments = data.appointments.map(appt => {
      if (appt.patientId === p.id) {
        return {
          ...appt,
          patientName: p.name,
          patientPhone: p.phone
        };
      }
      return appt;
    });

    syncStore({ ...updatedData, appointments: updatedAppointments });
  };

  const handleDeletePatient = (patientId: string) => {
    const updatedPatients = data.patients.filter((item) => item.id !== patientId);
    
    // Cascade delete related appointments and prescriptions to prevent orphans
    const updatedAppointments = data.appointments.filter((appt) => appt.patientId !== patientId);
    const updatedPrescriptions = data.prescriptions.filter((pres) => pres.patientId !== patientId);

    syncStore({
      ...data,
      patients: updatedPatients,
      appointments: updatedAppointments,
      prescriptions: updatedPrescriptions
    });
  };

  // 2. Appointment Operations
  const handleSaveAppointment = (appt: Appointment) => {
    const clone = [...data.appointments];
    const index = clone.findIndex((item) => item.id === appt.id);
    if (index >= 0) {
      clone[index] = appt;
    } else {
      clone.push(appt);
    }

    syncStore({ ...data, appointments: clone });
  };

  const handleDeleteAppointment = (apptId: string) => {
    const updated = data.appointments.filter((item) => item.id !== apptId);
    syncStore({ ...data, appointments: updated });
  };

  // 3. Prescription Operations
  const handleSavePrescription = (pres: Prescription) => {
    const clone = [...data.prescriptions];
    clone.push(pres); // Always record history

    syncStore({ ...data, prescriptions: clone });
  };

  // 4. Medications Custom Operations
  const handleAddMedication = (med: DentalMedicationInfo) => {
    const clone = [...(data.customMedications || [])];
    clone.push(med);

    syncStore({ ...data, customMedications: clone });
  };

  const handleDeleteMedication = (medId: string) => {
    const clone = (data.customMedications || []).filter((item) => item.id !== medId);
    syncStore({ ...data, customMedications: clone });
  };

  const handleUpdateClinicSettings = (settings: { doctorName?: string; doctorSpecialty?: string; clinicName?: string; todoTasks?: TodoTask[]; currency?: string; whatsappSettings?: WhatsappSettings }) => {
    syncStore({
      ...data,
      doctorName: settings.doctorName !== undefined ? settings.doctorName : data.doctorName,
      doctorSpecialty: settings.doctorSpecialty !== undefined ? settings.doctorSpecialty : data.doctorSpecialty,
      clinicName: settings.clinicName !== undefined ? settings.clinicName : data.clinicName,
      todoTasks: settings.todoTasks !== undefined ? settings.todoTasks : data.todoTasks,
      currency: settings.currency !== undefined ? settings.currency : data.currency,
      whatsappSettings: settings.whatsappSettings !== undefined ? settings.whatsappSettings : data.whatsappSettings
    });
  };

  const handleRestoreData = (restored: ClinicData) => {
    syncStore(restored);
  };

  const handleLoginSuccess = (user: { role: 'doctor' | 'assistant' | 'receptionist'; name: string }) => {
    setCurrentUser(user);
    localStorage.setItem('clinic_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('clinic_user');
    setActiveTab('dashboard');
  };

  const rawNavItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['doctor', 'assistant', 'receptionist'] },
    { id: 'patients', label: 'ملفات المرضى', icon: Users, roles: ['doctor', 'assistant', 'receptionist'] },
    { id: 'appointments', label: 'إدارة المواعيد', icon: Calendar, roles: ['doctor', 'assistant', 'receptionist'] },
    { id: 'prescriptions', label: 'وصفة طبية', icon: FileText, roles: ['doctor'] },
    { id: 'financials', label: 'التقارير المالية', icon: DollarSign, roles: ['doctor'] },
    { id: 'meds', label: 'دليل الأدوية', icon: BookOpen, roles: ['doctor', 'assistant'] },
    { id: 'whatsapp_config', label: 'إعدادات الواتساب', icon: MessageSquare, roles: ['doctor', 'assistant', 'receptionist'] }
  ] as const;

  const navItems = rawNavItems.filter(item => {
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  });

  const handleMobileNavigate = (id: typeof activeTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold font-sans">
          {lang === 'ar' ? 'جاري مزامنة وتهيئة خادم عيادة الأسنان...' : 'Initialisation et synchronisation du serveur clinique...'}
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-6 text-center ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-rose-50 text-rose-800'}`}>
        <ShieldAlert className="w-14 h-14 text-rose-500 mb-3" />
        <h2 className="text-base font-bold">
          {lang === 'ar' ? 'عذراً! واجهت العيادة مشكلة طارئة' : 'Oups! Le cabinet a rencontré un problème critique'}
        </h2>
        <p className="mt-2 text-xs max-w-md text-rose-500 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-6 rounded-xl transition-colors cursor-pointer"
        >
          {lang === 'ar' ? 'إعادة المحاولة ومزامنة البيانات' : 'Réessayer et synchroniser les données'}
        </button>
      </div>
    );
  }

  const doctorInitials = (data.doctorName || (lang === 'ar' ? 'د. أحمد الصالح' : 'Dr. Ahmed Essaleh'))
    .replace('د.', '')
    .replace('Dr.', '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('.')
    .toUpperCase();

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-[#f0f4f8] text-[#2d3748]'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner - hidden during printing */}
      <header className="bg-white border-b border-gray-200 h-16 shrink-0 sticky top-0 z-40 transition-shadow no-print shadow-xs flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-50 text-slate-700 rounded-lg border cursor-pointer font-bold"
            title={lang === 'ar' ? "توسيع قائمة التنقل بالعيادة" : "Développer le menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Clean clinical logo with Teal highlight from theme */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs">
              <span className="text-white">🦷</span>
            </div>
            <div>
              <h1 className="text-xs md:text-sm font-black text-slate-900 tracking-tight leading-none">
                {data.clinicName || (lang === 'ar' ? 'عيادتي الرقمية' : 'Ma Clinique Digitale')}
              </h1>
              <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                {getTranslation('clinic_system', lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Header Interactions: Doctor Profiling, language selectors and Action Button */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Language Switcher Button */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer h-8.5 transition-colors shrink-0"
            title={lang === 'ar' ? "Changer la langue en français" : "تغيير اللغة إلى العربية"}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'Français' : 'العربية'}</span>
            <span className="sm:hidden font-mono text-[10px] uppercase">{lang === 'ar' ? 'FR' : 'AR'}</span>
          </button>

          {/* Dark / Night Mode Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center w-8.5 h-8.5 rounded-lg border border-gray-200 hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors shrink-0"
            title={darkMode ? getTranslation('nav_light_mode', lang) : getTranslation('nav_dark_mode', lang)}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          {/* Create new appointment button in premium Teal style */}
          <button
            onClick={() => setActiveTab('appointments')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>{getTranslation('new_appt_btn', lang)}</span>
          </button>

          {/* User profile card & Logout */}
          <div className="flex items-center gap-3 border-r border-slate-200 pr-3 mr-1">
            <div className="text-right leading-none hidden lg:block">
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-250">
                {currentUser.name}
              </p>
              <p className="text-[9px] font-bold text-teal-600 dark:text-teal-400 mt-1">
                {currentUser.role === 'doctor' 
                  ? (lang === 'ar' ? 'طبيب أخصائي' : 'Praticien Chef') 
                  : currentUser.role === 'assistant' 
                  ? (lang === 'ar' ? 'مساعد سريري' : 'Assistant') 
                  : (lang === 'ar' ? 'موظف استقبال' : 'Accueil')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center font-bold text-blue-800 dark:text-blue-300 text-xs border">
              {currentUser.role === 'doctor' ? '🩺' : currentUser.role === 'assistant' ? '📁' : '📞'}
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 border dark:border-slate-800 cursor-pointer transition-colors"
              title={lang === 'ar' ? 'تسجيل الخروج والتبديل' : 'Déconnexion'}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* RIGHT SIDEBAR (Desktop) - High Density Styled with Deep Corporate Blue [#1a365d] */}
        <aside className="hidden md:block w-64 bg-[#1a365d] text-white shrink-0 no-print border-l border-blue-900/50">
          <div className="p-4 flex flex-col justify-between h-full">
            <div className="space-y-1.5 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full p-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                      lang === 'ar' ? 'text-right' : 'text-left'
                    } ${
                      isActive
                        ? 'bg-blue-800 text-white shadow-sm'
                        : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-300" />
                    <span>{getTranslation(('nav_' + item.id) as any, lang)}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Status bar from Theme design inside sidebar */}
            <div className="space-y-3 mt-auto">
              {/* WhatsApp status info */}
              <div className="p-3 bg-blue-900/40 rounded-lg border border-blue-850">
                <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-400">
                    {getTranslation('whatsapp_connected', lang)}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
                </div>
              </div>

              {/* Data Sync Status Container */}
              <div className="bg-blue-900/50 p-3 rounded-lg border border-blue-850 text-[10px] text-blue-200 space-y-2">
                <div className="flex items-center justify-between border-b border-blue-800/50 pb-1">
                  <span>{getTranslation('db_synced', lang)}</span>
                  {syncStatus === 'saving' && <span className="text-amber-400 animate-pulse">{getTranslation('db_syncing', lang)}</span>}
                  {syncStatus === 'synced' && <span className="text-emerald-400">{getTranslation('db_sync_ok', lang)}</span>}
                  {syncStatus === 'error' && <span className="text-rose-400">{getTranslation('db_sync_err', lang)}</span>}
                </div>
                <p className="leading-relaxed opacity-80">
                  {getTranslation('db_sync_text', lang)}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer Menu (RTL left-slide) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden flex justify-start no-print">
            <div className="w-60 bg-white dark:bg-slate-900 h-full p-5 space-y-4 shadow-xl border-l flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-extrabold text-xs text-slate-800">
                    {lang === 'ar' ? 'توجيه العيادة' : 'Menu Clinique'}
                  </h3>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMobileNavigate(item.id)}
                        className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                          lang === 'ar' ? 'text-right' : 'text-left'
                        } ${
                          isActive
                            ? 'bg-sky-500 text-white'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{getTranslation(('nav_' + item.id) as any, lang)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center font-mono py-2 border-t">
                {getTranslation('footer_text', lang)}
              </div>
            </div>
          </div>
        )}

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 print-card">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                patients={data.patients}
                appointments={data.appointments}
                prescriptions={data.prescriptions}
                doctorName={data.doctorName}
                doctorSpecialty={data.doctorSpecialty}
                clinicName={data.clinicName}
                todoTasks={data.todoTasks}
                lang={lang}
                onNavigate={setActiveTab}
                onSaveAppointment={handleSaveAppointment}
                onUpdateClinicSettings={handleUpdateClinicSettings}
                currency={data.currency}
                fullData={data}
                onRestoreData={handleRestoreData}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'patients' && (
              <PatientsManager
                patients={data.patients}
                appointments={data.appointments}
                prescriptions={data.prescriptions}
                lang={lang}
                onSavePatient={handleSavePatient}
                onDeletePatient={handleDeletePatient}
                currency={data.currency}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsManager
                appointments={data.appointments}
                patients={data.patients}
                lang={lang}
                onSaveAppointment={handleSaveAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                currency={data.currency}
                currentUser={currentUser}
                whatsappSettings={data.whatsappSettings}
              />
            )}

            {activeTab === 'prescriptions' && (
              <PrescriptionGenerator
                patients={data.patients}
                medications={data.customMedications || []}
                prescriptions={data.prescriptions}
                lang={lang}
                onSavePrescription={handleSavePrescription}
              />
            )}

            {activeTab === 'financials' && (
              <FinancialReports
                appointments={data.appointments}
                patients={data.patients}
                lang={lang}
                onSaveAppointment={handleSaveAppointment}
                currency={data.currency}
              />
            )}

            {activeTab === 'meds' && (
              <MedsEncyclopedia
                medications={data.customMedications || []}
                lang={lang}
                onAddMedication={handleAddMedication}
                onDeleteMedication={handleDeleteMedication}
              />
            )}

            {activeTab === 'whatsapp_config' && (
              <WhatsappConfiguration
                settings={data.whatsappSettings}
                currentUser={currentUser}
                onSave={(updatedSettings) => handleUpdateClinicSettings({ whatsappSettings: updatedSettings })}
                lang={lang}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom-Bar Navigation (Optional layout enrichment for absolute tactile reach) */}
      <nav className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-14 shrink-0 flex items-center justify-around px-2 z-40 no-print text-[10px] font-bold text-slate-500">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
                isActive ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{getTranslation(('nav_' + item.id) as any, lang)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Patient, Appointment, Prescription, TodoTask, ClinicData } from '../types';
import { Calendar, Users, FileText, ArrowLeftRight, MessageSquare, Check, DollarSign, Clock, ListChecks, Pill, Settings, Plus, Trash2, CheckSquare, Square, ThumbsUp, Bell, AlertCircle, Sparkles, Database, RefreshCw } from 'lucide-react';
import { Language, getTranslation } from '../translations';
import BackupSystem from './BackupSystem';
import SmartReminderModal from './SmartReminderModal';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  doctorName?: string;
  doctorSpecialty?: string;
  clinicName?: string;
  todoTasks?: TodoTask[];
  lang?: Language;
  onNavigate: (tab: 'dashboard' | 'patients' | 'appointments' | 'prescriptions' | 'meds' | 'financials') => void;
  onSaveAppointment: (appt: Appointment) => void;
  onUpdateClinicSettings: (settings: { doctorName?: string; doctorSpecialty?: string; clinicName?: string; todoTasks?: TodoTask[]; currency?: string; whatsappSettings?: any }) => void;
  currency?: string;
  fullData?: ClinicData;
  onRestoreData?: (restored: ClinicData) => void;
  currentUser?: { role: 'doctor' | 'assistant' | 'receptionist'; name: string } | null;
}

export default function Dashboard({
  patients,
  appointments,
  prescriptions,
  doctorName = 'د. أحمد الصالح',
  doctorSpecialty = 'أخصائي جراحة الفك',
  clinicName = 'عيادتي الرقمية',
  todoTasks = [],
  lang = 'ar',
  onNavigate,
  onSaveAppointment,
  onUpdateClinicSettings,
  currency = 'د.م',
  fullData,
  onRestoreData,
  currentUser
}: DashboardProps) {
  // Get today's ISO date string
  const todayStr = new Date().toISOString().split('T')[0];

  // States for instant backup
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Calculating appointments that require WhatsApp reminders today
  const todayDateObj = new Date();
  const tomorrowDateObj = new Date();
  tomorrowDateObj.setDate(todayDateObj.getDate() + 1);
  const tomorrowStr = tomorrowDateObj.toISOString().split('T')[0];

  const pendingReminders = appointments.filter(appt => {
    // Only scheduled (active) appointments scheduled for today or tomorrow
    const isTodayOrTomorrow = appt.dateTime.includes(todayStr) || appt.dateTime.includes(tomorrowStr);
    return appt.status === 'scheduled' && isTodayOrTomorrow;
  }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const handleInstantBackup = async () => {
    setIsBackingUp(true);
    setBackupError(null);
    setBackupSuccess(false);
    try {
      // 1. Sync React application state to local/server SQLite
      if (fullData && onRestoreData) {
        onRestoreData(fullData);
      }

      // 2. Perform SQLite vacuum and optimization
      await fetch('/api/sqlite/vacuum', { method: 'POST' });

      // 3. Trigger JSON backup download for safety
      const backupString = JSON.stringify(fullData || { patients, appointments, prescriptions, todoTasks }, null, 2);
      const blobJson = new Blob([backupString], { type: 'application/json' });
      const urlJson = URL.createObjectURL(blobJson);
      const dateStr = new Date().toISOString().split('T')[0];
      const linkJson = document.createElement('a');
      linkJson.href = urlJson;
      linkJson.download = lang === 'ar' 
        ? `نسخة_احتياطية_عيادة_الأسنان_${dateStr}.json`
        : `sauvegarde_cabinet_dentaire_${dateStr}.json`;
      document.body.appendChild(linkJson);
      linkJson.click();
      document.body.removeChild(linkJson);
      URL.revokeObjectURL(urlJson);

      // 4. Download physical .sqlite file directly
      const linkSqlite = document.createElement('a');
      linkSqlite.href = '/api/sqlite/download-db';
      linkSqlite.download = 'clinic-data.sqlite';
      document.body.appendChild(linkSqlite);
      linkSqlite.click();
      document.body.removeChild(linkSqlite);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setBackupError(lang === 'ar' ? "فشلت عملية المزامنة وحفظ النسخ" : "Échec de sauvegarde");
    } finally {
      setIsBackingUp(false);
    }
  };

  // Internal forms state for clinic settings editing
  const [inpDoctorName, setInpDoctorName] = useState(doctorName);
  const [inpDoctorSpecialty, setInpDoctorSpecialty] = useState(doctorSpecialty);
  const [inpClinicName, setInpClinicName] = useState(clinicName);
  const [inpCurrency, setInpCurrency] = useState(currency);
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // States for WhatsApp configurations
  const [showWhatsappSettings, setShowWhatsappSettings] = useState(false);
  const [waTiming, setWaTiming] = useState(fullData?.whatsappSettings?.defaultTimingHoursBefore ?? 24);
  const [waTemplate, setWaTemplate] = useState(fullData?.whatsappSettings?.defaultTemplateType ?? 'standard');
  const [waSigAr, setWaSigAr] = useState(fullData?.whatsappSettings?.doctorSignatureAr ?? 'مع تحيات الطاقم الطبي للعيادة.');
  const [waSigFr, setWaSigFr] = useState(fullData?.whatsappSettings?.doctorSignatureFr ?? 'Cordialement, l’équipe du cabinet dentaire.');
  const [waRoleAllowed, setWaRoleAllowed] = useState(fullData?.whatsappSettings?.senderRoleAllowed ?? 'any');
  const [waAutoWeb, setWaAutoWeb] = useState(fullData?.whatsappSettings?.autoOpenWebAfterSend ?? true);
  
  // Custom templates editing states
  const [tmplArStd, setTmplArStd] = useState(fullData?.whatsappSettings?.templatesAr?.standard ?? '');
  const [tmplArRes, setTmplArRes] = useState(fullData?.whatsappSettings?.templatesAr?.reschedule ?? '');
  const [tmplArPost, setTmplArPost] = useState(fullData?.whatsappSettings?.templatesAr?.postop ?? '');
  const [tmplArWrn, setTmplArWrn] = useState(fullData?.whatsappSettings?.templatesAr?.warning ?? '');

  const [tmplFrStd, setTmplFrStd] = useState(fullData?.whatsappSettings?.templatesFr?.standard ?? '');
  const [tmplFrRes, setTmplFrRes] = useState(fullData?.whatsappSettings?.templatesFr?.reschedule ?? '');
  const [tmplFrPost, setTmplFrPost] = useState(fullData?.whatsappSettings?.templatesFr?.postop ?? '');
  const [tmplFrWrn, setTmplFrWrn] = useState(fullData?.whatsappSettings?.templatesFr?.warning ?? '');

  // Keep states in sync when fullData loaded
  useEffect(() => {
    if (fullData?.whatsappSettings) {
      setWaTiming(fullData.whatsappSettings.defaultTimingHoursBefore);
      setWaTemplate(fullData.whatsappSettings.defaultTemplateType);
      setWaSigAr(fullData.whatsappSettings.doctorSignatureAr);
      setWaSigFr(fullData.whatsappSettings.doctorSignatureFr);
      setWaRoleAllowed(fullData.whatsappSettings.senderRoleAllowed);
      setWaAutoWeb(fullData.whatsappSettings.autoOpenWebAfterSend);
      
      setTmplArStd(fullData.whatsappSettings.templatesAr?.standard || '');
      setTmplArRes(fullData.whatsappSettings.templatesAr?.reschedule || '');
      setTmplArPost(fullData.whatsappSettings.templatesAr?.postop || '');
      setTmplArWrn(fullData.whatsappSettings.templatesAr?.warning || '');

      setTmplFrStd(fullData.whatsappSettings.templatesFr?.standard || '');
      setTmplFrRes(fullData.whatsappSettings.templatesFr?.reschedule || '');
      setTmplFrPost(fullData.whatsappSettings.templatesFr?.postop || '');
      setTmplFrWrn(fullData.whatsappSettings.templatesFr?.warning || '');
    }
  }, [fullData]);

  // Smart reminder popup trigger states
  const [activeReminderAppt, setActiveReminderAppt] = useState<Appointment | null>(null);

  // Internal state for managing new tasks
  const [newTaskText, setNewTaskText] = useState('');

  // Handle saving doctor & clinic profile adjustments
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClinicSettings({
      doctorName: inpDoctorName,
      doctorSpecialty: inpDoctorSpecialty,
      clinicName: inpClinicName,
      todoTasks,
      currency: inpCurrency
    });
    setShowIdentityEditor(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleSaveWhatsappSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'receptionist') {
      alert("عذراً، لا تمتلك الصلاحيات الكافية لتعديل قوالب وتوقيت الواتساب.");
      return;
    }
    
    onUpdateClinicSettings({
      doctorName,
      doctorSpecialty,
      clinicName,
      todoTasks,
      currency,
      whatsappSettings: {
        defaultTimingHoursBefore: Number(waTiming),
        defaultTemplateType: waTemplate as any,
        doctorSignatureAr: waSigAr,
        doctorSignatureFr: waSigFr,
        senderRoleAllowed: waRoleAllowed as any,
        autoOpenWebAfterSend: waAutoWeb,
        templatesAr: {
          standard: tmplArStd,
          reschedule: tmplArRes,
          postop: tmplArPost,
          warning: tmplArWrn
        },
        templatesFr: {
          standard: tmplFrStd,
          reschedule: tmplFrRes,
          postop: tmplFrPost,
          warning: tmplFrWrn
        }
      }
    });
    
    setShowWhatsappSettings(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Todo-list event handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: TodoTask = {
      id: 'task_' + Date.now(),
      text: newTaskText.trim(),
      done: false,
      createdAt: new Date().toISOString()
    };
    const updatedTasks = [newTask, ...todoTasks];
    onUpdateClinicSettings({
      doctorName,
      doctorSpecialty,
      clinicName,
      todoTasks: updatedTasks
    });
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = todoTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, done: !task.done };
      }
      return task;
    });
    onUpdateClinicSettings({
      doctorName,
      doctorSpecialty,
      clinicName,
      todoTasks: updatedTasks
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = todoTasks.filter(task => task.id !== taskId);
    onUpdateClinicSettings({
      doctorName,
      doctorSpecialty,
      clinicName,
      todoTasks: updatedTasks
    });
  };

  // Helper filter for today's appointment list
  const todayAppointments = appointments.filter(appt => {
    return appt.dateTime.includes(todayStr);
  }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Quick stat helpers
  const totalPatients = patients.length;
  const activeAppointmentsCount = appointments.filter(a => a.status === 'scheduled').length;
  const totalCompletedToday = appointments.filter(a => a.status === 'completed' && a.dateTime.includes(todayStr)).length;
  
  // Total cash flow
  const totalRevenue = appointments.reduce((sum, appt) => sum + (appt.paidAmount || 0), 0);

  const handleQuickComplete = (appt: Appointment) => {
    const updated: Appointment = {
      ...appt,
      status: 'completed',
      paidAmount: appt.price // Mark full amount paid on completion
    };
    onSaveAppointment(updated);
  };

  const triggerWhatsApp = (appt: Appointment) => {
    setActiveReminderAppt(appt);
  };

  return (
    <div className="space-y-5">
      {/* Clinic Greeting Hero Card - Styled with High Density Corporate Blue to Teal Gradient */}
      <div className={`bg-gradient-to-r from-[#1a365d] to-teal-700 rounded-xl p-5 md:p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 ${
        lang === 'ar' ? 'md:text-right text-center' : 'md:text-left text-center'
      }`}>
        <div className="space-y-1.5 flex-1">
          <span className="bg-teal-500/20 text-teal-300 font-extrabold text-[10px] uppercase py-0.5 px-2.5 rounded-md border border-teal-500/30">
            {lang === 'ar' ? 'اللوحة التحليلية الشاملة' : 'TABLEAU DE BORD GENERAL'}
          </span>
          <h1 className="text-lg md:text-xl font-black">
            {lang === 'ar' ? `أهلاً بك في ${clinicName} 👋` : `Bienvenue à ${clinicName} 👋`}
          </h1>
          <p className="text-teal-200 text-xs font-bold">{doctorName} — {doctorSpecialty}</p>
          <p className="text-blue-100 text-xs max-w-xl">
            {lang === 'ar'
              ? 'متابعة دقيقة لملفات المرضى، سجل الحالة السنية لـ 32 سناً، الجدولة الزمنية وتوليد فوري للوصفات الطبية مع ربط ذكي بالواتساب ومتابعة التقارير المالية.'
              : 'Suivi rigoureux des fiches patients, odontogramme détaillé, gestion d\'agenda, ordonnances instantanées avec alertes WhatsApp et rapports financiers complets.'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10 shrink-0 text-center space-y-0.5 min-w-[200px]">
          <Clock className="w-5 h-5 mx-auto text-teal-300 animate-pulse" />
          <span className="text-[9px] text-blue-200 block font-semibold">
            {lang === 'ar' ? 'تاريخ اليوم بالعيادة' : "Aujourd'hui au Cabinet"}
          </span>
          <strong className="text-xs font-black block font-mono text-white">
            {new Date().toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </strong>
        </div>
      </div>

      {/* WhatsApp Reminders Pending Alert & Instant Backup Portal */}
      <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/45 rounded-xl p-4 shadow-sm space-y-3.5">
        {/* Header containing details & instant backup action button */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? 'تنبيه: تذكيرات واتساب المعلقة لليوم' : 'Alerte : Rappels WhatsApp en suspens Aujourd\'hui'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-405">
                {lang === 'ar' 
                  ? 'مواعيد المرضى المقررة اليوم وغداً التي تتطلب إرسال تذكير تأكيد الحضور.' 
                  : 'Patients prévus aujourd\'hui et demanin nécessitant un envoi de rappel.'}
              </p>
            </div>
          </div>

          {/* Instant Backup Button */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {backupSuccess && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 border border-emerald-200/40 animate-pulse">
                <span>🟢</span>
                <span>{lang === 'ar' ? 'تم حفظ النسخ للمحرك وبنجاح!' : 'Sauvegarde réussie !'}</span>
              </span>
            )}
            {backupError && (
              <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 px-2 py-1 rounded-md font-bold">
                ⚠️ {backupError}
              </span>
            )}
            <button
              type="button"
              onClick={handleInstantBackup}
              disabled={isBackingUp}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-455 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
              title={lang === 'ar' ? 'صيانة الفهرس وتصدير SQLite3 وتنزيل ملف JSON الاحتياطي الفوري' : 'Sauvegarder immédiatement'}
            >
              {isBackingUp ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5 text-teal-350" />
              )}
              <span>{lang === 'ar' ? 'نسخ احتياطي فوري ومزامنة 📥' : 'Sauvegarde instantanée 📥'}</span>
            </button>
          </div>
        </div>

        {/* Pending list */}
        {pendingReminders.length === 0 ? (
          <div className="bg-emerald-50/55 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900 p-2.5 rounded-lg text-center text-[11px] text-emerald-800 dark:text-emerald-405 flex items-center justify-center gap-1.5">
            <span>✨</span>
            <span>{lang === 'ar' ? 'كل التذكيرات والمواعيد مستوفاة ومحدثة بالواتساب بالعيادة!' : 'Tous les rappels essentiels ont été transmis !'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {pendingReminders.map(appt => {
              const filePatient = patients.find(p => p.id === appt.patientId);
              const notifDisabled = filePatient?.whatsappNotificationsEnabled === false;
              
              return (
                <div 
                  key={"rem_" + appt.id}
                  className={`border rounded-lg p-2 flex items-center justify-between text-xs transition-colors ${
                    notifDisabled 
                      ? 'bg-amber-100/10 border-amber-200/50 dark:bg-amber-955/10 dark:border-amber-900/40' 
                      : 'bg-white dark:bg-slate-950 border-gray-150 dark:border-slate-850 hover:border-amber-250 dark:hover:border-amber-900/40'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <strong className="text-slate-800 dark:text-slate-205">{appt.patientName}</strong>
                      {notifDisabled && (
                        <span className="text-[8px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 px-1 rounded font-bold">
                          🚫 {lang === 'ar' ? 'إشعارات معطلة' : 'Notif. OFF'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                      <span>⏱️ {new Date(appt.dateTime).toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{new Date(appt.dateTime).toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR', { day: 'numeric', month: 'short' })}</span>
                      <span>•</span>
                      <span className="text-slate-650 bg-slate-50 dark:bg-slate-900 px-1 rounded border dark:border-slate-800">{appt.treatmentType}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerWhatsApp(appt)}
                    className="bg-[#10b981] hover:bg-emerald-600 text-white font-extrabold text-[10px] py-1 px-2 rounded-md flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'إرسال تذكير' : 'Rappeler'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Quantitative KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Patients */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
              {lang === 'ar' ? 'مرضى الأسنان المسجلين' : 'Patients Enregistrés'}
            </span>
            <strong className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">{totalPatients}</strong>
            <button
              onClick={() => onNavigate('patients')}
              className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block pt-1 hover:underline cursor-pointer"
            >
              {lang === 'ar' ? 'عرض السجلات ←' : 'Fiches patients →'}
            </button>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* KPI 2: Active appointments */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
              {lang === 'ar' ? 'الجلسات المجدولة حالياً' : 'Consultations Prévues'}
            </span>
            <strong className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">{activeAppointmentsCount}</strong>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block pt-1 hover:underline cursor-pointer"
            >
              {lang === 'ar' ? 'إدارة الجدولة ←' : 'Gérer l\'agenda →'}
            </button>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* KPI 3: Prescriptions */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
              {lang === 'ar' ? 'الوصفات الطبية الصادرة' : 'Ordonnances Rédigées'}
            </span>
            <strong className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">{prescriptions.length}</strong>
            <button
              onClick={() => onNavigate('prescriptions')}
              className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block pt-1 hover:underline cursor-pointer"
            >
              {lang === 'ar' ? 'تحرير وصفة جديدة ←' : 'Nouvelle ordonnance →'}
            </button>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#2d3748] dark:text-teal-400 border border-teal-100 dark:border-teal-900">
            <FileText className="w-4.5 h-4.5 text-teal-600" />
          </div>
        </div>

        {/* KPI 4: Capital Financial Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block font-semibold">
              {lang === 'ar' ? 'مداخيل العيادة الإجمالية' : 'Recette Globale'}
            </span>
            <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalRevenue} <span className="text-xs">{currency}</span></strong>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block pt-1">
              {lang === 'ar' ? 'شاملة الدفوعات والزيارات' : 'Total des règlements'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Grid: Left - Today's Schedule, Right - Quick Dental Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Today's Schedule Column (Col span 2) - High Density Styled with Tight Row Heights */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ListChecks className="text-teal-600 dark:text-teal-400 w-4.5 h-4.5" />
                <span>{lang === 'ar' ? 'مواعيد وجلسات اليوم الحالية' : "Consultations d'Aujourd'hui"}</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {lang === 'ar' ? 'قائمة المرضى المنتظرين وتفاصيل الجلسة للـ 24 ساعة الحالية.' : "Liste d'attente active des sessions de soins programmées."}
              </p>
            </div>
            <div className="flex gap-1">
              <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 py-0.5 px-2.5 rounded-full font-extrabold">
                {todayAppointments.length} {lang === 'ar' ? 'مواعيد' : 'Sessions'}
              </span>
              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 py-0.5 px-2.5 rounded-full font-extrabold">
                {todayAppointments.filter(a => a.status === 'completed').length} {lang === 'ar' ? 'مكتملة' : 'Terminées'}
              </span>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>{lang === 'ar' ? 'لا توجد مواعيد وجلسات كشف مسجلة لليوم الحالي.' : "Aucune consultation enregistrée pour aujourd'hui."}</span>
              <button
                onClick={() => onNavigate('appointments')}
                className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline mt-1 cursor-pointer"
              >
                {lang === 'ar' ? 'انقر لحجز الموعد الأول لليوم ←' : 'Cliquer pour réserver le premier rdv →'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-y-auto pr-1">
              {todayAppointments.map(appt => (
                <div key={appt.id} className="py-2.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200">{appt.patientName}</strong>
                      <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-mono font-bold border border-blue-100 dark:border-blue-900">
                        ⏱️ {new Date(appt.dateTime).toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{lang === 'ar' ? 'الإجراء:' : 'Acte:'} <strong className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 px-1 rounded-sm">{appt.treatmentType}</strong></span>
                      {appt.price && (<span>{lang === 'ar' ? 'التكلفة:' : 'Tarif:'} <strong className="text-teal-700 dark:text-teal-450">{appt.price} {currency}</strong></span>)}
                    </div>
                  </div>

                  {/* Immediate actions */}
                  <div className="flex items-center gap-1.5 self-start sm:self-center">
                    {appt.status === 'scheduled' ? (
                      <>
                        <button
                          onClick={() => triggerWhatsApp(appt)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title={lang === 'ar' ? 'إرسال تذكير فوري بالواتساب لموعد الكشف اليوم' : 'Notifier par WhatsApp maintenant'}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'تذكير' : 'Rappel'}</span>
                        </button>
                        <button
                          onClick={() => handleQuickComplete(appt)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title={lang === 'ar' ? "تأشير الجلسة بمكتملة وتسوية التكاليف" : "Marquer la séance comme terminée et réglée"}
                        >
                          <Check className="w-3 text-white h-3" />
                          <span>{lang === 'ar' ? 'اكتملت' : 'Terminée'}</span>
                        </button>
                      </>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        appt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-950'
                          : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-955'
                      }`}>
                        {appt.status === 'completed' 
                          ? (lang === 'ar' ? '✅ مكتمل' : '✅ Complété') 
                          : (lang === 'ar' ? '❌ ملغي' : '❌ Annulé')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations Sidebar / Navigation List */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1.5 tracking-wider">
              {lang === 'ar' ? 'عمليات سريعة للعيادة' : 'ACTIONS RAPIDES'}
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('patients')}
                className={`w-full bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-400 text-slate-700 dark:text-slate-350 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group cursor-pointer border border-[#e2e8f0] dark:border-slate-800 hover:border-teal-200 ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                }`}
              >
                <span>{lang === 'ar' ? 'سجل وملفات المرضى بالعيادة' : 'Fiches et dossiers patients'}</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900 group-hover:text-teal-800 dark:group-hover:text-teal-300 font-semibold font-mono rounded-md py-0.5 px-2">[{patients.length}]</span>
              </button>

              <button
                onClick={() => onNavigate('appointments')}
                className={`w-full bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-400 text-slate-700 dark:text-slate-350 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group cursor-pointer border border-[#e2e8f0] dark:border-slate-800 hover:border-teal-200 ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                }`}
              >
                <span>{lang === 'ar' ? 'حجز وجدولة المواعيد اليومية' : 'Agenda et rendez-vous'}</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900 group-hover:text-teal-800 dark:group-hover:text-teal-300 font-semibold font-mono rounded-md py-0.5 px-2">[{appointments.length}]</span>
              </button>

              <button
                onClick={() => onNavigate('prescriptions')}
                className={`w-full bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-400 text-slate-700 dark:text-slate-350 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group cursor-pointer border border-[#e2e8f0] dark:border-slate-800 hover:border-teal-200 ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                }`}
              >
                <span>{lang === 'ar' ? 'صياغة وطباعة وصفة طبية' : 'Rédiger une ordonnance'}</span>
                <span className="text-[9px] bg-teal-100 dark:bg-teal-900 text-teal-850 dark:text-teal-300 py-0.5 px-2 rounded-md font-bold">
                  {lang === 'ar' ? 'وصْفة' : 'Ordo'}
                </span>
              </button>

              <button
                onClick={() => onNavigate('financials')}
                className={`w-full bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group cursor-pointer border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300 ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>{lang === 'ar' ? 'التقارير والمتابعة المالية' : 'Facturation et comptes'}</span>
                </span>
                <span className="text-[9px] bg-emerald-600 text-white font-bold rounded-md py-0.5 px-2">
                  {lang === 'ar' ? 'تقرير مالى' : 'Rapports'}
                </span>
              </button>

              <button
                onClick={() => onNavigate('meds')}
                className={`w-full bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-400 text-slate-700 dark:text-slate-350 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group cursor-pointer border border-[#e2e8f0] dark:border-slate-800 hover:border-teal-200 ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                }`}
              >
                <span>{lang === 'ar' ? 'موسوعة ومذخر أدوية الأسنان' : 'Dictionnaire des médicaments'}</span>
                <span className="text-[9px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 py-0.5 px-2 rounded-md font-bold">
                  {lang === 'ar' ? 'الأدوية' : 'Meds'}
                </span>
              </button>
            </div>
          </div>

          {/* Clinic & Doctor Identity Customizer Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-1.5">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{lang === 'ar' ? 'إعدادات هوية العيادة والطبيب' : 'IDENTITE DU CABINET'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIdentityEditor(!showIdentityEditor)}
                className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                {showIdentityEditor 
                  ? (lang === 'ar' ? 'إغلاق' : 'Fermer') 
                  : (lang === 'ar' ? 'تعديل الهوية' : 'Modifier')}
              </button>
            </div>

            {showSuccessToast && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] rounded-lg flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 font-semibold" />
                <span>{lang === 'ar' ? 'تم تحديث وحفظ هوية العيادة بنجاح!' : 'Hébergement & profil mis à jour!'}</span>
              </div>
            )}

            {showIdentityEditor ? (
              <form onSubmit={handleSaveIdentity} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'اسم العيادة :' : 'Nom du Cabinet :'}
                  </label>
                  <input
                    type="text"
                    value={inpClinicName}
                    onChange={e => setInpClinicName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'اسم الطبيب الأخصائي :' : 'Nom du praticien :'}
                  </label>
                  <input
                    type="text"
                    value={inpDoctorName}
                    onChange={e => setInpDoctorName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'التخصص الدقيق :' : 'Spécialité :'}
                  </label>
                  <input
                    type="text"
                    value={inpDoctorSpecialty}
                    onChange={e => setInpDoctorSpecialty(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'العملة المعتمدة بالعيادة :' : 'Devise du cabinet :'}
                  </label>
                  <select
                    value={inpCurrency}
                    onChange={e => setInpCurrency(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                  >
                    <option value="د.م">د.م (الدرهم المغربي)</option>
                    <option value="DH">DH (Dirham)</option>
                    <option value="DA">DA (Dinar Algérien)</option>
                    <option value="TND">TND (Dinar Tunisien)</option>
                    <option value="$">$ (US Dollar)</option>
                    <option value="€">€ (Euro)</option>
                    <option value="£">£ (Livre Sterling)</option>
                    <option value="﷼">﷼ (ريال)</option>
                    <option value="د.إ">د.إ (درهم إماراتي)</option>
                    <option value="د.ك">د.ك (دينار كويتي)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ وتأكيد التغييرات' : 'Enregistrer les changements'}
                </button>
              </form>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-xs space-y-1 dark:text-slate-300">
                <div>{lang === 'ar' ? 'العيادة:' : 'Cabinet:'} <strong className="text-slate-800 dark:text-slate-200">{clinicName}</strong></div>
                <div>{lang === 'ar' ? 'العملة الحالية:' : 'Devise active:'} <strong className="text-teal-600 dark:text-teal-400 font-extrabold">{currency}</strong></div>
                <div>{lang === 'ar' ? 'الطبيب:' : 'Médecin:'} <strong className="text-slate-800 dark:text-slate-200">{doctorName}</strong></div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{doctorSpecialty}</div>
              </div>
            )}
          </div>

          {/* WhatsApp Settings Center Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-1.5">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                <span>{lang === 'ar' ? 'إعدادات وقوالب رسائل الواتساب' : 'PARAMETRES REMINDER WHATSAPP'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWhatsappSettings(!showWhatsappSettings)}
                className="text-[10px] text-sky-500 font-bold hover:underline cursor-pointer"
              >
                {showWhatsappSettings 
                  ? (lang === 'ar' ? 'إغلاق' : 'Fermer') 
                  : (lang === 'ar' ? 'تعديل الإعدادات' : 'Modifier')}
              </button>
            </div>

            {/* Check role permissions for assistant vs secretary */}
            {currentUser?.role === 'receptionist' ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                  <span>🔒 مغلق للسكرتارية</span>
                </span>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                  بصفتك سكرتير/ة العيادة، يمكنك إرسال التذكيرات للمرضى ولكن يقتصر التحكم في تعديل القوالب والتواقيت والأوقات الافتراضية على الطبيب والمساعد فقط.
                </p>
              </div>
            ) : showWhatsappSettings ? (
              <form onSubmit={handleSaveWhatsappSettings} className="space-y-3 text-[11px]">
                {/* 1. Timing: Hours code before appointment */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'المهلة الزمنية الافتراضية للتذكير (ساعة قبل الموعد) :' : 'Délai d’envoi par défaut :'}
                  </label>
                  <select
                    value={waTiming}
                    onChange={e => setWaTiming(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-950 border border-[#cbd5e1] dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value={1}>{lang === 'ar' ? 'ساعة واحدة قبل الموعد' : '1 heure avant'}</option>
                    <option value={3}>{lang === 'ar' ? '3 ساعات قبل الموعد' : '3 heures avant'}</option>
                    <option value={6}>{lang === 'ar' ? '6 ساعات قبل الموعد' : '6 heures avant'}</option>
                    <option value={12}>{lang === 'ar' ? '12 ساعة قبل الموعد' : '12 heures avant'}</option>
                    <option value={24}>{lang === 'ar' ? '24 ساعة (يوم واحد) قبل الموعد' : '24 heures avant'}</option>
                    <option value={48}>{lang === 'ar' ? '48 ساعة (يومين) قبل الموعد' : '48 heures avant'}</option>
                  </select>
                </div>

                {/* 2. Sender role authorized to send/modify */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {lang === 'ar' ? 'مستوى صلاحية إرسال التذكيرات بالعيادة :' : 'Droits d’envoi autorisés :'}
                  </label>
                  <select
                    value={waRoleAllowed}
                    onChange={e => setWaRoleAllowed(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-950 border border-[#cbd5e1] dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="any">{lang === 'ar' ? 'جميع الأدوار (الطبيب، المساعد، السكرتارية)' : 'Tout le monde'}</option>
                    <option value="doctor_and_assistant">{lang === 'ar' ? 'الأطباء والمساعدين فقط' : 'Médecin & Assistants seulement'}</option>
                    <option value="doctor_only">{lang === 'ar' ? 'الطبيب الأخصائي فقط' : 'Médecin traitant uniquement'}</option>
                  </select>
                </div>

                {/* 3. Auto-open WhatsApp Web and template signature */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="autoOpenWebChk"
                    checked={waAutoWeb}
                    onChange={e => setWaAutoWeb(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="autoOpenWebChk" className="text-[10px] text-slate-600 dark:text-slate-400 font-bold cursor-pointer">
                    {lang === 'ar' ? 'فتح واتساب ويب تلقائياً عند الإرسال بالعيادة' : 'Ouvrir WhatsApp Web automatiquement après envoi'}
                  </label>
                </div>

                <div className="pt-1.5 border-t dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    {lang === 'ar' ? 'قوالب الرسائل المخصصة (عربي) :' : 'Modèles personnalisés (Arabe) :'}
                  </span>
                  <p className="text-[8px] text-slate-400 mb-2 leading-relaxed">الشفرات البديلة: استخدم <code className="text-pink-500 bg-slate-100 dark:bg-slate-950 px-1 font-mono rounded font-normal">{`{patientName}`}</code> و <code className="text-pink-500 bg-slate-100 dark:bg-slate-950 px-1 font-mono rounded font-normal">{`{timeFormatted}`}</code> و <code className="text-pink-500 bg-slate-100 dark:bg-slate-950 px-1 font-mono rounded font-normal">{`{dateFormatted}`}</code> و <code className="text-pink-500 bg-slate-100 dark:bg-slate-950 px-1 font-mono rounded font-normal">{`{treatmentType}`}</code>.</p>
                  
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">🌸 القالب النموذجي العادي (Standard) :</span>
                      <textarea
                        value={tmplArStd}
                        onChange={e => setTmplArStd(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">📅 قالب إعادة الجدولة (Reschedule) :</span>
                      <textarea
                        value={tmplArRes}
                        onChange={e => setTmplArRes(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">🦷 قالب الرعاية ما بعد العلاج (Post-Op) :</span>
                      <textarea
                        value={tmplArPost}
                        onChange={e => setTmplArPost(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">🚨 قالب التحذير والاستعجال (Warning) :</span>
                      <textarea
                        value={tmplArWrn}
                        onChange={e => setTmplArWrn(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    {lang === 'ar' ? 'قوالب الرسائل المخصصة (فرنسي) :' : 'Modèles personnalisés (Français) :'}
                  </span>
                  
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">🌸 Modèle Standard :</span>
                      <textarea
                        value={tmplFrStd}
                        onChange={e => setTmplFrStd(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">📅 Modèle de Report (Reschedule) :</span>
                      <textarea
                        value={tmplFrRes}
                        onChange={e => setTmplFrRes(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">🦷 Modèle Post-opératoire (Post-Op) :</span>
                      <textarea
                        value={tmplFrPost}
                        onChange={e => setTmplFrPost(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">🚨 Modèle d’Urgence/Alerte (Warning) :</span>
                      <textarea
                        value={tmplFrWrn}
                        onChange={e => setTmplFrWrn(e.target.value)}
                        className="w-full text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-sans h-16 leading-normal"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ إعدادات وقوالب الواتساب' : 'Enregistrer les paramètres'}
                </button>
              </form>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-xs space-y-1.5 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'المهلة الافتراضية للتذكير:' : 'Délai d’envoi:'}</span>
                  <strong className="text-slate-800 dark:text-slate-200">{waTiming} {lang === 'ar' ? 'ساعة قبل الموعد' : 'heures avant'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'المخول بالإرسال بالعيادة:' : 'Rôles autorisés:'}</span>
                  <strong className="text-sky-600 dark:text-sky-400 font-bold text-right">
                    {waRoleAllowed === 'any' ? (lang === 'ar' ? 'جميع المستويات' : 'Tout le monde') :
                     waRoleAllowed === 'doctor_and_assistant' ? (lang === 'ar' ? 'الأطباء والمساعدين فقط' : 'Doc & Assistants') :
                     (lang === 'ar' ? 'الطبيب الأخصائي فقط' : 'Medecin seulement')}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'فتح الويب تلقائياً:' : 'Web Auto-open:'}</span>
                  <strong>{waAutoWeb ? (lang === 'ar' ? 'نعم 🟢' : 'Oui 🟢') : (lang === 'ar' ? 'لا 🔴' : 'Non 🔴')}</strong>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal pt-1 bg-white dark:bg-transparent rounded p-1 dark:p-0">
                  {lang === 'ar' 
                    ? 'يتم تطبيق المهلة والقوالب التذكيرية في لوحة المواعيد وعلى تذكيرات المرضى.'
                    : 'Les délais et modèles de SMS s’appliquent à tout l’agenda.'}
                </p>
              </div>
            )}
          </div>

          {fullData && onRestoreData && (
            <BackupSystem
              data={fullData}
              onRestoreData={onRestoreData}
              lang={lang}
            />
          )}

          {/* Quick Administrative Tasks & Reminders Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1.5 tracking-wider flex items-center gap-1">
                <ListChecks className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{lang === 'ar' ? 'مفكرة المهام والتذكيرات الإدارية' : 'MEMO & TACHES INTERNES'}</span>
              </h3>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                {lang === 'ar' 
                  ? 'دون ملاحظات سريعة أو منبهات عاجلة لمتابعة المواعيد وسير العمل بالعيادة.'
                  : 'Mémos internes pour organiser vos rappels ou alertes du secrétariat.'}
              </p>
            </div>

            {/* Form to append a task */}
            <form onSubmit={handleAddTask} className="flex gap-1.5">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'مثال: الاتصال لتأكيد موعد...' : 'Ex: Rappeler M. Dupont...'}
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-200"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white p-1.5 rounded-lg cursor-pointer shrink-0"
                title={lang === 'ar' ? 'إضافة تذكير' : 'Ajouter'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* List of existing tasks */}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {todoTasks.length === 0 ? (
                <p className="text-center text-slate-400 text-[10px] py-4">
                  {lang === 'ar' ? 'المهام مكتملة! لا توجد تذكيرات إدارية معلقة.' : 'Aucune tâche ou rappel en attente.'}
                </p>
              ) : (
                todoTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs gap-2 transition-colors ${
                      task.done 
                        ? 'bg-slate-50/70 border-slate-200/50 text-slate-400 line-through dark:bg-slate-950/20 dark:border-slate-900 dark:text-slate-650' 
                        : 'bg-slate-50 border-slate-150 text-slate-800 hover:bg-slate-100/50 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-300 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`flex items-center flex-1 gap-2 cursor-pointer font-medium text-[11px] ${
                        lang === 'ar' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {task.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="break-all">{task.text}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-350 hover:text-rose-500 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                      title={lang === 'ar' ? 'حذف الملاحظة' : 'Supprimer'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Prescription Action Box Styled from Theme (light teal dashed box) */}
          <div className="bg-teal-50 dark:bg-teal-950/20 border-2 border-dashed border-teal-200 dark:border-teal-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-white dark:bg-slate-905 rounded-full shadow-xs flex items-center justify-center text-md mb-2">📜</div>
            <h3 className="font-bold text-teal-900 dark:text-teal-300 text-xs mb-0.5">
              {lang === 'ar' ? 'إنشاء وصفة طبية فورية' : 'PRESCRIPTION CLIC-RAPIDE'}
            </h3>
            <p className="text-[9px] text-teal-700 dark:text-teal-450 mb-3 leading-relaxed">
              {lang === 'ar' ? 'اختر المريض والأدوية لطباعة الوصفة مباشرة' : 'Générez et imprimez pour tout patient convoqué.'}
            </p>
            <button 
              onClick={() => onNavigate('prescriptions')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {lang === 'ar' ? 'طباعة وصفة جديدة' : 'Nouvelle Ordonnance'}
            </button>
          </div>
        </div>

      </div>

      {activeReminderAppt && (
        <SmartReminderModal
          isOpen={!!activeReminderAppt}
          onClose={() => setActiveReminderAppt(null)}
          appointment={activeReminderAppt}
          patient={patients.find(p => p.id === activeReminderAppt.patientId)}
          lang={lang}
          whatsappSettings={fullData?.whatsappSettings}
        />
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WhatsappSettings } from '../types';
import { 
  MessageSquare, 
  Phone, 
  Clock, 
  ShieldAlert, 
  Save, 
  Check, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Globe,
  FileText
} from 'lucide-react';

interface WhatsappConfigurationProps {
  settings?: WhatsappSettings;
  currentUser?: { role: 'doctor' | 'assistant' | 'receptionist'; name: string } | null;
  onSave: (updatedSettings: WhatsappSettings) => void;
  lang?: 'ar' | 'fr';
}

export default function WhatsappConfiguration({
  settings,
  currentUser,
  onSave,
  lang = 'ar'
}: WhatsappConfigurationProps) {
  // Initialize states with defaults
  const [enabled, setEnabled] = useState(settings?.globalRemindersEnabled ?? true);
  const [timing, setTiming] = useState(settings?.defaultTimingHoursBefore ?? 24);
  const [defaultTemplate, setDefaultTemplate] = useState(settings?.defaultTemplateType ?? 'standard');
  const [phone, setPhone] = useState(settings?.clinicWhatsappPhone ?? '');
  const [waRoleAllowed, setWaRoleAllowed] = useState(settings?.senderRoleAllowed ?? 'any');
  const [waAutoWeb, setWaAutoWeb] = useState(settings?.autoOpenWebAfterSend ?? true);
  
  const [sigAr, setSigAr] = useState(settings?.doctorSignatureAr ?? 'مع تحيات الطاقم الطبي للعيادة.');
  const [sigFr, setSigFr] = useState(settings?.doctorSignatureFr ?? 'Cordialement, l’équipe du cabinet dentaire.');

  // Templates Arabic
  const [tmplArStd, setTmplArStd] = useState(settings?.templatesAr?.standard ?? '');
  const [tmplArRes, setTmplArRes] = useState(settings?.templatesAr?.reschedule ?? '');
  const [tmplArPost, setTmplArPost] = useState(settings?.templatesAr?.postop ?? '');
  const [tmplArWrn, setTmplArWrn] = useState(settings?.templatesAr?.warning ?? '');

  // Templates French
  const [tmplFrStd, setTmplFrStd] = useState(settings?.templatesFr?.standard ?? '');
  const [tmplFrRes, setTmplFrRes] = useState(settings?.templatesFr?.reschedule ?? '');
  const [tmplFrPost, setTmplFrPost] = useState(settings?.templatesFr?.postop ?? '');
  const [tmplFrWrn, setTmplFrWrn] = useState(settings?.templatesFr?.warning ?? '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'templates-ar' | 'templates-fr'>('general');

  // Keep internal states synchronized with incoming settings props
  useEffect(() => {
    if (settings) {
      setEnabled(settings.globalRemindersEnabled ?? true);
      setTiming(settings.defaultTimingHoursBefore);
      setDefaultTemplate(settings.defaultTemplateType);
      setPhone(settings.clinicWhatsappPhone ?? '');
      setWaRoleAllowed(settings.senderRoleAllowed);
      setWaAutoWeb(settings.autoOpenWebAfterSend);
      
      setSigAr(settings.doctorSignatureAr || '');
      setSigFr(settings.doctorSignatureFr || '');

      setTmplArStd(settings.templatesAr?.standard || '');
      setTmplArRes(settings.templatesAr?.reschedule || '');
      setTmplArPost(settings.templatesAr?.postop || '');
      setTmplArWrn(settings.templatesAr?.warning || '');

      setTmplFrStd(settings.templatesFr?.standard || '');
      setTmplFrRes(settings.templatesFr?.reschedule || '');
      setTmplFrPost(settings.templatesFr?.postop || '');
      setTmplFrWrn(settings.templatesFr?.warning || '');
    }
  }, [settings]);

  // Authorization check (Admins only: Dentist / Assistant can modify, receptionist is restricted depending on settings, or fully guarded)
  const isAuthorized = currentUser?.role === 'doctor' || currentUser?.role === 'assistant';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      alert(
        lang === 'ar' 
          ? 'عذراً، يقتصر تعديل إعدادات الواتساب وقوالبها على الأطباء ومساعدي العيادة فقط.' 
          : 'Désolé, la modification des paramètres WhatsApp est réservée aux médecins et assistants.'
      );
      return;
    }

    const updated: WhatsappSettings = {
      globalRemindersEnabled: enabled,
      defaultTimingHoursBefore: Number(timing),
      defaultTemplateType: defaultTemplate as any,
      clinicWhatsappPhone: phone.trim(),
      senderRoleAllowed: waRoleAllowed as any,
      autoOpenWebAfterSend: waAutoWeb,
      doctorSignatureAr: sigAr,
      doctorSignatureFr: sigFr,
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
    };

    onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* Header section with notification badge/toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-150 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <span>{lang === 'ar' ? 'مركز إعدادات تذكيرات الواتساب الذكية' : 'Centre de Configuration WhatsApp'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' 
              ? 'تخصيص قوالب وتواقيت التذكير، ورقم هاتف العيادة، ومستويات الصلاحيات للتحكم بجدول مواعيد المرضى.' 
              : 'Gérer les modèles de SMS, les délais d’envoi de rappels cliniques et le numéro professionnel.'}
          </p>
        </div>

        {/* Global toggler for active/inactive reminders */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {lang === 'ar' ? 'حالة التذكيرات التلقائية:' : 'Rappels actifs :'}
          </span>
          <button
            type="button"
            disabled={!isAuthorized}
            onClick={() => setEnabled(!enabled)}
            className={`cursor-pointer focus:outline-none transition-colors rounded-full p-0.5 ${
              !isAuthorized ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {enabled ? (
              <ToggleRight className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-400" />
            )}
          </button>
          <span className={`text-[11px] font-black ${enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
            {enabled ? (lang === 'ar' ? 'مفعّل 🟢' : 'ACTIF 🟢') : (lang === 'ar' ? 'معطّل 🔴' : 'DESACTIVÉ 🔴')}
          </span>
        </div>
      </div>

      {/* Role permission disclaimer for receptionists */}
      {!isAuthorized && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-extrabold">{lang === 'ar' ? '🔒 وضع القراءة فقط للموظفين والسكرتارية' : '⚠️ Mode lecture seule pour les secrétaires'}</p>
            <p className="leading-relaxed text-[11px] text-amber-700/80 dark:text-amber-400/85">
              {lang === 'ar' 
                ? 'مرحباً، أنت مسجل بدور سكرتارية العيادة. يسمح لك بإرسال الرسائل للمرضى بمرونة، ولكن ميزة تعديل القوالب، وتغيير التواقيت الافتراضية، أو ضبط رقم العيادة تقتصر حصرياً على الأطباء الأخصائيين والمساعدين.' 
                : 'En tant que réceptionniste, vous pouvez envoyer les messages mais seuls les médecins et assistants peuvent modifier la configuration globale.'}
            </p>
          </div>
        </div>
      )}

      {/* Form Submission */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Configuration Tabs bar to reduce screen clutter */}
        <div className="flex border-b border-slate-100 dark:border-slate-850 gap-1.5 pb-1 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-black transition-colors border-b-2 rounded-t-lg cursor-pointer ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang === 'ar' ? '⚙️ الإعدادات العامة للمنشأة' : '⚙️ Paramètres de base'}
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('templates-ar')}
            className={`px-4 py-2 text-xs font-black transition-colors border-b-2 rounded-t-lg cursor-pointer ${
              activeTab === 'templates-ar'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang === 'ar' ? '🔤 القوالب العربية' : '🔤 Modèles Arabes'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates-fr')}
            className={`px-4 py-2 text-xs font-black transition-colors border-b-2 rounded-t-lg cursor-pointer ${
              activeTab === 'templates-fr'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang === 'ar' ? '🔤 القوالب الفرنسية' : '🔤 Modèles Français'}
          </button>
        </div>

        {/* TAB 1: GENERAL BASE SETTINGS */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
            
            {/* 1. Clinic WhatsApp Phone Number */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'رقم هاتف الواتساب ومفتاح الاتصال الخاص بالعيادة :' : 'N° de WhatsApp du Cabinet :'}</span>
              </label>
              <input
                type="tel"
                placeholder="مثال: +212600000000"
                disabled={!isAuthorized}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 block leading-relaxed">
                {lang === 'ar' 
                  ? 'رقم الهاتف الرسمي المستخدم لتنظيم وتتبع مراسلة المرضى وتذكيرهم.' 
                  : 'Saisissez le format international (ex: +2126XXXXXXXX).'}
              </span>
            </div>

            {/* 2. Timing Options Select */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-500" />
                <span>{lang === 'ar' ? 'التوقيت التلقائي لإرسال التذكير (قبل الموعد) :' : 'Délai d’envoi (heures avant) :'}</span>
              </label>
              <select
                value={timing}
                disabled={!isAuthorized}
                onChange={e => setTiming(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-bold text-slate-800 dark:text-slate-200"
              >
                <option value={1}>{lang === 'ar' ? 'ساعة واحدة قبل الموعد' : '1 heure avant'}</option>
                <option value={3}>{lang === 'ar' ? '3 ساعات قبل الموعد' : '3 heures avant'}</option>
                <option value={6}>{lang === 'ar' ? '6 ساعات قبل الموعد' : '6 heures avant'}</option>
                <option value={12}>{lang === 'ar' ? '12 ساعة قبل الموعد' : '12 heures avant'}</option>
                <option value={24}>{lang === 'ar' ? '24 ساعة (يوم واحد) قبل الموعد' : '24 heures avant (1 jour)'}</option>
                <option value={48}>{lang === 'ar' ? '48 ساعة (يومين) قبل الموعد' : '48 heures avant (2 jours)'}</option>
              </select>
              <span className="text-[10px] text-slate-400 block leading-relaxed">
                {lang === 'ar' 
                  ? 'توقيت التذكير المبرمج افتراضياً لجميع لجان المواعيد وعيادة الاسنان.' 
                  : 'Ce délai s’applique comme valeur par défaut aux fiches de soins.'}
              </span>
            </div>

            {/* 3. Preferred Template choice */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'القالب التذكيري الافتراضي النشط حالياً :' : 'Modèle par défaut actif :'}</span>
              </label>
              <select
                value={defaultTemplate}
                disabled={!isAuthorized}
                onChange={e => setDefaultTemplate(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value="standard">{lang === 'ar' ? '🌸 القالب النموذجي العادي (Standard)' : 'standard'}</option>
                <option value="reschedule">{lang === 'ar' ? '📅 قالب إعادة جدولة المواعيد (Reschedule)' : 'reschedule'}</option>
                <option value="postop">{lang === 'ar' ? '🦷 قالب الرعاية والمتابعة بعد العلاج (Post-Op)' : 'postop'}</option>
                <option value="warning">{lang === 'ar' ? '🚨 قالب التحذير والاستعجال (Warning)' : 'warning'}</option>
              </select>
              <span className="text-[10px] text-slate-400 block leading-relaxed">
                {lang === 'ar' 
                  ? 'يتم تعيين هذا القالب تلقائياً عند إضافة أو استدعاء تذكير مريض.' 
                  : 'Ce modèle est présélectionné lors de la préparation des messages.'}
              </span>
            </div>

            {/* 4. Who can modify or trigger */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-500" />
                <span>{lang === 'ar' ? 'مستوى صلاحية إرسال التذكيرات بالعيادة :' : 'Droits d’envoi autorisés :'}</span>
              </label>
              <select
                value={waRoleAllowed}
                disabled={!isAuthorized}
                onChange={e => setWaRoleAllowed(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-slate-800 dark:text-slate-200"
              >
                <option value="any">{lang === 'ar' ? 'جميع الموظفين (طبيب، مساعد، سكرتارية)' : 'Tout le monde'}</option>
                <option value="doctor_and_assistant">{lang === 'ar' ? 'الطبيب والمساعد فقط' : 'Médecins & Assistants'}</option>
                <option value="doctor_only">{lang === 'ar' ? 'الطبيب الأخصائي فقط' : 'Dentiste titulaire uniquement'}</option>
              </select>
              <span className="text-[10px] text-slate-400 block leading-relaxed">
                {lang === 'ar' 
                  ? 'تحديد أيّ عضو من فريق العيادة يمكنه نقر إرسال أو تشغيل أزرار الواتساب.' 
                  : 'Détermine qui a la permission de déclencher l’envoi des messages.'}
              </span>
            </div>

            {/* 5. Auto open Web toggle */}
            <div className="md:col-span-2 pt-2">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-transparent rounded-xl border border-slate-150 dark:border-slate-850">
                <input
                  type="checkbox"
                  id="cfgAutoOpenWeb"
                  disabled={!isAuthorized}
                  checked={waAutoWeb}
                  onChange={e => setWaAutoWeb(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="cfgAutoOpenWeb" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  {lang === 'ar' 
                    ? 'فتح واتساب ويب في نافذة متصفح جديدة تلقائياً بمجرد نقر زر الإرسال المباشر' 
                    : 'Ouvrir WhatsApp Web automatiquement après chaque envoi de tps.'}
                </label>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ARABIC TEMPLATES EDIT */}
        {activeTab === 'templates-ar' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs space-y-1.5 text-slate-600 dark:text-slate-350">
              <span className="font-bold block text-slate-800 dark:text-slate-200">🔍 رموز الاستبدال التلقائية المتاحة للتخصيص:</span>
              <p className="leading-relaxed">
                استخدم الشفرات المحددة بالأقواس ليقوم النظام باستبدالها آلياً قبل تجهيز الرسالة: <br />
                <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{patientName}`}</code> لاسم المريض • <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{dateFormatted}`}</code> لتاريخ الموعد • <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{timeFormatted}`}</code> لوقت الموعد • <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{treatmentType}`}</code> لنوع المعالجة السنية المقررة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Std */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">🌸 قالب التذكير النموذجي العادي (Standard) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplArStd}
                  onChange={e => setTmplArStd(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Res */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">📅 قالب اقتراح تعديل الموعد (Reschedule) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplArRes}
                  onChange={e => setTmplArRes(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Postop */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">🦷 قالب إرشادات المتابعة بعد العلاج (Post-Op) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplArPost}
                  onChange={e => setTmplArPost(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Warning */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">🚨 قالب التحذير والاستعجال (Warning) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplArWrn}
                  onChange={e => setTmplArWrn(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Sig Ar */}
              <div className="md:col-span-2 space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">✍️ التوقيع وبصمة الطبيب الافتراضية للرسائل العربية (Signature) :</span>
                <input
                  type="text"
                  disabled={!isAuthorized}
                  value={sigAr}
                  onChange={e => setSigAr(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FRENCH TEMPLATES EDIT */}
        {activeTab === 'templates-fr' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs space-y-1.5 text-slate-600 dark:text-slate-350">
              <span className="font-bold block text-slate-800 dark:text-slate-200">🔍 Balises de remplacement disponibles :</span>
              <p className="leading-relaxed">
                Utilisez les balises suivantes pour fusionner les détails dynamiques de la fiche : <br />
                <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{patientName}`}</code> • <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{dateFormatted}`}</code> • <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{timeFormatted}`}</code> • <code className="text-emerald-600 bg-white dark:bg-slate-900 border px-1 py-0.5 rounded font-mono font-bold">{`{treatmentType}`}</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Std */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">🌸 Modèle de Rappel Standard (Standard) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplFrStd}
                  onChange={e => setTmplFrStd(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Res */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">📅 Modèle de Proposition de Report (Reschedule) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplFrRes}
                  onChange={e => setTmplFrRes(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Postop */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">🦷 Modèle Post-opératoire (Post-Op) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplFrPost}
                  onChange={e => setTmplFrPost(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Warning */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">🚨 Modèle d'Urgence / Rappel Serré (Warning) :</span>
                <textarea
                  disabled={!isAuthorized}
                  value={tmplFrWrn}
                  onChange={e => setTmplFrWrn(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans h-24 leading-normal focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Sig Fr */}
              <div className="md:col-span-2 space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">✍️ Signature et salutation par défaut (Français) :</span>
                <input
                  type="text"
                  disabled={!isAuthorized}
                  value={sigFr}
                  onChange={e => setSigFr(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-sans focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Trigger Save Button (if authorized) */}
        {isAuthorized && (
          <div className="pt-4 border-t dark:border-slate-850 flex items-center justify-between gap-4">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حفظ وحماية إعدادات الواتساب بالكامل' : 'Enregistrer la configuration'}</span>
            </button>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-3.5 py-1.5 rounded-lg animate-fadeIn text-xs font-black">
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تم الحفظ والمزامنة بنجاح 🟢!' : 'Enregistré avec succès 🟢 !'}</span>
              </div>
            )}
          </div>
        )}

      </form>
    </div>
  );
}

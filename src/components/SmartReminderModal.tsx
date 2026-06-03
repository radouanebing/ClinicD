import React, { useState, useEffect } from 'react';
import { Appointment, Patient } from '../types';
import { X, Calendar, Clock, MessageSquare, Send, Check, Cpu, Terminal, Copy, Shield, HelpCircle, CheckCheck } from 'lucide-react';

interface SmartReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  patient?: Patient;
  lang?: string;
  whatsappSettings?: any;
}

export default function SmartReminderModal({
  isOpen,
  onClose,
  appointment,
  patient,
  lang = 'ar',
  whatsappSettings
}: SmartReminderModalProps) {
  const [editedDateTime, setEditedDateTime] = useState(appointment.dateTime);
  const [phone, setPhone] = useState(appointment.patientPhone || '');
  const [templateType, setTemplateType] = useState<'standard' | 'reschedule' | 'postop' | 'warning'>('standard');
  const [customText, setCustomText] = useState('');
  const [activeTab, setActiveTab] = useState<'send' | 'automation'>('send');
  const [isCopied, setIsCopied] = useState(false);

  // Re-initialize state when appointment / patient changes
  useEffect(() => {
    setEditedDateTime(appointment.dateTime);
    setPhone(appointment.patientPhone || '');
    if (patient?.preferredReminderTemplate) {
      setTemplateType(patient.preferredReminderTemplate);
    } else {
      setTemplateType('standard');
    }
  }, [appointment, patient]);

  const copyScriptToClipboard = () => {
    const scriptText = `// ==UserScript==
// @name         مُرسل عيادة الأسنان التلقائي (Dental Clinic Auto Sender)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  أتمتة الضغط التلقائي على زر الإرسال بمجرد تحميل المحادثة في واتساب ويب لتقليل تكرار النقر يدويًا
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    setInterval(() => {
        const sendButton = document.querySelector('button span[data-icon="send"]') || 
                           document.querySelector('button[aria-label="إرسال"]') || 
                           document.querySelector('button[aria-label="Send"]');
        if (sendButton) {
            const chatInput = document.querySelector('div[contenteditable="true"]');
            if (chatInput && chatInput.textContent.trim().length > 0) {
                const parentButton = sendButton.closest('button');
                if (parentButton) {
                    parentButton.click();
                } else {
                    sendButton.click();
                }
            }
        }
    }, 2000);
})();`;

    navigator.clipboard.writeText(scriptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Construct message text whenever values vary
  useEffect(() => {
    const dateObj = new Date(editedDateTime);
    const dateFormatted = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    const timeFormatted = dateObj.toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const replacePlaceholders = (templateStr: string) => {
      return templateStr
        .replace(/{patientName}/g, appointment.patientName)
        .replace(/{dateFormatted}/g, dateFormatted)
        .replace(/{timeFormatted}/g, timeFormatted)
        .replace(/{treatmentType}/g, appointment.treatmentType || '');
    };

    let text = '';
    if (lang === 'ar') {
      const customTmpl = whatsappSettings?.templatesAr?.[templateType];
      if (customTmpl) {
        text = replacePlaceholders(customTmpl);
      } else {
        if (templateType === 'standard') {
          text = `مرحباً ${appointment.patientName}، 🌸\n\nنود تذكيركم بموعدكم المقرّر في عيادة الأسنان:\n📅 التاريخ: ${dateFormatted}\n⏰ الوقت: ${timeFormatted}\n🦷 المعالجة: ${appointment.treatmentType}\n\nيرجى تأكيد حضوركم بالرد هنا. دمتم سالمين!`;
        } else if (templateType === 'reschedule') {
          text = `مرحباً ${appointment.patientName}، 🌸\n\nبناءً على طلبكم/جدول العيادة، نقترح تعديل وقت موعدكم السني ليصبح:\n📅 التاريخ الجديد: ${dateFormatted}\n⏰ الوقت الجديد: ${timeFormatted}\n\nهل هذا التوقيت يناسبكم؟ يرجى الرد لتأكيد تحديث الملف. شكراً لتفهمكم!`;
        } else if (templateType === 'postop') {
          text = `مرحباً ${appointment.patientName}، 🦷\n\nنطمئن على حالتكم الصحية بعد إجراء العلاج لـ (${appointment.treatmentType}).\n\n📌 تذكير بأهم التوصيات:\n- تجنب تناول الأطعمة الساخنة أو القاسية اليوم.\n- الالتزام بالأدوية الموصوفة.\n- يرجى الاتصال بنا فوراً في حال حدوث أي نزيف طارئ.\n\nنتمنى لكم شفاءً عاجلاً!`;
        } else if (templateType === 'warning') {
          text = `عاجل: مرحباً ${appointment.patientName}، 🚨\n\nنحيطكم علماً بأن موعدكم السني مبرمج في تمام الساعة ${timeFormatted}.\n\nالرجاء الحضور قبل الموعد بـ 10 دقائق لتجنب إلغاء الجلسة نظراً لضغط قائمة الانتظار. شكراً لتعاونكم!`;
        }
      }
    } else {
      const customTmpl = whatsappSettings?.templatesFr?.[templateType];
      if (customTmpl) {
        text = replacePlaceholders(customTmpl);
      } else {
        if (templateType === 'standard') {
          text = `Bonjour ${appointment.patientName}, 🌸\n\nNous vous rappelons votre prochain rendez-vous au cabinet dentaire :\n📅 Date : ${dateFormatted}\n⏰ Heure : ${timeFormatted}\n🦷 Acte : ${appointment.treatmentType}\n\nVeuillez confirmer votre présence en répondant à ce message. Bien à vous !`;
        } else if (templateType === 'reschedule') {
          text = `Bonjour ${appointment.patientName}, 🌸\n\nSuite à votre demande / contrainte clinique, nous vous proposons de décaler votre séance au :\n📅 Nouvelle Date : ${dateFormatted}\n⏰ Nouvel Horaire : ${timeFormatted}\n\nEst-ce que cela vous convient ? Merci de confirmer en répondant.`;
        } else if (templateType === 'postop') {
          text = `Bonjour ${appointment.patientName}, 🦷\n\nNous venons aux nouvelles après votre intervention pour (${appointment.treatmentType}).\n\n📌 Consignes importantes :\n- Évitez les aliments trop chauds ou durs aujourd'hui.\n- Suivez bien l'ordonnance et vos médicaments.\n- Contactez-nous en cas de saignement ou gêne majeure.\n\nBon rétablissement !`;
        } else if (templateType === 'warning') {
          text = `IMPORTANT : Bonjour ${appointment.patientName}, 🚨\n\nMus vous rappelons que votre séance dentaire est planifiée pour ${timeFormatted}.\n\nMerci de vous présenter 10 minutes en avance afin d'éviter toute annulation due au planning serré. Merci de votre réactivité !`;
        }
      }
    }

    if (patient?.whatsappCustomNotes) {
      if (lang === 'ar') {
        text += `\n\n📌 ملاحظة إضافية:\n${patient.whatsappCustomNotes}`;
      } else {
        text += `\n\n📌 Note spéciale :\n${patient.whatsappCustomNotes}`;
      }
    }

    setCustomText(text);
  }, [editedDateTime, templateType, appointment, patient, lang]);

  const handleSend = () => {
    if (!phone) {
      alert(lang === 'ar' ? 'الرجاء إدخال رقم هاتف مناسب!' : 'Veuillez entrer un numéro de téléphone valide !');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customText);
    const link = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(link, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {lang === 'ar' ? 'المساعد الذكي لتذكير المرضى بالواتساب' : 'Assistant Intelligent Rappels WhatsApp'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'ar' ? 'صياغة وإرسال رسائل التذكير والمتابعة الآلية' : 'Rédiger et envoyer des rappels et suivis'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner if patient disabled notifications */}
        {patient && patient.whatsappNotificationsEnabled === false && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 p-3 px-5 text-xs text-amber-800 dark:text-amber-450 flex items-center gap-2 font-bold shrink-0">
            <span>⚠️</span>
            <span>
              {lang === 'ar'
                ? 'تنبيه: هذا المريض ألغى الاشتراك في الرسائل التذكيرية من ملفه وعطل استقبالها كلياً!'
                : 'Attention : Ce patient a explicitement désactivé les notifications depuis son profil !'}
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`py-3 px-4 font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'send'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            💬 {lang === 'ar' ? 'إرسال تذكير مباشر' : 'Envoi Direct'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`py-3 px-4 font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'automation'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚡ {lang === 'ar' ? 'أتمتة الإرسال التلقائي الذكي (مجاناً)' : 'Automatisation 1-Click'}
          </button>
        </div>

        {activeTab === 'send' ? (
          /* Form Body */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-5 min-h-0">
            
            {/* Controls section */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'ar' ? 'اسم المريض المستلم:' : 'Patient destinataire :'}
                </label>
                <input
                  type="text"
                  disabled
                  value={appointment.patientName || ''}
                  className="w-full text-xs p-2 bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 font-bold text-slate-755 dark:text-slate-300 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'ar' ? 'رقم هاتف المريض المعتمد (الواتساب):' : 'N° WhatsApp :'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="2126XXXXXXXX"
                  className="w-full text-xs p-2 bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 font-mono font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>{lang === 'ar' ? 'تاريخ ووقت الموعد المستهدف للتعديل:' : 'Modifier Date & Heure :'}</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editedDateTime}
                    onChange={e => setEditedDateTime(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'ar' ? 'اختر قالب الرسالة الذكي المناسب:' : 'Sélectionner le gabarit :'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTemplateType('standard')}
                    className={`p-2 border rounded-lg text-right font-bold transition-all cursor-pointer ${
                      templateType === 'standard' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-450' 
                        : 'bg-white dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    ⏳ {lang === 'ar' ? 'تذكير قياسي' : 'Rappel standard'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('reschedule')}
                    className={`p-2 border rounded-lg text-right font-bold transition-all cursor-pointer ${
                      templateType === 'reschedule' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-450' 
                        : 'bg-white dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    🔄 {lang === 'ar' ? 'تعديل/تأجيل موعد' : 'Décalage / Proposition'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('postop')}
                    className={`p-2 border rounded-lg text-right font-bold transition-all cursor-pointer ${
                      templateType === 'postop' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-450' 
                        : 'bg-white dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    🦷 {lang === 'ar' ? 'متابعة بعد عملية' : 'Suivi post-op'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('warning')}
                    className={`p-2 border rounded-lg text-right font-bold transition-all cursor-pointer ${
                      templateType === 'warning' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-450' 
                        : 'bg-white dark:bg-slate-950 dark:border-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    🚨 {lang === 'ar' ? 'تحذير الحضور المتأخر' : 'Alerte retard / urgence'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Preview Box with live speech bubble */}
            <div className="flex flex-col h-full space-y-2 border-r md:border-r-0 md:border-l dark:border-slate-800 pr-0 md:pr-4">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'معاينة حية ومباشرة لمظهر الرسالة في الواتساب:' : 'Prévisualisation directe du message :'}
              </label>
              <div className="flex-1 bg-teal-50/40 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-850 font-mono text-[11px] flex flex-col justify-between overflow-hidden">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 pb-1.5 border-b dark:border-slate-850">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>WhatsApp Beta Link Generator</span>
                  </div>
                  <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    rows={8}
                    className="w-full text-xs p-2 bg-emerald-50/20 dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 rounded-lg resize-none leading-relaxed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-sans italic">
                  💡 {lang === 'ar' ? '* يمكنك تعديل نص الرسالة أعلاه يدوياً بشكل كامل وحر.' : '* Vous pouvez modifier librement ce texte pré-généré.'}
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* WhatsApp Web Automation Instructions Hub */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
            
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-450 flex items-center gap-1.5 text-xs">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'كيف تعمل أتمتة الإرسال بلمسة واحدة؟' : 'Comment fonctionne l\'envoi automatique ?'}</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-[10.5px]">
                {lang === 'ar'
                  ? 'بسبب قيود المتصفح الأمنية (Same-Origin Policy)، يُمنع على أي نظام خارجي التحكم بصندوق إرسال WhatsApp Web الخاص بك مباشرة لحماية الخصوصية. لتخطي هذا القيد والوصول للأتمتة الكاملة (منع عناء نقر زر الإرسال يدوياً)، نستخدم إضافة تصفح آمنة ومجانية تماماً تدير هذه الخطوة محلياً لمصلحتك.'
                  : 'En raison du protocole de sécurité Internet, une page externe ne peut commander la fenêtre WhatsApp Web à votre place. Pour contourner cela et envoyer vos messages sans cliquer sur le bouton d\'envoi, vous pouvez activer un mini-script local gratuit de manière ultra-sécurisée.'}
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px]">
                <Shield className="w-4 h-4 text-teal-600 font-bold" />
                <span>{lang === 'ar' ? 'طريقة الربط الآمنة والتشغيل في 3 خطوات سهلة:' : 'Étapes simples pour l\'activation :'}</span>
              </h5>
              <ol className="list-decimal list-inside space-y-2 text-[10.5px] text-slate-600 dark:text-slate-400">
                <li>
                  {lang === 'ar'
                    ? 'قم بتثبيت إضافة المتصفح المجانية Tampermonkey (أو Violentmonkey) بضغطة واحدة من متجر Chrome.' 
                    : 'Installez l\'extension navigateur standard Tampermonkey depuis le Chrome Web Store.'}
                </li>
                <li>
                  {lang === 'ar'
                    ? 'افتح الإضافة واضغط على زر "إضافة سكريبت جديد" (Create a new script).'
                    : 'Ouvrez Tampermonkey et créez un nouveau script.'}
                </li>
                <li>
                  {lang === 'ar'
                    ? 'انسخ الكود البرمجي الذكي الموضح أدناه، استبدل الكود الموجود في الإضافة بالكامل به، ثم احفظ الملف (Ctrl + S).'
                    : 'Copiez le code ci-dessous, remplacez tout le contenu existant par celui-ci, puis sauvegardez (Ctrl + S).'}
                </li>
              </ol>
            </div>

            {/* User script rendering */}
            <div className="space-y-1">
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-950 p-2 rounded-t-xl border-t border-x border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[9.5px] text-slate-500 flex items-center gap-1 leading-none">
                  <Terminal className="w-3.5 h-3.5 text-teal-650" />
                  <span>whatsapp_auto_send.user.js</span>
                </span>
                
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className={`px-3 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCopied 
                      ? 'bg-emerald-600 text-white font-extrabold scale-102 shadow-xs' 
                      : 'bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <CheckCheck className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'تم نسخ الكود بنجاح!' : 'Copié !'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3" />
                      <span>{lang === 'ar' ? 'نسخ كود الأتمتة البرمجي' : 'Copier script d\'automatisation'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-955 text-emerald-400 font-mono text-[10px] p-3 rounded-b-xl max-h-[140px] overflow-y-auto border-b border-x border-slate-900 shadow-inner leading-relaxed select-all" dir="ltr">
                <pre>{`// ==UserScript==
// @name         مُرسل عيادة الأسنان التلقائي (Dental Clinic Auto Sender)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  أتمتة الضغط التلقائي على زر الإرسال بمجرد تحميل المحادثة في واتساب ويب لتقليل تكرار النقر يدويًا
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    setInterval(() => {
        // البحث عن زر الإرسال الأخضر في واتساب ويب
        const sendButton = document.querySelector('button span[data-icon="send"]') || 
                           document.querySelector('button[aria-label="إرسال"]') || 
                           document.querySelector('button[aria-label="Send"]');
        if (sendButton) {
            const chatInput = document.querySelector('div[contenteditable="true"]');
            if (chatInput && chatInput.textContent.trim().length > 0) {
                // تفعيل ضغط الزر التلقائي الآمن
                const parentButton = sendButton.closest('button');
                if (parentButton) {
                    parentButton.click();
                } else {
                    sendButton.click();
                }
            }
        }
    }, 2000);
})();`}</pre>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-slate-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-[10px] text-blue-800 dark:text-blue-350 flex gap-2">
              <span className="text-sm">💡</span>
              <p>
                {lang === 'ar' 
                  ? 'بمجرد انتهائك من الإعداد، سيكون كافياً الضغط على زر الإرسال في نظامنا، وستفتح صفحة WhatsApp Web لترسل الرسالة وتغلق تلقائياً أو تظل مرسلة فوراً دون أي كبس زر منك.'
                  : 'Une fois configuré, chaque clic sur "Envoyer par WhatsApp" dans notre gestionnaire ouvrira l\'onglet et cliquera automatiquement sur Envoyer ! Un gain de temps précieux au quotidien.'}
              </p>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t dark:border-slate-800 flex gap-2.5 justify-end bg-slate-50 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            {lang === 'ar' ? 'إلغاء' : 'Fermer'}
          </button>
          
          <button
            type="button"
            onClick={handleSend}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إرسال الرسالة بالواتساب' : 'Envoyer par WhatsApp'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

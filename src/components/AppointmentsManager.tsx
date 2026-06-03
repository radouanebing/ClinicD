/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import { Calendar, Plus, Edit, X, CalendarDays, DollarSign, MessageSquare, Check, AlertCircle } from 'lucide-react';

interface AppointmentsProps {
  appointments: Appointment[];
  patients: Patient[];
  onSaveAppointment: (appt: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
  lang?: string;
  currency?: string;
  currentUser?: { role: 'doctor' | 'assistant' | 'receptionist'; name: string } | null;
  whatsappSettings?: any;
}

export default function AppointmentsManager({
  appointments,
  patients,
  onSaveAppointment,
  onDeleteAppointment,
  lang = 'ar',
  currency = 'د.م',
  currentUser,
  whatsappSettings
}: AppointmentsProps) {
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [treatmentType, setTreatmentType] = useState('كشف أولي وتنظيف');
  const [price, setPrice] = useState(300);
  const [paidAmount, setPaidAmount] = useState(300);
  const [status, setStatus] = useState<Appointment['status']>('scheduled');
  const [notes, setNotes] = useState('');

  // Filters state
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'tomorrow'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'canceled'>('all');

  const startEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setSelectedPatientId(appt.patientId);
    setDateTime(appt.dateTime);
    setTreatmentType(appt.treatmentType);
    setPrice(appt.price || 0);
    setPaidAmount(appt.paidAmount || 0);
    setStatus(appt.status);
    setNotes(appt.notes || '');
    setShowAddForm(true); // Open form
  };

  const cancelEdit = () => {
    setEditingAppt(null);
    setSelectedPatientId('');
    setDateTime('');
    setTreatmentType('كشف أولي وتنظيف');
    setPrice(300);
    setPaidAmount(300);
    setStatus('scheduled');
    setNotes('');
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !dateTime) {
      alert('الرجاء اختيار المريض وتحديد موعد الجلسة!');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const savedAppt: Appointment = {
      id: editingAppt ? editingAppt.id : `appt_${Date.now()}`,
      patientId: selectedPatientId,
      patientName: patient.name,
      patientPhone: patient.phone,
      dateTime,
      treatmentType,
      status,
      price: Number(price),
      paidAmount: Number(paidAmount),
      notes: notes.trim() || undefined
    };

    onSaveAppointment(savedAppt);
    cancelEdit();
  };

  // WhatsApp reminder generator helper
  const handleGenerateWhatsAppLink = (appt: Appointment) => {
    if (!appt.patientPhone) {
      alert('عذراً، هذا المريض لا يمتلك رقم هاتف مسجل لإرسال التذكير!');
      return;
    }

    const patient = patients.find(p => p.id === appt.patientId);

    if (patient && patient.whatsappNotificationsEnabled === false) {
      const confirmOverride = window.confirm(
        lang === 'ar'
          ? `تنبيه: هذا المريض (${patient.name}) ألغى الاشتراك في إشعارات واتساب تفادياً للإزعاج.\n\nهل تريد الاستمرار وإرسال التذكير اليدوي له على أي حال؟`
          : `Attention : Ce patient (${patient.name}) a désactivé les notifications WhatsApp dans son profil.\n\nVoulez-vous forcer l'envoi manuel malgré tout ?`
      );
      if (!confirmOverride) return;
    }

    // Clean phone number (remove +, spaces, leading zeros if internationalized)
    const cleanPhone = appt.patientPhone.replace(/\D/g, '');

    // Format Arabic date & time beautifully
    const dateObj = new Date(appt.dateTime);
    const dateFormatted = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeFormatted = dateObj.toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Decide template type using patient config
    const template = patient?.preferredReminderTemplate || 'standard';
    let message = '';

    const replacePlaceholders = (templateStr: string) => {
      return templateStr
        .replace(/{patientName}/g, appt.patientName)
        .replace(/{dateFormatted}/g, dateFormatted)
        .replace(/{timeFormatted}/g, timeFormatted)
        .replace(/{treatmentType}/g, appt.treatmentType || '');
    };

    if (lang === 'ar') {
      const customTmpl = whatsappSettings?.templatesAr?.[template];
      if (customTmpl) {
        message = replacePlaceholders(customTmpl);
      } else {
        if (template === 'standard') {
          message = `مرحباً ${appt.patientName}، 🌸\n\nنود تذكيركم بموعد عيادة الأسنان القادم:\n📅 التاريخ: ${dateFormatted}\n⏰ الوقت: ${timeFormatted}\n🦷 المعالجة: ${appt.treatmentType}\n\nنتمنى لكم دوام الصحة والعافية، يرجى تأكيد الحضور بالرد على هذه الرسالة. دمت سالماً!`;
        } else if (template === 'reschedule') {
          message = `مرحباً ${appt.patientName}، 🌸\n\nبناءً على جدول العيادة، نقترح تعديل وقت موعدكم السني ليصبح:\n📅 التاريخ الجديد: ${dateFormatted}\n⏰ الوقت الجديد: ${timeFormatted}\n\nهل هذا التوقيت يناسبكم؟ يرجى الرد لتأكيد التحديث. شكراً!`;
        } else if (template === 'postop') {
          message = `مرحباً ${appt.patientName}، 🦷\n\nنطمئن على حالتكم بعد العلاج لـ (${appt.treatmentType}).\n\n📌 توصيات مهمة:\n- عدم تناول المأكولات الساخنة اليوم.\n- الالتزام بالوصفة الطبية المحددة.\n\nنتمنى لكم شفاءً عاجلاً!`;
        } else if (template === 'warning') {
          message = `تنبيه هام ومستعجل لجلسة علاج الأسنان للرعاية بـ ${appt.patientName}، 🚨\n\nمجدول حضورك في تمام الساعة: ${timeFormatted}.\n\nالرجاء الحضور قبل الموعد بـ 10 دقائق لضمان عدم إلغاء الجلسة نظراً لضغط قائمة الطبيب. شكراً لتعاونكم!`;
        }
      }

      if (patient?.whatsappCustomNotes) {
        message += `\n\n📌 ملاحظة إضافية:\n${patient.whatsappCustomNotes}`;
      }
    } else {
      const customTmpl = whatsappSettings?.templatesFr?.[template];
      if (customTmpl) {
        message = replacePlaceholders(customTmpl);
      } else {
        if (template === 'standard') {
          message = `Bonjour ${appt.patientName}, 🌸\n\nNous vous rappelons votre prochain RDV au cabinet dentaire :\n📅 Date : ${dateFormatted}\n⏰ Heure : ${timeFormatted}\n🦷 Acte : ${appt.treatmentType}\n\nMerci de confirmer votre présence. Bien à vous !`;
        } else if (template === 'reschedule') {
          message = `Bonjour ${appt.patientName}, 🌸\n\nNous vous proposons de reporter votre séance au :\n📅 Nouvelle Date : ${dateFormatted}\n⏰ Nouvel Horaire : ${timeFormatted}\n\nEst-ce que cela vous convient ? Merci de répondre.`;
        } else if (template === 'postop') {
          message = `Bonjour ${appt.patientName}, 🦷\n\nNous venons aux nouvelles suites à votre intervention pour (${appt.treatmentType}).\n\n📌 Consignes :\n- Aliments tièdes ou froids aujourd'hui.\n- Suivi de l'ordonnance dentaire.\n\nBon rétablissement !`;
        } else if (template === 'warning') {
          message = `IMPORTANT : Bonjour ${appt.patientName}, 🚨\n\nVotre RDV de soins est planifié pour ${timeFormatted}.\n\nMerci de vous présenter 10 minutes en avance pour éviter toute annulation. Merci !`;
        }
      }

      if (patient?.whatsappCustomNotes) {
        message += `\n\n📌 Note spéciale :\n${patient.whatsappCustomNotes}`;
      }
    }

    const encodedText = encodeURIComponent(message);
    const link = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    // Open link in target blank safari or chrome friendly
    window.open(link, '_blank');
  };

  const treatmentTemplates = [
    'كشف أولي وعلاج ألم',
    'تنظيف الجير والكلس وتلميع الأسنان',
    'علاج عصب (حشو جذور)',
    'حشو تجميلي كومبوزيت سليم',
    'قلع سن بسيط',
    'جراحة خلع ضرس عقل مطمور',
    'تركيب زراعة أسنان تيتانيوم',
    'تلبيس خزفي / سيراميك زيركون',
    'تبييض الأسنان بالليزر',
    'تصحيح وتقويم الأسنان'
  ];

  // Helper date matching
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr.includes(today);
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return dateStr.includes(tomorrow);
  };

  const filteredAppts = appointments.filter(appt => {
    // Date filter
    if (filterDate === 'today' && !isToday(appt.dateTime)) return false;
    if (filterDate === 'tomorrow' && !isTomorrow(appt.dateTime)) return false;

    // Status filter
    if (filterStatus !== 'all' && appt.status !== filterStatus) return false;

    return true;
  }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards inside Appointment section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">المواعيد الكلية</span>
          <span className="text-xl font-black text-slate-800 font-mono">{appointments.length}</span>
        </div>
        <div className="bg-sky-50 text-sky-800 p-4 rounded-xl border border-sky-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-sky-600 block mb-1">المجدولة حالياً</span>
          <span className="text-xl font-black font-mono">{appointments.filter(a => a.status === 'scheduled').length}</span>
        </div>
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1 font-semibold">مكتملة الصيانة</span>
          <span className="text-xl font-black font-mono">{appointments.filter(a => a.status === 'completed').length}</span>
        </div>
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 block mb-1 font-semibold">مداخيل المواعيد</span>
          <span className="text-xl font-black text-slate-800 font-mono">
            {appointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0)} {currency}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex-col sm:flex-row gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="text-sky-500 w-5 h-5" />
            <span>تنظيم مواعيد العيادة والتحكم بها</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">جدولة وتنظيم المواعيد وتوليد تذكيرات هاتفية مباشرة عبر الواتساب بنقرة زر.</p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => { cancelEdit(); setShowAddForm(true); }}
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>حجز موعد جديد</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4 transition-all">
          <h3 className="text-xs font-black uppercase text-slate-500 border-b pb-2 flex items-center justify-between">
            <span>{editingAppt ? 'تعديل بيانات جلسة موعد مسبق' : 'حجز موعد عيادة جديد'}</span>
            <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Select Patient */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">المريض الفعلي *</label>
              <select
                required
                disabled={!!editingAppt}
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
              >
                <option value="">-- تخير مريض الأسنان --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                ))}
              </select>
            </div>

            {/* Date Time Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">التاريخ والوقت لجلسة الكشف *</label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={e => setDateTime(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            {/* Treatment Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">نوع التدخل العلاجي</label>
              <select
                value={treatmentType}
                onChange={e => setTreatmentType(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                {treatmentTemplates.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="علاج مخصص آخر">تدخل مخصّص آخر...</option>
              </select>
              {treatmentType === 'علاج مخصص آخر' && (
                <input
                  type="text"
                  placeholder="حدد العلاج بدقة..."
                  onChange={e => setTreatmentType(e.target.value)}
                  className="w-full text-xs mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              )}
            </div>

            {/* Finance - session price */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">تكلفة الجلسة الكلية ({currency})</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            {/* Finance - paid amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ المدفوع حينه ({currency})</label>
              <input
                type="number"
                min="0"
                max={price}
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            {/* Session status selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">حالة الموعد</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold"
              >
                <option value="scheduled">⏱️ مجدول (قادم)</option>
                <option value="completed">✅ مكتمل (تمت معالجة المريض)</option>
                <option value="canceled">❌ ملغي (تم الاعتذار)</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات الطبيب بخصوص الزيارة</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="تفاصيل التخدير، موضع الحشو، إلخ..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-16 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-xl cursor-pointer"
            >
              تحييد / إلغاء
            </button>
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-xl cursor-pointer"
            >
              {editingAppt ? 'حفظ تعديلات الموعد' : 'تأكيد وحجز الموعد'}
            </button>
          </div>
        </form>
      )}

      {/* List section with visual filtering */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
        {/* Filtering Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>فلترة العرض والتنقيب:</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Date filter group */}
            <div className="flex bg-slate-100 rounded-lg p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFilterDate('all')}
                className={`py-1 px-3 rounded-md transition-colors cursor-pointer ${filterDate === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                كل الفترات
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('today')}
                className={`py-1 px-3 rounded-md transition-colors cursor-pointer ${filterDate === 'today' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('tomorrow')}
                className={`py-1 px-3 rounded-md transition-colors cursor-pointer ${filterDate === 'tomorrow' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                الغد
              </button>
            </div>

            {/* Status filter dropdown */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 focus:outline-none text-slate-600 font-bold"
            >
              <option value="all">كل الحالات المعينة</option>
              <option value="scheduled">المواعيد القادمة فقط</option>
              <option value="completed">المرضى المنجزين</option>
              <option value="canceled">الملغية / المعتذرين</option>
            </select>
          </div>
        </div>

        {/* List Grid */}
        {filteredAppts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
             لا تتوفر مواعيد مسجلة تطابق محددات البحث المقررة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppts.map(appt => {
              const remaining = (appt.price || 0) - (appt.paidAmount || 0);
              
              return (
                <div
                  key={appt.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow ${
                    appt.status === 'completed'
                      ? 'border-emerald-100 bg-emerald-50/20'
                      : appt.status === 'canceled'
                      ? 'border-rose-100 bg-rose-50/30'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{appt.patientName}</h4>
                        <span className="text-[10px] text-slate-500 mt-0.5 block font-mono font-semibold">
                          📱 {appt.patientPhone || 'رقم مفقود'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        appt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appt.status === 'canceled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {appt.status === 'completed' ? 'مكتمل' : appt.status === 'canceled' ? 'ملغي' : 'مجدول'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 space-y-1.5 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">موعد وتوقيت الكشف:</span>
                        <strong className="text-slate-800 font-mono">
                          {new Date(appt.dateTime).toLocaleString('ar-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">نوع المعالجة والعيادة:</span>
                        <span className="text-slate-800 font-bold">{appt.treatmentType}</span>
                      </div>
                      {appt.notes && (
                        <p className="text-[10px] text-slate-400 block border-t pt-1.5 mt-1">ملاحظات: {appt.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Financial aspect and action buttons */}
                  <div className="border-t border-dashed mt-4 pt-3 space-y-3">
                    <div className="flex justify-between items-center text-[11px] text-slate-600 font-bold">
                      <span className="flex items-center gap-0.5 text-slate-400 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        الجانب المالي:
                      </span>
                      <div className="space-x-2 shrink-0">
                        <span className="text-slate-800 font-mono">إجمالي: {appt.price} {currency}</span>
                        <span className="text-emerald-600 font-mono">دفَع: {appt.paidAmount} {currency}</span>
                        {remaining > 0 && (
                          <span className="text-rose-500 font-mono">متبقٍ: {remaining} {currency}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1.5 justify-end">
                      {/* WhatsApp trigger */}
                      {appt.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleGenerateWhatsAppLink(appt)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          title="إرسال تذكير بالموعد والمطالبة بالحضور عبر واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>تذكير بالواتساب</span>
                        </button>
                      )}
                      
                      {/* Edit option */}
                      <button
                        type="button"
                        onClick={() => startEdit(appt)}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-extrabold py-1.5 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      {/* Delete */}
                      {onDeleteAppointment && currentUser?.role !== 'receptionist' && (
                        <button
                          type="button"
                          onClick={() => onDeleteAppointment(appt.id)}
                          className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

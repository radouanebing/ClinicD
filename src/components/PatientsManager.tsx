/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, Appointment, Prescription, ToothState } from '../types';
import DentalChart from './DentalChart';
import { Search, UserPlus, Phone, Edit, User, Trash2, ShieldAlert, Heart, Clipboard, FileText, ArrowLeft, Plus, Camera, Image, Eye, ZoomIn, Trash } from 'lucide-react';

interface PatientsManagerProps {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  onSavePatient: (patient: Patient) => void;
  onDeletePatient?: (id: string) => void;
  lang?: string;
  currency?: string;
  currentUser?: { role: 'doctor' | 'assistant' | 'receptionist'; name: string } | null;
}

export default function PatientsManager({
  patients,
  appointments,
  prescriptions,
  onSavePatient,
  onDeletePatient,
  lang = 'ar',
  currency = 'د.م',
  currentUser
}: PatientsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInName, setSearchInName] = useState(true);
  const [searchInPhone, setSearchInPhone] = useState(true);
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [ageMin, setAgeMin] = useState<number>(0);
  const [ageMax, setAgeMax] = useState<number>(120);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Highlight search matches during typing
  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return <span>{text}</span>;
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-bold px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Selected patient to view full history/details
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  // State to zoom/lightbox radiology x-rays
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Form states of Patient creation/editing
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('2126XXXXXX');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [notes, setNotes] = useState('');

  // WhatsApp notifications & messaging control state
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(true);
  const [preferredReminderTemplate, setPreferredReminderTemplate] = useState<'standard' | 'reschedule' | 'postop' | 'warning'>('standard');
  const [reminderTimingHoursBefore, setReminderTimingHoursBefore] = useState(24);
  const [whatsappCustomNotes, setWhatsappCustomNotes] = useState('');

  const activePatient = patients.find(p => p.id === activePatientId);

  const startEdit = (p: Patient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPatient(p);
    setName(p.name);
    setPhone(p.phone);
    setPhoneSecondary(p.phoneSecondary || '');
    setAge(p.age);
    setGender(p.gender);
    setNotes(p.notes || '');
    setWhatsappNotificationsEnabled(p.whatsappNotificationsEnabled !== false);
    setPreferredReminderTemplate(p.preferredReminderTemplate || 'standard');
    setReminderTimingHoursBefore(p.reminderTimingHoursBefore ?? 24);
    setWhatsappCustomNotes(p.whatsappCustomNotes || '');
    setShowAddForm(true);
  };

  const cancelAddOrEdit = () => {
    setEditingPatient(null);
    setName('');
    setPhone('2126XXXXXX');
    setPhoneSecondary('');
    setAge(30);
    setGender('male');
    setNotes('');
    setWhatsappNotificationsEnabled(true);
    setPreferredReminderTemplate('standard');
    setReminderTimingHoursBefore(24);
    setWhatsappCustomNotes('');
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('الرجاء إدخال اسم المريض ورقم الهاتف الخاص بالواتساب!');
      return;
    }

    const savedPatient: Patient = {
      id: editingPatient ? editingPatient.id : `pat_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      phoneSecondary: phoneSecondary.trim() || undefined,
      age: Number(age),
      gender,
      notes: notes.trim() || undefined,
      createdAt: editingPatient ? editingPatient.createdAt : new Date().toISOString(),
      // Retain teeth status on edit, or brand new default healthy records
      dentalChart: editingPatient ? editingPatient.dentalChart : {},
      radiologyImages: editingPatient ? editingPatient.radiologyImages : undefined,
      whatsappNotificationsEnabled,
      preferredReminderTemplate,
      reminderTimingHoursBefore: Number(reminderTimingHoursBefore),
      whatsappCustomNotes: whatsappCustomNotes.trim() || undefined
    };

    onSavePatient(savedPatient);
    cancelAddOrEdit();

    // If we were viewing the profile, let's keep view updated
    if (activePatientId && activePatientId === savedPatient.id) {
      // Refresh
    }
  };

  const handleToothStatusChange = (toothNumber: number, status: ToothState['status']) => {
    if (!activePatient) return;

    const updatedPatient: Patient = {
      ...activePatient,
      dentalChart: {
        ...activePatient.dentalChart,
        [toothNumber]: status
      }
    };

    onSavePatient(updatedPatient);
  };

  const handleRadiologyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1048) {
      alert(lang === 'ar' ? 'عذراً، حجم الصورة الإشعاعية كبير جداً! يرجى اختيار ملف يقل عن 2.5 ميجابايت لمراعاة قيود قاعدة البيانات.' : 'Fichier trop lourd ! Veuillez choisir une image de moins de 2.5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (activePatient) {
        const currentImages = activePatient.radiologyImages || [];
        onSavePatient({
          ...activePatient,
          radiologyImages: [...currentImages, base64]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveRadiologyImage = (indexToRemove: number) => {
    if (!activePatient) return;
    
    const confirmMsg = lang === 'ar' 
      ? 'هل أنت متأكد من رغبتك في حذف هذه الصورة الإشعاعية لملف المريض بشكل نهائي؟' 
      : 'Voulez-vous vraiment supprimer définitivement cette radiographie ?';
      
    if (window.confirm(confirmMsg)) {
      const currentImages = activePatient.radiologyImages || [];
      const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
      onSavePatient({
        ...activePatient,
        radiologyImages: updatedImages
      });
      setZoomImage(null);
    }
  };

  const filteredPatients = patients.filter(p => {
    const query = searchTerm.toLowerCase().trim();
    
    // 1. Search Query Match
    let matchesQuery = !query; // matches everything if query is empty
    if (query) {
      const matchName = searchInName && p.name.toLowerCase().includes(query);
      const matchPhone = searchInPhone && p.phone.includes(query);
      const matchNotes = searchInNotes && p.notes && p.notes.toLowerCase().includes(query);
      matchesQuery = !!(matchName || matchPhone || matchNotes);
    }
    
    // 2. Gender Match
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    
    // 3. Age Match
    const matchesAge = p.age >= ageMin && p.age <= ageMax;
    
    return matchesQuery && matchesGender && matchesAge;
  });

  return (
    <div className="space-y-6">
      {!activePatientId ? (
        <>
          {/* Main List & Search view */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clipboard className="text-sky-500 w-5 h-5" />
                <span>ملفات وسجل المرضى والرعاية الصحية</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                إدارة السجلات الحيوية للمرضى، التعديل الفوري للملفات ومتابعة حالة الـ 32 سناً لكل مراجع في العيادة.
              </p>
            </div>

            {!showAddForm && (
              <button
                onClick={() => { cancelAddOrEdit(); setShowAddForm(true); }}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>تسجيل مريض جديد</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
                {editingPatient ? `تحرير بيانات المريض: ${editingPatient.name}` : 'تسجيل ملف طبي لمريض جديد'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الاسم الكامل للمريض *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد أحمد"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم هاتف الواتساب (للتذكير) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 212612345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">تأكد من إدراج رمز الدولة (مثال: 212 بالمغرب، 20 بمصر)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم هاتف إضافي (بديل/أرضي)</label>
                  <input
                    type="text"
                    placeholder="مثال: 05XXXXXXXX"
                    value={phoneSecondary}
                    onChange={e => setPhoneSecondary(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">العمر / السن</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الجنس</label>
                  <div className="flex bg-slate-100 rounded-lg p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 py-1.5 rounded-md text-center font-bold cursor-pointer transition-all ${gender === 'male' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                    >
                      🗣️ ذكر
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 py-1.5 rounded-md text-center font-bold cursor-pointer transition-all ${gender === 'female' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-855'}`}
                    >
                      👩‍⚕️ أنثى
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                    <span>التاريخ الطبي أو الحساسية أو علامات فارقة</span>
                    {currentUser?.role === 'receptionist' && <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">🔒 للقراءة فقط (متاح للتعديل الطبي فقط)</span>}
                  </label>
                  <textarea
                    placeholder="مثال: لديه حساسية من عقار البنسلين، مصاب بالسكري، يخاف بشدة من الحقن البنجية..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={currentUser?.role === 'receptionist'}
                    className={`w-full text-xs p-2.5 border border-slate-200 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-sky-500 ${currentUser?.role === 'receptionist' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-55'}`}
                  />
                </div>

                {/* WhatsApp Notification Controls */}
                <div className="md:col-span-3 border-t pt-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <span>💬</span>
                    <span>التحكم في تنبيهات وإشعارات الواتساب (WhatsApp Controls)</span>
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Toggle */}
                    <div className="flex flex-col justify-center">
                      <label className="block text-xs font-bold text-slate-600 mb-1">الرغبة في تلقي الإشعارات</label>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={whatsappNotificationsEnabled}
                          onChange={e => setWhatsappNotificationsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="right-2 text-xs font-semibold text-slate-700 select-none mr-2">
                          {whatsappNotificationsEnabled ? '🟢 تفعيل الإشعارات' : '❌ تعطيل الإشعارات'}
                        </span>
                      </label>
                    </div>

                    {/* Preferred template */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">قالب التذكير المفضل لهذا المريض</label>
                      <select
                        value={preferredReminderTemplate}
                        onChange={e => setPreferredReminderTemplate(e.target.value as any)}
                        disabled={!whatsappNotificationsEnabled}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                      >
                        <option value="standard">⏳ تذكير قياسي بالموعد</option>
                        <option value="reschedule">🔄 اقتراح تعديل/تأجيل موعد</option>
                        <option value="postop">🦷 رعاية ومتابعة بعد عملية جراحية</option>
                        <option value="warning">🚨 تحذير الحضور العاجل</option>
                      </select>
                    </div>

                    {/* Dynamic Hours timing */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">وقت التنبيه المفضل (قبل الموعد بالساعة)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={reminderTimingHoursBefore}
                        onChange={e => setReminderTimingHoursBefore(Number(e.target.value))}
                        disabled={!whatsappNotificationsEnabled}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                        placeholder="مثال: 24"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block font-semibold">كم ساعة قبل الجلسة يراد التنبيه خلالها (مثال: 24)</span>
                    </div>

                    {/* Custom note to append */}
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-bold text-slate-600 mb-1">تذييل مخصص وملحوظات إضافية لنص رسائل الواتساب</label>
                      <input
                        type="text"
                        placeholder="مثال: يرجى تأكيد حضورك بالرد، أو إحضار صورة الأشعة السابقة معك."
                        value={whatsappCustomNotes}
                        onChange={e => setWhatsappCustomNotes(e.target.value)}
                        disabled={!whatsappNotificationsEnabled}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={cancelAddOrEdit}
                  className="bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-xl cursor-pointer"
                >
                  إلغاء التغييرات
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl cursor-pointer shadow-xs"
                >
                  {editingPatient ? 'حفظ تعديل المريض' : 'حفظ المريض والملف'}
                </button>
              </div>
            </form>
          )}
            {/* Advanced Search & Filtering Board */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ابحث باسم المريض، رقم جواله أو سيرته المرضية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all font-medium text-slate-800"
                />
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
              
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showAdvancedFilters || genderFilter !== 'all' || ageMin > 0 || ageMax < 120 || !searchInName || !searchInPhone || !searchInNotes
                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>⚙️ خيارات البحث المتقدم</span>
                <span className="text-[10px] bg-slate-250 text-slate-800 dark:bg-slate-850 dark:text-slate-200 rounded-full px-2 py-0.5 leading-none font-extrabold">
                  {[genderFilter !== 'all' && 'جنس', (ageMin > 0 || ageMax < 120) && 'عمر', (!searchInName || !searchInPhone || !searchInNotes) && 'حقول'].filter(Boolean).length || '0'}
                </span>
              </button>
            </div>

            {/* Advanced Filters Drawer */}
            {(showAdvancedFilters || searchTerm.trim().length > 0) && (
              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 text-xs space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* Where to Search Checkboxes */}
                  <div>
                    <span className="font-bold text-slate-500 block mb-1.5">البحث في الحقول:</span>
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-1.5 bg-white border px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-50 select-none">
                        <input
                          type="checkbox"
                          checked={searchInName}
                          onChange={(e) => setSearchInName(e.target.checked)}
                          className="rounded text-sky-500 focus:ring-sky-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-705">الاسم</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-white border px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-50 select-none">
                        <input
                          type="checkbox"
                          checked={searchInPhone}
                          onChange={(e) => setSearchInPhone(e.target.checked)}
                          className="rounded text-sky-500 focus:ring-sky-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-705">الهاتف</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-white border px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-50 select-none">
                        <input
                          type="checkbox"
                          checked={searchInNotes}
                          onChange={(e) => setSearchInNotes(e.target.checked)}
                          className="rounded text-sky-500 focus:ring-sky-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-705">التاريخ الطبي</span>
                      </label>
                    </div>
                  </div>

                  {/* Gender filter */}
                  <div>
                    <span className="font-bold text-slate-500 block mb-1.5 font-sans">تصفية حسب الجنس:</span>
                    <div className="flex bg-white rounded-lg p-0.5 border">
                      {(['all', 'male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGenderFilter(g)}
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                            genderFilter === g
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {g === 'all' ? 'الكل' : g === 'male' ? '👨 ذكور' : '👩 إناث'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Range slider/inputs */}
                  <div>
                    <span className="font-bold text-slate-500 block mb-1.5 font-sans">تصفية حسب الأعمار:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1 flex-1">
                        <span className="text-[10px] text-slate-400">من</span>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={ageMin}
                          onChange={(e) => setAgeMin(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-10 text-[11px] p-0 border-0 focus:ring-0 text-center font-bold"
                        />
                      </div>
                      <span className="text-slate-405 block">-</span>
                      <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1 flex-1">
                        <span className="text-[10px] text-slate-400">إلى</span>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={ageMax}
                          onChange={(e) => setAgeMax(Math.min(120, parseInt(e.target.value) || 120))}
                          className="w-10 text-[11px] p-0 border-0 focus:ring-0 text-center font-bold"
                        />
                      </div>
                      <span className="text-[10px] text-slate-405 font-semibold">سنة</span>
                    </div>
                  </div>

                </div>

                {/* Match statistics */}
                <div className="border-t border-slate-200/60 pt-2.5 flex flex-col sm:flex-row justify-between items-center text-[11px] gap-2">
                  <span className="text-slate-500">
                    تم العثور على <strong className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">{filteredPatients.length}</strong> من أصل <strong className="text-slate-700">{patients.length}</strong> مرضى مسجلين.
                  </span>
                  {(searchTerm || genderFilter !== 'all' || ageMin > 0 || ageMax < 120 || !searchInName || !searchInPhone || !searchInNotes) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setGenderFilter('all');
                        setAgeMin(0);
                        setAgeMax(120);
                        setSearchInName(true);
                        setSearchInPhone(true);
                        setSearchInNotes(true);
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold bg-white hover:bg-rose-50/50 border border-slate-200 rounded px-2.5 py-1 shadow-xs transition-colors cursor-pointer"
                    >
                      ✕ إعادة تعيين المرشحات
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Patients Listing Grid */}
          {filteredPatients.length === 0 ? (
            <div className="bg-white py-12 rounded-2xl border border-slate-100 shadow-xs text-center text-slate-450 text-xs">
              لم يتم العثور على أي ملف مريض يطابق هذا البحث المتقدم.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => {
                const countApps = appointments.filter(a => a.patientId === patient.id).length;
                const countPres = prescriptions.filter(p => p.patientId === patient.id).length;
                const hasSicknessNotes = patient.notes && patient.notes.length > 0;

                return (
                  <div
                    key={patient.id}
                    onClick={() => setActivePatientId(patient.id)}
                    className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Name Card */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold leading-none ${
                            patient.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xs text-slate-800">
                              {highlightText(patient.name, searchInName ? searchTerm : '')}
                            </h3>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{patient.age} سنة • {patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={(e) => startEdit(patient, e)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-500 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="تعديل الملف السكاني"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {onDeletePatient && currentUser?.role === 'doctor' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`هل أنت متأكد من رغبتك في حذف ملف المريض (${patient.name}) ومسح كافة مواعيده ووصفاته؟`)) {
                                  onDeletePatient(patient.id);
                                }
                              }}
                              className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="حذف المريض كلياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Phone indicator */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-mono font-semibold">
                          {highlightText(patient.phone, searchInPhone ? searchTerm : '')}
                        </span>
                      </div>

                      {/* Allergy warns */}
                      {hasSicknessNotes && (
                        <div className="bg-rose-50/70 p-2 text-[10px] text-rose-800 border border-rose-100 rounded-lg flex gap-1 items-start">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          <p className="line-clamp-2 leading-relaxed">
                            {highlightText(patient.notes || '', searchInNotes ? searchTerm : '')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-dashed mt-4 pt-3 flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>إجمالي المواعيد: <strong className="text-slate-700">{countApps}</strong></span>
                      <span>الوصفات: <strong className="text-slate-700">{countPres}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Detailed Patient Digital Folder (مجلد طبي مفصل مع سجل الأسنان التفاعلي) */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
          <button
            onClick={() => setActivePatientId(null)}
            className="text-xs text-sky-600 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-slate-50 py-1.5 px-3 rounded-lg border"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة لملفات المرضى بالعيادة</span>
          </button>

          {activePatient && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-slate-50 rounded-2xl p-5 border flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black leading-none ${
                    activePatient.gender === 'female' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {activePatient.name[0]}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-800 leading-none">{activePatient.name}</h3>
                    <p className="text-xs text-slate-500">
                      مريض مسجل برقم معرف: <span className="font-mono">{activePatient.id}</span> • {activePatient.age} سنة • {activePatient.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        رقم هاتف المريض: <strong className="font-mono text-slate-800 font-bold">{activePatient.phone}</strong>
                      </span>
                      {activePatient.phoneSecondary && (
                        <span>هاتف بديل: <strong className="font-mono">{activePatient.phoneSecondary}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startEdit(activePatient)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold py-2 px-4 rounded-xl border border-sky-100 h-fit cursor-pointer flex items-center gap-1.5 self-start"
                >
                  <Edit className="w-4 h-4" />
                  <span>تعديل السيرة الديموغرافية</span>
                </button>
              </div>

              {/* Patient core medical state alerts */}
              {activePatient.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-amber-950 text-xs flex gap-2 items-start shadow-xs">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">تنبيه التاريخ الطبي وسوابق الأمراض:</strong>
                    <p className="mt-1 leading-relaxed font-semibold">{activePatient.notes}</p>
                  </div>
                </div>
              )}

              {/* WhatsApp Notification Center / Full Control Panel */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔔</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">التحكم الكامل في تنبيهات وإشعارات الواتساب</h4>
                      <p className="text-[11px] text-slate-500">تخصيص قواعد وتوقيتات الرسائل التلقائية لهذا المريض وحالة اشتراكه.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">حالة الاشتراك بالإشعارات:</span>
                    <button
                      onClick={() => {
                        onSavePatient({
                          ...activePatient,
                          whatsappNotificationsEnabled: activePatient.whatsappNotificationsEnabled === false ? true : false
                        });
                      }}
                      className={`text-xs font-bold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
                        activePatient.whatsappNotificationsEnabled !== false
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {activePatient.whatsappNotificationsEnabled !== false ? '🟢 نشط ومفعّل' : '🔴 معطّل ومحظور'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1: Template selection */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">القالب الذكي المفضل لإرساله:</label>
                    <select
                      value={activePatient.preferredReminderTemplate || 'standard'}
                      disabled={activePatient.whatsappNotificationsEnabled === false}
                      onChange={(e) => {
                        onSavePatient({
                          ...activePatient,
                          preferredReminderTemplate: e.target.value as any
                        });
                      }}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-505 disabled:opacity-50"
                    >
                      <option value="standard">⏳ تذكير قياسي بالموعد</option>
                      <option value="reschedule">🔄 اقتراح تعديل/تأجيل موعد</option>
                      <option value="postop">🦷 رعاية ومتابعة بعد عملية جراحية</option>
                      <option value="warning">🚨 تحذير الحضور العاجل</option>
                    </select>
                  </div>

                  {/* Option 2: Pre-session hours */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">وقت التنبيه (ساعات قبل الموعد):</label>
                    <div className="flex items-center gap-1.5 font-bold">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        disabled={activePatient.whatsappNotificationsEnabled === false}
                        value={activePatient.reminderTimingHoursBefore ?? 24}
                        onChange={(e) => {
                          onSavePatient({
                            ...activePatient,
                            reminderTimingHoursBefore: Number(e.target.value)
                          });
                        }}
                        className="w-20 text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-505 disabled:opacity-50"
                      />
                      <span className="text-xs text-slate-500 font-semibold">ساعة قبل الموعد</span>
                    </div>
                  </div>

                  {/* Option 3: Custom disclaimer/note suffix */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">الملحوظات المضافة تلقائياً للرسائل:</label>
                    <input
                      type="text"
                      disabled={activePatient.whatsappNotificationsEnabled === false}
                      placeholder="اضغط لإضافة ملحوظة مخصصة..."
                      value={activePatient.whatsappCustomNotes || ''}
                      onChange={(e) => {
                        onSavePatient({
                          ...activePatient,
                          whatsappCustomNotes: e.target.value || ''
                        });
                      }}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-505 disabled:opacity-50 font-medium"
                    />
                  </div>
                </div>

                {activePatient.whatsappNotificationsEnabled === false && (
                  <div className="bg-rose-50/50 p-2.5 text-[10px] text-rose-800 border border-rose-100 rounded-lg flex items-center gap-1.5 font-bold">
                    <span>⚠️</span>
                    <span>ملاحظة: هذا المريض ألغى الاشتراك في الرسائل التذكيرية. سيقوم النظام بحظره من استقبال تنبيهات واتساب ويب لتجنب الإزعاج.</span>
                  </div>
                )}
              </div>

              {/* INTERACTIVE DENTAL CHART */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>مخطط الأسنان السني (Dental Chart)</span>
                    {currentUser?.role === 'receptionist' && <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 py-0.5 px-2 rounded-full font-bold">🔒 للقراءة فقط (معاد من الطبيب)</span>}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {currentUser?.role === 'receptionist' 
                      ? 'يقتصر مخطط الأسنان الطبي والتشخيص السني والقلع وعلاج القنوات على الطاقم الطبي والأطباء والمساعدين فقط.' 
                      : 'انقر على أي سن لتحديد حالته الحالية (مثل التسوس، الخلع، التلبيسة أو المعالجة) وسيتم التحديث التلقائي.'}
                  </p>
                </div>
                <DentalChart
                  chartData={activePatient.dentalChart}
                  onChange={currentUser?.role === 'receptionist' ? () => {} : handleToothStatusChange}
                />
              </div>

              {/* RADIOLOGY IMAGES (الملف الراديوجرافي وصور الأشعة) */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>الأشعة السنية والتشخيص الراديوجرافي (Dental Radiography & X-Ray)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">أضف صور أشعة المريض (مثل البانوراما أو الأشعة الذروية الموضعية) لتتبع حالة الجذور والعظام والأنسجة المحيطة بالسن.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                  {/* Upload Trigger Area */}
                  {currentUser?.role === 'receptionist' ? (
                    <div className="md:col-span-1 border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center text-center bg-slate-50 min-h-[110px]">
                      <span className="text-slate-400 text-[11px] font-bold">🔒 الرفع معطل</span>
                      <span className="text-slate-400 text-[9px] block mt-1 leading-relaxed">تعديل ملفات الأشعة متاح حصراً للأطباء والمساعدين فقط</span>
                    </div>
                  ) : (
                    <div className="md:col-span-1 border-2 border-dashed border-slate-2200 hover:border-teal-505/50 border-slate-200 hover:border-teal-500/50 rounded-xl p-4 flex flex-col justify-center items-center text-center cursor-pointer transition-all hover:bg-slate-50/50 relative group min-h-[110px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleRadiologyUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Image className="w-6 h-6 text-slate-400 group-hover:text-teal-600 mb-2 transition-colors" />
                      <span className="text-[11px] font-extrabold text-slate-700 block">اضغط أو اسحب لإضافة صورة بالأشعة</span>
                      <span className="text-[9px] text-slate-400 block mt-1">(PNG, JPG, DICOM)</span>
                    </div>
                  )}

                  {/* Radiology Images Collection Deck */}
                  <div className="md:col-span-3 border border-slate-150 rounded-xl p-3 bg-slate-50/40 min-h-[110px] flex items-center">
                    {!activePatient.radiologyImages || activePatient.radiologyImages.length === 0 ? (
                      <div className="w-full text-center py-4">
                        <p className="text-slate-400 text-xs font-semibold">لا توجد صور أشعة مدرجة في ملف المريض بعد.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 w-full">
                        {activePatient.radiologyImages.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="aspect-square rounded-lg border bg-white overflow-hidden relative group shadow-xs cursor-zoom-in"
                            onClick={() => setZoomImage(img)}
                          >
                            <img 
                              src={img} 
                              alt={`X-Ray ${idx + 1}`} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            {/* Interactive Zoom Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="p-1 px-1.5 bg-white/95 text-slate-800 rounded-md text-[9px] font-bold flex items-center gap-1 shadow-xs">
                                <ZoomIn className="w-3 h-3 text-teal-600" />
                                <span>استعراض</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RADIOLOGY LIGHTBOX MODAL */}
              {zoomImage && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between max-h-[85vh]">
                    <div className="p-3.5 border-b dark:border-slate-800 flex justify-between items-center text-xs font-black bg-slate-50 dark:bg-slate-950 leading-none">
                      <span className="text-slate-800 dark:text-slate-200">مستعرض وصيانة الصورة الإشعاعية للمريض</span>
                      <button 
                        onClick={() => setZoomImage(null)}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-1.5 px-3 font-semibold cursor-pointer transition-colors"
                      >
                        إغلاق المستعرض ✕
                      </button>
                    </div>
                    
                    <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center overflow-hidden">
                      <img 
                        src={zoomImage} 
                        alt="Zoomed Radiology X-Ray" 
                        className="max-w-full max-h-[50vh] object-contain rounded border-2 border-slate-700 shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="p-4 border-t dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                        💡 تذكير: يتم دمج صور الأشعة محلياً في ملف المريض بشكل رقمي لتبسيط الاستشارات الطبية الفورية.
                      </p>
                      
                      {currentUser?.role !== 'receptionist' && (
                        <button
                          type="button"
                          onClick={() => {
                            const idx = activePatient.radiologyImages?.indexOf(zoomImage);
                            if (idx !== undefined && idx > -1) {
                              handleRemoveRadiologyImage(idx);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-1.5 px-4 rounded-xl border border-rose-200 hover:border-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>حذف الصورة نهائياً</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History Lists Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Past Sessions Appointments */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 shadow-xs">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-2 flex items-center gap-1.5">
                    <Clipboard className="w-4 h-4 text-sky-500" />
                    <span>تاريخ الجلسات والمواعيد المقررة</span>
                  </h4>

                  {appointments.filter(a => a.patientId === activePatient.id).length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">لم يتم جدولة أي مواعيد كشف لهذا المريض بعد.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {appointments
                        .filter(a => a.patientId === activePatient.id)
                        .map(appt => (
                          <div key={appt.id} className="bg-white p-2.5 rounded-lg border text-xs flex justify-between items-center shadow-xs">
                            <div>
                              <strong className="block text-slate-800">{appt.treatmentType}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{appt.dateTime}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              appt.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : appt.status === 'canceled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}>
                              {appt.status === 'completed' ? 'تمت بنجاح' : appt.status === 'canceled' ? 'ملغية' : 'مجدولة'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Generated Prescriptions list */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 shadow-xs">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-500" />
                    <span>سجل الوصفات الدوائية الصادرة</span>
                  </h4>

                  {prescriptions.filter(p => p.patientId === activePatient.id).length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">لم يتم صياغة أي وصفة دوائية للمريض من قبل.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {prescriptions
                        .filter(p => p.patientId === activePatient.id)
                        .map(pres => (
                          <div key={pres.id} className="bg-white p-2.5 rounded-lg border text-xs flex justify-between items-center shadow-xs">
                            <div>
                              <strong className="block text-slate-800">وصف دواء ({pres.medications.length} أدوية)</strong>
                              <span className="text-[10px] text-slate-400">{pres.date}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {pres.medications.slice(0, 2).map((m, i) => (
                                <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {m.name.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, Prescription, PrescriptionMedication, DentalMedicationInfo } from '../types';
import { Plus, Trash2, Printer, Check, Search, FileText, Calendar } from 'lucide-react';

interface PrescriptionGeneratorProps {
  patients: Patient[];
  medications: DentalMedicationInfo[];
  prescriptions: Prescription[];
  onSavePrescription: (prescription: Prescription) => void;
  lang?: string;
}

export default function PrescriptionGenerator({
  patients,
  medications,
  prescriptions,
  onSavePrescription,
  lang = 'ar'
}: PrescriptionGeneratorProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Active prescription drafting state
  const [draftMedications, setDraftMedications] = useState<PrescriptionMedication[]>([]);
  const [doctorInstructions, setDoctorInstructions] = useState('تفريش الأسنان مرتين يومياً بالفرشاة والمعجون، وتجنب السوائل الساخنة جداً بعد القلع أو الجراحة.');
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');

  // Drug autocompletion helper
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [filteredDrugSuggestions, setFilteredDrugSuggestions] = useState<DentalMedicationInfo[]>([]);

  // Selected patient details
  const currentPatient = patients.find(p => p.id === selectedPatientId);

  // Filter recipes
  const [searchTermPrescriptions, setSearchTermPrescriptions] = useState('');
  
  // Active viewing/printing prescription
  const [printingPrescription, setPrintingPrescription] = useState<Prescription | null>(null);

  const handleDrugSearchChange = (query: string) => {
    setDrugSearchQuery(query);
    if (!query.trim()) {
      setFilteredDrugSuggestions([]);
    } else {
      const suggestions = medications.filter(med =>
        med.name.toLowerCase().includes(query.toLowerCase()) ||
        med.indications.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDrugSuggestions(suggestions);
    }
  };

  const handleSelectMedicationTemplate = (med: DentalMedicationInfo) => {
    const isAlreadyAdded = draftMedications.some(item => item.name === med.name);
    if (isAlreadyAdded) return;

    const newMed: PrescriptionMedication = {
      id: `pres_med_${Date.now()}`,
      name: med.name,
      category: med.categoryAr,
      dosage: med.recommendedDosage,
      duration: med.duration,
      notes: ''
    };

    setDraftMedications([...draftMedications, newMed]);
    setDrugSearchQuery('');
    setFilteredDrugSuggestions([]);
  };

  const handleAddCustomDrug = () => {
    const newMed: PrescriptionMedication = {
      id: `pres_med_${Date.now()}`,
      name: drugSearchQuery || 'دواء مخصص',
      category: 'عام',
      dosage: 'حبة مرتين يومياً بعد الأكل',
      duration: '5 أيام',
      notes: ''
    };
    setDraftMedications([...draftMedications, newMed]);
    setDrugSearchQuery('');
    setFilteredDrugSuggestions([]);
  };

  const handleUpdateMedField = (medId: string, field: keyof PrescriptionMedication, value: string) => {
    setDraftMedications(draftMedications.map(med => {
      if (med.id === medId) {
        return { ...med, [field]: value };
      }
      return med;
    }));
  };

  const handleRemoveMed = (medId: string) => {
    setDraftMedications(draftMedications.filter(med => med.id !== medId));
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    if (draftMedications.length === 0) {
      alert('الرجاء إضافة دواء واحد على الأقل للوصْفة الطبية!');
      return;
    }

    const newPrescription: Prescription = {
      id: `pres_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      patientAge: currentPatient.age,
      patientGender: currentPatient.gender,
      date: new Date().toISOString().split('T')[0],
      medications: draftMedications,
      doctorInstructions,
      nextAppointmentDate: nextAppointmentDate || undefined
    };

    onSavePrescription(newPrescription);
    
    // Auto-open print view for immediate printout
    setPrintingPrescription(newPrescription);

    // Reset Form
    setDraftMedications([]);
    setNextAppointmentDate('');
    setSelectedPatientId('');
  };

  const triggerPrint = () => {
    window.print();
  };

  const filteredHistory = prescriptions.filter(pres =>
    pres.patientName.toLowerCase().includes(searchTermPrescriptions.toLowerCase()) ||
    pres.medications.some(m => m.name.toLowerCase().includes(searchTermPrescriptions.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('create'); setPrintingPrescription(null); }}
          className={`py-3 px-6 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'create'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>تحرير وصفة طبية جديدة</span>
        </button>
        <button
          onClick={() => { setActiveTab('history'); setPrintingPrescription(null); }}
          className={`py-3 px-6 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سجل الوصفات السابقة ({prescriptions.length})</span>
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Side */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">تفاصيل الوصْفة الطبية</h3>

            {/* Select Patient */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اختيار المريض *</label>
              <select
                required
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="">-- اختر مريضاً من القائمة --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (الهاتف: {p.phone || 'غير مسجل'}) - {p.age} سنة
                  </option>
                ))}
              </select>
            </div>

            {currentPatient && (
              <div className="space-y-6">
                {/* Search Medications Auto-complete block */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">البحث في دليل الأدوية لإضافته للوصفة</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="اكتب اسم الدواء (مثال: أوجمنتين...)"
                      value={drugSearchQuery}
                      onChange={e => handleDrugSearchChange(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none focus:bg-white transition-colors"
                    />
                    <Search className="absolute right-3.5 top-3 text-slate-400 w-4 h-4" />
                  </div>

                  {/* Autocomplete Suggestion Dropdown */}
                  {filteredDrugSuggestions.length > 0 && (
                    <div className="bg-white border rounded-xl shadow-lg border-slate-200 max-h-56 overflow-y-auto mt-1 z-20 relative p-1 divide-y divide-slate-100">
                      {filteredDrugSuggestions.map(med => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleSelectMedicationTemplate(med)}
                          className="w-full text-right px-3 py-2.5 hover:bg-sky-50/70 transition-colors flex justify-between items-center text-xs group cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{med.name}</span>
                            <span className="text-[10px] text-slate-400 block">{med.indications}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 group-hover:bg-sky-100 text-slate-600 group-hover:text-sky-700 px-2 py-0.5 rounded-full font-bold">
                            + إضافة
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual / custom add option */}
                  {drugSearchQuery.trim().length > 0 && filteredDrugSuggestions.length === 0 && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between items-center">
                      <p className="text-[11px] text-amber-800">الدواء غير مسجل بالدليل الافتراضي. هل تريد إضافته كدواء مخصص؟</p>
                      <button
                        type="button"
                        onClick={handleAddCustomDrug}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                      >
                        إضافة مخصص
                      </button>
                    </div>
                  )}
                </div>

                {/* Draft Medications list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>قائمة الأدوية المضافة ({draftMedications.length})</span>
                    {draftMedications.length === 0 && (
                      <span className="text-rose-500 text-[10px] font-semibold">(فارغة)</span>
                    )}
                  </h4>

                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {draftMedications.map((med, idx) => (
                      <div key={med.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(med.id)}
                          className="absolute left-2.5 top-2.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="حذف من الوصفة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="md:col-span-2">
                            <span className="text-[10px] text-slate-400 font-bold">اسم الدواء #{idx+1}</span>
                            <input
                              type="text"
                              value={med.name}
                              onChange={e => handleUpdateMedField(med.id, 'name', e.target.value)}
                              className="w-full text-xs font-bold p-1 bg-white border border-slate-200 rounded-sm focus:outline-none"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold">طريقة الاستعمال والجرعة</span>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={e => handleUpdateMedField(med.id, 'dosage', e.target.value)}
                              className="w-full text-xs p-1 bg-white border border-slate-200 rounded-sm focus:outline-none"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold">المدة المقررة</span>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={e => handleUpdateMedField(med.id, 'duration', e.target.value)}
                              className="w-full text-xs p-1 bg-white border border-slate-200 rounded-sm focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تعليمات دكتور الأسنان للمريض</label>
                  <textarea
                    value={doctorInstructions}
                    onChange={e => setDoctorInstructions(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="تعليمات إضافية بخصوص تفادي الآلام والنزيف ومواعيد الأكل"
                  />
                </div>

                {/* Re-visit date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ الموعد القادم للمراجعة (اختياري)</span>
                  </label>
                  <input
                    type="date"
                    value={nextAppointmentDate}
                    onChange={e => setNextAppointmentDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                {/* Action submit */}
                <button
                  type="button"
                  onClick={handleCreatePrescription}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>توليد الوصفة وحفظ ومتابعة الطباعة</span>
                </button>
              </div>
            )}

            {!currentPatient && (
              <div className="bg-slate-50 rounded-xl p-8 border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                الرجاء اختيار أحد المرضى من القائمة العليا لبدء صياغة الوصفة الطبية.
              </div>
            )}
          </div>

          {/* Desktop Preview Side */}
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>معاينة حية للوصفة (مظهر الطباعة)</span>
              </h3>

              {currentPatient && draftMedications.length > 0 ? (
                <div className="bg-white rounded-xl shadow-md border p-6 font-sans space-y-4 text-slate-800 scale-95 origin-top transition-transform">
                  {/* Clinic Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center text-right">
                    <div>
                      <h4 className="font-extrabold text-[15px] text-slate-900">عيادة الدكتور لطب وجراحة الأسنان</h4>
                      <p className="text-[10px] text-slate-500">جراحة، زراعة، علاج وتجميل الأسنان</p>
                      <p className="text-[9px] text-slate-400 mt-1">الهاتف: {currentPatient.phone || '05XXXXXXXX'}</p>
                    </div>
                    <div className="bg-sky-50 text-sky-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border border-sky-100">
                      歯
                    </div>
                  </div>

                  {/* Patient Details Row */}
                  <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px]">المريض:</span>
                      <span className="font-bold text-slate-800">{currentPatient.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px]">السن / الجنس:</span>
                      <span className="font-bold text-slate-800">{currentPatient.age} سنة / {currentPatient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px]">التاريخ:</span>
                      <span className="font-semibold text-slate-800 font-mono">{new Date().toLocaleDateString('ar-u-nu-latn')}</span>
                    </div>
                  </div>

                  {/* Prescription Body (R/) */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xl font-extrabold text-slate-900 block font-serif">Rx:</span>
                    <ul className="divide-y divide-slate-100 space-y-2.5">
                      {draftMedications.map((med, index) => (
                        <li key={med.id} className="pt-2 flex justify-between items-start text-xs text-right">
                          <div>
                            <span className="font-bold text-slate-900 block">{index + 1}. {med.name}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">طريقة الاستعمال: {med.dosage}</span>
                          </div>
                          <span className="text-[10px] bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded-full font-bold self-center">
                            المدة: {med.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  {doctorInstructions && (
                    <div className="border-t pt-3 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">إرشادات الطبيب:</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">{doctorInstructions}</p>
                    </div>
                  )}

                  {/* Next Appt */}
                  {nextAppointmentDate && (
                    <div className="text-[11px] bg-sky-50/50 p-2 rounded-lg text-sky-800 border-l-2 border-sky-500 font-semibold font-mono">
                      تاريخ المراجعة القادمة: {nextAppointmentDate}
                    </div>
                  )}

                  {/* Prescription Footer / Signature */}
                  <div className="border-t pt-4 flex justify-between items-end text-[10px] text-slate-400">
                    <div>
                      <span>توقيع وختم الطبيب:</span>
                      <div className="w-16 h-12 border-b border-dashed border-slate-300 mt-1"></div>
                    </div>
                    <span className="text-[9px] italic">البرنامج تسيير عيادة الأسنان ©</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-8 text-center text-slate-400 text-xs">
                  لا توجد مادة مضافة بالوصفة حالياً لمشاهدة المعاينة الحية.
                </div>
              )}
            </div>

            <div className="bg-slate-100 p-4 rounded-xl text-slate-600 text-xs leading-relaxed space-y-1 mt-6">
              <span className="font-bold text-slate-800 block">💡 تلميح الطباعة:</span>
              <span>عند النقر على زر التوليد، سيفتح البرنامج نظام الطباعة الافتراضي لجهاز الكمبيوتر أو الهاتف. يمتلك البرنامج تصميماً متجاوباً يخفي الأزرار الجانبية ويبقي فقط على الوصفة الطبية لطباعة مثالية على أوراق A5 أو A4 بشكل منظم وعصري.</span>
            </div>
          </div>
        </div>
      ) : (
        /* History lists */
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h3 className="text-sm font-bold text-slate-800">تاريخ الوصفات الطبية بالعيادة</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم المريض أو اسم دواء..."
                value={searchTermPrescriptions}
                onChange={e => setSearchTermPrescriptions(e.target.value)}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl w-64 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="absolute right-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">لا تتوفر وصفات علاجية مسجلة تتوافق مع معطيات البحث.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredHistory.map(pres => (
                <div key={pres.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800">{pres.patientName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        {pres.patientAge} سنة
                      </span>
                    </div>
                    <div className="flex gap-4 text-[11px] text-slate-500">
                      <span>عدد الأدوية: {pres.medications.length}</span>
                      <span>بتاريخ: <strong className="font-mono">{pres.date}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPrintingPrescription(pres)}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs py-2 px-3.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>عرض وطباعة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Persistent Printable Overlay Modal if click view/print */}
      {printingPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 relative flex flex-col justify-between max-h-[90vh]">
            {/* Modal actions close & print */}
            <div className="flex justify-between items-center border-b pb-3 no-print">
              <h4 className="text-xs font-extrabold text-slate-800">جاهز للطباعة على طابعات العيادة</h4>
              <div className="flex gap-2">
                <button
                  onClick={triggerPrint}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>بدء الطباعة</span>
                </button>
                <button
                  onClick={() => setPrintingPrescription(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>

            {/* Printable Frame Area */}
            <div className="bg-white p-6 border rounded-xl shadow-xs space-y-5 flex-1 overflow-y-auto font-sans text-slate-800 print-card text-right">
              {/* Clinic Header */}
              <div className="border-b-2 border-slate-950 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">عيادة الدكتور لطب وجراحة الأسنان</h4>
                  <p className="text-[11px] text-slate-500">جراحة، زراعة، علاج وتجميل الأسنان</p>
                  <p className="text-[10px] text-slate-400 mt-1">الموضع: شارع الطب، الطابق الثاني، عيادة الأسنان</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border">
                  🦷
                </div>
              </div>

              {/* Patient details */}
              <div className="bg-slate-50 p-3 rounded-lg text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">المريض:</span>
                  <span className="font-extrabold text-slate-800">{printingPrescription.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">السن / الجنس:</span>
                  <span className="font-bold text-slate-800">{printingPrescription.patientAge} سنة / {printingPrescription.patientGender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">التاريخ:</span>
                  <span className="font-bold text-slate-800 font-mono">{printingPrescription.date}</span>
                </div>
              </div>

              {/* Rx prescription items */}
              <div className="space-y-4 pt-2">
                <span className="text-2xl font-extrabold text-slate-900 block font-serif">Rx:</span>
                <ol className="divide-y divide-slate-100 space-y-3">
                  {printingPrescription.medications.map((med, index) => (
                    <li key={med.id} className="pt-2 flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-slate-950 block">{index + 1}. {med.name}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">طريقة الاستعمال: {med.dosage}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-relaxed shrink-0">
                        المدة: {med.duration}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Instructions */}
              {printingPrescription.doctorInstructions && (
                <div className="border-t pt-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">إرشادات وتنبيهات الطبيب:</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold">{printingPrescription.doctorInstructions}</p>
                </div>
              )}

              {/* Next Appt */}
              {printingPrescription.nextAppointmentDate && (
                <div className="text-xs bg-sky-50 p-2.5 rounded-lg text-sky-900 border-l-2 border-sky-500 font-semibold font-mono">
                  تاريخ المراجعة القادمة: {printingPrescription.nextAppointmentDate}
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-5 mt-10 flex justify-between items-end text-[11px] text-slate-400">
                <div>
                  <span>توقيع الدكتور المسؤول:</span>
                  <div className="w-24 h-12 border-b border-dashed border-slate-300 mt-2"></div>
                </div>
                <span className="text-[10px] italic font-mono text-slate-300">Dental Practice Suite v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

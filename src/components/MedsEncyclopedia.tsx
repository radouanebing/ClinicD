/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DentalMedicationInfo } from '../types';
import { Search, Plus, Filter, AlertTriangle, BookOpen, Trash2 } from 'lucide-react';

interface MedsEncyclopediaProps {
  medications: DentalMedicationInfo[];
  onAddMedication: (med: DentalMedicationInfo) => void;
  onDeleteMedication?: (id: string) => void;
  lang?: string;
}

export default function MedsEncyclopedia({
  medications,
  onAddMedication,
  onDeleteMedication,
  lang = 'ar'
}: MedsEncyclopediaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New medication form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'analgesic' | 'antibiotic' | 'mouthwash' | 'topical' | 'other'>('analgesic');
  const [newStrength, setNewStrength] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newIndications, setNewIndications] = useState('');
  const [newContraindications, setNewContraindications] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSideEffects, setNewSideEffects] = useState('');

  const catMapAr: Record<string, string> = {
    analgesic: 'مسكن ومضاد للالتهاب',
    antibiotic: 'مضاد حيوي',
    mouthwash: 'غسول ومطهر فموي',
    topical: 'علاج موضعي ولثة',
    other: 'مستحضرات أخرى'
  };

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMed: DentalMedicationInfo = {
      id: `custom_med_${Date.now()}`,
      name: newName,
      category: newCategory,
      categoryAr: catMapAr[newCategory],
      strength: newStrength,
      recommendedDosage: newDosage,
      duration: newDuration,
      indications: newIndications,
      contraindications: newContraindications,
      description: newDescription,
      sideEffects: newSideEffects
    };

    onAddMedication(newMed);
    
    // Reset Form
    setNewName('');
    setNewStrength('');
    setNewDosage('');
    setNewDuration('');
    setNewIndications('');
    setNewContraindications('');
    setNewDescription('');
    setNewSideEffects('');
    setShowAddForm(false);
  };

  const filteredMeds = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.indications.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (med.description && med.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (med.sideEffects && med.sideEffects.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (med.contraindications && med.contraindications.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-teal-600 w-5 h-5" />
            <span>صفحة الأدوية المتخصصة في طب الأسنان</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            موسوعة متكاملة وشاملة بخصائص الأدوية الموصوفة والمسكنات وموانعها لدعم دقة الوصفات الطبية وتسريع العمل داخل العيادة.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دواء جديد للدليل</span>
        </button>
      </div>

      {/* Add Medication Dialog Form */}
      {showAddForm && (
        <form onSubmit={handleCreateMed} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md transition-all">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">تفاصيل وعلاجيات الدواء الجديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم الدواء (العلمي والتجاري) *</label>
              <input
                type="text"
                placeholder="مثال: Paracetamol (فيفادول)"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">التصنيف العلاجي</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="analgesic">مسكن ومضاد للالتهاب</option>
                <option value="antibiotic">مضاد حيوي</option>
                <option value="mouthwash">غسول ومطهر فموي</option>
                <option value="topical">أدوية مرممة موضعية (للثة / فطريات)</option>
                <option value="other">آخر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">قوة الدواء / التركيز</label>
              <input
                type="text"
                placeholder="مثال: 500mg"
                value={newStrength}
                onChange={e => setNewStrength(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الجرعة المعتادة المقترحة</label>
              <input
                type="text"
                placeholder="مثال: حبة كل 8 ساعات"
                value={newDosage}
                onChange={e => setNewDosage(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">المدة المقترحة</label>
              <input
                type="text"
                placeholder="مثال: 5 أيام"
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">دواعي الاستعمال</label>
              <input
                type="text"
                placeholder="مثال: آلام الأسنان البسيطة والمتوسطة"
                value={newIndications}
                onChange={e => setNewIndications(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1">وصف الدواء (نبذة علمية)</label>
              <textarea
                placeholder="تركيب الدواء وميزاته الأيونية أو الحركية..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-16 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="md:col-span-3 col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">موانع الاستعمال والتحذيرات</label>
                <textarea
                  placeholder="مثال: الفشل الكبدي، حساسية الدواء المفرطة"
                  value={newContraindications}
                  onChange={e => setNewContraindications(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-16 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الآثار الجانبية المحتملة</label>
                <textarea
                  placeholder="مثال: الغثيان، الدوار، جفاف الفم، تغير حاسة التذوق..."
                  value={newSideEffects}
                  onChange={e => setNewSideEffects(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-16 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
            >
              حفظ في الدليل
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث باسم الدواء، دواعي الاستعمال، الوصف أو المكونات والآثار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Search className="absolute right-3.5 top-3.5 text-slate-400 w-4 h-4" />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <Filter className="text-slate-400 w-4 h-4 shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            الكل ({medications.length})
          </button>
          {Object.entries(catMapAr).map(([key, value]) => {
            const count = medications.filter(m => m.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === key
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {value} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Medications */}
      {filteredMeds.length === 0 ? (
        <div className="bg-white py-12 rounded-2xl border border-slate-100 shadow-xs text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-xs">لم يتم العثور على أدوية مطابقة لبحثك.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
            className="text-teal-600 text-xs font-bold mt-1 inline-block hover:underline cursor-pointer"
          >
            إعادة تعيين الفلترة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeds.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b pb-2 mb-3">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-slate-900 leading-tight block">{med.name}</h3>
                    <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold">
                      {med.categoryAr}
                    </span>
                  </div>
                  {onDeleteMedication && med.id.startsWith('custom_') && (
                    <button
                      onClick={() => onDeleteMedication(med.id)}
                      className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف من الدليل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 text-xs text-slate-600">
                  {med.description && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/40 text-[11px] text-slate-700 leading-relaxed font-normal">
                      <span className="font-bold text-slate-800 text-[10px] block mb-0.5">وصف الدواء:</span>
                      {med.description}
                    </div>
                  )}

                  <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    {med.strength && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-400">التركيز / القوة:</span>
                        <span className="font-mono text-slate-900 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200/50">{med.strength}</span>
                      </div>
                    )}
                    {med.recommendedDosage && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-400">الجرعة المعتادة:</span>
                        <span className="text-slate-800 font-bold">{med.recommendedDosage}</span>
                      </div>
                    )}
                    {med.duration && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-400">المدة المقترحة:</span>
                        <span className="text-slate-800 font-bold">{med.duration}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <span className="block font-bold text-[10px] text-slate-400 mb-0.5">دواعي الاستعمال سريعة:</span>
                    <p className="text-slate-800 leading-relaxed text-[11px] font-medium">{med.indications}</p>
                  </div>

                  {med.contraindications && (
                    <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100/50 text-[10px] text-rose-800 flex gap-1.5 items-start">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <span className="font-bold block">موانع الاستعمال والتحذيرات:</span>
                        <p className="leading-relaxed text-rose-700/90">{med.contraindications}</p>
                      </div>
                    </div>
                  )}

                  {med.sideEffects && (
                    <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50 text-[10px] text-amber-800 flex gap-1.5 items-start">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <span className="font-bold block">الآثار الجانبية المحتملة:</span>
                        <p className="leading-relaxed text-amber-700/90">{med.sideEffects}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import { DollarSign, ShieldAlert, CheckCircle, TrendingUp, AlertCircle, FileSpreadsheet, Search, CreditCard, ChevronDown } from 'lucide-react';

interface FinancialReportsProps {
  appointments: Appointment[];
  patients: Patient[];
  onSaveAppointment: (appt: Appointment) => void;
  lang?: string;
  currency?: string;
}

export default function FinancialReports({
  appointments,
  patients,
  onSaveAppointment,
  lang = 'ar',
  currency = 'د.م'
}: FinancialReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unpaid' | 'paid'>('all');
  
  // Custom states for logging a partial payment
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Calculate high-fidelity stats
  const totalInvoiced = appointments.reduce((sum, a) => sum + (a.price || 0), 0);
  const totalPaid = appointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
  const totalDebt = totalInvoiced - totalPaid;
  const collectionRatio = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // Group financial info by treatment type
  const treatmentGroup: Record<string, { sessions: number; invoiced: number; paid: number }> = {};
  appointments.forEach(appt => {
    const type = appt.treatmentType || 'علاجات عامة';
    if (!treatmentGroup[type]) {
      treatmentGroup[type] = { sessions: 0, invoiced: 0, paid: 0 };
    }
    treatmentGroup[type].sessions += 1;
    treatmentGroup[type].invoiced += appt.price || 0;
    treatmentGroup[type].paid += appt.paidAmount || 0;
  });

  // Handle direct payment logging
  const handleRecordPaymentSubmit = (appt: Appointment) => {
    const parsedAmount = Number(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const currentPaid = appt.paidAmount || 0;
    const maxAllowed = (appt.price || 0) - currentPaid;
    const finalNewPaid = Math.min(currentPaid + parsedAmount, appt.price || 0);

    const updatedAppt: Appointment = {
      ...appt,
      paidAmount: finalNewPaid
    };

    onSaveAppointment(updatedAppt);
    setSelectedApptId(null);
    setPaymentAmount(0);
  };

  const handleFullSettle = (appt: Appointment) => {
    const updatedAppt: Appointment = {
      ...appt,
      paidAmount: appt.price || 0
    };
    onSaveAppointment(updatedAppt);
  };

  // Filter list of billable appointments
  const filteredBillable = appointments.filter(appt => {
    // Only care about appointments that actually have a designated price
    if (!appt.price) return false;

    const matchesSearch = (appt.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (appt.treatmentType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUnpaid = (appt.paidAmount || 0) < (appt.price || 0);
    const isFullyPaid = (appt.paidAmount || 0) >= (appt.price || 0);

    let matchesFilter = true;
    if (filterType === 'unpaid') matchesFilter = isUnpaid;
    if (filterType === 'paid') matchesFilter = isFullyPaid;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  return (
    <div className="space-y-6">
      {/* Upper Title and Overview Banner */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-emerald-600 w-5.5 h-5.5" />
            <span>التقارير والمتابعة المالية للعيادة</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            متابعة فورية للمداخيل المقبوضة، الديون السنية المترتبة على المرضى، ونسب تحصيل العيادة الإجمالية.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 font-extrabold text-[11px] py-1 px-3.5 rounded-full border border-emerald-100 flex items-center gap-1.5 self-start md:self-auto">
          <span>معدل التحصيل العام:</span>
          <span className="font-mono text-xs">{collectionRatio}%</span>
        </div>
      </div>

      {/* Modern High Contrast KPI Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI: Total Billed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">مجموع قيم المعالجات الكلية</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-xl font-black text-slate-800 font-mono">{totalInvoiced}</strong>
            <span className="text-xs text-slate-500">{currency}</span>
          </div>
          <p className="text-[9px] text-slate-400">القيمة الإجمالية المفترضة للخدمات المحجوزة والمؤداة</p>
        </div>

        {/* KPI: Total Paid Received */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1.5 bg-emerald-50/15">
          <span className="text-[10px] font-bold text-emerald-600 block uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span>إجمالي المقبوضات النقدية</span>
          </span>
          <div className="flex items-baseline gap-1">
            <strong className="text-xl font-black text-emerald-700 font-mono">{totalPaid}</strong>
            <span className="text-xs text-emerald-600">{currency}</span>
          </div>
          <p className="text-[9px] text-emerald-500">الأقساط والمبالغ التي تم تحصيلها وإثباتها بالفعل</p>
        </div>

        {/* KPI: Unpaid Debts */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-1.5 bg-rose-50/15">
          <span className="text-[10px] font-bold text-rose-600 block uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            <span>أقساط سنية متبقية (الديون)</span>
          </span>
          <div className="flex items-baseline gap-1">
            <strong className="text-xl font-black text-rose-700 font-mono">{totalDebt}</strong>
            <span className="text-xs text-rose-600">{currency}</span>
          </div>
          <p className="text-[9px] text-rose-500">إجمالي المبالغ المستحقة بذمة المرضى بذمة الجلسات</p>
        </div>

        {/* KPI: Paid efficiency ratio */}
        <div className="bg-gradient-to-br from-teal-750 to-[#1a365d] text-white p-4 rounded-xl shadow-xs space-y-1.5 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-teal-300 block uppercase">جاهزية التوازن المالي</span>
            <div className="w-full bg-slate-700/60 h-2 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${collectionRatio}%` }}
              ></div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-teal-100 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{collectionRatio}% نسبة التوازن المستهدف</span>
          </span>
        </div>
      </div>

      {/* Treatment Type Profitability breakdown & Interactive Billing Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Profitability list by treatment type (Col span 1) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3.5 h-fit">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="text-teal-600 w-4 h-4" />
              <span>توزيع المداخيل حسب المعالجات السنية</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">ربحية وتكرار كل نوع من أنواع التدخلات الجراحية الوقائية أو التجميلية.</p>
          </div>

          <div className="space-y-2">
            {Object.keys(treatmentGroup).length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6">لا توجد بيانات متاحة حالياً.</p>
            ) : (
              Object.entries(treatmentGroup).map(([type, stats]) => {
                const ratio = stats.invoiced > 0 ? Math.round((stats.paid / stats.invoiced) * 100) : 0;
                return (
                  <div key={type} className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 text-xs space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-800">{type}</span>
                      <span className="bg-teal-50 text-teal-800 text-[9px] px-1.5 py-0.5 rounded-sm">
                        {stats.sessions} جلسات
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                      <div>المقيد: <strong className="text-slate-700">{stats.invoiced} {currency}</strong></div>
                      <div>المسدد: <strong className="text-emerald-700">{stats.paid} {currency}</strong></div>
                    </div>
                    {/* Tiny visual progress bar */}
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full" style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Billing Log Table & Payment Recorder (Col span 2) */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="text-teal-600 w-4 h-4" />
                <span>سجل الفواتير وطرق تسوية الدفعات</span>
              </h3>
              <p className="text-[10px] text-slate-400">قائمة بالفواتير المسجلة، مع تمكين الطبيب من تسجيل الإيصالات والقبض الفوري.</p>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`text-[10px] px-2 py-1 rounded-md font-bold transition-colors cursor-pointer border ${
                  filterType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterType('unpaid')}
                className={`text-[10px] px-2 py-1 rounded-md font-bold transition-colors cursor-pointer border ${
                  filterType === 'unpaid' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                مستحقة غير كاملة ({appointments.filter(a => a.price && (a.paidAmount || 0) < a.price).length})
              </button>
              <button
                onClick={() => setFilterType('paid')}
                className={`text-[10px] px-2 py-1 rounded-md font-bold transition-colors cursor-pointer border ${
                  filterType === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                مسددة كاملة
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث باسم المريض أو الإجراء السني لتبويب الكشف المالي..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <Search className="absolute right-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
          </div>

          {/* Billing Log Table list */}
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {filteredBillable.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-10">لا توجد سجلات مالية مطابقة للفلترة الحالية.</p>
            ) : (
              filteredBillable.map(appt => {
                const rest = (appt.price || 0) - (appt.paidAmount || 0);
                const isUnpaid = rest > 0;
                const isEditingThis = selectedApptId === appt.id;

                return (
                  <div key={appt.id} className="py-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 text-[12px]">{appt.patientName}</strong>
                          <span className="text-[10px] text-slate-400">
                            ({new Date(appt.dateTime).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: '2-digit' })})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>نوع التدخل:</span>
                          <strong className="text-slate-600 text-[11px] bg-slate-100 px-1.5 rounded-sm">{appt.treatmentType}</strong>
                        </div>
                      </div>

                      {/* Display pricing overview structure */}
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">قيمة الفاتورة</p>
                          <p className="font-mono text-slate-900 font-bold">{appt.price} {currency}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">المدفوع المقبوض</p>
                          <p className="font-mono text-emerald-600 font-bold">{appt.paidAmount || 0} {currency}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">المبلغ المتبقي</p>
                          <p className={`font-mono font-black ${isUnpaid ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {rest} {currency}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick transaction action options explicitly designed for easy doctor control */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-100">
                      <div>
                        {isUnpaid ? (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            <AlertCircle className="w-3 h-3" />
                            <span>متبقي بذمة المريض {rest} درهم</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <CheckCircle className="w-3 h-3" />
                            <span>المعالجة مسددة بالكامل</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        {isUnpaid && (
                          <>
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="number"
                                  placeholder="مبلغ القبض"
                                  value={paymentAmount}
                                  onChange={e => setPaymentAmount(Math.max(0, Number(e.target.value)))}
                                  className="w-20 p-1 border rounded bg-white text-[11px] h-7 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  min="1"
                                  max={rest}
                                />
                                <button
                                  onClick={() => handleRecordPaymentSubmit(appt)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  تثبيت الأقساط
                                </button>
                                <button
                                  onClick={() => setSelectedApptId(null)}
                                  className="text-slate-400 hover:text-slate-600 text-[10px] px-1 pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setSelectedApptId(appt.id); setPaymentAmount(rest); }}
                                  className="text-[10px] text-teal-700 hover:bg-teal-50 font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer border border-[#cbd5e1]"
                                >
                                  + تسجيل دفعة جزئية
                                </button>
                                <button
                                  onClick={() => handleFullSettle(appt)}
                                  className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                                >
                                  تسوية وتأدية كاملة ✅
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

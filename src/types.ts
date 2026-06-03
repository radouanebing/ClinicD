/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ToothState {
  number: number; // FDI notation e.g., 18-11, 21-28, 31-38, 41-48
  status: 'healthy' | 'decay' | 'treated' | 'missing' | 'crown' | 'implant';
  notes?: string;
}

export interface Patient {
  id: string;
  name: string; // الاسم كامل
  phone: string; // رقم الهاتف للواتساب
  phoneSecondary?: string; // رقم بديل
  age: number; // العمر
  gender: 'male' | 'female'; // الجنس
  notes?: string; // ملاحظات عامة
  createdAt: string;
  dentalChart: Record<number, ToothState['status']>; // Map toothNumber -> Status
  radiologyImages?: string[]; // قاعدة 64 أو روابط لصور الأشعة
  whatsappNotificationsEnabled?: boolean; // تفعيل تذكيرات واتساب
  preferredReminderTemplate?: 'standard' | 'reschedule' | 'postop' | 'warning'; // قالب التذكير المفضل
  reminderTimingHoursBefore?: number; // وقت التذكير قبل الموعد بالساعات
  whatsappCustomNotes?: string; // إرشادات مخصصة لرسائل هذا المريض
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // Cache for easy query
  patientPhone?: string; // Cache for easy WhatsApp link
  dateTime: string; // ISO date or "YYYY-MM-DDTHH:MM"
  treatmentType: string; // نوع العلاج (تنظيف، زراعة، علاج عصب، جراحة...)
  status: 'scheduled' | 'completed' | 'canceled'; // الحالة
  notes?: string;
  price?: number; // تكلفة الجلسة
  paidAmount?: number; // المبلغ المدفوع
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  date: string; // YYYY-MM-DD
  medications: PrescriptionMedication[];
  doctorInstructions?: string; // تعليمات الطبيب الخاصة بالفم والبلع
  nextAppointmentDate?: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string; // اسم الدواء
  category: string; // تصنيف الدواء
  dosage: string; // الجرعة (مثال: حبة 3 مرات يومياً)
  duration: string; // المدة (مثال: 5 أيام)
  notes?: string; // مع الأكل، قبل النوم، الخ
}

export interface DentalMedicationInfo {
  id: string;
  name: string; // الاسم التجاري والعلمي
  category: 'analgesic' | 'antibiotic' | 'mouthwash' | 'topical' | 'other';
  categoryAr: string; // التصنيف بالعربية
  strength: string; // التركيز (مثال: 500 ملغ)
  recommendedDosage: string; // الجرعة المقترحة
  duration: string; // المدة المقترحة
  indications: string; // دواعي الاستعمال
  contraindications?: string; // موانع الاستعمال والتحذيرات
  description?: string; // وصف الدواء
  sideEffects?: string; // الآثار الجانبية المحتملة
}

export interface WhatsappSettings {
  defaultTimingHoursBefore: number; // الوقت الافتراضي لإرسال الرسائل التذكيرية بالساعات
  defaultTemplateType: 'standard' | 'reschedule' | 'postop' | 'warning';
  doctorSignatureAr: string;
  doctorSignatureFr: string;
  senderRoleAllowed: 'any' | 'doctor_only' | 'doctor_and_assistant'; // من يحق له إرسال وتعديل الإعدادات
  autoOpenWebAfterSend: boolean; // فتح واتساب ويب تلقائياً
  clinicWhatsappPhone?: string; // رقم هاتف الواتساب الخاص بالعيادة
  globalRemindersEnabled?: boolean; // تفعيل/تعطيل التذكيرات عالمياً
  templatesAr: {
    standard: string;
    reschedule: string;
    postop: string;
    warning: string;
  };
  templatesFr: {
    standard: string;
    reschedule: string;
    postop: string;
    warning: string;
  };
}

export interface ClinicData {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  customMedications?: DentalMedicationInfo[];
  doctorName?: string;
  doctorSpecialty?: string;
  clinicName?: string;
  todoTasks?: TodoTask[];
  currency?: string; // رمز أو اسم العملة (e.g. د.م or MAD)
  whatsappSettings?: WhatsappSettings;
}

export interface TodoTask {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

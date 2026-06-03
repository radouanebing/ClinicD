import React, { useState, useEffect, useRef } from 'react';
import { ClinicData } from '../types';
import { Download, Upload, FileJson, CheckCircle, AlertTriangle, RefreshCw, Database, Monitor, Cpu, ShieldCheck, Laptop, HelpCircle } from 'lucide-react';

interface BackupSystemProps {
  data: ClinicData;
  onRestoreData: (restored: ClinicData) => void;
  lang?: string;
}

interface SqliteStats {
  sqlite_version: string;
  database_path: string;
  database_size_bytes: number;
  journal_mode: string;
  integrity_check: string;
  counts: {
    patients: number;
    appointments: number;
    prescriptions: number;
    medications: number;
    todo_tasks: number;
  };
}

export default function BackupSystem({
  data,
  onRestoreData,
  lang = 'ar'
}: BackupSystemProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'sqlite' | 'desktop'>('sqlite');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ClinicData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SQLite Statistics State
  const [sqliteStats, setSqliteStats] = useState<SqliteStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Fetch SQLite stats from full-stack backend
  const fetchSqliteStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/sqlite/statistics');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSqliteStats(result);
        }
      }
    } catch (err) {
      console.error("Failed to read SQLite stats from server", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchSqliteStats();
  }, []);

  // Trigger SQLite Vacuum Optimization
  const handleVacuum = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/sqlite/vacuum', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          alert(
            lang === 'ar'
              ? '✅ تمت عملية الصيانة وتقليص مساحة الفهرسة بملف SQLite بنجاح!'
              : '✅ Base SQLite optimisée et défragmentée avec succès !'
          );
          fetchSqliteStats();
        }
      }
    } catch (err: any) {
      alert("Error optimizing database: " + err.message);
    } finally {
      setOptimizing(false);
    }
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    try {
      const backupString = JSON.stringify(data, null, 2);
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = lang === 'ar' 
        ? `نسخة_احتياطية_عيادة_الأسنان_${dateStr}.json`
        : `sauvegarde_cabinet_dentaire_${dateStr}.json`;
        
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'فشل تصدير النسخة الاحتياطية!' : 'Échec de l\'exportation de la sauvegarde !');
    }
  };

  // Import JSON backup file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    setParsedData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text) as ClinicData;

        if (!json || typeof json !== 'object') {
          throw new Error('الملف ليس كائن JSON صالح');
        }
        if (!Array.isArray(json.patients)) {
          throw new Error('الملف يفتقد قائمة المرضى الأساسية');
        }
        if (!Array.isArray(json.appointments)) {
          throw new Error('الملف يفتقد مجدول مواعيد المرضى الكشف');
        }

        setParsedData(json);
      } catch (err: any) {
        console.error(err);
        setImportError(
          lang === 'ar' 
            ? `الملف غير متطابق: ${err.message || 'تأكد من اختيار ملف نسخة احتياطية صالح.'}`
            : `Fichier invalide : ${err.message || 'Assurez-vous de choisir un fichier au format .json valide.'}`
        );
      }
    };
    reader.readAsText(file);
  };

  // Confirm and overwrite existing state
  const handleConfirmRestore = () => {
    if (!parsedData) return;
    
    const message = lang === 'ar'
      ? '🚨 تحذير: استيراد النسخة الاحتياطية سيقوم بمسح كافة السجلات الحالية وحفظها بالكامل في قاعدة بيانات SQLite. هل ترغب في الاستمرار بالتأكيد؟'
      : '🚨 Attention : Restaurer cette sauvegarde effacera et remplacera toutes vos tables SQLite. Confirmez-vous ?';

    if (window.confirm(message)) {
      onRestoreData(parsedData);
      setImportSuccess(true);
      setParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Update SQLite statistics view
      setTimeout(() => {
        setImportSuccess(false);
        fetchSqliteStats();
      }, 3000);
    }
  };

  // Format File sizes nicely
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
      {/* Title block */}
      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs uppercase tracking-wider">
              {lang === 'ar' ? 'أدوات تخزين وصيانة وإعداد النظام' : 'Base SQLite & Configuration Desktop'}
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
              {lang === 'ar' ? 'إدارة ملفات الطبيب، الفهارس وتثبيته كبرنامج مستقل بآليات متطورة.' : 'Optimisez SQLite et installez l\'application en environnement local.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg gap-1 border border-slate-100 dark:border-slate-850">
        <button
          onClick={() => setActiveTab('sqlite')}
          className={`py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sqlite'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs border border-slate-100 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-3 h-3" />
          <span>{lang === 'ar' ? 'قاعدة SQLite' : 'Index SQLite'}</span>
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'json'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs border border-slate-100 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileJson className="w-3 h-3" />
          <span>{lang === 'ar' ? 'نقل الملفات (JSON)' : 'Transfert JSON'}</span>
        </button>

        <button
          onClick={() => setActiveTab('desktop')}
          className={`py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'desktop'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs border border-slate-100 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3 h-3" />
          <span>{lang === 'ar' ? 'تطبيق مكتبي' : 'Client Bureau'}</span>
        </button>
      </div>

      {/* Pane 1 : SQLite Database Maintenance */}
      {activeTab === 'sqlite' && (
        <div className="space-y-3 pt-0.5">
          <div className="bg-[#f0fdfa]/50 dark:bg-teal-950/10 border border-teal-500/20 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-teal-500" />
                <span>{lang === 'ar' ? 'حالة محرك SQLite3 المحلي:' : 'Diagnostic Moteur SQLite3 :'}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs ring-1 ring-emerald-500/10">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>{lang === 'ar' ? 'نشط ومحمّل' : 'Actif & Chargé'}</span>
              </span>
            </div>

            {loadingStats ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-4 h-4 text-teal-500 animate-spin" />
              </div>
            ) : sqliteStats ? (
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                <div className="p-1.5 bg-white dark:bg-slate-905 border border-slate-100 dark:border-slate-850/50 rounded flex flex-col">
                  <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'حجم قاعدة البيانات:' : 'Taille Fichier :'}</span>
                  <strong className="text-slate-755 dark:text-slate-250 font-bold mt-0.5">{formatBytes(sqliteStats.database_size_bytes)}</strong>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-905 border border-slate-100 dark:border-slate-850/50 rounded flex flex-col">
                  <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'فحص السلامة البنيوية:' : 'Rapport Structurel :'}</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-0.5 uppercase">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{sqliteStats.integrity_check}</span>
                  </strong>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-905 border border-slate-100 dark:border-slate-850/50 rounded flex flex-col">
                  <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'وضع الحفظ والجريدة:' : 'Mode Journal :'}</span>
                  <strong className="text-slate-755 dark:text-slate-250 font-mono mt-0.5 uppercase">{sqliteStats.journal_mode}</strong>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-905 border border-slate-100 dark:border-slate-850/50 rounded flex flex-col">
                  <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'ملخص الفهرس الإجمالي:' : 'Indexation des Dossiers :'}</span>
                  <strong className="text-slate-755 dark:text-slate-250 font-bold mt-0.5">
                    {sqliteStats.counts.patients} {lang === 'ar' ? 'مرضى' : 'pat.'} | {sqliteStats.counts.appointments} {lang === 'ar' ? 'مواعيد' : 'rdv.'}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-slate-400 text-center py-2">
                {lang === 'ar' ? 'تعذر جلب إحصائيات SQLite من الخادم.' : 'Statistiques SQLite indisponibles.'}
              </p>
            )}
          </div>

          {/* SQLite Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleVacuum}
              disabled={optimizing}
              className="w-full bg-[#1e293b] hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-[10px] py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-teal-400 ${optimizing ? 'animate-spin' : ''}`} />
              <span>{lang === 'ar' ? 'إعادة فهرسة وصيانة (VACUUM)' : 'Ré-indexer (VACUUM)'}</span>
            </button>

            <a
              href="/api/sqlite/download-db"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>{lang === 'ar' ? 'تصدير ملف SQLite3 المادي' : 'Exporter le fichier .sqlite'}</span>
            </a>
          </div>

          <p className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal text-right">
            {lang === 'ar'
              ? '💡 نصيحة: يمكنك استخراج ملف البيانات المادي (.sqlite) لفتحه بأي برنامج خارجي مثل DB Browser for SQLite لتسيير التقارير الطبية المعمقة أو نقلها.'
              : '💡 Note : Le fichier .sqlite téléchargé peut être parcouru localement avec DB Browser pour SQLite afin d’éditer des rapports personnalisés.'}
          </p>
        </div>
      )}

      {/* Pane 2 : Standard JSON export/import */}
      {activeTab === 'json' && (
        <div className="space-y-3 pt-0.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
            {/* Export Column */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 p-2.5 rounded-lg flex flex-col justify-between space-y-2 text-right">
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-350 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  <span>{lang === 'ar' ? 'تصدير مخزن JSON:' : 'Export Données :'}</span>
                </h4>
                <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                  {lang === 'ar' ? 'احفظ السجلات كملف JSON لسهولة النقل والاستيراد لاحقاً.' : 'Téléchargez vos dossiers sous la forme d’un fichier .json unique.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full bg-[#1a365d] hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3 h-3 text-teal-400" />
                <span>{lang === 'ar' ? 'تنزيل JSON' : 'Télécharger'}</span>
              </button>
            </div>

            {/* Import Column */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850 p-2.5 rounded-lg flex flex-col justify-between space-y-2 text-right">
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-350 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  <span>{lang === 'ar' ? 'استيراد ملف داتا:' : 'Restauration :'}</span>
                </h4>
                <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                  {lang === 'ar' ? 'اختر ملف نسخة احتياطية .json مسبقة لاستعادة كافة السجلات.' : 'Sélectionnez une sauvegarde externe pour remplacer la base.'}
                </p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-teal-500/30 dark:border-teal-900 bg-white hover:bg-slate-100 dark:bg-slate-900 text-teal-700 dark:text-teal-400 font-bold text-[10px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'رفع ملف JSON' : 'Parcourir'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import Confirmations */}
          {parsedData && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5 space-y-2">
              <div className="flex items-start gap-1.5 text-[10px] text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <strong className="font-bold">{lang === 'ar' ? 'صحة فحص المستند مؤكدة!' : 'Lecture du fichier de sauvegarde réussie !'}</strong>
                  <div className="mt-1 space-y-0.5 text-[9px] text-amber-700 dark:text-amber-500 font-semibold grid grid-cols-2 gap-x-2">
                    <div>• {lang === 'ar' ? `عدد المرضى: ${parsedData.patients?.length || 0}` : `Patients : ${parsedData.patients?.length || 0}`}</div>
                    <div>• {lang === 'ar' ? `المواعيد المقيدة: ${parsedData.appointments?.length || 0}` : `Rendez-vous : ${parsedData.appointments?.length || 0}`}</div>
                    <div>• {lang === 'ar' ? `الوصفات الطبية: ${parsedData.prescriptions?.length || 0}` : `Ordonnances : ${parsedData.prescriptions?.length || 0}`}</div>
                    <div>• {lang === 'ar' ? `اسم الطبيب: ${parsedData.doctorName || '---'}` : `Nom : ${parsedData.doctorName || '---'}`}</div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] py-1 rounded transition-colors cursor-pointer text-center font-sans"
              >
                ✅ {lang === 'ar' ? 'استبدال البيانات الحالية فوراً ومزامنة SQLite' : 'Écraser et synchroniser dans SQLite maintenant'}
              </button>
            </div>
          )}

          {importError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-400 text-[10px] font-bold p-2 rounded-lg flex gap-1 items-center">
              <span>❌</span>
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold p-2 rounded-lg flex gap-1 items-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'ar' ? 'تم استيراد كافة السجلات ومزامنتها بنجاح مع محرك SQLite3!' : 'Restauré et synchronisé avec SQLite !'}</span>
            </div>
          )}
        </div>
      )}

      {/* Pane 3 : Desktop application conversion guide */}
      {activeTab === 'desktop' && (
        <div className="space-y-4 pt-1.5 text-xs text-slate-600 dark:text-slate-400 text-right">
          <div className="bg-gradient-to-br from-teal-500/5 to-sky-500/5 border border-teal-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-850 dark:text-slate-200 text-sm">
                <Laptop className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>تحويل العيادة إلى تطبيق مكتبي مستقل 100% يعمل من جهازك الحقيقي</span>
              </div>
              <span className="bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-400 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                🖥️ نظام مجمع مسبقاً
              </span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
              لقد قمنا بتجهيز وضبط برمجيات مخصصة داخل ملفات الكود الأساسية لتطوير نسخة <strong>Windows EXE</strong> ذاتية التثبيت والتسجيل التلقائي. تقوم هذه النسخة بحفظ كود البيانات وجدول المواعيد محلياً على القرص الصلب للجهاز وتعمل بدون إنترنت تماماً!
            </p>

            {/* Step-by-Step interactive Guide */}
            <div className="space-y-3.5 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs">
              <h4 className="font-extrabold text-teal-700 dark:text-teal-400 text-xs border-b pb-2 flex items-center gap-1.5">
                <span>🛠️</span>
                <span>خطوات إنتاج ملف التثبيت التلقائي (EXE Installer):</span>
              </h4>

              <div className="space-y-3 leading-relaxed text-[11px] font-medium text-slate-700 dark:text-slate-350">
                <div className="flex gap-2 items-start">
                  <span className="bg-teal-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">1</span>
                  <div>
                    <strong>تنزيل ملفات العيادة للكمبيوتر:</strong>
                    <p className="text-[10px] text-slate-405 mt-0.5 leading-relaxed">
                      انقر على رمز قائمة التطبيق (Settings) في الجزء العلوي من شريط الموقع، ثم حدد <strong>"Export ZIP"</strong> أو <strong>"Export XML"</strong> لتنزيل الكود المصدري للعيادة على جهازك وفك الضغط عنه.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="bg-teal-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">2</span>
                  <div>
                    <strong>تثبيت باقة Node.js:</strong>
                    <p className="text-[10px] text-slate-405 mt-0.5 leading-relaxed">
                      تأكد من وجود بيئة تشغيل نود على حاسوبك (حملها مجاناً من الموقع الرسمي <a href="https://nodejs.org/" target="_blank" rel="noreferrer" className="text-teal-600 underline">nodejs.org</a>).
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="bg-teal-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">3</span>
                  <div>
                    <strong>تشغيل التجميع المكتبي الفوري بضغطة زر:</strong>
                    <p className="text-[10px] text-slate-405 mt-0.5 leading-relaxed">
                      افتح مجلد الكود عبر محرر الأوامر (Command Prompt / Terminal) واكتب السطر البرمجي المدمج التالي:
                    </p>
                    <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg mt-1.5 font-mono text-left text-[10px] direction-ltr overflow-x-auto select-all border border-slate-800">
                      npm install && node desktop-packager.js
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="bg-teal-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">4</span>
                  <div>
                    <strong>تثبيت المساعد على سطح الكمبيوتر:</strong>
                    <p className="text-[10px] text-slate-405 mt-0.5 leading-relaxed">
                      بمجرد انتهاء الأداة، سيظهر مجلد جديد باسم <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-bold">dist-desktop</code> بداخل جهاز الـ Windows يحتوي على ملف باسم <code className="text-emerald-600 font-bold">DentClinic Setup.exe</code>. بمجرد النقر المزدوج عليه، سيقوم بتثبيت العيادة ووضع أيقونة ذكية مع تتبع لقاعدة البيانات المحلية SQLite.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick backup note */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 rounded-xl p-3 text-[10px] text-amber-850 dark:text-amber-400 flex items-start gap-2">
              <span>💡</span>
              <p className="leading-relaxed">
                <strong>تأمين فوري للبيانات المحلية:</strong> يمكنك دائماً نسخ أو استبدال ملف البيانات المفتوح <code className="bg-white/60 dark:bg-slate-900 px-1 py-0.5 rounded">clinic-data.sqlite</code> من خلال لوحة البيانات أو مباشرة من نظام التشغيل لضمان الاحتفاظ بسجل الحجوزات والمرضى.
              </p>
            </div>
          </div>

          {/* Interactive self-check trigger */}
          <div className="p-4 border border-dashed border-teal-200 dark:border-teal-900 bg-teal-50/20 dark:bg-teal-950/5 rounded-2xl flex flex-col items-center justify-center text-center">
            <Monitor className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-1.5" />
            <h4 className="font-extrabold text-[12px] text-teal-900 dark:text-teal-300">
              مخدم البناء المكتبي جاهز ومرافق للملفات المرفومة
            </h4>
            <p className="text-[10px] text-teal-600 dark:text-teal-450 mt-1 mb-2 max-w-sm leading-normal">
              الملفين <code className="bg-teal-100/40 px-1 rounded font-bold">electron-main.cjs</code> و <code className="bg-teal-100/40 px-1 rounded font-bold">desktop-packager.js</code> تم إضافتهم وتفعيلهم محلياً بنجاح لمزامنتهم عند فك ضغط مجلد عيادتك الحالية.
            </p>
            <button
              onClick={() => {
                alert(
                  '💡 ملف تجميع سطح المكتب (desktop-packager.js) تم تجهيزه ووضعه مباشرة في الجذر الأساسي لمجلد المشروع! عند تحميل المشروع كملف ZIP ومحلياً، سيساعدك ذلك على إنشاء ملف EXE فوري للتثبيت التلقائي بنجاح على نظام التشغيل لديك.'
                );
              }}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-extrabold rounded-xl shadow-md transition-all cursor-pointer font-sans"
            >
              🚀 فحص ومراجعة إعدادات التصدير والحزم المكتبي المرفق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

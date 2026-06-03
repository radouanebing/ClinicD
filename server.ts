import express from "express";
import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { ClinicData, DentalMedicationInfo, Patient, Appointment, Prescription, TodoTask, WhatsappSettings } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), "clinic-data.sqlite");

app.use(express.json());

// List of standard dental medications to seed the encyclopedia
const DEFAULT_MEDICATIONS: DentalMedicationInfo[] = [
  {
    id: "med1",
    name: "Augmentin (أوجمنتين) - Amoxicillin + Calvulanic Acid",
    category: "antibiotic",
    categoryAr: "مضاد حيوي",
    strength: "1g (1000 mg)",
    recommendedDosage: "حبة كل 12 ساعة (مرتين يومياً)",
    duration: "5 - 7 أيام",
    indications: "التهابات وتحصنات الأسنان الحادة والخراجات اللثوية والوقاية قبيل الجراحة سنية",
    contraindications: "حساسية البنسلين، مشاكل الكبد السابقة، والقصور الليمفاوي الشديد",
    description: "مضاد حيوي واسع النطاق يجمع بين الأموكسيسيلين ومثبط البيتا لاكتاماز (حمض الكلافولانيك) للتغلب على البكتيريا المقاومة.",
    sideEffects: "اضطرابات هضمية خفيفة (إسهال، غثيان)، طفح جلدي عند ذوي الحساسية، فطريات الفم في حال الاستخدام المطول"
  },
  {
    id: "med2",
    name: "Rodogyl (رودوجيل) - Metronidazole + Spiramycin",
    category: "antibiotic",
    categoryAr: "مضاد حيوي",
    strength: "125mg / 750,000 UI",
    recommendedDosage: "حبتين معاً مرتين يومياً (أو حبة 3 مرات يومياً)",
    duration: "5 - 7 أيام",
    indications: "التهابات الفم والأسنان البكتيرية اللاهوائية وخراجات الأسنان والتهاب اللثة المزمن ومحيط التاج",
    contraindications: "حساسية المترونيدازول أو السبيراميسين، ويمنع شرب الكحول أثناء العلاج تماماً تلاقياً لتفاعل ديسلفيرام",
    description: "تركيبة فريدة مخصصة لطب الأسنان تجمع بين مضاد حيوي ماكروليدي (سبيراميسين) ومضاد للبكتيريا اللاهوائية (مترونيدازول) لتحقيق تغطية ممتازة للأنسجة السنية واللعابية.",
    sideEffects: "طعم معدني بالفم، لون بول داكن، اضطراب عصبي خفيف (صداع أو دوخة)، آلام بالمعدة"
  },
  {
    id: "med3",
    name: "Ibuprofen (إيبوبروفين / بروفين)",
    category: "analgesic",
    categoryAr: "مسكن ومضاد للالتهاب",
    strength: "400mg / 600mg",
    recommendedDosage: "حبة كل 8 ساعات عند اللزوم (بعد الأكل)",
    duration: "3 - 5 أيام",
    indications: "آلام الأسنان الحادة والتهابات ما بعد القلع أو الجراحة اللثوية وتورم الفك",
    contraindications: "قرحة المعدة الحادة، الفشل الكلوي، الربع الأخير من الحمل، أو مرضى الربو الناجم عن الأسبرين",
    description: "مضاد التهاب غير ستيرويدي يعمل على تثبيط إنزيمات الأكسدة الحلقية لتقليل إنتاج البروستاغلاندينات المسؤولة عن الألم والتورم بعد العمليات السنية الجراحية.",
    sideEffects: "عسر هضم، حموضة جدار المعدة، ارتفاع طفيف بضغط الدم، خطورة النزيف المعوي عند التناول المفرط"
  },
  {
    id: "med4",
    name: "Doliprane (دوليبران / باراسيتامول)",
    category: "analgesic",
    categoryAr: "مسكن وخافض للحرارة",
    strength: "1g (1000 mg)",
    recommendedDosage: "حبة كل 6 إلى 8 ساعات عند اللزوم (الحد الأقصى 4 جرام يومياً)",
    duration: "3 - 5 أيام",
    indications: "الآلام البسيطة إلى المتوسطة كآلام بعد الحشو، آمن لمرضى الضغط والمعدة والحوامل والمرضعات",
    contraindications: "الفشل الكبدي الحاد، قصور الإنزيم غلوكوز-6-فوسفات دي هيدروجيناز (أنيميا الفول)",
    description: "مسكن وخافض حرارة ذو أمان عالٍ يعمل مركزياً على الجهاز العصبي لتخفيف الآلام دون تأثير مخرش لجدار المعدة.",
    sideEffects: "نادرة جداً عند الالتزام بالجرعات المحددة، قد يشمل طفحاً جلدياً بسيطاً أو تراجعاً في وظائف الكبد عند تخطي الجرعة القصوى الآمنة"
  },
  {
    id: "med5",
    name: "Chlorhexidine (غسول كلورهكسيدين)",
    category: "mouthwash",
    categoryAr: "غسول ومطهر فموي",
    strength: "0.12% / 0.2%",
    recommendedDosage: "مضمضة بـ 15 مل لمدة دقيقة، مرتين يومياً",
    duration: "10 - 14 يوم كحد أقصى لتفادي التصبغات",
    indications: "التهابات اللثة الشديدة، تعقيم الفم بعد الجراحة اللثوية وزراعة الأسنان، تقليل لزوجة البلاك",
    contraindications: "الاستعمال طويل الأمد بدون استشارة قد يسبب تصبغات الأسنان مؤقتاً أو اضطرابات الحاسة الذوقية",
    description: "مادة مطهرة قوية مضادة للجراثيم موجبة وسالبة الغرام تلصق بأسطح الفم وتطلق تدريجياً لضمان مفعول طويل الأمد بعد مكافحة البلاك والتهاب الأنسجة الداعمة والقلع.",
    sideEffects: "تغير مؤقت في حاسة التذوق، تصبغ بني على أسطح الأسنان والحشوات يزول بالتنظيف الاحترافي بالعيادة، جفاف بسيط في الفم"
  },
  {
    id: "med6",
    name: "Daktarin Oral Gel (دكتارين جل فموي)",
    category: "topical",
    categoryAr: "مضاد فطريات موضعي",
    strength: "2% Gel",
    recommendedDosage: "نصف ملعقة صغيرة من الجل توضع على المنطقة المصابة 4 مرات يومياً",
    duration: "7 - 14 يوم",
    indications: "فطريات الفم واللسان (السلاق الفموي) والالتهابات الناجمة عن أطقم الأسنان غير المطابقة",
    contraindications: "حساسية الميكونازول، الرضع أقل من 4 أشهر تلافياً للشرق أو الاختناق، واضطرابات الكبد الوظيفية",
    description: "جل موضعي فموي مضاد للفطريات يحتوي على ميكونازول، يقضي على الخمائر والفطريات المسببة للتقرحات والطبقات البيضاء داخل الفم.",
    sideEffects: "غثيان أو قيء نادر في حال تجرع كمية كبيرة، تهيج أو شعور بالحرقة في موضع التطبيق الفموي"
  },
  {
    id: "med7",
    name: "Gengigel (جنجي جل) - Hyaluronic Acid",
    category: "topical",
    categoryAr: "مرمم ومسرع لالتئام اللثة",
    strength: "0.2% Gel",
    recommendedDosage: "تدليك اللثة الحساسة بمسحة جل 3-4 مرات يومياً (بعد تنظيف الأسنان)",
    duration: "عند الحاجة",
    indications: "تقرحات الفم اللثوية (القلاع)، التئام اللثة المتضررة بعد تنظيف الجير الشديد، أو بعد الجراحات البسيطة والقلع",
    contraindications: "آمن جداً بدون أعراض جانبية تذكر، لا توجد موانع استعمال معروفة",
    description: "مستحضر بيوتكنولوجي يعتمد على حمض الهيالورونيك بتركيز صيدلاني لتسريع استشفاء الأنسجة اللثوية، وتنشيط الدورة الدموية الدقيقة باللثة وإعادة ترطيبها.",
    sideEffects: "معدومة تماماً نظراً لمطابقته للمركبات الطبيعية الموجودة في جسم الإنسان"
  }
];

const DEFAULT_CLINIC_DATA: ClinicData = {
  patients: [
    {
      id: "pat1",
      name: "أحمد بن علي",
      phone: "212612345678",
      phoneSecondary: "0522123456",
      age: 34,
      gender: "male",
      notes: "يعاني من الخوف الخفيف من صوت الحفار التوربيني. لديه حساسية خفيفة تجاه غسول الفم العادي.",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dentalChart: {
        16: "decay",
        36: "treated",
        46: "missing"
      }
    },
    {
      id: "pat2",
      name: "فاطمة الزهراء الإدريسي",
      phone: "212623456789",
      age: 28,
      gender: "female",
      notes: "حامل في الشهر الرابع، يرجى تجنب الإيبوبروفين واستعمال الباراسيتامول كمسكن آمن.",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dentalChart: {
        22: "crown",
        23: "crown",
        47: "decay"
      }
    }
  ],
  appointments: [
    {
      id: "app1",
      patientId: "pat1",
      patientName: "أحمد بن علي",
      patientPhone: "212612345678",
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
      treatmentType: "علاج عصب للضرس 16",
      status: "scheduled",
      notes: "الزيارة الثانية لاستكمال علاج الجذور اللبية وتلبيس الضرس.",
      price: 1500,
      paidAmount: 500
    },
    {
      id: "app2",
      patientId: "pat2",
      patientName: "فاطمة الزهراء الإدريسي",
      patientPhone: "212623456789",
      dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
      treatmentType: "كشف أولي وتنظيف جير",
      status: "completed",
      notes: "تمت معالجة التهاب اللثة البسيط ووصف دوليبران وغسول لثوي آمن للحوامل.",
      price: 350,
      paidAmount: 350
    }
  ],
  prescriptions: [
    {
      id: "pres1",
      patientId: "pat2",
      patientName: "فاطمة الزهراء الإدريسي",
      patientAge: 28,
      patientGender: "female",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      medications: [
        {
          id: "med4",
          name: "Doliprane (دوليبران / باراسيتامول)",
          category: "مسكن وخافض للحرارة",
          dosage: "حبة كل 8 ساعات عند الألم",
          duration: "3 أيام",
          notes: "بعد الأكل"
        },
        {
          id: "med7",
          name: "Gengigel (جنجي جل) - Hyaluronic Acid",
          category: "مرمم ومسرع لالتئام اللثة",
          dosage: "دهن اللثّة برفق 3 مرات يومياً",
          duration: "7 أيام",
          notes: "بعد تفريش الأسنان"
        }
      ],
      doctorInstructions: "تفريش الأسنان بفرشاة ناعمة جداً مرتين يومياً وتجنب المأكولات والمشروبات الساخنة والباردة جداً.",
      nextAppointmentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
    }
  ],
  customMedications: DEFAULT_MEDICATIONS
};

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// Opens and configures sqlite database
async function getDB() {
  if (!db) {
    db = await open({
      filename: DB_FILE,
      driver: sqlite3.Database
    });
    await initDB(db);
  }
  return db;
}

// Create schema tables and set targets
async function initDB(database: Database<sqlite3.Database, sqlite3.Statement>) {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      phoneSecondary TEXT,
      age INTEGER,
      gender TEXT,
      notes TEXT,
      createdAt TEXT,
      dentalChart TEXT,
      radiologyImages TEXT,
      whatsappNotificationsEnabled INTEGER,
      preferredReminderTemplate TEXT,
      reminderTimingHoursBefore INTEGER,
      whatsappCustomNotes TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      patientName TEXT,
      patientPhone TEXT,
      dateTime TEXT NOT NULL,
      treatmentType TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      price REAL,
      paidAmount REAL,
      FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      patientName TEXT NOT NULL,
      patientAge INTEGER,
      patientGender TEXT NOT NULL,
      date TEXT NOT NULL,
      medications TEXT NOT NULL,
      doctorInstructions TEXT,
      nextAppointmentDate TEXT,
      FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_medications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      categoryAr TEXT NOT NULL,
      strength TEXT NOT NULL,
      recommendedDosage TEXT,
      duration TEXT,
      indications TEXT,
      contraindications TEXT,
      description TEXT,
      sideEffects TEXT
    );

    CREATE TABLE IF NOT EXISTS todo_tasks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  // Index creation for speed when reading/joining relationships
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_appointments_pat ON appointments(patientId);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_pat ON prescriptions(patientId);
  `);

  // Seeding if database is completely empty
  const patientCountRes = await database.get<{ count: number }>("SELECT count(*) as count FROM patients");
  if (patientCountRes && patientCountRes.count === 0) {
    console.log("Seeding SQLite Database with default clinical structures...");
    
    await database.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "doctorName", "د. أحمد الصالح");
    await database.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "doctorSpecialty", "أخصائي جراحة الفك");
    await database.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "clinicName", "عيادتي الرقمية");
    await database.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "currency", "د.م");
    
    const defaultSettings: WhatsappSettings = {
      defaultTimingHoursBefore: 24,
      defaultTemplateType: 'standard',
      doctorSignatureAr: 'مع تحيات الطاقم الطبي للعيادة.',
      doctorSignatureFr: 'Cordialement, l’équipe du cabinet dentaire.',
      senderRoleAllowed: 'any',
      autoOpenWebAfterSend: true,
      clinicWhatsappPhone: '',
      globalRemindersEnabled: true,
      templatesAr: {
        standard: 'مرحباً {patientName}، 🌸\n\nنود تذكيركم بموعدكم المقرّر في عيادة الأسنان:\n📅 التاريخ: {dateFormatted}\n⏰ الوقت: {timeFormatted}\n🦷 المعالجة: {treatmentType}\n\nيرجى تأكيد حضوركم بالرد هنا. دمتم سالمين!',
        reschedule: 'مرحباً {patientName}، 🌸\n\nبناءً على جدول العيادة والمواعيد، نقترح تعديل وقت جلستكم السنية ليصبح:\n📅 التاريخ الجديد: {dateFormatted}\n⏰ الوقت الجديد: {timeFormatted}\n\nهل هذا التوقيت يناسبكم؟ يرجى الرد للتأكيد. شكراً لكم!',
        postop: 'مرحباً {patientName}، 🦷\n\nنطمئن على حالتكم بعد العلاج لـ ({treatmentType}).\n\n📌 إرشادات التعافي الرعاية:\n- تناول الأغذية والأشربة الدافئة أو الباردة فقط اليوم.\n- الالتزام بالوصفة العلاجية الموصى بها.\n\nنتمنى لكم شفاءً عاجلاً وراحة تامة!',
        warning: 'تنبيه عاجل لـ {patientName}، 🚨\n\nيرجى العلم أن جلستكم العلاجية ستبدأ في تمام الساعة: {timeFormatted}.\n\nالرجاء الحضور قبل الجلسة بـ 15 دقيقة تفادياً لإلغائها بسبب ضغط جدول الطبيب. شكراً لتعاونكم!'
      },
      templatesFr: {
        standard: 'Bonjour {patientName}, 🌸\n\nNous vous rappelons votre prochain RDV au cabinet dentaire :\n📅 Date : {dateFormatted}\n⏰ Heure : {timeFormatted}\n🦷 Acte : {treatmentType}\n\nMerci de confirmer votre présence. Bien à vous !',
        reschedule: 'Bonjour {patientName}, 🌸\n\nNous vous proposons de reporter votre rendez-vous de soins au :\n📅 Nouvelle Date : {dateFormatted}\n⏰ Nouvel Horaire : {timeFormatted}\n\nEst-ce que cela vous convient ? Merci de répondre.',
        postop: 'Bonjour {patientName}, 🦷\n\nNous espérons que vous vous portez bien après votre intervention de ({treatmentType}).\n\n📌 Rappel des consignes de soins :\n- Aliments tièdes ou froids aujourd’hui.\n- Suivez bien votre ordonnance de médicaments.\n\nBon rétablissement !',
        warning: 'IMPORTANT : Bonjour {patientName}, 🚨\n\nVotre rendez-vous de soins est fixé à {timeFormatted}.\n\nMerci d’arriver 10 minutes en avance pour éviter toute annulation. Merci de votre retour !'
      }
    };
    await database.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "whatsappSettings", JSON.stringify(defaultSettings));

    for (const p of DEFAULT_CLINIC_DATA.patients) {
      await database.run(`
        INSERT INTO patients (id, name, phone, phoneSecondary, age, gender, notes, createdAt, dentalChart, radiologyImages, whatsappNotificationsEnabled, preferredReminderTemplate, reminderTimingHoursBefore, whatsappCustomNotes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, 
        p.id, p.name, p.phone, p.phoneSecondary || null, p.age, p.gender, p.notes || null, p.createdAt, 
        JSON.stringify(p.dentalChart || {}), JSON.stringify(p.radiologyImages || []), 
        p.whatsappNotificationsEnabled ? 1 : 0, p.preferredReminderTemplate || null, 
        p.reminderTimingHoursBefore || null, p.whatsappCustomNotes || null
      );
    }

    for (const a of DEFAULT_CLINIC_DATA.appointments) {
      await database.run(`
        INSERT INTO appointments (id, patientId, patientName, patientPhone, dateTime, treatmentType, status, notes, price, paidAmount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        a.id, a.patientId, a.patientName || null, a.patientPhone || null, a.dateTime, a.treatmentType, a.status, a.notes || null, a.price || 0, a.paidAmount || 0
      );
    }

    for (const pr of DEFAULT_CLINIC_DATA.prescriptions) {
      await database.run(`
        INSERT INTO prescriptions (id, patientId, patientName, patientAge, patientGender, date, medications, doctorInstructions, nextAppointmentDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        pr.id, pr.patientId, pr.patientName, pr.patientAge, pr.patientGender, pr.date, JSON.stringify(pr.medications), pr.doctorInstructions || null, pr.nextAppointmentDate || null
      );
    }

    for (const med of DEFAULT_MEDICATIONS) {
      await database.run(`
        INSERT INTO custom_medications (id, name, category, categoryAr, strength, recommendedDosage, duration, indications, contraindications, description, sideEffects)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        med.id, med.name, med.category, med.categoryAr, med.strength, med.recommendedDosage, med.duration, med.indications, med.contraindications || null, med.description || null, med.sideEffects || null
      );
    }

    const demoTodo: TodoTask = {
      id: "todo1",
      text: "التحقق من تعقيم أدوات العيادة الحراجية واستكمال تركيب الأجهزة والمرفقات",
      done: false,
      createdAt: new Date().toISOString()
    };
    await database.run(`
      INSERT INTO todo_tasks (id, text, done, createdAt)
      VALUES (?, ?, ?, ?)
    `,
      demoTodo.id, demoTodo.text, demoTodo.done ? 1 : 0, demoTodo.createdAt
    );
  }
}

// Synchronously query SQLite helper methods
async function fetchFullClinicData(): Promise<ClinicData> {
  const sqliteDb = await getDB();
  
  const settingsRows = await sqliteDb.all<{ key: string; value: string }[]>("SELECT key, value FROM app_settings");
  const settings: Record<string, any> = {};
  for (const row of settingsRows) {
    if (row.key === "whatsappSettings") {
      try {
        settings.whatsappSettings = JSON.parse(row.value);
      } catch {
        settings.whatsappSettings = null;
      }
    } else {
      settings[row.key] = row.value;
    }
  }

  const patientRows = await sqliteDb.all<any[]>("SELECT * FROM patients");
  const patients: Patient[] = patientRows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    phoneSecondary: row.phoneSecondary,
    age: row.age,
    gender: row.gender,
    notes: row.notes,
    createdAt: row.createdAt,
    dentalChart: row.dentalChart ? JSON.parse(row.dentalChart) : {},
    radiologyImages: row.radiologyImages ? JSON.parse(row.radiologyImages) : [],
    whatsappNotificationsEnabled: !!row.whatsappNotificationsEnabled,
    preferredReminderTemplate: row.preferredReminderTemplate,
    reminderTimingHoursBefore: row.reminderTimingHoursBefore,
    whatsappCustomNotes: row.whatsappCustomNotes
  }));

  const appointmentRows = await sqliteDb.all<any[]>("SELECT * FROM appointments");
  const appointments: Appointment[] = appointmentRows.map(row => ({
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    dateTime: row.dateTime,
    treatmentType: row.treatmentType,
    status: row.status,
    notes: row.notes,
    price: row.price,
    paidAmount: row.paidAmount
  }));

  const prescriptionRows = await sqliteDb.all<any[]>("SELECT * FROM prescriptions");
  const prescriptions: Prescription[] = prescriptionRows.map(row => ({
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    patientAge: row.patientAge,
    patientGender: row.patientGender,
    date: row.date,
    medications: row.medications ? JSON.parse(row.medications) : [],
    doctorInstructions: row.doctorInstructions,
    nextAppointmentDate: row.nextAppointmentDate
  }));

  const medicationRows = await sqliteDb.all<any[]>("SELECT * FROM custom_medications");
  const customMedications: DentalMedicationInfo[] = medicationRows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    categoryAr: row.categoryAr,
    strength: row.strength,
    recommendedDosage: row.recommendedDosage,
    duration: row.duration,
    indications: row.indications,
    contraindications: row.contraindications,
    description: row.description,
    sideEffects: row.sideEffects
  }));

  const todoRows = await sqliteDb.all<any[]>("SELECT * FROM todo_tasks");
  const todoTasks: TodoTask[] = todoRows.map(row => ({
    id: row.id,
    text: row.text,
    done: !!row.done,
    createdAt: row.createdAt
  }));

  return {
    patients,
    appointments,
    prescriptions,
    customMedications,
    doctorName: settings.doctorName || "د. أحمد الصالح",
    doctorSpecialty: settings.doctorSpecialty || "أخصائي جراحة الفك",
    clinicName: settings.clinicName || "عيادتي الرقمية",
    currency: settings.currency || "د.م",
    whatsappSettings: settings.whatsappSettings,
    todoTasks
  };
}

async function saveFullClinicData(data: ClinicData) {
  const sqliteDb = await getDB();
  
  await sqliteDb.exec("BEGIN TRANSACTION");
  try {
    if (data.doctorName !== undefined) {
      await sqliteDb.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "doctorName", data.doctorName);
    }
    if (data.doctorSpecialty !== undefined) {
      await sqliteDb.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "doctorSpecialty", data.doctorSpecialty);
    }
    if (data.clinicName !== undefined) {
      await sqliteDb.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "clinicName", data.clinicName);
    }
    if (data.currency !== undefined) {
      await sqliteDb.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "currency", data.currency);
    }
    if (data.whatsappSettings !== undefined) {
      await sqliteDb.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", "whatsappSettings", JSON.stringify(data.whatsappSettings));
    }

    await sqliteDb.exec("DELETE FROM patients");
    if (data.patients && Array.isArray(data.patients)) {
      for (const p of data.patients) {
        await sqliteDb.run(`
          INSERT INTO patients (id, name, phone, phoneSecondary, age, gender, notes, createdAt, dentalChart, radiologyImages, whatsappNotificationsEnabled, preferredReminderTemplate, reminderTimingHoursBefore, whatsappCustomNotes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, 
          p.id, p.name, p.phone, p.phoneSecondary || null, p.age, p.gender, p.notes || null, p.createdAt, 
          JSON.stringify(p.dentalChart || {}), JSON.stringify(p.radiologyImages || []), 
          p.whatsappNotificationsEnabled ? 1 : 0, p.preferredReminderTemplate || null, 
          p.reminderTimingHoursBefore || null, p.whatsappCustomNotes || null
        );
      }
    }

    await sqliteDb.exec("DELETE FROM appointments");
    if (data.appointments && Array.isArray(data.appointments)) {
      for (const a of data.appointments) {
        await sqliteDb.run(`
          INSERT INTO appointments (id, patientId, patientName, patientPhone, dateTime, treatmentType, status, notes, price, paidAmount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          a.id, a.patientId, a.patientName || null, a.patientPhone || null, a.dateTime, a.treatmentType, a.status, a.notes || null, a.price || 0, a.paidAmount || 0
        );
      }
    }

    await sqliteDb.exec("DELETE FROM prescriptions");
    if (data.prescriptions && Array.isArray(data.prescriptions)) {
      for (const pr of data.prescriptions) {
        await sqliteDb.run(`
          INSERT INTO prescriptions (id, patientId, patientName, patientAge, patientGender, date, medications, doctorInstructions, nextAppointmentDate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          pr.id, pr.patientId, pr.patientName, pr.patientAge, pr.patientGender, pr.date, JSON.stringify(pr.medications), pr.doctorInstructions || null, pr.nextAppointmentDate || null
        );
      }
    }

    await sqliteDb.exec("DELETE FROM custom_medications");
    const meds = data.customMedications || [];
    for (const med of meds) {
      await sqliteDb.run(`
        INSERT INTO custom_medications (id, name, category, categoryAr, strength, recommendedDosage, duration, indications, contraindications, description, sideEffects)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        med.id, med.name, med.category, med.categoryAr, med.strength, med.recommendedDosage, med.duration, med.indications, med.contraindications || null, med.description || null, med.sideEffects || null
      );
    }

    await sqliteDb.exec("DELETE FROM todo_tasks");
    if (data.todoTasks && Array.isArray(data.todoTasks)) {
      for (const t of data.todoTasks) {
        await sqliteDb.run(`
          INSERT INTO todo_tasks (id, text, done, createdAt)
          VALUES (?, ?, ?, ?)
        `,
          t.id, t.text, t.done ? 1 : 0, t.createdAt
        );
      }
    }

    await sqliteDb.exec("COMMIT");
  } catch (error) {
    await sqliteDb.exec("ROLLBACK");
    throw error;
  }
}

// Bootstrapping
async function startServer() {
  const sqliteDb = await getDB();

  // Primary API - Get full state
  app.get("/api/data", async (req, res) => {
    try {
      const data = await fetchFullClinicData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to grab SQLite data: " + err.message });
    }
  });

  // Primary API - Sync backup state
  app.post("/api/data", async (req, res) => {
    try {
      const newData: ClinicData = req.body;
      if (!newData || typeof newData !== "object") {
         res.status(400).json({ error: "Invalid clinical shape" });
         return;
      }
      await saveFullClinicData(newData);
      const updated = await fetchFullClinicData();
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to compile SQLite sync: " + err.message });
    }
  });

  // Direct specific POST requests - Patients
  app.post("/api/patients", async (req, res) => {
    try {
      const sqliteDbObj = await getDB();
      const p: Patient = req.body;
      if (!p || !p.id) {
         res.status(400).json({ error: "Missing identity" });
         return;
      }
      await sqliteDbObj.run(`
        INSERT OR REPLACE INTO patients (id, name, phone, phoneSecondary, age, gender, notes, createdAt, dentalChart, radiologyImages, whatsappNotificationsEnabled, preferredReminderTemplate, reminderTimingHoursBefore, whatsappCustomNotes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, 
        p.id, p.name, p.phone, p.phoneSecondary || null, p.age, p.gender, p.notes || null, p.createdAt, 
        JSON.stringify(p.dentalChart || {}), JSON.stringify(p.radiologyImages || []), 
        p.whatsappNotificationsEnabled ? 1 : 0, p.preferredReminderTemplate || null, 
        p.reminderTimingHoursBefore || null, p.whatsappCustomNotes || null
      );
      res.json({ success: true, patient: p });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Direct specific POST requests - Appointments
  app.post("/api/appointments", async (req, res) => {
    try {
      const sqliteDbObj = await getDB();
      const a: Appointment = req.body;
      if (!a || !a.id) {
         res.status(400).json({ error: "Missing scheduling" });
         return;
      }
      await sqliteDbObj.run(`
        INSERT OR REPLACE INTO appointments (id, patientId, patientName, patientPhone, dateTime, treatmentType, status, notes, price, paidAmount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        a.id, a.patientId, a.patientName || null, a.patientPhone || null, a.dateTime, a.treatmentType, a.status, a.notes || null, a.price || 0, a.paidAmount || 0
      );
      res.json({ success: true, appointment: a });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- EXPLICIT SQLITE DIAGNOSTIC ENDPOINTS ---

  // Get metadata diagnostic analysis
  app.get("/api/sqlite/statistics", async (req, res) => {
    try {
      const sDb = await getDB();
      const patientCount = (await sDb.get<{ c: number }>("SELECT count(*) as c FROM patients"))?.c || 0;
      const appointmentCount = (await sDb.get<{ c: number }>("SELECT count(*) as c FROM appointments"))?.c || 0;
      const prescriptionCount = (await sDb.get<{ c: number }>("SELECT count(*) as c FROM prescriptions"))?.c || 0;
      const medicationsCount = (await sDb.get<{ c: number }>("SELECT count(*) as c FROM custom_medications"))?.c || 0;
      const todoCount = (await sDb.get<{ c: number }>("SELECT count(*) as c FROM todo_tasks"))?.c || 0;

      let databaseSizeInBytes = 0;
      try {
        if (fs.existsSync(DB_FILE)) {
          databaseSizeInBytes = fs.statSync(DB_FILE).size;
        }
      } catch (e) {
        console.error(e);
      }

      // Check SQLite optimization and configuration parameters
      const journalMode = (await sDb.get<{ journal_mode: string }>("PRAGMA journal_mode"))?.journal_mode || "unknown";
      const integrityCheck = (await sDb.get<{ integrity_check: string }>("PRAGMA integrity_check"))?.integrity_check || "ok";

      res.json({
        success: true,
        sqlite_version: "3.x (WASM Compatible Node Service)",
        database_path: DB_FILE,
        database_size_bytes: databaseSizeInBytes,
        journal_mode: journalMode,
        integrity_check: integrityCheck,
        counts: {
          patients: patientCount,
          appointments: appointmentCount,
          prescriptions: prescriptionCount,
          medications: medicationsCount,
          todo_tasks: todoCount
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed fetching statistics: " + err.message });
    }
  });

  // Trigger SQLite vacuum command to shrink file sizes
  app.post("/api/sqlite/vacuum", async (req, res) => {
    try {
      const sDb = await getDB();
      console.log("Triggering SQLite VACUUM clean index rebuilding...");
      await sDb.exec("VACUUM");
      res.json({ success: true, message: "Database vacuumed and index pages reorganized successfully." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to optimize database: " + err.message });
    }
  });

  // Direct download of the SQLite database file
  app.get("/api/sqlite/download-db", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        res.download(DB_FILE, "clinic-data.sqlite", (err) => {
          if (err) {
            console.error("Error during download propagation:", err);
          }
        });
      } else {
        res.status(404).send("SQLite File is offline. It hasn't been initialized yet.");
      }
    } catch (err: any) {
      res.status(500).send("Database grab error: " + err.message);
    }
  });

  // Serve static assets or route via Vite in dev
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DentalClinic server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

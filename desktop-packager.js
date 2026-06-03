/**
 * 🛠️ DentClinic Desktop EXE automated Packaging Script
 * This script automates the desktop packaging process into a single executable installer (.exe) for Windows.
 * 
 * To run this locally:
 * 1. Extract the project ZIP.
 * 2. Install Node.js (v18 or newer).
 * 3. Run: npm install
 * 4. Run: node desktop-packager.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🤖 ديسكتوب جينيراتور: تحويل العيادة إلى ملف EXE");
console.log("==========================================");

try {
  // 1. Build React/Vite assets & server bundles
  console.log("🔄 المرحلة الأولى: جاري كومبايل وبناء ملفات الويب والـ SQLite...");
  execSync("npm run build", { stdio: 'inherit' });
  console.log("✅ تمت بنجاح.");

  // 2. Setup Electron dependencies in package.json if not present
  console.log("\n📦 المرحلة الثانية: فحص حزم الديسكتوب (Electron)...");
  const pkgPath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  let installedAnything = false;
  
  if (!pkg.dependencies?.electron && !pkg.devDependencies?.electron) {
    console.log("💾 جاري تحميل وتثبيت Electron للتطبيقات المكتبية...");
    execSync("npm install -D electron electron-builder", { stdio: 'inherit' });
    installedAnything = true;
  }

  // 3. Configure builder settings inside package.json
  console.log("\n⚙️ المرحلة الثالثة: ضبط إعدادات الانستولر (EXE Installer Settings)...");
  
  pkg.main = "electron-main.cjs";
  pkg.build = {
    appId: "com.dentclinic.app",
    productName: "DentClinic",
    directories: {
      output: "dist-desktop"
    },
    win: {
      target: ["nsis"], // NSIS creates a single auto-installing EXE file!
      icon: "assets/icon.png" // Safe fallback
    },
    nsis: {
      oneClick: true, // Installs automatically and instantly!
      allowToChangeInstallationDirectory: false,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: "عيادة طب الأسنان الذكية"
    },
    files: [
      "dist/**/*",
      "electron-main.cjs",
      "package.json",
      "node_modules/**/*"
    ],
    asar: true,
    asarUnpack: [
      "**/*.node"
    ]
  };

  // Add script commands
  pkg.scripts = {
    ...pkg.scripts,
    "dist:win": "electron-builder --windows"
  };

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log("✅ تم حقن الإعدادات بنجاح في ملف الباكيج.");

  // 4. Executing Electron-Builder
  console.log("\n🚀 المرحلة الرابعة: جاري إنتاج ملف الـ EXE التلقائي للتثبيت...");
  console.log("⚠️ قد يستغرق هذا دقيقة أو دقيقتين لتحميل المكونات...");
  execSync("npm run dist:win", { stdio: 'inherit' });

  console.log("\n🎉 مبارك! تم إنشاء برنامج التثبيت التلقائي بنجاح!");
  console.log(`📂 ابحث عن ملف التثبيت داخل المجلد: ${path.join(__dirname, 'dist-desktop')}`);
  console.log("يمكنك الآن نقله وتثبيته على أي حاسوب ليعمل 100% بدون إنترنت وبشكل مستقل تماماً.");

} catch (err) {
  console.error("\n❌ حدث خطأ أثناء تشغيل أداة التحويل المكتبي:", err.message);
  console.log("\n📌 لتشغيل الملف محلياً على جهازك الـ Windows يدوياً:");
  console.log("1. افتح موجه الأوامر (CMD) داخل مجلد المشروع المفرغ.");
  console.log("2. اكتب: npm install electron --save-dev");
  console.log("3. اكتب: npm install electron-builder --save-dev");
  console.log("4. اكتب: npx electron-builder --windows");
}

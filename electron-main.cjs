const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess = null;
let mainWindow = null;

let serverLogs = "";

function startExpressServer() {
  // Start the bundled Express SQLite server
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  
  // Set app data directory to persist SQLite database in AppData instead of read-only temp directories
  const dbDir = app.getPath('userData');
  
  serverProcess = fork(serverPath, [], {
    silent: true, // Captures stdout/stderr streams
    env: { 
      ...process.env, 
      NODE_ENV: 'production', 
      PORT: '3000',
      DB_PATH: path.join(dbDir, 'clinic-data.sqlite') // Persistent DB location
    }
  });

  if (serverProcess.stdout) {
    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      serverLogs += text;
      console.log('Server Stdout:', text);
    });
  }

  if (serverProcess.stderr) {
    serverProcess.stderr.on('data', (data) => {
      const text = data.toString();
      serverLogs += `\nERROR: ${text}`;
      console.error('Server Stderr:', text);
    });
  }

  serverProcess.on('error', (err) => {
    serverLogs += `\nFORK ERROR: ${err.message}`;
    console.error('Failed to start clinic server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: "مساعد عيادة الأسنان الذكي | DentClinic Desktop",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadURL('http://localhost:3000');

  // Handle load errors to show diagnostics instead of a silent blank white screen
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL.startsWith('http://localhost:3000')) {
      const safeLogs = serverLogs.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`);
      const errorHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فحص وتشخيص مخدم العيادة السنية</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            padding: 32px;
            max-width: 700px;
            width: 100%;
          }
          h1 {
            color: #ea580c;
            font-size: 20px;
            margin-top: 0;
            border-bottom: 2px solid #ffedd5;
            padding-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          p {
            font-size: 13px;
            line-height: 1.6;
            color: #475569;
          }
          .code-block {
            background: #0f172a;
            color: #38bdf8;
            padding: 16px;
            border-radius: 8px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            white-space: pre-wrap;
            direction: ltr;
            text-align: left;
            max-height: 220px;
            overflow-y: auto;
            margin: 15px 0;
            border: 1px solid #334155;
          }
          .btn {
            background: #0ea5e9;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn:hover {
            background: #0284c7;
          }
          .details {
            background: #f1f5f9;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            margin: 15px 0;
            border: 1px solid #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ تشخيص بدء تشغيل مخدم العيادة</h1>
          <p>التطبيق يحاول الاتصال بالمخدم المغذّي المدمج لقاعدة البيانات المحلية <strong>SQLite</strong> على المنفذ المحلي 3000، ولكنه لم يتلق استجابة بالوقت المحدد.</p>
          
          <div class="details">
            <strong>تقرير الاتصال بالشبكة المحلية:</strong><br>
            الحالة: تعطل في الاتصال • كود الخطورة: ${errorDescription} (${errorCode})<br>
            الرابط المتأثر: ${validatedURL}
          </div>

          <strong>السجلات الحية المنبعثة من المخدم المحلي (سيكشف سبب العطل):</strong>
          <div class="code-block">${safeLogs || 'لا توجد سجلات خارجة من المخدم حالياً. قد يكون تعذر تشغيل ملف Node.js لعدم تنزيل حزمة npm install.'}</div>

          <p>📌 <strong>كيف تصلح المشكلة محلياً بـ 3 خطوات؟</strong><br>
          1. تأكد من تحميل مجلد المشروع وفك ضغط ملف الـ ZIP وتثبيت معمارية نود بـ <code>npm install</code>.<br>
          2. تأكد من إغلاق أي خوادم أخرى تعمل على المنفذ <strong>3000</strong>.<br>
          3. يمكنك دوماً تشغيل البوابة الرقمية عبر المتصفح العادي كـ <strong>PWA مستقل</strong> بالكامل كحل بديل ومستدام.
          </p>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn" onclick="window.location.href='http://localhost:3000'">إعادة محاولة الاتصال والتحميل 🔄</button>
            <button class="btn" style="background:#64748b" onclick="window.location.reload()">تحديث صفحة الفحص 🛠️</button>
          </div>
        </div>
      </body>
      </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startExpressServer();
  // Wait a short duration to ensure Express SQLite spins up
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

# Flow Ticket Final No Proxy

هذه نسخة نهائية ثابتة لتجنب مشكلة:
ECONNREFUSED / Vite Proxy

## التشغيل النهائي الموصى به

```bash
npm install
npm run build
npm start
```

ثم افتح:

```text
http://localhost:4000
```

## التشغيل أثناء التطوير

```bash
npm install
npm run dev
```

ثم افتح:

```text
http://localhost:5173
```

## بيانات الدخول

```text
admin / admin123
user / user123
```

## مهم

في التشغيل النهائي لا تحتاج Vite ولا Proxy؛ السيرفر نفسه يخدم الواجهة والـ API من نفس الرابط.


# Flow Ticket Enterprise Final

نظام احترافي كامل لإدارة التذاكر شبيه بأنظمة Jira / Service Desk.

## المميزات

- Login حقيقي باستخدام JWT
- Backend API باستخدام Express
- Database SQLite لحفظ البيانات
- Dashboard احترافي
- Kanban Board احترافي
- Workflow محكوم:
  Backlog → To Do → In Progress → In Review → Testing → Done → Closed
- زر Move Next ذكي
- Send to Testing يظهر في In Review
- Mark as Done يظهر في Testing
- Close Issue يظهر في Done
- منع إغلاق التذكرة مباشرة إلا بعد Done
- Activity Log يسجل انتقالات الحالة
- Comments
- Ticket Number بدل Key
- شاشة تفاصيل التذكرة
- Status / Priority / Owner Dropdowns من Project Settings
- Project Settings لإدارة القوائم
- تغيير لون النظام Theme
- عربي / English
- إرسال Email عبر mailto
- Advanced Filters

## التشغيل

```bash
npm install
npm run dev
```

Frontend:
http://localhost:5173

Backend:
http://localhost:4000

## بيانات الدخول

Admin:
admin / admin123

User:
user / user123

## ملاحظات

- قاعدة البيانات يتم إنشاؤها تلقائيًا داخل:
  server/data/flow_ticket.sqlite
- لو تريد إعادة البيانات التجريبية، أغلق السيرفر واحذف ملف قاعدة البيانات ثم شغل النظام مرة أخرى.


## UI Professional Upgrade
- Dashboard colors upgraded with professional gradients.
- KPI cards have separated visual tones.
- Charts and status blocks improved.
- Kanban board columns/cards redesigned.
- Workflow strip and issue cards made more enterprise-like.



# Flow Ticket Enterprise V2

نسخة V2 مبنية على النسخة الكاملة المستقرة، وتضيف خطة وتجهيزات الأداء والخصائص التالية:

## Performance
- Backend filtering جاهز في شاشة Tickets
- Dashboard API موحد
- Database SQLite
- Controlled workflow
- Optimistic-style Kanban movement
- تصميم UI أخف وأكثر احترافية

## Features
- Login
- Roles: Admin / User
- Dashboard
- Kanban Board
- Ticket Register
- Ticket Detail Drawer
- Comments
- Activity Log
- Project Settings
- Theme Colors
- Email via mailto
- عربي / English
- Workflow:
  Backlog → To Do → In Progress → In Review → Testing → Done → Closed

## Run

```bash
npm install
npm run dev
```

## Login

admin / admin123
user / user123



## Users Edition

تمت إضافة نظام مستخدمين كامل:

- Register من شاشة الدخول
- Users Management للـ Admin
- إنشاء مستخدم جديد
- تغيير Role: Admin / User / Viewer
- Enable / Disable
- Reset Password
- Delete User
- منع Viewer من التعديل
- منع تعطيل أو حذف admin الافتراضي

## Accounts

Admin:
admin / admin123

User:
user / user123

أي مستخدم جديد من Register يحصل على Role = User تلقائيًا.



# Stable Guaranteed Version

هذه نسخة مستقرة مضمونة التشغيل مبنية على آخر إصدار كان يعمل قبل تعديلات Dashboard Pro التي سببت الشاشة البيضاء.

## Included
- Login
- Register
- Users Management
- Roles: Admin / User / Viewer
- Dashboard stable
- Kanban Board
- Tickets
- Create Issue
- Project Settings
- Comments
- Activity Log
- Theme colors
- Arabic / English
- Email via mailto

## Run

```bash
npm install
npm run dev
```

## Login

admin / admin123
user / user123

يمكن إنشاء مستخدم جديد من شاشة الدخول.


## Dashboard Pro Stable Release
- ألوان احترافية معبرة حسب نوع التذكرة:
  - Bug أحمر
  - Change Request بنفسجي
  - Enhancement أخضر
  - Task أزرق
- Tooltip احترافي
- Legend أسفل كل Chart
- Rounded Bars + Shadows
- تحسين شكل Dashboard بالكامل
- مبني على النسخة المستقرة لتجنب الشاشة البيضاء


## Excel Auto Sync

تم ربط النظام بملف Excel تلقائيًا.

- عند إنشاء Ticket جديدة يتم تحديث Excel.
- عند تعديل Ticket يتم تحديث Excel.
- عند حذف Ticket يتم تحديث Excel.
- عند إضافة Comment يتم تحديث Excel.

مكان الملف:
server/data/flow_ticket_data.xlsx

تحميل مباشر بعد التشغيل:
http://localhost:4000/api/excel/download

من شاشة Tickets يوجد زر:
Download Excel

الملف يحتوي على Sheets:
- Tickets
- Activity Log
- Comments


## Dark Mode + Clock Edition

تمت إضافة:
- Dark Mode كامل للنظام
- زر تبديل الوضع الليلي من القائمة الجانبية
- حفظ اختيار الوضع في Local Storage
- ساعة وتاريخ حالي أعلى كل شاشة
- تصميم الساعة بشكل احترافي


## Users Screen Fix
تم إصلاح شاشة إدارة المستخدمين:
- إضافة API المستخدمين للـ Backend.
- إضافة Register API.
- منع الشاشة البيضاء عند حدوث خطأ.
- إدارة المستخدمين تعمل من حساب Admin.


## Online Deploy + PDF Reports + Diagrams
- صفحة Reports داخل النظام
- PDF Executive Report
- صفحة Deploy Guide
- Mermaid Diagrams داخل docs/


## Clients System
تمت إضافة نظام العملاء:
- حقل اسم العميل في شاشة إنشاء التذكرة.
- الحقل قائمة منسدلة.
- القائمة مربوطة بـ Project Settings.
- يمكن إضافة/حذف العملاء من Settings تحت clients.
- يتم حفظ اسم العميل في SQLite.
- يظهر اسم العميل في شاشة التذاكر وتفاصيل التذكرة.
- يتم تصدير اسم العميل في Excel وPDF Reports.


## Final Client Dashboard Clean
تم توحيد المطلوب:
- اسم العميل في إنشاء التذكرة.
- نوع الحقل Dropdown.
- القيم مربوطة بـ Project Settings تحت clients.
- Dashboard يحتوي إحصائية حسب العميل.
- حذف شاشة التقارير.
- حذف شاشة النشر.


## Create Issue Fix
تم إصلاح شاشة إنشاء التذكرة بعد إضافة اسم العميل:
- منع الشاشة البيضاء.
- إضافة اسم العميل Dropdown بطريقة آمنة.
- العملاء من Project Settings / clients.
- تم فحص Build في BUILD_CHECK.txt.


## Create Button Fix
تم إصلاح زر إنشاء التذكرة:
- إصلاح INSERT API بعد إضافة client_name.
- إصلاح UPDATE API بعد إضافة client_name.
- إظهار رسالة الخطأ داخل شاشة إنشاء التذكرة بدل الشاشة الصامتة.


## Enterprise Clean No Bugs
تم إصلاح النسخة:
- حل خطأ requirePermission is not defined.
- تثبيت API إنشاء وتعديل التذكرة.
- تثبيت حقل اسم العميل Dropdown.
- حذف التقارير والنشر.
- الحفاظ على Dashboard حسب العميل.


## Create Ticket Submit Fixed
تم إصلاح زر إنشاء التذكرة نهائيًا:
- إضافة client_name و sla_due_at إلى قاعدة البيانات.
- إضافة Migration للجداول القديمة.
- إصلاح API إنشاء التذكرة.
- إظهار رسالة نجاح أو خطأ داخل شاشة إنشاء التذكرة.
- ربط اسم العميل بقائمة clients في Project Settings.


## Board Screen Fix
تم إصلاح شاشة لوحة المهام:
- التعامل مع نتيجة /api/tickets سواء كانت Array أو { data, pagination }.
- منع خطأ tickets.filter is not a function.
- إضافة معالجة أخطاء تحميل لوحة المهام.
- تحسين دالة api لعرض أخطاء السيرفر الحقيقية.


## Final No Errors Build
تم تثبيت النسخة النهائية:
- تعريف ticketSelectSql.
- تعريف notify.
- تعريف requirePermission.
- إصلاح API /api/tickets.
- إصلاح شاشة لوحة المهام.
- إصلاح إنشاء التذكرة.
- إرجاع JSON errors بدل HTML errors.


## Client + Workflow Update
- حذف Unassigned من إحصائية العميل.
- تغيير عنوان chart إلى العميل / Client.
- إلغاء قاعدة منع انتقالات Workflow.
- يمكن تغيير الحالة لأي Status من شاشة التفاصيل.
- إضافة العميل في شاشة تفاصيل التذكرة.


## groupByClient Fix
تم إصلاح خطأ:
ReferenceError: groupByClient is not defined

Dashboard الآن يستخدم byClient بشكل آمن مع حذف Unassigned.


## Login Pro Update
- حذف بيانات Admin/User من شاشة الدخول.
- حذف زر Create Account.
- إجبار المستخدم على تسجيل الدخول عند فتح النظام.
- تحسين UX/UI لشاشة Login فقط.
- إضافة إظهار/إخفاء كلمة المرور ورسائل خطأ واضحة.


## Render Ready Deployment
هذه النسخة جاهزة للنشر على Render مباشرة.

Render:
- Root Directory: فارغ
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variable: `NODE_ENV=production`

تم ضبط السيرفر ليخدم React build من `client/dist` على نفس Web Service، لذلك لا تحتاج localhost أو تشغيل frontend/backend منفصلين.


## MongoDB Persistent Version
هذه النسخة تحفظ البيانات في MongoDB Atlas بدل SQLite، لذلك لا تختفي البيانات بعد كل Deploy.

Render Environment:
- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV=production`

Default login:
- admin / admin123


## MongoDB Final Fix
تم تصحيح اتصال MongoDB:
- قراءة `MONGO_URI` مع trim لإزالة أي مسافات.
- إيقاف التشغيل برسالة واضحة لو المتغير غير موجود.
- إنشاء MongoClient داخل connectMongo مباشرة.
- إضافة Logs واضحة لتشخيص الاتصال.


## v6.1 Security + UX Update
- Added Helmet and rate limiting.
- Added backend validation and sanitization.
- Added server-side search and filters.
- Added client filter to Tickets screen.


## v6.4
- Language switcher with RTL/LTR direction switching.
- Sidebar moves right in Arabic and left in English.
- Professional Tickets UI/UX upgrade.

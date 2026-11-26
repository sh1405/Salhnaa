# النشر التلقائي لصالحنا عبر GitHub وCloudflare Workers

## مسار التحديث

عند حفظ التغييرات في مشروع Manus كـcheckpoint على المستودع القانوني، تُسجّل على `main` في `sh1405/Salhnaa`. لا تنتقل التعديلات غير المحفوظة كـcheckpoint إلى GitHub. بعد توصيل Cloudflare Workers Builds بالمستودع والفرع `main`، يتولى Cloudflare البناء والنشر تلقائيًا عند كل push مناسب إلى هذا الفرع. هذا الملف يجهّز المشروع، لكنه لا ينشئ اتصال GitHub داخل حساب Cloudflare ولا يضيف DNS أو نطاقًا مخصصًا.

## إعداد Workers Builds في Cloudflare

اختر إعداد **Workers Builds** لا Pages، واربط المستودع `sh1405/Salhnaa` والفرع `main` بالـWorker القائم `salihna`.

| الحقل | القيمة |
|---|---|
| Root directory | `/` (جذر المستودع) |
| Production branch | `main` |
| Build command | `pnpm run build:cloudflare` |
| Build output directory | لا يوجد حقل إخراج منفصل لعملية نشر Worker؛ يقرأ Wrangler إعداد الأصول في `wrangler.jsonc` من `./dist/public` |
| Deploy command | `pnpm run deploy:cloudflare` |
| Preview deployments | اختيارية؛ عطّلها إن كان المطلوب النشر إلى production فقط |

يحتوي المستودع على `pnpm-lock.yaml` ويدوّن إصدار pnpm في `package.json`، ولذلك ينبغي أن يستخدم البناء تثبيت الاعتماديات الموافق للقفل. يبني أمر `build:cloudflare` واجهة Vite فقط؛ لا تستخدم `pnpm run build` هنا، لأنه يبني مدخل خادم Node/Express وليس مخرجات Worker المقصودة. يقوم أمر النشر `wrangler deploy` بنشر `server/worker.ts` والأصول وفق `wrangler.jsonc`. لا يحتاج أمر النشر إلى `wrangler login` تفاعلي داخل جلسة البناء؛ يجب أن يكون اتصال GitHub وWorker build authorization قد أُعدّا من لوحة Cloudflare.

## الإعدادات والربط

ملف `wrangler.jsonc` يعرّف اسم Worker `salihna` ومدخل `server/worker.ts`، ومجلد الأصول `./dist/public` على binding `ASSETS`، وقاعدة D1 المسماة `salihna` على binding `DB`، وWorkers AI على binding `AI`. لا تنشئ قاعدة بيانات جديدة ولا تغيّر `database_id` عند ربط البناء؛ المطلوب نشر Worker الحالي مع bindings الحالية.

توجد إعدادات عامة لازمة في `wrangler.jsonc` تحت `vars`: `MANUS_PROJECT_ID` و`MANUS_OAUTH_API_URL` و`MANUS_OAUTH_PORTAL_URL` و`MANUS_API_URL` و`MANUS_API_BROWSER_KEY`. احتفظ بقيم الملف الحالية ولا تضع مفاتيح سرية في `vars` أو في مستودع GitHub. قيمة `MANUS_API_BROWSER_KEY` مخصصة لإعداد المتصفح العام كما يبيّن مسار `publicPlatformScript`؛ لا تخلطها مع مفتاح الخادم السري.

## أسرار التشغيل

أضف الأسرار في إعدادات Worker production في Cloudflare **Variables and Secrets**، لا في إعدادات البناء ولا في Git:

- `SESSION_SECRET` — سر قوي وعشوائي لتوقيع جلسات Worker وملفات الارتباط. في مسار Worker، يقرأ التطبيق هذا الاسم تحديدًا.
- `MANUS_API_KEY` — مفتاح الخادم للوصول إلى واجهات Manus/API التي تستخدمها وظائف الذكاء الاصطناعي والتخزين والتنبيهات وغيرها.

`DATABASE_URL` ليس مطلوبًا لمسار Worker ما دام binding `DB` متصلًا بقاعدة D1 المعرفة في `wrangler.jsonc`. لا تستخدم `MANUS_JWT_SECRET` بدل `SESSION_SECRET` على Worker؛ الاسم الأول لمسار خادم Node المحلي/القديم. `OWNER_OPEN_ID` اختياري فقط إذا أُريد تثبيت معرّف مالك/مشرف؛ لا يلزم لتشغيل النشر الأساسي.

لا يحتاج build command إلى أسرار وقت البناء؛ تُقرأ الأسرار وقت تشغيل الطلبات. احفظ القيم في أسرار إعداد Worker production، ولا تنسخها إلى variables العامة أو GitHub Actions.

## OAuth والنطاق

بعد أن يربط مالك الحساب النطاق الفرعي من لوحة Cloudflare، يجب أن يطابق عنوان إعادة OAuth الذي يسجله تطبيق Manus عنوان النطاق النهائي، بالمسار `/api/oauth/callback`. إضافة النطاق أو DNS خارج نطاق هذا الإعداد؛ لا يغيّر هذا الملف سجلات DNS.

## حدود التشغيل المجاني

النشر التلقائي يعتمد على حصة Cloudflare Workers Builds وخطة Worker المرتبطة بالحساب. عند بلوغ الحد المجاني قد تتوقف عمليات البناء أو يتأثر التشغيل وفق حدود خطة الحساب؛ لا تُفعّل الفوترة أو الترقية تلقائيًا. راجع لوحة Cloudflare قبل تفعيل الربط للتأكد من خطة الحساب وإعداد الفوترة.

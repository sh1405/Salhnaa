import { Link } from "wouter";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  Building2,
  CircleDot,
  Compass,
  Earth,
  GitMerge,
  Layers3,
  LockKeyhole,
  MessageCircle,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Brand } from "@/components/SiteHeader";

const tracks = [
  { id: "individual", number: "01", icon: CircleDot, title: "الأفراد", description: "خلافات شخصية أو مالية؛ ابدأ بما حدث وما تريد تغييره.", label: "بين شخصين" },
  { id: "family", number: "02", icon: GitMerge, title: "الأسرة والعائلة", description: "حين تتشابك العلاقة القريبة مع احتياجات وحدود مختلفة.", label: "علاقات قريبة" },
  { id: "community", number: "03", icon: Network, title: "المجتمعات والقبائل", description: "رتّب تعدد الأصوات والمصالح والتمثيل دون افتراض الإجماع.", label: "تعدد الأصوات" },
  { id: "business", number: "04", icon: Layers3, title: "التجارة والشراكات", description: "حوّل الالتزامات ومصالح الأطراف إلى مسائل قابلة للنقاش.", label: "علاقات تجارية" },
  { id: "workplace", number: "05", icon: Workflow, title: "العمل والوظيفة", description: "افصل بين أثر الخلاف وطريقة العمل أو الإجراء الذي يحتاج توضيحًا.", label: "بيئة العمل" },
  { id: "organization", number: "06", icon: Building2, title: "المؤسسات والجهات", description: "مساحة أولية للنظر في العلاقة والأدوار والمسؤوليات المتقاطعة.", label: "مؤسسات" },
  { id: "multi", number: "07", icon: Compass, title: "خلاف متعدد الأطراف", description: "صورة منظّمة لما يتقاطع وما يختلف بين المجموعات المعنية.", label: "أكثر من طرفين" },
  { id: "international", number: "08", icon: Earth, title: "خلاف عابر للحدود", description: "دوّن السياقات والدول ذات الصلة، وانتبه إلى اختلاف الأطر النظامية.", label: "أكثر من سياق" },
];

const mapSteps = [
  { number: "01", title: "المسألة", text: "ما الذي حدث، وما الذي ما زال يحتاج إلى توضيح؟" },
  { number: "02", title: "ما يهمّك", text: "الحاجة أو المصلحة خلف طلبك، لا الطلب وحده." },
  { number: "03", title: "خيارات أولية", text: "بدائل قابلة للنقاش؛ ليست وعودًا ولا التزامات." },
  { number: "04", title: "تجربة ومراجعة", text: "خطوة صغيرة، علامة نجاح، ووقت للعودة إليها." },
];

export default function Home() {
  return (
    <main className="redesign-home" dir="rtl" lang="ar">
      <section className="new-hero" aria-labelledby="home-title">
        <div className="new-hero__grid shell">
          <div className="new-hero__copy">
            <div className="new-hero__meta"><span className="brand-signal" /> أداة عربية لتهيئة الإصلاح <span className="new-hero__edition">صالِحنا / ٠١</span></div>
            <h1 id="home-title">لا نبدأ بـ<br /><span className="new-hero__question">«من المخطئ؟»</span><br />بل بـ<br /><em>«ما الذي يحتاج<br className="desktop-break" /> إلى إصلاح؟»</em></h1>
            <p className="new-hero__lead">مساحة عملية ترتّب روايتك، وتكشف ما يهمّك، وتساعدك على التفكير في خطوة تفاهم قابلة للنقاش — دون أن تتكلم نيابةً عنك.</p>
            <div className="new-hero__actions">
              <Link href="/journey" className="button button-coral">ارسم خريطة خلافك <ArrowLeft size={18} /></Link>
              <a href="#how-it-works" className="new-hero__secondary">كيف تعمل؟ <span><ArrowDownLeft size={15} /></span></a>
            </div>
            <div className="new-hero__promise"><LockKeyhole size={15} /><span>إجاباتك لك؛ لا تُشارك تلقائيًا ولا تُرسل دعوة إلى الطرف الآخر.</span></div>
          </div>

          <div className="new-hero__art" aria-label="عمل فني تجريدي يصوّر مسارين يتّسع بينهما جسر مشترك">
            <img src="/manus-storage/async-images/qF7RWyhGGo6xnPdx7AoA6K/image-1.webp" alt="" />
            <div className="new-hero__art-tag new-hero__art-tag--top"><span>وجهة نظر</span><strong>تُسمَع</strong></div>
            <div className="new-hero__art-tag new-hero__art-tag--bottom"><span>اختلاف</span><strong>يفتح احتمالًا</strong></div>
            <div className="new-hero__art-index">THE THIRD SPACE <span>—</span> مساحة ثالثة</div>
            <span className="new-hero__art-mark" aria-hidden="true">↙</span>
          </div>
        </div>
        <div className="new-hero__floor shell"><span>وضوحٌ قبل القرار</span><span className="new-hero__rule" /><a href="#how-it-works">اكتشف المنهج <ArrowDown size={14} /></a></div>
      </section>

      <section className="promise-band" aria-label="مبادئ التجربة">
        <div className="shell promise-band__inner">
          <p><span>ليست وساطة آلية.</span> بل مساحة تهيئة قبل أي حوار.</p>
          <div><ShieldCheck size={18} /><span>السلامة قبل التفاهم</span></div>
          <div><Compass size={18} /><span>أسئلة بحسب المسار</span></div>
          <div><GitMerge size={18} /><span>خطوة صغيرة قابلة للمراجعة</span></div>
        </div>
      </section>

      <section id="how-it-works" className="map-section" aria-labelledby="map-title">
        <div className="shell map-section__layout">
          <div className="map-section__intro">
            <span className="section-kicker"><span>الطريقة / ٠٢</span> من رواية إلى قرار</span>
            <h2 id="map-title">ليس ملخصًا فقط.<br /><em>بل خريطة لما يمكن فعله.</em></h2>
            <p>في نهاية الرحلة، تجمع إجاباتك في لوحة واحدة: المسألة كما ترويها، ما يهمك، الخيارات التي قد تبحثها، وكيف تختبر أي خطوة وتراجعها.</p>
            <Link href="/journey" className="text-link">ابدأ بناء الخريطة <ArrowLeft size={17} /></Link>
            <div className="map-section__note"><span>تنبيه مهم</span><p>الخريطة تعكس ما أدخلته أنت وحدك. لا تتحقق من الوقائع، ولا تمثّل وجهة الطرف الآخر، وليست وساطة فعلية أو رأيًا قانونيًا.</p></div>
          </div>

          <div className="decision-map" aria-label="مكوّنات خريطة قرار أولية">
            <div className="decision-map__head"><span><i /> خريطة قرار أولية</span><small>نموذج من أربعة محاور</small></div>
            <div className="decision-map__rows">
              {mapSteps.map((step, index) => <div className={`decision-map__row decision-map__row--${index + 1}`} key={step.number}>
                <span className="decision-map__num">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                <span className="decision-map__node" aria-hidden="true" />
              </div>)}
            </div>
            <div className="decision-map__foot"><span>كل محور قابل للمراجعة</span><span className="decision-map__connector" /><span>القرار لك</span></div>
          </div>
        </div>
      </section>

      <section id="paths" className="routes-section" aria-labelledby="routes-title">
        <div className="shell">
          <div className="routes-heading">
            <div><span className="section-kicker"><span>المسارات / ٠٣</span> أسئلة لا قوالب جاهزة</span><h2 id="routes-title">ابدأ من طبيعة<br /><em>الخلاف الذي أمامك.</em></h2></div>
            <div className="routes-heading__aside"><p>اختر الأقرب. تتغير الأسئلة بحسب السياق، ويمكنك ترك غير الضروري فارغًا.</p><Link href="/journey" className="text-link">كل المسارات <ArrowLeft size={17} /></Link></div>
          </div>

          <div className="route-grid">
            {tracks.map(({ id, number, icon: Icon, title, description, label }, index) => (
              <Link key={id} href={`/journey?kind=${id}`} className={`route-card route-card--${(index % 4) + 1}`}>
                <div className="route-card__top"><span className="route-card__icon"><Icon size={20} strokeWidth={1.8} /></span><span className="route-card__number">{number}</span></div>
                <span className="route-card__label">{label}</span><h3>{title}</h3><p>{description}</p>
                <div className="route-card__link"><span>ابدأ من هنا</span><ArrowUpLeft size={16} /></div>
              </Link>
            ))}
          </div>
          <p className="routes-foot">المسارات بداية منظّمة وليست تصنيفًا قانونيًا لطبيعة النزاع. <Link href="/trust">حدود الأداة والسلامة <ArrowLeft size={14} /></Link></p>
        </div>
      </section>

      <section className="test-section" aria-labelledby="test-title">
        <div className="shell test-section__layout">
          <div className="test-section__heading"><span className="section-kicker section-kicker--light"><span>الإصلاح / ٠٤</span> جرّب، تعلّم، راجع</span><h2 id="test-title">لا تبحث عن<br /><em>«حلّ مثالي».</em><br />ابدأ بخطوة<br /><span>يمكن اختبارها.</span></h2><p>يمكن أن تبدأ خيارات التفاهم صغيرة: توضيح مسؤولية، تجربة ترتيب جديد، أو جلسة استماع محددة الموضوع. المهم: من يفعل ماذا، وما الذي سيُعدّ تقدّمًا، ومتى تراجعان النتيجة؟</p><Link href="/journey" className="button button-outline-light">ابنِ خطوة قابلة للمراجعة <ArrowLeft size={17} /></Link></div>
          <div className="test-card">
            <div className="test-card__header"><span>مصمّم على مقاس الخلاف</span><MessageCircle size={17} /></div>
            <div className="test-card__line"><span>01</span><div><small>الخطوة</small><strong>ماذا سنجرّب؟</strong></div><span className="test-card__stripe" /></div>
            <div className="test-card__line"><span>02</span><div><small>المسؤولية</small><strong>من يتولى التنفيذ؟</strong></div><span className="test-card__stripe" /></div>
            <div className="test-card__line"><span>03</span><div><small>إشارة نجاح</small><strong>ما الذي نلاحظه؟</strong></div><span className="test-card__stripe" /></div>
            <div className="test-card__line"><span>04</span><div><small>مراجعة</small><strong>متى نعود إليها؟</strong></div><span className="test-card__stripe" /></div>
            <div className="test-card__foot"><span>اقتراح للتفكير، لا وعد بالنتيجة</span><ArrowDownLeft size={16} /></div>
          </div>
        </div>
      </section>

      <section className="dialogue-section" aria-labelledby="dialogue-title">
        <div className="shell dialogue-section__layout">
          <div className="dialogue-section__card"><span className="dialogue-section__quote-mark">“</span><p>أود أن أسمع كيف رأيت الموقف، ثم نفكر في خطوة عملية تناسبنا.</p><div className="dialogue-section__card-foot"><span>مسودة، لا نص محفوظ</span><span className="dialogue-section__dots"><i /><i /><i /></span></div></div>
          <div className="dialogue-section__copy"><span className="section-kicker"><span>أداة عملية / ٠٥</span> للحظة ما قبل الحديث</span><h2 id="dialogue-title">ابدأ بجملة<br /><em>تترك بابًا مفتوحًا.</em></h2><p>أداة حوار محلية تساعدك على تحويل ما حدث وما يهمك إلى افتتاحية هادئة. يمكنك تعديلها أو نسخها — ولا تُرسل إلى أحد.</p><Link href="/dialogue" className="button button-dark">حضّر بداية الحوار <ArrowLeft size={17} /></Link><div className="dialogue-section__local"><LockKeyhole size={14} /> تعمل هذه المسودة على جهازك فقط.</div></div>
        </div>
      </section>

      <section id="business" className="business-band">
        <div className="shell business-band__inner"><div className="business-band__icon"><Building2 size={28} /></div><div className="business-band__copy"><span className="section-kicker"><span>مسار متخصص</span> للعلاقات المهنية</span><h2>إذا اختلّ التعاون،<br /><em>فابدأ بتوضيح ما يستمر.</em></h2><p>للشراكات والعمل والمؤسسات: ميّز بين ما يخصّ العلاقة، والتوقعات، والمسؤولية، وأي إجراء قائم ينبغي وضعه في الحسبان.</p><Link href="/journey?kind=business" className="text-link">افتح المسار التجاري <ArrowLeft size={16} /></Link></div><div className="business-band__aside"><span>ملاحظة صريحة</span><strong>صالِحنا لا تقدّم<br />استشارة قانونية.</strong><span className="business-band__divider" /><small>تحقّق من المواعيد الرسمية والالتزامات مع مختصّك.</small></div></div>
      </section>

      <section className="limits-section">
        <div className="shell limits-section__inner"><div><span className="section-kicker"><span>ثقة وسلامة</span> حدود نلتزم بها</span><h2>التفاهم مهم؛<br /><em>لكن سلامتك أولًا.</em></h2></div><div className="limits-grid"><div><ShieldCheck size={19} /><h3>السلامة تسبق الصلح</h3><p>عند الخطر أو الإكراه، قد لا تكون الوساطة مناسبة. أوقف الرحلة واطلب دعمًا محليًا موثوقًا.</p></div><div><LockKeyhole size={19} /><h3>الخصوصية ليست وعدًا مطلقًا</h3><p>الملف لا يُشارك تلقائيًا؛ حفظه يتطلب حسابًا وموافقة. راجع صفحة الثقة لمعرفة ما يُحفظ.</p></div><div><ArrowDownLeft size={19} /><h3>مسودتك لا تمثل الطرفين</h3><p>ما تنتجه الأداة تأمل منظّم من إجاباتك وحدك، لا وساطة أو حكمًا أو ضمانًا للتفاهم.</p></div></div><Link href="/trust" className="limits-link">اقرأ تفاصيل الثقة والسلامة <ArrowLeft size={16} /></Link></div>
      </section>

      <section className="last-step"><div className="shell last-step__inner"><div><span className="section-kicker section-kicker--light"><span>الخطوة التالية</span> ابدأ كما أنت</span><h2>ليس عليك أن تعرف<br /><em>الحل قبل البداية.</em></h2><p>اكتب ما تعرفه الآن، واترك الأسئلة الأخرى فارغةً إلى أن تتضح.</p></div><Link href="/journey" className="button button-coral">ابدأ خريطة خلافك <ArrowLeft size={18} /></Link></div></section>

      <footer className="new-footer"><div className="shell new-footer__grid"><div className="new-footer__brand"><Brand /><p>أداة عربية لتهيئة الأطراف لفهم الخلاف واستكشاف خيارات التفاهم.</p><span>مساحة ثالثة — دون أن نقرر عنك.</span></div><div><h4>استكشف</h4><a href="/#paths">مسارات الإصلاح</a><a href="/#how-it-works">خريطة القرار</a><Link href="/dialogue">أداة الحوار</Link></div><div><h4>حسابك</h4><Link href="/journey">رحلة جديدة</Link><Link href="/cases">ملفاتي</Link><Link href="/assistant">المساعد الاختياري</Link></div><div className="new-footer__safety"><ShieldCheck size={20} /><h4>سلامتك أولًا</h4><p>عند خطر فوري، تواصل مع خدمات الطوارئ أو جهة حماية في بلدك. هذه المنصة ليست خدمة طوارئ أو جهة قضائية.</p></div></div><div className="shell new-footer__base"><span>© صالِحنا</span><span>لا نتحقق من الوقائع، ولا نضمن اتفاقًا أو نتيجة.</span><Link href="/trust">الثقة والسلامة <ArrowLeft size={13} /></Link></div></footer>
    </main>
  );
}

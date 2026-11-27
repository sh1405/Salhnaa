import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowUpLeft,
  Building2,
  CircleDot,
  Compass,
  Earth,
  FileText,
  GitMerge,
  Layers3,
  LockKeyhole,
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

export default function Home() {
  return (
    <main className="redesign-home" dir="rtl" lang="ar">
      <section className="new-hero" aria-labelledby="home-title">
        <div className="new-hero__grid shell">
          <div className="new-hero__copy">
            <div className="new-hero__meta"><span className="brand-signal" /> <span className="new-hero__descriptor">من الإنصات تبدأ مساحة التفاهم</span><span className="new-hero__edition">صالِحنا / ٠١</span></div>
            <h1 id="home-title">ابدأ بفهم الخلاف.<em>ثم اختر ما يصلحه.</em></h1>
            <p className="new-hero__lead">مساحة عملية ترتّب روايتك، وتكشف ما يهمّك، وتساعدك على التفكير في خطوة تفاهم قابلة للنقاش — دون أن تتكلم نيابةً عنك.</p>
            <div className="new-hero__actions">
              <Link href="/journey" className="button button-coral">ابدأ رحلة الصلح <ArrowLeft size={18} /></Link>
              <a href="#paths" className="home-secondary-link">استكشف مسارات الخلاف</a>
            </div>
            <div className="new-hero__promise"><LockKeyhole size={15} /><span>إجاباتك لك؛ لا تُشارك تلقائيًا ولا تُرسل دعوة إلى الطرف الآخر.</span></div>
          </div>

          <div className="new-hero__art" aria-label="عمل فني تجريدي يصوّر مسارين يتّسع بينهما جسر مشترك">
            <img src="https://salihna-r3mkuywg.manus.space/manus-storage/async-images/Qps6IonCzfBghiwIjTuKT2/image-1.webp" alt="" />
          </div>
        </div>
        <div className="new-hero__floor shell"><span>وضوحٌ قبل القرار</span><span className="new-hero__rule" /><span>ثمانية مسارات، اختر الأقرب</span></div>
      </section>

      <section className="journey-preview" aria-label="مراحل رحلة الصلح">
        <div className="shell journey-preview__inner">
          <div className="journey-preview__intro"><span>رحلة واضحة، بلا استعجال</span><strong>من ترتيب الفكرة إلى خطوة ممكنة</strong></div>
          <div className="journey-preview__step"><span className="journey-preview__icon"><LockKeyhole size={17} /></span><div><small>الخطوة ١</small><strong>دخول آمن</strong></div></div>
          <span className="journey-preview__connector" aria-hidden="true" />
          <div className="journey-preview__step"><span className="journey-preview__icon"><FileText size={17} /></span><div><small>الخطوة ٢</small><strong>صحيفة الود</strong></div></div>
          <span className="journey-preview__connector" aria-hidden="true" />
          <div className="journey-preview__step"><span className="journey-preview__icon"><GitMerge size={17} /></span><div><small>الخطوة ٣</small><strong>اختر المتابعة</strong></div></div>
        </div>
      </section>

      <section id="paths" className="routes-section" aria-labelledby="routes-title">
        <div className="shell">
          <div className="routes-heading">
            <div><span className="section-kicker"><span>المسارات / ٠٢</span> أسئلة لا قوالب جاهزة</span><h2 id="routes-title">ابدأ من طبيعة<br /><em>الخلاف الذي أمامك.</em></h2></div>
            <div className="routes-heading__aside"><p>اختر الأقرب. تتغير الأسئلة بحسب السياق، ويمكنك ترك غير الضروري فارغًا.</p></div>
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
          <p className="routes-foot">المسارات بداية منظّمة وليست تصنيفًا قانونيًا لطبيعة النزاع.</p>
        </div>
      </section>

      <footer className="new-footer">
        <div className="shell new-footer__grid">
          <div className="new-footer__brand"><Brand /><p>مساحة عربية ترتّب روايتك، وتساعدك على استكشاف ما يمكن إصلاحه.</p></div>
          <nav aria-label="استكشف"><h4>استكشف</h4><a href="/#paths">مسارات الخلاف</a></nav>
          <nav aria-label="حسابك"><h4>حسابك</h4><Link href="/cases">ملفاتي</Link></nav>
          <div className="new-footer__safety"><ShieldCheck size={18} /><div><h4>خيارات المتابعة</h4><p>يمكنك تدوين تفضيل الوساطة البشرية أو الصوت الاختياري. استقبال الطلبات والجلسات الصوتية غير مفعّل بعد؛ والكتابة وحدها متاحة لإعداد خريطتك.</p><Link href="/trust">اعرف حدود الخدمة والخصوصية <ArrowLeft size={13} /></Link></div></div>
        </div>
        <div className="shell new-footer__base"><span>© صالِحنا</span><span>الخريطة من إجاباتك وحدك؛ لا نتحقق من الوقائع ولا نضمن نتيجة.</span></div>
      </footer>
    </main>
  );
}

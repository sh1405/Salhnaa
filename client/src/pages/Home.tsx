import { Link } from "wouter";
import {
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
            <div className="new-hero__meta"><span className="brand-signal" /> أداة عربية لتهيئة الإصلاح <span className="new-hero__edition">صالِحنا / ٠١</span></div>
            <h1 id="home-title">لا نبدأ بـ<br /><span className="new-hero__question">«من المخطئ؟»</span><br />بل بـ<br /><em>«ما الذي يحتاج<br className="desktop-break" /> إلى إصلاح؟»</em></h1>
            <p className="new-hero__lead">مساحة عملية ترتّب روايتك، وتكشف ما يهمّك، وتساعدك على التفكير في خطوة تفاهم قابلة للنقاش — دون أن تتكلم نيابةً عنك.</p>
            <div className="new-hero__actions">
              <a href="#paths" className="button button-coral">اختر نوع الخلاف <ArrowLeft size={18} /></a>
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
        <div className="new-hero__floor shell"><span>وضوحٌ قبل القرار</span><span className="new-hero__rule" /><span>ثمانية مسارات، اختر الأقرب</span></div>
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

      <section className="limits-section">
        <div className="shell limits-section__inner"><div><span className="section-kicker"><span>ثقة وسلامة</span> حدود نلتزم بها</span><h2>التفاهم مهم؛<br /><em>لكن سلامتك أولًا.</em></h2></div><div className="limits-grid"><div><ShieldCheck size={19} /><h3>السلامة تسبق الصلح</h3><p>عند الخطر أو الإكراه، قد لا تكون الوساطة مناسبة. أوقف الرحلة واطلب دعمًا محليًا موثوقًا.</p></div><div><LockKeyhole size={19} /><h3>الخصوصية ليست وعدًا مطلقًا</h3><p>الملف لا يُشارك تلقائيًا؛ حفظه يتطلب حسابًا وموافقة. راجع صفحة الثقة لمعرفة ما يُحفظ.</p></div><div><ArrowDownLeft size={19} /><h3>مسودتك لا تمثل الطرفين</h3><p>ما تنتجه الأداة تأمل منظّم من إجاباتك وحدك، لا وساطة أو حكمًا أو ضمانًا للتفاهم.</p></div></div><Link href="/trust" className="limits-link">اقرأ تفاصيل الثقة والسلامة <ArrowLeft size={16} /></Link></div>
      </section>

      <footer className="new-footer"><div className="shell new-footer__grid"><div className="new-footer__brand"><Brand /><p>أداة عربية لتهيئة الأطراف لفهم الخلاف واستكشاف خيارات التفاهم.</p></div><div><h4>استكشف</h4><a href="/#paths">اختر نوع الخلاف</a></div><div><h4>حسابك</h4><Link href="/cases">ملفاتي</Link></div><div className="new-footer__safety"><ShieldCheck size={20} /><h4>السلامة والخصوصية</h4><p>عند خطر فوري، تواصل مع خدمات الطوارئ أو جهة حماية في بلدك. هذه المنصة ليست خدمة طوارئ أو جهة قضائية.</p><Link href="/trust">اعرف حدود الأداة</Link></div></div><div className="shell new-footer__base"><span>© صالِحنا</span><span>لا نتحقق من الوقائع، ولا نضمن اتفاقًا أو نتيجة.</span></div></footer>
    </main>
  );
}

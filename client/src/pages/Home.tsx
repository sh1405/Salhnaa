import { Link } from "wouter";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, Building2, Check, CircleDot, Compass, Earth, GitMerge, Layers3, Leaf, MessageCircle, Network, Scale, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Brand } from "@/components/SiteHeader";

const tracks = [
  { id:"individual", number:"01", icon:CircleDot, title:"الأفراد", description:"للخلافات الشخصية والمالية والعلاقات بين الأفراد.", label:"مساحة لفهم ما حدث" },
  { id:"family", number:"02", icon:GitMerge, title:"الأسرة والعائلة", description:"حين تتداخل الروابط القريبة مع وجهات نظر مختلفة.", label:"نحفظ قيمة العلاقة" },
  { id:"community", number:"03", icon:Network, title:"القبائل والمجتمعات", description:"مسار يراعي تعدد الأطراف والتمثيل والاعتبارات الاجتماعية.", label:"نستمع إلى الأطراف" },
  { id:"business", number:"04", icon:Scale, title:"التجارة والشراكات", description:"للاختلافات التعاقدية والتجارية ومصالح الشركاء.", label:"ننظر إلى المصالح" },
  { id:"workplace", number:"05", icon:Workflow, title:"العمل والوظيفة", description:"مساحة لفهم الخلافات المهنية مع مراعاة الحقوق والإجراءات.", label:"وضوح في بيئة العمل" },
  { id:"organization", number:"06", icon:Building2, title:"المؤسسات والجهات", description:"للخلافات التنظيمية وبين الإدارات والجهات المختلفة.", label:"حلول تراعي السياق" },
  { id:"multi", number:"07", icon:Layers3, title:"متعددة الأطراف", description:"عندما تتعدد وجهات النظر وتتقاطع المصالح.", label:"نرتب أبعاد الخلاف" },
  { id:"international", number:"08", icon:Earth, title:"عابرة للحدود", description:"للعلاقات التي تتصل بأكثر من دولة أو نظام.", label:"خصوصية كل سياق" },
];

export default function Home() {
  return <main dir="rtl">
    <section className="hero">
      <div className="hero-grid shell">
        <div className="hero-copy">
          <div className="hero-eyebrow"><span></span> مساحة أقرب للتفاهم</div>
          <h1>لكل خلافٍ<br/><em>مساحة أخرى</em><br/>للفهم.</h1>
          <p className="hero-description">في صالِحنا، نؤمن أن الإصغاء بداية كل حل. مساحة مهنية تساعدك على فهم الخلاف، وترتيب ما يهمّك، واستكشاف الطريق إلى التفاهم.</p>
          <div className="hero-actions"><Link href="/journey" className="button button-gold">ابدأ رحلة الصلح <ArrowLeft size={19}/></Link><a href="#approach" className="hero-learn">تعرّف على صالِحنا <span><ArrowDownLeft size={15}/></span></a></div>
          <div className="hero-note"><ShieldCheck size={16}/><span>تبدأ بخطوة واعية، دون مشاركة تلقائية مع الآخرين</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-frame"><img src="/manus-storage/async-images/HbtKLMl2HKAR5Z0TxHughI/image-1.webp" alt=""/><div className="frame-corner top"></div><div className="frame-corner bottom"></div></div>
          <div className="visual-caption"><span className="caption-mark">✦</span><div><strong>لأن الصلح خير</strong><small>ولأن لكل حكاية أكثر من وجه</small></div></div>
          <div className="visual-index">SALIHNA <span> / </span> THE ART OF UNDERSTANDING</div>
        </div>
      </div>
      <div className="hero-bottom shell"><span>نحو مساحة أرحب للتفاهم</span><span className="hero-line"></span><span>01 — 04</span></div>
    </section>

    <section className="principles-strip"><div className="shell strip-inner"><div className="strip-intro"><span className="gold-dot"></span> في كل خطوة، نضع الإنسان أولاً.</div><div><ShieldCheck size={19}/><span>خصوصية تراعي حساسية الخلاف</span></div><div><Compass size={19}/><span>أسئلة تناسب كل سياق</span></div><div><GitMerge size={19}/><span>الحلول تبدأ بالفهم</span></div></div></section>

    <section id="paths" className="paths-section section-padding">
      <div className="shell">
        <div className="section-heading"><div><div className="section-kicker"><span>01</span> مسارات الإصلاح</div><h2>كل خلافٍ مختلف.<br/><em>والبداية تصنع الفرق.</em></h2></div><div className="heading-side"><p>اختر المسار الأقرب إلى طبيعة خلافك؛ لنطرح عليك ما يناسبه من أسئلة، خطوة بخطوة.</p><Link href="/journey" className="text-link">استكشف كل المسارات <ArrowLeft size={17}/></Link></div></div>
        <div className="track-grid">{tracks.map(({id,number,icon:Icon,title,description,label}) => <Link key={id} href={`/journey?kind=${id}`} className="track-card"><div className="track-top"><span className="track-icon"><Icon size={22} strokeWidth={1.45}/></span><span className="track-number">{number}</span></div><div className="track-body"><span className="track-label">{label}</span><h3>{title}</h3><p>{description}</p></div><div className="track-bottom"><span>ابدأ هذا المسار</span><ArrowUpLeft size={17}/></div></Link>)}</div>
        <div className="paths-bottom">لا تجد ما يصف حالتك تمامًا؟ <Link href="/journey">ابدأ بالأقرب، ويمكنك التوضيح لاحقًا <ArrowLeft size={15}/></Link></div>
      </div>
    </section>

    <section id="approach" className="approach-section section-padding">
      <div className="shell approach-layout">
        <div className="approach-copy"><div className="section-kicker light"><span>02</span> فلسفتنا في الإصلاح</div><h2>نبدأ بالإنسان،<br/><em>قبل الخلاف.</em></h2><p>خلف كل موقف قصة، وخلف كل مطلب احتياج. لهذا صممنا تجربة تعينك على ترتيب أفكارك، دون أن تحكم على طرف أو تفرض حلاً.</p><Link href="/journey" className="button button-outline-light">اكتشف رحلتك <ArrowLeft size={18}/></Link><div className="approach-art"><span></span><span></span><span></span></div></div>
        <div className="approach-steps"><div><span className="step-number">01</span><div><h3>نفهم السياق</h3><p>أسئلة مختصرة تتكيّف مع طبيعة المسألة، من العلاقة والأطراف إلى الوقائع كما ترويها.</p></div><Compass size={23}/></div><div><span className="step-number">02</span><div><h3>نرتّب ما يهمّك</h3><p>نفصل بين ما حدث، وما تطمح إليه، وما يمكن أن يكون مساحة مشتركة للنقاش.</p></div><Layers3 size={23}/></div><div><span className="step-number">03</span><div><h3>نترك لك القرار</h3><p>تراجع ما كتبته وتختار خطوتك التالية. لا يُتواصل مع أي طرف نيابة عنك.</p></div><GitMerge size={23}/></div></div>
      </div>
    </section>

    <section className="dialogue-section section-padding"><div className="shell dialogue-layout"><div className="dialogue-panel"><div className="panel-head"><span><MessageCircle size={18}/> مساحة للحوار</span><span>أداة عملية</span></div><div className="quote-mark">“</div><p>أود أن نتحدث بهدوء عن الموضوع، وأن نفهم ما يهمّ كلًّا منا قبل أن نبحث عن حل.</p><div className="panel-foot"><span></span><span></span><span></span></div></div><div className="dialogue-copy"><div className="section-kicker"><span>03</span> أدوات تقرّب المسافات</div><h2>الكلمات الأولى<br/><em>تفتح أبوابًا جديدة.</em></h2><p>قد تكون بداية الحديث أصعب خطوة. أداة صياغة الحوار تساعدك على التعبير عما يهمّك بلغة هادئة، ثم تترك لك تعديلها كما تشاء.</p><Link href="/dialogue" className="button button-dark">جرّب أداة الحوار <ArrowLeft size={18}/></Link><small>تعمل أداة الحوار على جهازك، ولا ترسل ما تكتبه إلى أطراف أخرى.</small><div className="assistant-callout"><Sparkles size={18}/><div><strong>هل تودّ ترتيب أفكارك بمساعدة ذكية؟</strong><span>مساعد اختياري لتنظيم ما تكتبه، بموافقتك ومراجعتك.</span></div><Link href="/assistant" aria-label="افتح المساعد الذكي"><ArrowLeft size={18}/></Link></div></div></div></section>

    <section id="business" className="business-section"><div className="shell business-inner"><div className="business-symbol"><Building2 size={35} strokeWidth={1.2}/></div><div><div className="section-kicker"><span>04</span> للأعمال والمؤسسات</div><h2>عندما تحمي مساحة التفاهم<br/><em>استمرارية العمل.</em></h2><p>من الشراكات إلى بيئات العمل، لكل علاقة مهنية تفاصيلها. ابدأ بتحديد السياق والمصالح والالتزامات التي ينبغي مراعاتها.</p><Link href="/journey?kind=business" className="text-link">ابدأ المسار التجاري <ArrowLeft size={17}/></Link></div><div className="business-detail"><span>مسار مدروس</span><strong>علاقات أكثر وضوحًا.<br/>قرارات أكثر وعيًا.</strong><div className="detail-line"></div><small>تجربة تراعي طبيعة الخلاف المهني.</small></div></div></section>

    <section className="closing-section"><div className="shell closing-inner"><div><div className="section-kicker light"><span>خطوة نحو التفاهم</span></div><h2>قد تبدأ المسافة الأقرب<br/><em>بخطوة واحدة.</em></h2><p>ابدأ بما تعرفه الآن. يمكنك مراجعة ما كتبته قبل حفظه.</p></div><Link href="/journey" className="button button-gold">ابدأ رحلة الصلح <ArrowLeft size={18}/></Link></div></section>

    <footer className="site-footer"><div className="shell footer-grid"><div className="footer-brand"><Brand/><p>مساحة مهنية لفهم الخلاف، وتقريب وجهات النظر، واستكشاف فرص التفاهم.</p><span>لأن الصلح خير</span></div><div><h4>اكتشف صالِحنا</h4><a href="/#paths">مسارات الإصلاح</a><a href="/#approach">منهجيتنا</a><Link href="/dialogue">أداة الحوار</Link><Link href="/trust">الثقة والسلامة</Link></div><div><h4>ابدأ من هنا</h4><Link href="/journey">رحلة الصلح</Link><Link href="/cases">ملفاتي</Link><a href="/#business">الأعمال والمؤسسات</a></div><div className="footer-notice"><ShieldCheck size={21}/><h4>سلامتك أولاً</h4><p>إذا وُجد خطر فوري أو تهديد، تواصل مع الطوارئ أو جهة حماية مختصة في بلدك. قد لا تكون الوساطة مناسبة لكل حالة.</p></div></div><div className="shell footer-bottom"><span>© صالِحنا — لأن الصلح خير</span><span>صالِحنا ليست جهة قضائية، ولا تضمن الوصول إلى اتفاق.</span></div></footer>
  </main>;
}

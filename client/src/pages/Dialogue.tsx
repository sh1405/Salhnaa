import { useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Copy,
  Leaf,
  LockKeyhole,
  MessageCircle,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import "./Dialogue.css";

const fieldLimit = 160;

type CopyStatus = "idle" | "success" | "error";

export default function Dialogue() {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [possibility, setPossibility] = useState("");
  const [draft, setDraft] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [formError, setFormError] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTopic = topic.trim();
    const cleanGoal = goal.trim();
    const cleanPossibility = possibility.trim();
    if (!cleanTopic || !cleanGoal || !cleanPossibility) {
      setFormError("يرجى كتابة إجابة مختصرة في كل حقل.");
      return;
    }

    setFormError("");
    setDraft(
      `أودّ أن نتحدث بشأن «${cleanTopic}».\n\nيهمّني أن نصل إلى «${cleanGoal}»، وأودّ أن أستمع إلى وجهة نظرك أيضًا.\n\nهل يمكننا أن نبحث معًا «${cleanPossibility}»؟ لعلّنا نجد خطوة مناسبة للطرفين.`
    );
    setHasDraft(true);
    setCopyStatus("idle");
  }

  function restart() {
    setTopic("");
    setGoal("");
    setPossibility("");
    setDraft("");
    setHasDraft(false);
    setCopyStatus("idle");
    setFormError("");
  }

  async function copyDraft() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(draft);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
      draftRef.current?.focus();
      draftRef.current?.select();
    }
  }

  return (
    <div className="dialogue-page" dir="rtl" lang="ar">
      <main>
        <section className="dialogue-intro">
          <div className="dialogue-wrap">
            <nav className="dialogue-breadcrumb" aria-label="مسار الصفحة">
              <Link href="/journey">الرحلة</Link>
              <ChevronLeft size={14} aria-hidden="true" />
              <span aria-current="page">أداة الحوار</span>
            </nav>

            <div className="dialogue-intro-layout">
              <div className="dialogue-intro-copy">
                <p className="dialogue-eyebrow"><span /> مساحة للتفاهم</p>
                <h1>بداية أهدأ،<br /><em>لحوار أقرب.</em></h1>
                <p className="dialogue-intro-description">
                  أحيانًا تصنع الكلمات الأولى فرقًا. رتّب ما تودّ قوله في صياغة
                  هادئة تمنح الطرف الآخر مساحة للاستماع والمشاركة.
                </p>
                <a className="dialogue-intro-link" href="#dialogue-tool">
                  ابدأ صياغة الحوار <ArrowLeft size={17} aria-hidden="true" />
                </a>
              </div>
              <div className="dialogue-intro-aside" aria-hidden="true">
                <div className="dialogue-intro-mark"><MessageCircle size={29} strokeWidth={1.2} /></div>
                <span className="dialogue-intro-line" />
                <p>ليس المطلوب أن نتفق من البداية،<br />بل أن نترك مساحة للفهم.</p>
                <span className="dialogue-intro-aside-label">خطوة صغيرة نحو التفاهم</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dialogue-workspace dialogue-wrap" id="dialogue-tool" aria-labelledby="dialogue-workspace-title">
          <div className="dialogue-section-heading">
            <div>
              <p className="dialogue-eyebrow"><span /> لنبدأ من هنا</p>
              <h2 id="dialogue-workspace-title">رتّب أفكارك، بكلماتك</h2>
              <p>ثلاث إجابات قصيرة تساعدك على إعداد بداية مناسبة للحوار.</p>
            </div>
            <div className="dialogue-privacy"><LockKeyhole size={15} aria-hidden="true" /> خاص بك وعلى جهازك</div>
          </div>

          <div className="dialogue-grid">
            <form className="dialogue-form-card" onSubmit={createDraft}>
              <div className="dialogue-card-header">
                <div className="dialogue-card-heading">
                  <span className="dialogue-card-icon"><PenLine size={19} aria-hidden="true" /></span>
                  <div><span className="dialogue-step">الخطوة الأولى</span><h3>أخبرنا بما يشغلك</h3></div>
                </div>
                <span className="dialogue-card-number">01</span>
              </div>
              <p className="dialogue-form-intro">اكتب باختصار؛ لا تحتاج إلى سرد التفاصيل.</p>

              <div className="dialogue-fields">
                <div className="dialogue-field">
                  <label htmlFor="dialogue-topic"><span>١</span> ما الموضوع الذي ترغب في مناقشته؟</label>
                  <input id="dialogue-topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={fieldLimit} placeholder="مثال: تقسيم المسؤوليات" required />
                </div>
                <div className="dialogue-field">
                  <label htmlFor="dialogue-goal"><span>٢</span> ما الذي يهمك الوصول إليه؟</label>
                  <input id="dialogue-goal" value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={fieldLimit} placeholder="مثال: وضوح أكبر بيننا" required />
                </div>
                <div className="dialogue-field">
                  <label htmlFor="dialogue-possibility"><span>٣</span> ما المساحة التي يمكن بحثها مع الطرف الآخر؟</label>
                  <input id="dialogue-possibility" value={possibility} onChange={(event) => setPossibility(event.target.value)} maxLength={fieldLimit} placeholder="مثال: طريقة مناسبة لتوزيع المهام" required />
                </div>
              </div>

              {formError && <p className="dialogue-form-error" role="alert">{formError}</p>}
              <div className="dialogue-form-actions">
                <button className="dialogue-primary-button" type="submit">
                  أنشئ صياغة للحوار <ArrowLeft size={17} aria-hidden="true" />
                </button>
                <button className="dialogue-reset-button" type="button" onClick={restart}>
                  <RotateCcw size={16} aria-hidden="true" /> إعادة البدء
                </button>
              </div>
            </form>

            <div className="dialogue-result-card">
              <div className="dialogue-card-header">
                <div className="dialogue-card-heading">
                  <span className="dialogue-card-icon dialogue-card-icon-gold"><MessageCircle size={19} aria-hidden="true" /></span>
                  <div><span className="dialogue-step">الخطوة الثانية</span><h3>صياغتك المقترحة</h3></div>
                </div>
                <span className="dialogue-card-number">02</span>
              </div>
              <p className="dialogue-result-intro">نقطة بداية يمكنك تعديلها لتشبهك أكثر.</p>

              {hasDraft ? (
                <div className="dialogue-draft-wrap">
                  <label htmlFor="dialogue-draft">نص الحوار <span>قابل للتعديل</span></label>
                  <textarea
                    id="dialogue-draft"
                    ref={draftRef}
                    value={draft}
                    onChange={(event) => { setDraft(event.target.value); setCopyStatus("idle"); }}
                    rows={9}
                  />
                </div>
              ) : (
                <div className="dialogue-empty-state">
                  <div className="dialogue-empty-icon"><Sparkles size={22} strokeWidth={1.4} aria-hidden="true" /></div>
                  <h4>ستظهر صياغتك هنا</h4>
                  <p>أجب عن الأسئلة، ثم أنشئ نصًا يمكنك مراجعته وتعديله.</p>
                </div>
              )}

              <div className="dialogue-result-actions">
                <button type="button" className="dialogue-copy-button" onClick={copyDraft} disabled={!hasDraft || !draft.trim()}>
                  {copyStatus === "success" ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                  {copyStatus === "success" ? "تم النسخ" : "نسخ الصياغة"}
                </button>
                <p className="dialogue-copy-status" role="status" aria-live="polite">
                  {copyStatus === "success" && "نُسخت الصياغة إلى الحافظة."}
                  {copyStatus === "error" && "تعذّر النسخ تلقائيًا. حدّد النص وانسخه يدويًا."}
                </p>
              </div>
              <div className="dialogue-template-note"><Leaf size={16} aria-hidden="true" /> صياغة بالقوالب، وليست خدمة ذكاء اصطناعي.</div>
            </div>
          </div>

          <div className="dialogue-safety">
            <span className="dialogue-safety-icon"><ShieldCheck size={21} aria-hidden="true" /></span>
            <div>
              <h3>سلامتك أولًا، والاحترام أساس الحوار</h3>
              <p>إذا كان هناك تهديد أو خطر، قدّم سلامتك واطلب دعمًا مناسبًا قبل بدء الحوار. وعند الحديث، عبّر عن احتياجاتك وتجنّب الاتهامات وإلقاء اللوم.</p>
            </div>
          </div>
          <p className="dialogue-local-note"><LockKeyhole size={14} aria-hidden="true" /> تُستخدم إجاباتك على جهازك فقط؛ لا تُحفظ ولا تُرسل إلى الخادم.</p>
        </section>

        <section className="dialogue-next">
          <div className="dialogue-wrap dialogue-next-inner">
            <div><span>خطوة أخرى في طريق التفاهم</span><h2>هل تودّ النظر إلى الصورة كاملة؟</h2><p>ابدأ الرحلة للتفكير في الخطوة التالية المناسبة لك.</p></div>
            <Link href="/journey" className="dialogue-next-link">ابدأ الرحلة <ArrowLeft size={17} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

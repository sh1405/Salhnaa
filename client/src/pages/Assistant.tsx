import { useEffect, useRef, useState, type FormEvent } from "react";
import { TRPCClientError } from "@trpc/client";
import { Link } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Copy,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  PenLine,
  RotateCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import "./Assistant.css";

const TEXT_LIMIT = 1500;

type CopyStatus = "idle" | "success" | "error";

function errorMessage(error: unknown) {
  const code = error instanceof TRPCClientError ? error.data?.code : undefined;
  if (code === "TOO_MANY_REQUESTS") return "وصلت إلى حد الاستخدام المؤقت. حاول مجددًا بعد بضع دقائق.";
  if (code === "UNAUTHORIZED") return "انتهت جلسة تسجيل الدخول. سجّل الدخول مجددًا ثم حاول مرة أخرى.";
  return "تعذّر تنظيم النص الآن. تحقق من اتصالك وحاول مرة أخرى لاحقًا.";
}

export default function Assistant() {
  const { user, isAuthenticated, loading: authLoading, error: authError, refresh } = useAuth();
  const organize = trpc.assistant.organize.useMutation();
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);
  const requestSequence = useRef(0);
  const previousUserId = useRef(user?.id ?? null);
  const [formOwnerId, setFormOwnerId] = useState(user?.id ?? null);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (previousUserId.current !== userId) {
      // Do not carry an entered text or an in-flight result into another account.
      previousUserId.current = userId;
      requestSequence.current += 1;
      setText("");
      setConsent(false);
      setDraft(null);
      setFormError("");
      setCopyStatus("idle");
      setFormOwnerId(userId);
    }
  }, [user?.id]);

  function handleLogin() {
    setLoginError(false);
    try {
      startLogin();
    } catch {
      setLoginError(true);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || organize.isPending) return;
    const cleanText = text.trim();
    if (cleanText.length < 10 || cleanText.length > TEXT_LIMIT) {
      setFormError("اكتب نصًا يتراوح بين ١٠ و١٥٠٠ حرف بعد حذف المسافات الزائدة.");
      return;
    }
    if (!consent) {
      setFormError("يرجى الموافقة على إرسال النص إلى خدمة النموذج أولًا.");
      return;
    }
    setFormError("");
    setDraft(null);
    setCopyStatus("idle");
    submitting.current = true;
    const sequence = ++requestSequence.current;
    try {
      const response = await organize.mutateAsync({ text: cleanText, consent: true });
      if (sequence === requestSequence.current) setDraft(response.result);
    } catch (error) {
      if (sequence === requestSequence.current) setFormError(errorMessage(error));
    } finally {
      submitting.current = false;
    }
  }

  async function copyDraft() {
    if (!draft?.trim()) return;
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
    <main className="assistant-page" dir="rtl" lang="ar">
      <section className="assistant-hero">
        <div className="assistant-wrap">
          <nav className="assistant-breadcrumb" aria-label="مسار الصفحة">
            <Link href="/">الرئيسية</Link>
            <ChevronLeft size={14} aria-hidden="true" />
            <span aria-current="page">مساعد الصياغة</span>
          </nav>
          <div className="assistant-hero-grid">
            <div>
              <p className="assistant-kicker"><span /> مساحة لترتيب الأفكار</p>
              <h1>لنمنح الكلمات<br /><em>مساحة أهدأ.</em></h1>
              <p className="assistant-hero-copy">
                اكتب ما تودّ تنظيمه، وسيساعدك نموذج ذكاء اصطناعي على إعداد مسودة
                تفصل بين ما وصفته وتفسيرك وما قد يستحق السؤال.
              </p>
              <a className="assistant-hero-link" href="#assistant-workspace">
                ابدأ من هنا <ArrowLeft size={17} aria-hidden="true" />
              </a>
            </div>
            <aside className="assistant-hero-aside" aria-label="دور المساعد">
              <Sparkles size={27} strokeWidth={1.3} aria-hidden="true" />
              <span className="assistant-aside-line" />
              <p>صياغة تساعدك على التفكير،<br />والكلمة الأخيرة لك.</p>
              <small>مسودة تحت مراجعتك</small>
            </aside>
          </div>
        </div>
      </section>

      <section className="assistant-wrap assistant-workspace" id="assistant-workspace" aria-labelledby="assistant-workspace-title">
        <div className="assistant-section-heading">
          <div>
            <p className="assistant-kicker"><span /> خطوة بخطوة</p>
            <h2 id="assistant-workspace-title">رتّب ما تودّ قوله</h2>
            <p>اكتب باختصار، ثم راجع المسودة وعدّلها كما تشاء.</p>
          </div>
          <span className="assistant-label"><Sparkles size={15} aria-hidden="true" /> بمساعدة الذكاء الاصطناعي</span>
        </div>

        <div className="assistant-emergency" role="note">
          <span className="assistant-emergency-icon"><TriangleAlert size={19} aria-hidden="true" /></span>
          <div>
            <h3>في حالات الخطر أو الطوارئ</h3>
            <p>إذا كنت في خطر مباشر، انتقل إلى مكان آمن إن أمكن واتصل بخدمات الطوارئ المحلية أو بشخص موثوق. هذه الأداة لا تستجيب للطوارئ ولا تحلّ محل الدعم البشري.</p>
          </div>
        </div>

        {authLoading || (isAuthenticated && formOwnerId !== user?.id) ? (
          <div className="assistant-auth-state" role="status">
            <LoaderCircle className="assistant-spinner" size={27} aria-hidden="true" />
            <h3>جارٍ التحقق من حسابك</h3>
            <p>لحظة واحدة من فضلك.</p>
          </div>
        ) : !isAuthenticated && authError ? (
          <div className="assistant-auth-state" role="alert">
            <TriangleAlert size={25} aria-hidden="true" />
            <h3>تعذّر التحقق من الحساب</h3>
            <p>تحقق من اتصالك وحاول مرة أخرى.</p>
            <button className="assistant-button assistant-button-outline" type="button" onClick={() => void refresh()}>
              <RotateCw size={16} aria-hidden="true" /> إعادة المحاولة
            </button>
          </div>
        ) : !isAuthenticated ? (
          <div className="assistant-auth-state">
            <span className="assistant-auth-icon"><LockKeyhole size={24} aria-hidden="true" /></span>
            <p className="assistant-auth-overline">خطوة قبل البدء</p>
            <h3>سجّل الدخول لاستخدام المساعد</h3>
            <p>بعد تسجيل الدخول، عُد إلى صفحة المساعد لكتابة نص وتنظيمه بعد الموافقة على إرساله.</p>
            <button className="assistant-button assistant-button-primary" type="button" onClick={handleLogin}>
              تسجيل الدخول <ArrowLeft size={17} aria-hidden="true" />
            </button>
            {loginError && <p className="assistant-error" role="alert">تعذّر بدء تسجيل الدخول. يرجى المحاولة لاحقًا.</p>}
          </div>
        ) : (
          <div className="assistant-grid">
            <form className="assistant-card assistant-form-card" onSubmit={handleSubmit} noValidate>
              <div className="assistant-card-heading">
                <span className="assistant-card-icon"><PenLine size={19} aria-hidden="true" /></span>
                <div><small>الخطوة الأولى</small><h3>النص الذي تودّ تنظيمه</h3></div>
                <span className="assistant-card-number" aria-hidden="true">01</span>
              </div>
              <p className="assistant-card-copy">شارك القدر الذي تختاره فقط؛ لا نستخدم بياناتك المحفوظة مسبقًا.</p>

              <label className="assistant-field-label" htmlFor="assistant-input">اكتب وصفًا مختصرًا</label>
              <textarea
                id="assistant-input"
                className="assistant-input"
                value={text}
                onChange={event => { setText(event.target.value); setFormError(""); }}
                required
                minLength={10}
                maxLength={TEXT_LIMIT}
                rows={7}
                disabled={organize.isPending}
                placeholder="مثال افتراضي: أرى أننا نختلف حول توزيع المهام، وأتساءل كيف نناقش الأمر بهدوء."
                aria-describedby="assistant-input-help assistant-count"
              />
              <div className="assistant-input-meta">
                <span id="assistant-input-help">١٠ أحرف على الأقل</span>
                <span id="assistant-count" dir="ltr">{text.length} / {TEXT_LIMIT}</span>
              </div>

              <div className="assistant-disclosure" id="assistant-disclosure">
                <div className="assistant-disclosure-title"><LockKeyhole size={16} aria-hidden="true" /> قبل الإرسال</div>
                <p>سيُرسل النص الذي تكتبه إلى خدمة نموذج ذكاء اصطناعي لمعالجته. لا تدخل أسماء أو أرقام هوية أو بيانات شديدة الحساسية.</p>
                <p>المخرجات مسودة للمراجعة، وليست قرارًا أو مشورة. لم يتم التحقق من صحة روايتك، وقد يخطئ النموذج. لا يحلّ محل إنسان أو خبير مؤهل.</p>
              </div>
              <label className="assistant-consent">
                <input type="checkbox" required checked={consent} onChange={event => { setConsent(event.target.checked); setFormError(""); }} disabled={organize.isPending} aria-describedby="assistant-disclosure" />
                <span>أوافق على إرسال النص إلى خدمة نموذج الذكاء الاصطناعي لمعالجته.</span>
              </label>
              {formError && <p className="assistant-error" role="alert">{formError}</p>}
              <button className="assistant-button assistant-button-primary assistant-submit" type="submit" disabled={organize.isPending}>
                {organize.isPending ? <><LoaderCircle className="assistant-spinner" size={17} aria-hidden="true" /> جارٍ تنظيم النص...</> : <>تنظيم النص <ArrowLeft size={17} aria-hidden="true" /></>}
              </button>
              {organize.isPending && <p className="assistant-pending" role="status">قد تستغرق الاستجابة بعض الوقت. يرجى الانتظار.</p>}
            </form>

            <section className="assistant-card assistant-result-card" aria-labelledby="assistant-result-title" aria-busy={organize.isPending}>
              <div className="assistant-card-heading">
                <span className="assistant-card-icon assistant-card-icon-gold"><MessageSquareText size={19} aria-hidden="true" /></span>
                <div><small>الخطوة الثانية</small><h3 id="assistant-result-title">مسودتك المقترحة</h3></div>
                <span className="assistant-card-number" aria-hidden="true">02</span>
              </div>
              <p className="assistant-card-copy">اقرأها بعناية، وصحّح ما لا يعبّر عنك قبل استخدامها.</p>
              {draft !== null ? (
                <div className="assistant-draft-wrap">
                  <label className="assistant-field-label" htmlFor="assistant-draft">المسودة <span>قابلة للتعديل</span></label>
                  <textarea id="assistant-draft" ref={draftRef} value={draft} onChange={event => { setDraft(event.target.value); setCopyStatus("idle"); }} rows={12} />
                </div>
              ) : (
                <div className="assistant-empty">
                  <span><FileText size={23} strokeWidth={1.4} aria-hidden="true" /></span>
                  <h4>{organize.isPending ? "نعمل على ترتيب النص" : "ستظهر المسودة هنا"}</h4>
                  <p>{organize.isPending ? "لحظة من فضلك، ثم راجع النتيجة بعناية." : "أدخل نصك ووافق على الإرسال، ثم نظّمه لتراجعه وتعدّله."}</p>
                </div>
              )}
              <button className="assistant-button assistant-button-outline assistant-copy" type="button" onClick={() => void copyDraft()} disabled={!draft?.trim()}>
                {copyStatus === "success" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copyStatus === "success" ? "تم النسخ" : "نسخ المسودة"}
              </button>
              <p className="assistant-copy-status" role="status" aria-live="polite">
                {copyStatus === "success" && "نُسخت المسودة إلى الحافظة."}
                {copyStatus === "error" && "تعذّر النسخ تلقائيًا؛ حدّد النص وانسخه يدويًا."}
              </p>
              <p className="assistant-result-note">تعكس المسودة النص وقت إرساله، وقد تحتوي على أخطاء أو نقص. راجعها بنفسك قبل مشاركتها.</p>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

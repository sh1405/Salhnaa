import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { safeReturnPath, startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import "./AuthPage.css";

type Mode = "login" | "register";

function errorText(error: unknown, mode: Mode): string {
  if (error instanceof TRPCClientError) {
    if (error.data?.code === "CONFLICT") return "هذا البريد مرتبط بحساب موجود. جرّب الدخول أو استخدم طريقة الدخول السابقة لذلك الحساب.";
    if (error.data?.code === "UNAUTHORIZED") return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (error.data?.code === "BAD_REQUEST") return error.message;
  }
  return mode === "register"
    ? "تعذّر إنشاء الحساب الآن. تأكد من الاتصال ثم حاول مرة أخرى."
    : "تعذّر تسجيل الدخول الآن. حاول مرة أخرى بعد قليل.";
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const register = trpc.auth.emailRegister.useMutation();
  const login = trpc.auth.emailLogin.useMutation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [providerError, setProviderError] = useState(false);
  const destination = useMemo(() => {
    const next = new URLSearchParams(window.location.search).get("next") ?? "/journey";
    return safeReturnPath(next);
  }, []);
  const pending = register.isPending || login.isPending;

  useEffect(() => {
    if (me.data) setLocation(destination);
  }, [destination, me.data, setLocation]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setProviderError(false);
    if (mode === "register" && password !== confirmation) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    try {
      if (mode === "register") {
        await register.mutateAsync({ name: name.trim(), email: email.trim(), password });
      } else {
        await login.mutateAsync({ email: email.trim(), password });
      }
      await utils.auth.me.invalidate();
      setLocation(destination);
    } catch (requestError) {
      setError(errorText(requestError, mode));
    }
  }

  function continueWithPreviousAccount() {
    setProviderError(false);
    try {
      startLogin(destination);
    } catch {
      setProviderError(true);
    }
  }

  return (
    <main className="auth-page" dir="rtl" lang="ar">
      <div className="auth-page__frame">
        <section className="auth-story" aria-label="عن حساب صالِحنا">
          <Link href="/" className="auth-story__home">صالِحنا <ArrowLeft size={15} aria-hidden="true" /></Link>
          <div className="auth-story__mark" aria-hidden="true"><span /><span /><i /></div>
          <span className="auth-story__eyebrow"><Sparkles size={14} /> خطوة آمنة نحو تفاهم أوضح</span>
          <h1>{mode === "register" ? <>أنشئ مساحتك<br /><em>للحوار المنصف</em></> : <>كل بداية هادئة<br /><em>تبدأ بالإنصات</em></>}</h1>
          <p>احفظ ملفك بأمان، وتابع رحلتك حين تكون مستعدًا. القرار لك في كل خطوة.</p>
          <div className="auth-story__promise"><ShieldCheck size={17} /><span>ملفاتك مرتبطة بحسابك ولا يطّلع عليها مستخدم آخر.</span></div>
          <div className="auth-story__footer"><span>صالِحنا</span><span>مساحة للصلح، لا للحكم</span></div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card__topline"><span>حسابك في صالِحنا</span><span className="auth-card__secure"><LockKeyhole size={13} /> اتصال آمن</span></div>
          <h2 id="auth-title">{mode === "register" ? "إنشاء حساب جديد" : "مرحبًا بعودتك"}</h2>
          <p className="auth-card__intro">{mode === "register" ? "أنشئ حسابًا ببريدك الإلكتروني لتبدأ رحلتك." : "سجّل الدخول ببريدك الإلكتروني لمتابعة ملفاتك."}</p>

          <div className="auth-tabs" role="tablist" aria-label="نوع الحساب">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>تسجيل الدخول</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>حساب جديد</button>
          </div>

          <form className="auth-form" onSubmit={event => void submit(event)}>
            {mode === "register" && <div className="auth-field">
              <label htmlFor="auth-name">الاسم</label>
              <div className="auth-input-wrap"><UserRound size={17} aria-hidden="true" /><input id="auth-name" name="name" type="text" autoComplete="name" maxLength={80} minLength={2} value={name} onChange={event => setName(event.target.value)} placeholder="الاسم الذي تفضّل أن نناديك به" required /></div>
            </div>}
            <div className="auth-field">
              <label htmlFor="auth-email">البريد الإلكتروني</label>
              <div className="auth-input-wrap"><Mail size={17} aria-hidden="true" /><input id="auth-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={320} value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" required /></div>
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">كلمة المرور</label>
              <div className="auth-input-wrap"><KeyRound size={17} aria-hidden="true" /><input id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "register" ? "12 حرفًا على الأقل" : "أدخل كلمة المرور"} required /><button className="auth-password-toggle" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              {mode === "register" && <small>استخدم كلمة مرور لا تقل عن 12 حرفًا، ويفضل أن تكون فريدة.</small>}
            </div>
            {mode === "register" && <div className="auth-field">
              <label htmlFor="auth-confirm">تأكيد كلمة المرور</label>
              <div className="auth-input-wrap"><LockKeyhole size={17} aria-hidden="true" /><input id="auth-confirm" name="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="أعد كتابة كلمة المرور" required /></div>
            </div>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? <><span className="auth-spinner" aria-hidden="true" /> جارٍ التحقق...</> : <>{mode === "register" ? "إنشاء حساب والبدء" : "تسجيل الدخول"}<ArrowLeft size={17} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>أو</span></div>
          <button className="auth-provider" type="button" onClick={continueWithPreviousAccount}>الدخول بحساب Manus السابق</button>
          {providerError && <p className="auth-error" role="alert">تعذّر بدء الدخول السابق. حاول مرة أخرى أو استخدم البريد وكلمة المرور.</p>}
          <p className="auth-notice"><ShieldCheck size={15} /> لا تُرسل المنصة رسالة تحقق أو استعادة كلمة مرور حاليًا. استخدم بريدًا يمكنك الوصول إليه واحفظ كلمة مرورك.</p>
          <p className="auth-terms">بالمتابعة، أنت مسؤول عن حماية بيانات دخولك. <Link href="/trust">اقرأ مبادئ الثقة والسلامة</Link>.</p>
          <div className="auth-card__home"><Link href="/">العودة إلى الصفحة الرئيسية</Link></div>
          <span className="auth-card__return" aria-hidden="true">بعد الدخول ستعود تلقائيًا إلى الصفحة التي طلبتها.</span>
        </section>
      </div>
    </main>
  );
}

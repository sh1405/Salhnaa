import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Bell, Check, Clipboard, Clock3, LoaderCircle, LockKeyhole, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import "./Invitations.css";

const statusLabels: Record<string, string> = {
  pending_delivery: "بانتظار الإيصال",
  delivered_inbox: "وصلت إلى صندوق الوارد",
  opened: "فُتحت",
  responded: "تم الرد",
  cancelled: "أُلغيت",
  expired: "انتهت صلاحيتها",
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function Invitations() {
  const [isPublicInvite, publicParams] = useRoute("/invite/:code");
  const code = isPublicInvite ? publicParams?.code ?? "" : "";
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [invitePhone, setInvitePhone] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [saveConsent, setSaveConsent] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [createdInvite, setCreatedInvite] = useState<{ status: string; code?: string } | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const casesQuery = trpc.cases.list.useQuery(undefined, { enabled: isAuthenticated && !loading && !isPublicInvite });
  const myPhoneQuery = trpc.invitations.myPhone.useQuery(undefined, { enabled: isAuthenticated && !loading && !isPublicInvite });
  const inboxQuery = trpc.invitations.inbox.useQuery(undefined, { enabled: isAuthenticated && !loading && !isPublicInvite });
  const sentQuery = trpc.invitations.sent.useQuery(undefined, { enabled: isAuthenticated && !loading && !isPublicInvite });
  const previewQuery = trpc.invitations.preview.useQuery({ code }, { enabled: !!code });
  const createMutation = trpc.invitations.create.useMutation();
  const savePhoneMutation = trpc.invitations.savePhone.useMutation();
  const openMutation = trpc.invitations.open.useMutation();
  const respondMutation = trpc.invitations.respond.useMutation();

  const selectedCase = useMemo(() => casesQuery.data?.find(item => String(item.id) === caseId), [casesQuery.data, caseId]);

  useEffect(() => {
    if (myPhoneQuery.data?.phone && !accountPhone) setAccountPhone(myPhoneQuery.data.phone);
  }, [myPhoneQuery.data?.phone, accountPhone]);

  async function submitPhone(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    if (!saveConsent) {
      setErrorMessage("يرجى الموافقة على استخدام الرقم لمطابقة دعوات صالِحنا.");
      return;
    }
    try {
      await savePhoneMutation.mutateAsync({ phone: accountPhone });
      await myPhoneQuery.refetch();
      setSaveConsent(false);
      setShareMessage("حُفظ رقمك للمطابقة مع دعوات صالِحنا. لم يُرسل إليه رمز تحقق.");
    } catch {
      setErrorMessage("تعذّر حفظ الرقم. تحقق من صيغته أو من عدم ربطه بحساب آخر.");
    }
  }

  async function submitInvitation(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    setShareMessage("");
    setCreatedInvite(null);
    if (!selectedCase || selectedCase.safety !== "safe" || selectedCase.status !== "draft") {
      setErrorMessage("لا يمكن إرسال دعوة من ملف غير آمن أو متوقف.");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({ caseId: selectedCase.id, phone: invitePhone });
      setCreatedInvite(result);
      setInvitePhone("");
      if (result.status === "delivered_inbox") {
        setShareMessage("أُضيفت الدعوة إلى صندوق وارد الحساب المرتبط بالرقم. لم يُرسل إشعار خارجي ولم يُشارك محتوى الملف.");
        await Promise.all([utils.invitations.sent.invalidate(), utils.invitations.inbox.invalidate()]);
      } else {
        setShareMessage("أنشأ النظام رابطًا آمنًا، لكنه لم يرسله. استخدم «مشاركة الرابط» لإيصاله عبر التطبيق الذي تختاره.");
        await utils.invitations.sent.invalidate();
      }
    } catch {
      setErrorMessage("تعذّر إنشاء الدعوة. تحقق من الرقم والملف وحاول مرة أخرى.");
    }
  }

  async function shareCreated() {
    if (!createdInvite?.code) return;
    const url = new URL(`/invite/${createdInvite.code}`, window.location.origin).toString();
    const text = "أرسل إليك أحد أعضاء (صالِحنا) دعوة صلح خاصة. يمكنك الاطلاع عليها واختيار الرد المناسب.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "دعوة صلح من صالِحنا", text, url });
        setShareMessage("انتهت واجهة المشاركة. لا يمكن للمنصة تأكيد أن الدعوة أُرسلت أو وصلت.");
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setShareMessage("نُسخ الرابط والنص. لم يُرسل شيء؛ الصقه في القناة التي تختارها.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareMessage("أُلغيت المشاركة؛ ما زالت الدعوة بانتظار الإيصال.");
      } else {
        setErrorMessage("تعذّرت المشاركة أو النسخ. يمكنك نسخ الرابط أدناه يدويًا.");
      }
    }
  }

  async function copyInviteLink() {
    if (!createdInvite?.code) return;
    const url = new URL(`/invite/${createdInvite.code}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareMessage("نُسخ الرابط. لم يُرسل شيء؛ الدعوة ما زالت بانتظار الإيصال.");
    } catch {
      setErrorMessage("تعذّر النسخ من هذا المتصفح.");
    }
  }

  async function openPublicInvite() {
    if (!isAuthenticated || !code) return;
    setErrorMessage("");
    try {
      await openMutation.mutateAsync({ code });
      await utils.invitations.preview.invalidate({ code });
      await utils.invitations.inbox.invalidate();
    } catch {
      setErrorMessage("تعذّر فتح الدعوة؛ قد تكون منتهية أو موجهة إلى حساب آخر.");
    }
  }

  async function respond(invitationId: number, response: "accepted" | "declined", inviteCode?: string) {
    setErrorMessage("");
    try {
      await respondMutation.mutateAsync({ id: invitationId, response, ...(inviteCode ? { code: inviteCode } : {}) });
      await Promise.all([utils.invitations.inbox.invalidate(), utils.invitations.sent.invalidate(), ...(inviteCode ? [utils.invitations.preview.invalidate({ code: inviteCode })] : [])]);
    } catch {
      setErrorMessage("تعذّر تسجيل الرد. قد تكون الدعوة انتهت أو سبق الرد عليها.");
    }
  }

  if (isPublicInvite) {
    const invitation = previewQuery.data;
    return <main className="invitations-page" dir="rtl" lang="ar"><div className="invitations-shell invitations-public">
      <Link className="invitations-back" href="/">صالِحنا <ArrowLeft size={16} /></Link>
      <section className="invitation-card invitation-public-card">
        <div className="invitation-symbol"><MessageCircle size={24} /></div>
        <span className="invitation-eyebrow">دعوة خاصة</span>
        <h1>دعوة صلح من صالِحنا</h1>
        {previewQuery.isLoading ? <p>جارٍ التحقق من صلاحية الرابط...</p> : previewQuery.isError || !invitation ? <p role="alert">الرابط غير صالح أو انتهت صلاحيته.</p> : <>
          <p>هذه الدعوة لا تكشف ملفًا أو تفاصيل خلاف. سجّل الدخول لعرض الدعوة والرد عليها؛ لا تتم مشاركة أي محتوى تلقائيًا.</p>
          {invitation.status === "responded" ? <p className="invitation-notice">تم تسجيل رد على هذه الدعوة.</p> : invitation.status === "expired" || invitation.status === "cancelled" ? <p className="invitation-notice">هذه الدعوة لم تعد متاحة.</p> : !isAuthenticated ? <button className="invitation-button invitation-primary" type="button" onClick={() => startLogin(window.location.pathname)}>تسجيل الدخول لمتابعة الدعوة <ArrowLeft size={16} /></button> : invitation.status !== "opened" ? <button className="invitation-button invitation-primary" type="button" onClick={() => void openPublicInvite()} disabled={openMutation.isPending}>{openMutation.isPending ? <LoaderCircle className="invitation-spinner" size={17} /> : <LockKeyhole size={17} />} فتح الدعوة بأمان</button> : <div className="invitation-actions"><button className="invitation-button invitation-primary" type="button" onClick={() => void respond(invitation.id, "accepted", code)} disabled={respondMutation.isPending}><Check size={16} /> قبول الدعوة</button><button className="invitation-button invitation-outline" type="button" onClick={() => void respond(invitation.id, "declined", code)} disabled={respondMutation.isPending}><X size={16} /> رفض الدعوة</button></div>}
        </>}
        {errorMessage && <p className="invitation-error" role="alert">{errorMessage}</p>}
        <p className="invitation-footnote"><LockKeyhole size={14} /> فتح الرابط لا يعني القبول، ولا يشارك ملفًا أو يرسل ردًا خارجيًا.</p>
      </section>
    </div></main>;
  }

  if (loading) return <main className="invitations-page" dir="rtl"><div className="invitations-shell"><p>جارٍ التحقق من الحساب...</p></div></main>;
  if (!isAuthenticated) return <main className="invitations-page" dir="rtl"><div className="invitations-shell"><section className="invitation-card"><h1>دعوات الصلح</h1><p>سجّل الدخول لعرض الدعوات وإدارتها.</p><button className="invitation-button invitation-primary" type="button" onClick={() => startLogin()}>تسجيل الدخول</button></section></div></main>;

  return <main className="invitations-page" dir="rtl" lang="ar"><div className="invitations-shell">
    <Link className="invitations-back" href="/cases">ملفاتي <ArrowLeft size={16} /></Link>
    <header className="invitations-heading"><span className="invitation-eyebrow">تواصل بخصوصية</span><h1>دعوات الصلح</h1><p>تصل الدعوة داخليًا إذا كان الرقم مسجلًا في حساب. وإلا ننشئ رابطًا لتشاركه أنت؛ لا نرسل رسائل خارجية.</p></header>
    {errorMessage && <p className="invitation-error" role="alert">{errorMessage}</p>}
    {shareMessage && <p className="invitation-notice" role="status">{shareMessage}</p>}
    <div className="invitations-grid">
      <section className="invitation-card">
        <div className="invitation-card-heading"><div className="invitation-symbol"><Send size={21} /></div><div><h2>إنشاء دعوة</h2><p>لن يُشارك محتوى ملفك مع المدعو.</p></div></div>
        <form className="invitation-form" onSubmit={event => void submitInvitation(event)}>
          <label htmlFor="invite-case">ملف الصلح</label>
          <select id="invite-case" value={caseId} onChange={event => setCaseId(event.target.value)} required>
            <option value="">اختر ملفًا آمنًا</option>
            {(casesQuery.data ?? []).filter(item => item.safety === "safe" && item.status === "draft").map(item => <option key={item.id} value={item.id}>ملف #{item.id} — {item.country}</option>)}
          </select>
          <label htmlFor="invite-phone">رقم جوال المدعو</label>
          <input id="invite-phone" dir="ltr" inputMode="tel" autoComplete="tel" value={invitePhone} onChange={event => setInvitePhone(event.target.value)} placeholder="05XXXXXXXX أو +رمز الدولة" required />
          <p className="invitation-help">تُوحّد الأرقام السعودية. يُستخدم الرقم للمطابقة فقط ولا يُعرض للمرسل أو يُحفظ في سجل الدعوة. لا يوجد تحقق SMS.</p>
          <button className="invitation-button invitation-primary" type="submit" disabled={createMutation.isPending || casesQuery.isLoading}>{createMutation.isPending ? <LoaderCircle className="invitation-spinner" size={17} /> : <Send size={17} />} إرسال دعوة الصلح</button>
        </form>
        {createdInvite?.status === "pending_delivery" && createdInvite.code && <div className="invitation-share"><button className="invitation-button invitation-primary" type="button" onClick={() => void shareCreated()}><MessageCircle size={17} /> مشاركة الرابط</button><button className="invitation-button invitation-outline" type="button" onClick={() => void copyInviteLink()}><Clipboard size={16} /> {copied ? "نُسخ الرابط" : "نسخ الرابط"}</button><span className="invitation-help">لن تتغير الحالة إلى «أُرسلت» بمجرد النسخ أو فتح المشاركة.</span></div>}
      </section>
      <section className="invitation-card">
        <div className="invitation-card-heading"><div className="invitation-symbol"><LockKeyhole size={21} /></div><div><h2>رقم حسابك</h2><p>اختياري، لمطابقة دعوات واردة.</p></div></div>
        <form className="invitation-form" onSubmit={event => void submitPhone(event)}>
          <label htmlFor="account-phone">رقم جوالك</label><input id="account-phone" dir="ltr" inputMode="tel" autoComplete="tel" value={accountPhone} onChange={event => setAccountPhone(event.target.value)} placeholder="05XXXXXXXX أو +رمز الدولة" />
          <label className="invitation-consent"><input type="checkbox" checked={saveConsent} onChange={event => setSaveConsent(event.target.checked)} /> أوافق على حفظ رقمي لمطابقة دعوات الصلح الواردة إلى حسابي.</label>
          <p className="invitation-help">لا نرسل رمز تحقق. الرقم الذي تدخله غير موثّق؛ عند المطابقة تصل دعوة عامة فقط ولا نشارك ملفًا أو تفاصيل.</p>
          <button className="invitation-button invitation-outline" type="submit" disabled={savePhoneMutation.isPending || !saveConsent}>{savePhoneMutation.isPending ? <LoaderCircle className="invitation-spinner" size={17} /> : <Check size={16} />} حفظ الرقم</button>
          {myPhoneQuery.data?.phone && <button className="invitation-button invitation-outline" type="button" onClick={() => { setAccountPhone(""); savePhoneMutation.mutate({ phone: "" }, { onSuccess: () => void myPhoneQuery.refetch() }); }}>إزالة رقمي</button>}
        </form>
      </section>
    </div>
    <section className="invitation-card invitation-list-card"><div className="invitation-card-heading"><div className="invitation-symbol"><Bell size={21} /></div><div><h2>الوارد</h2><p>الدعوات الداخلية التي وصلتك إلى الحساب.</p></div></div>
      {inboxQuery.isLoading ? <p>جارٍ تحميل الدعوات...</p> : inboxQuery.isError ? <p role="alert">تعذّر تحميل الوارد.</p> : !inboxQuery.data?.length ? <p className="invitation-empty">لا توجد دعوات واردة.</p> : <div className="invitation-list">{inboxQuery.data.map(item => <article className="invitation-row" key={item.id}><div><strong>دعوة صلح</strong><span>{item.senderName ? `من ${item.senderName}` : "من عضو في صالِحنا"} · {formatDate(item.createdAt)}</span><span className="invitation-status"><Clock3 size={13} /> {statusLabels[item.status] ?? item.status}</span></div>{item.status === "delivered_inbox" ? <button className="invitation-button invitation-outline" type="button" onClick={() => void openMutation.mutateAsync({ id: item.id }).then(() => utils.invitations.inbox.invalidate())}>فتح</button> : item.status === "opened" ? <div className="invitation-actions"><button className="invitation-button invitation-primary" type="button" onClick={() => void respond(item.id, "accepted")}><Check size={15} /> قبول</button><button className="invitation-button invitation-outline" type="button" onClick={() => void respond(item.id, "declined")}><X size={15} /> رفض</button></div> : <span className="invitation-status">{item.response === "accepted" ? "قُبلت" : "رُفضت"}</span>}</article>)}</div>}
    </section>
    <section className="invitation-card invitation-list-card"><div className="invitation-card-heading"><div className="invitation-symbol"><Send size={20} /></div><div><h2>الصادر</h2><p>الحالات كما هي دون ادعاء إرسال خارجي.</p></div></div>
      {sentQuery.isLoading ? <p>جارٍ تحميل الصادر...</p> : sentQuery.isError ? <p role="alert">تعذّر تحميل الصادر.</p> : !sentQuery.data?.length ? <p className="invitation-empty">لم تنشئ دعوات بعد.</p> : <div className="invitation-list">{sentQuery.data.map(item => <article className="invitation-row" key={item.id}><div><strong>دعوة #{item.id}</strong><span>{formatDate(item.createdAt)}</span><span className="invitation-status"><Clock3 size={13} /> {statusLabels[item.status] ?? item.status}{item.response ? ` · ${item.response === "accepted" ? "قُبلت" : "رُفضت"}` : ""}</span></div><span className="invitation-help">{item.status === "delivered_inbox" ? "وصلت إلى صندوق الوارد" : item.status === "opened" ? "فُتحت" : item.status === "responded" ? "تم الرد" : "لم تُرسل خارجيًا"}</span></article>)}</div>}
    </section>
    <p className="invitation-footnote"><LockKeyhole size={14} /> لا بريد أو WhatsApp أو SMS آليًا. إشعار داخل المنصة لا يضمن أن المستخدم اطّلع عليه. لا تُشارك تفاصيل ملفك إلا عبر اختيارك وبموافقة مناسبة.</p>
  </div></main>;
}

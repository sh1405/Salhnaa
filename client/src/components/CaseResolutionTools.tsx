import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarClock, Check, Clipboard, FileCheck2, LoaderCircle, MessageCircle, Mic2, ShieldCheck, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./CaseResolutionTools.css";

type Outcome = "pending" | "reconciled" | "not_reconciled";

function makeRoomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export default function CaseResolutionTools({ caseId }: { caseId: number }) {
  const caseQuery = trpc.cases.get.useQuery({ id: caseId }, { retry: false });
  const sentQuery = trpc.invitations.sent.useQuery(undefined, { retry: false });
  const updateCase = trpc.cases.update.useMutation();
  const [proposedTime, setProposedTime] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [agreementText, setAgreementText] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("pending");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const row = caseQuery.data;
  const acceptedInvite = useMemo(
    () => (sentQuery.data ?? []).some(invite => invite.caseId === caseId && invite.status === "responded" && invite.response === "accepted"),
    [caseId, sentQuery.data],
  );

  useEffect(() => {
    if (!row) return;
    setRoomUrl(row.responses.meta_human_room_url || "");
    setProposedTime(row.responses.meta_human_session_time || "");
    setAgreementText(row.responses.meta_agreement_text || "");
    const savedOutcome = row.responses.meta_agreement_outcome;
    if (savedOutcome === "reconciled" || savedOutcome === "not_reconciled") setOutcome(savedOutcome);
    else setOutcome("pending");
  }, [row?.id, row?.updatedAt]);

  async function persist(patch: Record<string, string>) {
    if (!row || row.safety !== "safe" || row.status !== "draft") {
      throw new Error("لا يمكن تعديل هذا الملف في حالته الحالية.");
    }
    await updateCase.mutateAsync({
      id: caseId,
      kind: row.kind as "individual" | "family" | "community" | "business" | "workplace" | "organization" | "multi" | "international",
      country: row.country,
      safety: "safe",
      status: "draft",
      responses: { ...row.responses, ...patch },
    });
    await caseQuery.refetch();
  }

  async function createRoom() {
    setError("");
    setNotice("");
    if (!acceptedInvite) {
      setError("أنشئ الدعوة أولًا وانتظر قبول الطرف الآخر قبل تجهيز غرفة مشتركة.");
      return;
    }
    if (!row || row.safety !== "safe") {
      setError("لا يمكن إنشاء غرفة لهذا الملف قبل تأكيد السلامة.");
      return;
    }
    const url = `https://meet.jit.si/Salihna-${makeRoomToken()}`;
    try {
      await persist({
        meta_human_room_url: url,
        meta_human_session_time: proposedTime,
        meta_human_session_status: "proposed_not_confirmed",
        meta_human_room_created_at: new Date().toISOString(),
      });
      setRoomUrl(url);
      setNotice("أُنشئ رابط غرفة صوتية مقترح. هذا لا يؤكد موعدًا ولا يعيّن مصلحًا؛ نسّق الموعد وشارك الرابط يدويًا مع المشاركين.");
    } catch {
      setError("تعذّر حفظ رابط الغرفة في الملف. لم نؤكد إنشاء طلب الجلسة.");
    }
  }

  async function saveAgreement() {
    setError("");
    setNotice("");
    try {
      await persist({
        meta_agreement_text: agreementText.trim(),
        meta_agreement_outcome: outcome,
        meta_agreement_updated_at: new Date().toISOString(),
      });
      setNotice("حُفظت المسودة والحالة في ملفك. الحالة تسجيلٌ لإفادتك وليست توقيعًا من الطرفين.");
    } catch {
      setError("تعذّر حفظ المسودة. تحقق من الاتصال وحاول مرة أخرى.");
    }
  }

  async function copyRoom() {
    if (!roomUrl) return;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
    } catch {
      setError("تعذّر النسخ التلقائي؛ افتح الرابط وانسخه يدويًا.");
    }
  }

  if (caseQuery.isLoading) return <section className="resolution-tools" role="status"><LoaderCircle className="resolution-spin" size={22} /> جارٍ تحميل خيارات المتابعة...</section>;
  if (caseQuery.isError || !row) return <section className="resolution-tools" role="alert">تعذّر تحميل خيارات المتابعة لهذا الملف.</section>;

  return (
    <section className="resolution-tools" aria-labelledby="resolution-tools-title">
      <div className="resolution-tools__heading">
        <span className="resolution-tools__mark"><Sparkles size={19} /></span>
        <div><span className="resolution-tools__eyebrow">بعد صحيفة الود</span><h2 id="resolution-tools-title">اختر خطوتك التالية — إن رغبت</h2><p>لا شيء من هذه الخيارات إلزامي.</p></div>
      </div>

      <article className="resolution-tool-card">
        <div className="resolution-tool-card__title"><span><Sparkles size={17} /></span><div><h3>مساعد الصياغة بالذكاء الاصطناعي</h3><p>يساعدك على ترتيب النص كمسودة اختيارية.</p></div></div>
        <p className="resolution-tool-note">هذه مساعدة نصية فردية، وليست جلسة مشتركة أو وسيطًا آليًا بين الطرفين.</p>
        <Link className="resolution-tool-button" href="/assistant">فتح المساعد الذكي <MessageCircle size={16} /></Link>
      </article>

      <article className="resolution-tool-card">
        <div className="resolution-tool-card__title"><span><Mic2 size={17} /></span><div><h3>غرفة صوتية ومقترح جلسة بشرية</h3><p>يمكن تجهيز الرابط بعد قبول الطرف الآخر للدعوة.</p></div></div>
        {acceptedInvite ? <>
          <label className="resolution-tool-label" htmlFor={`session-time-${caseId}`}>وقت مقترح (اختياري)</label>
          <input className="resolution-tool-input" id={`session-time-${caseId}`} type="datetime-local" value={proposedTime} onChange={event => setProposedTime(event.target.value)} />
          <button className="resolution-tool-button" type="button" onClick={() => void createRoom()} disabled={updateCase.isPending}>
            {updateCase.isPending ? <LoaderCircle className="resolution-spin" size={16} /> : <CalendarClock size={16} />}
            {roomUrl ? "تحديث رابط الغرفة المقترحة" : "إنشاء رابط الغرفة"}
          </button>
          {roomUrl && <div className="resolution-room-link"><a href={roomUrl} target="_blank" rel="noreferrer">فتح الغرفة الصوتية</a><button type="button" onClick={() => void copyRoom()}><Clipboard size={14} />{copied ? "تم النسخ" : "نسخ الرابط"}</button></div>}
          <p className="resolution-tool-note">الرابط يستخدم خدمة اجتماعات خارجية. لا يوجد في النظام حاليًا جدول لمصلحين أو تعيين تلقائي لهم؛ إنشاء الغرفة لا يعني تأكيد حجز خبير. شارك الرابط يدويًا وبموافقة المشاركين فقط.</p>
        </> : <p className="resolution-tool-note">لن تُنشأ غرفة مشتركة قبل قبول الطرف الآخر للدعوة. <Link href="/invitations">إدارة الدعوات والوارد والصادر</Link></p>}
      </article>

      <article className="resolution-tool-card">
        <div className="resolution-tool-card__title"><span><FileCheck2 size={17} /></span><div><h3>مسودة وثيقة الاتفاق والنتيجة</h3><p>اكتب ما توافقتم عليه، أو سجّل تعذر الوصول إلى اتفاق.</p></div></div>
        <label className="resolution-tool-label" htmlFor={`agreement-text-${caseId}`}>بنود أو ملاحظات (اختياري)</label>
        <textarea className="resolution-tool-input resolution-tool-textarea" id={`agreement-text-${caseId}`} maxLength={3000} rows={5} value={agreementText} onChange={event => setAgreementText(event.target.value)} placeholder="اكتب البنود التي اتفق عليها الطرفان، أو اتركها فارغة حتى تتضح..." />
        <label className="resolution-tool-label" htmlFor={`agreement-outcome-${caseId}`}>حالة الملف (اختياري)</label>
        <select className="resolution-tool-input" id={`agreement-outcome-${caseId}`} value={outcome} onChange={event => setOutcome(event.target.value as Outcome)}>
          <option value="pending">لم تُحدّد بعد</option><option value="reconciled">تم الصلح — وفق إفادتي</option><option value="not_reconciled">تعذّر الصلح — وفق إفادتي</option>
        </select>
        <button className="resolution-tool-button" type="button" onClick={() => void saveAgreement()} disabled={updateCase.isPending}>
          {updateCase.isPending ? <LoaderCircle className="resolution-spin" size={16} /> : <Check size={16} />} حفظ المسودة والحالة
        </button>
        <p className="resolution-tool-note"><ShieldCheck size={14} /> وثيقة أولية غير معتمدة رسميًا، ولا تتضمن توقيع الطرف الآخر أو إثبات موافقته. لا تعتبر الحالة إقرارًا مشتركًا ولا تغني عن مراجعة مختص عند الحاجة.</p>
      </article>
      {notice && <p className="resolution-notice" role="status">{notice}</p>}
      {error && <p className="resolution-error" role="alert">{error}</p>}
    </section>
  );
}

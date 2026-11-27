import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Compass,
  FileText,
  GitMerge,
  Globe2,
  Landmark,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Network,
  Pencil,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { startLogin } from "@/const";
import CaseResolutionTools from "@/components/CaseResolutionTools";
import { trpc } from "@/lib/trpc";
import "./Journey.css";

type Kind = "individual" | "family" | "community" | "business" | "workplace" | "organization" | "multi" | "international";
type Safety = "safe" | "danger" | "unsure" | "prefer_not";
type Responses = Record<string, string>;
type Question = {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: "textarea" | "text" | "select" | "choice";
  required?: boolean;
  depth?: "explore";
  options?: { value: string; label: string; description?: string }[];
};

const kinds: { id: Kind; title: string; description: string; Icon: LucideIcon }[] = [
  { id: "individual", title: "الأفراد", description: "خلاف شخصي أو مالي أو اجتماعي", Icon: MessageCircle },
  { id: "family", title: "الأسرة والعائلة", description: "علاقات أسرية ومصالح مشتركة", Icon: GitMerge },
  { id: "community", title: "المجتمع والقبائل", description: "خلاف مجتمعي أو بين مجموعات", Icon: Network },
  { id: "business", title: "الأعمال والتجارة", description: "شراكات أو التزامات تجارية", Icon: BriefcaseBusiness },
  { id: "workplace", title: "بيئة العمل", description: "خلافات مهنية أو في مكان العمل", Icon: Building2 },
  { id: "organization", title: "المؤسسات والجهات", description: "خلاف تنظيمي أو بين جهات", Icon: Landmark },
  { id: "multi", title: "متعدد الأطراف", description: "أكثر من طرف ومصالح متداخلة", Icon: Network },
  { id: "international", title: "عابر للحدود", description: "أطراف أو اعتبارات في دول مختلفة", Icon: Globe2 },
];

const steps = [
  { label: "نوع المسار", sub: "نقطة البداية" },
  { label: "السلامة أولًا", sub: "قبل أن نكمل" },
  { label: "مكان الخلاف", sub: "السياق المحلي" },
  { label: "صورة الخلاف", sub: "ما الذي حدث؟" },
  { label: "تفاصيل المسار", sub: "بما يناسب حالتك" },
  { label: "الموقف والطلب", sub: "وجهة نظرك" },
  { label: "ما يهمّك", sub: "المصالح والمخاوف" },
  { label: "خطوة تفاهم", sub: "تجربة ومراجعة" },
  { label: "خريطة القرار", sub: "قبل الحفظ" },
];

const safetyOptions: { value: Safety; title: string; description: string }[] = [
  { value: "safe", title: "نعم، أشعر بالأمان", description: "لا يوجد تهديد مباشر أو ضغط يمنعني من المتابعة." },
  { value: "danger", title: "هناك خطر أو تهديد", description: "أشعر بأن سلامتي أو سلامة شخص آخر قد تكون في خطر." },
  { value: "unsure", title: "لست متأكدًا", description: "لا أستطيع تحديد ما إذا كان الوضع آمنًا الآن." },
  { value: "prefer_not", title: "أفضل عدم الإجابة", description: "لا أرغب في الإجابة عن هذا السؤال." },
];

const procedureOptions = [
  { value: "yes", label: "نعم" },
  { value: "no", label: "لا" },
  { value: "unsure", label: "لست متأكدًا" },
];

function questionsFor(kind: Kind | "", step: number, responses: Responses): Question[] {
  if (step === 3) return [{
    key: "facts", label: "ما الذي حدث من وجهة نظرك؟", hint: "اكتب وصفًا موجزًا لما تعرفه، دون أسماء أو بيانات تعريفية. هذه روايتك وليست حكمًا على الوقائع؛ الإجابة اختيارية.", placeholder: "يمكنك البدء بما حدث ومتى بدأت المشكلة بصورة عامة...",
  },
  { key: "shared_facts", label: "ما الجانب الذي قد تتفقون عليه حتى الآن؟", hint: "إن لم يظهر بعد، اتركه فارغًا. لا يلزم أن تتفق الروايات كي تبدأ بتوضيح ما تعرفه.", placeholder: "مثلًا: بداية التعامل أو وجود اختلاف حول موضوع معين...", depth: "explore" },
  { key: "disputed_issue", label: "ما السؤال الأساسي الذي ما زال بينكم بلا حسم؟", hint: "حوّل الخلاف إلى مسألة قابلة للنقاش، لا إلى حكم على الأشخاص.", placeholder: "مثلًا: كيف يُستكمل الالتزام أو تُنظّم العلاقة؟", depth: "explore" }];
  if (step === 4) {
    const coreCause: Question = { key: "core_cause", label: "ما السبب الجوهري أو الحاجة غير الملبّاة خلف الخلاف؟", hint: "قد يكون وراء الموقف احتياج أو توقع أو سوء فهم. أجب بقدر ما ترتاح، ويمكنك تركه فارغًا.", placeholder: "ما الذي تعتقد أنه يغذي الخلاف؟" };
    const representation: Question = {
      key: "representation", label: "بأي صفة تتحدث هنا؟", hint: "وجودك ضمن مجموعة لا يعني أنك مفوّض للحديث باسمها.", type: "select",
      options: [{ value: "self", label: "أتحدث عن نفسي" }, { value: "representative", label: "أمثل آخرين" }, { value: "unsure", label: "لم تتحدد الصفة بعد" }],
    };
    const authorization: Question = { key: "authorization", label: "ما حدود التفويض الذي لديك، إن وجد؟", hint: "اذكر حدود الصفة بشكل عام فقط، دون أسماء أو وثائق.", placeholder: "مثلًا: نطاق ما يمكنني مناقشته أو ما يحتاج إلى موافقة..." };
    const process: Question = { key: "procedure", label: "هل توجد مهلة أو إجراءات قائمة قد تؤثر في هذا الخلاف؟", type: "select", options: procedureOptions };
    const processDetail: Question = { key: "procedure_details", label: "ما الذي ينبغي أخذه في الاعتبار بشأنها؟", hint: "اذكر المهلة أو نوع الإجراء بصورة عامة، دون إرفاق مستندات.", placeholder: "اكتب ما تعرفه، إن رغبت..." };
    switch (kind) {
      case "individual": return [coreCause, { key: "relationship", label: "ما طبيعة العلاقة أو التعامل بين الأطراف؟", hint: "يكفي وصف عام؛ لا حاجة إلى ذكر أسماء.", placeholder: "مثلًا: علاقة شخصية أو مالية..." }, { key: "interaction_context", label: "ما نوع المسألة التي تحتاج إلى ترتيب؟", type: "select", options: [{ value: "financial", label: "التزام أو تعامل مالي" }, { value: "property", label: "ممتلكات أو انتفاع مشترك" }, { value: "relationship", label: "تواصل أو علاقة شخصية" }, { value: "other", label: "مسألة أخرى" }] }];
      case "family": return [coreCause, { key: "relationship", label: "ما طبيعة العلاقة أو الروابط التي تأثرت بالخلاف؟", hint: "يمكنك وصفها باختصار دون تحديد هويات الأشخاص.", placeholder: "صف العلاقة أو ما يهم الحفاظ عليه..." }, { key: "family_priority", label: "ما الذي تأمل حمايته أو الحفاظ عليه في العلاقة؟", placeholder: "مثلًا: التواصل المحترم أو استقرار الترتيبات...", depth: "explore" }];
      case "community": return [coreCause, representation, ...(responses.representation === "representative" ? [authorization] : []), { key: "community_context", label: "هل توجد اعتبارات مجتمعية تود الإشارة إليها؟", hint: "اذكر السياق أو العادات ذات الصلة دون افتراض أنها تحل محل الحقوق أو الأنظمة.", placeholder: "تفصيل عام، إن رغبت..." }, { key: "community_voice", label: "من الفئات أو الأصوات التي يلزم سماعها قبل أي تفاهم؟", hint: "فكّر في شمول المشاركين واحترام من سيتأثر بالقرار، دون ذكر أسماء.", placeholder: "صف فئات عامة أو وجهات نظر قد تكون غائبة...", depth: "explore" }];
      case "business": return [coreCause, { key: "business_context", label: "ما طبيعة العلاقة أو الالتزام التجاري محل الخلاف؟", hint: "صِفها بشكل عام دون بيانات مالية حساسة أو مستندات.", placeholder: "مثلًا: شراكة أو توريد أو تقديم خدمة..." }, { key: "business_impact", label: "ما الأثر العملي الذي يحتاج إلى معالجة أولًا؟", type: "select", options: [{ value: "continuity", label: "استمرار العمل أو التوريد" }, { value: "payment", label: "المدفوعات أو الالتزامات" }, { value: "scope", label: "نطاق العمل أو جودته" }, { value: "relationship", label: "استمرار العلاقة التجارية" }, { value: "other", label: "أثر آخر" }] }, process, ...(responses.procedure === "yes" ? [processDetail] : [])];
      case "workplace": return [coreCause, { key: "workplace_context", label: "ما السياق المهني للخلاف؟", hint: "صف طبيعة العلاقة أو أثر الخلاف في العمل دون تسمية أشخاص.", placeholder: "تفصيل عام عن بيئة العمل..." }, { key: "workplace_impact", label: "ما الجانب العملي الذي تأثر أكثر؟", type: "select", options: [{ value: "responsibilities", label: "توزيع المسؤوليات" }, { value: "communication", label: "التواصل أو التعاون" }, { value: "workflow", label: "سير العمل أو الجدول" }, { value: "recognition", label: "توقعات الدور أو التقدير" }, { value: "other", label: "جانب آخر" }] }, process, ...(responses.procedure === "yes" ? [processDetail] : [])];
      case "organization": return [coreCause, { key: "organization_context", label: "ما طبيعة العلاقة بين الجهات أو الوحدات المعنية؟", hint: "تحدث بشكل عام دون أسماء جهات أو تفاصيل سرية.", placeholder: "مثلًا: تعاون أو اختصاصات أو التزام مشترك..." }, representation, ...(responses.representation === "representative" ? [authorization] : [])];
      case "multi": return [coreCause, { key: "parties_context", label: "كيف تتداخل الأطراف أو المصالح؟", hint: "صف المجموعات بصورة عامة دون ذكر أسماء أو افتراض اتفاقها.", placeholder: "مثلًا: عدة مجموعات لها مصالح مختلفة..." }, representation, ...(responses.representation === "representative" ? [authorization] : [])];
      case "international": return [coreCause, { key: "cross_border", label: "ما الدول أو السياقات الأخرى ذات الصلة؟", hint: "اكتفِ بذكر الدول أو وصف عام، دون عناوين أو مستندات.", placeholder: "اذكر الدول ذات الصلة إن عُرفت..." }, process, ...(responses.procedure === "yes" ? [processDetail] : [])];
      default: return [];
    }
  }
  if (step === 5) return [
    { key: "position", label: "كيف ترى الخلاف أو تفسّره؟", hint: "يمكن أن تختلف التفسيرات بين الأطراف؛ اكتب وجهة نظرك كما تراها.", placeholder: "من وجهة نظري..." },
    { key: "request", label: "ما الذي تطلبه أو تود الوصول إليه؟", hint: "عبّر عن النتيجة التي تهمك، لا عن حكم على الطرف الآخر.", placeholder: "ما طلبك الأساسي؟" },
    { key: "other_perspective", label: "كيف قد يصف الطرف الآخر ما يهمه؟", hint: "ليس مطلوبًا أن توافقه؛ يكفي أن تتخيل ما قد يحتاج إلى أن يُسمع.", placeholder: "ربما يرى الطرف الآخر أن...", depth: "explore" },
  ];
  if (step === 6) return [
    { key: "interests", label: "ما الأمور الأهم بالنسبة لك؟", hint: "فكّر في الاحتياجات أو المصالح وراء طلبك.", placeholder: "مثلًا: وضوح الالتزامات، الاحترام، أو الاستقرار..." },
    { key: "concerns", label: "هل هناك مخاوف أو عوائق تود مراعاتها؟", placeholder: "ما الذي قد يجعل التقدم صعبًا؟" },
    { key: "sacrifices", label: "ما التنازل أو التضحية المعقولة التي قد تقدمها لإتمام الصلح؟", hint: "لا تكتب وعدًا أو التزامًا لا ترغب به؛ إجابتك اختيارية وقابلة للمراجعة.", placeholder: "ما الذي تستطيع تقديمه دون الإضرار بحقوقك أو سلامتك؟" },
    { key: "process_needs", label: "ما الذي يجعل الحوار مريحًا ومنصفًا لك؟", hint: "يمكن التفكير في الترتيب، الوقت، اللغة، أو طريقة المشاركة. لا يضمن هذا الخيار توفير تسهيلات بعينها.", placeholder: "أي احتياج إجرائي ترغب في توضيحه...", depth: "explore" },
  ];
  if (step === 7) return [
    { key: "solutions", label: "ما الخيارات التي قد تكون مستعدًا للنظر فيها؟", hint: "ليست هذه التزامات؛ مجرد أفكار أولية قابلة للتغيير.", placeholder: "اكتب أي احتمالات تراها مناسبة..." },
    { key: "common_ground", label: "هل ترى مساحة اتفاق يمكن البناء عليها؟", placeholder: "يمكنك تركها فارغة إن لم تتضح بعد..." },
    { key: "invite_channel", label: "إن رغبت بدعوة الطرف الآخر لاحقًا، ما القناة التي تفضّلها؟", hint: "اختيار اختياري للتفضيل فقط. لا تُرسل المنصة دعوة الآن ولا تطلب بيانات الطرف الآخر. قد تتطلب القنوات اعتمادًا أو تكلفة، ولا نضمن المجانية أو التغطية في كل دولة.", type: "choice", options: [
      { value: "whatsapp", label: "WhatsApp", description: "تفضيل محفوظ فقط؛ الإرسال من المنصة غير مفعّل." },
      { value: "telegram", label: "Telegram", description: "تفضيل محفوظ فقط؛ يجب أن يبدأ الطرف الآخر محادثة البوت أولًا." },
      { value: "email", label: "البريد الإلكتروني", description: "تفضيل محفوظ فقط؛ لا توجد خدمة بريد دعوات مفعّلة." },
      { value: "other_app", label: "تطبيق تواصل آخر", description: "يمكنك مشاركة نص الدعوة بنفسك؛ لا يوجد ربط تلقائي." },
      { value: "sms", label: "رسالة نصية SMS", description: "تفضيل محفوظ فقط؛ التكلفة والتغطية تختلفان بحسب الدولة والمزوّد." },
    ] },
    { key: "followup_mode", label: "ما طريقة المتابعة التي تفضّلها؟", hint: "هذا تفضيل يُحفظ ضمن ملفك فقط؛ لا يُرسل إلى وسيط ولا ينشئ موعدًا أو غرفة. استقبال طلبات الوساطة والجلسات الصوتية غير مفعّل حاليًا. والكتابة وحدها خيار كافٍ.", type: "choice", options: [
      { value: "writing_only", label: "الكتابة وحدها تكفيني", description: "أتابع ترتيب أفكاري وخريطة القرار كتابةً." },
      { value: "human_mediation", label: "أفضل وساطة بشرية", description: "تفضيل مبدئي محفوظ في الملف؛ لا يوجد حاليًا استقبال أو إسناد لطلب وساطة." },
      { value: "human_voice_optional", label: "وساطة بشرية، والصوت اختياري", description: "إن أُتيحت جلسة صوتية مستقبلًا، أود أن أتمكن من تخطيها ومتابعة الكتابة." },
    ] },
    { key: "fairness_criteria", label: "ما الذي يجعل أي خيار منصفًا وقابلًا للتطبيق؟", hint: "قد يشمل ذلك الوضوح، التوقيت، القدرة على التنفيذ، أو موافقة أصحاب الصفة. هذا ليس تقييمًا قانونيًا.", placeholder: "اكتب معيارًا أو معيارين مهمين لك...", depth: "explore" },
    { key: "non_agreement", label: "إن لم يظهر تفاهم الآن، ما الخطوة التالية التي تراها مناسبة؟", hint: "لا نوصي بمسار قانوني؛ هذا السؤال يساعدك على معرفة احتياجك وخياراتك، ويمكنك تركه فارغًا.", placeholder: "سأحتاج إلى وقت / معلومات / استشارة مختصة / لم يتضح بعد...", depth: "explore" },
    { key: "first_step", label: "ما أصغر خطوة آمنة يمكن تجربتها؟", hint: "فكّر في خطوة محدودة وواضحة بدل التزام كبير. هذا اقتراح للتفكير، لا اتفاق قائم.", placeholder: "مثلًا: تبادل معلومات محددة أو تجربة ترتيب مؤقت...", depth: "explore" },
    { key: "success_signal", label: "ما العلامة التي تخبرك أن الخطوة مفيدة؟", hint: "اختر تغيرًا يمكن ملاحظته، لا وعدًا بنتيجة مثالية.", placeholder: "مثلًا: وضوح المسؤوليات أو عودة التواصل...", depth: "explore" },
    { key: "review_timing", label: "متى وكيف تراجعون أثرها؟", hint: "حدّد إطارًا زمنيًا أو طريقة مراجعة إن كان ذلك مناسبًا.", placeholder: "مثلًا: مراجعة ما حدث بعد أسبوعين...", depth: "explore" },
  ];
  return [];
}

const stageCopy = [
  { eyebrow: "لنبدأ من هنا", title: "لكل خلاف سياقه الخاص", description: "اختر المسار الأقرب إلى طبيعة الخلاف، لنرتّب لك أسئلة تناسبه." },
  { eyebrow: "خطوة مهمة", title: "سلامتك تأتي أولًا", description: "قبل الحديث عن الخلاف، نود التأكد من أنك تشعر بالأمان عند المتابعة." },
  { eyebrow: "السياق المحلي", title: "أين يقع الخلاف؟", description: "يساعدنا تحديد الدولة على فهم السياق العام لملفك." },
  { eyebrow: "الصورة الأولى", title: "ابدأ بما حدث", description: "خذ مساحتك في وصف ما تعرفه. لا نتحقق من صحة الرواية من طرف واحد." },
  { eyebrow: "تفاصيل تناسب مسارك", title: "لنفهم السياق أكثر", description: "بضع تفاصيل اختيارية تساعدك على ترتيب الصورة، دون الحاجة لذكر هويات." },
  { eyebrow: "من وجهة نظرك", title: "موقفك وما تطلبه", description: "افصل بين ما تراه في الخلاف وما ترغب في الوصول إليه." },
  { eyebrow: "خلف الموقف", title: "ما الذي يهمّك حقًا؟", description: "المصالح والمخاوف قد تفتح مساحة لفهم ما يحتاج إلى مراعاة." },
  { eyebrow: "التفكير في الممكن", title: "من خيار إلى تجربة", description: "اختر خطوةً صغيرة قابلة للمراجعة، أو اترك الفكرة حتى تتضح. لا يتحول أي اقتراح إلى التزام هنا." },
  { eyebrow: "قبل الحفظ", title: "راجع خريطة قرارك", description: "ترى الآن روايتك وما كتبته عن مصالحك وخياراتك. يمكنك تعديل كل محور قبل الحفظ." },
];

const storageKey = "salihna-journey-login-draft-v1";
const invitationTemplate = "أحد أعضاء (صالحنا) يحمل لك ودًّا، ويرجو صفاء ما بينكما، وقد بادر بخطوة صلحٍ حبًّا فيك. هلا اطلعت على مبادرته وتضحياته؟ والصلح خير، ألّف الله بين قلبيكما وجعل صلحكما مباركًا.";
const countries = ["السعودية", "الإمارات العربية المتحدة", "الكويت", "قطر", "البحرين", "عُمان", "الأردن", "مصر", "المغرب", "تونس", "الجزائر", "العراق", "لبنان", "فلسطين", "اليمن", "السودان", "تركيا", "المملكة المتحدة", "الولايات المتحدة"];

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && kinds.some(item => item.id === value);
}

function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) {
  const fieldId = `journey-${question.key}`;
  return (
    <div className="journey-field">
      <label htmlFor={fieldId} className="journey-field__label">{question.label} {question.required && <span className="journey-field__required">*</span>}</label>
      {question.hint && <p className="journey-field__hint" id={`${fieldId}-hint`}>{question.hint}</p>}
      {question.type === "choice" ? (
        <div className="journey-choice-list" role="radiogroup" aria-label={question.label} aria-describedby={question.hint ? `${fieldId}-hint` : undefined}>
          {question.options?.map(option => (
            <label key={option.value} className={`journey-choice-card ${value === option.value ? "is-selected" : ""}`}>
              <input id={option.value === question.options?.[0]?.value ? fieldId : undefined} type="radio" name={fieldId} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
              <span className="journey-choice-card__copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
              <span className="journey-choice-card__mark" aria-hidden="true" />
            </label>
          ))}
        </div>
      ) : question.type === "select" ? (
        <div className="journey-select-wrap">
          <select id={fieldId} value={value} onChange={event => onChange(event.target.value)} aria-describedby={question.hint ? `${fieldId}-hint` : undefined}>
            <option value="">اختر إجابة (اختياري)</option>
            {question.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <ChevronDown size={17} aria-hidden="true" />
        </div>
      ) : question.type === "text" ? (
        <input id={fieldId} value={value} onChange={event => onChange(event.target.value)} placeholder={question.placeholder} maxLength={500} aria-describedby={question.hint ? `${fieldId}-hint` : undefined} />
      ) : (
        <textarea id={fieldId} value={value} onChange={event => onChange(event.target.value)} placeholder={question.placeholder} maxLength={3000} rows={4} aria-required={question.required || undefined} aria-describedby={question.hint ? `${fieldId}-hint` : undefined} />
      )}
    </div>
  );
}

function displayAnswer(question: Question, value: string) {
  if (!value?.trim()) return "لم تتم الإضافة";
  return question.options?.find(option => option.value === value)?.label || value;
}

export default function Journey() {
  const [location] = useLocation();
  const idPart = location.match(/^\/journey\/([^/]+)\/?$/)?.[1];
  const numericId = idPart && /^\d+$/.test(idPart) ? Number(idPart) : null;
  const caseId = numericId && Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null;
  const invalidId = Boolean(idPart && !caseId);
  const initialKind = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("kind") : null;
  const [kind, setKind] = useState<Kind | "">(isKind(initialKind) ? initialKind : "");
  const [safety, setSafety] = useState<Safety | "">("");
  const [country, setCountry] = useState("");
  const [responses, setResponses] = useState<Responses>({});
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [keepForLogin, setKeepForLogin] = useState(false);
  const [notice, setNotice] = useState("");
  const [exploreOpen, setExploreOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<number | null>(null);
  const [mapCopyStatus, setMapCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [invitationCopyStatus, setInvitationCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [storageCleanupError, setStorageCleanupError] = useState(false);
  const [loadedStatus, setLoadedStatus] = useState<"draft" | "paused">("draft");
  const [notEditable, setNotEditable] = useState(false);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const restored = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const utils = trpc.useUtils();
  const auth = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const caseQuery = trpc.cases.get.useQuery({ id: caseId ?? 0 }, { enabled: Boolean(caseId && auth.data), retry: false, refetchOnMount: "always", refetchOnWindowFocus: false });
  const createCase = trpc.cases.create.useMutation();
  const updateCase = trpc.cases.update.useMutation();
  const isAuthenticated = Boolean(auth.data);

  useEffect(() => {
    setLoadedId(null);
    setSaved(false);
  }, [caseId]);

  useEffect(() => {
    // Cached data is not safe to edit until the fresh fetch has succeeded.
    if (!caseId || !isAuthenticated || !caseQuery.isFetchedAfterMount || caseQuery.isFetching || caseQuery.isError || !caseQuery.data || loadedId === caseId) return;
    const data = caseQuery.data;
    setLoadedId(caseId);
    if (!isKind(data.kind)) {
      setNotEditable(true);
      return;
    }
    setKind(data.kind);
    setCountry(data.country || "");
    setSafety(data.safety);
    setResponses(data.responses || {});
    const editable = data.status === "draft" || data.status === "paused";
    setNotEditable(!editable);
    if (editable) setLoadedStatus(data.status);
    setStep(data.safety === "safe" ? 8 : 1);
  }, [caseId, isAuthenticated, loadedId, caseQuery.data, caseQuery.isFetchedAfterMount, caseQuery.isFetching, caseQuery.isError]);

  useEffect(() => {
    if (caseId || !isAuthenticated || restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const data: unknown = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      const draft = data as { kind?: unknown; country?: unknown; safety?: unknown; responses?: unknown };
      if (!isKind(draft.kind) || draft.safety !== "safe" || typeof draft.country !== "string" || !draft.responses || typeof draft.responses !== "object" || Array.isArray(draft.responses)) return;
      const restoredResponses = Object.fromEntries(Object.entries(draft.responses).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
      setKind(draft.kind);
      setCountry(draft.country);
      setSafety("safe");
      setResponses(restoredResponses);
      setStep(8);
      setNotice("استعدنا النسخة المؤقتة من هذا الجهاز. راجعها ثم أكّد موافقتك لحفظها في حسابك.");
    } catch {
      // Storage may be unavailable; the journey remains usable without it.
    }
  }, [caseId, isAuthenticated]);

  const selectedKind = kinds.find(item => item.id === kind);
  const blocked = Boolean(safety && safety !== "safe");
  const allQuestions = useMemo(() => [3, 4, 5, 6, 7].flatMap(index => questionsFor(kind, index, responses)), [kind, responses]);
  const currentQuestions = questionsFor(kind, step, responses);
  const visibleQuestions = currentQuestions.filter(question => question.depth !== "explore" || exploreOpen || Boolean(responses[question.key]?.trim()));
  const hasExploreQuestions = currentQuestions.some(question => question.depth === "explore");
  const busy = createCase.isPending || updateCase.isPending;
  const followupQuestion = questionsFor(kind, 7, responses).find(question => question.key === "followup_mode");
  const followupLabel = followupQuestion?.options?.find(option => option.value === responses.followup_mode)?.label;
  const inviteQuestion = questionsFor(kind, 7, responses).find(question => question.key === "invite_channel");
  const inviteChannelLabel = inviteQuestion?.options?.find(option => option.value === responses.invite_channel)?.label;
  const resolutionCards = [
    { number: "01", title: "الوقائع والسؤال المفتوح", main: responses.facts?.trim(), extraLabel: "ما لم يُحسم", extra: responses.disputed_issue?.trim(), editStep: 3 },
    { number: "02", title: "ما قد يجمع بينكم", main: responses.shared_facts?.trim() || responses.common_ground?.trim(), extraLabel: "نقطة اتفاق محتملة", extra: responses.shared_facts?.trim() && responses.common_ground?.trim() ? responses.common_ground.trim() : "", editStep: 3 },
    { number: "03", title: "ما يهمّك أنت", main: responses.interests?.trim(), extraLabel: "النتيجة التي تطلبها", extra: responses.request?.trim(), editStep: 6 },
    { number: "04", title: "خيارات ومعايير", main: responses.solutions?.trim(), extraLabel: "ما يجعلها قابلة للتطبيق", extra: responses.fairness_criteria?.trim(), editStep: 7 },
    { number: "05", title: "تجربة ومراجعة", main: responses.first_step?.trim(), extraLabel: responses.success_signal?.trim() ? `إشارة التقدم: ${responses.success_signal.trim()}` : "إشارة التقدم", extra: responses.review_timing?.trim(), editStep: 7 },
    { number: "06", title: "تفضيل طريقة المتابعة", main: followupLabel, extraLabel: "تنبيه", extra: responses.followup_mode ? "هذا تفضيل داخل ملفك فقط؛ لا يُرسل طلب وساطة ولا ينشئ موعدًا أو غرفة صوتية." : "يمكنك اختيار الكتابة وحدها أو ترك التفضيل دون تحديد.", editStep: 7 },
    { number: "07", title: "قناة الدعوة المفضلة", main: inviteChannelLabel, extraLabel: "تنبيه", extra: inviteChannelLabel ? "هذا تفضيل محفوظ فقط؛ لم تُفعّل الدعوات ولا تُرسل رسالة عند الحفظ." : "لم تحدد قناة؛ الاختيار اختياري.", editStep: 7 },
  ];
  const resolutionMapText = [
    "خريطة قرار أولية — من رواية صاحب الملف فقط",
    ...resolutionCards.map(card => [
      `${card.number}. ${card.title}`,
      card.main,
      card.extra && `${card.extraLabel}: ${card.extra}`,
    ].filter(Boolean).join("\n")),
    "تنبيه: لم تتحقق المنصة من الوقائع، ولا تمثل هذه الخريطة وجهة الطرف الآخر أو وساطة فعلية أو رأيًا قانونيًا.",
  ].filter(Boolean).join("\n\n");

  async function copyResolutionMap() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(resolutionMapText);
      setMapCopyStatus("success");
    } catch {
      setMapCopyStatus("error");
    }
  }

  async function copyInvitationTemplate() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(invitationTemplate);
      setInvitationCopyStatus("success");
    } catch {
      setInvitationCopyStatus("error");
    }
  }

  function goTo(next: number) {
    setError("");
    if (next !== 8) setConsent(false);
    setStep(next);
    setExploreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 80);
  }

  function next() {

    if (step === 1 && safety !== "safe") return setError("اختر إجابة عن السلامة أولًا.");
    goTo(Math.min(step + 1, 8));
  }

  function changeResponse(key: string, value: string) {
    setError("");
    setMapCopyStatus("idle");
    setResponses(previous => ({ ...previous, [key]: value }));
  }

  function activeResponses() {
    const filtered: Responses = {};
    for (const question of allQuestions) {
      const value = responses[question.key]?.trim();
      if (value) filtered[question.key] = value;
    }
    for (const [key, value] of Object.entries(responses)) if (key.startsWith("meta_") && value) filtered[key] = value;
    return filtered;
  }

  function handleLogin() {
    setError("");
    try {
      if (keepForLogin) {
        sessionStorage.setItem(storageKey, JSON.stringify({ kind, country, safety, responses: activeResponses() }));
      } else {
        try { sessionStorage.removeItem(storageKey); } catch { /* Login does not depend on optional storage. */ }
      }
      startLogin(caseId ? `/journey/${caseId}` : "/journey");
    } catch {
      setError("تعذّر بدء تسجيل الدخول أو حفظ النسخة المؤقتة. تحقّق من إعدادات المتصفح وحاول مجددًا.");
    }
  }

  async function save() {
    setError("");
    if (!isAuthenticated) return setError("سجّل الدخول أولًا لحفظ الملف في حسابك.");
    if (!consent) return setError("يرجى تأكيد موافقتك على حفظ الملف قبل المتابعة.");
    if (safety !== "safe") return setError("يلزم تأكيد السلامة قبل حفظ ملف يتضمن تفاصيل الخلاف.");
    const filteredResponses = activeResponses();
    if (new TextEncoder().encode(JSON.stringify(filteredResponses)).length > 60000) return setError("الإجابات طويلة جدًا للحفظ. يرجى اختصار بعضها ثم المحاولة مجددًا.");
    let savedId: number;
    try {
      const data = { kind: kind || "individual", safety: "safe" as const, country: country.trim() || "غير محدد", responses: filteredResponses };
      if (caseId) {
        await updateCase.mutateAsync({ id: caseId, ...data, status: loadedStatus });
        savedId = caseId;
      } else {
        savedId = (await createCase.mutateAsync(data)).id;
      }
    } catch {
      setError("تعذّر حفظ الملف الآن. لم نتأكد من اكتمال الحفظ؛ تحقّق من اتصالك وحاول مرة أخرى.");
      return;
    }
    // Mark both caches stale without refetching the open editor or conflating a
    // cache refresh failure with a failed (and potentially duplicated) save.
    void Promise.allSettled([
      utils.cases.list.invalidate(undefined, { refetchType: "none" }),
      utils.cases.get.invalidate({ id: savedId }, { refetchType: "none" }),
    ]);
    try { sessionStorage.removeItem(storageKey); } catch { setStorageCleanupError(true); }
    setSavedCaseId(savedId);
    setSaved(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const awaitingCase = loadedId !== caseId || !caseQuery.isFetchedAfterMount;
  const caseLoadFailed = isAuthenticated && !caseQuery.isFetching && (caseQuery.isError || (caseQuery.isPaused && awaitingCase));
  const isLoadingCase = Boolean(caseId && (auth.isLoading || (isAuthenticated && awaitingCase && !caseLoadFailed)));
  const cannotLoad = Boolean(invalidId || (caseId && caseLoadFailed));

  return (
    <div className="journey" dir="rtl" lang="ar">
      <main className="journey-main">
        <div className="journey-topline"><Link href="/">الرئيسية</Link><span>/</span><span>رحلة إنشاء ملف</span></div>
        {isLoadingCase ? (
          <div className="journey-state"><LoaderCircle className="journey-spin" size={30} /><h1>جارٍ فتح الملف</h1><p>لحظة من فضلك.</p></div>
        ) : cannotLoad ? (
          <div className="journey-state"><CircleHelp size={32} /><h1>تعذّر فتح هذا الملف</h1><p>قد يكون الملف غير متاح أو لا تملك صلاحية الوصول إليه.</p><Link className="journey-button journey-button--primary" href="/cases">العودة إلى ملفاتي <ArrowLeft size={17} /></Link></div>
        ) : caseId && !isAuthenticated ? (
          <div className="journey-state"><LockKeyhole size={32} /><h1>سجّل دخولك لفتح الملف</h1><p>الملفات مرتبطة بالحساب الذي أنشأها. بعد تسجيل الدخول ستعود إلى الصفحة الرئيسية؛ افتح رابط الملف مرة أخرى.</p>{error && <p className="journey-error" role="alert">{error}</p>}<button className="journey-button journey-button--primary" onClick={handleLogin} type="button">تسجيل الدخول <ArrowLeft size={17} /></button></div>
        ) : !caseId && !isAuthenticated && !auth.isLoading ? (
          <div className="journey-state"><LockKeyhole size={32} /><span className="journey-eyebrow">الخطوة الأولى</span><h1>ابدأ بتسجيل الدخول</h1><p>أنشئ ملفًا مرتبطًا بحسابك لتتمكن من الرجوع إليه واستقبال دعوات الأطراف في صندوق الوارد والصادر. بعد الدخول ستعود مباشرة إلى رحلة صحيفة الود.</p>{error && <p className="journey-error" role="alert">{error}</p>}<button className="journey-button journey-button--primary" onClick={handleLogin} type="button">تسجيل الدخول <ArrowLeft size={17} /></button><p className="journey-field__hint">لن تُطلب منك بيانات الخلاف قبل تسجيل الدخول. يمكنك استخدام ملفاتك والدعوات بعد المصادقة.</p></div>
        ) : notEditable ? (
          <div className="journey-state"><FileText size={32} /><h1>هذا الملف غير متاح للتعديل هنا</h1><p>يمكنك العودة إلى قائمة ملفاتك للاطلاع على حالته.</p><Link className="journey-button journey-button--primary" href="/cases">العودة إلى ملفاتي <ArrowLeft size={17} /></Link></div>
        ) : saved ? (
          <div className="journey-state journey-state--success"><span className="journey-success-icon"><CheckCircle2 size={32} /></span><span className="journey-eyebrow">خطوة موفقة</span><h1>تم حفظ ملفك</h1><p>{caseId ? "حُفظت تعديلاتك في حسابك." : "حُفظت مسودتك في حسابك."} لم تُرسل دعوة إلى أي طرف ولم تتم مشاركة الملف عند الحفظ.</p>{storageCleanupError && <p className="journey-error" role="alert">تعذّر مسح النسخة المؤقتة من المتصفح؛ يرجى مسح بيانات الموقع على هذا الجهاز.</p>}{savedCaseId && <CaseResolutionTools caseId={savedCaseId} />}<Link className="journey-button journey-button--primary" href="/cases">الذهاب إلى ملفاتي <ArrowLeft size={17} /></Link></div>
        ) : (
          <div className="journey-layout">
            <aside className="journey-sidebar" aria-label="مراحل الرحلة">
              <div className="journey-sidebar__intro"><span className="journey-sidebar__kicker"><Sparkles size={14} /> رحلة الصلح</span><h2>خطوة نحو<br /><em>مساحة تفاهم.</em></h2><p>مساحة ترتّب فيها أفكارك، بالوتيرة التي تناسبك.</p></div>
              <div className="journey-sidebar__rule" />
              <ol className="journey-steps">
                {steps.map((item, index) => <li key={item.label} className={`${index === step ? "is-current" : ""} ${index < step ? "is-complete" : ""}`} aria-current={index === step ? "step" : undefined}><span className="journey-steps__number">{index < step ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span><span><strong>{item.label}</strong><small>{item.sub}</small></span></li>)}
              </ol>
              <div className="journey-sidebar__bottom"><span className="journey-sidebar__bottom-icon"><LockKeyhole size={17} /></span><p><strong>ابدأ بما ترتاح لمشاركته</strong><br />لا نطلب أسماء أو مستندات.</p></div>
              <span className="journey-sidebar__ornament" aria-hidden="true" />
            </aside>

            <section className="journey-content" aria-labelledby="journey-title">
              <div className="journey-progress-row"><span>رحلتك إلى الصلح</span><span>الخطوة {String(step + 1).padStart(2, "0")} <i>/</i> {String(steps.length).padStart(2, "0")}</span></div>
              <div className="journey-progress" role="progressbar" aria-label="تقدم الرحلة" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
              <div className="journey-content__body">
                {blocked ? (
                  <div className="journey-stop" role="status">
                    <span className="journey-stop__icon"><ShieldAlert size={25} /></span>
                    <span className="journey-eyebrow">سلامتك هي الأولوية</span>
                    <h1 id="journey-title" tabIndex={-1} ref={headingRef}>لنتوقف هنا الآن</h1>
                    <p>عندما يكون هناك خطر، أو لا تكون متأكدًا من الأمان، أو تفضّل عدم الإجابة، لا تتابع إعداد رواية النزاع أو مسار الوساطة هنا.</p>
                    <div className="journey-stop__guidance"><strong>ما الذي يمكنك فعله؟</strong><p>إذا كان الخطر مباشرًا، انتقل إلى مكان آمن إن أمكن واتصل بخدمات الطوارئ المحلية. يمكنك أيضًا طلب المساعدة من شخص موثوق أو جهة حماية مختصة في بلدك عندما يكون ذلك آمنًا.</p><p>هذه إرشادات عامة وليست خدمة طوارئ؛ لن يؤدي اختيارك إلى تواصل أو مراجعة من فريق.</p></div>
                    {storageCleanupError && <p className="journey-error" role="alert">تعذّر مسح النسخة المؤقتة من المتصفح؛ يمكنك مسح بيانات الموقع على هذا الجهاز عندما يكون ذلك آمنًا.</p>}
                    <button className="journey-button journey-button--secondary" type="button" onClick={() => { setSafety(""); goTo(1); }}><ArrowRight size={17} /> العودة</button>
                  </div>
                ) : (
                  <>
                    <div className="journey-heading"><span className="journey-eyebrow"><span /> {stageCopy[step].eyebrow}</span><h1 id="journey-title" tabIndex={-1} ref={headingRef}>{stageCopy[step].title}</h1><p>{stageCopy[step].description}</p></div>
                    {notice && <div className="journey-notice" role="status"><CheckCircle2 size={18} />{notice}</div>}
                    {step === 0 && <div className="journey-soft-note"><ShieldCheck size={18} /><span>هذه نواة تأسيسية؛ تجنّب إدخال بيانات حساسة قبل اكتمال المراجعة الأمنية والقانونية. <Link href="/trust">اقرأ عن الثقة والسلامة</Link>.</span></div>}
                    {step === 0 && <><div className="journey-kind-grid" role="group" aria-label="اختر نوع المسار">{kinds.map(({ id, title, description, Icon }) => <button type="button" aria-pressed={kind === id} key={id} className={`journey-kind ${kind === id ? "is-selected" : ""}`} onClick={() => { setKind(id); setError(""); }}><span className="journey-kind__icon"><Icon size={21} strokeWidth={1.6} /></span><span className="journey-kind__copy"><strong>{title}</strong><small>{description}</small></span><span className="journey-choice-dot">{kind === id && <Check size={12} />}</span></button>)}</div><div className="journey-branch-note"><CircleHelp size={16} /><span>تتغير الأسئلة مع نوع المسار. عند تغييره لا تدخل إجابات الأسئلة غير المنطبقة في المراجعة أو الحفظ؛ تبقى في هذه الجلسة إن عدت إلى مسارها السابق.</span></div></>}
                    {step === 1 && <div className="journey-safety-list" role="group" aria-label="هل تشعر بالأمان للمتابعة؟">{safetyOptions.map(option => <button key={option.value} className={`journey-safety-option ${safety === option.value ? "is-selected" : ""}`} type="button" aria-pressed={safety === option.value} onClick={() => { setSafety(option.value); setError(""); if (option.value !== "safe") { setConsent(false); setNotice(""); setStorageCleanupError(false); try { sessionStorage.removeItem(storageKey); } catch { setStorageCleanupError(true); } } }}><span className="journey-choice-dot">{safety === option.value && <Check size={12} />}</span><span><strong>{option.title}</strong><small>{option.description}</small></span></button>)}<div className="journey-soft-note"><ShieldCheck size={18} /><span>إذا كان هناك تهديد أو إكراه، فقد لا تكون متابعة الوساطة مناسبة الآن.</span></div></div>}
                    {step === 2 && <div className="journey-fields"><div className="journey-field"><label className="journey-field__label" htmlFor="journey-country">الدولة ذات الصلة بالخلاف </label><p className="journey-field__hint">اختياري — اكتب اسم الدولة أو اختر من الاقتراحات إن رغبت.</p><input id="journey-country" list="journey-countries" value={country} maxLength={80} onChange={event => { setCountry(event.target.value); setError(""); }} placeholder="مثال: السعودية" autoComplete="country-name" /><datalist id="journey-countries">{countries.map(item => <option value={item} key={item} />)}</datalist></div><div className="journey-soft-note"><Globe2 size={18} /><span>تختلف الأنظمة والسياقات من بلد لآخر. هذه الرحلة لا تقدّم استشارة قانونية.</span></div></div>}
                    {step >= 3 && step <= 7 && <div className="journey-fields">{visibleQuestions.map(question => <QuestionField key={question.key} question={question} value={responses[question.key] || ""} onChange={value => changeResponse(question.key, value)} />)}{hasExploreQuestions && <button className="journey-explore-toggle" type="button" aria-expanded={exploreOpen} onClick={() => setExploreOpen(open => !open)}>{exploreOpen ? "إخفاء الأسئلة الإضافية" : "استكشف بُعدًا إضافيًا — اختياري"}<ChevronDown size={16} /></button>}{step === 4 && <div className="journey-branch-note"><CircleHelp size={16} /><span>تتبدل أسئلة التفويض والإجراءات بحسب إجابتك؛ التفاصيل التابعة لإجابة لم تعد منطبقة لن تدخل المراجعة أو الحفظ، ويمكن استعادتها في هذه الجلسة بالعودة للاختيار السابق.</span></div>}<div className="journey-soft-note"><LockKeyhole size={18} /><span>يرجى تجنّب الأسماء وبيانات الهوية والتفاصيل الحساسة أو المستندات. الإجابات السردية اختيارية؛ تأكيد السلامة شرط وقائي.</span></div></div>}
                    {step === 8 && <div className="journey-review">
                      <section className="resolution-map" aria-labelledby="resolution-map-title">
                        <div className="resolution-map__header">
                          <div><span className="resolution-map__eyebrow">مخرَج الرحلة / مسودة قابلة للتعديل</span><h2 id="resolution-map-title">خريطة قرار أولية</h2><p>تجمع ما كتبته أنت؛ لا تستنتج موقف الطرف الآخر.</p></div>
                          <button type="button" className="resolution-map__copy" onClick={() => void copyResolutionMap()}><ClipboardList size={16} />{mapCopyStatus === "success" ? "نُسخت الخريطة" : mapCopyStatus === "error" ? "تعذّر النسخ" : "انسخ الخريطة"}</button>
                        </div>
                        <div className="resolution-map__grid">
                          {resolutionCards.map(card => <article className="resolution-map__card" key={card.number}>
                            <div className="resolution-map__card-top"><span>{card.number}</span><button type="button" onClick={() => goTo(card.editStep)} aria-label={`تعديل محور ${card.title}`}><Pencil size={13} /> تعديل</button></div>
                            <h3>{card.title}</h3>
                            <p className={card.main ? "" : "is-empty"}>{card.main || "لم تضف إجابة بعد؛ يمكنك الرجوع إليها أو تركها فارغة."}</p>
                            {card.extraLabel && <div className="resolution-map__extra"><span>{card.extraLabel}</span><p className={card.extra ? "" : "is-empty"}>{card.extra || "لم يُحدّد بعد."}</p></div>}
                          </article>)}
                        </div>
                        <div className="resolution-map__caveat"><ShieldCheck size={17} /><p><strong>من منظور واحد:</strong> ما يرد هنا إجاباتك أنت؛ لم تتحقق المنصة من الوقائع، ولم تسمع الطرف الآخر. الخريطة أداة تهيئة وليست وساطة فعلية أو اتفاقًا ملزمًا أو رأيًا قانونيًا.</p></div>
                        {mapCopyStatus === "error" && <p className="resolution-map__copy-status" role="status">تعذّر النسخ التلقائي على هذا الجهاز. تبقى الخريطة ظاهرة هنا ويمكنك العودة لتعديلها.</p>}
                      </section>
                      <div className="journey-review__section"><div className="journey-review__head"><div><span className="journey-review__icon"><Compass size={18} /></span><strong>أساس الملف</strong></div><button type="button" onClick={() => goTo(0)}><Pencil size={14} /> تعديل</button></div><div className="journey-review__pair"><span>المسار</span><strong>{selectedKind?.title}</strong></div><div className="journey-review__pair"><span>الدولة</span><strong>{country}</strong><button type="button" onClick={() => goTo(2)} aria-label="تعديل الدولة"><Pencil size={14} /></button></div><div className="journey-review__pair"><span>السلامة</span><strong>أشعر بالأمان للمتابعة</strong><button type="button" onClick={() => goTo(1)} aria-label="تعديل إجابة السلامة"><Pencil size={14} /></button></div></div>
                      {[3, 4, 5, 6, 7].map(index => <div className="journey-review__section" key={index}><div className="journey-review__head"><div><span className="journey-review__icon">{index === 3 ? <FileText size={18} /> : index === 4 ? <ClipboardList size={18} /> : index === 5 ? <Scale size={18} /> : index === 6 ? <Layers3 size={18} /> : <GitMerge size={18} />}</span><strong>{steps[index].label}</strong></div><button type="button" onClick={() => goTo(index)}><Pencil size={14} /> تعديل</button></div>{questionsFor(kind, index, responses).map(question => <div className="journey-review__answer" key={question.key}><span>{question.label}</span><p className={!responses[question.key]?.trim() ? "is-empty" : ""}>{displayAnswer(question, responses[question.key] || "")}</p></div>)}</div>)}
                      <div className="journey-consent"><label><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setError(""); }} /><span>أوافق على حفظ هذه المعلومات في ملف مرتبط بحسابي.</span></label><p>الحفظ لا يشارك الملف مع الأطراف الأخرى، ولا يرسل دعوات. يمكنك مراجعة الملف من صفحة «ملفاتي».</p></div>
                      <section className="journey-review__section" aria-labelledby="invitation-template-title"><div className="journey-review__head"><div><span className="journey-review__icon"><MessageCircle size={18} /></span><strong id="invitation-template-title">نص دعوة مقترح</strong></div><button type="button" onClick={() => void copyInvitationTemplate()}><ClipboardList size={14} />{invitationCopyStatus === "success" ? "نُسخ النص" : invitationCopyStatus === "error" ? "تعذّر النسخ" : "نسخ النص"}</button></div><p>{invitationTemplate}</p><p className="journey-field__hint">هذا نص مقترح للنسخ والمراجعة اليدوية فقط؛ لا ترسل المنصة رسالة ولا تشارك بيانات ملفك. تأكد من ملاءمة التواصل وسلامته قبل الإرسال.</p></section>
                      {!isAuthenticated && <div className="journey-login"><div className="journey-login__title"><LockKeyhole size={18} /><strong>تسجيل الدخول مطلوب للحفظ</strong></div><p>بعد تسجيل الدخول ستعود إلى الصفحة الرئيسية؛ افتح رحلة إنشاء الملف مجددًا. لن يُحفظ الملف في حسابك تلقائيًا، وستحتاج إلى مراجعته وتأكيد الحفظ.</p><label><input type="checkbox" checked={keepForLogin} onChange={event => setKeepForLogin(event.target.checked)} /><span>أوافق على حفظ نسخة مؤقتة من إجاباتي في متصفح هذا الجهاز خلال الجلسة لاستعادتها بعد الدخول. تُحذف بعد الحفظ، وقد يطّلع عليها مستخدم الجهاز.</span></label><p>دون هذا الخيار ستفقد الإجابات عند الانتقال لتسجيل الدخول.</p></div>}
                    </div>}
                    {error && <div className="journey-error" role="alert">{error}</div>}
                    <div className="journey-actions">
                      {step > 0 ? <button type="button" className="journey-button journey-button--back" onClick={() => goTo(step - 1)} disabled={busy}><ArrowRight size={17} /> السابق</button> : <span className="journey-actions__hint"><span /> خطوة واحدة في كل مرة</span>}
                      {step < 8 ? <button type="button" className="journey-button journey-button--primary" onClick={next}>متابعة <ArrowLeft size={17} /></button> : isAuthenticated ? <button type="button" className="journey-button journey-button--primary" disabled={busy || !consent} onClick={save}>{busy ? <><LoaderCircle className="journey-spin" size={17} /> جارٍ الحفظ</> : <>{caseId ? "حفظ التعديلات" : "حفظ الملف"} <ArrowLeft size={17} /></>}</button> : <button type="button" className="journey-button journey-button--primary" onClick={handleLogin}>تسجيل الدخول <ArrowLeft size={17} /></button>}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
        <footer className="journey-footer"><span>صالِحنا <i>•</i> لأن الصلح خير</span><span>كل خطوة تبدأ بالاستماع.</span></footer>
      </main>
    </div>
  );
}

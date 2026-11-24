import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowUpLeft,
  FileText,
  FolderOpen,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RotateCw,
  Send,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import "./Cases.css";

const kindLabels: Record<string, string> = {
  individual: "الأفراد",
  family: "الأسرة والعائلة",
  community: "المجتمع والقبائل",
  workplace: "بيئة العمل",
  business: "الأعمال والتجارة",
  organization: "المؤسسات والجهات",
  multi: "متعدد الأطراف",
  international: "عابر للحدود",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  paused: "متوقف مؤقتًا",
};

function displayValue(value: string, labels?: Record<string, string>) {
  const cleanValue = value?.trim();
  return cleanValue ? (labels?.[cleanValue] ?? cleanValue) : "غير محدد";
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "غير متاح";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function Cases() {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    refresh,
  } = useAuth();
  const userId = user?.id ?? null;
  const [loadedForUser, setLoadedForUser] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const utils = trpc.useUtils();
  const casesQuery = trpc.cases.list.useQuery(undefined, {
    enabled: isAuthenticated && !authLoading,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const deleteCase = trpc.cases.delete.useMutation();

  useEffect(() => {
    let cancelled = false;
    setLoadedForUser(null);
    if (userId !== null && !authLoading) {
      // Never expose a previous account's cached list while this account loads.
      void (async () => {
        await utils.cases.list.cancel();
        if (cancelled) return;
        const result = await casesQuery.refetch();
        if (!cancelled && result.isSuccess) setLoadedForUser(userId);
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading, utils.cases.list, casesQuery.refetch]);

  useEffect(() => {
    if (deletingId === null) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelButton.current?.focus();
    return () => previous?.focus();
  }, [deletingId]);

  const handleLogin = () => {
    setLoginError(false);
    try {
      startLogin();
    } catch {
      setLoginError(true);
    }
  };

  const closeDialog = () => {
    if (isDeleting) return;
    setDeletingId(null);
    deleteCase.reset();
  };

  const confirmDelete = async () => {
    if (deletingId === null || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCase.mutateAsync({ id: deletingId });
      await utils.cases.get.invalidate({ id: deletingId });
      await casesQuery.refetch();
      setDeletingId(null);
      deleteCase.reset();
    } catch {
      // The mutation's error is shown in the confirmation dialog.
    } finally {
      setIsDeleting(false);
    }
  };

  const hasLoadedCases =
    isAuthenticated &&
    !authLoading &&
    loadedForUser === userId &&
    !casesQuery.isFetching &&
    !casesQuery.isError;

  return (
    <main className="cases-page" dir="rtl" lang="ar">
      <div className="cases-shell">
        <div className="cases-breadcrumb" aria-label="الموقع الحالي">
          <span>المساحة الشخصية</span>
          <span className="cases-breadcrumb-divider" aria-hidden="true">
            /
          </span>
          <span>ملفاتي</span>
        </div>

        <header className="cases-heading">
          <div className="cases-heading-copy">
            <div className="cases-eyebrow">
              <span /> مساحتك الشخصية
            </div>
            <h1>
              ملفاتك، في مكان واحد<span className="cases-heading-dot">.</span>
            </h1>
            <p>مساحة خاصة لترتيب ما يهمّك، والعودة إلى رحلتك متى احتجت.</p>
          </div>
          <div className="cases-heading-actions">
            {isAuthenticated && (
              <Link className="cases-button cases-button-outline" href="/invitations">
                <Send size={17} /> الدعوات
              </Link>
            )}
            <Link
              className="cases-button cases-button-primary cases-heading-action"
              href="/journey"
            >
              <Plus size={19} strokeWidth={1.8} />
              <span>ابدأ ملفًا جديدًا</span>
              <ArrowUpLeft
                className="cases-button-arrow"
                size={16}
                strokeWidth={1.8}
              />
            </Link>
          </div>
        </header>

        <div className="cases-layout">
          <section
            className="cases-main-section"
            aria-labelledby="cases-list-title"
          >
            <div className="cases-section-heading">
              <div>
                <span className="cases-section-kicker">
                  مساحة للعودة والمتابعة
                </span>
                <h2 id="cases-list-title">ملفاتي المحفوظة</h2>
              </div>
              {hasLoadedCases && casesQuery.data && (
                <span className="cases-count">
                  {casesQuery.data.length} ملف
                </span>
              )}
            </div>

            {authLoading ? (
              <div className="cases-state" role="status">
                <LoaderCircle className="cases-spinner" size={27} />
                <h3>جارٍ التحقق من حسابك</h3>
                <p>لحظة واحدة من فضلك.</p>
              </div>
            ) : !isAuthenticated && authError ? (
              <div className="cases-state" role="alert">
                <div className="cases-state-icon cases-state-icon-warning">
                  <TriangleAlert size={25} />
                </div>
                <h3>تعذّر التحقق من الحساب</h3>
                <p>يرجى المحاولة مرة أخرى.</p>
                <button
                  className="cases-button cases-button-outline"
                  type="button"
                  onClick={() => void refresh()}
                >
                  <RotateCw size={17} /> إعادة المحاولة
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="cases-state cases-state-welcome">
                <div className="cases-state-icon">
                  <LockKeyhole size={27} strokeWidth={1.5} />
                </div>
                <span className="cases-state-overline">مساحتك تبدأ من هنا</span>
                <h3>سجّل الدخول لعرض ملفاتك</h3>
                <p>ستجد ملفاتك المحفوظة هنا بعد تسجيل الدخول إلى حسابك.</p>
                <button
                  className="cases-button cases-button-primary"
                  type="button"
                  onClick={handleLogin}
                >
                  تسجيل الدخول <ArrowLeft size={17} />
                </button>
                {loginError && (
                  <p className="cases-inline-error" role="alert">
                    تعذّر بدء تسجيل الدخول. يرجى المحاولة لاحقًا.
                  </p>
                )}
              </div>
            ) : casesQuery.isFetching ||
              (!casesQuery.isError && loadedForUser !== userId) ? (
              <div className="cases-state" role="status">
                <LoaderCircle className="cases-spinner" size={27} />
                <h3>جارٍ تحميل ملفاتك</h3>
                <p>لحظة واحدة من فضلك.</p>
              </div>
            ) : casesQuery.isError ? (
              <div className="cases-state" role="alert">
                <div className="cases-state-icon cases-state-icon-warning">
                  <TriangleAlert size={25} />
                </div>
                <h3>تعذّر تحميل الملفات</h3>
                <p>تحقق من اتصالك وحاول مرة أخرى.</p>
                <button
                  className="cases-button cases-button-outline"
                  type="button"
                  onClick={() =>
                    void casesQuery.refetch().then(result => {
                      if (result.isSuccess) setLoadedForUser(userId);
                    })
                  }
                >
                  <RotateCw size={17} /> إعادة المحاولة
                </button>
              </div>
            ) : !casesQuery.data?.length ? (
              <div className="cases-state cases-state-empty">
                <div className="cases-state-icon">
                  <FolderOpen size={29} strokeWidth={1.5} />
                </div>
                <span className="cases-state-overline">خطوة أولى على مهل</span>
                <h3>لا توجد ملفات محفوظة بعد</h3>
                <p>حين تبدأ رحلة وتحفظها، ستظهر هنا لتعود إليها في أي وقت.</p>
                <Link
                  className="cases-button cases-button-outline"
                  href="/journey"
                >
                  <Plus size={18} /> ابدأ ملفًا جديدًا
                </Link>
              </div>
            ) : (
              <div className="cases-list">
                {casesQuery.data.map(item => (
                  <article className="cases-card" key={item.id}>
                    <div className="cases-card-top">
                      <div className="cases-card-title-wrap">
                        <div className="cases-file-icon">
                          <FileText size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                          <span className="cases-card-overline">ملف محفوظ</span>
                          <h3>
                            ملف <span dir="ltr">#{item.id}</span>
                          </h3>
                        </div>
                      </div>
                      <span className="cases-status">
                        <span />
                        {displayValue(item.status, statusLabels)}
                      </span>
                    </div>
                    <dl className="cases-card-details">
                      <div>
                        <dt>نوع الخلاف</dt>
                        <dd>{displayValue(item.kind, kindLabels)}</dd>
                      </div>
                      <div>
                        <dt>البلد</dt>
                        <dd>{displayValue(item.country)}</dd>
                      </div>
                      <div>
                        <dt>آخر تعديل</dt>
                        <dd>{formatDate(item.updatedAt)}</dd>
                      </div>
                    </dl>
                    <div className="cases-card-actions">
                      <Link
                        className="cases-open-link"
                        href={`/journey/${item.id}`}
                      >
                        فتح الملف <ArrowLeft size={16} />
                      </Link>
                      <button
                        className="cases-delete-button"
                        type="button"
                        onClick={() => {
                          deleteCase.reset();
                          setDeletingId(item.id);
                        }}
                        aria-label={`حذف الملف رقم ${item.id}`}
                      >
                        <Trash2 size={16} /> <span>حذف</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="cases-aside" aria-label="عن ملفاتك">
            <div className="cases-aside-topline">
              <span>مساحتك</span>
              <LockKeyhole size={17} strokeWidth={1.5} />
            </div>
            <div className="cases-aside-mark" aria-hidden="true">
              <span />
              <span />
            </div>
            <h2>
              كل خطوة
              <br />
              تبدأ بالإنصات.
            </h2>
            <p>
              تظهر هنا الملفات التي تحفظها في حسابك، لتتمكن من مراجعتها والعودة
              إليها.
            </p>
            <div className="cases-aside-divider" />
            <p className="cases-aside-note">
              حفظ الملف لا يرسل دعوة إلى أي طرف، ولا ينشئ جلسة صلح.
            </p>
          </aside>
        </div>
        <div className="cases-bottom-note">
          <span /> مساحة للتفكير، وخطوة نحو التفاهم.
        </div>
      </div>

      {deletingId !== null && (
        <div className="cases-modal-backdrop">
          <div
            className="cases-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cases-delete-title"
            aria-describedby="cases-delete-description"
            onKeyDown={event => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeDialog();
              }
              if (event.key === "Tab") {
                const buttons = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)"
                  )
                );
                if (!buttons.length) {
                  event.preventDefault();
                  return;
                }
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <div className="cases-modal-top">
              <div className="cases-modal-icon">
                <Trash2 size={21} />
              </div>
              <button
                className="cases-modal-close"
                type="button"
                onClick={closeDialog}
                disabled={isDeleting}
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="cases-delete-title">حذف هذا الملف؟</h2>
            <p id="cases-delete-description">
              سيُحذف الملف رقم <span dir="ltr">#{deletingId}</span> من ملفات حسابك،
              ولا يمكن استعادته من داخل المنصة.
            </p>
            {deleteCase.isError && (
              <p className="cases-inline-error" role="alert">
                تعذّر حذف الملف. يرجى المحاولة مرة أخرى.
              </p>
            )}
            <div className="cases-modal-actions">
              <button
                className="cases-button cases-button-danger"
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle className="cases-spinner" size={17} /> جارٍ
                    الحذف
                  </>
                ) : (
                  "نعم، احذف الملف"
                )}
              </button>
              <button
                ref={cancelButton}
                className="cases-button cases-button-outline"
                type="button"
                onClick={closeDialog}
                disabled={isDeleting}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

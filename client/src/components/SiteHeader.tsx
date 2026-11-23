import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand-light" : ""}`} aria-label="صالِحنا — الصفحة الرئيسية">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none"><path d="M9 14h12a12 12 0 0 1 0 24H9" stroke="#4656e8" strokeWidth="3.1" strokeLinecap="round"/><path d="M43 38H31a12 12 0 0 1 0-24h12" stroke="#f57561" strokeWidth="3.1" strokeLinecap="round"/><circle cx="26" cy="26" r="3.7" fill="#f1ce62"/></svg>
      </span>
      <span className="brand-type"><strong>صالِحنا</strong><span>SALIHNA</span></span>
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const close = () => setOpen(false);
  const handleLogout = async () => {
    if (logoutPending) return;
    setLogoutPending(true);
    setLogoutError(false);
    try {
      await logout();
      try {
        sessionStorage.removeItem("salihna-journey-login-draft-v1");
        localStorage.removeItem("manus-runtime-user-info");
      } catch { /* Browser storage may be unavailable. */ }
      queryClient.clear();
      window.location.assign("/");
    } catch {
      setLogoutError(true);
      setLogoutPending(false);
    }
  };
  return (
    <header className="site-header" dir="rtl">
      <div className="header-inner shell">
        <Brand />
        <nav className={`nav-links ${open ? "nav-open" : ""}`} aria-label="التنقل الرئيسي">
          <a href="/" onClick={close} className={location === "/" ? "active" : ""}>الرئيسية</a>
          <a href="/#paths" onClick={close}>مسارات الإصلاح</a>
          <a href="/#how-it-works" onClick={close}>خريطة القرار</a>
          <a href="/#business" onClick={close}>للأعمال والمؤسسات</a>
          <Link href="/dialogue" onClick={close}>أداة الحوار</Link>
          <span className="mobile-nav-actions"><Link href="/cases" onClick={close}>ملفاتي</Link><Link href="/journey" onClick={close}>ابدأ رحلة الصلح</Link>{isAuthenticated && <button type="button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? "جارٍ الخروج..." : "تسجيل الخروج"}</button>}</span>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? <Link href="/cases" className="account-link">ملفاتي</Link> : <button className="account-link" onClick={() => startLogin()}>تسجيل الدخول</button>}
          {isAuthenticated && <button className="account-link logout-link" type="button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? "جارٍ الخروج..." : "خروج"}</button>}
          <Link className="header-cta" href="/journey">ارسم خريطة خلافك <ArrowLeft size={16}/></Link>
        </div>
        <button className="mobile-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
      {logoutError && <div className="logout-error" role="alert">تعذّر تسجيل الخروج. يرجى التحقق من الاتصال والمحاولة مرة أخرى.</div>}
    </header>
  );
}

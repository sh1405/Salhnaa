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
        <svg viewBox="0 0 52 52" fill="none"><path d="M25.9 6.5c-7.8 0-14.6 6.2-14.6 14.3 0 7.7 7.2 15.3 14.6 23.7 7.4-8.4 14.6-16 14.6-23.7 0-8.1-6.8-14.3-14.6-14.3Z" stroke="currentColor" strokeWidth="2"/><path d="M13 15.5c2.8 6.1 6.9 9 13 9s10.2-2.9 13-9M16.6 32.6c3-2.5 6-3.7 9.4-3.7s6.4 1.2 9.4 3.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
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
          <a href="/#approach" onClick={close}>منهجيتنا</a>
          <a href="/#business" onClick={close}>للأعمال والمؤسسات</a>
          <Link href="/dialogue" onClick={close}>أداة الحوار</Link>
          <span className="mobile-nav-actions"><Link href="/cases" onClick={close}>ملفاتي</Link><Link href="/journey" onClick={close}>ابدأ رحلة الصلح</Link>{isAuthenticated && <button type="button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? "جارٍ الخروج..." : "تسجيل الخروج"}</button>}</span>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? <Link href="/cases" className="account-link">ملفاتي</Link> : <button className="account-link" onClick={() => startLogin()}>تسجيل الدخول</button>}
          {isAuthenticated && <button className="account-link logout-link" type="button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? "جارٍ الخروج..." : "خروج"}</button>}
          <Link className="header-cta" href="/journey">ابدأ رحلة الصلح <ArrowLeft size={16}/></Link>
        </div>
        <button className="mobile-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
      {logoutError && <div className="logout-error" role="alert">تعذّر تسجيل الخروج. يرجى التحقق من الاتصال والمحاولة مرة أخرى.</div>}
    </header>
  );
}

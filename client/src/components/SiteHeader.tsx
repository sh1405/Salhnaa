import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";
import { navigateToLogin } from "@/const";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand-light" : ""}`} aria-label="صالِحنا — الصفحة الرئيسية">
      <img className="brand-logo-image" src={`${import.meta.env.BASE_URL}salihna-logo-forest-transparent.webp`} alt="" />
      <span className="brand-wordmark" aria-hidden="true">صالِحنا</span>
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
          <Link href="/" onClick={close} className={location === "/" ? "active" : ""}>الرئيسية</Link>
          <Link href="/trust" onClick={close} className={location === "/trust" ? "active" : ""}>الثقة والسلامة</Link>
          {isAuthenticated && <Link href="/invitations" onClick={close} className={location === "/invitations" ? "active" : ""}>الدعوات</Link>}
          <span className="mobile-nav-actions">
            {isAuthenticated ? <>
              <Link href="/cases" onClick={close}>ملفاتي</Link>
              <Link href="/invitations" onClick={close}>صندوق الدعوات</Link>
              <button type="button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? "جارٍ الخروج..." : "تسجيل الخروج"}</button>
            </> : <button className="mobile-login-button" type="button" onClick={() => { close(); navigateToLogin("/journey"); }}>تسجيل الدخول أو إنشاء حساب</button>}
          </span>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? <><Link href="/cases" className="account-link">ملفاتي</Link><Link href="/invitations" className="account-link">الدعوات</Link><button className="account-link logout-link" type="button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? "جارٍ الخروج..." : "خروج"}</button></> : <button className="account-link header-login" type="button" onClick={() => navigateToLogin("/journey")}>دخول / حساب جديد <span aria-hidden="true">←</span></button>}
        </div>
        <button className="mobile-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
      {logoutError && <div className="logout-error" role="alert">تعذّر تسجيل الخروج. يرجى التحقق من الاتصال والمحاولة مرة أخرى.</div>}
    </header>
  );
}

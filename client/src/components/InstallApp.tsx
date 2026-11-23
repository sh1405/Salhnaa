import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallChoiceEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallApp() {
  const [installEvent, setInstallEvent] = useState<InstallChoiceEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallChoiceEvent);
    };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed || hidden) return null;
  const install = async () => {
    if (!installEvent) { setShowHelp(true); return; }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  };

  return <>
    <aside className="install-app" aria-label="تثبيت صالِحنا كتطبيق ويب">
      <button type="button" onClick={install}><Download size={17} aria-hidden="true"/><span>{installEvent ? "أضف صالِحنا إلى هاتفك" : "طريقة تثبيت صالِحنا"}</span></button>
      <button className="install-app__close" type="button" aria-label="إخفاء التلميح" onClick={() => setHidden(true)}><X size={16}/></button>
    </aside>
    {showHelp && <div className="install-dialog-backdrop" role="presentation" onClick={() => setShowHelp(false)}>
      <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="install-dialog__close" aria-label="إغلاق" onClick={() => setShowHelp(false)}><X size={18}/></button>
        <span className="install-dialog__eyebrow">نسخة الويب على جهازك</span>
        <h2 id="install-title">افتح صالِحنا كتطبيق</h2>
        <p>من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق». ستفتح المنصة في نافذة مستقلة. يلزم اتصال بالإنترنت لتسجيل الدخول والوصول إلى الملفات.</p>
        <button type="button" className="install-dialog__done" onClick={() => setShowHelp(false)}>حسنًا، فهمت</button>
      </section>
    </div>}
  </>;
}

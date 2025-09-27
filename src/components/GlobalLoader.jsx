import { useEffect, useState } from "react";
import { APP_LOADING_EVENT } from "../services/loader";

export default function GlobalLoader({ label = "កំពុងទាញទិន្នន័យ..." }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onEvt = (e) => setActive(e?.detail?.active ?? 0);
    window.addEventListener(APP_LOADING_EVENT, onEvt);
    return () => window.removeEventListener(APP_LOADING_EVENT, onEvt);
  }, []);

  if (active <= 0) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white/90 rounded-2xl shadow-xl px-6 py-5 flex items-center gap-3">
        <span className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-brand animate-spin" />
        <span className="text-sm text-gray-800">{label}</span>
      </div>
    </div>
  );
}

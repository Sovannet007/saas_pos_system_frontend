import { useEffect } from "react";
import { App } from "antd";
import { NOTIFY_EVENT } from "../services/notify";

export default function GlobalNotifier() {
  const { notification } = App.useApp();

  useEffect(() => {
    const handler = (e) => {
      const { type, message, description } = e.detail || {};
      notification[type || "info"]({
        message: message || "",
        description: description || "",
        placement: "topRight",
      });
    };
    window.addEventListener(NOTIFY_EVENT, handler);
    return () => window.removeEventListener(NOTIFY_EVENT, handler);
  }, [notification]);

  return null;
}

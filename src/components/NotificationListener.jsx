// src/components/NotificationListener.jsx
import { useEffect } from "react";
import { App as AntApp } from "antd";
import { NOTIFY_EVENT } from "../services/notify";

export default function NotificationListener() {
  const { notification } = AntApp.useApp();

  useEffect(() => {
    const handler = (e) => {
      const { type, message, description } = e.detail;
      notification[type]({
        message,
        description,
        placement: "topRight",
      });
    };

    window.addEventListener(NOTIFY_EVENT, handler);
    return () => window.removeEventListener(NOTIFY_EVENT, handler);
  }, [notification]);

  return null; // invisible component
}

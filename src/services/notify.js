export const NOTIFY_EVENT = "app:notify";

export function notify({ type = "info", message = "", description = "" }) {
  window.dispatchEvent(
    new CustomEvent(NOTIFY_EVENT, {
      detail: { type, message, description },
    })
  );
}

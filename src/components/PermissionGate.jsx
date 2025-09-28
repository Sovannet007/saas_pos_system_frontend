export default function PermissionGate({ when, children, fallback = null }) {
  if (!when) return fallback;
  return children;
}

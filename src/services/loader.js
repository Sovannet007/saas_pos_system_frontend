// src/services/loader.js
export const APP_LOADING_EVENT = "app:loading";

// minimum time the loader stays visible per "burst"
const MIN_DISPLAY_MS = 1200;

let activeCount = 0;
let burstStartAt = 0;
let hideTimer = null;

function dispatch(show) {
  // Maintain backward compatibility with GlobalLoader (listening to 'active')
  const active = show ? 1 : 0;
  window.dispatchEvent(
    new CustomEvent(APP_LOADING_EVENT, { detail: { active } })
  );
}

export function loadingStart() {
  // cancel any scheduled hide if a new request starts
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  activeCount += 1;

  // first request in this burst → show immediately and timestamp
  if (activeCount === 1) {
    burstStartAt = Date.now();
    dispatch(true);
  }
}

export function loadingStop() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount > 0) return; // still busy

  // no more active requests → enforce minimum visible duration
  const elapsed = Date.now() - burstStartAt;
  const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

  if (remaining === 0) {
    dispatch(false);
  } else {
    hideTimer = setTimeout(() => {
      hideTimer = null;
      dispatch(false);
    }, remaining);
  }
}

export function loadingReset() {
  activeCount = 0;
  burstStartAt = 0;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  dispatch(false);
}

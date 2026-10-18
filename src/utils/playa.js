const KEY = "parkking_playa";

export function esStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function esMovil() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function esIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function prefierePlaya() {
  const saved = localStorage.getItem(KEY);
  if (saved === "1") return true;
  if (saved === "0") return false;
  return esStandalone() || esMovil();
}

export function setPrefierePlaya(on) {
  localStorage.setItem(KEY, on ? "1" : "0");
}

export function destinoPostLogin() {
  return prefierePlaya() ? "/playa" : "/mi-estacionamiento";
}

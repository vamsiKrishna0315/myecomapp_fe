"use client";

import { clearStoredCart } from "./cartStorage";

export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("session-latitude");
  sessionStorage.removeItem("session-longitude");
  sessionStorage.removeItem("userLocation");
  localStorage.removeItem("Token");
  localStorage.removeItem("Customer_id");
  localStorage.removeItem("User_name");
  localStorage.removeItem("User_first_name");
  localStorage.removeItem("User_last_name");
  localStorage.removeItem("User_mobile");
  localStorage.removeItem("User_email");
  localStorage.removeItem("User_addresses");
  clearStoredCart();
}

export function triggerUnauthorizedLogout() {
  if (typeof window === "undefined") return;

  if (window.__authLogoutInProgress) return;
  window.__authLogoutInProgress = true;

  clearAuthStorage();
  window.dispatchEvent(new Event("userLoggedOut"));
  window.dispatchEvent(new Event("authUnauthorized"));

  window.setTimeout(() => {
    window.__authLogoutInProgress = false;
  }, 0);
}

export function promptLogin(router) {
  if (typeof window === "undefined") return;

  router.push("/");
  window.setTimeout(() => {
    window.dispatchEvent(new Event("openAuthDrawer"));
  }, 50);
}

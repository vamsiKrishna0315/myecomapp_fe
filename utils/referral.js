"use client";

const REFERRAL_CODE_KEY = "ReferralCode";
const REFERRAL_SESSION_KEY = "ReferralSessionKey";

function generateSessionKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getReferralSessionKey() {
  if (typeof window === "undefined") return null;

  try {
    let sessionKey = localStorage.getItem(REFERRAL_SESSION_KEY);
    if (!sessionKey) {
      sessionKey = generateSessionKey();
      localStorage.setItem(REFERRAL_SESSION_KEY, sessionKey);
    }
    return sessionKey;
  } catch (_) {
    return null;
  }
}

export function getStoredReferralCode() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(REFERRAL_CODE_KEY);
  } catch (_) {
    return null;
  }
}

export function setStoredReferralCode(code) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(REFERRAL_CODE_KEY, code);
  } catch (_) {
    // ignore storage failures
  }
}

export function clearStoredReferralCode() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(REFERRAL_CODE_KEY);
    localStorage.removeItem(REFERRAL_SESSION_KEY);
  } catch (_) {
    // ignore storage failures
  }
}

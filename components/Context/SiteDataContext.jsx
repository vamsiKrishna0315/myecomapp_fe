"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildSiteDataUrl } from "../../utils/siteDataConfig";

// Expose a global context for site data fetched from a single API
export const SiteDataContext = createContext({
  siteData: null,
  loading: true,
  error: null,
  refresh: async () => {},
  assetUrl: (path) => path,
});

const CACHE_KEY = "siteDataCache_v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(url || "");
}

function buildAssetUrl(path) {
  if (!path) return path;
  if (isAbsoluteUrl(path)) return path;
  const assetsBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const sep = assetsBase.endsWith("/") ? "" : "/";
  return assetsBase ? `${assetsBase}${sep}${path.replace(/^\//, "")}` : path;
}

export function SiteDataProvider({ children, initialSiteData = null }) {
  const [siteData, setSiteData] = useState(initialSiteData);
  const [loading, setLoading] = useState(!initialSiteData);
  const [error, setError] = useState(null);

  const loadFromCache = () => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(CACHE_KEY) : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.ts) return null;
      const fresh = Date.now() - parsed.ts < CACHE_TTL_MS;
      return fresh ? parsed.data : null;
    } catch (_) {
      return null;
    }
  };

  const saveToCache = (data) => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch (_) {
      // ignore storage failures
    }
  };

  const fetchSiteData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildSiteDataUrl();
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch site data: ${res.status}`);
      const json = await res.json();
      const data = json && json.data ? json.data : json;
      console.log("Site data API result:", data);

      setSiteData(data);
      saveToCache(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSiteData) {
      console.log("Site data API result:", initialSiteData);
      return;
    }

    const cached = loadFromCache();
    if (cached) {
      console.log("Site data API result:", cached);
      setSiteData(cached);
      setLoading(false);
      // also refresh in background
      fetchSiteData();
    } else {
      fetchSiteData();
    }
  }, [fetchSiteData, initialSiteData]);

  const value = useMemo(
    () => ({ siteData, loading, error, refresh: fetchSiteData, assetUrl: buildAssetUrl }),
    [siteData, loading, error, fetchSiteData]
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}

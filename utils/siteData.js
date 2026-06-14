import { cache } from "react";
import { buildSiteDataUrl } from "./siteDataConfig";

export const getSiteData = cache(async () => {
  const url = buildSiteDataUrl();

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Site data request failed with status ${res.status} for ${url}`);
      return null;
    }

    const json = await res.json();
    const data = json?.data ?? json;
    console.log("Site data API result:", data);
    return data;
  } catch (error) {
    console.warn(`Site data request failed for ${url}:`, error);
    return null;
  }
});

export async function getRequiredSiteData() {
  const siteData = await getSiteData();

  if (!siteData) {
    throw new Error("Site data is unavailable. The backend may be down.");
  }

  return siteData;
}

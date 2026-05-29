import { cache } from "react";
import { buildSiteDataUrl } from "./siteDataConfig";

export const getSiteData = cache(async () => {
  const res = await fetch(buildSiteDataUrl(), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch site data: ${res.status}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;
  console.log("Site data API result:", data);
  return data;
});

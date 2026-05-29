function getBaseUrl() {
  return process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
}

export function buildSiteDataUrl() {
  const base = getBaseUrl();
  const apiType = process.env.NEXT_PUBLIC_API_TYPE || process.env.API_TYPE || "customer";
  const sep = base.endsWith("/") ? "" : "/";
  return `${base}${sep}api/v1/${apiType}/site/site-data`;
}

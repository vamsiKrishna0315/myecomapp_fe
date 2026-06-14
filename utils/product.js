function getBaseUrl() {
  return process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
}

export function buildProductApiUrl(productId) {
  const base = getBaseUrl();
  const apiType = process.env.NEXT_PUBLIC_API_TYPE || process.env.API_TYPE || "customer";
  const sep = base.endsWith("/") ? "" : "/";
  return `${base}${sep}api/v1/${apiType}/products/${productId}`;
}

export async function getProductById(productId) {
  if (!productId) {
    return null;
  }

  const url = buildProductApiUrl(productId);

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Product request failed with status ${res.status} for ${url}`);
      return null;
    }

    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch (error) {
    console.warn(`Product request failed for ${url}:`, error);
    return null;
  }
}

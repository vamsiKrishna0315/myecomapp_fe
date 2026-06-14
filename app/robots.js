import { getSiteData } from "../utils/siteData";
import { resolveSiteUrl } from "../utils/seo";

function isProductionIndexable(siteUrl) {
  if (!siteUrl) {
    return false;
  }

  try {
    const url = new URL(siteUrl);
    const hostname = url.hostname.toLowerCase();

    if (process.env.NODE_ENV !== "production") {
      return false;
    }

    if (hostname === "localhost" || hostname.endsWith(".test")) {
      return false;
    }

    return true;
  } catch (_) {
    return false;
  }
}

export default async function robots() {
  const siteData = await getSiteData();
  const siteUrl = resolveSiteUrl(siteData);
  const allowIndexing = isProductionIndexable(siteUrl);

  if (!allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: [],
      host: siteUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/profile",
          "/orders",
          "/order",
          "/track-order",
          "/checkout",
          "/new-checkout",
          "/raise-query",
          "/api",
        ],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`],
    host: siteUrl,
  };
}

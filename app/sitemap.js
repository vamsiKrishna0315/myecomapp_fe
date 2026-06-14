import { getSiteData } from "../utils/siteData";
import { buildProductRoutePath, getCategorySlug, resolveSiteUrl } from "../utils/seo";

function isIndexableSite(siteUrl) {
  if (!siteUrl) {
    return false;
  }

  try {
    const url = new URL(siteUrl);
    const hostname = url.hostname.toLowerCase();
    return hostname !== "localhost" && !hostname.endsWith(".test");
  } catch (_) {
    return false;
  }
}

function isLiveCategory(category) {
  return (category?.is_live ?? 1) && (category?.status ?? 1);
}

function isLiveProduct(product) {
  const status = product?.status;
  const isVisible = product?.is_visible ?? true;
  const statusIsActive = status === undefined || status === null || status === 1 || status === "1" || status === true || status === "active";

  return isVisible && statusIsActive;
}

export default async function sitemap() {
  const siteData = await getSiteData();
  const siteUrl = resolveSiteUrl(siteData);

  if (!isIndexableSite(siteUrl)) {
    return [];
  }

  const categories = Array.isArray(siteData?.categories) ? siteData.categories.filter(isLiveCategory) : [];
  const productMap = new Map();

  for (const category of categories) {
    const products = Array.isArray(category?.products) ? category.products : [];
    for (const product of products) {
      if (product?.id && isLiveProduct(product)) {
        productMap.set(String(product.id), product);
      }
    }
  }

  const staticEntries = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const categoryEntries = categories
    .map((category) => getCategorySlug(category))
    .filter(Boolean)
    .map((slug) => ({
      url: `${siteUrl}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const productEntries = Array.from(productMap.values()).map((product) => ({
    url: `${siteUrl}${buildProductRoutePath(product)}`,
    lastModified: product?.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}

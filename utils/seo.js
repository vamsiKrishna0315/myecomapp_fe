const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_SITE_NAME = "Yumeat";
const DEFAULT_DESCRIPTION =
  "Order fresh, hygienically processed meat, poultry, and seafood online with reliable doorstep delivery.";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeUrl(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch (_) {
    return null;
  }
}

function toAbsoluteUrl(value, siteUrl) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch (_) {
    try {
      return new URL(value, `${siteUrl}/`).toString();
    } catch (_) {
      return null;
    }
  }
}

function getAssetBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    process.env.BACKEND_BASE_URL ||
    ""
  );
}

function buildAssetUrl(path, siteUrl) {
  if (!isNonEmptyString(path)) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return toAbsoluteUrl(path, siteUrl);
  }

  const assetBase = getAssetBaseUrl();
  if (assetBase) {
    return toAbsoluteUrl(path.replace(/^\//, ""), assetBase);
  }

  return toAbsoluteUrl(path, siteUrl);
}

function normalizeSlug(value) {
  if (!isNonEmptyString(value)) {
    return "";
  }

  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed === "" || trimmed === "/") {
    return "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function slugifySegment(value) {
  if (!isNonEmptyString(value)) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(value) {
  if (!isNonEmptyString(value)) {
    return "";
  }

  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getStoreName(siteData) {
  return siteData?.store_data?.name || DEFAULT_SITE_NAME;
}

export function resolveSiteUrl(siteData) {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    siteData?.store_data?.website,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    DEFAULT_SITE_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_SITE_URL;
}

function findHomepageMetaTag(siteData, siteUrl) {
  const metaTags = Array.isArray(siteData?.meta_tags) ? siteData.meta_tags : [];

  return (
    metaTags.find((tag) => {
      const canonical = normalizeUrl(tag?.seo?.canonical || tag?.canonical_url);
      const slug = normalizeSlug(tag?.metaable?.slug);
      const metaableType = tag?.metaable_type || tag?.metaable_type_name || "";

      return (
        canonical === siteUrl ||
        slug === "/" ||
        slug === "/home" ||
        (metaableType.endsWith("\\Page") && (slug === "/" || slug === ""))
      );
    }) ||
    metaTags.find((tag) => {
      const metaableType = tag?.metaable_type || tag?.metaable_type_name || "";
      const slug = normalizeSlug(tag?.metaable?.slug);
      return metaableType.endsWith("\\Page") && (slug === "/" || slug === "/home");
    }) ||
    null
  );
}

function getStoreTwitterHandle(siteData) {
  const twitter = siteData?.store_data?.twitter;
  if (!isNonEmptyString(twitter)) {
    return null;
  }

  if (twitter.startsWith("@")) {
    return twitter;
  }

  const match = twitter.match(/twitter\.com\/([A-Za-z0-9_]+)/i);
  return match?.[1] ? `@${match[1]}` : null;
}

function getDefaultImage(siteData, siteUrl, homepageMetaTag = null) {
  return (
    buildAssetUrl(homepageMetaTag?.seo?.openGraph?.image, siteUrl) ||
    buildAssetUrl(homepageMetaTag?.seo?.twitter?.image, siteUrl) ||
    buildAssetUrl(siteData?.store_data?.logo_url, siteUrl) ||
    buildAssetUrl(siteData?.store_data?.favicon_url, siteUrl) ||
    toAbsoluteUrl("/logo192.png", siteUrl)
  );
}

function getRootSeoValues(siteData) {
  const siteUrl = resolveSiteUrl(siteData);
  const storeName = getStoreName(siteData);
  const homepageMetaTag = findHomepageMetaTag(siteData, siteUrl);
  const defaultTitle = siteData?.store_data?.meta_title || homepageMetaTag?.seo?.title || storeName;
  const defaultDescription =
    siteData?.store_data?.meta_description || homepageMetaTag?.seo?.description || DEFAULT_DESCRIPTION;
  const image = getDefaultImage(siteData, siteUrl, homepageMetaTag);
  const favicon = buildAssetUrl(siteData?.store_data?.favicon_url, siteUrl) || "/favicon.ico";

  return {
    siteUrl,
    storeName,
    defaultTitle,
    defaultDescription,
    image,
    favicon,
    twitterHandle: getStoreTwitterHandle(siteData),
  };
}

function parseRobotsValue(value) {
  if (!isNonEmptyString(value)) {
    return {
      index: true,
      follow: true,
    };
  }

  const normalized = value.toLowerCase();

  return {
    index: !normalized.includes("noindex"),
    follow: !normalized.includes("nofollow"),
  };
}

function normalizeOpenGraphType(value) {
  if (!isNonEmptyString(value)) {
    return "website";
  }

  const normalized = value.trim().toLowerCase();
  const supportedTypes = new Set([
    "website",
    "article",
    "book",
    "profile",
    "music.song",
    "music.album",
    "music.playlist",
    "music.radio_station",
    "video.movie",
    "video.episode",
    "video.tv_show",
    "video.other",
  ]);

  return supportedTypes.has(normalized) ? normalized : "website";
}

export function buildRootMetadata(siteData) {
  const { siteUrl, storeName, defaultTitle, defaultDescription, image, favicon, twitterHandle } =
    getRootSeoValues(siteData);

  return {
    metadataBase: new URL(`${siteUrl}/`),
    title: {
      default: defaultTitle,
      template: `%s | ${storeName}`,
    },
    description: defaultDescription,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: buildAssetUrl(siteData?.store_data?.logo_url, siteUrl) || "/logo192.png",
    },
    openGraph: {
      type: "website",
      siteName: storeName,
      title: defaultTitle,
      description: defaultDescription,
      url: siteUrl,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: image ? [image] : undefined,
      site: twitterHandle || undefined,
      creator: twitterHandle || undefined,
    },
    robots: parseRobotsValue("index, follow"),
  };
}

export function resolveHomepageSeo(siteData) {
  const siteUrl = resolveSiteUrl(siteData);
  const homepageMetaTag = findHomepageMetaTag(siteData, siteUrl);
  const rootSeo = getRootSeoValues(siteData);
  const seo = homepageMetaTag?.seo || {};
  const title = seo.title || rootSeo.defaultTitle;
  const description = seo.description || rootSeo.defaultDescription;
  const canonical = getValidatedCanonical(seo.canonical, "/", siteUrl);
  const image =
    buildAssetUrl(seo.openGraph?.image, siteUrl) ||
    buildAssetUrl(seo.twitter?.image, siteUrl) ||
    rootSeo.image;

  return {
    siteUrl,
    storeName: rootSeo.storeName,
    title,
    description,
    canonical,
    robots: parseRobotsValue(seo.robots),
    openGraph: {
      title: seo.openGraph?.title || title,
      description: seo.openGraph?.description || description,
      type: normalizeOpenGraphType(seo.openGraph?.type),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: seo.twitter?.card || "summary_large_image",
      title: seo.twitter?.title || title,
      description: seo.twitter?.description || description,
      images: image ? [image] : undefined,
      site: rootSeo.twitterHandle || undefined,
      creator: rootSeo.twitterHandle || undefined,
    },
    jsonLd:
      seo.json_ld && (Array.isArray(seo.json_ld) || typeof seo.json_ld === "object") ? seo.json_ld : null,
  };
}

export function buildHomepageMetadata(siteData) {
  const homepageSeo = resolveHomepageSeo(siteData);

  return {
    title: {
      absolute: homepageSeo.title,
    },
    description: homepageSeo.description,
    alternates: {
      canonical: homepageSeo.canonical,
    },
    openGraph: {
      type: homepageSeo.openGraph.type,
      siteName: homepageSeo.storeName,
      title: homepageSeo.openGraph.title,
      description: homepageSeo.openGraph.description,
      url: homepageSeo.canonical,
      images: homepageSeo.openGraph.images,
    },
    twitter: homepageSeo.twitter,
    robots: homepageSeo.robots,
  };
}

export function getCategorySlug(category) {
  if (!category) {
    return "";
  }

  if (isNonEmptyString(category.slug)) {
    return slugifySegment(category.slug);
  }

  return slugifySegment(category.category_type || category.category_name || "");
}

export function getProductSlug(product) {
  if (!product || typeof product !== "object") {
    return "";
  }

  if (isNonEmptyString(product.slug)) {
    return slugifySegment(product.slug);
  }

  return slugifySegment(product.name || product.product_name || "");
}

export function extractProductId(routeParam) {
  if (typeof routeParam === "number" && Number.isFinite(routeParam)) {
    return String(Math.trunc(routeParam));
  }

  if (!isNonEmptyString(routeParam)) {
    return "";
  }

  const match = routeParam.trim().match(/^(\d+)/);
  return match?.[1] || "";
}

export function buildProductRoutePath(product) {
  const productId = product?.id ? String(product.id) : "";
  const productSlug = getProductSlug(product);

  if (!productId) {
    return "/product";
  }

  return productSlug ? `/product/${productId}-${productSlug}` : `/product/${productId}`;
}

function getProductSeoSource(product) {
  if (!product || typeof product !== "object") {
    return {};
  }

  return product.seo || product.meta?.seo || {};
}

function getProductDescription(product, fallbackDescription) {
  const seo = getProductSeoSource(product);
  const descriptionCandidates = [
    seo.description,
    stripHtml(product?.short_description),
    stripHtml(product?.description),
    stripHtml(product?.long_description),
    fallbackDescription,
  ];

  return descriptionCandidates.find((value) => isNonEmptyString(value)) || fallbackDescription;
}

function buildProductJsonLd(product, canonical, image, description) {
  if (!product) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.product_name || `Product ${product.id || ""}`.trim(),
    description,
    image: image ? [image] : undefined,
    sku: isNonEmptyString(product.sku) ? product.sku : undefined,
    category: product?.category?.category_name || product?.category || undefined,
    offers:
      product?.price != null
        ? {
            "@type": "Offer",
            priceCurrency: "INR",
            price: String(product.price),
            availability:
              product?.is_live === false || product?.status === 0
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: canonical,
          }
        : undefined,
  };
}

export function resolveProductSeo(siteData, product, routeParam = "") {
  const rootSeo = getRootSeoValues(siteData);
  const seo = getProductSeoSource(product);
  const routePath = buildProductRoutePath(product);
  const title = seo.title || product?.name || product?.product_name || rootSeo.defaultTitle;
  const description = getProductDescription(product, rootSeo.defaultDescription);
  const canonical = getValidatedCanonical(seo.canonical, routePath, rootSeo.siteUrl);
  const image =
    buildAssetUrl(seo.openGraph?.image, rootSeo.siteUrl) ||
    buildAssetUrl(seo.twitter?.image, rootSeo.siteUrl) ||
    buildAssetUrl(product?.primary_image_url, rootSeo.siteUrl) ||
    rootSeo.image;
  const routeProductId = extractProductId(routeParam);
  const currentPath = routeProductId ? `/product/${routeParam}` : routePath;

  return {
    siteUrl: rootSeo.siteUrl,
    storeName: rootSeo.storeName,
    product,
    routePath,
    currentPath,
    title,
    description,
    canonical,
    robots: parseRobotsValue(seo.robots),
    openGraph: {
      title: seo.openGraph?.title || title,
      description: seo.openGraph?.description || description,
      type: normalizeOpenGraphType(seo.openGraph?.type),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: seo.twitter?.card || "summary_large_image",
      title: seo.twitter?.title || title,
      description: seo.twitter?.description || description,
      images: image ? [image] : undefined,
      site: rootSeo.twitterHandle || undefined,
      creator: rootSeo.twitterHandle || undefined,
    },
    jsonLd:
      seo.json_ld && (Array.isArray(seo.json_ld) || typeof seo.json_ld === "object")
        ? seo.json_ld
        : buildProductJsonLd(product, canonical, image, description),
  };
}

export function buildProductMetadata(siteData, product, routeParam = "") {
  const productSeo = resolveProductSeo(siteData, product, routeParam);

  return {
    title: {
      absolute: productSeo.title,
    },
    description: productSeo.description,
    alternates: {
      canonical: productSeo.canonical,
    },
    openGraph: {
      type: productSeo.openGraph.type,
      siteName: productSeo.storeName,
      title: productSeo.openGraph.title,
      description: productSeo.openGraph.description,
      url: productSeo.canonical,
      images: productSeo.openGraph.images,
    },
    twitter: productSeo.twitter,
    robots: productSeo.robots,
  };
}

export function findCategoryBySlug(siteData, slug) {
  const normalizedSlug = slugifySegment(slug);
  const categories = Array.isArray(siteData?.categories) ? siteData.categories : [];

  return categories.find((category) => getCategorySlug(category) === normalizedSlug) || null;
}

function getCategorySeoSource(category) {
  if (!category || typeof category !== "object") {
    return {};
  }

  return category.seo || category.meta?.seo || {};
}

function getCategoryRoutePath(category, slug) {
  const routeSlug = getCategorySlug(category) || slugifySegment(slug);
  return routeSlug ? `/category/${routeSlug}` : "/category";
}

function getValidatedCanonical(candidate, fallbackPath, siteUrl) {
  const fallbackCanonical = toAbsoluteUrl(fallbackPath, siteUrl);
  const resolvedCanonical = toAbsoluteUrl(candidate, siteUrl);

  if (!resolvedCanonical) {
    return fallbackCanonical;
  }

  try {
    const resolvedPath = new URL(resolvedCanonical).pathname.replace(/\/$/, "") || "/";
    const fallbackResolvedPath = new URL(fallbackCanonical).pathname.replace(/\/$/, "") || "/";
    return resolvedPath === fallbackResolvedPath ? resolvedCanonical : fallbackCanonical;
  } catch (_) {
    return fallbackCanonical;
  }
}

export function resolveCategorySeo(siteData, slug) {
  const rootSeo = getRootSeoValues(siteData);
  const category = findCategoryBySlug(siteData, slug);
  const routePath = getCategoryRoutePath(category, slug);
  const seo = getCategorySeoSource(category);
  const title = seo.title || category?.category_name || rootSeo.defaultTitle;
  const description = seo.description || rootSeo.defaultDescription;
  const canonical = getValidatedCanonical(seo.canonical, routePath, rootSeo.siteUrl);
  const image =
    buildAssetUrl(seo.openGraph?.image, rootSeo.siteUrl) ||
    buildAssetUrl(seo.twitter?.image, rootSeo.siteUrl) ||
    buildAssetUrl(category?.category_image_url, rootSeo.siteUrl) ||
    rootSeo.image;

  return {
    siteUrl: rootSeo.siteUrl,
    storeName: rootSeo.storeName,
    category,
    routePath,
    title,
    description,
    canonical,
    robots: parseRobotsValue(seo.robots),
    openGraph: {
      title: seo.openGraph?.title || title,
      description: seo.openGraph?.description || description,
      type: normalizeOpenGraphType(seo.openGraph?.type),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: seo.twitter?.card || "summary_large_image",
      title: seo.twitter?.title || title,
      description: seo.twitter?.description || description,
      images: image ? [image] : undefined,
      site: rootSeo.twitterHandle || undefined,
      creator: rootSeo.twitterHandle || undefined,
    },
    jsonLd:
      seo.json_ld && (Array.isArray(seo.json_ld) || typeof seo.json_ld === "object") ? seo.json_ld : null,
  };
}

export function buildCategoryMetadata(siteData, slug) {
  const categorySeo = resolveCategorySeo(siteData, slug);

  return {
    title: {
      absolute: categorySeo.title,
    },
    description: categorySeo.description,
    alternates: {
      canonical: categorySeo.canonical,
    },
    openGraph: {
      type: categorySeo.openGraph.type,
      siteName: categorySeo.storeName,
      title: categorySeo.openGraph.title,
      description: categorySeo.openGraph.description,
      url: categorySeo.canonical,
      images: categorySeo.openGraph.images,
    },
    twitter: categorySeo.twitter,
    robots: categorySeo.robots,
  };
}

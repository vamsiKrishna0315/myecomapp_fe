import assert from "node:assert/strict";
import {
  buildCategoryMetadata,
  buildProductMetadata,
  buildProductRoutePath,
  extractProductId,
  findCategoryBySlug,
  getCategorySlug,
  getProductSlug,
  resolveHomepageSeo,
  resolveCategorySeo,
  resolveProductSeo,
} from "../utils/seo.js";

function createSiteData(overrides = {}) {
  return {
    store_data: {
      name: "Yumeat",
      website: "https://shop.example",
      twitter: "https://twitter.com/yumeat",
      logo: "/images/logo.png",
      favicon: "/favicon.ico",
      meta_title: "Yumeat Default",
      meta_description: "Fresh cuts delivered.",
      ...overrides.store_data,
    },
    categories: overrides.categories || [],
    meta_tags: overrides.meta_tags || [],
  };
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("category slug resolution prefers persisted backend slug", () => {
  assert.equal(
    getCategorySlug({ slug: "fresh-fish", category_type: "Sea Food", category_name: "Sea Food" }),
    "fresh-fish"
  );
  assert.equal(findCategoryBySlug(createSiteData({ categories: [{ slug: "fresh-fish", id: 7 }] }), "fresh-fish")?.id, 7);
});

runTest("category metadata canonical matches actual route and OG image resolves absolute", () => {
  process.env.NEXT_PUBLIC_ASSET_BASE_URL = "https://cdn.example";

  const siteData = createSiteData({
    categories: [
      {
        id: 1,
        slug: "chicken",
        category_name: "Chicken",
        category_image: "images/categories/chicken-card.jpg",
        seo: {
          title: "Buy Chicken Online",
          description: "Fresh chicken delivered.",
          canonical: "https://shop.example/category/wrong-slug",
          robots: "index, follow",
          openGraph: {
            title: "Chicken OG",
            description: "Chicken OG Description",
            image: "/images/seo/chicken-og.jpg",
          },
          twitter: {
            card: "summary_large_image",
            title: "Chicken Twitter",
            description: "Chicken Twitter Description",
          },
        },
      },
    ],
  });

  const metadata = buildCategoryMetadata(siteData, "chicken");

  assert.equal(metadata.title.absolute, "Buy Chicken Online");
  assert.equal(metadata.alternates.canonical, "https://shop.example/category/chicken");
  assert.equal(metadata.openGraph.url, "https://shop.example/category/chicken");
  assert.deepEqual(metadata.openGraph.images, [{ url: "https://cdn.example/images/seo/chicken-og.jpg" }]);
  assert.deepEqual(metadata.twitter.images, ["https://cdn.example/images/seo/chicken-og.jpg"]);
});

runTest("category SEO passes valid JSON-LD and robots through normalized helper", () => {
  process.env.NEXT_PUBLIC_ASSET_BASE_URL = "https://cdn.example";

  const siteData = createSiteData({
    categories: [
      {
        id: 2,
        slug: "mutton",
        category_name: "Mutton",
        seo: {
          robots: "noindex, nofollow",
          twitter: {
            image: "images/seo/mutton-twitter.jpg",
          },
          json_ld: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Mutton",
          },
        },
      },
    ],
  });

  const seo = resolveCategorySeo(siteData, "mutton");

  assert.deepEqual(seo.robots, { index: false, follow: false });
  assert.deepEqual(seo.twitter.images, ["https://cdn.example/images/seo/mutton-twitter.jpg"]);
  assert.deepEqual(seo.jsonLd, {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mutton",
  });
});

runTest("homepage canonical hardening rejects non-root backend canonicals", () => {
  const siteData = createSiteData({
    meta_tags: [
      {
        metaable_type: "App\\Models\\Page",
        metaable: {
          slug: "/",
        },
        seo: {
          canonical: "https://shop.example/category/chicken",
          title: "Home",
        },
      },
    ],
  });

  const seo = resolveHomepageSeo(siteData);

  assert.equal(seo.canonical, "https://shop.example/");
});

console.log("Category SEO tests completed.");

runTest("product route helper builds hybrid canonical route and parses legacy numeric params", () => {
  assert.equal(getProductSlug({ id: 15, slug: "Chicken Breast" }), "chicken-breast");
  assert.equal(buildProductRoutePath({ id: 15, name: "Chicken Breast Boneless" }), "/product/15-chicken-breast-boneless");
  assert.equal(extractProductId("15"), "15");
  assert.equal(extractProductId("15-chicken-breast-boneless"), "15");
});

runTest("product metadata canonicalizes to hybrid route and resolves image URLs", () => {
  process.env.NEXT_PUBLIC_ASSET_BASE_URL = "https://cdn.example";

  const siteData = createSiteData();
  const product = {
    id: 15,
    name: "Chicken Breast Boneless",
    description: "<p>Lean and tender chicken breast.</p>",
    primary_image: "images/products/chicken-breast.jpg",
    seo: {
      title: "Buy Chicken Breast Boneless Online",
      canonical: "https://shop.example/product/15",
      openGraph: {
        image: "/images/seo/chicken-breast-og.jpg",
      },
    },
  };

  const metadata = buildProductMetadata(siteData, product, "15");

  assert.equal(metadata.title.absolute, "Buy Chicken Breast Boneless Online");
  assert.equal(metadata.alternates.canonical, "https://shop.example/product/15-chicken-breast-boneless");
  assert.equal(metadata.openGraph.url, "https://shop.example/product/15-chicken-breast-boneless");
  assert.deepEqual(metadata.openGraph.images, [{ url: "https://cdn.example/images/seo/chicken-breast-og.jpg" }]);
  assert.deepEqual(metadata.twitter.images, ["https://cdn.example/images/seo/chicken-breast-og.jpg"]);
});

runTest("product SEO falls back to generated JSON-LD and normalized description", () => {
  process.env.NEXT_PUBLIC_ASSET_BASE_URL = "https://cdn.example";

  const siteData = createSiteData();
  const product = {
    id: 21,
    name: "Fresh Mutton Curry Cut",
    description: "<div>Fresh mutton cut for curries.</div>",
    price: 799,
    sku: "MUTTON-21",
    primary_image_url: "https://images.example/mutton.jpg",
    category: {
      category_name: "Mutton",
    },
    seo: {
      robots: "noindex, follow",
    },
  };

  const seo = resolveProductSeo(siteData, product, "21-fresh-mutton-curry-cut");

  assert.deepEqual(seo.robots, { index: false, follow: true });
  assert.equal(seo.description, "Fresh mutton cut for curries.");
  assert.equal(seo.jsonLd["@type"], "Product");
  assert.equal(seo.jsonLd.offers.price, "799");
  assert.equal(seo.jsonLd.offers.url, "https://shop.example/product/21-fresh-mutton-curry-cut");
});

console.log("Product SEO tests completed.");

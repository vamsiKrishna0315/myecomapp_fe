import assert from "node:assert/strict";
import { buildCategoryMetadata, findCategoryBySlug, getCategorySlug, resolveCategorySeo } from "../utils/seo.js";

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

console.log("Category SEO tests completed.");

import CategoryPageClient from "../../../components/Category/CategoryPageClient";
import { getRequiredSiteData, getSiteData } from "../../../utils/siteData";
import { buildCategoryMetadata, resolveCategorySeo } from "../../../utils/seo";

export async function generateMetadata({ params }) {
  const siteData = await getSiteData();
  return buildCategoryMetadata(siteData, params?.slug || "");
}

export default async function CategoryPage({ params }) {
  const siteData = await getRequiredSiteData();
  const slug = params?.slug || "";
  const categorySeo = resolveCategorySeo(siteData, slug);

  return (
    <>
      {categorySeo.jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySeo.jsonLd) }}
        />
      ) : null}
      <CategoryPageClient slug={slug} initialSelectedCategory={categorySeo.category} />
    </>
  );
}

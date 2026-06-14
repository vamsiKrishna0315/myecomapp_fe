import { notFound, permanentRedirect } from "next/navigation";
import ProductDetailPageClient from "../../../components/ProductPage/ProductDetailPageClient";
import { getRequiredSiteData, getSiteData } from "../../../utils/siteData";
import { getProductById } from "../../../utils/product";
import { buildProductMetadata, buildProductRoutePath, extractProductId, resolveProductSeo } from "../../../utils/seo";

export async function generateMetadata({ params }) {
  const routeParam = params?.id || "";
  const productId = extractProductId(routeParam);

  if (!productId) {
    return {};
  }

  const [siteData, product] = await Promise.all([getSiteData(), getProductById(productId)]);

  if (!product) {
    return {};
  }

  return buildProductMetadata(siteData, product, routeParam);
}

export default async function ProductDetailPage({ params }) {
  const routeParam = params?.id || "";
  const productId = extractProductId(routeParam);

  if (!productId) {
    notFound();
  }

  const [siteData, product] = await Promise.all([getRequiredSiteData(), getProductById(productId)]);

  if (!product) {
    notFound();
  }

  const canonicalPath = buildProductRoutePath(product);
  if (routeParam !== canonicalPath.replace("/product/", "")) {
    permanentRedirect(canonicalPath);
  }

  const productSeo = resolveProductSeo(siteData, product, routeParam);

  return (
    <>
      {productSeo.jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSeo.jsonLd) }} />
      ) : null}
      <ProductDetailPageClient productId={productId} initialProduct={product} />
    </>
  );
}

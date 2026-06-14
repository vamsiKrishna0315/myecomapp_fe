import { notFound, permanentRedirect } from "next/navigation";
import { getProductById } from "../../../utils/product";
import { buildProductRoutePath, extractProductId } from "../../../utils/seo";

export default async function ProductDetailPage({ params }) {
  const productId = extractProductId(params?.id || "");

  if (!productId) {
    notFound();
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  permanentRedirect(buildProductRoutePath(product));
}

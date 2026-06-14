import HomePage from '../components/LandingPage/HomePage';
import { getRequiredSiteData, getSiteData } from '../utils/siteData';
import { buildHomepageMetadata, resolveHomepageSeo } from '../utils/seo';

export async function generateMetadata() {
  const siteData = await getSiteData();
  return buildHomepageMetadata(siteData);
}

export default async function Home() {
  const initialSiteData = await getRequiredSiteData();
  const homepageSeo = resolveHomepageSeo(initialSiteData);

  return (
    <>
      {homepageSeo.jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSeo.jsonLd) }}
        />
      ) : null}
      <HomePage initialSiteData={initialSiteData} />
    </>
  );
}

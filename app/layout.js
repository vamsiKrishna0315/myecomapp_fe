import Providers from "../components/Providers";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ErrorState from "../components/ErrorState/ErrorState";
import { getRequiredSiteData, getSiteData } from "../utils/siteData";
import { buildRootMetadata } from "../utils/seo";
import "../styles/globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const siteData = await getSiteData();
  return buildRootMetadata(siteData);
}

export default async function RootLayout({ children }) {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "production";
  const gracefulErrorMode = environment === "production";
  const initialSiteData = gracefulErrorMode ? await getSiteData() : await getRequiredSiteData();

  if (gracefulErrorMode && !initialSiteData) {
    return (
      <html lang="en">
        <body>
          <ErrorState
            code="500"
            title="Service temporarily unavailable"
            message="We are unable to reach the backend right now. Please try again in a moment."
            showDetails={false}
          />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logo/logo.webp" type="image/webp" />
        <link rel="shortcut icon" href="/images/logo/logo.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/logo192.png" />
      </head>
      <body suppressHydrationWarning>
        <Providers initialSiteData={initialSiteData}>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

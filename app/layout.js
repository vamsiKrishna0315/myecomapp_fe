import Providers from "../components/Providers";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { getSiteData } from "../utils/siteData";
import { buildRootMetadata } from "../utils/seo";
import "../styles/globals.css";

export async function generateMetadata() {
  const siteData = await getSiteData();
  return buildRootMetadata(siteData);
}

export default async function RootLayout({ children }) {
  const initialSiteData = await getSiteData();

  return (
    <html lang="en">
      <body>
        <Providers initialSiteData={initialSiteData}>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { theme } from "./theme/theme";
import { ContextProvider } from "./Context/ContextProvider";
import AppContextProvider from "./Context/AppContext";
import { SiteDataProvider } from "./Context/SiteDataContext";
import { CartProvider } from "./Context/CartContext";
import ReferralCapture from "./Referral/ReferralCapture";

export default function Providers({ children, initialSiteData = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Provider store={store}>
      <AppContextProvider>
        <ContextProvider>
          <ChakraProvider theme={theme}>
            <SiteDataProvider initialSiteData={initialSiteData}>
              <CartProvider>
                <ReferralCapture />
                {/* Suppress hydration warnings caused by browser extensions (Grammarly, Translate, etc.) */}
                <div suppressHydrationWarning>
                  {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
                </div>
              </CartProvider>
            </SiteDataProvider>
          </ChakraProvider>
        </ContextProvider>
      </AppContextProvider>
    </Provider>
  );
}

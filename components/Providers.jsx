"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { theme } from "./theme/theme";
import { ContextProvider } from "./Context/ContextProvider";
import AppContextProvider from "./Context/AppContext";
import { SiteDataProvider } from "./Context/SiteDataContext";
import { CartProvider } from "./Context/CartContext";

export default function Providers({ children, initialSiteData = null }) {
  return (
    <Provider store={store}>
      <AppContextProvider>
        <ContextProvider>
          <ChakraProvider theme={theme}>
            <SiteDataProvider initialSiteData={initialSiteData}>
              <CartProvider>{children}</CartProvider>
            </SiteDataProvider>
          </ChakraProvider>
        </ContextProvider>
      </AppContextProvider>
    </Provider>
  );
}

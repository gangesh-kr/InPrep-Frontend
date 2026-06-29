import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store";
import { Analytics } from "@vercel/analytics/react";
import { Layout } from "../components/Layout";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Exclude login and public scorecard pages from the persistent sidebar layout
  const isNoLayoutPage = router.pathname === "/login" || router.pathname.startsWith("/scorecard/");

  return (
    <Provider store={store}>
      {isNoLayoutPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
      <Analytics />
    </Provider>
  );
}

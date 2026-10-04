import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { App } from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { RuntimeErrorReporter } from "./components/RuntimeErrorReporter";
import { reportError } from "./lib/errors";
import "./index.css";
import "katex/dist/katex.min.css";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) reportError(error, "query");
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.options.onError) reportError(error, "mutation");
    },
  }),
  defaultOptions: {
    queries: { retry: 1, staleTime: 20_000, refetchOnWindowFocus: false },
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <RuntimeErrorReporter />
            <AppErrorBoundary>
              <App />
            </AppErrorBoundary>
          </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

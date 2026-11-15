import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppProviders } from '@/app/providers/AppProviders';
import { removeStaticHeadTags } from '@/components/layout/seoClaims';

// Remove the former worker's persistent API cache during the FACODI transition.
if ('caches' in window) {
  void caches.delete('supabase-cache').catch(error => console.error('FACODI: failed to remove legacy API cache', error));
}

removeStaticHeadTags();

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
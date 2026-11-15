import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/useAuth';
import { I18nextProvider } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import { SeoScope } from '@/components/layout/PageSeo';
import i18n from '@/i18n/config';
import { getEnv } from '@/shared/config/env';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  getEnv();

  return (
    <HelmetProvider>
      <SeoScope>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Sonner theme="light" />
                  {children}
                </TooltipProvider>
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SeoScope>
    </HelmetProvider>
  );
}

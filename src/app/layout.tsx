import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserProfileSynchronizer } from '@/components/user-profile-synchronizer';
import { AuthGuard } from '@/components/auth-guard';
import { GlobalSearch } from '@/components/global-search';
import { UserNav } from '@/components/user-nav';

export const metadata: Metadata = {
  title: 'HireNexus | Multi-Agent AI Hiring Evaluation',
  description: 'Transparent multi-agent AI hiring evaluation platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-hidden">
        <FirebaseClientProvider>
          <UserProfileSynchronizer />
          <AuthGuard>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-6 flex-1">
                    <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors" />
                    <GlobalSearch />
                  </div>
                  <UserNav />
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
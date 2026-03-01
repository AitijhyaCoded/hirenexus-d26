import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AuthGuard } from '@/components/auth-guard';
import { GlobalSearch } from '@/components/global-search';
import { UserNav } from '@/components/user-nav';

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
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
    );
}

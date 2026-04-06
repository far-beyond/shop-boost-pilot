import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 border-b border-border/60 bg-card/70 backdrop-blur-xl h-14 flex items-center px-4 gap-3">
            <SidebarTrigger className="shrink-0" />
            <Link to="/" className="flex items-center gap-2.5 font-bold text-base text-foreground group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm transition-transform group-hover:scale-105"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Target className="w-4.5 h-4.5" />
              </div>
              <span className="hidden sm:inline tracking-tight">MapBoost AI</span>
            </Link>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-border/60 bg-card/50 py-8 mt-auto">
            <div className="container mx-auto px-4 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium">© 2024 MapBoost AI</p>
              <p>ローカルマーケティング分析ツール — 地域分析・出店分析・広告提案・チラシ配布設計</p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

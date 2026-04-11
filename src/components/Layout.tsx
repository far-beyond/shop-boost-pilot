import { Link } from "react-router-dom";
import { Target, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

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
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-border/60 bg-card/50 py-8 mt-auto">
            <div className="container mx-auto px-4 text-center text-xs text-muted-foreground space-y-2">
              <p className="font-medium">{t("footer.copyright")}</p>
              <p>{t("footer.description")}</p>
              <div className="flex items-center justify-center gap-4 pt-1">
                <Link to="/tokushoho" className="hover:text-foreground transition-colors">{t("footer.tokushoho")}</Link>
                <span className="text-border">|</span>
                <Link to="/terms" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link>
                <span className="text-border">|</span>
                <Link to="/contact" className="hover:text-foreground transition-colors">{t("footer.contact")}</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { Link, useLocation } from "react-router-dom";
import { BarChart3, FileText, Home, LayoutDashboard, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "トップ", icon: Home },
  { to: "/input", label: "店舗入力", icon: FileText },
  { to: "/diagnosis", label: "診断結果", icon: Target },
  { to: "/promo", label: "販促文", icon: MessageSquare },
  { to: "/kpi", label: "KPI設計", icon: BarChart3 },
  { to: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Target className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">MapBoost AI</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant={location.pathname === to ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs sm:text-sm gap-1.5"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 MapBoost AI — マップ連動型 店舗集客AI</p>
          <p className="mt-1">日本の実店舗オーナーのための集客支援サービス</p>
        </div>
      </footer>
    </div>
  );
}

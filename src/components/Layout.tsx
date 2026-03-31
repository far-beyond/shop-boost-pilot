import { Link, useLocation } from "react-router-dom";
import { FileText, Home, LayoutDashboard, LogIn, LogOut, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", label: "トップ", icon: Home, authRequired: false },
  { to: "/input", label: "店舗入力", icon: FileText, authRequired: true },
  { to: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard, authRequired: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-base text-foreground group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm transition-transform group-hover:scale-105" style={{ background: "var(--gradient-primary)" }}>
              <Target className="w-4.5 h-4.5" />
            </div>
            <span className="hidden sm:inline tracking-tight">MapBoost AI</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {navItems
              .filter((item) => !item.authRequired || user)
              .map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link key={to} to={to}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs sm:text-sm gap-1.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-primary/8 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline">{label}</span>
                    </Button>
                  </Link>
                );
              })}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm gap-1.5 text-muted-foreground hover:text-foreground rounded-lg ml-1"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">ログアウト</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-xs sm:text-sm gap-1.5 rounded-lg ml-1 shadow-sm">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden md:inline">ログイン</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 bg-card/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium">© 2024 MapBoost AI</p>
          <p>マップ連動型 店舗集客AI — 日本の実店舗オーナーのための集客支援サービス</p>
        </div>
      </footer>
    </div>
  );
}

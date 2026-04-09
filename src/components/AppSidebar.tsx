import {
  Home, MapPin, Megaphone, LayoutDashboard, ArrowLeftRight,
  FileText, BarChart3, TrendingUp, ClipboardList,
  LogOut, LogIn, Globe, CreditCard, Shield, Download,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const mainItems = [
    { title: t("nav.mapAnalysis"), url: "/map-analysis", icon: MapPin },
    { title: t("nav.storeComparison"), url: "/store-comparison", icon: ArrowLeftRight },
    { title: t("nav.storeInput"), url: "/input", icon: FileText },
    { title: t("nav.mediaPlan"), url: "/media-plan", icon: Megaphone },
    { title: t("nav.report"), url: "/report", icon: BarChart3 },
    { title: t("nav.responseAnalysis"), url: "/response-analysis", icon: TrendingUp },
    { title: t("nav.orderHistory"), url: "/order-history", icon: ClipboardList },
    { title: t("nav.diagnosisList"), url: "/dashboard", icon: LayoutDashboard },
  ];

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      {!collapsed && label && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  activeClassName="bg-primary/8 text-primary font-medium"
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    activeClassName="bg-primary/8 text-primary font-medium"
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{t("nav.home")}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && renderGroup("", mainItems)}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenuButton asChild>
          <NavLink
            to="/pricing"
            end
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            activeClassName="bg-primary/8 text-primary font-medium"
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t("nav.pricing")}</span>}
          </NavLink>
        </SidebarMenuButton>

        <SidebarMenuButton asChild>
          <NavLink
            to="/install"
            end
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            activeClassName="bg-primary/8 text-primary font-medium"
          >
            <Download className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{language === "ja" ? "アプリをインストール" : "Install App"}</span>}
          </NavLink>
        </SidebarMenuButton>

        {user && (
          <SidebarMenuButton asChild>
            <NavLink
              to="/admin"
              end
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              activeClassName="bg-primary/8 text-primary font-medium"
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{t("nav.admin")}</span>}
            </NavLink>
          </SidebarMenuButton>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
        >
          <Globe className="w-4 h-4" />
          {!collapsed && (language === "ja" ? "English" : "日本語")}
        </Button>

        {user ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && t("nav.logout")}
          </Button>
        ) : (
          <NavLink to="/auth">
            <Button size="sm" className="w-full justify-start gap-2 text-xs">
              <LogIn className="w-4 h-4" />
              {!collapsed && t("nav.login")}
            </Button>
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

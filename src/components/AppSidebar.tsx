import {
  Home, MapPin, Megaphone, Compass, LayoutDashboard,
  Building2, FileText, Target as TargetIcon, Newspaper, BarChart3,
  LogOut, LogIn, Globe, CreditCard, Shield,
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

  const analysisItems = [
    { title: t("nav.areaAnalysis"), url: "/area-analysis", icon: MapPin },
    { title: t("nav.mapAnalysis"), url: "/map-analysis", icon: MapPin },
    { title: t("nav.locationMatch"), url: "/location-match", icon: Compass },
    { title: t("nav.storeCandidates"), url: "/store-candidates", icon: Building2 },
  ];

  const promotionItems = [
    { title: t("nav.mediaPlan"), url: "/media-plan", icon: Megaphone },
    { title: t("nav.adProposal"), url: "/ad-proposal", icon: TargetIcon },
    { title: t("nav.flyerPlan"), url: "/flyer-plan", icon: Newspaper },
  ];

  const managementItems = [
    { title: t("nav.agencyDashboard"), url: "/agency", icon: LayoutDashboard },
    { title: t("nav.report"), url: "/report", icon: BarChart3 },
    { title: t("nav.diagnosisList"), url: "/dashboard", icon: FileText },
  ];

  const diagnosisItems = [
    { title: t("nav.storeInput"), url: "/input", icon: FileText },
  ];

  const renderGroup = (label: string, items: typeof analysisItems) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">{label}</SidebarGroupLabel>}
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

        {user && (
          <>
            {renderGroup(t("nav.analysis"), analysisItems)}
            {renderGroup(t("nav.promotion"), promotionItems)}
            {renderGroup(t("nav.management"), managementItems)}
            {renderGroup(t("nav.diagnosis"), diagnosisItems)}
          </>
        )}
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

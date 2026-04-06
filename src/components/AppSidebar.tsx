import {
  Home, MapPin, Megaphone, Compass, LayoutDashboard,
  Building2, FileText, Target as TargetIcon, Newspaper, BarChart3,
  LogOut, LogIn,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

const analysisItems = [
  { title: "商圏・出店分析", url: "/area-analysis", icon: MapPin },
  { title: "エリア適性", url: "/location-match", icon: Compass },
  { title: "出店候補地管理", url: "/store-candidates", icon: Building2 },
];

const promotionItems = [
  { title: "統合媒体プラン", url: "/media-plan", icon: Megaphone },
  { title: "広告提案", url: "/ad-proposal", icon: TargetIcon },
  { title: "チラシ設計", url: "/flyer-plan", icon: Newspaper },
];

const managementItems = [
  { title: "案件管理", url: "/agency", icon: LayoutDashboard },
  { title: "統合レポート", url: "/report", icon: BarChart3 },
  { title: "診断一覧", url: "/dashboard", icon: FileText },
];

const diagnosisItems = [
  { title: "店舗入力（診断）", url: "/input", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

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
        {/* Top */}
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
                    {!collapsed && <span>トップ</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <>
            {renderGroup("分析", analysisItems)}
            {renderGroup("販促", promotionItems)}
            {renderGroup("管理", managementItems)}
            {renderGroup("診断", diagnosisItems)}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "ログアウト"}
          </Button>
        ) : (
          <NavLink to="/auth">
            <Button size="sm" className="w-full justify-start gap-2 text-xs">
              <LogIn className="w-4 h-4" />
              {!collapsed && "ログイン"}
            </Button>
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

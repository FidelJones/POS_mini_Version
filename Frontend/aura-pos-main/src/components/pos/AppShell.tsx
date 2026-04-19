import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, History, Settings, HelpCircle, Moon, Sun, Sparkles } from "lucide-react";
import { usePOS } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { useTutorial } from "@/components/pos/TutorialProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { to: "/", label: "POS", icon: ShoppingBag, end: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/sales", label: "Sales History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

function AppSidebar() {
  const { theme, setTheme } = usePOS();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="h-16 flex-row items-center gap-2 px-4 border-b border-border/60">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--gradient-accent)" }}
        >
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display font-bold text-[15px] leading-tight truncate">Nordic POS</div>
            <div className="text-[11px] text-muted-foreground">v1.0</div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild tooltip={item.label} className="h-10 rounded-[10px]">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 text-sm font-medium ${
                      isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/60">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-[10px]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = usePOS();
  const { start } = useTutorial();
  const loc = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border/60 glass sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden md:flex" />
              <div className="md:hidden flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold">Nordic POS</span>
              </div>
              <div className="hidden md:block ml-2">
                <h1 className="font-display font-semibold text-[17px] capitalize">
                  {loc.pathname === "/" ? "Point of Sale" : loc.pathname.slice(1)}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-[10px]"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button variant="outline" size="sm" onClick={start} className="rounded-[10px] gap-1.5" data-tour="help">
                <HelpCircle size={16} />
                <span className="hidden sm:inline">Tour</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 min-h-0 pb-20 md:pb-0">{children}</main>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 glass flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-[10px] min-w-[64px] min-h-[48px] justify-center transition ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}

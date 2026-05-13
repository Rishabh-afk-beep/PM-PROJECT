import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen, Megaphone, Users, MessageSquare, User, LayoutDashboard,
  LogOut, ChevronLeft, ChevronRight, Video, Sparkles, Menu, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [children]);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const navItems = [
    ...(isAdmin ? [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }] : []),
    { to: "/notes", icon: BookOpen, label: "Notes" },
    { to: "/videos", icon: Video, label: "Video Lectures" },
    { to: "/circulars", icon: Megaphone, label: "Circulars" },
    { to: "/community", icon: MessageSquare, label: "Community" },
    ...(isAdmin ? [{ to: "/mentorship", icon: Users, label: "Mentorship" }] : []),
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/80 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground font-display text-sm font-bold shadow-soft">
          TL
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm font-semibold">TeachLearn</span>
            <span className="text-[11px] uppercase tracking-[0.24em] text-sidebar-muted">Academic Hub</span>
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-sidebar-muted hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {(!collapsed || isMobile) && (
        <div className="mx-3 mt-4 rounded-3xl border border-sidebar-border/80 bg-sidebar-accent/60 p-4">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">Workspace</span>
          </div>
          <p className="mt-2 text-sm text-sidebar-foreground/90">Clean notes, structured lectures, and a better looking dashboard.</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-primary/18 text-sidebar-foreground shadow-soft"
                  : "text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              } ${collapsed && !isMobile ? "justify-center" : ""}`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 px-2 pb-4">
        <Separator className="bg-sidebar-border" />
        <div className={`flex items-center rounded-2xl px-2 py-1 ${collapsed && !isMobile ? "justify-center" : "justify-between"}`}>
          {(!collapsed || isMobile) && <span className="text-xs uppercase tracking-[0.2em] text-sidebar-muted">Theme</span>}
          <ThemeToggle compact={collapsed && !isMobile} />
        </div>

        <div className={`flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-muted capitalize">{user.role}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>

      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-10 items-center justify-center border-t border-sidebar-border text-sidebar-muted transition-colors hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}
    </>
  );

  return (
    <div className="app-shell flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar flex min-h-screen flex-col transition-all duration-200 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
            : collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      <main className="app-main flex-1">
        <div className="relative z-10 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)}
                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="relative z-10 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

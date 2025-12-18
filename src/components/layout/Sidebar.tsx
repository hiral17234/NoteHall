import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  MessageSquare, 
  BookOpen, 
  Zap, 
  HelpCircle, 
  Bot, 
  User, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Award,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo.png";

const ecosystemItems = [
  { title: "CampusVoice", path: "/campusvoice", icon: MessageSquare },
  { title: "NoteHall", path: "/", icon: BookOpen },
  { title: "CampusBuzz", path: "/campusbuzz", icon: Zap },
];

const mainNavItems = [
  { title: "Help Desk", path: "/helpdesk", icon: HelpCircle },
  { title: "Gemini", path: "/ai-assistant", icon: Bot },
  { title: "Profile", path: "/profile", icon: User },
  { title: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, privacy } = useUser();

  const streakBadge = (user?.streak || 0) >= 7;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={logo} alt="NoteHall" className="h-10 w-auto" />
          </div>
        )}
        {collapsed && (
          <img src={logo} alt="NoteHall" className="h-8 w-auto mx-auto" />
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mt-2 hover:bg-muted"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {/* Campus Ecosystem Section */}
        <div className="mb-4">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Campus Ecosystem
            </p>
          )}
          <div className="space-y-1">
            {ecosystemItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-muted",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                  {!collapsed && (
                    <span className={cn("font-medium", isActive && "text-primary-foreground")}>
                      {item.title}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 my-3 border-t border-border" />

        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-muted",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                {!collapsed && (
                  <span className={cn("font-medium", isActive && "text-primary-foreground")}>
                    {item.title}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User section - Synced with user context */}
      {user && (
        <div className="p-2 border-t border-border">
          <NavLink
            to="/profile"
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors",
              collapsed && "justify-center"
            )}
          >
            <div className="relative">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              {privacy.showOnlineStatus && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-chart-1 rounded-full border-2 border-card" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  {user.badges?.some(b => b.id === "top") && (
                    <Badge className="h-4 px-1 text-[10px] bg-primary/20 text-primary border-0">
                      <Award className="w-2.5 h-2.5 mr-0.5" />
                      Top
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {user.branch ? `${user.branch} • ${user.year}` : user.username}
                  </p>
                  {streakBadge && (
                    <Badge className="h-4 px-1 text-[10px] bg-orange-500/20 text-orange-500 border-0">
                      <Flame className="w-2.5 h-2.5" />
                      {user.streak}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
}

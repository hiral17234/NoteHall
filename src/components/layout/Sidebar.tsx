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
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ecosystemItems = [
  { title: "CampusVoice", path: "/campusvoice", icon: MessageSquare },
  { title: "NoteHall", path: "/", icon: BookOpen },
  { title: "CampusBuzz", path: "/campusbuzz", icon: Zap },
];

const mainNavItems = [
  { title: "Help Desk", path: "/helpdesk", icon: HelpCircle },
  { title: "AI Assistant", path: "/ai-assistant", icon: Bot },
  { title: "Profile", path: "/profile", icon: User },
  { title: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">NoteHall</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("hover:bg-muted", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

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

      {/* User section */}
      <div className="p-2 border-t border-border">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                <Badge className="h-4 px-1 text-[10px] bg-primary/20 text-primary border-0">
                  <Award className="w-2.5 h-2.5 mr-0.5" />
                  Top
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">CSE • 3rd Year</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

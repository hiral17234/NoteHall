import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  HandHelping,
  CheckCircle2,
  AtSign,
  Trash2,
} from "lucide-react";
import { notificationService, Notification } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";

const notificationTypeConfig: Record<
  string,
  { icon: any; label: string; color: string }
> = {
  like: { icon: Heart, label: "Likes", color: "text-red-500" },
  comment: { icon: MessageCircle, label: "Comments", color: "text-blue-500" },
  reply: { icon: MessageCircle, label: "Replies", color: "text-blue-400" },
  help_contribution: { icon: HandHelping, label: "Contributions", color: "text-green-500" },
  request_fulfilled: { icon: CheckCircle2, label: "Fulfilled", color: "text-chart-1" },
  mention: { icon: AtSign, label: "Mentions", color: "text-purple-500" },
  general: { icon: Bell, label: "General", color: "text-primary" },
  system: { icon: Bell, label: "System", color: "text-muted-foreground" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useUser();
  const [filter, setFilter] = useState<string>("all");

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleClearAll = async () => {
    if (!userProfile?.id) return;
    await notificationService.clearAll(userProfile.id);
  };

  const getIcon = (type: string) => {
    const config = notificationTypeConfig[type] || notificationTypeConfig.general;
    return config.icon;
  };

  const getIconColor = (type: string) => {
    const config = notificationTypeConfig[type] || notificationTypeConfig.general;
    return config.color;
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
          <TabsList className="bg-muted w-full justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge className="ml-1.5 h-5 px-1.5">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="like">Likes</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
            <TabsTrigger value="help_contribution">Help</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <EmptyState
                type="notifications"
                title="No notifications"
                description={
                  filter === "unread"
                    ? "You've read all your notifications."
                    : "When you get likes, comments, or contributions, they'll show up here."
                }
              />
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "cursor-pointer hover:bg-accent/50 transition-colors",
                      !notification.read && "border-l-4 border-l-primary bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-full bg-muted",
                          getIconColor(notification.type)
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "font-medium text-foreground",
                              !notification.read && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {notification.createdAt?.seconds
                            ? formatDistanceToNow(
                                new Date(notification.createdAt.seconds * 1000),
                                { addSuffix: true }
                              )
                            : formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(notification.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

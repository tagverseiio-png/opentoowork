import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Check, Trash2, ExternalLink, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err: any) {
      console.warn("notifications table may not exist:", err.message);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch {}
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (notification.link) {
      if (notification.link === '/candidate/dashboard' || notification.link === '/employer/dashboard') {
        navigate('/dashboard');
      } else {
        navigate(notification.link);
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group hover:bg-primary/10 rounded-xl transition-all duration-300">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black border-2 border-background animate-in zoom-in duration-300">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] sm:w-96 p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-card animate-in fade-in zoom-in duration-300" 
        align="end"
        sideOffset={8}
        collisionPadding={16}
      >
        <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest">Protocol Alerts</h3>
            {unreadCount > 0 && <Badge variant="secondary" className="text-[9px] font-black">{unreadCount} NEW</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 text-primary" onClick={markAllAsRead}>
              Neutralize All
            </Button>
          )}
        </div>
        <ScrollArea className="h-[min(400px,70vh)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] p-8 text-center gap-3">
              <Bell className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm font-bold text-muted-foreground">Registry status: Nominal.</p>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">No alerts detected in sector.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors group relative ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {!n.is_read ? (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Circle className="h-2 w-2 text-muted-foreground/20" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1 pr-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className={`text-xs font-black uppercase tracking-tight flex-1 min-w-0 break-words ${!n.is_read ? 'text-primary' : 'text-foreground'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] font-bold text-muted-foreground/60 tabular-nums whitespace-nowrap pt-0.5">
                          {new Date(n.created_at).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                        {n.message}
                      </p>
                      {/* Removed 'Access Resource' text block as requested */}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-destructive hover:bg-destructive/10"
                    onClick={(e) => deleteNotification(n.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Secure Alert Monitoring Interface v1.0</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

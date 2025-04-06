import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";
import { PageTitle } from "@/components/ui/page-title";
import { Bell } from "lucide-react";
import useNotifications from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const { markAsRead } = useNotifications();
  
  // Mark notifications as read when page loads
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <PageTitle
          title="Notifications"
          description="See interactions with your posts, reviews, and more"
          icon={<Bell className="h-8 w-8 text-bookverse-accent" />}
        />
        <NotificationsFeed />
      </div>
    </Layout>
  );
}
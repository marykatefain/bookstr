import { useNotifications } from "@/hooks/useNotifications";

interface NotificationBadgeProps {
  className?: string;
}

export const NotificationBadge = ({ className = "" }: NotificationBadgeProps) => {
  const { unreadCount, error } = useNotifications();
  
  // Don't show anything if there's an error or no unread notifications
  if (error || unreadCount === 0) return null;
  
  return (
    <div 
      className={`flex items-center justify-center h-5 min-w-5 rounded-full text-[10px] font-medium bg-red-500 text-white ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </div>
  );
};

export default NotificationBadge;
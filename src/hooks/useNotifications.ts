import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/nostr';
import { fetchNotifications } from '@/lib/nostr/fetch/notifications';

/**
 * Hook to fetch and track notifications for the current user
 * Returns the count of unread notifications
 */
export const useNotifications = () => {
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    
    loadUser();
  }, []);
  
  // Store the last time notifications were viewed in localStorage
  const getLastViewedTime = () => {
    const stored = localStorage.getItem('lastNotificationViewTime');
    return stored ? parseInt(stored, 10) : 0;
  };
  
  const markAsRead = () => {
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem('lastNotificationViewTime', now.toString());
    setUnreadCount(0);
  };
  
  const { data: notifications, error: notificationsError, isLoading } = useQuery({
    queryKey: ["notifications", user?.pubkey],
    queryFn: () => fetchNotifications(user?.pubkey),
    enabled: !!user?.pubkey,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2, // Retry up to 2 times if there's an error
  });
  
  // Update unread count when notifications change
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const lastViewedTime = getLastViewedTime();
      const newNotifications = notifications.filter(
        (notification: any) => notification.created_at > lastViewedTime
      );
      setUnreadCount(newNotifications.length);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);
  
  return { 
    unreadCount, 
    markAsRead, 
    notifications,
    isLoading,
    error: notificationsError 
  };
};

export default useNotifications;
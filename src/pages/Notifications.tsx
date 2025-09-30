import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Calendar, FileText, MessageSquare, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link?: string;
}

export default function Notifications() {
  return <NotificationsContent />;
}

function NotificationsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // For now, we'll show mock notifications since there's no notifications table yet
    // In production, you would fetch from a real notifications table
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'appointment',
        title: 'Upcoming Appointment',
        message: 'You have an appointment with Dr. Smith tomorrow at 2:00 PM',
        created_at: new Date().toISOString(),
        read: false,
        link: '/appointments',
      },
      {
        id: '2',
        type: 'message',
        title: 'New Message',
        message: 'Dr. Johnson sent you a message',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        link: '/messages',
      },
      {
        id: '3',
        type: 'prescription',
        title: 'Prescription Ready',
        message: 'Your prescription is ready for pickup',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        link: '/prescriptions',
      },
    ];
    
    setNotifications(mockNotifications);
    setLoading(false);
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'prescription':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filterNotifications = (filter: 'all' | 'unread') => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => !n.read);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={notification.read ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {getNotificationIcon(notification.type)}
            </div>
            <div>
              <CardTitle className="text-base">{notification.title}</CardTitle>
              <CardDescription className="text-sm">
                {new Date(notification.created_at).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          {!notification.read && (
            <Badge variant="default">New</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your healthcare activities</p>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({notifications.filter(n => !n.read).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filterNotifications('all').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              filterNotifications('all').map(notification => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {filterNotifications('unread').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No unread notifications</p>
                </CardContent>
              </Card>
            ) : (
              filterNotifications('unread').map(notification => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

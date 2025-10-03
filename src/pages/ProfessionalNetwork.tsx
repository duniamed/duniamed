import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfessionalNetwork() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [referralNetwork, setReferralNetwork] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load all specialists except current user
      const { data: specsData } = await supabase
        .from('specialists')
        .select(`
          *,
          profiles:user_id(first_name, last_name)
        `)
        .neq('user_id', user.id);

      setSpecialists(specsData || []);

      // Load connections
      const { data: connsData } = await supabase
        .from('professional_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      setConnections(connsData || []);

      // Load referral network
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (specialist) {
        const { data: refData } = await supabase
          .from('referral_networks')
          .select(`
            *,
            sender:sender_specialist_id(id, user_id, specialty),
            recipient:recipient_specialist_id(id, user_id, specialty)
          `)
          .or(`sender_specialist_id.eq.${specialist.id},recipient_specialist_id.eq.${specialist.id}`)
          .order('referral_count', { ascending: false });

        setReferralNetwork(refData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (recipientId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('professional_connections')
        .insert([{
          requester_id: user.id,
          recipient_id: recipientId,
          connection_type: 'colleague',
          status: 'pending',
          message: 'I would like to connect with you for professional collaboration'
        }]);

      if (error) throw error;

      toast({
        title: 'Connection request sent',
        description: 'Your connection request has been sent'
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send connection request',
        variant: 'destructive'
      });
    }
  };

  const acceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('professional_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Connection accepted',
        description: 'You are now connected'
      });

      loadData();
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const filteredSpecialists = specialists.filter(spec => {
    const name = `${spec.profiles?.first_name} ${spec.profiles?.last_name}`.toLowerCase();
    const specialty = spec.specialty.join(' ').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || specialty.includes(query);
  });

  const pendingRequests = connections.filter(
    c => c.recipient_id === user?.id && c.status === 'pending'
  );

  const activeConnections = connections.filter(c => c.status === 'accepted');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold">Professional Network</h1>
          <p className="text-muted-foreground mt-2">
            Connect with colleagues, build referral relationships, and collaborate on patient care
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Connections
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeConnections.length}</div>
              <p className="text-xs text-muted-foreground">
                Professional colleagues
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your response
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Referral Partners
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralNetwork.length}</div>
              <p className="text-xs text-muted-foreground">
                Active referral relationships
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="discover" className="space-y-4">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="connections">
              My Connections
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="referrals">Referral Network</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Discover Professionals</CardTitle>
                <CardDescription>
                  Find and connect with healthcare professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="space-y-3">
                  {filteredSpecialists.map((spec) => {
                    const isConnected = connections.some(
                      c => (c.requester_id === spec.user_id || c.recipient_id === spec.user_id) && c.status === 'accepted'
                    );
                    const isPending = connections.some(
                      c => (c.requester_id === spec.user_id || c.recipient_id === spec.user_id) && c.status === 'pending'
                    );

                    return (
                      <Card key={spec.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="font-medium">
                                Dr. {spec.profiles?.first_name} {spec.profiles?.last_name}
                              </div>
                              <div className="flex gap-2">
                                {spec.specialty.map((s: string) => (
                                  <Badge key={s} variant="secondary">{s}</Badge>
                                ))}
                              </div>
                              {spec.sub_specialty && (
                                <p className="text-sm text-muted-foreground">
                                  {spec.sub_specialty}
                                </p>
                              )}
                            </div>
                            <div>
                              {isConnected ? (
                                <Badge variant="default">Connected</Badge>
                              ) : isPending ? (
                                <Badge variant="secondary">Pending</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => sendConnectionRequest(spec.user_id)}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Connect
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((conn) => (
                    <Card key={conn.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Connection Request</div>
                            <p className="text-sm text-muted-foreground">
                              {conn.message}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => acceptConnection(conn.id)}>
                              Accept
                            </Button>
                            <Button size="sm" variant="outline">
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Active Connections ({activeConnections.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {activeConnections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No active connections yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeConnections.map((conn) => (
                      <Card key={conn.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Connection</div>
                              <Badge variant="secondary">{conn.connection_type}</Badge>
                            </div>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Referral Network</CardTitle>
                <CardDescription>
                  Track your referral relationships and outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralNetwork.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No referral relationships yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {referralNetwork.map((ref) => (
                      <Card key={ref.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="font-medium">Referral Partnership</div>
                              <div className="flex gap-2">
                                <Badge>{ref.referral_count} referrals</Badge>
                                <Badge variant="secondary">
                                  Trust Score: {ref.trust_score.toFixed(2)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Specialties: {ref.specialties_referred.join(', ')}
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
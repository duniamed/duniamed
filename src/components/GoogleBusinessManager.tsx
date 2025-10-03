import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Globe, Phone, Mail, Star, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GoogleBusinessManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('google_business_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Load profile error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Google Business profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);

      const { data, error } = await supabase.functions.invoke('sync-google-business', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast({
        title: '✅ Sync Complete',
        description: data.message || 'Profile updated successfully'
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSyncing(true);

      const { data, error } = await supabase.functions.invoke('sync-google-business', {
        body: { action: 'create' }
      });

      if (error) throw error;

      toast({
        title: '✅ Profile Created',
        description: 'Google Business Profile created successfully. Verification may be required.'
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Not Verified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Google Business Profile</h1>
        <p className="text-muted-foreground">
          Manage your Google presence and local SEO automatically
        </p>
      </div>

      {!profile ? (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p>
                No Google Business Profile found. Create one to appear in Google Search and Maps automatically.
              </p>
              <Button onClick={handleCreate} disabled={syncing}>
                {syncing ? 'Creating...' : 'Create Google Business Profile'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{profile.business_name}</CardTitle>
                  <CardDescription>Profile ID: {profile.profile_id}</CardDescription>
                </div>
                {getVerificationBadge(profile.verification_status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                {profile.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">{profile.address}</p>
                    </div>
                  </div>
                )}

                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website_url}
                      </a>
                    </div>
                  </div>
                )}

                {profile.average_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <div>
                      <p className="font-medium">Google Rating</p>
                      <p className="text-muted-foreground">
                        {profile.average_rating} ({profile.review_count} reviews)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {profile.categories && profile.categories.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map((cat: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-2">
                <Button onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                {profile.google_url && (
                  <Button variant="outline" asChild>
                    <a href={profile.google_url} target="_blank" rel="noopener noreferrer">
                      View on Google
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {profile.verification_status !== 'verified' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Verification Required</p>
                <p className="text-sm text-muted-foreground">
                  Your profile needs verification to appear in Google Search and Maps. Check your mail for a verification postcard from Google, or complete phone verification if available.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Auto-Sync Status</CardTitle>
              <CardDescription>Changes sync automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Business Hours</span>
                  <Badge variant="outline">
                    {profile.auto_sync_enabled ? 'Syncing' : 'Manual'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Photos</span>
                  <Badge variant="outline">
                    {profile.auto_sync_enabled ? 'Syncing' : 'Manual'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reviews</span>
                  <Badge variant="outline">
                    {profile.auto_sync_enabled ? 'Syncing' : 'Manual'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Services</span>
                  <Badge variant="outline">
                    {profile.auto_sync_enabled ? 'Syncing' : 'Manual'}
                  </Badge>
                </div>
              </div>
              {profile.last_synced_at && (
                <p className="text-xs text-muted-foreground mt-4">
                  Last synced: {new Date(profile.last_synced_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
